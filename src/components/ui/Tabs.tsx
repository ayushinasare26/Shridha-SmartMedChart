import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  equalWidth?: boolean;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  equalWidth = true,
}: TabsProps<T>) {
  return (
    <div
      className={`p-1 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-1 overflow-x-auto ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer select-none whitespace-nowrap ${
              equalWidth ? 'flex-1' : ''
            } ${
              isActive
                ? 'bg-[#0b4da2] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
