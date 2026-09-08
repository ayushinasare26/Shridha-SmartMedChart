import api from '../api/client';

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

export const patientService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/patients', { params }).then(r => r.data),
  getMyRecord: () =>
    api.get('/patients/me').then(r => r.data),
  search: (q: string) =>
    api.get('/patients/search', { params: { q } }).then(r => r.data),
  getById: (id: string) =>
    api.get(`/patients/${id}`).then(r => r.data),
  create: (data: any) =>
    api.post('/patients', data).then(r => r.data),
  update: (id: string, data: any) =>
    api.patch(`/patients/${id}`, data).then(r => r.data),
  getAllergies: (id: string) =>
    api.get(`/patients/${id}/allergies`).then(r => r.data),
  addAllergy: (id: string, data: any) =>
    api.post(`/patients/${id}/allergies`, data).then(r => r.data),
};

export const prescriptionService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/prescriptions', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get(`/prescriptions/${id}`).then(r => r.data),
  create: (data: any) =>
    api.post('/prescriptions', data).then(r => r.data),
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
  pharmacyVerify: (id: string) =>
    api.post(`/prescriptions/${id}/pharmacy-verify`).then(r => r.data),
};

export const scheduleService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/schedules', { params }).then(r => r.data),
  getWard: (params?: Record<string, string>) =>
    api.get('/schedules/ward', { params }).then(r => r.data),
  administer: (data: any) =>
    api.post('/schedules/administer', data).then(r => r.data),
  hold: (id: string, holdReason: string) =>
    api.patch(`/schedules/${id}/hold`, { holdReason }).then(r => r.data),
  delay: (id: string, data: any) =>
    api.patch(`/schedules/${id}/delay`, data).then(r => r.data),
};

export const alertService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/alerts', { params }).then(r => r.data),
  override: (id: string, overrideReason: string) =>
    api.post(`/alerts/${id}/override`, { overrideReason }).then(r => r.data),
  resolve: (id: string) =>
    api.patch(`/alerts/${id}/resolve`).then(r => r.data),
};

export const dashboardService = {
  nurse: (params?: Record<string, string>) =>
    api.get('/dashboard/nurse', { params }).then(r => r.data),
  doctor: () =>
    api.get('/dashboard/doctor').then(r => r.data),
  safety: (params?: Record<string, string>) =>
    api.get('/dashboard/safety', { params }).then(r => r.data),
};

export const auditService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/audit', { params }).then(r => r.data),
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
  getAll: (params?: Record<string, string>) => api.get('/users', { params }).then(r => r.data),
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
  create: (data: any) =>
    api.post('/notes', data).then(r => r.data),
  acknowledge: (id: string) =>
    api.patch(`/notes/${id}/acknowledge`).then(r => r.data),
};
