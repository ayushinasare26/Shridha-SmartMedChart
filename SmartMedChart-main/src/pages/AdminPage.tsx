import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jsQR from 'jsqr';
import { userService, patientService } from '../services/api.services';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, UserCheck, Stethoscope, Briefcase, Plus, Search,
  LogIn, User, Award, CheckCircle2, XCircle, Clock,
  ExternalLink, LogOut, Check, X, AlertCircle, RefreshCw,
  QrCode, UserPlus, FileText, ChevronRight, Activity, Building2,
  SlidersHorizontal, HeartPulse, Pill, FlaskConical, Eye,
  Heart, Bed, AlertTriangle, Users, Camera, CameraOff, Scan
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'ADMIN' | 'OTHER_STAFF' | 'ALLIED_STAFF';
  staffId: string;
  ward?: string;
  department?: string;
  title?: string;
  specialty?: string;
  licenseNumber?: string;
  shiftType?: string;
  onDuty?: boolean;
  avatarUrl?: string;
  isActive?: boolean;
}

export default function AdminPage() {
  const { user: currentUser, logout, impersonate } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Active Main Directory View: 'STAFF' | 'PATIENTS'
  const [directoryView, setDirectoryView] = useState<'STAFF' | 'PATIENTS'>('STAFF');

  // Staff Filters & Search
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'OTHER_STAFF' | 'ADMIN'>('ALL');

  // Patient Filters & Search
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState<'ALL' | 'STAT' | 'ISOLATION' | 'NPO'>('ALL');

  // Modals
  const [showEnrollStaffModal, setShowEnrollStaffModal] = useState(false);
  const [showAdmitPatientModal, setShowAdmitPatientModal] = useState(false);
  const [badgeModalUser, setBadgeModalUser] = useState<StaffUser | null>(null);
  const [wristbandModalPatient, setWristbandModalPatient] = useState<any | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [manualScanInput, setManualScanInput] = useState('');
  const [shortInfoRecord, setShortInfoRecord] = useState<{ type: 'STAFF' | 'PATIENT'; data: any } | null>(null);

  // Fetch all staff users
  const { data: staffList = [], isLoading: isStaffLoading } = useQuery<StaffUser[]>({
    queryKey: ['all-staff-users'],
    queryFn: () => userService.getAll(),
  });

  // Fetch all patients
  const { data: patientsList = [], isLoading: isPatientsLoading } = useQuery<any[]>({
    queryKey: ['all-inpatients-admin'],
    queryFn: () => patientService.getAll(),
  });

  // Form State for Staff Enrollment
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    email: '',
    role: 'DOCTOR',
    staffId: '',
    department: 'Cardiology & Intensive Care',
    ward: 'Ward 4B ICU',
    title: 'Consultant Specialist',
    specialty: 'Cardiovascular Medicine',
    licenseNumber: 'MD-77821-US',
    shiftType: 'MORNING',
    onDuty: true,
    pin: '1234',
    password: 'SmartMed@2024'
  });

  // Form State for Admitting Patient
  const [admitForm, setAdmitForm] = useState({
    name: '',
    mrn: `940${Math.floor(20 + Math.random() * 80)}-${Math.floor(10 + Math.random() * 90)}`,
    dob: '1979-03-14',
    sex: 'Male',
    weight: 72,
    bed: 'Bed ICU-15',
    admissionDiagnosis: 'Acute Inpatient Observation',
    codeStatus: 'Full',
    npoStatus: false,
    isolationStatus: false,
    allergy: 'No Known Drug Allergies (NKDA)'
  });

  const resetEnrollForm = (presetRole = 'DOCTOR') => {
    const isDoc = presetRole === 'DOCTOR';
    const isNurse = presetRole === 'NURSE';
    const isPharm = presetRole === 'PHARMACIST';
    const isAllied = presetRole === 'OTHER_STAFF' || presetRole === 'ALLIED_STAFF';

    setEnrollForm({
      name: '',
      email: '',
      role: presetRole,
      staffId: isDoc ? `DOC-${Math.floor(10000 + Math.random() * 90000)}` :
               isNurse ? `RN-${Math.floor(10000 + Math.random() * 90000)}` :
               isPharm ? `PH-${Math.floor(10000 + Math.random() * 90000)}` :
               isAllied ? `LT-${Math.floor(10000 + Math.random() * 90000)}` :
               `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      department: isDoc ? 'Cardiology & General Medicine' :
                  isNurse ? 'Ward 4B (Acute Inpatient)' :
                  isPharm ? 'Clinical Pharmacy Services' :
                  isAllied ? 'Central Pathology & Blood Bank' : 'Hospital Operations Bureau',
      ward: 'Ward 4B ICU',
      title: isDoc ? 'Consultant Physician' :
             isNurse ? 'Staff Registered Nurse' :
             isPharm ? 'Clinical Pharmacist' :
             isAllied ? 'Senior Biomedical Technologist' : 'Administrator',
      specialty: isDoc ? 'Internal Medicine & Geriatrics' :
                 isNurse ? 'Inpatient Acute Care & eMAR' :
                 isPharm ? 'Pharmacotherapy & Medication Safety' :
                 isAllied ? 'Hematology & Diagnostics' : 'Clinical Logistics',
      licenseNumber: isDoc ? `MD-${Math.floor(10000 + Math.random() * 90000)}-CA` :
                     isNurse ? `RN-${Math.floor(10000 + Math.random() * 90000)}-UK` :
                     isPharm ? `RPH-${Math.floor(10000 + Math.random() * 90000)}-GB` :
                     isAllied ? `MLS-${Math.floor(10000 + Math.random() * 90000)}-ASCP` : `HOSP-ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      shiftType: 'MORNING',
      onDuty: true,
      pin: '1234',
      password: 'SmartMed@2024'
    });
  };

  const handleOpenEnrollModal = (presetRole = 'DOCTOR') => {
    resetEnrollForm(presetRole);
    setShowEnrollStaffModal(true);
  };

  // Staff Enrollment Mutation
  const enrollMutation = useMutation({
    mutationFn: (data: any) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-staff-users'] });
      setShowEnrollStaffModal(false);
      resetEnrollForm();
    }
  });

  // Patient Admission Mutation
  const admitMutation = useMutation({
    mutationFn: (data: any) => patientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-inpatients-admin'] });
      setShowAdmitPatientModal(false);
      setAdmitForm({
        name: '',
        mrn: `940${Math.floor(20 + Math.random() * 80)}-${Math.floor(10 + Math.random() * 90)}`,
        dob: '1979-03-14',
        sex: 'Male',
        weight: 72,
        bed: 'Bed ICU-15',
        admissionDiagnosis: 'Acute Inpatient Observation',
        codeStatus: 'Full',
        npoStatus: false,
        isolationStatus: false,
        allergy: 'No Known Drug Allergies (NKDA)'
      });
    }
  });

  // Duty Toggle Mutation
  const dutyMutation = useMutation({
    mutationFn: (id: string) => userService.toggleDuty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-staff-users'] });
    }
  });

  // Camera scanning state in Admin Scanner Modal
  const adminVideoRef = useRef<HTMLVideoElement>(null);
  const adminCanvasRef = useRef<HTMLCanvasElement>(null);
  const adminMediaStreamRef = useRef<MediaStream | null>(null);
  const adminScanIntervalRef = useRef<number | null>(null);
  const [adminCameraActive, setAdminCameraActive] = useState(false);
  const [adminCameraLoading, setAdminCameraLoading] = useState(false);
  const [adminCameraError, setAdminCameraError] = useState<string | null>(null);

  const stopAdminCamera = useCallback(() => {
    if (adminMediaStreamRef.current) {
      adminMediaStreamRef.current.getTracks().forEach(t => t.stop());
      adminMediaStreamRef.current = null;
    }
    if (adminVideoRef.current) {
      adminVideoRef.current.srcObject = null;
    }
    if (adminScanIntervalRef.current) {
      clearInterval(adminScanIntervalRef.current);
      adminScanIntervalRef.current = null;
    }
    setAdminCameraActive(false);
  }, []);

  const startAdminCamera = useCallback(async () => {
    setAdminCameraLoading(true);
    setAdminCameraError(null);

    if (adminMediaStreamRef.current) {
      adminMediaStreamRef.current.getTracks().forEach(t => t.stop());
      adminMediaStreamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAdminCameraError('Camera access not supported by this browser.');
      setAdminCameraLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      adminMediaStreamRef.current = stream;
      if (adminVideoRef.current) {
        adminVideoRef.current.srcObject = stream;
        adminVideoRef.current.setAttribute('playsinline', 'true');
        await adminVideoRef.current.play().catch(() => {});
      }
      setAdminCameraActive(true);
      setAdminCameraLoading(false);
    } catch {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        adminMediaStreamRef.current = fallbackStream;
        if (adminVideoRef.current) {
          adminVideoRef.current.srcObject = fallbackStream;
          adminVideoRef.current.setAttribute('playsinline', 'true');
          await adminVideoRef.current.play().catch(() => {});
        }
        setAdminCameraActive(true);
        setAdminCameraLoading(false);
      } catch (err: any) {
        setAdminCameraError(err.name === 'NotAllowedError' ? 'Camera permission was denied in browser.' : 'No camera device detected.');
        setAdminCameraLoading(false);
        setAdminCameraActive(false);
      }
    }
  }, []);

  const handlePerformScan = (code: string) => {
    let q = code.trim().toLowerCase();
    if (!q) return;

    if (q.includes('id=')) {
      try {
        const urlParams = new URLSearchParams(q.split('?')[1]);
        const idParam = urlParams.get('id');
        if (idParam) q = idParam.toLowerCase();
      } catch { /* ignore */ }
    } else if (q.includes('/verify/')) {
      const parts = q.split('/verify/');
      if (parts[1]) q = parts[1].split('?')[0].split('/')[0].toLowerCase();
    }
    if (q.startsWith('{') && q.endsWith('}')) {
      try {
        const parsed = JSON.parse(code);
        q = (parsed.staffId || parsed.mrn || parsed.id || q).toLowerCase();
      } catch { /* ignore */ }
    }

    const s = staffList.find(u => u.staffId?.toLowerCase() === q || u.id.toLowerCase() === q || u.name?.toLowerCase().includes(q));
    if (s) {
      stopAdminCamera();
      setShowScannerModal(false);
      setShortInfoRecord({ type: 'STAFF', data: s });
      return;
    }
    const p = patientsList.find(pt => pt.mrn?.toLowerCase() === q || pt.id.toLowerCase() === q || pt.name?.toLowerCase().includes(q) || (pt.bed && pt.bed.toLowerCase().includes(q)));
    if (p) {
      stopAdminCamera();
      setShowScannerModal(false);
      setShortInfoRecord({ type: 'PATIENT', data: p });
      return;
    }
    alert(`No matching hospital staff badge or admitted patient MRN found for: "${code}"`);
  };

  // Camera lifecycle for Admin scanner modal
  useEffect(() => {
    if (showScannerModal) {
      startAdminCamera();
    } else {
      stopAdminCamera();
    }
    return () => {
      stopAdminCamera();
    };
  }, [showScannerModal, startAdminCamera, stopAdminCamera]);

  // Frame processing loop for Admin scanner
  useEffect(() => {
    if (!showScannerModal || !adminCameraActive) {
      if (adminScanIntervalRef.current) {
        clearInterval(adminScanIntervalRef.current);
        adminScanIntervalRef.current = null;
      }
      return;
    }

    let isScanningFrame = false;
    const scanFrame = async () => {
      if (isScanningFrame) return;
      if (!adminVideoRef.current || adminVideoRef.current.readyState < 2) return;

      const video = adminVideoRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      isScanningFrame = true;
      try {
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const val = barcodes[0].rawValue;
              if (val && val.trim()) {
                handlePerformScan(val.trim());
                return;
              }
            }
          } catch { /* ignore */ }
        }

        const canvas = adminCanvasRef.current || document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          const res = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
          if (res && res.data && res.data.trim()) {
            handlePerformScan(res.data.trim());
            return;
          }
        }
      } catch {
        /* frame error */
      } finally {
        isScanningFrame = false;
      }
    };

    adminScanIntervalRef.current = window.setInterval(scanFrame, 120);
    return () => {
      if (adminScanIntervalRef.current) {
        clearInterval(adminScanIntervalRef.current);
        adminScanIntervalRef.current = null;
      }
    };
  }, [showScannerModal, adminCameraActive, staffList, patientsList]);

  // Auto-open enroll modal if ?enroll=true in URL
  useEffect(() => {
    if (searchParams.get('enroll') === 'true') {
      setShowEnrollStaffModal(true);
    }
  }, [searchParams]);

  // Handle URL ?scan= parameter (e.g. when physical camera scans QR code)
  useEffect(() => {
    const scanParam = searchParams.get('scan');
    if (scanParam && staffList.length > 0) {
      const q = scanParam.trim().toLowerCase();
      const s = staffList.find(u => u.staffId?.toLowerCase() === q || u.id.toLowerCase() === q);
      if (s) {
        setShortInfoRecord({ type: 'STAFF', data: s });
        return;
      }
      const p = patientsList.find(pt => pt.mrn?.toLowerCase() === q || pt.id.toLowerCase() === q);
      if (p) {
        setShortInfoRecord({ type: 'PATIENT', data: p });
        return;
      }
    }
  }, [searchParams, staffList, patientsList]);

  // Impersonate Clinician
  const handleImpersonateStaff = async (targetUser: StaffUser) => {
    try {
      await impersonate(targetUser.id, targetUser.staffId);
      if (targetUser.role === 'DOCTOR') navigate('/doctor');
      else if (targetUser.role === 'NURSE') navigate('/nurse');
      else if (targetUser.role === 'PHARMACIST') navigate('/prescriptions');
      else navigate('/patients');
    } catch (err: any) {
      alert('Clinician simulation failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Impersonate Patient
  const handleImpersonatePatient = async (targetPatient: any) => {
    try {
      await impersonate(undefined, undefined, targetPatient.id, targetPatient.mrn);
      navigate('/patient-portal');
    } catch (err: any) {
      alert('Patient portal simulation failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Staff KPI Calculations
  const staffStats = useMemo(() => {
    const total = staffList.length;
    const onDutyCount = staffList.filter(u => u.onDuty).length;
    const doctors = staffList.filter(u => u.role === 'DOCTOR').length;
    const nurses = staffList.filter(u => u.role === 'NURSE').length;
    const pharmacists = staffList.filter(u => u.role === 'PHARMACIST').length;
    const allied = staffList.filter(u => u.role === 'OTHER_STAFF' || (u.role as string) === 'ALLIED_STAFF').length;
    const admins = staffList.filter(u => u.role === 'ADMIN').length;
    return { total, onDutyCount, doctors, nurses, pharmacists, allied, admins };
  }, [staffList]);

  // Filtered staff members
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'OTHER_STAFF') {
          if (staff.role !== 'OTHER_STAFF' && (staff.role as string) !== 'ALLIED_STAFF') return false;
        } else if (staff.role !== roleFilter) {
          return false;
        }
      }
      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase();
        const matchName = staff.name?.toLowerCase().includes(q);
        const matchBadge = staff.staffId?.toLowerCase().includes(q);
        const matchDept = staff.department?.toLowerCase().includes(q);
        const matchLicense = staff.licenseNumber?.toLowerCase().includes(q);
        const matchTitle = staff.title?.toLowerCase().includes(q);
        if (!matchName && !matchBadge && !matchDept && !matchLicense && !matchTitle) return false;
      }
      return true;
    });
  }, [staffList, roleFilter, staffSearchQuery]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patientsList.filter(patient => {
      if (patientFilter === 'STAT' && !patient.prescriptions?.some((p: any) => p.isStatOrder)) return false;
      if (patientFilter === 'ISOLATION' && !patient.isolationStatus) return false;
      if (patientFilter === 'NPO' && !patient.npoStatus) return false;

      if (patientSearchQuery.trim()) {
        const q = patientSearchQuery.toLowerCase();
        const matchName = patient.name?.toLowerCase().includes(q);
        const matchMrn = patient.mrn?.toLowerCase().includes(q);
        const matchBed = patient.bed?.toLowerCase().includes(q);
        const matchDx = patient.admissionDiagnosis?.toLowerCase().includes(q);
        if (!matchName && !matchMrn && !matchBed && !matchDx) return false;
      }
      return true;
    });
  }, [patientsList, patientFilter, patientSearchQuery]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* ======================================================== */}
      {/* 1. TOP PORTAL NAVIGATION BAR                             */}
      {/* ======================================================== */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0b4da2 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(11, 77, 162, 0.25)'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                SmartMedAdmin
              </span>
              <span style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 9999,
                letterSpacing: '0.06em'
              }}>
                ROOT GOVERNANCE
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Hospital Personnel Enrollment &amp; Inpatient Clinical Directory Control Portal
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/patients')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: '#0b4da2',
              color: '#ffffff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
            }}
          >
            <ExternalLink size={14} />
            <span>Enter SmartMedChart eMAR</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 12px 4px 6px',
            backgroundColor: '#f1f5f9',
            borderRadius: 9999,
            border: '1px solid #e2e8f0'
          }}>
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'}
              alt="Admin Avatar"
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {currentUser?.name || 'Dr. Evelyn Vance, MD'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1 }}>
                {currentUser?.staffId || 'ADM-9001'} &bull; Admin
              </div>
            </div>
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              title="Sign Out"
              style={{ marginLeft: 4, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px' }}>
        {/* ======================================================== */}
        {/* 2. HERO GREETING BANNER (Dark Navy)                      */}
        {/* ======================================================== */}
        <div style={{
          backgroundColor: '#0c1a30',
          backgroundImage: 'linear-gradient(135deg, #0c1a30 0%, #0e274c 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          boxShadow: '0 10px 25px -5px rgba(12, 26, 48, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '3px 10px',
                borderRadius: 9999,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                HOSPITAL ADMINISTRATION BUREAU
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Welcome, {currentUser?.name || 'Dr. Evelyn Vance, MD'}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
              Authorize, credential, and onboard new hospital doctors, nurses, and staff — and inspect admitted inpatients with real-time eMAR chart synchronizations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowScannerModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9,
                backgroundColor: '#0284c7', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Camera size={15} />
              <span>Scan QR Code</span>
            </button>
            <button
              onClick={() => handleOpenEnrollModal('DOCTOR')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 9,
                backgroundColor: '#ffffff', color: '#0b4da2', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <UserPlus size={15} />
              <span>Enroll Doctor</span>
            </button>

            <button
              onClick={() => handleOpenEnrollModal('NURSE')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 9,
                backgroundColor: '#10b981', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Enroll Nurse</span>
            </button>

            <button
              onClick={() => handleOpenEnrollModal('PHARMACIST')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 9,
                backgroundColor: '#0d9488', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Enroll Pharmacist</span>
            </button>

            <button
              onClick={() => setShowAdmitPatientModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 9,
                backgroundColor: '#0284c7', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Heart size={15} />
              <span>+ Admit Inpatient</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SIX METRIC KPI CARDS                                  */}
        {/* ======================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 14,
          marginBottom: 24
        }}>
          {/* Total Staff */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>TOTAL STAFF</span>
              <User size={15} color="#64748b" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              {staffStats.total}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
              {staffStats.onDutyCount} On Duty
            </div>
          </div>

          {/* Doctors */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>DOCTORS</span>
              <Stethoscope size={15} color="#2563eb" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', marginBottom: 6 }}>
              {staffStats.doctors}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Active Prescribers</div>
          </div>

          {/* Nurses */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>NURSES (RN)</span>
              <HeartPulse size={15} color="#10b981" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>
              {staffStats.nurses}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>eMAR Verified</div>
          </div>

          {/* Pharmacists */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>PHARMACISTS</span>
              <Pill size={15} color="#0d9488" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0d9488', marginBottom: 6 }}>
              {staffStats.pharmacists}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Dispensary Leads</div>
          </div>

          {/* Allied Staff */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>ALLIED / BIOMED</span>
              <FlaskConical size={15} color="#7c3aed" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginBottom: 6 }}>
              {staffStats.allied}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Lab &amp; Diagnostics</div>
          </div>

          {/* Inpatients / Bed Capacity */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>ADMITTED INPATIENTS</span>
              <Heart size={15} color="#0284c7" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', marginBottom: 6 }}>
              {patientsList.length} Beds
            </div>
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
              Ward 4B Active Roster
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. DIRECTORY TABS: STAFF vs PATIENTS                     */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setDirectoryView('STAFF')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 800,
              backgroundColor: directoryView === 'STAFF' ? '#0b4da2' : '#ffffff',
              color: directoryView === 'STAFF' ? '#ffffff' : '#475569',
              boxShadow: directoryView === 'STAFF' ? '0 4px 12px rgba(11, 77, 162, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={16} />
            <span>Hospital Personnel &amp; Staff ({staffStats.total})</span>
          </button>

          <button
            onClick={() => setDirectoryView('PATIENTS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 800,
              backgroundColor: directoryView === 'PATIENTS' ? '#0b4da2' : '#ffffff',
              color: directoryView === 'PATIENTS' ? '#ffffff' : '#475569',
              boxShadow: directoryView === 'PATIENTS' ? '0 4px 12px rgba(11, 77, 162, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <Heart size={16} />
            <span>Admitted Inpatients &amp; Clinical Roster ({patientsList.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* 5A. VIEW A: HOSPITAL PERSONNEL & STAFF DIRECTORY         */}
        {/* ======================================================== */}
        {directoryView === 'STAFF' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Hospital Personnel &amp; Staff Directory
                  </h2>
                  <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                    {filteredStaff.length} Members
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                  Manage active clinicians, toggle shift statuses, inspect digital badges, or launch workstation as staff.
                </p>
              </div>

              <button
                onClick={() => handleOpenEnrollModal('DOCTOR')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9,
                  backgroundColor: '#0b4da2', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
                }}
              >
                <UserPlus size={16} />
                <span>Enroll New Staff</span>
              </button>
            </div>

            {/* Toolbar */}
            <div style={{
              padding: '14px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
            }}>
              <div style={{ position: 'relative', width: 380, maxWidth: '100%' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  placeholder="Search staff by name, badge ID, license, or department..."
                  style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: `All Staff (${staffStats.total})` },
                  { id: 'DOCTOR', label: `Doctors (${staffStats.doctors})` },
                  { id: 'NURSE', label: `Nurses (${staffStats.nurses})` },
                  { id: 'PHARMACIST', label: `Pharmacists (${staffStats.pharmacists})` },
                  { id: 'OTHER_STAFF', label: `Allied Staff (${staffStats.allied})` },
                  { id: 'ADMIN', label: `Admin (${staffStats.admins})` },
                ].map((tab) => {
                  const isActive = roleFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRoleFilter(tab.id as any)}
                      style={{
                        padding: '6px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: '1px solid', borderColor: isActive ? '#0f172a' : '#e2e8f0',
                        backgroundColor: isActive ? '#0f172a' : '#ffffff', color: isActive ? '#ffffff' : '#64748b'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>
                    <th style={{ padding: '12px 24px' }}>STAFF MEMBER</th>
                    <th style={{ padding: '12px 18px' }}>ROLE &amp; BADGE ID</th>
                    <th style={{ padding: '12px 18px' }}>DEPARTMENT &amp; SPECIALTY</th>
                    <th style={{ padding: '12px 18px' }}>LICENSE / CREDENTIALS</th>
                    <th style={{ padding: '12px 18px' }}>SHIFT &amp; DUTY STATUS</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right' }}>ACTIONS &amp; WORKSTATION</th>
                  </tr>
                </thead>
                <tbody>
                  {isStaffLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                        <div>Loading hospital staff directory...</div>
                      </td>
                    </tr>
                  ) : filteredStaff.map((staff, idx) => {
                    const isDoc = staff.role === 'DOCTOR';
                    const isNurse = staff.role === 'NURSE';
                    const isPharm = staff.role === 'PHARMACIST';
                    const isAllied = staff.role === 'OTHER_STAFF' || (staff.role as string) === 'ALLIED_STAFF';
                    const isAdmin = staff.role === 'ADMIN';

                    return (
                      <tr
                        key={staff.id || staff.staffId}
                        style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}
                      >
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={staff.avatarUrl || `https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150`}
                              alt={staff.name}
                              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0', flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{staff.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>{staff.title || staff.role}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            {isDoc && <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6 }}><Stethoscope size={11} /> DOCTOR</span>}
                            {isNurse && <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6 }}><HeartPulse size={11} /> NURSE</span>}
                            {isPharm && <span style={{ backgroundColor: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6 }}><Pill size={11} /> PHARMACIST</span>}
                            {isAllied && <span style={{ backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6 }}><FlaskConical size={11} /> BIOMEDICAL</span>}
                            {isAdmin && <span style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6 }}><Shield size={11} /> ADMIN</span>}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>{staff.staffId}</div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{staff.department || 'Ward 4B ICU'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{staff.specialty || 'General Care & eMAR'}</div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{staff.licenseNumber || 'VERIFIED-ACTIVE'}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>PIN: &bull;&bull;&bull;&bull;</div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <button
                            onClick={() => dutyMutation.mutate(staff.id)}
                            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 3 }}
                          >
                            {staff.onDuty ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 9999 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} /> ON DUTY
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#64748b', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 9999 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8' }} /> ACTIVE (OFF-DUTY)
                              </span>
                            )}
                          </button>
                          <div style={{ fontSize: 10, color: '#64748b' }}>Shift: {staff.shiftType || 'MORNING'}</div>
                        </td>

                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <button
                            onClick={() => setShortInfoRecord({ type: 'STAFF', data: staff })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '7px 14px',
                              borderRadius: 8,
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          >
                            <QrCode size={14} color="#0284c7" />
                            <span>Scan / View QR</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5B. VIEW B: ADMITTED INPATIENTS & CLINICAL ROSTER        */}
        {/* ======================================================== */}
        {directoryView === 'PATIENTS' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Admitted Hospital Inpatients &amp; Clinical Roster
                  </h2>
                  <span style={{ backgroundColor: '#eff6ff', color: '#0b4da2', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 9999 }}>
                    {filteredPatients.length} Active Patients
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                  Monitor admitted inpatient beds, verified allergies, active prescriptions, and inspect patient portal charts.
                </p>
              </div>

              <button
                onClick={() => setShowAdmitPatientModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9,
                  backgroundColor: '#0284c7', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Plus size={16} />
                <span>Admit New Patient</span>
              </button>
            </div>

            {/* Toolbar */}
            <div style={{
              padding: '14px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
            }}>
              <div style={{ position: 'relative', width: 380, maxWidth: '100%' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  placeholder="Search inpatients by name, MRN, bed, or diagnosis..."
                  style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: `All Inpatients (${patientsList.length})` },
                  { id: 'STAT', label: `STAT Orders (${patientsList.filter((p: any) => p.prescriptions?.some((rx: any) => rx.isStatOrder)).length})` },
                  { id: 'ISOLATION', label: `Isolation (${patientsList.filter((p: any) => p.isolationStatus).length})` },
                  { id: 'NPO', label: `NPO Active (${patientsList.filter((p: any) => p.npoStatus).length})` },
                ].map((tab) => {
                  const isActive = patientFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPatientFilter(tab.id as any)}
                      style={{
                        padding: '6px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: '1px solid', borderColor: isActive ? '#0b4da2' : '#e2e8f0',
                        backgroundColor: isActive ? '#0b4da2' : '#ffffff', color: isActive ? '#ffffff' : '#64748b'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>
                    <th style={{ padding: '12px 24px' }}>PATIENT &amp; BED</th>
                    <th style={{ padding: '12px 18px' }}>MRN &amp; CODE STATUS</th>
                    <th style={{ padding: '12px 18px' }}>ATTENDING &amp; ADMISSION DX</th>
                    <th style={{ padding: '12px 18px' }}>SAFETY &amp; ALLERGIES</th>
                    <th style={{ padding: '12px 18px' }}>MEDICATION SCHEDULE</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right' }}>ACTIONS &amp; WORKSTATION</th>
                  </tr>
                </thead>
                <tbody>
                  {isPatientsLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                        <div>Loading hospital inpatients directory...</div>
                      </td>
                    </tr>
                  ) : filteredPatients.map((patient, idx) => {
                    const initials = patient.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
                    const age = patient.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : 45;
                    const allergyText = patient.allergies?.[0]?.allergen || 'NKDA';
                    const hasSevere = patient.allergies?.length > 0;
                    const rxCount = patient.prescriptions?.length || 0;
                    const hasStat = patient.prescriptions?.some((p: any) => p.isStatOrder);

                    return (
                      <tr
                        key={patient.id}
                        style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}
                      >
                        {/* 1. Patient & Bed */}
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 10,
                              backgroundColor: '#0b4da2', color: '#ffffff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 800, flexShrink: 0
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{patient.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {age}y &bull; {patient.sex} &bull; {patient.weight}kg &bull; <strong style={{ color: '#0b4da2' }}>{patient.bed || 'ICU'}</strong>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. MRN & Code Status */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                            {patient.mrn}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 4 }}>
                              {patient.codeStatus || 'FULL CODE'}
                            </span>
                            {patient.npoStatus && (
                              <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: 4 }}>
                                NPO
                              </span>
                            )}
                            {patient.isolationStatus && (
                              <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: 4 }}>
                                ISOLATION
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Attending & Diagnosis */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                            Dr. V. Sharma, MD
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {patient.admissionDiagnosis || 'Acute Inpatient Care'}
                          </div>
                        </td>

                        {/* 4. Safety & Allergies */}
                        <td style={{ padding: '14px 18px' }}>
                          {hasSevere ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              <AlertTriangle size={11} />
                              <span>{allergyText}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 600 }}>No Known Allergies</span>
                          )}
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                            eGFR: {patient.eGFR || 62} mL/min (Renal Safe)
                          </div>
                        </td>

                        {/* 5. Medication Schedule */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#0b4da2' }}>{rxCount} Orders Active</span>
                            {hasStat && (
                              <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: '#dc2626', color: '#ffffff', padding: '1px 5px', borderRadius: 3 }}>
                                STAT DUE
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            Ward 4B ICU eMAR Synchronized
                          </div>
                        </td>

                        {/* 6. Actions */}
                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {/* Open eMAR Bedside */}
                            <button
                              onClick={() => navigate(`/patients/${patient.id}`)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              <ExternalLink size={12} />
                              <span>Open eMAR</span>
                            </button>

                            {/* Digital Wristband & Short Info QR */}
                            <button
                              onClick={() => setShortInfoRecord({ type: 'PATIENT', data: patient })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 14px',
                                borderRadius: 8,
                                backgroundColor: '#f8fafc',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                              onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            >
                              <QrCode size={14} color="#0284c7" />
                              <span>Scan / View QR</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 6. ENROLL NEW STAFF MODAL                                */}
      {/* ======================================================== */}
      {showEnrollStaffModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 18, width: '100%', maxWidth: 620, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={18} color="#0b4da2" />
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Enroll Hospital Personnel</h3>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0' }}>Register credentials, assign ward privileges, and generate eMAR badging.</p>
              </div>
              <button onClick={() => setShowEnrollStaffModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); enrollMutation.mutate(enrollForm); }}>
              <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 6 }}>ROLE CATEGORY:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { role: 'DOCTOR', label: 'Doctor / MD', icon: Stethoscope },
                      { role: 'NURSE', label: 'Nurse / RN', icon: HeartPulse },
                      { role: 'PHARMACIST', label: 'Pharmacist', icon: Pill },
                      { role: 'ALLIED_STAFF', label: 'Biomedical', icon: FlaskConical },
                    ].map(({ role, label, icon: Icon }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => resetEnrollForm(role)}
                        style={{
                          padding: '10px 8px', borderRadius: 8,
                          border: `1.5px solid ${enrollForm.role === role ? '#0b4da2' : '#e2e8f0'}`,
                          backgroundColor: enrollForm.role === role ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer', textAlign: 'center'
                        }}
                      >
                        <Icon size={16} color={enrollForm.role === role ? '#0b4da2' : '#64748b'} style={{ margin: '0 auto 4px' }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: enrollForm.role === role ? '#0b4da2' : '#334155' }}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Full Name &amp; Degree *</label>
                    <input type="text" required value={enrollForm.name} onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Badge ID *</label>
                    <input type="text" required value={enrollForm.staffId} onChange={(e) => setEnrollForm({ ...enrollForm, staffId: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: 'monospace', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Hospital Email *</label>
                    <input type="email" required value={enrollForm.email} onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>License Number *</label>
                    <input type="text" required value={enrollForm.licenseNumber} onChange={(e) => setEnrollForm({ ...enrollForm, licenseNumber: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: 'monospace', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Department *</label>
                    <input type="text" required value={enrollForm.department} onChange={(e) => setEnrollForm({ ...enrollForm, department: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Station PIN (4-Digits)</label>
                    <input type="text" maxLength={6} value={enrollForm.pin} onChange={(e) => setEnrollForm({ ...enrollForm, pin: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: 'monospace', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowEnrollStaffModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={enrollMutation.isPending} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: '#0b4da2', color: '#ffffff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {enrollMutation.isPending ? 'Enrolling...' : 'Complete Staff Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. ADMIT NEW INPATIENT MODAL                             */}
      {/* ======================================================== */}
      {showAdmitPatientModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 18, width: '100%', maxWidth: 580, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Heart size={18} color="#0284c7" />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Admit New Hospital Inpatient</h3>
              </div>
              <button onClick={() => setShowAdmitPatientModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); admitMutation.mutate(admitForm); }}>
              <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Patient Full Name *</label>
                    <input type="text" required placeholder="e.g. Eleanor Rigby" value={admitForm.name} onChange={(e) => setAdmitForm({ ...admitForm, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Medical Record Number (MRN) *</label>
                    <input type="text" required value={admitForm.mrn} onChange={(e) => setAdmitForm({ ...admitForm, mrn: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: 'monospace', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Date of Birth *</label>
                    <input type="date" required value={admitForm.dob} onChange={(e) => setAdmitForm({ ...admitForm, dob: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Bed Assignment *</label>
                    <input type="text" required value={admitForm.bed} onChange={(e) => setAdmitForm({ ...admitForm, bed: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Admission Diagnosis *</label>
                    <input type="text" required placeholder="e.g. Acute Coronary Syndrome" value={admitForm.admissionDiagnosis} onChange={(e) => setAdmitForm({ ...admitForm, admissionDiagnosis: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Weight (kg)</label>
                    <input type="number" step="0.1" value={admitForm.weight} onChange={(e) => setAdmitForm({ ...admitForm, weight: parseFloat(e.target.value) })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Code Status</label>
                    <select value={admitForm.codeStatus} onChange={(e) => setAdmitForm({ ...admitForm, codeStatus: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
                      <option value="Full">Full Code</option>
                      <option value="DNR">DNR / DNI</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" checked={admitForm.npoStatus} onChange={(e) => setAdmitForm({ ...admitForm, npoStatus: e.target.checked })} style={{ accentColor: '#d97706' }} />
                    <span>NPO (Nil Per Os) Active</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" checked={admitForm.isolationStatus} onChange={(e) => setAdmitForm({ ...admitForm, isolationStatus: e.target.checked })} style={{ accentColor: '#dc2626' }} />
                    <span>Infection Isolation</span>
                  </label>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAdmitPatientModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={admitMutation.isPending} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {admitMutation.isPending ? 'Admitting...' : 'Admit & Generate eMAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. SCANNED SHORT INFO POPUP (STAFF & PATIENT)            */}
      {/* ======================================================== */}
      {shortInfoRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 22,
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            border: '1px solid #cbd5e1'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: shortInfoRecord.type === 'STAFF' ? '#0b4da2' : '#0284c7',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {shortInfoRecord.type === 'STAFF' ? <Shield size={18} /> : <Heart size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    {shortInfoRecord.type === 'STAFF' ? 'Verified Staff Credentials' : 'Verified Inpatient Identity'}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>
                    SmartMed QR Code Verified &bull; Real-time Snapshot
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShortInfoRecord(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* QR Code & Identity Card */}
              <div style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                padding: '14px',
                backgroundColor: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                marginBottom: 16
              }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: 8,
                  borderRadius: 10,
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  flexShrink: 0,
                  textAlign: 'center'
                }}>
                  <QRCodeSVG
                    value={
                      `${window.location.origin}/verify?id=${encodeURIComponent(shortInfoRecord.type === 'STAFF' ? (shortInfoRecord.data.staffId || shortInfoRecord.data.id) : (shortInfoRecord.data.mrn || shortInfoRecord.data.id))}&type=${shortInfoRecord.type}`
                    }
                    size={105}
                    level="H"
                  />
                  <div style={{ fontSize: 8, color: '#64748b', fontWeight: 800, marginTop: 4, letterSpacing: '0.04em' }}>
                    QR VERIFIED
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 800,
                    backgroundColor: shortInfoRecord.type === 'STAFF' ? '#dbeafe' : '#dcfce7',
                    color: shortInfoRecord.type === 'STAFF' ? '#1e40af' : '#166534',
                    marginBottom: 5
                  }}>
                    {shortInfoRecord.type === 'STAFF' ? shortInfoRecord.data.role : 'ADMITTED INPATIENT'}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                    {shortInfoRecord.data.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                    {shortInfoRecord.type === 'STAFF'
                      ? (shortInfoRecord.data.title || shortInfoRecord.data.department)
                      : `DOB: ${shortInfoRecord.data.dob ? format(new Date(shortInfoRecord.data.dob), 'dd-MMM-yyyy') : '14-Mar-1979'} (${shortInfoRecord.data.sex || 'Male'})`}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#0b4da2' }}>
                    {shortInfoRecord.type === 'STAFF' ? `BADGE ID: ${shortInfoRecord.data.staffId}` : `MRN: ${shortInfoRecord.data.mrn}`}
                  </div>
                </div>
              </div>

              {/* Short Info Metadata Grid */}
              {shortInfoRecord.type === 'STAFF' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11 }}>
                  <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>DEPARTMENT</span>
                    <strong style={{ color: '#0f172a' }}>{shortInfoRecord.data.department || 'Ward 4B ICU'}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>WARD ASSIGNMENT</span>
                    <strong style={{ color: '#0f172a' }}>{shortInfoRecord.data.ward || 'Cardiothoracic ICU'}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>LICENSE / ACCREDITATION</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{shortInfoRecord.data.licenseNumber || 'VERIFIED-ACTIVE'}</span>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>SHIFT SCHEDULE</span>
                    <strong style={{ color: '#0f172a' }}>{shortInfoRecord.data.shiftType || 'MORNING'} (07:00–15:00)</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>DUTY STATUS</span>
                      <strong style={{ color: shortInfoRecord.data.onDuty ? '#16a34a' : '#64748b' }}>
                        {shortInfoRecord.data.onDuty ? '● ON ACTIVE DUTY' : '○ OFF-DUTY'}
                      </strong>
                    </div>
                    <button
                      onClick={() => {
                        dutyMutation.mutate(shortInfoRecord.data.id);
                        setShortInfoRecord({
                          ...shortInfoRecord,
                          data: { ...shortInfoRecord.data, onDuty: !shortInfoRecord.data.onDuty }
                        });
                      }}
                      style={{
                        padding: '5px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      Toggle Shift Duty
                    </button>
                  </div>
                </div>
              ) : (
                /* Patient Info */
                <div>
                  {/* Allergies Alert */}
                  {shortInfoRecord.data.allergies?.length > 0 ? (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#991b1b',
                      fontSize: 11,
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <div>
                        <strong>CRITICAL ALLERGY ALERT: </strong>
                        {shortInfoRecord.data.allergies.map((a: any) => `${a.allergen} (${a.severity || 'Severe'})`).join(', ')}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#166534',
                      fontSize: 11,
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <CheckCircle2 size={14} />
                      <span>No Known Drug Allergies (NKDA) Recorded</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11 }}>
                    <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>BED ASSIGNMENT</span>
                      <strong style={{ color: '#0f172a' }}>Bed {shortInfoRecord.data.bed || 'ICU-12'} &bull; Ward 4B</strong>
                    </div>
                    <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>CODE STATUS</span>
                      <strong style={{ color: '#0f172a' }}>{shortInfoRecord.data.codeStatus || 'Full Code'}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>ADMISSION DIAGNOSIS</span>
                      <strong style={{ color: '#0f172a' }}>{shortInfoRecord.data.admissionDiagnosis || 'Acute Inpatient Care'}</strong>
                    </div>
                    <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>ATTENDING PHYSICIAN</span>
                      <strong style={{ color: '#0f172a' }}>{shortInfoRecord.data.prescriptions?.[0]?.prescriber?.name || 'Dr. Sharma, MD'}</strong>
                    </div>
                    <div style={{ padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>RENAL &amp; ORGAN MARKER</span>
                      <strong style={{ color: '#0f172a' }}>eGFR: {shortInfoRecord.data.eGFR || 62} mL/min</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8
            }}>
              {shortInfoRecord.type === 'PATIENT' && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/patients/${shortInfoRecord.data.id}`);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#0b4da2',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Open Full eMAR</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShortInfoRecord(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Popup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. UNIVERSAL HOSPITAL QR / BARCODE SCANNER MODAL         */}
      {/* ======================================================== */}
      {showScannerModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 22,
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0c1a30',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Hospital QR Code &amp; Barcode Scanner</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Scan Staff Badge ID or Inpatient Wristband</div>
                </div>
              </div>
              <button
                onClick={() => setShowScannerModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
              {/* Live Optical Scanner Viewfinder */}
              <div style={{
                position: 'relative',
                width: 220,
                height: 220,
                margin: '0 auto 16px',
                backgroundColor: '#0f172a',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: adminCameraActive && !adminCameraLoading ? '2.5px solid #38bdf8' : '2px solid #38bdf8',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
              }}>
                <video
                  ref={adminVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: adminCameraActive && !adminCameraLoading ? 1 : 0
                  }}
                />
                <canvas ref={adminCanvasRef} style={{ display: 'none' }} />

                <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', zIndex: 12 }} />
                <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', zIndex: 12 }} />
                <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', zIndex: 12 }} />
                <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', zIndex: 12 }} />

                {adminCameraLoading && (
                  <div style={{ zIndex: 14, color: '#38bdf8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 10, fontWeight: 700 }}>Starting Camera...</span>
                  </div>
                )}

                {!adminCameraLoading && !adminCameraActive && (
                  <div style={{ zIndex: 14, color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12 }}>
                    <CameraOff size={32} color="#f87171" style={{ marginBottom: 6 }} />
                    <span style={{ fontSize: 10, color: '#cbd5e1' }}>{adminCameraError || 'Camera unavailable'}</span>
                    <button
                      type="button"
                      onClick={startAdminCamera}
                      style={{ marginTop: 8, padding: '4px 10px', fontSize: 10, borderRadius: 6, backgroundColor: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {adminCameraActive && !adminCameraLoading && (
                  <>
                    <div style={{
                      position: 'absolute',
                      width: 130,
                      height: 130,
                      borderRadius: 12,
                      border: '2px dashed rgba(56, 189, 248, 0.7)',
                      zIndex: 13,
                      pointerEvents: 'none'
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
                      boxShadow: '0 0 12px 3px rgba(56, 189, 248, 0.8)',
                      animation: 'scannerLaserLight 2s ease-in-out infinite',
                      zIndex: 14,
                      pointerEvents: 'none'
                    }} />
                  </>
                )}

                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.06em',
                  zIndex: 15,
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                }}>
                  {adminCameraActive && !adminCameraLoading ? 'ALIGN QR CODE' : 'OPTICAL SCANNER READY'}
                </div>
              </div>

              {/* Manual Input Form */}
              <form onSubmit={(e) => { e.preventDefault(); handlePerformScan(manualScanInput); }} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Enter Staff ID (DOC-...) or MRN (94021-...)"
                    value={manualScanInput}
                    onChange={(e) => setManualScanInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      fontSize: 12,
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '9px 16px',
                      backgroundColor: '#0b4da2',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Scan &amp; Look Up
                  </button>
                </div>
              </form>

              {/* Instant Simulator Presets */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Instant Optical Scan Presets:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {staffList.slice(0, 2).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handlePerformScan(s.staffId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc', fontSize: 11, cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <Scan size={12} color="#0284c7" />
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>{s.name}</strong> ({s.staffId})
                      </div>
                    </button>
                  ))}
                  {patientsList.slice(0, 2).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePerformScan(p.mrn)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc', fontSize: 11, cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <Scan size={12} color="#16a34a" />
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>{p.name}</strong> (Bed {p.bed})
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
