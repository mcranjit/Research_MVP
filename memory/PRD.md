# ResearchMind AI — PRD

## Problem Statement
Build a production-ready SaaS platform "ResearchMind AI" — an advanced AI-powered research assistant and knowledge discovery system for researchers, students, analysts, R&D teams, cybersecurity professionals, and scientists. Users upload thousands of PDFs/research papers/reports/patents. The system extracts text, creates embeddings, semantic search indexes, clusters documents into topics, generates knowledge graphs, identifies trends and gaps, and enables AI-powered chat with content. Goal: "GitHub + Notion + ChatGPT + Research Assistant" for knowledge work.

## Tech Stack (Adapted)
- Frontend: React 19 + Tailwind + Shadcn UI (dark, glassmorphism, Cabinet Grotesk/JetBrains Mono)
- Backend: FastAPI + Motor (MongoDB)
- LLM: Claude Sonnet 4.5 via Emergent Universal Key (emergentintegrations)
- Retrieval: TF-IDF + cosine similarity (sklearn)
- Clustering: KMeans
- Knowledge Graph: LLM-extracted entities/relationships rendered with react-force-graph-2d
- Auth: JWT (bcrypt)
- Document parsing: pypdf, python-docx, openpyxl

## User Personas
- Free user (20 doc limit, basic chat/search/clusters)
- Pro user (unlimited, KG, lit review, gaps, hypotheses)
- Enterprise (workspaces, RBAC, SSO — phase 3)

## Implemented (2026-02)
### Phase 1 — MVP
- Landing page, JWT auth, document upload (PDF/DOCX/TXT/MD/CSV/XLSX), Chat with citations, Semantic Search, Topic Clustering, Knowledge Graph, Literature Review, Research Gaps, Hypothesis Generator

### Phase 2 — Enterprise & Monetization (2026-02-27)
- **Workspaces + RBAC**: create/list/get workspaces, invite members by email with editor/viewer roles, owner-only invite/remove (4 endpoints)
- **Patent Intelligence (Pro)**: LLM analysis of uploaded patent docs + live patent search
- **Dataset Discovery (Pro)**: HuggingFace Hub public API + LLM-curated Kaggle/UCI recommendations
- **Stripe Billing**: $29/mo Pro checkout, webhook handler, idempotent tier upgrade, payment_transactions collection
- **Emergent Google Auth**: alongside email/password, `/auth/callback` handler, `/api/auth/google/session` route
- Pro tier gating across patent + dataset endpoints with redirect-to-billing UX

## API Routes
- POST /api/auth/register, /api/auth/login; GET /api/auth/me
- POST/GET/DELETE /api/documents, GET /api/documents/{id}
- POST /api/chat/send, GET /api/chat/sessions, /api/chat/sessions/{id}
- POST /api/search
- GET /api/clusters
- GET /api/knowledge-graph
- POST /api/literature-review, /api/research-gaps, /api/hypothesis

## Backlog
### P0 (post-MVP polish)
- Streaming chat responses (currently uses send_message)
- Pagination of documents list
### P1
- Citation export (APA/MLA/IEEE/Chicago)
- Multi-document debate mode
- Research roadmap generator
- Patent intelligence module
- Dataset discovery (Kaggle/HF/UCI)
### P2
- Workspaces, RBAC, SSO, audit logs
- Stripe payments for Pro tier
- Admin dashboard with analytics
- Whitepaper generator
- Timeline builder
- Explain Like Levels output toggle
