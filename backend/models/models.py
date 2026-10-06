"""
SQLAlchemy ORM models for the CardioAI MySQL database.
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, JSON, Index, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class UserRole(str, enum.Enum):
    patient = "patient"
    admin = "admin"
    doctor = "doctor"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.patient, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    profile_image = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    consultation_requests = relationship("ConsultationRequest", back_populates="user", cascade="all, delete-orphan")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    chatbot_history = relationship("ChatbotHistory", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_role', 'role'),
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    patient_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(Integer, nullable=False)

    cp = Column(Integer, nullable=False)
    trestbps = Column(Integer, nullable=False)
    chol = Column(Integer, nullable=False)
    fbs = Column(Integer, nullable=False)
    restecg = Column(Integer, nullable=False)
    thalach = Column(Integer, nullable=False)
    exang = Column(Integer, nullable=False)
    oldpeak = Column(Float, nullable=False)
    slope = Column(Integer, nullable=False)
    ca = Column(Integer, nullable=False)
    thal = Column(Integer, nullable=False)

    smoking = Column(Integer, nullable=False)
    alcohol = Column(Integer, nullable=False)
    stress_level = Column(Integer, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    exercise_frequency = Column(Integer, nullable=False)

    prediction = Column(Integer, nullable=False)
    probability = Column(Float, nullable=False)
    health_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)
    model_used = Column(String(50), nullable=False)
    model_accuracy = Column(Float, nullable=True)
    feature_importance = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="predictions")
    report = relationship("Report", back_populates="prediction", uselist=False)

    __table_args__ = (
        Index('idx_prediction_user', 'user_id'),
        Index('idx_prediction_date', 'created_at'),
        Index('idx_prediction_risk', 'risk_level'),
    )


class DeletedPatientRecord(Base):
    __tablename__ = "deleted_patient_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    restored_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    restored_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=True, nullable=False)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=True)
    report_id = Column(String(50), unique=True, nullable=False)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="reports")
    prediction = relationship("Prediction", back_populates="report")


class HealthTip(Base):
    __tablename__ = "health_tips"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    icon = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(20), default="success")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_log_user', 'user_id'),
        Index('idx_log_date', 'created_at'),
    )


class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(255), nullable=True)
    preferred_date = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="pending", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="consultation_requests")

    __table_args__ = (
        Index('idx_consultation_user', 'user_id'),
        Index('idx_consultation_status', 'status'),
        Index('idx_consultation_date', 'created_at'),
    )


class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=True)
    experience = Column(String(100), nullable=True)
    hospital_name = Column(String(150), nullable=True)
    email = Column(String(255), nullable=False)
    contact_information = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="doctor_profile")
    recommendations = relationship("DoctorRecommendation", back_populates="doctor", cascade="all, delete-orphan")


class PatientReport(Base):
    __tablename__ = "patient_reports"

    report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="SET NULL"), nullable=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="SET NULL"), nullable=True, index=True)
    report_title = Column(String(200), nullable=True)
    report_notes = Column(Text, nullable=True)
    file_token = Column(String(255), nullable=True, index=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    downloaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    downloaded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ReportDownloadAudit(Base):
    __tablename__ = "report_download_audits"

    audit_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("patient_reports.report_id", ondelete="SET NULL"), nullable=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    downloaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    downloader_role = Column(String(20), nullable=False)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(500), nullable=True)
    download_type = Column(String(50), nullable=False, default="direct")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DoctorRecommendation(Base):
    __tablename__ = "doctor_recommendations"

    recommendation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_text = Column(Text, nullable=False)
    emergency_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    doctor = relationship("Doctor", back_populates="recommendations")


class ChatbotHistory(Base):
    __tablename__ = "chatbot_history"

    chat_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="chatbot_history")
