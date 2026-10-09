import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronRight, ChevronLeft, User, Activity, Stethoscope } from 'lucide-react';
import { predictionService } from '../services/predictionService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import { Card, CardContent } from '../components/ui/Card';

// Tooltip definitions for all medical parameters
const TOOLTIPS = {
  age: 'Age is a significant risk factor. Heart disease risk increases with age, especially after 45 for men and 55 for women.',
  sex: 'Biological sex affects heart disease risk. Men generally have higher risk at younger ages, while women\'s risk increases after menopause.',
  cp: 'Chest pain type indicates the nature of chest discomfort. Typical angina is chest pain caused by reduced blood flow to the heart.',
  trestbps: 'Resting blood pressure is measured when you are at rest. Normal is below 120/80 mmHg. High blood pressure strains the heart.',
  chol: 'Cholesterol is a fatty substance in the blood. High levels (above 200 mg/dL) can clog arteries and increase heart disease risk.',
  fbs: 'Fasting blood sugar above 120 mg/dL may indicate diabetes, which significantly increases cardiovascular risk.',
  restecg: 'Resting ECG measures the electrical activity of your heart at rest. Abnormalities may indicate heart problems.',
  thalach: 'Maximum heart rate achieved during exercise. Lower maximum heart rate may indicate reduced cardiovascular fitness.',
  exang: 'Exercise-induced angina is chest pain that occurs during physical activity, indicating possible coronary artery disease.',
  oldpeak: 'ST depression induced by exercise relative to rest. Higher values indicate more severe heart stress during exercise.',
  slope: 'The slope of the peak exercise ST segment. Downsloping is associated with higher risk of heart disease.',
  ca: 'Number of major coronary vessels colored by fluoroscopy. More blocked vessels indicate higher risk.',
  thal: 'Thalassemia is a blood disorder. Reversible defects in the heart may indicate coronary artery disease.',
  smoking: 'Smoking damages blood vessels and significantly increases the risk of heart disease and stroke.',
  alcohol: 'Excessive alcohol consumption raises blood pressure and can weaken the heart muscle over time.',
  stress_level: 'Chronic stress increases blood pressure and inflammation, contributing to heart disease risk.',
  sleep_hours: 'Poor sleep quality and duration are linked to increased risk of heart disease and hypertension.',
  exercise_frequency: 'Regular physical activity strengthens the heart and reduces cardiovascular risk factors.',
};

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, description: 'Basic patient information' },
  { id: 2, title: 'Clinical Data', icon: Stethoscope, description: 'Medical measurements' },
  { id: 3, title: 'Cardiac Tests', icon: Activity, description: 'Heart test results' },
  { id: 4, title: 'Lifestyle', icon: Heart, description: 'Daily habits & lifestyle' },
];

const initialForm = {
  patient_name: '', age: '', sex: '', cp: '', trestbps: '', chol: '',
  fbs: '', restecg: '', thalach: '', exang: '', oldpeak: '', slope: '',
  ca: '', thal: '', smoking: '', alcohol: '', stress_level: '', sleep_hours: '',
  exercise_frequency: '',
};

const PredictionPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!form.patient_name.trim()) newErrors.patient_name = 'Patient name is required';
      if (!form.age || form.age < 1 || form.age > 120) newErrors.age = 'Valid age (1-120) is required';
      if (!form.sex) newErrors.sex = 'Gender is required';
      if (!form.cp) newErrors.cp = 'Chest pain type is required';
    }
    if (step === 2) {
      if (!form.trestbps || form.trestbps < 60 || form.trestbps > 250) newErrors.trestbps = 'Valid blood pressure (60-250) required';
      if (!form.chol || form.chol < 100 || form.chol > 600) newErrors.chol = 'Valid cholesterol (100-600) required';
      if (form.fbs === '') newErrors.fbs = 'Fasting blood sugar is required';
      if (!form.restecg) newErrors.restecg = 'Resting ECG result is required';
    }
    if (step === 3) {
      if (!form.thalach || form.thalach < 60 || form.thalach > 250) newErrors.thalach = 'Valid max heart rate (60-250) required';
      if (form.exang === '') newErrors.exang = 'Exercise angina is required';
      if (form.oldpeak === '') newErrors.oldpeak = 'ST depression value is required';
      if (!form.slope) newErrors.slope = 'Slope is required';
      if (form.ca === '') newErrors.ca = 'Number of vessels is required';
      if (!form.thal) newErrors.thal = 'Thalassemia type is required';
    }
    if (step === 4) {
      if (form.smoking === '') newErrors.smoking = 'Smoking status is required';
      if (form.alcohol === '') newErrors.alcohol = 'Alcohol status is required';
      if (!form.stress_level || form.stress_level < 1 || form.stress_level > 10) newErrors.stress_level = 'Stress level (1-10) required';
      if (!form.sleep_hours || form.sleep_hours < 1 || form.sleep_hours > 24) newErrors.sleep_hours = 'Sleep hours (1-24) required';
      if (!form.exercise_frequency || form.exercise_frequency < 0 || form.exercise_frequency > 7) newErrors.exercise_frequency = 'Exercise days per week (0-7) required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        patient_name: form.patient_name,
        age: parseInt(form.age),
        sex: parseInt(form.sex),
        cp: parseInt(form.cp),
        trestbps: parseInt(form.trestbps),
        chol: parseInt(form.chol),
        fbs: parseInt(form.fbs),
        restecg: parseInt(form.restecg),
        thalach: parseInt(form.thalach),
        exang: parseInt(form.exang),
        oldpeak: parseFloat(form.oldpeak),
        slope: parseInt(form.slope),
        ca: parseInt(form.ca),
        thal: parseInt(form.thal),
        smoking: parseInt(form.smoking),
        alcohol: parseInt(form.alcohol),
        stress_level: parseInt(form.stress_level),
        sleep_hours: parseFloat(form.sleep_hours),
        exercise_frequency: parseInt(form.exercise_frequency),
      };
      const result = await predictionService.predict(payload);
      navigate('/results', { state: { result, formData: payload } });
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Prediction failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    setForm({
      patient_name: 'John Smith', age: '55', sex: '1', cp: '0',
      trestbps: '140', chol: '250', fbs: '0', restecg: '1',
      thalach: '150', exang: '0', oldpeak: '2.3', slope: '1',
      ca: '1', thal: '2', smoking: '1', alcohol: '0',
      stress_level: '7', sleep_hours: '6', exercise_frequency: '2',
    });
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-500 heartbeat" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Heart Disease Prediction</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Complete all sections for accurate AI analysis</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" onClick={fillSampleData}>
            Fill Sample Data
          </Button>
          <span className="text-sm text-gray-500">Step {step} of {STEPS.length}</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isDone ? 'bg-green-500 text-white' :
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {isDone ? <span className="text-sm">✓</span> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step > s.id ? 'bg-green-400' : 'bg-gray-100 dark:bg-gray-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-6">
          {apiError && (
            <Alert variant="error" className="mb-6" onClose={() => setApiError('')}>
              {apiError}
            </Alert>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Basic patient details for the report</p>
                  </div>
                  <Input
                    label="Patient Name" placeholder="Enter full name"
                    value={form.patient_name} onChange={handleChange('patient_name')}
                    error={errors.patient_name} required
                    tooltip="Full name of the patient for report generation."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Age" type="number" placeholder="e.g. 45" min="1" max="120"
                      value={form.age} onChange={handleChange('age')}
                      error={errors.age} required tooltip={TOOLTIPS.age}
                    />
                    <Select
                      label="Gender" value={form.sex} onChange={handleChange('sex')}
                      error={errors.sex} required tooltip={TOOLTIPS.sex}
                      options={[{ value: '1', label: 'Male' }, { value: '0', label: 'Female' }]}
                      placeholder="Select gender"
                    />
                  </div>
                  <Select
                    label="Chest Pain Type" value={form.cp} onChange={handleChange('cp')}
                    error={errors.cp} required tooltip={TOOLTIPS.cp}
                    options={[
                      { value: '0', label: 'Typical Angina — Chest pain from reduced blood flow' },
                      { value: '1', label: 'Atypical Angina — Chest pain not typical of heart disease' },
                      { value: '2', label: 'Non-Anginal Pain — Chest pain unrelated to heart' },
                      { value: '3', label: 'Asymptomatic — No chest pain symptoms' },
                    ]}
                    placeholder="Select chest pain type"
                  />
                </div>
              )}

              {/* Step 2: Clinical Data */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Clinical Measurements</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Medical test results and measurements</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Resting Blood Pressure (mmHg)" type="number" placeholder="e.g. 120"
                      value={form.trestbps} onChange={handleChange('trestbps')}
                      error={errors.trestbps} required tooltip={TOOLTIPS.trestbps}
                      hint="Normal: 90-120 mmHg"
                    />
                    <Input
                      label="Cholesterol (mg/dL)" type="number" placeholder="e.g. 200"
                      value={form.chol} onChange={handleChange('chol')}
                      error={errors.chol} required tooltip={TOOLTIPS.chol}
                      hint="Normal: below 200 mg/dL"
                    />
                  </div>
                  <Select
                    label="Fasting Blood Sugar > 120 mg/dL" value={form.fbs} onChange={handleChange('fbs')}
                    error={errors.fbs} required tooltip={TOOLTIPS.fbs}
                    options={[
                      { value: '1', label: 'Yes — Blood sugar above 120 mg/dL' },
                      { value: '0', label: 'No — Blood sugar normal (≤120 mg/dL)' },
                    ]}
                    placeholder="Select blood sugar status"
                  />
                  <Select
                    label="Resting ECG Results" value={form.restecg} onChange={handleChange('restecg')}
                    error={errors.restecg} required tooltip={TOOLTIPS.restecg}
                    options={[
                      { value: '0', label: 'Normal — No abnormalities detected' },
                      { value: '1', label: 'ST-T Wave Abnormality — Possible ischemia' },
                      { value: '2', label: 'Left Ventricular Hypertrophy — Enlarged heart muscle' },
                    ]}
                    placeholder="Select ECG result"
                  />
                </div>
              )}

              {/* Step 3: Cardiac Tests */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cardiac Test Results</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Exercise and cardiac evaluation data</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Max Heart Rate (bpm)" type="number" placeholder="e.g. 150"
                      value={form.thalach} onChange={handleChange('thalach')}
                      error={errors.thalach} required tooltip={TOOLTIPS.thalach}
                      hint="Normal: 60-100 bpm at rest"
                    />
                    <Input
                      label="ST Depression (Oldpeak)" type="number" step="0.1" placeholder="e.g. 1.5"
                      value={form.oldpeak} onChange={handleChange('oldpeak')}
                      error={errors.oldpeak} required tooltip={TOOLTIPS.oldpeak}
                      hint="Range: 0.0 - 6.2"
                    />
                  </div>
                  <Select
                    label="Exercise Induced Angina" value={form.exang} onChange={handleChange('exang')}
                    error={errors.exang} required tooltip={TOOLTIPS.exang}
                    options={[
                      { value: '1', label: 'Yes — Chest pain during exercise' },
                      { value: '0', label: 'No — No chest pain during exercise' },
                    ]}
                    placeholder="Select angina status"
                  />
                  <Select
                    label="Slope of Peak Exercise ST Segment" value={form.slope} onChange={handleChange('slope')}
                    error={errors.slope} required tooltip={TOOLTIPS.slope}
                    options={[
                      { value: '0', label: 'Upsloping — Generally favorable' },
                      { value: '1', label: 'Flat — Moderate concern' },
                      { value: '2', label: 'Downsloping — Higher risk indicator' },
                    ]}
                    placeholder="Select slope type"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Major Vessels (0-3)" value={form.ca} onChange={handleChange('ca')}
                      error={errors.ca} required tooltip={TOOLTIPS.ca}
                      options={[
                        { value: '0', label: '0 — No blocked vessels' },
                        { value: '1', label: '1 — One blocked vessel' },
                        { value: '2', label: '2 — Two blocked vessels' },
                        { value: '3', label: '3 — Three blocked vessels' },
                      ]}
                      placeholder="Select vessel count"
                    />
                    <Select
                      label="Thalassemia Type" value={form.thal} onChange={handleChange('thal')}
                      error={errors.thal} required tooltip={TOOLTIPS.thal}
                      options={[
                        { value: '0', label: 'Normal — No defect' },
                        { value: '1', label: 'Fixed Defect — Permanent damage' },
                        { value: '2', label: 'Reversible Defect — Temporary issue' },
                        { value: '3', label: 'Unknown' },
                      ]}
                      placeholder="Select thalassemia type"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Lifestyle */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lifestyle Factors</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Daily habits that affect heart health</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Smoking Habit" value={form.smoking} onChange={handleChange('smoking')}
                      error={errors.smoking} required tooltip={TOOLTIPS.smoking}
                      options={[
                        { value: '1', label: 'Yes — Current smoker' },
                        { value: '0', label: 'No — Non-smoker' },
                      ]}
                      placeholder="Select smoking status"
                    />
                    <Select
                      label="Alcohol Consumption" value={form.alcohol} onChange={handleChange('alcohol')}
                      error={errors.alcohol} required tooltip={TOOLTIPS.alcohol}
                      options={[
                        { value: '1', label: 'Yes — Regular alcohol use' },
                        { value: '0', label: 'No — No alcohol' },
                      ]}
                      placeholder="Select alcohol status"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Stress Level (1-10)" type="number" min="1" max="10" placeholder="e.g. 5"
                      value={form.stress_level} onChange={handleChange('stress_level')}
                      error={errors.stress_level} required tooltip={TOOLTIPS.stress_level}
                      hint="1=Very Low, 10=Extreme"
                    />
                    <Input
                      label="Sleep Hours/Night" type="number" step="0.5" min="1" max="24" placeholder="e.g. 7"
                      value={form.sleep_hours} onChange={handleChange('sleep_hours')}
                      error={errors.sleep_hours} required tooltip={TOOLTIPS.sleep_hours}
                      hint="Recommended: 7-9 hrs"
                    />
                    <Input
                      label="Exercise Days/Week" type="number" min="0" max="7" placeholder="e.g. 3"
                      value={form.exercise_frequency} onChange={handleChange('exercise_frequency')}
                      error={errors.exercise_frequency} required tooltip={TOOLTIPS.exercise_frequency}
                      hint="0=None, 7=Daily"
                    />
                  </div>

                  {/* Summary preview */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-2">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 Prediction Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-400">
                      <span>Patient: <strong>{form.patient_name || '—'}</strong></span>
                      <span>Age: <strong>{form.age || '—'}</strong></span>
                      <span>Cholesterol: <strong>{form.chol || '—'} mg/dL</strong></span>
                      <span>Blood Pressure: <strong>{form.trestbps || '—'} mmHg</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={step === 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              {STEPS.map(s => (
                <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${step === s.id ? 'bg-blue-600 w-6' : step > s.id ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              ))}
            </div>
            {step < STEPS.length ? (
              <Button onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
                variant="danger"
                rightIcon={<Heart className="w-4 h-4" />}
              >
                Analyze Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionPage;
