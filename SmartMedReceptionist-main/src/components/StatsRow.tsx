import React from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { Patient } from '../types';

interface StatsRowProps {
  patients: Patient[];
  onFilterStatus?: (status: string) => void;
}

export const StatsRow: React.FC<StatsRowProps> = ({ patients }) => {
  const totalToday = patients.length;
  const inQueue = patients.filter(
    (p) => p?.caseFile?.currentStatus === 'Waiting in Queue' || p?.caseFile?.currentStatus === 'Registered'
  ).length;
  const completed = patients.filter((p) => p?.caseFile?.currentStatus === 'Completed').length;
  const activeCaseFiles = patients.filter((p) => (p?.caseFile?.consultationHistory?.length || 0) > 0).length;
  const statUrgent = patients.filter(
    (p) => p?.caseFile?.triagePriority === 'STAT Urgent' || p?.caseFile?.triagePriority === 'STAT Emergency'
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 px-6">
      {/* 1. Due Today */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800" />
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Registered Today</span>
          <CalendarDays className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none my-1 font-mono">
          {totalToday < 10 ? `0${totalToday}` : totalToday}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>OPD Central</span>
          <span className="font-semibold text-emerald-600">100% charted</span>
        </div>
      </div>

      {/* 2. Due Now / In Queue */}
      <div className="bg-white rounded-xl p-4 border border-cyan-200/90 shadow-2xs relative overflow-hidden group hover:border-cyan-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-600" />
        <div className="flex items-center justify-between text-cyan-800 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Waiting for Doctor</span>
          <Clock className="w-4 h-4 text-cyan-600" />
        </div>
        <div className="text-3xl font-extrabold text-cyan-900 tracking-tight leading-none my-1 font-mono">
          {inQueue < 10 ? `0${inQueue}` : inQueue}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>Immediate Action</span>
          <span className="bg-cyan-50 text-cyan-700 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-cyan-200">
            Within &lt;30m
          </span>
        </div>
      </div>

      {/* 3. Completed */}
      <div className="bg-white rounded-xl p-4 border border-emerald-200/90 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
        <div className="flex items-center justify-between text-emerald-800 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Consulted & Logged</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none my-1 font-mono">
          {completed < 10 ? `0${completed}` : completed}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>Shift Progress</span>
          <span className="font-semibold text-emerald-700">
            {totalToday > 0 ? Math.round((completed / totalToday) * 100) : 0}% of batch
          </span>
        </div>
      </div>

      {/* 4. Active Case Files */}
      <div className="bg-white rounded-xl p-4 border border-amber-200/90 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div className="flex items-center justify-between text-amber-800 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">Case Files Active</span>
          <FileCheck className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none my-1 font-mono">
          {activeCaseFiles < 10 ? `0${activeCaseFiles}` : activeCaseFiles}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>Detailed History</span>
          <span className="font-medium text-amber-800">EHR Synced</span>
        </div>
      </div>

      {/* 5. STAT Urgent */}
      <div className="bg-white rounded-xl p-4 border border-rose-200/90 shadow-2xs relative overflow-hidden group hover:border-rose-300 transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600" />
        <div className="flex items-center justify-between text-rose-800 mb-1">
          <span className="text-[11px] font-bold tracking-wider uppercase">STAT Urgent</span>
          <AlertCircle className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-3xl font-extrabold text-rose-600 tracking-tight leading-none my-1 font-mono">
          {statUrgent < 10 ? `0${statUrgent}` : statUrgent}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>Emergency Triage</span>
          <span className="font-semibold text-rose-700">Dr. Sharma</span>
        </div>
      </div>
    </div>
  );
};
