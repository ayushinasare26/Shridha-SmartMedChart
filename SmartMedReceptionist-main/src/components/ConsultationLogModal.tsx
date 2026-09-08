import React, { useState } from 'react';
import {
  X,
  History,
  Stethoscope,
  Pill,
  FileCheck,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Patient, Doctor, ConsultationLog, PrescriptionItem } from '../types';

interface ConsultationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  doctors: Doctor[];
  onSaveLog: (updatedPatient: Patient, newLog: ConsultationLog) => void;
}

export const ConsultationLogModal: React.FC<ConsultationLogModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctors,
  onSaveLog,
}) => {
  if (!isOpen) return null;

  const currentDoctor =
    doctors.find((d) => d.id === patient.caseFile.assignedDoctorId) ||
    doctors.find((d) => d.name === patient.caseFile.assignedDoctorName) ||
    doctors[0];

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(currentDoctor.id);
  const [chiefComplaint, setChiefComplaint] = useState(patient.caseFile.medicalInfo.chiefComplaint || '');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [labTests, setLabTests] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [consultationStatus, setConsultationStatus] = useState<
    'Scheduled' | 'In Progress' | 'Completed' | 'Follow-up Required' | 'Referred'
  >('Completed');
  const [receptionistNotes, setReceptionistNotes] = useState('');

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: 'rx-1',
      medicineName: '',
      dosage: '',
      frequency: '1-0-1 (After meals)',
      duration: '5 Days',
      instructions: '',
    },
  ]);

  const addPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      {
        id: `rx-${Date.now()}`,
        medicineName: '',
        dosage: '',
        frequency: '1-0-1 (After meals)',
        duration: '5 Days',
        instructions: '',
      },
    ]);
  };

  const removePrescriptionRow = (id: string) => {
    setPrescriptions(prescriptions.filter((rx) => rx.id !== id));
  };

  const updatePrescriptionRow = (id: string, field: keyof PrescriptionItem, val: string) => {
    setPrescriptions(
      prescriptions.map((rx) => (rx.id === id ? { ...rx, [field]: val } : rx))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find((d) => d.id === selectedDoctorId) || currentDoctor;

    const validPrescriptions = prescriptions.filter((rx) => rx.medicineName.trim().length > 0);

    const newLog: ConsultationLog = {
      id: `con-${Math.floor(1000 + Math.random() * 9000)}`,
      caseFileId: patient.caseFile.id,
      patientId: patient.id,
      patientName: patient.fullName,
      consultationDate: new Date().toISOString(),
      doctorId: doc.id,
      doctorName: doc.name,
      department: doc.department,
      roomNumber: doc.roomNumber,
      chiefComplaint: chiefComplaint || patient.caseFile.medicalInfo.chiefComplaint,
      vitalsAtVisit: patient.caseFile.initialVitals,
      clinicalObservations: clinicalObservations || 'Clinical examination conducted; vitals reviewed.',
      diagnosis: diagnosis || 'Clinical evaluation completed.',
      prescriptions: validPrescriptions,
      labInvestigationsOrdered: labTests
        ? labTests.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      followUpDate: followUpDate || undefined,
      consultationStatus,
      doctorSignature: `${doc.name} (Digital Key: #DOC-${doc.id.replace('doc-', '').toUpperCase()})`,
      receptionistNotes: receptionistNotes || 'Logged and saved to patient EHR archive by Receptionist.',
    };

    // Update patient case file history and set status to Completed or In Progress
    const updatedHistory = [newLog, ...patient.caseFile.consultationHistory];
    const updatedPatient: Patient = {
      ...patient,
      caseFile: {
        ...patient.caseFile,
        updatedAt: new Date().toISOString(),
        currentStatus: consultationStatus === 'Completed' ? 'Completed' : 'In Consultation',
        consultationHistory: updatedHistory,
      },
    };

    onSaveLog(updatedPatient, newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0e3b56] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Store Consultation History Log & Clinical Notes
              </h3>
              <p className="text-[11px] text-cyan-200/80">
                Patient: <span className="font-bold text-white">{patient.fullName}</span> ({patient.mrn}) • File: {patient.caseFile.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Doctor & Room Allotment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Consulting Physician
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.department} - {d.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Consultation Outcome Status
              </label>
              <select
                value={consultationStatus}
                onChange={(e) => setConsultationStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-cyan-900 focus:outline-none"
              >
                <option value="Completed">Completed (Visit Concluded)</option>
                <option value="In Progress">In Progress (Under Active Care)</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Referred">Referred to Specialist</option>
              </select>
            </div>
          </div>

          {/* Chief Complaint & Clinical Observations */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Chief Complaint Discussed
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Objective Clinical Findings & Examination
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Bilateral chest clear, normal vesicular breath sounds. S1, S2 audible with no murmurs. Mild epigastric tenderness."
                value={clinicalObservations}
                onChange={(e) => setClinicalObservations(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Primary Clinical Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Gastritis / Stage 1 Essential Hypertension / Lumbar Muscle Strain"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Prescriptions Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-cyan-600" />
                Medication Prescriptions (Rx)
              </span>
              <button
                type="button"
                onClick={addPrescriptionRow}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-cyan-800 flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3 h-3 text-cyan-700" />
                <span>+ Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2">
              {prescriptions.map((rx, idx) => (
                <div key={rx.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Medicine Name & Strength</label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin 500mg"
                      value={rx.medicineName}
                      onChange={(e) => updatePrescriptionRow(rx.id, 'medicineName', e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border rounded text-xs focus:outline-none font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Dosage Form</label>
                    <input
                      type="text"
                      placeholder="1 Tablet / 5ml"
                      value={rx.dosage}
                      onChange={(e) => updatePrescriptionRow(rx.id, 'dosage', e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border rounded text-xs focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Frequency</label>
                    <select
                      value={rx.frequency}
                      onChange={(e) => updatePrescriptionRow(rx.id, 'frequency', e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border rounded text-xs focus:outline-none"
                    >
                      <option value="1-0-1 (After meals)">1-0-1 (Morning & Night)</option>
                      <option value="1-0-0 (Morning)">1-0-0 (Morning Only)</option>
                      <option value="0-0-1 (Bedtime)">0-0-1 (Bedtime)</option>
                      <option value="1-1-1 (TDS)">1-1-1 (Thrice daily)</option>
                      <option value="SOS (As needed)">SOS (As needed for pain/fever)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Duration</label>
                    <input
                      type="text"
                      placeholder="5 Days"
                      value={rx.duration}
                      onChange={(e) => updatePrescriptionRow(rx.id, 'duration', e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border rounded text-xs focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end justify-center pb-1">
                    {prescriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrescriptionRow(rx.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Investigations & Follow up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Diagnostic Labs Ordered (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Blood Count (CBC), Serum Creatinine, ECG"
                value={labTests}
                onChange={(e) => setLabTests(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Receptionist Notes */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Front Desk / Receptionist Log Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Medication counseling provided at reception; patient advised on follow-up slot"
              value={receptionistNotes}
              onChange={(e) => setReceptionistNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0e3b56] hover:bg-[#08293d] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileCheck className="w-4 h-4 text-cyan-300" />
              <span>Save & Store Consultation Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
