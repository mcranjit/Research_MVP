"""ResearchMind AI - End-to-end backend tests."""
import os, io, time, uuid, pytest, requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://research-mind-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

SAMPLE_TEXT = (
    "Title: Advances in Neural Information Retrieval\n\n"
    "Recent work in neural information retrieval combines transformer encoders with dense vector indexes. "
    "BERT and SBERT enable semantic search beyond lexical matching. Researchers like Karpukhin et al. introduced DPR, "
    "which uses dual encoders trained on question-answer pairs. ColBERT improves efficiency via late interaction. "
    "These methods rely on large datasets such as MS MARCO and Natural Questions. Limitations include domain shift, "
    "long-document handling, and computational cost. Future directions involve retrieval-augmented generation (RAG), "
    "hybrid sparse-dense retrieval, and continual learning. Organizations including Google, Meta, and Microsoft "
    "have published influential systems. The field intersects with knowledge graphs and citation networks."
) * 2

SAMPLE_TEXT_2 = (
    "Title: Climate Modeling with Machine Learning\n\n"
    "Climate modeling increasingly uses ML to emulate physical simulations. Deep learning models such as GraphCast "
    "from DeepMind predict global weather faster than numerical models. Datasets include ERA5 reanalysis. "
    "Challenges include long-range forecasting, extreme events, and uncertainty quantification. "
    "Researchers like Lam et al. demonstrated GNN-based architectures outperform classical NWP on benchmarks."
) * 2


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def user(session):
    # NOTE: pydantic EmailStr rejects .test TLD; using example.com for valid email
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = session.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Test User"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["user"]["email"] == email
    return {"email": email, "token": data["token"], "user": data["user"]}


@pytest.fixture(scope="session")
def auth_headers(user):
    return {"Authorization": f"Bearer {user['token']}"}


# ---------- HEALTH ----------
def test_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- AUTH ----------
def test_login(session, user):
    r = session.post(f"{API}/auth/login", json={"email": user["email"], "password": "TestPass123!"})
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_wrong_password(session, user):
    r = session.post(f"{API}/auth/login", json={"email": user["email"], "password": "Wrong!"})
    assert r.status_code == 401


def test_me(session, auth_headers):
    r = session.get(f"{API}/auth/me", headers=auth_headers)
    assert r.status_code == 200
    j = r.json()
    assert "user" in j and "stats" in j and "doc_count" in j["stats"]


def test_register_duplicate(session, user):
    r = session.post(f"{API}/auth/register", json={"email": user["email"], "password": "TestPass123!", "name": "x"})
    assert r.status_code == 400


# ---------- DOCUMENTS ----------
@pytest.fixture(scope="session")
def doc_id(session, auth_headers):
    files = {"file": ("sample.txt", io.BytesIO(SAMPLE_TEXT.encode()), "text/plain")}
    r = requests.post(f"{API}/documents/upload", headers={"Authorization": auth_headers["Authorization"]}, files=files)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["word_count"] > 0
    return j["id"]


@pytest.fixture(scope="session")
def doc_id_2(session, auth_headers):
    files = {"file": ("climate.txt", io.BytesIO(SAMPLE_TEXT_2.encode()), "text/plain")}
    r = requests.post(f"{API}/documents/upload", headers={"Authorization": auth_headers["Authorization"]}, files=files)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def test_list_documents(session, auth_headers, doc_id, doc_id_2):
    r = session.get(f"{API}/documents", headers=auth_headers)
    assert r.status_code == 200
    ids = [d["id"] for d in r.json()["documents"]]
    assert doc_id in ids and doc_id_2 in ids


def test_get_document(session, auth_headers, doc_id):
    r = session.get(f"{API}/documents/{doc_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"] == doc_id
    assert "full_text" in r.json()


def test_unauthenticated(session):
    r = session.get(f"{API}/documents")
    assert r.status_code in (401, 403)


# ---------- CHAT ----------
def test_chat_send(session, auth_headers, doc_id):
    r = session.post(f"{API}/chat/send", headers=auth_headers,
                     json={"message": "What is DPR and who introduced it?"}, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "answer" in j and isinstance(j["answer"], str) and len(j["answer"]) > 10
    assert "citations" in j and isinstance(j["citations"], list)


# ---------- SEARCH ----------
def test_search(session, auth_headers, doc_id):
    r = session.post(f"{API}/search", headers=auth_headers, json={"query": "dense retrieval transformers", "top_k": 5})
    assert r.status_code == 200
    j = r.json()
    assert "results" in j and j["count"] >= 1
    for h in j["results"]:
        assert "score" in h and "page" in h


# ---------- CLUSTERS ----------
def test_clusters(session, auth_headers, doc_id, doc_id_2):
    r = session.get(f"{API}/clusters", headers=auth_headers, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "clusters" in j


# ---------- KNOWLEDGE GRAPH ----------
def test_knowledge_graph(session, auth_headers, doc_id):
    r = session.get(f"{API}/knowledge-graph", headers=auth_headers, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "nodes" in j and "links" in j


# ---------- LITERATURE REVIEW ----------
def test_literature_review(session, auth_headers, doc_id):
    r = session.post(f"{API}/literature-review", headers=auth_headers,
                     json={"topic": "neural information retrieval", "doc_ids": [doc_id]}, timeout=180)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "review" in j and len(j["review"]) > 50


# ---------- RESEARCH GAPS ----------
def test_research_gaps(session, auth_headers, doc_id, doc_id_2):
    r = session.post(f"{API}/research-gaps", headers=auth_headers,
                     json={"doc_ids": [doc_id, doc_id_2]}, timeout=180)
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("gaps", "contradictions", "emerging_trends", "opportunities"):
        assert k in j


# ---------- HYPOTHESIS ----------
def test_hypothesis(session, auth_headers, doc_id):
    r = session.post(f"{API}/hypothesis", headers=auth_headers,
                     json={"topic": "retrieval-augmented generation", "use_documents": True}, timeout=180)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "hypotheses" in j and "novelty_score" in j


# ---------- DELETE ----------
def test_delete_document(session, auth_headers):
    files = {"file": ("todelete.txt", io.BytesIO(SAMPLE_TEXT.encode()), "text/plain")}
    r = requests.post(f"{API}/documents/upload", headers={"Authorization": auth_headers["Authorization"]}, files=files)
    assert r.status_code == 200
    did = r.json()["id"]
    r = session.delete(f"{API}/documents/{did}", headers=auth_headers)
    assert r.status_code == 200
    r = session.get(f"{API}/documents/{did}", headers=auth_headers)
    assert r.status_code == 404
