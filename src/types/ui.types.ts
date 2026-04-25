/**
 * UI-related TypeScript definitions for the Game Booster application
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  disabled?: boolean;
  className?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}