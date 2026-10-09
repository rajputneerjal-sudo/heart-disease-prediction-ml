import React from 'react';
import { cn } from '../../utils/helpers';

export const Card = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={cn(
      'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700',
      hover && 'card-hover cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={cn('px-6 pt-6 pb-4', className)}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={cn('text-lg font-bold text-gray-900 dark:text-white', className)}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={cn('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={cn('px-6 pb-6', className)}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={cn('px-6 pb-6 pt-0 flex items-center', className)}>{children}</div>
);

export default Card;
