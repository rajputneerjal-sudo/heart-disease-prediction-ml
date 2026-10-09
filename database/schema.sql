-- ============================================================
-- CardioAI - Heart Disease Prediction System
-- MySQL Database Schema
-- Compatible with MySQL Workbench
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS cardioai_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cardioai_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    date_of_birth   VARCHAR(20),
    gender          VARCHAR(20),
    role            ENUM('patient', 'admin', 'doctor') NOT NULL DEFAULT 'patient',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    profile_image   VARCHAR(500),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login      DATETIME,

    INDEX idx_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id              INT NOT NULL UNIQUE,
    name                 VARCHAR(100) NOT NULL,
    specialization       VARCHAR(100),
    experience           VARCHAR(100),
    hospital_name        VARCHAR(150),
    email                VARCHAR(255) NOT NULL,
    contact_information  VARCHAR(255),
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PREDICTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,

    -- Patient Information
    patient_name        VARCHAR(100) NOT NULL,
    age                 INT NOT NULL CHECK (age BETWEEN 1 AND 120),
    sex                 TINYINT NOT NULL CHECK (sex IN (0, 1)),

    -- Clinical Features (Cleveland Dataset)
    cp                  TINYINT NOT NULL CHECK (cp BETWEEN 0 AND 3),
    trestbps            INT NOT NULL CHECK (trestbps BETWEEN 60 AND 250),
    chol                INT NOT NULL CHECK (chol BETWEEN 100 AND 600),
    fbs                 TINYINT NOT NULL CHECK (fbs IN (0, 1)),
    restecg             TINYINT NOT NULL CHECK (restecg BETWEEN 0 AND 2),
    thalach             INT NOT NULL CHECK (thalach BETWEEN 60 AND 250),
    exang               TINYINT NOT NULL CHECK (exang IN (0, 1)),
    oldpeak             DECIMAL(4,1) NOT NULL,
    slope               TINYINT NOT NULL CHECK (slope BETWEEN 0 AND 2),
    ca                  TINYINT NOT NULL CHECK (ca BETWEEN 0 AND 4),
    thal                TINYINT NOT NULL CHECK (thal BETWEEN 0 AND 3),

    -- Lifestyle Factors
    smoking             TINYINT NOT NULL CHECK (smoking IN (0, 1)),
    alcohol             TINYINT NOT NULL CHECK (alcohol IN (0, 1)),
    stress_level        TINYINT NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
    sleep_hours         DECIMAL(3,1) NOT NULL,
    exercise_frequency  TINYINT NOT NULL CHECK (exercise_frequency BETWEEN 0 AND 7),

    -- Prediction Results
    prediction          TINYINT NOT NULL CHECK (prediction IN (0, 1)),
    probability         DECIMAL(6,4) NOT NULL,
    health_score        INT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    risk_level          VARCHAR(20) NOT NULL,
    model_used          VARCHAR(50) NOT NULL,
    model_accuracy      DECIMAL(6,4),
    feature_importance  JSON,
    notes               TEXT,

    -- Metadata
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key
    CONSTRAINT fk_prediction_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_prediction_user (user_id),
    INDEX idx_prediction_date (created_at),
    INDEX idx_prediction_risk (risk_level),
    INDEX idx_prediction_result (prediction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    prediction_id   INT,
    report_id       VARCHAR(50) NOT NULL UNIQUE,
    file_path       VARCHAR(500),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_report_prediction
        FOREIGN KEY (prediction_id) REFERENCES predictions(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_report_user (user_id),
    INDEX idx_report_id (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PATIENT REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_reports (
    report_id        INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT NOT NULL,
    prediction_id    INT,
    doctor_id        INT,
    report_title     VARCHAR(200),
    report_notes     TEXT,
    file_token       VARCHAR(255),
    token_expires_at DATETIME,
    downloaded_by_user_id INT,
    downloaded_at    DATETIME,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_report_patient
        FOREIGN KEY (patient_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_patient_report_prediction
        FOREIGN KEY (prediction_id) REFERENCES predictions(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_patient_report_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_patient_report_downloaded_by
        FOREIGN KEY (downloaded_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_patient_report_patient (patient_id),
    INDEX idx_patient_report_prediction (prediction_id),
    INDEX idx_patient_report_doctor (doctor_id),
    INDEX idx_patient_report_token (file_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REPORT DOWNLOAD AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS report_download_audits (
    audit_id               INT AUTO_INCREMENT PRIMARY KEY,
    report_id              INT,
    prediction_id          INT,
    patient_id             INT,
    downloaded_by_user_id  INT,
    downloader_role        VARCHAR(20) NOT NULL,
    ip_address             VARCHAR(64),
    user_agent             VARCHAR(500),
    download_type          VARCHAR(50) NOT NULL DEFAULT 'direct',
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_audit_report
        FOREIGN KEY (report_id) REFERENCES patient_reports(report_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_report_audit_prediction
        FOREIGN KEY (prediction_id) REFERENCES predictions(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_report_audit_patient
        FOREIGN KEY (patient_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_report_audit_user
        FOREIGN KEY (downloaded_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_report_audit_report (report_id),
    INDEX idx_report_audit_prediction (prediction_id),
    INDEX idx_report_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DOCTOR RECOMMENDATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_recommendations (
    recommendation_id    INT AUTO_INCREMENT PRIMARY KEY,
    patient_id           INT NOT NULL,
    doctor_id            INT NOT NULL,
    recommendation_text  TEXT NOT NULL,
    emergency_notes      TEXT,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_recommendation_patient
        FOREIGN KEY (patient_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_doctor_recommendation_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_doctor_recommendation_patient (patient_id),
    INDEX idx_doctor_recommendation_doctor (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CHATBOT HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chatbot_history (
    chat_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    message      TEXT NOT NULL,
    response     TEXT NOT NULL,
    timestamp    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chatbot_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_chatbot_user_time (user_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- HEALTH TIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS health_tips (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    category    VARCHAR(50) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    content     TEXT NOT NULL,
    icon        VARCHAR(10),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tip_category (category),
    INDEX idx_tip_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SYSTEM LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,
    action      VARCHAR(100) NOT NULL,
    details     TEXT,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    status      VARCHAR(20) DEFAULT 'success',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_log_user (user_id),
    INDEX idx_log_date (created_at),
    INDEX idx_log_action (action),
    INDEX idx_log_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default health tips
INSERT INTO health_tips (category, title, content, icon) VALUES
('diet', 'Eat Heart-Healthy Foods', 'Include fruits, vegetables, whole grains, and lean proteins in your daily diet. Limit saturated fats and sodium.', 'diet'),
('exercise', 'Stay Physically Active', 'Aim for at least 150 minutes of moderate aerobic exercise per week. Even a 30-minute walk daily makes a difference.', 'exercise'),
('sleep', 'Prioritize Quality Sleep', 'Get 7-9 hours of quality sleep each night. Poor sleep increases cardiovascular risk significantly.', 'sleep'),
('stress', 'Manage Stress Effectively', 'Practice meditation, yoga, or deep breathing. Chronic stress raises blood pressure and heart disease risk.', 'stress'),
('hydration', 'Stay Well Hydrated', 'Drink 8-10 glasses of water daily. Proper hydration helps your heart pump blood more efficiently.', 'water'),
('smoking', 'Avoid Smoking', 'Smoking is the #1 preventable cause of heart disease. Quitting reduces risk by 50% within one year.', 'smoking'),
('checkup', 'Regular Health Checkups', 'Monitor blood pressure, cholesterol, and blood sugar regularly. Early detection saves lives.', 'checkup'),
('weight', 'Maintain Healthy Weight', 'Losing just 5-10% of excess body weight significantly improves heart health markers.', 'weight');

-- ============================================================
-- VIEWS FOR ANALYTICS
-- ============================================================

-- User prediction summary view
CREATE OR REPLACE VIEW user_prediction_summary AS
SELECT
    u.id AS user_id,
    u.full_name,
    u.email,
    COUNT(p.id) AS total_predictions,
    SUM(CASE WHEN p.risk_level = 'High' THEN 1 ELSE 0 END) AS high_risk_count,
    SUM(CASE WHEN p.risk_level = 'Low' THEN 1 ELSE 0 END) AS low_risk_count,
    AVG(p.health_score) AS avg_health_score,
    MAX(p.created_at) AS last_prediction_date
FROM users u
LEFT JOIN predictions p ON u.id = p.user_id
GROUP BY u.id, u.full_name, u.email;

-- Daily prediction stats view
CREATE OR REPLACE VIEW daily_prediction_stats AS
SELECT
    DATE(created_at) AS prediction_date,
    COUNT(*) AS total_predictions,
    SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) AS high_risk,
    SUM(CASE WHEN risk_level = 'Moderate' THEN 1 ELSE 0 END) AS moderate_risk,
    SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) AS low_risk,
    AVG(probability) AS avg_probability,
    AVG(health_score) AS avg_health_score
FROM predictions
GROUP BY DATE(created_at)
ORDER BY prediction_date DESC;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER //

DROP PROCEDURE IF EXISTS GetUserHealthTrend //
CREATE PROCEDURE GetUserHealthTrend(IN p_user_id INT, IN p_days INT)
BEGIN
    SELECT
        DATE(created_at) AS date,
        AVG(health_score) AS avg_score,
        AVG(probability) AS avg_risk,
        COUNT(*) AS prediction_count
    FROM predictions
    WHERE user_id = p_user_id
        AND created_at >= DATE_SUB(NOW(), INTERVAL p_days DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC;
END //

DELIMITER ;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_predictions_user_date
    ON predictions(user_id, created_at);

CREATE INDEX idx_predictions_risk_date
    ON predictions(risk_level, created_at);

-- ============================================================
-- SHOW CREATED TABLES
-- ============================================================
SHOW TABLES;
SELECT 'Database schema created successfully!' AS message;
