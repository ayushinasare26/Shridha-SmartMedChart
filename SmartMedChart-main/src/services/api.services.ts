import api from '../api/client';

export const PRESET_STAFF = [
  {
    id: 'efa0f6af-8305-4237-b501-ab8a08f45ba2',
    name: 'Dr. Evelyn Vance, MD',
    email: 'evelyn.vance@metrohealth.org',
    role: 'ADMIN' as const,
    staffId: 'ADM-9001',
    ward: 'Executive Suite - Governance',
    department: 'Clinical Governance & Healthcare Administration',
    title: 'Lead Hospital Administrator',
    specialty: 'Clinical Governance & Healthcare Administration',
    licenseNumber: 'MD-ADM-9001',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'adm-1002-hastings',
    name: 'Arthur Hastings, MBA',
    email: 'arthur.hastings@metrohealth.org',
    role: 'ADMIN' as const,
    staffId: 'ADM-1002',
    ward: 'Hospital Operations Bureau',
    department: 'Hospital Operations & Staffing Bureau',
    title: 'Director of Hospital Operations',
    specialty: 'Staffing Logistics & Inpatient Flow',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
  {
    id: 'doc-84729-sharma',
    name: 'Dr. Sharma, MD',
    email: 'sharma.md@metrohealth.org',
    role: 'DOCTOR' as const,
    staffId: 'DOC-84729',
    ward: 'Ward 4B ICU',
    department: 'Cardiology & Intensive Care',
    title: 'Attending Intensivist',
    specialty: 'Cardiovascular Medicine',
    licenseNumber: 'MD-84729-US',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'rn-88219-priya',
    name: 'Nurse Priya, RN',
    email: 'priya.rn@metrohealth.org',
    role: 'NURSE' as const,
    staffId: 'RN-88219',
    ward: 'Ward 4B ICU',
    department: 'Acute Inpatient Care',
    title: 'Primary Bedside BSN',
    specialty: 'Critical Care Nursing',
    licenseNumber: 'RN-88219-US',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813585-613d90610332?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'ph-31405-dave',
    name: 'Pharm. Dave',
    email: 'dave.pharm@metrohealth.org',
    role: 'PHARMACIST' as const,
    staffId: 'PH-31405',
    ward: 'Central Pharmacy',
    department: 'Clinical Pharmacy',
    title: 'Clinical Pharmacist',
    specialty: 'Pharmacotherapy & Medication Safety',
    licenseNumber: 'RPH-31405-US',
    shiftType: 'MORNING',
    onDuty: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'rec-101-priya',
    name: 'Priya Sen, Receptionist',
    email: 'priya.sen@metrohealth.org',
    role: 'RECEPTIONIST' as const,
    staffId: 'REC-101',
    ward: 'Admissions & Front Desk',
    department: 'Front Desk Admissions',
    title: 'Front Desk Admissions Officer',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
  {
    id: 'lt-44201-mehta',
    name: 'Arjun Mehta, MLS',
    email: 'arjun.mehta@metrohealth.org',
    role: 'ALLIED_STAFF' as const,
    staffId: 'LT-44201',
    ward: 'Central Pathology & Blood Bank',
    department: 'Central Pathology & Blood Bank',
    title: 'Senior Medical Lab Technologist',
    specialty: 'Diagnostic Hematology & Cross-matching',
    licenseNumber: 'MLS-44201-ASCP',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
  {
    id: 'rt-55102-sharma',
    name: 'Pooja Sharma, RT(R)',
    email: 'pooja.sharma@metrohealth.org',
    role: 'ALLIED_STAFF' as const,
    staffId: 'RT-55102',
    ward: 'Diagnostic Radiology & CT Imaging',
    department: 'Diagnostic Radiology & CT Imaging',
    title: 'Lead Radiologic Technologist',
    specialty: 'Bedside Mobile X-Ray & CT Imaging',
    licenseNumber: 'ARRT-55102',
    shiftType: 'MORNING',
    onDuty: true,
    isActive: true,
  },
];

export const PRESET_PATIENTS = [
  {
    id: 'pt-94021-08',
    name: 'Rahul Patil',
    mrn: '94021-08',
    dob: '1979-03-14',
    gender: 'MALE',
    bed: 'Bed ICU-12',
    status: 'ACTIVE',
    weight: 78.5,
    height: 176,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ id: 'a1', allergen: 'Penicillin', reaction: 'Anaphylaxis', severity: 'HIGH' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine' },
  },
  {
    id: 'pt-94022-15',
    name: 'Anita Desai',
    mrn: '94022-15',
    dob: '1984-07-22',
    gender: 'FEMALE',
    bed: 'Bed ICU-14',
    status: 'ACTIVE',
    weight: 64.0,
    height: 162,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ id: 'a2', allergen: 'Sulfa Drugs', reaction: 'Severe Rash', severity: 'HIGH' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine' },
  },
  {
    id: 'pt-94023-08',
    name: 'Rajesh Sharma',
    mrn: '94023-08',
    dob: '1968-11-05',
    gender: 'MALE',
    bed: 'Bed ICU-08',
    status: 'ACTIVE',
    weight: 82.0,
    height: 174,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Evelyn Vance, MD', role: 'ADMIN', specialty: 'Clinical Governance' },
  },
  {
    id: 'pt-94024-03',
    name: 'Meera Iyer',
    mrn: '94024-03',
    dob: '1992-04-19',
    gender: 'FEMALE',
    bed: 'Bed ICU-03',
    status: 'ACTIVE',
    weight: 56.5,
    height: 158,
    ward: { name: 'Ward 4B ICU', unit: 'WARD-4B-ICU' },
    allergies: [{ id: 'a3', allergen: 'Latex', reaction: 'Contact Dermatitis', severity: 'MEDIUM' }],
    prescriptions: [],
    administrations: [],
    clinicalNotes: [],
    attending: { name: 'Dr. Sharma, MD', role: 'DOCTOR', specialty: 'Cardiovascular Medicine' },
  },
];

export const authService = {
  login: (data: { email?: string; password?: string; adminId?: string; staffId?: string; mrn?: string; pin?: string; isPatient?: boolean } | string, maybePassword?: string) => {
    const payload = typeof data === 'string' ? { email: data, password: maybePassword } : data;
    return api.post('/auth/login', payload).then(r => r.data);
  },
  impersonate: (targetUserId?: string, targetStaffId?: string, targetPatientId?: string, targetMrn?: string) =>
    api.post('/auth/impersonate', { targetUserId, targetStaffId, targetPatientId, targetMrn }).then(r => r.data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me').then(r => r.data),
};

import {
  getSyncedPatients,
  syncAddPatient,
  getSyncedPrescriptions,
  syncAddPrescription,
  syncVerifyPrescription,
  getSyncedSchedules,
  syncRecordAdministration,
  syncHoldSchedule,
  syncDelaySchedule,
  getSyncedNurseUpdates,
  syncAddNurseNote,
  syncAcknowledgeNurseUpdate,
  getSyncedAlerts,
  getSyncedAuditLogs,
} from '../utils/syncStore';

export const patientService = {
  getAll: async (params?: Record<string, string>) => {
    const synced = getSyncedPatients();
    try {
      const r = await api.get('/patients', { params });
      if (Array.isArray(r.data)) {
        const map = new Map<string, any>();
        for (const p of synced) map.set(p.id, p);
        for (const p of r.data) map.set(p.id, { ...map.get(p.id), ...p });
        return Array.from(map.values());
      }
      return synced;
    } catch {
      return synced;
    }
  },
  getMyRecord: () =>
    api.get('/patients/me').then(r => r.data).catch(() => getSyncedPatients()[0]),
  search: async (q: string) => {
    const synced = getSyncedPatients().filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.mrn.includes(q));
    try {
      const r = await api.get('/patients/search', { params: { q } });
      if (Array.isArray(r.data) && r.data.length > 0) return r.data;
      return synced;
    } catch {
      return synced;
    }
  },
  getById: async (id: string) => {
    const synced = getSyncedPatients().find(p => p.id === id || p.mrn === id);
    try {
      const r = await api.get(`/patients/${id}`);
      if (r.data) {
        // Merge synced active prescriptions and schedules
        const localPrxs = getSyncedPrescriptions(r.data.id || id);
        const existingPrxIds = new Set((r.data.prescriptions || []).map((p: any) => p.id));
        const mergedPrxs = [
          ...(r.data.prescriptions || []),
          ...localPrxs.filter(lp => !existingPrxIds.has(lp.id))
        ];
        return { ...synced, ...r.data, prescriptions: mergedPrxs };
      }
      return synced || PRESET_PATIENTS[0];
    } catch {
      if (synced) {
        const localPrxs = getSyncedPrescriptions(synced.id);
        return { ...synced, prescriptions: localPrxs };
      }
      return PRESET_PATIENTS[0];
    }
  },
  create: async (data: any) => {
    const syncedPatient = syncAddPatient(data);
    try {
      const r = await api.post('/patients', data);
      return { ...syncedPatient, ...r.data };
    } catch {
      return syncedPatient;
    }
  },
  update: (id: string, data: any) =>
    api.patch(`/patients/${id}`, data).then(r => r.data),
  getAllergies: (id: string) =>
    api.get(`/patients/${id}/allergies`).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
  addAllergy: (id: string, data: any) =>
    api.post(`/patients/${id}/allergies`, data).then(r => r.data),
};

export const prescriptionService = {
  getAll: async (params?: Record<string, string>) => {
    const local = getSyncedPrescriptions(params?.patientId);
    try {
      const r = await api.get('/prescriptions', { params });
      if (Array.isArray(r.data)) {
        const map = new Map<string, any>();
        for (const prx of local) map.set(prx.id, prx);
        for (const prx of r.data) map.set(prx.id, { ...map.get(prx.id), ...prx });
        return Array.from(map.values());
      }
      return local;
    } catch {
      return local;
    }
  },
  getById: async (id: string) => {
    const local = getSyncedPrescriptions().find(p => p.id === id);
    try {
      const r = await api.get(`/prescriptions/${id}`);
      return { ...local, ...r.data };
    } catch {
      return local;
    }
  },
  create: async (data: any) => {
    const localPrx = syncAddPrescription(data);
    try {
      const r = await api.post('/prescriptions', data);
      return { ...localPrx, ...r.data };
    } catch {
      return localPrx;
    }
  },
  update: (id: string, data: any) =>
    api.patch(`/prescriptions/${id}`, data).then(r => r.data),
  sign: (id: string, signingPin: string) =>
    api.post(`/prescriptions/${id}/sign`, { signingPin }).then(r => r.data),
  override: (id: string, data: any) =>
    api.post(`/prescriptions/${id}/override`, data).then(r => r.data),
  hold: (id: string, holdReason: string) =>
    api.post(`/prescriptions/${id}/hold`, { holdReason }).then(r => r.data),
  discontinue: (id: string) =>
    api.post(`/prescriptions/${id}/discontinue`).then(r => r.data),
  pharmacyVerify: async (id: string) => {
    syncVerifyPrescription(id);
    try {
      const r = await api.post(`/prescriptions/${id}/pharmacy-verify`);
      return r.data;
    } catch {
      return { success: true, verified: true, prescriptionId: id };
    }
  },
};

export const scheduleService = {
  getAll: async (params?: Record<string, string>) => {
    const local = getSyncedSchedules(params?.patientId, params?.ward);
    try {
      const r = await api.get('/schedules', { params });
      if (Array.isArray(r.data)) {
        const map = new Map<string, any>();
        for (const s of local) map.set(s.id, s);
        for (const s of r.data) map.set(s.id, { ...map.get(s.id), ...s });
        return Array.from(map.values());
      }
      return local;
    } catch {
      return local;
    }
  },
  getWard: async (params?: Record<string, string>) => {
    const local = getSyncedSchedules(undefined, params?.ward);
    try {
      const r = await api.get('/schedules/ward', { params });
      if (Array.isArray(r.data)) {
        const map = new Map<string, any>();
        for (const s of local) map.set(s.id, s);
        for (const s of r.data) map.set(s.id, { ...map.get(s.id), ...s });
        return Array.from(map.values());
      }
      return local;
    } catch {
      return local;
    }
  },
  administer: async (data: any) => {
    const localUpdate = syncRecordAdministration(data);
    try {
      const r = await api.post('/schedules/administer', data);
      return { ...localUpdate, ...r.data };
    } catch {
      return localUpdate;
    }
  },
  hold: async (id: string, holdReason: string) => {
    const localHold = syncHoldSchedule(id, holdReason);
    try {
      const r = await api.patch(`/schedules/${id}/hold`, { holdReason });
      return { ...localHold, ...r.data };
    } catch {
      return localHold;
    }
  },
  delay: async (id: string, data: any) => {
    const localDelay = syncDelaySchedule(id, data.delayMinutes, data.reason);
    try {
      const r = await api.patch(`/schedules/${id}/delay`, data);
      return { ...localDelay, ...r.data };
    } catch {
      return localDelay;
    }
  },
};

export const alertService = {
  getAll: async (params?: Record<string, string>) => {
    const local = getSyncedAlerts();
    try {
      const r = await api.get('/alerts', { params });
      if (Array.isArray(r.data)) return [...local, ...r.data];
      return local;
    } catch {
      return local;
    }
  },
  override: (id: string, overrideReason: string) =>
    api.post(`/alerts/${id}/override`, { overrideReason }).then(r => r.data),
  resolve: (id: string) =>
    api.patch(`/alerts/${id}/resolve`).then(r => r.data),
};

export const dashboardService = {
  nurse: async (params?: Record<string, string>) => {
    try {
      const r = await api.get('/dashboard/nurse', { params });
      return r.data;
    } catch {
      const schedules = getSyncedSchedules();
      const completed = schedules.filter(s => s.status === 'GIVEN').length;
      const delayed = schedules.filter(s => s.status === 'DELAYED').length;
      const statUrgent = schedules.filter(s => s.prescription?.isStatOrder && s.status === 'PENDING').length;
      return {
        dueToday: schedules.length || 4,
        dueNow: schedules.filter(s => s.status === 'PENDING').length || 1,
        completed,
        delayed,
        statUrgent,
        shiftProgress: schedules.length > 0 ? Math.round((completed / schedules.length) * 100) : 0,
      };
    }
  },
  doctor: async () => {
    const localNurseUpdates = getSyncedNurseUpdates();
    try {
      const r = await api.get('/dashboard/doctor');
      const data = r.data || {};
      const apiUpdates = data.nurseUpdates || [];
      const map = new Map<string, any>();
      for (const u of localNurseUpdates) map.set(u.id, u);
      for (const u of apiUpdates) map.set(u.id, { ...map.get(u.id), ...u });
      return {
        ...data,
        nurseUpdates: Array.from(map.values()),
      };
    } catch {
      return {
        nurseUpdates: localNurseUpdates,
        myPatientsCount: getSyncedPatients().length,
        totalPatients: getSyncedPatients().length,
        activeOrders: getSyncedPrescriptions().length,
      };
    }
  },
  safety: (params?: Record<string, string>) =>
    api.get('/dashboard/safety', { params }).then(r => r.data),
};

export const auditService = {
  getAll: async (params?: Record<string, string>) => {
    const local = getSyncedAuditLogs();
    try {
      const r = await api.get('/audit', { params });
      if (Array.isArray(r.data)) return [...local, ...r.data];
      return local;
    } catch {
      return local;
    }
  },
};

export const notificationService = {
  getAll: () =>
    api.get('/notifications').then(r => r.data),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    api.patch('/notifications/read-all').then(r => r.data),
};

export const reportService = {
  compliance: (days?: number) =>
    api.get('/reports/compliance', { params: { days } }).then(r => r.data),
  adr: (days?: number) =>
    api.get('/reports/adr', { params: { days } }).then(r => r.data),
  adminStats: (days?: number) =>
    api.get('/reports/administration-stats', { params: { days } }).then(r => r.data),
};

export const userService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/users', { params })
      .then(r => Array.isArray(r.data) ? r.data : PRESET_STAFF)
      .catch(() => PRESET_STAFF),
  create: (data: any) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data).then(r => r.data),
  toggleDuty: (id: string) => api.patch(`/users/${id}/duty`).then(r => r.data),
};

export const wardService = {
  getAll: () => api.get('/wards').then(r => r.data),
  getByUnit: (unit: string) => api.get(`/wards/${unit}`).then(r => r.data),
};

export const noteService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/notes', { params }).then(r => r.data),
  create: async (data: any) => {
    if (data.type?.includes('NURSE') || data.category === 'NURSING_ASSESSMENT') {
      syncAddNurseNote({
        patientId: data.patientId,
        title: data.title,
        content: data.content,
        vitals: data.vitals,
      });
    }
    try {
      const r = await api.post('/notes', data);
      return r.data;
    } catch {
      return { success: true, ...data };
    }
  },
  acknowledge: async (id: string) => {
    syncAcknowledgeNurseUpdate(id);
    try {
      const r = await api.patch(`/notes/${id}/acknowledge`);
      return r.data;
    } catch {
      return { success: true };
    }
  },
};
