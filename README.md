# CardioAI — Heart Disease Prediction System

> AI-powered healthcare web application for heart disease risk prediction using machine learning.

![CardioAI Banner](https://img.shields.io/badge/CardioAI-Heart%20Disease%20Prediction-red?style=for-the-badge&logo=heart)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?style=flat-square&logo=fastapi)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square&logo=mysql)
![ML](https://img.shields.io/badge/ML-Scikit--learn-yellow?style=flat-square&logo=scikit-learn)

---

## 🏥 Project Overview

CardioAI is a full-stack AI-powered healthcare platform that predicts heart disease risk using machine learning. It provides:

- **Real-time ML predictions** with probability scores
- **Interactive dashboard** with health analytics
- **PDF report generation** with hospital-style formatting
- **Educational content** on heart health
- **Admin panel** for system management
- **JWT authentication** with role-based access

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Recharts |
| Backend | Python FastAPI, SQLAlchemy ORM |
| Database | MySQL 8.0 |
| ML | Scikit-learn, Pandas, NumPy, Joblib |
| Auth | JWT (python-jose), bcrypt (passlib) |
| PDF | jsPDF, jspdf-autotable |
| Icons | Lucide React |

---

## 🤖 Machine Learning Models

| Model | Accuracy | F1 Score | ROC-AUC |
|-------|----------|----------|---------|
| SVM (Best) | 83.5% | 84.1% | 91.2% |
| Logistic Regression | 83.5% | 83.6% | 92.6% |
| Random Forest | 83.0% | 83.0% | 91.4% |
| Decision Tree | 71.5% | 70.5% | 73.8% |

**Dataset**: Cleveland Heart Disease Dataset (UCI ML Repository)  
**Features**: 13 clinical features + 5 lifestyle factors = 18 total inputs

---

## 📁 Project Structure

```
M_P/
├── frontend/                    # React.js frontend
│   ├── src/
│   │   ├── components/ui/       # Reusable UI components
│   │   ├── pages/               # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── PredictionPage.js
│   │   │   ├── ResultsPage.js
│   │   │   ├── HistoryPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── AdminPage.js
│   │   │   └── education/
│   │   ├── layouts/             # Dashboard layout, Sidebar, Navbar
│   │   ├── services/            # API service layer
│   │   ├── context/             # Auth & Theme context
│   │   └── utils/               # Helpers, PDF generator
│   └── package.json
│
├── backend/                     # FastAPI backend
│   ├── main.py                  # Application entry point
│   ├── database/                # SQLAlchemy setup
│   ├── models/                  # ORM models
│   ├── schemas/                 # Pydantic schemas
│   ├── routes/                  # API route handlers
│   ├── services/                # Business logic
│   ├── api/                     # Dependencies (auth)
│   ├── ml_model/                # ML training & inference
│   │   ├── train_model.py       # Training script
│   │   ├── predictor.py         # Inference engine
│   │   ├── data/                # Dataset storage
│   │   └── saved_models/        # Trained model files
│   └── requirements.txt
│
└── database/
    └── schema.sql               # MySQL schema with views & procedures
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MySQL 8.0+
- MySQL Workbench (optional, for DB management)

### 1. Database Setup

```bash
# Open MySQL Workbench or MySQL CLI
mysql -u root -p

# Run the schema
source /path/to/M_P/database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Train ML model
python ml_model/train_model.py

# Start the API server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL (optional)
# Create .env file: REACT_APP_API_URL=http://localhost:8000

# Start development server
npm start
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cardioai.com | admin123456 |
| Demo User | demo@cardioai.com | demo1234 |

---

## 📊 Features

### Patient Input (19 Parameters)
- **Personal**: Name, Age, Gender
- **Clinical**: Chest Pain Type, Blood Pressure, Cholesterol, Blood Sugar, ECG
- **Cardiac Tests**: Max Heart Rate, Exercise Angina, ST Depression, Slope, Vessels, Thalassemia
- **Lifestyle**: Smoking, Alcohol, Stress Level, Sleep Hours, Exercise Frequency

### Prediction Results
- Risk probability percentage
- Heart Health Score (0-100)
- Risk level (Low/Moderate/High)
- AI-based personalized recommendations
- Emergency warning for high-risk cases

### Graphical Analysis
- Risk gauge meter
- Pie chart (risk vs healthy)
- Bar chart (patient vs healthy ranges)
- Feature importance visualization
- Health score trend over time

### PDF Report
- Hospital-style formatting
- Patient information
- Clinical values table
- Recommendations
- Medical disclaimer

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy build/ folder to Vercel
```

### Backend (Render)
```bash
# Set environment variables in Render dashboard
# Deploy from GitHub repository
# Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 🔒 Security Features

- JWT token authentication (1440 min expiry)
- bcrypt password hashing (cost factor 12)
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic schemas
- CORS configuration
- Environment variable secrets management
- Role-based access control (user/admin/doctor)

---

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login (returns JWT) |
| GET | /auth/me | Get current user |
| PUT | /auth/profile | Update profile |
| POST | /auth/change-password | Change password |

### Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /predictions/predict | Make prediction |
| GET | /predictions/history | Get history |
| GET | /predictions/dashboard-stats | Dashboard stats |
| GET | /predictions/{id} | Get prediction |
| DELETE | /predictions/{id} | Delete prediction |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/stats | System statistics |
| GET | /admin/users | All users |
| DELETE | /admin/users/{id} | Delete user |
| GET | /admin/predictions | All predictions |
| GET | /admin/logs | System logs |

---

## 📄 License

This project is developed for educational purposes as a final-year engineering project.

---

## 👨‍💻 Developer Notes

- The ML model is automatically trained on first run if no saved model exists
- The synthetic dataset closely mirrors the Cleveland Heart Disease dataset statistics
- To use the real Cleveland dataset, place `heart.csv` in `backend/ml_model/data/`
- All medical tooltips are patient-friendly and medically accurate
- The PDF generator works entirely client-side using jsPDF

---

*CardioAI — Empowering preventive healthcare through AI* ❤️
