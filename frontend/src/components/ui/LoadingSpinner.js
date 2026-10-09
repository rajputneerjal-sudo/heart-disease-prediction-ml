import React from 'react';
import { cn } from '../../utils/helpers';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  return (
    <div className={cn('spinner', sizes[size], className)} />
  );
};

export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Please wait...</p>
      </div>
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
  </div>
);

export default LoadingSpinner;
