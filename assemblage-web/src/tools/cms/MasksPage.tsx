import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { maskRegistry, type MaskFamily, getMaskDescriptor } from '../../masks/maskRegistry';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supa = createClient(supabaseUrl, supabaseAnonKey);

type MaskRow = {
  id: string;
  key: string;
  family: string;
  svg: string;
  description?: string;
  tags: string[];
  created_at?: string;
};

const SAMPLE_IMAGE_URL = '/images/collages/placeholder1.png'; // Updated to correct filename

const MaskDetailModal: React.FC<{
  mask: any;
  isBuiltIn: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: () => void;
}> = ({ mask, isBuiltIn, onClose, onUpdate, onDelete }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    key: mask.key || '',
    family: mask.family || '',
    description: mask.description || '',
    tags: Array.isArray(mask.tags) ? mask.tags.join(', ') : ''
  });
  const [customFamily, setCustomFamily] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const families: (MaskFamily | string)[] = ['custom', 'sliced', 'architectural', 'abstract', 'altar', 'basic', 'narrative'];
  
  // Check if current family is not in built-in families
  const isCustomFamily = !['sliced', 'architectural', 'abstract', 'altar', 'basic', 'narrative'].includes(mask.family);
  
  // Initialize custom family if needed
  React.useEffect(() => {
    if (isCustomFamily && !families.includes(mask.family)) {
      setCustomFamily(mask.family);
      setFormData(prev => ({ ...prev, family: 'custom' }));
    }
  }, [isCustomFamily, mask.family]);

  const handleSave = async () => {
    if (isBuiltIn) {
      alert('Built-in masks cannot be edited');
      return;
    }

    // Determine the final family name
    let finalFamily = formData.family;
    if (formData.family === 'custom' && customFamily.trim()) {
      finalFamily = customFamily.trim().toLowerCase();
    } else if (formData.family === 'custom') {
      finalFamily = 'custom';
    }

    setSaving(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const { error } = await supa
        .from('masks')
        .update({
          key: formData.key,
          family: finalFamily,
          description: formData.description,
          tags: tagsArray
        })
        .eq('id', mask.id);

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

  const handleDelete = async () => {
    if (isBuiltIn) {
      alert('Built-in masks cannot be deleted');
      return;
    }

    if (!confirm(`Delete mask "${mask.key}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const { error } = await supa
        .from('masks')
        .delete()
        .eq('id', mask.id);

      if (error) {
        alert('Error deleting: ' + error.message);
      } else {
        onClose();
        onUpdate();
      }
    } catch (err) {
      alert('Failed to delete mask');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {isBuiltIn ? 'Built-in' : 'Custom'} Mask Details
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <h3 className="font-medium mb-3">Preview</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <MaskPreview
                  maskSvg={mask.svg}
                  title={mask.key}
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Details</h3>
                <div className="flex gap-2">
                  {!isBuiltIn && (
                    <>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {editMode ? 'Cancel' : 'Edit'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mask Key</label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={e => setFormData(prev => ({ ...prev, key: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Family</label>
                    <select
                      value={formData.family}
                      onChange={e => setFormData(prev => ({ ...prev, family: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      {families.map(f => (
                        <option key={f} value={f}>
                          {f === 'custom' ? 'Custom / New Family' : f}
                        </option>
                      ))}
                    </select>
                    {formData.family === 'custom' && (
                      <div className="mt-2">
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={customFamily}
                          onChange={(e) => setCustomFamily(e.target.value)}
                          placeholder="Enter new family name (optional)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave blank to use "custom" or enter a new family name
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
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
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Key:</span>
                    <p className="text-sm">{mask.key}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Family:</span>
                    <p className="text-sm capitalize">{mask.family}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <p className="text-sm">{isBuiltIn ? 'Built-in (Generated)' : 'Custom (Uploaded)'}</p>
                  </div>
                  {mask.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <p className="text-sm">{mask.description}</p>
                    </div>
                  )}
                  {mask.tags && mask.tags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mask.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SVG Code Preview */}
          <div className="mt-6">
            <h3 className="font-medium mb-2">SVG Code</h3>
            <div className="bg-gray-100 border rounded p-3 max-h-32 overflow-auto">
              <code className="text-xs text-gray-700">
                {mask.svg.substring(0, 500)}{mask.svg.length > 500 ? '...' : ''}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MaskPreview: React.FC<{ 
  maskSvg: string; 
  title: string; 
  imageUrl?: string;
  backgroundColor?: string;
  onClick?: () => void;
}> = ({ maskSvg, title, imageUrl = SAMPLE_IMAGE_URL, backgroundColor = '#20B2AA', onClick }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  useEffect(() => {
    const generatePreview = async () => {
      try {
        // Create a canvas for the preview
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const size = 300; // Increased from 200 for better detail
        canvas.width = size;
        canvas.height = size;
        
        // Fill with background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);
        
        // Load and draw the sample image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Draw background color first
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, size, size);
          
          // Draw image with multiply blend
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(img, 0, 0, size, size);
          
          // Reset blend mode and apply mask
          ctx.globalCompositeOperation = 'destination-in';
          
          // Create mask from SVG
          const svgBlob = new Blob([maskSvg], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);
          
          const maskImg = new Image();
          maskImg.onload = () => {
            ctx.drawImage(maskImg, 0, 0, size, size);
            
            // Convert to data URL
            setPreviewUrl(canvas.toDataURL());
            URL.revokeObjectURL(svgUrl);
          };
          maskImg.src = svgUrl;
        };
        
        img.onerror = () => {
          // If image fails to load, create a simple pattern
          ctx.clearRect(0, 0, size, size);
          
          // Create a simple checkerboard pattern as fallback
          const patternSize = 20;
          for (let x = 0; x < size; x += patternSize) {
            for (let y = 0; y < size; y += patternSize) {
              const isEven = ((x / patternSize) + (y / patternSize)) % 2 === 0;
              ctx.fillStyle = isEven ? '#e5e5e5' : '#d1d5db';
              ctx.fillRect(x, y, patternSize, patternSize);
            }
          }
          
          // Now apply the mask
          const svgBlob = new Blob([maskSvg], { type: 'image/svg+xml' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const maskImg = new Image();
          maskImg.onload = () => {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskImg, 0, 0, size, size);
            setPreviewUrl(canvas.toDataURL());
            URL.revokeObjectURL(svgUrl);
          };
          maskImg.onerror = () => {
            // If SVG also fails, just show a placeholder
            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Preview Error', size/2, size/2);
            setPreviewUrl(canvas.toDataURL());
          };
          maskImg.src = svgUrl;
        };
        
        // Use a fallback image or generate a pattern
        img.src = imageUrl;
        
      } catch (error) {
        console.error('Error generating mask preview:', error);
      }
    };
    
    generatePreview();
  }, [maskSvg, imageUrl, backgroundColor]);
  
  return (
    <div 
      className={`border rounded-lg p-3 bg-white shadow-sm ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="aspect-square mb-2 border rounded overflow-hidden bg-gray-100 flex items-center justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400 text-xs text-center p-2">
            Generating preview...
          </div>
        )}
      </div>
      <h3 className="font-medium text-sm text-center truncate" title={title}>
        {title}
      </h3>
    </div>
  );
};

const UploadMaskDialog: React.FC<{ onUploaded: () => void }> = ({ onUploaded }) => {
  const [open, setOpen] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [maskKey, setMaskKey] = useState('');
  const [family, setFamily] = useState<string>('custom');
  const [customFamily, setCustomFamily] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  
  const families: (MaskFamily | string)[] = ['custom', 'sliced', 'architectural', 'abstract', 'altar', 'basic', 'narrative'];
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSvgContent(content);
      
      // Auto-generate key from filename
      const fileName = file.name.replace('.svg', '');
      setMaskKey(fileName.toLowerCase().replace(/[^a-z0-9]/g, ''));
    };
    reader.readAsText(file);
  };
  
  const handleSave = async () => {
    if (!maskKey.trim() || !svgContent.trim()) return;
    
    // Determine the final family name
    let finalFamily = family;
    if (family === 'custom' && customFamily.trim()) {
      finalFamily = customFamily.trim().toLowerCase();
    } else if (family === 'custom') {
      finalFamily = 'custom';
    }
    
    setLoading(true);
    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      
      const { error } = await supa.from('masks').insert({
        id: crypto.randomUUID(), // Generate a UUID for the id field
        key: maskKey,
        family: finalFamily,
        svg: svgContent,
        description: description,
        tags: tagsArray
      });
      
      if (error) {
        alert('Error saving mask: ' + error.message);
      } else {
        setOpen(false);
        setSvgContent('');
        setMaskKey('');
        setFamily('custom');
        setCustomFamily('');
        setDescription('');
        setTags('');
        onUploaded();
      }
    } catch (err) {
      alert('Failed to save mask');
    } finally {
      setLoading(false);
    }
  };
  
  const valid = maskKey.trim() && svgContent.trim();
  
  return (
    <>
      <button 
        className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
        onClick={() => setOpen(true)}
      >
        Upload SVG Mask
      </button>
      
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium">Upload Custom Mask</h2>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">SVG File</label>
              <input
                type="file"
                accept=".svg"
                onChange={handleFileUpload}
                className="w-full text-sm border rounded px-2 py-1"
              />
              <p className="text-xs text-gray-500">
                Upload an SVG file with white fill for the mask shape
              </p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Mask Key</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={maskKey}
                onChange={(e) => setMaskKey(e.target.value)}
                placeholder="e.g. customCircle"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Family</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
              >
                {families.map(f => (
                  <option key={f} value={f}>
                    {f === 'custom' ? 'Custom / New Family' : f}
                  </option>
                ))}
              </select>
              {family === 'custom' && (
                <div className="mt-2">
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={customFamily}
                    onChange={(e) => setCustomFamily(e.target.value)}
                    placeholder="Enter new family name (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to use "custom" or enter a new family name
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the mask"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="geometric, custom, decorative"
              />
            </div>
            
            {svgContent && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Preview</label>
                <div className="border rounded p-2 bg-gray-50 max-h-32 overflow-auto">
                  <code className="text-xs">{svgContent.substring(0, 200)}...</code>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button 
                className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={!valid || loading}
                onClick={handleSave}
                className={`px-3 py-1 rounded text-sm text-white ${ 
                  loading ? 'bg-gray-400' : valid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'
                }`}
              >
                {loading ? 'Saving...' : 'Save Mask'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MasksPage: React.FC = () => {
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'registry' | 'database'>('registry');
  const [dbMasks, setDbMasks] = useState<MaskRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMask, setSelectedMask] = useState<any>(null);
  const [isBuiltInMask, setIsBuiltInMask] = useState(false);
  
  const families = Object.keys(maskRegistry);
  // Get unique families from database masks for filtering
  const customFamilies = [...new Set(dbMasks.map(mask => mask.family))].filter(f => !families.includes(f));
  // Show different families based on current view
  const allFamilies = view === 'registry' 
    ? ['all', ...families] 
    : ['all', ...families, ...customFamilies];
  
  // Load database masks
  const loadDbMasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supa
        .from('masks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setDbMasks(data);
      }
    } catch (err) {
      console.error('Error loading masks:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (view === 'database') {
      loadDbMasks();
    }
    // Reset family filter when switching views to prevent issues
    if (view === 'registry' && !['all', ...Object.keys(maskRegistry)].includes(selectedFamily)) {
      setSelectedFamily('all');
    }
  }, [view, selectedFamily]);
  
  // Get registry masks for display
  const getRegistryMasks = () => {
    const masks: Array<{ family: string; key: string; svg: string; }> = [];
    
    const familiesToShow = selectedFamily === 'all' ? families : [selectedFamily];
    
    for (const family of familiesToShow) {
      const familyMasks = maskRegistry[family];
      // Safety check: only process if the family exists in the registry
      if (!familyMasks) continue;
      
      for (const key of Object.keys(familyMasks)) {
        if (search === '' || key.toLowerCase().includes(search.toLowerCase()) || family.toLowerCase().includes(search.toLowerCase())) {
          try {
            const descriptor = getMaskDescriptor(family, key);
            if (descriptor && descriptor.kind === 'svg') {
              masks.push({
                family,
                key,
                svg: descriptor.getSvg()
              });
            }
          } catch (error) {
            console.warn(`Failed to generate mask ${family}/${key}:`, error);
          }
        }
      }
    }
    
    return masks;
  };
  
  const registryMasks = view === 'registry' ? getRegistryMasks() : [];
  const filteredDbMasks = view === 'database' ? dbMasks.filter(mask => {
    const matchesSearch = search === '' || 
      mask.key.toLowerCase().includes(search.toLowerCase()) ||
      mask.family.toLowerCase().includes(search.toLowerCase()) ||
      mask.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFamily = selectedFamily === 'all' || mask.family === selectedFamily;
    
    return matchesSearch && matchesFamily;
  }) : [];
  
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold">Masks</h1>
        
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search masks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 text-sm rounded w-48"
          />
          
          <select
            className="border px-2 py-1 text-sm rounded"
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
          >
            {allFamilies.map(family => (
              <option key={family} value={family}>
                {family === 'all' ? 'All Families' : family}
              </option>
            ))}
          </select>
          
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setView('registry')}
              className={`px-3 py-1 text-sm ${
                view === 'registry' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Built-in ({registryMasks.length})
            </button>
            <button
              onClick={() => setView('database')}
              className={`px-3 py-1 text-sm ${
                view === 'database' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Custom ({dbMasks.length})
            </button>
          </div>
          
          {view === 'database' && (
            <UploadMaskDialog onUploaded={loadDbMasks} />
          )}
        </div>
      </div>
      
      {/* Family Stats */}
      {view === 'registry' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Mask Families</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
            {families.map(family => {
              const count = Object.keys(maskRegistry[family]).length;
              return (
                <div key={family} className="flex justify-between">
                  <span className="capitalize">{family}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Masks Grid */}
      {loading ? (
        <div className="text-center py-8">Loading masks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {view === 'registry' && registryMasks.map(mask => (
            <MaskPreview
              key={`${mask.family}-${mask.key}`}
              maskSvg={mask.svg}
              title={`${mask.family}/${mask.key}`}
              onClick={() => {
                setSelectedMask({
                  key: mask.key,
                  family: mask.family,
                  svg: mask.svg,
                  description: `Built-in ${mask.family} mask`,
                  tags: [mask.family, 'built-in']
                });
                setIsBuiltInMask(true);
              }}
            />
          ))}
          
          {view === 'database' && filteredDbMasks.map(mask => (
            <MaskPreview
              key={mask.id}
              maskSvg={mask.svg}
              title={mask.key}
              onClick={() => {
                setSelectedMask(mask);
                setIsBuiltInMask(false);
              }}
            />
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && (
        (view === 'registry' && registryMasks.length === 0) ||
        (view === 'database' && filteredDbMasks.length === 0)
      ) && (
        <div className="text-center py-12 text-gray-500">
          {search ? 'No masks match your search' : 
           view === 'database' ? 'No custom masks uploaded yet' : 
           'No masks found'}
        </div>
      )}
      
      {/* Mask Detail Modal */}
      {selectedMask && (
        <MaskDetailModal
          mask={selectedMask}
          isBuiltIn={isBuiltInMask}
          onClose={() => setSelectedMask(null)}
          onUpdate={() => {
            if (!isBuiltInMask) {
              loadDbMasks();
            }
            setSelectedMask(null);
          }}
        />
      )}
    </div>
  );
};

export default MasksPage;
