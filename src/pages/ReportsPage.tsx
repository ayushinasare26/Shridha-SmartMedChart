import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/api.services';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart2, Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const { data: compliance = [] } = useQuery({
    queryKey: ['report-compliance'],
    queryFn: () => reportService.compliance(7),
  });

  const { data: adrData = [] } = useQuery({
    queryKey: ['report-adr'],
    queryFn: () => reportService.adr(30),
  });

  const { data: adminStats = [] } = useQuery({
    queryKey: ['report-admin-stats'],
    queryFn: () => reportService.adminStats(7),
  });

  const customTooltipStyle = {
    background: '#141c2e',
    border: '1px solid #1e2d4d',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 12,
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div className="top-bar">
        <div className="top-bar-section">
          <BarChart2 size={14} color="var(--color-accent-blue-light)" />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Reports & Analytics</span>
        </div>
        <div style={{ marginLeft: 'auto', padding: '0 16px' }}>
          <button className="btn-primary" style={{ fontSize: 12 }}><Download size={13} /> Export All Reports</button>
        </div>
      </div>

      <div className="page-content">
        <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Clinical Performance Analytics
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Medication Compliance */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              7-Day Medication Compliance Rate
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={compliance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={customTooltipStyle} />
                <Line type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Compliance %" />
                <Line type="monotone" dataKey="given" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Given" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ADR by Type */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              30-Day ADR Prevention by Alert Type
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                <XAxis dataKey="type" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="total" fill="#3b82f6" name="Total Alerts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical" fill="#ef4444" name="Critical" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {adrData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 12 }}>
                No ADR events in the last 30 days
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Barcode Scan Rate */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Barcode Scan Rate vs. 5-Rights Compliance
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adminStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend />
                <Bar dataKey="barcodeScanRate" fill="#06b6d4" name="Barcode Scan %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Summary Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Avg Compliance Rate', value: compliance.length > 0 ? `${(compliance.reduce((a: any, b: any) => a + b.compliance, 0) / compliance.length).toFixed(1)}%` : '—', color: 'var(--color-given-green)' },
                { label: 'Total Administrations', value: adminStats.reduce((a: any, b: any) => a + b.total, 0), color: 'var(--color-accent-blue-light)' },
                { label: 'Barcode Scanned', value: adminStats.reduce((a: any, b: any) => a + b.barcodeScanned, 0), color: 'var(--color-info-cyan)' },
                { label: 'Total ADR Alerts', value: adrData.reduce((a: any, b: any) => a + b.total, 0), color: 'var(--color-due-amber)' },
                { label: 'Missed Doses (7d)', value: compliance.reduce((a: any, b: any) => a + b.missed, 0), color: 'var(--color-stat-red)' },
                { label: 'Delayed Doses (7d)', value: compliance.reduce((a: any, b: any) => a + b.delayed, 0), color: 'var(--color-held-orange)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
