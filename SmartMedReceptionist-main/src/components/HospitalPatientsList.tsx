import React, { useState } from 'react';
import {
  Users,
  Search,
  QrCode,
  FileText,
  Stethoscope,
  Phone,
  Clock,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Patient, Doctor } from '../types';
import { getCurrentActiveShift } from '../data/wardAndShiftData';

interface HospitalPatientsListProps {
  patients: Patient[];
  doctors: Doctor[];
  selectedDoctorFilter: string | null;
  admissionFilter?: 'all' | 'admitted' | 'opd';
  onOpenQRModal: (patient: Patient) => void;
  onOpenCaseFile: (patient: Patient) => void;
  onOpenAdmitModal: (patient: Patient) => void;
  onUpdatePatientDoctor: (patientId: string, newDoctor: Doctor) => void;
}

export const HospitalPatientsList: React.FC<HospitalPatientsListProps> = ({
  patients,
  doctors,
  selectedDoctorFilter,
  admissionFilter = 'all',
  onOpenQRModal,
  onOpenCaseFile,
  onOpenAdmitModal,
  onUpdatePatientDoctor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const currentShift = getCurrentActiveShift();

  // Filter patients based on search, doctor filter, and admission filter
  const filteredPatients = React.useMemo(() => {
    return patients.filter((p) => {
      // Admission filter
      if (admissionFilter === 'admitted' && !p.admission?.isAdmitted) {
        return false;
      }
      if (admissionFilter === 'opd' && p.admission?.isAdmitted) {
        return false;
      }

      // Doctor filter
      if (selectedDoctorFilter && p.caseFile.assignedDoctorId !== selectedDoctorFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesToken = p.tokenNumber.toLowerCase().includes(q);
        const matchesMrn = p.mrn.toLowerCase().includes(q);
        const matchesPhone = p.contactNumber.includes(q);
        const matchesDoc = p.caseFile.assignedDoctorName.toLowerCase().includes(q);
        const matchesDept = p.caseFile.department.toLowerCase().includes(q);
        const matchesWard = (p.admission?.wardNumber || '').toLowerCase().includes(q);
        const matchesBed = (p.admission?.bedNumber || '').toLowerCase().includes(q);
        const matchesComplaint = (p.caseFile.medicalInfo?.chiefComplaint || '').toLowerCase().includes(q);
        return (
          matchesName ||
          matchesToken ||
          matchesMrn ||
          matchesPhone ||
          matchesDoc ||
          matchesDept ||
          matchesWard ||
          matchesBed ||
          matchesComplaint
        );
      }
      return true;
    });
  }, [patients, selectedDoctorFilter, admissionFilter, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-800">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Hospital Inpatients & Outpatients ({filteredPatients.length})
            </h3>
            <p className="text-xs text-slate-500">
              Active patient roster with allotted physicians, hospital beds, and shift assistant doctors
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, token, ward, bed, doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Patient Rows */}
      {filteredPatients.length === 0 ? (
        <div className="p-12 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No patients found</p>
          <p className="text-xs text-slate-500">
            {searchTerm ? `No matches for "${searchTerm}"` : 'No patients currently registered in this view'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Patient Name & MRN</th>
                <th className="py-3 px-4">Allotted Attending Doctor</th>
                <th className="py-3 px-4">Ward & Bed Allocation</th>
                <th className="py-3 px-4">Reason for Visit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-normal">
              {filteredPatients.map((p) => {
                const isAdmitted = Boolean(p.admission?.isAdmitted);
                const activeShiftDoctor = p.admission?.shiftAssistantDoctors?.find(
                  (s) => s.shift === currentShift
                );

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Token Number */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-[#0e3b56] text-cyan-200 border border-cyan-900 shadow-2xs">
                        {p.tokenNumber}
                      </span>
                    </td>

                    {/* Patient Details */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">
                        {p.fullName}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span className="font-medium">{p.age}Y • {p.gender}</span>
                        <span>•</span>
                        <span>{p.contactNumber}</span>
                      </div>
                    </td>

                    {/* Allotted Attending Doctor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                        <span className="font-bold text-slate-900">
                          {p.caseFile.assignedDoctorName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="text-cyan-800 font-semibold">{p.caseFile.department}</span>
                        <span>•</span>
                        <span>{p.caseFile.roomNumber}</span>
                      </div>

                      {/* Inline Doctor Re-allotment */}
                      <div className="mt-1">
                        <select
                          value={p.caseFile.assignedDoctorId}
                          onChange={(e) => {
                            const newDoc = doctors.find((d) => d.id === e.target.value);
                            if (newDoc) {
                              onUpdatePatientDoctor(p.id, newDoc);
                            }
                          }}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 font-medium"
                        >
                          {doctors.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              Re-allot: {doc.name} ({doc.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Ward & Bed Allocation */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isAdmitted && p.admission ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-950 text-xs">
                              {p.admission.wardNumber}
                            </span>
                            <span className="px-1.5 py-0.2 rounded font-mono font-black text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Bed {p.admission.bedNumber}
                            </span>
                          </div>

                          {/* Active Shift Assistant Doctor */}
                          {activeShiftDoctor && (
                            <div className="text-[10px] text-slate-600 flex items-center gap-1">
                              <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[9px]">
                                {activeShiftDoctor.shift} Duty:
                              </span>
                              <span className="font-semibold text-slate-800 truncate max-w-[130px]" title={activeShiftDoctor.assistantDoctorName}>
                                {activeShiftDoctor.assistantDoctorName}
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenAdmitModal(p)}
                            className="text-[10px] text-cyan-700 hover:text-cyan-900 font-bold underline cursor-pointer"
                          >
                            Manage Bed / Shifts
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Outpatient (Not Admitted)
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenAdmitModal(p)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold transition-colors"
                          >
                            <BedDouble className="w-3 h-3 text-emerald-700" />
                            <span>Admit Patient to Bed</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Reason for Visit */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-slate-800 font-medium truncate" title={p.caseFile.medicalInfo.chiefComplaint}>
                        {p.caseFile.medicalInfo.chiefComplaint || 'Routine Medical Evaluation'}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                        MRN: {p.mrn}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isAdmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <BedDouble className="w-3 h-3 text-emerald-700" />
                          <span>Admitted (IPD)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Waiting (OPD)</span>
                        </span>
                      )}
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {isAdmitted ? 'Vitals monitored in ward' : 'Vitals checked in OPD'}
                      </span>
                    </td>

                    {/* Actions: Admit Bed, View QR & Simple Case File */}
                    <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenAdmitModal(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        title="Admit patient, allot bed, ward number and shift-wise assistant doctor"
                      >
                        <BedDouble className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isAdmitted ? 'Bed & Roster' : 'Admit'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenQRModal(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        title="View and print scannable QR token pass"
                      >
                        <QrCode className="w-3.5 h-3.5 text-cyan-700" />
                        <span>QR Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCaseFile(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        title="View simplified case file"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        <span>Case File</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
