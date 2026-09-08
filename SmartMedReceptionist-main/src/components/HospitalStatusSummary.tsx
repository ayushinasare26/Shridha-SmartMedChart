import React from 'react';
import {
  Users,
  Stethoscope,
  Building2,
  Clock,
  BedDouble,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Patient, Doctor, ShiftType } from '../types';
import {
  HOSPITAL_WARDS,
  SHIFT_ASSISTANT_DOCTOR_ROSTER,
  SHIFT_TIMINGS,
  getCurrentActiveShift,
} from '../data/wardAndShiftData';

interface HospitalStatusSummaryProps {
  patients: Patient[];
  doctors: Doctor[];
  selectedDoctorFilter: string | null;
  onSelectDoctorFilter: (doctorId: string | null) => void;
  admissionFilter: 'all' | 'admitted' | 'opd';
  onSelectAdmissionFilter: (filter: 'all' | 'admitted' | 'opd') => void;
}

export const HospitalStatusSummary: React.FC<HospitalStatusSummaryProps> = ({
  patients,
  doctors,
  selectedDoctorFilter,
  onSelectDoctorFilter,
  admissionFilter,
  onSelectAdmissionFilter,
}) => {
  const totalPatientsInHospital = patients.length;
  const admittedPatients = patients.filter((p) => p.admission?.isAdmitted);
  const opdPatients = patients.filter((p) => !p.admission?.isAdmitted);

  // Total bed capacity across all wards
  const totalBedsCount = HOSPITAL_WARDS.reduce((acc, w) => acc + w.beds.length, 0);
  const occupiedBedsCount = admittedPatients.length;

  const currentShift: ShiftType = getCurrentActiveShift();
  const currentShiftDoctorList = SHIFT_ASSISTANT_DOCTOR_ROSTER[currentShift];

  // Count how many patients are allotted to each doctor
  const doctorAllotmentMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    doctors.forEach((d) => {
      map[d.id] = 0;
    });
    patients.forEach((p) => {
      const docId = p.caseFile.assignedDoctorId;
      if (docId) {
        map[docId] = (map[docId] || 0) + 1;
      }
    });
    return map;
  }, [patients, doctors]);

  const totalAllottedPatients = Object.values(doctorAllotmentMap).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-3">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Patients in Hospital */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total In Hospital
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {totalPatientsInHospital}
              </span>
              <span className="text-xs text-cyan-700 font-semibold">
                Active Patients
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
              <span className="text-emerald-700 font-bold">{admittedPatients.length} Admitted (IPD)</span>
              <span>•</span>
              <span className="text-slate-600 font-medium">{opdPatients.length} OPD</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#0e3b56] text-cyan-300 flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Admitted Patients & Ward Beds */}
        <div
          onClick={() => onSelectAdmissionFilter(admissionFilter === 'admitted' ? 'all' : 'admitted')}
          className={`p-4 rounded-xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            admissionFilter === 'admitted'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/90 hover:border-emerald-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Admitted & Beds Allotted
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-900 tracking-tight">
                {occupiedBedsCount}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">
                / {totalBedsCount} Beds In Wards
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              7 Wards active (ICU, CCU, GM, Surg, Peds, Resp)
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-700 text-emerald-100 flex items-center justify-center shadow-xs">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Doctors on Duty & Allotted Count */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Attending Physicians
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {doctors.length}
              </span>
              <span className="text-xs text-indigo-700 font-semibold">
                Specialists On Duty
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {totalAllottedPatients} patient allotments active
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-700 text-indigo-100 flex items-center justify-center shadow-xs">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Active Duty Shift & Assistant Doctors */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Hospital Duty Shift
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                LIVE
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-black text-slate-900 tracking-tight">
                {currentShift} Shift
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {SHIFT_TIMINGS[currentShift]}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block truncate max-w-[170px]" title={currentShiftDoctorList.map(d => d.name).join(', ')}>
              Roster MO: {currentShiftDoctorList[0]?.name}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-600 text-amber-50 flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Doctor Breakdown Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Quick Category Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filter View:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => onSelectAdmissionFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  admissionFilter === 'all'
                    ? 'bg-[#0e3b56] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Patients ({totalPatientsInHospital})
              </button>
              <button
                type="button"
                onClick={() => onSelectAdmissionFilter('admitted')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  admissionFilter === 'admitted'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Admitted IPD ({admittedPatients.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectAdmissionFilter('opd')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  admissionFilter === 'opd'
                    ? 'bg-indigo-700 text-white shadow-2xs'
                    : 'text-indigo-800 hover:text-indigo-950'
                }`}
              >
                OPD ({opdPatients.length})
              </button>
            </div>
          </div>

          {selectedDoctorFilter && (
            <button
              onClick={() => onSelectDoctorFilter(null)}
              className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
            >
              <span>Clear Doctor Filter</span>
              <span className="text-xs font-black">×</span>
            </button>
          )}
        </div>

        {/* Doctor Badges */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => onSelectDoctorFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedDoctorFilter === null
                ? 'bg-[#0e3b56] text-white border-[#0e3b56] shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Attending Doctors
          </button>

          {doctors.map((doc) => {
            const count = doctorAllotmentMap[doc.id] || 0;
            const isSelected = selectedDoctorFilter === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => onSelectDoctorFilter(isSelected ? null : doc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-cyan-900 text-white border-cyan-900 shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40'
                }`}
              >
                <span className="font-semibold">{doc.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isSelected ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-100 text-slate-700'
                }`}>
                  {doc.department}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  count > 0 
                    ? isSelected ? 'bg-cyan-400 text-cyan-950 font-black' : 'bg-cyan-100 text-cyan-900'
                    : isSelected ? 'bg-cyan-800 text-cyan-200' : 'bg-slate-100 text-slate-400'
                }`}>
                  {count} {count === 1 ? 'pt' : 'pts'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
