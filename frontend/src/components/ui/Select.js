import React from 'react';
import { cn } from '../../utils/helpers';

const Select = React.forwardRef(({
  label,
  error,
  hint,
  options = [],
  className = '',
  containerClassName = '',
  tooltip,
  required,
  placeholder = 'Select an option',
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {tooltip && (
            <div className="group relative">
              <button type="button" className="text-gray-400 hover:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {tooltip}
                <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          )}
        </div>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-xl border transition-all duration-200 appearance-none',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'cursor-pointer',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-200 dark:border-gray-700',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
