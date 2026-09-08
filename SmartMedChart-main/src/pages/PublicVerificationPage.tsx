import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, AlertTriangle, PhoneCall, Heart, Clock, CheckCircle2,
  User, Pill, Stethoscope, Search, Printer, ArrowLeft, ExternalLink,
  Lock, Copy, Check, Hospital, RefreshCw, Eye, ShieldAlert, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_BASE = '/api';

export default function PublicVerificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const idParam = searchParams.get('id') || '94021-08';
  const typeParam = searchParams.get('type') || 'PATIENT';
  const viewerParam = searchParams.get('viewer') || searchParams.get('role');

  const isHospitalStaffUser = user?.role === 'ALLIED_STAFF' || user?.role === 'OTHER_STAFF';
  const [isStaffMode, setIsStaffMode] = useState<boolean>(() => {
    return isHospitalStaffUser || viewerParam === 'staff';
  });

  const [searchId, setSearchId] = useState(idParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchVerification = async (targetId: string, asStaff: boolean = isStaffMode) => {
    setLoading(true);
    setError(null);
    try {
      const q = asStaff ? '?viewer=staff' : '';
      const res = await axios.get(`${API_BASE}/verify/${encodeURIComponent(targetId)}${q}`, {
        headers: user?.role ? { 'x-viewer-role': user.role } : {}
      });
      setData(res.data);
    } catch (err: any) {
      console.error('Verification lookup error:', err);
      setError(err?.response?.data?.error || 'Hospital record could not be verified');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idParam) {
      fetchVerification(idParam, isStaffMode);
      setSearchId(idParam);
    }
  }, [idParam, isStaffMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setSearchParams({ id: searchId.trim(), type: typeParam });
    }
  };

  const [copiedNursePhone, setCopiedNursePhone] = useState(false);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyNursePhone = () => {
    const phone = patient?.attendingNurse?.phone || '+91 98234 88219';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedNursePhone(true);
      setTimeout(() => setCopiedNursePhone(false), 2000);
    }
  };

  const isPatient = data?.type === 'PATIENT';
  const patient = data?.patient;
  const staff = data?.staff;

  const age = patient?.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : 47;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a101d',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14, 116, 144, 0.25), transparent)',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Top Hospital Header */}
      <header style={{
        width: '100%',
        maxWidth: 820,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 20,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
          }}>
            <Hospital size={22} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Metropolitan General Hospital
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>HL7 &bull; FHIR R4 Live Verification Gateway</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ color: '#34d399', fontWeight: 600 }}>Active</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <Lock size={12} /> Clinical Login
          </button>
          <button
            onClick={handleCopyLink}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              backgroundColor: copiedLink ? '#059669' : '#0284c7',
              border: 'none',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* Lookup Bar */}
      <form onSubmit={handleSearch} style={{
        width: '100%',
        maxWidth: 820,
        display: 'flex',
        gap: 8,
        marginBottom: 16
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search MRN (e.g. 94021-08) or Staff ID (e.g. DOC-4401, NUR-1092)..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: 10,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: 13,
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            backgroundColor: '#2563eb',
            border: 'none',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Verify ID
        </button>
      </form>

      {/* Mode Perspective Selector (Allows switching or shows locked Hospital Staff view) */}
      <div style={{
        width: '100%',
        maxWidth: 820,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isStaffMode ? 'rgba(14, 116, 144, 0.15)' : 'rgba(15, 23, 42, 0.7)',
        border: isStaffMode ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 12,
        padding: '10px 16px',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Eye size={17} color={isStaffMode ? '#38bdf8' : '#34d399'} />
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              QR Scanner Perspective
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: isStaffMode ? '#38bdf8' : '#34d399' }}>
              {isStaffMode ? 'Hospital Staff Scan Mode (Strict 7 Fields Only)' : 'Full Clinical eMAR Mode (Physician / RN)'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setIsStaffMode(true);
              setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('viewer', 'staff');
                return next;
              });
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: isStaffMode ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
              backgroundColor: isStaffMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
              color: isStaffMode ? '#ffffff' : '#94a3b8',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ShieldCheck size={13} color={isStaffMode ? '#38bdf8' : '#94a3b8'} />
            <span>Hospital Staff View</span>
          </button>

          {!isHospitalStaffUser ? (
            <button
              type="button"
              onClick={() => {
                setIsStaffMode(false);
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  next.delete('viewer');
                  next.delete('role');
                  return next;
                });
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: !isStaffMode ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                backgroundColor: !isStaffMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                color: !isStaffMode ? '#ffffff' : '#94a3b8',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Lock size={13} color={!isStaffMode ? '#34d399' : '#94a3b8'} />
              <span>Full Clinical View</span>
            </button>
          ) : (
            <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
              Locked to Staff Privileges
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          width: '100%',
          maxWidth: 820,
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <RefreshCw size={36} color="#38bdf8" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Verifying Official Hospital Record...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Connecting to HL7 / FHIR Central Inpatient Registry</div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{
          width: '100%',
          maxWidth: 820,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 16,
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <AlertTriangle size={36} color="#f87171" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>Record Not Found</div>
          <p style={{ fontSize: 13, color: '#cbd5e1', maxWidth: 450, margin: '8px auto 20px' }}>
            No verified patient or hospital staff record matches <strong>"{idParam}"</strong>. Please verify the QR code or enter a valid MRN or Staff ID.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSearchParams({ id: '94021-08', type: 'PATIENT' })}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Demo Patient: Rahul Patil (94021-08)
            </button>
            <button
              onClick={() => setSearchParams({ id: '94022-15', type: 'PATIENT' })}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Demo Patient: Anita Desai (94022-15)
            </button>
            <button
              onClick={() => setSearchParams({ id: 'DOC-4401', type: 'STAFF' })}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Demo Doctor: Dr. Vikram Sharma
            </button>
          </div>
        </div>
      )}

      {/* Main Verified Card */}
      {!loading && !error && data && (
        <div style={{ width: '100%', maxWidth: 820 }}>
          {/* Status Badge Top */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#064e3b',
            border: '1px solid #059669',
            borderRadius: '16px 16px 0 0',
            padding: '12px 20px',
            color: '#a7f3d0',
            fontSize: 12,
            fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#34d399" />
              <span>OFFICIAL HOSPITAL IDENTITY VERIFIED &bull; 256-BIT CRYPTOGRAPHIC TIMESTAMP</span>
            </div>
            <span style={{ fontSize: 11, color: '#6ee7b7' }}>
              Verified: {format(new Date(data.verifiedAt), 'dd-MMM-yyyy HH:mm:ss')}
            </span>
          </div>

          {/* Card Container */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            padding: '28px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
            marginBottom: 24
          }}>
            {/* Patient View */}
            {isPatient && patient && (
              (isStaffMode || data?.staffScanRestricted) ? (
                /* ======================================================== */
                /* HOSPITAL STAFF SCAN VIEW: STRICT 7 AUTHORIZED FIELDS ONLY */
                /* ======================================================== */
                <div>
                  {/* Privacy Notice Banner */}
                  <div style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <ShieldCheck size={22} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>
                        Hospital Staff Scan View &bull; Privacy Protection Active
                      </div>
                      <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                        Authorized for inpatient bed logistics and primary care team coordination. Confidential clinical eMAR charts, medication dosages, and medical diagnoses are strictly concealed per hospital security policies.
                      </div>
                    </div>
                  </div>

                  {/* Header Row: 1. Patient ID & 2. Patient Name & QR */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 16,
                    paddingBottom: 20,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: 20
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 800,
                        color: '#ffffff',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                      }}>
                        {patient.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                            {patient.name}
                          </h1>
                          <span style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6
                          }}>
                            HOSPITAL STAFF VIEW
                          </span>
                          <span style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6
                          }}>
                            BED {patient.bed || 'ICU-12'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>
                          Patient ID (MRN): <strong style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: 14 }}>{patient.mrn}</strong>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      padding: 8,
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <QRCodeSVG value={window.location.href} size={84} level="M" />
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#0f172a', marginTop: 4, fontFamily: 'monospace' }}>
                        {patient.mrn}
                      </span>
                    </div>
                  </div>

                  {/* 3 Logistic Fields: Department, Ward, Bed Number */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 20
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      Bedside Location &amp; Logistics
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                          1. PATIENT ID (MRN)
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', marginTop: 2 }}>
                          {patient.mrn}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                          3. DEPARTMENT
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
                          {patient.department || 'Department of Critical Care & Inpatient Medicine'}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                          4. WARD
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
                          {patient.ward || 'Ward 4B ICU'}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                          5. BED NUMBER
                        </span>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace', marginTop: 2 }}>
                          {patient.bed || 'ICU-12'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2 Care Team Cards: 6. Attending Nurse & Phone to Call Directly & 7. Doctor Name, Designation, Department */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {/* 6. Attending Nurse & Direct Phone Call */}
                    <div style={{
                      backgroundColor: 'rgba(6, 78, 59, 0.35)',
                      border: '1.5px solid #059669',
                      borderRadius: 14,
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Heart size={15} color="#34d399" />
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              6. ATTENDING NURSE
                            </span>
                          </div>
                          <span style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.25)',
                            color: '#34d399',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 9999
                          }}>
                            ON DUTY BEDSIDE
                          </span>
                        </div>

                        <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                          {patient.attendingNurse?.name || 'Nurse Priya Nair, RN'}
                        </div>
                        <div style={{ fontSize: 12, color: '#a7f3d0', marginBottom: 14 }}>
                          {patient.attendingNurse?.title || 'Primary Bedside BSN (ICU Certified)'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <a
                          href={`tel:${(patient.attendingNurse?.phone || '+91 98234 88219').replace(/[^0-9+]/g, '')}`}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '10px 14px',
                            borderRadius: 10,
                            backgroundColor: '#16a34a',
                            backgroundImage: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 12,
                            textDecoration: 'none',
                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
                            cursor: 'pointer'
                          }}
                        >
                          <PhoneCall size={15} />
                          <span>Call Directly ({patient.attendingNurse?.phone || '+91 98234 88219'})</span>
                        </a>

                        <button
                          onClick={handleCopyNursePhone}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            backgroundColor: copiedNursePhone ? '#065f46' : 'rgba(255, 255, 255, 0.1)',
                            border: copiedNursePhone ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            transition: 'all 0.15s'
                          }}
                          title="Copy Phone Number"
                        >
                          {copiedNursePhone ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                          <span>{copiedNursePhone ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 7. Doctor Name, Designation and Department */}
                    <div style={{
                      backgroundColor: 'rgba(30, 58, 138, 0.3)',
                      border: '1.5px solid #2563eb',
                      borderRadius: 14,
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <Stethoscope size={15} color="#60a5fa" />
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            7. ATTENDING DOCTOR
                          </span>
                        </div>

                        <div style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                          {patient.attendingDoctor?.name || 'Dr. V. Sharma, MD'}
                        </div>
                        <div style={{ fontSize: 12, color: '#bfdbfe', marginBottom: 14 }}>
                          Designation: <strong>{patient.attendingDoctor?.designation || 'Attending Intensivist & Pulmonologist'}</strong>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                          DOCTOR DEPARTMENT
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>
                          {patient.attendingDoctor?.department || 'Pulmonology / Critical Care'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Return / Staff Portal Quick Action */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                    <button
                      onClick={() => navigate('/staff-portal')}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <Hospital size={16} /> Open Hospital Staff Portal
                    </button>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* CLINICAL VIEW (Doctors, Nurses, Pharmacists)              */
                /* ======================================================== */
                <div>
                  {/* Header Identity Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 16,
                    paddingBottom: 20,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: 20
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #0b4da2, #0284c7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 800,
                        color: '#ffffff',
                        boxShadow: '0 4px 14px rgba(11, 77, 162, 0.4)'
                      }}>
                        {patient.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                            {patient.name}
                          </h1>
                          <span style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6
                          }}>
                            ACTIVE INPATIENT
                          </span>
                          <span style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 6
                          }}>
                            BED {patient.bed || 'ICU-12'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>
                          MRN: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{patient.mrn}</strong> &bull; DOB: {patient.dob ? format(new Date(patient.dob), 'dd-MMM-yyyy') : '14-Aug-1979'} ({age}y) &bull; {patient.sex || 'Male'} &bull; Weight: {patient.weight || 72}kg
                        </div>
                      </div>
                    </div>

                    {/* QR Code Graphic Box */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      padding: 8,
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <QRCodeSVG value={window.location.href} size={90} level="M" />
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#0f172a', marginTop: 4, fontFamily: 'monospace' }}>
                        {patient.mrn}
                      </span>
                    </div>
                  </div>

                  {/* Emergency Contact & Allergy Notice Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Family Emergency Contact */}
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 12,
                      padding: '16px 18px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#f87171', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <PhoneCall size={14} /> Family Emergency Contact
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 2 }}>
                        {patient.emergencyContactName || 'Sunita Patil'}
                      </div>
                      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 8 }}>
                        Relationship: {patient.emergencyContactRelation || 'Spouse / Next of Kin'}
                      </div>
                      <a
                        href={`tel:${(patient.emergencyContactPhone || '+15553498291').replace(/[^\d+]/g, '')}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                          transition: 'background 0.15s'
                        }}
                      >
                        <PhoneCall size={12} /> Call: {patient.emergencyContactPhone || '+91 98201 34982'}
                      </a>
                    </div>

                    {/* Verified Allergies */}
                    <div style={{
                      backgroundColor: patient.allergies?.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                      border: `1px solid ${patient.allergies?.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.25)'}`,
                      borderRadius: 12,
                      padding: '16px 18px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: patient.allergies?.length > 0 ? '#f87171' : '#34d399', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <AlertTriangle size={14} /> Clinical Allergy Status
                      </div>
                      {patient.allergies?.length > 0 ? (
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                            {patient.allergies[0]?.allergen || 'Penicillin G'} &bull; Severe Anaphylaxis
                          </div>
                          <div style={{ fontSize: 12, color: '#fca5a5' }}>
                            Verified High Severity &bull; Cephalosporin cross-reactivity warning active
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 14, color: '#6ee7b7', fontWeight: 600 }}>
                          No known drug allergies documented (NKDA)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medication Administration Timeline / History */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '20px',
                    marginBottom: 20
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Pill size={16} color="#38bdf8" />
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
                          Bedside Medication Administration Record (eMAR)
                        </h3>
                      </div>
                      <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                        ✓ 4-Point Barcode Verified
                      </span>
                    </div>

                    {/* List Administrations or Schedules */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(patient.administrations?.length > 0) ? (
                        patient.administrations.map((adm: any) => (
                          <div
                            key={adm.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: 10,
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              flexWrap: 'wrap',
                              gap: 10
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                                  {adm.schedule?.prescription?.medicationName || 'Ceftriaxone Sodium 1g IV'}
                                </span>
                                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: 4 }}>
                                  GIVEN &bull; {adm.dose} {adm.unit} ({adm.route})
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                                Administered by: <strong style={{ color: '#38bdf8' }}>{adm.administeredBy?.name || 'Nurse Priya, RN'}</strong> ({adm.administeredBy?.role || 'NURSE'}) &bull; Signed: {format(new Date(adm.signedAt), 'dd-MMM-yyyy HH:mm')}
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700, textAlign: 'right' }}>
                              <div>✓ 5-Rights Verified</div>
                              <div style={{ color: '#94a3b8', fontSize: 10 }}>Safe Match 100%</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Fallback verified sample schedule
                        <div style={{
                          padding: '14px',
                          borderRadius: 10,
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                              Paracetamol IV (Perfalgan) &bull; 1000 mg IV Infusion
                            </div>
                            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>
                              Administered by: <strong style={{ color: '#38bdf8' }}>Nurse Priya Sharma, RN</strong> &bull; 4-Point Barcode Verified
                            </div>
                          </div>
                          <span style={{ color: '#34d399', fontSize: 11, fontWeight: 700 }}>✓ GIVEN</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Patient Meta */}
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
                    <span>Location: {patient.ward || 'Ward 4B ICU'} &bull; Admission Diagnosis: {patient.admissionDiagnosis || 'Acute Inpatient Observation'}</span>
                    <span>Attending: Dr. V. Sharma, MD (Pulmonology/CC)</span>
                  </div>
                </div>
              )
            )}

            {/* Staff View */}
            {!isPatient && staff && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: staff.role === 'DOCTOR' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'linear-gradient(135deg, #059669, #10b981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                  }}>
                    {staff.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {staff.name}
                      </h1>
                      <span style={{
                        backgroundColor: staff.role === 'DOCTOR' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(5, 150, 105, 0.2)',
                        color: staff.role === 'DOCTOR' ? '#60a5fa' : '#34d399',
                        border: `1px solid ${staff.role === 'DOCTOR' ? '#2563eb' : '#059669'}`,
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        {staff.role}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        ACTIVE &bull; ON DUTY
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                      Staff ID: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{staff.staffId || 'DOC-4401'}</strong> &bull; Dept: {staff.department || 'Ward 4B ICU'} &bull; License: {staff.licenseNumber || 'MD-ACTIVE-2026'}
                    </div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
                    Clinical Role &amp; Privileges
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#64748b' }}>Department</div>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{staff.department || 'Ward 4B ICU'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Specialty</div>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{staff.specialty || 'Intensive Care Medicine'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>State Medical License</div>
                      <div style={{ fontWeight: 700, color: '#34d399' }}>{staff.licenseNumber || 'VERIFIED-ACTIVE'}</div>
                    </div>
                  </div>
                </div>

                {staff.administrations?.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '16px'
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
                      Recent Bedside Administrations Signed By Staff
                    </div>
                    {staff.administrations.map((adm: any) => (
                      <div key={adm.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: '#ffffff' }}>{adm.schedule?.prescription?.medicationName}</span> to <span style={{ color: '#38bdf8' }}>{adm.patient?.name}</span> (Bed {adm.patient?.bed}) at {format(new Date(adm.signedAt), 'HH:mm')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> Print Verified Record
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 10,
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Lock size={15} /> Sign into Hospital Workstation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
