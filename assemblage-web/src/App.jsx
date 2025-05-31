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
import { ImageSquare, CaretDown, Check, User, FloppyDisk, List, UploadSimple, Link as LinkIcon, Folder, Stack, BookmarkSimple, X } from 'phosphor-react';
import { UploadModal } from './components/UploadModal';
import { CollectionDrawer } from './components/CollectionDrawer';
import { SourceSelector } from './components/SourceSelector';
import CollectionDetail from './pages/collections/CollectionDetail';
import { getContrastText } from './lib/colorUtils/contrastText';

function MainApp() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [userCollectionsForSelect, setUserCollectionsForSelect] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Track admin status
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [isFirstSave, setIsFirstSave] = useState(false);
  const [feedbackTextColor, setFeedbackTextColor] = useState('#333333');
  const [bgColor, setBgColor] = useState('#f5f5f5');
  
  // New states for the source selector functionality
  const [activeCollection, setActiveCollection] = useState('cms');
  const [activeCollectionName, setActiveCollectionName] = useState('Default Library');
  const [showUpload, setShowUpload] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // Update feedback text color based on background using WCAG AA compliant contrast
  const updateFeedbackTextColor = () => {
    // Get the background color from CSS variables which change with collages
    const rootStyle = getComputedStyle(document.documentElement);
    const currentBgColor = rootStyle.getPropertyValue('--background-color').trim() || '#f5f5f5';
    setBgColor(currentBgColor);
    
    // Use the new WCAG AA compliant contrast utility
    const contrastColor = getContrastText(currentBgColor);
    setFeedbackTextColor(contrastColor);
  };

  // Watch for background color changes
  useEffect(() => {
    updateFeedbackTextColor();
    
    // Create a MutationObserver to watch for style changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          updateFeedbackTextColor();
        }
      });
    });
    
    // Observe changes to body and document element
    observer.observe(document.body, { attributes: true, subtree: true });
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

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
      
      // Check if we should open collections drawer
      if (localStorage.getItem('openCollectionsDrawer') === 'true') {
        setShowDrawer(true);
        localStorage.removeItem('openCollectionsDrawer');
      }
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
      
      // Always try to load the default collection first
      const { data: defaultCollection, error: defaultError } = await supabase
        .from('image_collections')
        .select('id, name, is_public')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();
      
      if (isUserAdmin) {
        console.log('[loadCollections] Loading as admin user');
        // Admin users can see all collections
        const { data, error } = await supabase
          .from('image_collections')
          .select('id, name, is_public')
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setUserCollectionsForSelect(data);
          // Ensure default collection is in the list
          if (defaultCollection && !data.find(c => c.id === defaultCollection.id)) {
            setUserCollectionsForSelect([defaultCollection, ...data]);
          }
          // Set the actual name for the default collection
          if (defaultCollection) {
            setActiveCollectionName(defaultCollection.name);
          }
          await loadImagesForCollection('cms');
        } else {
          console.error('Error loading collections:', error);
          // Still set default collection if available
          if (defaultCollection) {
            setUserCollectionsForSelect([defaultCollection]);
            setActiveCollectionName(defaultCollection.name);
          }
          await loadImagesForCollection('cms');
        }
      } else {
        console.log('[loadCollections] Loading as regular user - fetching public collections');
        // Regular users see public collections plus their own
        const { data, error } = await supabase
          .from('image_collections')
          .select('id, name, is_public')
          .eq('is_public', true)
          .order('created_at', { ascending: true });
        
        if (!error && data && data.length > 0) {
          setUserCollectionsForSelect(data);
          // Set the name of the default collection if it's in the list
          const defaultInList = data.find(c => c.id === '00000000-0000-0000-0000-000000000001');
          if (defaultInList) {
            setActiveCollectionName(defaultInList.name);
          }
          await loadImagesForCollection('cms');
        } else {
          // Fallback - at least show default collection if it exists
          console.log('[loadCollections] No public collections found');
          if (defaultCollection && defaultCollection.is_public) {
            setUserCollectionsForSelect([defaultCollection]);
            setActiveCollectionName(defaultCollection.name);
          } else {
            setUserCollectionsForSelect([]);
            setActiveCollectionName('Default Library');
          }
          await loadImagesForCollection('cms');
        }
      }
    } catch (err) {
      console.error('Error loading collections:', err);
      setActiveCollectionName('Default Library');
      await loadImagesForCollection('cms');
    }
  };

  // Load images for a specific collection
  const loadImagesForCollection = async (collectionId) => {
    if (!serviceRef.current) return;
    
    setIsLoading(true);
    try {
      console.log(`[MainApp] Loading images for collection: ${collectionId}`);
      
      // For user collections, always reinitialize to ensure we get fresh data
      if (collectionId !== 'cms') {
        await serviceRef.current.reinitialize(collectionId);
      } else {
        // Use the default collection ID if 'cms' is selected
        const actualCollectionId = '00000000-0000-0000-0000-000000000001';
        await serviceRef.current.initialize(actualCollectionId);
      }
      
      console.log(`[MainApp] Service initialized with ${serviceRef.current.imageMetadata.length} images`);
      // Generate initial collage
      await serviceRef.current.generateCollage();
    } catch (err) {
      console.error('Failed to load images for collection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure a collage is generated when returning to home
  useEffect(() => {
    // Check if canvas is empty and we're not loading
    if (!isLoading && serviceRef.current && serviceRef.current.canvas) {
      const ctx = serviceRef.current.canvas.getContext('2d');
      // Check if canvas is blank
      const imageData = ctx.getImageData(0, 0, 1, 1);
      const isBlank = imageData.data.every(pixel => pixel === 0);
      
      if (isBlank && serviceRef.current.imageMetadata?.length > 0) {
        console.log('[MainApp] Canvas is blank, regenerating collage');
        serviceRef.current.generateCollage();
      }
    }
  }, [isLoading]);

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
  
  // Fetch user-specific collections for the source selector dropdown
  const fetchUserCollectionsForSelect = async () => {
    try {
      const supabase = getSupabase();
      
      // Always get the default collection first
      const { data: defaultCollection } = await supabase
        .from('image_collections')
        .select('id, name, is_public')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();
      
      if (!session) {
        console.log('[fetchUserCollectionsForSelect] No session');
        // No session - only show public collections
        const { data: publicCollections } = await supabase
          .from('image_collections')
          .select('id, name')
          .eq('is_public', true)
          .order('created_at', { ascending: true });
        
        if (publicCollections && publicCollections.length > 0) {
          setUserCollectionsForSelect(publicCollections);
        } else if (defaultCollection && defaultCollection.is_public) {
          setUserCollectionsForSelect([defaultCollection]);
        } else {
          setUserCollectionsForSelect([]);
        }
        return;
      }
      
      console.log('[fetchUserCollectionsForSelect] Session exists, isAdmin:', isAdmin);
      
      // For admin users, fetch from both image_collections and user_collections
      // For regular users, fetch public collections plus their own
      if (isAdmin) {
        const [imageCollectionsResult, userCollectionsResult] = await Promise.all([
          supabase
            .from('image_collections')
            .select('id, name')
            .order('created_at', { ascending: true }),
          supabase
            .from('user_collections')
            .select('id, name')
            .eq('user_id', session.user.id)
            .order('name', { ascending: true })
        ]);
        
        const allCollections = [];
        
        // Add ALL image collections (including default) for admin
        if (imageCollectionsResult.data) {
          allCollections.push(...imageCollectionsResult.data);
        }
        
        // Add user collections
        if (userCollectionsResult.data) {
          allCollections.push(...userCollectionsResult.data);
        }
        
        console.log('[fetchUserCollectionsForSelect] Admin collections (combined):', allCollections);
        setUserCollectionsForSelect(allCollections);
      } else {
        // Regular users: get public collections + their own user collections
        const [publicCollectionsResult, userCollectionsResult] = await Promise.all([
          supabase
            .from('image_collections')
            .select('id, name')
            .eq('is_public', true)
            .order('created_at', { ascending: true }),
          supabase
            .from('user_collections')
            .select('id, name')
            .eq('user_id', session.user.id)
            .order('name', { ascending: true })
        ]);
        
        const allCollections = [];
        
        // Add public collections
        if (publicCollectionsResult.data) {
          allCollections.push(...publicCollectionsResult.data);
        }
        
        // Add user's own collections
        if (userCollectionsResult.data) {
          allCollections.push(...userCollectionsResult.data);
        }
        
        // Ensure we have at least the default collection if it's public
        if (allCollections.length === 0 && defaultCollection && defaultCollection.is_public) {
          allCollections.push(defaultCollection);
        }
        
        console.log('[fetchUserCollectionsForSelect] User collections (combined):', allCollections);
        setUserCollectionsForSelect(allCollections);
      }
    } catch (err) {
      console.error('Error fetching user collections for select:', err);
      setUserCollectionsForSelect([]);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserCollectionsForSelect();
    } else {
      setUserCollectionsForSelect([]);
    }
  }, [session, isAdmin]); // Re-fetch when admin status changes

  // Update activeCollectionName when activeCollection changes
  useEffect(() => {
    if (activeCollection === 'cms') {
      // For CMS/default, the name should already be set from loadCollections
      // Don't override it here unless we need to
      if (!activeCollectionName || activeCollectionName === 'Default Library') {
        // Try to find the default collection name from image_collections
        const defaultCollection = userCollectionsForSelect.find(
          c => c.id === '00000000-0000-0000-0000-000000000001'
        );
        if (defaultCollection) {
          setActiveCollectionName(defaultCollection.name);
        }
      }
    } else {
      // For user collections, find the collection in the list
      const foundCollection = userCollectionsForSelect.find(col => col.id === activeCollection);
      if (foundCollection) {
        setActiveCollectionName(foundCollection.name);
      }
      // Don't update the name if we can't find the collection - keep the existing name
    }
  }, [activeCollection, userCollectionsForSelect]);

  // Handler for source selector changes
  const handleSourceChange = async (sourceId) => {
    // This function is now primarily for setting the active source for collage generation
    setActiveCollection(sourceId);
    await loadImagesForCollection(sourceId); // Reload images for the new source
    // Close any dropdowns if this was called from one
    const sourceDropdown = document.querySelector('.source-selector-dropdown .dropdown-content');
    if (sourceDropdown && sourceDropdown.classList.contains('show')) {
      sourceDropdown.classList.remove('show');
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
    
    // Show saving state immediately
    setSaveState('saving');
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Check if this is the user's first save
    const supabase = getSupabase();
    const { count } = await supabase
      .from('saved_collages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
    
    const isFirstSaveAttempt = count === 0;
    setIsFirstSave(isFirstSaveAttempt);
    
    try {
      // Get the canvas data
      const dataUrl = serviceRef.current.canvas.toDataURL('image/png');
      
      // Create a higher quality thumbnail maintaining aspect ratio
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');
      
      // Calculate thumbnail dimensions maintaining aspect ratio
      const originalCanvas = serviceRef.current.canvas;
      const aspectRatio = originalCanvas.width / originalCanvas.height;
      let thumbWidth = 600; // Increased from 300 for better quality
      let thumbHeight = Math.round(thumbWidth / aspectRatio);
      
      // If height is too large, constrain by height instead
      if (thumbHeight > 450) { // Increased from 225
        thumbHeight = 450;
        thumbWidth = Math.round(thumbHeight * aspectRatio);
      }
      
      thumbnailCanvas.width = thumbWidth;
      thumbnailCanvas.height = thumbHeight;
      
      // Use better quality scaling
      thumbnailCtx.imageSmoothingEnabled = true;
      thumbnailCtx.imageSmoothingQuality = 'high';
      thumbnailCtx.drawImage(originalCanvas, 0, 0, thumbWidth, thumbHeight);
      const thumbnailUrl = thumbnailCanvas.toDataURL('image/png', 0.95); // Increased quality from 0.85
      
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
        setSaveState('error');
        // Show native alert on mobile, custom message on desktop
        if (window.innerWidth <= 768) {
          alert('Failed to save collage');
        }
      } else {
        console.log('[Save] Collage saved successfully with:', {
          templateKey: templateInfo.templateKey,
          paramsKeys: Object.keys(templateInfo.params || {})
        });
        setSaveState('saved');
        
        // Show native success on mobile only
        if (window.innerWidth <= 768) {
          alert('Collage saved successfully!');
        }
        
        // Auto-hide the success message after 4 seconds
        setTimeout(() => {
          setSaveState('idle');
        }, 4000);
      }
    } catch (err) {
      console.error('Error saving collage:', err);
      setSaveState('error');
      if (window.innerWidth <= 768) {
        alert('Failed to save collage');
      }
      setTimeout(() => {
        setSaveState('idle');
      }, 3000);
    }
  };
  
  const handleAuthChange = async (newSession) => {
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
      
      // Check if user has any collections, if not create a default one
      const supabase = getSupabase();
      const { data: collections, error: fetchError } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', newSession.user.id)
        .limit(1);
        
      if (!fetchError && (!collections || collections.length === 0)) {
        console.log('[Auth] Creating default collection for new user');
        // Create in user_collections
        const { data: newUserCollection, error: createUserCollectionError } = await supabase
          .from('user_collections')
          .insert({
            user_id: newSession.user.id,
            name: 'My Images' // Default name
          })
          .select()
          .single();
          
        if (createUserCollectionError) {
          console.error('[Auth] Error creating default user_collection:', createUserCollectionError);
        } else if (newUserCollection) {
          console.log('[Auth] Created default user_collection:', newUserCollection.id, newUserCollection.name);
          
          // ALSO Create a corresponding entry in image_collections
          // This entry makes the user_collection.id a valid foreign key for images.collection_id
          const { error: createImageCollectionError } = await supabase
            .from('image_collections')
            .insert({
              id: newUserCollection.id, // Use the SAME ID as the user_collection
              name: newUserCollection.name, // Can use the same name
              user_id: newSession.user.id, // Associate with the user
              // Add any other required fields for image_collections, ensure they have defaults or are nullable
              // For example, if 'is_public' or 'type' fields exist and are required:
              // is_public: false, 
              // type: 'user_generated',
            });

          if (createImageCollectionError) {
            console.error('[Auth] Error creating corresponding image_collection entry:', createImageCollectionError);
            // Potentially roll back the user_collection creation or mark it as needing reconciliation
          } else {
            console.log('[Auth] Created corresponding image_collection entry for:', newUserCollection.id);
          }

          // If we're currently on cms/default, switch to the new collection
          if (activeCollection === 'cms') {
            setActiveCollection(newUserCollection.id);
            await loadImagesForCollection(newUserCollection.id);
          }
        }
      }
    }
  };

  return (
    <div id="wrapper">
      <header className="space-y-2 sm:space-y-0">
        <div className="header-text">
          <h1>Assemblage</h1>
          <p className="tagline">EPHEMERAL VISIONS, ASSEMBLED MEANINGS</p>
        </div>
        <div className="header-controls">
          <div className="action-buttons sm:flex-row flex-wrap">

            
            <button id="saveButton" onClick={handleSave} className="save-btn" disabled={saveState === 'saving'}>
              {session ? (
                saveState === 'saving' ? (
                  <div className="save-spinner"></div>
                ) : (
                  <BookmarkSimple size={16} weight="regular" />
                )
              ) : (
                'Sign In'
              )}
            </button>
            
            <button id="generateButton" onClick={handleShiftPerspective}>New</button>
            
            {/* Updated Source Selector */}
            <SourceSelector 
              activeSource={activeCollection}
              activeSourceName={activeCollectionName}
              onSourceChange={handleSourceChange}
              onManageCollections={() => setShowDrawer(true)}
              onUploadImages={() => setShowUpload(true)}
              onOpenGallery={() => setShowGallery(true)}
              userCollections={userCollectionsForSelect}
            />
            
            {/* Prompt placeholder - removed gear icon */}
            
            {/* User menu - no gear icon */}
            {authLoading ? (
              <div className="auth-loading">Loading...</div>
            ) : session ? (
              <div className="user-menu" style={{ marginLeft: '0.5rem' }}>
                <button className="user-btn" onClick={(e) => {
                  e.currentTarget.nextElementSibling.classList.toggle('show');
                }}>
                  <User size={16} weight="regular" />
                  <CaretDown size={12} weight="regular" />
                </button>
                <div className="user-dropdown">
                  <div className="user-email-header">{session.user.email}</div>
                  <button 
                    onClick={async () => {
                      const supabase = getSupabase();
                      await supabase.auth.signOut();
                      setSession(null);
                      setIsAdmin(false);
                      // Ensure the dropdown closes after sign out
                      const userDropdown = document.querySelector('.user-menu .user-dropdown');
                      if (userDropdown) userDropdown.classList.remove('show');
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
            <List size={36} weight="regular" />
          </button>
        </div>
      </header>

      {/* Mobile floating action buttons */}
      <div className="mobile-actions mobile-only">
        <button onClick={(e) => {
          console.log('[Mobile] New button clicked');
          handleShiftPerspective();
        }} className="mobile-new-btn" title="New Collage">
          New
        </button>
        <button onClick={(e) => {
          console.log('[Mobile] Save button clicked');
          handleSave();
        }} className="mobile-save-btn" title="Save" disabled={saveState === 'saving'}>
          {session ? (
            saveState === 'saving' ? (
              <div className="save-spinner mobile-spinner"></div>
            ) : (
              <BookmarkSimple size={20} weight="regular" />
            )
          ) : (
            'Sign In'
          )}
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
        
        {/* Collection Management */}
        <div className="mobile-menu-section">
          <div className="mobile-menu-label">Image Source</div>
          
          {/* Collection Switcher */}
          <div className="mobile-collection-selector">
            <select 
              value={activeCollection} 
              onChange={(e) => {
                handleSourceChange(e.target.value);
                document.querySelector('.mobile-menu-overlay').classList.remove('show');
                document.querySelector('.mobile-menu-panel').classList.remove('show');
              }}
              className="mobile-collection-dropdown"
            >
              {userCollectionsForSelect.map(collection => {
                const isDefaultCollection = collection.id === '00000000-0000-0000-0000-000000000001';
                return (
                  <option 
                    key={collection.id} 
                    value={isDefaultCollection ? 'cms' : collection.id}
                  >
                    {collection.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        {/* Image Actions Section */}
        <div className="mobile-menu-section">
          <div className="mobile-menu-label">Image Actions</div>
          
          <button
            className="mobile-menu-item"
            onClick={() => {
              setShowDrawer(true);
              document.querySelector('.mobile-menu-overlay').classList.remove('show');
              document.querySelector('.mobile-menu-panel').classList.remove('show');
            }}
          >
            My Collections
          </button>
          
          {session && (
            <button
              className="mobile-menu-item"
              onClick={() => {
                setShowUpload(true);
                document.querySelector('.mobile-menu-overlay').classList.remove('show');
                document.querySelector('.mobile-menu-panel').classList.remove('show');
              }}
            >
              Upload Images
            </button>
          )}
        </div>
        
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
            <button
              className="mobile-menu-item"
              onClick={() => {
                setShowAuth(true);
                document.querySelector('.mobile-menu-overlay').classList.remove('show');
                document.querySelector('.mobile-menu-panel').classList.remove('show');
              }}
              style={{
                background: 'var(--text-color, #333)',
                color: 'var(--background-color, white)',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              Sign In to Upload Images
            </button>
          </div>
        )}
      </div>

      <div id="canvas-container">
        <canvas ref={canvasRef} id="collageCanvas" />
        {isLoading && <div className="loading">Loading images...</div>}
        
        {/* Save feedback overlay */}
        {saveState !== 'idle' && (
          <div className="save-overlay">
            <div className="save-overlay-content">
              {saveState === 'saving' && (
                <>
                  <div className="save-spinner-large"></div>
                  <p>Saving your collage...</p>
                </>
              )}
              {saveState === 'saved' && (
                <>
                  <div className="save-success-icon">
                    <Check size={48} weight="bold" style={{ color: 'inherit' }} />
                  </div>
                  <p>Collage saved!</p>
                  {isFirstSave && (
                    <button 
                      onClick={() => {
                        setShowGallery(true);
                        setSaveState('idle');
                      }}
                      className="save-overlay-button"
                    >
                      View in My Collages
                    </button>
                  )}
                  <button 
                    onClick={() => setSaveState('idle')}
                    className="save-overlay-dismiss"
                  >
                    Dismiss
                  </button>
                </>
              )}
              {saveState === 'error' && (
                <>
                  <div className="save-error-icon">
                    <X size={48} weight="bold" style={{ color: '#e74c3c' }} />
                  </div>
                  <p>Failed to save collage</p>
                  <button 
                    onClick={() => setSaveState('idle')}
                    className="save-overlay-button"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {!isLoading && serviceRef.current?.imageMetadata?.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: '2rem',
            background: 'var(--background-color, #f5f5f5)',
            border: '1px solid var(--button-border-color, #333)',
            fontFamily: 'Space Mono, monospace',
            maxWidth: '400px',
            color: 'var(--text-color, #333)'
          }}>
            <p style={{ marginBottom: '1rem' }}>No images available in this collection.</p>
            {activeCollection !== 'cms' && (
              <button 
                onClick={() => setShowUpload(true)}
                style={{
                  background: 'var(--text-color, #333)',
                  border: '1px solid var(--text-color, #333)',
                  color: 'var(--background-color, white)',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.9rem'
                }}
              >
                Upload Images
              </button>
            )}
          </div>
        )}
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
      
      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
        collectionId={activeCollection === 'cms' ? null : activeCollection}
        onUploadComplete={async (results) => {
          // Close the upload modal immediately
          setShowUpload(false);
          
          // If we uploaded to a collection, refresh it after a short delay
          // to ensure database has propagated the changes
          if (activeCollection !== 'cms' && results && results.length > 0) {
            console.log(`[MainApp] Upload complete, refreshing collection ${activeCollection} with ${results.length} new images`);
            // Increase delay to ensure database has fully propagated
            setTimeout(async () => {
              // Force a complete reinitialize to ensure we get all images
              await serviceRef.current.reinitialize(activeCollection);
              console.log(`[MainApp] Collection refreshed, now has ${serviceRef.current.imageMetadata.length} images`);
            }, 2000); // Increased from 1500ms to 2000ms
          }
        }}
      />
      
      {/* Collection Drawer */}
      <CollectionDrawer 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)} 
        activeCollectionId={activeCollection}
        onCollectionSelect={(id) => {
          setActiveCollection(id);
          setShowDrawer(false);
          loadImagesForCollection(id);
        }}
        onShowGallery={() => setShowGallery(true)}
        onUploadImages={() => {
          setShowUpload(true);
          setShowDrawer(false);
        }}
      />
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
        <Route path="/collections/:id" element={<CollectionDetail />} />
      </Routes>
    </Router>
  );
} 