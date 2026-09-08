import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Stethoscope,
  Pill,
  FileText,
  Calendar,
  CheckCircle2,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Patient, ConsultationLog, Doctor } from '../types';

interface ConsultationHistoryViewProps {
  patients: Patient[];
  doctors: Doctor[];
  onOpenCaseFile: (patient: Patient) => void;
  onOpenAddConsultation: (patient: Patient) => void;
}

export const ConsultationHistoryView: React.FC<ConsultationHistoryViewProps> = ({
  patients,
  doctors,
  onOpenCaseFile,
  onOpenAddConsultation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');

  // Collect all consultation logs across all patients
  const allLogs = React.useMemo(() => {
    const list: { log: ConsultationLog; patient: Patient }[] = [];
    patients.forEach((p) => {
      p?.caseFile?.consultationHistory?.forEach((log) => {
        list.push({ log, patient: p });
      });
    });
    // Sort newest first
    return list.sort(
      (a, b) => new Date(b.log?.consultationDate || 0).getTime() - new Date(a.log?.consultationDate || 0).getTime()
    );
  }, [patients]);

  const filteredLogs = allLogs.filter(({ log, patient }) => {
    if (selectedDept !== 'all' && log.department !== selectedDept) return false;
    if (selectedDoctorFilter !== 'all' && log.doctorId !== selectedDoctorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        patient.fullName.toLowerCase().includes(q) ||
        patient.mrn.toLowerCase().includes(q) ||
        log.diagnosis.toLowerCase().includes(q) ||
        log.doctorName.toLowerCase().includes(q) ||
        log.chiefComplaint.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-700" />
            <span>Master Consultation History Logs & Clinical Audit Archive</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized registry of doctor consultations, prescriptions, clinical notes, and follow-up advice
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Audit Report</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search diagnosis, patient name, MRN, doctor, or log ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Specialties</option>
            <option value="Cardiology">Cardiology</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Neurology">Neurology</option>
            <option value="Pulmonology">Pulmonology</option>
            <option value="Emergency Triage">Emergency Triage</option>
          </select>

          {/* Doctor Filter */}
          <select
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Doctors ({doctors.length})</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map(({ log, patient }) => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              {/* Top Row: Date, Doctor, Patient & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded">
                    {log.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(log.consultationDate).toLocaleString()}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-cyan-700" />
                    {log.doctorName} ({log.department})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                    {log.consultationStatus}
                  </span>
                  <button
                    onClick={() => onOpenCaseFile(patient)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3 h-3 text-slate-500" />
                    <span>View Case File</span>
                  </button>
                </div>
              </div>

              {/* Patient Information & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Patient Tag */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Demographic</span>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">{patient.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {patient.mrn} • {patient.age}y • Blood: {patient.caseFile.medicalInfo.bloodGroup}
                  </p>
                </div>

                {/* Complaint & Findings */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Chief Complaint</span>
                  <p className="font-medium text-slate-800 text-xs mt-0.5 truncate">
                    {log.chiefComplaint}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {log.clinicalObservations}
                  </p>
                </div>

                {/* Primary Diagnosis */}
                <div className="p-2.5 bg-cyan-50/50 rounded-lg border border-cyan-200">
                  <span className="text-[10px] text-cyan-800 uppercase font-bold block">Clinical Diagnosis</span>
                  <p className="font-extrabold text-cyan-950 text-xs mt-0.5">
                    {log.diagnosis}
                  </p>
                  {log.followUpDate && (
                    <p className="text-[11px] text-cyan-800 mt-1 font-medium">
                      Next Follow-up: {new Date(log.followUpDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Prescriptions & Lab Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-cyan-600" />
                    Prescriptions ({log.prescriptions.length}):
                  </span>
                  {log.prescriptions.length > 0 ? (
                    log.prescriptions.map((rx) => (
                      <span
                        key={rx.id}
                        className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-800"
                      >
                        {rx.medicineName} ({rx.frequency})
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No oral meds prescribed</span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Signed: {log.doctorSignature}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-800">No consultation logs found</h3>
            <p className="text-xs text-slate-500">
              There are no consultation logs matching your filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
