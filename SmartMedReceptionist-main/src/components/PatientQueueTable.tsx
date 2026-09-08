import React, { useState } from 'react';
import {
  QrCode,
  FileText,
  UserCheck,
  Stethoscope,
  AlertTriangle,
  Clock,
  Heart,
  Activity,
  Plus,
  Filter,
  CheckCircle,
  ExternalLink,
  Phone,
} from 'lucide-react';
import { Patient, DoctorDepartment } from '../types';

interface PatientQueueTableProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onOpenQRModal: (patient: Patient) => void;
  onOpenCaseFile: (patient: Patient) => void;
  onOpenDoctorAllotment: (patient: Patient) => void;
  onOpenAddPatient: () => void;
  onOpenConsultationLog: (patient: Patient) => void;
}

export const PatientQueueTable: React.FC<PatientQueueTableProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onOpenQRModal,
  onOpenCaseFile,
  onOpenDoctorAllotment,
  onOpenAddPatient,
  onOpenConsultationLog,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const filteredPatients = patients.filter((p) => {
    if (statusFilter === 'waiting' && p?.caseFile?.currentStatus !== 'Waiting in Queue' && p?.caseFile?.currentStatus !== 'Registered') {
      return false;
    }
    if (statusFilter === 'in-consultation' && p?.caseFile?.currentStatus !== 'In Consultation') {
      return false;
    }
    if (statusFilter === 'completed' && p?.caseFile?.currentStatus !== 'Completed') {
      return false;
    }
    if (statusFilter === 'urgent' && p?.caseFile?.triagePriority !== 'STAT Urgent' && p?.caseFile?.triagePriority !== 'STAT Emergency') {
      return false;
    }
    if (departmentFilter !== 'all' && p?.caseFile?.department !== departmentFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status?: string, triage?: string) => {
    if (triage === 'STAT Urgent' || triage === 'STAT Emergency') {
      return (
        <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
          STAT Urgent
        </span>
      );
    }
    switch (status) {
      case 'In Consultation':
        return (
          <span className="bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
            In Consultation
          </span>
        );
      case 'Waiting in Queue':
      case 'Registered':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
            Waiting in Queue
          </span>
        );
      case 'Completed':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] uppercase">
            {status || 'Waiting'}
          </span>
        );
    }
  };

  const getBorderColor = (p: Patient) => {
    if (p?.caseFile?.triagePriority === 'STAT Urgent' || p?.caseFile?.triagePriority === 'STAT Emergency') {
      return 'border-l-4 border-l-rose-500';
    }
    if (p?.caseFile?.currentStatus === 'In Consultation') {
      return 'border-l-4 border-l-cyan-600';
    }
    if (p?.caseFile?.currentStatus === 'Completed') {
      return 'border-l-4 border-l-emerald-500';
    }
    if (p?.caseFile?.triagePriority === 'Priority') {
      return 'border-l-4 border-l-amber-500';
    }
    return 'border-l-4 border-l-slate-400';
  };

  return (
    <div className="px-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Central Reception Patient Intake & Consultation Queue</span>
            <span className="text-xs font-mono font-medium text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
              {filteredPatients.length} Patients
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live patient intake timeline • Current Shift 07:00 – 15:00 • Metropolitan General Hospital
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Neurology">Neurology</option>
              <option value="Pulmonology">Pulmonology</option>
              <option value="Emergency Triage">Emergency Triage</option>
            </select>
          </div>

          {/* New Patient Intake Button */}
          <button
            onClick={onOpenAddPatient}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e3b56] hover:bg-[#082b40] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-300" />
            <span>+ Add Patient & File</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Intake ({patients.length})
        </button>
        <button
          onClick={() => setStatusFilter('waiting')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            statusFilter === 'waiting'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          Waiting for Doctor ({patients.filter(p => p.caseFile.currentStatus === 'Waiting in Queue' || p.caseFile.currentStatus === 'Registered').length})
        </button>
        <button
          onClick={() => setStatusFilter('in-consultation')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            statusFilter === 'in-consultation'
              ? 'bg-cyan-700 text-white shadow-2xs'
              : 'bg-white text-cyan-800 border border-cyan-200 hover:bg-cyan-50'
          }`}
        >
          In Consultation ({patients.filter(p => p.caseFile.currentStatus === 'In Consultation').length})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            statusFilter === 'completed'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          Consultation Completed ({patients.filter(p => p?.caseFile?.currentStatus === 'Completed').length})
        </button>
        <button
          onClick={() => setStatusFilter('urgent')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            statusFilter === 'urgent'
              ? 'bg-rose-700 text-white shadow-2xs'
              : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          STAT Urgent ({patients.filter(p => p?.caseFile?.triagePriority === 'STAT Urgent' || p?.caseFile?.triagePriority === 'STAT Emergency').length})
        </button>
      </div>

      {/* Patient Cards List (matching the screenshot's list cards) */}
      <div className="space-y-3">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => {
            const isSelected = selectedPatient?.id === patient.id;
            return (
              <div
                key={patient.id}
                id={`patient-card-${patient.id}`}
                onClick={() => onSelectPatient(patient)}
                className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-2xs ${getBorderColor(patient)} ${
                  isSelected
                    ? 'ring-2 ring-cyan-600 border-cyan-300 bg-cyan-50/20'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Token, Time & Demographics */}
                  <div className="flex items-start gap-3.5">
                    {/* Token Box */}
                    <div className="w-14 text-center shrink-0 pt-0.5">
                      <div className="font-mono text-base font-extrabold text-slate-900 leading-tight">
                        {patient.tokenNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(patient.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(patient?.caseFile?.currentStatus, patient?.caseFile?.triagePriority)}
                      </div>
                    </div>

                    {/* Patient & Medical Overview */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight hover:text-cyan-700">
                          {patient.fullName}
                        </h3>
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                          {patient.mrn}
                        </span>
                        <span className="text-xs text-slate-500">
                          {patient.age}y • {patient.gender}
                        </span>
                        <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          {patient?.caseFile?.medicalInfo?.bloodGroup || 'O+'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          File: {patient?.caseFile?.id || '--'}
                        </span>
                      </div>

                      {/* Chief Complaint */}
                      <p className="text-xs text-slate-700 font-medium line-clamp-2">
                        <span className="text-slate-400 font-normal">Complaint: </span>
                        {patient?.caseFile?.medicalInfo?.chiefComplaint || 'Evaluation'}
                      </p>

                      {/* Assigned Doctor & Vitals pill row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          <Stethoscope className="w-3.5 h-3.5 text-cyan-700" />
                          {patient?.caseFile?.assignedDoctorName || 'Pending'} ({patient?.caseFile?.department || 'OPD'})
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {patient?.caseFile?.roomNumber || 'Room --'}
                        </span>

                        <span className="text-slate-300">|</span>

                        {/* Vitals summary */}
                        <div className="inline-flex items-center gap-2 text-[11px] text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <span>BP: {patient?.caseFile?.initialVitals?.bloodPressure || '120/80'}</span>
                          <span>•</span>
                          <span>HR: {patient?.caseFile?.initialVitals?.heartRateBpm || '--'} bpm</span>
                          <span>•</span>
                          <span>SpO2: {patient?.caseFile?.initialVitals?.spO2Percent || '--'}%</span>
                        </div>

                        {/* Allergy warning if any */}
                        {patient?.caseFile?.medicalInfo?.allergies && patient.caseFile.medicalInfo.allergies.length > 0 && !patient.caseFile.medicalInfo.allergies.includes('NKDA (No Known Drug Allergies)') && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {patient.caseFile.medicalInfo.allergies[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Receptionist Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                    {/* View / Print QR Code */}
                    <button
                      id={`qr-btn-${patient.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQRModal(patient);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cyan-300 bg-cyan-50/80 hover:bg-cyan-100 text-cyan-900 text-xs font-semibold transition-colors shadow-2xs"
                      title="View & Print Patient QR Wristband"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Patient QR</span>
                    </button>

                    {/* Allot / Transfer Doctor */}
                    <button
                      id={`allot-btn-${patient.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDoctorAllotment(patient);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
                      title="Reassign or allot doctor"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Allot Doctor</span>
                    </button>

                    {/* Full Case File */}
                    <button
                      id={`casefile-btn-${patient.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCaseFile(patient);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e3b56] hover:bg-[#092b3f] text-white text-xs font-semibold transition-colors shadow-2xs"
                      title="Open full medical case file and history logs"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Case File & Logs ({patient?.caseFile?.consultationHistory?.length || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No patients in this view</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no registered patients matching your selected filters. Register a new patient to initialize their case file and generate a QR pass.
            </p>
            <button
              onClick={onOpenAddPatient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e3b56] text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
