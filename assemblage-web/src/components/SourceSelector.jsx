import React, { useState, useEffect, useRef } from 'react'
import { CaretDown, Check, Image, FloppyDisk, BookmarkSimple, UploadSimple, LinkSimple, FolderOpen, Bookmarks } from 'phosphor-react'
import { getSupabase } from '../supabaseClient'
import { useUiColors } from '../hooks/useUiColors'
import { getContrastText } from '../lib/colorUtils/contrastText'

export const SourceSelector = ({ 
  activeSource,
  activeSourceName,
  onSourceChange,
  onManageCollections,
  onUploadImages,
  onOpenGallery,
  userCollections, // Add this prop to receive collections from parent
  className 
}) => {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [imageActionsOpen, setImageActionsOpen] = useState(false)
  const [session, setSession] = useState(null)
  const libraryRef = useRef(null)
  const imageActionsRef = useRef(null)
  const uiColors = useUiColors()
  
  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      setSession(user)
    }
    checkSession()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (libraryRef.current && !libraryRef.current.contains(event.target)) {
        setLibraryOpen(false)
      }
      if (imageActionsRef.current && !imageActionsRef.current.contains(event.target)) {
        setImageActionsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSourceLabel = () => {
    // Always use the activeSourceName prop passed from parent
    // The parent component manages the correct name for all sources
    return activeSourceName || 'Select Collection'
  }

  const handleSourceSelect = (sourceId) => {
    onSourceChange(sourceId)
    setLibraryOpen(false)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {/* Library Selector with label and caret */}
      <div ref={libraryRef} className="settings-dropdown">
        <button 
          onClick={() => setLibraryOpen(!libraryOpen)}
          className="min-w-[12rem] whitespace-nowrap"
          style={{ 
            justifyContent: 'space-between',
            paddingLeft: '1rem',
            paddingRight: '0.75rem',
            backgroundColor: 'white',
            color: '#333',
            border: '1px solid #333',
            cursor: 'pointer',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem 1rem 0.5rem 1rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
            {getSourceLabel()}
          </span>
          <CaretDown size={12} weight="regular" />
        </button>
        
        {libraryOpen && (
          <div className="dropdown-content show" style={{ 
            minWidth: '12rem',
            backgroundColor: 'white',
            color: '#333'
          }}>
            <div className="dropdown-label" style={{ color: '#666' }}>IMAGE SOURCE</div>
            
            {/* User Collections */}
            {userCollections && userCollections.length > 0 && (
              <>
                {userCollections.map((collection, index) => {
                  // For the default collection, check if activeSource is either 'cms' or the actual ID
                  const isDefaultCollection = collection.id === '00000000-0000-0000-0000-000000000001';
                  const isSelected = activeSource === collection.id || (isDefaultCollection && activeSource === 'cms');
                  
                  // Check if we need to add a divider after the default collection
                  const needsDivider = isDefaultCollection && index < userCollections.length - 1;
                  
                  return (
                    <React.Fragment key={collection.id}>
                      <button
                        onClick={() => handleSourceSelect(isDefaultCollection ? 'cms' : collection.id)}
                        className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <span>{collection.name}</span>
                        {isSelected && <Check size={16} weight="bold" />}
                      </button>
                      {needsDivider && (
                        <div className="dropdown-divider" style={{
                          height: '1px',
                          background: '#eee',
                          margin: '0.25rem 0',
                          opacity: 1
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
                
                {/* Educational text for signed-out users */}
                {!session && userCollections.length === 1 && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    color: '#666',
                    opacity: 0.9,
                    fontStyle: 'italic',
                    borderTop: '1px solid #eee',
                    background: '#f9f9f9'
                  }}>
                    Sign in to upload your own images
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Image Actions with icon and caret */}
      <div ref={imageActionsRef} className="settings-dropdown">
        <button 
          onClick={() => setImageActionsOpen(!imageActionsOpen)}
          title="Image actions"
          style={{ 
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: 'white',
            color: '#333',
            border: '1px solid #333',
            cursor: 'pointer',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Image size={20} weight="regular" />
          <CaretDown size={12} weight="regular" />
        </button>
        
        {imageActionsOpen && (
          <div className="dropdown-content show" style={{ 
            minWidth: '12rem',
            backgroundColor: 'white',
            color: '#333'
          }}>
            <button
              onClick={() => {
                setImageActionsOpen(false)
                if (session) {
                  onManageCollections()
                } else {
                  // Trigger auth modal
                  const authButton = document.querySelector('.sign-in-btn');
                  if (authButton) authButton.click();
                }
              }}
              className="dropdown-item"
              style={{ whiteSpace: 'nowrap' }}
            >
              My Images
            </button>
            
            <button
              onClick={() => {
                setImageActionsOpen(false)
                if (session) {
                  onOpenGallery()
                } else {
                  // Trigger auth modal
                  const authButton = document.querySelector('.sign-in-btn');
                  if (authButton) authButton.click();
                }
              }}
              className="dropdown-item"
              style={{ whiteSpace: 'nowrap' }}
            >
              Saved Collages
            </button>
            
            <div className="dropdown-divider" style={{
              height: '1px',
              background: '#eee',
              margin: '0.25rem 0',
              opacity: 1
            }} />
            
            <button
              onClick={() => {
                setImageActionsOpen(false)
                if (session) {
                  onUploadImages()
                } else {
                  // Trigger auth modal
                  const authButton = document.querySelector('.sign-in-btn');
                  if (authButton) authButton.click();
                }
              }}
              className="dropdown-item"
              style={{ whiteSpace: 'nowrap' }}
            >
              Upload Images
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
