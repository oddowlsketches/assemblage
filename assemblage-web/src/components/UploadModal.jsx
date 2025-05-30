import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Trash } from 'phosphor-react'
import { useImageUpload } from '../hooks/useImageUpload.ts'
import { getSupabase } from '../supabaseClient'
import { useUiColors } from '../hooks/useUiColors'
import { calculateSHA1 } from '../utils/fileHash'

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
  const [selectedCollectionId, setSelectedCollectionId] = useState(collectionId || null)
  const [userCollections, setUserCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const uiColors = useUiColors()

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
      fetchUserCollections()
      // Update selected collection if it changed from outside
      if (collectionId) {
        setSelectedCollectionId(collectionId)
      }
    }
  }, [isOpen, collectionId])

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
    if (!selectedCollectionId) {
      alert('Please select a collection from the dropdown above.')
      return;
    }
    if (files.length === 0) return

    try {
      const filesToUpload = files.map(f => f.file)
      const { results, errors } = await uploadMultiple(filesToUpload, selectedCollectionId)
      
      setUploadResults({ results, errors })
      
      if (results.length > 0 && onUploadComplete) {
        onUploadComplete(results)
      }

      // Clear successfully uploaded files
      if (results.length > 0) {
        setTimeout(() => {
          setFiles([])
          setUploadResults(null)
          onClose()
        }, 2000)
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
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: uiColors.bg,
        border: `1px solid ${uiColors.border}`,
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: 'Space Mono, monospace',
          overflow: 'hidden'
        }}>
        {/* Header */}
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
          borderBottom: `1px solid ${uiColors.border}`,
          flexShrink: 0
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '1.2rem',
            color: uiColors.fg
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
            <X size={20} weight="bold" color={uiColors.fg} />
          </button>
        </div>

        {/* Body */}
        <div style={{ 
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Collection selector */}
          {!selectedCollectionId && (
            <div style={{ 
              padding: '1rem',
              background: uiColors.bg,
              marginBottom: '1rem',
              fontSize: '0.9rem',
              border: `1px solid ${uiColors.border}`
            }}>
              <strong>Choose where to upload your images:</strong>
            </div>
          )}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              Upload to:
            </label>
            <select 
              value={selectedCollectionId || ''}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${uiColors.border}`,
                background: uiColors.bg,
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
            </select>
            {userCollections.length === 0 && !loading && (
              <p style={{fontSize: '0.8rem', color: uiColors.fg, opacity: 0.7, marginTop: '0.5rem'}}>
                You need to create a collection first before uploading images.
              </p>
            )}
          </div>
          
          {/* Dropzone - only show instructions if no files selected */}
          {files.length === 0 ? (
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? uiColors.fg : '#ccc'}`,
                padding: '3rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? uiColors.bg : uiColors.bg,
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p style={{ margin: 0, color: uiColors.fg }}>Drop the images here...</p>
              ) : (
                <div>
                  <p style={{ marginBottom: '0.5rem', color: uiColors.fg }}>
                    Drag & drop images here, or click to select
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>
                    JPEG and PNG only, max 10MB per file
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
                background: isDragActive ? uiColors.bg : uiColors.bg,
                transition: 'all 0.2s ease',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}
            >
              <input {...getInputProps()} />
              <p style={{ margin: 0, color: uiColors.fg }}>
                + Add more images
              </p>
            </div>
          )}

          {/* File previews */}
          {files.length > 0 && (
            <>
              <h3 style={{ 
                margin: '0 0 1rem 0',
                fontSize: '0.9rem',
                color: uiColors.fg
              }}>
                Selected Files ({files.length})
              </h3>
              
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {files.map(({ id, file, preview }) => (
                  <div key={id} style={{ 
                    border: `1px solid ${uiColors.border}`,
                    background: uiColors.bg,
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
                        background: uiColors.fg,
                        color: uiColors.bg,
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
                      borderTop: `1px solid ${uiColors.border}`
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
                background: uiColors.bg,
                overflow: 'hidden',
                border: `1px solid ${uiColors.border}`
              }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: uiColors.fg,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
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
                  padding: '0.75rem',
                  background: 'white',
                  border: '1px solid #2ECC71',
                  color: '#27AE60',
                  marginBottom: '0.5rem',
                  fontSize: '0.85rem'
                }}>
                  Successfully uploaded {uploadResults.results.length} image(s)
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
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Failed uploads:</p>
                  {uploadResults.errors.map((err, i) => (
                    <p key={i} style={{ margin: '0.25rem 0' }}>{err.file}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          padding: '1.5rem',
          borderTop: `1px solid ${uiColors.border}`,
          background: uiColors.bg,
          flexShrink: 0
        }}>
          <button
            onClick={handleClose}
            style={{
              background: uiColors.bg,
              border: `1px solid ${uiColors.border}`,
              color: uiColors.fg,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              e.target.style.background = uiColors.fg;
              e.target.style.color = uiColors.bg;
            }}
            onMouseLeave={e => {
              e.target.style.background = uiColors.bg;
              e.target.style.color = uiColors.fg;
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedCollectionId || files.length === 0 || uploading}
            style={{
              background: uiColors.fg,
              border: `1px solid ${uiColors.fg}`,
              color: uiColors.bg,
              padding: '0.5rem 1rem',
              cursor: !selectedCollectionId || files.length === 0 || uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              opacity: !selectedCollectionId || files.length === 0 || uploading ? 0.5 : 1
            }}
            onMouseEnter={e => {
              if (!e.target.disabled) {
                e.target.style.background = uiColors.bg;
                e.target.style.color = uiColors.fg;
              }
            }}
            onMouseLeave={e => {
              if (!e.target.disabled) {
                e.target.style.background = uiColors.fg;
                e.target.style.color = uiColors.bg;
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
