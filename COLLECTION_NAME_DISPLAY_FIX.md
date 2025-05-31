# Fix Collection Display Names - Deployment Guide

## Changes Made

1. **SourceSelector Component** - Now accepts and displays the actual collection name
2. **App.jsx** - Passes the activeCollectionName to SourceSelector
3. **Dropdown Label** - Changed from "Select Library" to "Select Image Collection"

## Deploy the Changes

```bash
cd /Users/emilyschwartzman/assemblage-app
git add -A
git commit -m "Fix collection name display and update dropdown label"
git push
```

## What This Fixes

1. **Collection Names** - "Emily's Treasures" (or whatever name you set in the CMS) will now show correctly in the dropdown
2. **Dropdown Label** - Says "Select Image Collection" instead of "Select Library"
3. **Dynamic Updates** - When you change a collection name in the CMS, it will be reflected in the app

## Testing

After deploying:
1. The dropdown should show "Emily's Treasures" instead of "Default Library"
2. The dropdown header should say "Select Image Collection"
3. Any name changes in the CMS should be reflected in the app

## Multi-Select Feature (Future Implementation)

Since you mentioned wanting multi-select in the CMS, here's what that would involve:

### Features:
- Checkbox column in image grid
- "Select All" checkbox in header
- Bulk action toolbar that appears when items are selected
- Actions: Move to Collection, Delete Selected

### Implementation Overview:
1. Add selection state to track selected images
2. Add checkboxes to each image row/card
3. Show action bar with count of selected items
4. Implement bulk operations:
   - Move: Update collection_id for all selected images
   - Delete: Remove selected images with confirmation

Would you like me to start implementing the multi-select feature next?
