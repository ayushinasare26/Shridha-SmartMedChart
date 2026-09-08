import React, { useState } from 'react';
import {
  QrCode,
  Search,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  User,
  HeartPulse,
  ExternalLink,
} from 'lucide-react';
import { Patient } from '../types';

interface PatientQRStationViewProps {
  patients: Patient[];
  onOpenQRModal: (patient: Patient) => void;
  onOpenCaseFile: (patient: Patient) => void;
}

export const PatientQRStationView: React.FC<PatientQRStationViewProps> = ({
  patients,
  onOpenQRModal,
  onOpenCaseFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.tokenNumber.toLowerCase().includes(q) ||
      (p?.caseFile?.assignedDoctorName && p.caseFile.assignedDoctorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-700" />
            <span>Digital Patient QR Wristband & Health Pass Station</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate, preview, and print high-resolution scannable clinical passes for all registered patients
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-300" />
          <span>Batch Print Wristbands</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by patient name, MRN, or token..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none shadow-2xs"
        />
      </div>

      {/* Grid of Patient QR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const hasAllergies =
            patient.caseFile.medicalInfo.allergies &&
            patient.caseFile.medicalInfo.allergies.length > 0 &&
            !patient.caseFile.medicalInfo.allergies.includes('NKDA (No Known Drug Allergies)');

          return (
            <div
              key={patient.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{patient.fullName}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded">
                        {patient.mrn}
                      </span>
                      <span>•</span>
                      <span>{patient.age}y {patient.gender}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black bg-cyan-900 text-cyan-200 px-2 py-0.5 rounded">
                    {patient.tokenNumber}
                  </span>
                </div>

                {/* Blood & Allergy Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    Blood: {patient.caseFile.medicalInfo.bloodGroup}
                  </span>
                  {hasAllergies ? (
                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Allergy Flagged
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                      NKDA
                    </span>
                  )}
                </div>

                {/* Doctor & Dept */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Assigned Doctor</span>
                    <span className="font-bold text-slate-800">{patient.caseFile.assignedDoctorName}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Department:</span>
                    <span className="font-medium text-slate-700">{patient.caseFile.department}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>OPD Room:</span>
                    <span className="font-mono font-medium text-slate-700">{patient.caseFile.roomNumber}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenQRModal(patient)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>View & Print QR Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCaseFile(patient)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  title="Open Case File"
                >
                  File
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
