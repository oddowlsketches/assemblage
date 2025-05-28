// Utility to sync templates from codebase to database
// Run this to populate the templates table with current templates

import { createClient } from '@supabase/supabase-js';
import templateModules from '../templates/index.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function syncTemplatesToDatabase() {
  console.log('🚀 Starting template sync to database...');
  
  const results = {
    created: [],
    updated: [],
    errors: []
  };

  for (const template of templateModules) {
    if (!template || !template.key) {
      console.warn('⚠️ Skipping template without key:', template);
      continue;
    }

    try {
      // Check if template already exists
      const { data: existing, error: checkError } = await supabase
        .from('templates')
        .select('id, key, name, params')
        .eq('key', template.key)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      const templateData = {
        key: template.key,
        name: template.name || template.key,
        family: template.family || 'general',
        description: template.description || `${template.name || template.key} template for generating collages`,
        params: template.params || {}
      };

      if (existing) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
        
        console.log(`✅ Updated template: ${template.key}`);
        results.updated.push(template.key);
      } else {
        // Create new template
        const { error: insertError } = await supabase
          .from('templates')
          .insert(templateData);

        if (insertError) throw insertError;
        
        console.log(`🆕 Created template: ${template.key}`);
        results.created.push(template.key);
      }
    } catch (error) {
      console.error(`❌ Error syncing template ${template.key}:`, error);
      results.errors.push({ key: template.key, error: error.message });
    }
  }

  console.log('\n📊 Sync Summary:');
  console.log(`✅ Created: ${results.created.length}`);
  console.log(`🔄 Updated: ${results.updated.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.created.length > 0) {
    console.log('\n🆕 Created templates:', results.created.join(', '));
  }
  
  if (results.updated.length > 0) {
    console.log('\n🔄 Updated templates:', results.updated.join(', '));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ key, error }) => {
      console.log(`  - ${key}: ${error}`);
    });
  }

  return results;
}

// Auto-run if this file is executed directly
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Make it available in the browser console for manual execution
  window.syncTemplatesToDatabase = syncTemplatesToDatabase;
  console.log('🔧 Template sync utility loaded. Run syncTemplatesToDatabase() in console to sync templates.');
}
