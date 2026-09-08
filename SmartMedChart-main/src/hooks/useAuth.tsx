import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'ADMIN' | 'PATIENT' | 'OTHER_STAFF' | 'ALLIED_STAFF';
  staffId?: string;
  patientId?: string;
  mrn?: string;
  bed?: string;
  ward?: string;
  department?: string;
  title?: string;
  specialty?: string;
  licenseNumber?: string;
  shiftType?: string;
  onDuty?: boolean;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: string | { email?: string; password?: string; adminId?: string; staffId?: string; mrn?: string; pin?: string; isPatient?: boolean }, password?: string) => Promise<User>;
  impersonate: (targetUserId?: string, targetStaffId?: string, targetPatientId?: string, targetMrn?: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: string | { email?: string; password?: string; adminId?: string; staffId?: string; mrn?: string; pin?: string; isPatient?: boolean }, password?: string) => {
    setIsLoading(true);
    try {
      const payload = typeof credentials === 'string' ? { email: credentials, password } : credentials;
      const { data } = await api.post('/auth/login', payload);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const impersonate = useCallback(async (targetUserId?: string, targetStaffId?: string, targetPatientId?: string, targetMrn?: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/impersonate', { targetUserId, targetStaffId, targetPatientId, targetMrn });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch { /* ignore */ }
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, impersonate, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
