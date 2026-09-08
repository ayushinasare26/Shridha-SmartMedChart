import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Users, FileText, Scan, Shield,
  LogOut, ChevronRight, Bell, Activity, BarChart2,
  Settings, Pill, QrCode
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/api.services';
import { useState } from 'react';
import { HospitalPersonQRModal } from './HospitalPersonQRModal';

const NAV_DOCTOR: Array<{ to: string; label: string; icon: any; badge?: string }> = [
  { to: '/doctor', label: 'Overview & Schedule', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/prescriptions', label: 'CPOE Prescriptions', icon: FileText, badge: 'STAT' },
  { to: '/bedside-scan', label: 'Bedside 4-Pt Scanner', icon: Scan },
  { to: '/safety-audit', label: 'Safety, AI & Audit', icon: Shield },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart2 },
  { to: '/admin', label: 'Admin', icon: Settings },
];

const NAV_NURSE: Array<{ to: string; label: string; icon: any; badge?: string }> = [
  { to: '/nurse', label: 'Overview & Schedule', icon: LayoutDashboard, badge: '42' },
  { to: '/patients', label: 'Patient eMAR', icon: Activity, badge: 'ICU-12' },
  { to: '/bedside-scan', label: 'Bedside 4-Pt Scanner', icon: Scan },
  { to: '/safety-audit', label: 'Safety, AI & Audit', icon: Shield },
];

const NAV_PHARMACIST: Array<{ to: string; label: string; icon: any; badge?: string }> = [
  { to: '/prescriptions', label: 'Prescriptions', icon: Pill, badge: 'STAT' },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/safety-audit', label: 'Safety & Audit', icon: Shield },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
];

const NAV_ADMIN: Array<{ to: string; label: string; icon: any; badge?: string }> = [
  { to: '/admin', label: 'User Management', icon: Settings },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/safety-audit', label: 'Audit Logs', icon: Shield },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    refetchInterval: 30000,
  });

  const unreadCount = (notifications as any[]).filter(n => !n.isRead).length;

  const navItems =
    user?.role === 'DOCTOR' ? NAV_DOCTOR :
    user?.role === 'NURSE' ? NAV_NURSE :
    user?.role === 'PHARMACIST' ? NAV_PHARMACIST :
    NAV_ADMIN;

  const roleInitials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const roleColor = user?.role === 'DOCTOR' ? '#3b82f6' : user?.role === 'NURSE' ? '#10b981' : user?.role === 'PHARMACIST' ? '#8b5cf6' : '#f59e0b';

  const [showStaffQRModal, setShowStaffQRModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0b4da2, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white'
          }}>S</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>SmartMedChart</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Clinical Workstation</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 10, color: 'var(--color-given-green)' }}>Live</span>
          </div>
        </div>

        {/* User card with QR action */}
        <div
          onClick={() => setShowStaffQRModal(true)}
          style={{
            background: 'var(--color-bg-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent-blue)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          title="Click to view Official Hospital Staff QR Credential Badge"
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: roleColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
          }}>{roleInitials}</div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{user?.department || user?.role}</div>
          </div>
          <div
            style={{
              padding: '3px 6px',
              borderRadius: 5,
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--color-accent-blue-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 700
            }}
          >
            <QrCode size={12} />
            <span>QR</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px 0', flex: 1 }}>
        <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Clinical Workspaces
        </div>
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/nurse' || to === '/doctor'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} />
            <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
            {badge === 'STAT' && (
              <span style={{ background: 'var(--color-stat-red)', color: 'white', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase' }}>
                STAT
              </span>
            )}
            {badge && badge !== 'STAT' && (
              <span style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-muted)', fontSize: 10, padding: '1px 6px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Ward Status */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--color-border)', background: '#f8fafc' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Hospital Ward Status</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>LOCATION: </span>
          <span style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>Ward 4B ICU</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>ACTIVE INPATIENTS: </span>
          <span>16 / 18 Beds</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span style={{ color: 'var(--color-given-green)', fontWeight: 600 }}>256-bit HIPAA Sync Active</span>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/notifications')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 7, cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 12, position: 'relative' }}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--color-stat-red)', color: 'white', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 7, cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 12 }}
          >
            <LogOut size={14} />
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--color-text-muted)' }}>
          Online Mode v2.4.1 · Production Node
        </div>
      </div>

      {/* Logged-In Clinician Official QR Badge Modal */}
      {user && (
        <HospitalPersonQRModal
          isOpen={showStaffQRModal}
          onClose={() => setShowStaffQRModal(false)}
          person={{
            type: (user.role as any) || 'STAFF',
            role: user.role,
            name: user.name,
            staffId: user.staffId,
            title: user.title || `${user.role} Clinician`,
            department: user.department || 'Ward 4B ICU',
            specialty: user.specialty || 'General Clinical Care',
            licenseNumber: user.licenseNumber || 'MD-98421-US',
            shiftType: user.shiftType || 'MORNING (07:00–15:00)',
            onDuty: user.onDuty !== false
          }}
        />
      )}
    </aside>
  );
}
