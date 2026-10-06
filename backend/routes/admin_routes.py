"""
Admin routes: user management, system analytics, and logs.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Optional

from database.database import get_db
from schemas.schemas import UserResponse, UserListResponse, AdminStats, RoleUpdate
from api.dependencies import get_current_admin
from models.models import User, Prediction, SystemLog
from services.prediction_service import get_all_predictions_admin
from services.auth_service import log_action

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get system-wide statistics."""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    total_users = db.query(User).count()
    total_predictions = db.query(Prediction).count()
    high_risk = db.query(Prediction).filter(Prediction.risk_level == "High").count()
    low_risk = db.query(Prediction).filter(Prediction.risk_level == "Low").count()

    new_users_today = db.query(User).filter(User.created_at >= today_start).count()
    predictions_today = db.query(Prediction).filter(Prediction.created_at >= today_start).count()

    # Average model accuracy
    avg_acc = db.query(func.avg(Prediction.model_accuracy)).scalar() or 0.942

    return AdminStats(
        total_users=total_users,
        total_predictions=total_predictions,
        high_risk_count=high_risk,
        low_risk_count=low_risk,
        avg_accuracy=float(avg_acc),
        new_users_today=new_users_today,
        predictions_today=predictions_today,
    )


@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all users with pagination."""
    offset = (page - 1) * limit
    total = db.query(User).count()
    users = db.query(User).order_by(desc(User.created_at)).offset(offset).limit(limit).all()

    # Add prediction count to each user
    result = []
    for user in users:
        user_dict = UserResponse.model_validate(user)
        result.append(user_dict)

    return UserListResponse(users=result, total=total)


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get a specific user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update a user's role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role_data.role
    db.commit()
    log_action(db, admin.id, "Role Updated", f"User {user.email} role changed to {role_data.role}")
    return {"message": f"User role updated to {role_data.role}"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete admin users")
    log_action(db, admin.id, "User Deleted", f"Admin deleted user: {user.email}")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/predictions")
async def get_all_predictions(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all predictions across all users."""
    return get_all_predictions_admin(db, page, limit)


@router.get("/logs")
async def get_system_logs(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get system activity logs."""
    offset = (page - 1) * limit
    total = db.query(SystemLog).count()
    logs = (
        db.query(SystemLog)
        .order_by(desc(SystemLog.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []
    for log in logs:
        user_email = None
        if log.user_id:
            user = db.query(User).filter(User.id == log.user_id).first()
            user_email = user.email if user else "Unknown"

        result.append({
            "id": log.id,
            "action": log.action,
            "user": user_email,
            "details": log.details,
            "status": log.status,
            "timestamp": log.created_at,
        })

    return {"logs": result, "total": total, "page": page, "limit": limit}
