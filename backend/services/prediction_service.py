"""
Prediction service: handles ML model inference and result storage.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from models.models import Prediction, User
from schemas.schemas import PredictionInput


def get_risk_level(probability: float) -> str:
    """Determine risk level from probability."""
    if probability < 0.3:
        return "Low"
    elif probability < 0.6:
        return "Moderate"
    return "High"


def get_health_score(probability: float) -> int:
    """Calculate health score from probability."""
    return round((1 - probability) * 100)


def create_prediction(
    db: Session,
    user_id: int,
    input_data: PredictionInput,
    prediction: int,
    probability: float,
    model_used: str,
    model_accuracy: float,
    feature_importance: Optional[List[Dict]] = None,
) -> Prediction:
    """Save a prediction result to the database."""
    risk_level = get_risk_level(probability)
    health_score = get_health_score(probability)

    db_prediction = Prediction(
        user_id=user_id,
        patient_name=input_data.patient_name,
        age=input_data.age,
        sex=input_data.sex,
        cp=input_data.cp,
        trestbps=input_data.trestbps,
        chol=input_data.chol,
        fbs=input_data.fbs,
        restecg=input_data.restecg,
        thalach=input_data.thalach,
        exang=input_data.exang,
        oldpeak=input_data.oldpeak,
        slope=input_data.slope,
        ca=input_data.ca,
        thal=input_data.thal,
        smoking=input_data.smoking,
        alcohol=input_data.alcohol,
        stress_level=input_data.stress_level,
        sleep_hours=input_data.sleep_hours,
        exercise_frequency=input_data.exercise_frequency,
        prediction=prediction,
        probability=round(probability, 4),
        health_score=health_score,
        risk_level=risk_level,
        model_used=model_used,
        model_accuracy=model_accuracy,
        feature_importance=feature_importance,
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction


def get_user_predictions(
    db: Session,
    user_id: int,
    page: int = 1,
    limit: int = 10
) -> Dict[str, Any]:
    """Get paginated prediction history for a user."""
    offset = (page - 1) * limit
    total = db.query(Prediction).filter(Prediction.user_id == user_id).count()
    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id)
        .order_by(desc(Prediction.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {"predictions": predictions, "total": total, "page": page, "limit": limit}


def get_prediction_by_id(db: Session, prediction_id: int, user_id: int) -> Optional[Prediction]:
    """Get a specific prediction by ID (user-scoped)."""
    return (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id, Prediction.user_id == user_id)
        .first()
    )


def delete_prediction(db: Session, prediction_id: int, user_id: int) -> bool:
    """Delete a prediction record."""
    pred = get_prediction_by_id(db, prediction_id, user_id)
    if not pred:
        return False
    db.delete(pred)
    db.commit()
    return True


def get_dashboard_stats(db: Session, user_id: int) -> Dict[str, Any]:
    """Get dashboard statistics for a user."""
    total = db.query(Prediction).filter(Prediction.user_id == user_id).count()
    high_risk = db.query(Prediction).filter(
        Prediction.user_id == user_id, Prediction.risk_level == "High"
    ).count()
    low_risk = db.query(Prediction).filter(
        Prediction.user_id == user_id, Prediction.risk_level == "Low"
    ).count()

    # Average health score
    avg_score = db.query(func.avg(Prediction.health_score)).filter(
        Prediction.user_id == user_id
    ).scalar() or 0

    # Latest prediction
    latest = (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id)
        .order_by(desc(Prediction.created_at))
        .first()
    )

    # Risk trend (compare last 2 predictions)
    recent = (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id)
        .order_by(desc(Prediction.created_at))
        .limit(2)
        .all()
    )
    risk_trend = 0
    if len(recent) >= 2:
        risk_trend = round((recent[1].probability - recent[0].probability) * 100, 1)

    return {
        "total_predictions": total,
        "high_risk_count": high_risk,
        "low_risk_count": low_risk,
        "moderate_risk_count": total - high_risk - low_risk,
        "avg_health_score": round(float(avg_score), 1),
        "latest_risk": latest.probability if latest else None,
        "risk_trend": risk_trend,
    }


def get_all_predictions_admin(
    db: Session,
    page: int = 1,
    limit: int = 20
) -> Dict[str, Any]:
    """Admin: get all predictions with user info."""
    offset = (page - 1) * limit
    total = db.query(Prediction).count()
    predictions = (
        db.query(Prediction)
        .order_by(desc(Prediction.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    # Add user email to each prediction
    result = []
    for pred in predictions:
        pred_dict = {
            "id": pred.id,
            "patient_name": pred.patient_name,
            "age": pred.age,
            "sex": pred.sex,
            "prediction": pred.prediction,
            "probability": pred.probability,
            "health_score": pred.health_score,
            "risk_level": pred.risk_level,
            "model_used": pred.model_used,
            "model_accuracy": pred.model_accuracy,
            "feature_importance": pred.feature_importance,
            "created_at": pred.created_at,
            "user_email": pred.user.email if pred.user else "Unknown",
        }
        result.append(pred_dict)
    return {"predictions": result, "total": total, "page": page, "limit": limit}
