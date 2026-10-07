/**
 * SmartMedChart Canonical Domain Types
 * Unified across Clinical EHR, eMAR, CPOE, Pharmacy, and Reception Bureau
 */

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type TriagePriority = 'Routine' | 'Priority' | 'Urgent' | 'STAT Urgent' | 'STAT Emergency';

export type PatientStatus = 
  | 'Registered' 
  | 'Waiting in Queue' 
  | 'In Consultation' 
  | 'Observation' 
  | 'Admitted'
  | 'Admitted (IPD)'
  | 'Completed' 
  | 'Discharged'
  | 'Discharged / OPD Followup';

export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'DAY' | 'ROTATING';

export interface ShiftAssistantDoctor {
  shift: 'Morning' | 'Evening' | 'Night';
  shiftTiming: string; // e.g. "08:00 AM - 04:00 PM"
  assistantDoctorName: string;
  assistantDoctorId?: string;
  contactNumber?: string;
  designation?: string;
}

export interface PatientAdmission {
  isAdmitted: boolean;
  admissionDate?: string;
  wardNumber: string; // e.g., "Ward 3 - General Medical"
  bedNumber: string; // e.g., "Bed #06"
  admittingDoctorName?: string;
  shiftAssistantDoctors: ShiftAssistantDoctor[];
  admissionNotes?: string;
}

export type DoctorDepartment = 
  | 'Cardiology' 
  | 'General Medicine' 
  | 'Orthopedics' 
  | 'Pediatrics' 
  | 'Neurology' 
  | 'Dermatology' 
  | 'Pulmonology' 
  | 'Emergency Triage'
  | 'Clinical Governance & Healthcare Administration'
  | 'Acute Surgery Unit 3A'
  | 'ICU & Critical Care';

export type DoctorAvailability = 'available' | 'in-consultation' | 'busy' | 'on-round' | 'break';

export interface VitalSigns {
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  heartRateBpm?: number;
  spO2: number;
  spO2Percent?: number;
  temperature: number;
  temperatureF?: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  respiratoryRate?: number;
  bloodPressure?: string;
}
