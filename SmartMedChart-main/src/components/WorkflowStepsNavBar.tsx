import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function WorkflowStepsNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const overviewPath = user?.role === 'DOCTOR' ? '/doctor' : '/nurse';

  const isNurse = user?.role === 'NURSE';

  const steps = [
    {
      id: 'dashboard',
      num: 1,
      label: 'Overview Dashboard',
      path: overviewPath,
      isActive: location.pathname === '/nurse' || location.pathname === '/doctor',
    },
    {
      id: 'emar',
      num: 2,
      label: 'Patient eMAR & Schedule',
      path: '/patients',
      isActive: location.pathname.startsWith('/patients'),
    },
    ...(!isNurse ? [{
      id: 'cpoe',
      num: 3,
      label: 'CPOE Prescription Form',
      path: '/prescriptions/new',
      isActive: location.pathname.startsWith('/prescriptions'),
    }] : []),
    {
      id: 'safety',
      num: isNurse ? 3 : 4,
      label: 'Allergy Safety Alert',
      path: '/safety-audit',
      isActive: location.pathname === '/safety-audit',
    },
    {
      id: 'qr',
      num: isNurse ? 4 : 5,
      label: 'QR Code Verification',
      path: '/bedside-scan',
      isActive: location.pathname === '/bedside-scan' || location.pathname.startsWith('/verify'),
    },
  ];

  return (
    <nav className="workflow-steps" aria-label="Clinical Workflow Stepper" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#ffffff' }}>
      {steps.map((step) => {
        const active = step.isActive;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => navigate(step.path)}
            className={`workflow-step ${active ? 'active' : ''}`}
            style={{
              background: active ? '#eff6ff' : 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 18px',
              height: '100%',
              fontSize: 12,
              fontWeight: active ? 700 : 600,
              color: active ? '#1d4ed8' : 'var(--color-text-secondary)',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
            onMouseOver={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseOut={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            <span
              style={{
                background: active ? '#2563eb' : 'var(--color-border-light)',
                color: active ? '#ffffff' : 'var(--color-text-secondary)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {step.num}
            </span>
            <span>{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
