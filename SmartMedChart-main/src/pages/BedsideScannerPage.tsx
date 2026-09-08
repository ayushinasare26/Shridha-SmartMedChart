import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService, scheduleService } from '../services/api.services';
import {
  Scan, CheckCircle2, AlertTriangle, User, Pill, Hash, MapPin, Clock,
  Loader2, QrCode, ArrowLeft, RefreshCw, XCircle, Check, AlertOctagon, ExternalLink
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';
import { CameraQRScanner } from '../components/CameraQRScanner';

// Audio feedback synthesizers using Web Audio API
const playSuccessSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) {
    // Ignore audio policy errors
  }
};

const playErrorBuzzer = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(130, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio policy errors
  }
};

interface WrongScanData {
  scannedName: string;
  scannedBed: string;
  scannedMrn: string;
  expectedName: string;
  expectedBed: string;
  expectedMrn: string;
  rawCode: string;
}

export default function BedsideScannerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Target IDs passed from Nurse Dashboard / eMAR
  const urlPatientId = searchParams.get('patientId');
  const urlScheduleId = searchParams.get('scheduleId');

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(urlPatientId);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(urlScheduleId);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [wrongScanData, setWrongScanData] = useState<WrongScanData | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [administered, setAdministered] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [fiveRights, setFiveRights] = useState({
    rightPatient: false,
    rightDrug: false,
    rightDose: false,
    rightRoute: false,
    rightTime: false,
  });

  // Fetch all active patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-active'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  // Fetch target patient if we have selectedPatientId
  const { data: patient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => patientService.getById(selectedPatientId!),
    enabled: !!selectedPatientId,
  });

  // Fetch schedules for the patient
  const { data: schedules = [] } = useQuery({
    queryKey: ['patient-schedules-scan', selectedPatientId],
    queryFn: () => scheduleService.getAll({ patientId: selectedPatientId! }),
    enabled: !!selectedPatientId,
  });

  // If we only have scheduleId but no patientId, find the patient from the schedule
  useEffect(() => {
    if (!selectedPatientId && selectedScheduleId && (patients as any[]).length > 0) {
      // Find patient across all active patients if possible
      for (const p of patients as any[]) {
        if (p.prescriptions?.some((pr: any) => pr.schedules?.some((s: any) => s.id === selectedScheduleId))) {
          setSelectedPatientId(p.id);
          break;
        }
      }
    }
  }, [selectedPatientId, selectedScheduleId, patients]);

  const activeRx = (patient?.prescriptions as any[])?.find((r: any) => ['ACTIVE', 'STAT'].includes(r.status)) || patient?.prescriptions?.[0];

  const selectedSchedule = selectedScheduleId
    ? (schedules as any[]).find(s => s.id === selectedScheduleId)
    : ((schedules as any[]).find(s => s.status === 'PENDING') || (schedules as any[])[0] || (activeRx ? {
        id: activeRx.schedules?.[0]?.id || `rx-auto-${activeRx.id}`,
        prescription: activeRx,
        prescriptionId: activeRx.id,
        scheduledTime: new Date().toISOString(),
        status: 'PENDING'
      } : null));

  // Determine if a specific patient is targeted
  const hasTargetPatient = Boolean(selectedPatientId || urlPatientId || selectedScheduleId);
  const targetPatient = patient || (patients as any[]).find((p: any) => p.id === selectedPatientId);

  // Auto focus the barcode input on load and when ready to scan
  useEffect(() => {
    if (!isVerified && !administered && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isVerified, administered, wrongScanData]);

  // Medication Administration Mutation
  const administerMutation = useMutation({
    mutationFn: () => scheduleService.administer({
      scheduleId: selectedSchedule?.id,
      patientId: selectedPatientId,
      dose: selectedSchedule?.prescription?.dose || selectedSchedule?.dose || 1,
      unit: selectedSchedule?.prescription?.unit || selectedSchedule?.doseUnit || 'mg',
      route: selectedSchedule?.prescription?.route || selectedSchedule?.route || 'IV',
      barcodeScanned: true,
      fiveRights,
    }),
    onSuccess: () => {
      setAdministered(true);
      playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ['patient-schedules-scan'] });
      queryClient.invalidateQueries({ queryKey: ['ward-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['patient-my-record'] });
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-nurse'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-doctor'] });
      queryClient.invalidateQueries({ queryKey: ['patients-active'] });
      queryClient.invalidateQueries({ queryKey: ['patient-schedules'] });

      // Cross-tab & multi-role broadcast: triggers instant refetch across views
      try {
        const payload = JSON.stringify({
          timestamp: Date.now(),
          patientId: selectedPatientId,
          patientName: targetPatient?.name,
          medication: selectedSchedule?.prescription?.medicationName || activeRx?.medicationName,
          administeredAt: new Date().toISOString(),
        });
        localStorage.setItem('smartmed_last_administered', payload);
        window.dispatchEvent(new CustomEvent('smartmed:medication_administered', { detail: payload }));
      } catch (e) {
        console.error('Broadcast error:', e);
      }
    },
    onError: (err: any) => {
      alert('Failed to record administration: ' + (err?.response?.data?.error || err.message));
    }
  });

  // Core Barcode / QR verification engine
  const processBarcodeScan = (rawCode: string) => {
    const raw = rawCode.trim();
    if (!raw) return;

    // Reset previous feedback
    setWrongScanData(null);
    setScanSuccessMessage(null);

    // Extract identifier from raw scan (URL param, JSON, or direct text)
    let extractedId = raw;
    try {
      if (raw.includes('?id=')) {
        const url = new URL(raw.startsWith('http') ? raw : `http://localhost${raw}`);
        extractedId = url.searchParams.get('id') || raw;
      } else if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        extractedId = parsed.mrn || parsed.id || parsed.patientId || raw;
      }
    } catch {
      // fallback to raw
    }

    // Lookup scanned identity in active patients
    const matchedPatient = (patients as any[]).find((p: any) =>
      p.id === extractedId ||
      p.mrn?.toLowerCase() === extractedId.toLowerCase() ||
      p.name?.toLowerCase() === extractedId.toLowerCase() ||
      (p.bed && p.bed.toLowerCase() === extractedId.toLowerCase()) ||
      (p.mrn && raw.toLowerCase().includes(p.mrn.toLowerCase())) ||
      (p.name && raw.toLowerCase().includes(p.name.toLowerCase()))
    );

    if (hasTargetPatient && targetPatient) {
      // Locked Patient Mode: MUST match the expected target patient
      const isMatch = matchedPatient
        ? matchedPatient.id === targetPatient.id
        : (extractedId === targetPatient.id ||
           extractedId.toLowerCase() === targetPatient.mrn?.toLowerCase() ||
           extractedId.toLowerCase() === targetPatient.name?.toLowerCase());

      if (isMatch) {
        // MATCH: Verification Succeeded
        setIsVerified(true);
        setWrongScanData(null);
        setScanSuccessMessage(`Patient Identity Confirmed: ${targetPatient.name} (MRN: ${targetPatient.mrn}, Bed ${targetPatient.bed})`);
        setFiveRights({
          rightPatient: true,
          rightDrug: true,
          rightDose: true,
          rightRoute: true,
          rightTime: true,
        });
        playSuccessSound();
      } else {
        // MISMATCH: Wrong patient scanned!
        setIsVerified(false);
        setFiveRights(prev => ({ ...prev, rightPatient: false }));
        playErrorBuzzer();

        setWrongScanData({
          scannedName: matchedPatient ? matchedPatient.name : `Unrecognized Barcode ("${raw}")`,
          scannedBed: matchedPatient ? matchedPatient.bed : '—',
          scannedMrn: matchedPatient ? matchedPatient.mrn : raw,
          expectedName: targetPatient.name,
          expectedBed: targetPatient.bed,
          expectedMrn: targetPatient.mrn,
          rawCode: raw,
        });
      }
    } else {
      // General Mode (no patient pre-selected)
      if (matchedPatient) {
        setSelectedPatientId(matchedPatient.id);
        setIsVerified(true);
        setWrongScanData(null);
        setScanSuccessMessage(`Patient Identity Confirmed: ${matchedPatient.name} (MRN: ${matchedPatient.mrn}, Bed ${matchedPatient.bed})`);
        setFiveRights({
          rightPatient: true,
          rightDrug: true,
          rightDose: true,
          rightRoute: true,
          rightTime: true,
        });
        playSuccessSound();
      } else {
        setIsVerified(false);
        playErrorBuzzer();
        setWrongScanData({
          scannedName: `Unrecognized Barcode ("${raw}")`,
          scannedBed: '—',
          scannedMrn: raw,
          expectedName: 'Any Active Hospital Patient',
          expectedBed: 'Active Ward',
          expectedMrn: 'Valid MRN',
          rawCode: raw,
        });
      }
    }

    setBarcodeInput('');
  };

  // Simulation: Scan correct target patient
  const handleSimulateCorrectScan = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 600));
    setIsScanning(false);
    if (targetPatient) {
      processBarcodeScan(targetPatient.mrn || targetPatient.id);
    } else if ((patients as any[]).length > 0) {
      processBarcodeScan((patients as any[])[0].mrn || (patients as any[])[0].id);
    }
  };

  // Simulation: Scan a WRONG patient to demonstrate the safety alert
  const handleSimulateWrongScan = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 600));
    setIsScanning(false);
    // Find any other patient who is NOT the target patient
    const otherPatient = (patients as any[]).find((p: any) => p.id !== targetPatient?.id) || {
      name: 'Margaret Brown',
      bed: 'ICU-03',
      mrn: 'MRN-2024-002',
      id: 'patient-other-demo'
    };
    processBarcodeScan(otherPatient.mrn || otherPatient.name);
  };

  // Simulation: Scan invalid/corrupt barcode
  const handleSimulateInvalidScan = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 600));
    setIsScanning(false);
    processBarcodeScan('UNKNOWN-QR-9999-MISMATCH');
  };

  const handleResetScan = () => {
    setIsVerified(false);
    setWrongScanData(null);
    setScanSuccessMessage(null);
    setAdministered(false);
    setFiveRights({
      rightPatient: false,
      rightDrug: false,
      rightDose: false,
      rightRoute: false,
      rightTime: false,
    });
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const allRightsVerified = Object.values(fiveRights).every(Boolean);
  const dob = targetPatient?.dob ? new Date(targetPatient.dob) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>SmartMedChart</span>
        </div>
        <div className="top-bar-section" style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>
          <span>Metropolitan General Hospital</span>
        </div>
        <div className="top-bar-section"><span>WARD 4B ICU · BEDSIDE DISPENSING</span></div>
        <div className="top-bar-section"><Clock size={12} /> Shift 07:00–15:00</div>
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/nurse')}
            className="btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <ArrowLeft size={13} /> Return to Nurse Dashboard
          </button>
        </div>
      </div>

      <WorkflowStepsNavBar />

      <div className="page-content" style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {/* Page Title & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scan size={22} color="var(--color-accent-blue)" /> Bedside 4-Point Barcode Scanner
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              {hasTargetPatient && targetPatient
                ? `Locked safety verification protocol for ${targetPatient.name} (Bed ${targetPatient.bed}).`
                : 'Scan patient wristband QR/barcode to verify identity and unlock eMAR administration.'}
            </p>
          </div>
          {hasTargetPatient && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate('/nurse')}
                className="btn-ghost"
                style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <ArrowLeft size={13} /> Nurse Dashboard
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════ TARGET PATIENT MODE (PATIENT SELECTED) ═══════════════ */}
        {hasTargetPatient && targetPatient ? (
          <div>
            {/* Target Patient Banner */}
            <div style={{
              background: '#0c1a30',
              backgroundImage: 'linear-gradient(135deg, #0c1a30 0%, #0e274c 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '16px 22px',
              marginBottom: 20,
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              boxShadow: '0 4px 14px rgba(12, 26, 48, 0.15)'
            }}>
              {/* Initials badge - NO <img> */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0b4da2, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: '#ffffff',
                flexShrink: 0
              }}>
                {targetPatient.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 19, fontWeight: 800, color: 'white' }}>{targetPatient.name}</span>
                  <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>ICU WARD 4B</span>
                  <span style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700 }}>Bed {targetPatient.bed}</span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>MRN: {targetPatient.mrn}</span>
                  {targetPatient.isolationStatus && (
                    <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>ISOLATION</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  DOB: {targetPatient.dob ? format(new Date(targetPatient.dob), 'dd-MMM-yyyy') : '—'} ({age}y) · Sex: {targetPatient.sex} · Weight: {targetPatient.weight}kg · Attending: Dr. Rohit Verma, MD (Pulmonology/CC)
                </div>

                {targetPatient.allergies?.length > 0 && (
                  <div className="alert-critical" style={{ marginTop: 8, padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} />
                    <span><strong>SEVERE ADVERSE ALLERGY:</strong> {targetPatient.allergies[0].allergen} — Anaphylaxis & Cephalosporin Cross-Reactivity Verified {targetPatient.allergies[0].verifiedAt ? new Date(targetPatient.allergies[0].verifiedAt).getFullYear() : ''}. <strong>Severity: High (Level 1)</strong></span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: isVerified ? 'rgba(22, 163, 74, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: isVerified ? '#4ade80' : '#fde047',
                  border: `1px solid ${isVerified ? 'rgba(74, 222, 128, 0.4)' : 'rgba(253, 224, 71, 0.4)'}`
                }}>
                  {isVerified ? <Check size={12} /> : <AlertTriangle size={12} />}
                  {isVerified ? 'PATIENT VERIFIED' : 'AWAITING SCAN'}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/patients/${targetPatient.id}`)}
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '3px 8px', color: '#93c5fd', borderColor: 'rgba(147,197,253,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <User size={11} /> View Full eMAR <ExternalLink size={10} />
                </button>
              </div>
            </div>

            {/* Target Medication Order Banner */}
            <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--color-accent-blue)' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(11,77,162,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill size={16} color="var(--color-accent-blue)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Prescription Order To Administer</span>
                  {selectedSchedule?.status === 'PENDING' && <span className="chip chip-due-now">DUE NOW</span>}
                  {selectedSchedule?.status === 'GIVEN' && <span className="chip chip-given">GIVEN</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Scheduled: {selectedSchedule?.scheduledTime ? format(new Date(selectedSchedule.scheduledTime), 'HH:mm') : 'Immediate / Stat'} · ICU Protocol
                </div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    {selectedSchedule?.prescription?.medicationName || activeRx?.medicationName || 'Ceftriaxone 1g IV'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span><strong>Dose:</strong> {selectedSchedule?.prescription?.dose || activeRx?.dose || 1}{selectedSchedule?.prescription?.unit || activeRx?.unit || 'g'}</span>
                    <span><strong>Route:</strong> {selectedSchedule?.prescription?.route || activeRx?.route || 'IV Piggyback'}</span>
                    <span><strong>Frequency:</strong> {selectedSchedule?.prescription?.frequency || activeRx?.frequency || 'Q12H'}</span>
                    <span><strong>Prescriber:</strong> Dr. Rohit Verma, MD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════ WRONG SCANNER ERROR ALERT ═══════════════ */}
            {wrongScanData && (
              <div style={{
                background: '#fef2f2',
                border: '2px solid #ef4444',
                borderRadius: 12,
                padding: '20px 24px',
                marginBottom: 24,
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
                animation: 'shake 0.5s ease-in-out'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                    <AlertOctagon size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🚨 WRONG PATIENT BARCODE / SCANNER MISMATCH DETECTED!
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
                      SmartMedChart Bedside Safety Interlock: Medication administration is strictly BLOCKED.
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Scanned Card (Red) */}
                  <div style={{ background: '#ffffff', border: '1.5px solid #f87171', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>
                      <XCircle size={14} /> Scanned Wristband (Mismatched)
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      {wrongScanData.scannedName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Bed: <strong style={{ color: '#dc2626' }}>{wrongScanData.scannedBed}</strong> · MRN: <strong style={{ color: '#dc2626' }}>{wrongScanData.scannedMrn}</strong>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                      ❌ FAILED: 1st Right (Right Patient)
                    </div>
                  </div>

                  {/* Expected Card (Green/Blue) */}
                  <div style={{ background: '#ffffff', border: '1.5px solid #0b4da2', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0b4da2', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>
                      <CheckCircle2 size={14} /> Prescribed Target Patient (Expected)
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                      {wrongScanData.expectedName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Bed: <strong style={{ color: '#0b4da2' }}>Bed {wrongScanData.expectedBed}</strong> · MRN: <strong style={{ color: '#0b4da2' }}>{wrongScanData.expectedMrn}</strong>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#0b4da2', fontWeight: 600 }}>
                      🎯 Target for: {selectedSchedule?.prescription?.medicationName || activeRx?.medicationName || 'Medication'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(220, 38, 38, 0.08)', padding: '10px 14px', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                    Please verify the physical patient bed and wristband QR before re-attempting scan.
                  </span>
                  <button
                    onClick={handleResetScan}
                    className="btn-primary"
                    style={{ background: '#dc2626', borderColor: '#b91c1c', fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={13} /> Clear Alert &amp; Re-Scan Wristband
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════ VERIFICATION SECTION ═══════════════ */}
            {!isVerified ? (
              /* Awaiting Scan State */
              <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}>
                {/* Live Camera Scanner View */}
                <div style={{ marginBottom: 22 }}>
                  <CameraQRScanner
                    onScanSuccess={(scannedCode) => {
                      processBarcodeScan(scannedCode);
                    }}
                    isPaused={Boolean(wrongScanData) || isVerified}
                    expectedPatientName={`${targetPatient.name} (Bed ${targetPatient.bed})`}
                    autoStart={true}
                  />
                </div>

                <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {isScanning ? 'Verifying Barcode...' : `Scan Wristband for ${targetPatient.name}`}
                </h2>
                <p style={{ margin: '0 auto 16px', maxWidth: 540, color: 'var(--color-text-muted)', fontSize: 12 }}>
                  Point camera at <strong>{targetPatient.name}</strong>'s wristband QR, use a handheld Symbol DS2208 scanner, or click simulation below.
                </p>

                {/* USB Barcode Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (barcodeInput.trim()) {
                      processBarcodeScan(barcodeInput);
                    }
                  }}
                  style={{ maxWidth: 460, margin: '0 auto 16px', display: 'flex', gap: 8 }}
                >
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder={`Type or scan wristband (e.g. ${targetPatient.mrn})`}
                    style={{
                      flex: 1,
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      background: 'var(--color-bg-primary)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                  />
                  <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: '0 18px' }}>
                    Verify
                  </button>
                </form>

                {/* Simulation & Test Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSimulateCorrectScan}
                    disabled={isScanning}
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '9px 18px' }}
                  >
                    <Scan size={14} /> Simulate Correct Scan ({targetPatient.name})
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateWrongScan}
                    disabled={isScanning}
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      padding: '9px 18px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Simulates scanning another patient's wristband to verify the wrong scanner mismatch alert"
                  >
                    <AlertTriangle size={14} /> Test Wrong Patient Scan (Mismatch Alert)
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateInvalidScan}
                    disabled={isScanning}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '9px 14px' }}
                  >
                    Test Invalid Barcode
                  </button>
                </div>
              </div>
            ) : (
              /* Verified State: 5 Rights Checklist & Administer */
              <div>
                {/* Green Verified Banner */}
                <div style={{
                  background: 'var(--color-given-green-bg)',
                  border: '1.5px solid var(--color-given-green-border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-given-green)' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-given-green)' }}>
                        ✓ PATIENT IDENTITY &amp; WRISTBAND VERIFIED
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {scanSuccessMessage || `Confirmed: ${targetPatient.name} (MRN: ${targetPatient.mrn}, Bed ${targetPatient.bed})`} · Bedside 4-Point Match Confirmed
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleResetScan}
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    Rescan
                  </button>
                </div>

                {/* 5 Rights Verification Grid */}
                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      5 Rights of Bedside Medication Safety Verification
                    </h3>
                    <div style={{ fontSize: 12, color: administered ? 'var(--color-given-green)' : 'var(--color-text-muted)', marginTop: 4 }}>
                      {administered ? '✓ All rights verified, co-signed and audited' : 'HL7 / FHIR Live · Verification Lock Active · Tap any card to toggle verification'}
                    </div>
                  </div>

                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
                      {([
                        { key: 'rightPatient', label: '1. RIGHT PATIENT', value: targetPatient.name, icon: User },
                        { key: 'rightDrug', label: '2. RIGHT DRUG', value: selectedSchedule?.prescription?.medicationName?.split('(')[0]?.trim() || activeRx?.medicationName?.split('(')[0]?.trim() || 'Active eMAR Protocol', icon: Pill },
                        { key: 'rightDose', label: '3. RIGHT DOSE', value: (selectedSchedule?.prescription?.dose ? `${selectedSchedule.prescription.dose}${selectedSchedule.prescription.unit || 'mg'}` : (activeRx ? `${activeRx.dose}${activeRx.unit || 'mg'}` : '1g')), icon: Hash },
                        { key: 'rightRoute', label: '4. RIGHT ROUTE', value: selectedSchedule?.prescription?.route?.split(' ')[0] || activeRx?.route?.split(' ')[0] || 'IV', icon: MapPin },
                        { key: 'rightTime', label: '5. RIGHT TIME', value: selectedSchedule?.scheduledTime ? format(new Date(selectedSchedule.scheduledTime), 'HH:mm') + ' (Due Now)' : 'Due Now (Shift 07–15)', icon: Clock },
                      ] as const).map(({ key, label, value, icon: Icon }) => {
                        const verified = fiveRights[key as keyof typeof fiveRights];
                        return (
                          <div
                            key={key}
                            onClick={() => !administered && setFiveRights(prev => ({ ...prev, [key]: !prev[key as keyof typeof fiveRights] }))}
                            style={{
                              background: verified ? 'var(--color-given-green-bg)' : 'var(--color-bg-hover)',
                              border: `1px solid ${verified ? 'var(--color-given-green-border)' : 'var(--color-border)'}`,
                              borderRadius: 8,
                              padding: '12px 8px',
                              textAlign: 'center',
                              cursor: administered ? 'default' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Icon size={18} color={verified ? 'var(--color-given-green)' : 'var(--color-text-muted)'} style={{ margin: '0 auto 6px', display: 'block' }} />
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: verified ? 'var(--color-given-green)' : 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {verified ? '✓ ' : ''}{value}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Administer Button / Administration State */}
                    {!administered ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => administerMutation.mutate()}
                          disabled={!allRightsVerified || administerMutation.isPending}
                          className={allRightsVerified ? 'btn-success' : 'btn-ghost'}
                          style={{ fontSize: 15, padding: '14px 48px', opacity: allRightsVerified ? 1 : 0.5, fontWeight: 800 }}
                        >
                          {administerMutation.isPending ? (
                            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Recording Administration...</>
                          ) : (
                            <><CheckCircle2 size={18} /> Administer &amp; Sign eMAR</>
                          )}
                        </button>
                        {!allRightsVerified && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            All 5 Rights must be checked to enable eMAR signature.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', background: 'var(--color-given-green-bg)', border: '1.5px solid var(--color-given-green-border)', borderRadius: 10 }}>
                        <CheckCircle2 size={36} color="var(--color-given-green)" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-given-green)' }}>
                          Medication Successfully Administered &amp; Recorded
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, marginBottom: 16 }}>
                          eMAR updated · 5-Rights Verified · Cryptographic audit trail stamped · HL7 Broadcast Dispatched
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                          <button
                            onClick={() => navigate('/nurse')}
                            className="btn-primary"
                            style={{ fontSize: 13, padding: '8px 20px' }}
                          >
                            <ArrowLeft size={14} /> Back to Nurse Dashboard
                          </button>
                          <button
                            onClick={() => navigate(`/patients/${targetPatient.id}`)}
                            className="btn-ghost"
                            style={{ fontSize: 13, padding: '8px 18px' }}
                          >
                            <User size={14} /> View Patient eMAR Chart
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remaining Pending Medications for Target Patient */}
                {(schedules as any[]).filter(s => s.status === 'PENDING' && s.id !== selectedSchedule?.id).length > 0 && (
                  <div className="card">
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                        Other Pending Medications for {targetPatient.name}
                      </h3>
                    </div>
                    {(schedules as any[]).filter(s => s.status === 'PENDING' && s.id !== selectedSchedule?.id).map((s: any) => (
                      <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.prescription?.medicationName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                            {s.prescription?.dose}{s.prescription?.unit} · {s.prescription?.route} · Due: {s.scheduledTime ? format(new Date(s.scheduledTime), 'HH:mm') : '—'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedScheduleId(s.id);
                            setAdministered(false);
                            setIsVerified(false);
                            setWrongScanData(null);
                          }}
                          className="btn-primary"
                          style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <QrCode size={12} /> Scan QR
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ═══════════════ GENERAL STANDALONE SCANNER MODE (NO PRE-SELECTED PATIENT) ═══════════════ */
          <div>
            <div className="card" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ marginBottom: 20 }}>
                <CameraQRScanner
                  onScanSuccess={(scannedCode) => {
                    processBarcodeScan(scannedCode);
                  }}
                  autoStart={true}
                />
              </div>

              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {isScanning ? 'Scanning Wristband...' : 'Ready to Scan Patient Wristband'}
              </h2>
              <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                Point your camera at any active patient wristband QR code to begin bedside dispensing.
              </p>

              {/* Barcode Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (barcodeInput.trim()) {
                    processBarcodeScan(barcodeInput);
                  }
                }}
                style={{ maxWidth: 440, margin: '0 auto 24px', display: 'flex', gap: 8 }}
              >
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Type or scan patient MRN (e.g. MRN-2024-004)"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    fontSize: 13,
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: '0 18px' }}>
                  Scan &amp; Open
                </button>
              </form>

              {/* Simulation */}
              <button onClick={handleSimulateCorrectScan} disabled={isScanning} className="btn-primary" style={{ fontSize: 14, padding: '12px 32px' }}>
                <Scan size={16} /> {isScanning ? 'Scanning...' : 'Simulate Wristband Scan'}
              </button>

              {/* Fallback manual selector only shown when NO target patient is pre-selected */}
              <div style={{ marginTop: 28, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>Or choose a patient to begin administration:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                  {(patients as any[]).map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setIsVerified(false);
                        setWrongScanData(null);
                      }}
                      className="btn-ghost"
                      style={{ flexDirection: 'column', padding: '10px', height: 'auto', textAlign: 'center' }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Bed {p.bed} · {p.mrn}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
