# Assemblage Collection Improvements Plan

## Summary of Issues to Fix

1. **Collection name not reflecting in app** - "Emily's Treasures" doesn't show in main app
2. **Public collections not showing** - Need public CMS collections to appear for all users
3. **Multi-select in CMS** - Ability to select multiple images and move between collections
4. **Smart collection organization** - AI-powered grouping suggestions (future feature)

## Immediate Fixes Needed

### 1. Fix Collection Loading in Main App

The main app currently:
- Shows ALL collections to admin users only
- Shows only a hardcoded "Default Collection" to regular users
- Doesn't check the `is_public` flag

We need to change it to:
- Show public collections to ALL users
- Show private collections only to admin users
- Use actual collection names from the database

### 2. Update App.jsx

Replace the `loadCollections` function to:
```javascript
// Load collections from Supabase
const loadCollections = async (adminStatus = null) => {
  const isUserAdmin = adminStatus !== null ? adminStatus : isAdmin;
  
  try {
    const supabase = getSupabase();
    
    if (isUserAdmin) {
      console.log('[loadCollections] Loading as admin user');
      // Admin users can see all collections
      const { data, error } = await supabase
        .from('image_collections')
        .select('id, name, is_public')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setUserCollectionsForSelect(data);
        // Find default collection or first one
        const defaultCollection = data.find(c => c.id === '00000000-0000-0000-0000-000000000001');
        const firstCollectionId = defaultCollection?.id || data[0]?.id;
        setSelectedCollection(firstCollectionId);
        setActiveCollectionName(defaultCollection?.name || data[0]?.name || 'Default Library');
        await loadImagesForCollection('cms');
      }
    } else {
      console.log('[loadCollections] Loading as regular user - fetching public collections');
      // Regular users see public collections
      const { data, error } = await supabase
        .from('image_collections')
        .select('id, name, is_public')
        .eq('is_public', true)
        .order('created_at', { ascending: true });
      
      if (!error && data && data.length > 0) {
        setUserCollectionsForSelect(data);
        const firstCollectionId = data[0].id;
        setSelectedCollection(firstCollectionId);
        setActiveCollectionName(data[0].name);
        await loadImagesForCollection('cms');
      } else {
        // Fallback if no public collections
        console.log('[loadCollections] No public collections found');
        setUserCollectionsForSelect([]);
        await loadImagesForCollection('cms');
      }
    }
  } catch (err) {
    console.error('Error loading collections:', err);
    await loadImagesForCollection('cms');
  }
};
```

### 3. Update Source Selector

Also need to update where it says "Default Library" to use the actual name:
```javascript
// In the useEffect that updates activeCollectionName
useEffect(() => {
  if (activeCollection === 'cms') {
    // Find the default collection name from the loaded collections
    const defaultCollection = userCollectionsForSelect.find(
      c => c.id === '00000000-0000-0000-0000-000000000001'
    );
    setActiveCollectionName(defaultCollection?.name || 'Default Library');
  } else {
    const foundCollection = userCollectionsForSelect.find(col => col.id === activeCollection);
    setActiveCollectionName(foundCollection ? foundCollection.name : 'Unknown Collection');
  }
}, [activeCollection, userCollectionsForSelect]);
```

## Features to Add

### 1. Multi-Select in CMS (Medium Priority)

**Implementation Plan:**
- Add checkbox column to images table
- Add "Select All" checkbox in header
- Show action bar when items selected
- Actions: Move to Collection, Delete Selected
- Use bulk operations API

**UI Components Needed:**
- Checkbox component
- Selection state management
- Bulk action toolbar
- Move dialog with collection picker

### 2. Smart Collection Organization (Future Feature)

**Concept:**
- Analyze image tags and descriptions
- Use clustering algorithms or LLM to suggest groupings
- Present suggestions to user
- Allow one-click creation of suggested collections

**Implementation Ideas:**
- Run analysis on all images in a collection
- Group by:
  - Similar tags (using tag frequency)
  - Theme detection from descriptions
  - Color palette (for non-B&W images)
  - Image role (texture/narrative/conceptual)
- Use OpenAI to suggest collection names

**Example Prompt for Grouping:**
```
Given these image descriptions and tags, suggest 3-5 logical collection groupings:
[list of image data]

For each group, provide:
- Suggested collection name
- Why these images belong together
- List of image IDs for this group
```

## SQL to Fix Immediate Issues

```sql
-- Ensure Emily's Treasures collection is properly marked
UPDATE image_collections 
SET name = 'Emily''s Treasures'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Make sure it's marked as public so regular users can see it
UPDATE image_collections 
SET is_public = true
WHERE id = '00000000-0000-0000-0000-000000000001';
```

## Next Steps

1. **Immediate**: Update App.jsx to properly load public collections
2. **Soon**: Add multi-select functionality to CMS
3. **Future**: Implement smart collection suggestions

The smart collection organization is a great idea that could really help users organize large image libraries. It could be implemented as a "Suggest Collections" button that analyzes the current images and proposes logical groupings.
