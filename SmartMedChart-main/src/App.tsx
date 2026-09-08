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

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'PATIENT') return <Navigate to="/patient-portal" replace />;
  if (user?.role === 'ALLIED_STAFF' || user?.role === 'OTHER_STAFF') return <Navigate to="/staff-portal" replace />;
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
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}><AdminPage /></ProtectedRoute>} />
      <Route path="/patient-portal" element={<ProtectedRoute allowedRoles={['PATIENT', 'ADMIN', 'DOCTOR', 'NURSE', 'ALLIED_STAFF', 'OTHER_STAFF']}><PatientPortalPage /></ProtectedRoute>} />
      <Route path="/staff-portal" element={<ProtectedRoute allowedRoles={['ALLIED_STAFF', 'OTHER_STAFF', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST']}><HospitalStaffPortalPage /></ProtectedRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route path="/nurse" element={<ProtectedRoute allowedRoles={['NURSE', 'ADMIN']}><NurseDashboardPage /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorDashboardPage /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST']}><PatientsListPage /></ProtectedRoute>} />
        <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST']}><PatientEMARPage /></ProtectedRoute>} />
        <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={['DOCTOR', 'PHARMACIST', 'ADMIN']}><CPOEPrescriptionPage /></ProtectedRoute>} />
        <Route path="/prescriptions/new" element={<ProtectedRoute allowedRoles={['DOCTOR', 'PHARMACIST', 'ADMIN']}><CPOEPrescriptionPage /></ProtectedRoute>} />
        <Route path="/bedside-scan" element={<ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'ADMIN']}><BedsideScannerPage /></ProtectedRoute>} />
        <Route path="/safety-audit" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST']}><SafetyAuditPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['DOCTOR', 'NURSE', 'ADMIN', 'PHARMACIST']}><ReportsPage /></ProtectedRoute>} />
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
