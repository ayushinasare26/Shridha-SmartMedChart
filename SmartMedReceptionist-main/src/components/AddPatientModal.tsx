import React, { useState } from 'react';
import {
  X,
  UserPlus,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  QrCode,
  FileText,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Patient,
  Doctor,
  BloodGroup,
  TriagePriority,
  DoctorDepartment,
  VitalSigns,
  BasicMedicalInfo,
} from '../types';
import { generateMRN, generateToken, generateCaseFileId } from '../data/mockHospitalData';
import { buildPatientQRPayload } from '../utils/qrHelper';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (newPatient: Patient) => void;
  doctors: Doctor[];
  existingPatients: Patient[];
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded,
  doctors,
  existingPatients,
}) => {
  if (!isOpen) return null;

  // Active form section tab: 'demographics' | 'medical' | 'allotment'
  const [activeTab, setActiveTab] = useState<'demographics' | 'medical' | 'allotment'>('demographics');

  // Demographics state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>(32);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('1994-05-18');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [insuranceId, setInsuranceId] = useState('');

  // Medical Information state
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [bpSystolic, setBpSystolic] = useState<number | ''>(120);
  const [bpDiastolic, setBpDiastolic] = useState<number | ''>(80);
  const [heartRate, setHeartRate] = useState<number | ''>(76);
  const [spO2, setSpO2] = useState<number | ''>(98);
  const [temperature, setTemperature] = useState<number | ''>(98.6);
  const [weightKg, setWeightKg] = useState<number | ''>(70);
  const [heightCm, setHeightCm] = useState<number | ''>(172);
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>(18);

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomsDuration, setSymptomsDuration] = useState('2 days');
  const [isNPO, setIsNPO] = useState(false);
  const [triagePriority, setTriagePriority] = useState<TriagePriority>('Routine');
  const [allergyInput, setAllergyInput] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [chronicInput, setChronicInput] = useState('');
  const [selectedChronic, setSelectedChronic] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState('');
  const [highRiskAlert, setHighRiskAlert] = useState('');
  const [receptionistObservations, setReceptionistObservations] = useState('');

  // Doctor allotment
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');

  // Calculate BMI
  const bmi = React.useMemo(() => {
    if (typeof weightKg === 'number' && typeof heightCm === 'number' && heightCm > 0) {
      const heightMeters = heightCm / 100;
      return +(weightKg / (heightMeters * heightMeters)).toFixed(1);
    }
    return 22.5;
  }, [weightKg, heightCm]);

  // Intelligent Doctor Recommendation based on Chief Complaint
  const suggestedDoctor = React.useMemo(() => {
    const text = chiefComplaint.toLowerCase();
    if (text.includes('chest') || text.includes('heart') || text.includes('angina') || text.includes('palpitation')) {
      return doctors.find((d) => d.department === 'Cardiology') || doctors[0];
    }
    if (text.includes('bone') || text.includes('joint') || text.includes('fracture') || text.includes('knee') || text.includes('back pain')) {
      return doctors.find((d) => d.department === 'Orthopedics') || doctors[0];
    }
    if (text.includes('child') || text.includes('pediatric') || (typeof age === 'number' && age < 14)) {
      return doctors.find((d) => d.department === 'Pediatrics') || doctors[0];
    }
    if (text.includes('breath') || text.includes('cough') || text.includes('asthma') || text.includes('wheez')) {
      return doctors.find((d) => d.department === 'Pulmonology') || doctors[0];
    }
    if (text.includes('headache') || text.includes('seizure') || text.includes('dizziness') || text.includes('numbness')) {
      return doctors.find((d) => d.department === 'Neurology') || doctors[0];
    }
    if (text.includes('severe bleeding') || text.includes('unconscious') || text.includes('stat') || triagePriority === 'STAT Emergency') {
      return doctors.find((d) => d.department === 'Emergency Triage') || doctors[0];
    }
    return doctors.find((d) => d.department === 'General Medicine') || doctors[0];
  }, [chiefComplaint, age, triagePriority, doctors]);

  // When suggestion triggers, auto-select if user hasn't explicitly customized yet
  const handleUseSuggestedDoctor = (doc: Doctor) => {
    setSelectedDoctorId(doc.id);
  };

  const addAllergy = (allergy: string) => {
    if (!selectedAllergies.includes(allergy)) {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const removeAllergy = (allergy: string) => {
    setSelectedAllergies(selectedAllergies.filter((a) => a !== allergy));
  };

  const addChronic = (condition: string) => {
    if (!selectedChronic.includes(condition)) {
      setSelectedChronic([...selectedChronic, condition]);
    }
  };

  const removeChronic = (condition: string) => {
    setSelectedChronic(selectedChronic.filter((c) => c !== condition));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setActiveTab('demographics');
      return;
    }
    if (!chiefComplaint.trim()) {
      setActiveTab('medical');
      return;
    }

    const doctor = doctors.find((d) => d.id === selectedDoctorId) || suggestedDoctor || doctors[0];
    const generatedMRN = generateMRN(existingPatients);
    const generatedTokenNum = generateToken(doctor.department, existingPatients);
    const generatedCaseId = generateCaseFileId();

    const vitals: VitalSigns = {
      bpSystolic: Number(bpSystolic) || 120,
      bpDiastolic: Number(bpDiastolic) || 80,
      heartRate: Number(heartRate) || 75,
      spO2: Number(spO2) || 98,
      temperature: Number(temperature) || 98.6,
      weightKg: Number(weightKg) || 70,
      heightCm: Number(heightCm) || 170,
      bmi,
      respiratoryRate: Number(respiratoryRate) || 18,
    };

    const medicalInfo: BasicMedicalInfo = {
      bloodGroup,
      allergies: selectedAllergies.length > 0 ? selectedAllergies : ['NKDA (No Known Drug Allergies)'],
      chronicConditions: selectedChronic,
      currentMedications: currentMedications
        ? currentMedications.split(',').map((m) => m.trim()).filter(Boolean)
        : [],
      chiefComplaint,
      symptomsDuration,
      isNPO,
      highRiskAlert: highRiskAlert || (selectedAllergies.length > 0 ? `Flagged: ${selectedAllergies.join(', ')}` : undefined),
      receptionistObservations: receptionistObservations || 'Intake recorded at Central Reception Desk 1.',
    };

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      mrn: generatedMRN,
      tokenNumber: generatedTokenNum,
      fullName: fullName.trim(),
      age: Number(age) || 30,
      gender,
      dateOfBirth: dob,
      contactNumber: contactNumber || '+1 (555) 000-0000',
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@patient.ehr`,
      address: address || 'Metro City Residential Area',
      emergencyContact: {
        name: emergencyName || 'Primary Family Contact',
        relationship: emergencyRelation,
        phone: emergencyPhone || contactNumber || '+1 (555) 999-0000',
      },
      nationalIdOrInsurance: insuranceId || `EHR-INS-${Math.floor(100000 + Math.random() * 900000)}`,
      registrationDate: new Date().toISOString(),
      qrPayload: '', // will be populated
      caseFile: {
        id: generatedCaseId,
        patientId: `pat-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        triagePriority,
        currentStatus: 'Waiting in Queue',
        assignedDoctorId: doctor.id,
        assignedDoctorName: doctor.name,
        department: doctor.department,
        roomNumber: doctor.roomNumber,
        tokenNumber: generatedTokenNum,
        initialVitals: vitals,
        medicalInfo,
        consultationHistory: [],
        registeredByStaff: 'Receptionist Sarah Jenkins (Desk 1)',
      },
    };

    // Build the scannable QR payload string
    newPatient.qrPayload = buildPatientQRPayload(newPatient);

    onPatientAdded(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0e3b56] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                New Patient Intake & Case File Creation
              </h2>
              <p className="text-xs text-cyan-200/80">
                Register demographics, record baseline vitals, allot doctor, and generate instant QR health pass
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('demographics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'demographics'
                ? 'border-cyan-600 text-cyan-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-mono">
              1
            </span>
            <span>Patient Demographics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'medical'
                ? 'border-cyan-600 text-cyan-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-mono">
              2
            </span>
            <span>Vitals & Medical Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('allotment')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'allotment'
                ? 'border-cyan-600 text-cyan-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-mono">
              3
            </span>
            <span>Doctor Allotment & QR Case File</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* TAB 1: Demographics */}
          {activeTab === 'demographics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra / Emily Watson"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Primary Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Insurance / National Health ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MED-INS-99410"
                    value={insuranceId}
                    onChange={(e) => setInsuranceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street address, Apt #, City, Zip Code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Emergency Contact Block */}
              <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Emergency Contact Information (Will be printed on Patient QR Pass)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita Patil / John Doe"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Relationship</label>
                    <select
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Emergency Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('medical')}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Next: Vitals & Medical Info →</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Medical Information */}
          {activeTab === 'medical' && (
            <div className="space-y-4">
              {/* Chief Complaint & Triage Priority */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-cyan-600" />
                    Chief Complaint & Triage Evaluation
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600 text-[11px]">Triage Priority:</span>
                    <select
                      value={triagePriority}
                      onChange={(e) => setTriagePriority(e.target.value as any)}
                      className={`font-bold px-2.5 py-1 rounded text-xs border ${
                        triagePriority === 'STAT Emergency'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : triagePriority === 'Urgent'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : triagePriority === 'Priority'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <option value="Routine">Routine (Green)</option>
                      <option value="Priority">Priority (Yellow)</option>
                      <option value="Urgent">Urgent (Orange)</option>
                      <option value="STAT Emergency">STAT Emergency (Red)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block font-semibold text-slate-800 mb-1">
                      Chief Complaint / Reason for Visit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acute severe substernal chest tightness radiating to left shoulder"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Onset / Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 hours, 2 days"
                      value={symptomsDuration}
                      onChange={(e) => setSymptomsDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isNPO}
                      onChange={(e) => setIsNPO(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px] border border-amber-300">
                      NPO Active (Patient is Fasting for Procedures/Surgery)
                    </span>
                  </label>
                </div>
              </div>

              {/* Baseline Vitals Grid */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                  <span>Front Desk Triage Vitals</span>
                  <span className="font-normal text-slate-400 text-[11px]">Recorded by Receptionist / Triage Nurse</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">BP Systolic</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 px-1.5 py-1 bg-white border rounded font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">mmHg</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">BP Diastolic</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 px-1.5 py-1 bg-white border rounded font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">mmHg</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Heart Rate</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 px-1.5 py-1 bg-white border rounded font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">bpm</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">SpO2 Level</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={spO2}
                        onChange={(e) => setSpO2(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 px-1.5 py-1 bg-white border rounded font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Temp</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 px-1.5 py-1 bg-white border rounded font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">°F</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Weight</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 px-1.5 py-1 bg-white border rounded font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">kg</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">BMI (Calc)</label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-mono font-bold text-xs text-cyan-900 bg-cyan-100 px-2 py-1 rounded">
                        {bmi}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blood Group & Allergies */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Blood Group <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-rose-700 focus:outline-none"
                  >
                    <option value="A+">A+ (A Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="O-">O- (O Negative)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Known Drug & Food Allergies
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Sulfa, Peanuts"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (allergyInput.trim()) {
                            addAllergy(allergyInput.trim());
                            setAllergyInput('');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (allergyInput.trim()) {
                          addAllergy(allergyInput.trim());
                          setAllergyInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 font-semibold rounded-lg text-xs"
                    >
                      + Add
                    </button>
                  </div>
                  {/* Quick Allergy Presets */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Severe Penicillin', 'Sulfa Drugs', 'NSAIDs / Aspirin', 'Latex', 'Peanuts', 'NKDA'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => addAllergy(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-slate-200"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                  {/* Selected allergy tags */}
                  {selectedAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedAllergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 font-semibold px-2 py-0.5 rounded text-[11px]"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeAllergy(allergy)}
                            className="hover:text-rose-950 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chronic Conditions & Meds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Chronic Medical Conditions
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Hypertension, Diabetes, Asthma"
                      value={chronicInput}
                      onChange={(e) => setChronicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (chronicInput.trim()) {
                            addChronic(chronicInput.trim());
                            setChronicInput('');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (chronicInput.trim()) {
                          addChronic(chronicInput.trim());
                          setChronicInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 font-semibold rounded-lg text-xs"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Hypertension', 'Type 2 Diabetes', 'Asthma', 'CAD', 'Thyroid'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => addChronic(c)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors border border-slate-200"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                  {selectedChronic.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedChronic.map((cond) => (
                        <span
                          key={cond}
                          className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-800 border border-cyan-300 font-medium px-2 py-0.5 rounded text-[11px]"
                        >
                          {cond}
                          <button
                            type="button"
                            onClick={() => removeChronic(cond)}
                            className="hover:text-cyan-950 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Current Regular Medications (comma separated)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Amlodipine 5mg OD, Metformin 500mg BD"
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Receptionist Clinical Triage Observation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patient visibly fatigued, brought by son with previous ECG report"
                  value={receptionistObservations}
                  onChange={(e) => setReceptionistObservations(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('demographics')}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg text-xs"
                >
                  ← Back to Demographics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('allotment')}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Next: Allot Doctor & Case File →</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Doctor Allotment & QR Case File */}
          {activeTab === 'allotment' && (
            <div className="space-y-4">
              {/* Intelligent Doctor Recommendation Banner */}
              {suggestedDoctor && (
                <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 block">
                        Intelligent Triage Specialty Recommendation
                      </span>
                      <p className="text-xs font-bold text-slate-900">
                        {suggestedDoctor.name} ({suggestedDoctor.department})
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Matched based on complaint: "{chiefComplaint || 'General checkup'}" • Room: {suggestedDoctor.roomNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseSuggestedDoctor(suggestedDoctor)}
                    className="px-3 py-1.5 bg-[#0e3b56] hover:bg-[#072538] text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs"
                  >
                    Select Recommended
                  </button>
                </div>
              )}

              {/* Doctor Selection Grid */}
              <div>
                <label className="block font-bold text-slate-900 text-xs mb-2">
                  Allot Attending Doctor & OPD Department <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        id={`allot-doctor-${doc.id}`}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-50/70 border-cyan-600 ring-2 ring-cyan-600/30 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 border border-slate-200">
                            {doc.avatarInitials}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 text-xs truncate">{doc.name}</p>
                            <p className="text-[11px] text-cyan-800 font-semibold truncate">{doc.department}</p>
                            <p className="text-[10px] text-slate-500 truncate">{doc.roomNumber}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                              doc.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : doc.status === 'in-consultation'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {doc.status}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {doc.currentQueueCount} in queue
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Case File & QR Pass Preview Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    Automated Case File & QR Pass Output
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Auto-generated on save
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">MRN:</span>
                    <span className="font-mono font-bold text-white">Next Available</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Token Number:</span>
                    <span className="font-mono font-bold text-cyan-300">Auto Department Token</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Case File ID:</span>
                    <span className="font-mono font-bold text-white">CF-2026-XXXX</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">QR Health Pass:</span>
                    <span className="font-bold text-emerald-400">Ready to Print</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('medical')}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg text-xs"
                >
                  ← Back to Medical Info
                </button>
                <button
                  type="submit"
                  id="submit-create-patient-btn"
                  className="px-5 py-2.5 bg-[#0e3b56] hover:bg-[#072437] text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  <QrCode className="w-4 h-4 text-cyan-300" />
                  <span>Create Case File & Generate QR Pass</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
