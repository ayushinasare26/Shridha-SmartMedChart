import React, { useState } from 'react';
import {
  UserCheck,
  Stethoscope,
  Building,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Doctor, Patient, DoctorDepartment } from '../types';
import { generateToken } from '../data/mockHospitalData';

interface DoctorAllotmentViewProps {
  doctors: Doctor[];
  patients: Patient[];
  onUpdatePatientDoctor: (patientId: string, newDoctor: Doctor) => void;
  onUpdateDoctorStatus: (doctorId: string, newStatus: any) => void;
  onOpenCaseFile: (patient: Patient) => void;
  selectedPatientForReallotment?: Patient | null;
}

export const DoctorAllotmentView: React.FC<DoctorAllotmentViewProps> = ({
  doctors,
  patients,
  onUpdatePatientDoctor,
  onUpdateDoctorStatus,
  onOpenCaseFile,
  selectedPatientForReallotment,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [patientToAllotId, setPatientToAllotId] = useState<string>(
    selectedPatientForReallotment?.id || ''
  );
  const [allotSuccessMsg, setAllotSuccessMsg] = useState('');
  const [allotErrorMsg, setAllotErrorMsg] = useState('');

  // Waiting patients who can be allotted/re-allotted
  const waitingPatients = patients.filter(
    (p) => p?.caseFile?.currentStatus === 'Waiting in Queue' || p?.caseFile?.currentStatus === 'Registered'
  );

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDept !== 'all' && doc.department !== selectedDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.department.toLowerCase().includes(q) ||
        doc.roomNumber.toLowerCase().includes(q) ||
        doc.qualifications.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAllot = (doctor: Doctor) => {
    const ptId = patientToAllotId || selectedPatientForReallotment?.id;
    if (!ptId) {
      setAllotErrorMsg('Please select a patient from the dropdown selector above to allot to this doctor.');
      setTimeout(() => setAllotErrorMsg(''), 4000);
      return;
    }

    const patientObj = patients.find((p) => p.id === ptId);
    if (!patientObj) return;

    setAllotErrorMsg('');
    onUpdatePatientDoctor(ptId, doctor);
    setAllotSuccessMsg(
      `Successfully allotted patient ${patientObj.fullName} to ${doctor.name} (${doctor.department}, ${doctor.roomNumber}) with updated Token!`
    );
    setTimeout(() => setAllotSuccessMsg(''), 5000);
  };

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#1d4ed8]" />
            <span>OPD Consulting Physician Allotment &amp; Department Roster</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physician availability, room assignments, active queues, and direct patient allocation
          </p>
        </div>

        {/* Search & Dept Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1d4ed8] focus:outline-none"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
          >
            <option value="all">All Departments ({doctors.length})</option>
            <option value="Cardiology">Cardiology</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Neurology">Neurology</option>
            <option value="Pulmonology">Pulmonology</option>
            <option value="Emergency Triage">Emergency Triage</option>
          </select>
        </div>
      </div>

      {/* Direct Allotment Quick Selector Bar */}
      <div className="p-4 bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1d4ed8] block">
              Quick Patient Allotment Bar
            </span>
            <p className="text-xs text-slate-500">
              Select a waiting patient from the queue, then click "Allot Patient" on any doctor card below
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={patientToAllotId}
            onChange={(e) => setPatientToAllotId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] min-w-[260px]"
          >
            <option value="">-- Choose Patient to Allot ({waitingPatients.length} Waiting) --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.tokenNumber} - {p?.caseFile?.department || 'OPD'}) [{p?.caseFile?.currentStatus || 'Waiting'}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Error / Success Notifications */}
      {allotErrorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{allotErrorMsg}</span>
        </div>
      )}

      {allotSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{allotSuccessMsg}</span>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => {
          // Find patients currently assigned to this doctor
          const assignedPatients = patients.filter(
            (p) =>
              p?.caseFile?.assignedDoctorId === doc.id ||
              p?.caseFile?.assignedDoctorName?.toLowerCase() === doc.name.toLowerCase()
          );

          return (
            <div
              key={doc.id}
              id={`doctor-card-${doc.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Doctor Top Details */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#1d4ed8] text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                      {doc.avatarInitials}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{doc.name}</h3>
                      <p className="text-[11px] text-blue-800 font-semibold">{doc.department}</p>
                      <p className="text-[10px] text-slate-400">{doc.qualifications}</p>
                    </div>
                  </div>

                  {/* Availability Status Switcher */}
                  <select
                    value={doc.status}
                    onChange={(e) => onUpdateDoctorStatus(doc.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer ${
                      doc.status === 'available'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : doc.status === 'in-consultation'
                        ? 'bg-blue-50 text-[#1d4ed8] border-blue-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="available">Available</option>
                    <option value="in-consultation">In Consultation</option>
                    <option value="busy">Busy</option>
                    <option value="on-round">On Round</option>
                    <option value="break">Break</option>
                  </select>
                </div>

                {/* Room & Shift Info */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">Room Number</span>
                    <span className="font-bold text-slate-800">{doc.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">OPD Timings</span>
                    <span className="font-semibold text-slate-700">{doc.opdHours}</span>
                  </div>
                </div>

                {/* Assigned Queue Preview */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Assigned Patients ({assignedPatients.length}):
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ~{assignedPatients.length * 15}m wait
                    </span>
                  </div>

                  {assignedPatients.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {assignedPatients.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-blue-50/60 rounded border border-slate-200 text-xs transition-colors"
                        >
                          <div className="truncate">
                            <span className="font-bold text-slate-900">{p.fullName}</span>
                            <span className="text-slate-500 text-[10px] ml-1">({p.tokenNumber})</span>
                          </div>
                          <button
                            onClick={() => onOpenCaseFile(p)}
                            className="text-[10px] text-[#1d4ed8] hover:text-[#1e40af] font-semibold shrink-0 ml-2 cursor-pointer"
                          >
                            File →
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded text-center">
                      No patients currently in this doctor's queue
                    </p>
                  )}
                </div>
              </div>

              {/* Allot Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id={`allot-to-doc-${doc.id}`}
                  onClick={() => handleAllot(doc)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-white" />
                  <span>Allot Selected Patient to {doc.name.split(' ')[1] || doc.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
