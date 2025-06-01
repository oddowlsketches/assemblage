import React, { useState, useEffect } from 'react'
import { X, Image, UploadSimple } from 'phosphor-react'
import { SourceSelector } from './SourceSelector'
import { getContrastText } from '../lib/colorUtils/contrastText'

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
  onDrawerOpen
}) => {
  const [activeTab, setActiveTab] = useState('source')
  
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
              <X size={24} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
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
          
          {/* Footer - Apply Button */}
          <div className="p-6 border-t bg-white" style={{ borderColor: uiColors.border }}>
            <button 
              onClick={onApplyAndClose}
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
            <X size={24} />
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
        </div>
        
        {/* Footer - Apply Button anchored to bottom */}
        <div className="p-6 border-t" style={{ borderColor: uiColors.border }}>
          <button 
            onClick={onApplyAndClose}
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