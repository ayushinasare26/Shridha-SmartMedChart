import React, { useState, useEffect } from 'react';
import {
  Patient,
  Doctor,
  PatientAdmission,
} from './types';
import {
  getStoredPatients,
  saveStoredPatients,
  getStoredDoctors,
  saveStoredDoctors,
  resetDemoData,
} from './utils/storage';
import { Sidebar, SidebarActiveTab } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { WelcomeHeroBanner } from './components/WelcomeHeroBanner';
import { HospitalStatusSummary } from './components/HospitalStatusSummary';
import { AddPatientCard } from './components/AddPatientCard';
import { HospitalPatientsList } from './components/HospitalPatientsList';
import { DoctorAllotmentView } from './components/DoctorAllotmentView';
import { WardsBedMapView } from './components/WardsBedMapView';
import { ShiftRosterView } from './components/ShiftRosterView';
import { SimpleCaseFileModal } from './components/SimpleCaseFileModal';
import { AdmitPatientModal } from './components/AdmitPatientModal';
import { PatientQRModal } from './components/PatientQRModal';
import { QRScannerModal } from './components/QRScannerModal';
import { generateToken } from './data/mockHospitalData';
import { buildPatientQRPayload } from './utils/qrHelper';
import {
  RotateCcw,
  Users,
  BedDouble,
  Clock,
  Building2,
  UserPlus,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => getStoredPatients());
  const [doctors, setDoctors] = useState<Doctor[]>(() => getStoredDoctors());
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string | null>(null);
  const [admissionFilter, setAdmissionFilter] = useState<'all' | 'admitted' | 'opd'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar States
  const [activeTab, setActiveTab] = useState<SidebarActiveTab>('overview');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isCaseFileModalOpen, setIsCaseFileModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);

  const [patientForQR, setPatientForQR] = useState<Patient | null>(null);
  const [patientForCaseFile, setPatientForCaseFile] = useState<Patient | null>(null);
  const [patientForAdmit, setPatientForAdmit] = useState<Patient | null>(null);

  // Keep state saved in storage
  useEffect(() => {
    saveStoredPatients(patients);
  }, [patients]);

  useEffect(() => {
    saveStoredDoctors(doctors);
  }, [doctors]);

  // Derived counts
  const admittedPatients = patients.filter((p) => p.admission?.isAdmitted);
  const opdPatients = patients.filter((p) => !p.admission?.isAdmitted);
  const statUrgentCount = patients.filter(
    (p) =>
      p.caseFile.triagePriority === 'STAT Urgent' ||
      p.caseFile.triagePriority === 'STAT Emergency'
  ).length;

  // Receptionist Handlers
  const handleAddPatient = (newPatient: Patient) => {
    const updated = [newPatient, ...patients];
    setPatients(updated);

    // Update doctor queue count
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === newPatient.caseFile.assignedDoctorId
          ? { ...doc, currentQueueCount: (doc.currentQueueCount || 0) + 1 }
          : doc
      )
    );
  };

  const handleUpdatePatientDoctor = (patientId: string, newDoctor: Doctor) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newToken = generateToken(newDoctor.department, prev);
          const updatedPatient: Patient = {
            ...p,
            tokenNumber: newToken,
            caseFile: {
              ...p.caseFile,
              assignedDoctorId: newDoctor.id,
              assignedDoctorName: newDoctor.name,
              department: newDoctor.department,
              roomNumber: newDoctor.roomNumber,
              tokenNumber: newToken,
              updatedAt: new Date().toISOString(),
            },
          };
          updatedPatient.qrPayload = buildPatientQRPayload(updatedPatient);

          if (patientForCaseFile?.id === patientId) {
            setPatientForCaseFile(updatedPatient);
          }
          if (patientForQR?.id === patientId) {
            setPatientForQR(updatedPatient);
          }
          if (patientForAdmit?.id === patientId) {
            setPatientForAdmit(updatedPatient);
          }

          return updatedPatient;
        }
        return p;
      })
    );

    // Update doctors' queue counts
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id === newDoctor.id) {
          return { ...d, currentQueueCount: (d.currentQueueCount || 0) + 1 };
        }
        return d;
      })
    );
  };

  const handleSaveAdmission = (patientId: string, admission: PatientAdmission | null) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const updatedPatient: Patient = {
            ...p,
            admission: admission || undefined,
            caseFile: {
              ...p.caseFile,
              currentStatus: admission?.isAdmitted ? 'Admitted (IPD)' : 'Discharged / OPD Followup',
              updatedAt: new Date().toISOString(),
            },
          };
          updatedPatient.qrPayload = buildPatientQRPayload(updatedPatient);

          if (patientForCaseFile?.id === patientId) {
            setPatientForCaseFile(updatedPatient);
          }
          if (patientForQR?.id === patientId) {
            setPatientForQR(updatedPatient);
          }
          if (patientForAdmit?.id === patientId) {
            setPatientForAdmit(updatedPatient);
          }

          return updatedPatient;
        }
        return p;
      })
    );
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo patients, doctors, and allotments to clean initial state?')) {
      resetDemoData();
      const freshPatients = getStoredPatients();
      const freshDoctors = getStoredDoctors();
      setPatients(freshPatients);
      setDoctors(freshDoctors);
      setSelectedDoctorFilter(null);
      setAdmissionFilter('all');
      setActiveTab('overview');
    }
  };

  const handleOpenQRModal = (patient: Patient) => {
    setPatientForQR(patient);
    setIsQRModalOpen(true);
  };

  const handleOpenCaseFile = (patient: Patient) => {
    setPatientForCaseFile(patient);
    setIsCaseFileModalOpen(true);
  };

  const handleOpenAdmitModal = (patient: Patient) => {
    setPatientForAdmit(patient);
    setIsAdmitModalOpen(true);
  };

  const handleOpenRegistration = () => {
    handleSelectTab('register');
  };

  const handleUpdateDoctorStatus = (doctorId: string, newStatus: any) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, availabilityStatus: newStatus } : d))
    );
  };

  const handleSelectTab = (tab: SidebarActiveTab) => {
    if (tab === 'qr-scan') {
      setIsQRScannerOpen(true);
      return;
    }
    setActiveTab(tab);
    if (tab === 'all-patients') {
      setAdmissionFilter('all');
      setSelectedDoctorFilter(null);
    } else if (tab === 'admitted') {
      setAdmissionFilter('admitted');
      setSelectedDoctorFilter(null);
    } else if (tab === 'opd') {
      setAdmissionFilter('opd');
      setSelectedDoctorFilter(null);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased flex flex-row">
      {/* Left Sidebar (Inspired by the UI reference) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        totalPatientsCount={patients.length}
        admittedCount={admittedPatients.length}
        opdCount={opdPatients.length}
        doctorsCount={doctors.length}
        statUrgentCount={statUrgentCount}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onResetData={handleResetData}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenAddPatient={handleOpenRegistration}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <TopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddPatient={handleOpenRegistration}
          onOpenQRScanner={() => setIsQRScannerOpen(true)}
          onSelectPatient={(p) => {
            handleOpenCaseFile(p);
          }}
          statUrgentCount={statUrgentCount}
          patients={patients}
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        />

        {/* Main Workstation View */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">


          {/* 1. OVERVIEW BLOCK */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Welcome Hero Banner */}
              <WelcomeHeroBanner
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
                onOpenAddPatient={handleOpenRegistration}
                onFilterAdmitted={() => handleSelectTab('admitted')}
                onFilterOPD={() => handleSelectTab('opd')}
                admittedCount={admittedPatients.length}
                totalPatientsCount={patients.length}
              />

              {/* Workstation Header & Reset Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Receptionist Intake, Bed Allotment & Doctor Desk
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register incoming patients, allot attending doctors, admit patients with ward & bed numbers, schedule shift-wise assistant doctors, and generate QR tokens.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              </div>

              {/* Hospital Status Summary */}
              <section id="hospital-status-section" aria-label="Hospital Status and Allotted Doctors">
                <HospitalStatusSummary
                  patients={patients}
                  doctors={doctors}
                  selectedDoctorFilter={selectedDoctorFilter}
                  onSelectDoctorFilter={setSelectedDoctorFilter}
                  admissionFilter={admissionFilter}
                  onSelectAdmissionFilter={(filter) => {
                    if (filter === 'admitted') handleSelectTab('admitted');
                    else if (filter === 'opd') handleSelectTab('opd');
                    else handleSelectTab('all-patients');
                  }}
                />
              </section>

              {/* Direct Quick Block Jump Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => handleSelectTab('all-patients')}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-cyan-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700">All Patients Directory</p>
                      <p className="text-[11px] text-slate-500">{patients.length} active case files</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div
                  onClick={() => handleSelectTab('admitted')}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800">Admitted Inpatients (IPD)</p>
                      <p className="text-[11px] text-emerald-700 font-semibold">{admittedPatients.length} beds allotted in wards</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div
                  onClick={() => handleSelectTab('opd')}
                  className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-950 group-hover:text-indigo-800">OPD Outpatients Queue</p>
                      <p className="text-[11px] text-indigo-700 font-semibold">{opdPatients.length} patients in consultation</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* 2. ALL PATIENTS BLOCK (Direct, No Scrolling Needed) */}
          {activeTab === 'all-patients' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      All Registered Patients Directory
                    </h2>
                    <p className="text-xs text-slate-500">
                      Complete list of {patients.length} active patients across all hospital wings, outpatient clinics, and inpatient wards.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenRegistration}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Enroll Patients</span>
                  </button>
                </div>
              </div>

              <HospitalPatientsList
                patients={patients}
                doctors={doctors}
                selectedDoctorFilter={selectedDoctorFilter}
                admissionFilter="all"
                onOpenQRModal={handleOpenQRModal}
                onOpenCaseFile={handleOpenCaseFile}
                onOpenAdmitModal={handleOpenAdmitModal}
                onUpdatePatientDoctor={handleUpdatePatientDoctor}
              />
            </div>
          )}

          {/* 3. ADMITTED IPD BLOCK (Direct, No Scrolling Needed) */}
          {activeTab === 'admitted' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-emerald-950 tracking-tight">
                      Admitted Inpatients (IPD) & Bed Allotments
                    </h2>
                    <p className="text-xs text-emerald-800 font-medium">
                      {admittedPatients.length} patients currently admitted in hospital wards with assigned beds and attending physicians.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('wards')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs hover:bg-emerald-100/50"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>View 7 Wards Bed Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenRegistration}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Enroll Patients</span>
                  </button>
                </div>
              </div>

              <HospitalPatientsList
                patients={patients}
                doctors={doctors}
                selectedDoctorFilter={selectedDoctorFilter}
                admissionFilter="admitted"
                onOpenQRModal={handleOpenQRModal}
                onOpenCaseFile={handleOpenCaseFile}
                onOpenAdmitModal={handleOpenAdmitModal}
                onUpdatePatientDoctor={handleUpdatePatientDoctor}
              />
            </div>
          )}

          {/* 4. OPD OUTPATIENTS BLOCK (Direct, No Scrolling Needed) */}
          {activeTab === 'opd' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-indigo-950 tracking-tight">
                      OPD Outpatients & Consultation Queue
                    </h2>
                    <p className="text-xs text-indigo-800 font-medium">
                      {opdPatients.length} outpatients currently in clinic consultation queue and triage tokens.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenRegistration}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Enroll Patients</span>
                  </button>
                </div>
              </div>

              <HospitalPatientsList
                patients={patients}
                doctors={doctors}
                selectedDoctorFilter={selectedDoctorFilter}
                admissionFilter="opd"
                onOpenQRModal={handleOpenQRModal}
                onOpenCaseFile={handleOpenCaseFile}
                onOpenAdmitModal={handleOpenAdmitModal}
                onUpdatePatientDoctor={handleUpdatePatientDoctor}
              />
            </div>
          )}

          {/* 5. ENROLL PATIENT BLOCK (Direct, No Scrolling Needed) */}
          {activeTab === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      Patient Registration & Intake Desk
                    </h2>
                    <p className="text-xs text-slate-600">
                      Enroll incoming walk-in outpatients or direct emergency admissions with doctor and bed allotment.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectTab('all-patients')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-bold underline"
                >
                  Back to All Patients
                </button>
              </div>

              <AddPatientCard
                doctors={doctors}
                existingPatients={patients}
                onPatientAdded={(newPatient) => {
                  handleAddPatient(newPatient);
                  if (newPatient.admission?.isAdmitted) {
                    handleSelectTab('admitted');
                  } else {
                    handleSelectTab('opd');
                  }
                }}
                onOpenQRModal={handleOpenQRModal}
              />
            </div>
          )}

          {/* 6. ATTENDING DOCTORS BLOCK */}
          {activeTab === 'doctors' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <DoctorAllotmentView
                doctors={doctors}
                patients={patients}
                onUpdatePatientDoctor={handleUpdatePatientDoctor}
                onUpdateDoctorStatus={handleUpdateDoctorStatus}
                onOpenCaseFile={handleOpenCaseFile}
              />
            </div>
          )}

          {/* 7. WARDS & BED MAP BLOCK */}
          {activeTab === 'wards' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <WardsBedMapView
                patients={patients}
                onOpenCaseFile={handleOpenCaseFile}
                onNavigateToAdmitted={() => handleSelectTab('admitted')}
                onOpenAddPatient={handleOpenRegistration}
              />
            </div>
          )}

          {/* 8. SHIFT DOCTOR ROSTER BLOCK */}
          {activeTab === 'shifts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <ShiftRosterView onOpenAddPatient={handleOpenRegistration} />
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Scannable Patient QR Pass & Wristband */}
      <PatientQRModal
        patient={patientForQR}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onOpenCaseFile={handleOpenCaseFile}
      />

      {/* MODAL 2: Simple Case File Modal */}
      <SimpleCaseFileModal
        patient={patientForCaseFile}
        isOpen={isCaseFileModalOpen}
        onClose={() => setIsCaseFileModalOpen(false)}
        doctors={doctors}
        onOpenQRModal={handleOpenQRModal}
        onOpenAdmitModal={handleOpenAdmitModal}
        onUpdatePatientDoctor={handleUpdatePatientDoctor}
      />

      {/* MODAL 3: Admit Patient to Ward & Shift Assistant Doctors Modal */}
      <AdmitPatientModal
        patient={patientForAdmit}
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        doctors={doctors}
        allPatients={patients}
        onSaveAdmission={handleSaveAdmission}
      />

      {/* MODAL 4: QR Scanner / Fast Look-up */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        patients={patients}
        onSelectPatient={(p) => {
          handleOpenCaseFile(p);
        }}
      />
    </div>
  );
}
