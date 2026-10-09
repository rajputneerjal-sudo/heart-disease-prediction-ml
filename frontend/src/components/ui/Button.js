import React from 'react';
import { cn } from '../../utils/helpers';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
  icon: 'p-2',
};

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
