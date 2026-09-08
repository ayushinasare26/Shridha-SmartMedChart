export interface IndianPatientConfig {
  mrn: string;
  abhaId: string;
  name: string;
  avatar: string;
  age: number;
  gender: string;
  bloodGroup: string;
  ward: string;
  bed: string;
  admissionDate: string;
  stayDays: number;
  diagnosis: string;
  attending: string;
  location: string;
  dietPreference: string;
  insurance: { provider: string; policyNo: string; status: string };
  allergies: Array<{ allergen: string; severity: string; reaction: string; crossReacts?: string }>;
  vitals: {
    bp: string;
    hr: number;
    temp: string;
    spo2: string;
    rr: number;
    readings: Array<{ time: string; bp: string; hr: number; temp: string; spo2: string }>;
  };
  caregiver: { name: string; relation: string; phone: string; initials: string };
  medUpdate?: { title: string; med: string; desc: string; prev: string; curr: string; eff: string; reason: string };
  medications: Array<{
    id: string;
    name: string;
    saltName: string;
    subtitle: string;
    doseRoute: string;
    frequency: string;
    nextDose: string;
    timing: string;
    statusType: 'due' | 'upcoming' | 'given' | 'stopped';
    badgeColor: string;
    iconColor: string;
    category: 'current' | 'today' | 'recent' | 'stopped';
  }>;
  timeline: Array<{ time: string; medicine: string; dose: string; route: string; status: string; color: string; nurse: string }>;
  reports: Array<{ id: string; type: 'lab' | 'imaging'; name: string; date: string; status: string; doctor: string; findings: string; refRange: string }>;
  notifications: Array<{ title: string; desc: string; time: string; type: string }>;
  history: { admissions: string; surgeries: string; chronic: string; previousMeds: string; familyHistory: string; habits: string };
}

export const SHRIDHA_HOSPITAL_INFO = {
  name: 'Shridha Hospital & Research Institute',
  shortName: 'Shridha Hospital, Nagpur',
  address: 'Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Samarth Nagar East, Nagpur, Maharashtra 440015',
  landmark: 'Near Ajni Metro Station & Ajni Square',
  city: 'Nagpur, Maharashtra',
  pincode: '440015',
  phone: '0712-2420299 / 0712-2985296',
  mobile: '+91 93735 10580',
  emergency: '108 / 112',
  codeBlue: 'Ext. 4001',
  reception: '0712-2420299',
  email: 'info@shridhahospital.com',
  website: 'https://www.shridhahospital.com',
  accreditation: 'NABH Pre-Accredited & NABL Quality Certified Diagnostic Center',
  directors: [
    { name: 'Dr. Dinesh Sarda', degree: 'MS, MCh (Pediatric Surgery)', title: 'Medical Director & Chief Surgeon' },
    { name: 'Dr. Neha Sarda', degree: 'MD, DNB (Pathology)', title: 'Director & Head of Laboratory Services' },
  ],
  photo: '/shridha_hospital_nagpur.jpg',
  altPhoto: '/shridha_hospital.jpg',
};

export const INDIAN_PATIENTS: Record<string, IndianPatientConfig> = {
  '94021-08': {
    mrn: '94021-08',
    abhaId: '91-4412-8821-9043',
    name: 'Rahul Patil',
    avatar: '/rahul_patil.jpg',
    age: 45,
    gender: 'Male',
    bloodGroup: 'B+',
    ward: 'Ward 4B ICU',
    bed: '12',
    admissionDate: '02 Sep 2024',
    stayDays: 6,
    diagnosis: 'Septic shock secondary to RLE cellulitis',
    attending: 'Dr. Dinesh Sarda, MS, MCh (Medical Director / Chief Surgeon)',
    location: 'Dharampeth, Nagpur, Maharashtra',
    dietPreference: 'Vegetarian (High Protein / Low Salt)',
    insurance: { provider: 'Star Health & Allied Insurance', policyNo: 'SH-MUM-948102', status: 'Cashless Pre-Auth Approved (₹5,00,000)' },
    allergies: [
      {
        allergen: 'Penicillin & Beta-Lactams',
        severity: 'Anaphylaxis',
        reaction: 'Laryngeal edema, severe urticaria, ICU intubation required (2021)',
        crossReacts: 'Ampicillin, Amoxicillin, Piperacillin-Tazobactam',
      },
    ],
    vitals: {
      bp: '118/76',
      hr: 82,
      temp: '98.4',
      spo2: '97%',
      rr: 17,
      readings: [
        { time: '06:00 AM', bp: '118/76', hr: 78, temp: '98.2', spo2: '98%' },
        { time: '10:00 AM', bp: '120/80', hr: 84, temp: '98.6', spo2: '97%' },
        { time: '02:00 PM', bp: '116/74', hr: 80, temp: '98.4', spo2: '97%' },
        { time: '06:00 PM', bp: '118/76', hr: 82, temp: '98.4', spo2: '97%' },
      ],
    },
    caregiver: { name: 'Sunita Patil', relation: 'Spouse / Primary Proxy', phone: '+91 94123 45678', initials: 'SP' },
    medUpdate: {
      title: 'Medication Update',
      med: 'Ceftriaxone Sodium Injection IP',
      desc: 'Your doctor has changed the dose of Ceftriaxone.',
      prev: '2 g, Once Daily',
      curr: '1 g, Once Daily',
      eff: '08 Sep, 09:00 AM',
      reason: 'Adjusted by Dr. Dinesh Sarda following marked drop in Procalcitonin and improved renal clearance.',
    },
    medications: [
      { id: 'm1', name: 'Ceftriaxone', saltName: 'Ceftriaxone Sodium IP 1g', subtitle: 'Third-gen Cephalosporin Antibiotic', doseRoute: '1 g, IV Infusion', frequency: 'Once daily (Q24H)', nextDose: '09:00 AM', timing: 'Slow IV in 100mL Normal Saline', statusType: 'due', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', iconColor: 'bg-emerald-500 text-white', category: 'current' },
      { id: 'm2', name: 'Paracetamol', saltName: 'Paracetamol Infusion IP 1000mg/100mL', subtitle: 'Antipyretic & Analgesic', doseRoute: '1 g, IVPB', frequency: 'Every 6 hours (Q6H)', nextDose: '12:00 PM', timing: 'Post vitals check', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-blue-500 text-white', category: 'current' },
      { id: 'm3', name: 'Pantoprazole', saltName: 'Pantoprazole for Injection IP 40mg', subtitle: 'Proton Pump Inhibitor', doseRoute: '40 mg, IV Push', frequency: 'Once daily (Morning)', nextDose: '06:00 PM', timing: 'Empty stomach (Before meals)', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-amber-500 text-white', category: 'current' },
      { id: 'm4', name: 'Insulin Glargine', saltName: 'Recombinant Human Insulin Glargine IP', subtitle: 'Long-Acting Basal Insulin', doseRoute: '14 Units, SC', frequency: 'Nightly at Bedtime', nextDose: '10:00 PM', timing: 'Subcutaneous (Abdominal wall)', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-emerald-600 text-white', category: 'current' },
      { id: 'm5', name: 'Metformin', saltName: 'Metformin Hydrochloride Tablets IP 500mg', subtitle: 'Biguanide Anti-Diabetic', doseRoute: '500 mg, Oral', frequency: 'Twice daily', nextDose: '08:00 AM', timing: 'Immediately after food', statusType: 'given', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'bg-teal-600 text-white', category: 'recent' },
      { id: 'm6', name: 'Amoxicillin-Clavulanate', saltName: 'Amoxicillin & Potassium Clavulanate IP', subtitle: 'Broad-spectrum Penicillin (Discontinued)', doseRoute: '625 mg, Oral', frequency: 'TDS', nextDose: 'Discontinued', timing: 'Blocked due to allergy flag', statusType: 'stopped', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200', iconColor: 'bg-rose-500 text-white', category: 'stopped' },
    ],
    timeline: [
      { time: '08:00 AM', medicine: 'Metformin 500mg', dose: '500 mg', route: 'Oral', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '08:30 AM', medicine: 'Pantoprazole IV', dose: '40 mg', route: 'IV Push', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '09:00 AM', medicine: 'Ceftriaxone IV', dose: '1 g', route: 'IV Infusion', status: 'Due', color: 'amber', nurse: 'Nurse Priya, RN' },
      { time: '12:00 PM', medicine: 'Paracetamol IV', dose: '1 g', route: 'IVPB', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
      { time: '10:00 PM', medicine: 'Insulin Glargine', dose: '14 Units', route: 'SC', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
    ],
    reports: [
      { id: 'r1', type: 'lab', name: 'CBC (Complete Blood Count) with Differential', date: '08 Sep 2024', status: 'Completed', doctor: 'Dr. Neha Sarda, MD (Pathology)', findings: 'Total Leucocyte Count (TLC): 11,200/uL (improved from 16,400). Hemoglobin: 13.8 g/dL. Platelets: 1.94 Lakhs/uL. Neutrophils: 72%.', refRange: 'TLC: 4,000 - 11,000 /uL' },
      { id: 'r2', type: 'lab', name: 'Kidney Function Test (KFT / RFT)', date: '07 Sep 2024', status: 'Completed', doctor: 'Dr. Dinesh Sarda, MCh', findings: 'Serum Creatinine: 1.1 mg/dL, Blood Urea: 28 mg/dL, eGFR: 62 mL/min/1.73m². Electrolytes normal (Na+: 138, K+: 4.1).', refRange: 'Creatinine: 0.7 - 1.2 mg/dL' },
      { id: 'r3', type: 'lab', name: 'Blood Culture & Antibiotic Sensitivity (Automated BACTEC)', date: '07 Sep 2024', status: 'Pending', doctor: 'Pathology & Microbiology Dept', findings: 'Specimen under automated 48-hour incubation. No acute microbial growth at 24 hours. Final report expected tomorrow.', refRange: 'No growth after 48 hours' },
      { id: 'r4', type: 'imaging', name: 'Chest X-Ray Digital (AP Bedside View)', date: '06 Sep 2024', status: 'Completed', doctor: 'Radiology Dept, Shridha Hospital', findings: 'Bilateral lung parenchyma clear. No consolidation or pleural effusion. Cardiac shadow normal.', refRange: 'Normal study' },
    ],
    notifications: [
      { title: 'Medication dose updated', desc: 'Dr. Dinesh Sarda adjusted Ceftriaxone to 1g daily post KFT review', time: '08 Sep, 09:15 AM', type: 'med' },
      { title: 'Lab Report Ready', desc: 'NABL-accredited CBC with ESR report uploaded to chart', time: '08 Sep, 08:30 AM', type: 'lab' },
      { title: 'Doctor Round Completed', desc: 'Dr. Dinesh Sarda reviewed wound cellulitis margin; marked improvement', time: '08 Sep, 10:00 AM', type: 'doc' },
      { title: 'Attendant Pass Renewed', desc: 'Visitor pass for Sunita Patil active for Ward 4B ICU bedside', time: '07 Sep, 08:00 PM', type: 'info' },
    ],
    history: { admissions: '2 records (GMC Nagpur 2019, Kingsway Hospital 2021)', surgeries: '1 record (Emergency Appendectomy, 2018)', chronic: 'Type 2 Diabetes Mellitus (Diagnosed 2019)', previousMeds: '5 records (Metformin, Telmisartan, Rabeprazole)', familyHistory: 'Paternal Hypertension, Maternal Type 2 Diabetes', habits: 'Non-smoker, Non-alcoholic, Vegetarian' },
  },

  '94022-15': {
    mrn: '94022-15',
    abhaId: '91-6201-3319-8812',
    name: 'Anita Desai',
    avatar: '/anita_desai.jpg',
    age: 66,
    gender: 'Female',
    bloodGroup: 'A+',
    ward: 'Ward 4B ICU',
    bed: '14',
    admissionDate: '04 Sep 2024',
    stayDays: 4,
    diagnosis: 'Type 2 Diabetes with Hyperosmolar Hyperglycemic State (HHS)',
    attending: 'Dr. Neha Sarda, MD & Dr. Dinesh Sarda, MCh',
    location: 'Ramdaspeth, Nagpur, Maharashtra',
    dietPreference: 'Jain Diabetic Diet (Strictly No Root Veggies / Low Carb)',
    insurance: { provider: 'New India Assurance Co. (Govt)', policyNo: 'NIA-AHM-66219', status: 'Cashless TPA Approved (₹4,50,000)' },
    allergies: [
      {
        allergen: 'Sulfa Drugs / Sulfonamides',
        severity: 'Severe',
        reaction: 'Stevens-Johnson Syndrome, extensive mucosal blistering (2018)',
        crossReacts: 'Bactrim, Septran, Sulfamethoxazole, Glibenclamide',
      },
    ],
    vitals: {
      bp: '132/84',
      hr: 76,
      temp: '98.6',
      spo2: '98%',
      rr: 16,
      readings: [
        { time: '06:00 AM', bp: '136/86', hr: 74, temp: '98.4', spo2: '98%' },
        { time: '10:00 AM', bp: '132/84', hr: 76, temp: '98.6', spo2: '98%' },
        { time: '02:00 PM', bp: '130/82', hr: 78, temp: '98.6', spo2: '98%' },
        { time: '06:00 PM', bp: '132/84', hr: 76, temp: '98.6', spo2: '98%' },
      ],
    },
    caregiver: { name: 'Vikram Desai', relation: 'Son / Primary Attendant', phone: '+91 98234 11204', initials: 'VD' },
    medUpdate: {
      title: 'Insulin Titration Update',
      med: 'Insulin Glargine (Lantus)',
      desc: 'Blood sugars stabilized at 140 mg/dL; insulin dosage optimized.',
      prev: '18 Units at Bedtime',
      curr: '14 Units at Bedtime',
      eff: '08 Sep, 10:00 PM',
      reason: 'Reduced by Dr. Neha Sarda to prevent nocturnal hypoglycemia as patient oral intake restored.',
    },
    medications: [
      { id: 'm1', name: 'Insulin Glargine (Lantus)', saltName: 'Recombinant DNA Insulin Glargine IP 100 IU/mL', subtitle: 'Basal Long-acting Insulin', doseRoute: '14 Units, SC', frequency: 'Nightly at Bedtime', nextDose: '10:00 PM', timing: 'Subcutaneous abdominal injection', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-emerald-600 text-white', category: 'current' },
      { id: 'm2', name: 'Metformin ER', saltName: 'Metformin Hydrochloride Extended Release IP 500mg', subtitle: 'Oral Anti-hyperglycemic', doseRoute: '500 mg, Oral', frequency: 'Twice daily', nextDose: '08:00 AM', timing: 'With meals (Morning & Night)', statusType: 'given', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'bg-teal-600 text-white', category: 'recent' },
      { id: 'm3', name: 'Normal Saline (0.9% NaCl)', saltName: 'Sodium Chloride Infusion IP 0.9% w/v', subtitle: 'Intravenous Rehydration', doseRoute: '100 mL/hr, IV', frequency: 'Continuous', nextDose: 'Infusing Now', timing: 'Slow volumetric pump', statusType: 'due', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', iconColor: 'bg-blue-500 text-white', category: 'current' },
      { id: 'm4', name: 'Atorvastatin', saltName: 'Atorvastatin Calcium IP 20mg', subtitle: 'Statin / Lipid Regulator', doseRoute: '20 mg, Oral', frequency: 'Nightly', nextDose: '09:00 PM', timing: 'Post dinner', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-amber-500 text-white', category: 'current' },
      { id: 'm5', name: 'Septran (Co-trimoxazole)', saltName: 'Sulfamethoxazole & Trimethoprim IP', subtitle: 'Sulfa Antibiotic (Contraindicated)', doseRoute: '800/160 mg', frequency: 'BID', nextDose: 'Cancelled', timing: 'Allergy alert triggered', statusType: 'stopped', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200', iconColor: 'bg-rose-500 text-white', category: 'stopped' },
    ],
    timeline: [
      { time: '07:30 AM', medicine: 'Capillary Blood Glucose (CBG)', dose: '142 mg/dL', route: 'Accu-Chek Bedside', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '08:00 AM', medicine: 'Metformin ER 500mg', dose: '500 mg', route: 'Oral', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '10:00 AM', medicine: 'Normal Saline 500mL Bottle', dose: '500 mL', route: 'IV Infusion', status: 'Due', color: 'amber', nurse: 'Nurse Priya, RN' },
      { time: '09:00 PM', medicine: 'Atorvastatin 20mg', dose: '20 mg', route: 'Oral', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
      { time: '10:00 PM', medicine: 'Insulin Glargine 14U', dose: '14 Units', route: 'SC', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
    ],
    reports: [
      { id: 'r1', type: 'lab', name: 'HbA1c & Plasma Blood Sugar Profile', date: '08 Sep 2024', status: 'Completed', doctor: 'Dr. Neha Sarda, MD', findings: 'HbA1c: 9.4%, Fasting Blood Sugar: 138 mg/dL (normalized from 340 mg/dL upon admission). Serum Osmolality: 294 mOsm/kg.', refRange: 'FBS: 70 - 100 mg/dL' },
      { id: 'r2', type: 'lab', name: 'Serum Electrolytes (Na+, K+, Cl-)', date: '07 Sep 2024', status: 'Completed', doctor: 'Dr. Dinesh Sarda, MCh', findings: 'Potassium: 4.2 mEq/L (Normal), Sodium: 139 mEq/L, Chloride: 101 mEq/L. No metabolic acidosis.', refRange: 'K+: 3.5 - 5.0 mEq/L' },
      { id: 'r3', type: 'imaging', name: 'Renal & Pelvic Ultrasonography (USG)', date: '05 Sep 2024', status: 'Completed', doctor: 'Radiology Dept, Shridha Hospital', findings: 'Bilateral kidneys show normal cortico-medullary differentiation. No calculus or hydronephrosis.', refRange: 'Normal renal architecture' },
    ],
    notifications: [
      { title: 'Endocrinology Round Review', desc: 'Dr. Neha Sarda noted capillary sugar stabilized <150 mg/dL', time: '08 Sep, 11:00 AM', type: 'doc' },
      { title: 'Electrolyte Test Normal', desc: 'Serum potassium stable at 4.2 mEq/L post rehydration', time: '08 Sep, 08:15 AM', type: 'lab' },
      { title: 'Hospital Kitchen Order', desc: 'Jain Diabetic consistent-carbohydrate diet active for lunch', time: '08 Sep, 07:00 AM', type: 'info' },
    ],
    history: { admissions: '1 record (Orange City Hospital, Nagpur 2022)', surgeries: 'None', chronic: 'Type 2 Diabetes Mellitus (15 yrs), Hypertension (8 yrs)', previousMeds: '3 records (Glimepiride, Metformin, Telmisartan)', familyHistory: 'Strong maternal and sibling history of Diabetes', habits: 'Strict Vegetarian (Jain), Non-smoker' },
  },

  '94023-08': {
    mrn: '94023-08',
    abhaId: '91-7714-5509-2231',
    name: 'Rajesh Sharma',
    avatar: '/rajesh_sharma.jpg',
    age: 58,
    gender: 'Male',
    bloodGroup: 'O+',
    ward: 'Ward 4B ICU',
    bed: '08',
    admissionDate: '01 Sep 2024',
    stayDays: 7,
    diagnosis: 'Post-op Bowel Resection with Anastomotic Leak Monitoring',
    attending: 'Dr. Dinesh Sarda, MS, MCh (Chief Pediatric & General Surgeon)',
    location: 'Dhantoli, Nagpur, Maharashtra',
    dietPreference: 'NPO / Clear Liquid Diet Progression',
    insurance: { provider: 'HDFC ERGO General Insurance', policyNo: 'HE-JAI-102931', status: 'Cashless Empanelled (₹8,00,000)' },
    allergies: [
      {
        allergen: 'Codeine & Morphine Analogues',
        severity: 'Moderate',
        reaction: 'Severe projectile vomiting, dizziness, respiratory depression',
        crossReacts: 'Hydrocodone, Tramadol (high dose)',
      },
    ],
    vitals: {
      bp: '124/80',
      hr: 88,
      temp: '99.1',
      spo2: '96%',
      rr: 18,
      readings: [
        { time: '06:00 AM', bp: '126/82', hr: 86, temp: '98.8', spo2: '97%' },
        { time: '10:00 AM', bp: '124/80', hr: 88, temp: '99.1', spo2: '96%' },
        { time: '02:00 PM', bp: '122/78', hr: 84, temp: '98.9', spo2: '97%' },
        { time: '06:00 PM', bp: '124/80', hr: 88, temp: '99.1', spo2: '96%' },
      ],
    },
    caregiver: { name: 'Pooja Sharma', relation: 'Spouse', phone: '+91 98112 34567', initials: 'PS' },
    medUpdate: {
      title: 'Surgical Order Notification',
      med: 'Piperacillin/Tazobactam (Zosyn)',
      desc: 'Extended antibiotic infusion temporarily held pending surgical drain report.',
      prev: '4.5 g, Q8H IV',
      curr: 'Held',
      eff: '08 Sep, 08:00 AM',
      reason: 'Held by Dr. Dinesh Sarda to assess peritoneal drain fluid amylase and culture results.',
    },
    medications: [
      { id: 'm1', name: 'Ondansetron (Emeset)', saltName: 'Ondansetron Injection IP 2mg/mL', subtitle: 'Anti-emetic / Post-op Nausea', doseRoute: '4 mg, IV Push', frequency: 'PRN (Every 8h)', nextDose: '02:00 PM', timing: 'Slow IV push over 3 mins', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-emerald-500 text-white', category: 'current' },
      { id: 'm2', name: 'Enoxaparin (Clexane)', saltName: 'Enoxaparin Sodium Injection IP 40mg/0.4mL', subtitle: 'Low Molecular Weight Heparin', doseRoute: '40 mg, SC', frequency: 'Once daily', nextDose: '09:00 PM', timing: 'Subcutaneous abdominal wall', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-blue-500 text-white', category: 'current' },
      { id: 'm3', name: 'Paracetamol IV (Perfalgan)', saltName: 'Paracetamol Infusion IP 1000mg', subtitle: 'Non-opioid Pain Relief', doseRoute: '1000 mg, IVPB', frequency: 'Every 6 hours', nextDose: '01:00 PM', timing: 'Over 15 minutes', statusType: 'due', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', iconColor: 'bg-amber-500 text-white', category: 'current' },
      { id: 'm4', name: 'Piperacillin-Tazobactam', saltName: 'Piperacillin and Tazobactam for Injection IP 4.5g', subtitle: 'Broad-Spectrum Antibiotic', doseRoute: '4.5 g, IV', frequency: 'Q8H (Held)', nextDose: 'Temporarily Held', timing: 'Awaiting surgical clearance', statusType: 'stopped', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200', iconColor: 'bg-rose-500 text-white', category: 'stopped' },
    ],
    timeline: [
      { time: '07:00 AM', medicine: 'Paracetamol IVPB', dose: '1000 mg', route: 'IVPB', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '08:30 AM', medicine: 'Jackson-Pratt Drain Check', dose: 'Output 35mL', route: 'Abdominal Drain', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '01:00 PM', medicine: 'Paracetamol IVPB', dose: '1000 mg', route: 'IVPB', status: 'Due', color: 'amber', nurse: 'Nurse Priya, RN' },
      { time: '02:00 PM', medicine: 'Ondansetron IV', dose: '4 mg', route: 'IV Push', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
      { time: '09:00 PM', medicine: 'Enoxaparin (Clexane)', dose: '40 mg', route: 'SC', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
    ],
    reports: [
      { id: 'r1', type: 'imaging', name: 'Contrast-Enhanced Abdominal CECT', date: '07 Sep 2024', status: 'Completed', doctor: 'Radiology Dept, Shridha Hospital', findings: 'Surgical colonic anastomosis intact. Minimal residual serosanguinous collection in pouch of Douglas, reduced from 03 Sep scan.', refRange: 'Post-operative healing on track' },
      { id: 'r2', type: 'lab', name: 'Peritoneal Drain Fluid Amylase & Culture', date: '07 Sep 2024', status: 'Pending', doctor: 'Dr. Dinesh Sarda, MCh', findings: 'Drain fluid amylase: 42 IU/L (normal, no enteric leak). Bacterial culture preliminary 24h reading sterile.', refRange: 'Amylase < 100 IU/L' },
      { id: 'r3', type: 'lab', name: 'Liver & Renal Function Panel', date: '08 Sep 2024', status: 'Completed', doctor: 'Dr. Neha Sarda, MD', findings: 'Serum Albumin: 3.2 g/dL, Bilirubin: 0.9 mg/dL, SGPT: 34 U/L, SGOT: 28 U/L. Overall organ perfusion satisfactory.', refRange: 'Albumin: 3.5 - 5.0 g/dL' },
    ],
    notifications: [
      { title: 'Surgical Evaluation Complete', desc: 'Dr. Dinesh Sarda inspected abdominal suture line; healing well', time: '08 Sep, 08:30 AM', type: 'doc' },
      { title: 'Drain Output Favorable', desc: 'Total 24h serosanguineous drain output reduced to 35 mL', time: '08 Sep, 06:00 AM', type: 'info' },
    ],
    history: { admissions: '1 record (Alexis Hospital, Nagpur 2020)', surgeries: '2 records (Diagnostic Laparoscopy, Bowel Resection)', chronic: 'Mild Diverticulosis, Ischemic Heart Disease (Stented 2021)', previousMeds: '4 records (Aspirin, Atorvastatin, Pantocid)', familyHistory: 'Father CAD at age 62', habits: 'Vegetarian, Non-smoker' },
  },

  '94024-03': {
    mrn: '94024-03',
    abhaId: '91-5503-7721-6644',
    name: 'Meera Iyer',
    avatar: '/meera_iyer.jpg',
    age: 72,
    gender: 'Female',
    bloodGroup: 'AB+',
    ward: 'Ward 4B ICU',
    bed: '03',
    admissionDate: '05 Sep 2024',
    stayDays: 3,
    diagnosis: 'Acute COPD Exacerbation with Hypercapnic Respiratory Failure',
    attending: 'Dr. Dinesh Sarda, MCh & Dr. Neha Sarda, MD',
    location: 'Civil Lines, Nagpur, Maharashtra',
    dietPreference: 'Soft South Indian Vegetarian (Idli / Khichdi / Curd Rice)',
    insurance: { provider: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY) / PM-JAY', policyNo: 'MJPJAY-MH-990142', status: 'MJPJAY / PM-JAY Fully Subsidized Government Empanelled' },
    allergies: [], // NKDA
    vitals: {
      bp: '138/84',
      hr: 92,
      temp: '98.2',
      spo2: '93%',
      rr: 22,
      readings: [
        { time: '06:00 AM', bp: '142/88', hr: 94, temp: '98.0', spo2: '91%' },
        { time: '10:00 AM', bp: '138/84', hr: 92, temp: '98.2', spo2: '93%' },
        { time: '02:00 PM', bp: '136/82', hr: 90, temp: '98.2', spo2: '94%' },
        { time: '06:00 PM', bp: '138/84', hr: 92, temp: '98.2', spo2: '93%' },
      ],
    },
    caregiver: { name: 'Karthik Iyer', relation: 'Son / Power of Attorney', phone: '+91 98401 23456', initials: 'KI' },
    medUpdate: {
      title: 'Respiratory Order Update',
      med: 'Ipratropium + Levosalbutamol (Duolin Neb)',
      desc: 'Inhalation therapy frequency optimized for bronchospasm relief.',
      prev: 'Q6H Nebulization',
      curr: 'Q4H Nebulization',
      eff: '08 Sep, 07:00 AM',
      reason: 'Stepped up by Dr. Dinesh Sarda to relieve bilateral expiratory wheezing and reduce PaCO2.',
    },
    medications: [
      { id: 'm1', name: 'Duolin Respules', saltName: 'Levosalbutamol & Ipratropium Bromide Respules', subtitle: 'Bronchodilator Nebulization Solution', doseRoute: '2.5 mL, Inhalation', frequency: 'Q4H Scheduled', nextDose: '12:00 PM', timing: 'Via oxygen-driven nebulizer', statusType: 'due', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', iconColor: 'bg-emerald-500 text-white', category: 'current' },
      { id: 'm2', name: 'Methylprednisolone (Solu-Medrol)', saltName: 'Methylprednisolone Sodium Succinate IP 40mg', subtitle: 'Systemic Corticosteroid', doseRoute: '40 mg, IV Push', frequency: 'Q12H', nextDose: '06:00 PM', timing: 'Slow IV injection', statusType: 'upcoming', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconColor: 'bg-blue-500 text-white', category: 'current' },
      { id: 'm3', name: 'Azithromycin (Azithral)', saltName: 'Azithromycin for Injection IP 500mg', subtitle: 'Macrolide Antibiotic', doseRoute: '500 mg, IVPB', frequency: 'Once daily', nextDose: '09:00 AM', timing: 'Infuse over 1 hour in 250mL D5W', statusType: 'given', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'bg-teal-600 text-white', category: 'recent' },
      { id: 'm4', name: 'Furosemide (Lasix)', saltName: 'Furosemide Injection IP 20mg/2mL', subtitle: 'Loop Diuretic', doseRoute: '20 mg, IV Push', frequency: 'Once daily (Morning)', nextDose: '08:00 AM', timing: 'Monitor urine output', statusType: 'given', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'bg-amber-500 text-white', category: 'recent' },
    ],
    timeline: [
      { time: '08:00 AM', medicine: 'Duolin Nebulization', dose: '2.5 mL', route: 'Inhaled', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '08:30 AM', medicine: 'Azithromycin IV', dose: '500 mg', route: 'IVPB', status: 'Given', color: 'emerald', nurse: 'Nurse Priya, RN' },
      { time: '12:00 PM', medicine: 'Duolin Nebulization', dose: '2.5 mL', route: 'Inhaled', status: 'Due', color: 'amber', nurse: 'Nurse Priya, RN' },
      { time: '04:00 PM', medicine: 'Duolin Nebulization', dose: '2.5 mL', route: 'Inhaled', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
      { time: '06:00 PM', medicine: 'Solu-Medrol IV', dose: '40 mg', route: 'IV Push', status: 'Upcoming', color: 'blue', nurse: 'Nurse Priya, RN' },
    ],
    reports: [
      { id: 'r1', type: 'lab', name: 'Arterial Blood Gas (ABG Analysis)', date: '08 Sep 2024', status: 'Completed', doctor: 'Dr. Neha Sarda, MD', findings: 'pH: 7.37 (improved), PaCO2: 48 mmHg (down from 58), PaO2: 74 mmHg on 2 LPM O2, HCO3: 28 mEq/L. Compensated respiratory acidosis.', refRange: 'PaCO2: 35 - 45 mmHg' },
      { id: 'r2', type: 'imaging', name: 'Portable Digital Chest X-Ray', date: '06 Sep 2024', status: 'Completed', doctor: 'Radiology Dept, Shridha Hospital', findings: 'Bilateral hyperinflated lung fields, low flat diaphragms, consistent with chronic emphysematous changes. No pneumothorax.', refRange: 'COPD baseline appearance' },
      { id: 'r3', type: 'lab', name: 'Sputum Gram Stain & Acid Fast Bacilli (AFB)', date: '07 Sep 2024', status: 'Completed', doctor: 'Dr. Neha Sarda, MD', findings: 'AFB Smears (2 consecutive samples): Negative for Mycobacterium tuberculosis. Moderate polymorphs present.', refRange: 'AFB Negative' },
    ],
    notifications: [
      { title: 'Pulmonary Care Review', desc: 'Physiotherapist assisted with incentive spirometry (600cc target reached)', time: '08 Sep, 09:30 AM', type: 'doc' },
      { title: 'ABG Improvement', desc: 'PaCO2 dropped to 48 mmHg on 2 LPM nasal cannula', time: '08 Sep, 07:30 AM', type: 'lab' },
    ],
    history: { admissions: '4 records (AIIMS Nagpur 2021, Wockhardt Nagpur 2023)', surgeries: '1 record (Bilateral Cataract IOL 2017)', chronic: 'Severe Chronic Bronchial Asthma / COPD, Osteoporosis, Cor Pulmonale', previousMeds: '6 records (Seretide 250 Inhaler, Deriphyllin, Shelcal-500)', familyHistory: 'Non-contributory', habits: 'Strict South Indian Vegetarian, Non-smoker' },
  },
};

export function getIndianPatient(idOrMrn: string): IndianPatientConfig | null {
  if (!idOrMrn) return null;
  const clean = idOrMrn.trim();
  if (INDIAN_PATIENTS[clean]) return INDIAN_PATIENTS[clean];

  // Try finding by name or loose match
  const found = Object.values(INDIAN_PATIENTS).find(p =>
    p.mrn.toLowerCase() === clean.toLowerCase() ||
    p.abhaId.toLowerCase() === clean.toLowerCase() ||
    p.name.toLowerCase().includes(clean.toLowerCase())
  );
  return found || null;
}
