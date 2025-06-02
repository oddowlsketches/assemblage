import React, { useState, useEffect } from 'react'
import { X, Plus, UploadSimple, FolderSimple } from 'phosphor-react'
import { getSupabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { getContrastText } from '../lib/colorUtils/contrastText'

export const CollectionDrawer = ({ 
  isOpen, 
  onClose, 
  activeCollectionId,
  onCollectionSelect,
  onShowGallery,
  onUploadImages,
  onNewCollectionCreated // New prop for handling new collection creation
}) => {
  const [userCollections, setUserCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [error, setError] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [session, setSession] = useState(null)
  const navigate = useNavigate()
  // Force white background for collection drawer
  const uiColors = {
    bg: '#ffffff',
    fg: '#333333',
    border: '#333333',
    complementaryColor: '#333333'
  }

  // Check session and fetch collections
  useEffect(() => {
    if (isOpen) {
      checkSession()
    }
  }, [isOpen])
  
  const checkSession = async () => {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    setSession(user)
    if (user) {
      fetchCollections()
    } else {
      setLoading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Please sign in to manage collections')
        return
      }

      // Fetch user collections
      const { data, error: fetchError } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Get image counts and thumbnails for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          // For user uploads, use user_collection_id
          const { count: totalCount } = await supabase
            .from('images')
            .select('*', { count: 'exact', head: true })
            .eq('user_collection_id', collection.id)
            .eq('user_id', user.id)
            .eq('provider', 'upload')

          const { count: pendingCount } = await supabase
            .from('images')
            .select('*', { count: 'exact', head: true })
            .eq('user_collection_id', collection.id)
            .eq('user_id', user.id)
            .eq('provider', 'upload')
            .eq('metadata_status', 'pending')
            
          // Get first 4 images for thumbnail grid
          const { data: thumbnails } = await supabase
            .from('images')
            .select('id, thumb_src, src')
            .eq('user_collection_id', collection.id)
            .eq('user_id', user.id)
            .eq('provider', 'upload')
            .limit(4)

          return {
            ...collection,
            totalImages: totalCount || 0,
            pendingImages: pendingCount || 0,
            thumbnails: thumbnails || []
          }
        })
      )
      
      setUserCollections(collectionsWithCounts)
    } catch (err) {
      console.error('Error fetching collections:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCollection = async (e) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return

    try {
      setCreating(true)
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      // Create in user_collections only
      const { data: newUserCollection, error: createUserCollectionError } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          name: newCollectionName.trim()
        })
        .select()
        .single()

      if (createUserCollectionError) throw createUserCollectionError;

      console.log('[CollectionDrawer] Created user collection:', newUserCollection.id);

      // Add to local state with counts
      const collectionForState = {
        ...newUserCollection,
        totalImages: 0,
        pendingImages: 0,
        thumbnails: []
      }
      
      setUserCollections(prev => [collectionForState, ...prev])
      
      // Instead of selecting the collection, call the new handler
      if (onNewCollectionCreated) {
        onNewCollectionCreated(newUserCollection.id)
      }

      // Reset form
      setNewCollectionName('')
      setShowNewForm(false)
    } catch (err) {
      console.error('Error creating collection:', err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="gallery-fullscreen" style={{ background: uiColors.bg }}>
      <header className="gallery-header" style={{ 
        background: uiColors.bg,
        borderBottom: `1px solid ${getContrastText(uiColors.bg)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: window.innerWidth <= 768 ? '1rem 1.5rem' : '1.5rem'
      }}>
        <h1 style={{ 
          color: getContrastText(uiColors.bg),
          fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem',
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          margin: 0
        }}>Assemblage</h1>
        <button 
          onClick={onClose} 
          style={{ 
            color: getContrastText(uiColors.bg),
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <X size={20} weight="regular" />
        </button>
      </header>
      
      <div className="gallery-content" style={{ background: uiColors.bg }}>
        {/* Page header with action button */}
        <div className="collection-page-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '2rem 2rem 0 2rem'
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '1.5rem',
            fontFamily: 'Space Mono, monospace',
            color: getContrastText(uiColors.bg)
          }}>
            My Images
          </h2>
          {session && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {onUploadImages && (
                <button
                  onClick={onUploadImages}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    color: getContrastText(uiColors.bg),
                    border: `1px solid ${getContrastText(uiColors.bg)}`,
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.9rem'
                  }}
                  className="upload-images-btn"
                >
                  <UploadSimple size={16} weight="regular" />
                  <span className="desktop-only">Upload</span>
                </button>
              )}
              <button
                onClick={() => setShowNewForm(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: getContrastText(uiColors.bg),
                  color: uiColors.bg,
                  border: `1px solid ${getContrastText(uiColors.bg)}`,
                  cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.9rem'
                }}
                className="new-collection-btn"
              >
                <Plus size={16} weight="regular" />
                <span className="desktop-only">New</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="gallery-loading">Loading collections...</div>
        ) : !session ? (
          <div className="gallery-empty" style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: uiColors.fg 
          }}>
            <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Please sign in to upload your own images</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  onClose();
                  // Trigger auth modal in main app
                  const authButton = document.querySelector('.sign-in-btn');
                  if (authButton) authButton.click();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: uiColors.fg,
                  color: uiColors.bg,
                  border: `1px solid ${uiColors.fg}`,
                  cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.9rem'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onClose();
                  // Trigger auth modal in create account mode
                  const authButton = document.querySelector('.sign-in-btn');
                  if (authButton) authButton.click();
                  // Small delay to ensure modal opens first
                  setTimeout(() => {
                    const createLink = document.querySelector('[data-supabase-auth-ui-create-account]');
                    if (createLink) createLink.click();
                  }, 100);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: uiColors.fg,
                  border: `1px solid ${uiColors.fg}`,
                  cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.9rem'
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="gallery-empty">
            <p>{error}</p>
          </div>
        ) : (
          <div>
            {/* New collection form */}
            {showNewForm && (
              <form onSubmit={createCollection} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    className="gallery-search-input"
                    style={{ flex: 1 }}
                    autoFocus
                    disabled={creating}
                  />
                  <button
                    type="submit"
                    disabled={creating || !newCollectionName.trim()}
                    className="gallery-filter-btn"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewForm(false)
                      setNewCollectionName('')
                    }}
                    className="gallery-clear-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Collections grid */}
            <div className="gallery-grid collections-grid" style={{ padding: '0 2rem 2rem 2rem' }}>
              {/* User Collections */}
              {userCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="gallery-item collection-card"
                  style={{ 
                    cursor: 'pointer',
                    background: uiColors.bg,
                    border: activeCollectionId === collection.id ? `2px solid ${getContrastText(uiColors.bg)}` : `1px solid ${getContrastText(uiColors.bg)}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => {
                    navigate(`/collections/${collection.id}`);
                    onClose();
                  }}
                >
                  <div className="gallery-thumbnail" style={{ 
                    background: uiColors.bg === '#ffffff' ? '#f9f9f9' : `${uiColors.bg}88`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: `1px solid ${uiColors.border}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {collection.thumbnails && collection.thumbnails.length > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gridTemplateRows: 'repeat(2, 1fr)',
                        width: '100%',
                        height: '100%',
                        gap: '1px',
                        background: uiColors.border
                      }}>
                        {collection.thumbnails.slice(0, 4).map((img, index) => (
                          <div 
                            key={img.id}
                            style={{
                              background: `url(${img.thumb_src || img.src}) center/cover`,
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        ))}
                        {collection.thumbnails.length < 4 && Array(4 - collection.thumbnails.length).fill(null).map((_, index) => (
                          <div 
                            key={`empty-${index}`}
                            style={{
                              background: uiColors.bg === '#ffffff' ? '#f0f0f0' : `${uiColors.bg}66`,
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <FolderSimple size={48} weight="regular" style={{ opacity: 0.3, color: uiColors.fg }} />
                    )}
                  </div>
                  <div className="gallery-info" style={{ color: uiColors.fg }}>
                    <h4 style={{ marginBottom: '0.25rem', color: uiColors.fg }}>{collection.name}</h4>
                    <p style={{ marginBottom: '0.25rem', opacity: 0.7, fontSize: '0.9rem' }}>{collection.totalImages} images</p>
                    {collection.pendingImages > 0 && (
                      <p style={{ color: uiColors.fg, opacity: 0.6, fontSize: '0.85rem' }}>
                        {collection.pendingImages} processing
                      </p>
                    )}
                  </div>
                  {activeCollectionId === collection.id && (
                    <div style={{ 
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: uiColors.fg,
                      color: uiColors.bg,
                      padding: '0.25rem 0.5rem',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.7rem',
                      borderRadius: '2px'
                    }}>
                      Active
                    </div>
                  )}
                </div>
              ))}
            </div>

            {userCollections.length === 0 && !showNewForm && (
              <div className="gallery-empty">
                <p>No collections yet. Create your first one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
