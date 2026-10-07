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

export const ReceptionistSidebar: React.FC<SidebarProps> = ({
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
          className="fixed inset-0 bg-[rgba(15,23,42,0.35)] backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white text-slate-700 flex flex-col justify-between shrink-0 border-r border-slate-200 shadow-sm transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Blue S Logo matching Doctor Portal */}
              <div className="w-8 h-8 rounded-lg bg-[#1d4ed8] flex items-center justify-center text-white font-black text-sm shadow-xs">
                S
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
                    SmartMedChart
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Receptionist Workstation
                </span>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Card matching Doctor Portal */}
          <div className="p-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1d4ed8] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  PS
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    Priya Sharma
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Lead Reception Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenQRScanner}
                title="Scan QR"
                className="px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50/70 text-[#1d4ed8] text-[10px] font-bold hover:bg-blue-100 transition-colors shrink-0 flex items-center gap-1"
              >
                <QrCode className="w-3 h-3 text-[#1d4ed8]" />
                <span>QR</span>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-2 overflow-y-auto max-h-[calc(100vh-270px)] space-y-3">
            {/* Section 1: Clinical Workspaces */}
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-black uppercase tracking-wider text-[#94a3b8] block mb-1">
                CLINICAL WORKSPACES
              </span>

              {/* Overview & Dashboard */}
              <button
                type="button"
                id="sidebar-nav-overview"
                onClick={() => handleNavClick('overview')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-[#0b4da2] border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard
                    className={`w-4 h-4 ${
                      activeTab === 'overview' ? 'text-[#0b4da2]' : 'text-slate-400'
                    }`}
                  />
                  <span>Overview &amp; Status</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                  Live
                </span>
              </button>

              {/* All Patients Directory */}
              <button
                type="button"
                id="sidebar-nav-all-patients"
                onClick={() => handleNavClick('all-patients')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all-patients'
                    ? 'bg-blue-50 text-[#0b4da2] border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users
                    className={`w-4 h-4 ${
                      activeTab === 'all-patients' ? 'text-[#0b4da2]' : 'text-slate-400'
                    }`}
                  />
                  <span>All Patients</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-[#0b4da2] border border-blue-200 font-bold font-mono">
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
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BedDouble
                    className={`w-4 h-4 ${
                      activeTab === 'admitted' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>Admitted IPD</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
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
                    ? 'bg-blue-50 text-[#0b4da2] border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users
                    className={`w-4 h-4 ${
                      activeTab === 'opd' ? 'text-[#0b4da2]' : 'text-slate-400'
                    }`}
                  />
                  <span>OPD Outpatients</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
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
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus
                    className={`w-4 h-4 ${
                      activeTab === 'register' ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  />
                  <span>Enroll New Patient</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
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
                    ? 'bg-blue-50 text-[#0b4da2] border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope
                    className={`w-4 h-4 ${
                      activeTab === 'doctors' ? 'text-[#0b4da2]' : 'text-slate-400'
                    }`}
                  />
                  <span>Attending Doctors</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                  {doctorsCount}
                </span>
              </button>
            </div>

            {/* Section 2: Clinical Operations */}
            <div className="space-y-1">
              <span className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Hospital Operations
              </span>

              {/* Wards & Beds Map */}
              <button
                type="button"
                onClick={() => handleNavClick('wards')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'wards'
                    ? 'bg-blue-50 text-[#0b4da2] border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2
                    className={`w-4 h-4 ${
                      activeTab === 'wards' ? 'text-[#0b4da2]' : 'text-slate-400'
                    }`}
                  />
                  <span>Wards &amp; Bed Map</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">7 Wards</span>
              </button>

              {/* Shift Assistant Doctors Roster */}
              <button
                type="button"
                onClick={() => handleNavClick('shifts')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'shifts'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock
                    className={`w-4 h-4 ${
                      activeTab === 'shifts' ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  />
                  <span>Shift Doctor Roster</span>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {currentShift}
                </span>
              </button>

              {/* QR Scanner */}
              <button
                type="button"
                onClick={() => handleNavClick('qr-scan')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'qr-scan'
                    ? 'bg-blue-50 text-[#0b4da2] border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode
                    className={`w-4 h-4 ${
                      activeTab === 'qr-scan' ? 'text-[#0b4da2]' : 'text-slate-400'
                    }`}
                  />
                  <span>Scan QR Wristband</span>
                </div>
                <span className="text-[9px] text-[#0b4da2] font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  Fast Pass
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Hospital Ward Status Card matching Doctor Portal */}
        <div className="p-3 border-t border-slate-200 space-y-2.5 shrink-0 bg-slate-50/50">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#94a3b8] block">
              HOSPITAL WARD STATUS
            </span>
            <div className="text-[11px] font-semibold text-slate-700 leading-tight">
              LOCATION: <span className="text-[#1d4ed8] font-bold">Ward 4B ICU</span>
            </div>
            <div className="text-[11px] text-slate-600 leading-tight">
              ACTIVE INPATIENTS: <strong className="text-slate-800">{admittedCount} / 28 Beds</strong>
            </div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>256-bit HIPAA Sync Active</span>
            </div>
          </div>

          {/* Quick Action Bar (Alerts & Reset) */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="relative p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  2
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <button
                type="button"
                onClick={onResetData}
                title="Reset demo data"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[9px] font-medium text-slate-400">
              Online Mode v2.4.1
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
