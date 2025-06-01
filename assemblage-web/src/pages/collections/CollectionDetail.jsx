import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupabase } from '../../supabaseClient';
import { ArrowLeft, MagnifyingGlass, SortAscending, SortDescending, Trash, Plus, X, DotsThreeVertical, Check, SquaresFour, Rows, UploadSimple } from 'phosphor-react';
import { useImageMultiSelect } from '../../hooks/useImageMultiSelect';
import { useUiColors } from '../../hooks/useUiColors';
import { ImageModal } from '../../components/ImageModal';
import { UploadModal } from '../../components/UploadModal';
import { getContrastText } from '../../lib/colorUtils/contrastText';

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = getSupabase();
  // Force white background colors for collection detail page
  const uiColors = {
    bg: '#ffffff',
    fg: '#333333',
    border: '#333333',
    complementaryColor: '#333333'
  };
  
  const [collection, setCollection] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [view, setView] = useState('list'); // grid or list for images display
  const [isEditing, setIsEditing] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [error, setError] = useState(null);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [targetCollections, setTargetCollections] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const {
    selectedIds,
    selectedItems,
    isAllSelected,
    isSomeSelected,
    toggleItem,
    toggleAll,
    selectRange,
    deselectAll,
    deleteSelected,
    moveSelected,
    handleKeyDown
  } = useImageMultiSelect(images, {
    onError: (error) => {
      console.error('Bulk operation error:', error);
      alert('Some operations failed. Please try again.');
    }
  });

  // Load collection details and images
  useEffect(() => {
    loadCollectionData();
  }, [id]);
  
  // Check for pending metadata periodically
  useEffect(() => {
    const checkPendingMetadata = async () => {
      const pendingImages = images.filter(img => 
        img.metadata_status === 'pending' || 
        img.metadata_status === 'pending_llm'
      );
      
      if (pendingImages.length > 0) {
        // Check if any have been processed
        const { data: updatedImages } = await supabase
          .from('images')
          .select('id, metadata_status, tags, description, metadata')
          .in('id', pendingImages.map(img => img.id));
        
        if (updatedImages) {
          const processedImages = updatedImages.filter(img => 
            img.metadata_status === 'complete'
          );
          
          if (processedImages.length > 0) {
            // Update the images with new metadata
            setImages(prev => prev.map(img => {
              const updated = processedImages.find(u => u.id === img.id);
              return updated ? { ...img, ...updated } : img;
            }));
          }
        }
      }
    };
    
    // Check every 5 seconds if there are pending images
    const hasPending = images.some(img => 
      img.metadata_status === 'pending' || 
      img.metadata_status === 'pending_llm'
    );
    
    if (hasPending) {
      const interval = setInterval(checkPendingMetadata, 5000);
      return () => clearInterval(interval);
    }
  }, [images, supabase]);
  
  // Add keyboard event listener separately
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const loadCollectionData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      // Load collection details
      const { data: collectionData, error: collectionError } = await supabase
        .from('user_collections')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (collectionError) throw collectionError;
      
      setCollection(collectionData);
      setCollectionName(collectionData.name);
      setCollectionDescription(collectionData.description || '');

      // Load images
      await loadImages();
      
      // Load other user collections for move operations
      const { data: collections } = await supabase
        .from('user_collections')
        .select('id, name')
        .eq('user_id', user.id)
        .neq('id', id)
        .order('name');
        
      setTargetCollections(collections || []);
    } catch (err) {
      console.error('Error loading collection:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('images')
        .select('*')
        .eq('user_collection_id', id)
        .eq('user_id', user.id)
        .eq('provider', 'upload');

      // Apply search filter - search across all available metadata
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        query = query.or(
          `title.ilike.%${searchTerm}%,` +
          `filename.ilike.%${searchTerm}%,` +
          `description.ilike.%${searchTerm}%,` +
          `tags.cs.{${searchTerm}}`
        );
      }

      // Apply sorting
      const sortField = sortBy === 'filename' ? 'title' : sortBy;
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      
      // Map images to ensure they have the correct fields
      const mappedImages = (data || []).map(img => {
        // Extract filename from title or src URL if not provided
        let filename = img.filename || img.title;
        if (!filename && img.src) {
          const urlParts = img.src.split('/');
          filename = urlParts[urlParts.length - 1];
        }
        
        return {
          ...img,
          filename: filename || 'Untitled',
          // Keep all URL fields as they are
          src: img.src,
          thumb_src: img.thumb_src,
          public_url: img.public_url
        };
      });
      
      setImages(mappedImages);
    } catch (err) {
      console.error('Error loading images:', err);
      setError(err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadImages();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    loadImages();
  };

  const handleUpdateCollection = async () => {
    try {
      const { error } = await supabase
        .from('user_collections')
        .update({
          name: collectionName.trim(),
          description: collectionDescription.trim()
        })
        .eq('id', id);

      if (error) throw error;
      
      setCollection(prev => ({
        ...prev,
        name: collectionName.trim(),
        description: collectionDescription.trim()
      }));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating collection:', err);
      alert('Failed to update collection');
    }
  };

  const handleDeleteCollection = async () => {
    if (!window.confirm('Are you sure you want to delete this collection? All images will be permanently deleted.')) {
      return;
    }

    try {
      // Delete all images first
      const { error: imagesError } = await supabase
        .from('images')
        .delete()
        .eq('user_collection_id', id);

      if (imagesError) throw imagesError;

      // Delete the collection
      const { error: collectionError } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', id);

      if (collectionError) throw collectionError;

      navigate('/');
    } catch (err) {
      console.error('Error deleting collection:', err);
      alert('Failed to delete collection');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} images?`)) return;
    
    const results = await deleteSelected('images');
    
    if (results.success.length > 0) {
      setImages(prev => prev.filter(img => !results.success.includes(img.id)));
      setBulkActionMode(false);
    }
  };

  const handleBulkMove = async (targetCollectionId) => {
    const results = await moveSelected('images', targetCollectionId);
    
    if (results.success.length > 0) {
      setImages(prev => prev.filter(img => !results.success.includes(img.id)));
      setBulkActionMode(false);
    }
  };

  const handleImageClick = (image, index, event) => {
    if (bulkActionMode) {
      if (event.shiftKey && selectedIds.size > 0) {
        selectRange(image.id);
      } else {
        toggleItem(image.id);
      }
    } else {
      setSelectedImage(image);
      setShowImageModal(true);
    }
  };

  const handleImageUpdate = (updatedImage) => {
    setImages(prev => prev.map(img => 
      img.id === updatedImage.id ? updatedImage : img
    ));
    setSelectedImage(updatedImage);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Space Mono, monospace',
        background: uiColors.bg
      }}>
        Loading collection...
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Space Mono, monospace',
        background: uiColors.bg
      }}>
        <p style={{ color: getContrastText(uiColors.bg) }}>{error || 'Collection not found'}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: getContrastText(uiColors.bg),
            color: uiColors.bg,
            border: `1px solid ${getContrastText(uiColors.bg)}`,
            cursor: 'pointer',
            fontFamily: 'Space Mono, monospace'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: uiColors.bg,
      color: getContrastText(uiColors.bg),
      fontFamily: 'Space Mono, monospace',
      position: 'relative',
      overflow: 'auto',
      height: '100vh',
      overflowY: 'scroll',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* Header - matches gallery/drawer style */}
      <header style={{
        padding: '1.5rem',
        borderBottom: `1px solid ${getContrastText(uiColors.bg)}`,
        background: uiColors.bg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{ 
          color: getContrastText(uiColors.bg),
          fontSize: '2rem',
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          margin: 0
        }}>Assemblage</h1>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            color: getContrastText(uiColors.bg),
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <X size={24} weight="regular" />
        </button>
      </header>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Page title and controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => {
                // Navigate back to main app and open collections drawer
                navigate('/');
                // Use a flag in localStorage to signal opening the drawer
                localStorage.setItem('openCollectionsDrawer', 'true');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: getContrastText(uiColors.bg),
                padding: '0.5rem',
                marginLeft: '-0.5rem'
              }}
            >
              <ArrowLeft size={20} weight="regular" />
            </button>
            
            {isEditing ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: `1px solid ${uiColors.border}`,
                    background: uiColors.bg,
                    color: uiColors.fg,
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '1.5rem'
                  }}
                  autoFocus
                />
                <button
                  onClick={handleUpdateCollection}
                  style={{
                    padding: '0.5rem 1rem',
                    background: uiColors.fg,
                    color: uiColors.bg,
                    border: `1px solid ${uiColors.border}`,
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setCollectionName(collection.name);
                    setCollectionDescription(collection.description || '');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: uiColors.bg,
                    color: uiColors.fg,
                    border: `1px solid ${uiColors.border}`,
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1 style={{
                fontSize: '1.5rem',
                margin: 0,
                cursor: 'pointer'
              }}
              onClick={() => setIsEditing(true)}
              >
                {collection.name}
              </h1>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Upload button */}
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: '0.5rem 1rem',
                background: uiColors.bg,
                color: uiColors.fg,
                border: `1px solid ${uiColors.border}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Upload images"
            >
              <UploadSimple size={20} weight="regular" />
              <span className="desktop-only">Upload</span>
            </button>
            
            {bulkActionMode && selectedIds.size > 0 && (
              <>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkMove(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  style={{
                    padding: '0.5rem',
                    border: `1px solid ${uiColors.border}`,
                    background: uiColors.bg,
                    color: uiColors.fg,
                    fontFamily: 'Space Mono, monospace',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Move to...</option>
                  {targetCollections.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    padding: '0.5rem',
                    background: '#dc3545',
                    color: 'white',
                    border: '1px solid #dc3545',
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Trash size={16} weight="regular" />
                  <span>({selectedIds.size})</span>
                </button>
              </>
            )}
            
            <button
              onClick={() => {
                setBulkActionMode(!bulkActionMode);
                deselectAll();
              }}
              style={{
                padding: '0.5rem 1rem',
                background: bulkActionMode ? uiColors.fg : uiColors.bg,
                color: bulkActionMode ? uiColors.bg : uiColors.fg,
                border: `1px solid ${uiColors.border}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace'
              }}
            >
              {bulkActionMode ? 'Cancel' : 'Select'}
            </button>
            
            <button
              onClick={handleDeleteCollection}
              style={{
                padding: '0.5rem',
                background: uiColors.bg,
                color: '#dc3545',
                border: '1px solid #dc3545',
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace'
              }}
              title="Delete collection"
            >
              <Trash size={20} weight="regular" />
            </button>
          </div>
        </div>

        {/* Search, Filter, Sort - single line */}
        {!bulkActionMode && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <form onSubmit={handleSearch} style={{ 
              flex: 1, 
              display: window.innerWidth > 768 || showMobileSearch ? 'flex' : 'none', 
              gap: '0.5rem' 
            }}>
              <label htmlFor="collection-search" style={{ position: 'absolute', left: '-9999px' }}>Search images</label>
              <input
                type="text"
                id="collection-search"
                name="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: `1px solid ${getContrastText(uiColors.bg)}`,
                  background: uiColors.bg,
                  color: getContrastText(uiColors.bg),
                  fontFamily: 'Space Mono, monospace'
                }}
                autoFocus={showMobileSearch}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={async () => {
                    setSearchTerm('');
                    await loadImages();
                  }}
                  style={{
                    padding: '0.5rem',
                    background: uiColors.bg,
                    color: getContrastText(uiColors.bg),
                    border: `1px solid ${getContrastText(uiColors.bg)}`,
                    cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={16} weight="regular" />
                </button>
              )}
            </form>
            
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              style={{
                padding: '0.5rem',
                background: uiColors.bg,
                color: getContrastText(uiColors.bg),
                border: `1px solid ${getContrastText(uiColors.bg)}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                display: window.innerWidth <= 768 ? 'flex' : 'none'
              }}
            >
              <MagnifyingGlass size={20} weight="regular" />
            </button>
            
            <button
              onClick={() => handleSort(sortBy === 'created_at' ? 'display_name' : 'created_at')}
              style={{
                padding: '0.5rem 1rem',
                background: uiColors.bg,
                color: getContrastText(uiColors.bg),
                border: `1px solid ${getContrastText(uiColors.bg)}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Sort
              {sortOrder === 'asc' ? <SortAscending size={16} /> : <SortDescending size={16} />}
            </button>
            
            {/* View toggle for mobile */}
            <button
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              style={{
                padding: '0.5rem',
                background: uiColors.bg,
                color: getContrastText(uiColors.bg),
                border: `1px solid ${getContrastText(uiColors.bg)}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                display: window.innerWidth <= 768 ? 'flex' : 'none'
              }}
              title={`Switch to ${view === 'grid' ? 'list' : 'grid'} view`}
            >
              {view === 'grid' ? <Rows size={20} weight="regular" /> : <SquaresFour size={20} weight="regular" />}
            </button>
          </div>
        )}
        {bulkActionMode && (
          <div style={{
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleAll}
                style={{ cursor: 'pointer' }}
              />
              Select all ({images.length})
            </label>
            {selectedIds.size > 0 && (
              <span style={{ color: uiColors.fg, opacity: 0.7 }}>
                {selectedIds.size} selected
              </span>
            )}
          </div>
        )}
        
        {images.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            color: uiColors.fg,
            opacity: 0.7
          }}>
            <p>No images in this collection yet.</p>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: uiColors.fg,
                color: uiColors.bg,
                border: `1px solid ${uiColors.fg}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <UploadSimple size={16} weight="regular" />
              Upload Images
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: view === 'grid' && window.innerWidth <= 768 
              ? 'repeat(3, 1fr)' 
              : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: view === 'grid' && window.innerWidth <= 768 ? '0.5rem' : '1rem'
          }}>
            {images.map((image, index) => (
              <div
                key={image.id}
                onClick={(e) => handleImageClick(image, index, e)}
                style={{
                  position: 'relative',
                  border: `2px solid ${selectedIds.has(image.id) ? uiColors.fg : uiColors.border}`,
                  background: uiColors.bg,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {bulkActionMode && selectedIds.has(image.id) && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    width: '24px',
                    height: '24px',
                    background: uiColors.fg,
                    color: uiColors.bg,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}>
                    <Check size={16} weight="bold" />
                  </div>
                )}
                
                <img
                  src={image.src || image.public_url || image.thumb_src}
                  alt={image.filename || image.title}
                  style={{
                    width: '100%',
                    height: view === 'grid' && window.innerWidth <= 768 ? '100px' : '200px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', image);
                    e.target.src = image.thumb_src || '/placeholder.png';
                  }}
                />
                
                {(view === 'list' || window.innerWidth > 768) && (
                  <div style={{
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    borderTop: `1px solid ${uiColors.border}`,
                    background: uiColors.bg
                  }}>
                    <p style={{
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: uiColors.fg
                    }}>
                      {image.filename}
                    </p>
                    {/* Show metadata status or tags */}
                    {image.metadata_status === 'pending' || image.metadata_status === 'pending_llm' || image.metadata_status === 'processing' ? (
                      <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.7rem',
                        color: uiColors.fg,
                        opacity: 0.6,
                        fontStyle: 'italic'
                      }}>
                        Analyzing...
                      </div>
                    ) : image.metadata_status === 'error' ? (
                      <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.7rem',
                        color: '#dc3545',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Retry metadata generation
                        try {
                          const response = await fetch('/.netlify/functions/process-user-image-metadata', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageId: image.id })
                          });
                          if (response.ok) {
                            // Update image status to processing
                            setImages(prev => prev.map(img => 
                              img.id === image.id 
                                ? { ...img, metadata_status: 'processing' }
                                : img
                            ));
                          }
                        } catch (err) {
                          console.error('Failed to retry metadata generation:', err);
                        }
                      }}
                      >
                        Analysis failed - Click to retry
                      </div>
                    ) : image.tags && image.tags.length > 0 ? (
                      <div style={{
                        marginTop: '0.25rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.25rem'
                      }}>
                        {image.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.3rem',
                              background: `${uiColors.fg}20`,
                              color: uiColors.fg,
                              borderRadius: '2px'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
                
                {!bulkActionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(220, 53, 69, 0.9)',
                      color: 'white',
                      border: 'none',
                      width: '28px',
                      height: '28px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={e => e.target.style.opacity = 1}
                    onMouseLeave={e => e.target.style.opacity = 0}
                  >
                    <Trash size={16} weight="regular" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        images={images}
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
        }}
        onUpdate={handleImageUpdate}
        onNavigate={(newImage) => {
          setSelectedImage(newImage);
        }}
      />
      
      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        collectionId={id}
        onUploadComplete={async (results) => {
          setShowUploadModal(false);
          if (results && results.length > 0) {
            // Reload images after upload
            await loadImages();
          }
        }}
      />
    </div>
  );
}
