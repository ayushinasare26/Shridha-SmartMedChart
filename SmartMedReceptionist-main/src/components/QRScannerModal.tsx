import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  CameraOff,
  SwitchCamera,
  Flashlight,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  Sparkles,
  QrCode,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import jsQR from 'jsqr';
import { Patient } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Camera & Scanner state
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'error' | 'unsupported'>('requesting');
  const [cameraError, setCameraError] = useState<string>('');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Scanned result
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);
  const [decodedRawText, setDecodedRawText] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'scanning' | 'detected' | 'not_found'>('scanning');
  const [manualInput, setManualInput] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Sound feedback
  const playScanBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // Audio context might be restricted before user gesture; safe to ignore
    }
  }, []);

  // Stop camera tracks helper
  const stopCameraStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, []);

  // Match scanned text to a patient
  const matchPatientFromText = useCallback(
    (scannedText: string): Patient | null => {
      if (!scannedText) return null;
      const clean = scannedText.trim();

      // 1. Try JSON payload
      try {
        const parsed = JSON.parse(clean);
        if (parsed && typeof parsed === 'object') {
          const targetMRN = parsed.mrn?.toString().trim().toLowerCase();
          const targetToken = parsed.token?.toString().trim().toLowerCase();
          const targetCase = parsed.caseFileId?.toString().trim().toLowerCase();
          const targetName = parsed.name?.toString().trim().toLowerCase();

          const found = patients.find((p) => {
            if (targetMRN && p.mrn.toLowerCase() === targetMRN) return true;
            if (targetToken && p.tokenNumber.toLowerCase() === targetToken) return true;
            if (targetCase && p.caseFile.id.toLowerCase() === targetCase) return true;
            if (targetName && p.fullName.toLowerCase() === targetName) return true;
            return false;
          });
          if (found) return found;
        }
      } catch {
        // Not a JSON payload, proceed with text matching
      }

      // 2. Direct string matching
      const lower = clean.toLowerCase();
      return (
        patients.find(
          (p) =>
            p.mrn.toLowerCase() === lower ||
            p.tokenNumber.toLowerCase() === lower ||
            p.caseFile.id.toLowerCase() === lower ||
            p.id.toLowerCase() === lower ||
            p.fullName.toLowerCase() === lower ||
            lower.includes(p.mrn.toLowerCase()) ||
            lower.includes(p.tokenNumber.toLowerCase())
        ) || null
      );
    },
    [patients]
  );

  // Handle successful QR detection
  const handleDecodedQR = useCallback(
    (codeData: string) => {
      setDecodedRawText(codeData);
      playScanBeep();

      const matched = matchPatientFromText(codeData);
      if (matched) {
        setScannedPatient(matched);
        setScanStatus('detected');
      } else {
        setScannedPatient(null);
        setScanStatus('not_found');
      }
    },
    [matchPatientFromText, playScanBeep]
  );

  // Scanning loop for camera video
  const startScanLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim().length > 0) {
          handleDecodedQR(code.data.trim());
          // Pause continuous loop once detected
          return;
        }
      }
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);
  }, [handleDecodedQR]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setCameraState('requesting');
    setCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setCameraError('Camera API is not supported in this browser environment.');
      return;
    }

    try {
      // Find available cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vDevices);
      } catch {
        // Enumerate might fail before permission
      }

      const videoConstraints: MediaTrackConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      mediaStreamRef.current = stream;

      // Check torch capabilities
      const track = stream.getVideoTracks()[0];
      if (track && typeof (track as unknown as { getCapabilities?: () => { torch?: boolean } }).getCapabilities === 'function') {
        const capabilities = (track as unknown as { getCapabilities: () => { torch?: boolean } }).getCapabilities();
        setTorchSupported(Boolean(capabilities?.torch));
      } else {
        setTorchSupported(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraState('active');
        startScanLoop();
      }
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
      setCameraState('error');
      const errName = (err as Error)?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser address bar.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('No video camera detected on this workstation.');
      } else {
        setCameraError('Unable to open camera stream. You can upload an image or search manually.');
      }
    }
  }, [facingMode, selectedDeviceId, startScanLoop, stopCameraStream]);

  // Handle modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setScanStatus('scanning');
      setScannedPatient(null);
      setDecodedRawText('');
      setManualInput('');
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, startCamera, stopCameraStream]);

  // Flip Camera
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId('');
  };

  // Toggle Torch
  const handleToggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  // Resume Scanning
  const handleResumeScan = () => {
    setScanStatus('scanning');
    setScannedPatient(null);
    setDecodedRawText('');
    startScanLoop();
  };

  // Upload and decode image fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
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
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            handleDecodedQR(code.data.trim());
          } else {
            setDecodedRawText('Image contains no detectable QR code.');
            setScanStatus('not_found');
          }
        }
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input so user can pick the same file again
    e.target.value = '';
  };

  // Manual search fallback
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedQR(manualInput.trim());
  };

  // Simulation fallback for fast local testing
  const handleSimulateQuickScan = (patient: Patient) => {
    const simulatedPayload = JSON.stringify({
      protocol: 'SMARTMEDCHART-PASS-V2',
      mrn: patient.mrn,
      token: patient.tokenNumber,
      name: patient.fullName,
      doctor: patient.caseFile.assignedDoctorName,
      dept: patient.caseFile.department,
      caseFileId: patient.caseFile.id,
    });
    handleDecodedQR(simulatedPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0e3b56] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Camera QR Wristband & Pass Scanner
                </h3>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                  Live Camera
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80">
                Point workstation camera at patient wristband, token slip, or digital QR badge
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* CAMERA VIEWFINDER STAGE */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover max-h-[320px] ${
                cameraState === 'active' ? 'block' : 'hidden'
              }`}
            />

            {/* Hidden canvas for image decoding */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Reticle & Laser Sweep Overlay (Only when camera active and scanning) */}
            {cameraState === 'active' && scanStatus === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                {/* Viewfinder Frame */}
                <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl border-2 border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
                  {/* Viewfinder 4 Corner Brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-300 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-300 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-300 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-300 rounded-br-lg" />

                  {/* Animated Laser Scanning Line */}
                  <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#38bdf8] animate-[scanSweep_2.2s_ease-in-out_infinite]" />

                  {/* Center Target Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <QrCode className="w-12 h-12 text-cyan-300" />
                  </div>
                </div>

                {/* Sub-label */}
                <div className="mt-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs border border-cyan-500/40 text-[11px] font-semibold text-cyan-200 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Align QR code within reticle frame</span>
                </div>
              </div>
            )}

            {/* Detected State Overlay */}
            {scanStatus === 'detected' && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-in zoom-in-75">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="text-white font-bold text-sm mt-2.5">QR Verified Successfully</span>
                <span className="text-emerald-300 text-xs font-mono mt-0.5">
                  {scannedPatient?.tokenNumber} • {scannedPatient?.mrn}
                </span>
              </div>
            )}

            {/* Camera Requesting / Starting */}
            {cameraState === 'requesting' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Initializing Workstation Camera...</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Please approve camera permissions when prompted by your browser.
                  </p>
                </div>
              </div>
            )}

            {/* Camera Error or Denied */}
            {(cameraState === 'error' || cameraState === 'unsupported') && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
                  <CameraOff className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Camera Unavailable</p>
                  <p className="text-xs text-slate-300 max-w-sm leading-relaxed">{cameraError}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Camera Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload QR Image</span>
                  </button>
                </div>
              </div>
            )}

            {/* Floating Top Controls (Flip camera, Torch, Upload file) */}
            {cameraState === 'active' && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {torchSupported && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                    className={`p-2 rounded-lg backdrop-blur-md border text-xs font-semibold transition-all ${
                      torchOn
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-900/70 text-slate-200 border-white/20 hover:bg-slate-900'
                    }`}
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}

                {(videoDevices.length > 1 || facingMode) && (
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    title="Flip Camera (Front / Back)"
                    className="p-2 rounded-lg bg-slate-900/70 text-slate-200 border border-white/20 hover:bg-slate-900 backdrop-blur-md text-xs font-semibold transition-all"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload QR Image File"
                  className="p-2 rounded-lg bg-slate-900/70 text-slate-200 border border-white/20 hover:bg-slate-900 backdrop-blur-md text-xs font-semibold transition-all"
                >
                  <Upload className="w-4 h-4 text-cyan-300" />
                </button>
              </div>
            )}
          </div>

          {/* Hidden File Input for Image Scanning */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* SCANNED RESULT CARD */}
          {scanStatus === 'detected' && scannedPatient && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900">
                    Patient Case File Found & Verified
                  </span>
                </div>
                <span className="font-mono text-xs font-black text-emerald-950 bg-emerald-200/80 px-2 py-0.5 rounded border border-emerald-300">
                  {scannedPatient.tokenNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-emerald-200/70 pt-2.5 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm">{scannedPatient.fullName}</h4>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                        scannedPatient.patientType === 'IPD'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      }`}
                    >
                      {scannedPatient.patientType === 'IPD' ? 'Admitted Inpatient' : 'OPD Outpatient'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {scannedPatient.mrn} • {scannedPatient.age} yrs • Blood:{' '}
                    <strong className="text-slate-800">{scannedPatient.caseFile.medicalInfo.bloodGroup}</strong>
                    {scannedPatient.patientType === 'IPD' && scannedPatient.bedNumber && (
                      <span className="ml-1 text-emerald-800 font-bold">
                        • Ward: {scannedPatient.wardName || 'Ward'} (Bed {scannedPatient.bedNumber})
                      </span>
                    )}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Attending: Dr. {scannedPatient.caseFile.assignedDoctorName} ({scannedPatient.caseFile.department})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResumeScan}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Scan Next
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPatient(scannedPatient);
                      onClose();
                    }}
                    className="px-4 py-2 bg-[#0e3b56] hover:bg-[#072437] text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Open Case File</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCANNED BUT NOT FOUND / UNRECOGNIZED CODE */}
          {scanStatus === 'not_found' && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>QR Scanned, but patient is not enrolled</span>
                </div>
                <button
                  type="button"
                  onClick={handleResumeScan}
                  className="text-amber-800 hover:underline font-semibold text-[11px]"
                >
                  Scan Again
                </button>
              </div>
              <p className="text-slate-600 text-[11px]">
                Decoded payload:{' '}
                <code className="px-1.5 py-0.5 bg-white border border-amber-200 rounded font-mono text-[10px] break-all">
                  {decodedRawText.slice(0, 80)}
                  {decodedRawText.length > 80 ? '...' : ''}
                </code>
              </p>
            </div>
          )}

          {/* Quick manual search & upload fallbacks */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Manual Search or Barcode Entry</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-cyan-700 hover:text-cyan-800 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Upload QR Image</span>
              </button>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type MRN, Token, or Name (e.g. MRN-94021, CD-12)..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0e3b56] hover:bg-[#08293d] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                Verify Code
              </button>
            </form>
          </div>

          {/* Quick Demo Test Buttons */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Scan Simulation (Test with sample wristband QR):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {patients.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSimulateQuickScan(p)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 border border-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3 h-3 text-cyan-700" />
                  <span>
                    {p.fullName} ({p.tokenNumber})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
