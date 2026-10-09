import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PageLoader } from './components/ui/LoadingSpinner';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ConsultationPage from './pages/ConsultationPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorPatientAnalyticsPage from './pages/DoctorPatientAnalyticsPage';
import DoctorReportsPage from './pages/DoctorReportsPage';
import DoctorRecommendationPage from './pages/DoctorRecommendationPage';

// Education Pages
import HeartGuide from './pages/education/HeartGuide';
import PreventionTips from './pages/education/PreventionTips';
import EmergencySigns from './pages/education/EmergencySigns';
import FAQPage from './pages/education/FAQPage';

// Protected Route
const getDefaultRoute = (role) => {
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'admin') return '/admin';
  return '/dashboard';
};

const ProtectedRoute = ({ children, adminOnly = false, doctorOnly = false, patientOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader message="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to={getDefaultRoute(user.role)} replace />;
  if (doctorOnly && user.role !== 'doctor') return <Navigate to={getDefaultRoute(user.role)} replace />;
  if (patientOnly && user.role !== 'patient') return <Navigate to={getDefaultRoute(user.role)} replace />;
  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={getDefaultRoute(user.role)} replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Protected dashboard routes */}
    <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<ProtectedRoute patientOnly><DashboardPage /></ProtectedRoute>} />
      <Route path="predict" element={<ProtectedRoute patientOnly><PredictionPage /></ProtectedRoute>} />
      <Route path="results" element={<ProtectedRoute patientOnly><ResultsPage /></ProtectedRoute>} />
      <Route path="history" element={<ProtectedRoute patientOnly><HistoryPage /></ProtectedRoute>} />
      <Route path="history/:id" element={<ProtectedRoute patientOnly><HistoryPage /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute patientOnly><HistoryPage /></ProtectedRoute>} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="consultation" element={<ConsultationPage />} />
      <Route path="doctor/dashboard" element={<ProtectedRoute doctorOnly><DoctorDashboardPage /></ProtectedRoute>} />
      <Route path="doctor/analytics" element={<ProtectedRoute doctorOnly><DoctorPatientAnalyticsPage /></ProtectedRoute>} />
      <Route path="doctor/reports" element={<ProtectedRoute doctorOnly><DoctorReportsPage /></ProtectedRoute>} />
      <Route path="doctor/recommendations" element={<ProtectedRoute doctorOnly><DoctorRecommendationPage /></ProtectedRoute>} />

      {/* Education routes */}
      <Route path="education/guide" element={<HeartGuide />} />
      <Route path="education/prevention" element={<PreventionTips />} />
      <Route path="education/emergency" element={<EmergencySigns />} />
      <Route path="education/faq" element={<FAQPage />} />

      {/* Admin routes */}
      <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="admin/analytics" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="admin/logs" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
    </Route>

    {/* Catch all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
