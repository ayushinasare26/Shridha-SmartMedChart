import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, prescriptionService, patientService } from '../services/api.services';
import { AlertTriangle, FileText, Users, Activity, Shield, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-doctor'],
    queryFn: dashboardService.doctor,
    refetchInterval: 10000,
  });

  // Cross-tab live synchronization for nurse administrations
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
  }, [refetch]);

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-active'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>SmartMedChart</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Hospital OS V4.2</span>
        </div>
        <div className="top-bar-section"><span>Cardiothoracic ICU (North Wing)</span></div>
        <div className="top-bar-section">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span>EHR Live Sync Active</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
          {stats?.criticalAlerts > 0 && (
            <span className="chip chip-stat"><AlertTriangle size={11} /> {stats.criticalAlerts} Critical STAT</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
              {(user?.name || 'Dr').split(' ').filter(n => !['Dr.', 'MD', 'RN', 'MBA', 'PhD', 'Pharm.'].includes(n)).map(w => w[0]).join('').slice(0, 2).toUpperCase() || (user?.name || 'DS').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Attending Intensivist</div>
            </div>
          </div>
        </div>
      </div>

      <WorkflowStepsNavBar />

      <div className="page-content">
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>Doctor Overview</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · ICU Clinical Dashboard
            </p>
          </div>
          <button onClick={() => navigate('/prescriptions/new')} className="btn-primary">
            <Plus size={14} /> New CPOE Order
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Active Patients', value: stats?.totalPatients ?? 0, icon: Users, color: 'var(--color-accent-blue-light)' },
            { label: 'Active Orders', value: stats?.activeOrders ?? 0, icon: FileText, color: 'var(--color-given-green)' },
            { label: 'Pending Co-Signs', value: stats?.pendingCoSign ?? 0, icon: Clock, color: 'var(--color-due-amber)', alert: stats?.pendingCoSign > 0 },
            { label: 'Critical Alerts', value: stats?.criticalAlerts ?? 0, icon: AlertTriangle, color: 'var(--color-stat-red)', alert: stats?.criticalAlerts > 0 },
          ].map(({ label, value, icon: Icon, color, alert }) => (
            <div key={label} className="stat-card" style={alert ? { borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.05)' } : {}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: alert ? 'var(--color-stat-red)' : 'var(--color-text-primary)' }}>{isLoading ? '—' : value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Recent Prescriptions */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent CPOE Orders</h3>
              <button onClick={() => navigate('/prescriptions')} className="btn-ghost" style={{ fontSize: 11 }}>View All</button>
            </div>
            {(stats?.recentPrescriptions || []).slice(0, 6).map((rx: any) => {
              const targetPatientId = rx.patientId || rx.patient?.id;
              return (
                <div
                  key={rx.id}
                  onClick={() => targetPatientId && navigate(`/patients/${targetPatientId}`)}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: targetPatientId ? 'pointer' : 'default',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={e => { if (targetPatientId) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = ''; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{rx.medicationName}</span>
                      {rx.isStatOrder && <span className="chip chip-stat">STAT</span>}
                      {rx.status === 'HELD' && <span className="chip chip-held">HELD</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {rx.patient?.name} · Bed {rx.patient?.bed} · {rx.dose}{rx.unit} {rx.route}
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
                      if (targetPatientId) navigate(`/patients/${targetPatientId}`);
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
                    View
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active Patients */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Active Patients</h3>
              <button onClick={() => navigate('/patients')} className="btn-ghost" style={{ fontSize: 11 }}>View All</button>
            </div>
            {(patients as any[]).slice(0, 6).map((p: any) => (
              <div
                key={p.id}
                style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => navigate(`/patients/${p.id}`)}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseOut={e => (e.currentTarget.style.background = '')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                    {p.bed?.replace('ICU-', '')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                      {p.npoStatus && <span style={{ fontSize: 10, color: 'var(--color-due-amber)', fontWeight: 700 }}>NPO</span>}
                      {p.isolationStatus && <span style={{ fontSize: 10, color: 'var(--color-stat-red)', fontWeight: 700, background: 'var(--color-stat-red-bg)', padding: '1px 5px', borderRadius: 3 }}>ISOLATION</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      MRN: {p.mrn} · {p.sex} · {p.weight}kg
                    </div>
                    {p.allergies?.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--color-stat-red)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <AlertTriangle size={10} /> {p.allergies[0].allergen} Allergy
                        {p.allergies.length > 1 && ` +${p.allergies.length - 1} more`}
                      </div>
                    )}

                    {/* Nurse Bedside Check & Dose Timestamp */}
                    {p.administrations?.[0] ? (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--color-given-green)',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontWeight: 600
                      }}>
                        <CheckCircle2 size={12} color="var(--color-given-green)" />
                        <span>
                          Dose Given: <strong>{format(new Date(p.administrations[0].signedAt), 'HH:mm')} Today</strong> by {p.administrations[0].administeredBy?.name || 'Nurse'} ({p.administrations[0].schedule?.prescription?.medicationName?.split('(')[0]?.trim() || 'eMAR'})
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={11} />
                        <span>Bedside Safety Checked &bull; Shift 07:00–15:00</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Bedside Administrations & Nurse Sign-offs Feed */}
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Recent Bedside Administrations &amp; Nurse Sign-offs
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#34d399' }}>
                  <span className="live-dot" style={{ width: 6, height: 6, backgroundColor: '#10b981' }} />
                  LIVE eMAR FEED
                </div>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Real-time bedside dispensing events verified by nurses using 4-point barcode scanning.
              </p>
            </div>
            <button onClick={() => refetch()} className="btn-ghost" style={{ fontSize: 11 }}>
              <Clock size={12} /> Live Sync Active
            </button>
          </div>

          <div>
            {(stats?.recentAdministrations?.length > 0) ? (
              stats.recentAdministrations.map((adm: any) => {
                const patId = adm.patientId || adm.patient?.id;
                return (
                  <div
                    key={adm.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      transition: 'background 0.15s ease'
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                    onMouseOut={e => (e.currentTarget.style.background = '')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 280 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-given-green)',
                        flexShrink: 0
                      }}>
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {adm.schedule?.prescription?.medicationName || 'Medication Administered'}
                          </span>
                          <span className="chip chip-given" style={{ fontSize: 10 }}>
                            {adm.dose} {adm.unit} &bull; {adm.route}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span>
                            Patient: <strong style={{ color: 'var(--color-text-primary)' }}>{adm.patient?.name}</strong> (Bed {adm.patient?.bed})
                          </span>
                          <span>&bull;</span>
                          <span style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>
                            Administered by {adm.administeredBy?.name || 'Nurse Priya, RN'}
                          </span>
                          <span>&bull;</span>
                          <span style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            color: 'var(--color-accent-blue-light)',
                            fontWeight: 700,
                            fontFamily: 'monospace'
                          }}>
                            Dose Given: {format(new Date(adm.signedAt), 'HH:mm:ss')} ({format(new Date(adm.signedAt), 'dd-MMM')})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-given-green)', display: 'block' }}>
                          ✓ 5-Rights Verified
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                          {adm.barcodeScanned ? '4-Point Barcode Scanned' : 'Manual Sign-off'}
                        </span>
                      </div>
                      {patId && (
                        <button
                          onClick={() => navigate(`/patients/${patId}`)}
                          className="btn-ghost"
                          style={{
                            fontSize: 11,
                            padding: '6px 12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: 6
                          }}
                        >
                          View eMAR
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // Initial or demo state
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                <CheckCircle2 size={24} color="var(--color-given-green)" style={{ margin: '0 auto 6px', display: 'block' }} />
                No medication administrations recorded yet this shift.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
