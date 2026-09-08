import React from 'react';
import {
  Shield,
  LayoutDashboard,
  UserPlus,
  BedDouble,
  Users,
  Stethoscope,
  Building2,
  Clock,
  QrCode,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  LogOut,
  X,
  Phone,
  Sparkles,
} from 'lucide-react';
import { ShiftType } from '../types';
import {
  getCurrentActiveShift,
  SHIFT_ASSISTANT_DOCTOR_ROSTER,
  SHIFT_TIMINGS,
} from '../data/wardAndShiftData';

export type SidebarActiveTab =
  | 'overview'
  | 'all-patients'
  | 'admitted'
  | 'opd'
  | 'register'
  | 'doctors'
  | 'wards'
  | 'shifts'
  | 'qr-scan';

interface SidebarProps {
  activeTab: SidebarActiveTab;
  onSelectTab: (tab: SidebarActiveTab) => void;
  totalPatientsCount: number;
  admittedCount: number;
  opdCount: number;
  doctorsCount: number;
  statUrgentCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onResetData: () => void;
  onOpenQRScanner: () => void;
  onOpenAddPatient: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  totalPatientsCount,
  admittedCount,
  opdCount,
  doctorsCount,
  statUrgentCount,
  isOpenMobile,
  onCloseMobile,
  onResetData,
  onOpenQRScanner,
  onOpenAddPatient,
}) => {
  const currentShift: ShiftType = getCurrentActiveShift();
  const shiftDoctors = SHIFT_ASSISTANT_DOCTOR_ROSTER[currentShift];
  const activeDutyDoc = shiftDoctors[0];

  const handleNavClick = (tab: SidebarActiveTab) => {
    onSelectTab(tab);
    if (tab === 'register') {
      onOpenAddPatient();
    } else if (tab === 'qr-scan') {
      onOpenQRScanner();
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0a233b] text-slate-100 flex flex-col justify-between shrink-0 border-r border-[#143b5e] shadow-xl transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div className="p-4 border-b border-[#143b5e] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Blue Shield Logo matching inspiration image */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-md border border-cyan-300/30">
                <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight leading-tight">
                    SmartMedReceptionist
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-400/40 uppercase">
                    RCP
                  </span>
                </div>
                <span className="text-[10px] text-cyan-200/70 font-medium block truncate max-w-[155px]">
                  Reception & IPD Desk
                </span>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-2 overflow-y-auto max-h-[calc(100vh-280px)] space-y-4">
            {/* Section 1: Workstation */}
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-black uppercase tracking-wider text-cyan-300/60 block mb-1">
                Main Workstation
              </span>

              {/* Overview & Dashboard */}
              <button
                type="button"
                id="sidebar-nav-overview"
                onClick={() => handleNavClick('overview')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#124268] text-white shadow-inner border border-cyan-500/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard
                    className={`w-4 h-4 ${
                      activeTab === 'overview' ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  />
                  <span>Overview & Status</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-200 font-mono font-bold">
                  Live
                </span>
              </button>

              {/* All Patients Directory (Explicitly requested) */}
              <button
                type="button"
                id="sidebar-nav-all-patients"
                onClick={() => handleNavClick('all-patients')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all-patients'
                    ? 'bg-[#124268] text-white shadow-inner border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users
                    className={`w-4 h-4 ${
                      activeTab === 'all-patients' ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  />
                  <span>All Patients</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold font-mono">
                  {totalPatientsCount}
                </span>
              </button>

              {/* Inpatient Admitted (IPD) */}
              <button
                type="button"
                id="sidebar-nav-admitted"
                onClick={() => handleNavClick('admitted')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'admitted'
                    ? 'bg-[#124268] text-white shadow-inner border border-emerald-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BedDouble
                    className={`w-4 h-4 ${
                      activeTab === 'admitted' ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>Admitted IPD</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  {admittedCount} Beds
                </span>
              </button>

              {/* Outpatients (OPD Queue) */}
              <button
                type="button"
                id="sidebar-nav-opd"
                onClick={() => handleNavClick('opd')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'opd'
                    ? 'bg-[#124268] text-white shadow-inner border border-indigo-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users
                    className={`w-4 h-4 ${
                      activeTab === 'opd' ? 'text-indigo-300' : 'text-slate-400'
                    }`}
                  />
                  <span>OPD Outpatients</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-400/40 font-bold">
                  {opdCount}
                </span>
              </button>

              {/* Enroll Patient Station */}
              <button
                type="button"
                id="sidebar-nav-register"
                onClick={() => handleNavClick('register')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'register'
                    ? 'bg-[#124268] text-white shadow-inner border border-amber-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus
                    className={`w-4 h-4 ${
                      activeTab === 'register' ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  />
                  <span>Enroll New Patient</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                  + New
                </span>
              </button>

              {/* Attending Doctors */}
              <button
                type="button"
                id="sidebar-nav-doctors"
                onClick={() => handleNavClick('doctors')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'doctors'
                    ? 'bg-[#124268] text-white shadow-inner border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope
                    className={`w-4 h-4 ${
                      activeTab === 'doctors' ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  />
                  <span>Attending Doctors</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono">
                  {doctorsCount}
                </span>
              </button>
            </div>

            {/* Section 2: Clinical Operations */}
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-black uppercase tracking-wider text-cyan-300/60 block mb-1">
                Hospital Operations
              </span>

              {/* Wards & Beds Map */}
              <button
                type="button"
                onClick={() => handleNavClick('wards')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'wards'
                    ? 'bg-[#124268] text-white shadow-inner border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2
                    className={`w-4 h-4 ${
                      activeTab === 'wards' ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  />
                  <span>Wards & Bed Map</span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono">7 Wards</span>
              </button>

              {/* Shift Assistant Doctors Roster */}
              <button
                type="button"
                onClick={() => handleNavClick('shifts')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'shifts'
                    ? 'bg-[#124268] text-white shadow-inner border border-amber-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock
                    className={`w-4 h-4 ${
                      activeTab === 'shifts' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <span>Shift Doctor Roster</span>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-400/40">
                  {currentShift}
                </span>
              </button>

              {/* QR Scanner */}
              <button
                type="button"
                onClick={() => handleNavClick('qr-scan')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'qr-scan'
                    ? 'bg-[#124268] text-white shadow-inner border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode
                    className={`w-4 h-4 ${
                      activeTab === 'qr-scan' ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  />
                  <span>Scan QR Wristband</span>
                </div>
                <span className="text-[9px] text-cyan-300 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Fast Pass
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Live Shift Card & User Profile */}
        <div className="p-3 border-t border-[#143b5e] space-y-3 shrink-0">
          {/* Live Duty Shift Widget */}
          <div className="p-2.5 rounded-xl bg-[#0e304f] border border-[#1b4b74] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase text-cyan-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Duty Shift: {currentShift}</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] font-bold text-white truncate">
              {activeDutyDoc?.name || 'Dr. Neha Saxena, MD'}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
              <span className="text-cyan-200/80 font-mono">{SHIFT_TIMINGS[currentShift]}</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Phone className="w-2.5 h-2.5" />
                <span>Ext. 401</span>
              </span>
            </div>
          </div>

          {/* User Profile: Priya Sharma (Lead Receptionist) */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                PS
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  Priya Sharma
                </p>
                <p className="text-[10px] text-teal-300 font-semibold truncate">
                  RCP-4012 • Receptionist
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onResetData}
              title="Reset demo data"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
