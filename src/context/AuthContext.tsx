import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | Error | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local fallback user storage when Supabase env vars are not yet configured in preview
const DEMO_AUTH_STORAGE_KEY = 'darshan_ai_local_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      // Check if demo user was logged in previously in standalone mode
      try {
        const stored = localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.email) {
            setUser(parsed as User);
            setAccessToken(`mock-jwt-token-${parsed.id}`);
          }
        }
      } catch (err) {
        console.error('Failed reading demo user storage:', err);
      }
      setIsLoading(false);
      return;
    }

    // Get current initial session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Error getting Supabase session:', error);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setAccessToken(initialSession?.access_token ?? null);
      setIsLoading(false);
    });

    // Listen to real-time auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setAccessToken(currentSession?.access_token ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | Error | null }> => {
    if (!isSupabaseConfigured) {
      // Standalone mode simulation with real UUID generator
      const mockId = generatePseudoUUID(email);
      const mockUser = {
        id: mockId,
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      setUser(mockUser);
      setAccessToken(`mock-jwt-token-${mockId}`);
      localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      return { error: null };
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setAccessToken(data.session.access_token);
    }

    return { error };
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | Error | null; user: User | null }> => {
    if (!isSupabaseConfigured) {
      const mockId = generatePseudoUUID(email);
      const mockUser = {
        id: mockId,
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      setUser(mockUser);
      setAccessToken(`mock-jwt-token-${mockId}`);
      localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      return { error: null, user: mockUser };
    }

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setAccessToken(data.session.access_token);
    }

    return { error, user: data.user };
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setAccessToken(null);
      localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase signOut error:', e);
    } finally {
      setUser(null);
      setSession(null);
      setAccessToken(null);
      localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isConfigured: isSupabaseConfigured,
      accessToken,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, isLoading, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Deterministic pseudo-UUID generator for offline testing when env vars are pending
function generatePseudoUUID(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex.repeat(2).slice(0, 12)}`;
}
