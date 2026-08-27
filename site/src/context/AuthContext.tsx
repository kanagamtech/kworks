import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'hr' | 'it' | 'finance';

export interface ManagementUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  department: string;
}

interface AuthContextType {
  user: ManagementUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kworks_access_token',
  REFRESH_TOKEN: 'kworks_refresh_token',
  USER: 'kworks_user',
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  admin: [
    'employees:*', 'attendance:*', 'food:*', 'leaves:*', 'notices:*', 'polls:*',
    'tickets:*', 'claims:*', 'updates:*', 'companies:*', 'management_users:*',
    'dashboard:*', 'reports:*'
  ],
  manager: [
    'employees:*', 'attendance:*', 'food:*', 'leaves:*', 'notices:*', 'polls:*',
    'tickets:read', 'tickets:create', 'claims:manager', 'claims:read',
    'updates:*', 'companies:read', 'dashboard:*', 'reports:*'
  ],
  hr: [
    'attendance:read', 'attendance:export', 'food:read', 'leaves:*',
    'employees:read', 'notices:read', 'polls:read', 'dashboard:read'
  ],
  it: [
    'tickets:*', 'updates:publish', 'updates:read', 'employees:read',
    'dashboard:read', 'notices:read'
  ],
  finance: [
    'claims:finance', 'claims:read', 'notices:*', 'polls:*',
    'employees:read', 'dashboard:read', 'reports:read'
  ],
};

export const TAB_PERMISSIONS: Record<string, string[]> = {
  onboarding: ['employees:create', 'employees:read', 'companies:read'],
  attendance: ['attendance:read'],
  food: ['food:read'],
  leaves: ['leaves:read'],
  notices: ['notices:read'],
  polls: ['polls:read'],
  tickets: ['tickets:read'],
  claims: ['claims:read'],
  updates: ['updates:read'],
  management_users: ['management_users:read'],
};

function hasPermission(userRole: UserRole, requiredPermission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  if (rolePermissions.includes('*')) return true;
  if (rolePermissions.includes(requiredPermission)) return true;
  const [resource] = requiredPermission.split(':');
  const wildcardPermission = `${resource}:*`;
  if (rolePermissions.includes(wildcardPermission)) return true;
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ManagementUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/management/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!data.success) {
        return { success: false, message: data.message || 'Login failed' };
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = data;
      
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!refreshToken) return;
    
    try {
      const response = await fetch('/api/auth/management/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();

      if (data.success) {
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [refreshToken, logout]);

  const checkPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const checkAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some(p => hasPermission(user.role, p));
  }, [user]);

  const checkRole = useCallback((...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshAuth,
      hasPermission: checkPermission,
      hasAnyPermission: checkAnyPermission,
      hasRole: checkRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}