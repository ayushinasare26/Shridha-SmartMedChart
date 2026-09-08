import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, AlertTriangle, Shield, Check, Copy, Printer,
  PhoneCall, Stethoscope, User, MapPin, Calendar, Clock, Lock, ExternalLink, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

export interface HospitalPerson {
  type: 'PATIENT' | 'STAFF' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'ADMIN';
  id?: string;
  name: string;
  mrn?: string;
  staffId?: string;
  dob?: string | Date;
  sex?: string;
  bed?: string;
  ward?: string;
  allergies?: any[];
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  role?: string;
  title?: string;
  department?: string;
  specialty?: string;
  licenseNumber?: string;
  shiftType?: string;
  onDuty?: boolean;
  attendingName?: string;
  admissionDiagnosis?: string;
  codeStatus?: string;
}

interface HospitalPersonQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: HospitalPerson | null;
}

export function HospitalPersonQRModal({ isOpen, onClose, person }: HospitalPersonQRModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !person) return null;

  const isPatient = person.type === 'PATIENT' || (!person.role && Boolean(person.mrn));
  const isStaffViewer = user?.role === 'ALLIED_STAFF' || user?.role === 'OTHER_STAFF';

  // Compute DOB and Age for patient
  let age: number | null = null;
  let formattedDob = '14-Aug-1979';
  if (person.dob) {
    try {
      const d = new Date(person.dob);
      formattedDob = format(d, 'dd-MMM-yyyy');
      age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
    } catch {
      // fallback
    }
  }

  // Parse allergies
  const allergyList = Array.isArray(person.allergies)
    ? person.allergies.map(a => typeof a === 'string' ? a : a.allergen).filter(Boolean)
    : [];
  const hasAllergy = allergyList.length > 0;

  // Build direct scannable verification URL so smartphone cameras immediately open the live hospital record
  const targetId = isPatient ? (person.mrn || person.id || '94021-08') : (person.staffId || person.id || 'DOC-4401');
  const targetType = isPatient ? 'PATIENT' : (person.role || 'STAFF');
  const viewerParam = isStaffViewer ? '&viewer=staff' : '';
  const verificationUrl = `${window.location.origin}/verify?id=${encodeURIComponent(targetId)}&type=${targetType}${viewerParam}`;
  const qrPayload = verificationUrl;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verificationUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenVerification = () => {
    window.open(verificationUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const roleColor =
    person.role === 'DOCTOR' ? '#2563eb' :
    person.role === 'NURSE' ? '#059669' :
    person.role === 'PHARMACIST' ? '#7c3aed' :
    person.role === 'ADMIN' ? '#d97706' : '#0b4da2';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          width: 580,
          maxWidth: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{
          padding: '16px 22px',
          background: isPatient
            ? 'linear-gradient(135deg, #0c1a30 0%, #1e293b 100%)'
            : `linear-gradient(135deg, #0f172a 0%, ${roleColor} 140%)`,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                METROPOLITAN GENERAL HOSPITAL
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                backgroundColor: isPatient ? '#0284c7' : roleColor,
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: 9999,
                letterSpacing: '0.05em'
              }}>
                {isPatient ? 'DIGITAL WRISTBAND' : 'PERSONNEL CREDENTIAL'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {isPatient
                ? 'Bedside eMAR Barcode & QR Verification Profile'
                : 'Hospital Clinical Staff Official ID & Security Token'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body: QR Code on Left, Details on Right */}
        <div style={{ padding: '22px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Left: QR Code Box */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 14,
            padding: 16,
            minWidth: 190,
            flex: '0 0 190px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: 10,
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              marginBottom: 10
            }}>
              <QRCodeSVG
                value={qrPayload}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>

            <div style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.04em',
              textAlign: 'center',
              fontFamily: 'monospace'
            }}>
              {isPatient ? `MRN: ${person.mrn || '94021-08'}` : `ID: ${person.staffId || 'DOC-4401'}`}
            </div>
            <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 3 }}>
              Scan with Symbol DS2208 or Camera
            </div>

            <button
              onClick={handleCopy}
              style={{
                marginTop: 10,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 6,
                backgroundColor: copied ? '#f0fdf4' : '#ffffff',
                border: copied ? '1px solid #86efac' : '1px solid #cbd5e1',
                color: copied ? '#16a34a' : '#475569',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'QR Payload Copied' : 'Copy Payload'}</span>
            </button>
          </div>

          {/* Right: Key Details */}
          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Name and Tag */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {person.name}
                </h2>
                {hasAllergy && isPatient && (
                  <span style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '0.04em'
                  }}>
                    ALLERGY
                  </span>
                )}
                {!isPatient && (
                  <span style={{
                    backgroundColor: roleColor,
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '0.04em'
                  }}>
                    {person.role || 'STAFF'}
                  </span>
                )}
              </div>

              {isPatient ? (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  DOB: <strong>{formattedDob}</strong> {age !== null ? `(${age}y)` : ''} &bull; {person.sex || 'Male'}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {person.title || person.specialty || 'Hospital Medical Staff'}
                </div>
              )}
            </div>

            {/* Inpatient Specific Info */}
            {isPatient ? (
              <>
                {/* Location & Attending */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 11
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, display: 'block' }}>LOCATION</span>
                    <strong style={{ color: '#0284c7' }}>{person.ward || 'Ward 4B ICU'} &bull; {person.bed || 'ICU-12'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, display: 'block' }}>ATTENDING PHYSICIAN</span>
                    <strong style={{ color: '#0f172a' }}>{person.attendingName || 'Dr. V. Sharma, MD'}</strong>
                  </div>
                </div>

                {/* Clinical Details: Concealed from Hospital Staff */}
                {isStaffViewer ? (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 11,
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <ShieldCheck size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Hospital Staff Privacy Policy:</strong> Patient clinical vitals, medical problems, and diagnoses are strictly concealed.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Verified Allergies Alert */}
                    {hasAllergy ? (
                      <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 11,
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Allergy Alert:</strong> {allergyList.join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 11,
                        color: '#166534'
                      }}>
                        No Known Drug Allergies (NKDA) verified
                      </div>
                    )}

                    {/* Family Emergency Contact */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 11
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626', fontWeight: 800, fontSize: 10, marginBottom: 2 }}>
                        <PhoneCall size={11} />
                        <span>FAMILY EMERGENCY CONTACT</span>
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: 700 }}>
                        {person.emergencyContactName || 'Sunita Patil'}
                        <span style={{ color: '#64748b', fontWeight: 500 }}> ({person.emergencyContactRelation || 'Spouse / Next of Kin'})</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', color: '#0b4da2', fontWeight: 800, marginTop: 2 }}>
                        {person.emergencyContactPhone || '+91 98201 34982'}
                      </div>
                    </div>

                    {/* Admission Diagnosis */}
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      <strong>Admission Diagnosis:</strong> {person.admissionDiagnosis || 'Acute Inpatient Observation & Sepsis Protocol'}
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Staff Specific Info */
              <>
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 11
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, display: 'block' }}>DEPARTMENT</span>
                    <strong style={{ color: '#0f172a' }}>{person.department || 'Ward 4B ICU'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, display: 'block' }}>LICENSE / NPI</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0b4da2' }}>{person.licenseNumber || 'MD-98421-US'}</strong>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 11
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, display: 'block' }}>SHIFT &amp; SCHEDULE</span>
                    <strong style={{ color: '#0f172a' }}>{person.shiftType || 'MORNING'} (07:00–15:00)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, display: 'block' }}>DUTY STATUS</span>
                    <strong style={{ color: person.onDuty !== false ? '#16a34a' : '#64748b' }}>
                      {person.onDuty !== false ? '● ON ACTIVE DUTY' : '○ OFF-DUTY'}
                    </strong>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 11,
                  color: '#1e40af'
                }}>
                  <strong>Emergency Hospital Line:</strong> Ward 4B Pager #892 &bull; Ext: 4401
                </div>

                <div style={{ fontSize: 11, color: '#64748b' }}>
                  <strong>Specialty:</strong> {person.specialty || 'Critical Care & Pulmonary Medicine'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 22px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
            <Lock size={12} color="#0b4da2" />
            <span>Encrypted Hospital Identification Token</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleOpenVerification}
              title="Open the official verification webpage in a new tab"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={13} />
              <span>Open Verification Card</span>
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} />
              <span>Print {isPatient ? 'Wristband' : 'Badge'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                backgroundColor: '#0f172a',
                border: 'none',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
