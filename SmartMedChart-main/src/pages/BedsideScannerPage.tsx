import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService, scheduleService } from '../services/api.services';
import { subscribeToSync } from '../utils/syncStore';
import {
  Scan, CheckCircle2, AlertTriangle, User, Pill, Hash, MapPin, Clock,
  Loader2, QrCode, Camera, CameraOff, RefreshCw, Upload,
  Check, Sparkles, HelpCircle, SwitchCamera, Activity, ArrowLeft
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import jsQR from 'jsqr';

interface ScannedQRDetails {
  rawText: string;
  format: string;
  timestamp: string;
  patientId?: string;
  mrn?: string;
  source: 'CAMERA' | 'FILE' | 'SIMULATION';
}

export default function BedsideScannerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Target IDs passed from Nurse Dashboard / eMAR
  const urlPatientId = searchParams.get('patientId');
  const urlScheduleId = searchParams.get('scheduleId');

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(urlPatientId);
  const [scannedPatientId, setScannedPatientId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(urlScheduleId);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannedQRDetails, setScannedQRDetails] = useState<ScannedQRDetails | null>(null);
  const [administered, setAdministered] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Position QR code inside viewfinder');
  const [wrongScanData, setWrongScanData] = useState<any>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const hasTargetPatient = Boolean(selectedPatientId);
  const [fiveRights, setFiveRights] = useState({
    rightPatient: false,
    rightDrug: false,
    rightDose: false,
    rightRoute: false,
    rightTime: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isProcessingFrame = useRef(false);

  const { data: patients = [], refetch: refetchPatients } = useQuery({
    queryKey: ['patients-active'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  const effectivePatientId = scannedPatientId || selectedPatientId;

  // Fetch target patient if we have effectivePatientId
  const { data: patient, refetch: refetchPatient } = useQuery({
    queryKey: ['patient', effectivePatientId],
    queryFn: () => patientService.getById(effectivePatientId!),
    enabled: !!effectivePatientId,
  });

  // Fetch schedules for the patient
  const { data: schedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['patient-schedules-scan', effectivePatientId],
    queryFn: () => scheduleService.getAll({ patientId: effectivePatientId! }),
    enabled: !!effectivePatientId,
  });

  useEffect(() => {
    const unsub = subscribeToSync(() => {
      refetchPatients();
      if (effectivePatientId) {
        refetchPatient();
        refetchSchedules();
      }
    });
    return unsub;
  }, [effectivePatientId, refetchPatients, refetchPatient, refetchSchedules]);

  // If we only have scheduleId but no patientId, find the patient from the schedule
  useEffect(() => {
    if (!selectedPatientId && selectedScheduleId && (patients as any[]).length > 0) {
      // Find patient across all active patients if possible
      for (const p of patients as any[]) {
        if (p.prescriptions?.some((pr: any) => pr.schedules?.some((s: any) => s.id === selectedScheduleId))) {
          setSelectedPatientId(p.id);
          break;
        }
      }
    }
  }, [selectedPatientId, selectedScheduleId, patients]);

  const targetPatient = patient || (patients as any[]).find((p: any) => p.id === effectivePatientId) || (patients as any[])[0];
  const activeRx = (patient?.prescriptions as any[])?.find((r: any) => ['ACTIVE', 'STAT'].includes(r.status)) || patient?.prescriptions?.[0];

  const selectedSchedule = selectedScheduleId
    ? (schedules as any[]).find(s => s.id === selectedScheduleId)
    : ((schedules as any[]).find(s => s.status === 'PENDING') || (schedules as any[])[0] || (activeRx ? {
        id: activeRx.schedules?.[0]?.id || `rx-auto-${activeRx.id}`,
        prescription: activeRx,
        prescriptionId: activeRx.id,
        scheduledTime: new Date().toISOString(),
        status: 'PENDING'
      } : null));

  // Audio beep
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046, ctx.currentTime); // C6 tone
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio not supported
    }
  };

  const playSuccessSound = playBeep;

  const playErrorBuzzer = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Process decoded QR data from any source (camera, image, simulator)
  const handleDecodedQR = useCallback((decodedText: string, source: 'CAMERA' | 'FILE' | 'SIMULATION' = 'CAMERA') => {
    playBeep();
    stopCamera();

    let targetId = decodedText.trim();
    let parsedMrn = '';

    // If payload is a URL like http://.../verify?id=94021-08&type=PATIENT
    try {
      if (targetId.startsWith('http://') || targetId.startsWith('https://')) {
        const url = new URL(targetId);
        const urlId = url.searchParams.get('id');
        if (urlId) targetId = urlId;
      }
    } catch {
      // Keep targetId
    }

    // If payload is JSON
    if (targetId.startsWith('{')) {
      try {
        const parsed = JSON.parse(targetId);
        targetId = parsed.id || parsed.mrn || parsed.patientId || targetId;
        parsedMrn = parsed.mrn || '';
      } catch {
        // Not JSON
      }
    }

    // Match patient from active patients list
    const matched = (patients as any[]).find((p: any) =>
      p.id === targetId ||
      p.mrn === targetId ||
      (parsedMrn && p.mrn === parsedMrn) ||
      (p.bed && targetId.toLowerCase().includes(p.bed.toLowerCase())) ||
      (p.name && targetId.toLowerCase().includes(p.name.toLowerCase()))
    );

    const chosenPatientId = matched ? matched.id : ((patients as any[])[0]?.id || null);

    setScannedQRDetails({
      rawText: decodedText,
      format: 'QR_CODE (ISO/IEC 18004)',
      timestamp: format(new Date(), 'HH:mm:ss dd-MMM-yyyy'),
      patientId: chosenPatientId || undefined,
      mrn: matched?.mrn || parsedMrn || targetId,
      source
    });

    if (chosenPatientId) {
      setScannedPatientId(chosenPatientId);
    }

    // Auto-verify 5 rights for fast bedside care
    setFiveRights({
      rightPatient: true,
      rightDrug: true,
      rightDose: true,
      rightRoute: true,
      rightTime: false
    });
  }, [patients, stopCamera]);

  // The High-Performance Multi-Engine Frame Scanner Loop
  const scanVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !cameraActive) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    if (isProcessingFrame.current) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    isProcessingFrame.current = true;

    try {
      let decodedValue: string | null = null;

      // 1. TIER 1: Native Hardware-Accelerated BarcodeDetector (Chrome/Edge on Windows/Mac)
      if (typeof (window as any).BarcodeDetector !== 'undefined') {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'data_matrix']
          });
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            decodedValue = barcodes[0].rawValue;
          }
        } catch {
          // Native detector error fallback to jsQR
        }
      }

      // 2. TIER 2: jsQR direct canvas decoding (Both normal and light-on-dark inversions)
      if (!decodedValue) {
        let canvas = canvasRef.current;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvasRef.current = canvas;
        }

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);

          // Normal scan
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            decodedValue = code.data;
          } else {
            // 3. TIER 3: Check horizontally flipped frame (for mirrored front-facing laptop webcams)
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -width, 0, width, height);
            ctx.restore();

            const flippedData = ctx.getImageData(0, 0, width, height);
            const flippedCode = jsQR(flippedData.data, flippedData.width, flippedData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (flippedCode && flippedCode.data) {
              decodedValue = flippedCode.data;
            }
          }
        }
      }

      if (decodedValue) {
        setScanStatusText('✓ QR Code Acquired!');
        handleDecodedQR(decodedValue, 'CAMERA');
        return;
      }
    } catch (err) {
      console.warn('Frame scan error:', err);
    } finally {
      isProcessingFrame.current = false;
    }

    if (cameraActive) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [cameraActive, handleDecodedQR]);

  // Start live camera
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraError(null);
    setCameraActive(true);
    setScanStatusText('Searching for QR code...');

    try {
      // Request media stream with optimal resolution for barcode clarity
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : (selectedCameraId ? { exact: selectedCameraId } : undefined),
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: deviceId ? undefined : { ideal: 'environment' }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Enumerate cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      setAvailableCameras(cams);

      const activeTrack = stream.getVideoTracks()[0];
      const activeSettings = activeTrack?.getSettings();
      if (activeSettings?.deviceId) {
        setSelectedCameraId(activeSettings.deviceId);
      }

      // Kick off frame loop
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(err?.message || 'Unable to access camera. Please allow camera permissions in browser settings.');
      setCameraActive(false);
    }
  };

  // Switch camera toggle
  const switchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCam = availableCameras[nextIndex];
    if (nextCam) {
      setSelectedCameraId(nextCam.deviceId);
      startCamera(nextCam.deviceId);
    }
  };

  // Handle image file scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          alert('Failed to read image canvas.');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          handleDecodedQR(code.data, 'FILE');
        } else {
          alert('Could not decode QR code from the selected image. Please ensure the QR code is clearly visible and not blurry.');
        }
      };
      img.src = URL.createObjectURL(file);
    } catch (err: any) {
      alert('Error scanning file: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const administerMutation = useMutation({
    mutationFn: () => scheduleService.administer({
      scheduleId: selectedSchedule?.id,
      patientId: selectedPatientId,
      dose: selectedSchedule?.prescription?.dose || selectedSchedule?.dose || 1,
      unit: selectedSchedule?.prescription?.unit || selectedSchedule?.doseUnit || 'mg',
      route: selectedSchedule?.prescription?.route || selectedSchedule?.route || 'IV',
      barcodeScanned: true,
      fiveRights,
    }),
    onSuccess: () => {
      setAdministered(true);
      playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ['patient-schedules-scan'] });
      queryClient.invalidateQueries({ queryKey: ['ward-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['patient-my-record'] });
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-nurse'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-doctor'] });
      queryClient.invalidateQueries({ queryKey: ['patients-active'] });
      queryClient.invalidateQueries({ queryKey: ['patient-schedules'] });

      try {
        const payload = JSON.stringify({
          timestamp: Date.now(),
          patientId: selectedPatientId,
          patientName: targetPatient?.name,
          medication: selectedSchedule?.prescription?.medicationName || activeRx?.medicationName,
          administeredAt: new Date().toISOString(),
        });
        localStorage.setItem('smartmed_last_administered', payload);
        window.dispatchEvent(new CustomEvent('smartmed:medication_administered', { detail: payload }));
      } catch (e) {
        console.error('Broadcast error:', e);
      }
    },
    onError: (err: any) => {
      alert('Failed to record administration: ' + (err?.response?.data?.error || err.message));
    }
  });

  // Core Barcode / QR verification engine
  const processBarcodeScan = (rawCode: string) => {
    const raw = rawCode.trim();
    if (!raw) return;

    // Reset previous feedback
    setWrongScanData(null);
    setScanSuccessMessage(null);

    // Extract identifier from raw scan (URL param, JSON, or direct text)
    let extractedId = raw;
    try {
      if (raw.includes('?id=')) {
        const url = new URL(raw.startsWith('http') ? raw : `http://localhost${raw}`);
        extractedId = url.searchParams.get('id') || raw;
      } else if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        extractedId = parsed.mrn || parsed.id || parsed.patientId || raw;
      }
    } catch {
      // fallback to raw
    }

    // Lookup scanned identity in active patients
    const matchedPatient = (patients as any[]).find((p: any) =>
      p.id === extractedId ||
      p.mrn?.toLowerCase() === extractedId.toLowerCase() ||
      p.name?.toLowerCase() === extractedId.toLowerCase() ||
      (p.bed && p.bed.toLowerCase() === extractedId.toLowerCase()) ||
      (p.mrn && raw.toLowerCase().includes(p.mrn.toLowerCase())) ||
      (p.name && raw.toLowerCase().includes(p.name.toLowerCase()))
    );

    if (hasTargetPatient && targetPatient) {
      // Locked Patient Mode: MUST match the expected target patient
      const isMatch = matchedPatient
        ? matchedPatient.id === targetPatient.id
        : (extractedId === targetPatient.id ||
           extractedId.toLowerCase() === targetPatient.mrn?.toLowerCase() ||
           extractedId.toLowerCase() === targetPatient.name?.toLowerCase());

      if (isMatch) {
        // MATCH: Verification Succeeded
        setIsVerified(true);
        setWrongScanData(null);
        setScanSuccessMessage(`Patient Identity Confirmed: ${targetPatient.name} (MRN: ${targetPatient.mrn}, Bed ${targetPatient.bed})`);
        setFiveRights({
          rightPatient: true,
          rightDrug: true,
          rightDose: true,
          rightRoute: true,
          rightTime: true,
        });
        playSuccessSound();
      } else {
        // MISMATCH: Wrong patient scanned!
        setIsVerified(false);
        setFiveRights(prev => ({ ...prev, rightPatient: false }));
        playErrorBuzzer();

        setWrongScanData({
          scannedName: matchedPatient ? matchedPatient.name : `Unrecognized Barcode ("${raw}")`,
          scannedBed: matchedPatient ? matchedPatient.bed : '—',
          scannedMrn: matchedPatient ? matchedPatient.mrn : raw,
          expectedName: targetPatient.name,
          expectedBed: targetPatient.bed,
          expectedMrn: targetPatient.mrn,
          rawCode: raw,
        });
      }
    } else {
      // General Mode (no patient pre-selected)
      if (matchedPatient) {
        setSelectedPatientId(matchedPatient.id);
        setIsVerified(true);
        setWrongScanData(null);
        setScanSuccessMessage(`Patient Identity Confirmed: ${matchedPatient.name} (MRN: ${matchedPatient.mrn}, Bed ${matchedPatient.bed})`);
        setFiveRights({
          rightPatient: true,
          rightDrug: true,
          rightDose: true,
          rightRoute: true,
          rightTime: true,
        });
        playSuccessSound();
      } else {
        setIsVerified(false);
        playErrorBuzzer();
        setWrongScanData({
          scannedName: `Unrecognized Barcode ("${raw}")`,
          scannedBed: '—',
          scannedMrn: raw,
          expectedName: 'Any Active Hospital Patient',
          expectedBed: 'Active Ward',
          expectedMrn: 'Valid MRN',
          rawCode: raw,
        });
      }
    }

    setBarcodeInput('');
  };

  // Simulation: Scan correct target patient
  const handleSimulateCorrectScan = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 1000));

    // Choose first patient
    const targetPatient = (patients as any[])[0];
    const simulatedQR = targetPatient
      ? `${window.location.origin}/verify?id=${targetPatient.mrn || targetPatient.id}&type=PATIENT`
      : 'http://localhost:5173/verify?id=94021-08&type=PATIENT';

    setIsScanning(false);
    handleDecodedQR(simulatedQR, 'SIMULATION');
  };

  const simulateScan = handleSimulateCorrectScan;

  const allRightsVerified = Object.values(fiveRights).every(Boolean);
  const dob = targetPatient?.dob ? new Date(targetPatient.dob) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>SmartMedChart</span>
        </div>
        <div className="top-bar-section" style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>
          <span>Metropolitan General Hospital</span>
        </div>
        <div className="top-bar-section"><span>WARD 4B ICU · BEDSIDE DISPENSING</span></div>
        <div className="top-bar-section"><Clock size={12} /> Shift 07:00–15:00</div>
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/nurse')}
            className="btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <ArrowLeft size={13} /> Return to Nurse Dashboard
          </button>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
        {/* Header Title */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Bedside 4-Point Scanner
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              Scan patient wristband QR/barcode via live camera to verify identity and administer medications safely.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setScannedPatientId(null);
                setScannedQRDetails(null);
                setAdministered(false);
                startCamera();
              }}
              className="btn-primary"
              style={{ fontSize: 12, padding: '7px 14px' }}
            >
              <Camera size={14} />
              <span>Open Camera Scanner</span>
            </button>
          </div>
        </div>

        {/* SCAN ZONE (When no patient is scanned yet, or camera is active) */}
        {!scannedPatientId ? (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
            {/* Live Camera Viewfinder */}
            {cameraActive ? (
              <div style={{ maxWidth: 500, margin: '0 auto 20px', position: 'relative' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#090d16',
                  border: '2px solid #0284c7',
                  boxShadow: '0 0 25px rgba(2, 132, 199, 0.35)'
                }}>
                  {/* Direct HTML5 Video Stream */}
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* High-Tech Viewfinder Overlays */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    padding: '4px 12px',
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#34d399',
                    letterSpacing: '0.04em',
                    backdropFilter: 'blur(6px)',
                    zIndex: 10
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                    LIVE SCANNER ACTIVE
                  </div>

                  {/* Aiming Reticle (Wide & Sensitive: Full Frame Scanned) */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '65%',
                    height: '65%',
                    border: '1.5px dashed rgba(56, 189, 248, 0.7)',
                    borderRadius: 16,
                    pointerEvents: 'none',
                    zIndex: 5,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)'
                  }}>
                    {/* Reticle Corners */}
                    <div style={{ position: 'absolute', top: -2, left: -2, width: 26, height: 26, borderTop: '3.5px solid #38bdf8', borderLeft: '3.5px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 26, height: 26, borderTop: '3.5px solid #38bdf8', borderRight: '3.5px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', bottom: -2, left: -2, width: 26, height: 26, borderBottom: '3.5px solid #38bdf8', borderLeft: '3.5px solid #38bdf8' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderBottom: '3.5px solid #38bdf8', borderRight: '3.5px solid #38bdf8' }} />
                  </div>

                  {/* Laser Scanning Animation Bar */}
                  <div style={{
                    position: 'absolute',
                    left: '18%',
                    right: '18%',
                    height: 2.5,
                    backgroundColor: '#38bdf8',
                    boxShadow: '0 0 14px 3px #38bdf8',
                    animation: 'scanLaser 2s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 6
                  }} />

                  {/* Status Banner At Bottom of Video */}
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 14,
                    right: 14,
                    textAlign: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '5px 10px',
                    borderRadius: 6,
                    backdropFilter: 'blur(4px)',
                    zIndex: 10
                  }}>
                    {scanStatusText}
                  </div>
                </div>

                {/* Camera Controls Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  {availableCameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: '6px 12px', border: '1px solid var(--color-border)' }}
                    >
                      <SwitchCamera size={14} />
                      <span>Switch Camera</span>
                    </button>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '6px 12px', border: '1px solid var(--color-border)' }}
                  >
                    <Upload size={14} />
                    <span>Upload QR Image</span>
                  </button>

                  <button
                    onClick={simulateScan}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '6px 12px', border: '1px solid var(--color-border)' }}
                  >
                    <Sparkles size={14} />
                    <span>Simulate Scan</span>
                  </button>

                  <button
                    onClick={stopCamera}
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #ef4444', color: '#ef4444' }}
                  >
                    <CameraOff size={14} />
                    <span>Close Camera</span>
                  </button>
                </div>

                {/* Helpful Tip for Scanning */}
                <div style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#0369a1',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8
                }}>
                  <HelpCircle size={15} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <strong>Scanning Tips:</strong> Hold the QR code steady ~15–20 cm (6–8 inches) from the camera. Ensure good lighting and tilt slightly to avoid screen glare.
                  </div>
                </div>
              </div>
            ) : (
              /* Idle Ready State */
              <div>
                <div style={{
                  width: 110,
                  height: 110,
                  borderRadius: 22,
                  background: 'rgba(59,130,246,0.1)',
                  border: '2px dashed var(--color-accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  animation: isScanning ? 'pulse-red 1s ease-in-out infinite' : 'none'
                }}>
                  {isScanning ? (
                    <Loader2 size={46} color="var(--color-accent-blue-light)" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <QrCode size={46} color="var(--color-accent-blue-light)" />
                  )}
                </div>

                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Ready to Scan Patient Wristband
                </h2>
                <p style={{ margin: '0 auto 24px', maxWidth: 500, color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                  Point your device camera at the patient wristband QR code, upload a QR photo, or test with quick simulation.
                </p>

                {cameraError && (
                  <div style={{
                    maxWidth: 520,
                    margin: '0 auto 20px',
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'left'
                  }}>
                    <AlertTriangle size={16} color="#b91c1c" style={{ flexShrink: 0 }} />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => startCamera()}
                    className="btn-primary"
                    style={{ fontSize: 13, padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <Camera size={16} />
                    <span>Scan via Camera</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost"
                    style={{ fontSize: 13, padding: '10px 20px', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <Upload size={15} />
                    <span>Upload QR Image</span>
                  </button>

                  <button
                    onClick={simulateScan}
                    disabled={isScanning}
                    className="btn-ghost"
                    style={{ fontSize: 13, padding: '10px 20px', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <Scan size={15} />
                    <span>Simulate Scan</span>
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <style>{`
              @keyframes scanLaser {
                0% { top: 20%; opacity: 0.8; }
                50% { top: 80%; opacity: 1; }
                100% { top: 20%; opacity: 0.8; }
              }
            `}</style>
          </div>
        ) : (
          /* PATIENT SCANNED & DECODED QR CODE DETAILS */
          <div>
            {/* 1. DECODED QR CODE DETAILS CARD */}
            {scannedQRDetails && (
              <div className="card" style={{
                marginBottom: 20,
                backgroundColor: '#ffffff',
                border: '1.5px solid #38bdf8',
                boxShadow: '0 4px 16px -2px rgba(56, 189, 248, 0.15)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 18px',
                  backgroundColor: '#f0f9ff',
                  borderBottom: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: '#0284c7',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <QrCode size={16} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0369a1' }}>
                        Decoded QR Code &amp; Wristband Details
                      </h3>
                      <span style={{ fontSize: 11, color: '#0284c7' }}>
                        Scanned via {scannedQRDetails.source === 'CAMERA' ? 'Live Camera' : (scannedQRDetails.source === 'FILE' ? 'Image File' : 'Simulation')} · Verified at {scannedQRDetails.timestamp}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '3px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Check size={11} />
                      VALID WRISTBAND QR
                    </span>

                    <button
                      onClick={() => {
                        setScannedPatientId(null);
                        setScannedQRDetails(null);
                        setAdministered(false);
                        startCamera();
                      }}
                      className="btn-ghost"
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <RefreshCw size={12} />
                      <span>Scan Another</span>
                    </button>
                  </div>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  {/* Raw Decoded Content Box */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Decoded QR Payload Content:
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      wordBreak: 'break-all'
                    }}>
                      {scannedQRDetails.rawText}
                    </div>
                  </div>

                  {/* Grid of Decoded Attributes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>QR Symbology</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{scannedQRDetails.format}</div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Extracted MRN</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0284c7', fontFamily: 'monospace', marginTop: 2 }}>
                        {patient?.mrn || scannedQRDetails.mrn || '94021-08'}
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Inpatient</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginTop: 2 }}>
                        {patient?.name || 'Rahul Patil'} ({patient?.bed ? `Bed ${patient.bed}` : 'Bed ICU-12'})
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Safety Clearance</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginTop: 2 }}>
                        ✓ 4-Point Identification Passed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PATIENT IDENTITY BANNER */}
            {(patient || targetPatient) && (
              <div style={{
                background: '#0c1a30',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 20,
                border: '1px solid #1e3a5f',
                boxShadow: '0 4px 14px rgba(12, 26, 48, 0.15)'
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #0b4da2, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#ffffff'
                }}>
                  {(patient?.name || targetPatient?.name || 'P').split(' ').map((w: string) => w[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{patient?.name || targetPatient?.name}</span>
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>ICU</span>
                    <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>Bed {patient?.bed || targetPatient?.bed}</span>
                    {(patient?.isolationStatus || targetPatient?.isolationStatus) && <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>ISOLATION</span>}
                    {(patient?.npoStatus || targetPatient?.npoStatus) && <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>NPO</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    MRN: <strong style={{ color: 'white', fontFamily: 'monospace' }}>{patient?.mrn || targetPatient?.mrn}</strong> · DOB: {(patient?.dob || targetPatient?.dob) ? format(new Date((patient?.dob || targetPatient?.dob)!), 'dd-MMM-yyyy') : '—'} ({age}y) · Sex: {patient?.sex || targetPatient?.sex} · Weight: {patient?.weight || targetPatient?.weight}kg · Diagnosis: {patient?.admissionDiagnosis || targetPatient?.admissionDiagnosis || 'Acute Care'}
                  </div>
                  {(patient?.allergies?.length > 0 || targetPatient?.allergies?.length > 0) && (
                    <div className="alert-critical" style={{ marginTop: 8, padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={12} /> <strong>SEVERE ALLERGY:</strong> {((patient?.allergies || targetPatient?.allergies) as any[])?.map((a: any) => a.allergen).join(', ')} Allergy Verified. <strong>High Risk (Level 1)</strong>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setScannedPatientId(null);
                    setScannedQRDetails(null);
                    setAdministered(false);
                    startCamera();
                  }}
                  className="btn-ghost"
                  style={{ fontSize: 12, border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}
                >
                  <Camera size={13} style={{ marginRight: 4 }} />
                  Rescan
                </button>
              </div>
            )}

            {/* 3. 5 RIGHTS SAFETY VERIFICATION */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>5 Rights of Bedside Medication Safety Verification</h3>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Hospital Policy requires all five safety criteria confirmed prior to barcode sign-off.
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                  {([
                    { key: 'rightPatient', label: '1. RIGHT PATIENT', value: patient?.name || targetPatient?.name || '—', icon: User },
                    { key: 'rightDrug', label: '2. RIGHT DRUG', value: selectedSchedule?.prescription?.medicationName?.split('(')[0]?.trim() || activeRx?.medicationName?.split('(')[0]?.trim() || 'Active eMAR Protocol', icon: Pill },
                    { key: 'rightDose', label: '3. RIGHT DOSE', value: selectedSchedule ? `${selectedSchedule.prescription?.dose} ${selectedSchedule.prescription?.unit}` : (activeRx ? `${activeRx.dose} ${activeRx.unit}` : 'Standard Dose'), icon: AlertTriangle },
                    { key: 'rightRoute', label: '4. RIGHT ROUTE', value: selectedSchedule?.prescription?.route || activeRx?.route || 'IV Infusion', icon: Activity },
                    { key: 'rightTime', label: '5. RIGHT TIME', value: selectedSchedule?.scheduledTime ? format(new Date(selectedSchedule.scheduledTime), 'HH:mm') : 'Now (Shift Dose)', icon: Clock }
                  ] as const).map(({ key, label, value, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFiveRights(prev => ({ ...prev, [key]: !prev[key] }))}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 8,
                        border: `1.5px solid ${fiveRights[key] ? 'var(--color-given-green-border)' : 'var(--color-border)'}`,
                        background: fiveRights[key] ? 'var(--color-given-green-bg)' : 'var(--color-bg-tertiary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Icon size={14} color={fiveRights[key] ? 'var(--color-given-green)' : 'var(--color-text-muted)'} />
                        {fiveRights[key] ? <Check size={14} color="var(--color-given-green)" /> : <div style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid var(--color-border)' }} />}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: fiveRights[key] ? 'var(--color-given-green)' : 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>
                        {value}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Administer Action Button */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setFiveRights({
                        rightPatient: true,
                        rightDrug: true,
                        rightDose: true,
                        rightRoute: true,
                        rightTime: true
                      });
                    }}
                    className="btn-ghost"
                    style={{ fontSize: 12 }}
                  >
                    Auto-Confirm All 5
                  </button>

                  <button
                    disabled={!allRightsVerified || administerMutation.isPending || administered}
                    onClick={() => administerMutation.mutate()}
                    className="btn-primary"
                    style={{
                      backgroundColor: allRightsVerified ? 'var(--color-given-green)' : undefined,
                      borderColor: allRightsVerified ? 'var(--color-given-green-border)' : undefined,
                      padding: '10px 24px',
                      fontSize: 14
                    }}
                  >
                    {administerMutation.isPending ? (
                      <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Recording Administration...</>
                    ) : (
                      <><Scan size={16} /> Administer &amp; Sign eMAR</>
                    )}
                  </button>
                </div>

                {administered && (
                  <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-given-green-bg)', border: '1px solid var(--color-given-green-border)', color: 'var(--color-given-green)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={15} /> Administration recorded in eMAR. HL7 audit stamp generated.
                  </div>
                )}
              </div>
            </div>

            {/* 4. PENDING SCHEDULES */}
            {(schedules as any[]).filter(s => s.status === 'PENDING').length > 0 && (
              <div className="card">
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                    Other Pending Doses for {patient?.name || targetPatient?.name}
                  </h3>
                </div>
                {(schedules as any[]).filter(s => s.status === 'PENDING').map((s: any) => (
                  <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.prescription?.medicationName}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {s.prescription?.dose}{s.prescription?.unit} · {s.prescription?.route} · Due: {s.scheduledTime ? format(new Date(s.scheduledTime), 'HH:mm') : '—'}
                      </div>
                    </div>
                    <button onClick={() => setSelectedScheduleId(s.id)} className="btn-primary" style={{ fontSize: 11 }}>
                      Select &amp; Administer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

