import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Patient, ShiftType, ShiftAssistantDoctor } from '../types';
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
  onSaveAdmission: (patientId: string, admissionData: Patient['admission']) => void;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  patient,
  isOpen,
  onClose,
  allPatients,
  onSaveAdmission,
}) => {
  if (!isOpen || !patient) return null;

  const currentActiveShift = getCurrentActiveShift();

  // Selected Ward
  const [selectedWardId, setSelectedWardId] = useState<string>(() => {
    if (patient.admission?.wardNumber) {
      const match = HOSPITAL_WARDS.find((w) => w.name === patient.admission?.wardNumber || w.shortName === patient.admission?.wardNumber);
      return match ? match.id : HOSPITAL_WARDS[2].id; // default Ward 3
    }
    // Auto-recommend ward based on department
    if (patient.caseFile.department === 'Cardiology') return 'ward-2-ccu';
    if (patient.caseFile.department === 'Pediatrics') return 'ward-6-ped';
    if (patient.caseFile.department === 'Pulmonology') return 'ward-7-resp';
    if (patient.caseFile.department === 'Orthopedics') return 'ward-5-sp';
    if (patient.gender === 'Female') return 'ward-4-gf';
    return 'ward-3-gm';
  });

  const selectedWard = HOSPITAL_WARDS.find((w) => w.id === selectedWardId) || HOSPITAL_WARDS[0];

  // Selected Bed
  const [selectedBed, setSelectedBed] = useState<string>(() => {
    return patient.admission?.bedNumber || selectedWard.beds[0] || 'GM-01';
  });

  // Shift-Wise Assistant Doctors
  const [shiftDoctors, setShiftDoctors] = useState<ShiftAssistantDoctor[]>(() => {
    if (patient.admission?.shiftAssistantDoctors && patient.admission.shiftAssistantDoctors.length > 0) {
      return patient.admission.shiftAssistantDoctors;
    }
    return getDefaultShiftAssistantDoctors();
  });

  // Admission notes
  const [admissionNotes, setAdmissionNotes] = useState<string>(() => {
    return patient.admission?.admissionNotes || '';
  });

  // Keep bed updated when ward changes
  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId);
    const ward = HOSPITAL_WARDS.find((w) => w.id === wardId);
    if (ward && !ward.beds.includes(selectedBed)) {
      setSelectedBed(ward.beds[0] || 'Bed-01');
    }
  };

  // Find which beds are occupied by other admitted patients
  const occupiedBedsInWard = React.useMemo(() => {
    const occupied: Record<string, { patientName: string; mrn: string }> = {};
    allPatients.forEach((p) => {
      if (p.id !== patient.id && p.admission?.isAdmitted && p.admission.wardNumber === selectedWard.name) {
        if (p.admission.bedNumber) {
          occupied[p.admission.bedNumber] = {
            patientName: p.fullName,
            mrn: p.mrn,
          };
        }
      }
    });
    return occupied;
  }, [allPatients, patient.id, selectedWard]);

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
    const admissionData: Patient['admission'] = {
      isAdmitted: true,
      admissionDate: patient.admission?.admissionDate || new Date().toISOString(),
      wardNumber: selectedWard.name,
      bedNumber: selectedBed,
      admittingDoctorName: patient.caseFile.assignedDoctorName,
      shiftAssistantDoctors: shiftDoctors,
      admissionNotes: admissionNotes.trim() || undefined,
    };

    onSaveAdmission(patient.id, admissionData);
    onClose();
  };

  const handleDischarge = () => {
    if (window.confirm(`Discharge ${patient.fullName} from ${patient.admission?.wardNumber || 'Ward'} (${patient.admission?.bedNumber})?`)) {
      onSaveAdmission(patient.id, undefined);
      onClose();
    }
  };

  const isAlreadyAdmitted = Boolean(patient.admission?.isAdmitted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0e3b56] to-[#124d70] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-200">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {isAlreadyAdmitted ? 'Manage Patient Ward & Bed Allotment' : 'Admit Patient & Allot Ward / Bed'}
                </h3>
                {isAlreadyAdmitted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Currently Admitted
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                Assign inpatient ward, bed number, and shifting time-wise assistant doctor roster
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cyan-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Demographic Summary Strip */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{patient.fullName}</span>
            <span className="font-mono text-slate-500 font-semibold">({patient.mrn})</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">{patient.age} Yrs / {patient.gender}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-700" />
              <span>Attending: <strong>{patient.caseFile.assignedDoctorName}</strong></span>
            </div>
            <span className="font-mono font-bold px-2 py-0.5 bg-cyan-100 text-cyan-900 rounded text-[11px]">
              {patient.tokenNumber}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Ward Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-700" />
                <span>1. Select Hospital Ward</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Floor: <strong className="text-slate-700">{selectedWard.floor}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HOSPITAL_WARDS.map((w) => {
                const isSelected = selectedWardId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleWardChange(w.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-50/70 border-cyan-600 ring-2 ring-cyan-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-cyan-950' : 'text-slate-800'}`}>
                        {w.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{w.floor}</span>
                      <span className="font-semibold text-slate-600">{w.beds.length} Total Beds</span>
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
                <BedDouble className="w-4 h-4 text-cyan-700" />
                <span>2. Allot Bed in {selectedWard.shortName}</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Selected Bed: <strong className="text-cyan-800 font-mono text-xs">{selectedBed}</strong>
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
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#0e3b56] text-white border-[#0e3b56] ring-2 ring-cyan-500 shadow-xs'
                        : isOccupied
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40'
                    }`}
                  >
                    <BedDouble className={`w-4 h-4 mb-1 ${isSelected ? 'text-cyan-300' : isOccupied ? 'text-slate-400' : 'text-slate-600'}`} />
                    <span className="text-xs font-mono font-black">{bed}</span>
                    <span className="text-[9px] mt-0.5">
                      {isSelected ? 'Selected' : isOccupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Manual Bed Override if needed */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500">Or enter custom bed:</span>
              <input
                type="text"
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value.toUpperCase())}
                placeholder="e.g. BED-12"
                className="w-32 px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
              />
            </div>
          </div>

          {/* 3. Shifting Time-Wise Assistant Doctor Allotment */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-200">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-700" />
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
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600 font-medium"
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
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
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
                            className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600 font-mono"
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
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-600"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Discharge from Ward</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">
                Patient will be marked as Inpatient (IPD)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0e3b56] hover:bg-[#124d70] rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              <span>{isAlreadyAdmitted ? 'Update Bed & Shift Roster' : 'Confirm Ward & Bed Allotment'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
