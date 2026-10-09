import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, BarChart3, Shield, Trash2, Eye, TrendingUp, Database, AlertCircle } from 'lucide-react';
import { adminService } from '../services/adminService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import { formatDate, getRiskLevel } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2563EB', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];

const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, predsData, logsData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getAllPredictions(),
        adminService.getSystemLogs(),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
      setPredictions(predsData.predictions || []);
      setLogs(logsData.logs || []);
    } catch (err) {
      setError('Failed to load admin data. Using demo data.');
      // Demo data
      setStats({
        total_users: 1247, total_predictions: 8934, high_risk_count: 2341,
        low_risk_count: 6593, avg_accuracy: 0.942, new_users_today: 23,
        predictions_today: 156,
      });
      setUsers([
        { id: 1, full_name: 'John Smith', email: 'john@example.com', role: 'patient', created_at: new Date().toISOString(), prediction_count: 5 },
        { id: 2, full_name: 'Jane Doe', email: 'jane@example.com', role: 'patient', created_at: new Date().toISOString(), prediction_count: 3 },
        { id: 3, full_name: 'Admin User', email: 'admin@cardioai.com', role: 'admin', created_at: new Date().toISOString(), prediction_count: 0 },
      ]);
      setPredictions([]);
      setLogs([
        { id: 1, action: 'User Login', user: 'john@example.com', timestamp: new Date().toISOString(), status: 'success' },
        { id: 2, action: 'Prediction Made', user: 'jane@example.com', timestamp: new Date().toISOString(), status: 'success' },
        { id: 3, action: 'Failed Login', user: 'unknown@test.com', timestamp: new Date().toISOString(), status: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await adminService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  const riskDistData = stats ? [
    { name: 'High Risk', value: stats.high_risk_count || 0 },
    { name: 'Low Risk', value: stats.low_risk_count || 0 },
    { name: 'Moderate', value: Math.max(0, (stats.total_predictions || 0) - (stats.high_risk_count || 0) - (stats.low_risk_count || 0)) },
  ] : [];

  const weeklyData = [
    { day: 'Mon', predictions: 120, users: 15 },
    { day: 'Tue', predictions: 145, users: 22 },
    { day: 'Wed', predictions: 98, users: 18 },
    { day: 'Thu', predictions: 167, users: 28 },
    { day: 'Fri', predictions: 189, users: 31 },
    { day: 'Sat', predictions: 134, users: 19 },
    { day: 'Sun', predictions: 156, users: 23 },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'predictions', label: 'Predictions', icon: Activity },
    { id: 'logs', label: 'System Logs', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">System management and analytics</p>
        </div>
        <Button onClick={loadData} variant="secondary" size="sm">Refresh Data</Button>
      </div>

      {error && <Alert variant="warning" onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />) : [
          { label: 'Total Users', value: stats?.total_users?.toLocaleString(), icon: Users, color: 'bg-blue-500', sub: `+${stats?.new_users_today} today` },
          { label: 'Total Predictions', value: stats?.total_predictions?.toLocaleString(), icon: Activity, color: 'bg-purple-500', sub: `+${stats?.predictions_today} today` },
          { label: 'High Risk Cases', value: stats?.high_risk_count?.toLocaleString(), icon: AlertCircle, color: 'bg-red-500', sub: `${((stats?.high_risk_count / stats?.total_predictions) * 100).toFixed(1)}% of total` },
          { label: 'Model Accuracy', value: `${((stats?.avg_accuracy || 0.942) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'bg-green-500', sub: 'Random Forest' },
        ].map(stat => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Weekly Activity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="predictions" name="Predictions" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="users" name="New Users" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskDistData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4} dataKey="value">
                    {riskDistData.map((_, i) => <Cell key={i} fill={['#ef4444', '#22c55e', '#f59e0b'][i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management ({users.length} users)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['User', 'Email', 'Role', 'Joined', 'Predictions', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {user.full_name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.role === 'admin' ? 'danger' : 'info'}>{user.role}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="py-3 pr-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{user.prediction_count || 0}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.role !== 'admin' && (
                            <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'predictions' && (
        <Card>
          <CardHeader><CardTitle>All Predictions</CardTitle></CardHeader>
          <CardContent>
            {predictions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No predictions data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      {['Patient', 'User', 'Risk', 'Probability', 'Date'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {predictions.map(pred => {
                      const risk = getRiskLevel(pred.probability);
                      return (
                        <tr key={pred.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-3 pr-4 text-sm font-medium text-gray-900 dark:text-white">{pred.patient_name}</td>
                          <td className="py-3 pr-4 text-sm text-gray-500">{pred.user_email}</td>
                          <td className="py-3 pr-4"><Badge variant={risk.level === 'High' ? 'danger' : risk.level === 'Moderate' ? 'warning' : 'success'}>{risk.label}</Badge></td>
                          <td className="py-3 pr-4 text-sm font-semibold">{Math.round(pred.probability * 100)}%</td>
                          <td className="py-3 text-sm text-gray-500">{formatDate(pred.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader><CardTitle>System Logs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className={`flex items-center gap-4 p-3 rounded-xl border ${log.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700'}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'error' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</span>
                    <span className="text-sm text-gray-500 ml-2">by {log.user}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(log.timestamp)}</span>
                  <Badge variant={log.status === 'error' ? 'danger' : 'success'}>{log.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPage;
