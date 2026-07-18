"""TF-IDF based semantic search + KMeans clustering. Lightweight in-process index."""
from typing import List, Dict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans


def build_index(chunks: List[Dict]) -> Dict:
    """chunks: [{doc_id, chunk_id, text, title, page}, ...]"""
    if not chunks:
        return {"vectorizer": None, "matrix": None, "chunks": []}
    texts = [c["text"] for c in chunks]
    vec = TfidfVectorizer(max_features=4096, stop_words='english', ngram_range=(1, 2))
    matrix = vec.fit_transform(texts)
    return {"vectorizer": vec, "matrix": matrix, "chunks": chunks}


def search(index: Dict, query: str, top_k: int = 6) -> List[Dict]:
    if not index.get("vectorizer") or not query.strip():
        return []
    qv = index["vectorizer"].transform([query])
    sims = cosine_similarity(qv, index["matrix"])[0]
    top_idx = np.argsort(sims)[::-1][:top_k]
    results = []
    for i in top_idx:
        if sims[i] <= 0:
            continue
        c = index["chunks"][int(i)]
        results.append({
            "doc_id": c["doc_id"],
            "title": c.get("title", ""),
            "chunk_id": c["chunk_id"],
            "page": c.get("page", 1),
            "text": c["text"],
            "score": float(sims[i]),
        })
    return results


def cluster_documents(doc_texts: List[Dict], n_clusters: int = 0) -> List[Dict]:
    """doc_texts: [{doc_id, title, text}]. Returns list of clusters."""
    if len(doc_texts) < 2:
        return [{
            "cluster_id": 0,
            "doc_ids": [d["doc_id"] for d in doc_texts],
            "titles": [d["title"] for d in doc_texts],
            "centroid_terms": [],
        }] if doc_texts else []

    n = len(doc_texts)
    if n_clusters <= 0:
        n_clusters = max(2, min(6, n // 2))
    n_clusters = min(n_clusters, n)

    vec = TfidfVectorizer(max_features=2048, stop_words='english', ngram_range=(1, 2))
    matrix = vec.fit_transform([d["text"] for d in doc_texts])
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = km.fit_predict(matrix)

    feature_names = vec.get_feature_names_out()
    centers = km.cluster_centers_

    clusters = []
    for cid in range(n_clusters):
        member_idx = [i for i, lab in enumerate(labels) if lab == cid]
        if not member_idx:
            continue
        # Top terms for this cluster
        top_idx = centers[cid].argsort()[-8:][::-1]
        top_terms = [feature_names[i] for i in top_idx]
        clusters.append({
            "cluster_id": int(cid),
            "doc_ids": [doc_texts[i]["doc_id"] for i in member_idx],
            "titles": [doc_texts[i]["title"] for i in member_idx],
            "centroid_terms": top_terms,
        })
    return clusters
