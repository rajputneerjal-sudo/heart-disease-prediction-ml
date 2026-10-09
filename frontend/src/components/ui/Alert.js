import React from 'react';
import { cn } from '../../utils/helpers';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const variants = {
  success: {
    container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    text: 'text-green-700 dark:text-green-400',
    Icon: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    text: 'text-red-700 dark:text-red-400',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    text: 'text-yellow-700 dark:text-yellow-400',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-400',
    Icon: Info,
  },
};

const Alert = ({ variant = 'info', title, children, onClose, className = '' }) => {
  const v = variants[variant];
  const Icon = v.Icon;

  return (
    <div className={cn('flex gap-3 p-4 rounded-xl border', v.container, className)}>
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', v.icon)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn('font-semibold text-sm', v.title)}>{title}</p>}
        <div className={cn('text-sm', title && 'mt-1', v.text)}>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className={cn('flex-shrink-0', v.icon, 'hover:opacity-70 transition-opacity')}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
