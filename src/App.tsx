import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import NurseDashboardPage from './pages/NurseDashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import PatientsListPage from './pages/PatientsListPage';
import PatientEMARPage from './pages/PatientEMARPage';
import CPOEPrescriptionPage from './pages/CPOEPrescriptionPage';
import BedsideScannerPage from './pages/BedsideScannerPage';
import SafetyAuditPage from './pages/SafetyAuditPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import PatientPortalPage from './pages/PatientPortalPage';
import PublicVerificationPage from './pages/PublicVerificationPage';
import HospitalStaffPortalPage from './pages/HospitalStaffPortalPage';
import { useAuth } from './hooks/useAuth';

const ReceptionistPortalPage = lazy(() => import('./pages/ReceptionistPortalPage'));

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'PATIENT') return <Navigate to="/patient-portal" replace />;
  if (user?.role === 'RECEPTIONIST') return <Navigate to="/receptionist" replace />;
  if (user?.role === 'ALLIED_STAFF') return <Navigate to="/staff" replace />;
  if (user?.role === 'NURSE') return <Navigate to="/nurse" replace />;
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  if (user?.role === 'PHARMACIST') return <Navigate to="/prescriptions" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/verify" element={<PublicVerificationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'ALLIED_STAFF']}><AdminPage /></ProtectedRoute>} />
      <Route path="/patient-portal" element={<ProtectedRoute allowedRoles={['PATIENT', 'ADMIN', 'DOCTOR', 'NURSE']}><PatientPortalPage /></ProtectedRoute>} />
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN', 'DOCTOR', 'NURSE']}>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">Loading Reception Desk...</span>
                </div>
              </div>
            }>
              <ReceptionistPortalPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['ALLIED_STAFF', 'NURSE', 'ADMIN', 'DOCTOR']}><HospitalStaffPortalPage /></ProtectedRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route path="/nurse" element={<ProtectedRoute allowedRoles={['NURSE', 'ADMIN', 'ALLIED_STAFF']}><NurseDashboardPage /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorDashboardPage /></ProtectedRoute>} />
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/:id" element={<PatientEMARPage />} />
        <Route path="/prescriptions" element={<CPOEPrescriptionPage />} />
        <Route path="/prescriptions/new" element={<CPOEPrescriptionPage />} />
        <Route path="/bedside-scan" element={<BedsideScannerPage />} />
        <Route path="/safety-audit" element={<SafetyAuditPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/unauthorized" element={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
            <h2>Access Denied</h2>
            <p>You don't have permission to view this page.</p>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
