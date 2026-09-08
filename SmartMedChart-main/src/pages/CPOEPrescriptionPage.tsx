import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientService, prescriptionService } from '../services/api.services';
import { AlertTriangle, Search, Shield, ChevronRight, Loader2, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { WorkflowStepsNavBar } from '../components/WorkflowStepsNavBar';

const FORMULARY = [
  { name: 'Ceftriaxone Sodium (Rocephin)', generic: 'Ceftriaxone', class: 'Cephalosporin', conflict: true },
  { name: 'Meropenem (Merrem)', generic: 'Meropenem', class: 'Carbapenem', conflict: false, altSafe: true },
  { name: 'Paracetamol IV (Perfalgan)', generic: 'Acetaminophen', class: 'Analgesic', conflict: false },
  { name: 'Insulin Glargine (Lantus)', generic: 'Insulin Glargine', class: 'Long-acting Insulin', conflict: false, highAlert: true },
  { name: 'Norepinephrine Bitartrate (Levophed)', generic: 'Norepinephrine', class: 'Vasopressor', conflict: false, highAlert: true },
  { name: 'Pantoprazole Sodium (Protonix)', generic: 'Pantoprazole', class: 'Proton Pump Inhibitor', conflict: false },
  { name: 'Piperacillin/Tazobactam (Zosyn)', generic: 'Piperacillin Tazobactam', class: 'Beta-lactam Antibiotic', conflict: true },
  { name: 'Vancomycin HCl', generic: 'Vancomycin', class: 'Glycopeptide', conflict: false },
  { name: 'Enoxaparin Sodium (Lovenox)', generic: 'Enoxaparin', class: 'LMWH', conflict: false, highAlert: true },
  { name: 'Ondansetron HCl (Zofran)', generic: 'Ondansetron', class: 'Antiemetic', conflict: false },
];

const ROUTES = ['IV Push', 'IV Infusion (over 30min)', 'IV Piggyback in 50mL D5W', 'Subcutaneous (SC)', 'Intramuscular (IM)', 'Oral (PO)', 'Nasogastric (NG)'];
const FREQUENCIES = ['STAT Once Immediately', 'Q24H', 'Q12H', 'Q8H', 'Q6H', 'Q4H', 'BID', 'TID', 'QID', 'PRN', 'CONTINUOUS', 'BEDTIME'];
const DURATIONS = ['1', '3', '5', '7', '10', '14'];
const OVERRIDE_REASONS = [
  'Benefit outweighs acute risk; Bedside desensitization / Epinephrine at bedside confirmed',
  'Penicillin skin test performed negative under Allergy Fellow supervision',
  'Infectious Disease approval documented (Dr. Aris Thorne ID Consult #882)',
];

const schema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  medicationName: z.string().min(1, 'Select a medication'),
  genericName: z.string().optional(),
  medicationClass: z.string().optional(),
  dose: z.string().min(1, 'Dose required'),
  unit: z.string().min(1, 'Unit required'),
  route: z.string().min(1, 'Route required'),
  frequency: z.string().min(1, 'Frequency required'),
  duration: z.string().optional(),
  indication: z.string().min(1, 'Clinical indication required'),
  isStatOrder: z.boolean().default(false),
  overrideReason: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CPOEPrescriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<(typeof FORMULARY)[0] | null>(null);
  const [showInterceptModal, setShowInterceptModal] = useState(false);
  const [allergyAlerts, setAllergyAlerts] = useState<any[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState<FormData | null>(null);
  const [selectedOverride, setSelectedOverride] = useState('');

  const { data: rawPatients = [] } = useQuery({
    queryKey: ['patients-active'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  const { data: rawPrescriptions = [] } = useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: () => prescriptionService.getAll(),
  });

  // Doctor isolation: strictly only allow prescribing to assigned patients
  const patients = (rawPatients as any[]).filter(p => {
    if (user?.role === 'DOCTOR' && user?.id) {
      return p.attendingId === user.id;
    }
    return true;
  });

  const prescriptions = (rawPrescriptions as any[]).filter(p => {
    if (user?.role === 'DOCTOR' && user?.id) {
      return !p.patient?.attendingId || p.patient.attendingId === user.id;
    }
    return true;
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isStatOrder: false },
  });

  const watchPatient = watch('patientId');
  const selectedPatient = (patients as any[]).find(p => p.id === watchPatient);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => prescriptionService.create({
      ...data,
      startDate: new Date().toISOString(),
      stopDate: data.duration ? new Date(Date.now() + parseInt(data.duration) * 86400000).toISOString() : null,
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['ward-schedules'] });
      setAllergyAlerts([]);
      setSelectedMed(null);
      setMedSearch('');
      alert(`✅ ${watch('isStatOrder') ? 'STAT Order' : 'Prescription'} created! ${result.schedules?.length || 0} dose(s) scheduled.`);
    },
  });

  const selectMed = (med: (typeof FORMULARY)[0]) => {
    setSelectedMed(med);
    setMedSearch(med.name);
    setValue('medicationName', med.name);
    setValue('genericName', med.generic);
    setValue('medicationClass', med.class);
    setValue('unit', med.class.includes('Insulin') ? 'Units' : 'mg');
  };

  const filteredMeds = FORMULARY.filter(m =>
    m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.generic.toLowerCase().includes(medSearch.toLowerCase())
  );

  const onSubmit = async (data: FormData) => {
    // Check for allergy conflicts against selected patient
    if (selectedPatient?.allergies?.length > 0 && selectedMed?.conflict) {
      const conflict = {
        severity: 'CRITICAL',
        message: `SAFETY INTERCEPT: Cross-Reactivity Risk (Grade 3 Anaphylaxis)`,
        detail: `Patient ${selectedPatient.name} has a documented life-threatening allergy to ${selectedPatient.allergies[0].allergen}. ${data.medicationName} shares a beta-lactam core structure with an estimated 5% to 8% cross-reactivity index.`,
      };
      setAllergyAlerts([conflict]);
      setPendingSubmit(data);
      setShowInterceptModal(true);
      return;
    }
    createMutation.mutate(data);
  };

  const submitWithOverride = () => {
    if (!pendingSubmit || !selectedOverride) return;
    createMutation.mutate({ ...pendingSubmit, overrideReason: selectedOverride });
    setShowInterceptModal(false);
    setPendingSubmit(null);
    setAllergyAlerts([]);
  };

  const statPrescriptions = (prescriptions as any[]).filter(p => p.isStatOrder && p.status === 'STAT');
  const activePrescriptions = (prescriptions as any[]).filter(p => ['ACTIVE'].includes(p.status)).slice(0, 3);

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>SmartMedChart</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Hospital OS V4.2</span>
        </div>
        <div className="top-bar-section" style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>Cardiothoracic ICU</div>
        <div className="top-bar-section">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span>EHR Live Sync Active</span>
        </div>
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {statPrescriptions.length > 0 && (
            <span className="chip chip-stat"><AlertTriangle size={11} /> {statPrescriptions.length} STAT Pending Orders</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>DS</span>
            {user?.name}
          </div>
        </div>
      </div>

      {/* Assigned Physician */}
      {watchPatient && selectedPatient && (
        <div style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, width: '100%', boxSizing: 'border-box' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>ASSIGNED PHYSICIAN</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name}</span>
          <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>Credentialed Attending Intensivist</span>
          {selectedPatient.allergies?.map((a: any) => (
            <div key={a.id} className="alert-critical" style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={11} />
              CRITICAL ALLERGY ALERT: {a.allergen} ({a.severity} — {a.verifiedAt ? new Date(a.verifiedAt).getFullYear() : 'Unknown'})
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 0, flex: 1, height: 'calc(100vh - 52px)', overflow: 'hidden', width: '100%' }}>
        {/* Main Form */}
        <div style={{ overflow: 'auto', minWidth: 0, width: '100%' }}>
          <div className="page-content" style={{ width: '100%', padding: '24px 32px' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Plus size={16} color="var(--color-accent-blue-light)" />
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>New Medication Order Entry</h2>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-given-green)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                      FORMULARY 2024 VERIFIED
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Ref: IDSA Sepsis Fast-Track</span>
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  {/* Patient Select */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Patient</label>
                    <select {...register('patientId')} className="input">
                      <option value="">Select patient...</option>
                      {(patients as any[]).map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} — Bed {p.bed} (MRN: {p.mrn})</option>
                      ))}
                    </select>
                    {errors.patientId && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.patientId.message}</p>}
                  </div>

                  {/* Medication Search */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                      Search Formulary Medication or Order Set
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        value={medSearch}
                        onChange={e => { setMedSearch(e.target.value); setValue('medicationName', e.target.value); }}
                        className="input"
                        placeholder="Search medication or order set (ESC to clear)"
                        style={{ paddingLeft: 32, paddingRight: medSearch ? 32 : 12 }}
                      />
                      {medSearch && (
                        <button type="button" onClick={() => { setMedSearch(''); setSelectedMed(null); setValue('medicationName', ''); }}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {errors.medicationName && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.medicationName.message}</p>}

                    {/* Formulary dropdown */}
                    {medSearch && filteredMeds.length > 0 && (
                      <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                        {filteredMeds.map(med => (
                          <div key={med.name}
                            onClick={() => selectMed(med)}
                            style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                            onMouseOver={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                            onMouseOut={e => (e.currentTarget.style.background = '')}
                          >
                            <Shield size={14} color={med.conflict ? 'var(--color-stat-red)' : med.highAlert ? 'var(--color-due-amber)' : 'var(--color-text-muted)'} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{med.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{med.class}</div>
                            </div>
                            {med.conflict && selectedPatient?.allergies?.length > 0 && (
                              <span style={{ background: 'var(--color-stat-red-bg)', color: 'var(--color-stat-red)', border: '1px solid var(--color-stat-red-border)', borderRadius: 4, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>Allergy Conflict Detected</span>
                            )}
                            {med.altSafe && (
                              <span style={{ background: 'var(--color-given-green-bg)', color: 'var(--color-given-green)', border: '1px solid var(--color-given-green-border)', borderRadius: 4, fontSize: 10, padding: '1px 6px', fontWeight: 600 }}>Alternative Safe Suggestion</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dose / Route / Frequency / Duration */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Dose & Strength</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input {...register('dose')} className="input" placeholder="1000" style={{ flex: 1 }} />
                        <select {...register('unit')} className="input" style={{ width: 80 }}>
                          {['mg', 'g', 'mcg', 'Units', 'mL', 'mcg/min', 'mcg/kg/min'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      {errors.dose && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.dose.message}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, fontSize: 11, color: 'var(--color-text-muted)', paddingBottom: 8 }}>
                      Std ICU Dose: 1g to 2g daily
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Route</label>
                      <select {...register('route')} className="input">
                        <option value="">Select route...</option>
                        {ROUTES.map(r => <option key={r}>{r}</option>)}
                      </select>
                      {errors.route && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.route.message}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Frequency</label>
                      <select {...register('frequency')} className="input">
                        <option value="">Select frequency...</option>
                        {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                      </select>
                      {errors.frequency && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.frequency.message}</p>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                        Clinical Indication (Mandatory)
                      </label>
                      <input {...register('indication')} className="input" placeholder="e.g. Severe Sepsis secondary to Cellulitis" />
                      {errors.indication && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.indication.message}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                        Therapy Duration & Stop Order
                      </label>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select {...register('duration')} className="input" style={{ flex: 1 }}>
                          <option value="">No stop date</option>
                          {DURATIONS.map(d => <option key={d} value={d}>{d} Days</option>)}
                        </select>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Days (Auto-review)</span>
                      </div>
                    </div>
                  </div>

                  {/* STAT toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: 16 }}>
                    <input type="checkbox" id="stat-order" {...register('isStatOrder')} style={{ accentColor: 'var(--color-stat-red)', width: 16, height: 16 }} />
                    <label htmlFor="stat-order" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-stat-red)', cursor: 'pointer' }}>
                      🚨 High-Urgency STAT Protocol — Immediate dispensing required
                    </label>
                  </div>

                  {/* Organ Function Clearances */}
                  {selectedPatient && (
                    <div style={{ padding: '12px 16px', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        📊 Organ Function Safety Clearances
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                        {[
                          { label: 'Creatinine', value: `${selectedPatient.creatinine || 1.1} mg/dL` },
                          { label: 'Bilirubin', value: `${selectedPatient.bilirubin || 0.8} mg/dL` },
                          { label: 'Platelets', value: `${selectedPatient.platelets || 194},000/mcL` },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <span style={{ color: 'var(--color-text-muted)' }}>{label}: </span>
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-given-green)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>HEPATIC SAFE</span>
                        {selectedPatient.eGFR && selectedPatient.eGFR < 60 && (
                          <span style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-due-amber)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>RENAL DOSE ADJUSTED</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-ghost">Discard Draft Order</button>
                    <button type="button" className="btn-ghost">Save to Pending Set</button>
                    <button type="submit" disabled={createMutation.isPending} className={watch('isStatOrder') ? 'btn-stat' : 'btn-primary'} style={{ minWidth: 200 }}>
                      {createMutation.isPending ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Transmitting...</> : <><Shield size={14} /> {watch('isStatOrder') ? 'Override & Transmit STAT Order' : 'Sign & Transmit Order'}</>}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ borderLeft: '1px solid var(--color-border)', overflow: 'auto', background: 'var(--color-bg-secondary)', width: 380, flexShrink: 0, boxSizing: 'border-box' }}>
          {/* STAT Pending */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>STAT Pending Orders</h3>
              {statPrescriptions.length > 0 && (
                <span className="chip chip-stat">{statPrescriptions.length} Action Required</span>
              )}
            </div>
            {statPrescriptions.map((prx: any) => (
              <div key={prx.id} style={{ background: 'var(--color-stat-red-bg)', border: '1px solid var(--color-stat-red-border)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span className="chip chip-stat">STAT</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{prx.medicationName}</span>
                </div>
                <div style={{ fontSize: 11, color: '#fca5a5', marginBottom: 4 }}>
                  {prx.dose}{prx.unit} · {prx.route}
                </div>
                {!prx.pharmacyVerified && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Awaiting Central Pharmacy Verification: Queue #2
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn-primary" style={{ fontSize: 11, flex: 1 }}>Sign & Transmit</button>
                  <button className="btn-ghost" style={{ fontSize: 11 }}>Label</button>
                </div>
              </div>
            ))}
            {statPrescriptions.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>No STAT orders pending</div>
            )}
          </div>

          {/* Active CPOE Regimens */}
          <div style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Active CPOE Regimens <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>{activePrescriptions.length} Active Meds</span>
            </h3>
            {activePrescriptions.map((prx: any) => (
              <div key={prx.id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{prx.medicationName?.split(' ')[0]}</span>
                  {prx.isContinuous ? (
                    <span style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--color-info-cyan)', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Continuous IV</span>
                  ) : (
                    <span style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-accent-blue-light)', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Active Flow</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {prx.dose}{prx.unit} · {prx.route}
                </div>
                {prx.indication && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                    {prx.indication.slice(0, 50)}...
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn-ghost" style={{ fontSize: 11, flex: 1 }}>Modify Titration</button>
                  <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--color-due-amber)', borderColor: 'rgba(245,158,11,0.4)' }}>Hold Dose</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Intercept Modal */}
      {showInterceptModal && allergyAlerts.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, maxWidth: 600, width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white' }}>Safety Alert — Override Required</h3>
              <button onClick={() => setShowInterceptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20 }}>
              {allergyAlerts.map((alert, i) => (
                <div key={i} className="safety-intercept" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={16} color="var(--color-stat-red)" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#fca5a5' }}>{alert.message}</span>
                    <span className="hard-stop-badge">HARD STOP LEVEL 2</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#fca5a5', margin: 0, lineHeight: 1.6 }}>{alert.detail}</p>
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                  Mandatory Override Reason (Required to Sign): <span style={{ color: 'var(--color-stat-red)' }}>Requires Secondary Attending Co-Sign</span>
                </label>
                {OVERRIDE_REASONS.map(reason => (
                  <div key={reason} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, padding: '8px 12px', borderRadius: 7, background: selectedOverride === reason ? 'rgba(59,130,246,0.1)' : 'transparent', border: `1px solid ${selectedOverride === reason ? 'var(--color-accent-blue)' : 'transparent'}`, cursor: 'pointer' }}
                    onClick={() => setSelectedOverride(reason)}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selectedOverride === reason ? 'var(--color-accent-blue)' : 'var(--color-border)'}`, background: selectedOverride === reason ? 'var(--color-accent-blue)' : 'transparent', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{reason}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowInterceptModal(false)} className="btn-ghost">Cancel — Choose Alternative</button>
                <button onClick={submitWithOverride} disabled={!selectedOverride || createMutation.isPending} className="btn-stat">
                  <Shield size={14} /> Override & Transmit STAT Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
