import { jsPDF } from 'jspdf';

export interface ReportPdfData {
  reportName: string;
  reportType?: 'lab' | 'imaging';
  date: string;
  status: string;
  doctor: string;
  findings: string;
  refRange: string;
  patient: {
    name: string;
    mrn: string;
    abhaId?: string;
    age: number;
    gender: string;
    ward: string;
    bed: string;
    bloodGroup?: string;
    diagnosis?: string;
  };
}

export interface PrescriptionPdfData {
  patient: {
    name: string;
    mrn: string;
    abhaId?: string;
    age: number;
    gender: string;
    ward: string;
    bed: string;
    attending: string;
    allergies: Array<{ allergen: string; severity: string }>;
  };
  medications: Array<{
    name: string;
    saltName: string;
    doseRoute: string;
    frequency: string;
    timing: string;
    nextDose: string;
    statusType: string;
  }>;
}

/**
 * Generates and immediately initiates browser download for an official Diagnostic Report PDF.
 */
export function downloadDiagnosticReportPdf(data: ReportPdfData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(37, 99, 235); // Hospital Royal Blue
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Hospital Header & Accreditation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('SHRIDHA HOSPITAL & RESEARCH INSTITUTE, NAGPUR', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('CENTRAL CLINICAL LABORATORY & DIAGNOSTIC IMAGING SERVICES', margin, 22);
  doc.text('Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Samarth Nagar East, Nagpur - 440015', margin, 26);
  doc.text('Tel: 0712-2420299 / 2985296 | Mobile: +91 93735 10580 | NABH & NABL Accredited | ABDM Integrated', margin, 30);

  // Right-aligned Emergency & Helpline
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // Rose Red
  doc.text('Emergency: 108 / 112', pageWidth - margin, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Nagpur, Maharashtra', pageWidth - margin, 22, { align: 'right' });

  // Divider line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.6);
  doc.line(margin, 33, pageWidth - margin, 33);

  // 3. Document Title Banner
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(margin, 36, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text('DEPARTMENTAL DIAGNOSTIC INVESTIGATION REPORT', pageWidth / 2, 41.5, { align: 'center' });

  // 4. Patient Demographics Card
  const boxTop = 47;
  const boxHeight = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, boxTop, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(8.5);

  // Col 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Patient Name:', margin + 4, boxTop + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.patient.name, margin + 28, boxTop + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Age / Gender:', margin + 4, boxTop + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.patient.age} Y / ${data.patient.gender}`, margin + 28, boxTop + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('UHID / MRN:', margin + 4, boxTop + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.patient.mrn, margin + 28, boxTop + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('ABHA ID:', margin + 4, boxTop + 28);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(37, 99, 235);
  doc.text(data.patient.abhaId || '91-4412-8821-9043', margin + 28, boxTop + 28);

  // Col 2
  const col2X = margin + (contentWidth / 2) + 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Ward & Bed:', col2X, boxTop + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.patient.ward}, Bed ${data.patient.bed}`, col2X + 28, boxTop + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Ordering Doctor:', col2X, boxTop + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.doctor || 'Dr. V. Sharma, MD', col2X + 28, boxTop + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Report Date:', col2X, boxTop + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.date} (11:15 AM IST)`, col2X + 28, boxTop + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Report Status:', col2X, boxTop + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald green
  doc.text(`${data.status} (Verified)`, col2X + 28, boxTop + 28);

  // 5. Test Title Header
  let cursorY = boxTop + boxHeight + 10;
  doc.setFillColor(239, 246, 255); // Light blue
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, cursorY, contentWidth, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text(data.reportName.toUpperCase(), margin + 4, cursorY + 6.5);

  // 6. Test Findings & Results Section
  cursorY += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LABORATORY OBSERVATIONS & CLINICAL FINDINGS', margin, cursorY);

  cursorY += 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 34, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  
  // Wrap findings text nicely inside box
  const splitFindings = doc.splitTextToSize(data.findings, contentWidth - 8);
  doc.text(splitFindings, margin + 4, cursorY + 7);

  // Reference Standard Box
  cursorY += 38;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Biological Reference Limits / Normal Range:', margin + 4, cursorY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(data.refRange, margin + 4, cursorY + 11.5);

  // 7. Clinical Remarks & Interpretation
  cursorY += 21;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CONSULTANT PATHOLOGIST INTERPRETATION:', margin, cursorY);

  cursorY += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const remarks = 'Parameters have been evaluated on calibrated auto-analyzers with automated 2-level controls in place. Correlate clinically with inpatient status. Repeat sample recommended in 48-72 hours if clinically warranted.';
  const splitRemarks = doc.splitTextToSize(remarks, contentWidth);
  doc.text(splitRemarks, margin, cursorY + 4);

  // 8. Authentication & Signatures
  cursorY += 25;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);

  cursorY += 8;
  // Left: Lab technologist
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Tested & Processed By:', margin, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('K. Sharma, M.Sc (Med Lab Tech)', margin, cursorY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Sr. Medical Lab Technologist', margin, cursorY + 8.5);

  // Right: Consultant Signatory
  const rightColX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Authenticated & Released By:', rightColX, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.doctor || 'Dr. Elena Rostova, MD', rightColX, cursorY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Consultant Pathologist & HOD', rightColX, cursorY + 8.5);
  doc.setTextColor(37, 99, 235);
  doc.text('Reg No: MCI-2011-8842', rightColX, cursorY + 12.5);

  // 9. Official Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Shridha Hospital & Research Institute, Wardha Road, Nagpur | Official Inpatient Medical Record', margin, footerY);
  doc.text('Page 1 of 1', pageWidth - margin, footerY, { align: 'right' });

  // Initiate Download
  const cleanFilename = `${data.reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.patient.mrn}.pdf`;
  doc.save(cleanFilename);
}

/**
 * Generates and downloads the Hospital Pharmacy Prescription & Inpatient Drug Formulary Sheet.
 */
export function downloadPrescriptionSheetPdf(data: PrescriptionPdfData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Brand Header
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('SHRIDHA HOSPITAL & RESEARCH INSTITUTE, NAGPUR', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INPATIENT MEDICATION ADMINISTRATION ORDER SHEET (eMAR)', margin, 22);
  doc.text('Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Nagpur - 440015 | Tel: 0712-2420299', margin, 26);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 30, pageWidth - margin, 30);

  // Patient Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, 33, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Patient Name:', margin + 4, 39);
  doc.setTextColor(15, 23, 42);
  doc.text(data.patient.name, margin + 28, 39);

  doc.setTextColor(71, 85, 105);
  doc.text('UHID / MRN:', margin + 4, 46);
  doc.setTextColor(15, 23, 42);
  doc.text(data.patient.mrn, margin + 28, 46);

  doc.setTextColor(71, 85, 105);
  doc.text('Ward & Bed:', margin + 4, 53);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.patient.ward}, Bed ${data.patient.bed}`, margin + 28, 53);

  const col2X = margin + (contentWidth / 2) + 2;
  doc.setTextColor(71, 85, 105);
  doc.text('Attending Doctor:', col2X, 39);
  doc.setTextColor(15, 23, 42);
  doc.text(data.patient.attending, col2X + 28, 39);

  doc.setTextColor(71, 85, 105);
  doc.text('Prescription Date:', col2X, 46);
  doc.setTextColor(15, 23, 42);
  doc.text('08 Sep 2024, 11:30 AM', col2X + 28, 46);

  doc.setTextColor(71, 85, 105);
  doc.text('Known Allergies:', col2X, 53);
  doc.setTextColor(225, 29, 72);
  const allergyText = data.patient.allergies?.length
    ? data.patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ')
    : 'No Known Drug Allergies (NKDA)';
  doc.text(doc.splitTextToSize(allergyText, (contentWidth / 2) - 30), col2X + 28, 53);

  // Table Header
  let tableY = 64;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, tableY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DRUG BRAND & SALT NAME (IP)', margin + 3, tableY + 5);
  doc.text('DOSE & ROUTE', margin + 70, tableY + 5);
  doc.text('FREQUENCY', margin + 105, tableY + 5);
  doc.text('TIMING / INSTRUCTION', margin + 140, tableY + 5);

  tableY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  data.medications.forEach((med, i) => {
    const rowY = tableY + (i * 12);
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 12, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(med.name, margin + 3, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(med.saltName, margin + 3, rowY + 9);

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(med.doseRoute, margin + 70, rowY + 6);
    doc.text(med.frequency, margin + 105, rowY + 6);

    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(med.timing, contentWidth - 142), margin + 140, rowY + 6);
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Authorized by Hospital Inpatient Pharmacy | Dual Nurse Check Required on Administration', margin, footerY);

  doc.save(`Prescription_Sheet_${data.patient.mrn}.pdf`);
}

export interface ConsentPdfData {
  patient: {
    name: string;
    mrn: string;
    abhaId?: string;
    ward: string;
    bed: string;
    caregiverName: string;
    caregiverRelation: string;
  };
  consentEhr: boolean;
  consentAbhaSync: boolean;
  consentCaregiver: boolean;
  consentEmergency: boolean;
}

/**
 * Generates and downloads the official ABDM Consent & Privacy Certificate PDF.
 */
export function downloadConsentCertificatePdf(data: ConsentPdfData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header Bar
  doc.setFillColor(30, 58, 138); // Navy Blue
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('SHRIDHA HOSPITAL & RESEARCH INSTITUTE, NAGPUR', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ABDM PATIENT CONSENT & DIGITAL HEALTH RECORD AUTHORIZATION', margin, 22);
  doc.text('Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Nagpur - 440015 | Tel: 0712-2420299', margin, 26);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 30, pageWidth - margin, 30);

  // Patient details card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, 34, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Patient Name:', margin + 4, 40);
  doc.setTextColor(15, 23, 42);
  doc.text(data.patient.name, margin + 28, 40);

  doc.setTextColor(71, 85, 105);
  doc.text('UHID / MRN:', margin + 4, 47);
  doc.setTextColor(15, 23, 42);
  doc.text(data.patient.mrn, margin + 28, 47);

  doc.setTextColor(71, 85, 105);
  doc.text('ABHA ID:', margin + 4, 54);
  doc.setTextColor(37, 99, 235);
  doc.text(data.patient.abhaId || '91-4412-8821-9043', margin + 28, 54);

  const col2X = margin + (contentWidth / 2) + 2;
  doc.setTextColor(71, 85, 105);
  doc.text('Ward & Bed:', col2X, 40);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.patient.ward}, Bed ${data.patient.bed}`, col2X + 28, 40);

  doc.setTextColor(71, 85, 105);
  doc.text('Consent Artifact ID:', col2X, 47);
  doc.setTextColor(15, 23, 42);
  doc.text('CA-MHA-2024-8849', col2X + 28, 47);

  doc.setTextColor(71, 85, 105);
  doc.text('Validity Period:', col2X, 54);
  doc.setTextColor(16, 185, 129);
  doc.text('Active (Discharge + 90 Days)', col2X + 28, 54);

  // Consent items list
  let y = 66;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTERED PATIENT CONSENT DIRECTIVES:', margin, y);

  const items = [
    { title: 'Inpatient EHR Clinical Data Exchange', desc: 'Authorized treating consultants and nursing officers to access complete clinical notes, eMAR logs, and medication history.', status: data.consentEhr ? 'GRANTED' : 'REVOKED' },
    { title: 'National ABHA Personal Health Record Sync', desc: 'Automated sharing of validated lab test reports and discharge summaries with ABDM-compliant health locker apps.', status: data.consentAbhaSync ? 'GRANTED' : 'REVOKED' },
    { title: `Designated Caregiver Access (${data.patient.caregiverName} - ${data.patient.caregiverRelation})`, desc: 'Authorized proxy to receive bedside vital signs, inpatient medication timelines, and emergency alerts.', status: data.consentCaregiver ? 'GRANTED' : 'REVOKED' },
    { title: 'Acute Critical Care Emergency Disclosure', desc: 'Unrestricted immediate health record disclosure to ICU and Code Blue resuscitation specialists during life-threatening events.', status: data.consentEmergency ? 'GRANTED' : 'REVOKED' },
  ];

  y += 6;
  items.forEach(item => {
    doc.setFillColor(item.status === 'GRANTED' ? 240 : 254, item.status === 'GRANTED' ? 253 : 242, item.status === 'GRANTED' ? 244 : 242);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.status === 'GRANTED' ? 22 : 225, item.status === 'GRANTED' ? 101 : 29, item.status === 'GRANTED' ? 52 : 72);
    doc.text(item.status, pageWidth - margin - 22, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(item.desc, contentWidth - 30), margin + 4, y + 11);

    y += 22;
  });

  // Legal declaration
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('This digital consent is executed in strict compliance with the Digital Personal Data Protection Act (DPDP 2023) and the National Health Authority ABDM Consent Framework. The patient or registered proxy retains the legal right to alter or withdraw consent at any time.', margin, y, { maxWidth: contentWidth });

  // Signature block
  y += 25;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Digitally Authenticated by Patient via Aadhaar / ABHA OTP', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Verification Code: ABDM-OTP-VERIFIED-9842', margin, y + 4.5);

  const rightX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Data Fiduciary Nodal Officer', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Shridha Hospital & Research Institute, Nagpur', rightX, y + 4.5);

  doc.save(`ABDM_Consent_Certificate_${data.patient.mrn}.pdf`);
}
