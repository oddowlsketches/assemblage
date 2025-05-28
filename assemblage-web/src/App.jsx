import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { CollageService } from './core/CollageService';
import './styles/legacy-app.css';
import './styles/auth.css';
import './styles/gallery.css';
import { getMaskDescriptor } from './masks/maskRegistry';
import TemplateReview from './components/TemplateReview';
import AuthComponent from './components/Auth';
import Gallery from './components/Gallery';
import { getSupabase } from './supabaseClient';

function MainApp() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const cvs = canvasRef.current;
    const resize = () => {
      serviceRef.current?.resizeCanvas();
    };
    window.addEventListener('resize', resize);

    // Initialize collage service and wire up loading events
    const supabase = getSupabase();
    if (!serviceRef.current) {
      serviceRef.current = new CollageService(cvs, { supabaseClient: supabase });
      resize();
    }
    
    // Initialize auth session
    initializeAuth();
    
    // Load collections first
    loadCollections();

    return () => window.removeEventListener('resize', resize);
  }, []);

  // Initialize authentication session
  const initializeAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      console.log('[Auth] Initial session:', session?.user?.email || 'No session');
    } catch (error) {
      console.error('[Auth] Error getting initial session:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Load collections from Supabase
  const loadCollections = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('image_collections')
        .select('id, name')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setCollections(data);
        const firstCollectionId = data[0]?.id || '';
        setSelectedCollection(firstCollectionId);
        
        // Load metadata for the first collection
        await loadImagesForCollection(firstCollectionId);
      } else {
        console.error('Error loading collections:', error);
        // Load without collection filter as fallback
        await loadImagesForCollection('');
      }
    } catch (err) {
      console.error('Error loading collections:', err);
      // Load without collection filter as fallback
      await loadImagesForCollection('');
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
      
      // Create a thumbnail (smaller version)
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');
      thumbnailCanvas.width = 200;
      thumbnailCanvas.height = 150;
      thumbnailCtx.drawImage(serviceRef.current.canvas, 0, 0, 200, 150);
      const thumbnailUrl = thumbnailCanvas.toDataURL('image/png');
      
      // Get current date/time for title
      const now = new Date();
      const title = `Collage ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      
      // Get template info from service - improved to capture more details
      const templateInfo = serviceRef.current.getLastRenderInfo ? 
        serviceRef.current.getLastRenderInfo() : 
        { templateKey: serviceRef.current.currentEffectName || 'random', params: {} };
      
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
    setSession(newSession);
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
            {collections.length > 0 && (
              <select 
                value={selectedCollection} 
                onChange={handleCollectionChange}
                className="collection-selector"
              >
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            )}
            <button id="generateButton" onClick={handleShiftPerspective}>New</button>
            <button id="saveButton" onClick={handleSave}>
              {session ? 'Save' : 'Sign In to Save'}
            </button>
            
            {/* Auth Component */}
            {authLoading ? (
              <div className="auth-loading">Loading...</div>
            ) : session ? (
              <>
                <button 
                  onClick={() => setShowGallery(true)}
                  className="gallery-trigger-btn"
                >
                  My Collages
                </button>
                <AuthComponent onAuthChange={handleAuthChange} />
              </>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="auth-trigger-btn"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

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