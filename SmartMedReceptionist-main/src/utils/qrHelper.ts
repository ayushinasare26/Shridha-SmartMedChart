import QRCode from 'qrcode';
import { Patient } from '../types';

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    return '';
  }
}

export function buildPatientQRPayload(patient: Patient): string {
  const payload = {
    protocol: 'SMARTMEDCHART-PASS-V2',
    mrn: patient.mrn,
    token: patient.tokenNumber,
    name: patient.fullName,
    age: patient.age,
    gender: patient.gender,
    blood: patient.caseFile.medicalInfo.bloodGroup,
    allergies: patient.caseFile.medicalInfo.allergies,
    doctor: patient.caseFile.assignedDoctorName,
    dept: patient.caseFile.department,
    room: patient.caseFile.roomNumber,
    emergencyPhone: patient.emergencyContact.phone,
    caseFileId: patient.caseFile.id,
    registeredAt: patient.registrationDate,
    triage: patient.caseFile.triagePriority,
  };
  return JSON.stringify(payload);
}
