from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Import Database URL
DB_URL = os.getenv("DATABASE_URL")
if DB_URL is None:
    raise ValueError("DATABASE_URL environment variable is not set.")

# Connection pool configuration for production
# These settings are optimized for 256MB-1GB memory environments
POOL_CONFIG = {
    'pool_size': 3,              # Reduced from default 5 - fewer persistent connections
    'max_overflow': 5,           # Allow 5 extra connections if pool exhausted (total max = 8)
    'pool_timeout': 30,          # Wait up to 30s for available connection
    'pool_recycle': 1800,        # Recycle connections after 30 mins (prevent stale connections)
    'pool_pre_ping': True,       # Verify connection is alive before using
    'poolclass': QueuePool,      # Use QueuePool for better connection reuse
    'echo_pool': False,          # Set to True for debugging connection issues
}

# Create engine with optimized pool settings
engine = create_engine(
    DB_URL,
    **POOL_CONFIG,
    # Additional optimization settings
    connect_args={
        "options": "-c statement_timeout=30000"  # 30 second query timeout
    }
)

# Add connection pool event listeners for monitoring
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log new connections"""
    logger.debug(f"New database connection established: {id(dbapi_conn)}")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log connection checkouts from pool"""
    logger.debug(f"Connection checked out from pool: {id(dbapi_conn)}")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Log connection returns to pool"""
    logger.debug(f"Connection returned to pool: {id(dbapi_conn)}")

# Session configuration
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False  # Don't expire objects after commit (reduces queries)
)

Base = declarative_base()
metadata = Base.metadata


def get_session():
    """
    Dependency for getting database session.
    Ensures proper cleanup even if errors occur.
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()  # Commit if no errors
    except Exception:
        session.rollback()  # Rollback on errors
        raise
    finally:
        session.close()  # Always close


def get_pool_status():
    """
    Get current connection pool status for monitoring.
    Useful for debugging connection pool issues.
    """
    pool = engine.pool
    return {
        'size': pool.size(),
        'checked_in': pool.checkedin(),
        'checked_out': pool.checkedout(),
        'overflow': pool.overflow(),
        'total_connections': pool.size() + pool.overflow()
    }


def log_pool_status():
    """Log current pool status"""
    status = get_pool_status()
    logger.info(f"Connection pool status: {status}")
