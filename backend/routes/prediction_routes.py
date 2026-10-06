"""
Prediction routes: heart disease prediction and history management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from database.database import get_db
from schemas.schemas import PredictionInput, PredictionResponse, PredictionHistoryResponse, DashboardStats
from services.prediction_service import (
    create_prediction, get_user_predictions, get_prediction_by_id,
    delete_prediction, get_dashboard_stats
)
from services.auth_service import log_action
from api.dependencies import get_current_user, get_current_patient
from models.models import User

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict_heart_disease(
    input_data: PredictionInput,
    current_user: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Predict heart disease risk using ML model.
    Accepts patient medical data and returns risk probability.
    """
    try:
        # Get predictor
        from ml_model.predictor import get_predictor
        predictor = get_predictor()

        # Run prediction
        result = predictor.predict(input_data.model_dump())

        # Save to database
        db_prediction = create_prediction(
            db=db,
            user_id=current_user.id,
            input_data=input_data,
            prediction=result['prediction'],
            probability=result['probability'],
            model_used=result['model_used'],
            model_accuracy=result['model_accuracy'],
            feature_importance=result['feature_importance'],
        )

        # Log the prediction
        log_action(
            db, current_user.id, "Prediction Made",
            f"Patient: {input_data.patient_name}, Risk: {db_prediction.risk_level}"
        )

        return db_prediction

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML model error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.get("/history", response_model=PredictionHistoryResponse)
async def get_prediction_history(
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated prediction history for the current user."""
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 10
    return get_user_predictions(db, current_user.id, page, limit)


@router.get("/dashboard-stats", response_model=DashboardStats)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the current user."""
    return get_dashboard_stats(db, current_user.id)


@router.get("/model-info")
async def get_model_info(current_user: User = Depends(get_current_user)):
    """Get information about the ML model."""
    from ml_model.predictor import get_predictor
    predictor = get_predictor()
    return predictor.get_model_info()


@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific prediction by ID."""
    prediction = get_prediction_by_id(db, prediction_id, current_user.id)
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    return prediction


@router.delete("/{prediction_id}")
async def delete_prediction_record(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a prediction record."""
    success = delete_prediction(db, prediction_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    log_action(db, current_user.id, "Prediction Deleted", f"Prediction ID: {prediction_id}")
    return {"message": "Prediction deleted successfully"}
