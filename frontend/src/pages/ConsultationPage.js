import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarHeart, PhoneCall, Stethoscope, Mail, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { consultationService } from '../services/consultationService';

const initialRequest = {
  fullName: '',
  phone: '',
  email: '',
  preferredDate: '',
  notes: '',
};

const ConsultationPage = () => {
  const navigate = useNavigate();
  const [request, setRequest] = useState(initialRequest);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setRequest((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!request.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!request.phone.trim()) nextErrors.phone = 'Phone number is required';
    if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitRequest = () => {
    if (!validate()) return false;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitted(false);
    setApiError('');
    if (!submitRequest()) return;

    setSubmitting(true);
    try {
      await consultationService.submitRequest(request);
      setSubmitted(true);
      setRequest(initialRequest);
    } catch (error) {
      setApiError(error.response?.data?.detail || 'Unable to submit consultation request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/results')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
        Back to Results
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Medical Consultation</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Placeholder module for doctor booking and healthcare contact workflows.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Professional clinical consultation is recommended regardless of AI risk category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border p-4 bg-white dark:bg-gray-800">
              <CalendarHeart className="w-5 h-5 text-blue-600 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white">Book Appointment</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose a preferred date and submit a consultation request below.</p>
            </div>
            <div className="rounded-xl border p-4 bg-white dark:bg-gray-800">
              <PhoneCall className="w-5 h-5 text-green-600 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white">Call Support</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Immediate help line is available for urgent consultation routing.</p>
              <a className="text-sm text-green-700 dark:text-green-400 font-semibold mt-2 inline-block" href="tel:+18001234567">
                Call +1 (800) 123-4567
              </a>
            </div>
            <div className="rounded-xl border p-4 bg-white dark:bg-gray-800">
              <Stethoscope className="w-5 h-5 text-red-600 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white">Clinical Follow-up</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Share reports for physician-led evaluation and further testing.</p>
              <a className="text-sm text-red-700 dark:text-red-400 font-semibold mt-2 inline-flex items-center gap-1" href="mailto:consult@cardioai.health?subject=Medical%20Consultation%20Request">
                <Mail className="w-4 h-4" />
                Email consult@cardioai.health
              </a>
            </div>
          </div>

          {submitted && (
            <Alert variant="success">
              Consultation request submitted successfully. A healthcare coordinator will contact you shortly.
            </Alert>
          )}
          {apiError && (
            <Alert variant="error" onClose={() => setApiError('')}>
              {apiError}
            </Alert>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <p className="font-semibold text-gray-900 dark:text-white">Request Consultation</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                value={request.fullName}
                onChange={handleChange('fullName')}
                error={errors.fullName}
                required
                placeholder="Enter your full name"
              />
              <Input
                label="Phone Number"
                value={request.phone}
                onChange={handleChange('phone')}
                error={errors.phone}
                required
                placeholder="e.g. +1 800 123 4567"
              />
              <Input
                label="Email (Optional)"
                value={request.email}
                onChange={handleChange('email')}
                error={errors.email}
                placeholder="you@example.com"
              />
              <Input
                label="Preferred Date (Optional)"
                type="date"
                value={request.preferredDate}
                onChange={handleChange('preferredDate')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Symptoms / Notes (Optional)</label>
              <textarea
                rows={3}
                value={request.notes}
                onChange={handleChange('notes')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe symptoms, concerns, or preferred consultation slot."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSubmit} loading={submitting} leftIcon={<Send className="w-4 h-4" />}>
                Submit Consultation Request
              </Button>
              <Button variant="secondary" onClick={() => navigate('/results')}>
                Return to Report
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This request form is a placeholder workflow and does not replace emergency services. For severe symptoms, contact emergency care immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultationPage;
