import React, { useState, useEffect } from 'react';
import { getSupabase } from '../supabaseClient';

export default function Gallery({ session, onClose }) {
  const [collages, setCollages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
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

  const loadCollages = async () => {
    if (!session?.user?.id) {
      console.warn('No user session available for loading collages');
      setLoading(false);
      return;
    }

    if (hasLoaded) {
      console.log('Collages already loaded, skipping...');
      return;
    }

    console.log('Starting to load collages...');
    setLoading(true);
    
    try {
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const testResult = await supabase.from('saved_collages').select('count', { count: 'exact' });
      console.log('Connection test result:', testResult);
      
      console.log('Loading collages for user:', session.user.id);
      console.log('Session details:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      });
      
      const { data, error } = await supabase
        .from('saved_collages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

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
        setCollages(data || []);
      }
      setHasLoaded(true);
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

  const handleDownload = (collage) => {
    const link = document.createElement('a');
    link.download = `${collage.title}.png`;
    link.href = collage.image_data_url;
    link.click();
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
          <h2>My Collages ({collages.length})</h2>
          <button onClick={onClose} className="gallery-close-btn">×</button>
        </div>
        
        <div className="gallery-content">
          {collages.length === 0 ? (
            <div className="gallery-empty">
              <p>No saved collages yet.</p>
              <p>Create and save some collages to see them here!</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {collages.map((collage) => (
                <div key={collage.id} className="gallery-item">
                  <div className="gallery-thumbnail">
                    <img 
                      src={collage.thumbnail_url || collage.image_data_url} 
                      alt={collage.title}
                      onClick={() => handleDownload(collage)}
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
          )}
        </div>
      </div>
    </div>
  );
}
