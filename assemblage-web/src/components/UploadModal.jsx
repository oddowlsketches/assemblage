import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Trash, Check } from 'phosphor-react'
import { useImageUpload } from '../hooks/useImageUpload.ts'
import { getSupabase } from '../supabaseClient'
import { calculateSHA1 } from '../utils/fileHash'
import { useUploadQuota } from '../hooks/useUploadQuota'

export const UploadModal = ({ 
  isOpen, 
  onClose, 
  collectionId,
  onUploadComplete 
}) => {
  const { 
    uploadMultiple, 
    uploading, 
    progress, 
    error: uploadError,
    reset 
  } = useImageUpload()
  
  const [files, setFiles] = useState([])
  const [uploadResults, setUploadResults] = useState(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState(collectionId)
  const [userCollections, setUserCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [generateMetadata, setGenerateMetadata] = useState(true)
  const [session, setSession] = useState(null)
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  // Force white background and black text for upload modal
  const uiColors = {
    bg: '#ffffff',
    fg: '#333333',
    border: '#333333',
    complementaryColor: '#333333'
  }
  const { checkQuota, archiveOldestImages, MAX_ACTIVE_IMAGES } = useUploadQuota()
  const [storageStats, setStorageStats] = useState(null)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ')
        return `${file.name}: ${errorMessages}`
      })
      alert(errors.join('\n'))
    }

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  // Fetch user collections when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAuth()
      // Update selected collection if it changed from outside
      if (collectionId) {
        setSelectedCollectionId(collectionId)
      }
      // Always refresh storage stats when modal opens
      if (session?.user) {
        fetchStorageStats()
      }
    }
  }, [isOpen, collectionId])
  
  // Fetch storage stats when authenticated
  useEffect(() => {
    if (session?.user) {
      fetchStorageStats()
    }
  }, [session])
  
  const checkAuth = async () => {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    if (session) {
      fetchUserCollections()
    }
  }

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
        const collections = data || []
        setUserCollections(collections)
        // Auto-select first collection if none selected
        if (!selectedCollectionId && collections.length > 0) {
          setSelectedCollectionId(collections[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching collections:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchStorageStats = async () => {
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .rpc('get_user_storage_stats', { p_user_id: user.id })
        
        if (error) throw error
        setStorageStats(data)
      }
    } catch (err) {
      console.error('Error fetching storage stats:', err)
    }
  }

  const createNewCollection = async (e) => {
    e.preventDefault()
    if (!newCollectionName.trim()) return

    try {
      setCreatingCollection(true)
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: newCollection, error } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          name: newCollectionName.trim()
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state and select it
      setUserCollections(prev => [newCollection, ...prev])
      setSelectedCollectionId(newCollection.id)
      
      // Reset form
      setNewCollectionName('')
      setShowNewCollectionForm(false)
      
      console.log('[UploadModal] Created new collection:', newCollection.name)
    } catch (err) {
      console.error('Error creating collection:', err)
      alert('Failed to create collection. Please try again.')
    } finally {
      setCreatingCollection(false)
    }
  }

  const removeFile = (id) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const handleUpload = async () => {
    if (showNewCollectionForm) {
      alert('Please create the collection first or select an existing one.')
      return
    }
    if (!selectedCollectionId) {
      alert('Please select a collection from the dropdown above.')
      return;
    }
    if (files.length === 0) return

    try {
      // Check quota before uploading
      const quota = await checkQuota()
      if (quota.isOverQuota) {
        const shouldArchive = window.confirm(
          `You have reached the limit of 30 images. \n\n` +
          `Would you like to automatically archive your ${Math.min(files.length, quota.activeCount)} oldest images to make room?`
        )
        
        if (shouldArchive) {
          const numToArchive = Math.min(files.length, quota.activeCount)
          await archiveOldestImages(numToArchive)
        } else {
          return // User cancelled
        }
      } else if (quota.remainingQuota < files.length) {
        const proceed = window.confirm(
          `You can only upload ${quota.remainingQuota} more images before reaching your limit of 30. \n\n` +
          `Continue with uploading the first ${quota.remainingQuota} images?`
        )
        
        if (!proceed) return
        
        // Limit files to remaining quota
        const limitedFiles = files.slice(0, quota.remainingQuota)
        setFiles(limitedFiles)
      }
      
      const filesToUpload = files.map(f => f.file)
      const { results, errors } = await uploadMultiple(filesToUpload, selectedCollectionId, generateMetadata)
      
      console.log('[UploadModal] Upload results:', { results, errors });
      setUploadResults({ results, errors })
      
      if (results.length > 0 && onUploadComplete) {
        onUploadComplete(results)
      }

      // Clear successfully uploaded files
      if (results.length > 0 && errors.length === 0) {
        // Refresh storage stats after successful upload
        await fetchStorageStats()
        // Show success message for longer
        setTimeout(() => {
          setFiles([])
          setUploadResults(null)
          onClose()
        }, 4000) // Increased from 3000 to 4000ms
      } else if (errors.length > 0) {
        // Keep modal open if there were errors so user can see them
        // Remove successfully uploaded files from the list
        const uploadedFileNames = results.map(r => r.title || '')
        setFiles(prev => prev.filter(f => !uploadedFileNames.includes(f.file.name)))
        // Refresh storage stats even if there were some errors
        if (results.length > 0) {
          await fetchStorageStats()
        }
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const handleClose = () => {
    // Clean up previews
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setFiles([])
    setUploadResults(null)
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal backdrop */}
      <div 
        className="modal-backdrop" 
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }}
      />
      
      {/* Modal content */}
      <div className="upload-modal-content" style={{
        position: 'fixed',
        background: '#ffffff',
        border: '1px solid #333333',
        color: '#333333',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: 'Space Mono, monospace',
        overflow: 'hidden',
        // Full screen on mobile, centered modal on desktop
        ...(window.innerWidth <= 640 ? {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          maxWidth: 'none',
          maxHeight: 'none',
          transform: 'none'
        } : {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh'
        })
      }}>
        {/* Header */}
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
          borderBottom: '1px solid #333333',
          flexShrink: 0
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '1.2rem',
            color: '#333333'
          }}>
            Upload Images
          </h2>
          <button 
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <X size={20} weight="bold" color="#333333" />
          </button>
        </div>

        {/* Body */}
        <div style={{ 
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Show sign-in prompt if not authenticated */}
          {!session ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0'
            }}>
              <p style={{ 
                fontSize: '1.1rem',
                marginBottom: '2rem',
                color: '#333333'
              }}>
                Please sign in to upload your own images
              </p>
              <div style={{ 
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center' 
              }}>
                <button
                  onClick={() => {
                    handleClose();
                    // Trigger sign up
                    setTimeout(() => {
                      const signInBtn = document.querySelector('.sign-in-btn');
                      if (signInBtn) {
                        signInBtn.click();
                        // Wait for auth modal to load then switch to sign up
                        setTimeout(() => {
                          const signUpLink = document.querySelector('[data-supabase-auth-ui] a[href="#auth-sign_up"]');
                          if (signUpLink) signUpLink.click();
                        }, 100);
                      }
                    }, 100);
                  }}
                  style={{
                    background: '#333333',
                    border: '1px solid #333333',
                    color: '#ffffff',
                    padding: '0.5rem 1.5rem',
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.9rem'
                  }}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    handleClose();
                    // Trigger sign in
                    setTimeout(() => {
                      const signInBtn = document.querySelector('.sign-in-btn');
                      if (signInBtn) signInBtn.click();
                    }, 100);
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #333333',
                    color: '#333333',
                    padding: '0.5rem 1.5rem',
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.9rem'
                  }}
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Collection selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              Upload to collection:
            </label>
            <select 
              value={showNewCollectionForm ? 'new' : (selectedCollectionId || '')}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setShowNewCollectionForm(true)
                  setSelectedCollectionId('')
                } else {
                  setShowNewCollectionForm(false)
                  setSelectedCollectionId(e.target.value)
                }
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #333333',
                background: '#ffffff',
                color: '#333333',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem'
              }}
              disabled={loading}
            >
              <option value="">
                {loading ? 'Loading...' : 'Select a collection...'}
              </option>
              {userCollections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
              <option value="new">+ Create New Collection</option>
            </select>
            
            {/* New collection form */}
            {showNewCollectionForm && (
              <form onSubmit={createNewCollection} style={{ marginTop: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                  gap: '0.5rem' 
                }}>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    style={{
                      flex: window.innerWidth <= 480 ? 'none' : 1,
                      padding: '0.5rem',
                      border: '1px solid #333333',
                      background: '#ffffff',
                      color: '#333333',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.9rem',
                      width: window.innerWidth <= 480 ? '100%' : 'auto',
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                    disabled={creatingCollection}
                  />
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexShrink: 0
                  }}>
                    <button
                      type="submit"
                      disabled={creatingCollection || !newCollectionName.trim()}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#333333',
                        color: '#ffffff',
                        border: '1px solid #333333',
                        cursor: creatingCollection || !newCollectionName.trim() ? 'not-allowed' : 'pointer',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.9rem',
                        opacity: creatingCollection || !newCollectionName.trim() ? 0.5 : 1,
                        flex: window.innerWidth <= 480 ? 1 : 'none',
                        minWidth: window.innerWidth <= 480 ? 'auto' : '80px'
                      }}
                    >
                      {creatingCollection ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCollectionForm(false)
                        setNewCollectionName('')
                        // Select first collection if available
                        if (userCollections.length > 0) {
                          setSelectedCollectionId(userCollections[0].id)
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#ffffff',
                        color: '#333333',
                        border: '1px solid #333333',
                        cursor: 'pointer',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '0.9rem',
                        flex: window.innerWidth <= 480 ? 1 : 'none',
                        minWidth: window.innerWidth <= 480 ? 'auto' : '80px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
            
            {userCollections.length === 0 && !loading && !showNewCollectionForm && (
            <p style={{fontSize: '0.8rem', color: '#333333', opacity: 0.7, marginTop: '0.5rem'}}>
            You need to create a collection first before uploading images.
            </p>
            )}
          </div>
          
          {/* Dropzone - only show instructions if no files selected */}
          {files.length === 0 ? (
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? '#333333' : '#ccc'}`,
                padding: '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#ffffff',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p style={{ margin: 0, color: '#333333' }}>Drop the images here...</p>
              ) : (
                <div>
                  <p style={{ marginBottom: '0.5rem', color: '#333333' }}>
                    Drag & drop images here, or click to select
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>
                    JPEG and PNG only, max 10MB per file
                  </p>
                  {storageStats && (
                    <>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>
                        Images: {storageStats.image_count}/{storageStats.max_images} • Storage: {storageStats.total_size_mb}/{storageStats.max_size_mb} MB
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>
                        Images will be resized to max 2560px and compressed to save space
                      </p>
                    </>
                  )}
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.6 }}>
                    Note: Some devices limit multi-select to ~15-20 files at once
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Small dropzone when files are already selected */
            <div
              {...getRootProps()}
              style={{
                border: `1px dashed #ccc`,
                padding: '1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#ffffff',
                transition: 'all 0.2s ease',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}
            >
              <input {...getInputProps()} />
              <p style={{ margin: 0, color: '#333333' }}>
                + Add more images
              </p>
            </div>
          )}

          {/* Metadata generation toggle */}
          <div style={{ 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <input 
              type="checkbox" 
              id="generate-metadata"
              checked={generateMetadata}
              onChange={(e) => setGenerateMetadata(e.target.checked)}
              style={{
                cursor: 'pointer'
              }}
            />
            <label 
              htmlFor="generate-metadata" 
              style={{ 
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Generate AI metadata
            </label>
            <span style={{ 
              fontSize: '0.8rem', 
              opacity: 0.7 
            }}>
              (Unchecked images won't have descriptions)
            </span>
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <>
              <h3 style={{ 
                margin: '0 0 1rem 0',
                fontSize: '0.9rem',
                color: '#333333'
              }}>
                Selected Files ({files.length})
              </h3>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '0.5rem',
                marginBottom: '1rem'
              }} className="file-grid">
                {files.map(({ id, file, preview }) => (
                  <div key={id} style={{ 
                    border: '1px solid #333333',
                    background: '#ffffff',
                    position: 'relative',
                    width: '100px',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      width: '100%',
                      height: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      background: '#f5f5f5'
                    }}>
                      <img
                        src={preview}
                        alt={file.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => removeFile(id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#333333',
                        color: '#ffffff',
                        border: 'none',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={12} weight="bold" />
                    </button>
                    <div style={{ 
                      padding: '0.25rem',
                      fontSize: '0.7rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      borderTop: '1px solid #333333'
                    }}>
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Upload progress */}
          {uploading && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: '#f0f0f0',
                overflow: 'hidden',
                border: '1px solid #333333'
              }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: '#333333',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              {window.innerWidth <= 640 && (
                <p style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  opacity: 0.8,
                  textAlign: 'center'
                }}>
                  Please keep this tab open while uploading
                </p>
              )}
            </div>
          )}

          {/* Error display */}
          {uploadError && (
            <div style={{
              padding: '0.75rem',
              background: 'white',
              border: '1px solid red',
              color: 'red',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              {uploadError}
            </div>
          )}

          {/* Results */}
          {uploadResults && (
            <div style={{ marginBottom: '1rem' }}>
              {uploadResults.results.length > 0 && (
                <div style={{
                  padding: '1.25rem',
                  background: '#d4edda',
                  border: '2px solid #2ECC71',
                  color: '#155724',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(46, 204, 113, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Check size={24} weight="bold" color="#2ECC71" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>Successfully uploaded {uploadResults.results.length} image{uploadResults.results.length !== 1 ? 's' : ''}!</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#155724' }}>
                        {userCollections.find(c => c.id === selectedCollectionId)?.name && (
                          <>Images added to "{userCollections.find(c => c.id === selectedCollectionId)?.name}" collection</>  
                        )}
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', fontStyle: 'italic', color: '#155724' }}>
                        This window will close automatically in a few seconds...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {uploadResults.errors.length > 0 && (
                <div style={{
                  padding: '0.75rem',
                  background: 'white',
                  border: '1px solid #E74C3C',
                  color: '#C0392B',
                  fontSize: '0.85rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                    {uploadResults.errors.some(err => err.error.includes('already exists')) 
                      ? 'Some images were skipped:' 
                      : 'Failed uploads:'}
                  </p>
                  {uploadResults.errors.map((err, i) => (
                    <p key={i} style={{ margin: '0.25rem 0' }}>
                      <strong>{err.file}:</strong> {err.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer - Sticky */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          padding: '1.5rem',
          borderTop: '1px solid #333333',
          background: '#ffffff',
          flexShrink: 0
        }}>
          <button
            onClick={handleClose}
            style={{
              background: '#ffffff',
              border: '1px solid #333333',
              color: '#333333',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              flex: window.innerWidth <= 480 ? 'none' : 'unset',
              order: window.innerWidth <= 480 ? 1 : 0
            }}
            onMouseEnter={e => {
              e.target.style.background = '#333333';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              e.target.style.background = '#ffffff';
              e.target.style.color = '#333333';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={showNewCollectionForm || !selectedCollectionId || files.length === 0 || uploading}
            style={{
              background: '#333333',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              cursor: showNewCollectionForm || !selectedCollectionId || files.length === 0 || uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              opacity: showNewCollectionForm || !selectedCollectionId || files.length === 0 || uploading ? 0.5 : 1,
              flex: window.innerWidth <= 480 ? 'none' : 'unset',
              order: window.innerWidth <= 480 ? 0 : 1
            }}
            onMouseEnter={e => {
              if (!e.target.disabled) {
                e.target.style.background = '#ffffff';
                e.target.style.color = '#333333';
              }
            }}
            onMouseLeave={e => {
              if (!e.target.disabled) {
                e.target.style.background = '#333333';
                e.target.style.color = '#ffffff';
              }
            }}
          >
            Upload {files.length > 0 && `(${files.length})`}
          </button>
        </div>
      </div>
    </>
  )
}
