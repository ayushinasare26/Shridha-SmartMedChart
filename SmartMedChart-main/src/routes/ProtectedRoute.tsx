import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'ALLIED_STAFF' || user.role === 'OTHER_STAFF') {
      return <Navigate to="/staff-portal" replace />;
    }
    if (user.role === 'PATIENT') {
      return <Navigate to="/patient-portal" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
