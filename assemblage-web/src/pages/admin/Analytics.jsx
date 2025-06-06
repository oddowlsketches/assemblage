import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateStats } from '../../hooks/useTemplateStats';
import { getSupabase } from '../../supabaseClient';
import '../../styles/pages/analytics.css';

export default function Analytics() {
  const navigate = useNavigate();
  const { stats, loading, error, refetch } = useTemplateStats();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Override the global overflow hidden styles when this component mounts
  useEffect(() => {
    // Add class to body to enable scrolling
    document.body.classList.add('analytics-page');
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('analytics-page');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  // Check if user is admin
  useEffect(() => {
    async function checkAdminAccess() {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }
      
      // Check admin status
      const adminEmails = ['ecschwar@gmail.com'];
      const userIsAdmin = session?.user?.email && adminEmails.includes(session.user.email);
      
      if (!userIsAdmin) {
        navigate('/');
      } else {
        setIsAdmin(true);
      }
      
      setAuthLoading(false);
    }
    
    checkAdminAccess();
  }, [navigate]);

  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Space Mono, monospace',
        color: '#000'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  // Find max saves for scaling
  const maxSaves = Math.max(...stats.map(s => s.save_count), 1);

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'Space Mono, monospace',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              color: '#000',
              border: '1px solid #333',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to App
          </button>
          
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#000' }}>Template Analytics</h1>
          <p style={{ color: '#000', margin: 0 }}>Template usage over the last 30 days</p>
        </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#000' }}>
          Loading template stats...
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          color: '#000',
          marginBottom: '2rem'
        }}>
          Error loading stats: {error.message}
        </div>
      )}

      {!loading && !error && stats.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          color: '#000'
        }}>
          <p style={{ margin: 0, color: '#000' }}>No collages saved in the last 30 days</p>
        </div>
      )}

      {!loading && !error && stats.length > 0 && (
        <>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#000' }}>Template Usage Chart</h3>
            
            {/* Simple CSS Bar Chart */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
              height: '300px',
              borderBottom: '2px solid #333',
              paddingBottom: '1rem',
              overflowX: 'auto',
              width: '100%',
              marginBottom: '80px', // Add more space for rotated labels
              paddingLeft: '20px' // Add padding to prevent label cutoff
            }}>
              {stats.slice(0, 15).map((stat, index) => {
                const height = (stat.save_count / maxSaves) * 250;
                return (
                  <div 
                  key={stat.template_key}
                  style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '80px',
                  margin: '0 0.5rem',
                    position: 'relative'
                    }}
                    >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '250px',
                      width: '100%'
                    }}>
                      <span style={{
                        marginBottom: '0.5rem',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        color: '#000'
                      }}>
                        {stat.save_count}
                      </span>
                      <div 
                        style={{
                          backgroundColor: '#333',
                          width: '60px',
                          height: `${height}px`,
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#555';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#333';
                        }}
                        title={`${stat.template_key}: ${stat.save_count} saves`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-axis labels */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              position: 'relative',
              height: '50px',
              overflowX: 'visible',
              marginLeft: '0.5rem'
            }}>
              {stats.slice(0, 15).map((stat, index) => (
                <div 
                  key={stat.template_key}
                  style={{
                    position: 'absolute',
                    left: `${index * 80 + 30}px`,
                    top: '5px',
                    fontSize: '0.8rem',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'left top',
                    whiteSpace: 'nowrap',
                    color: '#000',
                    paddingLeft: '5px',
                    fontWeight: '500'
                  }}
                >
                  {stat.template_key}
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: '2rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#000' }}>Detailed Stats</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontFamily: 'Space Mono, monospace',
                minWidth: '500px'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#000' }}>Template</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#000' }}>Saves</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#000' }}>Last Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, idx) => (
                    <tr key={stat.template_key} style={{ 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: idx % 2 === 0 ? 'white' : '#f9f9f9'
                    }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#000' }}>{stat.template_key}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#000' }}>{stat.save_count}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#000' }}>
                        {new Date(stat.last_saved).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.875rem', paddingBottom: '2rem' }}>
        <button 
          onClick={refetch}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            color: '#000',
            border: '1px solid #333',
            cursor: 'pointer',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.875rem'
          }}
        >
          Refresh Data
        </button>
      </div>
      </div>
      </div>
    </div>
  );
}
