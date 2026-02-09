"""
CrewAI Microservice - FastAPI Application

This service handles AI agent execution using CrewAI framework with Google Gemini.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models import HealthResponse
from app.routes import crews, executions

# =============================================================================
# Application Setup
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print(f"🚀 Starting CrewAI service on {settings.host}:{settings.port}")
    print(f"   Gemini API: {'✅ Configured' if settings.google_ai_api_key else '❌ Missing'}")
    print(f"   Search API: {'✅ Available' if settings.has_search_capability else '⚠️ Not configured'}")
    print(f"   Gmail API: {'✅ Available' if settings.has_gmail_capability else '⚠️ Not configured'}")
    print(f"   Docs API: {'✅ Available' if settings.has_docs_capability else '⚠️ Not configured'}")
    print(f"   Sheets API: {'✅ Available' if settings.has_sheets_capability else '⚠️ Not configured'}")

    yield

    # Shutdown
    print("👋 Shutting down CrewAI service")


app = FastAPI(
    title="Questive CrewAI Service",
    description="AI agent execution service using CrewAI with Google Gemini",
    version="0.1.0",
    lifespan=lifespan,
)

# =============================================================================
# Middleware
# =============================================================================

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://goal-tracker-ivory-eight.vercel.app",
        settings.nextjs_app_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Key authentication middleware
@app.middleware("http")
async def authenticate_request(request: Request, call_next):
    """Verify API key for protected endpoints."""
    # Skip auth for health check and docs
    if request.url.path in ["/", "/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)

    # Check API key if configured
    if settings.api_key:
        api_key = request.headers.get("X-API-Key")
        if api_key != settings.api_key:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or missing API key"},
            )

    return await call_next(request)


# =============================================================================
# Routes
# =============================================================================

# Include route modules
app.include_router(crews.router, prefix="/api", tags=["Crews"])
app.include_router(executions.router, prefix="/api", tags=["Executions"])


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint - redirect to docs."""
    return {"message": "Questive CrewAI Service", "docs": "/docs"}


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.

    Returns service status and capability availability.
    """
    # Check Gemini availability
    gemini_available = bool(settings.google_ai_api_key)

    # Determine overall status
    if not gemini_available:
        status = "error"
    elif not settings.has_search_capability:
        status = "degraded"
    else:
        status = "ok"

    return HealthResponse(
        status=status,
        version="0.1.0",
        gemini_available=gemini_available,
        search_available=settings.has_search_capability,
        gmail_available=settings.has_gmail_capability,
        docs_available=settings.has_docs_capability,
        sheets_available=settings.has_sheets_capability,
    )


# =============================================================================
# Error Handlers
# =============================================================================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    print(f"❌ Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal error occurred",
            "error": str(exc) if settings.debug else "Internal server error",
        },
    )


# =============================================================================
# Development Server
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
