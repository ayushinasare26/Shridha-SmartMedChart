import React, { HTMLAttributes } from 'react';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'brand',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  const variantClasses: Record<BadgeVariant, string> = {
    brand: 'bg-blue-50 text-[#0b4da2] border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const dotClasses: Record<BadgeVariant, string> = {
    brand: 'bg-[#0b4da2]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-bold border rounded-full whitespace-nowrap ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`} />}
      {children}
    </span>
  );
}

export const StatusPill = Badge;
