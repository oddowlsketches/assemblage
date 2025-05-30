import React, { useState, useEffect, useRef } from 'react'
import { CaretDown, Check, Image, Gear } from 'phosphor-react'
import { getSupabase } from '../supabaseClient'

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
      {/* Button 1: Library Selector */}
      <div ref={libraryRef} className="settings-dropdown">
        <button 
          className="settings-btn" 
          onClick={() => setLibraryOpen(!libraryOpen)}
          style={{ minWidth: '12rem' }}
        >
          <span style={{ fontSize: '14px', marginRight: '4px', whiteSpace: 'nowrap' }}>
            {getSourceLabel()}
          </span>
          <CaretDown size={12} weight="regular" />
        </button>
        
        {libraryOpen && (
          <div className="dropdown-content show" style={{ minWidth: '12rem' }}>
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
                <div className="dropdown-divider" />
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

      {/* Button 2: Image Actions */}
      <div ref={imageActionsRef} className="settings-dropdown">
        <button 
          className="settings-btn" 
          onClick={() => setImageActionsOpen(!imageActionsOpen)}
          title="Image actions"
          style={{ padding: '0.5rem' }}
        >
          <Image size={20} weight="regular" />
        </button>
        
        {imageActionsOpen && (
          <div className="dropdown-content show" style={{ minWidth: '12rem' }}>
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
              style={{ whiteSpace: 'nowrap' }}
            >
              Connect Dropbox
            </button>
            
            <div className="dropdown-divider" />
            
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
          </div>
        )}
      </div>

      {/* Button 3: Collection Management */}
      <button 
        className="settings-btn" 
        onClick={onManageCollections}
        title="Manage collections"
        style={{ padding: '0.5rem' }}
      >
        <Gear size={20} weight="regular" />
      </button>
    </div>
  )
}
