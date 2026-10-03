"""
FastAPI application entry-point.
Security, CORS, router registration — all per SRS NFR1, IR3.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_tables
from app.routers import translation, history, favorites

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (dev convenience)."""
    await create_tables()
    logger.info("Database tables ready.")
    yield


app = FastAPI(
    title="Text Translation Tool API",
    description="Backend for the Text Translation Tool (SRS v1.0)",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — NFR1, IR3 ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(translation.router)
app.include_router(history.router)
app.include_router(favorites.router)


# ── Global exception handler (FR12 — no stack traces to users) ────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
