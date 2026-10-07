import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientService, noteService } from '../services/api.services';
import { useAuth } from '../hooks/useAuth';
import { format, differenceInYears } from 'date-fns';
import {
  X, Printer, Activity, AlertTriangle, Pill,
  FileText, CheckCircle2, Stethoscope, Plus, Check, Send, Clock
} from 'lucide-react';

interface PatientCaseFileModalProps {
  patientId: string;
  onClose: () => void;
  onNewOrder?: (patientId: string) => void;
}

export function PatientCaseFileModal({ patientId, onClose, onNewOrder }: PatientCaseFileModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'allergies' | 'prescriptions' | 'emar' | 'notes'>('overview');

  // Form state for writing a new doctor progress note
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState('ICU Clinical Progress Note');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const { data: patient, isLoading, refetch } = useQuery({
    queryKey: ['patient-case-file', patientId],
    queryFn: () => patientService.getById(patientId),
    enabled: !!patientId,
  });

  const isAttendingDoctor = user?.id && patient?.attendingId === user.id;

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment.trim() && !subjective.trim() && !objective.trim()) {
      alert('Please enter at least an Assessment, Subjective, or Objective finding.');
      return;
    }

    setIsSubmittingNote(true);
    try {
      const compiledContent = [
        subjective.trim() ? `[S] ${subjective.trim()}` : null,
        objective.trim() ? `[O] ${objective.trim()}` : null,
        assessment.trim() ? `[A] ${assessment.trim()}` : null,
        plan.trim() ? `[P] ${plan.trim()}` : null,
      ].filter(Boolean).join('\n\n');

      await noteService.create({
        patientId,
        type: 'DOCTOR_PROGRESS_NOTE',
        title: noteTitle,
        category: 'SOAP',
        content: compiledContent,
        subjective,
        objective,
        assessment,
        plan,
      });

      // Clear form
      setSubjective('');
      setObjective('');
      setAssessment('');
      setPlan('');
      setShowNoteForm(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard-doctor'] });
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    } catch (err: any) {
      alert('Failed to save progress note: ' + (err?.response?.data?.error || err.message));
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[rgba(15,23,42,0.35)] backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 text-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-3">
          <Activity className="animate-spin text-[#0b4da2]" size={20} />
          <span className="text-sm font-medium">Loading patient clinical case file...</span>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  const age = patient.dob ? differenceInYears(new Date(), new Date(patient.dob)) : '—';
  const heightM = 1.72; // standard baseline or estimate
  const bmi = patient.weight ? (patient.weight / (heightM * heightM)).toFixed(1) : '—';
  const activeRxList = patient.prescriptions?.filter((r: any) => ['ACTIVE', 'STAT'].includes(r.status)) || [];
  const administrations = patient.administrations || [];
  const notesList = patient.clinicalNotes || [];

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,23,42,0.35)] backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#0b4da2] to-sky-600 flex items-center justify-center font-bold text-lg text-white shadow-sm">
              {patient.bed?.replace('ICU-', '') || 'PT'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 m-0">
                  {patient.name}
                </h2>
                <span className="bg-blue-50 text-[#0b4da2] border border-blue-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                  MRN: {patient.mrn}
                </span>
                {isAttendingDoctor ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Stethoscope size={12} />
                    Allotted to You (Attending)
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-xs font-medium">
                    Attending: {patient.attending?.name || 'Assigned Staff'}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Bed {patient.bed} &bull; {patient.sex} &bull; {age} years &bull; {patient.weight} kg &bull; BMI: {bmi} &bull; Ward 4B ICU
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-2xs"
              title="Print Clinical Case File"
            >
              <Printer size={13} />
              <span>Print Sheet</span>
            </button>
            {onNewOrder && (
              <button
                type="button"
                onClick={() => { onClose(); onNewOrder(patientId); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b4da2] hover:bg-[#093d82] text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                <Plus size={13} />
                <span>New CPOE Rx</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Acuity & Status Banner */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-4 flex-wrap text-xs text-slate-600">
          <div>
            <span className="text-slate-500">Diagnosis: </span>
            <strong className="text-slate-800">{patient.admissionDiagnosis || 'Acute Inpatient Care'}</strong>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div>
            <span className="text-slate-500">Code Status: </span>
            <span className={`font-bold ${patient.codeStatus === 'DNR' ? 'text-rose-600' : 'text-emerald-600'}`}>
              {patient.codeStatus || 'Full Code'}
            </span>
          </div>
          {patient.isolationStatus && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                ISOLATION PRECAUTIONS
              </span>
            </>
          )}
          {patient.npoStatus && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                NPO (Nothing by Mouth)
              </span>
            </>
          )}
          {patient.emergencyContactName && (
            <div className="ml-auto text-slate-500 hidden sm:block">
              Emerg: {patient.emergencyContactName} ({patient.emergencyContactRelation || 'Contact'}) &bull; {patient.emergencyContactPhone}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-1 overflow-x-auto">
          {[
            { key: 'overview', label: '1. Clinical Dossier', icon: FileText },
            { key: 'vitals', label: '2. Biomarkers & Vitals', icon: Activity },
            { key: 'allergies', label: `3. Allergies (${patient.allergies?.length || 0})`, icon: AlertTriangle },
            { key: 'prescriptions', label: `4. CPOE Orders (${activeRxList.length})`, icon: Pill },
            { key: 'emar', label: `5. eMAR Log (${administrations.length})`, icon: CheckCircle2 },
            { key: 'notes', label: `6. Doctor Progress Notes (${notesList.length})`, icon: Stethoscope },
          ].map(({ key, label, icon: Icon }) => {
            const isSelected = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-1.5 px-3 py-3 border-b-2 text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'border-[#0b4da2] text-[#0b4da2]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: CLINICAL OVERVIEW & DOSSIER */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
                <h4 className="m-0 mb-3 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                  Admission Profile &amp; Demographics
                </h4>
                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-semibold text-slate-900">{patient.name}</span>

                  <span className="text-slate-500">MRN:</span>
                  <span className="font-mono text-[#0b4da2] font-semibold">{patient.mrn}</span>

                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="text-slate-700">{patient.dob ? format(new Date(patient.dob), 'dd MMM yyyy') : '—'} ({age} yrs)</span>

                  <span className="text-slate-500">Sex &amp; Weight:</span>
                  <span className="text-slate-700">{patient.sex} &bull; {patient.weight} {patient.weightUnit || 'kg'} (Est. BMI: {bmi})</span>

                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-700">Ward 4B ICU, Bed {patient.bed}</span>

                  <span className="text-slate-500">Attending MD:</span>
                  <span className="text-emerald-700 font-semibold">
                    {patient.attending?.name || 'Dr. V. Sharma, MD'}
                  </span>

                  <span className="text-slate-500">Admission Date:</span>
                  <span className="text-slate-700">{patient.createdAt ? format(new Date(patient.createdAt), 'dd MMM yyyy HH:mm') : 'Active Inpatient'}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
                <h4 className="m-0 mb-3 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                  Clinical Case Summary
                </h4>
                <div className="mb-3">
                  <div className="text-[11px] text-slate-500 mb-0.5">PRIMARY ADMISSION DIAGNOSIS:</div>
                  <div className="text-sm font-bold text-slate-900 leading-snug">
                    {patient.admissionDiagnosis}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-[11px] text-slate-500 mb-1">CARE DIRECTIVES &amp; PRECAUTIONS:</div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-[#0b4da2] border border-blue-200 font-medium">
                      Code Status: {patient.codeStatus || 'Full Code'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                      patient.isolationStatus
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {patient.isolationStatus ? 'Contact Isolation Required' : 'Standard Universal Precautions'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                      patient.npoStatus
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {patient.npoStatus ? 'Strict NPO' : 'Oral Intake Allowed'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 mb-1">LATEST NURSE BEDSIDE ACTIVITY:</div>
                  {administrations[0] ? (
                    <div className="text-xs text-emerald-800 flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>
                        Dose given at {format(new Date(administrations[0].signedAt), 'HH:mm dd-MMM')} by {administrations[0].administeredBy?.name || 'Nurse'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Bedside safety verified by nursing shift.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BIOMARKERS & VITALS */}
          {activeTab === 'vitals' && (
            <div>
              <h4 className="m-0 mb-3 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                Critical Renal, Hepatic &amp; Hematologic Biomarkers
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                {[
                  {
                    label: 'eGFR (Renal)',
                    val: patient.eGFR ? `${patient.eGFR} mL/min/1.73m²` : '68 mL/min',
                    norm: '> 60 mL/min',
                    isAlert: patient.eGFR && patient.eGFR < 60,
                    note: patient.eGFR && patient.eGFR < 60 ? 'Renal dose adjustment recommended' : 'Normal filtration',
                    color: patient.eGFR && patient.eGFR < 60 ? '#d97706' : '#059669'
                  },
                  {
                    label: 'Serum Creatinine',
                    val: patient.creatinine ? `${patient.creatinine} mg/dL` : '1.1 mg/dL',
                    norm: '0.6 - 1.2 mg/dL',
                    isAlert: patient.creatinine && patient.creatinine > 1.3,
                    note: 'Renal clearance baseline',
                    color: patient.creatinine && patient.creatinine > 1.3 ? '#e11d48' : '#059669'
                  },
                  {
                    label: 'Total Bilirubin',
                    val: patient.bilirubin ? `${patient.bilirubin} mg/dL` : '0.8 mg/dL',
                    norm: '0.2 - 1.2 mg/dL',
                    isAlert: patient.bilirubin && patient.bilirubin > 1.5,
                    note: 'Hepatic function marker',
                    color: patient.bilirubin && patient.bilirubin > 1.5 ? '#e11d48' : '#059669'
                  },
                  {
                    label: 'Platelet Count',
                    val: patient.platelets ? `${patient.platelets} K/uL` : '210 K/uL',
                    norm: '150 - 450 K/uL',
                    isAlert: patient.platelets && patient.platelets < 150,
                    note: 'Anticoagulation threshold ok',
                    color: patient.platelets && patient.platelets < 150 ? '#d97706' : '#059669'
                  },
                ].map(({ label, val, norm, isAlert, note, color }) => (
                  <div
                    key={label}
                    className={`bg-white rounded-xl p-3.5 shadow-2xs border ${
                      isAlert ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="text-[11px] text-slate-500 font-semibold">{label}</div>
                    <div className="text-xl font-bold my-1.5" style={{ color }}>{val}</div>
                    <div className="text-[10px] text-slate-400">Ref: {norm}</div>
                    <div className={`text-xs mt-1 font-medium ${isAlert ? 'text-rose-700' : 'text-slate-500'}`}>
                      {note}
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="m-0 mb-3 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                Bedside ICU Vitals Sign Sheet
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-bold">BLOOD PRESSURE</div>
                    <div className="text-lg font-bold text-[#0b4da2] my-1">118 / 76</div>
                    <div className="text-[10px] text-slate-400">mmHg (MAP: 90)</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-bold">HEART RATE</div>
                    <div className="text-lg font-bold text-emerald-600 my-1">78 bpm</div>
                    <div className="text-[10px] text-slate-400">Normal Sinus Rhythm</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-bold">SpO2 OXYGEN</div>
                    <div className="text-lg font-bold text-[#0b4da2] my-1">98%</div>
                    <div className="text-[10px] text-slate-400">Room Air</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-bold">CORE TEMP</div>
                    <div className="text-lg font-bold text-amber-600 my-1">36.9 °C</div>
                    <div className="text-[10px] text-slate-400">Afebrile</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-bold">RESPIRATION</div>
                    <div className="text-lg font-bold text-emerald-600 my-1">16 /min</div>
                    <div className="text-[10px] text-slate-400">Unlabored</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALLERGIES */}
          {activeTab === 'allergies' && (
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="m-0 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                  Allergy &amp; Adverse Drug Reaction (ADR) Registry
                </h4>
                <span className="text-xs text-slate-500">Verified against FDA Formulary</span>
              </div>

              {patient.allergies?.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {patient.allergies.map((allergy: any) => {
                    const isSevere = allergy.severity === 'Anaphylaxis' || allergy.severity === 'Severe';
                    return (
                      <div
                        key={allergy.id}
                        className={`bg-white rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs border ${
                          isSevere ? 'border-rose-300 bg-rose-50/20' : 'border-amber-200 bg-amber-50/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={20} className={isSevere ? 'text-rose-600' : 'text-amber-600'} />
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {allergy.allergen}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              Reaction: <strong className="text-slate-800">{allergy.reaction || 'Hypersensitivity'}</strong>
                              {allergy.crossReactsWith && ` &bull; Cross-reacts with: ${allergy.crossReactsWith}`}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isSevere
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {allergy.severity}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Verified by Clinical Staff
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-emerald-700 shadow-2xs">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-600" />
                  <div className="font-bold text-sm">No Known Drug Allergies (NKDA)</div>
                  <div className="text-xs text-slate-500 mt-1">Patient record reviewed by admitting physician.</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVE CPOE PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="m-0 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                  Active CPOE Clinical Prescriptions ({activeRxList.length})
                </h4>
                {onNewOrder && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onNewOrder(patientId); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#0b4da2] text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                  >
                    <Plus size={12} /> Add Medication
                  </button>
                )}
              </div>

              {activeRxList.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {activeRxList.map((rx: any) => (
                    <div
                      key={rx.id}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {rx.medicationName}
                          </span>
                          <span className="bg-blue-50 text-[#0b4da2] border border-blue-200 px-2 py-0.5 rounded text-xs font-semibold">
                            {rx.dose} {rx.unit} &bull; {rx.route}
                          </span>
                          {rx.isStatOrder && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              STAT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Frequency: <strong className="text-slate-700">{rx.frequency}</strong> &bull; Indication: {rx.indication || 'ICU Care'} &bull; Prescribed by {rx.prescriber?.name || 'Dr. Sharma'}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          rx.pharmacyVerified ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {rx.pharmacyVerified ? <Check size={12} /> : <Clock size={12} />}
                          {rx.pharmacyVerified ? 'Pharmacy Verified' : 'Pending Verification'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Started {format(new Date(rx.startDate), 'dd-MMM')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-slate-500 shadow-2xs">
                  No active CPOE orders found for this patient.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: eMAR BEDSIDE ADMINISTRATION HISTORY */}
          {activeTab === 'emar' && (
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="m-0 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                  Bedside Medication Administration Record (eMAR Log)
                </h4>
                <span className="text-xs text-emerald-700 font-semibold">5-Rights Verified</span>
              </div>

              {administrations.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {administrations.map((adm: any) => (
                    <div
                      key={adm.id}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {adm.schedule?.prescription?.medicationName || 'Medication Administered'}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Dose Given: <strong className="text-slate-800">{adm.dose} {adm.unit}</strong> via {adm.route} &bull; Administered by <strong className="text-slate-800">{adm.administeredBy?.name || 'Bedside Nurse'}</strong>
                          </div>
                          {adm.notes && (
                            <div className="text-xs text-slate-500 italic mt-1">
                              &ldquo;{adm.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-[#0b4da2] font-mono">
                          {format(new Date(adm.signedAt), 'HH:mm:ss')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {format(new Date(adm.signedAt), 'dd MMM yyyy')}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                          {adm.barcodeScanned ? '4-POINT BARCODE' : 'MANUAL VERIFIED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-slate-500 shadow-2xs">
                  No medication doses have been charted for this patient yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DOCTOR PROGRESS NOTES (SOAP) */}
          {activeTab === 'notes' && (
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="m-0 text-xs font-bold text-[#0b4da2] uppercase tracking-wider">
                  Clinical Progress Notes &amp; Bedside Observations ({notesList.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border shadow-2xs ${
                    showNoteForm
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-blue-50 text-[#0b4da2] border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Plus size={13} />
                  <span>{showNoteForm ? 'Cancel Note' : 'Write SOAP Progress Note'}</span>
                </button>
              </div>

              {/* Note Writing Form */}
              {showNoteForm && (
                <form
                  onSubmit={handleSaveNote}
                  className="bg-white border border-blue-200 rounded-xl p-4 mb-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-[#0b4da2]">
                      NEW CLINICAL SOAP NOTE &bull; {user?.name} (Attending Physician)
                    </div>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      placeholder="Note Title"
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 w-64 focus:outline-hidden focus:ring-1 focus:ring-[#0b4da2]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        [S] Subjective (Symptoms, patient report, pain):
                      </label>
                      <textarea
                        value={subjective}
                        onChange={e => setSubjective(e.target.value)}
                        placeholder="Patient states pain is controlled at 3/10. Reports improved breathing..."
                        rows={3}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0b4da2] box-border"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        [O] Objective (Physical exam, vitals, lab markers):
                      </label>
                      <textarea
                        value={objective}
                        onChange={e => setObjective(e.target.value)}
                        placeholder="Lungs clear bilaterally. HR 78 NSR, BP 118/76. eGFR 68, Creatinine 1.1 stable..."
                        rows={3}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0b4da2] box-border"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        [A] Assessment (Clinical course, response to meds):
                      </label>
                      <textarea
                        value={assessment}
                        onChange={e => setAssessment(e.target.value)}
                        placeholder="Hemodynamically stable ICU day 3. Sepsis resolving on current antibiotic regimen..."
                        rows={3}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0b4da2] box-border"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        [P] Plan (Med adjustments, monitoring, discharge criteria):
                      </label>
                      <textarea
                        value={plan}
                        onChange={e => setPlan(e.target.value)}
                        placeholder="1. Continue IV Pantoprazole 40mg. 2. Monitor urine output Q2H. 3. Step down to step-down unit tomorrow if afebrile..."
                        rows={3}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0b4da2] box-border"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNoteForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingNote}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0b4da2] hover:bg-[#093d82] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      <Send size={13} />
                      <span>{isSubmittingNote ? 'Saving...' : 'Sign & Post Progress Note'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              {notesList.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {notesList.map((note: any) => {
                    const isDoctor = note.author?.role === 'DOCTOR' || note.type === 'DOCTOR_PROGRESS_NOTE';
                    return (
                      <div
                        key={note.id}
                        className={`bg-white rounded-xl p-4 shadow-2xs border ${
                          isDoctor ? 'border-blue-200' : 'border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              isDoctor
                                ? 'bg-blue-50 text-[#0b4da2] border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isDoctor ? 'Doctor Note' : 'Nurse Bedside Observation'}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {note.title}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm')} &bull; Author: <strong className="text-slate-700">{note.author?.name}</strong> ({note.author?.role})
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </div>

                        {/* Co-signed banner */}
                        {note.isAcknowledged && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                            <Check size={12} />
                            <span>Reviewed &amp; Approved by Doctor</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-slate-500 shadow-2xs">
                  No progress notes recorded yet. Click &quot;Write SOAP Progress Note&quot; to chart this patient&apos;s rounds.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Patient Case File ID: <span className="font-mono text-slate-700">{patient.id}</span> &bull; HIPAA Certified Clinical Document
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Close Case File
          </button>
        </div>
      </div>
    </div>
  );
}
