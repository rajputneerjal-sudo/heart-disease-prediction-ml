// Risk level helpers
export const getRiskLevel = (probability) => {
  if (probability < 0.3) return { level: 'Low', color: 'green', label: 'Low Risk', emoji: '✅' };
  if (probability < 0.6) return { level: 'Moderate', color: 'yellow', label: 'Moderate Risk', emoji: '⚠️' };
  return { level: 'High', color: 'red', label: 'High Risk', emoji: '🚨' };
};

export const getHealthScore = (probability) => {
  return Math.round((1 - probability) * 100);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const generateReportId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${timestamp}-${random}`;
};

// Healthy ranges for comparison charts
export const HEALTHY_RANGES = {
  cholesterol: { min: 0, max: 200, label: 'Cholesterol (mg/dL)', unit: 'mg/dL' },
  trestbps: { min: 90, max: 120, label: 'Blood Pressure (mmHg)', unit: 'mmHg' },
  thalach: { min: 60, max: 100, label: 'Max Heart Rate (bpm)', unit: 'bpm' },
  oldpeak: { min: 0, max: 1, label: 'ST Depression', unit: '' },
};

// Chest pain type labels
export const CHEST_PAIN_TYPES = {
  0: 'Typical Angina',
  1: 'Atypical Angina',
  2: 'Non-Anginal Pain',
  3: 'Asymptomatic',
};

// ECG result labels
export const ECG_RESULTS = {
  0: 'Normal',
  1: 'ST-T Wave Abnormality',
  2: 'Left Ventricular Hypertrophy',
};

// Slope labels
export const SLOPE_LABELS = {
  0: 'Upsloping',
  1: 'Flat',
  2: 'Downsloping',
};

// Thal labels
export const THAL_LABELS = {
  0: 'Normal',
  1: 'Fixed Defect',
  2: 'Reversible Defect',
  3: 'Unknown',
};

// Recommendations based on risk
export const getRecommendations = (probability, formData) => {
  const recs = [];
  const risk = getRiskLevel(probability);

  if (risk.level === 'High') {
    recs.push({ icon: '🏥', text: 'Consult a cardiologist immediately for a comprehensive evaluation.', priority: 'urgent' });
    recs.push({ icon: '💊', text: 'Discuss medication options with your doctor to manage risk factors.', priority: 'high' });
  }

  if (formData?.cholesterol > 200) {
    recs.push({ icon: '🥗', text: 'Reduce saturated fat and cholesterol intake. Include more fruits, vegetables, and whole grains.', priority: 'high' });
  }

  if (formData?.trestbps > 130) {
    recs.push({ icon: '🧂', text: 'Limit sodium intake to less than 2,300 mg per day to help lower blood pressure.', priority: 'high' });
  }

  if (formData?.smoking === 1) {
    recs.push({ icon: '🚭', text: 'Quit smoking immediately. Smoking significantly increases heart disease risk.', priority: 'urgent' });
  }

  if (formData?.alcohol === 1) {
    recs.push({ icon: '🍷', text: 'Limit alcohol consumption. Excessive drinking raises blood pressure and heart disease risk.', priority: 'medium' });
  }

  if (formData?.exercise_frequency < 3) {
    recs.push({ icon: '🏃', text: 'Aim for at least 150 minutes of moderate aerobic exercise per week.', priority: 'medium' });
  }

  if (formData?.stress_level > 6) {
    recs.push({ icon: '🧘', text: 'Practice stress management techniques like meditation, yoga, or deep breathing exercises.', priority: 'medium' });
  }

  if (formData?.sleep_hours < 7) {
    recs.push({ icon: '😴', text: 'Aim for 7-9 hours of quality sleep per night. Poor sleep increases cardiovascular risk.', priority: 'medium' });
  }

  // Always add general recommendations
  recs.push({ icon: '💧', text: 'Stay hydrated by drinking 8-10 glasses of water daily.', priority: 'low' });
  recs.push({ icon: '📊', text: 'Monitor your blood pressure and cholesterol levels regularly.', priority: 'low' });
  recs.push({ icon: '🍎', text: 'Follow a heart-healthy diet rich in omega-3 fatty acids, fiber, and antioxidants.', priority: 'low' });

  return recs;
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');
