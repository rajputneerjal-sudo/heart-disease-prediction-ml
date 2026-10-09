import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, Eye, EyeOff, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'patient' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password, form.role);
      navigate(user.role === 'doctor' ? '/doctor/dashboard' : user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-health flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white heartbeat" />
            </div>
            <span className="text-white font-bold text-xl">CardioAI</span>
          </div>
        </div>
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              AI-Powered Heart Disease Prediction
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Advanced machine learning algorithms analyze your health data to predict cardiovascular risk with high accuracy.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎯', label: 'Accuracy', value: '94.2%' },
                { icon: '⚡', label: 'Predictions', value: '10,000+' },
                { icon: '🏥', label: 'Hospitals', value: '50+' },
                { icon: '👥', label: 'Patients', value: '25,000+' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-white font-bold text-xl">{stat.value}</div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-200" />
          <p className="text-blue-200 text-sm">Trusted by healthcare professionals worldwide</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white heartbeat" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">CardioAI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400">Sign in to your CardioAI account</p>
          </div>

          {error && (
            <Alert variant="error" className="mb-6" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Select
              label="Sign In As"
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              options={[
                { value: 'patient', label: 'Patient' },
                { value: 'doctor', label: 'Doctor' },
              ]}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(p => !p)} className="hover:text-blue-500 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Create account
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              🔒 Your health data is encrypted and secure. We comply with HIPAA standards.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
