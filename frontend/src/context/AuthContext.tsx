import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, type Session } from '@/lib/api';

type AuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  startSlackAuth: () => Promise<void>;
  startSlackBotAuth: () => Promise<void>;
  startNotionAuth: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const data = await api.getSession();
      setSession(data);
      setError(null);
    } catch (err) {
      setSession(null);
      if (err instanceof ApiError && err.status === 401) {
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to verify session');
      }
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const startSlackAuth = useCallback(async () => {
    setError(null);
    const { authUrl } = await api.getSlackAuthUrl();
    window.location.href = authUrl;
  }, []);

  const startSlackBotAuth = useCallback(async () => {
    setError(null);
    const { authUrl } = await api.getSlackBotAuthUrl();
    window.location.href = authUrl;
  }, []);

  const startNotionAuth = useCallback(async () => {
    setError(null);
    const { authUrl } = await api.getNotionAuthUrl();
    window.location.href = authUrl;
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      isLoading,
      error,
      refreshSession,
      startSlackAuth,
      startSlackBotAuth,
      startNotionAuth,
      clearError: () => setError(null),
    }),
    [session, isLoading, error, refreshSession, startSlackAuth, startSlackBotAuth, startNotionAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
