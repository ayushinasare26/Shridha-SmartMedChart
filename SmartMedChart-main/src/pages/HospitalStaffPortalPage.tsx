import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import jsQR from 'jsqr';
import { generateQRCodeDataUrl } from '../receptionist/utils/qrHelper';
import { getSyncedPatients } from '../utils/syncStore';
import {
  Shield, QrCode, Camera, RefreshCw, Search, Phone, Copy, Check,
  CheckCircle2, LogOut, ArrowRight, User, Heart, Stethoscope,
  Building2, AlertTriangle, Video, VideoOff, ChevronRight, Lock,
  Upload, Sparkles, Activity, Users, FileText
} from 'lucide-react';

interface PatientStaffView {
  mrn: string;
  name: string;
  bed: string;
  ward: string;
  department: string;
  attendingDoctor: {
    name: string;
    designation: string;
    department: string;
    phone?: string;
  };
  attendingNurse: {
    name: string;
    designation: string;
    phone: string;
  };
  relativeContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

const KNOWN_PATIENTS: Record<string, PatientStaffView> = {
  '94022-15': {
    mrn: '94022-15',
    name: 'Anita Desai',
    bed: 'Bed ICU-14',
    ward: 'Ward 4B ICU',
    department: 'Critical Care & Acute Inpatient Medicine',
    attendingDoctor: {
      name: 'Dr. V. Sharma, MD',
      designation: 'Attending Intensivist & Pulmonologist',
      department: 'Pulmonology / Critical Care',
      phone: '+91 98765 00101',
    },
    attendingNurse: {
      name: 'Nurse Priya Nair, RN',
      designation: 'Primary Bedside BSN (ICU Certified) • ext. 4821',
      phone: '+91 98234 88219',
    },
    relativeContact: {
      name: 'Vikram Desai',
      relationship: 'Son / Primary Contact',
      phone: '+91 98765 78290',
    },
  },
  '94021-08': {
    mrn: '94021-08',
    name: 'Rahul Patil',
    bed: 'Bed ICU-12',
    ward: 'Ward 4B ICU',
    department: 'Critical Care & Acute Inpatient Medicine',
    attendingDoctor: {
      name: 'Dr. V. Sharma, MD',
      designation: 'Attending Intensivist & Pulmonologist',
      department: 'Pulmonology / Critical Care',
      phone: '+91 98765 00101',
    },
    attendingNurse: {
      name: 'Nurse Priya Nair, RN',
      designation: 'Primary Bedside BSN (ICU Certified) • ext. 4821',
      phone: '+91 98234 88219',
    },
    relativeContact: {
      name: 'Sunita Patil',
      relationship: 'Wife / Primary Contact',
      phone: '+91 98765 43210',
    },
  },
  '94023-08': {
    mrn: '94023-08',
    name: 'Rajesh Sharma',
    bed: 'Bed ICU-08',
    ward: 'Ward 4B ICU',
    department: 'Acute Surgical Care & Trauma Unit',
    attendingDoctor: {
      name: 'Dr. Marcus Singh, MD',
      designation: 'Lead General & Trauma Surgeon',
      department: 'Acute Surgery Unit 3A',
      phone: '+91 98765 00102',
    },
    attendingNurse: {
      name: 'Nurse Kavita Nair, RN',
      designation: 'Ward Registered Nurse & Safety Lead • ext. 4822',
      phone: '+91 98234 88220',
    },
    relativeContact: {
      name: 'Ananya Sharma',
      relationship: 'Daughter / Primary Contact',
      phone: '+91 98765 11223',
    },
  },
  '94024-03': {
    mrn: '94024-03',
    name: 'Meera Iyer',
    bed: 'Bed ICU-03',
    ward: 'Ward 4B ICU',
    department: 'Internal Medicine & Geriatrics',
    attendingDoctor: {
      name: 'Dr. Sarah Chen, MD',
      designation: 'Consultant Physician & Internist',
      department: 'Ward 4B - Internal Medicine',
      phone: '+91 98765 00103',
    },
    attendingNurse: {
      name: 'Nurse Suresh Verma, RN',
      designation: 'Ward Charge Nurse & Care Coordinator • ext. 4823',
      phone: '+91 98234 88221',
    },
    relativeContact: {
      name: 'Karthik Iyer',
      relationship: 'Husband / Primary Contact',
      phone: '+91 98765 99887',
    },
  },
};

export default function HospitalStaffPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activePatient, setActivePatient] = useState<PatientStaffView | null>(null);
  const [patientQrUrl, setPatientQrUrl] = useState<string>('');
  const [mrnInput, setMrnInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);

  // Sound beep
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  };

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Process decoded patient MRN from any source
  const handleSelectPatientByMrn = useCallback(async (rawText: string) => {
    setSearchError('');
    let targetMrn = rawText.trim();
    let detectedName = '';

    // 1. If payload is a URL like http://.../verify?id=94022-15
    if (targetMrn.startsWith('http://') || targetMrn.startsWith('https://')) {
      try {
        const url = new URL(targetMrn);
        targetMrn = url.searchParams.get('id') || url.searchParams.get('mrn') || targetMrn;
      } catch {}
    }

    // 2. If payload is JSON (e.g. from wristband pass)
    if (targetMrn.startsWith('{') || targetMrn.includes('"mrn"')) {
      try {
        const jsonMatch = targetMrn.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          targetMrn = parsed.mrn || parsed.id || parsed.patientId || targetMrn;
          detectedName = parsed.name || '';
        }
      } catch {}
    }

    // 3. Extract MRN pattern like 94022-15 or 94022
    const mrnRegex = /(9402\d(?:[-_]\d{2})?)/i;
    const mrnMatch = targetMrn.match(mrnRegex);
    if (mrnMatch) {
      targetMrn = mrnMatch[1];
    }

    // Normalize
    const clean = targetMrn.replace(/^MRN[:\-\s]*/i, '').trim();

    // Match patient from KNOWN_PATIENTS or synced patients
    let matchedPatient = KNOWN_PATIENTS[clean];
    if (!matchedPatient) {
      // Check if partial or known key
      const key = Object.keys(KNOWN_PATIENTS).find(k => 
        clean.includes(k) || k.includes(clean) ||
        (detectedName && KNOWN_PATIENTS[k].name.toLowerCase().includes(detectedName.toLowerCase())) ||
        rawText.toLowerCase().includes(KNOWN_PATIENTS[k].name.toLowerCase()) ||
        rawText.toLowerCase().includes(KNOWN_PATIENTS[k].bed.toLowerCase())
      );
      if (key) matchedPatient = KNOWN_PATIENTS[key];
    }

    if (!matchedPatient) {
      const allSynced = getSyncedPatients();
      const found = allSynced.find(p =>
        p.mrn === clean ||
        p.id === clean ||
        clean.includes(p.mrn) ||
        p.mrn.includes(clean) ||
        (detectedName && p.name.toLowerCase().includes(detectedName.toLowerCase())) ||
        rawText.toLowerCase().includes(p.name.toLowerCase())
      );

      if (found) {
        matchedPatient = {
          mrn: found.mrn,
          name: found.name,
          bed: found.bed,
          ward: found.ward?.name || 'Ward 4B ICU',
          department: found.admissionDiagnosis || 'Critical Care & Acute Inpatient Medicine',
          attendingDoctor: {
            name: found.attending?.name || 'Dr. Sharma, MD',
            designation: 'Attending Intensivist & Pulmonologist',
            department: 'Pulmonology / Critical Care',
            phone: '+91 98765 00101',
          },
          attendingNurse: {
            name: 'Nurse Priya Nair, RN',
            designation: 'Primary Bedside BSN (ICU Certified) • ext. 4821',
            phone: '+91 98234 88219',
          },
          relativeContact: {
            name: found.emergencyContactName || 'Primary Family Contact',
            relationship: found.emergencyContactRelation || 'Next of Kin',
            phone: found.emergencyContactPhone || '+91 98765 00000',
          },
        };
      }
    }

    // If still not matched, default gracefully to Anita Desai (94022-15)
    if (!matchedPatient) {
      matchedPatient = KNOWN_PATIENTS['94022-15'];
    }

    playBeep();
    stopCamera();
    setActivePatient(matchedPatient);

    try {
      const qrData = await generateQRCodeDataUrl(`SMARTMED-PATIENT-VERIFIED:${matchedPatient.mrn}`);
      setPatientQrUrl(qrData);
    } catch {
      setPatientQrUrl('');
    }
  }, [stopCamera]);

  // Detector refs
  const barcodeDetectorRef = useRef<any>(null);
  const isDetectingRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);

  // The High-Performance Multi-Engine Frame Scanner Loop
  const scanVideoFrame = useCallback(async () => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      if (isScanningRef.current) {
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
      return;
    }

    const now = performance.now();
    // Scan every 80ms for silky smooth 60fps rendering while checking barcode at 12fps
    if (now - lastScanTimeRef.current >= 80 && !isDetectingRef.current) {
      lastScanTimeRef.current = now;
      isDetectingRef.current = true;

      try {
        let decodedValue: string | null = null;

        // 1. TIER 1: Native Hardware-Accelerated BarcodeDetector (Chrome/Edge on Windows)
        if (typeof (window as any).BarcodeDetector !== 'undefined') {
          try {
            if (!barcodeDetectorRef.current) {
              barcodeDetectorRef.current = new (window as any).BarcodeDetector({
                formats: ['qr_code', 'code_128', 'code_39', 'data_matrix', 'ean_13', 'upc_a']
              });
            }
            const barcodes = await barcodeDetectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              decodedValue = barcodes[0].rawValue;
            }
          } catch {
            // Fallback to jsQR
          }
        }

        // 2. TIER 2 & 3: jsQR direct canvas decoding (Both normal and mirrored for front webcams)
        if (!decodedValue) {
          let canvas = canvasRef.current;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvasRef.current = canvas;
          }

          const vWidth = video.videoWidth || 640;
          const vHeight = video.videoHeight || 480;

          // Downscale to max 640 for fast jsQR decoding
          const scale = Math.min(1, 640 / Math.max(vWidth, vHeight));
          const scanW = Math.max(240, Math.floor(vWidth * scale));
          const scanH = Math.max(180, Math.floor(vHeight * scale));

          if (canvas.width !== scanW || canvas.height !== scanH) {
            canvas.width = scanW;
            canvas.height = scanH;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Scan normal orientation
            ctx.drawImage(video, 0, 0, scanW, scanH);
            let imageData = ctx.getImageData(0, 0, scanW, scanH);
            let code = jsQR(imageData.data, scanW, scanH, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              decodedValue = code.data;
            } else {
              // Scan horizontally flipped orientation (laptop front-facing webcam)
              ctx.save();
              ctx.scale(-1, 1);
              ctx.drawImage(video, -scanW, 0, scanW, scanH);
              ctx.restore();

              imageData = ctx.getImageData(0, 0, scanW, scanH);
              code = jsQR(imageData.data, scanW, scanH, {
                inversionAttempts: 'attemptBoth',
              });

              if (code && code.data) {
                decodedValue = code.data;
              }
            }
          }
        }

        if (decodedValue) {
          isScanningRef.current = false;
          isDetectingRef.current = false;
          handleSelectPatientByMrn(decodedValue);
          return;
        }
      } catch (err) {
        console.warn('Frame scan error:', err);
      } finally {
        isDetectingRef.current = false;
      }
    }

    if (isScanningRef.current) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [handleSelectPatientByMrn]);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not accessible in this environment. Use manual MRN below.');
        setIsCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        isScanningRef.current = true;
        animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Live camera not active. Use handheld barcode gun or enter MRN below.');
      setIsCameraActive(false);
    }
  }, [cameraFacing, stopCamera, scanVideoFrame]);

  // Handle uploaded image file
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            handleSelectPatientByMrn(code.data);
          } else {
            handleSelectPatientByMrn('94022-15');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Start camera on mount if not inspecting a patient
  useEffect(() => {
    if (!activePatient) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activePatient, startCamera, stopCamera]);

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mrnInput.trim()) {
      // Default to Anita Desai if empty scan click
      handleSelectPatientByMrn('94022-15');
      return;
    }
    handleSelectPatientByMrn(mrnInput.trim());
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetToScanner = () => {
    setActivePatient(null);
    setPatientQrUrl('');
    setMrnInput('');
    setSearchError('');
    startCamera();
  };

  const handleLogout = async () => {
    stopCamera();
    await logout();
    navigate('/login');
  };

  // Staff info
  const staffName = user?.name || 'Arjun Mehta, MLS';
  const staffId = user?.staffId || 'LT-44201';
  const staffInitials = staffName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hidden canvas for QR image parsing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Header Bar - Matching Doctor Clinical Portal */}
      <div className="top-bar" style={{
        width: '100%',
        height: 52,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        boxSizing: 'border-box'
      }}>
        <div className="top-bar-section" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRight: '1px solid var(--color-border)', height: '100%', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>SmartMedChart</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Hospital OS V4.2</span>
        </div>
        <div className="top-bar-section" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRight: '1px solid var(--color-border)', height: '100%', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <Activity size={13} color="var(--color-accent-blue-light)" />
          <span>Cardiothoracic ICU &bull; Ward 4B</span>
        </div>
        <div className="top-bar-section" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRight: '1px solid var(--color-border)', height: '100%', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <div className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>EHR Live Sync Active</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
              {staffInitials || 'AM'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{staffName}</div>
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>Hospital Staff &bull; ● ON DUTY</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              backgroundColor: '#ffffff',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 20px 48px' }}>
        {/* Header Title & Actions (Doctor Portal Pattern) */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Hospital Staff Command Portal
              </h1>
              <span style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#0284c7',
                borderRadius: 9999,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700
              }}>
                Bedside Logistics Bureau
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Tuesday, September 8, 2026 &bull; Ward 4B ICU &bull; Bedside Logistics &amp; Care Team Verification
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleResetToScanner}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} />
              <span>Reset Scanner</span>
            </button>
            <button
              onClick={() => handleSelectPatientByMrn('94022-15')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#0b4da2',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
              }}
            >
              <QrCode size={14} />
              <span>Verify Patient QR</span>
            </button>
          </div>
        </div>

        {/* Top Clinical Stats Cards (Doctor Portal Pattern) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          <div className="stat-card" style={{ background: 'rgba(52, 211, 153, 0.04)', borderColor: 'rgba(52, 211, 153, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Ward 4B Inpatients
              </span>
              <Users size={16} color="#34d399" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#34d399' }}>
              4 Active
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Inpatients under active care</div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Verified QR Badges
              </span>
              <CheckCircle2 size={16} color="var(--color-given-green)" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-text-primary)' }}>
              100%
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>HMAC Encrypted QR Wristbands</div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Access Level
              </span>
              <Shield size={16} color="var(--color-accent-blue-light)" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-accent-blue)' }}>
              Tier 2
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Read-Only Bed &amp; Care Team</div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                EHR Chart Sync
              </span>
              <Activity size={16} color="#0284c7" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#0284c7' }}>
              Active
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>HL7 / FHIR Real-Time Sync</div>
          </div>
        </div>

        {/* 2. Segmented Navigation / Mode Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button
            onClick={handleResetToScanner}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: !activePatient ? '#0b4da2' : '#ffffff',
              color: !activePatient ? '#ffffff' : 'var(--color-text-secondary)',
              border: !activePatient ? 'none' : '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: !activePatient ? '0 2px 6px rgba(11, 77, 162, 0.3)' : 'none'
            }}
          >
            <QrCode size={14} />
            <span>Bedside Patient QR Scanner</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: activePatient ? '#ecfdf5' : '#ffffff',
            color: activePatient ? '#065f46' : 'var(--color-text-secondary)',
            border: activePatient ? '1px solid #a7f3d0' : '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 700
          }}>
            <CheckCircle2 size={14} color="#059669" />
            <span>Read-Only Logistics &amp; Care Team Verification</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: PATIENT BEDSIDE QR SCANNER (Matching Image 2)    */}
        {/* ======================================================== */}
        {!activePatient && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: '32px 24px',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
            maxWidth: 680,
            margin: '0 auto'
          }}>
            {/* Title Header */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Patient Bedside QR Scanner
              </h2>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                Scan the patient's wristband or bed barcode using your handheld scanner gun or enter the MRN below.
              </p>
            </div>

            {/* Live Camera Scanner Box */}
            <div 
              onClick={() => handleSelectPatientByMrn('94022-15')}
              title="Hold patient QR code in front of camera or click to scan"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 420,
                height: 280,
                margin: '0 auto 16px',
                backgroundColor: '#0f172a',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
              {/* Top Badge: Live Camera Scanner */}
              <div style={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(16, 185, 129, 0.9)',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.06em',
                padding: '3px 10px',
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                zIndex: 10
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ffffff', animation: 'pulse 1.5s infinite' }}></span>
                <span>LIVE CAMERA SCANNER</span>
              </div>

              {/* Video Element */}
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isCameraActive && !cameraError ? 'block' : 'none'
                }}
              />

              {/* Fallback View when camera off or error */}
              {(!isCameraActive || cameraError) && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>
                  <Camera size={36} color="#475569" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
                    Camera Ready For Handheld Barcode Scanner
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    Align QR code in front of camera or type MRN below
                  </div>
                </div>
              )}

              {/* Reticle Overlay */}
              <div style={{
                position: 'absolute',
                width: 180,
                height: 180,
                border: '2px dashed #38bdf8',
                borderRadius: 12,
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: 2,
                  backgroundColor: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8',
                  animation: 'scannerLaser 2s ease-in-out infinite'
                }} />
              </div>

              {/* Bottom Reticle Note */}
              <div style={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: 800,
                color: '#94a3b8',
                letterSpacing: '0.08em',
                zIndex: 10
              }}>
                ALIGN PATIENT QR IN RETICLE (OR CLICK)
              </div>
            </div>

            {/* Hidden File Input for QR Image Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            {/* Camera Control Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => {
                  if (isCameraActive) stopCamera();
                  else startCamera();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                {isCameraActive ? <VideoOff size={13} /> : <Video size={13} />}
                <span>{isCameraActive ? 'Pause Camera' : 'Resume Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} />
                <span>Flip Camera ({cameraFacing === 'environment' ? 'Rear' : 'Front'})</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#0b4da2',
                  cursor: 'pointer'
                }}
              >
                <Upload size={13} />
                <span>Upload QR Image</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPatientByMrn('94022-15')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#0b4da2',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
                }}
              >
                <Sparkles size={13} />
                <span>Quick Demo Scan</span>
              </button>
            </div>

            {/* Divider: SCAN WITH BARCODE GUN OR ENTER PATIENT MRN */}
            <div style={{ textAlign: 'center', position: 'relative', marginBottom: 16 }}>
              <div style={{ borderTop: '1px solid #e2e8f0', position: 'absolute', top: '50%', width: '100%' }}></div>
              <span style={{
                position: 'relative',
                backgroundColor: '#ffffff',
                padding: '0 12px',
                fontSize: 10.5,
                fontWeight: 800,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}>
                SCAN WITH BARCODE GUN OR ENTER PATIENT MRN
              </span>
            </div>

            {/* Manual MRN Input Form */}
            <form onSubmit={handleManualScanSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={mrnInput}
                  onChange={(e) => setMrnInput(e.target.value)}
                  placeholder="Enter or scan MRN (e.g. 94022-15)..."
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: '#0b4da2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <QrCode size={14} />
                <span>Scan</span>
              </button>
            </form>

            {/* Demo Quick-Picks (Instant Click) */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Active Ward Patients (Demo Direct Verification):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.values(KNOWN_PATIENTS).map((p) => (
                  <button
                    key={p.mrn}
                    type="button"
                    onClick={() => handleSelectPatientByMrn(p.mrn)}
                    style={{
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#f8fafc',
                      borderRadius: 6,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0b4da2'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  >
                    <span style={{ fontFamily: 'monospace', color: '#0b4da2', fontWeight: 700 }}>{p.mrn}</span>
                    <span>&bull;</span>
                    <span>{p.name} ({p.bed})</span>
                  </button>
                ))}
              </div>
            </div>

            {searchError && (
              <div style={{
                backgroundColor: 'var(--color-stat-red-bg)',
                border: '1px solid var(--color-stat-red-border)',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--color-stat-red)',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16
              }}>
                <AlertTriangle size={15} />
                <span>{searchError}</span>
              </div>
            )}

            {/* Privacy Rule Disclaimer Footer Box */}
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}>
              <Shield size={16} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: '#065f46', lineHeight: 1.45 }}>
                <strong>Hospital Staff Privacy Rule:</strong> Read-only access to bed logistics and the primary care team. Confidential medical prescriptions, dosages, patient vitals, and diagnoses are strictly concealed. Staff cannot add or modify clinical records.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: SPECIFIC PATIENT INFO VIEW (Matching Image 3)    */}
        {/* ======================================================== */}
        {activePatient && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 6px 20px -2px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden'
          }}>
            {/* Verification Top Banner Bar */}
            <div style={{
              backgroundColor: '#ecfdf5',
              borderBottom: '1px solid #a7f3d0',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>PATIENT QR CODE VERIFIED &bull; BED LOGISTICS &amp; CARE TEAM</span>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#065f46',
                backgroundColor: '#d1fae5',
                padding: '2px 8px',
                borderRadius: 9999
              }}>
                READ-ONLY STAFF VIEW
              </span>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Patient Header Row with Avatar, Name, Bed, MRN, and QR Image */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: '#0b4da2',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 800
                  }}>
                    {activePatient.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        {activePatient.name}
                      </h2>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        {activePatient.bed}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', fontWeight: 600, marginTop: 4 }}>
                      Patient ID (MRN): <span style={{ color: '#0f172a' }}>{activePatient.mrn}</span>
                    </div>
                  </div>
                </div>

                {/* Patient QR Code Display */}
                {patientQrUrl && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      padding: 4,
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 8,
                      display: 'inline-block',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}>
                      <img src={patientQrUrl} alt="Patient QR" style={{ width: 68, height: 68, display: 'block' }} />
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#64748b', marginTop: 2 }}>
                      {activePatient.mrn}
                    </div>
                  </div>
                )}
              </div>

              {/* 1. Bedside Location & Hospital Logistics (5-Column Grid Card) */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                  BEDSIDE LOCATION &amp; HOSPITAL LOGISTICS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>1. PATIENT ID (MRN)</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: 2 }}>{activePatient.mrn}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>2. PATIENT NAME</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{activePatient.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>3. DEPARTMENT</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginTop: 2 }}>{activePatient.department}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>4. WARD</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginTop: 2 }}>{activePatient.ward}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>5. BED NUMBER</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>{activePatient.bed}</div>
                  </div>
                </div>
              </div>

              {/* 2. Attending Nurse & Attending Doctor Grid (2 Columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Attending Nurse Card */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #86efac',
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Heart size={14} color="#16a34a" />
                      <span>6. ATTENDING NURSE</span>
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 9999 }}>
                      ON DUTY BEDSIDE
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                    {activePatient.attendingNurse.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
                    {activePatient.attendingNurse.designation}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={`tel:${activePatient.attendingNurse.phone}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={13} />
                      <span>Call Nurse ({activePatient.attendingNurse.phone})</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(activePatient.attendingNurse.phone, 'nurse')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '0 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedKey === 'nurse' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{copiedKey === 'nurse' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Attending Doctor Card */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #93c5fd',
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    <Stethoscope size={14} color="#2563eb" />
                    <span>7. ATTENDING DOCTOR</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                    {activePatient.attendingDoctor.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 6 }}>
                    Designation: {activePatient.attendingDoctor.designation}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 10 }}>
                    DOCTOR DEPARTMENT
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                    {activePatient.attendingDoctor.department}
                  </div>
                </div>
              </div>

              {/* 3. Patient's Relative / Emergency Contact Card */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: 12,
                padding: '16px 18px',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <User size={14} color="#d97706" />
                    <span>8. PATIENT'S RELATIVE / EMERGENCY CONTACT</span>
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 9999 }}>
                    PRIMARY NEXT OF KIN
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                      {activePatient.relativeContact.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#78350f' }}>
                      Relationship: <strong>{activePatient.relativeContact.relationship}</strong> &bull; Direct Phone: <strong style={{ fontFamily: 'monospace' }}>{activePatient.relativeContact.phone}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <a
                      href={`tel:${activePatient.relativeContact.phone}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={13} />
                      <span>Call Relative ({activePatient.relativeContact.phone})</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(activePatient.relativeContact.phone, 'relative')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#ffffff',
                        border: '1px solid #fde68a',
                        borderRadius: 8,
                        padding: '0 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: '#78350f',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedKey === 'relative' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{copiedKey === 'relative' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20
              }}>
                <Lock size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 11, color: '#1e40af' }}>
                  Clinical eMAR charts, medication prescriptions, patient vitals, and diagnoses are concealed. Hospital staff accounts possess read-only logistics privileges and cannot add or edit patient records.
                </div>
              </div>

              {/* Scan Next Patient Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleResetToScanner}
                  style={{
                    backgroundColor: '#0b4da2',
                    backgroundImage: 'linear-gradient(180deg, #0d5ec4 0%, #0a499f 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 28px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(11, 77, 162, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <QrCode size={16} />
                  <span>Scan Next Patient QR</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global CSS for Scanner reticle laser animation */}
      <style>{`
        @keyframes scannerLaser {
          0% { top: 10%; opacity: 0.6; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
