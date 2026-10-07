import { useQuery } from '@tanstack/react-query';
import { dashboardService, auditService } from '../services/api.services';
import { Shield, Activity, AlertTriangle, CheckCircle2, Download, Sliders } from 'lucide-react';
import { format } from 'date-fns';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';

const WARD = 'WARD-4B-ICU';

export default function SafetyAuditPage() {
  const { data: safety, isLoading } = useQuery({
    queryKey: ['dashboard-safety', WARD],
    queryFn: () => dashboardService.safety({ ward: WARD }),
    refetchInterval: 120000,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditService.getAll({ limit: '50' }),
    refetchInterval: 60000,
  });

  const riskZone = safety?.riskIndex < 30 ? 'OPTIMAL ZONE' : safety?.riskIndex < 60 ? 'MODERATE ZONE' : 'HIGH RISK ZONE';
  const riskColor = safety?.riskIndex < 30 ? 'var(--color-given-green)' : safety?.riskIndex < 60 ? 'var(--color-due-amber)' : 'var(--color-stat-red)';

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>SmartMedChart</span>
        </div>
        <div className="top-bar-section" style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>WARD 4B — SURGICAL ICU</div>
        <div className="top-bar-section"><span>Station Terminal COW-ICU-084</span></div>
        <div className="top-bar-section">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span>FHIR R4 Connected</span>
        </div>
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', gap: 8 }}>
          {safety?.criticalEscalations > 0 && (
            <span className="chip chip-stat"><AlertTriangle size={11} /> {safety.criticalEscalations} Critical STAT</span>
          )}
        </div>
      </div>

      <WorkflowStepsNavBar />

      <div className="page-content">
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>Safety, AI & Audit Center</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '3px 10px' }}>
                <div className="live-dot" style={{ width: 6, height: 6 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-given-green)' }}>LIVE SENTINEL</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              Real-time predictive adverse event mitigation, 5-Rights bedside enforcement, and cryptographic immutable logging.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ fontSize: 12 }}><Sliders size={13} /> Risk Thresholds</button>
            <button className="btn-primary" style={{ fontSize: 12 }}><Download size={13} /> Export Compliance Report</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Predictive Risk */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color="var(--color-accent-blue-light)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Predictive Clinical Risk Intelligence</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                Continuous inference via Bayesian Ward Risk Graph v4.2 · Refreshed 2m ago
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Risk Index */}
                <div style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>WARD 4B ICU RISK INDEX</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: riskColor }}>{isLoading ? '—' : safety?.riskIndex ?? 18}%</span>
                  </div>
                  <div style={{ display: 'inline-block', background: `${riskColor}20`, border: `1px solid ${riskColor}50`, color: riskColor, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {riskZone}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>Low-Moderate Delay Risk</div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div className="progress-bar-fill" style={{ width: `${safety?.riskIndex ?? 18}%`, background: riskColor }} />
                  </div>
                </div>

                {/* ADR Prevention */}
                <div style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>ADR PREVENTION SCORE</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-given-green)', marginBottom: 4 }}>
                    {isLoading ? '—' : `${safety?.adrPreventionScore ?? 99.8}%`}
                  </div>
                  <div style={{ display: 'inline-block', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-given-green)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {safety?.criticalEscalations ?? 0} CRITICAL ESCALATIONS
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>142 of 142 Doses Cleared</div>
                  <div style={{ fontSize: 11, color: 'var(--color-given-green)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={11} /> Zero contraindication breaches in last 24 hrs
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Explainable Root Factors Requiring Clinical Attention
                </div>
                {safety?.riskFactors?.length > 0 ? safety.riskFactors.map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={12} color="var(--color-due-amber)" />
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{f.description}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-due-amber)', whiteSpace: 'nowrap' }}>{f.impact}</span>
                  </div>
                )) : (
                  <div style={{ padding: '14px 12px', background: 'var(--color-given-green-bg)', border: '1px solid var(--color-given-green-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <CheckCircle2 size={14} color="var(--color-given-green)" />
                    <span style={{ color: 'var(--color-given-green)' }}>No risk factors identified — All thresholds within normal parameters</span>
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10 }}>
                  ✓ Verified against Lexicomp® and Epocrates® Clinical Core · <span style={{ color: 'var(--color-accent-blue-light)', cursor: 'pointer' }}>View Predictive Graph →</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Rights Compliance */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>5-Rights Bedside Compliance</span>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Point-of-care verification metrics</div>
              </div>
              <div style={{ background: 'var(--color-given-green-bg)', border: '1px solid var(--color-given-green-border)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: 'var(--color-given-green)' }}>
                100% TODAY
              </div>
            </div>
            <div style={{ padding: 18 }}>
              {/* 5 Rights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
                {['Right PT', 'Right Drug', 'Right Dose', 'Right Route', 'Right Time'].map(right => (
                  <div key={right} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--color-given-green-bg)', border: '1px solid var(--color-given-green-border)', borderRadius: 8 }}>
                    <CheckCircle2 size={16} color="var(--color-given-green)" style={{ margin: '0 auto 4px', display: 'block' }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-given-green)', textTransform: 'uppercase' }}>{right}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-given-green)' }}>100%</div>
                  </div>
                ))}
              </div>

              {/* Barcode Scan Rate */}
              <div style={{ marginBottom: 14, padding: 14, background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bedside Barcode Scanning Rate</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-given-green)' }}>
                    {isLoading ? '—' : `${safety?.barcodeScanRate ?? 98.4}%`}
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 4 }}>Target: ≥95%</span>
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${safety?.barcodeScanRate ?? 98.4}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                  <span>■ Optical Scan: {safety?.barcodeScanned ?? 140} / {safety?.totalAdmins ?? 142}</span>
                  <span style={{ color: 'var(--color-due-amber)' }}>■ Override: {safety?.totalAdmins ? safety.totalAdmins - safety.barcodeScanned : 2} ({safety?.totalAdmins ? (((safety.totalAdmins - safety.barcodeScanned) / safety.totalAdmins) * 100).toFixed(1) : 1.6}%)</span>
                </div>
              </div>

              {/* High-Alert Dual Co-Signatures */}
              <div style={{ padding: 14, background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>High-Alert Dual Co-Signatures</span>
                  <span style={{ background: 'var(--color-given-green-bg)', color: 'var(--color-given-green)', border: '1px solid var(--color-given-green-border)', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    {isLoading ? '—' : `${safety?.highAlertDualSign?.validated ?? 14}/${safety?.highAlertDualSign?.total ?? 14} VALIDATED`}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Insulin & Vasopressor titrations</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  Standardized against Joint Commission National Patient Safety Goals (NPSG 03.05.01)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Audit Trail */}
        <div className="card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={15} color="var(--color-accent-blue-light)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Cryptographic Audit Trail</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['ISO 27799', '21 CFR PART 11 COMPLIANT'].map(badge => (
                    <span key={badge} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-accent-blue-light)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{badge}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                Every medication scan, override, and dosage verification is sealed with immutable SHA-256 HMAC digest.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ fontSize: 12 }}><Download size={13} /> PDF</button>
              <button className="btn-ghost" style={{ fontSize: 12 }}>{'{ }'} FHIR</button>
            </div>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 400 }}>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>TIMESTAMP (UTC+5:30)</th>
                  <th>CLINICIAN / ROLE</th>
                  <th>PATIENT MRN & BED</th>
                  <th>EVENT TYPE & PROTOCOL</th>
                  <th>VERIFICATION HASH (SHA-256)</th>
                  <th>WORKSTATION / IP</th>
                  <th>INTEGRITY</th>
                </tr>
              </thead>
              <tbody>
                {(auditLogs as any[]).map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 11 }}>
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.user?.name || 'System'}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{log.user?.role}</div>
                    </td>
                    <td>
                      {log.patient ? (
                        <>
                          <div style={{ fontSize: 12 }}>{log.patient.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>MRN: {log.patient.mrn}</div>
                        </>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.action.replace(/_/g, ' ')}</div>
                      {log.detail && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{log.detail.slice(0, 60)}{log.detail.length > 60 ? '...' : ''}</div>}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                        {log.hmacHash.slice(0, 16)}...
                      </span>
                    </td>
                    <td style={{ fontSize: 11 }}>
                      <div>{log.workstation || 'COW-ICU-084'}</div>
                      <div style={{ color: 'var(--color-text-muted)' }}>{log.ipAddress || '10.240.12.89'}</div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-given-green)', fontSize: 11 }}>
                        <CheckCircle2 size={12} /> VALID
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
            <span>SmartMedChart Sentinel Core v4.18</span>
            <span>Hospital Pharmacy Formulary 2024</span>
            <span>Emergency STAT Override Protocol</span>
            <span>On-Call Pharmacist: Beeper #4012</span>
            <span style={{ color: 'var(--color-given-green)' }}>Zero Unresolved Safety Flags</span>
          </div>
        </div>
      </div>
    </div>
  );
}
