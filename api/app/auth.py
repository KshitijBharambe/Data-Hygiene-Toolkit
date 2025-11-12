from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from sqlalchemy.orm import Session
from app.models import User, UserRole, Organization, OrganizationMember
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


def create_access_token(
    user_id: str,
    email: str,
    organization_id: str,
    role: UserRole,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token with organization context.

    Args:
        user_id: User's unique identifier
        email: User's email address
        organization_id: Organization the user is accessing
        role: User's role within the organization
        expires_delta: Optional expiration time delta

    Returns:
        Encoded JWT token string
    """
    to_encode = {
        "sub": user_id,
        "email": email,
        "organization_id": organization_id,
        "role": role.value if isinstance(role, UserRole) else role
    }

    # For demo purposes, don't set expiration if ACCESS_TOKEN_EXPIRE_MINUTES is None
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
    elif ACCESS_TOKEN_EXPIRE_MINUTES is not None:
        expire = datetime.now(timezone.utc) + \
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


class OrgContext:
    """Container for organization context extracted from JWT."""
    def __init__(self, user: User, organization: Organization, role: UserRole):
        self.user = user
        self.organization = organization
        self.role = role

    @property
    def user_id(self) -> str:
        return self.user.id

    @property
    def organization_id(self) -> str:
        return self.organization.id

    @property
    def is_owner(self) -> bool:
        return self.role == UserRole.owner

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.admin

    @property
    def is_owner_or_admin(self) -> bool:
        return self.role in [UserRole.owner, UserRole.admin]


def get_org_context(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_session)
) -> OrgContext:
    """
    Extract and validate organization context from JWT token.
    This is the primary authentication dependency for all org-aware endpoints.

    Returns:
        OrgContext with user, organization, and role information

    Raises:
        HTTPException: If token is invalid or user/org not found
    """
    import logging
    logger = logging.getLogger(__name__)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    logger.info(f"🔐 Verifying token (length: {len(token) if token else 0})")

    # Decode token
    payload = verify_token(token)
    if payload is None:
        logger.warning("❌ Token verification failed")
        raise credentials_exception

    # Extract claims
    user_id: str = payload.get("sub")
    organization_id: str = payload.get("organization_id")
    role_str: str = payload.get("role")

    if not user_id or not organization_id or not role_str:
        logger.warning("❌ Missing required claims in token payload")
        raise credentials_exception

    logger.info(f"✅ Token verified for user_id: {user_id}, org: {organization_id}, role: {role_str}")

    # Validate user exists
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        logger.warning(f"❌ User not found or inactive: {user_id}")
        raise credentials_exception

    # Validate organization exists
    organization = db.query(Organization).filter(
        Organization.id == organization_id,
        Organization.is_active == True
    ).first()
    if organization is None:
        logger.warning(f"❌ Organization not found or inactive: {organization_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or inactive"
        )

    # Validate membership
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    if membership is None:
        logger.warning(f"❌ User {user_id} is not a member of organization {organization_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of this organization"
        )

    # Parse role
    try:
        role = UserRole(role_str)
    except ValueError:
        logger.warning(f"❌ Invalid role in token: {role_str}")
        raise credentials_exception

    # Verify role matches membership
    if membership.role != role:
        logger.warning(
            f"❌ Role mismatch: token has {role_str}, membership has {membership.role.value}"
        )
        raise credentials_exception

    logger.info(
        f"✅ User authenticated: {user.email} in org {organization.name} as {role.value}"
    )

    return OrgContext(user=user, organization=organization, role=role)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_session)
) -> User:
    """
    Legacy compatibility function - extracts just the user.
    Use get_org_context() for new organization-aware endpoints.
    """
    org_context = get_org_context(credentials, db)
    return org_context.user


def require_role(allowed_roles: list[UserRole]):
    """
    Create a dependency that requires the user to have one of the specified roles
    within their organization context.

    Args:
        allowed_roles: List of UserRole enums that are permitted

    Returns:
        Dependency function that validates role and returns OrgContext
    """
    def role_checker(org_context: OrgContext = Depends(get_org_context)) -> OrgContext:
        import logging
        logger = logging.getLogger(__name__)

        logger.info(
            f"🔒 Checking role: user={org_context.user.email}, "
            f"org={org_context.organization.name}, "
            f"role={org_context.role.value}, "
            f"allowed={[r.value for r in allowed_roles]}"
        )

        if org_context.role not in allowed_roles:
            logger.warning(
                f"❌ Access denied: user role {org_context.role.value} not in "
                f"{[r.value for r in allowed_roles]}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[r.value for r in allowed_roles]}"
            )

        logger.info(
            f"✅ Access granted for {org_context.user.email} in {org_context.organization.name}"
        )
        return org_context

    return role_checker


# Role-specific dependencies for organization context

def get_owner_context(
    org_context: OrgContext = Depends(require_role([UserRole.owner]))
) -> OrgContext:
    """Require owner role within organization."""
    return org_context


def get_owner_or_admin_context(
    org_context: OrgContext = Depends(require_role([UserRole.owner, UserRole.admin]))
) -> OrgContext:
    """Require owner or admin role within organization."""
    return org_context


def get_owner_admin_or_analyst_context(
    org_context: OrgContext = Depends(
        require_role([UserRole.owner, UserRole.admin, UserRole.analyst])
    )
) -> OrgContext:
    """Require owner, admin, or analyst role within organization."""
    return org_context


def get_any_org_member_context(
    org_context: OrgContext = Depends(get_org_context)
) -> OrgContext:
    """Require any authenticated user within an organization."""
    return org_context


# Legacy compatibility dependencies (deprecated - use OrgContext versions above)

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Deprecated: Use get_owner_or_admin_context() instead.
    Legacy compatibility for existing routes.
    """
    return current_user


def get_admin_or_analyst_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Deprecated: Use get_owner_admin_or_analyst_context() instead.
    Legacy compatibility for existing routes.
    """
    return current_user


def get_any_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Deprecated: Use get_any_org_member_context() instead.
    Legacy compatibility for existing routes.
    """
    return current_user


# Helper functions for organization membership

def get_user_organizations(user_id: str, db: Session) -> list[Tuple[Organization, UserRole]]:
    """
    Get all organizations a user is a member of along with their roles.

    Args:
        user_id: User's unique identifier
        db: Database session

    Returns:
        List of (Organization, UserRole) tuples
    """
    memberships = db.query(OrganizationMember, Organization).join(
        Organization,
        OrganizationMember.organization_id == Organization.id
    ).filter(
        OrganizationMember.user_id == user_id,
        Organization.is_active == True
    ).all()

    return [(org, membership.role) for membership, org in memberships]


def check_org_membership(
    user_id: str,
    organization_id: str,
    db: Session
) -> Optional[UserRole]:
    """
    Check if a user is a member of an organization and return their role.

    Args:
        user_id: User's unique identifier
        organization_id: Organization's unique identifier
        db: Database session

    Returns:
        UserRole if user is a member, None otherwise
    """
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    return membership.role if membership else None
