#!/usr/bin/env python3
"""
Script to create a test user for debugging the frontend authentication
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from app.database import get_session
from app.models import User, UserRole
from app.auth import get_password_hash
import uuid

def create_test_user():
    """Create a test user with known credentials"""
    session = next(get_session())

    # Check if test user already exists
    existing_user = session.query(User).filter(User.email == "test@test.com").first()
    if existing_user:
        print("Test user already exists!")
        print(f"Email: test@test.com")
        print(f"Password: password123")
        print(f"Role: {existing_user.role.value}")
        return

    # Create new test user
    hashed_password = get_password_hash("password123")
    test_user = User(
        id=str(uuid.uuid4()),
        name="Test User",
        email="test@test.com",
        role=UserRole.admin,
        auth_provider="local",
        auth_subject=hashed_password
    )

    session.add(test_user)
    session.commit()
    session.refresh(test_user)

    print("Test user created successfully!")
    print(f"Email: test@test.com")
    print(f"Password: password123")
    print(f"Role: {test_user.role.value}")
    print(f"ID: {test_user.id}")

if __name__ == "__main__":
    create_test_user()