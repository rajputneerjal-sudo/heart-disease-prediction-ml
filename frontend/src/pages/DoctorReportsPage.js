import React, { useEffect, useState } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { doctorService } from '../services/doctorService';
import { predictionService } from '../services/predictionService';

const DoctorReportsPage = () => {
  const [search, setSearch] = useState('');
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [reports, setReports] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [audits, setAudits] = useState([]);
  const [binRows, setBinRows] = useState([]);
  const [expandedPredictionId, setExpandedPredictionId] = useState(null);

  const load = () => Promise.all([
    doctorService.getPatientReports({ search, highRiskOnly }),
    doctorService.getReportHistory({ patientName: search }),
    doctorService.getReportAudit(),
    doctorService.getDeletedPatientReports({ search }),
  ]).then(([r, h, a, b]) => {
    setReports(r || []);
    setHistoryRows(h || []);
    setAudits(a || []);
    setBinRows(b || []);
  }).catch(() => {
    setReports([]);
    setHistoryRows([]);
    setAudits([]);
    setBinRows([]);
  });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Patient Reports</h1>
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div className="w-full md:w-80"><Input label="Search patient" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={highRiskOnly} onChange={(e) => setHighRiskOnly(e.target.checked)} /> High risk only</label>
          <Button onClick={load}>Apply Filters</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Prediction Records</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Patient</th><th>Total Predictions</th><th>Probability</th><th>Risk</th><th>Date</th><th>View Data</th><th>Report</th><th>Delete</th></tr></thead>
              <tbody>
                {reports.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr className="border-b">
                      <td className="py-2">{r.patient_name}</td>
                      <td>{r.total_predictions_for_patient}</td>
                      <td>{Math.round(r.probability * 100)}%</td>
                      <td>{r.risk_level}</td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setExpandedPredictionId((prev) => (prev === r.id ? null : r.id))}
                        >
                          {expandedPredictionId === r.id ? 'Hide Data' : 'View Data'}
                        </Button>
                      </td>
                      <td><Button size="sm" variant="outline" onClick={() => predictionService.downloadReport(r.id)}>Download PDF</Button></td>
                      <td><Button size="sm" variant="danger" onClick={async () => { await doctorService.deletePatientReport(r.id); await load(); }}>Delete</Button></td>
                    </tr>
                    {expandedPredictionId === r.id && (
                      <tr className="border-b bg-gray-50/40 dark:bg-gray-800/30">
                        <td className="py-3" colSpan={8}>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            <div className="font-semibold text-sm col-span-full">Clinical & Lifestyle Input Data</div>
                            <div><span className="text-gray-500">Age:</span> {r.age}</div>
                            <div><span className="text-gray-500">Gender:</span> {r.sex === 1 ? 'Male' : 'Female'}</div>
                            <div><span className="text-gray-500">Chest Pain Type:</span> {r.cp}</div>
                            <div><span className="text-gray-500">Resting BP:</span> {r.trestbps}</div>
                            <div><span className="text-gray-500">Cholesterol:</span> {r.chol}</div>
                            <div><span className="text-gray-500">Fasting Blood Sugar:</span> {r.fbs}</div>
                            <div><span className="text-gray-500">Rest ECG:</span> {r.restecg}</div>
                            <div><span className="text-gray-500">Max Heart Rate:</span> {r.thalach}</div>
                            <div><span className="text-gray-500">Exercise Angina:</span> {r.exang}</div>
                            <div><span className="text-gray-500">Oldpeak:</span> {r.oldpeak}</div>
                            <div><span className="text-gray-500">Slope:</span> {r.slope}</div>
                            <div><span className="text-gray-500">CA:</span> {r.ca}</div>
                            <div><span className="text-gray-500">Thal:</span> {r.thal}</div>
                            <div><span className="text-gray-500">Smoking:</span> {r.smoking ? 'Yes' : 'No'}</div>
                            <div><span className="text-gray-500">Alcohol:</span> {r.alcohol ? 'Yes' : 'No'}</div>
                            <div><span className="text-gray-500">Stress Level:</span> {r.stress_level}</div>
                            <div><span className="text-gray-500">Sleep Hours:</span> {r.sleep_hours}</div>
                            <div><span className="text-gray-500">Exercise Frequency:</span> {r.exercise_frequency}/week</div>
                            <div className="font-semibold text-sm col-span-full mt-2">Health Stats</div>
                            <div><span className="text-gray-500">Risk Probability:</span> {Math.round(r.probability * 100)}%</div>
                            <div><span className="text-gray-500">Risk Level:</span> {r.risk_level}</div>
                            <div><span className="text-gray-500">Health Score:</span> {r.health_score}/100</div>
                            <div><span className="text-gray-500">Model:</span> {r.model_used}</div>
                            <div><span className="text-gray-500">Total Predictions:</span> {r.total_predictions_for_patient}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Deleted Records Bin</CardTitle>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                const ok = window.confirm('This will permanently delete all records in the bin and cannot be undone. Continue?');
                if (!ok) return;
                await doctorService.emptyDeletedPatientBin();
                await load();
              }}
              disabled={!binRows.length}
            >
              Empty Bin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Prediction ID</th><th>Patient</th><th>Risk</th><th>Probability</th><th>Deleted At</th><th>Restore</th><th>Delete Permanently</th></tr></thead>
              <tbody>
                {binRows.map((r) => <tr key={r.bin_id} className="border-b"><td className="py-2">{r.prediction_id}</td><td>{r.patient_name}</td><td>{r.risk_level}</td><td>{r.probability === null || r.probability === undefined ? '-' : `${Math.round(r.probability * 100)}%`}</td><td>{new Date(r.deleted_at).toLocaleString()}</td><td><Button size="sm" onClick={async () => { await doctorService.restorePatientReport(r.prediction_id); await load(); }}>Restore</Button></td><td><Button size="sm" variant="danger" onClick={async () => { const ok = window.confirm('This will permanently delete this prediction record and cannot be undone. Continue?'); if (!ok) return; await doctorService.permanentlyDeletePatientReport(r.prediction_id); await load(); }}>Delete Permanently</Button></td></tr>)}
                {!binRows.length && <tr><td className="py-2 text-gray-500" colSpan={7}>No deleted records in bin.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Historical Patient Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Report ID</th><th>Patient</th><th>Risk</th><th>Probability</th><th>Created</th><th>Downloaded</th></tr></thead>
              <tbody>
                {historyRows.map((r) => <tr key={r.report_id} className="border-b"><td className="py-2">{r.report_id}</td><td>{r.patient_name}</td><td>{r.risk_level}</td><td>{r.probability === null || r.probability === undefined ? '-' : `${Math.round(r.probability * 100)}%`}</td><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.downloaded_at ? new Date(r.downloaded_at).toLocaleString() : '-'}</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Download Audit Trail</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Audit ID</th><th>Report</th><th>By User</th><th>Role</th><th>Type</th><th>IP</th><th>When</th></tr></thead>
              <tbody>
                {audits.map((a) => <tr key={a.audit_id} className="border-b"><td className="py-2">{a.audit_id}</td><td>{a.report_id || '-'}</td><td>{a.downloaded_by_user_id || '-'}</td><td>{a.downloader_role}</td><td>{a.download_type}</td><td>{a.ip_address || '-'}</td><td>{new Date(a.created_at).toLocaleString()}</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorReportsPage;
