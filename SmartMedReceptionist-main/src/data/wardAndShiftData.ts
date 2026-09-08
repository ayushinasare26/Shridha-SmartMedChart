import { ShiftType, ShiftAssistantDoctor } from '../types';

export interface WardInfo {
  id: string;
  name: string;
  shortName: string;
  floor: string;
  department: string;
  beds: string[];
}

export const HOSPITAL_WARDS: WardInfo[] = [
  {
    id: 'ward-1-icu',
    name: 'Ward 1 - ICU & Critical Care Unit',
    shortName: 'Ward 1 (ICU)',
    floor: '1st Floor - Critical Wing',
    department: 'Emergency / Critical Care',
    beds: ['ICU-01', 'ICU-02', 'ICU-03', 'ICU-04', 'ICU-05', 'ICU-06'],
  },
  {
    id: 'ward-2-ccu',
    name: 'Ward 2 - Cardiac Care Unit (CCU)',
    shortName: 'Ward 2 (CCU)',
    floor: '2nd Floor - Cardiology Wing',
    department: 'Cardiology',
    beds: ['CCU-01', 'CCU-02', 'CCU-03', 'CCU-04', 'CCU-05'],
  },
  {
    id: 'ward-3-gm',
    name: 'Ward 3 - General Medical Ward (Male)',
    shortName: 'Ward 3 (GM-M)',
    floor: '3rd Floor - Medical Wing A',
    department: 'General Medicine',
    beds: ['GM-01', 'GM-02', 'GM-03', 'GM-04', 'GM-05', 'GM-06', 'GM-07', 'GM-08'],
  },
  {
    id: 'ward-4-gf',
    name: 'Ward 4 - General Medical Ward (Female)',
    shortName: 'Ward 4 (GM-F)',
    floor: '3rd Floor - Medical Wing B',
    department: 'General Medicine',
    beds: ['GF-01', 'GF-02', 'GF-03', 'GF-04', 'GF-05', 'GF-06', 'GF-07', 'GF-08'],
  },
  {
    id: 'ward-5-sp',
    name: 'Ward 5 - Surgical Post-Op & Ortho Ward',
    shortName: 'Ward 5 (Surg)',
    floor: '4th Floor - Surgical Wing',
    department: 'Orthopedics / Surgery',
    beds: ['SP-01', 'SP-02', 'SP-03', 'SP-04', 'SP-05', 'SP-06'],
  },
  {
    id: 'ward-6-ped',
    name: 'Ward 6 - Pediatric Care Ward',
    shortName: 'Ward 6 (Peds)',
    floor: '2nd Floor - Mother & Child Wing',
    department: 'Pediatrics',
    beds: ['PED-01', 'PED-02', 'PED-03', 'PED-04', 'PED-05', 'PED-06'],
  },
  {
    id: 'ward-7-resp',
    name: 'Ward 7 - Pulmonology & Respiratory Care',
    shortName: 'Ward 7 (Resp)',
    floor: '5th Floor - Respiratory Unit',
    department: 'Pulmonology',
    beds: ['RESP-01', 'RESP-02', 'RESP-03', 'RESP-04', 'RESP-05'],
  },
];

export interface ShiftRosterDoctor {
  id: string;
  name: string;
  designation: string;
  contact: string;
  shift: ShiftType;
}

export const SHIFT_ASSISTANT_DOCTOR_ROSTER: Record<ShiftType, ShiftRosterDoctor[]> = {
  Morning: [
    {
      id: 'asst-m-1',
      name: 'Dr. Rohan Kapoor',
      designation: 'Senior Resident (RMO)',
      contact: 'Ext: 401 (+91 98111 22331)',
      shift: 'Morning',
    },
    {
      id: 'asst-m-2',
      name: 'Dr. Sneha Rao',
      designation: 'Resident Physician (Internal Med)',
      contact: 'Ext: 402 (+91 98111 22332)',
      shift: 'Morning',
    },
    {
      id: 'asst-m-3',
      name: 'Dr. Aditya Roy',
      designation: 'Clinical Ward Associate',
      contact: 'Ext: 403 (+91 98111 22333)',
      shift: 'Morning',
    },
  ],
  Evening: [
    {
      id: 'asst-e-1',
      name: 'Dr. Vikas Gupta',
      designation: 'Assistant Surgeon & Duty MO',
      contact: 'Ext: 411 (+91 98222 33441)',
      shift: 'Evening',
    },
    {
      id: 'asst-e-2',
      name: 'Dr. Aarti Deshmukh',
      designation: 'Resident Medical Officer',
      contact: 'Ext: 412 (+91 98222 33442)',
      shift: 'Evening',
    },
    {
      id: 'asst-e-3',
      name: 'Dr. Neha Kulkarni',
      designation: 'Critical Care Associate',
      contact: 'Ext: 413 (+91 98222 33443)',
      shift: 'Evening',
    },
  ],
  Night: [
    {
      id: 'asst-n-1',
      name: 'Dr. Tanmay Sen',
      designation: 'Chief Night Duty Officer (NDMO)',
      contact: 'Ext: 421 (+91 98333 44551)',
      shift: 'Night',
    },
    {
      id: 'asst-n-2',
      name: 'Dr. Farhan Ali',
      designation: 'Emergency Care Resident',
      contact: 'Ext: 422 (+91 98333 44552)',
      shift: 'Night',
    },
    {
      id: 'asst-n-3',
      name: 'Dr. Meera Nambiar',
      designation: 'Night On-Call Registrar',
      contact: 'Ext: 423 (+91 98333 44553)',
      shift: 'Night',
    },
  ],
};

export const SHIFT_TIMINGS: Record<ShiftType, string> = {
  Morning: '08:00 AM – 04:00 PM',
  Evening: '04:00 PM – 12:00 AM',
  Night: '12:00 AM – 08:00 AM',
};

export function getCurrentActiveShift(): ShiftType {
  const currentHour = new Date().getHours();
  if (currentHour >= 8 && currentHour < 16) {
    return 'Morning';
  } else if (currentHour >= 16 && currentHour < 24) {
    return 'Evening';
  } else {
    return 'Night';
  }
}

export function getDefaultShiftAssistantDoctors(): ShiftAssistantDoctor[] {
  return [
    {
      shift: 'Morning',
      shiftTiming: SHIFT_TIMINGS.Morning,
      assistantDoctorName: SHIFT_ASSISTANT_DOCTOR_ROSTER.Morning[0].name,
      assistantDoctorId: SHIFT_ASSISTANT_DOCTOR_ROSTER.Morning[0].id,
      contactNumber: SHIFT_ASSISTANT_DOCTOR_ROSTER.Morning[0].contact,
      designation: SHIFT_ASSISTANT_DOCTOR_ROSTER.Morning[0].designation,
    },
    {
      shift: 'Evening',
      shiftTiming: SHIFT_TIMINGS.Evening,
      assistantDoctorName: SHIFT_ASSISTANT_DOCTOR_ROSTER.Evening[0].name,
      assistantDoctorId: SHIFT_ASSISTANT_DOCTOR_ROSTER.Evening[0].id,
      contactNumber: SHIFT_ASSISTANT_DOCTOR_ROSTER.Evening[0].contact,
      designation: SHIFT_ASSISTANT_DOCTOR_ROSTER.Evening[0].designation,
    },
    {
      shift: 'Night',
      shiftTiming: SHIFT_TIMINGS.Night,
      assistantDoctorName: SHIFT_ASSISTANT_DOCTOR_ROSTER.Night[0].name,
      assistantDoctorId: SHIFT_ASSISTANT_DOCTOR_ROSTER.Night[0].id,
      contactNumber: SHIFT_ASSISTANT_DOCTOR_ROSTER.Night[0].contact,
      designation: SHIFT_ASSISTANT_DOCTOR_ROSTER.Night[0].designation,
    },
  ];
}
