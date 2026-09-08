import React from 'react';
import { Clock, Phone, Stethoscope, ShieldCheck, CheckCircle2, Calendar, Users, AlertCircle } from 'lucide-react';
import { ShiftType } from '../types';
import {
  SHIFT_ASSISTANT_DOCTOR_ROSTER,
  SHIFT_TIMINGS,
  getCurrentActiveShift,
  ShiftRosterDoctor,
} from '../data/wardAndShiftData';

interface ShiftRosterViewProps {
  onOpenAddPatient: () => void;
}

export const ShiftRosterView: React.FC<ShiftRosterViewProps> = ({ onOpenAddPatient }) => {
  const currentShift = getCurrentActiveShift();
  const allShifts: ShiftType[] = ['Morning', 'Evening', 'Night'];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Shift Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0a233b] to-[#124b6d] text-white shadow-sm border border-cyan-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 font-mono">
              24/7 ROSTER
            </span>
            <span className="text-xs text-cyan-200">Continuous Clinical Cover</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Shift-Wise Assistant Medical Officer Roster
          </h2>
          <p className="text-xs text-cyan-100/80 mt-1 max-w-2xl">
            Round-the-clock shift assignments for Assistant Doctors and Medical Officers managing Inpatient Wards, Emergency Triage, and Night Telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-400/50 p-3 rounded-xl shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <span className="text-[10px] text-amber-200 uppercase font-bold block">Current Active Shift</span>
            <span className="text-sm font-black text-amber-300">
              {currentShift} Shift ({SHIFT_TIMINGS[currentShift]})
            </span>
          </div>
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {allShifts.map((shiftName) => {
          const isActive = shiftName === currentShift;
          const doctorsList = SHIFT_ASSISTANT_DOCTOR_ROSTER[shiftName] || [];

          return (
            <div
              key={shiftName}
              className={`rounded-2xl border bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                isActive
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Shift Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isActive
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{shiftName} Shift</h3>
                      <p className="text-[11px] font-mono text-slate-500 font-semibold">
                        {SHIFT_TIMINGS[shiftName]}
                      </p>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                      Live Now
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Scheduled</span>
                  )}
                </div>

                {/* Duty Doctors List */}
                <div className="mt-4 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Assigned Assistant Doctors
                  </span>

                  {doctorsList.map((doc: ShiftRosterDoctor) => (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                        isActive
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium pl-5">
                          {doc.designation}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-800 bg-white px-2 py-1 rounded-md border border-slate-200 shrink-0">
                        <Phone className="w-3 h-3 text-cyan-600" />
                        <span>{doc.contact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shift Responsibilities Note */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Shift Responsibilities:</span>
                </div>
                <p className="leading-relaxed">
                  {shiftName === 'Morning' && 'Conducts routine ward rounds, oversees newly admitted patients, and verifies OPD vitals.'}
                  {shiftName === 'Evening' && 'Manages handover notes, reviews lab investigations, and monitors post-op stable cases.'}
                  {shiftName === 'Night' && 'Continuous ICU/CCU bed monitoring, emergency intake triage, and on-call night telemetry.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
