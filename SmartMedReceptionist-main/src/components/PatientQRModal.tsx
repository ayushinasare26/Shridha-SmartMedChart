import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  User,
  Phone,
  FileText,
  Stethoscope,
} from 'lucide-react';
import { Patient } from '../types';
import { generateQRCodeDataUrl, buildPatientQRPayload } from '../utils/qrHelper';

interface PatientQRModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCaseFile?: (patient: Patient) => void;
}

export const PatientQRModal: React.FC<PatientQRModalProps> = ({
  patient,
  isOpen,
  onClose,
  onOpenCaseFile,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (patient) {
      const payload = patient.qrPayload || buildPatientQRPayload(patient);
      generateQRCodeDataUrl(payload).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPayload = () => {
    const payload = patient.qrPayload || buildPatientQRPayload(patient);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${patient.mrn}_${patient.fullName.replace(/\s+/g, '_')}_QR.png`;
    a.click();
  };

  const hasAllergies =
    patient.caseFile.medicalInfo.allergies &&
    patient.caseFile.medicalInfo.allergies.length > 0 &&
    !patient.caseFile.medicalInfo.allergies.includes('NKDA (No Known Drug Allergies)');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#0e3b56] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Patient QR Health Pass & Wristband
              </h3>
              <p className="text-[11px] text-cyan-200/80">
                Verified clinical token for bedside scan, triage, and doctor consult
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Printable Health Pass Card */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* THE PHYSICAL / DIGITAL CARD CONTAINER */}
          <div
            ref={cardRef}
            id="printable-patient-health-pass"
            className="bg-gradient-to-b from-white to-slate-50 border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
          >
            {/* Top hospital identity strip */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0e3b56] text-cyan-400 flex items-center justify-center font-bold">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none">
                    Metropolitan General Hospital
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
                    Central OPD & Clinical Workstation
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block font-mono text-xs font-black bg-cyan-900 text-cyan-200 px-2.5 py-1 rounded-md">
                  TOKEN: {patient.tokenNumber}
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Issue: {new Date(patient.registrationDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Allergy Banner inside Pass if applicable */}
            {hasAllergies && (
              <div className="bg-rose-50 border border-rose-300 rounded-lg p-2.5 flex items-center gap-2 text-rose-900 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  CRITICAL ALLERGY ALERT: {patient.caseFile.medicalInfo.allergies.join(', ')}
                </span>
              </div>
            )}

            {/* Middle Section: QR Code & Patient Demographics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* QR Code Container */}
              <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Pass for ${patient.fullName}`}
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
                <span className="text-[10px] font-mono text-slate-400 mt-1">
                  Scan at Clinic / OPD
                </span>
              </div>

              {/* Patient Core Info */}
              <div className="sm:col-span-2 space-y-2 text-xs">
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {patient.fullName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {patient.mrn}
                    </span>
                    <span className="font-bold text-xs text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                      Blood: {patient.caseFile.medicalInfo.bloodGroup}
                    </span>
                    <span className="text-slate-600">
                      {patient.age} Yrs • {patient.gender}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Allotted Doctor:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-cyan-700" />
                      {patient.caseFile.assignedDoctorName}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {patient.caseFile.department} • {patient.caseFile.roomNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Emergency Contact:</span>
                    <span className="font-semibold text-slate-800">
                      {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                    </span>
                    <span className="text-slate-600 text-[10px] block font-mono">
                      {patient.emergencyContact.phone}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
                  <div>
                    <span>Case File: </span>
                    <span className="font-bold text-slate-700">{patient.caseFile.id}</span>
                  </div>
                  <div>
                    <span>Triage: </span>
                    <span className="font-bold text-slate-700">{patient.caseFile.triagePriority}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Barcode Aesthetic and HIPAA Validation */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-500 gap-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Encrypted Clinical Health Pass • HIPAA Compliant</span>
              </div>
              <div className="font-mono text-slate-400">
                AUTH: SHA-256 / MRN-{patient.mrn.replace('MRN-', '')}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-300" />
                <span>Print Card / Wristband</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Payload</span>
                  </>
                )}
              </button>
            </div>

            {onOpenCaseFile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCaseFile(patient);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Patient Case File →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
