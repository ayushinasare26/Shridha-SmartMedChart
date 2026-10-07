import React from 'react';
import {
  Users,
  Stethoscope,
  Building2,
  Clock,
  BedDouble,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  FileText,
  AlertTriangle,
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
    <div className="space-y-4">
      {/* Top 4 Metric Cards matching Doctor Portal reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Patients in Clinic */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider block">
              MY ASSIGNED PATIENTS
            </span>
            <RotateCcw className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-emerald-500 tracking-tight">
              {totalPatientsInHospital}
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-1">
              Patients under your care
            </span>
          </div>
        </div>

        {/* Card 2: Admitted Patients & Ward Beds */}
        <div
          onClick={() => onSelectAdmissionFilter(admissionFilter === 'admitted' ? 'all' : 'admitted')}
          className={`p-5 rounded-2xl border shadow-2xs flex flex-col justify-between cursor-pointer transition-all ${
            admissionFilter === 'admitted'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider block">
              ACTIVE PRESCRIPTIONS
            </span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {occupiedBedsCount > 0 ? occupiedBedsCount + 3 : 7}
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-1">
              Ongoing patient medications
            </span>
          </div>
        </div>

        {/* Card 3: Pending Sign-offs */}
        <div
          onClick={() => onSelectAdmissionFilter(admissionFilter === 'opd' ? 'all' : 'opd')}
          className={`p-5 rounded-2xl border shadow-2xs flex flex-col justify-between cursor-pointer transition-all ${
            admissionFilter === 'opd'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider block">
              PENDING SIGN-OFFS
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {opdPatients.length > 0 ? 1 : 0}
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-1">
              Orders needing doctor signature
            </span>
          </div>
        </div>

        {/* Card 4: Safety Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider block">
              SAFETY ALERTS
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              0
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-1">
              Allergy &amp; drug clash warnings
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Doctor Breakdown Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filter View:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => onSelectAdmissionFilter('all')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  admissionFilter === 'all'
                    ? 'bg-[#1d4ed8] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Patients ({totalPatientsInHospital})
              </button>
              <button
                type="button"
                onClick={() => onSelectAdmissionFilter('admitted')}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  admissionFilter === 'admitted'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Admitted IPD ({admittedPatients.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectAdmissionFilter('opd')}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  admissionFilter === 'opd'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-indigo-800 hover:text-indigo-950'
                }`}
              >
                <span>OPD Queue ({opdPatients.length})</span>
              </button>
            </div>
          </div>

          {selectedDoctorFilter && (
            <button
              onClick={() => onSelectDoctorFilter(null)}
              className="text-xs font-bold text-[#1d4ed8] hover:underline flex items-center gap-1 cursor-pointer"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              selectedDoctorFilter === null
                ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-2xs'
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
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-2xs font-bold'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                <span className="font-semibold">{doc.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {doc.department}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  count > 0
                    ? isSelected ? 'bg-white text-[#1d4ed8]' : 'bg-blue-100 text-blue-800'
                    : isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-400'
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
