import React from 'react';
import { InputProps } from '../../types/ui.types';

/**
 * Reusable Input component
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  className = '',
}) => {
  const baseClasses = 'w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-razer-green focus:border-transparent transition-colors';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
    />
  );
};