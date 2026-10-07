import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  accentColor?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  accentColor = '#0b4da2',
  badge,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden hover:border-slate-300 transition-all ${className}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between text-slate-500 mb-1">
        <span className="text-[11px] font-bold tracking-wider uppercase">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none my-1 font-mono">
          {value}
        </div>
        {badge}
      </div>
      {hint && (
        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}
