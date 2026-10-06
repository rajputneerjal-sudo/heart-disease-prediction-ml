"""
Consultation routes: create doctor consultation requests.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from api.dependencies import get_current_user, get_current_patient, get_current_doctor
from database.database import get_db
from models.models import User, ConsultationRequest
from schemas.schemas import ConsultationRequestCreate, ConsultationRequestResponse
from services.auth_service import log_action
from services.consultation_service import create_consultation_request

router = APIRouter(prefix="/consultations", tags=["Consultations"])


@router.post("/requests", response_model=ConsultationRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_consultation_request(
    request_data: ConsultationRequestCreate,
    current_user: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    consultation = create_consultation_request(db, current_user.id, request_data)
    log_action(
        db,
        current_user.id,
        "Consultation Request Submitted",
        f"Consultation request ID: {consultation.id}",
    )
    return consultation


@router.get("/requests", response_model=list[ConsultationRequestResponse])
async def list_consultation_requests(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return (
        db.query(ConsultationRequest)
        .order_by(desc(ConsultationRequest.created_at))
        .limit(200)
        .all()
    )
