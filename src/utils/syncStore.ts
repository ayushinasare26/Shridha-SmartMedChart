/**
 * SmartMedChart Unified Cross-Role Live Synchronization Engine
 * Bridges Admin, Clinic Doctors, Nurses, Reception, Pharmacy, Staff, and Patients.
 * Works seamlessly across browser tabs and components with instant reactive event dispatch.
 */

export interface SyncPatient {
  id: string;
  name: string;
  mrn: string;
  dob: string;
  gender: string;
  sex?: string;
  age?: number;
  bed: string;
  status: string;
  weight: number;
  height: number;
  ward: { name: string; unit: string };
  allergies: Array<{ id?: string; allergen: string; reaction: string; severity: string; verifiedAt?: string }>;
  prescriptions: any[];
  administrations: any[];
  clinicalNotes: any[];
  attending?: { id?: string; name: string; role: string; specialty?: string; title?: string; staffId?: string };
  attendingId?: string;
  admissionDiagnosis?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  tokenNumber?: string;
  caseFile?: any;
  admission?: any;
  qrPayload?: string;
}

const STORAGE_KEYS = {
  PATIENTS: 'smartmed_synced_patients_v4',
  PRESCRIPTIONS: 'smartmed_synced_prescriptions_v4',
  SCHEDULES: 'smartmed_synced_schedules_v4',
  NURSE_UPDATES: 'smartmed_synced_nurse_updates_v4',
  AUDIT_LOGS: 'smartmed_synced_audits_v4',
  ALERTS: 'smartmed_synced_alerts_v4',
  PING: 'smartmed_sync_ping_v4',
};

// Initial preset Indian patients with complete clinical structures
export const INITIAL_SYNC_PATIENTS: SyncPatient[] = [
  {
    id: 'pt-94021-08',
    name: 'Rahul Patil',
    mrn: '94021-08',
    dob: '1979-03-14',
    gender: 'MALE',
    sex: 'MALE',
    age: 47,
    bed: 'Bed ICU-12',
    status: 'ACTIVE',
    weight: 78.5,
    height: 176,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ id: 'a1', allergen: 'Penicillin', reaction: 'Anaphylaxis', severity: 'HIGH', verifiedAt: '2024-01-15' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { id: 'doc-84729-sharma', name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine', staffId: 'DOC-84729' },
    attendingId: 'doc-84729-sharma',
    admissionDiagnosis: 'Acute Coronary Syndrome & Unstable Angina',
    emergencyContactName: 'Sunita Patil',
    emergencyContactRelation: 'Wife / Primary Contact',
    emergencyContactPhone: '+91 98765 43210',
    tokenNumber: 'CARD-01',
  },
  {
    id: 'pt-94022-15',
    name: 'Anita Desai',
    mrn: '94022-15',
    dob: '1984-07-22',
    gender: 'FEMALE',
    sex: 'FEMALE',
    age: 42,
    bed: 'Bed ICU-14',
    status: 'ACTIVE',
    weight: 64.0,
    height: 162,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ id: 'a2', allergen: 'Sulfa Drugs', reaction: 'Severe Rash', severity: 'HIGH', verifiedAt: '2023-11-20' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { id: 'doc-84729-sharma', name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine', staffId: 'DOC-84729' },
    attendingId: 'doc-84729-sharma',
    admissionDiagnosis: 'Acute Inpatient Critical Care Monitoring',
    emergencyContactName: 'Vikram Desai',
    emergencyContactRelation: 'Son / Primary Contact',
    emergencyContactPhone: '+91 98765 78290',
    tokenNumber: 'CARD-02',
  },
  {
    id: 'pt-94023-08',
    name: 'Rajesh Sharma',
    mrn: '94023-08',
    dob: '1968-11-05',
    gender: 'MALE',
    sex: 'MALE',
    age: 58,
    bed: 'Bed ICU-08',
    status: 'ACTIVE',
    weight: 82.0,
    height: 174,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { id: 'efa0f6af-8305-4237-b501-ab8a08f45ba2', name: 'Dr. Evelyn Vance, MD', role: 'ADMIN', specialty: 'Clinical Governance', staffId: 'ADM-9001' },
    attendingId: 'efa0f6af-8305-4237-b501-ab8a08f45ba2',
    admissionDiagnosis: 'Post-Surgical Trauma Monitoring',
    emergencyContactName: 'Ananya Sharma',
    emergencyContactRelation: 'Daughter / Primary Contact',
    emergencyContactPhone: '+91 98765 11223',
    tokenNumber: 'SURG-01',
  },
  {
    id: 'pt-94024-03',
    name: 'Meera Iyer',
    mrn: '94024-03',
    dob: '1992-04-19',
    gender: 'FEMALE',
    sex: 'FEMALE',
    age: 34,
    bed: 'Bed ICU-03',
    status: 'ACTIVE',
    weight: 56.5,
    height: 158,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ id: 'a3', allergen: 'Latex', reaction: 'Contact Dermatitis', severity: 'MEDIUM', verifiedAt: '2024-02-01' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { id: 'doc-84729-sharma', name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine', staffId: 'DOC-84729' },
    attendingId: 'doc-84729-sharma',
    admissionDiagnosis: 'Acute Bronchospasm & Respiratory Distress',
    emergencyContactName: 'Karthik Iyer',
    emergencyContactRelation: 'Husband / Primary Contact',
    emergencyContactPhone: '+91 98765 99887',
    tokenNumber: 'PULM-01',
  },
];

// Initial audit logs for immediate Admin visibility
export const INITIAL_AUDIT_LOGS = [
  { id: 'aud-1', action: 'BEDSIDE_ADMINISTRATION_RECORDED', user: 'Nurse Priya, RN (RN-88219)', target: 'Patient Rahul Patil (94021-08)', time: '5 mins ago', status: 'SUCCESS', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'aud-2', action: 'CPOE_ORDER_TRANSMITTED', user: 'Dr. Sharma, MD (DOC-84729)', target: 'Ceftriaxone IV 1g STAT', time: '15 mins ago', status: 'SUCCESS', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 'aud-3', action: 'RECEPTION_PATIENT_INTAKE', user: 'Priya Sen (REC-101)', target: 'Admitted Patient to Bed ICU-14', time: '35 mins ago', status: 'SUCCESS', timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
  { id: 'aud-4', action: 'PHARMACY_SAFETY_VERIFICATION', user: 'Pharm. Dave (PH-31405)', target: 'Order Set Formulary 2024', time: '1 hour ago', status: 'SUCCESS', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 'aud-5', action: 'CRYPTOGRAPHIC_KEY_ROTATED', user: 'SYSTEM SECURITY DAEMON', target: 'HMAC-SHA256 Token Authority', time: '2 hours ago', status: 'SUCCESS', timestamp: new Date(Date.now() - 120 * 60000).toISOString() },
];

function getSafeLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setSafeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * Broadcast sync event to all local components and other browser tabs
 */
export function broadcastSync(type: string, payload?: any): void {
  if (typeof window === 'undefined') return;
  try {
    const data = { type, payload, timestamp: Date.now() };
    window.dispatchEvent(new CustomEvent('smartmed:sync', { detail: data }));
    localStorage.setItem(STORAGE_KEYS.PING, JSON.stringify(data));
  } catch {}
}

/**
 * Register a listener for any sync updates (local and cross-tab)
 */
export function subscribeToSync(listener: (event: { type: string; payload?: any }) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e: any) => {
    if (e?.detail) listener(e.detail);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.PING && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        listener(parsed);
      } catch {}
    }
  };

  window.addEventListener('smartmed:sync', handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('smartmed:sync', handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS SYNC
// ─────────────────────────────────────────────────────────────────────────────

export function getSyncedPatients(): SyncPatient[] {
  const stored = getSafeLocalStorage<SyncPatient[]>(STORAGE_KEYS.PATIENTS, []);
  // Combine preset patients and newly added patients, deduplicating by ID/MRN
  const map = new Map<string, SyncPatient>();
  for (const p of INITIAL_SYNC_PATIENTS) {
    map.set(p.id, p);
    if (p.mrn) map.set(p.mrn, p);
  }
  for (const p of stored) {
    if (p.id) map.set(p.id, { ...map.get(p.id), ...p });
  }

  // Also check receptionist patients v3 key to ensure backwards compatibility
  const receptionistRaw = getSafeLocalStorage<any[]>('smartmedchart_receptionist_patients_v3', []);
  for (const rp of receptionistRaw) {
    if (!rp || !rp.id) continue;
    const existing = map.get(rp.id) || map.get(rp.mrn);
    const normalized: SyncPatient = {
      id: rp.id,
      name: rp.fullName || rp.name || 'Patient',
      mrn: rp.mrn || `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      dob: rp.dateOfBirth || rp.dob || '1990-01-01',
      gender: (rp.gender || 'Male').toUpperCase(),
      sex: (rp.gender || 'Male').toUpperCase(),
      age: Number(rp.age) || 35,
      bed: rp.admission?.bedNumber ? (rp.admission.bedNumber.startsWith('Bed') ? rp.admission.bedNumber : `Bed ${rp.admission.bedNumber}`) : (existing?.bed || 'Bed ICU-15'),
      status: 'ACTIVE',
      weight: Number(rp.caseFile?.initialVitals?.weightKg || existing?.weight || 70),
      height: Number(rp.caseFile?.initialVitals?.heightCm || existing?.height || 170),
      ward: { name: rp.admission?.wardNumber || 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
      allergies: Array.isArray(rp.caseFile?.medicalInfo?.allergies)
        ? rp.caseFile.medicalInfo.allergies.map((alg: string, idx: number) => ({
            id: `alg-${idx}`,
            allergen: alg,
            reaction: 'Known Adverse Sensitivity',
            severity: 'HIGH',
            verifiedAt: new Date().toISOString()
          }))
        : (existing?.allergies || []),
      prescriptions: existing?.prescriptions || [],
      administrations: existing?.administrations || [],
      clinicalNotes: existing?.clinicalNotes || [],
      attending: {
        id: rp.caseFile?.assignedDoctorId || 'doc-84729-sharma',
        name: rp.caseFile?.assignedDoctorName || 'Dr. Sharma, MD',
        role: 'DOCTOR',
        specialty: rp.caseFile?.department || 'Cardiology & Intensive Care',
        staffId: 'DOC-84729',
      },
      attendingId: rp.caseFile?.assignedDoctorId || 'doc-84729-sharma',
      admissionDiagnosis: rp.caseFile?.medicalInfo?.chiefComplaint || 'Acute Inpatient Evaluation',
      emergencyContactName: rp.emergencyContact?.name || 'Primary Guardian',
      emergencyContactRelation: rp.emergencyContact?.relationship || rp.emergencyContact?.relation || 'Family',
      emergencyContactPhone: rp.emergencyContact?.phone || rp.contactNumber || '+91 98000 00000',
      tokenNumber: rp.tokenNumber || 'OPD-01',
      caseFile: rp.caseFile,
      admission: rp.admission,
      qrPayload: rp.qrPayload,
    };
    map.set(rp.id, normalized);
  }

  const result = Array.from(new Set(map.values()));
  return result;
}

export function syncAddPatient(patientInput: any): SyncPatient {
  const all = getSyncedPatients();
  const id = patientInput.id || `pt-${Date.now()}`;
  const mrn = patientInput.mrn || `940${Math.floor(20 + Math.random() * 80)}-${Math.floor(10 + Math.random() * 90)}`;
  const doctorId = patientInput.attendingId || patientInput.caseFile?.assignedDoctorId || 'doc-84729-sharma';
  const doctorName = patientInput.attending?.name || patientInput.caseFile?.assignedDoctorName || 'Dr. Sharma, MD';

  const newPatient: SyncPatient = {
    id,
    name: patientInput.name || patientInput.fullName || 'Admitted Patient',
    mrn,
    dob: patientInput.dob || patientInput.dateOfBirth || '1990-01-01',
    gender: (patientInput.gender || patientInput.sex || 'Male').toUpperCase(),
    sex: (patientInput.gender || patientInput.sex || 'Male').toUpperCase(),
    age: Number(patientInput.age) || 35,
    bed: patientInput.bed || (patientInput.admission?.bedNumber ? (patientInput.admission.bedNumber.startsWith('Bed') ? patientInput.admission.bedNumber : `Bed ${patientInput.admission.bedNumber}`) : `Bed ICU-${Math.floor(15 + Math.random() * 10)}`),
    status: 'ACTIVE',
    weight: Number(patientInput.weight || patientInput.caseFile?.initialVitals?.weightKg || 70),
    height: Number(patientInput.height || patientInput.caseFile?.initialVitals?.heightCm || 170),
    ward: patientInput.ward?.unit ? patientInput.ward : { name: patientInput.ward || 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: Array.isArray(patientInput.allergies) ? patientInput.allergies : (patientInput.allergy ? [{ id: 'a-new', allergen: patientInput.allergy, reaction: 'Documented sensitivity', severity: 'HIGH' }] : []),
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: {
      id: doctorId,
      name: doctorName,
      role: 'DOCTOR',
      specialty: 'Cardiology & Intensive Care',
      staffId: 'DOC-84729',
    },
    attendingId: doctorId,
    admissionDiagnosis: patientInput.admissionDiagnosis || patientInput.caseFile?.medicalInfo?.chiefComplaint || 'Acute Inpatient Observation',
    emergencyContactName: patientInput.emergencyContactName || patientInput.emergencyContact?.name || 'Primary Guardian',
    emergencyContactRelation: patientInput.emergencyContactRelation || patientInput.emergencyContact?.relation || 'Family',
    emergencyContactPhone: patientInput.emergencyContactPhone || patientInput.emergencyContact?.phone || '+91 98000 00000',
    tokenNumber: patientInput.tokenNumber || 'OPD-01',
    caseFile: patientInput.caseFile,
    admission: patientInput.admission,
    qrPayload: patientInput.qrPayload,
  };

  const updated = [newPatient, ...all.filter(p => p.id !== id && p.mrn !== mrn)];
  setSafeLocalStorage(STORAGE_KEYS.PATIENTS, updated);

  // Also maintain receptionist storage compatibility
  const recList = getSafeLocalStorage<any[]>('smartmedchart_receptionist_patients_v3', []);
  setSafeLocalStorage('smartmedchart_receptionist_patients_v3', [
    {
      id: newPatient.id,
      fullName: newPatient.name,
      mrn: newPatient.mrn,
      age: newPatient.age,
      gender: newPatient.gender === 'FEMALE' ? 'Female' : 'Male',
      contactNumber: newPatient.emergencyContactPhone,
      registrationDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      emergencyContact: {
        name: newPatient.emergencyContactName,
        relation: newPatient.emergencyContactRelation,
        phone: newPatient.emergencyContactPhone,
      },
      admission: {
        isAdmitted: true,
        bedNumber: newPatient.bed,
        wardNumber: newPatient.ward.name,
      },
      caseFile: {
        id: `CF-${Date.now()}`,
        patientId: newPatient.id,
        assignedDoctorId: doctorId,
        assignedDoctorName: doctorName,
        department: 'Cardiology & General Medicine',
        roomNumber: 'OPD Room 102 - Wing A',
        triagePriority: 'Routine',
        currentStatus: 'Admitted in Ward',
        initialVitals: {
          bpSystolic: 120,
          bpDiastolic: 80,
          heartRate: 75,
          spO2: 98,
          temperature: 98.6,
          weightKg: newPatient.weight,
          heightCm: newPatient.height,
        },
        medicalInfo: {
          chiefComplaint: newPatient.admissionDiagnosis,
          allergies: newPatient.allergies.map(a => a.allergen),
        },
      },
    },
    ...recList.filter(p => p.id !== id && p.mrn !== mrn)
  ]);

  // Record audit log
  syncAddAuditLog({
    action: 'PATIENT_ADMITTED',
    user: 'Admissions Desk & Reception',
    target: `${newPatient.name} (MRN: ${newPatient.mrn}) -> ${newPatient.bed}`,
    status: 'SUCCESS'
  });

  broadcastSync('PATIENT_ADDED', newPatient);
  return newPatient;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESCRIPTIONS & SCHEDULES SYNC
// ─────────────────────────────────────────────────────────────────────────────

export function getSyncedPrescriptions(patientId?: string): any[] {
  const list = getSafeLocalStorage<any[]>(STORAGE_KEYS.PRESCRIPTIONS, []);
  if (!patientId) return list;
  return list.filter(p => p.patientId === patientId || p.patient?.id === patientId || p.patient?.mrn === patientId);
}

export function syncAddPrescription(prxData: any): any {
  const existing = getSyncedPrescriptions();
  const id = prxData.id || `rx-${Date.now()}`;
  const patients = getSyncedPatients();
  const matchedPatient = patients.find(p => p.id === prxData.patientId || p.mrn === prxData.patientId) || patients[0];

  const newPrx = {
    id,
    rxNumber: prxData.rxNumber || `RX-${Date.now().toString().slice(-6)}`,
    patientId: matchedPatient?.id || prxData.patientId,
    patient: {
      id: matchedPatient?.id,
      name: matchedPatient?.name,
      mrn: matchedPatient?.mrn,
      bed: matchedPatient?.bed,
      attendingId: matchedPatient?.attendingId || 'doc-84729-sharma',
    },
    prescriberId: prxData.prescriberId || 'doc-84729-sharma',
    prescriber: {
      name: prxData.prescriberName || 'Dr. Sharma, MD',
      role: 'DOCTOR',
      specialty: 'Cardiovascular Medicine'
    },
    medicationName: prxData.medicationName,
    genericName: prxData.genericName || prxData.medicationName,
    medicationClass: prxData.medicationClass || 'General Formulary',
    dose: prxData.dose,
    unit: prxData.unit || 'mg',
    route: prxData.route || 'IV Push',
    frequency: prxData.frequency || 'Q12H',
    indication: prxData.indication || 'Acute Clinical Protocol',
    status: prxData.isStatOrder ? 'STAT' : 'ACTIVE',
    isStatOrder: Boolean(prxData.isStatOrder),
    isContinuous: Boolean(prxData.isContinuous),
    infusionRate: prxData.infusionRate,
    pharmacyVerified: Boolean(prxData.pharmacyVerified || false),
    createdAt: new Date().toISOString(),
    schedules: [],
  };

  // Generate real schedules
  const now = Date.now();
  const scheduleTimes = newPrx.isStatOrder
    ? [new Date(now).toISOString()]
    : [
        new Date(now).toISOString(),
        new Date(now + 6 * 3600000).toISOString(),
        new Date(now + 12 * 3600000).toISOString(),
      ];

  const newSchedules = scheduleTimes.map((t, idx) => ({
    id: `sch-${id}-${idx + 1}`,
    prescriptionId: id,
    patientId: newPrx.patientId,
    patient: newPrx.patient,
    prescription: newPrx,
    dose: newPrx.dose,
    doseUnit: newPrx.unit,
    route: newPrx.route,
    scheduledTime: t,
    status: 'PENDING',
    delayMinutes: 0,
    ward: 'WARD-4B-ICU',
  }));

  newPrx.schedules = newSchedules as any;

  // Save prescription
  setSafeLocalStorage(STORAGE_KEYS.PRESCRIPTIONS, [newPrx, ...existing]);

  // Save schedules
  const existingSchedules = getSyncedSchedules();
  setSafeLocalStorage(STORAGE_KEYS.SCHEDULES, [...newSchedules, ...existingSchedules]);

  // If medication conflicts with patient allergy, create safety alert
  if (matchedPatient?.allergies?.length) {
    for (const allergy of matchedPatient.allergies) {
      if (
        (allergy.allergen.toLowerCase().includes('penicillin') && newPrx.medicationName.toLowerCase().includes('cef')) ||
        newPrx.medicationName.toLowerCase().includes(allergy.allergen.toLowerCase())
      ) {
        syncAddAlert({
          patientId: matchedPatient.id,
          prescriptionId: id,
          alertType: 'ALLERGY_CONFLICT',
          severity: 'HIGH',
          message: `Allergy Conflict: ${newPrx.medicationName} cross-reacts with known allergy to ${allergy.allergen}`,
          patientName: matchedPatient.name,
          isResolved: false,
        });
      }
    }
  }

  // Record audit log
  syncAddAuditLog({
    action: newPrx.isStatOrder ? 'STAT_ORDER_TRANSMITTED' : 'CPOE_ORDER_TRANSMITTED',
    user: newPrx.prescriber.name,
    target: `${newPrx.medicationName} ${newPrx.dose}${newPrx.unit} for ${matchedPatient.name}`,
    status: 'SUCCESS'
  });

  broadcastSync('PRESCRIPTION_CREATED', newPrx);
  return newPrx;
}

export function syncVerifyPrescription(prescriptionId: string): any {
  const prxs = getSyncedPrescriptions();
  const updated = prxs.map(p => p.id === prescriptionId ? { ...p, pharmacyVerified: true } : p);
  setSafeLocalStorage(STORAGE_KEYS.PRESCRIPTIONS, updated);

  syncAddAuditLog({
    action: 'PHARMACY_VERIFICATION_APPROVED',
    user: 'Clinical Pharmacist Dave (PH-31405)',
    target: `Prescription ID: ${prescriptionId}`,
    status: 'SUCCESS'
  });

  broadcastSync('PRESCRIPTION_VERIFIED', { prescriptionId });
  return updated.find(p => p.id === prescriptionId);
}

export function getSyncedSchedules(patientId?: string, ward?: string): any[] {
  const list = getSafeLocalStorage<any[]>(STORAGE_KEYS.SCHEDULES, []);
  let filtered = list;
  if (patientId) {
    filtered = filtered.filter(s => s.patientId === patientId || s.patient?.id === patientId || s.patient?.mrn === patientId);
  }
  return filtered;
}

// ─────────────────────────────────────────────────────────────────────────────
// NURSE ACTIONS & UPDATES SYNC (REFLECTS IN DOCTOR PORTAL)
// ─────────────────────────────────────────────────────────────────────────────

export function getSyncedNurseUpdates(doctorId?: string): any[] {
  const list = getSafeLocalStorage<any[]>(STORAGE_KEYS.NURSE_UPDATES, []);
  if (!doctorId) return list;
  return list.filter(u => !u.patient?.attendingId || u.patient.attendingId === doctorId || doctorId === 'all');
}

export function syncRecordAdministration(data: {
  scheduleId?: string;
  patientId?: string;
  medicationName?: string;
  dose?: any;
  unit?: string;
  route?: string;
  nurseName?: string;
  barcodeScanned?: boolean;
  notes?: string;
  vitalsData?: any;
}): any {
  const schedules = getSyncedSchedules();
  const patients = getSyncedPatients();
  const patient = patients.find(p => p.id === data.patientId || p.mrn === data.patientId) || patients[0];
  const now = new Date().toISOString();

  // Update schedule status
  const updatedSchedules = schedules.map(s => {
    if (s.id === data.scheduleId || (!data.scheduleId && s.patientId === patient?.id && s.status === 'PENDING')) {
      return {
        ...s,
        status: 'GIVEN',
        administeredAt: now,
        administeredBy: { id: 'rn-88219-priya', name: data.nurseName || 'Nurse Priya, RN', role: 'NURSE', staffId: 'RN-88219' },
        administrationRecord: {
          adminId: `ADM-REC-${Date.now().toString().slice(-6)}`,
          barcodeScanned: Boolean(data.barcodeScanned ?? true),
          fiveRightsVerified: true,
          signedAt: now,
          administeredBy: { name: data.nurseName || 'Nurse Priya, RN', staffId: 'RN-88219' },
        },
      };
    }
    return s;
  });
  setSafeLocalStorage(STORAGE_KEYS.SCHEDULES, updatedSchedules);

  // Create real-time Nurse Update record for Doctor Dashboard
  const nurseUpdate = {
    id: `update-adm-${Date.now()}`,
    sourceId: data.scheduleId || `adm-${Date.now()}`,
    eventType: 'ADMINISTRATION',
    title: `${data.medicationName || 'Scheduled Medication'} Administered`,
    patient: {
      id: patient?.id,
      name: patient?.name,
      bed: patient?.bed,
      attendingId: patient?.attendingId || 'doc-84729-sharma',
    },
    patientId: patient?.id,
    actor: {
      name: data.nurseName || 'Nurse Priya, RN',
      role: 'NURSE',
      staffId: 'RN-88219',
    },
    timestamp: now,
    details: {
      dose: `${data.dose || 1} ${data.unit || 'mg'}`,
      route: data.route || 'IV',
      barcodeScanned: true,
      fiveRightsVerified: true,
      notes: data.notes || 'Bedside 5-Rights Barcode verification completed safely without adverse signs.',
      vitalsData: data.vitalsData || { bp: '120/80', hr: 74, spo2: 98, temp: 37.0 },
    },
    isMyPatient: true,
    isAcknowledged: true,
  };

  const existingUpdates = getSyncedNurseUpdates();
  setSafeLocalStorage(STORAGE_KEYS.NURSE_UPDATES, [nurseUpdate, ...existingUpdates]);

  // Log audit
  syncAddAuditLog({
    action: 'BEDSIDE_ADMINISTRATION_RECORDED',
    user: data.nurseName || 'Nurse Priya, RN (RN-88219)',
    target: `${data.medicationName || 'Medication'} -> ${patient?.name} (${patient?.bed})`,
    status: 'SUCCESS',
  });

  // Cross-tab storage ping
  localStorage.setItem('smartmed_last_administered', JSON.stringify(nurseUpdate));
  broadcastSync('MEDICATION_ADMINISTERED', nurseUpdate);
  return nurseUpdate;
}

export function syncHoldSchedule(scheduleId: string, holdReason: string, nurseName = 'Nurse Priya, RN'): any {
  const schedules = getSyncedSchedules();
  const target = schedules.find(s => s.id === scheduleId);
  const now = new Date().toISOString();

  const updatedSchedules = schedules.map(s => {
    if (s.id === scheduleId) {
      return { ...s, status: 'HELD', holdReason, updatedAt: now };
    }
    return s;
  });
  setSafeLocalStorage(STORAGE_KEYS.SCHEDULES, updatedSchedules);

  const nurseUpdate = {
    id: `update-hold-${Date.now()}`,
    sourceId: scheduleId,
    eventType: 'DOSE_HOLD',
    title: `Medication Placed on HOLD: ${target?.prescription?.medicationName || 'Scheduled Dose'}`,
    patient: target?.patient,
    patientId: target?.patientId,
    actor: { name: nurseName, role: 'NURSE', staffId: 'RN-88219' },
    timestamp: now,
    details: {
      reason: holdReason,
      notes: `Nurse placed dose on hold. Reason: ${holdReason}`,
    },
    isMyPatient: true,
    isAcknowledged: false,
  };

  const existingUpdates = getSyncedNurseUpdates();
  setSafeLocalStorage(STORAGE_KEYS.NURSE_UPDATES, [nurseUpdate, ...existingUpdates]);

  syncAddAuditLog({
    action: 'MEDICATION_DOSE_HELD',
    user: nurseName,
    target: `Schedule ${scheduleId}: ${holdReason}`,
    status: 'SUCCESS',
  });

  broadcastSync('DOSE_HELD', nurseUpdate);
  return nurseUpdate;
}

export function syncDelaySchedule(scheduleId: string, delayMinutes: number, reason: string, nurseName = 'Nurse Priya, RN'): any {
  const schedules = getSyncedSchedules();
  const target = schedules.find(s => s.id === scheduleId);
  const now = new Date().toISOString();

  const updatedSchedules = schedules.map(s => {
    if (s.id === scheduleId) {
      return { ...s, status: 'DELAYED', delayMinutes, delayReason: reason, updatedAt: now };
    }
    return s;
  });
  setSafeLocalStorage(STORAGE_KEYS.SCHEDULES, updatedSchedules);

  const nurseUpdate = {
    id: `update-delay-${Date.now()}`,
    sourceId: scheduleId,
    eventType: 'DOSE_DELAY',
    title: `Medication DELAYED +${delayMinutes}m: ${target?.prescription?.medicationName || 'Dose'}`,
    patient: target?.patient,
    patientId: target?.patientId,
    actor: { name: nurseName, role: 'NURSE', staffId: 'RN-88219' },
    timestamp: now,
    details: {
      delayMinutes,
      reason,
      notes: `Dose delayed +${delayMinutes}m. Reason: ${reason}`,
    },
    isMyPatient: true,
    isAcknowledged: false,
  };

  const existingUpdates = getSyncedNurseUpdates();
  setSafeLocalStorage(STORAGE_KEYS.NURSE_UPDATES, [nurseUpdate, ...existingUpdates]);

  syncAddAuditLog({
    action: 'MEDICATION_DOSE_DELAYED',
    user: nurseName,
    target: `Schedule ${scheduleId} delayed by ${delayMinutes}m: ${reason}`,
    status: 'SUCCESS',
  });

  broadcastSync('DOSE_DELAYED', nurseUpdate);
  return nurseUpdate;
}

export function syncAddNurseNote(noteData: {
  patientId: string;
  title: string;
  content: string;
  vitals?: { bp?: string; hr?: number; spo2?: number; temp?: number; rr?: number };
  nurseName?: string;
}): any {
  const patients = getSyncedPatients();
  const patient = patients.find(p => p.id === noteData.patientId || p.mrn === noteData.patientId) || patients[0];
  const now = new Date().toISOString();

  const nurseUpdate = {
    id: `update-note-${Date.now()}`,
    sourceId: `note-${Date.now()}`,
    eventType: 'NURSE_NOTE',
    title: noteData.title || 'Nurse Bedside Shift Observation',
    patient: {
      id: patient?.id,
      name: patient?.name,
      bed: patient?.bed,
      attendingId: patient?.attendingId || 'doc-84729-sharma',
    },
    patientId: patient?.id,
    actor: {
      name: noteData.nurseName || 'Nurse Priya, RN',
      role: 'NURSE',
      staffId: 'RN-88219',
    },
    timestamp: now,
    details: {
      notes: noteData.content,
      vitalsData: noteData.vitals || { bp: '120/80', hr: 76, spo2: 98, temp: 37.0 },
    },
    isMyPatient: true,
    isAcknowledged: false,
  };

  const existingUpdates = getSyncedNurseUpdates();
  setSafeLocalStorage(STORAGE_KEYS.NURSE_UPDATES, [nurseUpdate, ...existingUpdates]);

  syncAddAuditLog({
    action: 'NURSE_CLINICAL_NOTE_DOCUMENTED',
    user: noteData.nurseName || 'Nurse Priya, RN',
    target: `${patient?.name}: ${noteData.title}`,
    status: 'SUCCESS',
  });

  broadcastSync('NURSE_NOTE_ADDED', nurseUpdate);
  return nurseUpdate;
}

export function syncAcknowledgeNurseUpdate(updateId: string): void {
  const updates = getSyncedNurseUpdates();
  const updated = updates.map(u => u.id === updateId ? { ...u, isAcknowledged: true } : u);
  setSafeLocalStorage(STORAGE_KEYS.NURSE_UPDATES, updated);
  broadcastSync('NURSE_UPDATE_ACKNOWLEDGED', { updateId });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS & ALERTS SYNC (FOR ADMIN & CLINICAL SAFETY)
// ─────────────────────────────────────────────────────────────────────────────

export function getSyncedAuditLogs(): any[] {
  const stored = getSafeLocalStorage<any[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  return stored.length ? stored : INITIAL_AUDIT_LOGS;
}

export function syncAddAuditLog(log: { action: string; user: string; target: string; status: string }): void {
  const current = getSyncedAuditLogs();
  const newLog = {
    id: `aud-${Date.now()}`,
    action: log.action,
    user: log.user,
    target: log.target,
    status: log.status,
    time: 'Just now',
    timestamp: new Date().toISOString(),
  };
  setSafeLocalStorage(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...current].slice(0, 100));
}

export function getSyncedAlerts(): any[] {
  return getSafeLocalStorage<any[]>(STORAGE_KEYS.ALERTS, []);
}

export function syncAddAlert(alertData: any): void {
  const current = getSyncedAlerts();
  const newAlert = {
    id: `alt-${Date.now()}`,
    ...alertData,
    createdAt: new Date().toISOString(),
  };
  setSafeLocalStorage(STORAGE_KEYS.ALERTS, [newAlert, ...current]);
  broadcastSync('SAFETY_ALERT_CREATED', newAlert);
}

export function syncResolveAlert(alertId: string): void {
  const current = getSyncedAlerts();
  const updated = current.map(a => a.id === alertId ? { ...a, isResolved: true } : a);
  setSafeLocalStorage(STORAGE_KEYS.ALERTS, updated);
  broadcastSync('SAFETY_ALERT_RESOLVED', { alertId });
}
