import React, { useState, useEffect } from 'react';
import { cmsSupabase as supabase } from './supabaseClient';

type TemplateRow = {
  id: string;
  key: string;
  name: string;
  family: string;
  description?: string;
  params?: Record<string, any>;
  created_at?: string;
};

const TemplateModal: React.FC<{ 
  template: TemplateRow | null; 
  onClose: () => void; 
  onSave: (template: Partial<TemplateRow>) => void;
  isEdit: boolean;
}> = ({ template, onClose, onSave, isEdit }) => {
  const [formData, setFormData] = useState({
    key: template?.key || '',
    name: template?.name || '',
    family: template?.family || '',
    description: template?.description || '',
    params: template?.params ? JSON.stringify(template.params, null, 2) : '{}'
  });
  const [saving, setSaving] = useState(false);
  const [paramsError, setParamsError] = useState('');

  const validateParams = (paramsString: string) => {
    try {
      JSON.parse(paramsString);
      setParamsError('');
      return true;
    } catch (err) {
      setParamsError('Invalid JSON format');
      return false;
    }
  };

  const handleParamsChange = (paramsString: string) => {
    setFormData(prev => ({ ...prev, params: paramsString }));
    validateParams(paramsString);
  };

  const handleSave = async () => {
    if (!formData.key.trim() || !formData.name.trim()) {
      alert('Key and Name are required');
      return;
    }

    if (!validateParams(formData.params)) {
      alert('Please fix the parameters JSON format');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        key: formData.key.trim(),
        name: formData.name.trim(),
        family: formData.family.trim(),
        description: formData.description.trim(),
        params: JSON.parse(formData.params)
      };

      await onSave(templateData);
      onClose();
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit Template' : 'Add New Template'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Key *</label>
              <input
                type="text"
                value={formData.key}
                onChange={e => setFormData(prev => ({ ...prev, key: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm font-mono"
                placeholder="e.g., crystal, architectural"
                disabled={isEdit} // Don't allow changing key for existing templates
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier used in code {isEdit && '(cannot be changed)'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Display Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="e.g., Crystal Formation"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Family</label>
            <input
              type="text"
              value={formData.family}
              onChange={e => setFormData(prev => ({ ...prev, family: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="e.g., geometric, organic, abstract"
            />
            <p className="text-xs text-gray-500 mt-1">
              Category for grouping similar templates
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Describe what this template does and how it works..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Parameters (JSON)</label>
            <textarea
              value={formData.params}
              onChange={e => handleParamsChange(e.target.value)}
              rows={8}
              className={`w-full border rounded px-3 py-2 text-sm font-mono ${
                paramsError ? 'border-red-300' : ''
              }`}
              placeholder={'{\n  "imageCount": {\n    "default": 6,\n    "min": 3,\n    "max": 12\n  },\n  "complexity": "medium"\n}'}
            />
            {paramsError && (
              <p className="text-xs text-red-600 mt-1">{paramsError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Configuration parameters for this template in JSON format
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !!paramsError}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading templates:', error);
      } else if (data) {
        setTemplates(data);
      }
    } catch (err) {
      console.error('Exception loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSaveTemplate = async (templateData: Partial<TemplateRow>) => {
    try {
      if (isEditMode && selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);
          
        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('templates')
          .insert(templateData);
          
        if (error) throw error;
      }
      
      await loadTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      throw err;
    }
  };

  const handleDeleteTemplate = async (template: TemplateRow) => {
    if (!confirm(`Delete template "${template.name}"? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', template.id);
        
      if (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      } else {
        await loadTemplates();
      }
    } catch (err) {
      console.error('Exception deleting template:', err);
      alert('Failed to delete template');
    }
  };

  const handleAddNew = () => {
    setSelectedTemplate(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (template: TemplateRow) => {
    setSelectedTemplate(template);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSyncTemplates = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      // Try to dynamically import the sync function first
      let results;
      try {
        const { syncTemplatesToDatabase } = await import('./syncTemplates.js');
        results = await syncTemplatesToDatabase();
      } catch (importError) {
        console.warn('Could not load full sync, falling back to basic seed:', importError);
        // Fallback to basic seed
        const { seedBasicTemplates } = await import('./seedTemplates.js');
        results = await seedBasicTemplates();
      }
      
      alert(`Sync completed!\n\nCreated: ${results.created.length}\nUpdated: ${results.updated.length}\nErrors: ${results.errors.length}`);
      await loadTemplates(); // Refresh the list
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const query = search.toLowerCase();
    return (
      template.key.toLowerCase().includes(query) ||
      template.name.toLowerCase().includes(query) ||
      template.family?.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  const formatParams = (params: any) => {
    if (!params || typeof params !== 'object') return 'None';
    return JSON.stringify(params, null, 2);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Templates</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 text-sm rounded w-64"
          />
          <button
            onClick={handleAddNew}
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Add Template
          </button>
          {import.meta.env.DEV && (
            <button
              onClick={handleSyncTemplates}
              disabled={syncing}
              className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync from Code'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              {search ? 'No templates match your search' : 'No templates found'}
            </p>
            {!search && (
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Your First Template
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <code className="px-2 py-1 bg-gray-100 text-sm rounded font-mono">
                      {template.key}
                    </code>
                    {template.family && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {template.family}
                      </span>
                    )}
                  </div>
                  
                  {template.description && (
                    <p className="text-gray-600 mb-3">{template.description}</p>
                  )}
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      View Parameters
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto font-mono">
                      {formatParams(template.params)}
                    </pre>
                  </details>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    ID: {template.id} • Created: {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTemplate}
          isEdit={isEditMode}
        />
      )}
    </div>
  );
};

export default TemplatesPage;
