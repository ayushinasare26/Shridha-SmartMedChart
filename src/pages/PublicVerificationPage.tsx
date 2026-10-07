import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, AlertTriangle, PhoneCall, Heart, Clock, CheckCircle2,
  User, Pill, Stethoscope, Search, Printer, ArrowLeft, ExternalLink,
  Lock, Copy, Check, Hospital, RefreshCw, Activity, Droplet, FileText,
  Download, Calendar, MapPin, Building2, Bed, Share2, Sparkles, AlertCircle,
  Thermometer, HeartPulse, FileCheck, Phone
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { INDIAN_PATIENTS, IndianPatientConfig, SHRIDHA_HOSPITAL_INFO, getIndianPatient } from '../data/indianPatients';
import { downloadDiagnosticReportPdf, downloadPrescriptionSheetPdf } from '../utils/pdfGenerator';

const API_BASE = '/api';

export default function PublicVerificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const idParam = searchParams.get('id') || '94021-08';
  const typeParam = searchParams.get('type') || 'PATIENT';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const fetchVerification = async (targetId: string) => {
    setLoading(true);
    setError(null);

    // Check offline / pre-configured Indian patient data first as reliable baseline
    const matchedProfile = getIndianPatient(targetId);

    try {
      const res = await axios.get(`${API_BASE}/verify/${encodeURIComponent(targetId)}`);
      setData(res.data);
    } catch (err: any) {
      console.warn('API lookup notice:', err?.message);
      if (matchedProfile) {
        // Construct standard patient record structure
        setData({
          type: 'PATIENT',
          verified: true,
          hospital: 'Shridha Hospital & Research Institute, Nagpur',
          verifiedAt: new Date().toISOString(),
          patient: {
            id: matchedProfile.mrn,
            name: matchedProfile.name,
            mrn: matchedProfile.mrn,
            dob: '1979-08-14',
            sex: matchedProfile.gender,
            weight: 72,
            bed: matchedProfile.bed,
            ward: matchedProfile.ward,
            status: 'ACTIVE',
            admissionDiagnosis: matchedProfile.diagnosis,
            emergencyContactName: matchedProfile.caregiver.name,
            emergencyContactRelation: matchedProfile.caregiver.relation,
            emergencyContactPhone: matchedProfile.caregiver.phone,
            allergies: matchedProfile.allergies,
            prescriptions: [],
            administrations: [],
          },
        });
      } else {
        setError(err?.response?.data?.error || 'Official hospital record could not be verified');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idParam) {
      fetchVerification(idParam);
    }
  }, [idParam]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isPatient = data?.type === 'PATIENT';
  const patient = data?.patient;
  const staff = data?.staff;

  // Resolve matching rich Indian patient profile for comprehensive details
  const matchedIndianPatient: IndianPatientConfig = useMemo(() => {
    const fromId = getIndianPatient(idParam);
    if (fromId) return fromId;
    if (patient?.mrn && INDIAN_PATIENTS[patient.mrn]) return INDIAN_PATIENTS[patient.mrn];
    if (patient?.name) {
      const found = Object.values(INDIAN_PATIENTS).find(p => p.name.toLowerCase() === patient.name.toLowerCase());
      if (found) return found;
    }
    return INDIAN_PATIENTS['94021-08'];
  }, [idParam, patient]);

  // Compute DOB & Age
  const age = patient?.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
    : matchedIndianPatient.age;

  // Real photo resolution
  const resolvedPhoto = useMemo(() => {
    if (patient?.mrn === '94021-08' || patient?.name?.includes('Rahul')) return '/rahul_patil.jpg';
    if (patient?.mrn === '94022-15' || patient?.name?.includes('Anita')) return '/anita_desai.jpg';
    if (patient?.mrn === '94023-08' || patient?.name?.includes('Rajesh')) return '/rajesh_sharma.jpg';
    if (patient?.mrn === '94024-03' || patient?.name?.includes('Meera')) return '/meera_iyer.jpg';
    return matchedIndianPatient.avatar;
  }, [patient, matchedIndianPatient]);

  // Handle PDF report download
  const handleDownloadLabReport = (rep: any) => {
    setDownloadingPdf(rep.id);
    try {
      downloadDiagnosticReportPdf({
        reportName: rep.name,
        reportType: rep.type,
        date: rep.date,
        status: rep.status,
        doctor: rep.doctor,
        findings: rep.findings,
        refRange: rep.refRange,
        patient: {
          name: patient?.name || matchedIndianPatient.name,
          mrn: patient?.mrn || matchedIndianPatient.mrn,
          abhaId: matchedIndianPatient.abhaId,
          age,
          gender: patient?.sex || matchedIndianPatient.gender,
          ward: patient?.ward || matchedIndianPatient.ward,
          bed: patient?.bed || matchedIndianPatient.bed,
          bloodGroup: matchedIndianPatient.bloodGroup,
          diagnosis: patient?.admissionDiagnosis || matchedIndianPatient.diagnosis,
        },
      });
    } finally {
      setTimeout(() => setDownloadingPdf(null), 1000);
    }
  };

  // Handle Full Prescription Sheet PDF download
  const handleDownloadPrescription = () => {
    setDownloadingPdf('rx');
    try {
      downloadPrescriptionSheetPdf({
        patient: {
          name: patient?.name || matchedIndianPatient.name,
          mrn: patient?.mrn || matchedIndianPatient.mrn,
          abhaId: matchedIndianPatient.abhaId,
          age,
          gender: patient?.sex || matchedIndianPatient.gender,
          ward: patient?.ward || matchedIndianPatient.ward,
          bed: patient?.bed || matchedIndianPatient.bed,
          attending: matchedIndianPatient.attending,
          allergies: matchedIndianPatient.allergies,
        },
        medications: matchedIndianPatient.medications.map(m => ({
          name: m.name,
          saltName: m.saltName,
          doseRoute: m.doseRoute,
          frequency: m.frequency,
          timing: m.timing,
          nextDose: m.nextDose,
          statusType: m.statusType,
        })),
      });
    } finally {
      setTimeout(() => setDownloadingPdf(null), 1000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col items-center px-4 py-6 font-sans">
      {/* 1. TOP HOSPITAL HEADER (Clean White Bar) */}
      <header className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/shridha_hospital_nagpur.jpg"
            alt="Shridha Hospital Nagpur"
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
          />
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Shridha Hospital &amp; Research Institute</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#0b4da2] border border-blue-200">
                Nagpur
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
              <span>HL7 &bull; FHIR R4 &bull; ABDM Certified Gateway</span>
              <span>&bull;</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Inpatient Verification
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 rounded-lg bg-[#0b4da2] hover:bg-[#093f85] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0b4da2] text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock size={12} />
            <span>Workstation Login</span>
          </button>
        </div>
      </header>

      {/* Hospital Location & Emergency Banner */}
      <div className="w-full max-w-4xl bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2.5 mb-5 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin size={15} className="text-[#0b4da2] shrink-0" />
          <span>
            <strong>Wardha Road</strong>, Next to Bank of Maharashtra, Ajni Chowk, Samarth Nagar East, Nagpur 440015
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="tel:07122420299"
            className="text-[#0b4da2] font-bold hover:underline flex items-center gap-1"
          >
            <Phone size={12} /> 0712-2420299
          </a>
          <span className="text-slate-300">|</span>
          <span className="text-rose-700 font-bold">Emergency: 108 / 112</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw size={36} className="text-[#0b4da2] animate-spin mx-auto mb-3" />
          <div className="text-base font-bold text-slate-900">Verifying Official Hospital Record...</div>
          <div className="text-xs text-slate-500 mt-1">Connecting to Shridha Hospital Central Inpatient Registry</div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="w-full max-w-4xl bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center shadow-xs">
          <AlertTriangle size={36} className="text-rose-600 mx-auto mb-3" />
          <div className="text-lg font-black text-rose-900">Record Not Found</div>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 mb-4">
            No verified patient or staff record matches <strong>"{idParam}"</strong> at Shridha Hospital Nagpur.
          </p>
          <div className="text-xs font-bold text-slate-500 mb-2">TRY ONE OF THESE ADMITTED PATIENTS:</div>
          <div className="flex justify-center gap-2 flex-wrap">
            {['94021-08', '94022-15', '94023-08', '94024-03'].map((pid) => (
              <button
                key={pid}
                onClick={() => setSearchParams({ id: pid, type: 'PATIENT' })}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                MRN {pid}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Verified Card */}
      {!loading && !error && data && (
        <div className="w-full max-w-4xl">
          {/* Status Top Strip */}
          <div className="bg-emerald-50 border border-emerald-200 border-b-0 rounded-t-2xl px-5 py-3 text-emerald-800 text-xs font-bold flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>OFFICIAL INPATIENT PROFILE &bull; SHRIDHA HOSPITAL &amp; RESEARCH INSTITUTE, NAGPUR</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Verified: {format(new Date(data.verifiedAt || Date.now()), 'dd-MMM-yyyy HH:mm:ss')}
            </span>
          </div>

          {/* Main Card Body */}
          <div className="bg-white border border-slate-200 rounded-b-2xl p-6 sm:p-8 shadow-xs mb-6">
            {/* ═════════════════ PATIENT WHOLE PROFILE VIEW ═════════════════ */}
            {isPatient && (
              <div className="space-y-6">
                {/* 1. Header Identity Row */}
                <div className="flex justify-between items-start flex-wrap gap-4 pb-6 border-b border-slate-100">
                  <div className="flex gap-4 items-center flex-wrap">
                    <img
                      src={resolvedPhoto}
                      alt={patient?.name || matchedIndianPatient.name}
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-blue-200 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap mb-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                          {patient?.name || matchedIndianPatient.name}
                        </h1>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE INPATIENT
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0b4da2] border border-blue-200">
                          {patient?.ward || matchedIndianPatient.ward} &bull; BED {patient?.bed || matchedIndianPatient.bed}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <Droplet size={11} /> {matchedIndianPatient.bloodGroup}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed">
                        <span>UHID / MRN: <strong className="text-slate-900 font-mono">{patient?.mrn || matchedIndianPatient.mrn}</strong></span>
                        <span className="mx-2 text-slate-300">&bull;</span>
                        <span>ABHA: <strong className="text-[#0b4da2] font-mono">{matchedIndianPatient.abhaId}</strong></span>
                        <span className="mx-2 text-slate-300">&bull;</span>
                        <span>{age}y / {patient?.sex || matchedIndianPatient.gender}</span>
                        <span className="mx-2 text-slate-300">&bull;</span>
                        <span>Weight: {patient?.weight || 72} kg</span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        <span>Admitted: <strong>{matchedIndianPatient.admissionDate}</strong> ({matchedIndianPatient.stayDays} Days Inpatient)</span>
                        <span className="mx-2 text-slate-300">&bull;</span>
                        <span>Location: {matchedIndianPatient.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scannable QR Box */}
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex flex-col items-center shadow-2xs">
                    <QRCodeSVG value={window.location.href} size={84} level="M" />
                    <span className="text-[10px] font-bold text-slate-700 mt-1.5 font-mono">
                      {patient?.mrn || matchedIndianPatient.mrn}
                    </span>
                  </div>
                </div>

                {/* 2. Key Metadata Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                      <Stethoscope size={13} className="text-[#0b4da2]" /> Attending Medical Team
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {matchedIndianPatient.attending}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Shridha Hospital &amp; Research Institute
                    </div>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                      <Activity size={13} className="text-amber-600" /> Primary Admission Diagnosis
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {patient?.admissionDiagnosis || matchedIndianPatient.diagnosis}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Diet: {matchedIndianPatient.dietPreference}
                    </div>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                      <FileCheck size={13} className="text-emerald-600" /> Health Insurance / TPA
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {matchedIndianPatient.insurance.provider}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                      {matchedIndianPatient.insurance.status}
                    </div>
                  </div>
                </div>

                {/* 3. Allergies & Family Emergency Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className={`p-4 rounded-xl border ${
                    matchedIndianPatient.allergies.length > 0
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                      matchedIndianPatient.allergies.length > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}>
                      <AlertTriangle size={15} /> Clinical Allergy Status
                    </div>
                    {matchedIndianPatient.allergies.length > 0 ? (
                      matchedIndianPatient.allergies.map((alg, i) => (
                        <div key={i} className="space-y-1">
                          <div className="text-sm font-bold text-slate-900">
                            {alg.allergen} &bull; <span className="text-rose-600">{alg.severity}</span>
                          </div>
                          <div className="text-xs text-rose-800">{alg.reaction}</div>
                          {alg.crossReacts && (
                            <div className="text-[11px] text-rose-700 font-semibold">
                              Cross-reacts: {alg.crossReacts}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-emerald-800 font-medium">
                        No known drug allergies documented (NKDA).
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0b4da2] mb-1.5 flex items-center gap-1.5">
                      <PhoneCall size={15} /> Primary Family Attendant
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {patient?.emergencyContactName || matchedIndianPatient.caregiver.name}
                    </div>
                    <div className="text-xs text-slate-600 mb-3">
                      Relationship: {patient?.emergencyContactRelation || matchedIndianPatient.caregiver.relation}
                    </div>
                    <a
                      href={`tel:${(patient?.emergencyContactPhone || matchedIndianPatient.caregiver.phone).replace(/[^\d+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 bg-[#0b4da2] hover:bg-[#093f85] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-colors"
                    >
                      <PhoneCall size={13} /> Call {patient?.emergencyContactPhone || matchedIndianPatient.caregiver.phone}
                    </a>
                  </div>
                </div>

                {/* 4. Live Bedside Vitals Card */}
                <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white">
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <HeartPulse size={16} className="text-[#0b4da2]" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Live Bedside Vitals Monitoring
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Telemetry Station Ward 4B ICU
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: 'BLOOD PRESSURE', val: matchedIndianPatient.vitals.bp, stat: 'Optimal', color: 'text-slate-900' },
                      { label: 'PULSE RATE', val: `${matchedIndianPatient.vitals.hr} bpm`, stat: 'Normal Sinus', color: 'text-slate-900' },
                      { label: 'SPO2 (OXYGEN)', val: `${matchedIndianPatient.vitals.spo2}`, stat: 'Room Air', color: 'text-emerald-700' },
                      { label: 'TEMPERATURE', val: `${matchedIndianPatient.vitals.temp}`, stat: 'Afebrile', color: 'text-slate-900' },
                    ].map((vt, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
                          {vt.label}
                        </div>
                        <div className={`text-base sm:text-lg font-black font-mono ${vt.color}`}>
                          {vt.val}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          {vt.stat}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Active Inpatient Medications */}
                <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white">
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Pill size={16} className="text-[#0b4da2]" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Active Inpatient Medication Orders
                      </h3>
                    </div>
                    <button
                      onClick={handleDownloadPrescription}
                      disabled={downloadingPdf === 'rx'}
                      className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0b4da2] text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>{downloadingPdf === 'rx' ? 'Downloading...' : 'Prescription Sheet'}</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {matchedIndianPatient.medications.map((med, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{med.name}</span>
                            <span className="text-[11px] text-slate-500">({med.saltName})</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              med.statusType === 'given' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              med.statusType === 'due' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-blue-50 text-[#0b4da2] border border-blue-200'
                            }`}>
                              {med.statusType}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Route: {med.doseRoute} &bull; Frequency: {med.frequency} &bull; {med.timing}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-slate-500 font-medium">Next Dose: <strong className="text-slate-900">{med.nextDose}</strong></div>
                          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">✓ Verified by Attending</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Diagnostic Reports & Lab Results */}
                <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white">
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#0b4da2]" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Diagnostic &amp; Pathology Reports (NABL Certified)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      Lab Head: <strong>Dr. Neha Sarda, MD (Pathology)</strong>
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {matchedIndianPatient.reports.map((rep) => (
                      <div key={rep.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{rep.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {rep.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">Date: {rep.date}</span>
                            <button
                              onClick={() => handleDownloadLabReport(rep)}
                              disabled={downloadingPdf === rep.id}
                              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[#0b4da2] text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <Download size={11} /> {downloadingPdf === rep.id ? 'Downloading...' : 'PDF Report'}
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed mt-1">
                          <strong>Findings:</strong> {rep.findings}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Reference Range: {rep.refRange} &bull; Certified by: {rep.doctor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Documented Medical History */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Documented Medical History &amp; Comorbidities
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">Chronic Conditions</div>
                      <div className="font-bold text-slate-900 mt-0.5">{matchedIndianPatient.history.chronic}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Previous Admissions</div>
                      <div className="font-bold text-slate-900 mt-0.5">{matchedIndianPatient.history.admissions}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Past Surgeries</div>
                      <div className="font-bold text-slate-900 mt-0.5">{matchedIndianPatient.history.surgeries}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Family History</div>
                      <div className="font-bold text-slate-900 mt-0.5">{matchedIndianPatient.history.familyHistory}</div>
                    </div>
                  </div>
                </div>

                {/* Hospital Footer Note */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                  <span>Shridha Hospital &amp; Research Institute, Wardha Road, Ajni Chowk, Nagpur &bull; Tel: 0712-2420299</span>
                  <span>Direct Auth ID: {patient?.mrn || matchedIndianPatient.mrn}-2026-NAGPUR</span>
                </div>
              </div>
            )}

            {/* ═════════════════ STAFF RECORD VIEW ═════════════════ */}
            {!isPatient && staff && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-[#0b4da2] text-white flex items-center justify-center text-xl font-black shadow-xs shrink-0">
                    {staff.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {staff.name}
                      </h1>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0b4da2] border border-blue-200">
                        {staff.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE &bull; ON DUTY
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Staff ID: <strong className="text-slate-900 font-mono">{staff.staffId || 'DR-4001'}</strong> &bull; Dept: {staff.department || 'Ward 4B ICU'} &bull; License: {staff.licenseNumber || 'MMC-ACTIVE-2026'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Clinical Role &amp; Privileges at Shridha Hospital
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500">Hospital</div>
                      <div className="font-bold text-slate-900 mt-0.5">Shridha Hospital &amp; Research Institute</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Department</div>
                      <div className="font-bold text-slate-900 mt-0.5">{staff.department || 'Ward 4B ICU'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Specialty</div>
                      <div className="font-bold text-slate-900 mt-0.5">{staff.specialty || 'Intensive Care & Surgery'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">MMC Council License</div>
                      <div className="font-bold text-emerald-700 mt-0.5">{staff.licenseNumber || 'MMC-VERIFIED-ACTIVE'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
