import React, { useState } from 'react';
import { X, Tag, FileText, Calendar, CaretLeft, CaretRight } from 'phosphor-react';
import { getSupabase } from '../supabaseClient';

export const ImageModal = ({ image, isOpen, onClose, onUpdate, images = [], onNavigate }) => {
  // Force white background and black text for image modal
  const uiColors = {
    bg: '#ffffff',
    fg: '#333333',
    border: '#cccccc',
    complementaryColor: '#333333'
  };
  const [isEditing, setIsEditing] = useState(false);
  // Handle both cases: metadata in separate columns or in metadata JSONB column
  const getInitialMetadata = () => {
    if (image?.metadata && typeof image.metadata === 'object') {
      // Metadata is in JSONB column
      return {
        tags: image.metadata.tags?.join(', ') || '',
        caption: image.metadata.caption || '',
        description: image.metadata.description || ''
      };
    } else {
      // Metadata is in separate columns
      return {
        tags: image?.tags?.join(', ') || '',
        caption: image?.caption || image?.title || '',
        description: image?.description || ''
      };
    }
  };
  
  const [editedMetadata, setEditedMetadata] = useState(getInitialMetadata());
  const [saving, setSaving] = useState(false);

  if (!isOpen || !image) return null;
  
  // Find current image index if images array is provided
  const currentIndex = images.findIndex(img => img.id === image.id);
  const hasPrevious = images.length > 0 && currentIndex > 0;
  const hasNext = images.length > 0 && currentIndex < images.length - 1;
  
  const handleNavigate = (direction) => {
    if (!onNavigate) return;
    
    if (direction === 'prev' && hasPrevious) {
      onNavigate(images[currentIndex - 1]);
    } else if (direction === 'next' && hasNext) {
      onNavigate(images[currentIndex + 1]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = getSupabase();
      const tags = editedMetadata.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const caption = editedMetadata.caption.trim();
      const description = editedMetadata.description.trim();
      
      // Update both separate columns and metadata JSONB
      const updatedMetadata = {
        ...(image.metadata || {}),
        tags,
        caption,
        description
      };

      const { error } = await supabase
        .from('images')
        .update({ 
          metadata: updatedMetadata,
          tags,
          description,
          // caption might not exist as a separate column
          ...(image.hasOwnProperty('caption') ? { caption } : {})
        })
        .eq('id', image.id);

      if (error) throw error;

      onUpdate({ 
        ...image, 
        metadata: updatedMetadata,
        tags,
        description,
        caption 
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating metadata:', err);
      alert('Failed to update metadata');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedMetadata(getInitialMetadata());
    setIsEditing(false);
  };

  return (
    <>
      {/* Modal backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          cursor: 'pointer'
        }}
      />
      
      {/* Modal content */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
        fontFamily: 'Space Mono, monospace',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #cccccc'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1,
            minWidth: 0
          }}>
            {/* Navigation buttons */}
            {images.length > 0 && (
              <>
                <button
                  onClick={() => handleNavigate('prev')}
                  disabled={!hasPrevious}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: hasPrevious ? 'pointer' : 'not-allowed',
                    padding: '0.5rem',
                    opacity: hasPrevious ? 1 : 0.3
                  }}
                  title="Previous image"
                >
                  <CaretLeft size={20} weight="bold" color="#333333" />
                </button>
                <button
                  onClick={() => handleNavigate('next')}
                  disabled={!hasNext}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: hasNext ? 'pointer' : 'not-allowed',
                    padding: '0.5rem',
                    opacity: hasNext ? 1 : 0.3
                  }}
                  title="Next image"
                >
                  <CaretRight size={20} weight="bold" color="#333333" />
                </button>
              </>
            )}
            <h3 style={{ 
              margin: 0, 
              color: '#333333',
              fontSize: window.innerWidth <= 768 ? '1rem' : '1.2rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>{image.filename}</h3>
          </div>
          <button
            onClick={onClose}
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

        {/* Content - single scrollable container on mobile */}
        <div style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflowY: window.innerWidth <= 768 ? 'auto' : 'hidden',
          overflowX: 'hidden',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
        }}>
          {/* Image preview */}
          <div style={{
            flex: window.innerWidth <= 768 ? '0 0 auto' : '1 1 60%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: window.innerWidth <= 768 ? '1rem' : '2rem',
            background: '#f9f9f9',
            minHeight: window.innerWidth <= 768 ? '300px' : '400px'
          }}>
            <img
              src={image.src || image.public_url || image.thumb_src}
              alt={image.filename || image.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                console.error('Modal image failed to load:', image);
                e.target.src = image.thumb_src || '/placeholder.png';
              }}
            />
          </div>

          {/* Metadata panel */}
          <div style={{
            flex: window.innerWidth <= 768 ? '0 0 auto' : '0 0 40%',
            padding: window.innerWidth <= 768 ? '1rem' : '2rem',
            borderLeft: window.innerWidth <= 768 ? 'none' : '1px solid #cccccc',
            borderTop: window.innerWidth <= 768 ? '1px solid #cccccc' : 'none',
            overflowY: window.innerWidth <= 768 ? 'visible' : 'auto',
            minWidth: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ margin: 0, color: uiColors.fg }}>Metadata</h4>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: '#333333',
                    color: '#ffffff',
                    border: '1px solid #333333',
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.8rem'
                  }}
                >
                  Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: '#333333',
                      color: '#ffffff',
                      border: '1px solid #333333',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.8rem',
                      opacity: saving ? 0.5 : 1
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'transparent',
                      color: '#333333',
                      border: '1px solid #cccccc',
                      cursor: 'pointer',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.8rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: '#333333',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                <Tag size={16} weight="regular" />
                Tags
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedMetadata.tags}
                  onChange={(e) => setEditedMetadata(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Enter tags separated by commas"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #cccccc',
                    background: '#ffffff',
                    color: '#333333',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.85rem'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {(() => {
                    const tags = image.metadata?.tags || image.tags || [];
                    return tags.length > 0 ? (
                      tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(51, 51, 51, 0.1)',
                            color: '#333333',
                            fontSize: '0.8rem',
                            borderRadius: '2px'
                          }}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#333333', opacity: 0.5, fontSize: '0.85rem' }}>
                        No tags
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Caption */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: uiColors.fg,
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                <FileText size={16} weight="regular" />
                Caption
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedMetadata.caption}
                  onChange={(e) => setEditedMetadata(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Enter a caption"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #cccccc',
                    background: '#ffffff',
                    color: '#333333',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.85rem'
                  }}
                />
              ) : (
                <p style={{
                  margin: 0,
                  color: '#333333',
                  fontSize: '0.85rem',
                  opacity: (image.metadata?.caption || image.caption || image.title) ? 1 : 0.5
                }}>
                  {image.metadata?.caption || image.caption || image.title || 'No caption'}
                </p>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: uiColors.fg,
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                <FileText size={16} weight="regular" />
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editedMetadata.description}
                  onChange={(e) => setEditedMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter a description"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #cccccc',
                    background: '#ffffff',
                    color: '#333333',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <p style={{
                  margin: 0,
                  color: '#333333',
                  fontSize: '0.85rem',
                  opacity: (image.metadata?.description || image.description) ? 1 : 0.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {image.metadata?.description || image.description || 'No description'}
                </p>
              )}
            </div>

            {/* File info */}
            <div style={{
              borderTop: '1px solid #cccccc',
              paddingTop: '1rem',
              fontSize: '0.8rem',
              color: '#333333',
              opacity: 0.7
            }}>
              <p style={{ margin: '0.25rem 0' }}>
                <Calendar size={14} weight="regular" style={{ marginRight: '0.5rem' }} />
                Created: {new Date(image.created_at).toLocaleString()}
              </p>
              {image.file_size && (
                <p style={{ margin: '0.25rem 0' }}>
                  Size: {(image.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
