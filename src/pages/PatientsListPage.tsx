import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/api.services';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, Plus, User, QrCode } from 'lucide-react';
import { useState } from 'react';
import { format, differenceInYears } from 'date-fns';
import { HospitalPersonQRModal, HospitalPerson } from '../components/HospitalPersonQRModal';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';
import { PatientCaseFileModal } from '../components/PatientCaseFileModal';
import { ClipboardList } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

export default function PatientsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedPatientForQR, setSelectedPatientForQR] = useState<HospitalPerson | null>(null);
  const [selectedCaseFileId, setSelectedCaseFileId] = useState<string | null>(null);

  const { data: rawPatients = [], isLoading } = useQuery({
    queryKey: ['patients-all'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  const isDoctor = user?.role === 'DOCTOR';
  const myPatients = (rawPatients as any[]).filter(p => {
    if (isDoctor && user?.id) {
      return p.attendingId === user.id;
    }
    return true;
  });

  const filtered = myPatients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.includes(search) ||
    (p.bed || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div className="top-bar">
        <div className="top-bar-section">
          <User size={14} color="var(--color-accent-blue-light)" />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Patient Management</span>
        </div>
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Search patient name, MRN, or bed..." style={{ paddingLeft: 28, width: 280, height: 34 }} />
          </div>
          <button className="btn-primary" style={{ fontSize: 12 }}><Plus size={13} /> Admit Patient</button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {isDoctor ? 'My Assigned Inpatients — Ward 4B ICU' : 'Active Inpatients — Ward 4B ICU'} <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--color-text-muted)' }}>({filtered.length} patients)</span>
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, height: 160, opacity: 0.4 }}>
              <div style={{ background: 'var(--color-bg-hover)', borderRadius: 4, height: 14, width: '60%', marginBottom: 8 }} />
              <div style={{ background: 'var(--color-bg-hover)', borderRadius: 4, height: 10, width: '40%', marginBottom: 6 }} />
              <div style={{ background: 'var(--color-bg-hover)', borderRadius: 4, height: 10, width: '80%' }} />
            </div>
          ))}

          {filtered.map((p: any) => {
            const age = p.dob ? differenceInYears(new Date(), new Date(p.dob)) : '—';
            const hasAllergy = p.allergies?.length > 0;
            const criticalAllergy = p.allergies?.some((a: any) => a.severity === 'Anaphylaxis' || a.severity === 'Severe');
            const statRx = p.prescriptions?.some((rx: any) => rx.isStatOrder && rx.status === 'STAT');

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  border: criticalAllergy ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                {/* Card Header — Clean Clinical Light Style */}
                <div style={{
                  padding: '14px 16px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#1d4ed8',
                    flexShrink: 0
                  }}>
                    {(p.bed || 'XX').replace('ICU-', '')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{p.name}</span>
                      {p.npoStatus && <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 3, padding: '1px 5px' }}>NPO</span>}
                      {p.isolationStatus && <span style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3, padding: '1px 5px' }}>ISOLATION</span>}
                      {statRx && <span className="chip chip-stat" style={{ fontSize: 9 }}>STAT</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      MRN: <span style={{ fontWeight: 600, color: '#334155' }}>{p.mrn}</span> &bull; {p.sex} &bull; {age}y &bull; {p.weight}kg
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0b4da2' }}>Bed {p.bed}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatientForQR({
                            type: 'PATIENT',
                            name: p.name,
                            mrn: p.mrn,
                            dob: p.dob,
                            sex: p.sex,
                            bed: p.bed,
                            ward: 'Ward 4B ICU',
                            allergies: p.allergies,
                            emergencyContactName: p.emergencyContactName,
                            emergencyContactRelation: p.emergencyContactRelation,
                            emergencyContactPhone: p.emergencyContactPhone,
                            attendingName: 'Dr. V. Sharma, MD',
                            admissionDiagnosis: p.admissionDiagnosis
                          });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="View Patient Digital Wristband & QR Code"
                      >
                        <QrCode size={11} />
                        <span>QR Wristband</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCaseFileId(p.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#059669',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Open Comprehensive Patient Case File"
                      >
                        <ClipboardList size={11} />
                        <span>Case File</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '12px 16px', backgroundColor: '#ffffff' }}>
                  {p.admissionDiagnosis && (
                    <div style={{ fontSize: 12, color: '#334155', marginBottom: 8, lineHeight: 1.4 }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Dx: </span>{p.admissionDiagnosis}
                    </div>
                  )}

                  {/* Allergies */}
                  {hasAllergy && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8,
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: criticalAllergy ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${criticalAllergy ? '#fecaca' : '#fde68a'}`,
                      color: criticalAllergy ? '#b91c1c' : '#b45309',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      <AlertTriangle size={12} color={criticalAllergy ? '#dc2626' : '#d97706'} />
                      <span>{p.allergies.map((a: any) => a.allergen).join(', ')} Allergy</span>
                    </div>
                  )}

                  {/* Active Prescriptions count */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {p.prescriptions?.slice(0, 3).map((rx: any) => (
                      <span key={rx.id} style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4,
                        padding: '2px 7px',
                        color: '#475569'
                      }}>
                        {rx.medicationName?.split('(')[0]?.trim()}
                      </span>
                    ))}
                    {p.prescriptions?.length > 3 && (
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                        +{p.prescriptions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
            <User size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            {search ? 'No patients matching your search.' : 'No active patients found.'}
          </div>
        )}
      </div>

      {/* Patient Digital Wristband & QR Modal */}
      <HospitalPersonQRModal
        isOpen={!!selectedPatientForQR}
        onClose={() => setSelectedPatientForQR(null)}
        person={selectedPatientForQR}
      />

      {/* Patient Clinical Case File Modal */}
      {selectedCaseFileId && (
        <PatientCaseFileModal
          patientId={selectedCaseFileId}
          onClose={() => setSelectedCaseFileId(null)}
          onNewOrder={(patId) => navigate(`/prescriptions/new?patientId=${patId}`)}
        />
      )}
    </div>
  );
}
