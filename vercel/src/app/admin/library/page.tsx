'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';

interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string;
  video_url: string;
  category: string;
  tags: string[];
  read_time: string;
  featured: boolean;
  published: boolean;
  last_updated: string;
}

const EMPTY: Article = {
  id: 0,
  title: '',
  summary: '',
  content: '',
  image: '',
  video_url: '',
  category: 'General',
  tags: [],
  read_time: '5 min read',
  featured: false,
  published: true,
  last_updated: '',
};

const CATEGORIES = ['General', 'HPV Basics', 'Screening', 'Vaccines', 'Treatment', 'Prevention', 'Nutrition', 'Risk Factors', 'Results', 'FAQ'];

export default function AdminLibrary() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Article>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/library');
      if (res.ok) {
        const d = await res.json();
        setArticles(Array.isArray(d) ? d : []);
      }
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm(EMPTY);
    setTagsText('');
    setEditing(false);
    setMessage('');
  };

  const openEdit = (a: Article) => {
    setForm(a);
    setTagsText(a.tags.join(', '));
    setEditing(true);
    setMessage('');
  };

  const set = (key: keyof Article, value: any) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (!form.title.trim()) { setMessage('Title is required'); return; }
    setSaving(true);
    setMessage('');
    const payload = { ...form, tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean) };
    try {
      const res = await apiFetch(editing ? `/api/admin/library/${form.id}` : '/api/admin/library', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage(editing ? 'Article updated.' : 'Article created.');
        await load();
        setEditing(false);
        setForm(EMPTY);
        setTagsText('');
      } else {
        const d = await res.json().catch(() => ({}));
        setMessage(d.error || 'Save failed');
      }
    } catch {
      setMessage('Save failed');
    }
    setSaving(false);
  }

  async function togglePublish(a: Article) {
    await apiFetch(`/api/admin/library/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !a.published }),
    });
    load();
  }

  async function remove(a: Article) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await apiFetch(`/api/admin/library/${a.id}`, { method: 'DELETE' });
    if (editing && form.id === a.id) { setForm(EMPTY); setEditing(false); }
    load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-sky-700">Library Manager</h1>
          <p className="text-sm text-gray-500">Add, edit or delete health library articles (text, images, videos and YouTube embeds).</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          + New article
        </button>
      </div>

      {message && <p className="mb-3 rounded bg-sky-50 px-3 py-2 text-sm text-sky-700">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">{editing ? `Edit: ${form.title}` : 'New article'}</h2>
          <div className="space-y-3">
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Title *" className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="rounded border border-gray-200 px-3 py-2 text-sm outline-none">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={form.read_time} onChange={(e) => set('read_time', e.target.value)} placeholder="Read time" className="rounded border border-gray-200 px-3 py-2 text-sm outline-none" />
            </div>
            <input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="Image URL (optional)" className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            <input value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="Video / YouTube URL (optional)" className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Short summary (shown in the list)" rows={2} className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            <textarea value={form.content} onChange={(e) => set('content', e.target.value)} placeholder="Full article content (use **bold** and lines starting with • for bullets)" rows={8} className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400" />
            <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="Tags, comma separated" className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none" />
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
                Published
              </label>
              <button
                onClick={save}
                disabled={saving}
                className="ml-auto rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save article'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">Articles ({articles.length})</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : articles.length === 0 ? (
            <p className="text-sm text-gray-500">No articles yet. Create your first one.</p>
          ) : (
            <ul className="max-h-[560px] space-y-2 overflow-y-auto">
              {articles.map((a) => (
                <li key={a.id} className={`rounded border p-3 ${a.published ? 'border-gray-200' : 'border-amber-200 bg-amber-50/40'}`}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{a.category} · {a.read_time}</p>
                    </div>
                    {a.featured && <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">★</span>}
                    {!a.published && <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">Draft</span>}
                  </div>
                  {a.video_url && <p className="mt-1 flex items-center gap-1 text-[11px] text-sky-600">▶ Has video</p>}
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => openEdit(a)} className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold hover:bg-gray-200">Edit</button>
                    <button onClick={() => togglePublish(a)} className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold hover:bg-gray-200">
                      {a.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => remove(a)} className="rounded bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}