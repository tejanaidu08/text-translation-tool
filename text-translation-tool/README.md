# Text Translation Tool

Full-stack translation web app — React + FastAPI + PostgreSQL.  
Built exactly per the SRS specification (FR1–FR13).

---

## Quick Start

### Frontend (already running ✅)

```bash
cd frontend
npm install        # already done
npm run dev        # http://localhost:3000
```

### Backend

> Requires Python 3.11+ — install from https://www.python.org/downloads/

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and edit environment file
copy .env.example .env
# Edit .env — set your DATABASE_URL

# 4. Run the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### PostgreSQL

```sql
CREATE DATABASE translation_db;
```

The backend auto-creates tables on first startup (no migrations needed in dev).

---

## Features (SRS FR mapping)

| SRS FR | Feature |
|--------|---------|
| FR1 | Text input with char/word count, clear, max-length guard |
| FR2 | Source + target language selectors |
| FR3 | Auto Detect source language |
| FR4 | Swap languages button |
| FR5 | Translate button, loading state, duplicate-submit guard |
| FR6 | Output with Copy, Clear, Download, Share, TTS, Favorite |
| FR7 | Translation history (view, reuse, delete, clear all) |
| FR8 | Favorites (save, view, remove) |
| FR9 | Text-to-Speech (browser Web Speech API) |
| FR10 | Speech-to-Text microphone input |
| FR11 | Copy confirmation, UTF-8 download, Web Share API |
| FR12 | Error handling — all failure cases, no stack traces shown |
| FR13 | Responsive layout (mobile/tablet/desktop via Tailwind CSS) |

---

## Architecture

```
Browser → React (Vite, Tailwind) → FastAPI → Translation Service (MyMemory/Google)
                                          ↘ PostgreSQL (history + favorites)
```

- **Frontend:** `frontend/` — React 18, Vite, Tailwind CSS, Axios
- **Backend:** `backend/` — FastAPI, SQLAlchemy (async), asyncpg
- **Database:** PostgreSQL — `translations` + `favorites` tables (SRS Section 5)
- **Translation:** `deep-translator` (MyMemory free tier by default)
- **Speech:** Browser Web Speech API (STT + TTS, no server needed)

---

## Environment Variables (backend/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `MAX_INPUT_LENGTH` | `5000` | Max characters per translation request |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed frontend origin |
| `TRANSLATION_PROVIDER` | `mymemory` | `mymemory` or `google` |
