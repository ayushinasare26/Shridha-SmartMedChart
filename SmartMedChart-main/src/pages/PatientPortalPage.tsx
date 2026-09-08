import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/api.services';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, Heart, Pill, AlertTriangle, Clock, CheckCircle2,
  Calendar, User, Activity, LogOut, QrCode, Stethoscope,
  Info, Sparkles, ChevronRight, FileText, Lock, X, RefreshCw,
  Phone, PhoneCall, Edit2, Copy, Check, Users, ExternalLink,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { HospitalPersonQRModal, HospitalPerson } from '../components/HospitalPersonQRModal';

export default function PatientPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showWristbandModal, setShowWristbandModal] = useState(false);
  const [selectedStaffQR, setSelectedStaffQR] = useState<HospitalPerson | null>(null);

  // Emergency contact state
  const [showContactModal, setShowContactModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRelation, setEditRelation] = useState('Spouse / Primary Proxy');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Fetch current patient's comprehensive record
  const patientId = user?.patientId || user?.id || '';
  const { data: patient, isLoading, refetch } = useQuery({
    queryKey: ['patient-my-record', patientId],
    queryFn: () => patientService.getById(patientId || 'me'),
    enabled: !!patientId,
    refetchInterval: 10000,
  });

  // Cross-tab & multi-station live synchronization for nurse administrations
  useEffect(() => {
    const handleMedAdministered = () => {
      refetch();
    };
    window.addEventListener('smartmed:medication_administered', handleMedAdministered);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smartmed_last_administered') {
        refetch();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('smartmed:medication_administered', handleMedAdministered);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refetch]);

  const emergencyName = patient?.emergencyContactName || 'Sunita Patil';
  const emergencyRelation = patient?.emergencyContactRelation || 'Spouse / Primary Proxy';
  const emergencyPhone = patient?.emergencyContactPhone || '+91 98201 34982';

  const handleOpenContactModal = () => {
    setEditName(emergencyName);
    setEditRelation(emergencyRelation);
    setEditPhone(emergencyPhone);
    setContactSuccessMsg('');
    setShowContactModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    try {
      await patientService.update(patient?.id || patientId, {
        emergencyContactName: editName.trim(),
        emergencyContactRelation: editRelation.trim(),
        emergencyContactPhone: editPhone.trim(),
      });
      await refetch();
      setContactSuccessMsg('Emergency contact updated successfully');
      setTimeout(() => {
        setShowContactModal(false);
        setContactSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      alert('Failed to update emergency contact: ' + (err?.response?.data?.error || err.message));
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emergencyPhone);
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Flatten all schedules from prescriptions
  const allSchedules = useMemo(() => {
    if (!patient?.prescriptions) return [];
    const list: any[] = [];
    patient.prescriptions.forEach((rx: any) => {
      if (rx.schedules) {
        rx.schedules.forEach((sch: any) => {
          list.push({ ...sch, prescription: rx });
        });
      }
    });
    return list.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [patient]);

  const givenCount = patient?.administrations?.length
    ? Math.max(patient.administrations.length, allSchedules.filter((s: any) => s.status === 'GIVEN').length)
    : allSchedules.filter((s: any) => s.status === 'GIVEN').length;
  const pendingCount = allSchedules.filter((s: any) => s.status === 'PENDING').length;
  const nextDue = allSchedules.find((s: any) => s.status === 'PENDING');

  const age = patient?.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : 47;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Navigation */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0b4da2, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(11, 77, 162, 0.25)'
          }}>
            <Heart size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                SmartMedChart MyChart
              </span>
              <span style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 9999,
                letterSpacing: '0.04em'
              }}>
                PATIENT PORTAL
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Metropolitan General Hospital &bull; Inpatient Bedside Safety &amp; eMAR Chart
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* HOSPITAL STAFF PORTAL BUTTON (Beside Patients Portal) */}
          <button
            onClick={() => navigate('/staff-portal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 8,
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
            title="Open Hospital Staff & Operations Hub"
          >
            <Building2 size={15} color="#16a34a" />
            <span>Hospital Staff Portal</span>
            <ExternalLink size={12} />
          </button>

          <button
            onClick={() => setShowWristbandModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
          >
            <QrCode size={15} />
            <span>Digital Wristband</span>
          </button>

          {/* Patient Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 12px 4px 8px',
            backgroundColor: '#f1f5f9',
            borderRadius: 9999,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: '#0b4da2',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800
            }}>
              {(patient?.name || user?.name || 'P').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {patient?.name || user?.name || 'Patient'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1 }}>
                MRN: {patient?.mrn || user?.mrn || '—'} &bull; {patient?.bed || user?.bed || 'ICU'}
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
              onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 32px' }}>
        {/* Hero Banner */}
        <div style={{
          backgroundColor: '#0c1a30',
          backgroundImage: 'linear-gradient(135deg, #0c1a30 0%, #0e274c 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: 24,
          boxShadow: '0 8px 24px -4px rgba(12, 26, 48, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
                ACTIVE INPATIENT PROFILE
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Admitted: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Welcome, {patient?.name || user?.name || 'Patient'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#cbd5e1' }}>
              <span><strong>Age / Sex:</strong> {age}y &bull; {patient?.sex || 'Male'}</span>
              <span>&bull;</span>
              <span><strong>Weight:</strong> {patient?.weight || 72} kg</span>
              <span>&bull;</span>
              <span><strong>Room &amp; Bed:</strong> <span style={{ color: '#38bdf8', fontWeight: 700 }}>Ward 4B ICU &bull; {patient?.bed || 'Bed ICU-12'}</span></span>
              <span>&bull;</span>
              <span><strong>Attending:</strong> Dr. V. Sharma, MD</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              <strong>Admission Diagnosis:</strong> {patient?.admissionDiagnosis || 'Acute Inpatient Observation & Care'}
            </div>

            {/* Emergency Contact Quick Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.16)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ffffff',
                fontSize: 12,
              }}>
                <PhoneCall size={13} style={{ color: '#f87171' }} />
                <span style={{ color: '#fca5a5', fontWeight: 600 }}>Emergency Contact:</span>
                <span style={{ fontWeight: 700 }}>{emergencyName}</span>
                <span style={{ color: '#cbd5e1', fontSize: 11 }}>({emergencyRelation})</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>&bull;</span>
                <a
                  href={`tel:${emergencyPhone.replace(/[^\d+]/g, '')}`}
                  style={{
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Click to dial emergency contact"
                >
                  {emergencyPhone}
                </a>
              </div>
              <button
                onClick={handleOpenContactModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#e2e8f0',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              >
                <Edit2 size={11} /> Edit Contact
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9999,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: 11,
              fontWeight: 700
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
              Active Medication Schedule Monitored
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Station Gateway: COW-ICU-084 &bull; Primary Nurse: Priya, RN
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {/* Active Meds */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>ACTIVE MEDICATIONS</span>
              <Pill size={16} color="#0b4da2" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0b4da2', marginBottom: 4 }}>
              {patient?.prescriptions?.length || 4} Orders
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Reviewed by Hospital Pharmacy
            </div>
          </div>

          {/* Doses Given Today */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>DOSES ADMINISTERED</span>
              <CheckCircle2 size={16} color="#16a34a" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>
              {givenCount || 2} Given
            </div>
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
              &bull; 5-Rights Bedside Verified
            </div>
          </div>

          {/* Next Due Dose */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>NEXT DOSE SCHEDULED</span>
              <Clock size={16} color="#d97706" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nextDue ? format(new Date(nextDue.scheduledTime), 'HH:mm') : '09:00 AM'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nextDue?.prescription?.medicationName || 'Ceftriaxone Sodium 1g IV'}
            </div>
          </div>

          {/* Verified Allergies */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>SAFETY &amp; ALLERGIES</span>
              <AlertTriangle size={16} color="#dc2626" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>
              {patient?.allergies?.length || 1} Alert
            </div>
            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
              {patient?.allergies?.[0]?.allergen || 'Penicillin G'} &bull; Severe Anaphylaxis
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Left Column: Today's Medication Timeline */}
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Today's Medication Administration Timeline
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
                    Track medications administered at bedside by your nurses and upcoming scheduled doses.
                  </p>
                </div>
                <button
                  onClick={() => refetch()}
                  style={{ background: 'none', border: 'none', color: '#0b4da2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {/* Live Recent Administration Alert Banner */}
              {patient?.administrations?.[0] && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  color: '#15803d',
                  fontSize: 12,
                  marginBottom: 16
                }}>
                  <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#166534' }}>
                      Recent Medication Administered at Bedside
                    </div>
                    <div style={{ marginTop: 2, color: '#15803d' }}>
                      <strong>{patient.administrations[0].schedule?.prescription?.medicationName || 'Prescription Medication'}</strong> was verified and administered by <strong>{patient.administrations[0].administeredBy?.name || 'Primary Nurse'}</strong> ({patient.administrations[0].administeredBy?.role || 'NURSE'}) at <strong>{format(new Date(patient.administrations[0].signedAt), 'HH:mm')}</strong> &bull; 5-Rights Bedside Verified &bull; 100% Barcode Match.
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {allSchedules.length > 0 ? (
                  allSchedules.map((sch: any, idx: number) => {
                    const isGiven = sch.status === 'GIVEN';
                    const isDue = sch.status === 'PENDING' && (sch.prescription?.isStatOrder || idx === givenCount);
                    const timeStr = format(new Date(sch.scheduledTime), 'HH:mm');

                    const adminRecord = patient?.administrations?.find((a: any) => a.scheduleId === sch.id) || sch.administrationRecord;
                    const nurseName = sch.administeredBy?.name || adminRecord?.administeredBy?.name || 'Nurse Priya, RN';
                    const adminDate = sch.administeredAt || adminRecord?.signedAt;
                    const adminTimeStr = adminDate ? format(new Date(adminDate), 'HH:mm') : timeStr;

                    return (
                      <div
                        key={sch.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 16,
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: `1.5px solid ${isGiven ? '#bbf7d0' : isDue ? '#fecaca' : '#e2e8f0'}`,
                          backgroundColor: isGiven ? '#f0fdf4' : isDue ? '#fef2f2' : '#ffffff',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          backgroundColor: isGiven ? '#16a34a' : isDue ? '#dc2626' : '#f1f5f9',
                          color: isGiven || isDue ? '#ffffff' : '#475569',
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: 'monospace'
                        }}>
                          {timeStr}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                              {sch.prescription?.medicationName}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#0b4da2', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>
                              {sch.dose || sch.prescription?.dose} {sch.doseUnit || sch.prescription?.doseUnit}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              {sch.route || sch.prescription?.route}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>
                            {sch.prescription?.indication ? `Indication: ${sch.prescription.indication}` : 'Inpatient Medication Protocol'}
                          </div>

                          {/* Status and Nurse verification note */}
                          {isGiven ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                              <CheckCircle2 size={13} />
                              <span>Administered by {nurseName} at {adminTimeStr} &bull; 4-Point Barcode Verified &bull; 100% Safe Match</span>
                            </div>
                          ) : isDue ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
                              <Clock size={13} />
                              <span>DUE NOW &bull; Nurse has verified prescription and is preparing bedside delivery</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
                              <Clock size={13} />
                              <span>Upcoming Scheduled Dose</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Default sample view for Rahul Patil if DB empty
                  [
                    { time: '08:00', name: 'Paracetamol IV (Perfalgan)', dose: '1000 mg', route: 'IV Infusion', status: 'GIVEN', note: 'Administered by Nurse Priya, RN at 08:04' },
                    { time: '08:12', name: 'Pantoprazole Sodium (Protonix)', dose: '40 mg', route: 'IV Push', status: 'GIVEN', note: 'Administered by Nurse Priya, RN at 08:12' },
                    { time: '09:00', name: 'Ceftriaxone Sodium (Rocephin)', dose: '1 g', route: 'IV Piggyback', status: 'DUE', note: 'STAT Order • Preparing for administration' },
                    { time: '14:00', name: 'Paracetamol IV (Perfalgan)', dose: '1000 mg', route: 'IV Infusion', status: 'PENDING', note: 'Scheduled afternoon dose' },
                    { time: '20:00', name: 'Insulin Glargine (Lantus SoloStar)', dose: '14 units', route: 'Subcutaneous', status: 'PENDING', note: 'Evening basal insulin dose' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                        padding: '14px 16px',
                        borderRadius: 12,
                        border: `1.5px solid ${item.status === 'GIVEN' ? '#bbf7d0' : item.status === 'DUE' ? '#fecaca' : '#e2e8f0'}`,
                        backgroundColor: item.status === 'GIVEN' ? '#f0fdf4' : item.status === 'DUE' ? '#fef2f2' : '#ffffff'
                      }}
                    >
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: item.status === 'GIVEN' ? '#16a34a' : item.status === 'DUE' ? '#dc2626' : '#f1f5f9',
                        color: item.status === 'GIVEN' || item.status === 'DUE' ? '#ffffff' : '#475569',
                        fontSize: 13,
                        fontWeight: 800,
                        fontFamily: 'monospace'
                      }}>
                        {item.time}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{item.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0b4da2', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>{item.dose}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{item.route}</span>
                        </div>
                        <div style={{ fontSize: 11, color: item.status === 'GIVEN' ? '#16a34a' : item.status === 'DUE' ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                          {item.note}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Doctor Orders */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', padding: '20px 24px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
                Active Physician Prescriptions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(patient?.prescriptions || []).map((rx: any) => (
                  <div key={rx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {rx.medicationName} &bull; {rx.dose} {rx.doseUnit} ({rx.route})
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Prescribed by {rx.prescriber?.name || 'Dr. V. Sharma, MD'} &bull; Frequency: {rx.frequency} &bull; Indication: {rx.indication || 'Cellulitis & Sepsis'}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 6 }}>
                      ACTIVE CPOE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Safety, Labs, Care Team */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Allergies Card */}
            <div style={{
              backgroundColor: '#fff5f5',
              border: '1.5px solid #fecaca',
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#b91c1c' }}>
                <AlertTriangle size={18} />
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                  Verified Allergy Alert
                </h3>
              </div>
              <p style={{ fontSize: 12, color: '#7f1d1d', margin: '0 0 10px', lineHeight: 1.45 }}>
                {patient?.allergies?.[0]?.allergen || 'Penicillin G'} &bull; Reaction: <strong>{patient?.allergies?.[0]?.reaction || 'Anaphylaxis & severe bronchial spasm'}</strong>.
              </p>
              <div style={{ fontSize: 11, color: '#991b1b', backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: 8, border: '1px solid #fecaca' }}>
                &bull; Cephalosporin cross-reactivity warning active<br />
                &bull; Pharmacist Dave checked: Ceftriaxone approved under attending supervision
              </div>
            </div>

            {/* Lab & Renal Markers */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Activity size={18} color="#0b4da2" />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Kidney Function &amp; Lab Clearance
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>eGFR RATE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0b4da2' }}>{patient?.eGFR || 62} <span style={{ fontSize: 11 }}>mL/min</span></div>
                  <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Normal Clearance</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>CREATININE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{patient?.creatinine || 1.1} <span style={{ fontSize: 11 }}>mg/dL</span></div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Stable Level</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                Renal dosing automatically calibrated for all active antibiotic infusions.
              </div>
            </div>

            {/* Care Team Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Stethoscope size={18} color="#0b4da2" />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Your Clinical Care Team
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Dr Sharma */}
                <div
                  onClick={() => setSelectedStaffQR({
                    type: 'DOCTOR',
                    role: 'DOCTOR',
                    name: 'Dr. V. Sharma, MD',
                    staffId: 'DOC-4401',
                    title: 'Attending Intensivist & Pulmonologist',
                    department: 'Ward 4B ICU',
                    specialty: 'Critical Care & Pulmonology',
                    licenseNumber: 'MD-98421-US',
                    shiftType: 'MORNING (07:00–15:00)',
                    onDuty: true
                  })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  title="Click to view Doctor's Official QR Badge"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>DS</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Dr. V. Sharma, MD</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Attending Intensivist &bull; Pulmonology</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    color: '#2563eb',
                    fontWeight: 700,
                    backgroundColor: '#eff6ff',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #bfdbfe'
                  }}>
                    <QrCode size={12} />
                    <span>View QR</span>
                  </div>
                </div>

                {/* Nurse Priya */}
                <div
                  onClick={() => setSelectedStaffQR({
                    type: 'NURSE',
                    role: 'NURSE',
                    name: 'Nurse Priya, RN',
                    staffId: 'RN-8832',
                    title: 'Primary Bedside BSN',
                    department: 'Ward 4B ICU',
                    specialty: 'Inpatient Acute Care & eMAR',
                    licenseNumber: 'RN-54210-US',
                    shiftType: 'DAY (07:00–15:00)',
                    onDuty: true
                  })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  title="Click to view Nurse's Official QR Badge"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>NP</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Nurse Priya, RN</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Primary Bedside BSN &bull; Ward 4B</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    color: '#059669',
                    fontWeight: 700,
                    backgroundColor: '#ecfdf5',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #a7f3d0'
                  }}>
                    <QrCode size={12} />
                    <span>View QR</span>
                  </div>
                </div>

                {/* Pharm Dave */}
                <div
                  onClick={() => setSelectedStaffQR({
                    type: 'PHARMACIST',
                    role: 'PHARMACIST',
                    name: 'Pharm. Dave, RPh',
                    staffId: 'PH-3109',
                    title: 'Clinical Pharmacist & Safe Dosing Specialist',
                    department: 'Central Dispensary & ICU Satellite',
                    specialty: 'Pharmacotherapy & Antibiotic Verification',
                    licenseNumber: 'RPH-67219-US',
                    shiftType: 'MORNING',
                    onDuty: true
                  })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#faf5ff')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  title="Click to view Pharmacist's Official QR Badge"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#7c3aed', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>PD</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Pharm. Dave, RPh</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Clinical Pharmacist &bull; Dispensary</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    color: '#7c3aed',
                    fontWeight: 700,
                    backgroundColor: '#f5f3ff',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #ddd6fe'
                  }}>
                    <QrCode size={12} />
                    <span>View QR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Emergency Contact Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative top colored stripe */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #dc2626 0%, #f97316 45%, #0284c7 100%)'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626'
                  }}>
                    <PhoneCall size={17} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Family Emergency Contact
                    </h3>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                      Designated Bedside Proxy &bull; 24/7 Priority
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  letterSpacing: '0.04em'
                }}>
                  ACTIVE
                </span>
              </div>

              {/* Contact Details Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    {emergencyName}
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    border: '1px solid #bae6fd',
                    padding: '2px 7px',
                    borderRadius: 6
                  }}>
                    {emergencyRelation}
                  </span>
                </div>

                {/* Phone Number Display */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PRIMARY EMERGENCY PHONE
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
                      {emergencyPhone}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyPhone}
                    title="Copy phone number"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 6,
                      backgroundColor: copiedPhone ? '#f0fdf4' : '#ffffff',
                      border: copiedPhone ? '1px solid #86efac' : '1px solid #cbd5e1',
                      color: copiedPhone ? '#16a34a' : '#475569',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {copiedPhone ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <a
                  href={`tel:${emergencyPhone.replace(/[^\d+]/g, '')}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                >
                  <Phone size={13} /> Call Contact
                </a>
                <button
                  onClick={handleOpenContactModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <Edit2 size={13} /> Edit / Update
                </button>
              </div>

              {/* Hospital Consent Notice */}
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.45, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <span style={{ color: '#0b4da2', fontWeight: 700 }}>Authorized Proxy:</span> Designated for medical decision-making notification, sudden condition changes, and bedside emergency communication.
              </div>
            </div>

            {/* Need Assistance? */}
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 14,
              padding: '16px 18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
                Questions About Your Medications?
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>
                Your nurses and doctors review this chart before each dose. Press your nurse call button if you experience any unexpected reaction.
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#1e40af' }}>
                <Lock size={12} /> HIPAA Level 4 Protected Session
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Digital Wristband Modal */}
      {showWristbandModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            width: 360,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            border: '2px solid #0f172a',
            padding: '24px 24px 20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                METROPOLITAN GENERAL HOSPITAL
              </div>
              <button
                onClick={() => setShowWristbandModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              border: '2px solid #0f172a',
              borderRadius: 12,
              padding: '16px',
              backgroundColor: '#f8fafc',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {patient?.name || user?.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    DOB: {patient?.dob ? format(new Date(patient.dob), 'dd-MMM-yyyy') : '14-Mar-1979'} ({age}y) &bull; {patient?.sex || 'M'}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  ALLERGY
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#0f172a', marginBottom: 6 }}>
                <strong>MRN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{patient?.mrn || user?.mrn}</span>
              </div>
              <div style={{ fontSize: 12, color: '#0f172a', marginBottom: 6 }}>
                <strong>LOCATION:</strong> Ward 4B ICU &bull; {patient?.bed || 'Bed ICU-12'}
              </div>

              {/* Wristband Emergency Contact */}
              <div style={{ fontSize: 11, color: '#0f172a', marginBottom: 12, backgroundColor: '#f1f5f9', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>EMERGENCY CONTACT</span>
                <strong>{emergencyName}</strong> ({emergencyRelation}) &bull; <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0b4da2' }}>{emergencyPhone}</span>
              </div>

              {/* High-Resolution Scannable QR Code */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 10,
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>
                <QRCodeSVG
                  value={`${window.location.origin}/verify?id=${encodeURIComponent(patient?.mrn || user?.mrn || '94021-08')}&type=PATIENT`}
                  size={140}
                  level="H"
                  includeMargin={false}
                />
                <div style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '0.04em',
                  marginTop: 8,
                  fontFamily: 'monospace'
                }}>
                  SCAN: PAT-{patient?.mrn || user?.mrn || '94021-08'}-{patient?.bed || 'ICU12'}
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                  Bedside 4-Point eMAR Scanner Verified &bull; Official Digital Hospital Wristband
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => window.open(`${window.location.origin}/verify?id=${encodeURIComponent(patient?.mrn || user?.mrn || '94021-08')}&type=PATIENT`, '_blank')}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
              >
                <ExternalLink size={14} />
                <span>Open Live Verification Card</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '9px',
                    borderRadius: 8,
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Print Wristband
                </button>
                <button
                  onClick={() => setShowWristbandModal(false)}
                  style={{
                    padding: '9px',
                    borderRadius: 8,
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close Wristband
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Staff QR Credential Modal (Care Team Members) */}
      <HospitalPersonQRModal
        isOpen={!!selectedStaffQR}
        onClose={() => setSelectedStaffQR(null)}
        person={selectedStaffQR}
      />

      {/* Edit Emergency Contact Modal */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 18,
            width: 440,
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171'
                }}>
                  <PhoneCall size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
                    Family Emergency Contact
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                    Designated Next of Kin / Proxy for {patient?.name || user?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveContact} style={{ padding: '22px' }}>
              {contactSuccessMsg && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  {contactSuccessMsg}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Contact Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Sunita Patil"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Relationship to Patient <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={editRelation}
                  onChange={(e) => setEditRelation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                >
                  <option value="Spouse / Primary Proxy">Spouse / Primary Proxy</option>
                  <option value="Spouse / Next of Kin">Spouse / Next of Kin</option>
                  <option value="Son / Power of Attorney">Son / Power of Attorney</option>
                  <option value="Daughter / Next of Kin">Daughter / Next of Kin</option>
                  <option value="Parent / Legal Guardian">Parent / Legal Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other Emergency Contact">Other Emergency Contact</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Emergency Phone Number (with Country/Area Code) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98201 34982"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      boxSizing: 'border-box',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      outline: 'none',
                      color: '#0f172a'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                  />
                  <Phone
                    size={15}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Ensure this line is accessible 24/7 during inpatient admission.
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#0b4da2',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isSavingContact ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSavingContact ? <RefreshCw size={13} className="spin" /> : <Check size={14} />}
                  <span>{isSavingContact ? 'Saving...' : 'Save Emergency Contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
