from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv


# Import Database URL
dotenv_loaded = load_dotenv(
    dotenv_path="../migrations/.env.local", override=True)
DB_URL = os.getenv("DATABASE_URL")
if DB_URL is None:
    raise ValueError("DATABASE_URL environment variable is not set.")

engine = create_engine(DB_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()
metadata = Base.metadata


def get_session():
    with SessionLocal() as session:
        yield session
