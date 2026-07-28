import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { getItem, setItem, removeItem } from '../services/storage';
import { saveUser as saveUserToLocal, getCurrentUser, clearAllData } from '../services/localDb';
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
    county: profile?.county ?? '',
    subCounty: profile?.sub_county ?? '',
    ward: profile?.ward ?? '',
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
        if (profile && mounted) {
          setUser(mapSupabaseUser(session.user, profile));
          saveUserToLocal(profile);
        }
      } else {
        // No supabase session — try local SQLite for offline-first
        const localUser = getCurrentUser();
        if (localUser && mounted) {
          const u: User = {
            id: localUser.id,
            name: localUser.name || '',
            email: localUser.email || '',
            phone: localUser.phone || '',
            password: '',
            role: localUser.role || 'patient',
            photo: localUser.photo || '',
            birthDate: localUser.birth_date || '',
            lastHealedDate: localUser.last_healed_date || '',
            location: [localUser.county, localUser.sub_county, localUser.ward].filter(Boolean).join(', '),
            county: localUser.county || '',
            subCounty: localUser.sub_county || '',
            ward: localUser.ward || '',
            createdAt: localUser.created_at || new Date().toISOString(),
          };
          setUser(u);

          // Try silent re-auth in background
          if (localUser.email && localUser.password) {
            supabase.auth.signInWithPassword({
              email: localUser.email,
              password: localUser.password,
            }).then(({ data, error }) => {
              if (!error && data.session && mounted) {
                // Refresh profile from server
                supabase.from('users').select('*').eq('id', localUser.id).maybeSingle()
                  .then(({ data: profile }) => {
                    if (profile && mounted) {
                      setUser(mapSupabaseUser(data.session.user, profile));
                      saveUserToLocal(profile);
                    }
                  });
              }
            });
          }
        }
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
          if (profile) {
            setUser(mapSupabaseUser(session.user, profile));
            saveUserToLocal(profile);
          }
          // Sync consent if accepted locally but not in Supabase
          const consentVal = await getItem(CONSENT_KEY);
          if (consentVal === 'true') {
            try {
              const { data: existing } = await supabase
                .from('consent_log')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();
              if (!existing) {
                await supabase.from('consent_log').insert({
                  user_id: session.user.id,
                  consent_type: 'registration',
                  consent_terms: true,
                  consent_medical: true,
                  accepted: true,
                });
              }
            } catch { /* consent sync is best-effort */ }
          }
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
    // Sync consent to Supabase if user is already authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      try {
        await supabase.from('consent_log').insert({
          user_id: session.user.id,
          consent_type: 'registration',
          consent_terms: true,
          consent_medical: true,
          accepted: true,
        });
      } catch { /* consent synced locally */ }
    }
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
    await clearAllData();
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
      // Check role — only patients can use the mobile app
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profile && profile.role && profile.role !== 'patient') {
        await supabase.auth.signOut();
        return { success: false, error: 'Clinician accounts cannot use the patient app. Please use the web portal.' };
      }
      // Clear old user data before saving new user
      clearAllData();
      if (profile) {
        saveUserToLocal({ ...profile, password });
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const loginByPhone = useCallback(async (phone: string) => {
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('email, password, role')
        .eq('phone', phone.trim())
        .maybeSingle();
      if (profileErr || !profile?.email) {
        return { success: false, error: 'Phone number not registered' };
      }
      if (profile.role && profile.role !== 'patient') {
        return { success: false, error: 'Clinician accounts cannot use the patient app. Please use the web portal.' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.password || 'default123',
      });
      if (error || !data.user) {
        return { success: false, error: error?.message ?? 'Login failed' };
      }
      // Clear old user data before saving new user
      clearAllData();
      saveUserToLocal({ ...profile, password: profile.password || 'default123' });
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

        // If email confirmation is required, signIn directly so user doesn't hang
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            // User created but needs email confirmation — tell them
            return { success: false, error: 'Account created. Check your email to verify, then sign in.' };
          }
        }

        // Create profile row in users table
        const uid = data.user.id;
        const patientId = `PT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
        const { error: profileErr } = await supabase.from('users').upsert({
          id: uid,
          name,
          email,
          phone,
          password,
          role: role || 'patient',
          photo: photoUri || null,
          county: county || '',
          sub_county: subCounty || '',
          ward: ward || '',
          patient_id: patientId,
          consent_terms: true,
          consent_medical: true,
          consent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });
        if (profileErr) {
          console.warn('Profile insert failed:', profileErr.message);
        }

        // Save user to local SQLite
        saveUserToLocal({
          id: uid, name, email, phone, password, role: role || 'patient',
          photo: photoUri || null, county: county || '', sub_county: subCounty || '',
          ward: ward || '', patient_id: patientId, created_at: new Date().toISOString(),
        });

        // Create consent log
        await supabase.from('consent_log').insert({
          user_id: uid,
          consent_type: 'registration',
          consent_terms: true,
          consent_medical: true,
          accepted: true,
        });

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
    clearAllData();
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
