"""
Authentication service: JWT token management and password hashing.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import os
from dotenv import load_dotenv

from models.models import User, SystemLog, Doctor, UserRole
from schemas.schemas import UserCreate, TokenData

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return TokenData(user_id=int(user_id), email=email)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    existing = get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
    requested_role = UserRole.doctor if user_data.role.value == "doctor" else UserRole.patient
    db_user = User(
        full_name=user_data.full_name,
        email=user_data.email.lower(),
        hashed_password=hash_password(user_data.password),
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
        gender=user_data.gender,
        role=requested_role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if requested_role == UserRole.doctor:
        doctor = Doctor(
            user_id=db_user.id,
            name=db_user.full_name,
            specialization=user_data.specialization,
            experience=user_data.experience,
            hospital_name=user_data.hospital_name,
            email=db_user.email,
            contact_information=user_data.contact_information,
        )
        db.add(doctor)
        db.commit()

    log_action(db, db_user.id, "User Registration", f"New user registered: {db_user.email}")
    return db_user


def authenticate_user(db: Session, email: str, password: str, role: str | None = None) -> User:
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not verify_password(password, user.hashed_password):
        log_action(db, None, "Failed Login", f"Failed login attempt for: {email}", status="error")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    if role and user.role.value != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as {user.role.value}, not {role}"
        )
    user.last_login = datetime.utcnow()
    db.commit()
    log_action(db, user.id, "User Login", f"User logged in: {user.email}")
    return user


def log_action(db: Session, user_id: Optional[int], action: str, details: str = None, status: str = "success"):
    try:
        log = SystemLog(user_id=user_id, action=action, details=details, status=status)
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
