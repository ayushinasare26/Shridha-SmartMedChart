import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-white border text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 transition-all outline-none placeholder:text-slate-400 ${
            leftIcon ? 'pl-9' : ''
          } ${rightIcon ? 'pr-9' : ''} ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-slate-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => {
  const [show, setShow] = useState(false);

  return (
    <Input
      ref={ref}
      type={show ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';
