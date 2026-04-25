import React from 'react';
import { SelectProps } from '../../types/ui.types';

/**
 * Reusable Select component
 */
export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-razer-green focus:border-transparent transition-colors appearance-none';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};