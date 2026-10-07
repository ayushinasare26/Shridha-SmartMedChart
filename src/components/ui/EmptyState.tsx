import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
