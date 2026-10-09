import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, Heart, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Zap, Shield, Award, BarChart2
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { predictionService } from '../services/predictionService';
import { doctorService } from '../services/doctorService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { formatDateShort, getRiskLevel, getHealthScore } from '../utils/helpers';

const COLORS = ['#ef4444', '#22c55e', '#f59e0b'];

const healthTips = [
  { icon: '🥗', tip: 'Eat a heart-healthy diet rich in fruits, vegetables, and whole grains.' },
  { icon: '🏃', tip: 'Exercise for at least 30 minutes most days of the week.' },
  { icon: '😴', tip: 'Get 7-9 hours of quality sleep each night.' },
  { icon: '🧘', tip: 'Practice stress management through meditation or yoga.' },
  { icon: '💧', tip: 'Stay hydrated — drink 8-10 glasses of water daily.' },
  { icon: '🚭', tip: 'Avoid smoking and limit alcohol consumption.' },
  { icon: '📊', tip: 'Monitor your blood pressure and cholesterol regularly.' },
  { icon: '🤝', tip: 'Maintain social connections — loneliness affects heart health.' },
];

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, loading }) => {
  if (loading) return <CardSkeleton />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </motion.div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [doctorRecommendations, setDoctorRecommendations] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          predictionService.getDashboardStats(),
          predictionService.getHistory(1, 5),
        ]);
        setStats(statsData);
        setHistory(historyData.predictions || []);
        try {
          const recs = await doctorService.getPatientRecommendations();
          setDoctorRecommendations(recs || []);
        } catch (_) {
          setDoctorRecommendations([]);
        }
      } catch (err) {
        // Use demo data if API not available
        setStats({
          total_predictions: 12,
          high_risk_count: 3,
          low_risk_count: 9,
          avg_health_score: 72,
          latest_risk: 0.35,
          risk_trend: -5,
        });
        setHistory([]);
        setDoctorRecommendations([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const tipTimer = setInterval(() => setTipIndex(i => (i + 1) % healthTips.length), 5000);
    return () => clearInterval(tipTimer);
  }, []);

  const riskData = stats ? [
    { name: 'High Risk', value: stats.high_risk_count || 0 },
    { name: 'Low Risk', value: stats.low_risk_count || 0 },
    { name: 'Moderate', value: Math.max(0, (stats.total_predictions || 0) - (stats.high_risk_count || 0) - (stats.low_risk_count || 0)) },
  ] : [];

  const trendData = [
    { month: 'Jan', score: 65 }, { month: 'Feb', score: 68 }, { month: 'Mar', score: 72 },
    { month: 'Apr', score: 70 }, { month: 'May', score: 75 }, { month: 'Jun', score: stats?.avg_health_score || 72 },
  ];

  const latestRisk = stats?.latest_risk || 0;
  const riskInfo = getRiskLevel(latestRisk);
  const healthScore = getHealthScore(latestRisk);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-health rounded-2xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <Heart className="w-full h-full" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-blue-100">Monitor your heart health and stay ahead of cardiovascular risks.</p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/predict')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-white text-blue-700 hover:bg-blue-50 border-0 flex-shrink-0"
          >
            New Prediction
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Predictions"
          value={stats?.total_predictions || 0}
          subtitle="All time"
          icon={Activity}
          color="bg-blue-500"
          trend={12}
          loading={loading}
        />
        <StatCard
          title="Health Score"
          value={`${stats?.avg_health_score || healthScore}/100`}
          subtitle="Current average"
          icon={Heart}
          color="bg-red-500"
          trend={stats?.risk_trend || 0}
          loading={loading}
        />
        <StatCard
          title="High Risk Alerts"
          value={stats?.high_risk_count || 0}
          subtitle="Require attention"
          icon={AlertTriangle}
          color="bg-yellow-500"
          loading={loading}
        />
        <StatCard
          title="Low Risk Results"
          value={stats?.low_risk_count || 0}
          subtitle="Healthy predictions"
          icon={CheckCircle}
          color="bg-green-500"
          trend={8}
          loading={loading}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Trend */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Health Score Trend</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your heart health over time</p>
                </div>
                <Badge variant="info">Last 6 months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [`${v}/100`, 'Health Score']}
                  />
                  <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: '#2563EB', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All predictions breakdown</p>
          </CardHeader>
          <CardContent>
            {riskData.some(d => d.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {riskData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {riskData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <BarChart2 className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">No predictions yet</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('/predict')}>
                  Make First Prediction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Predictions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Predictions</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/history')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((pred) => {
                    const risk = getRiskLevel(pred.probability);
                    return (
                      <div
                        key={pred.id}
                        onClick={() => navigate(`/history/${pred.id}`)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          risk.level === 'High' ? 'bg-red-100 dark:bg-red-900/30' :
                          risk.level === 'Moderate' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <Heart className={`w-5 h-5 ${
                            risk.level === 'High' ? 'text-red-500' :
                            risk.level === 'Moderate' ? 'text-yellow-500' : 'text-green-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{pred.patient_name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDateShort(pred.created_at)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge variant={risk.level === 'High' ? 'danger' : risk.level === 'Moderate' ? 'warning' : 'success'}>
                            {risk.label}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">{Math.round(pred.probability * 100)}% risk</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Activity className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No predictions yet</p>
                  <p className="text-sm mt-1">Start your first heart health assessment</p>
                  <Button className="mt-4" onClick={() => navigate('/predict')}>
                    Start Prediction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Health Tip + Quick Actions */}
        <div className="space-y-4">
          {/* Daily Tip */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <CardTitle>Daily Health Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4"
              >
                <div className="text-3xl mb-2">{healthTips[tipIndex].icon}</div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{healthTips[tipIndex].tip}</p>
              </motion.div>
              <div className="flex justify-center gap-1 mt-3">
                {healthTips.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTipIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === tipIndex ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { icon: Activity, label: 'New Prediction', path: '/predict', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
                  { icon: Heart, label: 'Ask Health Assistant', action: () => window.dispatchEvent(new Event('open-health-assistant')), color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
                  { icon: Shield, label: 'Prevention Tips', path: '/education/prevention', color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
                  { icon: Award, label: 'Health Guide', path: '/education/guide', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
                  { icon: AlertTriangle, label: 'Emergency Signs', path: '/education/emergency', color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
                ].map(action => (
                  <button
                    key={action.path || action.label}
                    onClick={() => (action.action ? action.action() : navigate(action.path))}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doctor Recommendations</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Advice provided by your doctor</p>
            </CardHeader>
            <CardContent>
              {doctorRecommendations.length ? (
                <div className="space-y-3 max-h-80 overflow-auto pr-1">
                  {doctorRecommendations.map((item) => (
                    <div key={item.recommendation_id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Dr. {item.doctor_name} • {formatDateShort(item.created_at)}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.recommendation_text}</p>
                      {item.emergency_notes && (
                        <p className="text-xs mt-2 text-red-600 dark:text-red-400">Emergency Note: {item.emergency_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">No doctor recommendations available yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
