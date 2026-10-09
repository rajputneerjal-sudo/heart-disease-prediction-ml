import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, Search, Filter, Eye, Trash2, Download, Heart, Calendar, TrendingUp } from 'lucide-react';
import { predictionService } from '../services/predictionService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import { formatDate, getRiskLevel, getHealthScore } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await predictionService.getHistory(page, 10);
      setPredictions(data.predictions || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to load prediction history.');
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prediction record?')) return;
    try {
      await predictionService.deletePrediction(id);
      setPredictions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete prediction.');
    }
  };

  const handleDownload = async (id) => {
    try {
      await predictionService.downloadReport(id);
    } catch (_err) {
      setError('Unable to download report at the moment.');
    }
  };

  const filtered = predictions.filter(p => {
    const matchSearch = p.patient_name?.toLowerCase().includes(search.toLowerCase());
    const risk = getRiskLevel(p.probability);
    const matchFilter = filter === 'all' || risk.level.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  const trendData = predictions.slice(0, 10).reverse().map((p, i) => ({
    index: i + 1,
    score: getHealthScore(p.probability),
    date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" /> Prediction History
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your heart health over time</p>
        </div>
        <Button onClick={() => navigate('/predict')} leftIcon={<Heart className="w-4 h-4" />}>
          New Prediction
        </Button>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Trend Chart */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <CardTitle>Health Score Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/100`, 'Health Score']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'low', 'moderate', 'high'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f === 'all' ? 'All' : `${f} Risk`}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <History className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium text-lg">No predictions found</p>
              <p className="text-sm mt-1">
                {search || filter !== 'all' ? 'Try adjusting your filters' : 'Make your first prediction to see history'}
              </p>
              {!search && filter === 'all' && (
                <Button className="mt-4" onClick={() => navigate('/predict')}>
                  Start First Prediction
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['Patient', 'Date', 'Risk Level', 'Probability', 'Health Score', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filtered.map((pred, i) => {
                    const risk = getRiskLevel(pred.probability);
                    const score = getHealthScore(pred.probability);
                    return (
                      <motion.tr
                        key={pred.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                              {pred.patient_name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{pred.patient_name}</p>
                              <p className="text-xs text-gray-400">Age: {pred.age}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(pred.created_at)}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={risk.level === 'High' ? 'danger' : risk.level === 'Moderate' ? 'warning' : 'success'} dot>
                            {risk.label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-full rounded-full ${risk.level === 'High' ? 'bg-red-500' : risk.level === 'Moderate' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.round(pred.probability * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {Math.round(pred.probability * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`font-bold text-sm ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {score}/100
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/history/${pred.id}`)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(pred.id)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                              title="Download Report"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(pred.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 10 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500">Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;
