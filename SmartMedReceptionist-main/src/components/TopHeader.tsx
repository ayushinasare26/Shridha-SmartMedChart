import React from 'react';
import {
  Search,
  AlertTriangle,
  UserCheck,
  Plus,
  Clock,
  QrCode,
  Building,
  Menu,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Patient } from '../types';

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddPatient: () => void;
  onOpenQRScanner: () => void;
  onSelectPatient: (patient: Patient) => void;
  statUrgentCount: number;
  patients: Patient[];
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddPatient,
  onOpenQRScanner,
  onSelectPatient,
  statUrgentCount,
  patients,
  onToggleSidebar,
}) => {
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  const filteredPatients = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(
      p =>
        p.fullName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.tokenNumber.toLowerCase().includes(q) ||
        p.contactNumber.includes(q) ||
        p.caseFile.assignedDoctorName.toLowerCase().includes(q) ||
        (p.admission?.wardNumber || '').toLowerCase().includes(q) ||
        (p.admission?.bedNumber || '').toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      {/* Left: Hamburger (Mobile) + Breadcrumbs & Clinic Info */}
      <div className="flex items-center gap-3 shrink-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200"
            title="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Shield className="w-4 h-4 text-cyan-700" />
            <span>SmartMedReceptionist</span>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
            RECEPTIONIST DESK
          </span>
          <span className="text-slate-300 hidden md:inline">/</span>
          <span className="text-slate-500 hidden md:inline">
            Inpatient Directory & Intake Desk
          </span>
        </div>
      </div>

      {/* Center: Universal Patient Search */}
      <div className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="universal-patient-search"
            type="text"
            placeholder="Search patient name, MRN, ward, bed, doctor..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-9 pr-12 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white transition-all shadow-2xs"
          />
          <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Dropdown Live Results */}
        {showSearchResults && searchQuery.trim().length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSearchResults(false)}
            />
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto p-1 text-xs divide-y divide-slate-100">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    id={`search-result-${p.id}`}
                    onClick={() => {
                      onSelectPatient(p);
                      setShowSearchResults(false);
                      onSearchChange('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-cyan-800">
                          {p.fullName}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {p.mrn}
                        </span>
                        <span className="font-mono text-[10px] bg-cyan-50 text-cyan-800 border border-cyan-200 px-1.5 py-0.5 rounded font-black">
                          {p.tokenNumber}
                        </span>
                        {p.admission?.isAdmitted && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300">
                            {p.admission.wardNumber} ({p.admission.bedNumber})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.age}y • {p.gender} • Dr. {p.caseFile.assignedDoctorName} ({p.caseFile.department})
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                      Open File →
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No matching patients found for "{searchQuery}"
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Controls matching the inspiration image */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* STAT Alert Badge */}
        {statUrgentCount > 0 && (
          <button
            id="stat-alert-top-pill"
            onClick={() => {
              const statPt = patients.find(
                p => p.caseFile.triagePriority === 'STAT Emergency' || p.caseFile.triagePriority === 'STAT Urgent'
              );
              if (statPt) onSelectPatient(statPt);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors text-xs font-bold animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{statUrgentCount} STAT Alert</span>
          </button>
        )}

        {/* Quick QR Scan */}
        <button
          id="top-scan-qr-btn"
          onClick={onOpenQRScanner}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-slate-600" />
          <span>Scan QR</span>
        </button>

        {/* Single Primary Highlighted Eye-Catching CTA */}
        <button
          id="top-add-patient-cta"
          onClick={onOpenAddPatient}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 hover:from-amber-200 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-amber-400/30 ring-2 ring-amber-300/90 ring-offset-1 ring-offset-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
          <span className="tracking-tight">+ Enroll Patients</span>
        </button>

        {/* Top-Right User Badge (Priya Sharma, Lead Receptionist) */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 text-white text-xs font-black flex items-center justify-center shadow-2xs">
            PS
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              Priya Sharma
            </p>
            <p className="text-[10px] text-teal-700 font-semibold leading-tight">
              RCP-4012 • Receptionist
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
