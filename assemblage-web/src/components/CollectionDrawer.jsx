import React, { useState, useEffect } from 'react'
import { X, Plus, ImageSquare, FolderSimple } from 'phosphor-react'
import { getSupabase } from '../supabaseClient'

export const CollectionDrawer = ({ 
  isOpen, 
  onClose, 
  activeCollectionId,
  onCollectionSelect,
  onShowGallery 
}) => {
  const [userCollections, setUserCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [error, setError] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)

  // Fetch user collections
  useEffect(() => {
    if (isOpen) {
      fetchCollections()
    }
  }, [isOpen])

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

      // Get image counts for each collection
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

          return {
            ...collection,
            totalImages: totalCount || 0,
            pendingImages: pendingCount || 0
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
      
      // Create in user_collections
      const { data: newUserCollection, error: createUserCollectionError } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          name: newCollectionName.trim()
        })
        .select()
        .single()

      if (createUserCollectionError) throw createUserCollectionError;

      // ALSO Create a corresponding entry in image_collections
      const { error: createImageCollectionError } = await supabase
        .from('image_collections')
        .insert({
          id: newUserCollection.id, // Use the SAME ID as the user_collection
          name: newUserCollection.name, // Can use the same name
          user_id: user.id, // Associate with the user
          // Add any other required fields for image_collections from your schema
          // e.g., is_public: false, type: 'user_generated' (if they exist and are NOT NULL without defaults)
        });

      if (createImageCollectionError) {
        // If this fails, we should ideally roll back the user_collection creation
        // or at least log a serious error, as uploads to this collection will fail.
        console.error('[CollectionDrawer] Error creating corresponding image_collection entry:', createImageCollectionError);
        // For simplicity, we'll throw the error to prevent inconsistent state. 
        // A more robust solution might involve a transaction or cleanup.
        throw new Error(`Failed to create collection in both tables: ${createImageCollectionError.message}`);
      }
      console.log('[CollectionDrawer] Created corresponding image_collection entry for:', newUserCollection.id);

      // Add to local state with counts
      const collectionForState = {
        ...newUserCollection,
        totalImages: 0,
        pendingImages: 0
      }
      
      setUserCollections(prev => [collectionForState, ...prev])
      
      // Select the new collection
      if (onCollectionSelect) {
        onCollectionSelect(newUserCollection.id)
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
    <div className="gallery-fullscreen">
      <header className="gallery-header">
        <div className="gallery-header-text">
          <h1>Assemblage</h1>
        </div>
        <div className="gallery-header-controls">
          <button onClick={onClose} className="gallery-close-btn">
            <X size={20} weight="regular" />
          </button>
        </div>
      </header>
      
      <div className="gallery-content">
        {/* Page header with action button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '1.5rem',
            fontFamily: 'Playfair Display, serif'
          }}>
            My Collections
          </h2>
          <button
            onClick={() => setShowNewForm(true)}
            className="gallery-filter-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} weight="regular" />
            New Collection
          </button>
        </div>

        {loading ? (
          <div className="gallery-loading">Loading collections...</div>
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
            <div className="gallery-grid">
              {/* User Collections */}
              {userCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="gallery-item"
                  style={{ 
                    cursor: 'pointer',
                    border: activeCollectionId === collection.id ? '2px solid var(--text-color, #333)' : '1px solid var(--button-border-color, #333)'
                  }}
                  onClick={() => {
                    onCollectionSelect(collection.id)
                    onClose()
                  }}
                >
                  <div className="gallery-thumbnail" style={{ background: '#f9f9f9' }}>
                    <div style={{ 
                      fontSize: '48px', 
                      opacity: 0.3 
                    }}>
                      📁
                    </div>
                  </div>
                  <div className="gallery-info">
                    <h4>{collection.name}</h4>
                    <p>{collection.totalImages} images</p>
                    {collection.pendingImages > 0 && (
                      <p style={{ color: 'var(--color-transformation, #4a3b6c)' }}>
                        {collection.pendingImages} processing
                      </p>
                    )}
                  </div>
                  {activeCollectionId === collection.id && (
                    <div style={{ 
                      padding: '0.5rem 1rem',
                      background: 'var(--text-color, #333)',
                      color: 'white',
                      textAlign: 'center',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.8rem'
                    }}>
                      Currently Selected
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Navigate to collection view page
                      alert(`TODO: View images in ${collection.name}`);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--button-border-color, #333)',
                      background: 'white',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      marginTop: '0.5rem'
                    }}
                  >
                    View Images
                  </button>
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
