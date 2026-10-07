import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, Eye, EyeOff, Fingerprint, Key, Smartphone,
  AlertTriangle, Loader2, Lock, UserCheck, Briefcase,
  UserPlus, CheckCircle2, Stethoscope, ArrowRight, User,
  Heart, Building2, UserCircle, QrCode
} from 'lucide-react';

const ADMIN_PRESETS = [
  {
    name: 'Dr. Evelyn Vance, MD',
    role: 'Chief Medical Officer / Lead Admin',
    adminId: 'ADM-9001',
    pin: '9999',
    department: 'Executive Medical Leadership',
  },
  {
    name: 'Arthur Hastings, MBA',
    role: 'Director of Hospital Operations',
    adminId: 'ADM-1002',
    pin: '1234',
    department: 'Hospital Administration & HR',
  },
];

const CLINICAL_PRESETS = [
  { name: 'Dr. Sharma, MD', role: 'Attending Intensivist', email: 'sharma.md@metrohealth.org', staffId: 'DOC-84729', initials: 'DS' },
  { name: 'Nurse Priya, RN', role: 'Primary Bedside BSN', email: 'priya.rn@metrohealth.org', staffId: 'RN-88219', initials: 'NP' },
  { name: 'Pharm. Dave', role: 'Clinical Pharmacist', email: 'dave.pharm@metrohealth.org', staffId: 'PH-31405', initials: 'PD' },
  { name: 'Admin Elena', role: 'Ward Supervisor', email: 'elena.admin@metrohealth.org', staffId: 'ADM-2001', initials: 'AE' },
];

const PATIENT_PRESETS = [
  { name: 'Rahul Patil', mrn: '94021-08', bed: 'Bed ICU-12', diagnosis: 'Septic Shock', pin: '1234', initials: 'RP' },
  { name: 'Anita Desai', mrn: '94022-15', bed: 'Bed ICU-14', diagnosis: 'Type 2 Diabetes', pin: '1234', initials: 'AD' },
  { name: 'Rajesh Sharma', mrn: '94023-08', bed: 'Bed ICU-08', diagnosis: 'Post-op Bowel Resection', pin: '1234', initials: 'RS' },
  { name: 'Meera Iyer', mrn: '94024-03', bed: 'Bed ICU-03', diagnosis: 'COPD Exacerbation', pin: '1234', initials: 'MI' },
];

const STAFF_PRESETS = [
  {
    name: 'Arjun Mehta, MLS',
    badgeId: 'LT-44201',
    roleLabel: 'LAB & BLOOD BANK',
    initials: 'AM',
    department: 'Central Pathology & Blood Bank',
    pin: '1234',
  },
  {
    name: 'Pooja Sharma, RT(R)',
    badgeId: 'RT-55102',
    roleLabel: 'IMAGING & RADIOLOGY',
    initials: 'PS',
    department: 'Diagnostic Radiology & CT Imaging',
    pin: '1234',
  },
  {
    name: 'Nurse Suresh Verma, RN',
    badgeId: 'CN-40192',
    roleLabel: 'CARE COORDINATOR',
    initials: 'SV',
    department: 'Ward Resource Management & Care Coordination',
    pin: '1234',
  },
  {
    name: 'Nurse Kavita Nair, RN',
    badgeId: 'RN-55219',
    roleLabel: 'CHARGE & SAFETY',
    initials: 'KN',
    department: 'Acute Inpatient Care & Medication Safety',
    pin: '1234',
  },
];

export default function LoginPage() {
  const { login, loginAsReceptionist, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab: 'admin' | 'clinical' | 'patient' | 'receptionist' | 'staff'
  const [activeTab, setActiveTab] = useState<'admin' | 'clinical' | 'patient' | 'receptionist' | 'staff'>('admin');

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

  // Hospital Staff form state
  const [selectedStaffIndex, setSelectedStaffIndex] = useState(0);
  const [staffBadgeId, setStaffBadgeId] = useState('LT-44201');
  const [staffPin, setStaffPin] = useState('1234');
  const [showStaffPin, setShowStaffPin] = useState(false);

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

  const handleStaffSelect = (idx: number) => {
    setSelectedStaffIndex(idx);
    setStaffBadgeId(STAFF_PRESETS[idx].badgeId);
    setStaffPin(STAFF_PRESETS[idx].pin);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ staffId: staffBadgeId.trim(), pin: staffPin.trim() });
      navigate('/staff');
    } catch (err: any) {
      const respMsg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Hospital Staff authentication failed.';
      setError(String(respMsg));
    }
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

  const handleReceptionistLogin = async () => {
    setError('');
    try {
      await loginAsReceptionist();
    } catch (err) {
      console.error('Receptionist login error:', err);
    }
    navigate('/receptionist');
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. TOP HEADER (Light Clean Clinical Bar) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0b4da2] flex items-center justify-center text-white shadow-xs">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-base font-black text-slate-900 tracking-tight leading-none">
              SmartMedChart
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              Hospital Inpatient, Staff &amp; Patient Administration System
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReceptionistLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#0b4da2] border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Building2 size={13} />
            <span>Receptionist Desk</span>
          </button>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SECURE SERVER ACTIVE</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 transition-all">
          
          {/* Top 5-Way Segmented Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                activeTab === 'admin'
                  ? 'bg-[#0b4da2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Shield size={13} className="shrink-0" />
              <span>1. Admin</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('clinical'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                activeTab === 'clinical'
                  ? 'bg-[#0b4da2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Stethoscope size={13} className="shrink-0" />
              <span>2. Clinical</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('patient'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                activeTab === 'patient'
                  ? 'bg-[#0b4da2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Heart size={13} className="shrink-0" />
              <span>3. Patients</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('receptionist'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                activeTab === 'receptionist'
                  ? 'bg-[#0b4da2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 size={13} className="shrink-0" />
              <span>4. Reception</span>
            </button>

            <button
              id="tab-hospital-staff-btn"
              type="button"
              onClick={() => { setActiveTab('staff'); setError(''); }}
              className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                activeTab === 'staff'
                  ? 'bg-[#0b4da2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCircle size={13} className="shrink-0" />
              <span>5. Staff</span>
            </button>
          </div>

          {/* TAB 1: ADMINISTRATOR LOGIN */}
          {activeTab === 'admin' && (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b4da2] mx-auto mb-2.5 shadow-2xs">
                  <Shield size={24} />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0b4da2] border border-blue-200 mb-1.5">
                  Level 4 Root Authority
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Administrator Login
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sign in with your Admin ID to manage &amp; enroll doctors, nurses, pharmacists, and support staff.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Select Authorized Administrator:
                  </span>
                  <span className="text-[10px] font-bold text-[#0b4da2]">
                    2 Preset Profiles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ADMIN_PRESETS.map((admin, idx) => {
                    const isSelected = selectedAdminIndex === idx && adminId === admin.adminId;
                    return (
                      <div
                        key={admin.adminId}
                        onClick={() => handleAdminSelect(idx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0b4da2] bg-blue-50/50 shadow-2xs ring-1 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <UserCheck size={14} className={isSelected ? 'text-[#0b4da2]' : 'text-slate-400'} />
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {admin.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {admin.adminId} &bull; PIN: {admin.pin}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin ID / Badge ID</label>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    required
                    placeholder="e.g. ADM-9001"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 font-mono outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Security PIN / Master Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      required
                      placeholder="e.g. 9999"
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 pr-9 font-mono outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showAdminPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0b4da2] hover:bg-[#093f85] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Verifying Admin Credentials...</span></>
                  ) : (
                    <><Lock size={15} /><span>Sign In to Admin Console</span><ArrowRight size={15} /></>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={handleEnrollShortcut}
                    className="text-[#0b4da2] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>Direct: Enroll New Staff</span>
                  </button>
                  <span>Production Node &bull; HIPAA Certified</span>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CLINICAL WORKSTATION LOGIN */}
          {activeTab === 'clinical' && (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b4da2] mx-auto mb-2.5 shadow-2xs">
                  <Stethoscope size={24} />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0b4da2] border border-blue-200 mb-1.5">
                  Clinical Care Staff
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Clinical Workstation
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Doctor CPOE, Nurse eMAR, Pharmacist Verification, and Clinical Alerts.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Quick Clinical Presets:
                  </span>
                  <span className="text-[10px] font-bold text-[#0b4da2]">
                    4 Clinicians
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CLINICAL_PRESETS.map((p) => {
                    const isSelected = clinicalEmail === p.email;
                    return (
                      <div
                        key={p.email}
                        onClick={() => handleClinicalSelect(p)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0b4da2] bg-blue-50/50 shadow-2xs ring-1 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-[#0b4da2] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {p.initials}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {p.role}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleClinicalSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff Hospital Email</label>
                  <input
                    type="email"
                    value={clinicalEmail}
                    onChange={(e) => setClinicalEmail(e.target.value)}
                    required
                    placeholder="name@metrohealth.org"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showClinicalPass ? 'text' : 'password'}
                      value={clinicalPassword}
                      onChange={(e) => setClinicalPassword(e.target.value)}
                      required
                      placeholder="Enter password"
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 pr-9 outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClinicalPass(!showClinicalPass)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showClinicalPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* MFA Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hospital 2FA Verification</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'biometric', label: 'Biometrics', icon: Fingerprint },
                      { id: 'yubikey', label: 'Hardware Key', icon: Key },
                      { id: 'otp', label: 'Push OTP', icon: Smartphone },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedMfa(id as any)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selectedMfa === id
                            ? 'bg-blue-50 text-[#0b4da2] border-blue-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={13} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0b4da2] hover:bg-[#093f85] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Authenticating Clinician...</span></>
                  ) : (
                    <><Stethoscope size={15} /><span>Sign In to Clinical Workstation</span><ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PATIENT & CAREGIVER PORTAL */}
          {activeTab === 'patient' && (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b4da2] mx-auto mb-2.5 shadow-2xs">
                  <Heart size={24} />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0b4da2] border border-blue-200 mb-1.5">
                  Inpatient &amp; Family Access
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Patient &amp; Family Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Real-time live bed medication schedule, vitals, allergy records, and doctor notes.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Admitted Inpatients:
                  </span>
                  <span className="text-[10px] font-bold text-[#0b4da2]">
                    4 Active Charts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {PATIENT_PRESETS.map((p, idx) => {
                    const isSelected = selectedPatientIndex === idx && patientMrn === p.mrn;
                    return (
                      <div
                        key={p.mrn}
                        onClick={() => handlePatientSelect(idx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0b4da2] bg-blue-50/50 shadow-2xs ring-1 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-[#0b4da2] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {p.initials}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.mrn} &bull; {p.bed}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handlePatientSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Record Number (MRN)</label>
                  <input
                    type="text"
                    value={patientMrn}
                    onChange={(e) => setPatientMrn(e.target.value)}
                    required
                    placeholder="e.g. 94021-08"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 font-mono outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Security PIN / Passcode</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPatientPin ? 'text' : 'password'}
                      value={patientPin}
                      onChange={(e) => setPatientPin(e.target.value)}
                      required
                      placeholder="e.g. 1234"
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 pr-9 font-mono outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPatientPin(!showPatientPin)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPatientPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0b4da2] hover:bg-[#093f85] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Opening Inpatient Portal...</span></>
                  ) : (
                    <><Heart size={15} /><span>Open My Inpatient Chart</span><ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: RECEPTIONIST DESK */}
          {activeTab === 'receptionist' && (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b4da2] mx-auto mb-2.5 shadow-2xs">
                  <Building2 size={24} />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0b4da2] border border-blue-200 mb-1.5">
                  Admissions &amp; Front Desk
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Reception Desk Console
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Patient Intake, Ward Bed Allotments, Doctor Queue Management &amp; Digital Wristbands.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 mb-5 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <CheckCircle2 size={15} className="text-[#0b4da2]" />
                  <span>Full Admissions &amp; Shift Management Capabilities:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>OPD &amp; Inpatient fast token registration</li>
                  <li>Live ICU &amp; Ward Bed census matrix</li>
                  <li>Assistant doctor shift roster &amp; queue allocations</li>
                  <li>Instant QR pass generation &amp; wristband scanning</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleReceptionistLogin}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0b4da2] hover:bg-[#093f85] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 size={16} />
                <span>Launch Receptionist Desk Portal</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* TAB 5: HOSPITAL ALLIED STAFF PORTAL */}
          {activeTab === 'staff' && (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0b4da2] mx-auto mb-2.5 shadow-2xs">
                  <UserCircle size={24} />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#0b4da2] border border-blue-200 mb-1.5">
                  Allied Health &amp; Operations
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Hospital Staff Portal
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Pathology, Radiology, Care Coordination &amp; Inpatient QR Wristband Scanner.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Select Staff Profile:
                  </span>
                  <span className="text-[10px] font-bold text-[#0b4da2]">
                    4 Presets
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {STAFF_PRESETS.map((staff, idx) => {
                    const isSelected = selectedStaffIndex === idx && staffBadgeId === staff.badgeId;
                    return (
                      <div
                        key={staff.badgeId}
                        onClick={() => handleStaffSelect(idx)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0b4da2] bg-blue-50/50 shadow-2xs ring-1 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-[#0b4da2] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {staff.initials}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {staff.name}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-[#0b4da2] truncate">
                          {staff.roleLabel}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {staff.badgeId} &bull; PIN: {staff.pin}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff Digital Badge ID</label>
                  <input
                    type="text"
                    value={staffBadgeId}
                    onChange={(e) => setStaffBadgeId(e.target.value)}
                    required
                    placeholder="e.g. LT-44201"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 font-mono outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department PIN Passcode</label>
                  <div className="relative flex items-center">
                    <input
                      type={showStaffPin ? 'text' : 'password'}
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value)}
                      required
                      placeholder="e.g. 1234"
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-lg px-3 py-2 pr-9 font-mono outline-none focus:border-[#0b4da2] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPin(!showStaffPin)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showStaffPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="authenticate-staff-portal-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0b4da2] hover:bg-[#093f85] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Authenticating Staff...</span></>
                  ) : (
                    <><Building2 size={15} /><span>Authenticate &amp; Enter Staff Portal</span><ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-200/80 flex items-center justify-center gap-4 flex-wrap">
        <span className="hover:text-slate-800 transition-colors cursor-pointer">Administrator Support</span>
        <span>&bull;</span>
        <span className="hover:text-slate-800 transition-colors cursor-pointer">Clinical Security Policy</span>
        <span>&bull;</span>
        <span className="hover:text-slate-800 transition-colors cursor-pointer">Patient Rights &amp; Privacy Notice</span>
      </footer>
    </div>
  );
}
