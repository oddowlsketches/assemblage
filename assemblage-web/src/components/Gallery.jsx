import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '../supabaseClient';
import { DownloadSimple, Trash, X, Share } from 'phosphor-react';

export default function Gallery({ session, onClose }) {
  const [collages, setCollages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterTemplate, setFilterTemplate] = useState('');
  const itemsPerPage = 12; // Show 12 collages per page
  const supabase = getSupabase();
  const observer = useRef();
  const loadMoreRef = useRef();

  useEffect(() => {
    // Only load once when the component mounts with a valid session
    if (session?.user?.id && !hasLoaded) {
      loadCollages();
    } else if (!session) {
      setLoading(false);
      setCollages([]);
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
      const activeFilterTemplate = customFilters.filterTemplate !== undefined ? customFilters.filterTemplate : filterTemplate;
      const activeSortBy = customFilters.sortBy !== undefined ? customFilters.sortBy : sortBy;
      const activeSortOrder = customFilters.sortOrder !== undefined ? customFilters.sortOrder : sortOrder;
      
      // Simplified query with retry logic
      let query = supabase
        .from('saved_collages')
        .select('id, title, template_key, created_at, thumbnail_url')
        .eq('user_id', session.user.id)
        .order(activeSortBy, { ascending: activeSortOrder === 'asc' });
      
      // Apply filters
      if (activeSearchTerm) {
        query = query.ilike('title', `%${activeSearchTerm}%`);
      }
      
      if (activeFilterTemplate) {
        query = query.eq('template_key', activeFilterTemplate);
      }
      
      const offset = (page - 1) * itemsPerPage;
      query = query.range(offset, offset + itemsPerPage - 1);
      
      const { data, error, count } = await query;
      
      // Get count separately if needed
      if (page === 1 && !count) {
        try {
          const { count: totalItems } = await supabase
            .from('saved_collages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);
          setTotalCount(totalItems || 0);
        } catch (countError) {
          console.warn('Count query failed, using data length:', countError);
          setTotalCount(data?.length || 0);
        }
      }

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Supabase error loading collages:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // If it's a timeout, try a simpler query
        if (error.code === '57014' || error.message.includes('timeout')) {
          console.log('Timeout detected, trying simpler query...');
          try {
            const simpleQuery = await supabase
              .from('saved_collages')
              .select('id, title, template_key, created_at')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(itemsPerPage);
            
            if (simpleQuery.data) {
              setCollages(simpleQuery.data || []);
              setTotalCount(simpleQuery.data?.length || 0);
              console.log('Fallback query succeeded with', simpleQuery.data?.length, 'collages');
              setHasLoaded(true);
              setCurrentPage(page);
              return;
            }
          } catch (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
          }
        }
        
        setCollages([]);
      } else {
        console.log('Successfully loaded collages:', data?.length || 0);
        if (page === 1 || resetData) {
          setCollages(data || []);
        } else {
          setCollages(prev => [...prev, ...(data || [])]);
        }
        
        // Update total count if we got it
        if (page === 1 && count !== undefined) {
          setTotalCount(count);
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

  const handleTemplateFilterChange = (e) => {
    const newValue = e.target.value;
    setFilterTemplate(newValue);
    setCurrentPage(1);
    setHasLoaded(false);
    loadCollages(1, true, { filterTemplate: newValue });
  };

  const handleSortChange = (newSortBy) => {
    let newSortOrder;
    if (newSortBy === sortBy) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newSortOrder);
    } else {
      setSortBy(newSortBy);
      newSortOrder = 'desc';
      setSortOrder('desc');
    }
    setCurrentPage(1);
    setHasLoaded(false);
    loadCollages(1, true, { sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterTemplate('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
    setHasLoaded(false);
    loadCollages(1, true, { searchTerm: '', filterTemplate: '', sortBy: 'created_at', sortOrder: 'desc' });
  };

  // Get unique template names for filter dropdown from all collages
  useEffect(() => {
    const getUniqueTemplates = async () => {
      if (!session?.user?.id) return;
      
      try {
        const { data } = await supabase
          .from('saved_collages')
          .select('template_key')
          .eq('user_id', session.user.id);
        
        if (data) {
          const templates = [...new Set(data.map(c => c.template_key))].filter(Boolean);
          setUniqueTemplates(templates);
        }
      } catch (error) {
        console.error('Error loading template list:', error);
      }
    };
    
    getUniqueTemplates();
  }, [session?.user?.id]);

  const [uniqueTemplates, setUniqueTemplates] = useState([]);
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState('');

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
        {/* Search and Filter Controls */}
        <div className="gallery-filters">
          <div className="gallery-page-title">
            <h2>My Collages ({totalCount})</h2>
          </div>
          <div className="gallery-search">
            <input
              type="text"
              placeholder="Search collages..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="gallery-search-input"
              onKeyPress={(e) => e.key === 'Enter' && handleFilterSubmit()}
            />
            <button onClick={handleFilterSubmit} className="gallery-filter-btn">
              Search
            </button>
          </div>
          
          <div className="gallery-sort-filter">
            <select 
              value={filterTemplate}
              onChange={handleTemplateFilterChange}
              className="gallery-select"
            >
              <option value="">All Templates</option>
              {uniqueTemplates.map(template => (
                <option key={template} value={template}>{template}</option>
              ))}
            </select>
            
            <button 
              onClick={() => handleSortChange('created_at')}
              className={`gallery-sort-btn ${sortBy === 'created_at' ? 'active' : ''}`}
            >
              Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            
            <button 
              onClick={() => handleSortChange('title')}
              className={`gallery-sort-btn ${sortBy === 'title' ? 'active' : ''}`}
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            
            {(searchTerm || filterTemplate || sortBy !== 'created_at' || sortOrder !== 'desc') && (
              <button onClick={clearFilters} className="gallery-clear-btn">
                Clear
              </button>
            )}
          </div>
        </div>

        {collages.length === 0 && !loading ? (
          <div className="gallery-empty">
            <p>No saved collages yet.</p>
            <p>Create and save some collages to see them here!</p>
          </div>
        ) : (
          <>
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
                >
                  <div className="gallery-thumbnail">
                    <img 
                      src={collage.thumbnail_url} 
                      alt={collage.title}
                      loading="lazy"
                      onClick={() => handleDownload(collage)}
                      onError={(e) => {
                        e.target.style.backgroundColor = '#f0f0f0';
                        e.target.alt = 'Thumbnail not available';
                      }}
                    />
                  </div>
                  <div className="gallery-info">
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
                    >
                      <DownloadSimple size={16} weight="regular" />
                    </button>
                    <button 
                      onClick={() => handleShare(collage)}
                      className="gallery-btn gallery-share-btn"
                      title="Share"
                    >
                      <Share size={16} weight="regular" />
                    </button>
                    <button 
                      onClick={() => handleDelete(collage.id)}
                      className="gallery-btn gallery-delete-btn"
                      title="Delete"
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
          </>
        )}
      </div>
    </div>
  );
}
