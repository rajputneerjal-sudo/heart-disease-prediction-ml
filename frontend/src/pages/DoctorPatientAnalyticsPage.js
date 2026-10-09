import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { doctorService } from '../services/doctorService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const DoctorPatientAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', min_age: '', max_age: '', risk_level: '' });
  
  // Load analytics with only non-empty filters
  const load = () => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );
    doctorService.getAnalytics(activeFilters).then(setAnalytics).catch(() => {});
  };
  
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const dist = analytics?.prediction_distribution || { high: 0, moderate: 0, low: 0 };
  const pie = [{ name: 'High', value: dist.high }, { name: 'Moderate', value: dist.moderate }, { name: 'Low', value: dist.low }];
  const trend = analytics?.daily_trend || [];
  const heat = analytics?.risk_heatmap || [];
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== null && value !== undefined);
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({ start_date: '', end_date: '', min_age: '', max_age: '', risk_level: '' });
    doctorService.getAnalytics({}).then(setAnalytics).catch(() => {});
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patient Analytics</h1>
        {hasActiveFilters && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Filters Active - Showing filtered results
          </div>
        )}
        {!hasActiveFilters && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing all patients
          </div>
        )}
      </div>
      <Card><CardHeader><CardTitle>Cohort Filters</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Input label="Start Date" type="date" value={filters.start_date} onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value }))} />
        <Input label="End Date" type="date" value={filters.end_date} onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value }))} />
        <Input label="Min Age" type="number" value={filters.min_age} onChange={(e) => setFilters((p) => ({ ...p, min_age: e.target.value }))} />
        <Input label="Max Age" type="number" value={filters.max_age} onChange={(e) => setFilters((p) => ({ ...p, max_age: e.target.value }))} />
        <Input label="Risk Level" placeholder="Low/Moderate/High" value={filters.risk_level} onChange={(e) => setFilters((p) => ({ ...p, risk_level: e.target.value }))} />
        <div className="col-span-2 md:col-span-5 flex gap-3">
          <Button onClick={load}>Apply Cohort Filter</Button>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
          )}
        </div>
      </CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader><CardContent>
          {analytics && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div>Total Patients: {analytics.total_patients || 0}</div>
              <div>Total Predictions: {analytics.total_predictions || 0}</div>
              <div>High Risk: {analytics.high_risk_patients || 0}</div>
            </div>
          )}
          <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={pie} dataKey="value" outerRadius={95}>{pie.map((_, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#22c55e'][i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Risk Comparison</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><BarChart data={pie}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Daily Trend</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><BarChart data={trend}><XAxis dataKey="date" hide /><YAxis /><Tooltip /><Bar dataKey="count" fill="#0ea5e9" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Risk Heatmap (Hour x Weekday)</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Shows when predictions are made throughout the week. Darker colors indicate more activity.
            </div>
            <div className="flex gap-2">
              {/* Y-axis labels (Hours) */}
              <div className="flex flex-col justify-between text-xs text-gray-500 py-1">
                {[0, 6, 12, 18, 23].map(hour => (
                  <div key={hour} className="h-5 flex items-center">
                    {hour}:00
                  </div>
                ))}
              </div>
              {/* Heatmap grid */}
              <div className="flex-1">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-xs text-center text-gray-500 font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {heat.slice(0, 24).map((row, hour) => 
                    row.map((val, day) => {
                      const intensity = Math.min(0.95, val / 10);
                      const displayHour = hour.toString().padStart(2, '0');
                      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      return (
                        <div 
                          key={`${hour}-${day}`} 
                          title={`${dayNames[day]} ${displayHour}:00 - ${val} prediction${val !== 1 ? 's' : ''}`}
                          className="h-5 rounded cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all" 
                          style={{ 
                            background: val > 0 
                              ? `rgba(239, 68, 68, ${intensity})` 
                              : 'rgba(100, 116, 139, 0.1)'
                          }} 
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Activity:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ background: 'rgba(100, 116, 139, 0.1)' }}></div>
                <span>None</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ background: 'rgba(239, 68, 68, 0.3)' }}></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ background: 'rgba(239, 68, 68, 0.6)' }}></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ background: 'rgba(239, 68, 68, 0.9)' }}></div>
                <span>High</span>
              </div>
            </div>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default DoctorPatientAnalyticsPage;
