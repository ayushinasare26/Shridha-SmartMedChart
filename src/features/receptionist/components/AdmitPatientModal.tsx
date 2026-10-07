import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BedDouble,
  Building2,
  Clock,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Phone,
  Calendar,
  LogOut,
  Sparkles,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { Patient, ShiftType, ShiftAssistantDoctor, Doctor } from '../types';
import {
  HOSPITAL_WARDS,
  SHIFT_ASSISTANT_DOCTOR_ROSTER,
  SHIFT_TIMINGS,
  getCurrentActiveShift,
  getDefaultShiftAssistantDoctors,
} from '../data/wardAndShiftData';

interface AdmitPatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  allPatients: Patient[];
  doctors?: Doctor[];
  initialWardId?: string | null;
  initialBedNumber?: string | null;
  onSaveAdmission: (patientId: string, admissionData: Patient['admission']) => void;
  onOpenRegistrationWithAdmit?: () => void;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  patient,
  isOpen,
  onClose,
  allPatients,
  doctors,
  initialWardId,
  initialBedNumber,
  onSaveAdmission,
  onOpenRegistrationWithAdmit,
}) => {
  const currentActiveShift = getCurrentActiveShift();

  // Outpatient and admitted lists
  const unadmittedPatients = useMemo(
    () => allPatients.filter((p) => !p.admission?.isAdmitted),
    [allPatients]
  );
  const admittedPatients = useMemo(
    () => allPatients.filter((p) => Boolean(p.admission?.isAdmitted)),
    [allPatients]
  );

  // Selected patient ID state
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    if (patient?.id) return patient.id;
    if (unadmittedPatients.length > 0) return unadmittedPatients[0].id;
    if (allPatients.length > 0) return allPatients[0].id;
    return '';
  });

  // Keep selectedPatientId in sync when patient prop changes or modal opens
  useEffect(() => {
    if (patient?.id) {
      setSelectedPatientId(patient.id);
    } else if (!selectedPatientId || !allPatients.some((p) => p.id === selectedPatientId)) {
      if (unadmittedPatients.length > 0) {
        setSelectedPatientId(unadmittedPatients[0].id);
      } else if (allPatients.length > 0) {
        setSelectedPatientId(allPatients[0].id);
      }
    }
  }, [patient?.id, isOpen, unadmittedPatients, allPatients]);

  const currentPatient = useMemo(
    () => allPatients.find((p) => p.id === selectedPatientId) || patient || allPatients[0] || null,
    [allPatients, selectedPatientId, patient]
  );

  // Selected Ward
  const [selectedWardId, setSelectedWardId] = useState<string>(HOSPITAL_WARDS[2].id);

  // Selected Bed
  const [selectedBed, setSelectedBed] = useState<string>('GM-01');

  // Shift-Wise Assistant Doctors
  const [shiftDoctors, setShiftDoctors] = useState<ShiftAssistantDoctor[]>(() =>
    getDefaultShiftAssistantDoctors()
  );

  // Admission notes
  const [admissionNotes, setAdmissionNotes] = useState<string>('');

  // Synchronize ward, bed, doctors, and notes when currentPatient or initial props change
  useEffect(() => {
    if (!currentPatient) return;

    let targetWardId = HOSPITAL_WARDS[2].id;
    if (initialWardId && HOSPITAL_WARDS.some((w) => w.id === initialWardId)) {
      targetWardId = initialWardId;
    } else if (currentPatient.admission?.wardNumber) {
      const match = HOSPITAL_WARDS.find(
        (w) =>
          w.name === currentPatient.admission?.wardNumber ||
          w.shortName === currentPatient.admission?.wardNumber
      );
      if (match) targetWardId = match.id;
    } else {
      // Auto-recommend ward based on department or gender
      if (currentPatient.caseFile.department === 'Cardiology') targetWardId = 'ward-2-ccu';
      else if (currentPatient.caseFile.department === 'Pediatrics') targetWardId = 'ward-6-ped';
      else if (currentPatient.caseFile.department === 'Pulmonology') targetWardId = 'ward-7-resp';
      else if (currentPatient.caseFile.department === 'Orthopedics') targetWardId = 'ward-5-sp';
      else if (currentPatient.gender === 'Female') targetWardId = 'ward-4-gf';
      else targetWardId = 'ward-3-gm';
    }
    setSelectedWardId(targetWardId);

    const ward = HOSPITAL_WARDS.find((w) => w.id === targetWardId) || HOSPITAL_WARDS[0];

    // Determine initial bed
    if (initialBedNumber) {
      setSelectedBed(initialBedNumber);
    } else if (currentPatient.admission?.bedNumber) {
      setSelectedBed(currentPatient.admission.bedNumber);
    } else {
      // Pick first vacant bed in this ward
      const occupiedInTargetWard = allPatients
        .filter(
          (p) =>
            p.id !== currentPatient.id &&
            p.admission?.isAdmitted &&
            p.admission.wardNumber === ward.name
        )
        .map((p) => p.admission?.bedNumber);
      const firstVacant = ward.beds.find((b) => !occupiedInTargetWard.includes(b));
      setSelectedBed(firstVacant || ward.beds[0] || 'BED-01');
    }

    // Shift doctors
    if (
      currentPatient.admission?.shiftAssistantDoctors &&
      currentPatient.admission.shiftAssistantDoctors.length > 0
    ) {
      setShiftDoctors(currentPatient.admission.shiftAssistantDoctors);
    } else {
      setShiftDoctors(getDefaultShiftAssistantDoctors());
    }

    // Admission notes
    setAdmissionNotes(currentPatient.admission?.admissionNotes || '');
  }, [currentPatient?.id, isOpen, initialWardId, initialBedNumber]);

  const selectedWard = useMemo(
    () => HOSPITAL_WARDS.find((w) => w.id === selectedWardId) || HOSPITAL_WARDS[0],
    [selectedWardId]
  );

  // Keep bed updated when ward changes
  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId);
    const ward = HOSPITAL_WARDS.find((w) => w.id === wardId);
    if (ward) {
      const occupiedInWard = allPatients
        .filter(
          (p) =>
            p.id !== currentPatient?.id &&
            p.admission?.isAdmitted &&
            p.admission.wardNumber === ward.name
        )
        .map((p) => p.admission?.bedNumber);
      const firstVacant = ward.beds.find((b) => !occupiedInWard.includes(b));
      setSelectedBed(firstVacant || ward.beds[0] || 'BED-01');
    }
  };

  // Find which beds are occupied by other admitted patients in the currently selected ward
  const occupiedBedsInWard = useMemo(() => {
    const occupied: Record<string, { patientName: string; mrn: string }> = {};
    if (!currentPatient) return occupied;

    allPatients.forEach((p) => {
      if (
        p.id !== currentPatient.id &&
        p.admission?.isAdmitted &&
        p.admission.wardNumber === selectedWard.name
      ) {
        if (p.admission.bedNumber) {
          occupied[p.admission.bedNumber] = {
            patientName: p.fullName,
            mrn: p.mrn,
          };
        }
      }
    });
    return occupied;
  }, [allPatients, currentPatient?.id, selectedWard]);

  // Handle assistant doctor roster selection
  const handleAssistantDoctorSelect = (shift: ShiftType, doctorId: string) => {
    const rosterList = SHIFT_ASSISTANT_DOCTOR_ROSTER[shift];
    const chosen = rosterList.find((d) => d.id === doctorId);
    if (!chosen) return;

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
  };

  const handleCustomAssistantDoctorName = (shift: ShiftType, name: string) => {
    setShiftDoctors((prev) =>
      prev.map((item) =>
        item.shift === shift
          ? {
              ...item,
              assistantDoctorName: name,
            }
          : item
      )
    );
  };

  const handleCustomAssistantDoctorContact = (shift: ShiftType, contact: string) => {
    setShiftDoctors((prev) =>
      prev.map((item) =>
        item.shift === shift
          ? {
              ...item,
              contactNumber: contact,
            }
          : item
      )
    );
  };

  const handleSave = () => {
    if (!currentPatient) return;

    const admissionData: Patient['admission'] = {
      isAdmitted: true,
      admissionDate: currentPatient.admission?.admissionDate || new Date().toISOString(),
      wardNumber: selectedWard.name,
      bedNumber: selectedBed.trim() || selectedWard.beds[0] || 'BED-01',
      admittingDoctorName: currentPatient.caseFile.assignedDoctorName,
      shiftAssistantDoctors: shiftDoctors,
      admissionNotes: admissionNotes.trim() || undefined,
    };

    onSaveAdmission(currentPatient.id, admissionData);
    onClose();
  };

  const handleDischarge = () => {
    if (!currentPatient) return;
    if (
      window.confirm(
        `Discharge ${currentPatient.fullName} from ${
          currentPatient.admission?.wardNumber || 'Ward'
        } (${currentPatient.admission?.bedNumber})?`
      )
    ) {
      onSaveAdmission(currentPatient.id, undefined);
      onClose();
    }
  };

  if (!isOpen) return null;

  // If no patients registered in the hospital at all
  if (!currentPatient) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[rgba(15,23,42,0.35)] backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
            <BedDouble className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Patients Registered Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no patients in the system to admit. Register a patient first to allot a ward and bed.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegistrationWithAdmit?.();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll &amp; Admit Patient</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAlreadyAdmitted = Boolean(currentPatient.admission?.isAdmitted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[rgba(15,23,42,0.35)] backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1d4ed8]">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  {isAlreadyAdmitted ? 'Manage Inpatient Ward & Bed Allotment' : 'Admit Patient & Allot Inpatient Bed'}
                </h3>
                {isAlreadyAdmitted ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Currently Admitted
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Outpatient Intake
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign hospital ward, vacant bed number, and round-the-clock shift assistant doctors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Switcher Bar (Allows choosing any outpatient or enrolling a new one) */}
        <div className="p-3.5 bg-slate-100/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <label className="text-xs font-bold text-slate-700 shrink-0">
              Select Patient:
            </label>
            <div className="relative flex-1">
              <select
                id="admit-modal-patient-select"
                value={currentPatient.id}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full pl-2.5 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] shadow-2xs"
              >
                {unadmittedPatients.length > 0 && (
                  <optgroup label={`Outpatients Awaiting Bed Allotment (${unadmittedPatients.length})`}>
                    {unadmittedPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.mrn}) — {p.caseFile.department} [{p.tokenNumber}]
                      </option>
                    ))}
                  </optgroup>
                )}
                {admittedPatients.length > 0 && (
                  <optgroup label={`Currently Admitted Inpatients (${admittedPatients.length})`}>
                    {admittedPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.mrn}) — {p.admission?.wardNumber} Bed {p.admission?.bedNumber}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {onOpenRegistrationWithAdmit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegistrationWithAdmit();
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/50 hover:bg-blue-100 text-[#1d4ed8] border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Enroll &amp; Admit New Patient</span>
            </button>
          )}
        </div>

        {/* Patient Demographic Summary Strip */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{currentPatient.fullName}</span>
            <span className="font-mono text-slate-500 font-semibold">({currentPatient.mrn})</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">{currentPatient.age} Yrs / {currentPatient.gender}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Stethoscope className="w-3.5 h-3.5 text-[#1d4ed8]" />
              <span>Attending: <strong>{currentPatient.caseFile.assignedDoctorName}</strong></span>
            </div>
            <span className="font-mono font-bold px-2 py-0.5 bg-blue-50 text-[#1d4ed8] border border-blue-200 rounded text-[11px]">
              {currentPatient.tokenNumber}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* 1. Ward Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#1d4ed8]" />
                <span>1. Select Hospital Ward</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Floor: <strong className="text-slate-700">{selectedWard.floor}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HOSPITAL_WARDS.map((w) => {
                const isSelected = selectedWardId === w.id;
                const occupiedCount = allPatients.filter(
                  (p) =>
                    p.id !== currentPatient.id &&
                    p.admission?.isAdmitted &&
                    p.admission.wardNumber === w.name
                ).length;
                const vacantCount = w.beds.length - occupiedCount;

                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleWardChange(w.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#1d4ed8] ring-2 ring-[#1d4ed8]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#1e40af]' : 'text-slate-800'}`}>
                        {w.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#1d4ed8] shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{w.floor}</span>
                      <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                        vacantCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {vacantCount} Vacant Beds
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Bed Allotment */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[#1d4ed8]" />
                <span>2. Allot Bed in {selectedWard.shortName}</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Selected Bed: <strong className="text-[#1d4ed8] font-mono text-xs">{selectedBed}</strong>
              </span>
            </div>

            {/* Bed Grid Selector */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {selectedWard.beds.map((bed) => {
                const isOccupied = Boolean(occupiedBedsInWard[bed]);
                const isSelected = selectedBed === bed;

                return (
                  <button
                    key={bed}
                    type="button"
                    disabled={isOccupied && !isSelected}
                    onClick={() => setSelectedBed(bed)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] ring-2 ring-blue-300 shadow-xs'
                        : isOccupied
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-[#1d4ed8] hover:bg-blue-50/40'
                    }`}
                    title={isOccupied ? `Occupied by ${occupiedBedsInWard[bed]?.patientName}` : `Bed ${bed} is vacant`}
                  >
                    <BedDouble className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : isOccupied ? 'text-slate-400' : 'text-slate-600'}`} />
                    <span className="text-xs font-mono font-black">{bed}</span>
                    <span className="text-[9px] mt-0.5 font-medium">
                      {isSelected ? 'Selected' : isOccupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Manual Bed Override */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Or enter custom bed code:</span>
              <input
                type="text"
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value.toUpperCase())}
                placeholder="e.g. BED-12"
                className="w-32 px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
              />
            </div>
          </div>

          {/* 3. Shifting Time-Wise Assistant Doctor Allotment */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-200">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#1d4ed8]" />
                <span>3. Shifting Time-Wise Assistant Doctor Roster</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Active Hospital Shift:</span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {currentActiveShift} Shift
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Allot attending resident and assistant medical officers across the 3 round-the-clock hospital duty shifts for this inpatient bed.
            </p>

            {/* Shift Doctor Cards */}
            <div className="space-y-3">
              {(['Morning', 'Evening', 'Night'] as ShiftType[]).map((shift) => {
                const shiftData = shiftDoctors.find((s) => s.shift === shift) || {
                  shift,
                  shiftTiming: SHIFT_TIMINGS[shift],
                  assistantDoctorName: '',
                  contactNumber: '',
                  designation: '',
                };
                const isCurrentShift = currentActiveShift === shift;
                const rosterOptions = SHIFT_ASSISTANT_DOCTOR_ROSTER[shift];

                return (
                  <div
                    key={shift}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrentShift
                        ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Shift Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          shift === 'Morning'
                            ? 'bg-amber-100 text-amber-900'
                            : shift === 'Evening'
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'bg-purple-100 text-purple-900'
                        }`}>
                          {shift} Shift
                        </span>
                        <span className="text-xs text-slate-600 font-mono font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {shiftData.shiftTiming}
                        </span>
                      </div>

                      {isCurrentShift && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Active Shift Now
                        </span>
                      )}
                    </div>

                    {/* Quick Roster Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Select Roster Assistant Doctor
                        </label>
                        <select
                          onChange={(e) => handleAssistantDoctorSelect(shift, e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] font-medium"
                          value={shiftData.assistantDoctorId || ''}
                        >
                          <option value="">-- Choose from {shift} Duty Roster --</option>
                          {rosterOptions.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} ({doc.designation})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Assistant Doctor Name (Custom / Edited)
                        </label>
                        <input
                          type="text"
                          value={shiftData.assistantDoctorName}
                          onChange={(e) => handleCustomAssistantDoctorName(shift, e.target.value)}
                          placeholder="e.g. Dr. Rohan Kapoor"
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                        />
                      </div>
                    </div>

                    {/* Contact & Designation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                          Duty Contact / Ward Intercom Ext.
                        </label>
                        <div className="relative">
                          <Phone className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={shiftData.contactNumber || ''}
                            onChange={(e) => handleCustomAssistantDoctorContact(shift, e.target.value)}
                            placeholder="Ext: 401 (+91 ...)"
                            className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                          Designation / Role
                        </label>
                        <input
                          type="text"
                          value={shiftData.designation || ''}
                          readOnly
                          className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Admission Notes */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Admission Instructions / Nursing Handover
            </label>
            <textarea
              rows={2}
              value={admissionNotes}
              onChange={(e) => setAdmissionNotes(e.target.value)}
              placeholder="e.g. Continuous cardiac telemetry, NPO after midnight, regular vitals check every 2 hours..."
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {isAlreadyAdmitted ? (
              <button
                type="button"
                onClick={handleDischarge}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Discharge from Ward</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                Patient will be admitted and given inpatient (IPD) status.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="confirm-admission-btn"
              onClick={handleSave}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{isAlreadyAdmitted ? 'Update Bed & Shift Roster' : 'Confirm Ward & Bed Allotment'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
