import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, Eye, EyeOff, Fingerprint, Key, Smartphone,
  AlertTriangle, Loader2, Lock, UserCheck, Briefcase,
  UserPlus, CheckCircle2, Stethoscope, ArrowRight, User,
  Heart, Building2, UserCircle
} from 'lucide-react';

const ADMIN_PRESETS = [
  {
    name: 'Dr. Rohit Verma, MD',
    role: 'Chief Medical Officer / Lead Admin',
    adminId: 'ADM-9001',
    pin: '9999',
    department: 'Executive Medical Leadership',
  },
  {
    name: 'Manashvi Dok, MBA',
    role: 'Director of Hospital Operations',
    adminId: 'ADM-1002',
    pin: '1234',
    department: 'Hospital Administration & HR',
  },
];

const CLINICAL_PRESETS = [
  { name: 'Dr. Sharma, MD', role: 'Attending Intensivist', email: 'sharma.md@metrohealth.org', staffId: 'DOC-84729', color: '#2563eb', initials: 'DS' },
  { name: 'Nurse Priya, RN', role: 'Primary Bedside BSN', email: 'priya.rn@metrohealth.org', staffId: 'RN-88219', color: '#059669', initials: 'NP' },
  { name: 'Pharm. Dave', role: 'Clinical Pharmacist', email: 'dave.pharm@metrohealth.org', staffId: 'PH-31405', color: '#7c3aed', initials: 'PD' },
  { name: 'Admin Elena', role: 'Ward Supervisor', email: 'elena.admin@metrohealth.org', staffId: 'ADM-2001', color: '#d97706', initials: 'AE' },
];

const PATIENT_PRESETS = [
  { name: 'Rahul Patil', mrn: '94021-08', bed: 'Bed ICU-12', diagnosis: 'Septic Shock', pin: '1234', initials: 'RP', color: '#0b4da2' },
  { name: 'Anita Desai', mrn: '94022-15', bed: 'Bed ICU-14', diagnosis: 'Type 2 Diabetes', pin: '1234', initials: 'AD', color: '#0284c7' },
  { name: 'sunita maske', mrn: '94023-08', bed: 'Bed ICU-08', diagnosis: 'Post-op Bowel Resection', pin: '1234', initials: 'GM', color: '#0d9488' },
  { name: 'Margaret Brown', mrn: '94024-03', bed: 'Bed ICU-03', diagnosis: 'COPD Exacerbation', pin: '1234', initials: 'MB', color: '#7c3aed' },
];

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab: 'admin' | 'clinical' | 'patient'
  const [activeTab, setActiveTab] = useState<'admin' | 'clinical' | 'patient'>('admin');

  // Admin form state
  const [selectedAdminIndex, setSelectedAdminIndex] = useState(0);
  const [adminId, setAdminId] = useState('ADM-9001');
  const [adminPin, setAdminPin] = useState('9999');
  const [showAdminPin, setShowAdminPin] = useState(false);

  // Clinical form state
  const [clinicalEmail, setClinicalEmail] = useState('priya.rn@metrohealth.org');
  const [clinicalPassword, setClinicalPassword] = useState('SmartMed@2024');
  const [showClinicalPass, setShowClinicalPass] = useState(false);
  const [selectedMfa, setSelectedMfa] = useState<'biometric' | 'yubikey' | 'otp'>('biometric');

  // Patient form state
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [patientMrn, setPatientMrn] = useState('94021-08');
  const [patientPin, setPatientPin] = useState('1234');
  const [showPatientPin, setShowPatientPin] = useState(false);

  const [error, setError] = useState('');

  const handleAdminSelect = (idx: number) => {
    setSelectedAdminIndex(idx);
    setAdminId(ADMIN_PRESETS[idx].adminId);
    setAdminPin(ADMIN_PRESETS[idx].pin);
  };

  const handleClinicalSelect = (preset: typeof CLINICAL_PRESETS[0]) => {
    setClinicalEmail(preset.email);
    setClinicalPassword('SmartMed@2024');
  };

  const handlePatientSelect = (idx: number) => {
    setSelectedPatientIndex(idx);
    setPatientMrn(PATIENT_PRESETS[idx].mrn);
    setPatientPin(PATIENT_PRESETS[idx].pin);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login({ adminId: adminId.trim(), pin: adminPin.trim() });
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'DOCTOR') {
        navigate('/doctor');
      } else if (user.role === 'NURSE') {
        navigate('/nurse');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      const respMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Admin authentication failed.';
      setError(String(respMsg));
    }
  };

  const handleEnrollShortcut = async () => {
    setError('');
    try {
      await login({ adminId: 'ADM-9001', pin: '9999' });
      navigate('/admin?enroll=true');
    } catch (err: any) {
      setError('Failed to enter enrollment mode.');
    }
  };

  const handleClinicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login({ email: clinicalEmail.trim(), password: clinicalPassword.trim() });
      if (user.role === 'NURSE') navigate('/nurse');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'PHARMACIST') navigate('/prescriptions');
      else navigate('/admin');
    } catch (err: any) {
      const respMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Clinical authentication failed.';
      setError(String(respMsg));
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ mrn: patientMrn.trim(), pin: patientPin.trim(), isPatient: true });
      navigate('/patient-portal');
    } catch (err: any) {
      const respMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Patient authentication failed. Check MRN & Passcode.';
      setError(String(respMsg));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#070f1e',
      backgroundImage: 'radial-gradient(ellipse at 50% 10%, #172847 0%, #070f1e 75%)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
              SmartMedChart
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              Hospital Inpatient, Staff &amp; Patient Administration System
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 9999,
            padding: '5px 14px',
            fontSize: 11,
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.04em'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            SECURE SERVER ACTIVE
          </div>
        </div>
      </header>

      {/* Main Centered Login Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        zIndex: 1
      }}>
        <div style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#ffffff',
          borderRadius: 22,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          padding: '28px 28px 24px',
          color: '#0f172a'
        }}>
          {/* Top 3-Way Segmented Navigation Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            backgroundColor: '#f1f5f9',
            padding: 4,
            borderRadius: 14,
            marginBottom: 24,
            gap: 4
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: activeTab === 'admin' ? '#0b4da2' : 'transparent',
                color: activeTab === 'admin' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'admin' ? '0 2px 8px rgba(11, 77, 162, 0.35)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Shield size={14} />
              <span>1. Admin</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('clinical'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: activeTab === 'clinical' ? '#0b4da2' : 'transparent',
                color: activeTab === 'clinical' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'clinical' ? '0 2px 8px rgba(11, 77, 162, 0.35)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Stethoscope size={14} />
              <span>2. Clinical</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('patient'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: activeTab === 'patient' ? '#0b4da2' : 'transparent',
                color: activeTab === 'patient' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'patient' ? '0 2px 8px rgba(11, 77, 162, 0.35)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <Heart size={14} />
              <span>3. Patients</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: ADMINISTRATOR LOGIN                                */}
          {/* ======================================================== */}
          {activeTab === 'admin' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(145deg, #0b4da2, #0284c7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 18px rgba(11, 77, 162, 0.28)',
                  marginBottom: 12
                }}>
                  <Shield size={26} color="#ffffff" />
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    marginBottom: 6
                  }}>
                    LEVEL 4 ROOT AUTHORITY
                  </span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
                  Administrator Login
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Sign in with your Admin ID to manage &amp; enroll doctors, nurses, pharmacists, and support staff.
                </p>
              </div>

              {/* Preset Selector */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SELECT AUTHORIZED ADMINISTRATOR:
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#0284c7' }}>
                    2 PRESET PROFILES
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ADMIN_PRESETS.map((admin, idx) => {
                    const isSelected = selectedAdminIndex === idx && adminId === admin.adminId;
                    return (
                      <div
                        key={admin.adminId}
                        onClick={() => handleAdminSelect(idx)}
                        style={{
                          border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                          backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                          borderRadius: 10,
                          padding: '8px 10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          {idx === 0 ? <UserCheck size={14} color="#2563eb" /> : <Briefcase size={14} color="#475569" />}
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {admin.name}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                          {admin.adminId} &bull; PIN: {admin.pin}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Form */}
              <form onSubmit={handleAdminSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>
                    Administrator ID / Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="e.g. ADM-9001"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        fontSize: 13,
                        fontWeight: 600,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 9,
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>
                    Admin Security Passcode / PIN
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Lock size={16} />
                    </div>
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="Enter Admin PIN"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 38px',
                        fontSize: 14,
                        letterSpacing: showAdminPin ? '0' : '0.2em',
                        fontWeight: 700,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 9,
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showAdminPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12, marginBottom: 14 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: 10,
                    backgroundColor: '#0a499f',
                    backgroundImage: 'linear-gradient(180deg, #0d5ec4 0%, #0a499f 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(13, 94, 196, 0.35)'
                  }}
                >
                  {isLoading ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /><span>Verifying Authority...</span></>
                  ) : (
                    <><span>Authenticate &amp; Enter Admin Hub</span><ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    HOSPITAL STAFF ENROLLMENT
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                </div>

                <button
                  type="button"
                  onClick={handleEnrollShortcut}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: '#ffffff',
                    border: '1.5px dashed #93c5fd',
                    color: '#0369a1',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <UserPlus size={15} />
                  <span>Enroll New Doctor, Nurse, or Staff</span>
                </button>
              </div>

              <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span>256-bit TLS Encrypted &bull; HIPAA &amp; NHS Digital Compliant</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CLINICAL STAFF LOGIN                              */}
          {/* ======================================================== */}
          {activeTab === 'clinical' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(145deg, #059669, #10b981)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)',
                  marginBottom: 10
                }}>
                  <Stethoscope size={24} color="#ffffff" />
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    marginBottom: 6
                  }}>
                    BEDSIDE eMAR &amp; CPOE
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0 4px', letterSpacing: '-0.02em' }}>
                  Clinical Staff Sign In
                </h2>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                  Metropolitan General Hospital &bull; Ward 4B ICU &bull; Shift 07:00–15:00
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    QUICK CLINICIAN SIMULATION:
                  </span>
                  <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600 }}>Auto-fills Form</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {CLINICAL_PRESETS.map((p) => {
                    const isSelected = clinicalEmail === p.email;
                    return (
                      <button
                        key={p.email}
                        type="button"
                        onClick={() => handleClinicalSelect(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 9px',
                          borderRadius: 9,
                          border: `1.5px solid ${isSelected ? p.color : '#e2e8f0'}`,
                          backgroundColor: isSelected ? `${p.color}10` : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          backgroundColor: p.color,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {p.initials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>{p.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleClinicalSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Clinician Staff ID / Hospital SSO Email
                  </label>
                  <input
                    type="email"
                    value={clinicalEmail}
                    onChange={(e) => setClinicalEmail(e.target.value)}
                    placeholder="e.g. priya.rn@metrohealth.org"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: 13,
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                      Clinical Passphrase / PIN
                    </label>
                    <span style={{ fontSize: 10, color: '#2563eb', cursor: 'pointer' }}>Reset PIN?</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showClinicalPass ? 'text' : 'password'}
                      value={clinicalPassword}
                      onChange={(e) => setClinicalPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 12px',
                        fontSize: 13,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowClinicalPass(!showClinicalPass)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showClinicalPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    SECONDARY VERIFICATION (MANDATORY FOR CPOE)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[
                      { key: 'biometric', label: 'Biometric Touch', sub: 'COW-08 Sensor', icon: Fingerprint },
                      { key: 'yubikey', label: 'YubiKey FIDO', sub: 'Slot 1 Ready', icon: Key },
                      { key: 'otp', label: 'Hospital Pager', sub: 'Push Alert', icon: Smartphone },
                    ].map(({ key, label, sub, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedMfa(key as any)}
                        style={{
                          padding: '8px 6px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'center',
                          backgroundColor: selectedMfa === key ? '#eff6ff' : '#f8fafc',
                          border: `1.5px solid ${selectedMfa === key ? '#2563eb' : '#e2e8f0'}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={16} color={selectedMfa === key ? '#2563eb' : '#64748b'} style={{ margin: '0 auto 2px' }} />
                        <div style={{ fontSize: 10, fontWeight: 700, color: selectedMfa === key ? '#1d4ed8' : '#334155' }}>{label}</div>
                        <div style={{ fontSize: 8, color: '#94a3b8' }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12, marginBottom: 12 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 9,
                    backgroundColor: '#16a34a',
                    backgroundImage: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  {isLoading ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /><span>Authenticating Clinical Session...</span></>
                  ) : (
                    <><Shield size={16} /><span>Authenticate &amp; Open Clinical Chart</span></>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PATIENT PORTAL LOGIN                              */}
          {/* ======================================================== */}
          {activeTab === 'patient' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(145deg, #0b4da2, #0284c7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 18px rgba(11, 77, 162, 0.25)',
                  marginBottom: 10
                }}>
                  <Heart size={24} color="#ffffff" />
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    marginBottom: 6
                  }}>
                    INPATIENT MYCHART ACCESS
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0 4px', letterSpacing: '-0.02em' }}>
                  Patient &amp; Family Sign In
                </h2>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                  Enter your MRN to review medications, doses given by nurses, and safety precautions.
                </p>
              </div>

              {/* Quick Patient Selection */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SELECT ADMITTED INPATIENT (DEMO):
                  </span>
                  <span style={{ fontSize: 10, color: '#0b4da2', fontWeight: 700 }}>4 Active Patients</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {PATIENT_PRESETS.map((p, idx) => {
                    const isSelected = selectedPatientIndex === idx && patientMrn === p.mrn;
                    return (
                      <button
                        key={p.mrn}
                        type="button"
                        onClick={() => handlePatientSelect(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 9px',
                          borderRadius: 9,
                          border: `1.5px solid ${isSelected ? p.color : '#e2e8f0'}`,
                          backgroundColor: isSelected ? `${p.color}10` : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          backgroundColor: p.color,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {p.initials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>
                            {p.mrn} &bull; {p.bed}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Form */}
              <form onSubmit={handlePatientSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Medical Record Number (MRN)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <UserCircle size={16} />
                    </div>
                    <input
                      type="text"
                      value={patientMrn}
                      onChange={(e) => setPatientMrn(e.target.value)}
                      placeholder="e.g. 94021-08"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                      Bed Passcode / PIN (Default: 1234)
                    </label>
                    <span style={{ fontSize: 10, color: '#0b4da2', cursor: 'pointer' }} onClick={() => setPatientPin('1234')}>Use 1234</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPatientPin ? 'text' : 'password'}
                      value={patientPin}
                      onChange={(e) => setPatientPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 36px',
                        fontSize: 13,
                        letterSpacing: showPatientPin ? '0' : '0.2em',
                        fontWeight: 700,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPatientPin(!showPatientPin)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showPatientPin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12, marginBottom: 12 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 9,
                    backgroundColor: '#0b4da2',
                    backgroundImage: 'linear-gradient(180deg, #0d5ec4 0%, #0a499f 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(11, 77, 162, 0.3)'
                  }}
                >
                  {isLoading ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /><span>Opening MyChart Session...</span></>
                  ) : (
                    <><Heart size={16} /><span>Access My Medical Chart</span></>
                  )}
                </button>
              </form>

              <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={12} color="#16a34a" /> Protected by Hospital Patient Privacy &amp; HIPAA eMAR Gateway
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Page Footer */}
      <footer style={{
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
        <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>
          Administrator Support
        </span>
        <span>&bull;</span>
        <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>
          Clinical Security Policy
        </span>
        <span>&bull;</span>
        <span style={{ cursor: 'pointer', transition: 'color 0.15s' }}>
          Patient Rights &amp; Privacy Notice
        </span>
      </footer>
    </div>
  );
}
