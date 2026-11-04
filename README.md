# MindVaultAI

A production-grade, multi-user RAG (Retrieval-Augmented Generation) knowledge platform featuring:
- **FastAPI backend** with LangChain, OpenAI embeddings & chat models, Neon PostgreSQL with pgvector, and PBKDF2 password hashing with JWT token verification.
- **React + Vite + TypeScript frontend** with Email/Password login and registration, real-time background ingestion tracking, human-readable source citations, and conversation history.

---

## Project Structure

```
MindVaultAI/
├── rag_backend/             # FastAPI + LangChain + pgvector backend
│   ├── app/
│   │   ├── auth.py          # Email/Password authentication & JWT verification
│   │   ├── chat_history.py  # User-scoped chat sessions & multi-turn history
│   │   ├── config.py        # Settings & environment configuration
│   │   ├── db_migration.py  # Auto-migration & database schema setup
│   │   ├── documents.py     # Document listing, rename, and deletion
│   │   ├── ingest.py        # Ingestion registry, chunking, and storage quotas
│   │   ├── ingestion.py     # Document loaders (PDF, TXT, MD) & OCR fallback
│   │   ├── main.py          # FastAPI application & CORS configuration
│   │   ├── ocr.py           # Scanned PDF image inspection
│   │   ├── qa.py            # Cosine distance thresholding & citation formatting
│   │   ├── rate_limiter.py  # Per-user sliding window request throttling
│   │   └── vector_store.py  # LangChain PGVector connector
│   ├── tests/
│   │   └── test_multi_user_isolation.py # 5 comprehensive integration test suites
│   ├── requirements.txt     # Backend Python dependencies
│   └── .env.example         # Backend environment template
│
└── rag_frontend/            # React + Vite + TypeScript frontend
    ├── src/
    │   ├── components/
    │   │   ├── AuthCard.tsx         # Email/Password Sign-In & Registration card
    │   │   ├── ChatInterface.tsx    # Multi-turn Q&A, session sidebar, citations
    │   │   ├── ConfigModal.tsx      # System endpoints & dev token configuration
    │   │   ├── DocumentManager.tsx  # Drag & drop upload, status, rename, delete
    │   │   └── Header.tsx           # User profile avatar, sign out, navigation
    │   ├── context/
    │   │   └── AuthContext.tsx      # JWT bearer token & authentication context
    │   ├── api.ts                   # Central typed API client
    │   ├── types.ts                 # TypeScript interfaces
    │   ├── App.tsx                  # Root layout & view router
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    └── .env.example
```

---

## Quickstart Guide

### 1. Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd rag_backend
   ```
2. Copy the sample environment file and add your credentials:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - API Docs: `http://localhost:8000/docs`

---

### 2. Configure the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd rag_frontend
   ```
2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Web App UI: `http://localhost:5173`
