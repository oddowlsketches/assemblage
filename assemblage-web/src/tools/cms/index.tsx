/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
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
  collection_id?: string;
};

type Collection = {
  id: string;
  name: string;
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
  <aside className="w-48 bg-gray-100 h-screen p-4 border-r border-gray-200 hidden md:block">
    <nav className="space-y-2 text-sm">
      <a className="block font-medium text-blue-600" href="#">Images</a>
      <span className="block text-gray-400 cursor-not-allowed">Masks (soon)</span>
      <span className="block text-gray-400 cursor-not-allowed">Templates (soon)</span>
    </nav>
  </aside>
);

const CHUNK_SIZE = 2 * 1024 * 1024; // Reduced to 2MB chunks for better reliability

const UploadImagesDialog: React.FC<{ onUploaded: () => void, collections: Collection[], defaultCollectionId?: string }> = ({ onUploaded, collections, defaultCollectionId }) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ 
    processed: 0, 
    total: 0, 
    currentFile: '',
    currentFileProgress: 0 
  });
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadQueueRef = useRef<boolean>(true);
  const [selectedCollection, setSelectedCollection] = useState(defaultCollectionId || (collections[0]?.id || ''));

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const handleCancel = () => {
    uploadQueueRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setStatus({ message: 'Upload cancelled', type: 'info' });
    setTimeout(() => setOpen(false), 1000);
  };

  useEffect(() => {
    return () => {
      uploadQueueRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const uploadChunk = async (file: File, start: number): Promise<{ id: string; status: string; message?: string }> => {
    try {
      const chunk = file.slice(start, start + CHUNK_SIZE);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(chunk);
      });

      abortControllerRef.current = new AbortController();
      const res = await fetch('/.netlify/functions/upload-and-process-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          base64,
          chunkIndex: Math.floor(start / CHUNK_SIZE),
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
          fileSize: file.size,
          collectionId: selectedCollection
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Upload failed');
      }

      const result = await res.json();
      
      // Handle different response statuses
      if (result.status === 'deferred') {
        console.log(`[UPLOAD] Processing deferred for ${file.name}, will be handled in background`);
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload cancelled');
      }
      console.error(`[UPLOAD] Chunk upload error for ${file.name}:`, error);
      throw error;
    }
  };

  const processAndUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    uploadQueueRef.current = true;
    setProgress({ processed: 0, total: files.length, currentFile: '', currentFileProgress: 0 });
    setStatus({ message: 'Preparing to upload images...', type: 'info' });

    try {
      for (const file of files) {
        if (!uploadQueueRef.current) break; // Check if cancelled
        setProgress(prev => ({ ...prev, currentFile: file.name, currentFileProgress: 0 }));
        setStatus({ message: `Processing ${file.name}...`, type: 'info' });

        // Add file size check
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
        }

        // Upload file in chunks with retries
        const maxRetries = 3;
        let uploadComplete = false;
        let uploadId = '';

        for (let start = 0; start < file.size; start += CHUNK_SIZE) {
          if (!uploadQueueRef.current) break; // Check if cancelled
          let retries = 0;
          while (retries < maxRetries && !uploadComplete) {
            try {
              const result = await uploadChunk(file, start);
              
              // Update progress
              const progress = Math.min(100, (start + CHUNK_SIZE) / file.size * 100);
              setProgress(prev => ({ ...prev, currentFileProgress: Math.round(progress) }));
              
              if (result.status === 'uploaded' || result.status === 'deferred') {
                uploadComplete = true;
                uploadId = result.id;
                break;
              }
              
              setStatus({ 
                message: `Uploading ${file.name}: ${Math.round(progress)}%${result.status === 'deferred' ? ' (processing in background)' : ''}`, 
                type: 'info' 
              });
              break;
            } catch (error) {
              if (error instanceof Error && error.message === 'Upload cancelled') {
                return;
              }
              retries++;
              if (retries === maxRetries) {
                throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            }
          }
        }

        if (uploadComplete) {
          setProgress(prev => ({ 
            ...prev, 
            processed: prev.processed + 1,
            currentFileProgress: 100
          }));
        }
      }

      if (uploadQueueRef.current) { // Only show success if not cancelled
        setStatus({ 
          message: `Uploaded ${files.length} images successfully. Metadata processing will complete in the background.`, 
          type: 'success' 
        });
        
        onUploaded();
        setTimeout(() => setOpen(false), 1500);
      }
      setFiles([]);
    } catch (e: any) {
      console.error(e);
      setStatus({ 
        message: e.message === 'Upload cancelled' 
          ? 'Upload cancelled' 
          : (e.message || 'Upload failed'), 
        type: e.message === 'Upload cancelled' ? 'info' : 'error' 
      });
    } finally {
      setLoading(false);
      uploadQueueRef.current = true;
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
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Select Images</label>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFilesChange}
                className="w-full text-sm border rounded px-2 py-1" 
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                You can select multiple images. Images will be optimized automatically.
              </p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Choose Collection</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={selectedCollection}
                onChange={e => setSelectedCollection(e.target.value)}
                disabled={loading}
              >
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            
            {loading && progress.total > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.round((progress.processed / progress.total) * 100)}%` }}
                  ></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress.currentFileProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center">
                  {progress.processed} of {progress.total} images processed
                  {progress.currentFile && (
                    <span className="block text-gray-500">
                      {progress.currentFile} - {progress.currentFileProgress}%
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {status && (
              <div className={clsx(
                'p-3 rounded text-sm',
                status.type === 'error' ? 'bg-red-100 text-red-600' : 
                status.type === 'success' ? 'bg-green-100 text-green-600' : 
                'bg-blue-100 text-blue-600'
              )}>
                {status.message}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button 
                className={clsx(
                  "px-3 py-1 rounded text-sm",
                  loading 
                    ? "bg-red-600 text-white hover:bg-red-700" 
                    : "border border-gray-300 hover:bg-gray-100"
                )}
                onClick={loading ? handleCancel : () => setOpen(false)} 
              >
                {loading ? 'Cancel Upload' : 'Close'}
              </button>
              <button
                onClick={processAndUpload}
                disabled={loading || !files.length}
                className={clsx(
                  'px-3 py-1 rounded text-sm text-white', 
                  loading ? 'bg-gray-400' : files.length > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'
                )}
              >
                {loading ? 'Processing...' : `Process & Upload${files.length > 0 ? ` (${files.length})` : ''}`}
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [savingCollection, setSavingCollection] = useState(false);

  const handleImageClick = (image: ImageRow) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const loadImages = async (collectionId?: string) => {
    setLoading(true);
    let query = supa.from('images').select('*').order('created_at', { ascending: false });
    
    // Only filter by collection if a specific collection is selected
    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }
    
    const { data, error } = await query;
    console.log('CMS load images for collection:', collectionId, 'data:', data, 'error:', error);
    
    if (error) {
      console.error('Error fetching images in CMS:', error);
    } else if (data) {
      setRows(data as ImageRow[]);
    }
    setLoading(false);
  };

  const load = async () => {
    await loadImages(selectedCollection);
  };

  useEffect(() => {
    // Fetch collections first, then load images for the first collection
    (async () => {
      const { data, error } = await supa.from('image_collections').select('id, name').order('created_at', { ascending: true });
      if (!error && data) {
        setCollections(data);
        const firstCollectionId = data[0]?.id || '';
        setSelectedCollection(firstCollectionId);
        
        // Now load images for the selected collection
        await loadImages(firstCollectionId);
      } else {
        // If no collections found, just load all images
        await loadImages('');
      }
    })();
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

  // Add handler to create a new collection
  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name || savingCollection) return;
    
    setSavingCollection(true);
    try {
      const { data, error } = await supa.from('image_collections').insert({ name }).select();
      if (!error && data && data[0]) {
        setCollections(prev => [...prev, data[0]]);
        setSelectedCollection(data[0].id);
        setCreatingCollection(false);
        setNewCollectionName('');
        console.log('Collection created successfully:', data[0]);
      } else if (error) {
        console.error('Error creating collection:', error);
        alert('Error creating collection: ' + error.message);
      }
    } catch (err) {
      console.error('Exception creating collection:', err);
      alert('Failed to create collection');
    } finally {
      setSavingCollection(false);
    }
  };

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
        <select
          className="border px-2 py-1 text-sm rounded"
          value={selectedCollection}
          onChange={e => { 
            const newCollectionId = e.target.value;
            setSelectedCollection(newCollectionId);
            loadImages(newCollectionId);
          }}
        >
          {collections.map(col => (
            <option key={col.id} value={col.id}>{col.name}</option>
          ))}
        </select>
        <button
          className="border px-2 py-1 text-sm rounded bg-white hover:bg-gray-100"
          onClick={() => {
            setCreatingCollection(true);
            setNewCollectionName('');
          }}
          type="button"
        >
          + New Collection
        </button>
        <AddImageDialog onAdded={load} />
        <UploadImagesDialog onUploaded={load} collections={collections} defaultCollectionId={selectedCollection} />
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {Toolbar}

      {creatingCollection && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-medium">Create New Collection</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium">Collection Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter collection name"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                autoFocus
                onKeyDown={e => { 
                  if (e.key === 'Enter' && newCollectionName.trim() && !savingCollection) {
                    handleCreateCollection();
                  }
                  if (e.key === 'Escape') {
                    setCreatingCollection(false);
                    setNewCollectionName('');
                  }
                }}
                disabled={savingCollection}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="px-3 py-1 rounded text-sm border border-gray-300 hover:bg-gray-50" 
                onClick={() => { setCreatingCollection(false); setNewCollectionName(''); }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!newCollectionName.trim() || savingCollection}
                onClick={handleCreateCollection}
              >
                {savingCollection ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm md:max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={handleCloseModal} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <img 
              src={selectedImage.src} 
              alt={selectedImage.title} 
              className="w-full h-auto object-contain max-h-[60vh] rounded-t-lg" 
            />
            <div className="p-4 space-y-2">
              <h2 className="text-lg font-semibold">{selectedImage.title}</h2>
              {selectedImage.description && (
                <p className="text-sm text-gray-600">{selectedImage.description}</p>
              )}
              <TagChips tags={selectedImage.tags} />
              <p className="text-xs text-gray-400">ID: {selectedImage.id}</p>
              <p className="text-xs text-gray-400">Type: {selectedImage.imagetype}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CmsApp: React.FC = () => (
  <div className="flex h-screen bg-gray-50">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      <ImagesPage />
    </main>
  </div>
);

// ───────────────────────────────────────────────────────────
// Export the component as a named function for Fast Refresh compatibility
export default function App() {
  return <CmsApp />;
}

createRoot(document.getElementById('root')!).render(<App />); 