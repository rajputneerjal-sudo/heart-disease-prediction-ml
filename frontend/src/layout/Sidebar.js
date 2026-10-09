import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, LayoutDashboard, Activity, History, BookOpen,
  Shield, Settings, LogOut, ChevronLeft, ChevronRight,
  AlertTriangle, HelpCircle, Users, BarChart3,
  FileText, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/helpers';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/predict', icon: Activity, label: 'New Prediction' },
  { path: '/history', icon: History, label: 'Prediction History' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { divider: true, label: 'Education' },
  { path: '/education/guide', icon: BookOpen, label: 'Heart Health Guide' },
  { path: '/education/prevention', icon: Shield, label: 'Prevention Tips' },
  { path: '/education/emergency', icon: AlertTriangle, label: 'Emergency Signs' },
  { path: '/education/faq', icon: HelpCircle, label: 'FAQ' },
  { divider: true, label: 'Account' },
  { path: '/profile', icon: Settings, label: 'Profile Settings' },
];

const adminItems = [
  { divider: true, label: 'Admin' },
  { path: '/admin', icon: Users, label: 'User Management' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/logs', icon: Bell, label: 'System Logs' },
];

const doctorItems = [
  { path: '/doctor/dashboard', icon: LayoutDashboard, label: 'Doctor Dashboard' },
  { path: '/doctor/analytics', icon: BarChart3, label: 'Patient Analytics' },
  { path: '/doctor/reports', icon: FileText, label: 'Patient Reports' },
  { path: '/doctor/recommendations', icon: Shield, label: 'Recommendations' },
  { path: '/profile', icon: Settings, label: 'Doctor Profile' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allItems = user?.role === 'doctor'
    ? doctorItems
    : user?.role === 'admin'
      ? [...navItems, ...adminItems]
      : navItems;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-40 flex flex-col shadow-sm"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <Heart className="w-5 h-5 text-white heartbeat" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">CardioAI</p>
              <p className="text-xs text-gray-400">{user?.role === 'doctor' ? 'Clinical Command Center' : 'Heart Prediction System'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {allItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div key={idx} className="mt-4 mb-2">
                {!collapsed && (
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
                    {item.label}
                  </p>
                )}
                {collapsed && <div className="border-t border-gray-100 dark:border-gray-800 mx-2 my-2" />}
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 group',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl mb-1', !collapsed && 'mb-2')}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
