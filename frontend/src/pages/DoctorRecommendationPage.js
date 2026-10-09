import React, { useEffect, useState } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { doctorService } from '../services/doctorService';

const DoctorRecommendationPage = () => {
  const [form, setForm] = useState({ patient_id: '', recommendation_text: '', emergency_notes: '' });
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');

  const load = () => doctorService.getRecommendations().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    load();
    doctorService.getPatients().then((rows) => setPatients(rows || [])).catch(() => setPatients([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await doctorService.addRecommendation({ ...form, patient_id: Number(form.patient_id) });
      setForm({ patient_id: '', recommendation_text: '', emergency_notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save recommendation.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Doctor Recommendations</h1>
      {error && <Alert variant="error">{error}</Alert>}
      <Card><CardHeader><CardTitle>Add Medical Advice</CardTitle></CardHeader><CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient</label>
            <select
              className="w-full mt-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              value={form.patient_id}
              onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))}
              required
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.full_name} ({p.email}) {p.last_risk_level ? `- Last Risk: ${p.last_risk_level}` : ''}
                </option>
              ))}
            </select>
          </div>
          <Input label="Recommendation" value={form.recommendation_text} onChange={(e) => setForm((p) => ({ ...p, recommendation_text: e.target.value }))} required />
          <Input label="Emergency Notes" value={form.emergency_notes} onChange={(e) => setForm((p) => ({ ...p, emergency_notes: e.target.value }))} />
          <Button type="submit">Save Recommendation</Button>
        </form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Recent Recommendations</CardTitle></CardHeader><CardContent className="space-y-2">
        {items.map((it) => <div key={it.recommendation_id} className="p-3 rounded-xl border"><p className="text-sm font-semibold">Patient #{it.patient_id}</p><p className="text-sm">{it.recommendation_text}</p></div>)}
      </CardContent></Card>
    </div>
  );
};

export default DoctorRecommendationPage;
