import React from 'react';
import {
  QrCode,
  UserPlus,
  BedDouble,
  Building2,
  Clock,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { ShiftType } from '../types';
import { getCurrentActiveShift, SHIFT_TIMINGS } from '../data/wardAndShiftData';

interface WelcomeHeroBannerProps {
  onOpenQRScanner: () => void;
  onOpenAddPatient: () => void;
  onFilterAdmitted: () => void;
  onFilterOPD: () => void;
  onScrollToWards?: () => void;
  admittedCount: number;
  totalPatientsCount: number;
}

export const WelcomeHeroBanner: React.FC<WelcomeHeroBannerProps> = ({
  onOpenQRScanner,
  onOpenAddPatient,
  onFilterAdmitted,
  onFilterOPD,
  onScrollToWards,
  admittedCount,
  totalPatientsCount,
}) => {
  const currentShift: ShiftType = getCurrentActiveShift();

  // Formatted date
  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#0a233b] via-[#0e3352] to-[#0c2b48] text-white p-5 sm:p-6 shadow-md border border-[#16446c] relative overflow-hidden">
      {/* Subtle radial ambient glow */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Tag & Live Shift */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
              HOSPITAL RECEPTION DESK & INTAKE BUREAU
            </span>
            <span className="text-xs text-cyan-200/80 font-medium">
              {todayStr}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-cyan-200 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">{currentShift} Shift Active</span>
            <span className="text-cyan-300/70 text-[11px]">({SHIFT_TIMINGS[currentShift]})</span>
          </div>
        </div>

        {/* Main Heading & Subtext */}
        <div className="max-w-3xl space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, Priya Sharma
          </h2>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-normal">
            Lead Receptionist Portal — Register incoming patients, directly allot attending physicians, admit inpatients with ward & bed numbers, and schedule shift-wise assistant doctors with real-time QR token passes.
          </p>
        </div>

        {/* Quick Action Buttons (matching the inspiration image pills) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Scan QR Code */}
          <button
            type="button"
            id="hero-scan-qr-btn"
            onClick={onOpenQRScanner}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/50 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Scan QR Code</span>
          </button>

          {/* Admit Inpatient */}
          <button
            type="button"
            id="hero-admit-inpatient-btn"
            onClick={onFilterAdmitted}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <BedDouble className="w-4 h-4 text-emerald-200" />
            <span>♡ + Admit Inpatient ({admittedCount} Beds)</span>
          </button>

          {/* OPD Queue */}
          <button
            type="button"
            id="hero-opd-queue-btn"
            onClick={onFilterOPD}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-900/70 hover:bg-indigo-800 text-indigo-100 border border-indigo-400/40 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Stethoscope className="w-4 h-4 text-indigo-300" />
            <span>OPD Queue ({totalPatientsCount - admittedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
