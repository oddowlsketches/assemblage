import MasksPage from './MasksPage';
import TemplatesPage from './TemplatesPage';
import { cmsSupabase as supa } from './supabaseClient';
import { ArrowClockwise, Pencil, Trash, Globe, Lock } from 'phosphor-react';

/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import clsx from 'clsx';
import '../../styles/legacy-app.css';

type ImageRow = {
  id: string;
  src: string;
  title: string;
  tags: string[];
  created_at?: string;
  description?: string;
  image_role?: 'texture' | 'narrative' | 'conceptual' | 'pending';
  collection_id?: string;
  rotation?: number; // 0, 90, 180, 270 degrees
  
  // Rich metadata fields
  is_black_and_white?: boolean;
  is_photograph?: boolean;
  white_edge_score?: number;
  palette_suitability?: 'vibrant' | 'neutral' | 'earthtone' | 'muted' | 'pastel';
  metadata_status?: 'pending_llm' | 'processing' | 'complete' | 'error';
  processing_error?: string;
  last_processed?: string;
};

type Collection = {
  id: string;
  name: string;
  description?: string;
  is_public?: boolean;
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

const Sidebar: React.FC<{ currentPage: string; onPageChange: (page: string) => void }> = ({ currentPage, onPageChange }) => (
  <aside className="w-48 bg-gray-100 h-screen p-4 border-r border-gray-200 hidden md:block">
    <nav className="space-y-2 text-sm">
      <button 
        className={`block w-full text-left font-medium ${
          currentPage === 'images' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
        }`}
        onClick={() => onPageChange('images')}
      >
        Images
      </button>
      <button 
        className={`block w-full text-left font-medium ${
          currentPage === 'masks' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
        }`}
        onClick={() => onPageChange('masks')}
      >
        Masks
      </button>
      <button 
        className={`block w-full text-left font-medium ${
          currentPage === 'templates' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
        }`}
        onClick={() => onPageChange('templates')}
      >
        Templates
      </button>
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
    // Only allow valid image_role values (AddImageDialog does not have a field, so always use 'narrative')
    const imageRole = 'narrative';
    const { error } = await supa.from('images').insert({ src, title, tags: tagArr, image_role: imageRole });
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

const CollectionEditDialog: React.FC<{
  collection: Collection;
  onClose: () => void;
  onUpdate: (collection: Collection) => void;
  onDelete: (collectionId: string) => void;
}> = ({ collection, onClose, onUpdate, onDelete }) => {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || '');
  const [isPublic, setIsPublic] = useState(collection.is_public || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supa
        .from('image_collections')
        .update({
          name: name.trim(),
          description: description.trim(),
          is_public: isPublic
        })
        .eq('id', collection.id);

      if (!error) {
        onUpdate({
          ...collection,
          name: name.trim(),
          description: description.trim(),
          is_public: isPublic
        });
        onClose();
      } else {
        alert('Error updating collection: ' + error.message);
      }
    } catch (err) {
      alert('Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-medium">Edit Collection</h2>
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            autoFocus
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Optional description..."
          />
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is-public"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
          />
          <label htmlFor="is-public" className="text-sm">
            Make this collection publicly accessible
          </label>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this collection? All images will be deleted.')) {
                onDelete(collection.id);
                onClose();
              }
            }}
            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
          >
            Delete Collection
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageDetailsModal: React.FC<{ 
  image: ImageRow; 
  onClose: () => void; 
  onUpdate: () => void; 
}> = ({ image, onClose, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: image.title,
    description: image.description || '',
    image_role: image.image_role || 'narrative',
    palette_suitability: image.palette_suitability || 'vibrant',
    is_black_and_white: image.is_black_and_white || false,
    is_photograph: image.is_photograph !== false, // Default to true
    tags: image.tags.join(', ')
  });
  const [saving, setSaving] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(image.rotation || 0);

  const handleRotate = async () => {
    const newRotation = (currentRotation + 90) % 360;
    setSaving(true);
    try {
      console.log('Rotating image:', image.id, 'from', currentRotation, 'to', newRotation);
      
      const { data, error } = await supa
        .from('images')
        .update({ rotation: newRotation })
        .eq('id', image.id)
        .select();

      console.log('Rotation update result:', { data, error });

      if (error) {
        console.error('Database rotation error:', error);
        alert('Error rotating image: ' + error.message);
      } else {
        console.log('Rotation successful, updated data:', data);
        setCurrentRotation(newRotation);
        // Update the image object in the parent to reflect the new rotation
        image.rotation = newRotation;
        onUpdate();
      }
    } catch (err) {
      console.error('Exception during rotation:', err);
      alert('Failed to rotate image');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const { error } = await supa
        .from('images')
        .update({
          title: formData.title,
          description: formData.description,
          image_role: formData.image_role,
          palette_suitability: formData.palette_suitability,
          is_black_and_white: formData.is_black_and_white,
          is_photograph: formData.is_photograph,
          tags: tagsArray,
          rotation: currentRotation
        })
        .eq('id', image.id);

      if (error) {
        alert('Error saving: ' + error.message);
      } else {
        setEditMode(false);
        onUpdate();
      }
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const triggerReprocessing = async () => {
    if (!confirm('Reprocess this image with AI? This will update the description, tags, and metadata.')) return;
    
    setSaving(true);
    try {
      const { error } = await supa
        .from('images')
        .update({ 
          metadata_status: 'pending_llm',
          processing_error: null
        })
        .eq('id', image.id);

      if (error) {
        alert('Error queuing reprocessing: ' + error.message);
      } else {
        alert('Image queued for reprocessing. Run the metadata update script to process.');
        onUpdate();
      }
    } catch (err) {
      alert('Failed to queue reprocessing');
    } finally {
      setSaving(false);
    }
  };

  const StatusBadge = ({ status }: { status?: string }) => {
    const colors = {
      'pending_llm': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'complete': 'bg-green-100 text-green-800',
      'error': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
      }`}>
        {status || 'unknown'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-md z-10"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="relative group flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg overflow-hidden">
              <img 
                src={image.src} 
                alt={image.title} 
                className="max-w-full max-h-full object-contain rounded-lg border bg-white transition-transform duration-200"
                style={{ 
                  transform: `rotate(${currentRotation}deg)`,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
              <button
                onClick={handleRotate}
                disabled={saving}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10"
                title="Rotate 90°"
              >
                <ArrowClockwise size={16} className="text-gray-700" />
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <StatusBadge status={image.metadata_status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">B&W:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    image.is_black_and_white ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {image.is_black_and_white ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Type:</span>
                  <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                    {image.is_photograph ? 'Photo' : 'Illustration'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Role:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    image.image_role === 'texture' ? 'bg-orange-100 text-orange-800' :
                    image.image_role === 'conceptual' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {image.image_role || 'narrative'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Palette:</span>
                  <span className="px-2 py-1 rounded text-xs bg-pink-100 text-pink-800">
                    {image.palette_suitability || 'vibrant'}
                  </span>
                </div>
                {image.white_edge_score !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">White Edge:</span>
                    <span className="text-xs text-gray-600">
                      {Math.round(image.white_edge_score * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Details Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pr-12">
              <h2 className="text-xl font-semibold">Image Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={triggerReprocessing}
                  disabled={saving}
                  className="px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Reprocess'}
                </button>
                <button
                  onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
            
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Image Role</label>
                    <select
                      value={formData.image_role}
                      onChange={e => setFormData(prev => ({ ...prev, image_role: e.target.value as any }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="narrative">Narrative</option>
                      <option value="texture">Texture</option>
                      <option value="conceptual">Conceptual</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Palette</label>
                    <select
                      value={formData.palette_suitability}
                      onChange={e => setFormData(prev => ({ ...prev, palette_suitability: e.target.value as any }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="vibrant">Vibrant</option>
                      <option value="neutral">Neutral</option>
                      <option value="earthtone">Earthtone</option>
                      <option value="muted">Muted</option>
                      <option value="pastel">Pastel</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_bw"
                      checked={formData.is_black_and_white}
                      onChange={e => setFormData(prev => ({ ...prev, is_black_and_white: e.target.checked }))}
                    />
                    <label htmlFor="is_bw" className="text-sm font-medium">Black & White</label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_photo"
                      checked={formData.is_photograph}
                      onChange={e => setFormData(prev => ({ ...prev, is_photograph: e.target.checked }))}
                    />
                    <label htmlFor="is_photo" className="text-sm font-medium">Photograph</label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">{image.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">ID: {image.id}</p>
                </div>
                
                {image.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{image.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <TagChips tags={image.tags} />
                </div>
                
                {image.processing_error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Processing Error</h4>
                    <p className="text-sm text-red-600">{image.processing_error}</p>
                  </div>
                )}
                
                {image.last_processed && (
                  <div className="text-xs text-gray-500">
                    Last processed: {new Date(image.last_processed).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

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
      const { data, error } = await supa.from('image_collections').select('*').order('created_at', { ascending: true });
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

  // Handler to create a new collection
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
        loadImages(data[0].id);
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

  // Handler to update collection
  const handleUpdateCollection = (updatedCollection: Collection) => {
    setCollections(prev => prev.map(col => 
      col.id === updatedCollection.id ? updatedCollection : col
    ));
  };

  // Handler to delete collection
  const handleDeleteCollection = async (collectionId: string) => {
    try {
      // First delete all images in the collection
      const { error: deleteImagesError } = await supa
        .from('images')
        .delete()
        .eq('collection_id', collectionId);
        
      if (deleteImagesError) {
        alert('Error deleting images: ' + deleteImagesError.message);
        return;
      }
      
      // Then delete the collection
      const { error } = await supa
        .from('image_collections')
        .delete()
        .eq('id', collectionId);
        
      if (!error) {
        setCollections(prev => prev.filter(col => col.id !== collectionId));
        if (selectedCollection === collectionId) {
          const firstCollection = collections.find(col => col.id !== collectionId);
          setSelectedCollection(firstCollection?.id || '');
          loadImages(firstCollection?.id || '');
        }
      } else {
        alert('Error deleting collection: ' + error.message);
      }
    } catch (err) {
      console.error('Exception deleting collection:', err);
      alert('Failed to delete collection');
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
        <div className="flex items-center gap-1">
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
              <option key={col.id} value={col.id}>
                {col.name}
                {col.is_public && ' 🌐'}
              </option>
            ))}
          </select>
          {selectedCollection && (
            <button
              onClick={() => {
                const collection = collections.find(c => c.id === selectedCollection);
                if (collection) setEditingCollection(collection);
              }}
              className="border rounded px-2 py-1 text-sm bg-white hover:bg-gray-100"
              title="Edit collection"
            >
              <Pencil size={14} weight="regular" />
            </button>
          )}
        </div>
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

      {editingCollection && (
        <CollectionEditDialog
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
          onUpdate={handleUpdateCollection}
          onDelete={handleDeleteCollection}
        />
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
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded border overflow-hidden">
                        <img
                          src={row.src}
                          alt={row.title}
                          className="max-w-none max-h-none w-auto h-auto transition-transform duration-200"
                          style={{ 
                            transform: `rotate(${row.rotation || 0}deg)`,
                            maxWidth: row.rotation === 90 || row.rotation === 270 ? '64px' : '64px',
                            maxHeight: row.rotation === 90 || row.rotation === 270 ? '64px' : '64px'
                          }}
                        />
                      </div>
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
                      {row.image_role === "pending" && (!row.tags || row.tags.length === 0) ? (
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
                      {row.image_role === "pending" ? (
                        <span className="italic text-gray-500">Processing...</span>
                      ) : (
                        row.image_role
                      )}
                    </td>
                    <td className="p-2 align-top text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(row.id);
                        }} 
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
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
                <div className="w-full h-32 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                  <img 
                    src={img.src} 
                    alt={img.title} 
                    className="max-w-full max-h-full object-contain transition-transform duration-200" 
                    style={{ transform: `rotate(${img.rotation || 0}deg)` }}
                  />
                </div>
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
                  {img.image_role === "pending" && (!img.tags || img.tags.length === 0) ? (
                    <span className="italic text-gray-500 text-[10px]">Processing tags...</span>
                  ) : (
                    img.tags.slice(0, 4).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded-full">{t}</span>
                    ))
                  )}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">(Type: {img.image_role === "pending" ? "..." : img.image_role})</div>
              </div>
            ))}
          </div>
        )
      )}

      {selectedImage && (
        <ImageDetailsModal 
          image={selectedImage} 
          onClose={handleCloseModal}
          onUpdate={load}
        />
      )}
    </div>
  );
};

const CmsApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'images' | 'masks' | 'templates'>('images');
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {currentPage === 'images' && <ImagesPage />}
        {currentPage === 'masks' && <MasksPage />}
        {currentPage === 'templates' && <TemplatesPage />}
      </main>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// Export the component as a named function for Fast Refresh compatibility
export default function App() {
  return <CmsApp />;
}

createRoot(document.getElementById('root')!).render(<App />);