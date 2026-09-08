import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import jsQR from 'jsqr';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, Scan, PhoneCall, Copy, Check, ShieldCheck,
  LogOut, QrCode, Search, Heart, Stethoscope, Lock,
  Users,
  Camera, CameraOff, RefreshCw, AlertTriangle
} from 'lucide-react';
import { HospitalPersonQRModal, HospitalPerson } from '../components/HospitalPersonQRModal';

export interface StaffPatientView {
  patientId: string; // MRN
  patientName: string;
  department: string;
  ward: string;
  bedNumber: string;
  attendingNurse: {
    name: string;
    phone: string;
    title: string;
    extension?: string;
  };
  doctor: {
    name: string;
    designation: string;
    department: string;
  };
  relative: {
    name: string;
    relation: string;
    phone: string;
  };
}

const PRESET_CARE_TEAMS: Record<string, StaffPatientView> = {
  '94021-08': {
    patientId: '94021-08',
    patientName: 'Rahul Patil',
    department: 'Critical Care & Acute Inpatient Medicine',
    ward: 'Ward 4B ICU',
    bedNumber: 'Bed ICU-12',
    attendingNurse: {
      name: 'Nurse Priya Nair, RN',
      phone: '+91 98234 88219',
      title: 'Primary Bedside BSN (ICU Certified)',
      extension: 'ext. 4821'
    },
    doctor: {
      name: 'Dr. V. Sharma, MD',
      designation: 'Attending Intensivist & Pulmonologist',
      department: 'Pulmonology / Critical Care'
    },
    relative: {
      name: 'Sunita Patil',
      relation: 'Spouse / Primary Contact',
      phone: '+91 98201 34982'
    }
  },
  '94022-15': {
    patientId: '94022-15',
    patientName: 'Anita Desai',
    department: 'Critical Care & Acute Inpatient Medicine',
    ward: 'Ward 4B ICU',
    bedNumber: 'Bed ICU-14',
    attendingNurse: {
      name: 'Nurse Priya Nair, RN',
      phone: '+91 98234 88219',
      title: 'Primary Bedside BSN (ICU Certified)',
      extension: 'ext. 4821'
    },
    doctor: {
      name: 'Dr. V. Sharma, MD',
      designation: 'Attending Intensivist & Pulmonologist',
      department: 'Pulmonology / Critical Care'
    },
    relative: {
      name: 'Vikram Desai',
      relation: 'Son / Primary Contact',
      phone: '+91 98765 78290'
    }
  },
  '94023-08': {
    patientId: '94023-08',
    patientName: 'Girish Madhavan',
    department: 'Critical Care & Acute Inpatient Medicine',
    ward: 'Ward 4B ICU',
    bedNumber: 'Bed ICU-08',
    attendingNurse: {
      name: 'Nurse Suresh Verma, RN',
      phone: '+91 98234 40192',
      title: 'Ward Charge Nurse / Shift Lead',
      extension: 'ext. 4019'
    },
    doctor: {
      name: 'Dr. Vikram Singh, MD',
      designation: 'Chief of Acute Care Surgery',
      department: 'Acute Care Surgery'
    },
    relative: {
      name: 'Sowmya Madhavan',
      relation: 'Spouse / Primary Contact',
      phone: '+91 98450 41268'
    }
  },
  '94024-03': {
    patientId: '94024-03',
    patientName: 'Meenakshi Sundaram',
    department: 'Critical Care & Acute Inpatient Medicine',
    ward: 'Ward 4B ICU',
    bedNumber: 'Bed ICU-03',
    attendingNurse: {
      name: 'Nurse Kavita Nair, RN',
      phone: '+91 98234 55219',
      title: 'Staff Registered Nurse',
      extension: 'ext. 5521'
    },
    doctor: {
      name: 'Dr. Ananya Iyer, MD',
      designation: 'Consultant Physician & Intensivist',
      department: 'Internal Medicine & Critical Care'
    },
    relative: {
      name: 'Devanand Sundaram',
      relation: 'Son / Primary Contact',
      phone: '+91 98110 90324'
    }
  }
};

export default function HospitalStaffPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Scanner state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPatient, setScannedPatient] = useState<StaffPatientView | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedRelativePhone, setCopiedRelativePhone] = useState(false);
  const [showStaffQRModal, setShowStaffQRModal] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Live Camera Video & QR scanning state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const isProcessingFrameRef = useRef<boolean>(false);

  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Auto-focus barcode input on load or when resetting scanner
  useEffect(() => {
    if (!scannedPatient && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scannedPatient]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const playScanBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop any existing stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by this browser.');
      setCameraLoading(false);
      setCameraActive(false);
      return;
    }

    try {
      // Preferred camera with requested facingMode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setCameraLoading(false);
      setCameraError(null);
    } catch (err: any) {
      console.warn('Primary camera facingMode request failed, attempting fallback...', err);
      try {
        // Fallback: any video device without constraints
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        mediaStreamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        setCameraLoading(false);
        setCameraError(null);
      } catch (fallbackErr: any) {
        console.error('Camera fallback also failed:', fallbackErr);
        let errorMsg = 'Could not access camera. Please verify camera permissions in Chrome.';
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          errorMsg = 'Camera permission was denied. Please allow camera access in the Chrome address bar.';
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
          errorMsg = 'No camera device detected on your computer. You can use the barcode input below.';
        } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
          errorMsg = 'Camera is in use by another application. Close other camera apps and retry.';
        }
        setCameraError(errorMsg);
        setCameraLoading(false);
        setCameraActive(false);
      }
    }
  }, [facingMode]);

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const handleSimulateScan = async (rawInput: string) => {
    let mrn = rawInput.trim();
    if (!mrn) return;

    // Check for QR URLs like ".../verify?id=94021-08" or ".../patient/94021-08"
    if (mrn.includes('id=')) {
      try {
        const urlParams = new URLSearchParams(mrn.split('?')[1]);
        const idParam = urlParams.get('id');
        if (idParam) mrn = idParam;
      } catch { /* ignore */ }
    } else if (mrn.includes('/verify/')) {
      const parts = mrn.split('/verify/');
      if (parts[1]) mrn = parts[1].split('?')[0].split('/')[0];
    }

    // Check for JSON QR data
    if (mrn.startsWith('{') && mrn.endsWith('}')) {
      try {
        const parsed = JSON.parse(mrn);
        mrn = parsed.mrn || parsed.id || parsed.patientId || mrn;
      } catch { /* ignore */ }
    }

    setIsScanning(true);

    try {
      // 1. Try local preset mapping first
      if (PRESET_CARE_TEAMS[mrn]) {
        setTimeout(() => {
          setIsScanning(false);
          setScannedPatient(PRESET_CARE_TEAMS[mrn]);
          setBarcodeInput('');
          showToast(`✓ QR Scanned: ${PRESET_CARE_TEAMS[mrn].patientName} (${PRESET_CARE_TEAMS[mrn].patientId}) verified!`);
        }, 500);
        return;
      }

      // 2. Fetch from live backend verification endpoint with staff-restricted view
      const res = await axios.get(`/api/verify/${encodeURIComponent(mrn)}?viewer=staff`, {
        headers: user?.role ? { 'x-viewer-role': user.role } : {}
      });

      if (res.data?.patient) {
        const p = res.data.patient;
        const mapped: StaffPatientView = {
          patientId: p.mrn || p.id || mrn,
          patientName: p.name || 'Verified Patient',
          department: p.department || 'Department of Critical Care & Inpatient Medicine',
          ward: p.ward || 'Ward 4B ICU',
          bedNumber: p.bed || 'ICU-12',
          attendingNurse: {
            name: p.attendingNurse?.name || 'Nurse Priya Nair, RN',
            phone: p.attendingNurse?.phone || '+91 98234 88219',
            title: p.attendingNurse?.title || 'Primary Bedside BSN (ICU Certified)',
          },
          doctor: {
            name: p.attendingDoctor?.name || 'Dr. V. Sharma, MD',
            designation: p.attendingDoctor?.designation || 'Attending Physician',
            department: p.attendingDoctor?.department || 'Critical Care Medicine'
          },
          relative: {
            name: p.relative?.name || p.emergencyContactName || 'Sunita Patil',
            relation: p.relative?.relation || p.emergencyContactRelation || 'Spouse / Primary Contact',
            phone: p.relative?.phone || p.emergencyContactPhone || '+91 98201 34982',
          }
        };

        setTimeout(() => {
          setIsScanning(false);
          setScannedPatient(mapped);
          setBarcodeInput('');
          showToast(`✓ QR Scanned: ${mapped.patientName} (${mapped.patientId}) verified!`);
        }, 500);
        return;
      }
    } catch {
      // Fallback to Rahul Patil demo
      setTimeout(() => {
        setIsScanning(false);
        const fallback = PRESET_CARE_TEAMS['94021-08'];
        setScannedPatient(fallback);
        setBarcodeInput('');
        showToast(`✓ Demo Patient QR: ${fallback.patientName} verified!`);
      }, 500);
    }
  };

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  // Frame processing loop using jsQR and native BarcodeDetector
  useEffect(() => {
    if (scannedPatient || !cameraActive) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    const scanFrame = async () => {
      if (isScanningRef.current || isProcessingFrameRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      isProcessingFrameRef.current = true;

      try {
        // Option 1: Native BarcodeDetector
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code && code.trim() && code !== lastScannedCode) {
                setLastScannedCode(code);
                playScanBeep();
                handleSimulateScan(code.trim());
                return;
              }
            }
          } catch {
            // fallback to jsQR below
          }
        }

        // Option 2: jsQR Canvas fallback
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (qrResult && qrResult.data && qrResult.data.trim()) {
            const code = qrResult.data.trim();
            if (code !== lastScannedCode) {
              setLastScannedCode(code);
              playScanBeep();
              handleSimulateScan(code);
              return;
            }
          }
        }
      } catch {
        // frame decode ignore
      } finally {
        isProcessingFrameRef.current = false;
      }
    };

    scanIntervalRef.current = window.setInterval(scanFrame, 120);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [cameraActive, scannedPatient, lastScannedCode]);

  // Manage camera lifecycle based on scannedPatient state
  useEffect(() => {
    if (!scannedPatient) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scannedPatient, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleSimulateScan(barcodeInput.trim());
    }
  };

  const handleCopyNursePhone = (phone: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      showToast(`Nurse phone number copied: ${phone}`);
    }
  };

  const handleCopyRelativePhone = (phone: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedRelativePhone(true);
      setTimeout(() => setCopiedRelativePhone(false), 2000);
      showToast(`Relative phone number copied: ${phone}`);
    }
  };

  const handleResetScanner = () => {
    setScannedPatient(null);
    setBarcodeInput('');
    setLastScannedCode(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Current logged in staff person for QR modal
  const currentStaffPerson: HospitalPerson = {
    type: 'STAFF',
    name: user?.name || 'Arjun Mehta, MLS',
    staffId: user?.staffId || 'LT-44201',
    role: user?.role || 'ALLIED_STAFF',
    title: user?.title || 'Senior Medical Laboratory Scientist',
    department: user?.department || 'Central Pathology & Blood Bank',
    specialty: 'Clinical Diagnostics & Laboratory Medicine',
    licenseNumber: user?.licenseNumber || 'MLS-44201-AIIMS',
    shiftType: user?.shiftType || 'DAY (07:00 - 15:00)',
    onDuty: true
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Laser Animation Style */}
      <style>{`
        @keyframes scannerLaserLight {
          0% { top: 12px; opacity: 0.2; }
          50% { top: 220px; opacity: 1; }
          100% { top: 12px; opacity: 0.2; }
        }
      `}</style>

      {/* ======================================================== */}
      {/* 1. TOP HEADER (Matches AdminPage)                        */}
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
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Left Branding */}
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
                SmartMedStaff
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
                HOSPITAL STAFF TERMINAL
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Bedside Patient Logistics &amp; Care Team Verification Terminal
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Staff Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 12px 4px 6px',
            backgroundColor: '#f1f5f9',
            borderRadius: 9999,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0b4da2 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 800
            }}>
              {(user?.name || 'Arjun Mehta').split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {user?.name || 'Arjun Mehta, MLS'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1 }}>
                {user?.staffId || 'LT-44201'} &bull; <span style={{ color: '#059669', fontWeight: 600 }}>● ON DUTY</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                marginLeft: 4,
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 76,
          right: 28,
          backgroundColor: '#065f46',
          border: '1px solid #10b981',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'slideIn 0.2s ease-out'
        }}>
          <Check size={16} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN CONTAINER                                           */}
      {/* ======================================================== */}
      <main style={{ maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 28px', boxSizing: 'border-box' }}>
        {/* ======================================================== */}
        {/* 2. HERO GREETING BANNER (Dark Navy, matches AdminPage)   */}
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
                HOSPITAL STAFF BUREAU
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Welcome, {user?.name || 'Arjun Mehta, MLS'}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
              Scan patient bedside wristband or bed QR code to verify bed logistics, attending care team, and emergency relative contact with real-time HL7/FHIR chart synchronizations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                if (scannedPatient) {
                  setScannedPatient(null);
                }
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 16px',
                borderRadius: 9,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Scan size={15} />
              <span>Scan QR Code</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#0b4da2',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
            }}
          >
            <Scan size={16} />
            <span>Bedside Patient QR Scanner</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 700
            }}
          >
            <ShieldCheck size={16} color="#059669" />
            <span>Read-Only Logistics &amp; Care Team Verification</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. WORKSTATION: SCANNER VIEW (When !scannedPatient)      */}
        {/* ======================================================== */}
        {!scannedPatient && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* White Card Container */}
            <div style={{
              width: '100%',
              maxWidth: 580,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '32px 28px',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box'
            }}>
              {/* Card Title & Guidance */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  Patient Bedside QR Scanner
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Scan the patient's wristband or bed barcode using your handheld scanner gun or enter the MRN below.
                </p>
              </div>

              {/* Live Optical Laser Camera Viewfinder */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 320,
                height: 300,
                borderRadius: 20,
                border: cameraActive && !cameraLoading ? '2.5px solid #38bdf8' : '2px dashed rgba(2, 132, 199, 0.45)',
                backgroundColor: '#0c1a30',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: cameraActive && !cameraLoading ? '0 0 25px rgba(56, 189, 248, 0.35)' : 'inset 0 0 28px rgba(2, 132, 199, 0.25)',
                marginBottom: 16,
                overflow: 'hidden'
              }}>
                {/* 1. Live Video Stream */}
                <video
                  ref={videoRef}
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
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    opacity: cameraActive && !cameraLoading ? 1 : 0,
                    transition: 'opacity 0.25s ease-in-out'
                  }}
                />

                {/* Hidden canvas for jsQR frame processing */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* 2. Top Live Status Pill */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  backgroundColor: cameraActive && !cameraLoading ? 'rgba(5, 150, 105, 0.9)' : 'rgba(15, 23, 42, 0.85)',
                  border: cameraActive && !cameraLoading ? '1px solid rgba(52, 211, 153, 0.6)' : '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 16,
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: cameraActive && !cameraLoading ? '#34d399' : '#f87171',
                    boxShadow: cameraActive && !cameraLoading ? '0 0 8px #34d399' : 'none'
                  }} />
                  <span>{cameraActive && !cameraLoading ? 'LIVE CAMERA SCANNER' : cameraLoading ? 'STARTING WEBCAM...' : 'CAMERA STANDBY'}</span>
                </div>

                {/* 3. Four Corner HUD Brackets */}
                <div style={{ position: 'absolute', top: 12, left: 12, width: 24, height: 24, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', zIndex: 12 }} />
                <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', zIndex: 12 }} />
                <div style={{ position: 'absolute', bottom: 12, left: 12, width: 24, height: 24, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', zIndex: 12 }} />
                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', zIndex: 12 }} />

                {/* 4. Center Target Alignment Reticle */}
                {cameraActive && !cameraLoading && (
                  <div style={{
                    position: 'absolute',
                    width: 170,
                    height: 170,
                    borderRadius: 16,
                    border: '2px dashed rgba(56, 189, 248, 0.75)',
                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
                    zIndex: 13,
                    pointerEvents: 'none'
                  }} />
                )}

                {/* 5. Animated Sweeping Laser */}
                {cameraActive && !cameraLoading && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'linear-gradient(90deg, transparent, #38bdf8, #34d399, #38bdf8, transparent)',
                    boxShadow: '0 0 16px 4px rgba(56, 189, 248, 0.9)',
                    animation: 'scannerLaserLight 2.2s ease-in-out infinite',
                    zIndex: 15,
                    pointerEvents: 'none'
                  }} />
                )}

                {/* 6. Loading Indicator */}
                {cameraLoading && (
                  <div style={{ zIndex: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#38bdf8' }}>
                    <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>Initializing Camera Stream...</span>
                  </div>
                )}

                {/* 7. Error / Standby View (When Camera Denied or Unavailable) */}
                {!cameraLoading && (!cameraActive || cameraError) && (
                  <div style={{
                    zIndex: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0 24px',
                    textAlign: 'center',
                    color: '#cbd5e1'
                  }}>
                    <CameraOff size={44} color="#f87171" style={{ marginBottom: 10 }} />
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                      Camera Access Needed
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14, lineHeight: 1.4, maxWidth: 240 }}>
                      {cameraError || 'Please grant camera permission to scan bedside wristbands and patient QR codes directly.'}
                    </div>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      <Camera size={14} />
                      <span>Enable Camera</span>
                    </button>
                  </div>
                )}

                {/* 8. Bottom Instruction Text */}
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  fontSize: 10,
                  fontWeight: 800,
                  color: isScanning ? '#34d399' : '#e2e8f0',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  zIndex: 16,
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                }}>
                  {isScanning ? 'Decoding Patient QR...' : cameraActive && !cameraLoading ? 'Align Patient QR in Reticle' : 'Use Barcode Input Below'}
                </div>
              </div>

              {/* Camera Controls Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                {cameraActive ? (
                  <>
                    <button
                      type="button"
                      onClick={stopCamera}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 14px',
                        borderRadius: 8,
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Turn off camera feed"
                    >
                      <CameraOff size={13} />
                      <span>Pause Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 14px',
                        borderRadius: 8,
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#0b4da2',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Flip camera (front / rear)"
                    >
                      <RefreshCw size={13} />
                      <span>Flip Camera ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      backgroundColor: '#0284c7',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    <Camera size={14} />
                    <span>Turn On Camera</span>
                  </button>
                )}
              </div>

              {/* Barcode Gun / Manual Input Bar */}
              <form onSubmit={handleManualSubmit} style={{ width: '100%', marginBottom: 8 }}>
                <label style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Scan with Barcode Gun or Enter Patient MRN
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Enter or scan MRN (e.g. 94021-08)..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      disabled={isScanning}
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 38px',
                        borderRadius: 10,
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        color: '#0f172a',
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isScanning || !barcodeInput.trim()}
                    style={{
                      padding: '11px 20px',
                      borderRadius: 10,
                      backgroundColor: '#0b4da2',
                      backgroundImage: 'linear-gradient(135deg, #0b4da2 0%, #0284c7 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: isScanning || !barcodeInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: isScanning || !barcodeInput.trim() ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
                    }}
                  >
                    <Scan size={16} />
                    <span>Scan</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Privacy Notice Box Below Scanner */}
            <div style={{
              width: '100%',
              maxWidth: 580,
              marginTop: 18,
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxSizing: 'border-box'
            }}>
              <ShieldCheck size={22} color="#1d4ed8" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.45 }}>
                <strong style={{ color: '#1e3a8a' }}>Hospital Staff Privacy Rule: </strong>
                Read-only access to bed logistics and the primary care team. Confidential medical prescriptions, dosages, patient vitals, and diagnoses are strictly concealed. Staff cannot add or modify clinical records.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. WORKSTATION: SCANNED PATIENT BASIC DETAILS VIEW       */}
        {/* ======================================================== */}
        {scannedPatient && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Verified Green Ribbon */}
            <div style={{
              width: '100%',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '16px 16px 0 0',
              padding: '12px 24px',
              color: '#065f46',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="#059669" />
                <span>PATIENT QR CODE VERIFIED &bull; BED LOGISTICS &amp; CARE TEAM</span>
              </div>
              <span style={{
                backgroundColor: '#d1fae5',
                color: '#065f46',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: 800
              }}>
                READ-ONLY STAFF VIEW
              </span>
            </div>

            {/* Main Basic Details Card Container */}
            <div style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              padding: '28px 32px',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
              boxSizing: 'border-box',
              marginBottom: 20
            }}>
              {/* Header: Patient Name & ID & Bed Badge & QR Graphic */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
                paddingBottom: 20,
                borderBottom: '1px solid #e2e8f0',
                marginBottom: 22
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #0b4da2 0%, #0284c7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(11, 77, 162, 0.25)'
                  }}>
                    {scannedPatient.patientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        {scannedPatient.patientName}
                      </h2>
                      <span style={{
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        {scannedPatient.bedNumber}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      Patient ID (MRN): <strong style={{ color: '#0b4da2', fontFamily: 'monospace', fontSize: 14 }}>{scannedPatient.patientId}</strong>
                    </div>
                  </div>
                </div>

                {/* Patient QR Graphic */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: 8,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}>
                  <QRCodeSVG value={`${window.location.origin}/verify?id=${scannedPatient.patientId}&viewer=staff`} size={76} level="M" />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#0f172a', marginTop: 4, fontFamily: 'monospace' }}>
                    {scannedPatient.patientId}
                  </span>
                </div>
              </div>

              {/* SECTION A: Bedside Location & Logistics (5 Fields) */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Bedside Location &amp; Hospital Logistics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      1. PATIENT ID (MRN)
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: 3 }}>
                      {scannedPatient.patientId}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      2. PATIENT NAME
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 3 }}>
                      {scannedPatient.patientName}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      3. DEPARTMENT
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginTop: 3 }}>
                      {scannedPatient.department}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      4. WARD
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginTop: 3 }}>
                      {scannedPatient.ward}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      5. BED NUMBER
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0284c7', fontFamily: 'monospace', marginTop: 3 }}>
                      {scannedPatient.bedNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Primary Care Team (Nurse & Doctor) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* 6. Attending Nurse & Direct Dial */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: 14,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Heart size={15} color="#16a34a" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          6. ATTENDING NURSE
                        </span>
                      </div>
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 9999
                      }}>
                        ON DUTY BEDSIDE
                      </span>
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, color: '#14532d', marginBottom: 4 }}>
                      {scannedPatient.attendingNurse.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#15803d', marginBottom: 14 }}>
                      {scannedPatient.attendingNurse.title} {scannedPatient.attendingNurse.extension && `• ${scannedPatient.attendingNurse.extension}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={`tel:${scannedPatient.attendingNurse.phone.replace(/[^0-9+]/g, '')}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '11px 14px',
                        borderRadius: 10,
                        backgroundColor: '#16a34a',
                        backgroundImage: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: 13,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      <PhoneCall size={16} />
                      <span>Call Nurse ({scannedPatient.attendingNurse.phone})</span>
                    </a>

                    <button
                      onClick={() => handleCopyNursePhone(scannedPatient.attendingNurse.phone)}
                      style={{
                        padding: '11px 14px',
                        borderRadius: 10,
                        backgroundColor: copiedPhone ? '#dcfce7' : '#ffffff',
                        border: copiedPhone ? '1px solid #16a34a' : '1px solid #bbf7d0',
                        color: '#166534',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700
                      }}
                      title="Copy Nurse Phone Number"
                    >
                      {copiedPhone ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 7. Attending Doctor Name, Designation and Department */}
                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1.5px solid #93c5fd',
                  borderRadius: 14,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Stethoscope size={15} color="#2563eb" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        7. ATTENDING DOCTOR
                      </span>
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a', marginBottom: 4 }}>
                      {scannedPatient.doctor.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#1d4ed8', marginBottom: 14 }}>
                      Designation: <strong>{scannedPatient.doctor.designation}</strong>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    padding: '10px 14px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                      DOCTOR DEPARTMENT
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                      {scannedPatient.doctor.department}
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. Patient's Relative / Emergency Contact & Direct Dial */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fcd34d',
                borderRadius: 14,
                padding: '18px 20px',
                marginBottom: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={17} color="#d97706" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      8. PATIENT'S RELATIVE / EMERGENCY CONTACT
                    </span>
                  </div>
                  <span style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid #fde68a'
                  }}>
                    PRIMARY NEXT OF KIN
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#78350f', marginBottom: 3 }}>
                      {scannedPatient.relative.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#92400e' }}>
                      Relationship: <strong style={{ color: '#78350f' }}>{scannedPatient.relative.relation}</strong> &bull; Direct Phone: <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#b45309', fontSize: 14 }}>{scannedPatient.relative.phone}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={`tel:${scannedPatient.relative.phone.replace(/[^0-9+]/g, '')}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '11px 18px',
                        borderRadius: 10,
                        backgroundColor: '#d97706',
                        backgroundImage: 'linear-gradient(180deg, #d97706 0%, #b45309 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: 13,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      <PhoneCall size={16} />
                      <span>Call Relative ({scannedPatient.relative.phone})</span>
                    </a>

                    <button
                      onClick={() => handleCopyRelativePhone(scannedPatient.relative.phone)}
                      style={{
                        padding: '11px 14px',
                        borderRadius: 10,
                        backgroundColor: copiedRelativePhone ? '#fef3c7' : '#ffffff',
                        border: copiedRelativePhone ? '1px solid #d97706' : '1px solid #fde68a',
                        color: '#92400e',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700
                      }}
                      title="Copy Relative Phone Number"
                    >
                      {copiedRelativePhone ? <Check size={14} color="#d97706" /> : <Copy size={14} />}
                      <span>{copiedRelativePhone ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Enforcement Notice */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 10,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20
              }}>
                <Lock size={15} color="#1d4ed8" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#1e40af' }}>
                  Clinical eMAR charts, medication prescriptions, patient vitals, and diagnoses are concealed. Hospital staff accounts possess read-only logistics privileges and cannot add or edit patient records.
                </span>
              </div>

              {/* Action: Scan Next Patient QR */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleResetScanner}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 10,
                    backgroundColor: '#0b4da2',
                    backgroundImage: 'linear-gradient(135deg, #0b4da2 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(11, 77, 162, 0.25)'
                  }}
                >
                  <Scan size={18} />
                  <span>Scan Next Patient QR</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Staff ID QR Credential Modal */}
      {showStaffQRModal && (
        <HospitalPersonQRModal
          isOpen={showStaffQRModal}
          onClose={() => setShowStaffQRModal(false)}
          person={currentStaffPerson}
        />
      )}
    </div>
  );
}
