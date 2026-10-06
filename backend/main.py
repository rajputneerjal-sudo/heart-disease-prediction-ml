"""
CardioAI - Heart Disease Prediction System
==========================================
FastAPI backend application with JWT authentication,
MySQL database, and ML-powered predictions.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import routes
from routes.auth_routes import router as auth_router
from routes.prediction_routes import router as prediction_router
from routes.admin_routes import router as admin_router
from routes.consultation_routes import router as consultation_router
from routes.doctor_routes import router as doctor_router
from routes.chatbot_routes import router as chatbot_router
from routes.reports_routes import router as reports_router
from database.database import create_tables, engine
from models.models import User, UserRole


def create_admin_user():
    """Create default admin user if not exists."""
    from database.database import SessionLocal
    from services.auth_service import hash_password
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@cardioai.com").first()
        if not admin:
            admin = User(
                full_name="System Admin",
                email="admin@cardioai.com",
                hashed_password=hash_password("admin123456"),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)

            # Create demo user
            demo = User(
                full_name="Demo User",
                email="demo@cardioai.com",
                hashed_password=hash_password("demo1234"),
                role=UserRole.patient,
                is_active=True,
            )
            db.add(demo)
            db.commit()
            logger.info("Default admin and demo users created")
    except Exception as e:
        logger.error(f"Error creating default users: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("Starting CardioAI API...")
    try:
        create_tables()
        logger.info("Database tables created/verified")
        seed_users = os.getenv("SEED_DEFAULT_USERS", "false").lower() == "true"
        if seed_users:
            create_admin_user()
        else:
            logger.info("Skipping default user seed (set SEED_DEFAULT_USERS=true to enable)")
    except Exception as e:
        logger.error(f"Startup error: {e}")

    # Pre-load ML model (optional because some environments may not support local ML binaries)
    preload_model = os.getenv("PRELOAD_ML_MODEL", "false").lower() == "true"
    if preload_model:
        try:
            from ml_model.predictor import get_predictor
            predictor = get_predictor()
            logger.info(f"ML model loaded: {predictor.get_model_info().get('best_model', 'Unknown')}")
        except Exception as e:
            logger.warning(f"ML model pre-load failed (will retry on first request): {e}")
    else:
        logger.info("Skipping ML pre-load (set PRELOAD_ML_MODEL=true to enable)")

    yield

    # Shutdown
    logger.info("Shutting down CardioAI API...")


# Create FastAPI app
app = FastAPI(
    title="CardioAI - Heart Disease Prediction API",
    description="""
    ## AI-Powered Heart Disease Prediction System

    This API provides:
    - **JWT Authentication** - Secure user registration and login
    - **Heart Disease Prediction** - ML-powered risk assessment
    - **Prediction History** - Track health trends over time
    - **Admin Panel** - User and system management
    - **Dashboard Analytics** - Health statistics and insights

    ### Authentication
    Use the `/auth/login` endpoint to get a JWT token, then include it in the
    `Authorization: Bearer <token>` header for protected endpoints.

    ### Demo Credentials
    - **Admin**: admin@cardioai.com / admin123456
    - **Demo User**: demo@cardioai.com / demo1234
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(admin_router)
app.include_router(consultation_router)
app.include_router(doctor_router)
app.include_router(chatbot_router)
app.include_router(reports_router)


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with user-friendly messages."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "; ".join(errors), "errors": exc.errors()}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred"}
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """API health check endpoint."""
    return {
        "status": "healthy",
        "app": "CardioAI",
        "version": "1.0.0",
        "message": "Heart Disease Prediction API is running"
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to CardioAI - Heart Disease Prediction API",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
