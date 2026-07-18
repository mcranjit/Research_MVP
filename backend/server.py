"""ResearchMind AI — FastAPI backend."""
import os
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from pymongo.errors import PyMongoError

from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("researchmind")

from auth import hash_password, verify_password, create_token, get_current_user
from doc_parser import extract_text, extract_metadata, chunk_text
try:
    from search_service import build_index, search as semantic_search, cluster_documents
except Exception as _e:
    logger.warning("Search service not available, using stubs: %s", _e)

    def build_index(chunks):
        # Minimal in-memory index placeholder
        return {"chunks": chunks}

    def semantic_search(index, query, top_k=5):
        return []

    def cluster_documents(doc_texts):
        return []
# LLM service is optional for local auth/register testing. Import if available,
# otherwise provide lightweight async stubs so the server (and auth endpoints)
# can run without the proprietary `emergentintegrations` package.
try:
    from llm_service import (
        research_chat,
        extract_entities,
        summarize_cluster,
        generate_literature_review,
        detect_research_gaps,
        generate_hypotheses,
    )
except Exception as _e:
    logger.warning("LLM service not available, using local stubs: %s", _e)

    async def research_chat(messages, context, session_id):
        return "LLM unavailable in this environment"

    async def extract_entities(text):
        return {"entities": [], "relationships": []}

    async def summarize_cluster(texts):
        return {"label": "", "keywords": [], "summary": ""}

    async def generate_literature_review(docs, topic):
        return ""

    async def detect_research_gaps(docs):
        return {"gaps": [], "contradictions": [], "emerging_trends": [], "opportunities": []}

    async def generate_hypotheses(topic, context=""):
        return {"hypotheses": [], "experimental_directions": [], "novelty_score": 0}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("researchmind")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="ResearchMind AI") 
api = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


class _FallbackStore:
    def __init__(self):
        self.users = {}
        self.documents = {}

    def _normalize_email(self, email: str) -> str:
        return (email or "").lower()

    async def find_user(self, *, email: Optional[str] = None, user_id: Optional[str] = None):
        if email is not None:
            return self.users.get(self._normalize_email(email))
        if user_id is not None:
            return next((u for u in self.users.values() if u.get("id") == user_id), None)
        return None

    async def insert_user(self, user: dict):
        self.users[self._normalize_email(user["email"])] = user
        return user

    async def update_user(self, user_id: str, updates: dict):
        user = await self.find_user(user_id=user_id)
        if not user:
            return None
        for key, value in updates.items():
            user[key] = value
        self.users[self._normalize_email(user["email"])] = user
        return user

    async def count_user_documents(self, user_id: str) -> int:
        return sum(1 for doc in self.documents.values() if doc.get("user_id") == user_id)

    async def add_document(self, doc: dict):
        self.documents[doc["id"]] = doc
        return doc


fallback_store = _FallbackStore()


async def _find_user_by_email(email: str):
    try:
        return await db.users.find_one({"email": email.lower()})
    except Exception:
        return await fallback_store.find_user(email=email)


async def _find_user_by_id(user_id: str):
    try:
        return await db.users.find_one({"id": user_id})
    except Exception:
        return await fallback_store.find_user(user_id=user_id)


async def _insert_user(user: dict):
    try:
        await db.users.insert_one(user)
    except Exception:
        await fallback_store.insert_user(user)


async def _update_user(user_id: str, updates: dict):
    try:
        await db.users.update_one({"id": user_id}, {"$set": updates})
    except Exception:
        await fallback_store.update_user(user_id, updates)


async def _count_user_documents(user_id: str) -> int:
    try:
        return await db.documents.count_documents({"user_id": user_id})
    except Exception:
        return await fallback_store.count_user_documents(user_id)


def _serialize_user(user: Optional[dict]) -> Optional[dict]:
    if not user:
        return None
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "tier": user.get("tier", "free"),
        "created_at": user.get("created_at"),
    }


# ============== MODELS ==============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ChatIn(BaseModel):
    session_id: Optional[str] = None
    message: str
    doc_ids: Optional[List[str]] = None  # if None, search across all docs


class SearchIn(BaseModel):
    query: str
    top_k: int = 6


class ReviewIn(BaseModel):
    topic: str
    doc_ids: List[str]


class GapIn(BaseModel):
    doc_ids: List[str]


class HypothesisIn(BaseModel):
    topic: str
    use_documents: bool = True


# ============== HELPERS ==============
async def _get_user_docs(user_id: str, doc_ids: Optional[List[str]] = None) -> List[dict]:
    q = {"user_id": user_id}
    if doc_ids:
        q["id"] = {"$in": doc_ids}
    docs = await db.documents.find(q, {"_id": 0}).to_list(1000)
    return docs


async def _build_user_index(user_id: str, doc_ids: Optional[List[str]] = None):
    docs = await _get_user_docs(user_id, doc_ids)
    all_chunks = []
    for d in docs:
        for c in d.get("chunks", []):
            all_chunks.append({
                "doc_id": d["id"],
                "chunk_id": c["chunk_id"],
                "text": c["text"],
                "page": c.get("page", 1),
                "title": d.get("title", ""),
            })
    return build_index(all_chunks), docs


# ============== ROUTES: AUTH ==============
@api.post("/auth/register")
async def register(payload: RegisterIn):
    existing = await _find_user_by_email(str(payload.email).lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": new_id(),
        "email": str(payload.email).lower(),
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "tier": "pro",
        "created_at": now_iso(),
    }
    await _insert_user(user)
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "tier": user["tier"]}}


@api.post("/auth/login")
async def login(payload: LoginIn):
    user = await _find_user_by_email(str(payload.email).lower())
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "tier": user.get("tier", "free")}}


class UpdateProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)


@api.patch("/auth/me")
async def update_me(payload: UpdateProfileIn, current=Depends(get_current_user)):
    await _update_user(current["id"], {"name": payload.name})
    u = await _find_user_by_id(current["id"])
    return {"user": _serialize_user(u)}


@api.get("/auth/me")
async def me(current=Depends(get_current_user)):
    user = await _find_user_by_id(current["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = _serialize_user(user)
    # counts
    doc_count = await _count_user_documents(current["id"])
    return {"user": user, "stats": {"doc_count": doc_count}}


# ============== ROUTES: DOCUMENTS ==============
@api.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), current=Depends(get_current_user)):
    # Tier check
    user = await db.users.find_one({"id": current["id"]})
    tier = user.get("tier", "free")
    if tier == "free_disabled_legacy":  # tier gating disabled — Pro is free for everyone
        cnt = await db.documents.count_documents({"user_id": current["id"]})
        if cnt >= 20:
            raise HTTPException(status_code=403, detail="Free tier limit reached (20 documents). Upgrade to Pro.")

    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    try:
        text = extract_text(file.filename, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {e}")

    if not text or len(text) < 30:
        raise HTTPException(status_code=400, detail="No extractable text found in file")

    meta = extract_metadata(text)
    chunks = chunk_text(text, chunk_size=1000, overlap=120)

    doc = {
        "id": new_id(),
        "user_id": current["id"],
        "filename": file.filename,
        "title": meta["title"],
        "authors": meta["authors"],
        "doi": meta["doi"],
        "word_count": meta["word_count"],
        "file_size": len(data),
        "chunks": chunks,
        "full_text": text[:200000],  # cap
        "excerpt": text[:1500],
        "created_at": now_iso(),
    }
    await db.documents.insert_one(doc)
    return {
        "id": doc["id"],
        "title": doc["title"],
        "filename": doc["filename"],
        "authors": doc["authors"],
        "doi": doc["doi"],
        "word_count": doc["word_count"],
        "created_at": doc["created_at"],
    }


@api.get("/documents")
async def list_documents(current=Depends(get_current_user)):
    docs = await db.documents.find(
        {"user_id": current["id"]},
        {"_id": 0, "chunks": 0, "full_text": 0}
    ).sort("created_at", -1).to_list(1000)
    return {"documents": docs}


@api.get("/documents/{doc_id}")
async def get_document(doc_id: str, current=Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "user_id": current["id"]}, {"_id": 0, "chunks": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@api.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, current=Depends(get_current_user)):
    res = await db.documents.delete_one({"id": doc_id, "user_id": current["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"ok": True}


# ============== ROUTES: CHAT ==============
class CitationIn(BaseModel):
    doc_ids: List[str]
    style: str = Field(pattern="^(apa|mla|chicago|ieee)$")


@api.post("/citations/format")
async def format_citations(payload: CitationIn, current=Depends(get_current_user)):
    docs = await db.documents.find({"id": {"$in": payload.doc_ids}, "user_id": current["id"]}, {"_id": 0}).to_list(100)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents")
    refs = "\n".join(f"[{i+1}] Title: {d.get('title','')} | Authors: {', '.join(d.get('authors',[])) or 'Unknown'} | DOI: {d.get('doi') or 'N/A'}" for i, d in enumerate(docs))
    system = f"Format each reference in {payload.style.upper()} style. Return ONLY JSON: {{\"citations\":[\"ref 1 formatted\",\"ref 2 formatted\"]}}. Use current year if no date available."
    from llm_service import ask_llm, _extract_json
    raw = await ask_llm(system, refs)
    out = _extract_json(raw) or {"citations": []}
    return {"style": payload.style, "citations": out.get("citations", [])}


@api.post("/chat/send")
async def chat_send(payload: ChatIn, current=Depends(get_current_user)):
    session_id = payload.session_id or new_id()

    # Load prior messages
    sess = await db.chat_sessions.find_one({"id": session_id, "user_id": current["id"]}, {"_id": 0})
    messages = sess["messages"] if sess else []
    messages.append({"role": "user", "content": payload.message, "ts": now_iso()})

    # Build retrieval context
    index, docs = await _build_user_index(current["id"], payload.doc_ids)
    hits = semantic_search(index, payload.message, top_k=5)

    context_parts = []
    for i, h in enumerate(hits, 1):
        context_parts.append(f"[{i}] (Doc: {h['title']}, p.{h['page']})\n{h['text'][:900]}")
    context = "\n\n".join(context_parts) if context_parts else "No documents matched; answer from general knowledge but be cautious."

    answer = await research_chat(messages, context, session_id)

    citations = [
        {"index": i + 1, "doc_id": h["doc_id"], "title": h["title"], "page": h["page"], "score": h["score"]}
        for i, h in enumerate(hits)
    ]

    messages.append({"role": "assistant", "content": answer, "ts": now_iso(), "citations": citations})

    if sess:
        await db.chat_sessions.update_one(
            {"id": session_id, "user_id": current["id"]},
            {"$set": {"messages": messages, "updated_at": now_iso()}}
        )
    else:
        await db.chat_sessions.insert_one({
            "id": session_id,
            "user_id": current["id"],
            "title": payload.message[:60],
            "messages": messages,
            "doc_ids": payload.doc_ids or [],
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })

    return {
        "session_id": session_id,
        "answer": answer,
        "citations": citations,
        "confidence": min(1.0, max(0.3, sum(h["score"] for h in hits) / max(1, len(hits)))) if hits else 0.4,
    }


@api.get("/chat/sessions")
async def list_sessions(current=Depends(get_current_user)):
    sessions = await db.chat_sessions.find(
        {"user_id": current["id"]},
        {"_id": 0, "id": 1, "title": 1, "created_at": 1, "updated_at": 1}
    ).sort("updated_at", -1).to_list(100)
    return {"sessions": sessions}


@api.get("/chat/sessions/{session_id}")
async def get_session(session_id: str, current=Depends(get_current_user)):
    sess = await db.chat_sessions.find_one({"id": session_id, "user_id": current["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess


# ============== ROUTES: SEARCH ==============
@api.post("/search")
async def search_endpoint(payload: SearchIn, current=Depends(get_current_user)):
    index, _ = await _build_user_index(current["id"])
    results = semantic_search(index, payload.query, top_k=payload.top_k)
    return {"results": results, "count": len(results)}


# ============== ROUTES: CLUSTERS ==============
@api.get("/clusters")
async def clusters(current=Depends(get_current_user)):
    docs = await _get_user_docs(current["id"])
    if len(docs) < 2:
        return {"clusters": [], "message": "Upload at least 2 documents to see clusters."}
    doc_texts = [{"doc_id": d["id"], "title": d.get("title", ""), "text": d.get("full_text", d.get("excerpt", ""))[:5000]} for d in docs]
    raw_clusters = cluster_documents(doc_texts)
    # Enrich each cluster via LLM
    enriched = []
    by_id = {d["id"]: d for d in docs}
    for c in raw_clusters:
        texts = [by_id[did].get("excerpt", "") for did in c["doc_ids"] if did in by_id]
        meta = await summarize_cluster(texts)
        enriched.append({
            **c,
            "label": meta.get("label", "Untitled Topic"),
            "keywords": meta.get("keywords", c.get("centroid_terms", [])[:5]),
            "summary": meta.get("summary", ""),
            "size": len(c["doc_ids"]),
        })
    return {"clusters": enriched}


# ============== ROUTES: KNOWLEDGE GRAPH ==============
@api.get("/knowledge-graph")
async def knowledge_graph(current=Depends(get_current_user)):
    docs = await _get_user_docs(current["id"])
    if not docs:
        return {"nodes": [], "links": []}

    # cache result by doc count + latest doc id
    cache_key = f"{current['id']}:{len(docs)}:{docs[-1]['id']}"
    cached = await db.kg_cache.find_one({"key": cache_key}, {"_id": 0})
    if cached:
        return {"nodes": cached["nodes"], "links": cached["links"]}

    # Combine excerpts (limited)
    combined = "\n\n".join(f"## {d.get('title','')}\n{d.get('excerpt','')[:1500]}" for d in docs[:10])
    data = await extract_entities(combined)

    nodes = []
    seen = set()
    type_colors = {
        "author": "#34D399",
        "concept": "#6366F1",
        "technology": "#FBBF24",
        "organization": "#F87171",
        "method": "#A78BFA",
        "dataset": "#22D3EE",
    }
    for e in data.get("entities", []):
        name = e.get("name", "").strip()
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        nodes.append({
            "id": name,
            "name": name,
            "type": e.get("type", "concept"),
            "color": type_colors.get(e.get("type", "concept"), "#6366F1"),
        })

    node_ids = {n["id"].lower() for n in nodes}
    links = []
    for r in data.get("relationships", []):
        s, t = r.get("source", "").strip(), r.get("target", "").strip()
        if s.lower() in node_ids and t.lower() in node_ids:
            links.append({"source": s, "target": t, "label": r.get("label", "")})

    await db.kg_cache.update_one(
        {"key": cache_key},
        {"$set": {"key": cache_key, "nodes": nodes, "links": links, "ts": now_iso()}},
        upsert=True,
    )
    return {"nodes": nodes, "links": links}


# ============== ROUTES: LITERATURE REVIEW ==============
@api.post("/literature-review")
async def literature_review(payload: ReviewIn, current=Depends(get_current_user)):
    docs = await _get_user_docs(current["id"], payload.doc_ids)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents selected")
    review_md = await generate_literature_review(
        [{"title": d.get("title", ""), "excerpt": d.get("excerpt", "")} for d in docs],
        payload.topic,
    )
    return {"review": review_md, "doc_count": len(docs)}


# ============== ROUTES: RESEARCH GAPS ==============
@api.post("/research-gaps")
async def research_gaps(payload: GapIn, current=Depends(get_current_user)):
    docs = await _get_user_docs(current["id"], payload.doc_ids)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents selected")
    out = await detect_research_gaps(
        [{"title": d.get("title", ""), "excerpt": d.get("excerpt", "")} for d in docs]
    )
    return out


# ============== ROUTES: HYPOTHESIS ==============
@api.post("/hypothesis")
async def hypothesis(payload: HypothesisIn, current=Depends(get_current_user)):
    context = ""
    if payload.use_documents:
        index, _ = await _build_user_index(current["id"])
        hits = semantic_search(index, payload.topic, top_k=5)
        context = "\n\n".join(f"- {h['title']}: {h['text'][:500]}" for h in hits)
    out = await generate_hypotheses(payload.topic, context)
    return out


# ============== HEALTH ==============
@api.get("/")
async def root():
    return {"service": "ResearchMind AI", "status": "ok"}


app.include_router(api)

try:
    # Mount extras (workspaces, patents, datasets, billing, google auth)
    from extras import attach_all

    extras_router = APIRouter(prefix="/api")
    attach_all(db, extras_router)
    app.include_router(extras_router)
except Exception as _e:
    logger.warning("Extras routes not attached (optional deps missing): %s", _e)

app.state.db = db

cors_origins = os.environ.get('CORS_ORIGINS', '*')
allowed_origins = []
for origin in cors_origins.split(','):
    origin = origin.strip()
    origin = origin.strip('"').strip("'")
    if origin:
        allowed_origins.append(origin)
if not allowed_origins:
    allowed_origins = ["*"]

logger.info("CORS allow_origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

