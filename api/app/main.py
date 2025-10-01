from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.upload import upload
from app.routes.auth import auth
from app.routes import rules
from app.routes import executions
from app.routes import processing
from app.routes import reports
from app.routes import issues
from app.routes import search

app = FastAPI(
    title="Data Hygiene Tool API",
    description="API for data quality management and cleansing",
    version="1.0.0",
    redirect_slashes=False  # Prevent automatic slash redirects that break POST requests
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*-hzy3s-projects\.vercel\.app",
    allow_origins=[
        "https://dht.kshitij.space",
        "https://kshitij.space",
        "https://*.kshitij.space",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
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

@app.get("/")
def read_root():
    return {"message": "Data Hygiene Tool API", "version": "1.0.0"}
