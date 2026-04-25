import React from 'react';
import { ToggleProps } from '../../types/ui.types';

/**
 * Reusable Toggle switch component
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="mr-3 text-sm text-gray-300">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-razer-green focus:ring-offset-2 focus:ring-offset-gray-900 ${
          checked ? 'bg-razer-green' : 'bg-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};