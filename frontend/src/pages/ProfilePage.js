import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, Lock, Save, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updated = await authService.updateProfile(form);
      updateUser(updated);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) { setError('New passwords do not match.'); return; }
    if (passwords.new.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setPwLoading(true);
    setError('');
    try {
      await authService.changePassword({ current_password: passwords.current, new_password: passwords.new });
      setPasswords({ current: '', new: '', confirm: '' });
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account information and security</p>
      </div>

      {success && <Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-1 capitalize">
                {user?.role || 'Patient'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <CardTitle>Personal Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <Input
              label="Full Name" value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              leftIcon={<User className="w-4 h-4" />} required
            />
            <Input
              label="Email Address" type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              leftIcon={<Mail className="w-4 h-4" />} required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                leftIcon={<Phone className="w-4 h-4" />}
              />
              <Input
                label="Date of Birth" type="date" value={form.date_of_birth}
                onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>
            <Button type="submit" loading={loading} leftIcon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <CardTitle>Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password" type="password" value={passwords.current}
              onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />} required
            />
            <Input
              label="New Password" type="password" value={passwords.new}
              onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />} required
              hint="Minimum 8 characters"
            />
            <Input
              label="Confirm New Password" type="password" value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />} required
            />
            <Button type="submit" loading={pwLoading} variant="secondary" leftIcon={<Lock className="w-4 h-4" />}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">Delete Account</p>
              <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account and all data</p>
            </div>
            <Button variant="danger" size="sm">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
