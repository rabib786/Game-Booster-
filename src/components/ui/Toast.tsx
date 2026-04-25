import React from 'react';
import { ToastProps } from '../../types/ui.types';

/**
 * Toast notification component
 * Note: This is a custom toast component that can be used independently or with toast libraries
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  const typeClasses = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500',
    warning: 'bg-yellow-600 border-yellow-500',
  };

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  React.useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`flex items-center p-4 rounded border ${typeClasses[type]} text-white shadow-lg max-w-md`}>
      <span className="mr-3 text-lg">{icon[type]}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close toast"
        >
          ✕
        </button>
      )}
    </div>
  );
};