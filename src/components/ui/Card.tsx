import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'bordered';
}

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300',
    subtle: 'bg-slate-50/80 border border-slate-200 shadow-2xs',
    bordered: 'bg-white border-2 border-slate-200 shadow-2xs',
  };

  return (
    <div
      className={`rounded-xl transition-all ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl ${className}`} {...props}>
      {children}
    </div>
  );
}
