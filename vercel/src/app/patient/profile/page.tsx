'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { getCountyNames, getSubCounties, getWards } from '@/lib/kenya';

interface UserProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  last_healed_date: string | null;
  county: string | null;
  sub_county: string | null;
  ward: string | null;
}

export default function PatientProfile() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>({ name: null, email: null, phone: null, birth_date: null, last_healed_date: null, county: null, sub_county: null, ward: null });
  const [form, setForm] = useState<UserProfile>({ name: null, email: null, phone: null, birth_date: null, last_healed_date: null, county: null, sub_county: null, ward: null });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { session} } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/patient');
        return;
      }
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('name, email, phone, birth_date, last_healed_date, county, sub_county, ward')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setUser(profile || { name: null, email: null, phone: null, birth_date: null, last_healed_date: null, county: null, sub_county: null, ward: null });
        setForm({ ...profile, county: profile?.county, sub_county: profile?.sub_county, ward: profile?.ward });
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      }
    }
    init();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value === '' ? null : value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');
    const { data: { session} = {} } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: form.name,
          phone: form.phone,
          birth_date: form.birth_date,
          last_healed_date: form.last_healed_date,
          county: form.county,
          sub_county: form.sub_county,
          ward: form.ward,
        })
        .eq('id', session.user.id);

      if (error) throw error;
      setSuccess(true);
      // refresh user data
      const { data: updated } = await supabase
        .from('users')
        .select('name, email, phone, birth_date, last_healed_date, county, sub_county, ward')
        .eq('id', session.user.id)
        .single();
      setUser(updated || form);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
          Profile updated successfully
        </div>
      )}

      <form onSubmit={async (e) => {
        e.preventDefault();
        await saveProfile();
      }} className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={form?.name || ''}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form?.email || ''}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="jane@example.com"
              disabled
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form?.phone || ''}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+254712345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              name="birth_date"
              value={form?.birth_date || ''}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Last Healed Date (Optional)</label>
          <input
            type="date"
            name="last_healed_date"
            value={form?.last_healed_date || ''}
            onChange={handleChange}
            className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">County</label>
            <select
              name="county"
              value={form?.county || ''}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select County —</option>
              {getCountyNames().map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sub-County</label>
            <select
              name="sub_county"
              value={form?.sub_county || ''}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select Sub-County —</option>
              {form?.county ? getSubCounties(form.county).map((s: string) => (
                <option key={s} value={s}>{s}</option>
              )) : (
                <option value="">Loading…</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ward</label>
            <select
              name="ward"
              value={form?.ward || ''}
              onChange={handleChange}
              className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select Ward —</option>
              {form?.county && form?.sub_county ? getWards(form.county, form.sub_county).map((w: string) => (
                <option key={w} value={w}>{w}</option>
              )) : (
                <option value="">Loading…</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender (Optional)</label>
            {/* placeholder; can extend later */}
            <select name="gender" className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Select —</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded bg-primary px-4 py-2 text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      <div className="mt-6 flex gap-3">
        <Link href="/patient/kits" className="flex-1 rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
          Back to Kit Tracker
        </Link>
        <Link href="/auth?signout" className="flex-1 rounded bg-red-600 px-4 py-2 text-white font-medium text-sm hover:bg-red-700 transition-colors">
          Sign Out
        </Link>
      </div>
    </div>
  );
}