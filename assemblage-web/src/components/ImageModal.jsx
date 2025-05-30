import React, { useState } from 'react';
import { X, Tag, FileText, Calendar } from 'phosphor-react';
import { useUiColors } from '../hooks/useUiColors';
import { getSupabase } from '../supabaseClient';

export const ImageModal = ({ image, isOpen, onClose, onUpdate }) => {
  const uiColors = useUiColors();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState({
    tags: image?.metadata?.tags?.join(', ') || '',
    caption: image?.metadata?.caption || '',
    description: image?.metadata?.description || ''
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen || !image) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = getSupabase();
      const updatedMetadata = {
        ...image.metadata,
        tags: editedMetadata.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        caption: editedMetadata.caption.trim(),
        description: editedMetadata.description.trim()
      };

      const { error } = await supabase
        .from('images')
        .update({ metadata: updatedMetadata })
        .eq('id', image.id);

      if (error) throw error;

      onUpdate({ ...image, metadata: updatedMetadata });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating metadata:', err);
      alert('Failed to update metadata');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedMetadata({
      tags: image?.metadata?.tags?.join(', ') || '',
      caption: image?.metadata?.caption || '',
      description: image?.metadata?.description || ''
    });
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
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: uiColors.bg,
        border: `1px solid ${uiColors.border}`,
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
        fontFamily: 'Space Mono, monospace'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: `1px solid ${uiColors.border}`
        }}>
          <h3 style={{ margin: 0, color: uiColors.fg }}>{image.filename}</h3>
          <button
            onClick={onClose}
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

        {/* Content */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Image preview */}
          <div style={{
            flex: '1 1 60%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: uiColors.bg === '#ffffff' ? '#f9f9f9' : `${uiColors.bg}88`
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
            flex: '1 1 40%',
            padding: '2rem',
            borderLeft: `1px solid ${uiColors.border}`,
            overflowY: 'auto'
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
                    background: uiColors.fg,
                    color: uiColors.bg,
                    border: `1px solid ${uiColors.fg}`,
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
                      background: uiColors.fg,
                      color: uiColors.bg,
                      border: `1px solid ${uiColors.fg}`,
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
                      color: uiColors.fg,
                      border: `1px solid ${uiColors.border}`,
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
                color: uiColors.fg,
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
                    border: `1px solid ${uiColors.border}`,
                    background: uiColors.bg,
                    color: uiColors.fg,
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.85rem'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {image.metadata?.tags?.length > 0 ? (
                    image.metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: `${uiColors.fg}20`,
                          color: uiColors.fg,
                          fontSize: '0.8rem',
                          borderRadius: '2px'
                        }}
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: uiColors.fg, opacity: 0.5, fontSize: '0.85rem' }}>
                      No tags
                    </span>
                  )}
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
                    border: `1px solid ${uiColors.border}`,
                    background: uiColors.bg,
                    color: uiColors.fg,
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.85rem'
                  }}
                />
              ) : (
                <p style={{
                  margin: 0,
                  color: uiColors.fg,
                  fontSize: '0.85rem',
                  opacity: image.metadata?.caption ? 1 : 0.5
                }}>
                  {image.metadata?.caption || 'No caption'}
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
                    border: `1px solid ${uiColors.border}`,
                    background: uiColors.bg,
                    color: uiColors.fg,
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <p style={{
                  margin: 0,
                  color: uiColors.fg,
                  fontSize: '0.85rem',
                  opacity: image.metadata?.description ? 1 : 0.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {image.metadata?.description || 'No description'}
                </p>
              )}
            </div>

            {/* File info */}
            <div style={{
              borderTop: `1px solid ${uiColors.border}`,
              paddingTop: '1rem',
              fontSize: '0.8rem',
              color: uiColors.fg,
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
