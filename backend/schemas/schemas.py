"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ===== AUTH SCHEMAS =====
class AuthRole(str, Enum):
    patient = "patient"
    doctor = "doctor"

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    role: AuthRole = AuthRole.patient
    specialization: Optional[str] = None
    experience: Optional[str] = None
    hospital_name: Optional[str] = None
    contact_information: Optional[str] = None

    @validator('full_name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: AuthRole


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    date_of_birth: Optional[str]
    gender: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


# ===== PREDICTION SCHEMAS =====

class PredictionInput(BaseModel):
    """Input schema for heart disease prediction."""
    patient_name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=1, le=120)
    sex: int = Field(..., ge=0, le=1)
    cp: int = Field(..., ge=0, le=3, description="Chest pain type")
    trestbps: int = Field(..., ge=60, le=250, description="Resting blood pressure")
    chol: int = Field(..., ge=100, le=600, description="Cholesterol mg/dL")
    fbs: int = Field(..., ge=0, le=1, description="Fasting blood sugar > 120")
    restecg: int = Field(..., ge=0, le=2, description="Resting ECG results")
    thalach: int = Field(..., ge=60, le=250, description="Max heart rate")
    exang: int = Field(..., ge=0, le=1, description="Exercise induced angina")
    oldpeak: float = Field(..., ge=0.0, le=10.0, description="ST depression")
    slope: int = Field(..., ge=0, le=2, description="Slope of ST segment")
    ca: int = Field(..., ge=0, le=4, description="Number of major vessels")
    thal: int = Field(..., ge=0, le=3, description="Thalassemia type")
    smoking: int = Field(..., ge=0, le=1)
    alcohol: int = Field(..., ge=0, le=1)
    stress_level: int = Field(..., ge=1, le=10)
    sleep_hours: float = Field(..., ge=1.0, le=24.0)
    exercise_frequency: int = Field(..., ge=0, le=7)

    class Config:
        json_schema_extra = {
            "example": {
                "patient_name": "John Smith",
                "age": 55, "sex": 1, "cp": 0,
                "trestbps": 140, "chol": 250, "fbs": 0,
                "restecg": 1, "thalach": 150, "exang": 0,
                "oldpeak": 2.3, "slope": 1, "ca": 1, "thal": 2,
                "smoking": 1, "alcohol": 0, "stress_level": 7,
                "sleep_hours": 6.0, "exercise_frequency": 2
            }
        }


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class PredictionResult(BaseModel):
    """Prediction result response."""
    id: int
    patient_name: str
    prediction: int
    probability: float
    health_score: int
    risk_level: str
    model_used: str
    model_accuracy: Optional[float]
    feature_importance: Optional[List[FeatureImportanceItem]]
    recommendations: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    """Full prediction response including result."""
    id: int
    patient_name: str
    age: int
    sex: int
    prediction: int
    probability: float
    health_score: int
    risk_level: str
    model_used: str
    model_accuracy: Optional[float]
    feature_importance: Optional[List[Dict[str, Any]]]
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionHistoryResponse(BaseModel):
    predictions: List[PredictionResponse]
    total: int
    page: int
    limit: int


class DashboardStats(BaseModel):
    total_predictions: int
    high_risk_count: int
    low_risk_count: int
    moderate_risk_count: int
    avg_health_score: float
    latest_risk: Optional[float]
    risk_trend: Optional[float]


# ===== CONSULTATION SCHEMAS =====

class ConsultationRequestCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=6, max_length=30)
    email: Optional[EmailStr] = None
    preferred_date: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=1000)

    @validator("full_name", "phone")
    def required_trimmed_fields(cls, value):
        if not value or not value.strip():
            raise ValueError("Field cannot be empty")
        return value.strip()


class ConsultationRequestResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: str
    email: Optional[str]
    preferred_date: Optional[str]
    notes: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===== ADMIN SCHEMAS =====

class AdminStats(BaseModel):
    total_users: int
    total_predictions: int
    high_risk_count: int
    low_risk_count: int
    avg_accuracy: float
    new_users_today: int
    predictions_today: int


class SystemLogResponse(BaseModel):
    id: int
    action: str
    user: Optional[str]
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int


class RoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(patient|admin|doctor)$")


class DoctorProfileResponse(BaseModel):
    doctor_id: int
    user_id: int
    name: str
    specialization: Optional[str]
    experience: Optional[str]
    hospital_name: Optional[str]
    email: str
    contact_information: Optional[str]

    class Config:
        from_attributes = True


class DoctorRecommendationCreate(BaseModel):
    patient_id: int
    recommendation_text: str = Field(..., min_length=5, max_length=5000)
    emergency_notes: Optional[str] = Field(None, max_length=5000)


class DoctorRecommendationResponse(BaseModel):
    recommendation_id: int
    patient_id: int
    doctor_id: int
    recommendation_text: str
    emergency_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatbotMessageRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=2000)


class ChatbotMessageResponse(BaseModel):
    response: str
    disclaimer: str


class ChatbotHistoryResponse(BaseModel):
    chat_id: int
    user_id: int
    message: str
    response: str
    timestamp: datetime

    class Config:
        from_attributes = True
