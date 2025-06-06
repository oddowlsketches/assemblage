import React, { useState, useEffect } from 'react'
import { X, Image, UploadSimple, Pencil } from 'phosphor-react'
import { SourceSelector } from './SourceSelector'
import { getContrastText } from '../lib/colorUtils/contrastText'
import templateModules from '../templates/index'
import { TemplateSelectionUI } from './TemplateSelectionUI'

export const MakeDrawer = ({ 
  isOpen, 
  onClose, 
  onApplyAndClose,
  activeCollection,
  activeCollectionName,
  onSourceChange,
  onManageCollections,
  onUploadImages,
  onOpenGallery,
  userCollections,
  onDrawerOpen,
  onTemplateChange,
  selectedTemplates
}) => {
  const [activeTab, setActiveTab] = useState('source')
  const [templateMode, setTemplateMode] = useState('all') // 'all' or 'custom'
  const [localSelectedTemplates, setLocalSelectedTemplates] = useState(selectedTemplates || [])
  const [showTemplateDetails, setShowTemplateDetails] = useState(false)
  
  // Categorize templates with descriptions - ordered by popularity
  const templateCategories = {
    'Layered': ['doubleExposure', 'mixedMediaTemplate', 'packedShapes'],
    'Abstract': ['sliced', 'scrambledMosaic', 'floatingElements'],
    'Geometric': ['tilingTemplate', 'crystal'],
    'Minimal': ['pairedForms', 'photoStrip'],
    'Structured': ['dynamicArchitectural', 'narrativeGrid', 'moodBoardTemplate']
  };
  
  const categoryDescriptions = {
    'Layered': 'Overlapping images with depth and transparency',
    'Abstract': 'Experimental layouts with unconventional arrangements',
    'Geometric': 'Mathematical patterns and precise tessellations',
    'Minimal': 'Clean, simple compositions with breathing room',
    'Structured': 'Grid-based and architectural organization'
  };
  
  // User-friendly template names (keeping keys unchanged)
  const templateDisplayNames = {
    'photoStrip': 'Film Strip',
    'sliced': 'Sliced Panels',
    'crystal': 'Crystal Mosaic',
    'tilingTemplate': 'Tile Pattern',
    'scrambledMosaic': 'Scattered Grid',
    'floatingElements': 'Floating Shapes',
    'packedShapes': 'Packed Collage',
    'doubleExposure': 'Double Exposure',
    'mixedMediaTemplate': 'Mixed Media',
    'narrativeGrid': 'Story Grid',
    'pairedForms': 'Paired Elements',
    'dynamicArchitectural': 'Architectural',
    'moodBoardTemplate': 'Mood Board'
  };
  
  // Create a map for quick lookup
  const templateToCategory = {};
  Object.entries(templateCategories).forEach(([category, templates]) => {
    templates.forEach(template => {
      templateToCategory[template] = category;
    });
  });
  
  // Get unique template names (remove duplicates)
  const uniqueTemplates = Array.from(new Set(templateModules.map(t => t.key)))
    .map(key => templateModules.find(t => t.key === key))
    .filter(Boolean);
  useEffect(() => {
    setLocalSelectedTemplates(selectedTemplates || []);
    // If no templates selected, we're in 'all' mode
    if (!selectedTemplates || selectedTemplates.length === 0) {
      setTemplateMode('all');
    } else {
      setTemplateMode('custom');
    }
  }, [selectedTemplates]);
  
  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('[MakeDrawer] Collections received:', userCollections);
      console.log('[MakeDrawer] Active collection:', activeCollection, 'name:', activeCollectionName);
      
      // Call onDrawerOpen to refresh collections
      if (onDrawerOpen) {
        onDrawerOpen();
      }
    }
  }, [isOpen, userCollections, activeCollection, activeCollectionName, onDrawerOpen]);
  
  const handleTemplateToggle = (templateKey) => {
    setLocalSelectedTemplates(prev => {
      if (prev.includes(templateKey)) {
        return prev.filter(k => k !== templateKey);
      } else {
        return [...prev, templateKey];
      }
    });
  };
  
  const handleApplyAndClose = () => {
    // Apply template changes
    if (onTemplateChange) {
      if (templateMode === 'all') {
        onTemplateChange([]); // Empty array means use all templates
      } else if (localSelectedTemplates.length > 0) {
        onTemplateChange(localSelectedTemplates);
      }
    }
    onApplyAndClose();
  };
  
  const handleTemplateModeChange = (mode) => {
    setTemplateMode(mode);
    if (mode === 'all') {
      // Clear selection when switching to all
      setLocalSelectedTemplates([]);
      setShowTemplateDetails(false);
    } else if (mode === 'custom') {
      // Auto-expand templates when switching to custom
      setShowTemplateDetails(true);
      if (localSelectedTemplates.length === 0) {
        // Select first 3 templates as default when switching to custom
        setLocalSelectedTemplates(uniqueTemplates.slice(0, 3).map(t => t.key));
      }
    }
  };
  
  // Force white background for drawer
  const uiColors = {
    bg: '#ffffff',
    fg: '#333333',
    border: '#333333'
  }

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Mobile detection
  const isMobile = window.innerWidth <= 768

  if (isMobile) {
    // Mobile: Bottom sheet
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div 
          className="relative w-full bg-white shadow-lg"
          style={{ 
            backgroundColor: uiColors.bg,
            color: uiColors.fg,
            maxHeight: '80vh',
            animation: 'slideInUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: uiColors.border }}>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'Space Mono, monospace', color: uiColors.fg, margin: '0px' }}>
              Collage settings
            </h2>
            <button 
              onClick={onClose}
              style={{ 
                color: uiColors.fg, 
                background: 'transparent', 
                cursor: 'pointer', 
                padding: '0.5rem',
                border: 'none'
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs for mobile */}
          <div className="border-b" style={{ borderColor: uiColors.border }}>
            <div className="flex">
              <button
                className="flex-1 px-4 py-3 text-sm font-medium"
                onClick={() => setActiveTab('source')}
                style={{ 
                  color: uiColors.fg,
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: activeTab === 'source' ? `2px solid ${uiColors.border}` : '2px solid transparent'
                }}
              >
                Source
              </button>
              <button
                className="flex-1 px-4 py-3 text-sm font-medium"
                onClick={() => setActiveTab('templates')}
                style={{ 
                  color: uiColors.fg,
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: activeTab === 'templates' ? `2px solid ${uiColors.border}` : '2px solid transparent'
                }}
              >
                Templates
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 240px)' }}>
            {activeTab === 'source' && (
              <>
                <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: uiColors.fg }}>
                Select Collection
              </label>
              <SourceSelector 
                activeSource={activeCollection}
                activeSourceName={activeCollectionName}
                onSourceChange={onSourceChange}
                userCollections={userCollections}
                className="w-full"
              />
            </div>
            <div className="text-sm mb-6" style={{ color: '#666666' }}>
              <p>Choose which collection of images to use for generating collages. You can switch between different collections or manage your own uploaded images.</p>
            </div>
            
            {/* Upload Images Button */}
            <div className="mb-4">
              <button
                onClick={onUploadImages}
                className="w-full flex items-center justify-center gap-2"
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  color: uiColors.fg,
                  border: `1px solid ${uiColors.border}`,
                  cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = uiColors.fg;
                  e.target.style.color = uiColors.bg;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = uiColors.fg;
                }}
              >
                <UploadSimple size={16} weight="regular" />
                Upload Images
              </button>
            </div>
              </>
            )}
            
            {activeTab === 'templates' && (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3" style={{ color: uiColors.fg }}>
                    Template Selection
                  </label>
                  
                  {/* Template Mode Toggle */}
                  <div style={{ 
                    display: 'flex',
                    border: `1px solid ${uiColors.border}`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '1.5rem'
                  }}>
                    <button
                      onClick={() => handleTemplateModeChange('all')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: templateMode === 'all' ? uiColors.fg : 'transparent',
                        color: templateMode === 'all' ? uiColors.bg : uiColors.fg,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      All Templates
                    </button>
                    <button
                      onClick={() => handleTemplateModeChange('custom')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: templateMode === 'custom' ? uiColors.fg : 'transparent',
                        color: templateMode === 'custom' ? uiColors.bg : uiColors.fg,
                        border: 'none',
                        borderLeft: `1px solid ${uiColors.border}`,
                        cursor: 'pointer',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Custom Selection
                    </button>
                  </div>
                  
                  <p className="text-sm mb-4" style={{ color: '#666666' }}>
                    {templateMode === 'all' 
                      ? 'Using all available templates in random rotation.'
                      : `Using ${localSelectedTemplates.length} selected template${localSelectedTemplates.length !== 1 ? 's' : ''}.`
                    }
                  </p>
                  
                  {/* Custom Template Selection */}
                  <TemplateSelectionUI
                    templateMode={templateMode}
                    localSelectedTemplates={localSelectedTemplates}
                    uniqueTemplates={uniqueTemplates}
                    templateCategories={templateCategories}
                    uiColors={uiColors}
                    handleTemplateToggle={handleTemplateToggle}
                    setLocalSelectedTemplates={setLocalSelectedTemplates}
                    isMobile={true}
                    templateDisplayNames={templateDisplayNames}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Footer - Apply Button */}
          <div className="p-6 border-t bg-white" style={{ borderColor: uiColors.border }}>
            <button 
              onClick={handleApplyAndClose}
              className="w-full"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: uiColors.fg,
                color: uiColors.bg,
                border: `1px solid ${uiColors.border}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop: Right-side drawer
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div 
        className="relative ml-auto h-full shadow-lg flex flex-col"
        style={{ 
          backgroundColor: uiColors.bg,
          color: uiColors.fg,
          width: '400px',
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: uiColors.border }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'Space Mono, monospace', color: uiColors.fg, margin: '0px' }}>
            Collage settings
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              color: uiColors.fg, 
              background: 'transparent', 
              cursor: 'pointer', 
              padding: '0.5rem',
              border: 'none'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b" style={{ borderColor: uiColors.border }}>
          <div className="flex">
            <button
              className="px-6 py-3 text-sm font-medium"
              onClick={() => setActiveTab('source')}
              style={{ 
                color: uiColors.fg,
                background: 'transparent',
                cursor: 'pointer',
                border: 'none',
                borderBottom: activeTab === 'source' ? `2px solid ${uiColors.border}` : '2px solid transparent'
              }}
            >
              Image Source
            </button>
            <button
              className="px-6 py-3 text-sm font-medium"
              onClick={() => setActiveTab('templates')}
              style={{ 
                color: uiColors.fg,
                background: 'transparent',
                cursor: 'pointer',
                border: 'none',
                borderBottom: activeTab === 'templates' ? `2px solid ${uiColors.border}` : '2px solid transparent'
              }}
            >
              Templates
            </button>
          </div>
        </div>
        
        {/* Content - Flex grow to take available space */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'source' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: uiColors.fg }}>
                  Select Collection
                </label>
                <SourceSelector 
                  activeSource={activeCollection}
                  activeSourceName={activeCollectionName}
                  onSourceChange={onSourceChange}
                  userCollections={userCollections}
                  className="w-full"
                />
              </div>
              
              <div className="text-sm mb-6" style={{ color: '#666666' }}>
                <p>Choose which collection of images to use for generating collages. You can switch between different collections or manage your own uploaded images.</p>
              </div>
              
              {/* Upload Images Button */}
              <div className="mb-4">
                <button
                  onClick={onUploadImages}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'transparent',
                    color: uiColors.fg,
                    border: `1px solid ${uiColors.border}`,
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = uiColors.fg;
                    e.target.style.color = uiColors.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = uiColors.fg;
                  }}
                >
                  <UploadSimple size={16} weight="regular" />
                  Upload Images
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'templates' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: uiColors.fg }}>
                  Template Selection
                </label>
                
                {/* Template Mode Toggle */}
                <div style={{ 
                  display: 'flex',
                  border: `1px solid ${uiColors.border}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem'
                }}>
                  <button
                    onClick={() => handleTemplateModeChange('all')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: templateMode === 'all' ? uiColors.fg : 'transparent',
                      color: templateMode === 'all' ? uiColors.bg : uiColors.fg,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    All Templates
                  </button>
                  <button
                    onClick={() => handleTemplateModeChange('custom')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: templateMode === 'custom' ? uiColors.fg : 'transparent',
                      color: templateMode === 'custom' ? uiColors.bg : uiColors.fg,
                      border: 'none',
                      borderLeft: `1px solid ${uiColors.border}`,
                      cursor: 'pointer',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Custom Selection
                  </button>
                </div>
                
                <p className="text-sm mb-4" style={{ color: '#666666' }}>
                  {templateMode === 'all' 
                    ? 'Using all available templates in random rotation. Each new collage will use a randomly selected template.'
                    : `Using ${localSelectedTemplates.length} selected template${localSelectedTemplates.length !== 1 ? 's' : ''} in rotation.`
                  }
                </p>
                
                {/* Custom Template Selection */}
                <TemplateSelectionUI
                  templateMode={templateMode}
                  localSelectedTemplates={localSelectedTemplates}
                  uniqueTemplates={uniqueTemplates}
                  templateCategories={templateCategories}
                  uiColors={uiColors}
                  handleTemplateToggle={handleTemplateToggle}
                  setLocalSelectedTemplates={setLocalSelectedTemplates}
                  isMobile={false}
                  templateDisplayNames={templateDisplayNames}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer - Apply Button anchored to bottom */}
        <div className="p-6 border-t" style={{ borderColor: uiColors.border }}>
          <button 
            onClick={handleApplyAndClose}
            className="w-full"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: uiColors.fg,
              color: uiColors.bg,
              border: `1px solid ${uiColors.border}`,
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Add CSS for animations
const style = document.createElement('style')
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`
document.head.appendChild(style) 