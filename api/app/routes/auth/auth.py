from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_session
from app.models import User, UserRole
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, UserRoleUpdate
from app.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_session)
):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        auth_provider="local",
        auth_subject=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=TokenResponse)
async def login_user(
    credentials: UserLogin,
    db: Session = Depends(get_session)
):
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.auth_subject):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token (indefinite for demo if ACCESS_TOKEN_EXPIRE_MINUTES is None)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) if ACCESS_TOKEN_EXPIRE_MINUTES else None
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Only admins can list all users
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can list users"
        )
    
    users = db.query(User).all()
    return users

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Only admins can update user roles
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update user roles"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.role = role_update.role
    db.commit()
    db.refresh(user)

    return {"message": "User role updated successfully", "user": UserResponse.model_validate(user)}

@router.post("/setup-demo")
async def setup_demo_account(
    db: Session = Depends(get_session)
):
    """
    Create a demo admin account if it doesn't exist.
    This endpoint is idempotent.
    """
    demo_email = "admin@datahygiene.com"
    
    # Check if demo user already exists
    existing_user = db.query(User).filter(User.email == demo_email).first()
    if existing_user:
        return {
            "message": "Demo admin account already exists",
            "user": UserResponse.model_validate(existing_user)
        }

    # Create demo admin account
    demo_password = "demo123"

    hashed_password = get_password_hash(demo_password)
    demo_user = User(
        name="Demo Admin",
        email=demo_email,
        role=UserRole.admin,
        auth_provider="local",
        auth_subject=hashed_password
    )

    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    return {
        "message": "Demo admin account created successfully",
        "email": demo_email,
        "password": demo_password,
        "user": UserResponse.model_validate(demo_user)
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Only admins can delete users
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users"
        )

    # Cannot delete yourself
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}