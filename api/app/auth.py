from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from sqlalchemy.orm import Session
from app.models import User, UserRole
from app.database import get_session

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = None  # Indefinite for demo

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    # For demo purposes, don't set expiration if ACCESS_TOKEN_EXPIRE_MINUTES is None
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    elif ACCESS_TOKEN_EXPIRE_MINUTES is not None:
        expire = datetime.now(timezone.utc) + \
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
    # If ACCESS_TOKEN_EXPIRE_MINUTES is None, don't add exp claim for indefinite tokens
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_session)
) -> User:
    import logging
    logger = logging.getLogger(__name__)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    logger.info(f"🔐 Verifying token (length: {len(token) if token else 0})")

    payload = verify_token(token)
    if payload is None:
        logger.warning("❌ Token verification failed")
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        logger.warning("❌ No user_id in token payload")
        raise credentials_exception

    logger.info(f"✅ Token verified for user_id: {user_id}")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.warning(f"❌ User not found in database: {user_id}")
        raise credentials_exception

    logger.info(
        f"✅ User authenticated: {user.email} (role: {user.role.value})")
    return user


def require_role(allowed_roles: list[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        import logging
        logger = logging.getLogger(__name__)

        logger.info(
            f"🔒 Checking role: user={current_user.email}, role={current_user.role.value}, allowed={[r.value for r in allowed_roles]}")

        if current_user.role not in allowed_roles:
            logger.warning(
                f"❌ Access denied: user role {current_user.role.value} not in {[r.value for r in allowed_roles]}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )

        logger.info(f"✅ Access granted for {current_user.email}")
        return current_user
    return role_checker

# Role-specific dependencies


def get_admin_user(current_user: User = Depends(require_role([UserRole.admin]))) -> User:
    return current_user


def get_admin_or_analyst_user(
    current_user: User = Depends(require_role(
        [UserRole.admin, UserRole.analyst]))
) -> User:
    return current_user


def get_any_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
