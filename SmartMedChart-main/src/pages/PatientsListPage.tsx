import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/api.services';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, Plus, User, QrCode, X, RefreshCw, Heart } from 'lucide-react';
import { useState } from 'react';
import { format, differenceInYears } from 'date-fns';
import { HospitalPersonQRModal, HospitalPerson } from '../components/HospitalPersonQRModal';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';
import { useAuth } from '../hooks/useAuth';

export default function PatientsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPatientForQR, setSelectedPatientForQR] = useState<HospitalPerson | null>(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitError, setAdmitError] = useState<string | null>(null);

  const generateNewMRN = () => `MRN-${Math.floor(100000 + Math.random() * 900000)}`;

  const [admitForm, setAdmitForm] = useState({
    name: '',
    mrn: generateNewMRN(),
    dob: format(new Date(), 'yyyy-MM-dd'),
    sex: 'Male',
    weight: '70',
    bed: 'Bed ICU-01',
    admissionDiagnosis: 'Acute Inpatient Care',
    codeStatus: 'Full',
    npoStatus: false,
    isolationStatus: false,
    allergy: ''
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients-all'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  const handleOpenAdmitModal = () => {
    // Find first available ICU bed
    const occupiedBeds = new Set((patients as any[]).map(p => (p.bed || '').toUpperCase().trim()));
    let nextBed = 'Bed ICU-01';
    for (let i = 1; i <= 18; i++) {
      const candidate = `BED ICU-${String(i).padStart(2, '0')}`;
      if (!occupiedBeds.has(candidate) && !occupiedBeds.has(`ICU-${String(i).padStart(2, '0')}`)) {
        nextBed = `Bed ICU-${String(i).padStart(2, '0')}`;
        break;
      }
    }
    setAdmitForm({
      name: '',
      mrn: generateNewMRN(),
      dob: format(new Date(), 'yyyy-MM-dd'),
      sex: 'Male',
      weight: '70',
      bed: nextBed,
      admissionDiagnosis: 'Acute Inpatient Care',
      codeStatus: 'Full',
      npoStatus: false,
      isolationStatus: false,
      allergy: ''
    });
    setAdmitError(null);
    setShowAdmitModal(true);
  };

  const admitMutation = useMutation({
    mutationFn: (data: any) => patientService.create({
      ...data,
      dob: data.dob || format(new Date(), 'yyyy-MM-dd'),
      weight: parseFloat(String(data.weight)) || 70,
    }),
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients-all'] });
      setShowAdmitModal(false);
      setAdmitError(null);
      navigate(`/patients/${newPatient.id}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Patient admission failed.';
      setAdmitError(String(msg));
    }
  });

  const filtered = (patients as any[]).filter(p =>
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
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={handleOpenAdmitModal}>
            <Plus size={13} /> Admit Patient
          </button>
        </div>
      </div>

      <WorkflowStepsNavBar />

      <div className="page-content">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Active Inpatients — Ward 4B ICU <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--color-text-muted)' }}>({filtered.length} of 18 beds)</span>
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
                style={{ padding: 0, cursor: 'pointer', overflow: 'hidden', borderColor: criticalAllergy ? 'rgba(239,68,68,0.3)' : 'var(--color-border)' }}
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                {/* Card Header */}
                <div style={{ padding: '14px 16px', background: 'rgba(10,15,26,0.5)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--color-accent-blue-light)', flexShrink: 0 }}>
                    {(p.bed || 'XX').replace('ICU-', '')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{p.name}</span>
                      {p.npoStatus && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-due-amber)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 3, padding: '1px 5px' }}>NPO</span>}
                      {p.isolationStatus && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-stat-red)', background: 'var(--color-stat-red-bg)', border: '1px solid var(--color-stat-red-border)', borderRadius: 3, padding: '1px 5px' }}>ISOLATION</span>}
                      {statRx && <span className="chip chip-stat" style={{ fontSize: 9 }}>STAT</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>MRN: {p.mrn} · {p.sex} · {age}y · {p.weight}kg</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-blue-light)' }}>Bed {p.bed}</div>
                    {user?.role !== 'NURSE' && (
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
                          gap: 4,
                          padding: '2px 7px',
                          borderRadius: 5,
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: 'var(--color-accent-blue-light)',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="View Patient Digital Wristband & QR Code"
                      >
                        <QrCode size={11} />
                        <span>QR Wristband</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '12px 16px' }}>
                  {p.admissionDiagnosis && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Dx: </span>{p.admissionDiagnosis.slice(0, 60)}{p.admissionDiagnosis.length > 60 ? '...' : ''}
                    </div>
                  )}

                  {/* Allergies */}
                  {hasAllergy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <AlertTriangle size={11} color={criticalAllergy ? 'var(--color-stat-red)' : 'var(--color-due-amber)'} />
                      <span style={{ fontSize: 11, color: criticalAllergy ? 'var(--color-stat-red)' : 'var(--color-due-amber)', fontWeight: 600 }}>
                        {p.allergies.map((a: any) => a.allergen).join(', ')} Allergy
                      </span>
                    </div>
                  )}

                  {/* Active Prescriptions count */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.prescriptions?.slice(0, 3).map((rx: any) => (
                      <span key={rx.id} style={{ fontSize: 10, background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 7px', color: 'var(--color-text-muted)' }}>
                        {rx.medicationName.split(' ')[0]}
                      </span>
                    ))}
                    {(p.prescriptions?.length || 0) > 3 && (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{p.prescriptions.length - 3} more</span>
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

      {/* Admit Patient Modal */}
      {showAdmitModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 18, width: '100%', maxWidth: 580, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Heart size={18} color="#0284c7" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Admit Inpatient to Ward 4B ICU</h3>
              </div>
              <button onClick={() => setShowAdmitModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setAdmitError(null); admitMutation.mutate(admitForm); }}>
              <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
                
                {admitError && (
                  <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                    ⚠️ {admitError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Patient Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter legal name..."
                      value={admitForm.name}
                      onChange={(e) => setAdmitForm({ ...admitForm, name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                        MRN (Medical Record Number) *
                      </label>
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: 4 }}>
                        Auto-Generated
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        required
                        value={admitForm.mrn}
                        onChange={(e) => setAdmitForm({ ...admitForm, mrn: e.target.value })}
                        style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: '1.5px solid #0284c7', borderRadius: 8, fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', backgroundColor: '#f0f9ff', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setAdmitForm(prev => ({ ...prev, mrn: generateNewMRN() }))}
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: 11, fontWeight: 600, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Generate fresh unique MRN"
                      >
                        <RefreshCw size={12} />
                        <span>New MRN</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={admitForm.dob}
                      onChange={(e) => setAdmitForm({ ...admitForm, dob: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Bed Assignment *</label>
                    <select
                      required
                      value={admitForm.bed}
                      onChange={(e) => setAdmitForm({ ...admitForm, bed: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    >
                      {Array.from({ length: 18 }, (_, i) => `Bed ICU-${String(i + 1).padStart(2, '0')}`).map(b => {
                        const isOccupied = (patients as any[]).some(p => (p.bed || '').toUpperCase().includes(b.replace('Bed ', '').toUpperCase()));
                        return (
                          <option key={b} value={b} disabled={isOccupied}>
                            {b} {isOccupied ? '(OCCUPIED)' : '(AVAILABLE)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Admission Diagnosis *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acute Respiratory Distress, Post-op ICU Care..."
                      value={admitForm.admissionDiagnosis}
                      onChange={(e) => setAdmitForm({ ...admitForm, admissionDiagnosis: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Sex</label>
                    <select
                      value={admitForm.sex}
                      onChange={(e) => setAdmitForm({ ...admitForm, sex: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={admitForm.weight}
                      onChange={(e) => setAdmitForm({ ...admitForm, weight: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Allergies / ADR</label>
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Sulfa, or leave blank if NKDA"
                      value={admitForm.allergy}
                      onChange={(e) => setAdmitForm({ ...admitForm, allergy: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" checked={admitForm.npoStatus} onChange={(e) => setAdmitForm({ ...admitForm, npoStatus: e.target.checked })} style={{ accentColor: '#d97706' }} />
                    <span>NPO (Nil Per Os) Active</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" checked={admitForm.isolationStatus} onChange={(e) => setAdmitForm({ ...admitForm, isolationStatus: e.target.checked })} style={{ accentColor: '#dc2626' }} />
                    <span>Infection Isolation Active</span>
                  </label>
                </div>
              </div>

              <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAdmitModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={admitMutation.isPending} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {admitMutation.isPending ? 'Admitting & Generating eMAR...' : 'Admit & Open eMAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
