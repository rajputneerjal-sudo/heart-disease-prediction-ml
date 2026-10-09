import React from 'react';
import { cn } from '../../utils/helpers';

const variants = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const Badge = ({ children, variant = 'info', className = '', dot = false }) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
    variants[variant],
    className
  )}>
    {dot && (
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        variant === 'success' && 'bg-green-500',
        variant === 'danger' && 'bg-red-500',
        variant === 'warning' && 'bg-yellow-500',
        variant === 'info' && 'bg-blue-500',
        variant === 'gray' && 'bg-gray-500',
      )} />
    )}
    {children}
  </span>
);

export default Badge;
