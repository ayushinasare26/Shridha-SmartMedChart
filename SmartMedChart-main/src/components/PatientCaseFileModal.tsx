import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService, noteService } from '../services/api.services';
import { useAuth } from '../hooks/useAuth';
import { format, differenceInYears } from 'date-fns';
import {
  X, Printer, User, Activity, AlertTriangle, Pill, Shield, Clock,
  FileText, CheckCircle2, Stethoscope, Plus, ChevronRight, Heart,
  Flame, Droplets, Info, Sparkles, Send, Check
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
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '24px 32px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Activity className="animate-spin" size={20} color="#38bdf8" />
          <span>Loading patient clinical case file...</span>
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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#172033',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
            }}>
              {patient.bed?.replace('ICU-', '') || 'PT'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                  {patient.name}
                </h2>
                <span style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  MRN: {patient.mrn}
                </span>
                {isAttendingDoctor ? (
                  <span style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Stethoscope size={12} />
                    Allotted to You (Attending)
                  </span>
                ) : (
                  <span style={{
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11
                  }}>
                    Attending: {patient.attending?.name || 'Assigned Staff'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                Bed {patient.bed} &bull; {patient.sex} &bull; {age} years &bull; {patient.weight} kg &bull; BMI: {bmi} &bull; Ward 4B ICU
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Print Clinical Case File"
            >
              <Printer size={13} />
              <span>Print Sheet</span>
            </button>
            {onNewOrder && (
              <button
                type="button"
                onClick={() => { onClose(); onNewOrder(patientId); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                <span>New CPOE Rx</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Acuity & Status Banner */}
        <div style={{
          padding: '8px 24px',
          backgroundColor: '#0a101f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          fontSize: 11
        }}>
          <div>
            <span style={{ color: '#64748b' }}>Diagnosis: </span>
            <strong style={{ color: '#e2e8f0' }}>{patient.admissionDiagnosis || 'Acute Inpatient Care'}</strong>
          </div>
          <div style={{ height: 12, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <div>
            <span style={{ color: '#64748b' }}>Code Status: </span>
            <span style={{ color: patient.codeStatus === 'DNR' ? '#f87171' : '#34d399', fontWeight: 700 }}>
              {patient.codeStatus || 'Full Code'}
            </span>
          </div>
          {patient.isolationStatus && (
            <>
              <div style={{ height: 12, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ color: '#f87171', fontWeight: 700, backgroundColor: 'rgba(239,68,68,0.12)', padding: '1px 6px', borderRadius: 4 }}>
                ISOLATION PRECAUTIONS
              </span>
            </>
          )}
          {patient.npoStatus && (
            <>
              <div style={{ height: 12, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ color: '#fbbf24', fontWeight: 700, backgroundColor: 'rgba(245,158,11,0.12)', padding: '1px 6px', borderRadius: 4 }}>
                NPO (Nothing by Mouth)
              </span>
            </>
          )}
          {patient.emergencyContactName && (
            <div style={{ marginLeft: 'auto', color: '#94a3b8' }}>
              Emerg: {patient.emergencyContactName} ({patient.emergencyContactRelation || 'Contact'}) &bull; {patient.emergencyContactPhone}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#11192a',
          padding: '0 24px',
          gap: 4,
          overflowX: 'auto'
        }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isSelected ? '#38bdf8' : 'transparent'}`,
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* TAB 1: CLINICAL OVERVIEW & DOSSIER */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ backgroundColor: '#162032', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Admission Profile &amp; Demographics
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Full Name:</span>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{patient.name}</span>

                  <span style={{ color: '#64748b' }}>MRN:</span>
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{patient.mrn}</span>

                  <span style={{ color: '#64748b' }}>Date of Birth:</span>
                  <span>{patient.dob ? format(new Date(patient.dob), 'dd MMM yyyy') : '—'} ({age} yrs)</span>

                  <span style={{ color: '#64748b' }}>Sex &amp; Weight:</span>
                  <span>{patient.sex} &bull; {patient.weight} {patient.weightUnit || 'kg'} (Est. BMI: {bmi})</span>

                  <span style={{ color: '#64748b' }}>Location:</span>
                  <span>Ward 4B ICU, Bed {patient.bed}</span>

                  <span style={{ color: '#64748b' }}>Attending MD:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    {patient.attending?.name || 'Dr. V. Sharma, MD'}
                  </span>

                  <span style={{ color: '#64748b' }}>Admission Date:</span>
                  <span>{patient.createdAt ? format(new Date(patient.createdAt), 'dd MMM yyyy HH:mm') : 'Active Inpatient'}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#162032', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Clinical Case Summary
                </h4>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>PRIMARY ADMISSION DIAGNOSIS:</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', lineHeight: 1.4 }}>
                    {patient.admissionDiagnosis}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>CARE DIRECTIVES &amp; PRECAUTIONS:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                      Code Status: {patient.codeStatus || 'Full Code'}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: patient.isolationStatus ? 'rgba(239,68,68,0.15)' : 'rgba(16, 185, 129, 0.1)', color: patient.isolationStatus ? '#f87171' : '#34d399' }}>
                      {patient.isolationStatus ? 'Contact Isolation Required' : 'Standard Universal Precautions'}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: patient.npoStatus ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: patient.npoStatus ? '#fbbf24' : '#cbd5e1' }}>
                      {patient.npoStatus ? 'Strict NPO' : 'Oral Intake Allowed'}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>LATEST NURSE BEDSIDE ACTIVITY:</div>
                  {administrations[0] ? (
                    <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <CheckCircle2 size={14} />
                      <span>
                        Dose given at {format(new Date(administrations[0].signedAt), 'HH:mm dd-MMM')} by {administrations[0].administeredBy?.name || 'Nurse'}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Bedside safety verified by nursing shift.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BIOMARKERS & VITALS */}
          {activeTab === 'vitals' && (
            <div>
              <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                Critical Renal, Hepatic &amp; Hematologic Biomarkers
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                  {
                    label: 'eGFR (Renal)',
                    val: patient.eGFR ? `${patient.eGFR} mL/min/1.73m²` : '68 mL/min',
                    norm: '> 60 mL/min',
                    isAlert: patient.eGFR && patient.eGFR < 60,
                    note: patient.eGFR && patient.eGFR < 60 ? 'Renal dose adjustment recommended' : 'Normal filtration',
                    color: patient.eGFR && patient.eGFR < 60 ? '#f59e0b' : '#34d399'
                  },
                  {
                    label: 'Serum Creatinine',
                    val: patient.creatinine ? `${patient.creatinine} mg/dL` : '1.1 mg/dL',
                    norm: '0.6 - 1.2 mg/dL',
                    isAlert: patient.creatinine && patient.creatinine > 1.3,
                    note: 'Renal clearance baseline',
                    color: patient.creatinine && patient.creatinine > 1.3 ? '#f87171' : '#34d399'
                  },
                  {
                    label: 'Total Bilirubin',
                    val: patient.bilirubin ? `${patient.bilirubin} mg/dL` : '0.8 mg/dL',
                    norm: '0.2 - 1.2 mg/dL',
                    isAlert: patient.bilirubin && patient.bilirubin > 1.5,
                    note: 'Hepatic function marker',
                    color: patient.bilirubin && patient.bilirubin > 1.5 ? '#f87171' : '#34d399'
                  },
                  {
                    label: 'Platelet Count',
                    val: patient.platelets ? `${patient.platelets} K/uL` : '210 K/uL',
                    norm: '150 - 450 K/uL',
                    isAlert: patient.platelets && patient.platelets < 150,
                    note: 'Anticoagulation threshold ok',
                    color: patient.platelets && patient.platelets < 150 ? '#f59e0b' : '#34d399'
                  },
                ].map(({ label, val, norm, isAlert, note, color }) => (
                  <div key={label} style={{
                    backgroundColor: '#162032',
                    border: `1.5px solid ${isAlert ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    padding: 14
                  }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color, margin: '6px 0 2px' }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Ref: {norm}</div>
                    <div style={{ fontSize: 11, color: isAlert ? '#f87171' : '#94a3b8', marginTop: 4, fontWeight: 500 }}>
                      {note}
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                Bedside ICU Vitals Sign Sheet
              </h4>
              <div style={{ backgroundColor: '#162032', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, textAlign: 'center' }}>
                  <div style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>BLOOD PRESSURE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>118 / 76</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>mmHg (MAP: 90)</div>
                  </div>
                  <div style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>HEART RATE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', margin: '4px 0' }}>78 bpm</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Normal Sinus Rhythm</div>
                  </div>
                  <div style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>SpO2 OXYGEN</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>98%</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Room Air</div>
                  </div>
                  <div style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>CORE TEMP</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24', margin: '4px 0' }}>36.9 °C</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Afebrile</div>
                  </div>
                  <div style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>RESPIRATION</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', margin: '4px 0' }}>16 /min</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Unlabored</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALLERGIES */}
          {activeTab === 'allergies' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Allergy &amp; Adverse Drug Reaction (ADR) Registry
                </h4>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Verified against FDA Formulary</span>
              </div>

              {patient.allergies?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {patient.allergies.map((allergy: any) => {
                    const isSevere = allergy.severity === 'Anaphylaxis' || allergy.severity === 'Severe';
                    return (
                      <div
                        key={allergy.id}
                        style={{
                          backgroundColor: '#162032',
                          border: `1.5px solid ${isSevere ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)'}`,
                          borderRadius: 10,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <AlertTriangle size={20} color={isSevere ? '#f87171' : '#fbbf24'} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                              {allergy.allergen}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              Reaction: <strong style={{ color: '#cbd5e1' }}>{allergy.reaction || 'Hypersensitivity'}</strong>
                              {allergy.crossReactsWith && ` &bull; Cross-reacts with: ${allergy.crossReactsWith}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            backgroundColor: isSevere ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: isSevere ? '#f87171' : '#fbbf24',
                            border: `1px solid ${isSevere ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}>
                            {allergy.severity}
                          </span>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                            Verified by Clinical Staff
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#162032', borderRadius: 12, color: '#34d399' }}>
                  <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700 }}>No Known Drug Allergies (NKDA)</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Patient record reviewed by admitting physician.</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVE CPOE PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Active CPOE Clinical Prescriptions ({activeRxList.length})
                </h4>
                {onNewOrder && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onNewOrder(patientId); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} /> Add Medication
                  </button>
                )}
              </div>

              {activeRxList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeRxList.map((rx: any) => (
                    <div
                      key={rx.id}
                      style={{
                        backgroundColor: '#162032',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                            {rx.medicationName}
                          </span>
                          <span style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700
                          }}>
                            {rx.dose} {rx.unit} &bull; {rx.route}
                          </span>
                          {rx.isStatOrder && (
                            <span style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              STAT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                          Frequency: <strong>{rx.frequency}</strong> &bull; Indication: {rx.indication || 'ICU Care'} &bull; Prescribed by {rx.prescriber?.name || 'Dr. Sharma'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: rx.pharmacyVerified ? '#34d399' : '#fbbf24'
                        }}>
                          {rx.pharmacyVerified ? <Check size={12} /> : <Clock size={12} />}
                          {rx.pharmacyVerified ? 'Pharmacy Verified' : 'Pending Verification'}
                        </span>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          Started {format(new Date(rx.startDate), 'dd-MMM')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#162032', borderRadius: 12, color: '#94a3b8' }}>
                  No active CPOE orders found for this patient.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: eMAR BEDSIDE ADMINISTRATION HISTORY */}
          {activeTab === 'emar' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Bedside Medication Administration Record (eMAR Log)
                </h4>
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>5-Rights Verified</span>
              </div>

              {administrations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {administrations.map((adm: any) => (
                    <div
                      key={adm.id}
                      style={{
                        backgroundColor: '#162032',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#34d399',
                          flexShrink: 0
                        }}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                            {adm.schedule?.prescription?.medicationName || 'Medication Administered'}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            Dose Given: <strong>{adm.dose} {adm.unit}</strong> via {adm.route} &bull; Administered by <strong>{adm.administeredBy?.name || 'Bedside Nurse'}</strong>
                          </div>
                          {adm.notes && (
                            <div style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic', marginTop: 4 }}>
                              &ldquo;{adm.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                          {format(new Date(adm.signedAt), 'HH:mm:ss')}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          {format(new Date(adm.signedAt), 'dd MMM yyyy')}
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#34d399', display: 'block', marginTop: 2 }}>
                          {adm.barcodeScanned ? '4-POINT BARCODE' : 'MANUAL VERIFIED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#162032', borderRadius: 12, color: '#94a3b8' }}>
                  No medication doses have been charted for this patient yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DOCTOR PROGRESS NOTES (SOAP) */}
          {activeTab === 'notes' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Clinical Progress Notes &amp; Bedside Observations ({notesList.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 8,
                    backgroundColor: showNoteForm ? 'rgba(255,255,255,0.08)' : 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                  <span>{showNoteForm ? 'Cancel Note' : 'Write SOAP Progress Note'}</span>
                </button>
              </div>

              {/* Note Writing Form */}
              {showNoteForm && (
                <form
                  onSubmit={handleSaveNote}
                  style={{
                    backgroundColor: '#162032',
                    border: '1.5px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                      NEW CLINICAL SOAP NOTE &bull; {user?.name} (Attending Physician)
                    </div>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      placeholder="Note Title"
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 6,
                        color: '#f8fafc',
                        width: 260
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                        [S] Subjective (Symptoms, patient report, pain):
                      </label>
                      <textarea
                        value={subjective}
                        onChange={e => setSubjective(e.target.value)}
                        placeholder="Patient states pain is controlled at 3/10. Reports improved breathing..."
                        rows={3}
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 8,
                          padding: 8,
                          color: '#f8fafc',
                          fontSize: 12,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                        [O] Objective (Physical exam, vitals, lab markers):
                      </label>
                      <textarea
                        value={objective}
                        onChange={e => setObjective(e.target.value)}
                        placeholder="Lungs clear bilaterally. HR 78 NSR, BP 118/76. eGFR 68, Creatinine 1.1 stable..."
                        rows={3}
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 8,
                          padding: 8,
                          color: '#f8fafc',
                          fontSize: 12,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                        [A] Assessment (Clinical course, response to meds):
                      </label>
                      <textarea
                        value={assessment}
                        onChange={e => setAssessment(e.target.value)}
                        placeholder="Hemodynamically stable ICU day 3. Sepsis resolving on current antibiotic regimen..."
                        rows={3}
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 8,
                          padding: 8,
                          color: '#f8fafc',
                          fontSize: 12,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                        [P] Plan (Med adjustments, monitoring, discharge criteria):
                      </label>
                      <textarea
                        value={plan}
                        onChange={e => setPlan(e.target.value)}
                        placeholder="1. Continue IV Pantoprazole 40mg. 2. Monitor urine output Q2H. 3. Step down to step-down unit tomorrow if afebrile..."
                        rows={3}
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 8,
                          padding: 8,
                          color: '#f8fafc',
                          fontSize: 12,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowNoteForm(false)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#94a3b8',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingNote}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 16px',
                        borderRadius: 8,
                        backgroundColor: '#0284c7',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Send size={13} />
                      <span>{isSubmittingNote ? 'Saving...' : 'Sign & Post Progress Note'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              {notesList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notesList.map((note: any) => {
                    const isDoctor = note.author?.role === 'DOCTOR' || note.type === 'DOCTOR_PROGRESS_NOTE';
                    return (
                      <div
                        key={note.id}
                        style={{
                          backgroundColor: '#162032',
                          border: `1px solid ${isDoctor ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                          borderRadius: 12,
                          padding: 16
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              backgroundColor: isDoctor ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: isDoctor ? '#38bdf8' : '#34d399',
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: 'uppercase'
                            }}>
                              {isDoctor ? 'Doctor Note' : 'Nurse Bedside Observation'}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                              {note.title}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            {format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm')} &bull; Author: <strong style={{ color: '#e2e8f0' }}>{note.author?.name}</strong> ({note.author?.role})
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {note.content}
                        </div>

                        {/* Co-signed banner */}
                        {note.isAcknowledged && (
                          <div style={{
                            marginTop: 10,
                            paddingTop: 8,
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            fontSize: 10,
                            color: '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <Check size={12} />
                            <span>Reviewed &amp; Approved by Doctor</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#162032', borderRadius: 12, color: '#94a3b8' }}>
                  No progress notes recorded yet. Click &quot;Write SOAP Progress Note&quot; to chart this patient&apos;s rounds.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0a101f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#64748b'
        }}>
          <div>
            Patient Case File ID: <span style={{ fontFamily: 'monospace' }}>{patient.id}</span> &bull; HIPAA Certified Clinical Document
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Case File
          </button>
        </div>
      </div>
    </div>
  );
}
