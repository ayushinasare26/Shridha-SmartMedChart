import React from 'react';
import {
  AlertTriangle,
  QrCode,
  FileText,
  UserCheck,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Patient, ActiveWorkspace } from '../types';

interface PatientContextBannerProps {
  patient: Patient | null;
  onOpenQRModal: (patient: Patient) => void;
  onOpenCaseFile: (patient: Patient) => void;
  onOpenDoctorAllotment: (patient: Patient) => void;
  activeWorkspace: ActiveWorkspace;
  onSelectWorkspace: (workspace: ActiveWorkspace) => void;
}

export const PatientContextBanner: React.FC<PatientContextBannerProps> = ({
  patient,
  onOpenQRModal,
  onOpenCaseFile,
  onOpenDoctorAllotment,
  activeWorkspace,
  onSelectWorkspace,
}) => {
  return (
    <div className="space-y-2">
      {/* Workflow Step Indicator Tabs (Directly matches the screenshot header workflow) */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
        <span className="font-bold text-[10px] tracking-wider uppercase text-slate-500 mr-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
          Interactive Reception Workflows:
        </span>

        <button
          onClick={() => onSelectWorkspace('queue')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            activeWorkspace === 'queue'
              ? 'bg-white text-cyan-800 shadow-2xs font-semibold border border-cyan-300'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
        >
          1. Overview & Queue
        </button>

        <span className="text-slate-300">›</span>

        <button
          onClick={() => onSelectWorkspace('case-files')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            activeWorkspace === 'case-files'
              ? 'bg-white text-cyan-800 shadow-2xs font-semibold border border-cyan-300'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
        >
          2. Medical Info & Case File
        </button>

        <span className="text-slate-300">›</span>

        <button
          onClick={() => onSelectWorkspace('qr-station')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            activeWorkspace === 'qr-station'
              ? 'bg-white text-cyan-800 shadow-2xs font-semibold border border-cyan-300'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
        >
          3. Patient QR & Wristband
        </button>

        <span className="text-slate-300">›</span>

        <button
          onClick={() => onSelectWorkspace('doctors')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            activeWorkspace === 'doctors'
              ? 'bg-white text-cyan-800 shadow-2xs font-semibold border border-cyan-300'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
        >
          4. Doctor Allotment
        </button>

        <span className="text-slate-300">›</span>

        <button
          onClick={() => onSelectWorkspace('consultation-logs')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            activeWorkspace === 'consultation-logs'
              ? 'bg-white text-cyan-800 shadow-2xs font-semibold border border-cyan-300'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
        >
          5. Consultation History Logs
        </button>
      </div>

      {/* Selected Patient Banner (High Contrast Dark Navy styling from screenshot) */}
      {patient && (
        <div className="mx-6 rounded-xl bg-[#0c2336] text-white p-3.5 shadow-md border border-[#163a56] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Avatar badge */}
            <div className="w-11 h-11 rounded-lg bg-[#0e3b56] border border-cyan-500/40 text-cyan-300 font-bold flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] tracking-tight leading-none text-cyan-400">OPD</span>
              <span className="text-xs font-black">{patient.tokenNumber?.split('-')?.[1] || patient.tokenNumber || '01'}</span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  {patient.fullName}
                </span>
                <span className="font-mono text-xs bg-[#163a56] text-cyan-200 border border-cyan-500/30 px-2 py-0.5 rounded">
                  {patient.mrn}
                </span>
                <span className="font-mono text-xs bg-cyan-600/30 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded font-bold">
                  Token: {patient.tokenNumber}
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {patient.caseFile?.triagePriority || 'Normal OPD'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300">
                <span>{patient.age}y</span>
                <span className="text-slate-500">•</span>
                <span>{patient.gender}</span>
                <span className="text-slate-500">•</span>
                <span className="font-medium text-emerald-400">Blood: {patient.caseFile?.medicalInfo?.bloodGroup || 'O+'}</span>
                <span className="text-slate-500">•</span>
                <span>{patient.caseFile?.initialVitals?.weightKg || '--'} kg</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-300 flex items-center gap-1 font-medium">
                  <Stethoscope className="w-3.5 h-3.5" />
                  {patient.caseFile?.assignedDoctorName || 'Pending Allotment'} ({patient.caseFile?.department || 'OPD'})
                </span>
                {patient.caseFile?.medicalInfo?.isNPO && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-300 font-semibold bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded text-[10px]">
                      NPO Active (Fasting)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Allergy Warning & Fast Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
            {/* Allergy Chip */}
            {patient.caseFile?.medicalInfo?.allergies && patient.caseFile.medicalInfo.allergies.length > 0 && !patient.caseFile.medicalInfo.allergies.includes('NKDA (No Known Drug Allergies)') ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/90 border border-rose-600/50 text-rose-200 text-xs font-semibold shadow-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="max-w-[240px] truncate">
                  {patient.caseFile.medicalInfo.allergies.join(', ')}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span>NKDA (No Known Allergies)</span>
              </div>
            )}

            {/* View QR Pass / Wristband */}
            <button
              id="banner-view-qr-btn"
              onClick={() => onOpenQRModal(patient)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#144265] hover:bg-[#1a5582] text-cyan-200 hover:text-white border border-cyan-400/40 text-xs font-semibold transition-all shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-300" />
              <span>Patient QR Pass</span>
            </button>

            {/* Case File Details */}
            <button
              id="banner-view-casefile-btn"
              onClick={() => onOpenCaseFile(patient)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Case File & Logs</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
