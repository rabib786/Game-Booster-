import React from 'react';
import { ButtonProps } from '../../types/ui.types';

/**
 * Reusable Button component with multiple variants and sizes
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const baseClasses = 'font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-razer-green focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded';
  
  const variantClasses = {
    primary: 'bg-razer-green hover:bg-green-400 text-black shadow-[0_0_15px_rgba(68,214,44,0.4)]',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    success: 'bg-green-600 hover:bg-green-500 text-white',
    ghost: 'text-gray-300 hover:text-white bg-transparent',
  };

  const sizeClasses = {
    sm: 'py-1 px-4 text-xs',
    md: 'py-2 px-6 text-sm',
    lg: 'py-3 px-8 text-base',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105';

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {children}
    </button>
  );
};