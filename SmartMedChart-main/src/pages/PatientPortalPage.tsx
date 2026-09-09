import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/api.services';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, Heart, Pill, AlertTriangle, Clock, CheckCircle2,
  Calendar, User, Activity, LogOut, QrCode, Stethoscope,
  Info, ChevronRight, FileText, Lock, X, Download,
  Phone, PhoneCall, Edit2, Copy, Check, Users, ExternalLink,
  Search, Bell, Settings, ChevronDown, MessageSquare, AlertCircle,
  FlaskConical, HelpCircle, FileCheck, Building2, Bed, ArrowRight,
  TrendingUp, RefreshCw, Send, CheckCircle, UserCheck, Droplet,
  HeartPulse, Thermometer, ShieldAlert, Award, CreditCard, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { downloadDiagnosticReportPdf, downloadPrescriptionSheetPdf, downloadConsentCertificatePdf } from '../utils/pdfGenerator';
import { subscribeToSync, getSyncedPrescriptions, getSyncedSchedules } from '../utils/syncStore';

import { IndianPatientConfig, INDIAN_PATIENTS, SHRIDHA_HOSPITAL_INFO, getIndianPatient } from '../data/indianPatients';

export default function PatientPortalPage() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef<SVGSVGElement>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Active sidebar nav
  const [activeNav, setActiveNav] = useState('Home');

  // Tabs state
  const [medicineTab, setMedicineTab] = useState<'current' | 'today' | 'recent' | 'stopped'>('current');
  const [timelineTab, setTimelineTab] = useState<'all' | 'given' | 'due' | 'upcoming'>('all');
  const [testsTab, setTestsTab] = useState<'lab' | 'imaging'>('lab');

  // Interactive Modal States (Now fully functional!)
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showMedUpdateModal, setShowMedUpdateModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showPatientSwitcherModal, setShowPatientSwitcherModal] = useState(false);

  // NEW DEDICATED WORKING MODALS
  const [showVitalsTrendsModal, setShowVitalsTrendsModal] = useState(false);
  const [showMedCatalogModal, setShowMedCatalogModal] = useState(false);
  const [showFullScheduleModal, setShowFullScheduleModal] = useState(false);
  const [showAllReportsModal, setShowAllReportsModal] = useState(false);
  const [showHealthHistoryModal, setShowHealthHistoryModal] = useState(false);
  const [showStayDetailsModal, setShowStayDetailsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEmergencyGuideModal, setShowEmergencyGuideModal] = useState(false);
  const [showCaregiverModal, setShowCaregiverModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentEhr, setConsentEhr] = useState(true);
  const [consentAbhaSync, setConsentAbhaSync] = useState(true);
  const [consentCaregiver, setConsentCaregiver] = useState(true);
  const [consentEmergency, setConsentEmergency] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Action form inputs
  const [actionInput, setActionInput] = useState('');
  const [actionSubmitted, setActionSubmitted] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch current patient record from DB
  const patientId = user?.patientId || user?.id || '';
  const { data: dbPatient, refetch } = useQuery({
    queryKey: ['patient-my-record', patientId],
    queryFn: () => patientService.getById(patientId || 'me'),
    enabled: !!patientId,
    refetchInterval: 10000,
  });

  // Cross-tab & multi-station live synchronization
  useEffect(() => {
    const unsub = subscribeToSync(() => refetch());
    const handleMedAdministered = () => refetch();
    window.addEventListener('smartmed:medication_administered', handleMedAdministered);
    return () => {
      unsub();
      window.removeEventListener('smartmed:medication_administered', handleMedAdministered);
    };
  }, [refetch]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Quick switcher between Indian admitted patients
  const handleSwitchPatient = async (targetMrn: string) => {
    try {
      await login({ mrn: targetMrn, pin: '1234', isPatient: true });
      setShowPatientSwitcherModal(false);
      setShowProfileMenu(false);
      showToast(`Switched portal view to ${INDIAN_PATIENTS[targetMrn]?.name || targetMrn}`);
      refetch();
    } catch {
      showToast('Could not switch patient automatically.');
    }
  };

  // ─── RESOLVE CURRENT PATIENT DATA DYNAMICALLY ──────────────────────────────
  const currentMrn = dbPatient?.mrn || user?.mrn || '94021-08';
  const defaultProfile = INDIAN_PATIENTS[currentMrn] || INDIAN_PATIENTS['94021-08'];

  // Calculate age from DOB if present
  const calculatedAge = dbPatient?.dob
    ? Math.floor((Date.now() - new Date(dbPatient.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
    : defaultProfile.age;

  // Resolve dynamic avatar: pick specific photo if available
  const resolvedAvatar = useMemo(() => {
    if (currentMrn === '94021-08' || dbPatient?.name?.includes('Rahul')) return '/rahul_patil.jpg';
    if (currentMrn === '94022-15' || dbPatient?.name?.includes('Anita')) return '/anita_desai.jpg';
    if (currentMrn === '94023-08' || dbPatient?.name?.includes('Rajesh')) return '/rajesh_sharma.jpg';
    if (currentMrn === '94024-03' || dbPatient?.name?.includes('Meera')) return '/meera_iyer.jpg';
    return defaultProfile.avatar;
  }, [currentMrn, dbPatient, defaultProfile]);

  // Clean ward and bed names (Preventing duplicated "Ward Ward" bug)
  const cleanWardName = useMemo(() => {
    const raw = (dbPatient?.ward?.name || defaultProfile.ward || '').trim();
    // Strip ANY and ALL repeated "Ward" words at the start
    const stripped = raw.replace(/^(Ward\s*)+/i, '');
    return stripped ? `Ward ${stripped}` : 'Ward 4B ICU';
  }, [dbPatient, defaultProfile]);

  const cleanBedNumber = useMemo(() => {
    const raw = String(dbPatient?.bed || defaultProfile.bed || '14').trim();
    const stripped = raw.replace(/^(Bed\s*)+/i, '').replace(/^ICU-/, '');
    return stripped || '14';
  }, [dbPatient, defaultProfile]);

  // Generate scannable QR URL pointing to the live patient profile
  const getPatientProfileUrl = (mrn: string) => {
    if (typeof window === 'undefined') return `http://10.17.114.233:5173/verify?id=${encodeURIComponent(mrn)}`;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const host = isLocal ? `10.17.114.233:${window.location.port || '5173'}` : window.location.host;
    const proto = window.location.protocol || 'http:';
    return `${proto}//${host}/verify?id=${encodeURIComponent(mrn)}`;
  };

  // Merge DB data with profile details
  const activePatient = useMemo(() => {
    return {
      mrn: dbPatient?.mrn || defaultProfile.mrn,
      abhaId: defaultProfile.abhaId,
      name: dbPatient?.name || defaultProfile.name,
      avatar: resolvedAvatar,
      age: calculatedAge,
      gender: dbPatient?.sex || defaultProfile.gender,
      bloodGroup: defaultProfile.bloodGroup,
      ward: cleanWardName,
      bed: cleanBedNumber,
      admissionDate: defaultProfile.admissionDate,
      stayDays: defaultProfile.stayDays,
      diagnosis: dbPatient?.admissionDiagnosis || defaultProfile.diagnosis,
      attending: defaultProfile.attending,
      location: defaultProfile.location,
      dietPreference: defaultProfile.dietPreference,
      insurance: defaultProfile.insurance,
      allergies: dbPatient?.allergies && dbPatient.allergies.length > 0
        ? dbPatient.allergies
        : defaultProfile.allergies,
      vitals: defaultProfile.vitals,
      caregiver: {
        name: dbPatient?.emergencyContactName || defaultProfile.caregiver.name,
        relation: dbPatient?.emergencyContactRelation || defaultProfile.caregiver.relation,
        phone: dbPatient?.emergencyContactPhone || defaultProfile.caregiver.phone,
        initials: (dbPatient?.emergencyContactName || defaultProfile.caregiver.name)
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      },
      medUpdate: defaultProfile.medUpdate,
      medications: (() => {
        const localPrxs = getSyncedPrescriptions(currentMrn);
        const dbPrxs = dbPatient?.prescriptions || [];
        const allPrxs = [...dbPrxs, ...localPrxs.filter((lp: any) => !dbPrxs.some((dp: any) => dp.id === lp.id))];

        const dynamicMeds = allPrxs.map((prx: any) => ({
          id: prx.id,
          name: prx.medicationName,
          subtitle: `${prx.dose}${prx.unit} · ${prx.route}`,
          category: prx.isStatOrder ? 'stat' : 'regular',
          statusType: prx.status === 'COMPLETED' ? 'given' : prx.status === 'HELD' ? 'stopped' : 'due',
          scheduleTimes: ['08:00 AM', '02:00 PM', '08:00 PM'],
          dosageText: `${prx.dose} ${prx.unit} via ${prx.route}`,
          instructions: prx.indication || 'Administer as ordered by attending clinician',
          saltName: prx.genericName || prx.medicationName,
          prescribedBy: prx.prescriber?.name || 'Dr. Sharma, MD',
          badge: prx.isStatOrder ? 'STAT DOSE' : 'Active Clinical Rx',
          colorClass: prx.isStatOrder ? 'rose' : 'blue',
        }));

        return [
          ...dynamicMeds,
          ...defaultProfile.medications.filter(m => !dynamicMeds.some(dm => dm.name.toLowerCase().includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(dm.name.toLowerCase()))),
        ];
      })(),
      timeline: (() => {
        const localSchedules = getSyncedSchedules(currentMrn);
        const dynamicTimeline = localSchedules
          .filter((s: any) => s.status === 'GIVEN')
          .map((s: any) => ({
            id: `tl-${s.id}`,
            time: format(new Date(s.administeredAt || s.scheduledTime || Date.now()), 'hh:mm a'),
            title: `${s.prescription?.medicationName || 'Medication'} Administered`,
            subtitle: `${s.dose || ''}${s.doseUnit || ''} · ${s.route || ''}`,
            status: 'Given',
            statusClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            nurse: s.administeredBy?.name || 'Nurse Priya, RN',
            verified: true,
          }));

        return [
          ...dynamicTimeline,
          ...defaultProfile.timeline,
        ];
      })(),
      reports: defaultProfile.reports,
      notifications: defaultProfile.notifications,
      history: defaultProfile.history,
    };
  }, [dbPatient, defaultProfile, calculatedAge, resolvedAvatar, cleanWardName, cleanBedNumber, currentMrn]);

  // QR Code download handler
  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    try {
      const svg = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
        }
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `ShridhaHospital_QR_${activePatient.mrn}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        showToast('QR Code downloaded successfully!');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      showToast('Could not auto-download image, right-click QR code to save.');
    }
  };

  // Filtered medications by tab and search
  const filteredMeds = useMemo(() => {
    let list = activePatient.medications;
    if (medicineTab === 'current') {
      list = list.filter(m => m.statusType === 'due' || m.statusType === 'upcoming');
    } else if (medicineTab === 'today') {
      list = list.filter(m => m.category !== 'stopped');
    } else if (medicineTab === 'recent') {
      list = list.filter(m => m.statusType === 'given');
    } else if (medicineTab === 'stopped') {
      list = list.filter(m => m.statusType === 'stopped');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q) || m.saltName.toLowerCase().includes(q));
    }
    return list;
  }, [activePatient.medications, medicineTab, searchQuery]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (timelineTab === 'all') return activePatient.timeline;
    return activePatient.timeline.filter(i => i.status.toLowerCase() === timelineTab);
  }, [activePatient.timeline, timelineTab]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return activePatient.reports.filter(r => r.type === testsTab);
  }, [activePatient.reports, testsTab]);

  // Navigation Items
  const navItems = [
    { name: 'Home', icon: Activity },
    { name: 'My Profile', icon: User, action: () => setShowProfileModal(true) },
    { name: 'My Health', icon: Heart, action: () => setShowVitalsTrendsModal(true) },
    { name: 'My Medicines', icon: Pill, action: () => setShowMedCatalogModal(true) },
    { name: 'Tests & Reports', icon: FlaskConical, action: () => setShowAllReportsModal(true) },
    { name: 'Hospital Stay', icon: Building2, action: () => setShowStayDetailsModal(true) },
    { name: 'Appointments', icon: Calendar, action: () => setShowActionModal('appointment') },
    { name: 'Care Team', icon: Stethoscope, action: () => setShowActionModal('careteam') },
    { name: 'Documents', icon: FileText, action: () => setShowActionModal('records') },
    { name: 'Family & Caregiver', icon: Users, action: () => setShowCaregiverModal(true) },
    { name: 'Notifications', icon: Bell, action: () => setShowNotificationsModal(true) },
    { name: 'Help & Support', icon: HelpCircle, action: () => setShowActionModal('question') },
    { name: 'Privacy & Consent', icon: Lock, action: () => setShowConsentModal(true) },
  ];

  // Primary Allergy for Alert Box
  const primaryAllergy = activePatient.allergies[0];

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle className="text-emerald-400" size={20} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVBAR
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-xs">
        {/* Hospital Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
            </svg>
          </div>
          <div>
            <div className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
              <span>Shridha Hospital &amp; Research Institute</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Nagpur
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
              Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Nagpur - 440015 &bull; Tel: 0712-2420299
            </div>
          </div>
        </div>


        {/* Right User Controls */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {activePatient.notifications.length}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => showToast('ABHA Profile & Language settings loaded')}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <img
                src={activePatient.avatar}
                alt={activePatient.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {activePatient.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Patient</div>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{activePatient.name}</div>
                  <div className="text-[11px] text-slate-500">UHID: {activePatient.mrn} &bull; ABHA: {activePatient.abhaId}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1.5">
                    <span>● Inpatient:</span>
                    <span className="flex items-center gap-0.5 text-purple-700 font-bold"><Building2 size={11} className="text-purple-500" /> {activePatient.ward}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-0.5 text-indigo-700 font-bold"><Bed size={11} className="text-indigo-500" /> Bed {activePatient.bed}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setShowProfileMenu(false); setShowProfileModal(true); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                >
                  <User size={14} className="text-slate-400" /> View Full Profile &amp; ABHA ID
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); setShowActionModal('records'); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText size={14} className="text-slate-400" /> Medical Documents
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); setShowAllergyModal(true); }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                >
                  <AlertTriangle size={14} className="text-rose-500" /> Allergy Registry
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN THREE-COLUMN BODY
      ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex w-full max-w-[1720px] mx-auto p-4 md:p-5 gap-5">
        
        {/* ─── LEFT SIDEBAR ────────────────────────────────────────── */}
        <aside className="w-56 shrink-0 hidden lg:flex flex-col justify-between">
          <nav className="space-y-0.5 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveNav(item.name);
                    if (item.action) item.action();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Hospital Graphic Card */}
          <div className="mt-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <div className="overflow-hidden rounded-xl border border-slate-100 mb-2.5">
              <img
                src="/shridha_hospital.jpg"
                alt="Shridha Hospital and Research Institute, Nagpur"
                className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Shridha Hospital &amp; Research Institute</div>
            <div className="text-[11px] font-semibold text-blue-700 mt-0.5">Wardha Road, Nagpur</div>
            <div className="text-[10px] text-slate-500 mt-1 leading-snug">
              Near Ajni Metro Station &amp; Ajni Chowk, Samarth Nagar East
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-600 font-medium">
              <Phone size={11} className="text-emerald-600" />
              <span>0712-2420299</span>
              <span className="text-slate-300">&bull;</span>
              <span>093735 10580</span>
            </div>
            <div className="text-[9px] text-emerald-700 font-bold bg-emerald-50 py-0.5 rounded mt-1.5 border border-emerald-100">
              NABH &bull; NABL &bull; PM-JAY Empanelled
            </div>
          </div>
        </aside>

        {/* ─── CENTER CONTENT AREA ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-4">
          
          {/* Patient Greeting & Info Card */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={activePatient.avatar}
                alt={activePatient.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-50 shadow-sm shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                  <span>Good Morning,</span>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    ABHA: {activePatient.abhaId}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {activePatient.name}
                </h1>
                
                {/* Meta details chips with separate Ward and Bed icons */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-600 mt-1.5 font-medium">
                  <span className="flex items-center gap-1 text-slate-700">
                    <User size={13} className="text-slate-400" /> Age: {activePatient.age} | {activePatient.gender}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Droplet size={13} className="text-rose-500" /> Blood Group: {activePatient.bloodGroup}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <FileText size={13} className="text-blue-500" /> UHID: {activePatient.mrn}
                  </span>
                  <span className="text-slate-300">•</span>
                  {/* Clean Ward without duplicated "Ward" */}
                  <span className="flex items-center gap-1 text-slate-700">
                    <Building2 size={13} className="text-purple-500" /> {activePatient.ward}
                  </span>
                  <span className="text-slate-300">•</span>
                  {/* Clean Bed */}
                  <span className="flex items-center gap-1 text-slate-700">
                    <Bed size={13} className="text-indigo-500" /> Bed: {activePatient.bed}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Calendar size={13} className="text-slate-400" /> Admitted: {activePatient.admissionDate}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <User size={14} />
              <span>View Profile</span>
            </button>
          </section>

          {/* 4 Stat Summary Cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* 1. Today's Medicines */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Pill size={18} />
                </div>
                <button
                  onClick={() => setShowMedCatalogModal(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  View all →
                </button>
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today's Medicines</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {activePatient.medications.filter(m => m.category !== 'stopped').length}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {activePatient.medications.filter(m => m.statusType === 'given').length} given •{' '}
                  {activePatient.medications.filter(m => m.statusType === 'upcoming' || m.statusType === 'due').length} upcoming
                </div>
              </div>
            </div>

            {/* 2. Pending Tests */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FlaskConical size={18} />
                </div>
                <button
                  onClick={() => setShowAllReportsModal(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  View Reports →
                </button>
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Tests</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {activePatient.reports.filter(r => r.status === 'Pending').length || 1}
                </div>
                <div className="text-[11px] text-purple-600 font-semibold mt-0.5">
                  {activePatient.reports.length} total diagnostics
                </div>
              </div>
            </div>

            {/* 3. Next Appointment */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <button
                  onClick={() => setShowActionModal('appointment')}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  View Details →
                </button>
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Next Appointment</div>
                <div className="text-base font-black text-slate-900 mt-0.5 truncate">Today, 4:00 PM</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-0.5 truncate">
                  {activePatient.attending}
                </div>
              </div>
            </div>

            {/* 4. Recent Updates */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <button
                  onClick={() => setShowNotificationsModal(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  View Notifications →
                </button>
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recent Updates</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{activePatient.notifications.length} new</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
                  Updated just now
                </div>
              </div>
            </div>
          </section>

          {/* Medication Update Alert Banner */}
          {activePatient.medUpdate && (
            <section className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                    <span>{activePatient.medUpdate.title}</span>
                  </div>
                  <div className="text-xs text-rose-800 font-medium mt-0.5">
                    {activePatient.medUpdate.desc}
                  </div>
                  <div className="text-[11px] text-rose-700 font-semibold mt-1 flex flex-wrap items-center gap-2">
                    <span className="bg-rose-100/80 px-2 py-0.5 rounded-md">Previous: {activePatient.medUpdate.prev}</span>
                    <span className="bg-rose-200/80 px-2 py-0.5 rounded-md">New: {activePatient.medUpdate.curr}</span>
                    <span>Effective from: {activePatient.medUpdate.eff}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowMedUpdateModal(true)}
                className="self-start sm:self-center px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-100/50 shadow-2xs transition-colors shrink-0"
              >
                View Details →
              </button>
            </section>
          )}

          {/* My Medicines Section Card */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Pill className="text-blue-600" size={18} />
                <h2 className="text-base font-bold text-slate-900">My Medicines</h2>
              </div>
              <button
                onClick={() => setShowMedCatalogModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                View all →
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 pt-3 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              {[
                { key: 'current', label: `Current (${activePatient.medications.filter(m => m.statusType === 'due' || m.statusType === 'upcoming').length})` },
                { key: 'today', label: `Today's Schedule (${activePatient.medications.filter(m => m.category !== 'stopped').length})` },
                { key: 'recent', label: `Recently Given (${activePatient.medications.filter(m => m.statusType === 'given').length})` },
                { key: 'stopped', label: `Stopped (${activePatient.medications.filter(m => m.statusType === 'stopped').length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMedicineTab(tab.key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    medicineTab === tab.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Medicines Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/70">
                    <th className="py-2.5 px-4">Medicine &amp; Salt</th>
                    <th className="py-2.5 px-4">Dose &amp; Route</th>
                    <th className="py-2.5 px-4">Frequency &amp; Timing</th>
                    <th className="py-2.5 px-4">Next Dose</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredMeds.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${med.iconColor}`}>
                            <Pill size={12} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{med.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{med.saltName}</div>
                            <div className="text-[10px] text-slate-400">{med.subtitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{med.doseRoute}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{med.frequency}</div>
                        <div className="text-[10px] text-slate-400">{med.timing}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{med.nextDose}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${med.badgeColor}`}>
                          {med.statusType === 'due' && '● Due'}
                          {med.statusType === 'upcoming' && '● Upcoming'}
                          {med.statusType === 'given' && '✓ Given'}
                          {med.statusType === 'stopped' && '✕ Stopped'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 text-center border-t border-slate-100 bg-slate-50/40">
              <button
                onClick={() => setShowFullScheduleModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto"
              >
                View Full Medication Schedule →
              </button>
            </div>
          </section>

          {/* 2-Column Grid: Medication Timeline + Recent Tests & Reports */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Medication Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Medication Timeline</h3>
                  </div>
                  <button
                    onClick={() => setShowFullScheduleModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                  >
                    View Full Schedule →
                  </button>
                </div>

                {/* Timeline filter pills */}
                <div className="flex flex-wrap items-center gap-1.5 py-2.5 text-[11px] font-semibold">
                  {[
                    { key: 'all', label: `All (${activePatient.timeline.length})` },
                    { key: 'given', label: `Given (${activePatient.timeline.filter(i => i.status === 'Given').length})` },
                    { key: 'due', label: `Due (${activePatient.timeline.filter(i => i.status === 'Due').length})` },
                    { key: 'upcoming', label: `Upcoming (${activePatient.timeline.filter(i => i.status === 'Upcoming').length})` },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setTimelineTab(p.key as any)}
                      className={`px-2.5 py-0.5 rounded-full transition-colors ${
                        timelineTab === p.key
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Mini Timeline Table */}
                <div className="overflow-x-auto mt-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-100 text-[11px]">
                        <th className="py-2">Time</th>
                        <th className="py-2">Medicine</th>
                        <th className="py-2">Dose</th>
                        <th className="py-2">Route</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredTimeline.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 font-bold text-slate-900">{item.time}</td>
                          <td className="py-2.5">{item.medicine}</td>
                          <td className="py-2.5 text-slate-500">{item.dose}</td>
                          <td className="py-2.5 text-slate-500">{item.route}</td>
                          <td className="py-2.5 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.color === 'amber' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {item.status === 'Given' && '✓ Given'}
                              {item.status === 'Due' && '● Due'}
                              {item.status === 'Upcoming' && '● Upcoming'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Recent Tests & Reports */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FlaskConical size={16} className="text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-900">Recent Tests &amp; Reports</h3>
                  </div>
                  <button
                    onClick={() => setShowAllReportsModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                  >
                    View All →
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 py-2.5 border-b border-slate-100">
                  {[
                    { key: 'lab', label: `Lab Tests (${activePatient.reports.filter(r => r.type === 'lab').length})` },
                    { key: 'imaging', label: `Imaging (${activePatient.reports.filter(r => r.type === 'imaging').length})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setTestsTab(tab.key as any)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        testsTab === tab.key
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Report Items */}
                <div className="space-y-2 mt-3">
                  {filteredReports.map((rep) => (
                    <div key={rep.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <FileCheck size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{rep.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {rep.date} • <span className={rep.status === 'Completed' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{rep.status}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shrink-0"
                      >
                        {rep.status === 'Completed' ? 'View Report' : 'View Status'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ─── BOTTOM 3-CARD ROW ───────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. My Health (Vitals) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-rose-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Health (Vitals)</h3>
                  </div>
                  <button
                    onClick={() => setShowVitalsTrendsModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                  >
                    View Trends →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Blood Pressure</div>
                    <div className="text-base font-black text-slate-900">{activePatient.vitals.bp}</div>
                    <div className="text-[10px] text-slate-400">mmHg</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Heart Rate</div>
                    <div className="text-base font-black text-slate-900">{activePatient.vitals.hr}</div>
                    <div className="text-[10px] text-slate-400">bpm (Resting)</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">Temperature</div>
                    <div className="text-base font-black text-slate-900">{activePatient.vitals.temp}</div>
                    <div className="text-[10px] text-slate-400">°F</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-semibold">SpO2</div>
                    <div className="text-base font-black text-emerald-600">{activePatient.vitals.spo2}</div>
                    <div className="text-[10px] text-slate-400">Room air</div>
                  </div>
                </div>

                {/* Mini Trend Line Graphic */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                    <span>BP Trend (Last 24 hrs)</span>
                    <span className="text-emerald-600 font-bold">Monitored</span>
                  </div>
                  <div className="w-full h-10 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                      <path
                        d="M 10 25 Q 50 15, 100 20 T 190 18"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="10" cy="25" r="3" fill="#3b82f6" />
                      <circle cx="70" cy="18" r="3" fill="#3b82f6" />
                      <circle cx="130" cy="20" r="3" fill="#3b82f6" />
                      <circle cx="190" cy="18" r="3.5" fill="#2563eb" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>06:00 AM</span>
                    <span>12:00 PM</span>
                    <span>06:00 PM</span>
                    <span>Now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. My Health History */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Health History</h3>
                  </div>
                  <button
                    onClick={() => setShowHealthHistoryModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Previous Admissions</span>
                    <span className="font-bold text-slate-900">{activePatient.history.admissions}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Surgeries / Procedures</span>
                    <span className="font-bold text-slate-900">{activePatient.history.surgeries}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Chronic Conditions</span>
                    <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {activePatient.history.chronic}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Previous Medications</span>
                    <span className="font-bold text-slate-900">{activePatient.history.previousMeds}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Hospital Stay */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hospital Stay</h3>
                  </div>
                  <button
                    onClick={() => setShowStayDetailsModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                  >
                    Stay Details →
                  </button>
                </div>

                <div className="space-y-2.5 mt-3 text-xs font-medium text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Admission Date</span>
                    <span className="font-bold text-slate-900 text-xs">{activePatient.admissionDate} ({activePatient.stayDays} Days)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Ward</span>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                        <Building2 size={13} className="text-purple-500" /> {activePatient.ward}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Bed</span>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                        <Bed size={13} className="text-indigo-500" /> Bed {activePatient.bed}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Attending Doctor</span>
                    <span className="font-bold text-slate-900 text-xs">{activePatient.attending}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Reason for Admission</span>
                    <span className="text-slate-700 text-xs leading-snug">{activePatient.diagnosis}</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase">Current Status</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ● Active Inpatient
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ─── RIGHT COLUMN (WIDGETS) ───────────────────────────────── */}
        <aside className="w-80 shrink-0 hidden xl:flex flex-col gap-4">
          
          {/* 1. Critical Allergy Alert / NKDA Status */}
          {primaryAllergy ? (
            <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle size={17} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Critical Allergy</div>
                  <div className="text-sm font-black text-rose-950 mt-0.5">{primaryAllergy.allergen}</div>
                  <div className="text-[11px] font-semibold text-rose-700">({primaryAllergy.severity})</div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-rose-200/80 flex justify-between items-center text-xs">
                <span className="text-[11px] text-rose-800 font-medium">Verified by Clinician</span>
                <button
                  onClick={() => setShowAllergyModal(true)}
                  className="font-bold text-rose-800 hover:text-rose-950 flex items-center gap-0.5"
                >
                  View Details →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Shield size={17} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Allergy Registry</div>
                  <div className="text-sm font-black text-emerald-950 mt-0.5">No Known Drug Allergies</div>
                  <div className="text-[11px] font-semibold text-emerald-700">(NKDA Verified)</div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80 flex justify-between items-center text-xs">
                <span className="text-[11px] text-emerald-800 font-medium">Verified by Attending</span>
                <button
                  onClick={() => setShowAllergyModal(true)}
                  className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-0.5"
                >
                  View Details →
                </button>
              </div>
            </div>
          )}

          {/* 2. Your Patient QR Code Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-900">
              <QrCode size={16} className="text-blue-600" />
              <span>Your Patient QR Code</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Scan with any phone camera to view whole profile</div>

            {/* QR Code Container */}
            <div className="p-3 bg-white border-2 border-blue-100 rounded-2xl my-3 inline-block shadow-sm">
              <QRCodeSVG
                ref={qrRef}
                value={getPatientProfileUrl(activePatient.mrn)}
                size={148}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-xs font-bold text-slate-900">{activePatient.name}</div>
            <div className="text-[11px] text-slate-500 font-medium">UHID: {activePatient.mrn} &bull; ABHA: {activePatient.abhaId}</div>

            <div className="mt-3 flex flex-col gap-1.5">
              <a
                href={`/verify?id=${encodeURIComponent(activePatient.mrn)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={13} /> View Scanned Profile Page ↗
              </a>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleDownloadQR}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Download size={12} /> Save QR
                </button>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(getPatientProfileUrl(activePatient.mrn));
                      showToast('Profile URL copied to clipboard');
                    }
                  }}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Copy size={12} /> Copy URL
                </button>
              </div>
            </div>
          </div>

          {/* 3. Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Activity size={15} className="text-blue-600" />
              <span>Quick Actions</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setShowActionModal('appointment'); setActionSubmitted(false); }}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50/50 transition-all flex flex-col items-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Calendar size={15} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900">Request Appointment</span>
              </button>

              <button
                onClick={() => { setShowActionModal('careteam'); setActionSubmitted(false); }}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50/50 transition-all flex flex-col items-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Stethoscope size={15} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900">Contact Care Team</span>
              </button>

              <button
                onClick={() => { setShowActionModal('question'); setActionSubmitted(false); }}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50/50 transition-all flex flex-col items-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-blue-600 flex items-center justify-center shadow-2xs">
                  <MessageSquare size={15} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900">Ask a Question</span>
              </button>

              <button
                onClick={() => { setShowActionModal('assistance'); setActionSubmitted(false); }}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50/50 transition-all flex flex-col items-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Bell size={15} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-900">Request Assistance</span>
              </button>
            </div>

            <button
              onClick={() => { setShowActionModal('records'); setActionSubmitted(false); }}
              className="mt-2 w-full p-2 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-700 hover:text-blue-900"
            >
              <FileText size={14} className="text-blue-600" />
              <span>Download Medical Records</span>
            </button>
          </div>

          {/* 4. Notifications & Updates Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Bell size={15} className="text-rose-500" />
                <span>Notifications &amp; Updates</span>
              </div>
              <button
                onClick={() => setShowNotificationsModal(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2.5 mt-3 text-xs">
              {activePatient.notifications.map((notif, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'med' ? 'bg-emerald-100 text-emerald-700' :
                    notif.type === 'lab' ? 'bg-blue-100 text-blue-700' :
                    notif.type === 'doc' ? 'bg-amber-100 text-amber-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {notif.type === 'med' && <Pill size={13} />}
                    {notif.type === 'lab' && <FlaskConical size={13} />}
                    {notif.type === 'doc' && <Stethoscope size={13} />}
                    {notif.type === 'info' && <Info size={13} />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{notif.title}</div>
                    <div className="text-[11px] text-slate-500">{notif.desc}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Emergency Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <AlertCircle size={15} />
                <span>Emergency Information</span>
              </div>
              <button
                onClick={() => setShowEmergencyGuideModal(true)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-0.5"
              >
                Emergency Guide →
              </button>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Blood Group</span>
                <span className="font-black text-rose-600">{activePatient.bloodGroup}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Critical Allergies</span>
                <span className="font-bold text-rose-700">
                  {primaryAllergy ? `${primaryAllergy.allergen} (${primaryAllergy.severity})` : 'NKDA (None)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Condition</span>
                <span className="font-bold text-slate-800 truncate max-w-[170px]" title={activePatient.diagnosis}>
                  {activePatient.diagnosis}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Attending Doctor</span>
                <span className="font-bold text-slate-900">{activePatient.attending}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Emergency Contact</span>
                <span className="font-bold text-slate-800 text-right">
                  {activePatient.caregiver.name}<br />
                  <span className="text-blue-600 font-mono text-[11px]">{activePatient.caregiver.phone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 6. Family & Caregiver Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Users size={15} className="text-blue-600" />
                <span>Family &amp; Caregiver</span>
              </div>
              <button
                onClick={() => setShowCaregiverModal(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                View Details →
              </button>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {activePatient.caregiver.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{activePatient.caregiver.name}</div>
                  <div className="text-[10px] text-slate-500">{activePatient.caregiver.relation}</div>
                  <div className="text-[10px] text-blue-600 font-mono mt-0.5">{activePatient.caregiver.phone}</div>
                </div>
              </div>
              <a
                href={`tel:${activePatient.caregiver.phone.replace(/[^+\d]/g, '')}`}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
              >
                Call
              </a>
            </div>
          </div>

        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs text-slate-600 font-medium">
        <div className="space-y-1">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building2 size={16} className="text-blue-600 shrink-0" />
            <span>Shridha Hospital &amp; Research Institute, Nagpur</span>
          </div>
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
            <span>Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Samarth Nagar East, Nagpur, Maharashtra 440015</span>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <span className="text-blue-600 font-semibold">Near Ajni Metro Station</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <span>Reception: <strong className="text-slate-900 font-bold font-mono">0712-2420299 / 2985296</strong></span>
          <span className="text-slate-300">•</span>
          <span>Duty Mobile: <strong className="text-slate-900 font-bold font-mono">+91 93735 10580</strong></span>
          <span className="text-slate-300">•</span>
          <span>Emergency: <strong className="text-rose-600 font-bold">108 / 112</strong></span>
          <span className="text-slate-300">•</span>
          <span>Code Blue: <strong className="text-blue-600 font-bold">Ext. 4001</strong></span>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          4. FULLY FUNCTIONAL MODALS & POPUPS
      ────────────────────────────────────────────────────────────── */}

      {/* 1. VITALS TRENDS MODAL (TRIGGERED BY "View Trends →") */}
      {showVitalsTrendsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">24-Hour Vitals &amp; Hemodynamic Trends</h3>
                  <p className="text-xs text-slate-500">{activePatient.name} &bull; Bed {activePatient.bed}, {activePatient.ward}</p>
                </div>
              </div>
              <button onClick={() => setShowVitalsTrendsModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Vitals Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-semibold">Blood Pressure</span>
                  <span className="text-lg font-black text-slate-900">{activePatient.vitals.bp}</span>
                  <span className="text-[10px] text-emerald-600 block font-semibold">Normotensive Target</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-semibold">Heart Rate</span>
                  <span className="text-lg font-black text-slate-900">{activePatient.vitals.hr} <span className="text-xs font-normal">bpm</span></span>
                  <span className="text-[10px] text-slate-500 block">Normal Sinus (60-100)</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-semibold">Temperature</span>
                  <span className="text-lg font-black text-slate-900">{activePatient.vitals.temp} <span className="text-xs font-normal">°F</span></span>
                  <span className="text-[10px] text-emerald-600 block font-semibold">Afebrile (&lt;99.0°F)</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-semibold">Oxygen Saturation</span>
                  <span className="text-lg font-black text-emerald-600">{activePatient.vitals.spo2}</span>
                  <span className="text-[10px] text-slate-500 block">Target &gt;95%</span>
                </div>
              </div>

              {/* Graphical Trend Line */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800">Blood Pressure Progression Curve</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Automated ICU Bedside Monitor</span>
                </div>
                <div className="h-24 w-full flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <path
                      d="M 20 45 Q 120 25, 200 35 T 380 30"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="20" cy="45" r="4.5" fill="#2563eb" />
                    <circle cx="140" cy="28" r="4.5" fill="#2563eb" />
                    <circle cx="260" cy="38" r="4.5" fill="#2563eb" />
                    <circle cx="380" cy="30" r="5" fill="#1d4ed8" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-1">
                  <span>06:00 AM (118/76)</span>
                  <span>10:00 AM (120/80)</span>
                  <span>02:00 PM (116/74)</span>
                  <span>06:00 PM (118/76)</span>
                </div>
              </div>

              {/* Time-stamped Vitals Log Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Logged Nursing Vitals Observations</h4>
                <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-slate-200">
                  <thead className="bg-slate-100/70 text-slate-600 text-[11px]">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">BP (mmHg)</th>
                      <th className="p-2.5">Heart Rate</th>
                      <th className="p-2.5">Temp (°F)</th>
                      <th className="p-2.5">SpO2</th>
                      <th className="p-2.5 text-right">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {activePatient.vitals.readings.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{r.time}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{r.bp}</td>
                        <td className="p-2.5">{r.hr} bpm</td>
                        <td className="p-2.5">{r.temp} °F</td>
                        <td className="p-2.5 font-bold text-emerald-600">{r.spo2}</td>
                        <td className="p-2.5 text-right text-slate-500">Nurse Priya, RN</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowVitalsTrendsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Vitals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MEDICATION CATALOG MODAL (TRIGGERED BY "View all →" in My Medicines) */}
      {showMedCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pill size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hospital Pharmacy Medication Catalog</h3>
                  <p className="text-xs text-slate-500">Active Inpatient Drug Formulary &bull; {activePatient.name}</p>
                </div>
              </div>
              <button onClick={() => setShowMedCatalogModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              {activePatient.medications.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.badgeColor}`}>
                        {m.statusType.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-700 font-mono font-medium">Salt: {m.saltName}</div>
                    <div className="text-[11px] text-slate-500">Therapeutic Class: {m.subtitle}</div>
                    <div className="text-[11px] text-slate-700 font-medium">Dosage &amp; Route: {m.doseRoute} &bull; Frequency: {m.frequency}</div>
                    <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">Special Instruction: {m.timing}</div>
                  </div>
                  <div className="text-right sm:self-center shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Next Scheduled Administration</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{m.nextDose}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  downloadPrescriptionSheetPdf({
                    patient: {
                      name: activePatient.name,
                      mrn: activePatient.mrn,
                      abhaId: activePatient.abhaId,
                      age: activePatient.age,
                      gender: activePatient.gender,
                      ward: activePatient.ward,
                      bed: activePatient.bed,
                      attending: activePatient.attending,
                      allergies: activePatient.allergies,
                    },
                    medications: activePatient.medications,
                  });
                  showToast('Prescription order sheet downloaded (PDF)');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Download size={14} /> Download Prescription Sheet
              </button>
              <button
                onClick={() => setShowMedCatalogModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FULL SCHEDULE MODAL (TRIGGERED BY "View Full Medication Schedule →") */}
      {showFullScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">24-Hour eMAR Administration Schedule</h3>
                  <p className="text-xs text-slate-500">Bedside Barcode Verification &amp; 5-Rights Status &bull; {activePatient.name}</p>
                </div>
              </div>
              <button onClick={() => setShowFullScheduleModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900">
                All medications administered in Ward 4B require dual nurse check or barcode scanning verification adhering to NABH 5-Rights standards (Right Patient, Right Drug, Right Dose, Right Route, Right Time).
              </div>

              <div className="space-y-2">
                {activePatient.timeline.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="text-center font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs">
                        {item.time}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.medicine}</div>
                        <div className="text-[11px] text-slate-500">Dose: {item.dose} &bull; Route: {item.route} &bull; Attending Nurse: {item.nurse}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.color === 'amber' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowFullScheduleModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ALL DIAGNOSTIC REPORTS ARCHIVE MODAL (TRIGGERED BY "View All →" in Tests & Reports) */}
      {showAllReportsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FlaskConical size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Diagnostic Laboratory &amp; Imaging Archive</h3>
                  <p className="text-xs text-slate-500">NABL Accredited Central Pathology &bull; {activePatient.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAllReportsModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              {activePatient.reports.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Report Date: {r.date} &bull; Ordered by: {r.doctor}</div>
                    <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 mt-2">
                      <strong>Summary Findings:</strong> {r.findings}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Normal Reference Standard: {r.refRange}</div>
                  </div>
                  <div className="sm:self-center shrink-0">
                    <button
                      onClick={() => { setShowAllReportsModal(false); setSelectedReport(r); }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1"
                    >
                      <FileText size={13} /> View Full
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAllReportsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. HEALTH HISTORY MODAL (TRIGGERED BY "View All →" in My Health History) */}
      {showHealthHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Comprehensive Patient Medical History</h3>
                  <p className="text-xs text-slate-500">Past Clinical Encounters &bull; {activePatient.name}</p>
                </div>
              </div>
              <button onClick={() => setShowHealthHistoryModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Past Hospital Admissions</div>
                <div>{activePatient.history.admissions}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Past Surgical Interventions &amp; Procedures</div>
                <div>{activePatient.history.surgeries}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Chronic Comorbidities &amp; Diagnoses</div>
                <div className="text-purple-700 font-semibold">{activePatient.history.chronic}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Family Medical History</div>
                <div>{activePatient.history.familyHistory}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Lifestyle &amp; Dietary Preferences</div>
                <div>{activePatient.history.habits} &bull; Preference: {activePatient.dietPreference}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHealthHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. STAY DETAILS MODAL (TRIGGERED BY "Stay Details →") */}
      {showStayDetailsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Inpatient Admission &amp; Stay Record</h3>
                  <p className="text-xs text-slate-500">Shridha Hospital Inpatient Registry &bull; {activePatient.name}</p>
                </div>
              </div>
              <button onClick={() => setShowStayDetailsModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-emerald-900 text-sm">Active Inpatient Status</div>
                  <div className="text-[11px] text-emerald-700">Bedside 24x7 Multi-parameter Monitored</div>
                </div>
                <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                  Day {activePatient.stayDays}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Admission Date &amp; Time</span>
                  <span className="font-bold text-slate-800">{activePatient.admissionDate} &bull; 10:15 AM</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ward &amp; Bed Number</span>
                  <span className="font-bold text-slate-800">{activePatient.ward} &bull; Bed {activePatient.bed}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Treating Consultant</span>
                  <span className="font-bold text-slate-800">{activePatient.attending}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bedside Duty Nurse</span>
                  <span className="font-bold text-slate-800">Nurse Priya, RN</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cashless Mediclaim &amp; TPA Insurance</span>
                <div className="font-bold text-slate-900">{activePatient.insurance.provider}</div>
                <div className="text-[11px] text-emerald-700 font-semibold">{activePatient.insurance.status}</div>
                <div className="text-[10px] text-slate-500 font-mono">Policy Ref: {activePatient.insurance.policyNo}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Admission Diagnosis</span>
                <div className="font-bold text-slate-900 text-xs">{activePatient.diagnosis}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowStayDetailsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PATIENT PROFILE MODAL (TRIGGERED BY "View Profile") */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Government Health Record (ABHA Profile)</h3>
                  <p className="text-xs text-slate-500">Ayushman Bharat Digital Mission (ABDM) Compliant</p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-4 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                <img src={activePatient.avatar} alt={activePatient.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-400" />
                <div>
                  <div className="text-base font-black text-slate-900">{activePatient.name}</div>
                  <div className="text-xs font-bold text-blue-700 font-mono">ABHA: {activePatient.abhaId}</div>
                  <div className="text-[11px] text-slate-500">Hospital UHID: {activePatient.mrn} &bull; Blood Group: {activePatient.bloodGroup}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Age / Gender</span>
                  <span className="font-bold text-slate-800">{activePatient.age} Years &bull; {activePatient.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Residential City</span>
                  <span className="font-bold text-slate-800">{activePatient.location}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Caregiver</span>
                  <span className="font-bold text-slate-800">{activePatient.caregiver.name} ({activePatient.caregiver.relation})</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Caregiver Contact</span>
                  <span className="font-bold text-blue-600 font-mono">{activePatient.caregiver.phone}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dietary &amp; Cultural Preferences</span>
                <div className="font-bold text-slate-800">{activePatient.dietPreference}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EMERGENCY RESPONSE GUIDE MODAL (TRIGGERED BY "Emergency Guide →") */}
      {showEmergencyGuideModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle size={20} />
                <h3 className="text-base font-bold text-slate-900">Hospital Emergency Protocol Guide</h3>
              </div>
              <button onClick={() => setShowEmergencyGuideModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 space-y-2">
                <div className="font-black text-rose-900 text-sm flex items-center gap-1.5">
                  <ShieldAlert size={17} /> Bedside Acute Emergency Contacts
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-rose-200/60">
                  <span className="font-semibold text-rose-800">Hospital Reception &amp; Triage:</span>
                  <span className="font-black text-rose-900 text-sm font-mono">0712-2420299 / 2985296</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-rose-200/60">
                  <span className="font-semibold text-rose-800">Emergency Mobile (Duty Doctor):</span>
                  <span className="font-black text-rose-900 text-sm font-mono">+91 93735 10580</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-rose-200/60">
                  <span className="font-semibold text-rose-800">Hospital Code Blue Team:</span>
                  <span className="font-black text-rose-900 text-sm font-mono">Ext. 4001</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-rose-200/60">
                  <span className="font-semibold text-rose-800">ICU Ward 4B Nursing Station:</span>
                  <span className="font-black text-rose-900 text-sm font-mono">Ext. 2041</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-semibold text-rose-800">National Ambulance (Nagpur):</span>
                  <span className="font-black text-rose-900 text-sm font-mono">108 / 112</span>
                </div>
              </div>
              <div className="text-slate-600 space-y-1">
                <p><strong>Hospital Address:</strong> Wardha Road, Next to Bank of Maharashtra, Ajni Chowk, Samarth Nagar East, Nagpur - 440015</p>
                <p><strong>Medical Director:</strong> Dr. Dinesh Sarda, MS, MCh</p>
                <p><strong>Patient UHID:</strong> {activePatient.mrn} &bull; <strong>Bed:</strong> {activePatient.bed}</p>
                <p><strong>Blood Bank Reserve:</strong> 2 Units of {activePatient.bloodGroup} cross-matched reserve on hold.</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowEmergencyGuideModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. CAREGIVER PASS MODAL (TRIGGERED BY "View Details →" in Family & Caregiver) */}
      {showCaregiverModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600">
                <Users size={20} />
                <h3 className="text-base font-bold text-slate-900">Hospital Attendant &amp; Caregiver Pass</h3>
              </div>
              <button onClick={() => setShowCaregiverModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Digital Attendant Pass ID</div>
                <div className="text-lg font-black text-slate-900 font-mono">PASS-4B-{activePatient.bed}</div>
                <div className="text-xs font-bold text-blue-700 mt-1">{activePatient.caregiver.name} ({activePatient.caregiver.relation})</div>
                <div className="text-[11px] text-slate-500 font-mono">{activePatient.caregiver.phone}</div>
                <div className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                  ● 24x7 Inpatient ICU Attendant Access Authorized
                </div>
              </div>
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 text-[11px]">
                Visiting hours for non-attendants: <strong>11:00 AM – 01:00 PM</strong> &amp; <strong>05:00 PM – 07:00 PM</strong> daily. Mask and sanitization mandatory in ICU Ward 4B.
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCaregiverModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. PRIVACY & CONSENT MODAL */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Patient Privacy &amp; Consent Directives</h3>
                  <p className="text-xs text-slate-500">Ayushman Bharat Digital Mission (ABDM) &bull; DPDP Act 2023 Compliant</p>
                </div>
              </div>
              <button onClick={() => setShowConsentModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Active ABHA Consent Certificate Banner */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 text-xs">Active ABDM Consent Artifact</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Digitally Signed &bull; Active
                  </span>
                </div>
                <div className="text-xs text-slate-700">
                  Patient: <strong>{activePatient.name}</strong> &bull; ABHA ID: <strong className="text-blue-700 font-mono">{activePatient.abhaId}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Data Fiduciary: <strong>Shridha Hospital &amp; Research Institute, Nagpur</strong> &bull; Validity: Discharge + 90 Days
                </div>
              </div>

              {/* Interactive Permissions List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Consent Directives &amp; Permissions</h4>

                {/* 1. EHR Clinical Data Sharing */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-start justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">Inpatient Clinical Data Exchange</div>
                    <p className="text-[11px] text-slate-500">
                      Permit treating consultants (Dr. Dinesh Sarda, Dr. Neha Sarda) and Ward 4B nursing staff to access complete progress notes, medication chart, and vital trends.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentEhr}
                    onChange={(e) => setConsentEhr(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-1 accent-blue-600 cursor-pointer shrink-0"
                  />
                </div>

                {/* 2. ABHA Health Locker Auto-Sync */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-start justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">National ABHA PHR App Sync</div>
                    <p className="text-[11px] text-slate-500">
                      Automatically link verified NABL diagnostic reports and inpatient discharge summary to your central ABHA Health Locker.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentAbhaSync}
                    onChange={(e) => setConsentAbhaSync(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-1 accent-blue-600 cursor-pointer shrink-0"
                  />
                </div>

                {/* 3. Caregiver Proxy Access */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-start justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      Designated Caregiver Access ({activePatient.caregiver.name})
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Authorize primary attendant ({activePatient.caregiver.relation}, {activePatient.caregiver.phone}) to view bedside medication schedule and receive emergency SMS alerts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentCaregiver}
                    onChange={(e) => setConsentCaregiver(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-1 accent-blue-600 cursor-pointer shrink-0"
                  />
                </div>

                {/* 4. Acute Critical Care Emergency Disclosure */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-start justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">Acute Critical Care Emergency Disclosure</div>
                    <p className="text-[11px] text-slate-500">
                      Allow instantaneous access to clinical history for Code Blue resuscitation teams and on-call intensivists during acute clinical deterioration without two-factor OTP delay.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={consentEmergency}
                    onChange={(e) => setConsentEmergency(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-1 accent-blue-600 cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* Data Protection Guarantee Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-600" />
                  <span>Data Protection &amp; Revocation Rights</span>
                </div>
                <p>
                  Under the Digital Personal Data Protection Act (DPDP 2023), all medical data is encrypted with AES-256 standards. You may withdraw or modify consent at any time through this portal or at Shridha Hospital MRD.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                onClick={() => {
                  downloadConsentCertificatePdf({
                    patient: {
                      name: activePatient.name,
                      mrn: activePatient.mrn,
                      abhaId: activePatient.abhaId,
                      ward: activePatient.ward,
                      bed: activePatient.bed,
                      caregiverName: activePatient.caregiver.name,
                      caregiverRelation: activePatient.caregiver.relation,
                    },
                    consentEhr,
                    consentAbhaSync,
                    consentCaregiver,
                    consentEmergency,
                  });
                  showToast('ABDM Consent Certificate downloaded (PDF)');
                }}
                className="w-full sm:w-auto px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download size={14} /> Download Certificate (PDF)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowConsentModal(false);
                    showToast('Privacy & Consent preferences saved to ABDM gateway');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 11. INDIVIDUAL LAB REPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FlaskConical className="text-purple-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">{selectedReport.name}</h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Date</span>
                  <span className="font-bold text-slate-800">{selectedReport.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Reviewing Physician</span>
                  <span className="font-bold text-slate-800">{selectedReport.doctor}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Clinical Findings &amp; Summary:</span>
                <p className="bg-slate-50 p-3 rounded-xl text-slate-700 leading-relaxed border border-slate-100">
                  {selectedReport.findings}
                </p>
              </div>
              <div className="text-[11px] text-slate-500">
                <strong>Standard Reference Limit:</strong> {selectedReport.refRange}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  downloadDiagnosticReportPdf({
                    reportName: selectedReport.name,
                    reportType: selectedReport.type,
                    date: selectedReport.date,
                    status: selectedReport.status,
                    doctor: selectedReport.doctor,
                    findings: selectedReport.findings,
                    refRange: selectedReport.refRange,
                    patient: {
                      name: activePatient.name,
                      mrn: activePatient.mrn,
                      abhaId: activePatient.abhaId,
                      age: activePatient.age,
                      gender: activePatient.gender,
                      ward: activePatient.ward,
                      bed: activePatient.bed,
                      bloodGroup: activePatient.bloodGroup,
                      diagnosis: activePatient.diagnosis,
                    },
                  });
                  showToast(`Official PDF downloaded for ${selectedReport.name}`);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MEDICATION UPDATE MODAL */}
      {showMedUpdateModal && activePatient.medUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle size={20} />
                <h3 className="text-base font-bold text-slate-900">Medication Change Details</h3>
              </div>
              <button onClick={() => setShowMedUpdateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200">
                <div className="font-bold text-rose-900 text-sm">{activePatient.medUpdate.med}</div>
                <div className="text-[11px] text-rose-700 mt-1">
                  {activePatient.medUpdate.reason}
                </div>
              </div>
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-500">Previous Prescription:</span>
                  <span className="font-bold text-slate-800 line-through">{activePatient.medUpdate.prev}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">New Prescription:</span>
                  <span className="font-bold text-emerald-600">{activePatient.medUpdate.curr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Effective Date &amp; Time:</span>
                  <span className="font-bold text-slate-800">{activePatient.medUpdate.eff}</span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowMedUpdateModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. ALLERGY DETAILS MODAL */}
      {showAllergyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <Shield size={20} />
                <h3 className="text-base font-bold text-slate-900">Hospital Allergy Registry</h3>
              </div>
              <button onClick={() => setShowAllergyModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-700">
              {activePatient.allergies.length > 0 ? (
                activePatient.allergies.map((a: any, i: number) => (
                  <div key={i} className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1">
                    <div className="text-xs font-bold text-rose-900">Allergen: {a.allergen}</div>
                    <div className="text-[11px] text-rose-800 font-semibold">Severity: {a.severity}</div>
                    <div className="text-[11px] text-rose-700">Reaction: {a.reaction}</div>
                    {a.crossReacts && (
                      <div className="text-[10px] text-rose-600 font-medium pt-1 border-t border-rose-200/60">
                        Cross-reacts with: {a.crossReacts}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-emerald-900">
                  <div className="font-bold text-xs">No Known Drug Allergies (NKDA)</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    This patient has no recorded adverse reactions to medications in the Hospital Pharmacy Gateway.
                  </div>
                </div>
              )}
              <div className="text-[11px] text-slate-500">
                All bedside administration scanners enforce automated safety checks against this patient's registered allergy profile.
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAllergyModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. QUICK ACTIONS INTERACTIVE MODAL */}
      {showActionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {showActionModal === 'appointment' && 'Doctor Consultation & Rounds'}
                {showActionModal === 'careteam' && 'Bedside Clinical Care Team'}
                {showActionModal === 'question' && 'Ask Your Pharmacist / Doctor'}
                {showActionModal === 'assistance' && 'Call Bedside Nurse Assistance'}
                {showActionModal === 'records' && 'Download Complete Medical Records'}
              </h3>
              <button onClick={() => setShowActionModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {actionSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <div className="text-sm font-bold text-slate-900">Request Sent Successfully!</div>
                <div className="text-xs text-slate-500 max-w-xs mx-auto">
                  The duty nurse and {activePatient.ward} nursing station have received your notification and will attend to Bed {activePatient.bed} shortly.
                </div>
                <button
                  onClick={() => setShowActionModal(null)}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="py-4 space-y-3 text-xs">
                {showActionModal === 'appointment' && (
                  <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 text-xs">Scheduled Inpatient Doctor Round</span>
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Today, 4:00 PM</span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium">Attending Consultant: <strong>{activePatient.attending}</strong></div>
                    <div className="text-[11px] text-slate-500">Location: {activePatient.ward}, Bed {activePatient.bed} (Bedside Clinical Review)</div>
                    <div className="text-[11px] text-blue-800 font-semibold mt-1">Status: Confirmed &bull; Token #04 for Evening Rounds</div>
                  </div>
                )}
                {showActionModal === 'careteam' && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 text-xs">Shridha Hospital Inpatient Clinical Team (Ward 4B ICU)</div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Medical Director &amp; Chief Surgeon:</span>
                        <span className="font-bold text-slate-800">Dr. Dinesh Sarda, MS, MCh</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Attending Consultant:</span>
                        <span className="font-bold text-slate-800">{activePatient.attending}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Senior Consultant (Gyn &amp; Obs):</span>
                        <span className="font-bold text-slate-800">Dr. Neha Sarda, MD, DNB</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Bedside Primary Nurse:</span>
                        <span className="font-bold text-slate-800">Nurse Priya, RN (Ext. 2041)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Resident Medical Officer:</span>
                        <span className="font-bold text-slate-800">Dr. Rajesh Verma, MBBS (Ext. 2042)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Clinical Pharmacist:</span>
                        <span className="font-bold text-slate-800">Pharm. A. Kulkarni (Ext. 1088)</span>
                      </div>
                    </div>
                  </div>
                )}
                {showActionModal === 'assistance' && (
                  <div className="bg-amber-50 p-3 rounded-xl text-amber-900 border border-amber-200">
                    Pressing send will directly alert the primary bedside nurse on duty for {activePatient.ward}, Bed {activePatient.bed}.
                  </div>
                )}
                {showActionModal === 'records' && (
                  <div className="space-y-2">
                    <p className="text-slate-600">Select records to export as encrypted PDF for {activePatient.name}:</p>
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
                      <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Inpatient eMAR Administration Logs</label>
                      <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Lab Test Results &amp; Imaging (NABL Verified)</label>
                      <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Doctor Progress Notes &amp; Care Plan</label>
                    </div>
                  </div>
                )}
                {showActionModal !== 'records' && (
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      {showActionModal === 'appointment' ? 'Notes or questions for doctor rounds (optional):' : 'Message or details:'}
                    </label>
                    <textarea
                      rows={3}
                      value={actionInput}
                      onChange={(e) => setActionInput(e.target.value)}
                      placeholder={showActionModal === 'appointment' ? 'e.g., Blood sugar after lunch was 140, feeling mild nausea...' : 'Type any specific question, request, or symptom you wish to communicate...'}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                    />
                  </div>
                )}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowActionModal(null)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (showActionModal === 'records') {
                        downloadPrescriptionSheetPdf({
                          patient: {
                            name: activePatient.name,
                            mrn: activePatient.mrn,
                            abhaId: activePatient.abhaId,
                            age: activePatient.age,
                            gender: activePatient.gender,
                            ward: activePatient.ward,
                            bed: activePatient.bed,
                            attending: activePatient.attending,
                            allergies: activePatient.allergies,
                          },
                          medications: activePatient.medications,
                        });
                        showToast(`Medical records PDF downloaded for ${activePatient.name}`);
                        setShowActionModal(null);
                      } else {
                        setActionSubmitted(true);
                        showToast('Request transmitted to Hospital Staff System');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Download size={13} /> {showActionModal === 'records' ? 'Download PDF' : 'Send Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 15. NOTIFICATIONS DRAWER/MODAL */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Hospital Notifications</h3>
              </div>
              <button onClick={() => setShowNotificationsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-2.5 max-h-96 overflow-y-auto text-xs">
              {activePatient.notifications.map((n, i) => (
                <div key={i} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-900">{n.title}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{n.desc}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{n.time}</div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
