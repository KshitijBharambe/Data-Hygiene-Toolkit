from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes.upload import upload
from app.routes.auth import auth
from app.routes import rules
from app.routes import executions
from app.routes import processing
from app.routes import reports
from app.routes import issues
from app.routes import search
from app.routes import advanced_features
import logging
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Data Hygiene Tool API",
    description="API for data quality management and cleansing",
    version="1.0.0",
    redirect_slashes=True  # Prevent automatic slash redirects that break POST requests
)

# Global exception handler for better error logging


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {type(exc).__name__}")
    logger.error(f"Request: {request.method} {request.url}")
    logger.error(f"Exception details: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "error_type": type(exc).__name__,
            "path": str(request.url)
        }
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dht.kshitij.space",
        "https://kshitij.space",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_origin_regex=r"https://.*-hzy3s-projects\.vercel\.app|https://.*\.kshitij\.space",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(rules.router)
app.include_router(executions.router)
app.include_router(processing.router)
app.include_router(reports.router)
app.include_router(issues.router)
app.include_router(search.router)
app.include_router(advanced_features.router)


@app.get("/")
def read_root():
    return {"message": "Data Hygiene Tool API", "version": "1.0.0"}
