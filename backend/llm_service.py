"""
ResearchMind AI — LLM service using Google Gemini.
"""

from __future__ import annotations
from anthropic import AsyncAnthropic

import json
import os
import re
from typing import Any, Optional

from pathlib import Path
from dotenv import load_dotenv

import google.generativeai as genai
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY is missing from .env")

genai.configure(api_key=GOOGLE_API_KEY)

# Recommended model
MODEL_NAME = "gemini-2.5-flash"

_client = genai.GenerativeModel(MODEL_NAME)

def _extract_json(text: str) -> Optional[Any]:
    """Try to pull a JSON block out of a model reply."""
    # Try fenced block
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    candidate = m.group(1) if m else text

    # Find first { or [
    for opener, closer in (("{", "}"), ("[", "]")):
        start = candidate.find(opener)
        if start != -1:
            end = candidate.rfind(closer)
            if end > start:
                try:
                    return json.loads(candidate[start : end + 1])
                except Exception:
                    pass
    return None


async def ask_llm(system: str, prompt: str, session_id: str | None = None) -> str:
    """
    Gemini wrapper.
    Keeps the same interface as the old Anthropic implementation.
    """

    full_prompt = f"""
{system}

User Request:

{prompt}
"""

    loop = asyncio.get_running_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: _client.generate_content(full_prompt)
        )
        return response.text
    except Exception as e:
        try:
            import logging
            logging.getLogger("researchmind").warning("LLM request failed: %s", e)
        except Exception:
            pass
        return ""


async def research_chat(messages: list[dict], context: str, session_id: str) -> str:
    """Run a chat turn with retrieved context."""
    system = (
        "You are ResearchMind AI, an expert research assistant. Answer ONLY from the provided "
        "research context. Always cite sources inline using [1], [2] etc. matching the numbered "
        "context excerpts. If the context is insufficient, say so plainly. Be precise, structured, "
        "and avoid speculation."
    )
    convo = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in messages[-6:])
    prompt = f"### Research Context\n{context}\n\n### Conversation\n{convo}\n\nASSISTANT:"  # noqa: E501
    return await ask_llm(system, prompt, session_id)


async def extract_entities(text: str) -> dict:
    """Extract entities and relationships for the knowledge graph."""
    system = (
        "You are a knowledge extraction engine. Given research text, return ONLY valid JSON with "
        "this exact schema: "
        '{"entities":[{"name":"...","type":"author|concept|technology|organization|method|dataset"}], '
        '"relationships":[{"source":"...","target":"...","label":"..."}]}. '
        "Max 12 entities, max 15 relationships. No prose, no markdown."
    )
    prompt = f"Extract from:\n\n{text[:6000]}"
    raw = await ask_llm(system, prompt)
    data = _extract_json(raw)
    if not data or "entities" not in data:
        return {"entities": [], "relationships": []}
    return data


async def summarize_cluster(texts: list[str]) -> dict:
    """Label and summarize clusters of research documents."""
    system = (
        "You label and summarize clusters of research documents. Return ONLY JSON: "
        '{"label":"short topic label (max 6 words)","keywords":["k1","k2","k3","k4","k5"],"summary":"2-sentence overview"}.'
    )
    joined = "\n---\n".join(t[:800] for t in texts[:6])
    raw = await ask_llm(system, f"Cluster documents:\n{joined}")
    data = _extract_json(raw)
    if not data:
        return {"label": "Untitled Topic", "keywords": [], "summary": ""}
    return data


async def generate_literature_review(docs: list[dict], topic: str) -> str:
    """Generate a structured literature review."""
    system = (
        "You are a senior academic writer. Generate a structured literature review with these "
        "sections: Introduction, Related Work, Research Gap, Comparative Analysis, Conclusion. "
        "Use [Doc N] citations matching the provided documents."
    )
    refs = "\n\n".join(
        f"[Doc {i+1}] Title: {d.get('title','')}\nExcerpt: {d.get('excerpt','')[:1500]}"  # noqa: E501
        for i, d in enumerate(docs)
    )
    prompt = f"Topic: {topic}\n\nDocuments:\n{refs}\n\nWrite the literature review now."
    return await ask_llm(system, prompt)


async def detect_research_gaps(docs: list[dict]) -> dict:
    """Identify research gaps from documents."""
    system = (
        "Identify research gaps from these documents. Return ONLY JSON: "
        '{"gaps":[{"title":"...","description":"...","novelty_score":0-100}],' 
        '"contradictions":[{"description":"...","docs":["Doc 1","Doc 2"]}],' 
        '"emerging_trends":["..."],' 
        '"opportunities":["..."]}. '
        "Max 4 items per list."
    )
    refs = "\n\n".join(
        f"[Doc {i+1}] {d.get('title','')}: {d.get('excerpt','')[:1000]}" for i, d in enumerate(docs)
    )
    raw = await ask_llm(system, f"Documents:\n{refs}")
    return _extract_json(raw) or {
        "gaps": [],
        "contradictions": [],
        "emerging_trends": [],
        "opportunities": [],
    }


async def generate_hypotheses(topic: str, context: str = "") -> dict:
    """Generate hypotheses."""
    system = (
        "You are a research ideation engine. Return ONLY JSON: "
        '{"hypotheses":[{"statement":"...","rationale":"...","validation":"..."}],' 
        '"experimental_directions":["..."],' 
        '"novelty_score":0-100}. '
        "Generate 4 hypotheses."
    )
    prompt = f"Topic: {topic}\n\nKnown context:\n{context[:3000]}"
    raw = await ask_llm(system, prompt)
    return _extract_json(raw) or {
        "hypotheses": [],
        "experimental_directions": [],
        "novelty_score": 0,
    }

