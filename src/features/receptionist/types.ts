import type {
  BloodGroup,
  TriagePriority,
  PatientStatus,
  ShiftAssistantDoctor,
  PatientAdmission,
  DoctorDepartment,
  DoctorAvailability,
} from '@/types/domain.types';

export type {
  BloodGroup,
  TriagePriority,
  PatientStatus,
  ShiftAssistantDoctor,
  PatientAdmission,
  DoctorDepartment,
  DoctorAvailability,
};

export type ShiftType = 'Morning' | 'Evening' | 'Night';

export interface VitalSigns {
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number; // bpm
  spO2: number; // %
  temperature: number; // °F
  weightKg: number;
  heightCm: number;
  bmi: number;
  respiratoryRate?: number; // breaths/min
  bloodPressure?: string; // e.g. "120/80"
  heartRateBpm?: number;
  temperatureF?: number;
  spO2Percent?: number;
}

export interface BasicMedicalInfo {
  bloodGroup: BloodGroup;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  chiefComplaint: string;
  symptomsDuration: string;
  symptomDuration?: string;
  isNPO: boolean; // Nil Per Os (fasting)
  isDiabetic?: boolean;
  isHypertensive?: boolean;
  highRiskAlert?: string;
  receptionistObservations?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string; // e.g., "1-0-1 (After Meals)"
  duration: string; // e.g., "5 Days"
  instructions?: string;
}

export interface ConsultationLog {
  id: string;
  caseFileId: string;
  patientId: string;
  patientName: string;
  consultationDate: string; // ISO date string
  doctorId: string;
  doctorName: string;
  department: DoctorDepartment;
  roomNumber: string;
  chiefComplaint: string;
  vitalsAtVisit?: VitalSigns;
  clinicalObservations: string;
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  labInvestigationsOrdered: string[];
  followUpDate?: string;
  consultationStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Follow-up Required' | 'Referred';
  doctorSignature: string;
  receptionistNotes?: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: DoctorDepartment;
  roomNumber: string;
  opdHours: string;
  status: DoctorAvailability;
  currentQueueCount: number;
  qualifications: string;
  avatarInitials: string;
  experienceYears: number;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  relation?: string;
  phone: string;
}

export interface CaseFile {
  id: string; // e.g., CF-2026-0941
  patientId: string;
  createdAt: string;
  createdDate?: string;
  updatedAt: string;
  triagePriority: TriagePriority;
  currentStatus: PatientStatus;
  assignedDoctorId: string;
  assignedDoctorName: string;
  department: DoctorDepartment;
  roomNumber: string;
  tokenNumber: string;
  initialVitals: VitalSigns;
  medicalInfo: BasicMedicalInfo;
  consultationHistory: ConsultationLog[];
  registeredByStaff: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number, e.g. MRN-94021
  tokenNumber: string; // e.g. OPD-12
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  contactNumber: string;
  email?: string;
  address: string;
  emergencyContact: EmergencyContact;
  nationalIdOrInsurance: string;
  registrationDate: string;
  receptionistName?: string;
  qrPayload?: string;
  admission?: PatientAdmission | null;
  patientType?: string;
  bedNumber?: string;
  wardName?: string;
  caseFile: CaseFile;
}

export type ActiveWorkspace = 
  | 'queue' 
  | 'registration' 
  | 'case-files' 
  | 'doctors' 
  | 'consultation-logs' 
  | 'qr-station';
