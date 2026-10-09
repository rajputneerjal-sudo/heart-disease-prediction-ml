import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, Activity, Stethoscope } from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const DoctorDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    Promise.all([doctorService.getAnalytics(), doctorService.getPatientReports({ highRiskOnly: true })])
      .then(([a, r]) => {
        setAnalytics(a);
        setReports(r || []);
      })
      .catch(() => {
        setAnalytics({ total_patients: 0, high_risk_patients: 0, total_predictions: 0, prediction_distribution: { high: 0, moderate: 0, low: 0 } });
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="gradient-health rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-blue-100">Patient monitoring, analytics, and clinical advisory workspace.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[['Total Patients', analytics?.total_patients || 0, Users], ['High Risk', analytics?.high_risk_patients || 0, AlertTriangle], ['Predictions', analytics?.total_predictions || 0, Activity], ['Doctor Panel', 'Active', Stethoscope]].map(([l, v, I]) => (
          <Card key={l}><CardContent className="pt-6"><I className="w-5 h-5 mb-2 text-blue-600" /><p className="text-sm text-gray-500">{l}</p><p className="text-2xl font-bold">{v}</p></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Emergency Risk Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reports.slice(0, 8).map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
              <div>
                <p className="font-semibold">{r.patient_name}</p>
                <p className="text-xs text-red-700 dark:text-red-300">High risk probability: {Math.round(r.probability * 100)}%</p>
              </div>
              <Button size="sm" variant="danger">Critical</Button>
            </div>
          ))}
          {!reports.length && <p className="text-sm text-gray-500">No high-risk alerts right now.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboardPage;
