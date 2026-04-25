import React from 'react';
import { CardProps } from '../../types/ui.types';

/**
 * Reusable Card component with consistent styling
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  const baseClasses = 'bg-panel-bg rounded border border-gray-800 shadow-lg';
  const hoverClasses = hoverable ? 'transition-all duration-300 hover:border-razer-green hover:shadow-[0_0_20px_rgba(68,214,44,0.2)]' : '';
  
  const combinedClasses = `${baseClasses} ${paddingClasses[padding]} ${hoverClasses} ${className}`;

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};