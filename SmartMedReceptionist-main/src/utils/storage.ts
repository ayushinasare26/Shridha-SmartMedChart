import { Patient, Doctor } from '../types';
import { INITIAL_PATIENTS, INITIAL_DOCTORS } from '../data/mockHospitalData';

const PATIENTS_STORAGE_KEY = 'smartmedchart_receptionist_patients_v3';
const DOCTORS_STORAGE_KEY = 'smartmedchart_receptionist_doctors_v3';

// In-memory fallback if localStorage is blocked inside sandbox iframes
let memoryPatients: Patient[] = [...INITIAL_PATIENTS];
let memoryDoctors: Doctor[] = [...INITIAL_DOCTORS];

function sanitizePatient(p: any): Patient | null {
  if (!p || typeof p !== 'object' || !p.id || !p.fullName) return null;

  return {
    id: String(p.id),
    mrn: String(p.mrn || 'MRN-00000'),
    tokenNumber: String(p.tokenNumber || 'OPD-00'),
    fullName: String(p.fullName),
    age: Number(p.age || 30),
    gender: p.gender === 'Female' || p.gender === 'Other' ? p.gender : 'Male',
    contactNumber: String(p.contactNumber || '+91 98000 00000'),
    email: p.email ? String(p.email) : undefined,
    registrationDate: String(p.registrationDate || new Date().toISOString().slice(0, 16).replace('T', ' ')),
    receptionistName: String(p.receptionistName || 'Priya Sharma (Desk #01)'),
    emergencyContact: {
      name: String(p.emergencyContact?.name || 'Primary Guardian'),
      relationship: String(p.emergencyContact?.relationship || p.emergencyContact?.relation || 'Next of Kin'),
      relation: String(p.emergencyContact?.relation || p.emergencyContact?.relationship || 'Next of Kin'),
      phone: String(p.emergencyContact?.phone || '+91 98000 00000'),
    },
    nationalIdOrInsurance: String(p.nationalIdOrInsurance || 'Govt Health ID / Ayushman Card'),
    address: String(p.address || 'Civil Lines, Metro Area'),
    dateOfBirth: String(p.dateOfBirth || '1990-01-01'),
    qrPayload: typeof p.qrPayload === 'string' ? p.qrPayload : undefined,
    caseFile: {
      id: String(p.caseFile?.id || `CF-2026-${Math.floor(1000 + Math.random() * 9000)}`),
      patientId: String(p.id || 'PT-94021'),
      createdAt: String(p.caseFile?.createdAt || p.caseFile?.createdDate || new Date().toISOString().slice(0, 16).replace('T', ' ')),
      createdDate: String(p.caseFile?.createdDate || new Date().toISOString().slice(0, 16).replace('T', ' ')),
      updatedAt: String(p.caseFile?.updatedAt || new Date().toISOString().slice(0, 16).replace('T', ' ')),
      tokenNumber: String(p.tokenNumber || 'OPD-01'),
      registeredByStaff: String(p.caseFile?.registeredByStaff || 'Priya Sharma (Receptionist Desk #01)'),
      assignedDoctorId: String(p.caseFile?.assignedDoctorId || 'doc-mehta'),
      assignedDoctorName: String(p.caseFile?.assignedDoctorName || 'Dr. Ananya Mehta'),
      department: p.caseFile?.department || 'General Medicine',
      roomNumber: String(p.caseFile?.roomNumber || 'OPD Room 102 - Wing A'),
      currentStatus: p.caseFile?.currentStatus || 'Waiting in Queue',
      triagePriority: p.caseFile?.triagePriority || 'Routine',
      initialVitals: {
        bpSystolic: Number(p.caseFile?.initialVitals?.bpSystolic || 120),
        bpDiastolic: Number(p.caseFile?.initialVitals?.bpDiastolic || 80),
        heartRate: Number(p.caseFile?.initialVitals?.heartRate || p.caseFile?.initialVitals?.heartRateBpm || 72),
        spO2: Number(p.caseFile?.initialVitals?.spO2 || p.caseFile?.initialVitals?.spO2Percent || 99),
        temperature: Number(p.caseFile?.initialVitals?.temperature || p.caseFile?.initialVitals?.temperatureF || 98.6),
        weightKg: Number(p.caseFile?.initialVitals?.weightKg || 65),
        heightCm: Number(p.caseFile?.initialVitals?.heightCm || 170),
        bmi: Number(p.caseFile?.initialVitals?.bmi || 22.5),
        bloodPressure: String(p.caseFile?.initialVitals?.bloodPressure || '120/80'),
        heartRateBpm: Number(p.caseFile?.initialVitals?.heartRateBpm || 72),
        temperatureF: Number(p.caseFile?.initialVitals?.temperatureF || 98.6),
        spO2Percent: Number(p.caseFile?.initialVitals?.spO2Percent || 99),
        respiratoryRate: Number(p.caseFile?.initialVitals?.respiratoryRate || 16),
      },
      medicalInfo: {
        chiefComplaint: String(p.caseFile?.medicalInfo?.chiefComplaint || 'Routine medical evaluation'),
        symptomsDuration: String(p.caseFile?.medicalInfo?.symptomsDuration || p.caseFile?.medicalInfo?.symptomDuration || '1-2 days'),
        symptomDuration: String(p.caseFile?.medicalInfo?.symptomDuration || p.caseFile?.medicalInfo?.symptomsDuration || '1-2 days'),
        bloodGroup: p.caseFile?.medicalInfo?.bloodGroup || 'O+',
        allergies: Array.isArray(p.caseFile?.medicalInfo?.allergies)
          ? p.caseFile.medicalInfo.allergies
          : ['NKDA (No Known Drug Allergies)'],
        chronicConditions: Array.isArray(p.caseFile?.medicalInfo?.chronicConditions)
          ? p.caseFile.medicalInfo.chronicConditions
          : [],
        currentMedications: Array.isArray(p.caseFile?.medicalInfo?.currentMedications)
          ? p.caseFile.medicalInfo.currentMedications
          : [],
        isDiabetic: Boolean(p.caseFile?.medicalInfo?.isDiabetic),
        isHypertensive: Boolean(p.caseFile?.medicalInfo?.isHypertensive),
        isNPO: Boolean(p.caseFile?.medicalInfo?.isNPO),
        receptionistObservations: String(p.caseFile?.medicalInfo?.receptionistObservations || 'Normal presentation'),
      },
      consultationHistory: Array.isArray(p.caseFile?.consultationHistory)
        ? p.caseFile.consultationHistory
        : [],
    },
    admission: p.admission && typeof p.admission === 'object'
      ? {
          isAdmitted: Boolean(p.admission.isAdmitted),
          admissionDate: p.admission.admissionDate ? String(p.admission.admissionDate) : undefined,
          wardNumber: String(p.admission.wardNumber || 'Ward 3 - General Medical Ward (Male)'),
          bedNumber: String(p.admission.bedNumber || 'GM-01'),
          admittingDoctorName: p.admission.admittingDoctorName ? String(p.admission.admittingDoctorName) : undefined,
          shiftAssistantDoctors: Array.isArray(p.admission.shiftAssistantDoctors)
            ? p.admission.shiftAssistantDoctors.map((s: any) => ({
                shift: s.shift || 'Morning',
                shiftTiming: String(s.shiftTiming || '08:00 AM – 04:00 PM'),
                assistantDoctorName: String(s.assistantDoctorName || 'Dr. Rohan Kapoor'),
                assistantDoctorId: s.assistantDoctorId ? String(s.assistantDoctorId) : undefined,
                contactNumber: s.contactNumber ? String(s.contactNumber) : undefined,
                designation: s.designation ? String(s.designation) : undefined,
              }))
            : [],
          admissionNotes: p.admission.admissionNotes ? String(p.admission.admissionNotes) : undefined,
        }
      : undefined,
  };
}

export function getStoredPatients(): Patient[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return memoryPatients;
    }
    const raw = localStorage.getItem(PATIENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
      memoryPatients = [...INITIAL_PATIENTS];
      return INITIAL_PATIENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_PATIENTS;
    }
    const sanitized = parsed.map(sanitizePatient).filter((p): p is Patient => p !== null);
    if (sanitized.length === 0) {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
    }
    memoryPatients = sanitized;
    return sanitized;
  } catch (err) {
    console.warn('LocalStorage unavailable, using in-memory patient store:', err);
    return memoryPatients;
  }
}

export function saveStoredPatients(patients: Patient[]): void {
  try {
    memoryPatients = patients;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
    }
  } catch (err) {
    console.warn('Could not persist patients to localStorage:', err);
  }
}

export function getStoredDoctors(): Doctor[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return memoryDoctors;
    }
    const raw = localStorage.getItem(DOCTORS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_DOCTORS));
      memoryDoctors = [...INITIAL_DOCTORS];
      return INITIAL_DOCTORS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_DOCTORS;
    }
    memoryDoctors = parsed;
    return parsed;
  } catch (err) {
    console.warn('LocalStorage unavailable, using in-memory doctors store:', err);
    return memoryDoctors;
  }
}

export function saveStoredDoctors(doctors: Doctor[]): void {
  try {
    memoryDoctors = doctors;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(doctors));
    }
  } catch (err) {
    console.warn('Could not persist doctors to localStorage:', err);
  }
}

export function resetDemoData(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
      localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_DOCTORS));
    }
  } catch (err) {
    console.warn('Could not reset localStorage:', err);
  }
  memoryPatients = [...INITIAL_PATIENTS];
  memoryDoctors = [...INITIAL_DOCTORS];
}
