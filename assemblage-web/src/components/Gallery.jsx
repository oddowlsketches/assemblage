import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '../supabaseClient';
import { DownloadSimple, Trash, X, Share, ArrowLeft, ArrowRight, Check, MagnifyingGlass } from 'phosphor-react';
import { useUiColors } from '../hooks/useUiColors';
import { getContrastText } from '../lib/colorUtils/contrastText';

export default function Gallery({ session, onClose }) {
  const [collages, setCollages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const itemsPerPage = 12; // Show 12 collages per page
  const initialLoadCount = 12; // Load only 12 initially for faster performance
  const supabase = getSupabase();
  const observer = useRef();
  const loadMoreRef = useRef();
  // Force white background colors for gallery
  const uiColors = {
    bg: '#ffffff',
    fg: '#333333',
    border: '#333333',
    complementaryColor: '#333333'
  };

  useEffect(() => {
    // Only load once when the component mounts with a valid session
    if (session?.user?.id && !hasLoaded) {
      loadCollages();
    } else if (!session) {
      setLoading(false);
      setCollages([]);
      setTotalCount(0);
      setHasLoaded(false);
    }
  }, [session?.user?.id]);

  const loadCollages = async (page = 1, resetData = false, customFilters = {}) => {
    if (!session?.user?.id) {
      console.warn('No user session available for loading collages');
      setLoading(false);
      return;
    }

    console.log(`Loading collages page ${page}`);
    setLoading(true);
    
    try {
      // Use custom filters if provided, otherwise use current state
      const activeSearchTerm = customFilters.searchTerm !== undefined ? customFilters.searchTerm : searchTerm;
      const activeSortBy = customFilters.sortBy !== undefined ? customFilters.sortBy : sortBy;
      const activeSortOrder = customFilters.sortOrder !== undefined ? customFilters.sortOrder : sortOrder;
      
      // Get total count first (especially important for page 1 or when filters change)
      if (page === 1 || resetData) {
        let countQuery = supabase
          .from('saved_collages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
          
        // Apply same filters to count query
        if (activeSearchTerm) {
          countQuery = countQuery.ilike('title', `%${activeSearchTerm}%`);
        }
        
        const { count: totalItems, error: countError } = await countQuery;
        
        if (!countError) {
          setTotalCount(totalItems || 0);
          console.log('Total count updated to:', totalItems);
        } else {
          console.warn('Count query failed:', countError);
        }
      }
      
      // Now get the actual data
      let dataQuery = supabase
        .from('saved_collages')
        .select('id, title, template_key, created_at, thumbnail_url')
        .eq('user_id', session.user.id)
        .order(activeSortBy, { ascending: activeSortOrder === 'asc' });
      
      // Apply filters to data query
      if (activeSearchTerm) {
        dataQuery = dataQuery.ilike('title', `%${activeSearchTerm}%`);
      }
      
      const offset = (page - 1) * itemsPerPage;
      dataQuery = dataQuery.range(offset, offset + itemsPerPage - 1);
      
      const { data, error } = await dataQuery;

      console.log('Query result:', { data, error, page, totalItems: totalCount });

      if (error) {
        console.error('Supabase error loading collages:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        setCollages([]);
      } else {
        console.log('Successfully loaded collages:', data?.length || 0);
        if (page === 1 || resetData) {
          setCollages(data || []);
        } else {
          setCollages(prev => [...prev, ...(data || [])]);
        }
      }
      setHasLoaded(true);
      setCurrentPage(page);
    } catch (err) {
      console.error('Network error loading collages:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setCollages([]);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll callback
  const lastCollageElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && collages.length < totalCount) {
        loadCollages(currentPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, collages.length, totalCount, currentPage]);

  // Filter and search handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterSubmit = () => {
    setCurrentPage(1);
    setHasLoaded(false);
    loadCollages(1, true, { searchTerm });
  };

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    setHasLoaded(false);
    loadCollages(1, true, { sortBy, sortOrder: newSortOrder });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
    setHasLoaded(false);
    loadCollages(1, true, { searchTerm: '', sortBy: 'created_at', sortOrder: 'desc' });
  };

  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCollage, setSelectedCollage] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleTitleEdit = (collage) => {
    setEditingTitle(collage.id);
    setNewTitle(collage.title);
  };

  const handleTitleSave = async (collageId) => {
    if (!newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('saved_collages')
        .update({ title: newTitle.trim() })
        .eq('id', collageId);
        
      if (error) {
        console.error('Error updating title:', error);
        alert('Failed to update title');
      } else {
        // Update local state
        setCollages(prev => 
          prev.map(c => 
            c.id === collageId ? { ...c, title: newTitle.trim() } : c
          )
        );
        setEditingTitle(null);
        setNewTitle('');
      }
    } catch (err) {
      console.error('Error updating title:', err);
      alert('Failed to update title');
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setNewTitle('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this collage?')) return;

    try {
      const { error } = await supabase
        .from('saved_collages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting collage:', error);
        alert('Failed to delete collage');
      } else {
        // Update the local state immediately without refetching
        setCollages(prevCollages => prevCollages.filter(c => c.id !== id));
        setTotalCount(prev => prev - 1);
        console.log('Collage deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting collage:', err);
      alert('Failed to delete collage');
    }
  };

  const handleDownload = async (collage) => {
    try {
      // Fetch the full collage data including image_data_url for download
      const { data, error } = await supabase
        .from('saved_collages')
        .select('image_data_url, title')
        .eq('id', collage.id)
        .single();
        
      if (error) {
        console.error('Error fetching collage for download:', error);
        alert('Failed to download collage');
        return;
      }
      
      const link = document.createElement('a');
      link.download = `${data.title}.png`;
      link.href = data.image_data_url;
      link.click();
    } catch (err) {
      console.error('Error downloading collage:', err);
      alert('Failed to download collage');
    }
  };

  const handleShare = async (collage) => {
    try {
      // Fetch the full collage data including image_data_url for sharing
      const { data, error } = await supabase
        .from('saved_collages')
        .select('image_data_url, title')
        .eq('id', collage.id)
        .single();
        
      if (error) {
        console.error('Error fetching collage for sharing:', error);
        alert('Failed to share collage');
        return;
      }

      // Convert data URL to blob
      const response = await fetch(data.image_data_url);
      const blob = await response.blob();
      
      // Try clipboard API first (works on modern browsers)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const clipboardItem = new ClipboardItem({
            [blob.type]: blob
          });
          await navigator.clipboard.write([clipboardItem]);
          alert('Image copied to clipboard! You can now paste it into any app to share.');
          return;
        } catch (clipboardError) {
          console.warn('Clipboard image copy failed:', clipboardError);
        }
      }
      
      // Try Web Share API with files (mobile browsers)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], `${data.title}.png`, { type: 'image/png' });
          const shareData = {
            text: 'Check out this collage I created with Assemblage!',
            files: [file]
          };
          
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        } catch (shareError) {
          console.warn('Web Share API with files failed:', shareError);
        }
      }
      
      // Try Web Share API without files (fallback)
      if (navigator.share) {
        try {
          await navigator.share({
            text: 'Check out this collage I created with Assemblage!'
          });
          // Also download the image
          const link = document.createElement('a');
          link.download = `${data.title}.png`;
          link.href = data.image_data_url;
          link.click();
          return;
        } catch (shareError) {
          console.warn('Web Share API text share failed:', shareError);
        }
      }
      
      // Final fallback: Download image and copy text
      const link = document.createElement('a');
      link.download = `${data.title}.png`;
      link.href = data.image_data_url;
      link.click();
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('Check out this collage I created with Assemblage!');
        alert('Image downloaded and share message copied to clipboard!');
      } else {
        alert('Image downloaded! You can now share it manually.');
      }
      
    } catch (err) {
      console.error('Error sharing collage:', err);
      alert('Failed to share collage');
    }
  };

  if (loading && !hasLoaded && collages.length === 0) {
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
          <div className="gallery-loading">Loading your collages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-fullscreen" style={{ background: 'white' }}>
      <header className="gallery-header" style={{ 
        background: 'white',
        borderBottom: `1px solid #333`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: window.innerWidth <= 768 ? '1rem 1.5rem' : '1.5rem'
      }}>
        <h1 style={{ 
          color: '#333',
          fontSize: window.innerWidth <= 768 ? '1.5rem' : '2rem',
          fontFamily: 'Playfair Display, serif',
          fontStyle: 'italic',
          margin: 0
        }}>Assemblage</h1>
        <button 
          onClick={onClose} 
          style={{ 
            color: '#333',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <X size={20} weight="regular" />
        </button>
      </header>
      
      <div className="gallery-content" style={{ background: 'white' }}>
        {/* Page title */}
        <div className="gallery-page-title" style={{ padding: '2rem 2rem 0 2rem' }}>
          <h2 style={{ color: '#333', fontFamily: 'Space Mono, monospace' }}>My Collages ({totalCount})</h2>
        </div>
        
        {/* Search and Sort - responsive */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem 2rem'
        }}>
          {/* Search - expandable on mobile */}
          <form onSubmit={(e) => { e.preventDefault(); handleFilterSubmit(); }} style={{ 
            flex: 1, 
            display: window.innerWidth > 768 || showMobileSearch ? 'flex' : 'none',
            gap: '0.5rem'
          }}>
            <label htmlFor="gallery-search" style={{ position: 'absolute', left: '-9999px' }}>Search collages</label>
            <input
              type="text"
              id="gallery-search"
              name="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: `1px solid ${uiColors.border}`,
                background: uiColors.bg,
                color: uiColors.fg,
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem'
              }}
              autoFocus={showMobileSearch}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  setHasLoaded(false);
                  loadCollages(1, true, { searchTerm: '' });
                }}
                style={{
                  padding: '0.5rem',
                  background: uiColors.bg,
                  color: uiColors.fg,
                  border: `1px solid ${uiColors.border}`,
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
          
          {/* Mobile search toggle button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            style={{
              padding: '0.5rem',
              background: uiColors.bg,
              color: uiColors.fg,
              border: `1px solid ${uiColors.border}`,
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              display: window.innerWidth <= 768 ? 'flex' : 'none',
              alignItems: 'center'
            }}
          >
            <MagnifyingGlass size={20} weight="regular" />
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Sort button */}
            <button
              onClick={handleSortToggle}
              style={{
                padding: '0.5rem 1rem',
                background: uiColors.bg,
                color: uiColors.fg,
                border: `1px solid ${uiColors.border}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Sort
              <span style={{ fontSize: '0.7rem' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            </button>
          </div>
        </div>

        {collages.length === 0 && !loading ? (
          <div className="gallery-empty">
            <p>No saved collages yet.</p>
            <p>Create and save some collages to see them here!</p>
          </div>
        ) : (
          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            {loading && hasLoaded && (
              <div className="gallery-filter-loading">
                Updating results...
              </div>
            )}
            <div className="gallery-grid">
              {collages.map((collage, index) => (
                <div 
                  key={collage.id} 
                  className="gallery-item"
                  ref={index === collages.length - 1 ? lastCollageElementRef : null}
                  style={{
                    background: uiColors.bg === '#ffffff' ? '#ffffff' : `${uiColors.bg}33`,
                    border: `1px solid ${getContrastText(uiColors.bg)}`,
                    boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`
                  }}
                >
                  <div className="gallery-thumbnail">
                    <img 
                      src={collage.thumbnail_url} 
                      alt={collage.title}
                      loading="lazy"
                      onClick={() => {
                        setSelectedCollage(collage);
                        setShowDetail(true);
                      }}
                      onError={(e) => {
                        e.target.style.backgroundColor = '#f0f0f0';
                        e.target.alt = 'Thumbnail not available';
                      }}
                    />
                  </div>
                  <div className="gallery-info" style={{ color: getContrastText(uiColors.bg) }}>
                    {editingTitle === collage.id ? (
                      <div className="gallery-title-edit">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="gallery-title-input"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleTitleSave(collage.id);
                            if (e.key === 'Escape') handleTitleCancel();
                          }}
                          onBlur={() => handleTitleSave(collage.id)}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h4 onClick={() => handleTitleEdit(collage)} className="gallery-title-editable">
                        {collage.title}
                      </h4>
                    )}
                    <p>Template: {collage.template_key}</p>
                    <p>Created: {new Date(collage.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="gallery-actions">
                    <button 
                      onClick={() => handleDownload(collage)}
                      className="gallery-btn gallery-download-btn"
                      title="Download"
                      style={{
                        background: getContrastText(uiColors.bg),
                        color: uiColors.bg,
                        border: `1px solid ${getContrastText(uiColors.bg)}`
                      }}
                    >
                      <DownloadSimple size={16} weight="regular" />
                    </button>
                    <button 
                      onClick={() => handleShare(collage)}
                      className="gallery-btn gallery-share-btn"
                      title="Share"
                      style={{
                        background: getContrastText(uiColors.bg),
                        color: uiColors.bg,
                        border: `1px solid ${getContrastText(uiColors.bg)}`
                      }}
                    >
                      <Share size={16} weight="regular" />
                    </button>
                    <button 
                      onClick={() => handleDelete(collage.id)}
                      className="gallery-btn gallery-delete-btn"
                      title="Delete"
                      style={{
                        background: 'transparent',
                        color: getContrastText(uiColors.bg),
                        border: `1px solid ${getContrastText(uiColors.bg)}`
                      }}
                    >
                      <Trash size={16} weight="regular" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Loading indicator for infinite scroll */}
            {loading && hasLoaded && (
              <div className="gallery-loading-more">
                Loading more collages...
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Collage Detail Modal */}
      {showDetail && selectedCollage && (
        <CollageDetail 
          collage={selectedCollage}
          onClose={() => {
            setShowDetail(false);
            setSelectedCollage(null);
          }}
          onDownload={() => handleDownload(selectedCollage)}
          onShare={() => handleShare(selectedCollage)}
          onDelete={(id) => {
            handleDelete(id);
            setShowDetail(false);
            setSelectedCollage(null);
          }}
          onNavigate={(direction) => {
            const currentIndex = collages.findIndex(c => c.id === selectedCollage.id);
            let newIndex;
            if (direction === 'next') {
              newIndex = currentIndex < collages.length - 1 ? currentIndex + 1 : 0;
            } else {
              newIndex = currentIndex > 0 ? currentIndex - 1 : collages.length - 1;
            }
            setSelectedCollage(collages[newIndex]);
          }}
        />
      )}
    </div>
  );
}

// Collage Detail Component
function CollageDetail({ collage, onClose, onDownload, onShare, onDelete, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [fullImageUrl, setFullImageUrl] = useState(null);
  const supabase = getSupabase();
  // Force white background colors for gallery detail
  const uiColors = {
    bg: '#ffffff',
    fg: '#333333',
    border: '#333333',
    complementaryColor: '#333333'
  };
  
  useEffect(() => {
    // Fetch the full resolution image
    const fetchFullImage = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_collages')
          .select('image_data_url')
          .eq('id', collage.id)
          .single();
          
        if (error) throw error;
        setFullImageUrl(data.image_data_url);
      } catch (err) {
        console.error('Error loading full image:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFullImage();
  }, [collage.id]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);
  
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
          background: 'rgba(0, 0, 0, 0.9)',
          zIndex: 2000,
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
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2001,
        overflow: 'auto',
        background: uiColors.bg
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: `1px solid ${uiColors.border}`
        }}>
          <h3 style={{ 
            margin: 0, 
            color: uiColors.fg,
            fontFamily: 'Space Mono, monospace',
            fontSize: '1.2rem'
          }}>{collage.title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: uiColors.fg
            }}
          >
            <X size={24} weight="regular" />
          </button>
        </div>
        
        {/* Image area */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: uiColors.bg === '#ffffff' ? '#f9f9f9' : `${uiColors.bg}88`,
          position: 'relative',
          minHeight: 0,
          overflow: 'auto'
        }}>
          {loading ? (
            <div style={{ color: uiColors.fg }}>Loading...</div>
          ) : (
            <img
              src={fullImageUrl || collage.thumbnail_url}
              alt={collage.title}
              style={{
                maxWidth: 'calc(100% - 2rem)',
                maxHeight: 'calc(100% - 2rem)',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                display: 'block'
              }}
            />
          )}
          
          {/* Navigation arrows */}
          <button
            onClick={() => onNavigate('prev')}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              color: 'white',
              padding: '1rem',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={e => e.target.style.background = 'rgba(0, 0, 0, 0.5)'}
          >
            <ArrowLeft size={24} weight="regular" />
          </button>
          
          <button
            onClick={() => onNavigate('next')}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              color: 'white',
              padding: '1rem',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(0, 0, 0, 0.7)'}
            onMouseLeave={e => e.target.style.background = 'rgba(0, 0, 0, 0.5)'}
          >
            <ArrowRight size={24} weight="regular" />
          </button>
        </div>
        
        {/* Metadata and actions - responsive layout */}
        <div style={{
          padding: '1.5rem',
          borderTop: `1px solid ${uiColors.border}`,
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          justifyContent: window.innerWidth <= 768 ? 'flex-start' : 'space-between',
          alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
          gap: window.innerWidth <= 768 ? '1rem' : '0'
        }}>
          {/* Actions - shown first on mobile */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            order: window.innerWidth <= 768 ? -1 : 0,
            justifyContent: window.innerWidth <= 768 ? 'space-between' : 'flex-start',
            width: window.innerWidth <= 768 ? '100%' : 'auto'
          }}>
            <button
              onClick={onDownload}
              style={{
                padding: '0.5rem 1rem',
                background: uiColors.fg,
                color: uiColors.bg,
                border: `1px solid ${uiColors.fg}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: window.innerWidth <= 768 ? 1 : 'unset',
                justifyContent: 'center'
              }}
            >
              <DownloadSimple size={16} weight="regular" />
              Download
            </button>
            
            <button
              onClick={onShare}
              style={{
                padding: '0.5rem 1rem',
                background: uiColors.bg,
                color: uiColors.fg,
                border: `1px solid ${uiColors.fg}`,
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: window.innerWidth <= 768 ? 1 : 'unset',
                justifyContent: 'center'
              }}
            >
              <Share size={16} weight="regular" />
              Share
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this collage?')) {
                  onDelete(collage.id);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                background: uiColors.bg,
                color: '#dc3545',
                border: '1px solid #dc3545',
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: window.innerWidth <= 768 ? 1 : 'unset',
                justifyContent: 'center'
              }}
            >
              <Trash size={16} weight="regular" />
              Delete
            </button>
          </div>
          
          {/* Metadata */}
          <div style={{ color: uiColors.fg }}>
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
              Template: <strong>{collage.template_key}</strong>
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
              Created: {new Date(collage.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
