import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  LogOut,
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
  const navigate = useNavigate();
  const { logout } = useAuth();
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
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      {/* Left: Brand matching Doctor Portal */}
      <div className="flex items-center gap-3 shrink-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
            title="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] text-white flex items-center justify-center font-black text-sm shadow-xs">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight leading-tight">
                SmartMedChart
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Receptionist Portal
            </span>
          </div>
        </div>

        {/* Clinical Location and OS Pills matching reference image */}
        <div className="hidden xl:flex items-center gap-3 ml-2 pl-3 border-l border-slate-200">
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600 text-white flex items-center justify-center text-[8px] font-black">S</span>
            SmartMedChart Hospital OS v4.2
          </span>
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Cardiothoracic ICU &bull; Ward 4B
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            EHR Live Sync Active
          </span>
        </div>
      </div>

      {/* Center: Universal Patient Search */}
      <div className="relative flex-1 max-w-sm">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="universal-patient-search"
            type="text"
            placeholder="Search patient, MRN, ward, bed, doctor..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-8 pr-10 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] focus:bg-white transition-all"
          />
          <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 px-1 py-0.2 rounded">
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
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto p-1 text-xs divide-y divide-slate-100">
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
                        <span className="font-bold text-slate-900 group-hover:text-[#1d4ed8]">
                          {p.fullName}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {p.mrn}
                        </span>
                        <span className="font-mono text-[10px] bg-blue-50 text-[#1d4ed8] border border-blue-200 px-1.5 py-0.5 rounded font-black">
                          {p.tokenNumber}
                        </span>
                        {p.admission?.isAdmitted && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200">
                            {p.admission.wardNumber} ({p.admission.bedNumber})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.age}y • {p.gender} • Dr. {p.caseFile.assignedDoctorName} ({p.caseFile.department})
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#1d4ed8] bg-blue-50 px-2 py-1 rounded">
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

      {/* Right Controls matching reference image */}
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors text-xs font-bold animate-pulse cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{statUrgentCount} STAT Alert</span>
          </button>
        )}

        {/* Quick QR Scan */}
        <button
          id="top-scan-qr-btn"
          onClick={onOpenQRScanner}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5 text-slate-500" />
          <span>Scan QR</span>
        </button>

        {/* Primary Action Button in Doctor Royal Blue matching "+ New Prescription" */}
        <button
          id="top-add-patient-cta"
          onClick={onOpenAddPatient}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          <span>+ Enroll Patients</span>
        </button>

        {/* Top-Right User Badge matching Doctor Portal */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-full bg-[#1d4ed8] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
            PS
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              Priya Sharma
            </p>
            <p className="text-[10px] text-emerald-600 font-bold leading-tight">
              Lead Receptionist
            </p>
          </div>
          <button
            type="button"
            id="receptionist-signout-btn"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            title="Sign Out / Switch Portal (Return to Login)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 ml-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
