import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, AlertTriangle, CheckCircle, Download, Printer,
  ArrowLeft, Activity, TrendingUp, Shield, Phone, Info, Siren, CalendarHeart, MapPin
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { getRiskLevel, getHealthScore, getRecommendations, formatDate, generateReportId } from '../utils/helpers';
import { generatePDF } from '../utils/pdfGenerator';
import { predictionService } from '../services/predictionService';

const RiskGauge = ({ probability }) => {
  const percentage = Math.round(probability * 100);
  const data = [{ value: percentage, fill: probability >= 0.6 ? '#ef4444' : probability >= 0.3 ? '#f59e0b' : '#22c55e' }];

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={200} height={120}>
        <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={[{ value: 100, fill: '#f3f4f6' }, ...data]}>
          <RadialBar dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center -mt-8">
        <div className={`text-4xl font-bold ${probability >= 0.6 ? 'text-red-500' : probability >= 0.3 ? 'text-yellow-500' : 'text-green-500'}`}>
          {percentage}%
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Risk Probability</div>
      </div>
    </div>
  );
};

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const { result, formData } = location.state || {};

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Results Found</h2>
        <p className="text-gray-500">Please complete a prediction first.</p>
        <Button onClick={() => navigate('/predict')}>Start Prediction</Button>
      </div>
    );
  }

  const probability = result.probability;
  const riskInfo = getRiskLevel(probability);
  const healthScore = getHealthScore(probability);
  const recommendations = getRecommendations(probability, formData);
  const reportId = generateReportId();
  const reportDate = new Date().toISOString();

  const pieData = [
    { name: 'Disease Risk', value: Math.round(probability * 100) },
    { name: 'Healthy', value: Math.round((1 - probability) * 100) },
  ];
  const PIE_COLORS = ['#ef4444', '#22c55e'];

  const comparisonData = [
    {
      name: 'Cholesterol',
      patient: formData?.chol || 0,
      healthy: 200,
      unit: 'mg/dL',
    },
    {
      name: 'Blood Pressure',
      patient: formData?.trestbps || 0,
      healthy: 120,
      unit: 'mmHg',
    },
    {
      name: 'Max Heart Rate',
      patient: formData?.thalach || 0,
      healthy: 150,
      unit: 'bpm',
    },
    {
      name: 'ST Depression',
      patient: (formData?.oldpeak || 0) * 10,
      healthy: 10,
      unit: '×10',
    },
  ];

  const featureImportance = result.feature_importance || [
    { feature: 'Chest Pain Type', importance: 0.18 },
    { feature: 'Max Heart Rate', importance: 0.15 },
    { feature: 'ST Depression', importance: 0.14 },
    { feature: 'Major Vessels', importance: 0.13 },
    { feature: 'Thalassemia', importance: 0.12 },
    { feature: 'Age', importance: 0.10 },
    { feature: 'Exercise Angina', importance: 0.09 },
    { feature: 'Cholesterol', importance: 0.09 },
  ];

  const handleDownloadPDF = () => {
    predictionService.downloadReport(result.id).catch(() => {
      generatePDF({ result, formData, reportId, reportDate, riskInfo, healthScore, recommendations });
    });
  };

  const handlePrint = () => window.print();
  const isHighRisk = riskInfo.level === 'High' || probability >= 0.6;
  const doctorConsultationMessages = isHighRisk
    ? [
        'High risk of heart disease detected.',
        'Please consult a cardiologist immediately.',
        'This AI prediction is not a replacement for professional medical diagnosis.',
        'Seek medical attention as early as possible.',
      ]
    : [
        'Current prediction indicates low risk.',
        'Regular medical checkups are still recommended.',
        'Please consult a healthcare professional for accurate clinical evaluation.',
        'Machine learning predictions may not detect every medical condition.',
        'If symptoms persist, consult a doctor immediately.',
      ];

  return (
    <div className="max-w-5xl mx-auto space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/predict')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          New Prediction
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            Print
          </Button>
          <Button onClick={handleDownloadPDF} leftIcon={<Download className="w-4 h-4" />}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-8 text-white relative overflow-hidden ${
          riskInfo.level === 'High' ? 'gradient-danger' :
          riskInfo.level === 'Moderate' ? 'gradient-warning' : 'gradient-success'
        }`}
      >
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <Heart className="w-full h-full" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {isHighRisk ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <CheckCircle className="w-8 h-8" />
                )}
                <div>
                  <p className="text-white/80 text-sm font-medium">AI Prediction Result</p>
                  <h1 className="text-3xl font-bold">
                    {isHighRisk ? 'High Cardiac Risk Detected' :
                     riskInfo.level === 'Moderate' ? 'Moderate Risk Detected' :
                     'Current Low-Risk Pattern'}
                  </h1>
                  <p className="text-sm text-white/90 mt-1">
                    Preliminary AI assessment only. Clinical diagnosis requires a licensed healthcare professional.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-white/70 text-xs">Risk Level</p>
                  <p className="font-bold text-lg">{riskInfo.label}</p>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-white/70 text-xs">Health Score</p>
                  <p className="font-bold text-lg">{healthScore}/100</p>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-white/70 text-xs">Model Used</p>
                  <p className="font-bold text-lg">{result.model_used || 'Random Forest'}</p>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-white/70 text-xs">Accuracy</p>
                  <p className="font-bold text-lg">{result.model_accuracy ? `${(result.model_accuracy * 100).toFixed(1)}%` : '94.2%'}</p>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <RiskGauge probability={probability} />
            </div>
          </div>

          {/* Emergency warning */}
          {isHighRisk && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 bg-red-950/30 border border-red-200/40 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Siren className="w-6 h-6 flex-shrink-0 emergency-pulse" />
                  <span className="medical-warning-flash absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-300" />
                </div>
                <div>
                  <p className="font-bold">Emergency Warning Section</p>
                  <p className="text-sm text-white/90">
                    High risk of heart disease detected. Please consult a cardiologist immediately. Seek urgent care for chest pain, shortness of breath, severe fatigue, or dizziness.
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 bg-white text-red-700 hover:bg-red-100 font-bold consultation-highlight"
                onClick={() => navigate('/consultation')}
                leftIcon={<CalendarHeart className="w-4 h-4" />}
              >
                Book Medical Consultation
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Prediction status and advisory */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Status & Doctor Consultation Advisory</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This result is a supportive AI estimate and not a final medical diagnosis.
          </p>
        </CardHeader>
        <CardContent>
          <div className={`rounded-2xl border p-5 ${
            isHighRisk
              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          }`}>
            <div className="flex items-start gap-3">
              {isHighRisk ? (
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
              ) : (
                <Info className="w-6 h-6 text-blue-600 mt-0.5" />
              )}
              <div className="space-y-1.5">
                {doctorConsultationMessages.map((msg) => (
                  <p
                    key={msg}
                    className={`text-sm ${
                      isHighRisk
                        ? 'text-red-800 dark:text-red-300'
                        : 'text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    • {msg}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/consultation')}
                variant={isHighRisk ? 'danger' : 'primary'}
                leftIcon={<Phone className="w-4 h-4" />}
                className={isHighRisk ? 'consultation-highlight' : ''}
              >
                Consult Doctor
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/consultation')}
                leftIcon={<CalendarHeart className="w-4 h-4" />}
              >
                Contact Healthcare Professional
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency / caution and next steps */}
      <Card>
        <CardHeader>
          <CardTitle>{isHighRisk ? 'Emergency Advisory & Next Steps' : 'Caution Advisory & Health Monitoring'}</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Follow these actions while arranging professional clinical review.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 border ${
              isHighRisk
                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            }`}>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                {isHighRisk ? 'Recommended Next Medical Steps' : 'Preventive Medical Cross-Check'}
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {isHighRisk ? (
                  <>
                    <li>• Arrange same-day cardiology consultation.</li>
                    <li>• Carry this report and recent medical records.</li>
                    <li>• Request ECG, blood panel, and physician-led evaluation.</li>
                    <li>• Seek emergency care if severe symptoms occur.</li>
                  </>
                ) : (
                  <>
                    <li>• Continue periodic clinical checkups.</li>
                    <li>• Recheck blood pressure, lipids, and sugar profile.</li>
                    <li>• Review family history risk with a physician.</li>
                    <li>• Repeat evaluation if symptoms appear or persist.</li>
                  </>
                )}
              </ul>
            </div>
            <div className={`rounded-xl p-4 border ${
              isHighRisk
                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800'
            }`}>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                {isHighRisk ? 'Lifestyle Restriction Suggestions' : 'Preventive Health Suggestions'}
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {isHighRisk ? (
                  <>
                    <li>• Avoid smoking and alcohol until clinical review.</li>
                    <li>• Avoid heavy exertion without doctor guidance.</li>
                    <li>• Prefer low-sodium, low-saturated-fat diet.</li>
                    <li>• Maintain strict medication adherence if prescribed.</li>
                  </>
                ) : (
                  <>
                    <li>• Maintain balanced diet and regular physical activity.</li>
                    <li>• Keep stress and sleep patterns under routine monitoring.</li>
                    <li>• Track blood pressure/cholesterol trends monthly.</li>
                    <li>• Discuss prevention plan with your healthcare provider.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          {isHighRisk && (
            <div className="mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">Nearby Emergency Help (Placeholder)</p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Emergency facility finder and hotline integrations can be connected here in the next module.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Report ID: {reportId} • {formatDate(reportDate)}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Patient Name', value: formData?.patient_name || result.patient_name },
              { label: 'Age', value: `${formData?.age} years` },
              { label: 'Gender', value: formData?.sex === 1 ? 'Male' : 'Female' },
              { label: 'Prediction Date', value: formatDate(reportDate) },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Disease risk vs healthy probability</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Patient vs Healthy Range</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your values compared to healthy benchmarks</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="patient" name="Your Value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="healthy" name="Healthy Range" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <CardTitle>AI Feature Importance</CardTitle>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Factors that most influenced this prediction</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featureImportance.map((item, i) => (
              <div key={item.feature} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4 text-right">{i + 1}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 w-40 flex-shrink-0">{item.feature}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.importance * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-10 text-right">
                  {(item.importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <CardTitle>AI Health Recommendations</CardTitle>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personalized advice based on your health data</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  rec.priority === 'urgent' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                  rec.priority === 'high' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                  'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{rec.icon}</span>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rec.text}</p>
                  <Badge
                    variant={rec.priority === 'urgent' ? 'danger' : rec.priority === 'high' ? 'warning' : rec.priority === 'medium' ? 'warning' : 'success'}
                    className="mt-2"
                  >
                    {rec.priority === 'urgent' ? '🚨 Urgent' : rec.priority === 'high' ? '⚠️ High Priority' : rec.priority === 'medium' ? '📌 Recommended' : '✅ General'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Values Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle>Clinical Values Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Blood Pressure', value: `${formData?.trestbps} mmHg`, normal: formData?.trestbps <= 120, unit: '≤120 normal' },
              { label: 'Cholesterol', value: `${formData?.chol} mg/dL`, normal: formData?.chol <= 200, unit: '≤200 normal' },
              { label: 'Max Heart Rate', value: `${formData?.thalach} bpm`, normal: formData?.thalach >= 100, unit: '≥100 normal' },
              { label: 'ST Depression', value: formData?.oldpeak, normal: formData?.oldpeak <= 1, unit: '≤1.0 normal' },
              { label: 'Fasting Blood Sugar', value: formData?.fbs === 1 ? '>120 mg/dL' : '≤120 mg/dL', normal: formData?.fbs === 0, unit: '≤120 normal' },
              { label: 'Major Vessels', value: `${formData?.ca} vessel(s)`, normal: formData?.ca === 0, unit: '0 is normal' },
              { label: 'Stress Level', value: `${formData?.stress_level}/10`, normal: formData?.stress_level <= 5, unit: '≤5 normal' },
              { label: 'Sleep Hours', value: `${formData?.sleep_hours} hrs`, normal: formData?.sleep_hours >= 7, unit: '7-9 hrs normal' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 border ${item.normal ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className={`font-bold text-lg ${item.normal ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>
                <span className={`text-xs font-semibold ${item.normal ? 'text-green-600' : 'text-red-600'}`}>
                  {item.normal ? '✓ Normal' : '⚠ Abnormal'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
          <strong>Disclaimer:</strong> This prediction system is based on machine learning analysis and is intended only for educational and preliminary assessment purposes.
          It should not be considered a substitute for professional medical diagnosis, treatment, or consultation.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center pb-6">
        <Button onClick={() => navigate('/predict')} leftIcon={<Activity className="w-4 h-4" />}>
          New Prediction
        </Button>
        <Button variant="secondary" onClick={() => navigate('/history')} leftIcon={<TrendingUp className="w-4 h-4" />}>
          View History
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} leftIcon={<Download className="w-4 h-4" />}>
          Download PDF Report
        </Button>
      </div>
    </div>
  );
};

export default ResultsPage;
