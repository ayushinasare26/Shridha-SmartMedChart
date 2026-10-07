import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const base = "inline-flex items-center justify-center font-bold transition-all rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm sm:text-base gap-2.5",
  };

  const variantClasses = {
    primary: "bg-[#0b4da2] hover:bg-[#093f85] text-white shadow-xs border border-[#0b4da2]",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs border border-red-600",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border border-emerald-600",
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';
