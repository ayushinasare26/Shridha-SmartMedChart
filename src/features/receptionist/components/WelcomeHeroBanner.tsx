import React from 'react';
import {
  QrCode,
  UserPlus,
  BedDouble,
  Building2,
  Clock,
  Sparkles,
  Stethoscope,
  RotateCcw,
} from 'lucide-react';
import { ShiftType } from '../types';
import { getCurrentActiveShift, SHIFT_TIMINGS } from '../data/wardAndShiftData';

interface WelcomeHeroBannerProps {
  onOpenQRScanner: () => void;
  onOpenAddPatient: () => void;
  onFilterAdmitted: () => void;
  onFilterOPD: () => void;
  onAdmitInpatient: () => void;
  onScrollToWards?: () => void;
  admittedCount: number;
  totalPatientsCount: number;
}

export const WelcomeHeroBanner: React.FC<WelcomeHeroBannerProps> = ({
  onOpenQRScanner,
  onOpenAddPatient,
  onFilterAdmitted,
  onFilterOPD,
  onAdmitInpatient,
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-wrap gap-4 pb-1">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Doctor Clinical Command Portal
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]">
            Lead Receptionist Workstation
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Tuesday, September 8, 2026 &bull; Ward 4B ICU &bull; Shift 07:00–15:00
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>

        {/* Scan QR Code */}
        <button
          type="button"
          id="hero-scan-qr-btn"
          onClick={onOpenQRScanner}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5 text-slate-500" />
          <span>Scan QR</span>
        </button>

        {/* Primary Action: + Admit Inpatient matching + New Prescription */}
        <button
          type="button"
          id="hero-admit-inpatient-btn"
          onClick={onAdmitInpatient}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <BedDouble className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          <span>+ Admit Inpatient</span>
        </button>
      </div>
    </div>
  );
};
