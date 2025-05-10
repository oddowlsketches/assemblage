/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import clsx from 'clsx';

// TODO: restrict to Service Role via RLS once auth is wired up
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supa: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

type ImageRow = {
  id: string;
  src: string;
  title: string;
  tags: string[];
  created_at?: string;
};

const TagChips: React.FC<{ tags: string[] }> = ({ tags }) => (
  <div className="flex flex-wrap gap-1">
    {tags.map((t) => (
      <span
        key={t}
        className="px-2 py-0.5 text-xs rounded-md bg-gray-200 text-gray-700"
      >
        {t}
      </span>
    ))}
  </div>
);

const Sidebar: React.FC = () => (
  <aside className="w-48 bg-gray-100 h-screen p-4 border-r border-gray-200">
    <nav className="space-y-2 text-sm">
      <a className="block font-medium text-blue-600" href="#">Images</a>
      <span className="block text-gray-400 cursor-not-allowed">Masks (soon)</span>
      <span className="block text-gray-400 cursor-not-allowed">Templates (soon)</span>
    </nav>
  </aside>
);

const AddImageDialog: React.FC<{ onAdded: () => void }> = ({ onAdded }) => {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = src.trim() && title.trim();

  const handleSave = async () => {
    if (!valid) return;
    setLoading(true);
    const tagArr = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const { error } = await supa.from('images').insert({ src, title, tags: tagArr });
    setLoading(false);
    if (!error) {
      setSrc('');
      setTitle('');
      setTags('');
      setOpen(false);
      onAdded();
    } else {
      alert(error.message);
    }
  };

  return (
    <>
      <button
        className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
        onClick={() => setOpen(true)}
      >
        Add Image
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-medium">Add Image</h2>
            <div className="space-y-1">
              <label className="text-sm">Image URL</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Title</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Tags (comma-separated)</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="text-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button
                disabled={!valid || loading}
                onClick={handleSave}
                className={clsx(
                  'px-3 py-1 rounded text-sm text-white',
                  loading ? 'bg-gray-400' : 'bg-blue-600'
                )}
              >
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ImagesPage: React.FC = () => {
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supa.from('images').select('*');
    if (!error && data) setRows(data as ImageRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = async (id: string, field: keyof ImageRow, value: any) => {
    const { error } = await supa.from('images').update({ [field]: value }).eq('id', id);
    if (!error) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete image?')) return;
    const { error } = await supa.from('images').delete().eq('id', id);
    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Images</h1>
        <AddImageDialog onAdded={load} />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="p-2 border-b">ID</th>
              <th className="p-2 border-b">Thumbnail</th>
              <th className="p-2 border-b">Title</th>
              <th className="p-2 border-b">Tags</th>
              <th className="p-2 border-b w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-2 max-w-[140px] truncate text-gray-500">{row.id}</td>
                <td className="p-2">
                  <img src={row.src} alt={row.title} className="w-16 h-16 object-cover rounded" />
                </td>
                <td className="p-2">
                  <input
                    className="w-full bg-transparent border-none focus:ring-0"
                    value={row.title}
                    onChange={(e) => handleUpdate(row.id, 'title', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full bg-transparent border-none focus:ring-0"
                    value={row.tags.join(', ')}
                    onChange={(e) => handleUpdate(row.id, 'tags', e.target.value.split(',').map(t=>t.trim()).filter(Boolean))}
                  />
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => handleDelete(row.id)} className="text-red-600">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const CmsApp: React.FC = () => (
  <div className="flex">
    <Sidebar />
    <ImagesPage />
  </div>
);

// ───────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CmsApp />
  </React.StrictMode>
); 