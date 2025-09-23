from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.upload import upload
from app.routes.auth import auth
from app.routes import rules, executions, processing, reports, issues

app = FastAPI(
    title="Data Hygiene Tool API",
    description="API for data quality management and cleansing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
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

@app.get("/")
def read_root():
    return {"message": "Data Hygiene Tool API", "version": "1.0.0"}
