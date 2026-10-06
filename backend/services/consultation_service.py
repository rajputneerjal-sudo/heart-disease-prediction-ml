"""
Consultation request service: persistence and retrieval helpers.
"""
from sqlalchemy.orm import Session

from models.models import ConsultationRequest
from schemas.schemas import ConsultationRequestCreate


def create_consultation_request(
    db: Session,
    user_id: int,
    request_data: ConsultationRequestCreate,
) -> ConsultationRequest:
    consultation = ConsultationRequest(
        user_id=user_id,
        full_name=request_data.full_name,
        phone=request_data.phone,
        email=request_data.email,
        preferred_date=request_data.preferred_date,
        notes=request_data.notes,
        status="pending",
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation
