import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, refresh as apiRefresh, register as apiRegister } from '@/shared/api/auth';
import { AUTH_STORAGE_KEY } from '@/shared/api/client';
import type { AuthSession, SessionUser } from '@/shared/types/common';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role: 'applicant' | 'employer';
}

interface AuthContextValue {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  hydrateMe: () => Promise<SessionUser | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function saveSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const applySession = useCallback((session: AuthSession) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    saveSession(session);
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    clearSession();
  }, []);

  const logout = useCallback(() => {
    const currentRefreshToken = refreshToken ?? readStoredSession()?.refreshToken ?? null;
    if (currentRefreshToken) {
      void apiLogout(currentRefreshToken).catch(() => undefined);
    }
    clearAuthState();
  }, [clearAuthState, refreshToken]);

  const hydrateMe = useCallback(async () => {
    const stored = readStoredSession();
    if (!stored?.accessToken) {
      clearAuthState();
      return null;
    }

    setAccessToken(stored.accessToken);
    setRefreshToken(stored.refreshToken);

    try {
      const currentUser = await getMe();
      const nextSession: AuthSession = {
        ...stored,
        user: currentUser,
      };
      applySession(nextSession);
      return currentUser;
    } catch {
      if (!stored.refreshToken) {
        clearAuthState();
        return null;
      }

      try {
        const refreshedSession = await apiRefresh(stored.refreshToken);
        applySession(refreshedSession);
        const currentUser = await getMe();
        applySession({
          ...refreshedSession,
          user: currentUser,
        });
        return currentUser;
      } catch {
        clearAuthState();
        return null;
      }
    }
  }, [applySession, clearAuthState]);

  useEffect(() => {
    hydrateMe().finally(() => {
      setIsBootstrapping(false);
    });
  }, [hydrateMe]);

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await apiLogin(input);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await apiRegister(input);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isBootstrapping,
      login,
      register,
      hydrateMe,
      logout,
    }),
    [user, accessToken, refreshToken, isBootstrapping, login, register, hydrateMe, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
