import React, { useState } from 'react';
import {
  UserPlus,
  Stethoscope,
  QrCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
  Phone,
  FileText,
  BedDouble,
  Building2,
} from 'lucide-react';
import { Patient, Doctor, TriagePriority, BloodGroup, ShiftType, ShiftAssistantDoctor } from '../types';
import { generateMRN, generateToken, generateCaseFileId } from '../data/mockHospitalData';
import { buildPatientQRPayload } from '../utils/qrHelper';
import {
  HOSPITAL_WARDS,
  SHIFT_ASSISTANT_DOCTOR_ROSTER,
  SHIFT_TIMINGS,
  getCurrentActiveShift,
  getDefaultShiftAssistantDoctors,
} from '../data/wardAndShiftData';

interface AddPatientCardProps {
  doctors: Doctor[];
  existingPatients: Patient[];
  onPatientAdded: (newPatient: Patient) => void;
  onOpenQRModal: (patient: Patient) => void;
  defaultAdmitToWard?: boolean;
}

const COMMON_CHIEF_COMPLAINTS = [
  { label: 'Fever & Body Ache', dept: 'General Medicine', priority: 'Routine' as TriagePriority },
  { label: 'Chest Discomfort / Palpitations', dept: 'Cardiology', priority: 'Priority' as TriagePriority },
  { label: 'Joint Pain / Fracture', dept: 'Orthopedics', priority: 'Routine' as TriagePriority },
  { label: 'Severe Cough & Wheezing', dept: 'Pulmonology', priority: 'Priority' as TriagePriority },
  { label: 'Child Fever / Vomiting', dept: 'Pediatrics', priority: 'Priority' as TriagePriority },
  { label: 'Headache & Dizziness', dept: 'Neurology', priority: 'Routine' as TriagePriority },
  { label: 'Emergency Trauma / STAT', dept: 'Emergency Triage', priority: 'STAT Urgent' as TriagePriority },
];

export const AddPatientCard: React.FC<AddPatientCardProps> = ({
  doctors,
  existingPatients,
  onPatientAdded,
  onOpenQRModal,
  defaultAdmitToWard = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>(28);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [triagePriority, setTriagePriority] = useState<TriagePriority>('Routine');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Hospital Admission / IPD States
  const [isAdmitToWard, setIsAdmitToWard] = useState(defaultAdmitToWard);

  React.useEffect(() => {
    setIsAdmitToWard(defaultAdmitToWard);
  }, [defaultAdmitToWard]);

  const [admissionWardId, setAdmissionWardId] = useState('ward-3-gm');
  const [admissionBed, setAdmissionBed] = useState('GM-01');
  const [shiftDoctors, setShiftDoctors] = useState<ShiftAssistantDoctor[]>(() => getDefaultShiftAssistantDoctors());
  const [admissionNotes, setAdmissionNotes] = useState('');
  const currentActiveShift = getCurrentActiveShift();

  // Auto-suggest Doctor based on Chief Complaint
  const suggestedDoctor = React.useMemo(() => {
    const text = chiefComplaint.toLowerCase();
    if (text.includes('chest') || text.includes('heart') || text.includes('palpitation') || text.includes('angina')) {
      return doctors.find((d) => d.department === 'Cardiology') || doctors[0];
    }
    if (text.includes('bone') || text.includes('joint') || text.includes('fracture') || text.includes('knee') || text.includes('sprain')) {
      return doctors.find((d) => d.department === 'Orthopedics') || doctors[0];
    }
    if (text.includes('child') || text.includes('baby') || text.includes('pediatric') || (typeof age === 'number' && age < 13)) {
      return doctors.find((d) => d.department === 'Pediatrics') || doctors[0];
    }
    if (text.includes('cough') || text.includes('breath') || text.includes('asthma') || text.includes('wheez') || text.includes('chest cold')) {
      return doctors.find((d) => d.department === 'Pulmonology') || doctors[0];
    }
    if (text.includes('headache') || text.includes('migraine') || text.includes('seizure') || text.includes('dizziness') || text.includes('numbness')) {
      return doctors.find((d) => d.department === 'Neurology') || doctors[0];
    }
    if (text.includes('stat') || text.includes('emergency') || text.includes('unconscious') || text.includes('severe bleeding') || triagePriority === 'STAT Urgent') {
      return doctors.find((d) => d.department === 'Emergency Triage') || doctors[0];
    }
    return doctors.find((d) => d.department === 'General Medicine') || doctors[0];
  }, [chiefComplaint, age, triagePriority, doctors]);

  const handleApplyComplaintChip = (chip: { label: string; dept: string; priority: TriagePriority }) => {
    setChiefComplaint(chip.label);
    setTriagePriority(chip.priority);
    const matchingDoc = doctors.find((d) => d.department === chip.dept);
    if (matchingDoc) {
      setSelectedDoctorId(matchingDoc.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter patient full name.');
      return;
    }
    if (!age || age <= 0 || age > 125) {
      setErrorMsg('Please enter a valid patient age.');
      return;
    }
    if (!contactNumber.trim()) {
      setErrorMsg('Please enter patient contact number.');
      return;
    }

    const assignedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
    if (!assignedDoctor) {
      setErrorMsg('Please select a doctor to allot.');
      return;
    }

    setErrorMsg('');

    const newMRN = generateMRN(existingPatients);
    const newToken = generateToken(assignedDoctor.department, existingPatients);
    const newCaseFileId = generateCaseFileId();
    const nowIso = new Date().toISOString();

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      mrn: newMRN,
      tokenNumber: newToken,
      fullName: fullName.trim(),
      age: Number(age),
      gender,
      dateOfBirth: new Date(new Date().getFullYear() - Number(age), 0, 1).toISOString().slice(0, 10),
      contactNumber: contactNumber.trim(),
      address: address.trim() || 'Local City Area',
      emergencyContact: {
        name: emergencyName.trim() || 'Next of Kin',
        relationship: 'Primary Guardian',
        phone: emergencyPhone.trim() || contactNumber.trim(),
      },
      nationalIdOrInsurance: 'Govt Health ID / Ayushman',
      registrationDate: nowIso,
      receptionistName: 'Receptionist Desk #01',
      caseFile: {
        id: newCaseFileId,
        patientId: `pat-${Date.now()}`,
        createdAt: nowIso,
        updatedAt: nowIso,
        triagePriority,
        currentStatus: 'Waiting in Queue',
        assignedDoctorId: assignedDoctor.id,
        assignedDoctorName: assignedDoctor.name,
        department: assignedDoctor.department,
        roomNumber: assignedDoctor.roomNumber,
        tokenNumber: newToken,
        initialVitals: {
          bpSystolic: 120,
          bpDiastolic: 80,
          heartRate: 72,
          spO2: 98,
          temperature: 98.6,
          weightKg: 65,
          heightCm: 170,
          bmi: 22.5,
          respiratoryRate: 16,
        },
        medicalInfo: {
          bloodGroup,
          allergies: ['NKDA (No Known Drug Allergies)'],
          chronicConditions: [],
          currentMedications: [],
          chiefComplaint: chiefComplaint.trim() || 'General OPD consultation and checkup',
          symptomsDuration: 'Today',
          isNPO: false,
          receptionistObservations: `Registered at front desk. Allotted to ${assignedDoctor.name} in ${assignedDoctor.roomNumber}. Vitals to be checked by physician.`,
        },
        consultationHistory: [],
        registeredByStaff: 'Front Desk Receptionist',
      },
    };

    if (isAdmitToWard) {
      const selectedWard = HOSPITAL_WARDS.find((w) => w.id === admissionWardId) || HOSPITAL_WARDS[2];
      newPatient.admission = {
        isAdmitted: true,
        admissionDate: nowIso,
        wardNumber: selectedWard.name,
        bedNumber: admissionBed,
        admittingDoctorName: assignedDoctor.name,
        shiftAssistantDoctors: shiftDoctors,
        admissionNotes: admissionNotes.trim() || undefined,
      };
      newPatient.caseFile.currentStatus = 'Admitted (IPD)';
    }

    newPatient.qrPayload = buildPatientQRPayload(newPatient);

    // Call callback to add patient & update doctors
    onPatientAdded(newPatient);

    // Clear form
    setFullName('');
    setAge(28);
    setContactNumber('');
    setAddress('');
    setEmergencyName('');
    setEmergencyPhone('');
    setChiefComplaint('');
    setTriagePriority('Routine');
    setIsAdmitToWard(false);
    setAdmissionNotes('');

    setSuccessMsg(
      isAdmitToWard
        ? `Patient ${newPatient.fullName} registered & ADMITTED to ${newPatient.admission?.wardNumber} (${newPatient.admission?.bedNumber}) with Shift Assistant Doctors!`
        : `Patient ${newPatient.fullName} registered with Token ${newPatient.tokenNumber}! Case File & Scannable QR generated.`
    );
    setTimeout(() => setSuccessMsg(''), 5000);

    // Directly open the generated QR modal
    onOpenQRModal(newPatient);
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Station Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1d4ed8]">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Add New Patient & Intake Station
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#1d4ed8] border border-blue-200">
                Main Reception Action
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter patient details, allot attending doctor, generate instant scannable QR token & case file
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-[#1d4ed8]" />
          <span>Average intake: &lt; 45 secs</span>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Error / Success feedback */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Section 1: Patient Demographics */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#1d4ed8]" />
            1. Patient Demographics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh K. Verma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={120}
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs font-mono"
              >
                <option value="O+">O+ (Common)</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Relative / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Priya (Spouse)"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98000 00000"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Reason for Visit & Smart Doctor Allotment */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#1d4ed8]" />
              2. Reason for Visit & Doctor Allotment
            </h3>
            <span className="text-[11px] text-slate-500">
              Select or type complaint to auto-suggest attending physician
            </span>
          </div>

          {/* Quick Complaint Selection Chips */}
          <div className="mb-3 space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-500">
              Quick Select Common Complaints:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CHIEF_COMPLAINTS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyComplaintChip(chip)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium cursor-pointer ${
                    chiefComplaint === chip.label
                      ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chief Complaint / Reason for Hospital Visit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute chest discomfort and shortness of breath since morning"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Triage Priority
              </label>
              <select
                value={triagePriority}
                onChange={(e) => setTriagePriority(e.target.value as TriagePriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:bg-white transition-all shadow-2xs font-semibold"
              >
                <option value="Routine">Routine OPD</option>
                <option value="Priority">Priority OPD</option>
                <option value="Urgent">Urgent Assessment</option>
                <option value="STAT Urgent">STAT Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* ALLOT DOCTOR (Directly in this form) */}
          <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-[#1d4ed8]" />
                Allot Attending Doctor <span className="text-rose-500">*</span>
              </label>

              {/* Recommendation pill */}
              {suggestedDoctor && (
                <button
                  type="button"
                  onClick={() => setSelectedDoctorId(suggestedDoctor.id)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1d4ed8] bg-white border border-blue-200 px-2.5 py-1 rounded-md shadow-2xs hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1d4ed8]" />
                  <span>
                    Suggested for this complaint: <strong>{suggestedDoctor.name}</strong> ({suggestedDoctor.department})
                  </span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] shadow-2xs"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.department} ({doc.roomNumber}) [Queue: {doc.currentQueueCount} pts]
                    </option>
                  ))}
                </select>
              </div>

              {selectedDoctor && (
                <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{selectedDoctor.name}</span>
                    <p className="text-[11px] text-slate-500">
                      {selectedDoctor.department} • <strong className="text-[#1d4ed8]">{selectedDoctor.roomNumber}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                    {selectedDoctor.currentQueueCount} in Queue
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Direct Inpatient (IPD) Ward & Bed Admission Section */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAdmitToWard}
                  onChange={(e) => setIsAdmitToWard(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1d4ed8] focus:ring-[#1d4ed8] border-slate-300"
                />
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#1d4ed8]" />
                  <span className="text-xs font-bold text-slate-900">
                    Admit Patient to Hospital Ward (IPD Allotment)
                  </span>
                </div>
              </label>

              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isAdmitToWard ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {isAdmitToWard ? 'Inpatient (IPD) Mode Active' : 'Outpatient (OPD)'}
              </span>
            </div>

            {isAdmitToWard && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ward Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#1d4ed8]" />
                      <span>1. Hospital Ward Number & Floor</span>
                    </label>
                    <select
                      value={admissionWardId}
                      onChange={(e) => {
                        setAdmissionWardId(e.target.value);
                        const ward = HOSPITAL_WARDS.find((w) => w.id === e.target.value);
                        if (ward && !ward.beds.includes(admissionBed)) {
                          setAdmissionBed(ward.beds[0] || 'BED-01');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] shadow-2xs"
                    >
                      {HOSPITAL_WARDS.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — {w.floor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bed Allotment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-[#1d4ed8]" />
                      <span>2. Allot Bed Number</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={admissionBed}
                        onChange={(e) => setAdmissionBed(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] shadow-2xs"
                      >
                        {(HOSPITAL_WARDS.find((w) => w.id === admissionWardId)?.beds || ['GM-01']).map((b) => (
                          <option key={b} value={b}>
                            {b} (Vacant)
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Custom Bed"
                        value={admissionBed}
                        onChange={(e) => setAdmissionBed(e.target.value.toUpperCase())}
                        className="w-28 px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Shifting Time-Wise Assistant Doctor Roster */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#1d4ed8]" />
                      <span>3. Shifting Time-Wise Assistant Doctor Schedule</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>Current Active Shift:</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 text-[10px]">
                        {currentActiveShift} Shift
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Round-the-clock shift-wise resident & assistant medical officers assigned to this admitted bed:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['Morning', 'Evening', 'Night'] as ShiftType[]).map((shift) => {
                      const doc = shiftDoctors.find((s) => s.shift === shift);
                      const isCurrent = currentActiveShift === shift;
                      const roster = SHIFT_ASSISTANT_DOCTOR_ROSTER[shift];

                      return (
                        <div
                          key={shift}
                          className={`p-2.5 rounded-lg border text-xs ${
                            isCurrent
                              ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">{shift} Shift</span>
                            {isCurrent && (
                              <span className="text-[9px] font-black text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                                ACTIVE NOW
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 block mb-1.5">
                            {SHIFT_TIMINGS[shift]}
                          </span>

                          <select
                            value={doc?.assistantDoctorId || ''}
                            onChange={(e) => {
                              const chosen = roster.find((r) => r.id === e.target.value);
                              if (chosen) {
                                setShiftDoctors((prev) =>
                                   prev.map((item) =>
                                    item.shift === shift
                                      ? {
                                          ...item,
                                          assistantDoctorName: chosen.name,
                                          assistantDoctorId: chosen.id,
                                          contactNumber: chosen.contact,
                                          designation: chosen.designation,
                                        }
                                      : item
                                  )
                                );
                              }
                            }}
                            className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded font-semibold text-slate-800 mb-1.5"
                          >
                            {roster.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono truncate" title={doc?.contactNumber}>
                            <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{doc?.contactNumber || 'Duty Intercom'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Admission Notes */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Admission Notes / Special Ward Care Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={admissionNotes}
                    onChange={(e) => setAdmissionNotes(e.target.value)}
                    placeholder="e.g. Oxygen support required, continuous telemetry, bed rest..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Note: Vitals are checked by Doctor */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#1d4ed8] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-slate-800">Clinical Protocol:</strong> First vitals (Blood Pressure, SpO2, Heart Rate, Temperature, and BMI) are verified and logged directly by the physician during OPD consultation, not by the receptionist at registration.
          </div>
        </div>

        {/* Actions bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Clicking will create simplified case file, allocate room token, and generate scannable QR pass.
          </span>

          <button
            type="submit"
            id="register-patient-and-generate-qr-btn"
            className="flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            {isAdmitToWard ? (
              <>
                <BedDouble className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Enroll Patient, Admit to Ward &amp; Generate QR Pass</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Enroll Patient, Allot Doctor &amp; Generate QR Pass</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
