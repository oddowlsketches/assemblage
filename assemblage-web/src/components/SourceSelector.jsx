import React, { useState, useEffect, useRef } from 'react'
import { CaretDown, Check, Image, FloppyDisk, BookmarkSimple, UploadSimple, LinkSimple, FolderOpen, Bookmarks } from 'phosphor-react'
import { getSupabase } from '../supabaseClient'
import { useUiColors } from '../hooks/useUiColors'

export const SourceSelector = ({ 
  activeSource,
  onSourceChange,
  onManageCollections,
  onUploadImages,
  onOpenGallery,
  className 
}) => {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [imageActionsOpen, setImageActionsOpen] = useState(false)
  const [userCollections, setUserCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const libraryRef = useRef(null)
  const imageActionsRef = useRef(null)
  const uiColors = useUiColors()

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

  // Fetch user collections when library dropdown opens
  useEffect(() => {
    if (libraryOpen && userCollections.length === 0) {
      fetchUserCollections()
    }
  }, [libraryOpen])

  const fetchUserCollections = async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('user_collections')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setUserCollections(data || [])
      }
    } catch (err) {
      console.error('Error fetching collections:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSourceLabel = () => {
    if (activeSource === 'cms') {
      return 'Default Library'
    }
    
    const collection = userCollections.find(c => c.id === activeSource)
    return collection?.name || 'Select Library'
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
          style={{ 
            minWidth: '12rem',
            justifyContent: 'space-between',
            paddingLeft: '1rem',
            paddingRight: '0.75rem',
            background: uiColors.bg,
            color: uiColors.fg,
            border: `1px solid ${uiColors.border}`,
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
            minWidth: '12rem'
          }}>
            <div className="dropdown-label">Select Library</div>
            
            {/* Default Library */}
            <button
              onClick={() => handleSourceSelect('cms')}
              className={`dropdown-item ${activeSource === 'cms' ? 'selected' : ''}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              <span>Default Library</span>
              {activeSource === 'cms' && <Check size={16} weight="bold" />}
            </button>

            {/* User Collections */}
            {loading ? (
              <div className="dropdown-item" style={{ fontSize: '12px', opacity: 0.6 }}>
                Loading...
              </div>
            ) : userCollections.length > 0 && (
              <>
                <div className="dropdown-divider" style={{
                  height: '1px',
                  background: uiColors.border,
                  margin: '0.25rem 0',
                  opacity: 0.2
                }} />
                {userCollections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleSourceSelect(collection.id)}
                    className={`dropdown-item ${activeSource === collection.id ? 'selected' : ''}`}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <span>{collection.name}</span>
                    {activeSource === collection.id && <Check size={16} weight="bold" />}
                  </button>
                ))}
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
            background: uiColors.bg,
            color: uiColors.fg,
            border: `1px solid ${uiColors.border}`,
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
            minWidth: '12rem'
          }}>
            <button
              onClick={() => {
                setImageActionsOpen(false)
                onManageCollections()
              }}
              className="dropdown-item"
              style={{ whiteSpace: 'nowrap' }}
            >
              My Collections
            </button>
            
            <button
              onClick={() => {
                setImageActionsOpen(false)
                onOpenGallery()
              }}
              className="dropdown-item"
              style={{ whiteSpace: 'nowrap' }}
            >
              Saved Collages
            </button>
            
            <div className="dropdown-divider" style={{
              height: '1px',
              background: uiColors.border,
              margin: '0.25rem 0',
              opacity: 0.2
            }} />
            
            <button
              onClick={() => {
                setImageActionsOpen(false)
                onUploadImages()
              }}
              className="dropdown-item"
              style={{ whiteSpace: 'nowrap' }}
            >
              Upload Images
            </button>
            
            <button
              onClick={() => {
                setImageActionsOpen(false)
                // Check if running on Netlify (production) or local dev
                if (window.location.hostname === 'localhost') {
                  alert('Dropbox integration requires deployment. Please use the deployed version.')
                } else {
                  // Redirect to Dropbox OAuth
                  window.location.href = '/.netlify/functions/dropbox-auth-start'
                }
              }}
              className="dropdown-item"
              style={{ whiteSpace: 'nowrap', opacity: 0.5 }}
            >
              Connect Dropbox (coming soon)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
