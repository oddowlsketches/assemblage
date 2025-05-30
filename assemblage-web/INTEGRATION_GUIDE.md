# Integration Guide for User Collections UI

## Overview
The new UI components have been added to your project. Here's how to integrate them into your existing App.jsx:

## Components Added

1. **UploadModal** - For uploading images to collections
2. **CollectionDrawer** - For managing user collections
3. **SourceSelector** - For switching between CMS library and user collections

## Integration Steps

### 1. Import the New Components

Add to the top of your App.jsx:

```jsx
import { UploadModal, CollectionDrawer, SourceSelector } from './components';
```

### 2. Add State Variables

Add these state variables to your MainApp component:

```jsx
const [showUploadModal, setShowUploadModal] = useState(false);
const [showCollectionDrawer, setShowCollectionDrawer] = useState(false);
const [activeSource, setActiveSource] = useState('cms'); // 'cms' or collection ID
const [activeCollectionId, setActiveCollectionId] = useState(null);
```

### 3. Replace Collection Dropdown with SourceSelector

Replace the existing collection dropdown (in the settings menu) with:

```jsx
<SourceSelector
  activeSource={activeSource}
  onSourceChange={(sourceId) => {
    setActiveSource(sourceId);
    if (sourceId === 'cms') {
      // Load CMS images
      handleCollectionChange({ target: { value: selectedCollection } });
    } else {
      // Load user collection images
      setActiveCollectionId(sourceId);
      handleCollectionChange({ target: { value: sourceId } });
    }
  }}
  onManageCollections={() => setShowCollectionDrawer(true)}
/>
```

### 4. Add Upload Button

Add an upload button when a user collection is selected:

```jsx
{activeSource !== 'cms' && (
  <button 
    onClick={() => setShowUploadModal(true)}
    className="upload-btn"
    style={{ marginLeft: '0.5rem' }}
  >
    Upload
  </button>
)}
```

### 5. Add Modal Components

Add these at the bottom of your JSX, before the closing div:

```jsx
{/* Upload Modal */}
<UploadModal
  isOpen={showUploadModal}
  onClose={() => setShowUploadModal(false)}
  collectionId={activeCollectionId}
  onUploadComplete={(uploadedImages) => {
    console.log('Images uploaded:', uploadedImages);
    // Refresh the collection
    if (serviceRef.current) {
      serviceRef.current.reinitialize(activeCollectionId);
    }
  }}
/>

{/* Collection Drawer */}
<CollectionDrawer
  isOpen={showCollectionDrawer}
  onClose={() => setShowCollectionDrawer(false)}
  activeCollectionId={activeCollectionId}
  onCollectionSelect={(collectionId) => {
    setActiveCollectionId(collectionId);
    setActiveSource(collectionId);
    // Load the selected collection
    handleCollectionChange({ target: { value: collectionId } });
  }}
/>
```

### 6. Update loadImagesForCollection

Modify your `loadImagesForCollection` function to handle user collections:

```jsx
const loadImagesForCollection = async (collectionId) => {
  if (!serviceRef.current) return;
  
  setIsLoading(true);
  try {
    console.log(`[MainApp] Loading images for collection: ${collectionId}`);
    
    // Check if it's a user collection or CMS collection
    const isUserCollection = collectionId !== selectedCollection && activeSource !== 'cms';
    
    if (isUserCollection) {
      // Load from user_collections table
      await serviceRef.current.loadUserCollection(collectionId);
    } else {
      // Load from image_collections table (existing behavior)
      await serviceRef.current.initialize(collectionId);
    }
    
    console.log(`[MainApp] Service initialized with ${serviceRef.current.imageMetadata.length} images`);
    await serviceRef.current.generateCollage();
  } catch (err) {
    console.error('Failed to load images for collection:', err);
  } finally {
    setIsLoading(false);
  }
};
```

## Styling

The components use Tailwind CSS which has been added to your project. Make sure the styles are being loaded by checking that main.jsx includes:

```jsx
import './styles/tailwind.css'
import './styles/dark-mode.css'
```

## Environment Variables

Make sure your `.env` file includes:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

1. Run `npm run dev` and check that the app loads without errors
2. Look for the new "Manage Collections..." option in the source selector
3. Create a new collection and try uploading images
4. Switch between CMS library and user collections

## Notes

- User collections are separate from the admin collections in `image_collections` table
- Each user can only see their own collections
- Images are uploaded to the `user-images` storage bucket
- The upload hook validates file types (JPEG/PNG only) and sizes (max 10MB)
