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
import { ImageSquare, CaretDown, Check, User, FloppyDisk, List, UploadSimple, Link as LinkIcon, Folder, Stack, BookmarkSimple, X, Pencil } from 'phosphor-react';
import { UploadModal } from './components/UploadModal';
import { CollectionDrawer } from './components/CollectionDrawer';
import { MakeDrawer } from './components/MakeDrawer';
import { SourceSelector } from './components/SourceSelector';
import CollectionDetail from './pages/collections/CollectionDetail';
import { getContrastText } from './lib/colorUtils/contrastText';
import { useQuota } from './hooks/useQuota';



// Welcome Tooltip Component
function WelcomeTooltip({ onDismiss }) {
  const handleDismiss = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    if (onDismiss) onDismiss();
  };
  
  // Tooltip positioned below the user menu
  return (
    <div 
      style={{
        position: 'absolute',
        top: '100%',
        right: '0',
        marginTop: '0.5rem',
        background: '#333333',
        color: '#ffffff',
        padding: '1rem 1.25rem',
        fontFamily: 'Space Mono, monospace',
        fontSize: '0.85rem',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        width: '280px',
        maxWidth: 'calc(100vw - 2rem)',
        // Arrow pointing up
        '::before': {
          content: '""',
          position: 'absolute',
          top: '-6px',
          right: '1rem',
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid #333333'
        }
      }}
    >
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        top: '-6px',
        right: '1rem',
        width: '0',
        height: '0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '6px solid #333333'
      }} />
      
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleDismiss}
          style={{ 
            position: 'absolute',
            top: '-0.5rem',
            right: '-0.75rem',
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            padding: '0.25rem',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontFamily: 'Space Mono, monospace',
            lineHeight: '1'
          }}
          title="Dismiss"
        >×</button>
        
        <div style={{ paddingRight: '1rem' }}>
          <div style={{ 
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Welcome to Assemblage! 🎨
          </div>
          <div style={{ 
            lineHeight: '1.4',
            opacity: '0.9'
          }}>
            To get started, explore <strong>My Images</strong> to upload or view your photos, and check <strong>Saved Collages</strong> to see or download your creations.
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [feedbackTextColor, setFeedbackTextColor] = useState('#333333');
  const [bgColor, setBgColor] = useState('#f5f5f5');
  
  // Initialize with default collection
  const [activeCollection, setActiveCollection] = useState('cms');
  const [activeCollectionName, setActiveCollectionName] = useState('Default Library'); // Will be updated dynamically
  const [showUpload, setShowUpload] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  
  // New states for Milestone 3.6
  const [showMakeDrawer, setShowMakeDrawer] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaModalType, setQuotaModalType] = useState(''); // 'images' or 'collages'
  const [uploadCollectionId, setUploadCollectionId] = useState(null); // For passing to upload modal
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(false);
  
  // Quota management
  const { checkQuota, downloadAndArchiveOldestCollages, archiveOldestImages, loading: quotaLoading } = useQuota();

  // Update feedback text color based on background using WCAG AA compliant contrast
  // Generate a placeholder collage for first-run experience
  const generateFirstCollage = async () => {
    if (!serviceRef.current || !serviceRef.current.canvas) return;
    
    const ctx = serviceRef.current.ctx;
    const canvas = serviceRef.current.canvas;
    
    // Generate a colorful geometric pattern
    const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Clear and fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update UI colors
    serviceRef.current.updateUIColors(bgColor);
    
    // Draw some geometric shapes as placeholders
    ctx.globalCompositeOperation = 'multiply';
    
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 100 + Math.random() * 200;
      const shapeColor = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.fillStyle = shapeColor;
      ctx.globalAlpha = 0.7;
      
      // Random shape
      if (Math.random() > 0.5) {
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Rectangle
        ctx.fillRect(x - size/2, y - size/2, size, size);
      }
    }
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

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
    
    // Click outside to close dropdowns and tooltips
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
      
      // Close welcome tooltip when clicking outside
      if (showWelcomeTooltip) {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu && !userMenu.contains(event.target)) {
          setShowWelcomeTooltip(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);

    // Keyboard shortcut handler for Shift+T
    const handleKeyDown = (event) => {
      if (event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        setShowMakeDrawer(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

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
      
      // Check if first run and generate placeholder collage if needed
      if (serviceRef.current) {
        // If no images are loaded yet, initialize with default collection
        if (serviceRef.current.imageMetadata.length === 0) {
          console.log('[MainApp] No images loaded yet, ensuring default collection is loaded');
          await loadImagesForCollection('cms');
        }
        
        // Only show placeholder if still no images after loading
        if (serviceRef.current.imageMetadata.length === 0) {
          console.log('[MainApp] First run detected, generating placeholder collage');
          // Generate a simple pattern-based collage without images
          await generateFirstCollage();
        }
      }
    };
    
    initializeApp();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showWelcomeTooltip]); // Include showWelcomeTooltip to handle click outside

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
            console.log('[loadCollections] Set default collection name to:', defaultCollection.name);
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
            console.log('[loadCollections] Set default collection name to:', defaultInList.name);
          }
          await loadImagesForCollection('cms');
        } else {
          // Fallback - at least show default collection if it exists
          console.log('[loadCollections] No public collections found');
          if (defaultCollection && defaultCollection.is_public) {
            setUserCollectionsForSelect([defaultCollection]);
            setActiveCollectionName(defaultCollection.name);
            console.log('[loadCollections] Set fallback collection name to:', defaultCollection.name);
          } else {
            setUserCollectionsForSelect([]);
            setActiveCollectionName('Default Library');
            console.log('[loadCollections] No collections found, using fallback name');
          }
          await loadImagesForCollection('cms');
        }
      }
      
      // Also call fetchUserCollectionsForSelect to ensure user collections are loaded
      if (session) {
        await fetchUserCollectionsForSelect();
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
      
      // Check if this is an empty user collection
      if (serviceRef.current.imageMetadata.length === 0 && collectionId !== 'cms') {
        // Open upload modal with this collection preselected
        setUploadCollectionId(collectionId);
        setShowUpload(true);
      } else {
        // Generate initial collage
        await serviceRef.current.generateCollage();
      }
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
      
      console.log('[fetchUserCollectionsForSelect] Default collection:', defaultCollection);

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
      
      console.log('[fetchUserCollectionsForSelect] Session exists, user:', session.user.email, 'isAdmin:', isAdmin);
      
      // For admin users, fetch from both image_collections and user_collections
      // For regular users, fetch public collections plus their own
      if (isAdmin) {
        console.log('[fetchUserCollectionsForSelect] Loading as admin');
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
        console.log('[fetchUserCollectionsForSelect] Loading as regular user');
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
        
        console.log('[fetchUserCollectionsForSelect] Public collections:', publicCollectionsResult.data);
        console.log('[fetchUserCollectionsForSelect] User collections:', userCollectionsResult.data);
        
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
    // Always update the name based on the active collection
    const defaultCollectionId = '00000000-0000-0000-0000-000000000001';
    
    if (activeCollection === 'cms' || activeCollection === defaultCollectionId) {
      // Find the default collection in the list
      const defaultCollection = userCollectionsForSelect.find(
        c => c.id === defaultCollectionId
      );
      if (defaultCollection) {
        setActiveCollectionName(defaultCollection.name);
        console.log('[activeCollection effect] Updated name to:', defaultCollection.name);
      } else {
        // Fallback if not found
        setActiveCollectionName('Default Library');
        console.log('[activeCollection effect] Using fallback name: Default Library');
      }
    } else {
      // For user collections, find the collection in the list
      const foundCollection = userCollectionsForSelect.find(col => col.id === activeCollection);
      if (foundCollection) {
        setActiveCollectionName(foundCollection.name);
      }
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
    
    // Check quota before saving
    try {
      const quotaStatus = await checkQuota();
      if (quotaStatus.collages.isOverQuota) {
        // Show quota modal
        setQuotaModalType('collages');
        setShowQuotaModal(true);
        return;
      }
    } catch (error) {
      console.error('Error checking quota:', error);
      // Continue with save if quota check fails
    }
    
    // Show saving state immediately
    setSaveState('saving');
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const supabase = getSupabase();
    
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
      
      // Convert data URLs to blobs
      const imageBlob = serviceRef.current.dataURLtoBlob(dataUrl);
      const thumbnailBlob = serviceRef.current.dataURLtoBlob(thumbnailUrl);
      
      // Generate unique storage keys
      const collageId = crypto.randomUUID();
      const storageKey = `${session.user.id}/${collageId}.png`;
      const thumbnailKey = `${session.user.id}/${collageId}_thumb.png`;
      
      // Upload full image to storage
      const { error: uploadError } = await supabase.storage
        .from('collages')
        .upload(storageKey, imageBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Error uploading collage to storage:', uploadError);
        throw uploadError;
      }
      
      // Upload thumbnail to storage  
      const { error: thumbUploadError } = await supabase.storage
        .from('collages')
        .upload(thumbnailKey, thumbnailBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });
        
      if (thumbUploadError) {
        // Clean up main image if thumbnail fails
        await supabase.storage.from('collages').remove([storageKey]);
        console.error('Error uploading thumbnail to storage:', thumbUploadError);
        throw thumbUploadError;
      }
      
      // Generate a signed URL for the thumbnail (60 minutes)
      const { data: thumbUrlData, error: thumbUrlError } = await supabase.storage
        .from('collages')
        .createSignedUrl(thumbnailKey, 3600);
        
      if (thumbUrlError) {
        // Clean up both uploads if URL generation fails
        await supabase.storage.from('collages').remove([storageKey, thumbnailKey]);
        console.error('Error creating thumbnail URL:', thumbUrlError);
        throw thumbUrlError;
      }
      
      // Save to database with storage keys instead of data URLs
      const { data, error } = await supabase
        .from('saved_collages')
        .insert({
          id: collageId,
          user_id: session.user.id,
          title: title,
          storage_key: storageKey,
          thumbnail_url: thumbUrlData.signedUrl,
          template_key: templateInfo.templateKey || 'unknown',
          template_params: templateInfo.params || {}
        });
        
      if (error) {
        // Clean up storage if database insert fails
        await supabase.storage.from('collages').remove([storageKey, thumbnailKey]);
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
        
        // Auto-hide the success message after 2.5 seconds
        setTimeout(() => {
          setSaveState('idle');
        }, 2500);
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
      // Don't show gallery on sign in - stay on main app
      // Clear any URL params that might trigger navigation
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Immediately fetch collections for the signed-in user
      console.log('[Auth] User signed in, fetching collections immediately');
      await fetchUserCollectionsForSelect();
    
      // Check if user has any collections, if not create a default one
      const supabase = getSupabase();
      const { data: collections, error: fetchError } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', newSession.user.id)
        .limit(1);
        
      if (!fetchError && (!collections || collections.length === 0)) {
        console.log('[Auth] Creating default collection for new user');
        // Create in user_collections only
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
          
          // Refresh the collections list to include the new collection
          await fetchUserCollectionsForSelect();
          
          // Keep Emily's Treasures selected, but show upload modal with new collection preselected
          setUploadCollectionId(newUserCollection.id);
          setShowUpload(true);
          
          // Show welcome tooltip for new users if they haven't seen it
          if (localStorage.getItem('hasSeenWelcome') !== 'true') {
            setTimeout(() => setShowWelcomeTooltip(true), 1000);
          }
        }
      } else {
        // User already has collections, just refresh the list
        console.log('[Auth] User has existing collections, refreshing list');
        await fetchUserCollectionsForSelect();
        
        // Show welcome tooltip for returning users if they haven't seen it
        if (localStorage.getItem('hasSeenWelcome') !== 'true') {
          setTimeout(() => setShowWelcomeTooltip(true), 1000);
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

            
            <button 
              id="saveButton" 
              onClick={session ? handleSave : (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Show toast message when not authenticated
                const existingToast = document.querySelector('.toast-message');
                if (existingToast) existingToast.remove();
                
                const toast = document.createElement('div');
                toast.className = 'toast-message';
                toast.textContent = 'Sign in to save collages';
                toast.style.cssText = `
                  position: fixed;
                  top: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: white;
                  color: #333;
                  padding: 12px 24px;
                  border-radius: 4px;
                  border: 1px solid #333;
                  font-family: 'Space Mono', monospace;
                  font-size: 14px;
                  z-index: 10000;
                  animation: slideDown 0.3s ease-out;
                  pointer-events: none;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                `;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
              }} 
              className="save-btn" 
              disabled={!session || saveState === 'saving'}
              style={{
                opacity: !session ? 0.5 : 1,
                cursor: !session ? 'not-allowed' : 'pointer'
              }}
            >
              {saveState === 'saving' ? (
                <div className="save-spinner"></div>
              ) : (
                <BookmarkSimple size={16} weight="regular" />
              )}
            </button>
            
            <button id="generateButton" onClick={handleShiftPerspective}>New</button>
            
            {/* Tune button for collage settings */}
            <button 
              id="tuneButton" 
              onClick={() => setShowMakeDrawer(true)}
              title="Tune collage settings (Shift+T)"
              className="desktop-only"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #333',
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Pencil size={16} weight="regular" />
              <span>Tune</span>
            </button>
            
            {/* Three-dot menu for mobile */}
            <button 
              className="mobile-only"
              onClick={() => setShowMakeDrawer(true)}
              title="Tune collage settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #333',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ⋯
            </button>
            
            {/* Removed Source Selector - now handled in MakeDrawer */}
            
            {/* Empty placeholder for spacing */}
            <div style={{ flex: 1 }}></div>
            
            {/* User menu/Sign in - aligned to far right */}
            {authLoading ? (
              <div className="auth-loading">Loading...</div>
            ) : session ? (
              <div className="user-menu" style={{ marginLeft: '0.5rem', position: 'relative' }}>
                <button className="user-btn" onClick={(e) => {
                  e.currentTarget.nextElementSibling.classList.toggle('show');
                  // Hide welcome tooltip when dropdown is opened
                  setShowWelcomeTooltip(false);
                }}>
                  <User size={16} weight="regular" />
                  <CaretDown size={12} weight="regular" />
                </button>
                <div className="user-dropdown">
                  <div className="user-email-header">{session.user.email}</div>
                  <button 
                    onClick={() => {
                      setShowDrawer(true);
                      // Close the dropdown
                      const userDropdown = document.querySelector('.user-menu .user-dropdown');
                      if (userDropdown) userDropdown.classList.remove('show');
                    }}
                    className="dropdown-item"
                  >
                    My Images
                  </button>
                  <button 
                    onClick={() => {
                      setShowGallery(true);
                      // Close the dropdown
                      const userDropdown = document.querySelector('.user-menu .user-dropdown');
                      if (userDropdown) userDropdown.classList.remove('show');
                    }}
                    className="dropdown-item"
                  >
                    Saved Collages
                  </button>
                  <button 
                    onClick={() => {
                      setShowUpload(true);
                      // Close the dropdown
                      const userDropdown = document.querySelector('.user-menu .user-dropdown');
                      if (userDropdown) userDropdown.classList.remove('show');
                    }}
                    className="dropdown-item"
                  >
                    Upload Images
                  </button>
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
                
                {/* Welcome tooltip */}
                {showWelcomeTooltip && (
                  <WelcomeTooltip 
                    onDismiss={() => setShowWelcomeTooltip(false)}
                  />
                )}
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="sign-in-btn">
                Sign In
              </button>
            )}
          </div>
            
          {/* Mobile menu button - visible only on mobile */}
          <button className="mobile-menu-btn mobile-only" onClick={(e) => {
            document.querySelector('.mobile-menu-overlay').classList.toggle('show');
            document.querySelector('.mobile-menu-panel').classList.toggle('show');
          }}>
            <User size={24} weight="regular" />
          </button>
        </div>
      </header>

      {/* Mobile floating action buttons */}
      <div className={`mobile-actions mobile-only ${showMakeDrawer ? 'hidden' : ''}`}>
        <button onClick={(e) => {
          console.log('[Mobile] New button clicked');
          handleShiftPerspective();
        }} className="mobile-new-btn" title="New Collage">
          New
        </button>
        
        {/* Mobile Tune button - integrated into mobile-actions container */}
        <button 
          onClick={() => setShowMakeDrawer(true)}
          className="mobile-tune-btn" 
          title="Tune collage settings"
        >
          <Pencil size={20} weight="regular" />
        </button>
        
        <button onClick={(e) => {
          console.log('[Mobile] Save button clicked');
          if (session) {
            handleSave();
          } else {
            setShowAuth(true);
          }
        }} className="mobile-save-btn" title="Save" disabled={session && saveState === 'saving'}>
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
      
      {/* Simplified Mobile menu panel - User account only */}
      <div className="mobile-menu-panel">
        <button className="mobile-menu-close" onClick={() => {
          document.querySelector('.mobile-menu-overlay').classList.remove('show');
          document.querySelector('.mobile-menu-panel').classList.remove('show');
        }}>×</button>
        
        {/* User menu for mobile */}
        {session ? (
          <div className="mobile-menu-section">
            <div className="mobile-menu-label">{session.user.email}</div>
            <button 
              onClick={() => {
                setShowDrawer(true);
                document.querySelector('.mobile-menu-overlay').classList.remove('show');
                document.querySelector('.mobile-menu-panel').classList.remove('show');
              }}
              className="mobile-menu-item"
            >
              My Images
            </button>
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
              onClick={() => {
                setShowUpload(true);
                document.querySelector('.mobile-menu-overlay').classList.remove('show');
                document.querySelector('.mobile-menu-panel').classList.remove('show');
              }}
              className="mobile-menu-item"
            >
              Upload Images
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
        ) : (
          /* Sign in for non-authenticated users */
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
                background: '#333',
                color: 'white',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              Sign In
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
                <div className="save-overlay-inner">
                  <p>Saving your collage...</p>
                </div>
              )}
              {saveState === 'saved' && (
                <div className="save-overlay-inner">
                  <div className="save-success-icon">
                    <Check size={48} weight="bold" style={{ color: 'inherit' }} />
                  </div>
                  <p>Collage saved successfully!</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.5rem 0 0 0' }}>
                    View it anytime in "My Collages" from the user menu
                  </p>
                </div>
              )}
              {saveState === 'error' && (
                <div className="save-overlay-inner">
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
                </div>
              )}
            </div>
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
        onClose={() => {
          setShowUpload(false);
          setUploadCollectionId(null); // Clear the collection ID
        }} 
        collectionId={uploadCollectionId || (activeCollection === 'cms' ? null : activeCollection)}
        onUploadComplete={async (results) => {
          // Close the upload modal immediately
          setShowUpload(false);
          setUploadCollectionId(null); // Clear the collection ID
          
          // If we uploaded to a collection, switch to it and refresh
          if (results && results.length > 0) {
            const uploadedCollectionId = results[0].user_collection_id;
            console.log(`[MainApp] Upload complete to collection ${uploadedCollectionId} with ${results.length} new images`);
            
            // Wait a bit longer to ensure database propagation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Switch to the uploaded collection and refresh it
            setActiveCollection(uploadedCollectionId);
            await serviceRef.current.reinitialize(uploadedCollectionId);
            console.log(`[MainApp] Collection refreshed, now has ${serviceRef.current.imageMetadata.length} images`);
            
            // Generate a new collage with the uploaded images
            if (serviceRef.current.imageMetadata.length > 0) {
              await serviceRef.current.generateCollage();
            }
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
        onNewCollectionCreated={(newCollectionId) => {
          // When a new collection is created, open upload modal with that collection selected
          console.log('[App] New collection created:', newCollectionId);
          setUploadCollectionId(newCollectionId);
          setShowUpload(true);
          // Don't close the drawer yet - let the user see their new collection
        }}
      />
      
      {/* Make Drawer */}
      <MakeDrawer 
        isOpen={showMakeDrawer} 
        onClose={() => setShowMakeDrawer(false)}
        onApplyAndClose={() => {
          // Regenerate collage with current settings and close drawer
          if (serviceRef.current) {
            serviceRef.current.generateCollage();
          }
          setShowMakeDrawer(false);
        }}
        activeCollection={activeCollection}
        activeCollectionName={activeCollectionName}
        onSourceChange={handleSourceChange}
        onManageCollections={() => setShowDrawer(true)}
        onUploadImages={() => setShowUpload(true)}
        onOpenGallery={() => setShowGallery(true)}
        userCollections={userCollectionsForSelect}
        onDrawerOpen={async () => {
          // Refresh collections when drawer opens to ensure we have the latest data
          if (session) {
            console.log('[MakeDrawer] Refreshing collections on drawer open');
            await fetchUserCollectionsForSelect();
          }
        }}
      />
      

      
      {/* Quota Modal */}
      {showQuotaModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
            style={{
              backgroundColor: '#ffffff',
              color: '#333333',
              fontFamily: 'Space Mono, monospace'
            }}
          >
            <h2 className="text-xl font-bold mb-4">
              {quotaModalType === 'collages' ? 'Collage Limit Reached' : 'Image Limit Reached'}
            </h2>
            <p className="mb-6">
              {quotaModalType === 'collages' 
                ? "You've reached your limit of 30 saved collages. To save a new collage, you can download and archive your oldest collages to make room for new ones."
                : "You've reached your limit of 100 active images. To upload more images, you can archive your oldest images."
              }
            </p>
            
            <div className="flex gap-3">
              {quotaModalType === 'collages' ? (
                <button
                  onClick={async () => {
                    setShowQuotaModal(false);
                    try {
                      const archivedCount = await downloadAndArchiveOldestCollages(10);
                      alert(`Successfully archived ${archivedCount} collages. You can now save new collages.`);
                    } catch (error) {
                      alert('Failed to archive collages. Please try again.');
                    }
                  }}
                  disabled={quotaLoading}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  style={{
                    backgroundColor: '#333333',
                    color: '#ffffff',
                    border: 'none',
                    cursor: quotaLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {quotaLoading ? 'Archiving...' : 'Download & Archive 10 oldest'}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    setShowQuotaModal(false);
                    try {
                      const archivedCount = await archiveOldestImages(10);
                      alert(`Successfully archived ${archivedCount} images. You can now upload more.`);
                    } catch (error) {
                      alert('Failed to archive images. Please try again.');
                    }
                  }}
                  disabled={quotaLoading}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  style={{
                    backgroundColor: '#333333',
                    color: '#ffffff',
                    border: 'none',
                    cursor: quotaLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {quotaLoading ? 'Archiving...' : 'Archive oldest 10 images'}
                </button>
              )}
              
              <button
                onClick={() => setShowQuotaModal(false)}
                className="flex-1 px-4 py-2 border border-gray-800 rounded hover:bg-gray-100"
                style={{
                  backgroundColor: 'transparent',
                  color: '#333333',
                  border: '1px solid #333333',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
        <Route path="/collections/:id" element={<CollectionDetail />} />
      </Routes>
    </Router>
  );
} 