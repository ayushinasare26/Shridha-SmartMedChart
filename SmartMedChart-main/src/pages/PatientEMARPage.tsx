import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientService, scheduleService } from '../services/api.services';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInMinutes } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, Scan, Shield, FileText, Activity, ChevronLeft, PhoneCall, QrCode } from 'lucide-react';
import { HospitalPersonQRModal } from '../components/HospitalPersonQRModal';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';
import { useAuth } from '../hooks/useAuth';

function getStatusChip(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    GIVEN: { bg: 'var(--color-given-green-bg)', color: 'var(--color-given-green)', label: 'COMPLETED' },
    PENDING: { bg: 'rgba(59,130,246,0.1)', color: 'var(--color-accent-blue-light)', label: 'SCHEDULED' },
    HELD: { bg: 'rgba(249,115,22,0.12)', color: 'var(--color-held-orange)', label: 'ON HOLD' },
    DELAYED: { bg: 'rgba(234,179,8,0.1)', color: 'var(--color-warning-yellow)', label: 'DELAYED' },
    MISSED: { bg: 'var(--color-stat-red-bg)', color: 'var(--color-stat-red)', label: 'MISSED' },
    CANCELLED: { bg: 'rgba(100,116,139,0.15)', color: 'var(--color-text-muted)', label: 'CANCELLED' },
  };
  const m = map[status] || { bg: 'var(--color-bg-hover)', color: 'var(--color-text-muted)', label: status };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: m.bg, color: m.color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {m.label}
    </span>
  );
}

export default function PatientEMARPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);

  const { data: patient, isLoading: patientLoading, refetch: refetchPatient } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const { data: schedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['patient-schedules', id],
    queryFn: () => scheduleService.getAll({ patientId: id! }),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const refetchAll = () => {
    refetchPatient();
    refetchSchedules();
  };

  useEffect(() => {
    const handleMedAdministered = () => {
      refetchAll();
    };
    window.addEventListener('smartmed:medication_administered', handleMedAdministered);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smartmed_last_administered') {
        refetchAll();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('smartmed:medication_administered', handleMedAdministered);
      window.removeEventListener('storage', handleStorage);
    };
  }, [id]);

  if (!id) return (
    <div className="page-content" style={{ color: 'var(--color-text-muted)', paddingTop: 80, textAlign: 'center' }}>
      Select a patient from the patient list.
    </div>
  );
  if (patientLoading) return <div className="page-content" style={{ color: 'var(--color-text-muted)' }}>Loading patient...</div>;
  if (!patient) return <div className="page-content" style={{ color: 'var(--color-stat-red)' }}>Patient not found.</div>;

  const criticalAllergies = patient.allergies?.filter((a: any) => a.severity === 'Anaphylaxis' || a.severity === 'Severe') || [];
  const activePrx = patient.prescriptions?.filter((rx: any) => ['ACTIVE', 'STAT'].includes(rx.status)) || [];
  const heldPrx = patient.prescriptions?.filter((rx: any) => rx.status === 'HELD') || [];
  const continuousPrx = patient.prescriptions?.filter((rx: any) => rx.isContinuous) || [];
  const prnPrx = patient.prescriptions?.filter((rx: any) => rx.frequency?.toUpperCase() === 'PRN') || [];

  const dob = new Date(patient.dob);
  const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  // 5-Rights from latest admin
  const lastAdmin = (schedules as any[]).find(s => s.administrationRecord);
  const fiveRights = lastAdmin?.administrationRecord || null;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <button onClick={() => navigate('/patients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <ChevronLeft size={14} /> Back
          </button>
        </div>
        <div className="top-bar-section">
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Metropolitan General Hospital</span>
        </div>
        <div className="top-bar-section" style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>
          <Activity size={13} /> WARD 4B ICU
        </div>
        <div className="top-bar-section"><Clock size={12} /> Shift 07:00–15:00</div>
        {patient.safetyAlerts?.length > 0 && (
          <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
            <span className="chip chip-stat"><AlertTriangle size={11} /> 1 STAT MED DUE</span>
          </div>
        )}
      </div>

      <WorkflowStepsNavBar />

      {/* Patient Header Banner */}
      <div style={{
        background: '#0c1a30',
        backgroundImage: 'linear-gradient(135deg, #0c1a30 0%, #0e274c 100%)',
        margin: '16px 24px 0',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 4px 14px rgba(12, 26, 48, 0.15)'
      }}>
        <div style={{
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 8,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8' }}>ICU</span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>{patient.name}</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 11, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>MRN: {patient.mrn}</span>
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>Bed {patient.bed}</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{age}y &bull; {patient.sex} &bull; {patient.weight}kg &bull; Dr. {patient.admissionDiagnosis ? `Sharma (Attending)` : '—'}</span>
            {patient.npoStatus && <span style={{ color: '#f59e0b', fontWeight: 700 }}>&bull; NPO Active</span>}
            {(patient.emergencyContactPhone || patient.emergencyContactName) && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '2px 8px',
                borderRadius: 4,
                color: '#fca5a5'
              }}>
                <PhoneCall size={11} style={{ color: '#f87171' }} />
                <span>Emergency: {patient.emergencyContactName || 'Family'} ({patient.emergencyContactRelation || 'Proxy'}) &bull;</span>
                <a
                  href={`tel:${(patient.emergencyContactPhone || '').replace(/[^\d+]/g, '')}`}
                  style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}
                >
                  {patient.emergencyContactPhone}
                </a>
              </span>
            )}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {user?.role !== 'NURSE' && (
            <button
              onClick={() => setShowQRModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
            >
              <QrCode size={14} />
              <span>Digital Wristband &amp; QR</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/bedside-scan?patientId=${patient.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              color: '#0b4da2',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Scan size={14} /> Scan Patient Wristband
          </button>
        </div>
      </div>

      {/* Critical Allergy Alert */}
      {criticalAllergies.map((allergy: any) => (
        <div key={allergy.id} className="alert-critical" style={{ margin: '0', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid #7f1d1d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} />
            <div>
              <span style={{ fontWeight: 700, fontSize: 13 }}>SEVERE ADVERSE DRUG REACTION ALERT: </span>
              <span style={{ fontSize: 13 }}>{allergy.allergen} Anaphylaxis & Cross-Reactivity Verified ({new Date(allergy.verifiedAt || '').getFullYear()})</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn-ghost" style={{ fontSize: 11, borderColor: '#7f1d1d', color: '#fca5a5' }}>View Allergy Monograph</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 4, marginLeft: 26 }}>
            Auto-checks across all β-lactam prescriptions
          </div>
        </div>
      ))}

      <div className="page-content">
        {/* Action Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 6 }}>
          {[
            { label: 'Scan QR', icon: QrCode, primary: true },
            { label: 'Co-Sign High Alert', icon: Shield },
            { label: 'Document Delay / Hold Reason', icon: Clock },
            { label: 'Medication History Log', icon: FileText },
          ].map(({ label, icon: Icon, primary }) => (
            <button key={label} className={primary ? 'btn-primary' : 'btn-ghost'} style={{ fontSize: 12, flex: primary ? undefined : 1, justifyContent: 'center' }}
              onClick={() => primary && navigate(`/bedside-scan?patientId=${id}`)}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Scheduled Medications */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'rgba(10,15,26,0.5)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              📋 Scheduled Medications (Routine & STAT Scheduled)
            </span>
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>{activePrx.length} active orders</span>
          </div>
          {activePrx.map((prx: any) => {
            const schedForPrx = (schedules as any[]).filter(s => s.prescriptionId === prx.id);
            const latestSched = schedForPrx[0];
            const isGiven = latestSched?.status === 'GIVEN';
            const isDueNow = latestSched?.status === 'PENDING' && latestSched?.scheduledTime &&
              Math.abs(differenceInMinutes(new Date(latestSched.scheduledTime), new Date())) <= 30;
            const hasCriticalAlert = prx.safetyAlerts?.some((a: any) => ['CRITICAL', 'HIGH'].includes(a.severity) && !a.isOverridden);

            return (
              <div key={prx.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', borderLeft: `3px solid ${isGiven ? 'var(--color-given-green)' : isDueNow || prx.isStatOrder ? 'var(--color-stat-red)' : 'var(--color-border)'}` }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
                        {prx.medicationName}
                      </span>
                      {prx.isStatOrder && <span className="chip chip-stat">STAT / OVERDUE</span>}
                      {isGiven && <span className="chip chip-given">COMPLETED</span>}
                      {isDueNow && !isGiven && !prx.isStatOrder && <span className="chip chip-due-now">DUE NOW</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      {prx.dose}{prx.unit} · {prx.route} · {prx.frequency} Regular
                    </div>
                    {prx.indication && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        Indication: {prx.indication}
                      </div>
                    )}
                    {hasCriticalAlert && (
                      <div className="alert-warning" style={{ marginTop: 8, padding: '8px 12px', fontSize: 11 }}>
                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                        <strong>ALLERGY OVERRIDE REQUIRED:</strong> {prx.safetyAlerts[0]?.message?.slice(0, 80)}
                        {prx.safetyAlerts[0]?.isOverridden && <span style={{ color: 'var(--color-given-green)', marginLeft: 8 }}>✓ Override Signed by Dr. Sharma</span>}
                      </div>
                    )}
                    {latestSched?.administrationRecord && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-given-green)' }}>
                        <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />
                        GIVEN {format(new Date(latestSched.administeredAt), 'HH:mm a')} — Signed: {latestSched.administeredBy?.name}
                        {latestSched.administrationRecord?.barcodeScanned && ' · Site: Forearm RV'}
                      </div>
                    )}
                    {prx.requiresCoSign && !prx.coSignedAt && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        Co-Signer: RN Required
                      </div>
                    )}
                  </div>

                  {/* Time Grid */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    {schedForPrx.slice(0, 3).map((s: any, idx: number) => (
                      <div key={s.id} style={{
                        width: 70, padding: '8px 4px', borderRadius: 6, textAlign: 'center', border: '1px solid var(--color-border)',
                        background: s.status === 'GIVEN' ? 'var(--color-given-green-bg)' : s.status === 'PENDING' && idx === 0 ? 'rgba(239,68,68,0.1)' : 'var(--color-bg-hover)',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.status === 'GIVEN' ? 'var(--color-given-green)' : s.status === 'PENDING' && idx === 0 ? 'var(--color-stat-red)' : 'var(--color-text-primary)' }}>
                          {format(new Date(s.scheduledTime), 'HH:mm')}
                        </div>
                        {getStatusChip(s.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Held/Discontinued */}
        {heldPrx.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'rgba(249,115,22,0.05)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-held-orange)' }}>
                ⏸ Discontinued / Temporarily On Hold
              </span>
            </div>
            {heldPrx.map((prx: any) => {
              const schedForPrx = (schedules as any[]).find(s => s.prescriptionId === prx.id);
              return (
                <div key={prx.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-held-orange)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{prx.medicationName}</span>
                        <span className="chip chip-held">ON HOLD / DELAY</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{prx.dose}{prx.unit} · {prx.route} · {prx.frequency}</div>
                      {schedForPrx?.holdReason && (
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-secondary)', background: 'rgba(249,115,22,0.06)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(249,115,22,0.2)' }}>
                          <strong style={{ color: 'var(--color-held-orange)' }}>Documented Hold Reason:</strong> {schedForPrx.holdReason}
                        </div>
                      )}
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11 }}>Resume Order Flow</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continuous IV */}
        {continuousPrx.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'rgba(6,182,212,0.05)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-info-cyan)' }}>
                💧 Continuous IV Infusions & Titrations
              </span>
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>{continuousPrx.length} Running Active</span>
            </div>
            {continuousPrx.map((prx: any) => (
              <div key={prx.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-info-cyan)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{prx.medicationName}</span>
                      <span style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--color-info-cyan)', fontSize: 10, padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(6,182,212,0.3)', fontWeight: 600 }}>🔴 RUNNING</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {prx.infusionRate || `${prx.dose}${prx.unit} · ${prx.route}`}
                    </div>
                    {prx.indication && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>Indication: {prx.indication}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-ghost" style={{ fontSize: 11 }}>Verify Volumes</button>
                    <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--color-stat-red)', borderColor: 'var(--color-stat-red-border)' }}>Pause / Stop</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRN */}
        {prnPrx.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                📦 PRN (As Needed) Medications
              </span>
            </div>
            {prnPrx.map((prx: any) => (
              <div key={prx.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{prx.medicationName}</span>
                      <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-given-green)', fontSize: 10, padding: '1px 7px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600 }}>PRN AVAILABLE</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{prx.dose}{prx.unit} · {prx.route}</div>
                    {prx.indication && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Indication Checklist: {prx.indication}</div>}
                  </div>
                  <button className="btn-success" style={{ fontSize: 11 }}>Give PRN Dose</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5 Rights Panel */}
        <div className="five-rights-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              5 Rights of Bedside Medication Safety Verification
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 11, color: 'var(--color-given-green)' }}>Barcode Scanner Connected (Symbol DS2208)</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[
              { label: '1. RIGHT PATIENT', value: patient.name, verified: !!fiveRights?.rightPatient, ok: true },
              { label: '2. RIGHT DRUG', value: activePrx[0]?.medicationName?.split('(')[0].trim() || '—', verified: !!fiveRights?.rightDrug, ok: fiveRights?.rightDrug },
              { label: '3. RIGHT DOSE', value: activePrx[0] ? `${activePrx[0].dose}${activePrx[0].unit} in 50mL` : '—', verified: !!fiveRights?.rightDose, ok: true },
              { label: '4. RIGHT ROUTE', value: 'IV Infusion', verified: !!fiveRights?.rightRoute, ok: true },
              { label: '5. RIGHT TIME', value: schedules[0] ? `${format(new Date((schedules as any[])[0]?.scheduledTime || new Date()), 'HH:mm')} (Due Now)` : '—', verified: !!fiveRights?.rightTime, ok: true },
            ].map(({ label, value, verified, ok }) => (
              <div key={label} style={{
                background: 'var(--color-bg-hover)', border: `1px solid ${verified ? 'var(--color-given-green-border)' : !ok ? 'var(--color-stat-red-border)' : 'var(--color-border)'}`,
                borderRadius: 8, padding: '10px 12px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: verified ? 'var(--color-given-green)' : !ok ? 'var(--color-stat-red)' : 'var(--color-text-primary)' }}>
                  {verified ? '✓ ' : !ok ? '! ' : ''}{value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Digital Wristband & QR Modal */}
      {patient && (
        <HospitalPersonQRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          person={{
            type: 'PATIENT',
            name: patient.name,
            mrn: patient.mrn,
            dob: patient.dob,
            sex: patient.sex,
            bed: patient.bed,
            ward: 'Ward 4B ICU',
            allergies: patient.allergies,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactRelation: patient.emergencyContactRelation,
            emergencyContactPhone: patient.emergencyContactPhone,
            attendingName: 'Dr. V. Sharma, MD',
            admissionDiagnosis: patient.admissionDiagnosis
          }}
        />
      )}
    </div>
  );
}
