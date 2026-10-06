from io import BytesIO
from datetime import datetime
from datetime import timedelta
import secrets
import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from api.dependencies import get_current_user
from database.database import get_db
from models.models import User, Prediction, PatientReport, Doctor, ReportDownloadAudit, DeletedPatientRecord

router = APIRouter(prefix="/reports", tags=["Reports"])

DISCLAIMER = (
    "Disclaimer:\n"
    "This prediction system is based on machine learning analysis and is intended only for educational and preliminary assessment purposes. "
    "It should not be considered a substitute for professional medical diagnosis, treatment, or consultation."
)


def _draw_wrapped(c: canvas.Canvas, text: str, x: int, y: int, max_width: int, line_height: int = 14):
    words = text.split()
    line = ""
    for w in words:
        test = f"{line} {w}".strip()
        if c.stringWidth(test, "Helvetica", 10) < max_width:
            line = test
        else:
            c.drawString(x, y, line)
            y -= line_height
            line = w
    if line:
        c.drawString(x, y, line)
        y -= line_height
    return y


def _draw_chip(c: canvas.Canvas, x: int, y: int, text: str, bg_color, fg_color=colors.white):
    c.setFillColor(bg_color)
    c.roundRect(x, y - 12, 80, 18, 6, fill=1, stroke=0)
    c.setFillColor(fg_color)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(x + 40, y - 1, text)
    c.setFillColor(colors.black)


def build_pdf(prediction: Prediction, patient_name: str, doctor_label: str | None = None) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    w, h = A4
    y = h - 44
    risk_pct = max(0, min(100, round(prediction.probability * 100)))
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Header bar
    c.setFillColor(colors.HexColor("#0F2748"))
    c.roundRect(30, h - 95, w - 60, 56, 10, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(44, h - 65, "CardioAI Heart Health Report")
    c.setFont("Helvetica", 10)
    c.drawString(44, h - 81, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    c.drawRightString(w - 44, h - 81, f"Report ID: RPT-{prediction.id}-{int(datetime.utcnow().timestamp())}")

    y = h - 118
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)
    c.drawString(40, y, f"Patient: {patient_name}  |  Age: {prediction.age}  |  Gender: {'Male' if prediction.sex == 1 else 'Female'}")
    if doctor_label:
        y -= 14
        c.drawString(40, y, f"Downloaded by: Dr. {doctor_label}")

    # Risk overview (plain layout for maximum PDF viewer compatibility)
    y -= 30
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Risk Overview")
    chip_color = colors.HexColor("#DC2626") if risk_pct >= 60 else (colors.HexColor("#D97706") if risk_pct >= 30 else colors.HexColor("#059669"))

    y -= 22
    c.setStrokeColor(colors.HexColor("#CBD5E1"))
    c.setFillColor(colors.HexColor("#F8FAFC"))
    c.roundRect(40, y - 18, 515, 28, 6, fill=1, stroke=1)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y - 2, f"Risk Level: {prediction.risk_level}")
    c.setFillColor(chip_color)
    c.drawString(225, y - 2, f"Risk Percentage: {risk_pct}%")
    c.setFillColor(colors.black)
    c.drawString(400, y - 2, f"Category: {'High' if risk_pct >= 60 else ('Moderate' if risk_pct >= 30 else 'Low')}")

    # Summary cards
    y -= 52
    c.setFillColor(colors.HexColor("#F8FAFC"))
    c.roundRect(40, y - 32, 165, 44, 8, fill=1, stroke=0)
    c.roundRect(220, y - 32, 165, 44, 8, fill=1, stroke=0)
    c.roundRect(400, y - 32, 155, 44, 8, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica", 9)
    c.drawString(48, y - 4, "Prediction")
    c.drawString(228, y - 4, "Heart Health Score")
    c.drawString(408, y - 4, "Model")
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(48, y - 20, "High Risk Pattern" if prediction.prediction == 1 else "Low Risk Pattern")
    c.drawString(228, y - 20, f"{prediction.health_score}/100")
    c.drawString(408, y - 20, prediction.model_used or "N/A")

    y -= 64
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Clinical Input Snapshot")
    y -= 20

    # Compact table for entered parameters
    rows = [
        ("Chest Pain Type", prediction.cp, "Resting BP", prediction.trestbps),
        ("Cholesterol", prediction.chol, "Fasting Sugar", prediction.fbs),
        ("Rest ECG", prediction.restecg, "Max Heart Rate", prediction.thalach),
        ("Exercise Angina", prediction.exang, "Oldpeak", prediction.oldpeak),
        ("Slope", prediction.slope, "CA", prediction.ca),
        ("Thal", prediction.thal, "Smoking", "Yes" if prediction.smoking else "No"),
        ("Alcohol", "Yes" if prediction.alcohol else "No", "Stress Level", prediction.stress_level),
        ("Sleep Hours", prediction.sleep_hours, "Exercise/Week", prediction.exercise_frequency),
    ]
    table_x, table_w, row_h = 40, w - 80, 16
    c.setStrokeColor(colors.HexColor("#CBD5E1"))
    for i, (k1, v1, k2, v2) in enumerate(rows):
        ry = y - (i * row_h)
        if i % 2 == 0:
            c.setFillColor(colors.HexColor("#F8FAFC"))
            c.rect(table_x, ry - 12, table_w, row_h, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#334155"))
        c.setFont("Helvetica", 9)
        c.drawString(table_x + 6, ry - 1, f"{k1}: {v1}")
        c.drawString(table_x + (table_w / 2), ry - 1, f"{k2}: {v2}")
    y -= len(rows) * row_h + 20

    is_high = prediction.probability >= 0.6
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Doctor Consultation Advisory")
    y -= 20
    c.setFont("Helvetica", 10)
    advisory = (
        "High risk of heart disease detected. Please consult a cardiologist immediately. "
        "This AI prediction is not a replacement for professional medical diagnosis."
        if is_high else
        "Current prediction indicates low risk. Regular medical checkups are still recommended. "
        "Please consult a healthcare professional for accurate clinical evaluation."
    )
    y = _draw_wrapped(c, advisory, 40, y, 510)
    y -= 16

    if is_high:
        c.setFillColorRGB(0.85, 0.1, 0.1)
        c.rect(40, y - 38, 510, 34, fill=0, stroke=1)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(45, y - 18, "Emergency Warning: Immediate doctor consultation advised.")
        c.setFont("Helvetica", 9)
        c.drawString(45, y - 32, "Critical health warning - seek urgent medical attention if symptoms worsen.")
        c.setFillColorRGB(0, 0, 0)
        y -= 58

    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Preventive Health Suggestions")
    y -= 20
    c.setFont("Helvetica", 10)
    tips = [
        "Follow a low-sodium, heart-healthy diet.",
        "Exercise regularly with physician guidance.",
        "Avoid smoking and limit alcohol.",
        "Monitor blood pressure and cholesterol periodically.",
    ]
    for tip in tips:
        c.drawString(45, y, f"- {tip}")
        y -= 15

    y -= 20
    c.setFont("Helvetica-Bold", 10)
    c.drawString(40, y, "Medical Disclaimer")
    y -= 18
    c.setFont("Helvetica", 9)
    y = _draw_wrapped(c, DISCLAIMER, 40, y, 510, 12)

    # Interactive footer links
    y -= 16
    c.setFillColor(colors.HexColor("#1D4ED8"))
    c.setFont("Helvetica", 9)
    c.drawString(40, y, "Open Patient Dashboard")
    c.linkURL(f"{frontend_url}/dashboard", (40, y - 2, 150, y + 10), relative=0)
    c.drawString(180, y, "View Doctor Reports")
    c.linkURL(f"{frontend_url}/doctor/reports", (180, y - 2, 295, y + 10), relative=0)
    c.setFillColor(colors.HexColor("#64748B"))
    c.drawRightString(w - 40, y, "CardioAI Clinical Report v2")

    c.showPage()
    c.save()
    data = buffer.getvalue()
    buffer.close()
    return data


@router.get("/prediction/{prediction_id}/download")
async def download_prediction_report(
    prediction_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    deleted_flag = db.query(DeletedPatientRecord).filter(
        DeletedPatientRecord.prediction_id == prediction_id,
        DeletedPatientRecord.is_deleted.is_(True),
    ).first()
    if deleted_flag:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prediction is in bin. Restore it first.")

    if current_user.role.value == "patient" and prediction.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this report")

    doctor_label = None
    doctor_id = None
    if current_user.role.value == "doctor":
        profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        doctor_id = profile.doctor_id if profile else None
        doctor_label = current_user.full_name

    pdf_bytes = build_pdf(prediction, prediction.patient_name, doctor_label)
    report = PatientReport(
        patient_id=prediction.user_id,
        prediction_id=prediction.id,
        doctor_id=doctor_id,
        report_title=f"Heart Health Report #{prediction.id}",
        report_notes=f"Downloaded by {current_user.role.value} user {current_user.id}",
        downloaded_by_user_id=current_user.id,
        downloaded_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    audit = ReportDownloadAudit(
        report_id=report.report_id,
        prediction_id=prediction.id,
        patient_id=prediction.user_id,
        downloaded_by_user_id=current_user.id,
        downloader_role=current_user.role.value,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        download_type="direct",
    )
    db.add(audit)
    db.commit()

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=heart_report_{prediction.id}.pdf"},
    )


@router.post("/prediction/{prediction_id}/signed-url")
async def create_signed_download_url(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    deleted_flag = db.query(DeletedPatientRecord).filter(
        DeletedPatientRecord.prediction_id == prediction_id,
        DeletedPatientRecord.is_deleted.is_(True),
    ).first()
    if deleted_flag:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prediction is in bin. Restore it first.")
    if current_user.role.value == "patient" and prediction.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this report")

    doctor_id = None
    if current_user.role.value == "doctor":
        profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        doctor_id = profile.doctor_id if profile else None

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    report = PatientReport(
        patient_id=prediction.user_id,
        prediction_id=prediction.id,
        doctor_id=doctor_id,
        report_title=f"Signed URL report #{prediction.id}",
        file_token=token,
        token_expires_at=expires_at,
        report_notes=f"Signed link created by {current_user.role.value} user {current_user.id}",
    )
    db.add(report)
    db.commit()
    return {
        "signed_url": f"/reports/signed/{token}",
        "expires_at": expires_at.isoformat() + "Z",
    }


@router.get("/signed/{token}")
async def download_with_signed_token(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    report = (
        db.query(PatientReport)
        .filter(PatientReport.file_token == token)
        .order_by(desc(PatientReport.created_at))
        .first()
    )
    if not report or not report.token_expires_at or report.token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Signed URL expired or invalid")
    if not report.prediction_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    prediction = db.query(Prediction).filter(Prediction.id == report.prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")

    pdf_bytes = build_pdf(prediction, prediction.patient_name)
    report.downloaded_at = datetime.utcnow()
    db.commit()

    audit = ReportDownloadAudit(
        report_id=report.report_id,
        prediction_id=prediction.id,
        patient_id=prediction.user_id,
        downloaded_by_user_id=report.downloaded_by_user_id,
        downloader_role="signed_url",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        download_type="signed",
    )
    db.add(audit)
    db.commit()

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=heart_report_{prediction.id}.pdf"},
    )


@router.get("/doctor/history")
async def doctor_report_history(
    patient_name: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    query = (
        db.query(PatientReport)
        .join(Prediction, PatientReport.prediction_id == Prediction.id)
        .outerjoin(
            DeletedPatientRecord,
            (DeletedPatientRecord.prediction_id == Prediction.id) & (DeletedPatientRecord.is_deleted.is_(True)),
        )
        .filter(DeletedPatientRecord.id.is_(None))
        .order_by(desc(PatientReport.created_at))
    )
    if patient_name:
        query = query.filter(Prediction.patient_name.ilike(f"%{patient_name}%"))
    rows = query.limit(300).all()
    out = []
    for r in rows:
        pred = db.query(Prediction).filter(Prediction.id == r.prediction_id).first() if r.prediction_id else None
        out.append({
            "report_id": r.report_id,
            "prediction_id": r.prediction_id,
            "patient_name": pred.patient_name if pred else "Unknown",
            "risk_level": pred.risk_level if pred else None,
            "probability": pred.probability if pred else None,
            "created_at": r.created_at,
            "downloaded_at": r.downloaded_at,
            "has_signed_link": bool(r.file_token),
        })
    return out


@router.get("/audit")
async def report_download_audit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    audits = db.query(ReportDownloadAudit).order_by(desc(ReportDownloadAudit.created_at)).limit(300).all()
    return [
        {
            "audit_id": a.audit_id,
            "report_id": a.report_id,
            "prediction_id": a.prediction_id,
            "patient_id": a.patient_id,
            "downloaded_by_user_id": a.downloaded_by_user_id,
            "downloader_role": a.downloader_role,
            "ip_address": a.ip_address,
            "user_agent": a.user_agent,
            "download_type": a.download_type,
            "created_at": a.created_at,
        }
        for a in audits
    ]
