"""
Authentication routes: register, login, profile management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta

from database.database import get_db
from schemas.schemas import UserCreate, UserResponse, UserUpdate, PasswordChange, Token, UserLogin
from services.auth_service import (
    create_user, authenticate_user, create_access_token,
    get_user_by_id, hash_password, verify_password, log_action,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from api.dependencies import get_current_user
from models.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    user = create_user(db, user_data)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login with email and password."""
    user = authenticate_user(db, credentials.email, credentials.password, credentials.role.value)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information."""
    if update_data.full_name:
        current_user.full_name = update_data.full_name
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    if update_data.date_of_birth is not None:
        current_user.date_of_birth = update_data.date_of_birth
    if update_data.gender is not None:
        current_user.gender = update_data.gender

    db.commit()
    db.refresh(current_user)
    log_action(db, current_user.id, "Profile Updated", f"User {current_user.email} updated profile")
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    current_user.hashed_password = hash_password(password_data.new_password)
    db.commit()
    log_action(db, current_user.id, "Password Changed", f"User {current_user.email} changed password")
    return {"message": "Password changed successfully"}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account."""
    log_action(db, current_user.id, "Account Deleted", f"User {current_user.email} deleted account")
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}
