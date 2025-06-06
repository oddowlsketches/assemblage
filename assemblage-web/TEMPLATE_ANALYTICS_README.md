# Template Analytics & Control Feature

## Overview
This feature adds two key capabilities to the Assemblage app:
1. **Template Analytics** - Admin-only view showing template popularity over the last 30 days
2. **Template Selection Control** - User ability to select which templates are included in the rotation

## Database Setup

Run the following SQL script on your Supabase instance:
```bash
# From the cms-foundations branch
sql/analytics/setup_template_analytics.sql
```

This creates:
- `popular_templates_v` - View showing template usage stats for last 30 days
- `get_template_stats()` - RPC function to fetch stats securely

## Features

### 1. Template Analytics (Admin Only)
- **Location**: User dropdown menu → "Template Analytics" (visible only to admin users)
- **URL**: `/admin/analytics`
- **Access**: Restricted to admin emails (configured in `App.jsx`)
- **Features**:
  - Bar chart visualization of template saves
  - Detailed table with save counts and last saved dates
  - Refresh button to update data
  - Responsive design

### 2. Template Selection Control
- **Location**: "Tune" button → Templates tab
- **Features**:
  - Toggle between "All Templates" (default) and "Custom Selection" modes
  - Progressive disclosure - template list hidden by default
  - Pill-button style selection (replaces checkboxes)
  - "Select All" and "Clear All" quick actions
  - Selected templates form a pool for random selection
  - Visual feedback showing selected templates
  - Validation ensuring at least one template is selected
  - Mobile-responsive design

## Implementation Details

### Files Modified/Created:
1. **Database**:
   - `sql/analytics/create_popular_templates_view.sql`
   - `sql/analytics/create_template_stats_function.sql`
   - `sql/analytics/setup_template_analytics.sql` (combined script)

2. **Frontend**:
   - `src/hooks/useTemplateStats.ts` - Hook for fetching template stats
   - `src/pages/admin/Analytics.jsx` - Admin analytics page
   - `src/components/MakeDrawer.jsx` - Updated with Templates tab
   - `src/App.jsx` - Added routes, state management, and admin menu item
   - `src/core/CollageService.js` - Added template pool functionality

### Key Changes:
1. **CollageService** now supports a template pool via `setTemplatePool()`
2. **MakeDrawer** has a new "Templates" tab for selection
3. **App.jsx** manages selected templates state and passes to components
4. **Admin users** see "Template Analytics" in their dropdown menu

## Configuration

### Admin Access
Update the admin email list in `App.jsx`:
```javascript
const adminEmails = ['ecschwar@gmail.com']; // Add your admin emails here
```

## Usage

### For Users:
1. Click the "Tune" button (or ⋯ on mobile)
2. Navigate to the "Templates" tab
3. Select templates you want in the rotation
4. Click "Apply & Close"
5. New collages will randomly use selected templates

### For Admins:
1. Click your user menu
2. Select "Template Analytics"
3. View bar chart and detailed stats
4. Click "Refresh Data" to update

## Testing

1. **Template Selection**:
   - Select 1-3 templates in Tune drawer
   - Generate new collages
   - Verify only selected templates are used

2. **Analytics**:
   - Save several collages with different templates
   - Navigate to /admin/analytics
   - Verify stats display correctly
   - Test with no data (empty state)

## Notes
- Template selection persists during the session
- Analytics show last 30 days of data only
- Admin access is determined by email whitelist
- Mobile UI uses bottom sheet pattern

## Implementation Summary

### Template Control Flow
1. User clicks "Tune" button (or ⋯ on mobile)
2. Navigates to "Templates" tab in MakeDrawer
3. Selects desired templates via checkboxes
4. Clicks "Apply & Close"
5. CollageService.setTemplatePool() updates the pool
6. Next "New" click randomly selects from pool

### Key Architecture Decisions
- **Template Pool**: Stored in CollageService, not individual effect names
- **Random Selection**: Happens at generation time, not at selection time
- **State Management**: Template selection managed in App.jsx
- **Mobile First**: Bottom sheet on mobile, side drawer on desktop

### Future Enhancements
- Persist template selection in localStorage
- Add "Select All" / "Clear All" buttons
- Show preview thumbnails for each template
- Add template usage stats to selection UI
- Allow saving template presets
