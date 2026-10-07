import React from 'react';
import { Building2, BedDouble, CheckCircle2, User, Clock, Stethoscope, ArrowRight, ShieldCheck } from 'lucide-react';
import { Patient } from '../types';
import { HOSPITAL_WARDS, WardInfo } from '../data/wardAndShiftData';

interface WardsBedMapViewProps {
  patients: Patient[];
  onOpenCaseFile: (patient: Patient) => void;
  onNavigateToAdmitted: () => void;
  onOpenAddPatient: () => void;
  onAdmitToBed?: (wardId: string, bedNumber: string) => void;
}

export const WardsBedMapView: React.FC<WardsBedMapViewProps> = ({
  patients,
  onOpenCaseFile,
  onNavigateToAdmitted,
  onOpenAddPatient,
  onAdmitToBed,
}) => {
  // Map of bed -> admitted patient
  const bedOccupancyMap = React.useMemo(() => {
    const map: Record<string, Patient> = {};
    patients.forEach((p) => {
      if (p.admission?.isAdmitted && p.admission.bedNumber) {
        map[p.admission.bedNumber] = p;
      }
    });
    return map;
  }, [patients]);

  const totalBeds = HOSPITAL_WARDS.reduce((sum, w) => sum + w.beds.length, 0);
  const occupiedBeds = Object.keys(bedOccupancyMap).length;
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Stats Banner */}
      <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#1d4ed8] border border-blue-200">
              IPD Ward Management
            </span>
            <span className="text-xs text-slate-500">7 Active Hospital Wards</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Hospital Wards &amp; Bed Occupancy Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time visual map of all inpatients, allotted ward numbers, bed assignments, and currently vacant beds ready for admission.
          </p>
        </div>

        {/* Capacity Quick Meter */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Occupied</span>
            <span className="text-xl font-black text-emerald-600">{occupiedBeds} Beds</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Available</span>
            <span className="text-xl font-black text-[#1d4ed8]">{availableBeds} Beds</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Rate</span>
            <span className="text-xl font-black text-slate-900">{occupancyRate}%</span>
          </div>
        </div>
      </div>

      {/* Ward Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {HOSPITAL_WARDS.map((ward: WardInfo) => {
          const wardOccupiedBeds = ward.beds.filter((b) => !!bedOccupancyMap[b]);
          const wardOccupancyRate = Math.round((wardOccupiedBeds.length / ward.beds.length) * 100);

          return (
            <div
              key={ward.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
            >
              {/* Ward Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#1d4ed8] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ward.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{ward.floor}</span>
                      <span>•</span>
                      <span className="font-medium text-[#1d4ed8]">{ward.department}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${
                    wardOccupiedBeds.length === ward.beds.length
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : wardOccupiedBeds.length > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {wardOccupiedBeds.length} / {ward.beds.length} Occupied
                  </span>
                </div>
              </div>

              {/* Beds Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Beds in this Ward
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {ward.beds.map((bedId) => {
                    const patient = bedOccupancyMap[bedId];
                    if (patient) {
                      return (
                        <div
                          key={bedId}
                          onClick={() => onOpenCaseFile(patient)}
                          className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/80 cursor-pointer transition-all text-left group"
                          title={`Occupied by ${patient.fullName}. Click to view case file.`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-950 font-mono">
                              {bedId}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <p className="text-[11px] font-bold text-slate-900 truncate mt-1 group-hover:text-emerald-900">
                            {patient.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate font-mono">
                            {patient.mrn}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={bedId}
                        onClick={() => {
                          if (onAdmitToBed) {
                            onAdmitToBed(ward.id, bedId);
                          } else {
                            onOpenAddPatient();
                          }
                        }}
                        className="p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-emerald-50/80 hover:border-emerald-400 hover:shadow-2xs text-left flex flex-col justify-between transition-all cursor-pointer group"
                        title={`Bed ${bedId} is available. Click to admit patient.`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 font-mono group-hover:text-emerald-950">
                            {bedId}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium group-hover:text-emerald-700">Vacant</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold mt-1 block group-hover:underline">
                          + Admit Patient
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ward Footer Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  {ward.beds.length - wardOccupiedBeds.length} vacant bed slots
                </span>
                <button
                  type="button"
                  onClick={onNavigateToAdmitted}
                  className="text-[#1d4ed8] hover:text-[#1e40af] font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <span>View Admitted Inpatients</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
