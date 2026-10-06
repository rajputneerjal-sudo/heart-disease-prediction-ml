from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from datetime import datetime

from database.database import get_db
from models.models import Prediction, User, Doctor, DoctorRecommendation, UserRole, DeletedPatientRecord
from schemas.schemas import (
    DoctorProfileResponse,
    DoctorRecommendationCreate,
    DoctorRecommendationResponse,
)
from api.dependencies import get_current_doctor
from api.dependencies import get_current_patient

router = APIRouter(prefix="/doctor", tags=["Doctor Module"])


# Helper function to identify test/demo accounts
def is_test_or_demo_account(email: str, full_name: str = "") -> bool:
    """
    Identifies test, demo, or system accounts that should be hidden from doctors.
    Returns True if the account is a test/demo account.
    """
    email_lower = email.lower()
    name_lower = full_name.lower()
    
    # Test/demo email patterns
    test_patterns = [
        'test', 'demo', 'example.com', 'cardioai.com',
        'devk_test', 'chatqa', 'chatfix', 'testuser'
    ]
    
    # Test/demo name patterns
    name_patterns = [
        'test', 'demo', 'chat qa', 'chat fix', 'dev k'
    ]
    
    # Check email
    for pattern in test_patterns:
        if pattern in email_lower:
            return True
    
    # Check name
    for pattern in name_patterns:
        if pattern in name_lower:
            return True
    
    return False


@router.get("/profile", response_model=DoctorProfileResponse)
async def get_doctor_profile(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    return profile


@router.get("/analytics")
async def doctor_analytics(
    start_date: str | None = None,
    end_date: str | None = None,
    min_age: int | None = None,
    max_age: int | None = None,
    risk_level: str | None = None,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    # Get all users to filter out test/demo accounts
    all_users = db.query(User).all()
    test_user_ids = [u.id for u in all_users if is_test_or_demo_account(u.email, u.full_name)]
    
    query = db.query(Prediction)
    
    # Exclude test/demo accounts
    if test_user_ids:
        query = query.filter(~Prediction.user_id.in_(test_user_ids))
    
    if start_date:
        query = query.filter(Prediction.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Prediction.created_at <= datetime.fromisoformat(end_date))
    if min_age is not None:
        query = query.filter(Prediction.age >= min_age)
    if max_age is not None:
        query = query.filter(Prediction.age <= max_age)
    if risk_level in {"Low", "Moderate", "High"}:
        query = query.filter(Prediction.risk_level == risk_level)

    records = query.order_by(desc(Prediction.created_at)).limit(1000).all()
    total_patients = len(set(r.user_id for r in records))
    high_risk = len([r for r in records if r.probability >= 0.6])
    latest_predictions = records[:50]
    trend_map = {}
    heatmap = [[0 for _ in range(7)] for _ in range(24)]
    for r in records:
        key = r.created_at.strftime("%Y-%m-%d")
        trend_map.setdefault(key, {"count": 0, "high": 0})
        trend_map[key]["count"] += 1
        if r.probability >= 0.6:
            trend_map[key]["high"] += 1
        heatmap[r.created_at.hour][r.created_at.weekday()] += 1
    return {
        "total_patients": total_patients,
        "high_risk_patients": high_risk,
        "total_predictions": len(latest_predictions),
        "prediction_distribution": {
            "high": len([p for p in latest_predictions if p.probability >= 0.6]),
            "moderate": len([p for p in latest_predictions if 0.3 <= p.probability < 0.6]),
            "low": len([p for p in latest_predictions if p.probability < 0.3]),
        },
        "cohort_filters_applied": {
            "start_date": start_date,
            "end_date": end_date,
            "min_age": min_age,
            "max_age": max_age,
            "risk_level": risk_level,
        },
        "daily_trend": [{"date": k, **v} for k, v in sorted(trend_map.items())][-30:],
        "risk_heatmap": heatmap,
    }


@router.get("/patients/reports")
async def get_patient_reports(
    search: str = "",
    high_risk_only: bool = False,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    # Get all users to filter out test/demo accounts
    all_users = db.query(User).all()
    test_user_ids = [u.id for u in all_users if is_test_or_demo_account(u.email, u.full_name)]
    
    query = (
        db.query(Prediction)
        .outerjoin(
            DeletedPatientRecord,
            (DeletedPatientRecord.prediction_id == Prediction.id) & (DeletedPatientRecord.is_deleted.is_(True)),
        )
        .filter(DeletedPatientRecord.id.is_(None))
        .order_by(desc(Prediction.created_at))
    )
    
    # Exclude test/demo accounts
    if test_user_ids:
        query = query.filter(~Prediction.user_id.in_(test_user_ids))
    
    if search:
        query = query.filter(Prediction.patient_name.ilike(f"%{search}%"))
    if high_risk_only:
        query = query.filter(Prediction.probability >= 0.6)
    records = query.limit(200).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "patient_name": r.patient_name,
            "age": r.age,
            "sex": r.sex,
            "cp": r.cp,
            "trestbps": r.trestbps,
            "chol": r.chol,
            "fbs": r.fbs,
            "restecg": r.restecg,
            "thalach": r.thalach,
            "exang": r.exang,
            "oldpeak": r.oldpeak,
            "slope": r.slope,
            "ca": r.ca,
            "thal": r.thal,
            "smoking": r.smoking,
            "alcohol": r.alcohol,
            "stress_level": r.stress_level,
            "sleep_hours": r.sleep_hours,
            "exercise_frequency": r.exercise_frequency,
            "prediction": r.prediction,
            "probability": r.probability,
            "health_score": r.health_score,
            "risk_level": r.risk_level,
            "model_used": r.model_used,
            "created_at": r.created_at,
            "total_predictions_for_patient": db.query(func.count(Prediction.id)).filter(Prediction.user_id == r.user_id).scalar() or 0,
        }
        for r in records
    ]


@router.delete("/patients/reports/{prediction_id}")
async def soft_delete_patient_report(
    prediction_id: int,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found")

    record = db.query(DeletedPatientRecord).filter(DeletedPatientRecord.prediction_id == prediction_id).first()
    if record and record.is_deleted:
        return {"message": "Record already moved to bin"}

    if record:
        record.is_deleted = True
        record.deleted_by_user_id = current_user.id
        record.deleted_at = datetime.utcnow()
        record.restored_by_user_id = None
        record.restored_at = None
    else:
        record = DeletedPatientRecord(
            prediction_id=prediction_id,
            deleted_by_user_id=current_user.id,
            is_deleted=True,
        )
        db.add(record)

    db.commit()
    return {"message": "Record moved to bin"}


@router.get("/patients/bin")
async def list_deleted_patient_reports(
    search: str = "",
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    query = (
        db.query(DeletedPatientRecord, Prediction)
        .join(Prediction, Prediction.id == DeletedPatientRecord.prediction_id)
        .filter(DeletedPatientRecord.is_deleted.is_(True))
        .order_by(desc(DeletedPatientRecord.deleted_at))
    )

    if search:
        query = query.filter(Prediction.patient_name.ilike(f"%{search}%"))

    rows = query.limit(300).all()
    return [
        {
            "bin_id": deleted_row.id,
            "prediction_id": prediction_row.id,
            "patient_name": prediction_row.patient_name,
            "probability": prediction_row.probability,
            "risk_level": prediction_row.risk_level,
            "original_created_at": prediction_row.created_at,
            "deleted_at": deleted_row.deleted_at,
            "deleted_by_user_id": deleted_row.deleted_by_user_id,
        }
        for deleted_row, prediction_row in rows
    ]


@router.post("/patients/bin/{prediction_id}/restore")
async def restore_deleted_patient_report(
    prediction_id: int,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    record = db.query(DeletedPatientRecord).filter(DeletedPatientRecord.prediction_id == prediction_id).first()
    if not record or not record.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deleted record not found in bin")

    record.is_deleted = False
    record.restored_by_user_id = current_user.id
    record.restored_at = datetime.utcnow()
    db.commit()
    return {"message": "Record restored from bin"}


@router.delete("/patients/bin/{prediction_id}/permanent")
async def permanently_delete_patient_report(
    prediction_id: int,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    record = db.query(DeletedPatientRecord).filter(DeletedPatientRecord.prediction_id == prediction_id).first()
    if not record or not record.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Record must be moved to bin before permanent deletion",
        )

    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction record not found")

    db.delete(prediction)
    db.commit()
    return {"message": "Record permanently deleted"}


@router.delete("/patients/bin/empty")
async def empty_deleted_records_bin(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    deleted_prediction_ids = [
        row[0]
        for row in db.query(DeletedPatientRecord.prediction_id)
        .filter(DeletedPatientRecord.is_deleted.is_(True))
        .all()
    ]

    if not deleted_prediction_ids:
        return {"message": "Bin is already empty", "deleted_count": 0}

    deleted_count = (
        db.query(Prediction)
        .filter(Prediction.id.in_(deleted_prediction_ids))
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"message": "Bin emptied successfully", "deleted_count": deleted_count}


@router.get("/patients")
async def get_current_patients(
    search: str = "",
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    patient_query = db.query(User).filter(User.role == UserRole.patient, User.is_active.is_(True))
    if search:
        patient_query = patient_query.filter(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    patients = patient_query.order_by(User.created_at.desc()).limit(300).all()
    
    # Filter out test/demo accounts
    real_patients = [p for p in patients if not is_test_or_demo_account(p.email, p.full_name)]

    out = []
    for p in real_patients:
        latest = (
            db.query(Prediction)
            .filter(Prediction.user_id == p.id)
            .order_by(desc(Prediction.created_at))
            .first()
        )
        out.append({
            "patient_id": p.id,
            "full_name": p.full_name,
            "email": p.email,
            "last_prediction_id": latest.id if latest else None,
            "last_risk_level": latest.risk_level if latest else None,
            "last_probability": latest.probability if latest else None,
            "last_prediction_at": latest.created_at if latest else None,
            "total_predictions": db.query(func.count(Prediction.id)).filter(Prediction.user_id == p.id).scalar() or 0,
        })
    return out


@router.post("/recommendations", response_model=DoctorRecommendationResponse, status_code=status.HTTP_201_CREATED)
async def add_recommendation(
    payload: DoctorRecommendationCreate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    patient = db.query(User).filter(User.id == payload.patient_id, User.role == UserRole.patient).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found in current patient module")
    recommendation = DoctorRecommendation(
        patient_id=payload.patient_id,
        doctor_id=profile.doctor_id,
        recommendation_text=payload.recommendation_text,
        emergency_notes=payload.emergency_notes,
    )
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    return recommendation


@router.get("/recommendations", response_model=list[DoctorRecommendationResponse])
async def list_recommendations(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not profile:
        return []
    return (
        db.query(DoctorRecommendation)
        .filter(DoctorRecommendation.doctor_id == profile.doctor_id)
        .order_by(desc(DoctorRecommendation.created_at))
        .limit(200)
        .all()
    )


@router.get("/recommendations/patient")
async def list_recommendations_for_patient(
    current_user: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(DoctorRecommendation, Doctor)
        .join(Doctor, Doctor.doctor_id == DoctorRecommendation.doctor_id)
        .filter(DoctorRecommendation.patient_id == current_user.id)
        .order_by(desc(DoctorRecommendation.created_at))
        .limit(100)
        .all()
    )
    return [
        {
            "recommendation_id": rec.recommendation_id,
            "patient_id": rec.patient_id,
            "doctor_id": rec.doctor_id,
            "doctor_name": doc.name,
            "recommendation_text": rec.recommendation_text,
            "emergency_notes": rec.emergency_notes,
            "created_at": rec.created_at,
        }
        for rec, doc in rows
    ]
