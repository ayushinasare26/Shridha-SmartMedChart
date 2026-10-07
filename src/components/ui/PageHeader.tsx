import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
