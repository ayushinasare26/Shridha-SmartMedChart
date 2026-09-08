import { PrismaClient, UserRole, PatientStatus, PrescriptionStatus, ScheduleStatus, AlertSeverity, AlertType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

function hmac(data: string) {
  return createHmac('sha256', 'smartmedchart-super-secret-jwt-key-hipaa-compliant-2024').update(data).digest('hex');
}

function daysFromNow(d: number) {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date;
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function todayAt(hour: number, min = 0) {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding SmartMedChart database...');

  // Clean up
  await prisma.administrationRecord.deleteMany();
  await prisma.medicationSchedule.deleteMany();
  await prisma.safetyAlert.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.ward.deleteMany();

  // ═══════════════ WARDS ═══════════════
  const ward4B = await prisma.ward.create({
    data: {
      name: 'Ward 4B ICU',
      unit: 'WARD-4B-ICU',
      capacity: 18,
      occupancy: 16,
      location: 'Metropolitan General Hospital — North Wing, Floor 4',
    },
  });

  const wardSurgical = await prisma.ward.create({
    data: {
      name: 'Ward 4B Surgical ICU',
      unit: 'WARD-4B-SICU',
      capacity: 12,
      occupancy: 10,
      location: 'Metropolitan General Hospital — South Wing, Floor 4',
    },
  });

  console.log('✅ Wards created');

  // ═══════════════ USERS & HOSPITAL PERSONNEL ═══════════════
  const passwordHash = await bcrypt.hash('SmartMed@2024', 12);

  // 1. Dr. Rohit Verma, MD — Lead Hospital Administrator
  const adminVance = await prisma.user.create({
    data: {
      email: 'rohit.verma@metrohealth.org',
      name: 'Dr. Rohit Verma, MD',
      role: 'ADMIN',
      passwordHash,
      staffId: 'ADM-9001',
      title: 'Lead Hospital Administrator',
      ward: 'Executive Suite - Governance',
      department: 'Clinical Governance & Healthcare Administration',
      specialty: 'Clinical Governance & Healthcare Administration',
      licenseNumber: 'MD-ADM-9001',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Manashvi Dok, MBA — Director of Hospital Operations
  const adminHastings = await prisma.user.create({
    data: {
      email: 'manashvi.dok@metrohealth.org',
      name: 'Manashvi Dok, MBA',
      role: 'ADMIN',
      passwordHash,
      staffId: 'ADM-1002',
      title: 'Director of Hospital Operations',
      ward: 'Hospital Operations Bureau',
      department: 'Hospital Operations & Staffing Bureau',
      specialty: 'Staffing Logistics & Inpatient Flow',
      licenseNumber: 'HOSP-OPS-44102',
      shiftType: 'MORNING',
      onDuty: false,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 3. Dr. Sarah Chen, MD — Consultant Physician
  const drChen = await prisma.user.create({
    data: {
      email: 'sarah.chen@metrohealth.org',
      name: 'Dr. Sarah Chen, MD',
      role: 'DOCTOR',
      passwordHash,
      staffId: 'DOC-84729',
      title: 'Consultant Physician',
      ward: 'Ward 4B ICU',
      department: 'Ward 4B - Internal Medicine',
      specialty: 'Internal Medicine & Geriatrics',
      licenseNumber: 'MD-98729-CA',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1594824813515-5389f47021eb?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 4. Dr. Rohan Ross, MD — Senior Cardiologist
  const drRoss = await prisma.user.create({
    data: {
      email: 'rohan.ross@metrohealth.org',
      name: 'Dr. Rohan Ross, MD',
      role: 'DOCTOR',
      passwordHash,
      staffId: 'DOC-99120',
      title: 'Senior Cardiologist',
      ward: 'Cardiology CCU',
      department: 'Cardiology & General Medicine',
      specialty: 'Cardiology & Heart Failure',
      licenseNumber: 'MD-99120-NY',
      shiftType: 'ROTATING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 5. Dr. Marcus Singh, MD — Lead General Surgeon
  const drSingh = await prisma.user.create({
    data: {
      email: 'marcus.singh@metrohealth.org',
      name: 'Dr. Marcus Singh, MD',
      role: 'DOCTOR',
      passwordHash,
      staffId: 'DOC-51029',
      title: 'Lead General Surgeon',
      ward: 'Acute Surgery Unit 3A',
      department: 'Acute Surgery Unit 3A',
      specialty: 'Trauma & General Surgery',
      licenseNumber: 'MD-51029-TX',
      shiftType: 'ROTATING',
      onDuty: false,
      avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 6. Dr. Aisha Patel, MD — Intensivist / Critical Care Specialist
  const drAisha = await prisma.user.create({
    data: {
      email: 'aisha.patel@metrohealth.org',
      name: 'Dr. Aisha Patel, MD',
      role: 'DOCTOR',
      passwordHash,
      staffId: 'DOC-23921',
      title: 'Intensivist / Critical Care Specialist',
      ward: 'Ward 4B ICU',
      department: 'ICU & Critical Care',
      specialty: 'Critical Care & Resuscitation',
      licenseNumber: 'MD-23921-IL',
      shiftType: 'NIGHT',
      onDuty: false,
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 7. Sarah Jenkins, RN — Staff Registered Nurse
  const nurseJenkins = await prisma.user.create({
    data: {
      email: 'sarah.jenkins@metrohealth.org',
      name: 'Sarah Jenkins, RN',
      role: 'NURSE',
      passwordHash,
      staffId: 'RN-55219',
      title: 'Staff Registered Nurse',
      ward: 'Ward 4B (Acute Medicine)',
      department: 'Ward 4B (Acute Medicine)',
      specialty: 'Acute Inpatient Care & eMAR Administration',
      licenseNumber: 'RN-55219-UK',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 8. Marcus Brody, RN — Ward Charge Nurse / Shift Lead
  const nurseBrody = await prisma.user.create({
    data: {
      email: 'marcus.brody@metrohealth.org',
      name: 'Marcus Brody, RN',
      role: 'NURSE',
      passwordHash,
      staffId: 'CN-40192',
      title: 'Ward Charge Nurse / Shift Lead',
      ward: 'Ward 4B (Acute Medicine)',
      department: 'Ward 4B (Acute Medicine)',
      specialty: 'Ward Resource Management & Medication Safety',
      licenseNumber: 'RN-40192-US',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 9. Priya Patel, BPharm — Lead Clinical Pharmacist
  const pharmPriya = await prisma.user.create({
    data: {
      email: 'priya.patel.pharm@metrohealth.org',
      name: 'Priya Patel, BPharm',
      role: 'PHARMACIST',
      passwordHash,
      staffId: 'PH-31405',
      title: 'Lead Clinical Pharmacist',
      ward: 'Clinical Pharmacy Services',
      department: 'Clinical Pharmacy Services',
      specialty: 'Pharmacotherapy & Drug Interaction Triage',
      licenseNumber: 'RPH-31405-GB',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 10. David Kim, MLS — Senior Medical Lab Technologist
  const techKim = await prisma.user.create({
    data: {
      email: 'david.kim@metrohealth.org',
      name: 'David Kim, MLS',
      role: 'ALLIED_STAFF',
      passwordHash,
      staffId: 'LT-44201',
      title: 'Senior Medical Lab Technologist',
      ward: 'Central Pathology & Blood Bank',
      department: 'Central Pathology & Blood Bank',
      specialty: 'Diagnostic Hematology & Cross-matching',
      licenseNumber: 'MLS-44201-ASCP',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 11. Elena Rostova, RT(R) — Lead Radiologic Technologist
  const techRostova = await prisma.user.create({
    data: {
      email: 'elena.rostova@metrohealth.org',
      name: 'Elena Rostova, RT(R)',
      role: 'ALLIED_STAFF',
      passwordHash,
      staffId: 'RT-55102',
      title: 'Lead Radiologic Technologist',
      ward: 'Diagnostic Radiology & CT Imaging',
      department: 'Diagnostic Radiology & CT Imaging',
      specialty: 'Bedside Mobile X-Ray & CT Imaging',
      licenseNumber: 'ARRT-55102',
      shiftType: 'MORNING',
      onDuty: false,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 12. Dr. V. Sharma, MD — Attending Intensivist
  const drSharma = await prisma.user.create({
    data: {
      email: 'sharma.md@metrohealth.org',
      name: 'Dr. V. Sharma, MD',
      role: 'DOCTOR',
      passwordHash,
      staffId: 'DR-4001',
      title: 'Attending Intensivist',
      ward: 'Ward 4B ICU',
      department: 'Pulmonology / Critical Care',
      specialty: 'Pulmonology & Intensive Care',
      licenseNumber: 'MD-4001-IL',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 13. Nurse Priya, RN — Primary Bedside BSN
  const nursePriya = await prisma.user.create({
    data: {
      email: 'priya.rn@metrohealth.org',
      name: 'Nurse Priya, RN',
      role: 'NURSE',
      passwordHash,
      staffId: 'RN-8821',
      title: 'Primary Bedside BSN',
      ward: 'Ward 4B ICU',
      department: 'ICU Ward 4B Primary',
      specialty: 'Critical Care eMAR Administration',
      licenseNumber: 'RN-8821-NY',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 14. Pharm. Dave P., PharmD — Clinical Pharmacist
  const pharmDave = await prisma.user.create({
    data: {
      email: 'dave.pharm@metrohealth.org',
      name: 'Pharm. Dave P., PharmD',
      role: 'PHARMACIST',
      passwordHash,
      staffId: 'PH-2201',
      title: 'Clinical Pharmacist',
      ward: 'Ward 4B ICU',
      department: 'Clinical Pharmacy',
      specialty: 'High-Alert Med Verification & Infusion Safety',
      licenseNumber: 'RPH-2201-CA',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 15. Admin Elena — Ward Supervisor
  const adminElena = await prisma.user.create({
    data: {
      email: 'elena.admin@metrohealth.org',
      name: 'Admin Elena',
      role: 'ADMIN',
      passwordHash,
      staffId: 'ADM-0001',
      title: 'Ward Operations Supervisor',
      ward: 'Ward 4B ICU',
      department: 'Ward Administration',
      specialty: 'Inpatient Scheduling & Bed Tracking',
      licenseNumber: 'ADM-0001-IL',
      shiftType: 'MORNING',
      onDuty: true,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('✅ Users & Hospital Personnel created');

  // ═══════════════ PATIENTS ═══════════════
  const rahulPatil = await prisma.patient.create({
    data: {
      mrn: '94021-08',
      name: 'Rahul Patil',
      dob: new Date('1979-08-14'),
      sex: 'Male',
      weight: 72.4,
      wardId: ward4B.id,
      bed: 'ICU-12',
      attendingId: drSharma.id,
      admissionDiagnosis: 'Septic Shock secondary to RLE Cellulitis',
      npoStatus: true,
      codeStatus: 'Full',
      isolationStatus: true,
      status: 'ACTIVE',
      eGFR: 62,
      creatinine: 1.1,
      bilirubin: 0.8,
      platelets: 194,
      emergencyContactName: 'Sunita Patil',
      emergencyContactRelation: 'Spouse / Primary Proxy',
      emergencyContactPhone: '+1 (555) 349-8291',
    },
  });

  const anitaDesai = await prisma.patient.create({
    data: {
      mrn: '94022-15',
      name: 'Anita Desai',
      dob: new Date('1958-03-22'),
      sex: 'Female',
      weight: 58.0,
      wardId: ward4B.id,
      bed: 'ICU-14',
      attendingId: drSharma.id,
      admissionDiagnosis: 'Type 2 Diabetes with HHS',
      npoStatus: false,
      codeStatus: 'Full',
      status: 'ACTIVE',
      eGFR: 45,
      creatinine: 1.8,
      emergencyContactName: 'Vikram Desai',
      emergencyContactRelation: 'Son',
      emergencyContactPhone: '+1 (555) 782-9014',
    },
  });

  const georgeMatthews = await prisma.patient.create({
    data: {
      mrn: '94023-08',
      name: 'sunita maske',
      dob: new Date('1965-11-05'),
      sex: 'Female',
      weight: 89.2,
      wardId: ward4B.id,
      bed: 'ICU-08',
      attendingId: drSharma.id,
      admissionDiagnosis: 'Post-op Bowel Resection, Anastomotic Leak',
      npoStatus: true,
      codeStatus: 'Full',
      status: 'ACTIVE',
      eGFR: 78,
      emergencyContactName: 'Sarah Matthews',
      emergencyContactRelation: 'Spouse',
      emergencyContactPhone: '+1 (555) 412-6893',
    },
  });

  const mrsBrown = await prisma.patient.create({
    data: {
      mrn: '94024-03',
      name: 'Margaret Brown',
      dob: new Date('1942-07-18'),
      sex: 'Female',
      weight: 62.5,
      wardId: ward4B.id,
      bed: 'ICU-03',
      attendingId: drChen.id,
      admissionDiagnosis: 'COPD Exacerbation with Respiratory Failure',
      npoStatus: false,
      codeStatus: 'DNR/DNI',
      status: 'ACTIVE',
      eGFR: 35,
      emergencyContactName: 'David Brown',
      emergencyContactRelation: 'Son / Power of Attorney',
      emergencyContactPhone: '+1 (555) 903-2418',
    },
  });

  console.log('✅ Patients created');

  // ═══════════════ ALLERGIES ═══════════════
  const rahulPenicillinAllergy = await prisma.allergy.create({
    data: {
      patientId: rahulPatil.id,
      allergen: 'Penicillin G',
      severity: 'Anaphylaxis',
      reaction: 'Laryngeal edema, ICU intubation required (2021)',
      verifiedAt: new Date('2021-06-15'),
      verifiedBy: 'Dr. Aris Thorne, Allergy ID #882',
      crossReactsWith: 'Beta-lactam antibiotics, Cephalosporins',
    },
  });

  await prisma.allergy.create({
    data: {
      patientId: anitaDesai.id,
      allergen: 'Sulfa Drugs',
      severity: 'Severe',
      reaction: 'Stevens-Johnson Syndrome',
      verifiedAt: new Date('2020-02-10'),
    },
  });

  await prisma.allergy.create({
    data: {
      patientId: georgeMatthews.id,
      allergen: 'Codeine',
      severity: 'Moderate',
      reaction: 'Severe nausea, vomiting, respiratory depression',
      verifiedAt: new Date('2019-08-22'),
    },
  });

  console.log('✅ Allergies created');

  // ═══════════════ PRESCRIPTIONS ═══════════════
  // Rahul's prescriptions
  const ceftriaxonePrx = await prisma.prescription.create({
    data: {
      patientId: rahulPatil.id,
      prescriberId: drSharma.id,
      medicationName: 'Ceftriaxone Sodium (Rocephin)',
      genericName: 'Ceftriaxone',
      medicationClass: 'Cephalosporin',
      dose: 1,
      unit: 'g',
      route: 'IV Piggyback in 50mL D5W',
      frequency: 'Q24H',
      startDate: new Date(),
      stopDate: daysFromNow(3),
      status: 'STAT',
      indication: 'Severe Sepsis secondary to Cellulitis',
      isStatOrder: true,
      pharmacyVerified: true,
      pharmacyVerifiedAt: new Date(),
      pharmacyVerifiedBy: pharmDave.id,
      requiresCoSign: true,
      coSignedById: pharmDave.id,
      coSignedAt: new Date(),
      overrideReason: 'Benefit outweighs acute risk; Bedside desensitization / Epinephrine at bedside confirmed',
      formularyRef: 'IDSA Sepsis Fast-Track',
      rxNumber: 'RX-8821',
    },
  });

  const paracetamolPrx = await prisma.prescription.create({
    data: {
      patientId: rahulPatil.id,
      prescriberId: drSharma.id,
      medicationName: 'Paracetamol IV (Acetaminophen / Perfalgan)',
      genericName: 'Acetaminophen',
      medicationClass: 'Analgesic/Antipyretic',
      dose: 1000,
      unit: 'mg',
      route: 'IV Infusion over 15 min',
      frequency: 'Q8H',
      startDate: new Date(),
      stopDate: daysFromNow(5),
      status: 'ACTIVE',
      indication: 'Post-op pyrexia management. Max 4000mg/24hr.',
      isStatOrder: false,
      pharmacyVerified: true,
      formularyRef: 'FORMULARY-2024',
      rxNumber: 'RX-8841',
    },
  });

  const insulinPrx = await prisma.prescription.create({
    data: {
      patientId: anitaDesai.id,
      prescriberId: drSharma.id,
      medicationName: 'Insulin Glargine (Lantus SoloStar)',
      genericName: 'Insulin Glargine',
      medicationClass: 'Long-acting Insulin',
      dose: 14,
      unit: 'Units',
      route: 'Subcutaneous Injection (SC)',
      frequency: 'BEDTIME',
      startDate: new Date(),
      status: 'ACTIVE',
      indication: 'Glycemic control — target BG 140-180 mg/dL',
      isStatOrder: false,
      requiresCoSign: true,
      pharmacyVerified: true,
      formularyRef: 'HIGH-ALERT-INSULIN',
    },
  });

  const pantoprazolePrx = await prisma.prescription.create({
    data: {
      patientId: rahulPatil.id,
      prescriberId: drSharma.id,
      medicationName: 'Pantoprazole Sodium (Protonix)',
      genericName: 'Pantoprazole',
      medicationClass: 'Proton Pump Inhibitor',
      dose: 40,
      unit: 'mg',
      route: 'IV Push (over 2-3 min)',
      frequency: 'Q24H',
      startDate: new Date(),
      status: 'ACTIVE',
      indication: 'Stress ulcer prophylaxis in ICU mechanical ventilation',
      isStatOrder: false,
      pharmacyVerified: true,
      formularyRef: 'GI-PROPHYLAXIS',
    },
  });

  const pipTazPrx = await prisma.prescription.create({
    data: {
      patientId: georgeMatthews.id,
      prescriberId: drSharma.id,
      medicationName: 'Piperacillin/Tazobactam (Zosyn)',
      genericName: 'Piperacillin Tazobactam',
      medicationClass: 'Beta-lactam Antibiotic',
      dose: 4.5,
      unit: 'g',
      route: 'IV Infusion (Extended)',
      frequency: 'Q8H',
      startDate: new Date(),
      status: 'HELD',
      indication: 'Post-op Anastomotic Leak coverage',
      isStatOrder: false,
      pharmacyVerified: true,
    },
  });

  const norepinephrinePrx = await prisma.prescription.create({
    data: {
      patientId: rahulPatil.id,
      prescriberId: drSharma.id,
      medicationName: 'Norepinephrine Bitartrate (Levophed)',
      genericName: 'Norepinephrine',
      medicationClass: 'Vasopressor',
      dose: 8,
      unit: 'mcg/min',
      route: 'Central Line — Continuous IV',
      frequency: 'CONTINUOUS',
      startDate: new Date(),
      status: 'ACTIVE',
      indication: 'Septic Shock — titrate to MAP > 65mmHg',
      isStatOrder: false,
      isContinuous: true,
      infusionRate: '0.06 mcg/kg/min (Current: 6.5 mL/hr)',
      pharmacyVerified: true,
      formularyRef: 'VASOPRESSOR-PROTOCOL',
    },
  });

  const enoxaparinPrx = await prisma.prescription.create({
    data: {
      patientId: rahulPatil.id,
      prescriberId: drSharma.id,
      medicationName: 'Enoxaparin Sodium (Lovenox)',
      genericName: 'Enoxaparin',
      medicationClass: 'Low Molecular Weight Heparin',
      dose: 40,
      unit: 'mg (0.4 mL)',
      route: 'Subcutaneous (SC) — Daily',
      frequency: 'Q24H',
      startDate: new Date(),
      status: 'ACTIVE',
      indication: 'DVT Prophylaxis / Pulmonary Embolism Prevention',
      isStatOrder: false,
      pharmacyVerified: true,
    },
  });

  const ondansetronPrx = await prisma.prescription.create({
    data: {
      patientId: georgeMatthews.id,
      prescriberId: drSharma.id,
      medicationName: 'Ondansetron HCl (Zofran)',
      genericName: 'Ondansetron',
      medicationClass: 'Antiemetic',
      dose: 4,
      unit: 'mg',
      route: 'IV Push',
      frequency: 'PRN',
      startDate: new Date(),
      status: 'ACTIVE',
      indication: 'PRN Nausea/Vomiting — Nausea score ≥4 or emesis episode',
      isStatOrder: false,
      pharmacyVerified: true,
    },
  });

  console.log('✅ Prescriptions created');

  // ═══════════════ MEDICATION SCHEDULES ═══════════════
  // Paracetamol schedules (Q8H: 08:00, 16:00, 00:00)
  const para0800 = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: paracetamolPrx.id,
      patientId: rahulPatil.id,
      scheduledTime: todayAt(8, 0),
      status: 'GIVEN',
      administeredById: nursePriya.id,
      administeredAt: todayAt(8, 4),
      verificationMethod: 'BARCODE_SCAN',
      batchNumber: '#PCT-88421',
      dispensedFrom: 'Pharmacy Dispensed',
    },
  });

  const para1600 = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: paracetamolPrx.id,
      patientId: rahulPatil.id,
      scheduledTime: todayAt(14, 0),
      status: 'PENDING',
    },
  });

  const para2000 = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: paracetamolPrx.id,
      patientId: rahulPatil.id,
      scheduledTime: todayAt(20, 0),
      status: 'PENDING',
    },
  });

  // Ceftriaxone STAT schedule
  const ceftriaxoneSched = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: ceftriaxonePrx.id,
      patientId: rahulPatil.id,
      scheduledTime: todayAt(9, 0),
      status: 'PENDING',
      dispensedFrom: 'Central Pharmacy — Queue #2',
    },
  });

  // Pantoprazole schedule
  const panto0800 = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: pantoprazolePrx.id,
      patientId: rahulPatil.id,
      scheduledTime: todayAt(8, 12),
      status: 'GIVEN',
      administeredById: nursePriya.id,
      administeredAt: todayAt(8, 12),
      verificationMethod: 'BARCODE_SCAN',
    },
  });

  // Insulin schedule (BEDTIME)
  const insulinSched = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: insulinPrx.id,
      patientId: anitaDesai.id,
      scheduledTime: todayAt(20, 0),
      status: 'PENDING',
      dispensedFrom: 'Pyxis #2',
    },
  });

  // Pip/Taz DELAYED
  const pipTazSched = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: pipTazPrx.id,
      patientId: georgeMatthews.id,
      scheduledTime: todayAt(10, 25),
      status: 'DELAYED',
      delayReason: 'Patient dispatched to Radiology for emergency CT Abdomen. Held to prevent nephrotoxic synergy. Resume post-scan IV hydration.',
      delayMinutes: 35,
    },
  });

  // Pantoprazole tomorrow
  const pantoTomorrow = await prisma.medicationSchedule.create({
    data: {
      prescriptionId: pantoprazolePrx.id,
      patientId: rahulPatil.id,
      scheduledTime: daysFromNow(1),
      status: 'PENDING',
    },
  });

  console.log('✅ Medication schedules created');

  // ═══════════════ ADMINISTRATION RECORDS ═══════════════
  await prisma.administrationRecord.create({
    data: {
      scheduleId: para0800.id,
      patientId: rahulPatil.id,
      administeredById: nursePriya.id,
      dose: 1000,
      unit: 'mg',
      route: 'IV Infusion',
      notes: 'Vial reconstituted with 10mL Normal Saline. Patient tolerated well.',
      fiveRightsVerified: true,
      rightPatient: true,
      rightDrug: true,
      rightDose: true,
      rightRoute: true,
      rightTime: true,
      barcodeScanned: true,
      signedAt: todayAt(8, 4),
      safetyScore: 100,
      adminId: 'ADM-8841',
    },
  });

  await prisma.administrationRecord.create({
    data: {
      scheduleId: panto0800.id,
      patientId: rahulPatil.id,
      administeredById: nursePriya.id,
      dose: 40,
      unit: 'mg',
      route: 'IV Push',
      notes: 'Vial reconstituted with 10mL Normal Saline. Slow IVP over 2 minutes.',
      fiveRightsVerified: true,
      rightPatient: true,
      rightDrug: true,
      rightDose: true,
      rightRoute: true,
      rightTime: true,
      barcodeScanned: true,
      signedAt: todayAt(8, 12),
      safetyScore: 100,
    },
  });

  console.log('✅ Administration records created');

  // ═══════════════ SAFETY ALERTS ═══════════════
  await prisma.safetyAlert.create({
    data: {
      patientId: rahulPatil.id,
      prescriptionId: ceftriaxonePrx.id,
      alertType: 'ALLERGY_CONFLICT',
      severity: 'CRITICAL',
      message: 'SAFETY INTERCEPT: Cross-Reactivity Risk (Grade 3 Anaphylaxis)',
      detail: 'Patient Rahul Patil has a documented life-threatening allergy to Penicillin G (Laryngeal edema, ICU intubation required in 2021). Ceftriaxone shares a beta-lactam core structure with an estimated 5% to 8% cross-reactivity index.',
      isOverridden: true,
      overrideById: drSharma.id,
      overrideReason: 'Benefit outweighs acute risk; Bedside desensitization / Epinephrine at bedside confirmed',
      overriddenAt: new Date(),
      isResolved: true,
      resolvedAt: new Date(),
    },
  });

  await prisma.safetyAlert.create({
    data: {
      patientId: anitaDesai.id,
      prescriptionId: insulinPrx.id,
      alertType: 'HIGH_ALERT_MED',
      severity: 'WARNING',
      message: 'HIGH-ALERT MEDICATION: Insulin Glargine requires dual nurse verification',
      detail: 'Dual independent nurse dose verification and blood glucose entry (<180 mg/dL) mandatory prior to injection.',
      isOverridden: false,
      isResolved: false,
    },
  });

  console.log('✅ Safety alerts created');

  // ═══════════════ AUDIT LOGS ═══════════════
  const auditEntries = [
    { userId: nursePriya.id, patientId: rahulPatil.id, action: 'LOGIN_SUCCESS', resource: 'Auth', detail: 'Nurse Priya authenticated at COW-69-02', severity: 'Normal' },
    { userId: nursePriya.id, patientId: rahulPatil.id, action: 'MEDICATION_ADMINISTERED', resource: 'Administration', resourceId: 'ADM-8841', detail: 'Paracetamol 1000mg IV — 5-Rights: VERIFIED, Barcode: SCANNED', severity: 'Normal' },
    { userId: drSharma.id, patientId: rahulPatil.id, action: 'STAT_ORDER_CREATED', resource: 'Prescription', resourceId: ceftriaxonePrx.id, detail: 'STAT Ceftriaxone 1g IV ordered for Septic Shock', severity: 'STAT' },
    { userId: drSharma.id, patientId: rahulPatil.id, action: 'SAFETY_OVERRIDE', resource: 'SafetyAlert', detail: 'Penicillin/Cephalosporin cross-allergy overridden — Benefit outweighs acute risk', severity: 'STAT' },
    { userId: pharmDave.id, patientId: rahulPatil.id, action: 'PHARMACY_VERIFIED', resource: 'Prescription', detail: 'Ceftriaxone 1g IV verified — Queue #2', severity: 'Normal' },
    { userId: nursePriya.id, patientId: rahulPatil.id, action: 'MEDICATION_ADMINISTERED', resource: 'Administration', detail: 'Pantoprazole 40mg IV Push — 5-Rights: VERIFIED', severity: 'Normal' },
    { userId: nursePriya.id, patientId: georgeMatthews.id, action: 'SCHEDULE_HELD', resource: 'Schedule', resourceId: pipTazSched.id, detail: 'Pip/Taz held — patient in CT Angio', severity: 'Warning' },
    { userId: adminElena.id, action: 'SHIFT_START', resource: 'Shift', detail: 'Day shift 07:00 initiated — Ward 4B ICU', severity: 'Normal' },
  ];

  for (const entry of auditEntries) {
    const timestamp = new Date().toISOString();
    const hmacHash = hmac(JSON.stringify({ ...entry, timestamp }));
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        patientId: entry.patientId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        detail: entry.detail,
        ipAddress: '10.240.12.89',
        workstation: 'COW-ICU-084',
        hmacHash,
        severity: entry.severity || 'Normal',
      },
    });
  }

  console.log('✅ Audit logs created');

  // ═══════════════ NOTIFICATIONS ═══════════════
  await prisma.notification.create({
    data: {
      userId: nursePriya.id,
      patientId: rahulPatil.id,
      type: 'STAT_ORDER',
      message: 'STAT Order: Ceftriaxone 1g IV — Rahul Patil (ICU-12)',
      detail: 'Ordered 14m ago by Dr. Sharma. Awaiting central pharmacy verification.',
      isRead: false,
      priority: 'URGENT',
    },
  });

  await prisma.notification.create({
    data: {
      userId: nursePriya.id,
      patientId: anitaDesai.id,
      type: 'DUE_NOW',
      message: 'Medication Due: Insulin Glargine 14 Units SC — Anita Desai (ICU-14)',
      detail: 'High-alert medication. Co-sign required. Due at 20:00.',
      isRead: false,
      priority: 'HIGH',
    },
  });

  await prisma.notification.create({
    data: {
      userId: pharmDave.id,
      patientId: rahulPatil.id,
      type: 'PHARMACY_VERIFICATION',
      message: 'New STAT Order requires pharmacy verification',
      detail: 'Ceftriaxone Sodium 1g IV — Rahul Patil. Cross-allergy override documented.',
      isRead: true,
      priority: 'URGENT',
    },
  });

  await prisma.notification.create({
    data: {
      userId: drSharma.id,
      patientId: anitaDesai.id,
      type: 'CO_SIGN_REQUIRED',
      message: 'Co-sign Required: Insulin Glargine — Anita Desai',
      detail: 'High-alert medication order requires attending co-signature.',
      isRead: false,
      priority: 'HIGH',
    },
  });

  console.log('✅ Notifications created');

  console.log('\n🎉 SmartMedChart database seeded successfully!');
  console.log('\n📋 LOGIN CREDENTIALS (all users use password: SmartMed@2024)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('👨‍⚕️  Doctor:      sharma.md@metrohealth.org');
  console.log('👩‍⚕️  Doctor:      rchen.phd@metrohealth.org');
  console.log('👩‍⚕️  Nurse:       priya.rn@metrohealth.org');
  console.log('💊  Pharmacist:  dave.pharm@metrohealth.org');
  console.log('🔧  Admin:       elena.admin@metrohealth.org');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
