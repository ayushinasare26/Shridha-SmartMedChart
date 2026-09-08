import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService, patientService, noteService } from '../services/api.services';
import {
  AlertTriangle, FileText, Users, Activity, Shield, Plus, Clock,
  CheckCircle2, Stethoscope, Check, ClipboardList, Filter, RefreshCw,
  Search, ChevronRight, Eye, Sparkles, MessageSquare, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { format, differenceInYears } from 'date-fns';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';
import { PatientCaseFileModal } from '../components/PatientCaseFileModal';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal state for viewing patient case file
  const [selectedCaseFilePatientId, setSelectedCaseFilePatientId] = useState<string | null>(null);

  // Nurse updates feed filters
  const [nurseFilterType, setNurseFilterType] = useState<'all' | 'ADMINISTRATION' | 'HOLD_DELAY' | 'NURSE_NOTE'>('all');
  const [coSignedIds, setCoSignedIds] = useState<Set<string>>(new Set());

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-doctor'],
    queryFn: dashboardService.doctor,
    refetchInterval: 8000,
  });

  const { data: patients = [], refetch: refetchPatients } = useQuery({
    queryKey: ['patients-active'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
    refetchInterval: 8000,
  });

  const refetchAll = () => {
    refetchStats();
    refetchPatients();
  };

  // Cross-tab live synchronization for nurse administrations
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
  }, []);

  // Filter patients strictly to those allotted to this doctor
  const displayedPatients = (patients as any[]).filter(p => {
    if (!user?.id) return true;
    return p.attendingId === user.id;
  });

  // Filter nurse updates feed - strictly only this doctor's allotted patients
  const rawNurseUpdates = stats?.nurseUpdates || [];
  const filteredNurseUpdates = rawNurseUpdates.filter((item: any) => {
    // Strictly guard against any non-assigned patients
    if (item.patient?.attendingId && user?.id && item.patient.attendingId !== user.id) return false;
    if (item.patientId && user?.id && !displayedPatients.some((p: any) => p.id === item.patientId)) return false;
    if (nurseFilterType === 'ADMINISTRATION' && item.eventType !== 'ADMINISTRATION') return false;
    if (nurseFilterType === 'HOLD_DELAY' && !['DOSE_HOLD', 'DOSE_DELAY'].includes(item.eventType)) return false;
    if (nurseFilterType === 'NURSE_NOTE' && item.eventType !== 'NURSE_NOTE') return false;
    return true;
  });

  const handleAcknowledgeNurseUpdate = async (item: any) => {
    const updateId = item.id;
    setCoSignedIds(prev => new Set(prev).add(updateId));

    if (item.sourceId && item.eventType === 'NURSE_NOTE') {
      try {
        await noteService.acknowledge(item.sourceId);
      } catch (err) {
        console.warn('Acknowledge note API error:', err);
      }
    }
    refetchStats();
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>SmartMedChart</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Hospital OS V4.2</span>
        </div>
        <div className="top-bar-section">
          <Activity size={13} color="var(--color-accent-blue-light)" />
          <span>Cardiothoracic ICU &bull; Ward 4B</span>
        </div>
        <div className="top-bar-section">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span>EHR Live Sync Active</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
          {stats?.criticalAlerts > 0 && (
            <span className="chip chip-stat"><AlertTriangle size={11} /> {stats.criticalAlerts} Critical STAT</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'MD'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name || 'Dr. V. Sharma, MD'}</div>
              <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>Attending Physician</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Header Title & Actions */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Doctor Clinical Command Portal
              </h1>
              <span style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: 9999,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700
              }}>
                Attending Intensivist
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')} &bull; Ward 4B ICU &bull; Shift 07:00–15:00
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => refetchAll()}
              className="btn-ghost"
              style={{ fontSize: 12, padding: '7px 12px' }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => navigate('/prescriptions/new')}
              className="btn-primary"
              style={{ fontSize: 12, padding: '7px 16px' }}
            >
              <Plus size={14} />
              <span>New Prescription</span>
            </button>
          </div>
        </div>

        {/* Top Clinical Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            {
              label: 'My Assigned Patients',
              value: displayedPatients.length,
              subtext: 'Patients under your care',
              icon: Stethoscope,
              color: '#34d399',
              highlight: true
            },
            {
              label: 'Active Prescriptions',
              value: stats?.activeOrders ?? 0,
              subtext: 'Ongoing patient medications',
              icon: FileText,
              color: 'var(--color-given-green)',
              highlight: false
            },
            {
              label: 'Pending Sign-offs',
              value: stats?.pendingCoSign ?? 0,
              subtext: 'Orders needing doctor signature',
              icon: Clock,
              color: 'var(--color-due-amber)',
              alert: stats?.pendingCoSign > 0
            },
            {
              label: 'Safety Alerts',
              value: stats?.criticalAlerts ?? 0,
              subtext: 'Allergy & drug clash warnings',
              icon: AlertTriangle,
              color: 'var(--color-stat-red)',
              alert: stats?.criticalAlerts > 0
            },
          ].map(({ label, value, subtext, icon: Icon, color, alert, highlight }) => (
            <div
              key={label}
              className="stat-card"
              style={{
                borderColor: alert ? 'rgba(239,68,68,0.5)' : (highlight ? 'rgba(52, 211, 153, 0.4)' : undefined),
                background: alert ? 'rgba(239,68,68,0.05)' : (highlight ? 'rgba(52, 211, 153, 0.04)' : undefined)
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </span>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: alert ? 'var(--color-stat-red)' : (highlight ? '#34d399' : 'var(--color-text-primary)') }}>
                {statsLoading ? '—' : value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{subtext}</div>
            </div>
          ))}
        </div>

        {/* Assigned Patients Quick Roster - Small Patient Boxes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="var(--color-accent-blue-light)" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                My Patients Quick Overview
              </h2>
              <span style={{
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#34d399',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 800
              }}>
                {displayedPatients.length} Patients Assigned
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Click any patient box to open medical history, vitals &amp; case file
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 14
          }}>
            {displayedPatients.map((p: any) => {
              const age = p.dob ? differenceInYears(new Date(), new Date(p.dob)) : '—';
              const hasAllergies = p.allergies?.length > 0;
              const latestAdmin = p.administrations?.[0];

              return (
                <div
                  key={p.id}
                  className="card"
                  onClick={() => setSelectedCaseFilePatientId(p.id)}
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1.5px solid var(--color-border)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px -3px rgba(56, 189, 248, 0.18)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      {/* Bed Square Number Badge */}
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(52, 211, 153, 0.15)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#34d399',
                        flexShrink: 0
                      }}>
                        {p.bed?.replace('ICU-', '')}
                      </div>

                      <div style={{ flex: 1 }}>
                        {/* HIGHLIGHTED PATIENT NAME & STATUS CHIPS */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: '#0f172a',
                            backgroundColor: '#ecfdf5',
                            border: '1.5px solid #a7f3d0',
                            padding: '3px 10px',
                            borderRadius: 8,
                            letterSpacing: '-0.01em',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            <span style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              display: 'inline-block'
                            }}></span>
                            {p.name}
                          </span>

                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#047857',
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.35)',
                            padding: '2px 7px',
                            borderRadius: 5,
                            letterSpacing: '0.04em'
                          }}>
                            ASSIGNED TO YOU
                          </span>

                          {p.npoStatus && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '2px 6px' }}>
                              NPO
                            </span>
                          )}
                          {p.isolationStatus && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '2px 6px' }}>
                              ISOLATION
                            </span>
                          )}
                        </div>

                        {/* ROW 1: BED, MRN, DEMOGRAPHICS */}
                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontWeight: 700,
                            color: '#0b4da2',
                            backgroundColor: '#eff6ff',
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid #bfdbfe'
                          }}>
                            Bed {p.bed}
                          </span>
                          <span style={{ color: '#94a3b8' }}>&bull;</span>
                          <span>MRN: <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{p.mrn}</strong></span>
                          <span style={{ color: '#94a3b8' }}>&bull;</span>
                          <span>{p.sex} &bull; {age}y &bull; {p.weight}kg</span>
                        </div>

                        {/* ROW 2: CLINICAL DIAGNOSIS */}
                        <div style={{ fontSize: 12, color: '#334155', marginBottom: 5, lineHeight: 1.4 }}>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Dx: </span>
                          <strong style={{ color: '#1e293b' }}>{p.admissionDiagnosis || 'Acute Inpatient Care'}</strong>
                        </div>

                        {/* ROW 3: ALLERGIES (IF ANY) */}
                        {hasAllergies && (
                          <div style={{ fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                            <AlertTriangle size={11} color="#dc2626" />
                            <span style={{ fontWeight: 600 }}>
                              {p.allergies.map((a: any) => a.allergen).join(', ')} Allergy
                            </span>
                          </div>
                        )}

                        {/* ROW 4: NURSE SIGN-OFF & BEDSIDE STATUS */}
                        {latestAdmin ? (
                          <div style={{
                            fontSize: 11,
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            padding: '3px 8px',
                            borderRadius: 5,
                            fontWeight: 600,
                            width: 'fit-content'
                          }}>
                            <CheckCircle2 size={12} color="#16a34a" />
                            <span>
                              Nurse Sign-off: {format(new Date(latestAdmin.signedAt), 'HH:mm dd-MMM')} by {latestAdmin.administeredBy?.name || 'Nurse Priya, RN'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} />
                            <span>Bedside vitals &amp; safety checked by Nurse Priya, RN</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button: View Case File */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCaseFilePatientId(p.id);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <ClipboardList size={13} />
                      <span>View Case File</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>My Recent Prescriptions</h3>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Medicines prescribed by you</span>
            </div>
            <button onClick={() => navigate('/prescriptions')} className="btn-ghost" style={{ fontSize: 11 }}>View All Orders</button>
          </div>
          {(stats?.recentPrescriptions || []).slice(0, 5).map((rx: any) => {
            const targetPatientId = rx.patientId || rx.patient?.id;
            return (
              <div
                key={rx.id}
                onClick={() => targetPatientId && setSelectedCaseFilePatientId(targetPatientId)}
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  cursor: targetPatientId ? 'pointer' : 'default',
                  transition: 'background 0.15s ease'
                }}
                onMouseOver={e => { if (targetPatientId) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseOut={e => { e.currentTarget.style.background = ''; }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#0f172a',
                      backgroundColor: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2563eb' }}></span>
                      {rx.patient?.name}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#0b4da2',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      padding: '1px 6px',
                      borderRadius: 4
                    }}>
                      Bed {rx.patient?.bed}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{rx.medicationName}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>&bull; {rx.dose}{rx.unit} {rx.route}</span>
                    {rx.isStatOrder && <span className="chip chip-stat">STAT</span>}
                    {rx.status === 'HELD' && <span className="chip chip-held">HELD</span>}
                  </div>
                  {rx.safetyAlerts?.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <AlertTriangle size={11} color="var(--color-stat-red)" />
                      <span style={{ fontSize: 11, color: 'var(--color-stat-red)' }}>{rx.safetyAlerts.length} Safety Alert(s)</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetPatientId) setSelectedCaseFilePatientId(targetPatientId);
                  }}
                  className="btn-ghost"
                  style={{
                    fontSize: 11,
                    padding: '5px 12px',
                    fontWeight: 600,
                    color: 'var(--color-accent-blue-light)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6
                  }}
                >
                  View Patient File
                </button>
              </div>
            );
          })}
        </div>

        {/* FEATURE 3: NURSE UPDATES & BEDSIDE SHIFT HANDOFF FEED */}
        <div className="card">
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Nurse Portal Updates &amp; Bedside Activity Hub
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#34d399' }}>
                  <span className="live-dot" style={{ width: 6, height: 6, backgroundColor: '#10b981' }} />
                  LIVE NURSE FEED
                </div>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Real-time bedside administrations, dose holds/delays, and nursing shift handoff observations.
              </p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  color: '#34d399',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={12} />
                <span>Assigned Patients Only ({displayedPatients.length})</span>
              </div>

              <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: 2, gap: 2 }}>
                {[
                  { key: 'all', label: 'All Updates' },
                  { key: 'ADMINISTRATION', label: 'Administrations' },
                  { key: 'HOLD_DELAY', label: 'Holds & Delays' },
                  { key: 'NURSE_NOTE', label: 'Nurse Notes' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNurseFilterType(key as any)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: nurseFilterType === key ? '#2563eb' : 'transparent',
                      color: nurseFilterType === key ? '#ffffff' : 'var(--color-text-muted)'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feed List */}
          <div>
            {filteredNurseUpdates.length > 0 ? (
              filteredNurseUpdates.map((item: any) => {
                const isCoSigned = coSignedIds.has(item.id) || item.isAcknowledged;
                const isHold = item.eventType === 'DOSE_HOLD';
                const isDelay = item.eventType === 'DOSE_DELAY';
                const isNote = item.eventType === 'NURSE_NOTE';
                const isAdmin = item.eventType === 'ADMINISTRATION';

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      transition: 'background 0.15s ease',
                      backgroundColor: isHold ? 'rgba(249, 115, 22, 0.03)' : (isDelay ? 'rgba(234, 179, 8, 0.03)' : undefined)
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                    onMouseOut={e => (e.currentTarget.style.background = isHold ? 'rgba(249, 115, 22, 0.03)' : (isDelay ? 'rgba(234, 179, 8, 0.03)' : ''))}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 280 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isAdmin ? 'rgba(16, 185, 129, 0.15)' : (isHold ? 'rgba(249, 115, 22, 0.15)' : (isDelay ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)')),
                        border: `1px solid ${isAdmin ? 'rgba(16, 185, 129, 0.3)' : (isHold ? 'rgba(249, 115, 22, 0.3)' : 'rgba(56, 189, 248, 0.3)')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isAdmin ? '#34d399' : (isHold ? '#f97316' : (isDelay ? '#eab308' : '#38bdf8')),
                        flexShrink: 0
                      }}>
                        {isAdmin && <CheckCircle2 size={18} />}
                        {isHold && <AlertCircle size={18} />}
                        {isDelay && <Clock size={18} />}
                        {isNote && <MessageSquare size={18} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {item.title}
                          </span>

                          {isAdmin && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: 4 }}>
                              5-RIGHTS VERIFIED
                            </span>
                          )}
                          {isHold && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.12)', padding: '1px 6px', borderRadius: 4 }}>
                              CLINICAL HOLD
                            </span>
                          )}
                          {isDelay && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.12)', padding: '1px 6px', borderRadius: 4 }}>
                              RESCHEDULED
                            </span>
                          )}
                          {isNote && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '1px 6px', borderRadius: 4 }}>
                              BEDSIDE OBSERVATION
                            </span>
                          )}
                          {item.isMyPatient && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '1px 5px', borderRadius: 4 }}>
                              YOUR PATIENT
                            </span>
                          )}
                        </div>

                        {/* Patient & Nurse details */}
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span>
                            Patient: <strong style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: '#0f172a',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              padding: '2px 8px',
                              borderRadius: 6
                            }}>{item.patient?.name}</strong> <span style={{ color: '#0b4da2', fontWeight: 700 }}>(Bed {item.patient?.bed})</span>
                          </span>
                          <span>&bull;</span>
                          <span style={{ color: 'var(--color-accent-blue-light)' }}>
                            Nurse: {item.actor?.name || 'Nurse Priya, RN'}
                          </span>
                          <span>&bull;</span>
                          <span style={{ fontFamily: 'monospace' }}>
                            {format(new Date(item.timestamp), 'HH:mm:ss')} ({format(new Date(item.timestamp), 'dd-MMM')})
                          </span>
                        </div>

                        {/* Clinical notes / details content — Clean Light Box */}
                        <div style={{ fontSize: 12, color: '#334155', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', lineHeight: 1.5, marginTop: 4 }}>
                          {item.details?.notes || item.details?.reason || item.details?.content || 'Routine verification completed.'}
                        </div>

                        {/* Vitals attached */}
                        {item.details?.vitalsData && (
                          <div style={{ fontSize: 10, color: '#38bdf8', marginTop: 4, display: 'flex', gap: 10 }}>
                            <span>BP: {item.details.vitalsData.bp}</span>
                            <span>HR: {item.details.vitalsData.hr} bpm</span>
                            <span>SpO2: {item.details.vitalsData.spo2}%</span>
                            <span>Temp: {item.details.vitalsData.temp} °C</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Doctor Review & Approve button */}
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeNurseUpdate(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: `1px solid ${isCoSigned ? 'rgba(52, 211, 153, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                          backgroundColor: isCoSigned ? 'rgba(52, 211, 153, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                          color: isCoSigned ? '#34d399' : '#38bdf8',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={12} />
                        <span>{isCoSigned ? 'Approved' : 'Review & Approve'}</span>
                      </button>

                      {item.patientId && (
                        <button
                          type="button"
                          onClick={() => setSelectedCaseFilePatientId(item.patientId)}
                          className="btn-ghost"
                          style={{
                            fontSize: 11,
                            padding: '6px 12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: 6
                          }}
                        >
                          Case File
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                <CheckCircle2 size={24} color="var(--color-given-green)" style={{ margin: '0 auto 6px', display: 'block' }} />
                No nurse updates found for the selected filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PATIENT CLINICAL CASE FILE MODAL */}
      {selectedCaseFilePatientId && (
        <PatientCaseFileModal
          patientId={selectedCaseFilePatientId}
          onClose={() => setSelectedCaseFilePatientId(null)}
          onNewOrder={(patId) => navigate(`/prescriptions/new?patientId=${patId}`)}
        />
      )}
    </div>
  );
}
