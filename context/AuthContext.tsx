import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { getItem, setItem, removeItem } from '../services/storage';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  consentAccepted: boolean;
  acceptConsent: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginByPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string, role: string, location?: string, county?: string, subCounty?: string, ward?: string, photoUri?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CONSENT_KEY = '@cervitrack_consent';

function mapSupabaseUser(sbUser: any, profile: any): User {
  return {
    id: sbUser.id,
    name: profile?.name ?? sbUser.email?.split('@')[0] ?? 'User',
    email: sbUser.email ?? '',
    phone: profile?.phone ?? '',
    password: '',
    role: (profile?.role as User['role']) ?? 'patient',
    photo: profile?.photo ?? '',
    birthDate: profile?.birth_date ?? '',
    lastHealedDate: profile?.last_healed_date ?? '',
    location: [profile?.county, profile?.sub_county, profile?.ward].filter(Boolean).join(', '),
    createdAt: sbUser.created_at ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const consent = await getItem(CONSENT_KEY);
        if (consent === 'true') setConsentAccepted(true);
      } catch {}

      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile && mounted) setUser(mapSupabaseUser(session.user, profile));
      }
      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) setUser(mapSupabaseUser(session.user, profile));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const acceptConsent = useCallback(async () => {
    await setItem(CONSENT_KEY, 'true');
    setConsentAccepted(true);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    try {
      await supabase.from('screenings').delete().eq('profile_id', user.id);
      await supabase.from('appointments').delete().eq('user_id', user.id);
      await supabase.from('notifications').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
    } catch {}
    setUser(null);
    await supabase.auth.signOut();
    await removeItem(CONSENT_KEY);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) {
        return { success: false, error: error?.message ?? 'Invalid credentials' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const loginByPhone = useCallback(async (phone: string) => {
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error || !users) return { success: false, error: 'Login failed' };

      const sbUser = users.find((u: any) => u.phone === phone.trim());
      if (!sbUser) return { success: false, error: 'Phone number not registered' };

      await supabase.auth.signInWithPassword({ email: sbUser.email!, password: '' });
      // Force a refresh by triggering the onAuthStateChange listener
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string, role: string, location?: string, county?: string, subCounty?: string, ward?: string, photoUri?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          phone: phone || undefined,
          options: {
            data: {
              name,
              phone,
              role,
              county,
              sub_county: subCounty,
              ward,
              photo: photoUri ?? null,
              consent_terms: true,
              consent_medical: true,
              consent_at: new Date().toISOString(),
            },
          },
        });
        if (error || !data.user) {
          return { success: false, error: error?.message ?? 'Registration failed' };
        }
        return { success: true };
      } catch {
        return { success: false, error: 'Registration failed' };
      }
    },
    []
  );

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.email) payload.email = updates.email;
    if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
    if (updates.lastHealedDate !== undefined) payload.last_healed_date = updates.lastHealedDate;
    if (updates.photo !== undefined) payload.photo = updates.photo;
    if (updates.location) {
      const parts = updates.location.split(',').map((s: string) => s.trim());
      if (parts[0]) payload.county = parts[0];
      if (parts[1]) payload.sub_county = parts[1];
      if (parts[2]) payload.ward = parts[2];
    } else {
      if ('county' in updates) payload.county = updates.county;
      if ('subCounty' in updates) payload.sub_county = updates.subCounty;
      if ('ward' in updates) payload.ward = updates.ward;
    }

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', user.id);

    if (!error) {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  }, [user]);

  const logout = useCallback(async () => {
    setUser(null);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        consentAccepted,
        acceptConsent,
        deleteAccount,
        login,
        loginByPhone,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
