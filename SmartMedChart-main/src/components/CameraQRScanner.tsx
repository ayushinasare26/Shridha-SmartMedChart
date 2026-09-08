import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, RefreshCw, AlertTriangle, Sparkles, SwitchCamera, Loader2 } from 'lucide-react';

interface CameraQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isPaused?: boolean;
  expectedPatientName?: string;
  autoStart?: boolean;
}

export function CameraQRScanner({
  onScanSuccess,
  isPaused = false,
  expectedPatientName,
  autoStart = true
}: CameraQRScannerProps) {
  const [isActive, setIsActive] = useState(autoStart);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeFacingMode, setActiveFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const isStartingRef = useRef<boolean>(false);

  // Stop camera media stream safely
  const stopCameraStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping tracks:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoPlaying(false);
    setIsLoadingCamera(false);
  }, []);

  // Enumerate cameras once permissions are granted
  const loadDeviceList = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
      }
    } catch (e) {
      console.warn('Could not enumerate cameras:', e);
    }
  }, []);

  // Start camera stream with robust fallbacks
  const startCameraStream = useCallback(async (facing: 'environment' | 'user' = activeFacingMode) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or connection (HTTPS required).');
      setIsLoadingCamera(false);
      isStartingRef.current = false;
      return;
    }

    let stream: MediaStream | null = null;

    // 1. Try with ideal constraints first
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (firstErr) {
      console.warn('Ideal camera constraints failed, falling back to basic { video: true }...', firstErr);
      // 2. Fallback to basic { video: true } to guarantee it works on all hardware
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (fallbackErr: any) {
        console.error('All camera attempts failed:', fallbackErr);
        let errMsg = 'Failed to access camera.';
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          errMsg = 'Camera permission was denied. Please allow camera access in your browser address bar.';
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
          errMsg = 'No webcam or camera device was found on this computer / tablet.';
        } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
          errMsg = 'Camera is in use by another application or browser tab. Please close other camera apps and retry.';
        }
        setCameraError(errMsg);
        setIsLoadingCamera(false);
        isStartingRef.current = false;
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
          setIsVideoPlaying(true);
        } catch (playErr) {
          console.warn('Video play was delayed or blocked:', playErr);
        }
      }

      loadDeviceList();
    }

    setIsLoadingCamera(false);
    isStartingRef.current = false;
  }, [activeFacingMode, loadDeviceList]);

  // Frame processing loop with jsQR
  const scanFrame = useCallback(() => {
    if (!isActive || isPaused) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (videoWidth > 0 && videoHeight > 0) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);

          // Decode QR
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim()) {
            const now = Date.now();
            // Debounce scan of same code
            if (now - lastScanTimeRef.current > 1500 || code.data !== lastScannedCode) {
              lastScanTimeRef.current = now;
              setLastScannedCode(code.data);
              onScanSuccess(code.data.trim());
            }
          }
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [isActive, isPaused, lastScannedCode, onScanSuccess]);

  // Start / Stop camera when isActive changes
  useEffect(() => {
    if (isActive) {
      startCameraStream();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isActive]); // Only react to isActive toggle to prevent race loops

  // Run scanning animation frame loop
  useEffect(() => {
    if (isVideoPlaying && isActive && !isPaused) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isVideoPlaying, isActive, isPaused, scanFrame]);

  // Toggle front/rear camera
  const handleToggleFacingMode = () => {
    const nextFacing = activeFacingMode === 'environment' ? 'user' : 'environment';
    setActiveFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 580,
      margin: '0 auto',
      background: '#0b1329',
      borderRadius: 16,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Scanner Header Controls */}
      <div style={{
        padding: '12px 18px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: isVideoPlaying && !cameraError ? '#22c55e' : '#ef4444',
            boxShadow: isVideoPlaying && !cameraError ? '0 0 10px #22c55e' : 'none',
            animation: isVideoPlaying && !cameraError ? 'pulse-red 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={15} color="#38bdf8" /> Live Bedside Camera Scanner
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cameras.length > 1 && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Switch Camera (Front/Rear)"
            >
              <SwitchCamera size={12} /> {activeFacingMode === 'environment' ? 'Rear' : 'Front'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isActive) {
                setIsActive(false);
                stopCameraStream();
              } else {
                setIsActive(true);
                startCameraStream();
              }
            }}
            style={{
              background: isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(11, 77, 162, 0.4)',
              border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
              color: isActive ? '#fca5a5' : '#38bdf8',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {isActive ? <CameraOff size={12} /> : <Camera size={12} />}
            {isActive ? 'Close Camera' : 'Open Camera'}
          </button>
        </div>
      </div>

      {/* Video Viewport Area */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: 330,
        height: 350,
        backgroundColor: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Hidden Canvas for QR decoding */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Live Video Element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.warn('Autoplay error:', e));
              setIsVideoPlaying(true);
            }
          }}
          onPlaying={() => setIsVideoPlaying(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isActive && !cameraError ? 'block' : 'none',
            transform: activeFacingMode === 'user' ? 'scaleX(-1)' : 'none',
            zIndex: 1
          }}
        />

        {/* Loading / Initializing State */}
        {isLoadingCamera && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 6, 23, 0.85)', color: '#94a3b8', gap: 10 }}>
            <Loader2 size={36} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>Connecting to Camera...</span>
          </div>
        )}

        {/* Active Camera HUD / Target Box Overlay */}
        {isActive && !cameraError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Viewfinder Target Box */}
            <div style={{
              width: 220,
              height: 220,
              position: 'relative',
              borderRadius: 16,
              boxShadow: '0 0 0 4000px rgba(2, 6, 23, 0.35)',
              border: '2px solid rgba(56, 189, 248, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Corner Reticles */}
              <div style={{ position: 'absolute', top: -2, left: -2, width: 24, height: 24, borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderTopLeftRadius: 10 }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 24, height: 24, borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderTopRightRadius: 10 }} />
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderBottomLeftRadius: 10 }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderBottomRightRadius: 10 }} />

              {/* Animated Laser Sweep Line */}
              <div style={{
                position: 'absolute',
                left: 6,
                right: 6,
                height: 2.5,
                background: 'linear-gradient(90deg, transparent, #38bdf8, #22c55e, #38bdf8, transparent)',
                boxShadow: '0 0 12px #38bdf8, 0 0 20px #22c55e',
                animation: 'scan-laser 2s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }} />

              {/* Center Target Aim */}
              <div style={{ width: 12, height: 12, border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '50%' }} />
            </div>

            {/* Viewfinder Guidance Text */}
            <div style={{
              marginTop: 18,
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Sparkles size={13} color="#38bdf8" />
              <span>Align patient wristband QR inside frame</span>
            </div>
          </div>
        )}

        {/* Camera Off / Inactive State */}
        {!isActive && !cameraError && (
          <div style={{ position: 'relative', zIndex: 6, textAlign: 'center', padding: 24, color: '#94a3b8' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Camera size={28} color="#64748b" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Camera is currently standby
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              Click below to activate device webcam or camera stream
            </div>
            <button
              type="button"
              onClick={() => {
                setIsActive(true);
                startCameraStream();
              }}
              className="btn-primary"
              style={{ fontSize: 13, padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Camera size={15} /> Open Camera Scanner
            </button>
          </div>
        )}

        {/* Camera Error / Permission Denied State */}
        {cameraError && (
          <div style={{ position: 'relative', zIndex: 6, textAlign: 'center', padding: 24, maxWidth: 420 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#ef4444'
            }}>
              <AlertTriangle size={26} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginBottom: 6 }}>
              Camera Not Available
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
              {cameraError}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => startCameraStream()}
                className="btn-ghost"
                style={{ fontSize: 12, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <RefreshCw size={12} /> Retry Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '10px 18px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#64748b'
      }}>
        <span>Auto-detects QR Codes &amp; Barcodes at 60 FPS</span>
        {expectedPatientName && (
          <span style={{ color: '#93c5fd', fontWeight: 600 }}>
            Target: {expectedPatientName}
          </span>
        )}
      </div>
    </div>
  );
}
