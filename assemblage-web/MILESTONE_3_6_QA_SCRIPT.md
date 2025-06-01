# Milestone 3.6 QA Test Script

## Test Environment Setup
- Ensure dev environment is running: `npm run dev`
- Have test user accounts ready (both new and existing)
- Clear browser storage before testing for first-login scenario

## Test Cases

### 1. First Login Guard (Unchanged)
**Steps:**
1. Clear browser storage/cookies
2. Navigate to app
3. Sign in with new account
**Expected:**
- App should function normally
- Default collection should be created
- No regression from previous behavior

### 2. Tune Button & Drawer Functionality

#### Desktop (>768px)
**Steps:**
1. On desktop viewport, look for "Tune" button next to "New" button
2. Click "Tune" button
3. Verify drawer opens from right side
4. Test keyboard shortcut: Press `Shift+T`
5. Click "Apply & Close" button
6. Click outside drawer to close
7. Press `Escape` key to close

**Expected:**
- Tune button displays with slider icon
- Drawer opens as right-side panel with "Collage settings" header
- Default tab = "Image Source"
- Apply & Close regenerates collage and closes drawer
- Shift+T toggles drawer on/off
- Drawer never opens automatically
- ESC key closes drawer

#### Mobile (≤768px)
**Steps:**
1. Switch to mobile viewport
2. Look for three-dot menu icon (⋯) instead of "Tune" button
3. Click three-dot icon
4. Verify bottom sheet opens
5. Test "Apply & Close" functionality

**Expected:**
- Three-dot menu icon visible instead of "Tune" text
- Bottom sheet slides up from bottom
- Same functionality as desktop drawer

### 3. Image Source Dropdown Fixed

**Steps:**
1. Open Tune drawer
2. Focus on Image Source dropdown
3. Use keyboard arrows to navigate options
4. Press Enter to select
5. Tab through the interface
6. Test z-index by opening drawer over other elements

**Expected:**
- Dropdown uses headlessui Listbox
- Proper keyboard navigation (arrows, enter, tab)
- No z-index issues
- Dropdown appears above other elements

### 4. Upload Over Image Cap (30 max)

**Steps:**
1. Upload 30+ images to a collection
2. Attempt to upload one more image

**Expected:**
- Show existing archive-or-manage dialog
- Archive option should work
- After archiving, should be able to upload again

### 5. Save Over Collage Cap (50 max)

**Steps:**
1. Save 50+ collages to account
2. Attempt to save one more collage

**Expected:**
- Modal appears: "You've reached 50 saved collages"
- Two buttons: "Download & Archive oldest 20" and "Cancel"
- Download creates ZIP file with oldest 20 collages
- After download, those 20 collages marked as archived in DB
- Can save new collage after archiving

### 6. Archive Functionality

**Steps:**
1. Trigger collage archive via quota modal
2. Check downloaded ZIP file
3. Verify file naming: `assemblage_collages_archive_YYYY-MM-DD.zip`
4. Extract and verify images named: `YYYY-MM-DD_title_id.png`

**Expected:**
- ZIP downloads automatically
- Contains properly named PNG files
- Database marks collages as archived
- Archived collages don't count toward quota

### 7. Mobile Bottom Sheet

**Steps:**
1. Switch to mobile viewport
2. Test drawer opens as bottom sheet
3. Verify handle at top
4. Test swipe/touch interactions
5. Verify content is accessible

**Expected:**
- Bottom sheet with rounded top corners
- Visual handle indicator
- Max height 70vh
- All functionality preserved

### 8. Keyboard Shortcuts

**Steps:**
1. Focus on app
2. Press `Shift+T`
3. Press `Shift+T` again
4. Test with drawer already open

**Expected:**
- First press opens drawer
- Second press closes drawer
- Works consistently

### 9. Environment Variables

**Steps:**
1. Set `VITE_MAX_ACTIVE_IMAGES=5` in .env
2. Set `VITE_MAX_COLLAGES=3` in .env
3. Restart dev server
4. Test quota limits with new values

**Expected:**
- Quota limits respect environment variables
- Falls back to defaults (30/50) if not set

### 10. Edge Function

**Steps:**
1. Navigate to `/.netlify/functions/archive_cleanup`
2. Check response

**Expected:**
- Returns JSON with cleanup summary
- Status 200
- Function ready for implementation

## Browser Compatibility
Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Performance
- Drawer animations should be smooth (60fps)
- ZIP generation should not block UI
- Quota checks should be fast (<500ms)

## Accessibility
- All buttons have proper focus states
- Drawer can be closed with ESC
- Screen reader compatible
- Keyboard navigation works throughout

## Error Handling
- Test with network offline during save
- Test with invalid quota states
- Test ZIP generation with corrupted images
- Verify error messages are user-friendly 