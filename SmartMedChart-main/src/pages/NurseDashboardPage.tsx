import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, scheduleService } from '../services/api.services';
import { format } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle2, Timer, Activity, Plus, RefreshCw, User, ExternalLink, QrCode, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';

const WARD = 'WARD-4B-ICU';

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    GIVEN: { label: 'GIVEN', cls: 'chip-given' },
    PENDING: { label: 'PENDING', cls: 'chip-pending' },
    HELD: { label: 'ON HOLD', cls: 'chip-held' },
    DELAYED: { label: 'DELAYED', cls: 'chip-delayed' },
    MISSED: { label: 'MISSED', cls: 'chip-stat' },
    CANCELLED: { label: 'CANCELLED', cls: 'chip-scheduled' },
  };
  const m = map[status] || { label: status, cls: 'chip-scheduled' };
  return <span className={`chip ${m.cls}`}>{m.label}</span>;
}

function isStatUrgent(s: any) { return s.prescription?.isStatOrder && s.status === 'PENDING'; }
function isDueNow(s: any) {
  if (s.status !== 'PENDING') return false;
  const diff = (new Date(s.scheduledTime).getTime() - Date.now()) / 60000;
  return diff <= 30;
}

export default function NurseDashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-nurse', WARD],
    queryFn: () => dashboardService.nurse({ ward: WARD }),
    refetchInterval: 10000,
  });

  const { data: schedules = [], isLoading: schLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['ward-schedules', WARD],
    queryFn: () => scheduleService.getWard({ ward: WARD }),
    refetchInterval: 10000,
  });

  const refetch = () => {
    refetchStats();
    refetchSchedules();
  };

  // Cross-tab synchronization for bedside administrations
  useEffect(() => {
    const handleMedAdministered = () => {
      refetch();
    };
    window.addEventListener('smartmed:medication_administered', handleMedAdministered);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smartmed_last_administered') {
        refetch();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('smartmed:medication_administered', handleMedAdministered);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const isLoading = statsLoading || schLoading;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>Metropolitan General Hospital</span>
        </div>
        <div className="top-bar-section">
          <Activity size={13} color="var(--color-accent-blue-light)" />
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Ward 4B ICU</span>
        </div>
        <div className="top-bar-section">
          <Clock size={12} />
          <span>Shift 07:00–15:00</span>
        </div>
        <div className="top-bar-section">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span>Station: COW-ICU-084</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
          {stats?.statUrgent > 0 && (
            <span className="chip chip-stat" style={{ fontSize: 12, padding: '4px 10px' }}>
              <AlertTriangle size={12} /> {stats.statUrgent} STAT Alert
            </span>
          )}
          <button onClick={() => refetch()} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => navigate('/bedside-scan')} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
            <Activity size={13} /> Bedside Scanner
          </button>
        </div>
      </div>

      {/* Workflow Steps */}
      <WorkflowStepsNavBar />

      {/* Patient Banner — STAT */}
      {schedules.some(isStatUrgent) && (
        <div style={{ padding: '10px 24px', background: 'rgba(15, 22, 41, 0.9)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-stat-red-bg)', border: '1px solid var(--color-stat-red-border)', borderRadius: 8, padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-stat-red)', borderRadius: 4, padding: '3px 10px', whiteSpace: 'nowrap' }}>
              <AlertTriangle size={12} color="white" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>STAT URGENT ORDER PENDING</span>
            </div>
            {schedules.filter(isStatUrgent).slice(0, 1).map((s: any) => {
              const pId = s.patientId || s.patient?.id;
              return (
                <div key={s.id} style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{s.prescription?.medicationName}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Patient:</span>
                    <button
                      type="button"
                      onClick={() => pId && navigate(`/patients/${pId}`)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: 6,
                        padding: '1px 8px',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Open Patient eMAR Profile"
                    >
                      <User size={12} />
                      <span>{s.patient?.name} (Bed {s.patient?.bed})</span>
                      <ExternalLink size={10} />
                    </button>
                    <span>• {s.prescription?.route}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 8 }}>
              {(() => {
                const statItem = schedules.find(isStatUrgent);
                const statPatientId = statItem?.patientId || statItem?.patient?.id;
                return (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onClick={() => statPatientId ? navigate(`/patients/${statPatientId}`) : navigate('/patients')}
                  >
                    <User size={13} /> View Patient eMAR Profile
                  </button>
                );
              })()}
              <button
                className="btn-stat"
                style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={() => {
                  const statItem = schedules.find(isStatUrgent);
                  const statPatientId = statItem?.patientId || statItem?.patient?.id;
                  if (statItem && statPatientId) {
                    navigate(`/bedside-scan?scheduleId=${statItem.id}&patientId=${statPatientId}`);
                  } else {
                    navigate('/bedside-scan');
                  }
                }}
              >
                <QrCode size={13} /> Scan QR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Due Today</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-text-primary)' }}>{isLoading ? '—' : stats?.dueToday ?? 0}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ICU Ward 4B · 100% charted</div>
          </div>

          <div className="stat-card due-now">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-due-amber)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Due Now</span>
              <Clock size={16} color="var(--color-due-amber)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-due-amber)' }}>{isLoading ? '—' : (stats?.dueNow ?? 0).toString().padStart(2, '0')}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Immediate Action</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Within &lt;30m</div>
          </div>

          <div className="stat-card completed">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-given-green)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</span>
              <CheckCircle2 size={16} color="var(--color-given-green)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-given-green)' }}>{isLoading ? '—' : (stats?.completed ?? 0).toString().padStart(2, '0')}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Shift Progress {stats?.shiftProgress ?? 0}% of batch</div>
          </div>

          <div className="stat-card" style={stats?.delayed > 0 ? { borderColor: 'var(--color-due-amber-border)' } : {}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delayed</span>
              <Timer size={16} color="var(--color-due-amber)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: stats?.delayed > 0 ? 'var(--color-due-amber)' : 'var(--color-text-primary)' }}>
              {isLoading ? '—' : (stats?.delayed ?? 0).toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Radiology Hold · ICU-08 &amp; 03</div>
          </div>

          <div className="stat-card stat-urgent">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-stat-red)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>STAT Urgent</span>
              <AlertTriangle size={16} color="var(--color-stat-red)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-stat-red)' }}>
              {isLoading ? '—' : (stats?.statUrgent ?? 0).toString().padStart(2, '0')}
            </div>
            {stats?.statPatients?.[0] && (
              <>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Bed {stats.statPatients[0].patient?.bed}</div>
                <div style={{ fontSize: 11, color: 'var(--color-stat-red)', fontWeight: 600 }}>{stats.statPatients[0].patient?.name}</div>
              </>
            )}
          </div>
        </div>

        {/* Ward Schedule */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Ward 4B Active Medication Administration Schedule</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>Live bedside dispensing timeline · Current Shift 07:00–15:00 · Click any patient name or 'Patient Profile' to open eMAR chart</p>
            </div>
            <button onClick={() => navigate('/bedside-scan')} className="btn-primary" style={{ fontSize: 12 }}>
              <Activity size={13} /> Bedside 4-Pt Scanner
            </button>
          </div>

          <div>
            {isLoading && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading schedule...</div>
            )}
            {!isLoading && schedules.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No schedules for today.</div>
            )}
            {(schedules as any[]).map((s: any) => {
              const stat = isStatUrgent(s);
              const dueNow = isDueNow(s);
              const rowClass = stat ? 'stat-urgent' : dueNow ? 'due-now' : s.status === 'GIVEN' ? 'given' : s.status === 'HELD' || s.status === 'DELAYED' ? 'held' : '';
              const patientId = s.patientId || s.patient?.id;

              return (
                <div key={s.id} className={`schedule-row ${rowClass}`}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: stat ? 'var(--color-stat-red)' : dueNow ? 'var(--color-due-amber)' : 'var(--color-text-primary)' }}>
                      {format(new Date(s.scheduledTime), 'HH:mm')}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: stat ? 'var(--color-stat-red)' : dueNow ? 'var(--color-due-amber)' : s.status === 'GIVEN' ? 'var(--color-given-green)' : s.status === 'DELAYED' ? 'var(--color-due-amber)' : 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                      {s.status === 'GIVEN' ? 'GIVEN' : dueNow ? 'DUE NOW' : s.status === 'DELAYED' ? `DELAYED +${s.delayMinutes}M` : s.status === 'HELD' ? 'ON HOLD' : 'UPCOMING'}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{s.prescription?.medicationName}</span>
                      {stat && <span className="chip chip-stat">STAT URGENT</span>}
                      {dueNow && !stat && <span className="chip chip-due-now">DUE NOW</span>}
                      {s.status === 'GIVEN' && <span className="chip chip-given">✓ GIVEN</span>}
                      {s.status === 'DELAYED' && <span className="chip chip-delayed">DELAYED</span>}
                      {s.status === 'HELD' && <span className="chip chip-held">ON HOLD</span>}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Pt:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (patientId) navigate(`/patients/${patientId}`);
                        }}
                        style={{
                          background: 'rgba(11, 77, 162, 0.08)',
                          border: '1px solid rgba(11, 77, 162, 0.25)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          color: 'var(--color-accent-blue-light)',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(11, 77, 162, 0.2)';
                          e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(11, 77, 162, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(11, 77, 162, 0.25)';
                        }}
                        title={`Open full eMAR profile for ${s.patient?.name || 'Patient'}`}
                      >
                        <User size={12} />
                        <span>{s.patient?.name} (Bed {s.patient?.bed})</span>
                        <ExternalLink size={10} />
                      </button>

                      <span>· {s.prescription?.route}</span>
                      {s.prescription?.prescriber && (
                        <span>
                          · {s.prescription.prescriber.name.startsWith('Dr.') ? s.prescription.prescriber.name : `Dr. ${s.prescription.prescriber.name}`}
                        </span>
                      )}
                    </div>

                    {s.administrationRecord && (
                      <div style={{ fontSize: 11, color: 'var(--color-given-green)', marginTop: 3 }}>
                        Signed: {s.administeredBy?.name} at {format(new Date(s.administeredAt), 'HH:mm')}
                        {s.administrationRecord?.barcodeScanned && ' · Verified by 4-Pt Barcode'}
                        {s.administrationRecord?.adminId && ` · Admin ID: ${s.administrationRecord.adminId}`}
                      </div>
                    )}
                    {s.status === 'DELAYED' && s.delayReason && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                        Reason: {s.delayReason.slice(0, 80)}...
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {s.administrationRecord && (
                      <span style={{ fontSize: 11, color: 'var(--color-given-green)', fontWeight: 600 }}>100% Safe Match</span>
                    )}

                    {/* Open Patient Profile Button */}
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{
                        fontSize: 11,
                        padding: '6px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                        color: 'var(--color-accent-blue-light)',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (patientId) navigate(`/patients/${patientId}`);
                      }}
                      title="Open Full Patient eMAR Profile & Chart"
                    >
                      <User size={12} />
                      <span>Patient Profile</span>
                    </button>

                    {(stat || dueNow) && s.status === 'PENDING' && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        onClick={() => navigate(`/bedside-scan?scheduleId=${s.id}&patientId=${patientId}`)}
                      >
                        <QrCode size={13} /> Scan QR
                      </button>
                    )}
                    {s.status === 'DELAYED' && (
                      <button className="btn-ghost" style={{ fontSize: 12 }}>Update Status</button>
                    )}
                    {s.status === 'PENDING' && !stat && !dueNow && (
                      <button className="btn-ghost" style={{ fontSize: 12 }}>Prepare</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
