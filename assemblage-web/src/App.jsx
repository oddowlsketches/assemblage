import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { CollageService } from './core/CollageService';
import './styles/legacy-app.css';
import './styles/auth.css';
import './styles/gallery.css';
import { getMaskDescriptor, maskRegistry } from './masks/maskRegistry';
import TemplateReview from './components/TemplateReview';
import AuthComponent from './components/Auth';
import Gallery from './components/Gallery';
import { getSupabase } from './supabaseClient';
import { Gear, CaretDown, Check, User, FloppyDisk } from 'phosphor-react';

function MainApp() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Track admin status
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let hasInitialized = false;
    
    const cvs = canvasRef.current;
    const resize = () => {
      serviceRef.current?.resizeCanvas();
    };
    window.addEventListener('resize', resize);
    
    // Click outside to close dropdowns
    const handleClickOutside = (event) => {
      const dropdowns = document.querySelectorAll('.dropdown-content, .user-dropdown');
      dropdowns.forEach(dropdown => {
        if (dropdown.classList.contains('show')) {
          const parent = dropdown.closest('.settings-dropdown, .user-menu');
          if (parent && !parent.contains(event.target)) {
            dropdown.classList.remove('show');
          }
        }
      });
    };
    document.addEventListener('click', handleClickOutside);

    // Initialize collage service and wire up loading events
    const supabase = getSupabase();
    if (!serviceRef.current) {
      serviceRef.current = new CollageService(cvs, { supabaseClient: supabase });
      resize();
    }
    
    // Initialize auth session first, then load collections
    const initializeApp = async () => {
      if (hasInitialized) return;
      hasInitialized = true;
      
      const session = await initializeAuth();
      // Check admin status immediately after auth
      const adminEmails = ['ecschwar@gmail.com'];
      const adminStatus = session?.user?.email && adminEmails.includes(session.user.email);
      
      // Load collections with the determined admin status
      await loadCollections(adminStatus);
    };
    
    initializeApp();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []); // Empty dependency array - only run once

  // Initialize authentication session
  const initializeAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      // Check if user is admin - replace with your actual admin email
      const adminEmails = ['ecschwar@gmail.com']; // Add your actual admin email here
      const isUserAdmin = session?.user?.email && adminEmails.includes(session.user.email);
      setIsAdmin(isUserAdmin);
      
      console.log('[Auth] Initial session:', {
        email: session?.user?.email || 'No session',
        isAdmin: isUserAdmin,
        adminEmails: adminEmails,
        emailMatch: session?.user?.email === 'ecschwar@gmail.com'
      });
      
      return session; // Return the session for immediate use
    } catch (error) {
      console.error('[Auth] Error getting initial session:', error);
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  // Load collections from Supabase
  const loadCollections = async (adminStatus = null) => {
    // Use passed adminStatus or current state
    const isUserAdmin = adminStatus !== null ? adminStatus : isAdmin;
    
    try {
      const supabase = getSupabase();
      
      // Default collection ID for all users
      const DEFAULT_COLLECTION_ID = '215c3f9e-70ff-45e5-95e4-413565b38b0f';
      
      if (isUserAdmin) {
        console.log('[loadCollections] Loading as admin user');
        // Admin users can see all collections
        const { data, error } = await supabase
          .from('image_collections')
          .select('id, name')
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setCollections(data);
          const firstCollectionId = data[0]?.id || DEFAULT_COLLECTION_ID;
          setSelectedCollection(firstCollectionId);
          await loadImagesForCollection(firstCollectionId);
        } else {
          console.error('Error loading collections:', error);
          await loadImagesForCollection(DEFAULT_COLLECTION_ID);
        }
      } else {
        console.log('[loadCollections] Loading as regular user');
        // Non-admin users only see the default collection
        setCollections([{ id: DEFAULT_COLLECTION_ID, name: 'Default Collection' }]);
        setSelectedCollection(DEFAULT_COLLECTION_ID);
        await loadImagesForCollection(DEFAULT_COLLECTION_ID);
      }
    } catch (err) {
      console.error('Error loading collections:', err);
      const DEFAULT_COLLECTION_ID = '215c3f9e-70ff-45e5-95e4-413565b38b0f';
      await loadImagesForCollection(DEFAULT_COLLECTION_ID);
    }
  };

  // Load images for a specific collection
  const loadImagesForCollection = async (collectionId) => {
    if (!serviceRef.current) return;
    
    setIsLoading(true);
    try {
      console.log(`[MainApp] Loading images for collection: ${collectionId}`);
      // Initialize with the specified collection
      await serviceRef.current.initialize(collectionId);
      console.log(`[MainApp] Service initialized with ${serviceRef.current.imageMetadata.length} images`);
      // Generate initial collage
      await serviceRef.current.generateCollage();
    } catch (err) {
      console.error('Failed to load images for collection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleShiftPerspective = () => {
    if (serviceRef.current) {
      serviceRef.current.shiftPerspective(prompt);
    }
  };

  const handleCollectionChange = async (e) => {
    const newCollectionId = e.target.value;
    setSelectedCollection(newCollectionId);
    
    if (!serviceRef.current) return;
    
    setIsLoading(true);
    try {
      console.log(`[MainApp] Switching to collection: ${newCollectionId}`);
      // Force reinitialize with new collection
      await serviceRef.current.reinitialize(newCollectionId);
      console.log(`[MainApp] Service reinitialized with ${serviceRef.current.imageMetadata.length} images`);
      // Generate initial collage with new collection
      await serviceRef.current.generateCollage();
    } catch (err) {
      console.error('Failed to switch collections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateArchitectural = () => {
    if (serviceRef.current) {
      serviceRef.current.setEffect('architectural');
      serviceRef.current.generateCollage(prompt);
    }
  };

  const handleSave = async () => {
    if (!session) {
      setShowAuth(true);
      return;
    }
    
    if (!serviceRef.current) return;
    
    try {
      // Get the canvas data
      const dataUrl = serviceRef.current.canvas.toDataURL('image/png');
      
      // Create a higher quality thumbnail maintaining aspect ratio
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');
      
      // Calculate thumbnail dimensions maintaining aspect ratio
      const originalCanvas = serviceRef.current.canvas;
      const aspectRatio = originalCanvas.width / originalCanvas.height;
      let thumbWidth = 300;
      let thumbHeight = Math.round(thumbWidth / aspectRatio);
      
      // If height is too large, constrain by height instead
      if (thumbHeight > 225) {
        thumbHeight = 225;
        thumbWidth = Math.round(thumbHeight * aspectRatio);
      }
      
      thumbnailCanvas.width = thumbWidth;
      thumbnailCanvas.height = thumbHeight;
      
      // Use better quality scaling
      thumbnailCtx.imageSmoothingEnabled = true;
      thumbnailCtx.imageSmoothingQuality = 'high';
      thumbnailCtx.drawImage(originalCanvas, 0, 0, thumbWidth, thumbHeight);
      const thumbnailUrl = thumbnailCanvas.toDataURL('image/png', 0.85);
      
      // Get template info from service
      const templateInfo = serviceRef.current.getLastRenderInfo ? 
        serviceRef.current.getLastRenderInfo() : 
        { templateKey: serviceRef.current.currentEffectName || 'random', params: {} };
      
      // Create a better title
      const now = new Date();
      const templateName = templateInfo.templateKey || 'Collage';
      const dateStr = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
      
      // Create a more descriptive title
      const title = `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} - ${dateStr} ${timeStr}`;
      
      console.log('[Save] Template info:', templateInfo);
      
      // Save to database
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('saved_collages')
        .insert({
          user_id: session.user.id,
          title: title,
          image_data_url: dataUrl,
          thumbnail_url: thumbnailUrl,
          template_key: templateInfo.templateKey || 'unknown',
          template_params: templateInfo.params || {}
        });
        
      if (error) {
        console.error('Error saving collage:', error);
        alert('Failed to save collage');
      } else {
        console.log('[Save] Collage saved successfully with:', {
          templateKey: templateInfo.templateKey,
          paramsKeys: Object.keys(templateInfo.params || {})
        });
        alert('Collage saved successfully!');
      }
    } catch (err) {
      console.error('Error saving collage:', err);
      alert('Failed to save collage');
    }
  };
  
  const handleAuthChange = (newSession) => {
    const oldSession = session;
    setSession(newSession);
    
    // Check if user is admin
    const adminEmails = ['ecschwar@gmail.com'];
    const wasAdmin = oldSession?.user?.email && adminEmails.includes(oldSession.user.email);
    const isUserAdmin = newSession?.user?.email && adminEmails.includes(newSession.user.email);
    
    // Only reload collections if admin status changed
    if (wasAdmin !== isUserAdmin) {
      setIsAdmin(isUserAdmin);
      console.log('[Auth] Admin status changed, reloading collections');
      loadCollections();
    } else {
      setIsAdmin(isUserAdmin);
    }
    
    if (newSession) {
      setShowAuth(false);
    }
  };

  return (
    <div id="wrapper">
      <header>
        <div className="header-text">
          <h1>Assemblage</h1>
          <p className="tagline">EPHEMERAL VISIONS, ASSEMBLED MEANINGS</p>
        </div>
        <div className="header-controls">
          <div className="action-buttons">
            <button id="generateButton" onClick={handleShiftPerspective}>New</button>
            <button id="saveButton" onClick={handleSave} className="save-btn">
              {session ? <FloppyDisk size={16} weight="regular" /> : 'Sign In'}
            </button>
            
            {/* Settings dropdown for admin users */}
            {isAdmin && collections.length > 1 && (
              <div className="settings-dropdown">
                <button className="settings-btn" onClick={(e) => {
                  e.currentTarget.nextElementSibling.classList.toggle('show');
                }}>
                  <Gear size={16} weight="regular" />
                  <CaretDown size={12} weight="regular" />
                </button>
                <div className="dropdown-content">
                  <div className="dropdown-label">Collection</div>
                  {collections.map(collection => (
                    <button 
                      key={collection.id} 
                      className={`dropdown-item ${selectedCollection === collection.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCollection(collection.id);
                        handleCollectionChange({ target: { value: collection.id } });
                        document.querySelector('.dropdown-content').classList.remove('show');
                      }}
                    >
                      <span>{collection.name}</span>
                      {selectedCollection === collection.id && <Check size={16} weight="bold" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* User menu */}
            {authLoading ? (
              <div className="auth-loading">Loading...</div>
            ) : session ? (
              <div className="user-menu">
                <button className="user-btn" onClick={(e) => {
                  e.currentTarget.nextElementSibling.classList.toggle('show');
                }}>
                  <User size={16} weight="regular" />
                  <CaretDown size={12} weight="regular" />
                </button>
                <div className="user-dropdown">
                  <div className="user-email-header">{session.user.email}</div>
                  <button 
                    onClick={() => setShowGallery(true)}
                    className="dropdown-item"
                  >
                    My Collages
                  </button>
                  <button 
                    onClick={async () => {
                      const supabase = getSupabase();
                      await supabase.auth.signOut();
                      setSession(null);
                      setIsAdmin(false);
                    }}
                    className="dropdown-item"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-section">
                <span className="auth-helper-text">Sign in to save collages</span>
              </div>
            )}
          </div>
          
          {/* Mobile menu button - visible only on mobile */}
          <button className="mobile-menu-btn mobile-only" onClick={(e) => {
            document.querySelector('.mobile-menu-overlay').classList.toggle('show');
            document.querySelector('.mobile-menu-panel').classList.toggle('show');
          }}>
            <Gear size={16} weight="regular" />
          </button>
        </div>
      </header>

      {/* Mobile floating action buttons */}
      <div className="mobile-actions mobile-only">
        <button onClick={handleSave} className="mobile-save-btn" title="Save">
          {session ? <FloppyDisk size={20} weight="regular" /> : 'Sign In'}
        </button>
        <button onClick={handleShiftPerspective} className="mobile-new-btn" title="New Collage">
          New
        </button>
      </div>
      
      {/* Mobile menu overlay */}
      <div className="mobile-menu-overlay" onClick={() => {
        document.querySelector('.mobile-menu-overlay').classList.remove('show');
        document.querySelector('.mobile-menu-panel').classList.remove('show');
      }}></div>
      
      {/* Mobile menu panel */}
      <div className="mobile-menu-panel">
        <button className="mobile-menu-close" onClick={() => {
          document.querySelector('.mobile-menu-overlay').classList.remove('show');
          document.querySelector('.mobile-menu-panel').classList.remove('show');
        }}>×</button>
        
        {/* Collections for admin users */}
        {isAdmin && collections.length > 1 && (
          <div className="mobile-menu-section">
            <div className="mobile-menu-label">Collection</div>
            {collections.map(collection => (
              <button 
                key={collection.id}
                className={`mobile-menu-item ${selectedCollection === collection.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCollection(collection.id);
                  handleCollectionChange({ target: { value: collection.id } });
                  document.querySelector('.mobile-menu-overlay').classList.remove('show');
                  document.querySelector('.mobile-menu-panel').classList.remove('show');
                }}
              >
                <span>{collection.name}</span>
                {selectedCollection === collection.id && <Check size={16} weight="bold" />}
              </button>
            ))}
          </div>
        )}
        
        {/* User menu for mobile */}
        {session && (
          <div className="mobile-menu-section">
            <div className="mobile-menu-label">{session.user.email}</div>
            <button 
              onClick={() => {
                setShowGallery(true);
                document.querySelector('.mobile-menu-overlay').classList.remove('show');
                document.querySelector('.mobile-menu-panel').classList.remove('show');
              }}
              className="mobile-menu-item"
            >
              My Collages
            </button>
            <button 
              onClick={async () => {
                const supabase = getSupabase();
                await supabase.auth.signOut();
                setSession(null);
                setIsAdmin(false);
                document.querySelector('.mobile-menu-overlay').classList.remove('show');
                document.querySelector('.mobile-menu-panel').classList.remove('show');
              }}
              className="mobile-menu-item"
            >
              Sign Out
            </button>
          </div>
        )}
        
        {/* Sign in for non-authenticated users */}
        {!session && (
          <div className="mobile-menu-section">
            <div className="mobile-menu-label">Account</div>
            <div className="mobile-menu-item" style={{padding: '0.5rem 0', fontSize: '0.8rem', color: 'var(--color-accent)', fontStyle: 'italic'}}>
              Sign in to save collages
            </div>
          </div>
        )}
      </div>

      <div id="canvas-container">
        <canvas ref={canvasRef} id="collageCanvas" />
        {isLoading && <div className="loading">Loading images...</div>}
      </div>

      <footer>
        <p className="copyright">© 2025 Assemblage by Emily Schwartzman. All rights reserved.</p>
      </footer>
      
      {/* Auth Modal */}
      {showAuth && (
        <AuthComponent 
          onAuthChange={handleAuthChange}
          onClose={() => setShowAuth(false)}
        />
      )}
      
      {/* Gallery Modal */}
      {showGallery && session && (
        <Gallery 
          session={session}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      {/* <nav style={{ padding: '1rem', textAlign: 'center' }}>
        <Link to="/">Main App</Link>
        {' | '}
        <Link to="/dev-review">Template Review (Dev Tool)</Link>
      </nav> */}
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/dev-review" element={<TemplateReview />} />
      </Routes>
    </Router>
  );
} 