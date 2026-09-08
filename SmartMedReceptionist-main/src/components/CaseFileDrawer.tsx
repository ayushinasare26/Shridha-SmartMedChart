import React, { useState } from 'react';
import {
  X,
  FileText,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  History,
  QrCode,
  Calendar,
  Pill,
  Clock,
  Printer,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Patient, Doctor, ConsultationLog } from '../types';
import { ConsultationLogModal } from './ConsultationLogModal';

interface CaseFileDrawerProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onOpenQRModal: (patient: Patient) => void;
  onOpenDoctorAllotment: (patient: Patient) => void;
  onPatientUpdated: (updatedPatient: Patient) => void;
}

export const CaseFileDrawer: React.FC<CaseFileDrawerProps> = ({
  patient,
  isOpen,
  onClose,
  doctors,
  onOpenQRModal,
  onOpenDoctorAllotment,
  onPatientUpdated,
}) => {
  const [isAddingConsultation, setIsAddingConsultation] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  if (!isOpen || !patient) return null;

  const { caseFile } = patient;
  const { medicalInfo, initialVitals, consultationHistory } = caseFile;

  const handleSaveConsultationLog = (updatedPatient: Patient, newLog: ConsultationLog) => {
    onPatientUpdated(updatedPatient);
    setExpandedLogId(newLog.id);
  };

  const hasAllergies =
    medicalInfo.allergies &&
    medicalInfo.allergies.length > 0 &&
    !medicalInfo.allergies.includes('NKDA (No Known Drug Allergies)');

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-2xs overflow-hidden">
        <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-[#0e3b56] text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Medical Case File: {caseFile.id}
                  </h2>
                  <span className="font-mono text-xs bg-cyan-900/80 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded font-bold">
                    {patient.mrn}
                  </span>
                  <span className="font-mono text-xs bg-[#163a56] text-cyan-300 px-2 py-0.5 rounded">
                    Token: {caseFile.tokenNumber}
                  </span>
                </div>
                <p className="text-xs text-cyan-200/80 mt-0.5">
                  Patient: <span className="text-white font-semibold">{patient.fullName}</span> ({patient.age}y, {patient.gender}) • Registered by {caseFile.registeredByStaff}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenQRModal(patient)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Wristband</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
            {/* Critical Allergy Alert Banner */}
            {hasAllergies && (
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-rose-900">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide text-rose-800">
                      Severe Drug Allergy Warning Flagged
                    </h4>
                    <p className="text-xs text-rose-700 font-medium mt-0.5">
                      {medicalInfo.allergies.join(', ')}
                    </p>
                  </div>
                </div>
                <span className="bg-rose-200/80 text-rose-900 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase">
                  Cross-Reaction Guard Active
                </span>
              </div>
            )}

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Triage Priority</span>
                <span className="font-bold text-xs text-slate-900 mt-1 block">
                  {caseFile.triagePriority}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Status</span>
                <span className="font-bold text-xs text-cyan-800 mt-1 block">
                  {caseFile.currentStatus}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Allotted Doctor</span>
                <span className="font-bold text-xs text-slate-900 mt-1 block truncate">
                  {caseFile.assignedDoctorName}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">OPD Location</span>
                <span className="font-bold text-xs text-slate-900 mt-1 block truncate">
                  {caseFile.roomNumber}
                </span>
              </div>
            </div>

            {/* SECTION 1: Baseline Medical Information & Vitals */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-cyan-600" />
                  <span>Basic Medical Information & Baseline Vitals</span>
                </h3>
                <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  Blood Group: {medicalInfo.bloodGroup}
                </span>
              </div>

              {/* Chief Complaint */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Chief Complaint on Admission / Intake:
                </span>
                <p className="text-xs font-semibold text-slate-900">
                  {medicalInfo.chiefComplaint}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span>Duration: <strong className="text-slate-700">{medicalInfo.symptomsDuration}</strong></span>
                  <span>•</span>
                  <span>
                    NPO Status: {medicalInfo.isNPO ? (
                      <strong className="text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">Fasting (Active)</strong>
                    ) : (
                      <span className="text-slate-600">Non-Fasting</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Vitals Grid */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Baseline Triage Vitals:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 font-mono">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">Blood Pressure</span>
                    <span className="font-bold text-xs text-slate-900">
                      {initialVitals.bpSystolic}/{initialVitals.bpDiastolic}
                    </span>
                    <span className="text-[9px] text-slate-400 block">mmHg</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">Heart Rate</span>
                    <span className="font-bold text-xs text-slate-900">{initialVitals.heartRate}</span>
                    <span className="text-[9px] text-slate-400 block">bpm</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">SpO2 Oxygen</span>
                    <span className="font-bold text-xs text-emerald-700">{initialVitals.spO2}%</span>
                    <span className="text-[9px] text-slate-400 block">Pulse Oximeter</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">Body Temp</span>
                    <span className="font-bold text-xs text-slate-900">{initialVitals.temperature}°F</span>
                    <span className="text-[9px] text-slate-400 block">Oral/Tympanic</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">Weight</span>
                    <span className="font-bold text-xs text-slate-900">{initialVitals.weightKg} kg</span>
                    <span className="text-[9px] text-slate-400 block">Scale</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">Height</span>
                    <span className="font-bold text-xs text-slate-900">{initialVitals.heightCm} cm</span>
                    <span className="text-[9px] text-slate-400 block">Stadiometer</span>
                  </div>

                  <div className="bg-cyan-50 p-2 rounded-lg border border-cyan-200 text-center">
                    <span className="text-[10px] text-cyan-800 block font-sans uppercase font-semibold">BMI Index</span>
                    <span className="font-bold text-xs text-cyan-900">{initialVitals.bmi}</span>
                    <span className="text-[9px] text-cyan-700 block">Calculated</span>
                  </div>
                </div>
              </div>

              {/* Chronic conditions & Regular medications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Chronic Medical Conditions:
                  </span>
                  {medicalInfo.chronicConditions && medicalInfo.chronicConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {medicalInfo.chronicConditions.map((c) => (
                        <span key={c} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px] font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">None reported</span>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Regular Medications:
                  </span>
                  {medicalInfo.currentMedications && medicalInfo.currentMedications.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {medicalInfo.currentMedications.map((m) => (
                        <span key={m} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px] font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No regular medications declared</span>
                  )}
                </div>
              </div>

              {/* Receptionist Observations */}
              {medicalInfo.receptionistObservations && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-700">Front Desk Intake Notes: </strong>
                  {medicalInfo.receptionistObservations}
                </div>
              )}
            </div>

            {/* SECTION 2: Doctor Allotment Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Allotted Consulting Physician
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {caseFile.assignedDoctorName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Department of {caseFile.department} • {caseFile.roomNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenDoctorAllotment(patient)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors shadow-2xs shrink-0"
              >
                Change / Transfer Doctor
              </button>
            </div>

            {/* SECTION 3: Consultation History Logs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-600" />
                    <span>Consultation History Logs ({consultationHistory.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chronological consultation records, prescriptions, and clinical diagnosis notes
                  </p>
                </div>

                <button
                  id="open-add-consultation-btn"
                  onClick={() => setIsAddingConsultation(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0e3b56] hover:bg-[#072437] text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-300" />
                  <span>+ Log Consultation</span>
                </button>
              </div>

              {/* Logs Timeline */}
              <div className="space-y-3">
                {consultationHistory.length > 0 ? (
                  consultationHistory.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <div
                        key={log.id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        {/* Summary Bar */}
                        <div
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-xs">
                                  {log.diagnosis}
                                </h4>
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  ID: {log.id}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  {log.consultationStatus}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {new Date(log.consultationDate).toLocaleString()} • Dr. {log.doctorName} ({log.department})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-slate-400">
                              {log.prescriptions.length} Rx • {log.labInvestigationsOrdered.length} Labs
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50/70 border-t border-slate-200 space-y-3.5 text-xs">
                            {/* Clinical observations */}
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Clinical Examination & Findings:
                              </span>
                              <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                {log.clinicalObservations}
                              </p>
                            </div>

                            {/* Prescriptions */}
                            {log.prescriptions.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                  Prescriptions Dispensed / Advised:
                                </span>
                                <div className="space-y-1.5">
                                  {log.prescriptions.map((rx) => (
                                    <div
                                      key={rx.id}
                                      className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Pill className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                        <span className="font-bold text-slate-900">{rx.medicineName}</span>
                                        {rx.dosage && <span className="text-slate-500">({rx.dosage})</span>}
                                      </div>
                                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-medium">
                                          {rx.frequency}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span>{rx.duration}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lab orders & Follow-up */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {log.labInvestigationsOrdered.length > 0 && (
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Laboratory Tests Ordered:
                                  </span>
                                  <ul className="list-disc list-inside text-slate-700 space-y-0.5 text-[11px]">
                                    {log.labInvestigationsOrdered.map((test, i) => (
                                      <li key={i}>{test}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {log.followUpDate && (
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Recommended Follow-Up Slot:
                                  </span>
                                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                                    <span>{new Date(log.followUpDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Digital signature & Reception notes */}
                            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1">
                              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Signed: {log.doctorSignature}</span>
                              </div>
                              {log.receptionistNotes && (
                                <span className="italic text-slate-400">
                                  Note: {log.receptionistNotes}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-2">
                    <History className="w-8 h-8 text-slate-300 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">No consultation history logs recorded yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      This patient has been registered and initialized in the case file. Click "Log Consultation" to record the doctor's clinical findings, diagnosis, and prescriptions.
                    </p>
                    <button
                      onClick={() => setIsAddingConsultation(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e3b56] text-white text-xs font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Log First Consultation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Full EHR Case File Synchronized & Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Case Summary</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Consultation Modal */}
      <ConsultationLogModal
        isOpen={isAddingConsultation}
        onClose={() => setIsAddingConsultation(false)}
        patient={patient}
        doctors={doctors}
        onSaveLog={handleSaveConsultationLog}
      />
    </>
  );
};
