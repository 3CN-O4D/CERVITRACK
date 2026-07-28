import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase/client';
import { getItem, setItem, removeItem } from '../services/storage';
import { saveUser as saveUserToLocal, getCurrentUser, getUser as getLocalUser, getDb } from '../services/localDb';
import { registerViaApi, loginViaApi } from '../services/api';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  consentAccepted: boolean;
  acceptConsent: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  requestData: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginByPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string, role: string, location?: string, county?: string, subCounty?: string, ward?: string, photoUri?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CONSENT_KEY = '@cervitrack_consent';
const LAST_USER_KEY = '@cervitrack_last_user';

const CLINICIAN_ROLES = ['clinician', 'admin', 'nurse', 'lab_technician', 'facility_admin', 'county_admin', 'national_admin', 'system_admin'];

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

function mapLocalUser(localUser: any): User {
  return {
    id: localUser.id,
    name: localUser.name || '',
    email: localUser.email || '',
    phone: localUser.phone || '',
    password: '',
    role: (localUser.role as User['role']) || 'patient',
    photo: localUser.photo || '',
    birthDate: localUser.birth_date || '',
    lastHealedDate: localUser.last_healed_date || '',
    location: [localUser.county, localUser.sub_county, localUser.ward].filter(Boolean).join(', '),
    county: localUser.county || '',
    subCounty: localUser.sub_county || '',
    ward: localUser.ward || '',
    createdAt: localUser.created_at || new Date().toISOString(),
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

      // Try remote session first
      try {
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
            if (mounted) setLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback to local SQLite for offline access
      if (mounted) {
        const localUser = getCurrentUser();
        if (localUser) {
          setUser(mapLocalUser(localUser));
          setConsentAccepted(true);
          // Mark as last user so re-login doesn't wipe data
          await setItem(LAST_USER_KEY, localUser.id);
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

  // Clear local data for clean data isolation
  const clearLocalSession = useCallback(async () => {
    try {
      const database = getDb();
      database.execSync(`
        DELETE FROM screenings;
        DELETE FROM vaccines;
        DELETE FROM appointments;
        DELETE FROM notifications;
        DELETE FROM messages;
        DELETE FROM conversations;
        DELETE FROM lab_results;
        DELETE FROM kit_requests;
        DELETE FROM sample_kits;
        DELETE FROM feedback;
        DELETE FROM sync_queue;
      `);
    } catch {}
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    try {
      const tables = [
        'screenings', 'vaccines', 'appointments', 'notifications',
        'lab_results', 'test_results', 'followups', 'feedback',
        'consent_log', 'kit_requests', 'sample_kits',
      ];
      for (const table of tables) {
        try {
          await supabase.from(table).delete().eq('user_id', user.id);
        } catch {}
        try {
          await supabase.from(table).delete().eq('profile_id', user.id);
        } catch {}
        try {
          await supabase.from(table).delete().eq('patient_id', user.id);
        } catch {}
      }
      await supabase.from('users').delete().eq('id', user.id);
    } catch {}
    // Clear local SQLite
    await clearLocalSession();
    setUser(null);
    await supabase.auth.signOut();
    await removeItem(CONSENT_KEY);
  }, [user, clearLocalSession]);

  const requestData = useCallback(async () => {
    if (!user) return;
    try {
      const tables = [
        'screenings', 'vaccines', 'appointments', 'notifications',
        'lab_results', 'test_results', 'followups', 'feedback',
        'consent_log', 'kit_requests', 'sample_kits',
      ];
      let report = `=== CERVITRACK DATA EXPORT ===\nUser: ${user.name} (${user.email})\nID: ${user.id}\nDate: ${new Date().toISOString()}\n\n`;

      for (const table of tables) {
        try {
          const { data } = await supabase
            .from(table)
            .select('*')
            .or(`user_id.eq.${user.id},profile_id.eq.${user.id},patient_id.eq.${user.id}`);
          if (data && data.length > 0) {
            report += `\n--- ${table.toUpperCase()} ---\n`;
            report += JSON.stringify(data, null, 2) + '\n';
          }
        } catch {}
      }

      // Save report to local
      const db = getDb();
      db.runSync(
        `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`,
        `data_export_${user.id}`, report
      );

      Alert.alert(
        'Data Export',
        'Your data has been compiled and saved locally. An admin will be notified to provide you with a downloadable copy.'
      );
    } catch {
      Alert.alert('Error', 'Could not export data. Please try again later.');
    }
  }, [user]);

  const ensureUserIsolation = useCallback(async (userId: string) => {
    const lastUserId = await getItem(LAST_USER_KEY);
    if (lastUserId && lastUserId !== userId) {
      await clearLocalSession();
    }
    await setItem(LAST_USER_KEY, userId);
  }, [clearLocalSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const apiResult = await loginViaApi(email, password);
      if (apiResult && apiResult.user) {
        const userData = apiResult.user;
        if (userData.role && CLINICIAN_ROLES.includes(userData.role)) {
          return {
            success: false,
            error: 'Clinician accounts cannot access the patient app. Please use the web portal at cervitrack.vercel.app',
          };
        }
        saveUserToLocal({
          id: userData.id,
          name: userData.name || email.split('@')[0],
          email: userData.email || email,
          phone: userData.phone || '',
          password,
          role: userData.role || 'patient',
          patient_id: userData.patient_id || userData.id,
          created_at: new Date().toISOString(),
        });
        await ensureUserIsolation(userData.id);
        return { success: true };
      }
      // Fall back to local SQLite
      const localUser = getCurrentUser();
      if (localUser && localUser.email === email) {
        await ensureUserIsolation(localUser.id);
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }, [ensureUserIsolation]);

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

      if (profile.role && CLINICIAN_ROLES.includes(profile.role)) {
        return {
          success: false,
          error: 'Clinician accounts cannot access the patient app. Please use the web portal at cervitrack.vercel.app',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.password || 'default123',
      });
      if (error || !data.user) {
        return { success: false, error: error?.message ?? 'Login failed' };
      }

      await ensureUserIsolation(data.user.id);
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }, [ensureUserIsolation]);

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string, role: string, location?: string, county?: string, subCounty?: string, ward?: string, photoUri?: string) => {
      try {
        const result = await registerViaApi({ email, password, name, phone, role, county, sub_county: subCounty, ward });
        if (result.error) return { success: false, error: result.error };
        const userData = result.user || result;
        const uid = userData.id || userData.user_id || `local-${Date.now()}`;
        saveUserToLocal({
          id: uid,
          name: userData.name || name,
          email: userData.email || email,
          phone: userData.phone || phone,
          password,
          role: userData.role || role || 'patient',
          patient_id: userData.patient_id || uid,
          created_at: new Date().toISOString(),
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
    await removeItem(CONSENT_KEY);
    await clearLocalSession();
  }, [clearLocalSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        consentAccepted,
        acceptConsent,
        deleteAccount,
        requestData,
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
