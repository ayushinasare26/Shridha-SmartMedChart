import React from 'react';
import {
  X,
  FileText,
  Stethoscope,
  QrCode,
  Printer,
  Calendar,
  Phone,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  BedDouble,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Patient, Doctor } from '../types';
import { getCurrentActiveShift } from '../data/wardAndShiftData';

interface SimpleCaseFileModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onOpenQRModal: (patient: Patient) => void;
  onOpenAdmitModal?: (patient: Patient) => void;
  onUpdatePatientDoctor?: (patientId: string, doctor: Doctor) => void;
}

export const SimpleCaseFileModal: React.FC<SimpleCaseFileModalProps> = ({
  patient,
  isOpen,
  onClose,
  doctors,
  onOpenQRModal,
  onOpenAdmitModal,
  onUpdatePatientDoctor,
}) => {
  if (!isOpen || !patient) return null;

  const { caseFile, admission } = patient;
  const isAdmitted = Boolean(admission?.isAdmitted);
  const currentShift = getCurrentActiveShift();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0e3b56] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Hospital Case File
                </h3>
                <span className="font-mono text-xs bg-cyan-900 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded font-bold">
                  {caseFile.id}
                </span>
                <span className="font-mono text-xs bg-cyan-600 text-white px-2 py-0.5 rounded font-black">
                  Token: {patient.tokenNumber}
                </span>
              </div>
              <p className="text-xs text-cyan-200/80 mt-0.5">
                Registered on {new Date(patient.registrationDate).toLocaleDateString()} at{' '}
                {new Date(patient.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Simple Clean Layout */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Patient Profile Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-slate-900">{patient.fullName}</h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {patient.age} Yrs • {patient.gender}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                  {patient.mrn}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.contactNumber}
                </span>
                {patient.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {patient.address}
                  </span>
                )}
                {patient.emergencyContact?.name && (
                  <span className="text-slate-500">
                    Emergency:{' '}
                    <strong className="text-slate-700">
                      {patient.emergencyContact.name} ({patient.emergencyContact.relationship || 'Kin'})
                    </strong>{' '}
                    • {patient.emergencyContact.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenQRModal(patient)}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>View QR Pass</span>
              </button>
            </div>
          </div>

          {/* Admission & Ward / Bed Allotment Details */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-emerald-700" />
                <span>Hospital Admission & Ward Allotment</span>
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isAdmitted
                    ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isAdmitted ? 'Patient Admitted (IPD)' : 'Outpatient (OPD Only)'}
              </span>
            </div>

            {isAdmitted && admission ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Allotted Ward & Bed
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-extrabold text-slate-900 text-sm">{admission.wardNumber}</span>
                      <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                        Bed {admission.bedNumber}
                      </span>
                    </div>
                    {admission.admissionDate && (
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Admitted: {new Date(admission.admissionDate).toLocaleDateString()} at{' '}
                        {new Date(admission.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Admitting Attending Doctor
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {admission.admittingDoctorName || caseFile.assignedDoctorName}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Department: {caseFile.department}
                    </span>
                  </div>
                </div>

                {/* Shift-Wise Assistant Doctors Schedule */}
                <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      Shifting Time-Wise Assistant Doctor Roster
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      Active: {currentShift} Shift
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {admission.shiftAssistantDoctors?.map((shiftDoc) => {
                      const isNow = shiftDoc.shift === currentShift;
                      return (
                        <div
                          key={shiftDoc.shift}
                          className={`p-2 rounded border text-xs ${
                            isNow
                              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{shiftDoc.shift} Shift</span>
                            {isNow && (
                              <span className="text-[8px] font-black bg-amber-200 text-amber-900 px-1 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-slate-800 text-[11px] mt-0.5 truncate">
                            {shiftDoc.assistantDoctorName}
                          </p>
                          <span className="text-[10px] text-slate-500 block truncate font-mono">
                            {shiftDoc.contactNumber || 'On-duty desk'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {admission.admissionNotes && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-emerald-200">
                    <strong className="text-slate-900">Admission Notes:</strong> {admission.admissionNotes}
                  </div>
                )}

                {onOpenAdmitModal && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdmitModal(patient);
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                    >
                      Re-Allot Bed, Ward or Shift Doctors →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-600">
                  Patient is currently registered for outpatient OPD consultation. Not yet admitted to a ward bed.
                </p>
                {onOpenAdmitModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmitModal(patient);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs"
                  >
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Admit to Bed Now</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Allotted Doctor Card */}
          <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-cyan-700" />
                Allotted Doctor & OPD Room
              </span>
              <span className="text-[11px] font-semibold text-cyan-800 bg-white px-2 py-0.5 rounded border border-cyan-200">
                Status: Waiting for Examination
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {caseFile.assignedDoctorName}
                </p>
                <p className="text-xs text-slate-600">
                  Department: <strong className="text-cyan-800">{caseFile.department}</strong> • Room:{' '}
                  <strong className="text-slate-800">{caseFile.roomNumber}</strong>
                </p>
              </div>

              {/* Optional Doctor Re-Allotment selector if receptionist needs to change */}
              {onUpdatePatientDoctor && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-500 whitespace-nowrap">Change Doctor:</label>
                  <select
                    value={caseFile.assignedDoctorId}
                    onChange={(e) => {
                      const newDoc = doctors.find((d) => d.id === e.target.value);
                      if (newDoc) {
                        onUpdatePatientDoctor(patient.id, newDoc);
                      }
                    }}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:ring-1 focus:ring-cyan-600"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.department} - {doc.roomNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Reason for Hospital Visit / Chief Complaint */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Reason for Visit / Chief Complaint
            </h5>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
              {caseFile.medicalInfo.chiefComplaint || 'Routine medical evaluation requested at intake.'}
            </div>
            {caseFile.medicalInfo.receptionistObservations && (
              <p className="text-[11px] text-slate-500 italic">
                Desk note: {caseFile.medicalInfo.receptionistObservations}
              </p>
            )}
          </div>

          {/* Clinical Note: Vitals are checked by Doctor */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Clinical Intake Policy:</strong>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                Patient initial vitals (Blood Pressure, Pulse, SpO2, and Temperature) and physical diagnostics are examined directly by Dr. {caseFile.assignedDoctorName} inside {caseFile.roomNumber} during consultation.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SmartMedChart Receptionist Desk</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#0e3b56] hover:bg-[#08273a] text-white rounded-lg text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
