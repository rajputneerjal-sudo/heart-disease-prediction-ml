import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, User, Eye, EyeOff, Phone, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    phone: '', date_of_birth: '', gender: '',
    role: 'patient', specialization: '', experience: '', hospital_name: '', contact_information: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        role: form.role,
        specialization: form.role === 'doctor' ? form.specialization : undefined,
        experience: form.role === 'doctor' ? form.experience : undefined,
        hospital_name: form.role === 'doctor' ? form.hospital_name : undefined,
        contact_information: form.role === 'doctor' ? form.contact_information : undefined,
      });
      navigate(form.role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server at http://localhost:8000. Please start the backend API and try again.');
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white heartbeat" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400">Join CardioAI for personalized heart health monitoring</p>
          </div>

          {error && (
            <Alert variant="error" className="mb-6" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={form.full_name}
                onChange={handleChange('full_name')}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={handleChange('phone')}
                leftIcon={<Phone className="w-4 h-4" />}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange('date_of_birth')}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
              <Select
                label="Register As"
                value={form.role}
                onChange={handleChange('role')}
                options={[
                  { value: 'patient', label: 'Patient' },
                  { value: 'doctor', label: 'Doctor' },
                ]}
              />
              <Select
                label="Gender"
                value={form.gender}
                onChange={handleChange('gender')}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ]}
                placeholder="Select gender"
              />
              <div /> {/* spacer */}
              {form.role === 'doctor' && (
                <>
                  <Input label="Specialization" value={form.specialization} onChange={handleChange('specialization')} required />
                  <Input label="Experience" value={form.experience} onChange={handleChange('experience')} placeholder="e.g., 8 years" required />
                  <Input label="Hospital Name" value={form.hospital_name} onChange={handleChange('hospital_name')} required />
                  <Input label="Contact Information" value={form.contact_information} onChange={handleChange('contact_information')} required />
                </>
              )}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange('password')}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="hover:text-blue-500 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={handleChange('confirm_password')}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                By creating an account, you agree to our Terms of Service and Privacy Policy. Your health data is encrypted and never shared without consent.
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full mt-6" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
