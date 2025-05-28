import React, { useState, useEffect } from 'react';
import { getSupabase } from '../supabaseClient';

export default function Gallery({ session, onClose }) {
  const [collages, setCollages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12; // Show 12 collages per page
  const supabase = getSupabase();

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

  const loadCollages = async (page = 1) => {
    if (!session?.user?.id) {
      console.warn('No user session available for loading collages');
      setLoading(false);
      return;
    }

    console.log(`Loading collages page ${page}`);
    setLoading(true);
    
    try {
      // Get total count first (only on first load)
      if (page === 1 && !hasLoaded) {
        const { count } = await supabase
          .from('saved_collages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
        setTotalCount(count || 0);
      }
      
      const offset = (page - 1) * itemsPerPage;
      
      const { data, error } = await supabase
        .from('saved_collages')
        .select('id, title, template_key, created_at, thumbnail_url')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      console.log('Query result:', { data, error });

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
        if (page === 1) {
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

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="gallery-modal">
          <div className="gallery-header">
            <h2>My Collages</h2>
            <button onClick={onClose} className="gallery-close-btn">×</button>
          </div>
          <div className="gallery-loading">Loading your collages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container" onClick={onClose}>
      <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-header">
          <h2>My Collages ({totalCount})</h2>
          <button onClick={onClose} className="gallery-close-btn">×</button>
        </div>
        
        <div className="gallery-content">
          {collages.length === 0 ? (
            <div className="gallery-empty">
              <p>No saved collages yet.</p>
              <p>Create and save some collages to see them here!</p>
            </div>
          ) : (
            <>
              <div className="gallery-grid">
                {collages.map((collage) => (
                  <div key={collage.id} className="gallery-item">
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
                      <h4>{collage.title}</h4>
                      <p>Template: {collage.template_key}</p>
                      <p>Created: {new Date(collage.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="gallery-actions">
                      <button 
                        onClick={() => handleDownload(collage)}
                        className="gallery-btn gallery-download-btn"
                      >
                        Download
                      </button>
                      <button 
                        onClick={() => handleDelete(collage.id)}
                        className="gallery-btn gallery-delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {collages.length < totalCount && (
                <div className="gallery-pagination">
                  <button 
                    onClick={() => loadCollages(currentPage + 1)}
                    className="gallery-btn gallery-load-more-btn"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : `Load More (${totalCount - collages.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
