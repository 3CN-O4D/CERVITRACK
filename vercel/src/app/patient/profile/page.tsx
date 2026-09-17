'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { getCountyNames, getSubCounties, getWards } from '@/lib/kenya';
import { safePhotoSrc } from '@/lib/photo';

interface UserProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  last_healed_date: string | null;
  county: string | null;
  sub_county: string | null;
  ward: string | null;
  photo: string | null;
}

export default function PatientProfile() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>({ name: null, email: null, phone: null, birth_date: null, last_healed_date: null, county: null, sub_county: null, ward: null, photo: null });
  const [form, setForm] = useState<UserProfile>({ name: null, email: null, phone: null, birth_date: null, last_healed_date: null, county: null, sub_county: null, ward: null, photo: null });
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
          .select('name, email, phone, birth_date, last_healed_date, county, sub_county, ward, photo')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setUser(profile || { name: null, email: null, phone: null, birth_date: null, last_healed_date: null, county: null, sub_county: null, ward: null, photo: null });
        setForm({ ...profile, county: profile?.county, sub_county: profile?.sub_county, ward: profile?.ward, photo: profile?.photo });
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

  const resizeImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const side = 256;
          const scale = Math.min(1, side / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas unsupported'));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject(new Error('Failed to read image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Image must be under 8MB'); return; }
    try {
      const dataUrl = await resizeImage(file);
      setForm((f) => ({ ...f, photo: dataUrl }));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    }
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
          photo: form.photo,
        })
        .eq('id', session.user.id);

      if (error) throw error;
      setSuccess(true);
      // refresh user data
      const { data: updated } = await supabase
        .from('users')
        .select('name, email, phone, birth_date, last_healed_date, county, sub_county, ward, photo')
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

      <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary">
          {safePhotoSrc(form.photo) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={safePhotoSrc(form.photo) as string} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold text-white">{(form.name || 'U').trim()[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Profile Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
          />
          <span className="text-xs text-gray-500">Photo is stored with your profile and shown on your dashboard.</span>
        </div>
      </div>

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