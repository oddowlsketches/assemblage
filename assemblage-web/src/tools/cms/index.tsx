import MasksPage from './MasksPage';
import TemplatesPage from './TemplatesPage';
import AISettingsPage from './AISettingsPage';
import { cmsSupabase as supa } from './supabaseClient';
import { getSupabase } from '../../supabaseClient';
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
  <aside className="w-48 bg-gray-100 h-screen p-4 border-r border-gray-200">
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
      <button 
        className={`block w-full text-left font-medium ${
          currentPage === 'ai-settings' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
        }`}
        onClick={() => onPageChange('ai-settings')}
      >
        AI Settings
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

  // Update selected collection when collections or defaultCollectionId changes
  useEffect(() => {
    if (!selectedCollection && collections.length > 0) {
      setSelectedCollection(defaultCollectionId || collections[0].id);
    }
  }, [collections, defaultCollectionId]);

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

      // Ensure we have a collection ID
      const collectionToUse = selectedCollection || collections[0]?.id;
      if (!collectionToUse) {
        throw new Error('No collection available. Please create a collection first.');
      }

      console.log('[UPLOAD] Using collection ID:', collectionToUse);

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
          collectionId: collectionToUse
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

const AddImageDialog: React.FC<{ onAdded: () => void, defaultCollectionId?: string }> = ({ onAdded, defaultCollectionId }) => {
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
    const { error } = await supa.from('images').insert({ 
      src, 
      title, 
      tags: tagArr, 
      image_role: imageRole,
      collection_id: defaultCollectionId || '00000000-0000-0000-0000-000000000001'
    });
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
  
  // Multi-select states
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetCollection, setTargetCollection] = useState<string>('');

  const handleImageClick = (image: ImageRow) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  // Multi-select handlers
  const toggleImageSelection = (imageId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const selectAll = () => {
    const allImageIds = new Set(filteredRows.map(row => row.id));
    setSelectedImages(allImageIds);
    setShowBulkActions(true);
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
    setShowBulkActions(false);
  };

  const isAllSelected = () => {
    return filteredRows.length > 0 && filteredRows.every(row => selectedImages.has(row.id));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedImages.size} selected images? This cannot be undone.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      // Get the actual image data for selected images to verify they belong to current collection
      const selectedImagesList = Array.from(selectedImages);
      const imagesToDelete = rows.filter(row => selectedImages.has(row.id));
      
      // Delete images one by one, ensuring we only delete from the current collection
      for (const image of imagesToDelete) {
        let deleteQuery = supa.from('images').delete().eq('id', image.id);
        
        // If we're viewing a specific collection, ensure we only delete from that collection
        if (selectedCollection) {
          deleteQuery = deleteQuery.eq('collection_id', selectedCollection);
        }
        
        const { error } = await deleteQuery;
        if (error) {
          console.error('Error deleting image:', image.id, error);
        }
      }
      
      // Update local state
      setRows(prev => prev.filter(row => !selectedImages.has(row.id)));
      deselectAll();
      alert(`Successfully deleted ${imagesToDelete.length} images`);
    } catch (err) {
      console.error('Error during bulk delete:', err);
      alert('Error deleting some images');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMove = async () => {
    if (!targetCollection) {
      alert('Please select a target collection');
      return;
    }

    setBulkActionLoading(true);
    try {
      // Move images one by one (could be optimized with a batch update)
      for (const imageId of selectedImages) {
        const { error } = await supa
          .from('images')
          .update({ collection_id: targetCollection })
          .eq('id', imageId);
        if (error) {
          console.error('Error moving image:', imageId, error);
        }
      }
      
      // If we're viewing a specific collection, remove moved images from view
      if (selectedCollection && selectedCollection !== targetCollection) {
        setRows(prev => prev.filter(row => !selectedImages.has(row.id)));
      }
      
      deselectAll();
      setShowMoveDialog(false);
      setTargetCollection('');
      alert(`Successfully moved ${selectedImages.size} images`);
      
      // Reload images to reflect changes
      await loadImages(selectedCollection);
    } catch (err) {
      console.error('Error during bulk move:', err);
      alert('Error moving some images');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const loadImages = async (collectionId?: string) => {
    setLoading(true);
    console.log('[CMS] Loading images for collection:', collectionId);
    
    // Check authentication status
    const { data: { user }, error: authError } = await supa.auth.getUser();
    console.log('[CMS] Auth status - User:', user?.email || 'Not authenticated', 'Error:', authError);
    
    // Check database connection info
    const supabaseUrl = supa.supabaseUrl;
    console.log('[CMS] Connected to Supabase URL:', supabaseUrl);
    
    // Try a simple test query first to check table access
    const { data: testData, error: testError } = await supa
      .from('images')
      .select('count', { count: 'exact', head: true });
    console.log('[CMS] Table access test - Count:', testData, 'Error:', testError);
    
    // If that fails, try with RLS bypass (if user has bypass permissions)
    if (testError) {
      console.log('[CMS] Regular query failed, trying with different approach...');
      const { data: rpcData, error: rpcError } = await supa.rpc('get_total_image_count');
      console.log('[CMS] RPC fallback result:', rpcData, 'Error:', rpcError);
    }
    
    // First, let's do a diagnostic check to see what's in the database
    const { data: allImages, error: allError } = await supa.from('images').select('id, collection_id, title').limit(10);
    console.log('[CMS] Diagnostic - First 10 images in database:', allImages, 'Error:', allError);
    
    // Check what collection IDs actually exist
    const { data: collectionIds, error: collectionError } = await supa
      .from('images')
      .select('collection_id')
      .not('collection_id', 'is', null);
    
    if (collectionIds) {
      const uniqueCollectionIds = [...new Set(collectionIds.map(img => img.collection_id))];
      console.log('[CMS] Unique collection IDs found in images table:', uniqueCollectionIds);
      
      // Count images for each collection ID
      for (const colId of uniqueCollectionIds) {
        const { count } = await supa
          .from('images')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', colId);
        console.log(`[CMS] Collection ${colId}: ${count} images`);
      }
      
      // Check for images with null collection_id
      const { count: nullCollectionCount } = await supa
        .from('images')
        .select('*', { count: 'exact', head: true })
        .is('collection_id', null);
      console.log(`[CMS] Images with NULL collection_id: ${nullCollectionCount}`);
      
      // If we have images with null collection_id, offer to fix them
      if (nullCollectionCount > 0) {
        console.log('[CMS] Found images with null collection_id - these should be assigned to default collection');
        
        // First, check if the default collection exists
        const { data: defaultCollection, error: collectionError } = await supa
          .from('image_collections')
          .select('id, name')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();
          
        if (collectionError) {
          console.error('[CMS] Default collection not found:', collectionError);
          console.log('[CMS] Need to create the default collection first');
          
          // Try to create the default collection
          const { data: newCollection, error: createError } = await supa
            .from('image_collections')
            .insert({
              id: '00000000-0000-0000-0000-000000000001',
              name: 'Curated Treasures',
              description: 'Default curated image collection',
              is_public: true
            })
            .select()
            .single();
            
          if (createError) {
            console.error('[CMS] Error creating default collection:', createError);
            console.log('[CMS] Will load images without collection filter for now');
            // Load all images without filtering
            const { data: allImagesData, error: allImagesError } = await supa
              .from('images')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (!allImagesError && allImagesData) {
              console.log('[CMS] Loaded all images (no collection filter):', allImagesData.length);
              setRows(allImagesData as ImageRow[]);
            }
            setLoading(false);
            return;
          } else {
            console.log('[CMS] Created default collection:', newCollection);
          }
        } else {
          console.log('[CMS] Default collection exists:', defaultCollection);
        }
        
        // Now try to update the images to use the default collection
        const { data: updateResult, error: updateError } = await supa
          .from('images')
          .update({ 
            collection_id: '00000000-0000-0000-0000-000000000001', // Default Collection ID
            provider: 'cms', // Set provider to CMS
            user_collection_id: null // Ensure user_collection_id is NULL
          })
          .is('collection_id', null)
          .is('user_collection_id', null) // Only update truly orphaned images
          .select('id'); // Return updated rows so we can count them
          
        if (updateError) {
          console.error('[CMS] Error updating null collection_id images:', updateError);
          console.log('[CMS] Will load images without collection filter for now');
          // Load all images without filtering
          const { data: allImagesData, error: allImagesError } = await supa
            .from('images')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!allImagesError && allImagesData) {
            console.log('[CMS] Loaded all images (no collection filter):', allImagesData.length);
            setRows(allImagesData as ImageRow[]);
          }
          setLoading(false);
          return;
        } else {
          const actualUpdatedCount = updateResult?.length || 0;
          console.log(`[CMS] Successfully updated ${actualUpdatedCount} images to use default collection ID (out of ${nullCollectionCount} candidates)`);
          
          // Only reload if we actually updated some images
          if (actualUpdatedCount > 0) {
            console.log('[CMS] Reloading images after updating orphaned images');
            setTimeout(() => {
              loadImages(collectionId);
              return;
            }, 500);
            return; // Exit here to prevent running the rest of the function
          } else {
            console.log('[CMS] No orphaned images to update, continuing with normal load');
            // Continue with normal loading since no updates were made
          }
        }
      }
    }
    
    // Check how many images have the default collection ID
    const { count: defaultCollectionCount } = await supa
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', '00000000-0000-0000-0000-000000000001');
    console.log('[CMS] Images with default collection ID:', defaultCollectionCount);
    
    // Check total image count
    const { count: totalCount } = await supa
      .from('images')
      .select('*', { count: 'exact', head: true });
    console.log('[CMS] Total images in database:', totalCount);
    
    // Try to query the way the main app does - check for images with the specific collection_id
    const { data: mainAppStyleQuery, error: mainAppError } = await supa
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', '00000000-0000-0000-0000-000000000001');
    console.log('[CMS] Main-app-style query result:', mainAppStyleQuery, 'Error:', mainAppError);
    
    // Try querying without any RLS restrictions (if user has bypass permissions)
    // const { data: bypassQuery, error: bypassError } = await supa
    //   .rpc('get_images_count_for_collection', { 
    //     collection_id: '00000000-0000-0000-0000-000000000001' 
    //   });
    // console.log('[CMS] Bypass query result:', bypassQuery, 'Error:', bypassError);
    
    // Always require a collection ID for CMS queries
    if (!collectionId) {
      console.log('[CMS] No collection ID provided, returning empty result');
      setRows([]);
      setLoading(false);
      return;
    }
    
    let query = supa.from('images')
      .select('*')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false });
    
    console.log('[CMS] Filtering by collection_id:', collectionId);
    
    const { data, error } = await query;
    console.log('[CMS] Query result - Collection:', collectionId, 'Found images:', data?.length || 0, 'Error:', error);
    
    if (error) {
      console.error('Error fetching images in CMS:', error);
    } else if (data) {
      console.log('[CMS] Successfully loaded', data.length, 'images');
      setRows(data as ImageRow[]);
    } else {
      console.log('[CMS] No data returned from query');
      setRows([]);
    }
    setLoading(false);
  };

  const load = async () => {
    await loadImages(selectedCollection);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        selectAll();
      }
      // Escape to deselect all
      if (e.key === 'Escape' && selectedImages.size > 0) {
        deselectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages, filteredRows]);

  useEffect(() => {
    // Fetch collections first, then load images for the default collection
    (async () => {
      const { data, error } = await supa.from('image_collections').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setCollections(data);
        // Always load the default collection first (if it exists)
        const defaultCollection = data.find(col => col.id === '00000000-0000-0000-0000-000000000001');
        const firstCollectionId = defaultCollection?.id || data[0]?.id;
        setSelectedCollection(firstCollectionId);
        
        console.log('[CMS] Loading images for default collection:', firstCollectionId);
        // Now load images for the selected collection
        await loadImages(firstCollectionId);
      } else {
        console.error('[CMS] Error loading collections:', error);
        // If no collections found, we should not load any images
        // as per the requirement to only show public collections
        setRows([]);
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete image?')) return;
    
    let deleteQuery = supa.from('images').delete().eq('id', id);
    
    // If we're viewing a specific collection, ensure we only delete from that collection
    if (selectedCollection) {
      deleteQuery = deleteQuery.eq('collection_id', selectedCollection);
    }
    
    const { error } = await deleteQuery;
    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      console.error('Error deleting image:', error);
      alert('Error deleting image: ' + error.message);
    }
  };

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

  const BulkActionBar = showBulkActions && (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center justify-between z-40">
      <div className="flex items-center gap-4">
        <span className="font-medium">{selectedImages.size} images selected</span>
        <button
          onClick={deselectAll}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear selection
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowMoveDialog(true)}
          disabled={bulkActionLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Move to Collection
        </button>
        <button
          onClick={handleBulkDelete}
          disabled={bulkActionLoading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Delete Selected
        </button>
      </div>
    </div>
  );

  const MoveDialog = showMoveDialog && (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-medium">Move {selectedImages.size} images to:</h2>
        <select
          className="w-full border rounded px-3 py-2"
          value={targetCollection}
          onChange={e => setTargetCollection(e.target.value)}
        >
          <option value="">Select a collection...</option>
          {collections
            .filter(col => col.id !== selectedCollection)
            .map(col => (
              <option key={col.id} value={col.id}>
                {col.name}
                {col.is_public && ' 🌐'}
              </option>
            ))}
        </select>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setShowMoveDialog(false);
              setTargetCollection('');
            }}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkMove}
            disabled={!targetCollection || bulkActionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkActionLoading ? 'Moving...' : 'Move Images'}
          </button>
        </div>
      </div>
    </div>
  );

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
        <AddImageDialog onAdded={load} defaultCollectionId={selectedCollection} />
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
                  <th className="p-2 border-b font-semibold w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected()}
                      onChange={e => e.target.checked ? selectAll() : deselectAll()}
                      className="cursor-pointer"
                    />
                  </th>
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
                  <tr 
                    key={row.id} 
                    className={clsx(
                      "border-b last:border-0 group cursor-pointer",
                      selectedImages.has(row.id) ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-100"
                    )} 
                    onClick={() => handleImageClick(row)}
                  >
                    <td className="p-2 align-top" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedImages.has(row.id)}
                        onChange={() => toggleImageSelection(row.id)}
                        className="cursor-pointer"
                      />
                    </td>
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
              <div 
                key={img.id} 
                className={clsx(
                  "border rounded shadow-sm p-2 flex flex-col cursor-pointer relative",
                  selectedImages.has(img.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""
                )} 
                onClick={() => handleImageClick(img)}
              >
                <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedImages.has(img.id)}
                    onChange={() => toggleImageSelection(img.id)}
                    className="cursor-pointer bg-white border-2 border-gray-300 rounded"
                  />
                </div>
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
      
      {BulkActionBar}
      {MoveDialog}
    </div>
  );
};

const CmsApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'images' | 'masks' | 'templates' | 'ai-settings'>('images');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Check authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.error('[CMS Auth] Supabase client not available');
          setIsAuthenticated(false);
          setUser(null);
          setAuthLoading(false);
          return;
        }
        
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('[CMS Auth] User check result:', user?.email || 'Not authenticated', 'Error:', error);
        
        if (user && !error) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error('[CMS Auth] Error checking auth:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('[CMS Auth] Auth state changed:', event, session?.user?.email || 'No user');
          if (session?.user) {
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      );
      
      return () => subscription.unsubscribe();
    }
  }, []);
  
  const handleSignIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        alert('Supabase client not available');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        alert('Sign in failed: ' + error.message);
      } else if (data.user) {
        console.log('[CMS Auth] Successfully signed in:', data.user.email);
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('[CMS Auth] Sign in error:', err);
      alert('Sign in failed');
    }
  };
  
  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('[CMS Auth] Sign out error:', err);
    }
  };
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onSignIn={handleSignIn} />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {/* Header with user info and sign out */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">Assemblage CMS</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        {currentPage === 'images' && <ImagesPage />}
        {currentPage === 'masks' && <MasksPage />}
        {currentPage === 'templates' && <TemplatesPage />}
        {currentPage === 'ai-settings' && <AISettingsPage />}
      </main>
    </div>
  );
};

// Simple login form component
const LoginForm: React.FC<{ onSignIn: (email: string, password: string) => void }> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    await onSignIn(email, password);
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Assemblage CMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the content management system
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────
// Export the component as a named function for Fast Refresh compatibility
export default function App() {
  return <CmsApp />;
}

createRoot(document.getElementById('root')!).render(<App />);