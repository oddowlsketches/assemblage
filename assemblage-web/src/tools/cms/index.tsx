/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import clsx from 'clsx';
import '../../styles/legacy-app.css';

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
  description?: string;
  imagetype: string;
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

const UploadImagesDialog: React.FC<{ onUploaded: () => void }> = ({ onUploaded }) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const processAndUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    setStatus({ message: 'Uploading images…', type: 'info' });
    try {
      for (const file of files) {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        // Call serverless function to handle upload and metadata
        const res = await fetch('/.netlify/functions/upload-and-process-image', {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, base64 }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Upload failed');
        }
      }
      setStatus({ message: `Uploaded ${files.length} images. Metadata will appear shortly.`, type: 'success' });
      onUploaded();
      setOpen(false);
      setFiles([]);
    } catch (e: any) {
      console.error(e);
      setStatus({ message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="px-3 py-1 rounded bg-green-600 text-white text-sm" onClick={() => setOpen(true)}>
        Upload Images
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-medium">Upload & Process Images</h2>
            <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
            {status && (
              <div className={clsx(
                'p-2 rounded',
                status.type === 'error' ? 'bg-red-100 text-red-600' : status.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              )}>
                {status.message}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button className="text-sm" onClick={() => setOpen(false)} disabled={loading}>Cancel</button>
              <button
                onClick={processAndUpload}
                disabled={loading || !files.length}
                className={clsx('px-3 py-1 rounded text-sm text-white', loading ? 'bg-gray-400' : 'bg-green-600')}
              >
                {loading ? 'Processing…' : 'Process & Add Images'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [selectedImage, setSelectedImage] = useState<ImageRow | null>(null);

  const handleImageClick = (image: ImageRow) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supa
      .from('images')
      .select('*')
      .order('created_at', { ascending: false }); // Default sort: newest first
    console.log('CMS load images:', data, error);
    if (error) {
      console.error('Error fetching images in CMS:', error);
    } else if (data) {
      setRows(data as ImageRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete image?')) return;
    const { error } = await supa.from('images').delete().eq('id', id);
    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Filter rows based on search query
  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  // Helper to truncate long descriptions
  const truncate = (str: string, n = 80) =>
    str && str.length > n ? str.slice(0, n) + '…' : str;

  const Toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h1 className="text-xl font-semibold">Images</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search images…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-1 text-sm rounded w-64"
        />
        <button
          onClick={() => setView(view === 'table' ? 'grid' : 'table')}
          className="border rounded px-3 py-1 text-sm bg-gray-50 hover:bg-gray-100"
        >
          {view === 'table' ? 'Grid View' : 'Table View'}
        </button>
        <AddImageDialog onAdded={load} />
        <UploadImagesDialog onUploaded={load} />
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {Toolbar}

      {loading ? (
        <p>Loading…</p>
      ) : (
        view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse table-auto rounded shadow">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="p-2 border-b font-semibold sticky left-0 bg-gray-50">Thumb</th>
                  <th className="p-2 border-b font-semibold">ID</th>
                  <th className="p-2 border-b font-semibold">Title</th>
                  <th className="p-2 border-b font-semibold">Description</th>
                  <th className="p-2 border-b font-semibold">Tags</th>
                  <th className="p-2 border-b font-semibold">Type</th>
                  <th className="p-2 border-b w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-gray-100 group cursor-pointer" onClick={() => handleImageClick(row)}>
                    <td className="p-2 align-top sticky left-0 bg-white">
                      <img
                        src={row.src}
                        alt={row.title}
                        className="w-16 h-16 object-cover rounded border bg-white"
                      />
                    </td>
                    <td className="p-2 align-top max-w-[120px] truncate text-gray-500">{row.id}</td>
                    <td className="p-2 align-top max-w-[120px] truncate">{row.title}</td>
                    <td className="p-2 align-top max-w-[260px] text-gray-700">
                      {row.description === "Processing..." ? (
                        <span className="italic text-gray-500">Processing...</span>
                      ) : row.description && row.description.length > 80 ? (
                        <span title={row.description}>{truncate(row.description, 80)}</span>
                      ) : (
                        row.description
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {row.imagetype === "pending" && (!row.tags || row.tags.length === 0) ? (
                        <span className="italic text-gray-500">Processing...</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top max-w-[100px] truncate">
                      {row.imagetype === "pending" ? (
                        <span className="italic text-gray-500">Processing...</span>
                      ) : (
                        row.imagetype
                      )}
                    </td>
                    <td className="p-2 align-top text-center">
                      <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {filteredRows.map((img) => (
              <div key={img.id} className="border rounded shadow-sm p-2 flex flex-col cursor-pointer" onClick={() => handleImageClick(img)}>
                <img src={img.src} alt={img.title} className="w-full h-32 object-cover rounded" />
                <div className="mt-2 text-xs font-medium truncate" title={img.id}>{img.id}</div>
                <div className="text-xs truncate" title={img.title}>{img.title}</div>
                <div className="text-[10px] text-gray-600 truncate mb-1" title={img.description}>
                  {img.description === "Processing..." ? (
                    <span className="italic text-gray-500">Processing...</span>
                  ) : (
                    truncate(img.description || "", 60)
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {img.imagetype === "pending" && (!img.tags || img.tags.length === 0) ? (
                    <span className="italic text-gray-500 text-[10px]">Processing tags...</span>
                  ) : (
                    img.tags.slice(0, 4).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded-full">{t}</span>
                    ))
                  )}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">(Type: {img.imagetype === "pending" ? "..." : img.imagetype})</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Basic Modal Placeholder */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30" onClick={handleCloseModal}>
          <div className="bg-white p-6 rounded shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{selectedImage.title}</h2>
            <img src={selectedImage.src} alt={selectedImage.title} className="w-full h-64 object-contain mb-4 rounded" />
            <p className="text-sm"><strong className="w-20 inline-block">ID:</strong> {selectedImage.id}</p>
            <p className="text-sm"><strong className="w-20 inline-block">Description:</strong> {selectedImage.description}</p>
            <p className="text-sm"><strong className="w-20 inline-block">Tags:</strong> {selectedImage.tags.join(', ')}</p>
            <p className="text-sm"><strong className="w-20 inline-block">Type:</strong> {selectedImage.imagetype}</p>
            <button onClick={handleCloseModal} className="mt-6 px-3 py-1 rounded bg-blue-600 text-white text-sm float-right">Close</button>
            {/* Edit form will go here later */}
          </div>
        </div>
      )}
    </div>
  );
};

const CmsApp: React.FC = () => (
  <div className="flex h-screen">
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