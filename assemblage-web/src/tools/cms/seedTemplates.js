// Simple template seeding utility for production
// This avoids complex imports and just seeds basic template records

import { cmsSupabase as supabase } from './supabaseClient';

// Basic template definitions (hardcoded to avoid import issues)
const basicTemplates = [
  {
    id: 'crystal-template-001',
    key: 'crystal',
    name: 'Crystal Formation',
    family: 'geometric',
    description: 'Creates crystalline patterns with geometric overlays',
    params: {
      variant: { type: 'select', options: ['standard', 'isolated'], default: null },
      complexity: { type: 'number', min: 1, max: 10, default: null },
      density: { type: 'number', min: 1, max: 10, default: null }
    }
  },
  {
    id: 'tiling-template-001',
    key: 'tilingTemplate',
    name: 'Tiling Patterns',
    family: 'geometric',
    description: 'Creates various tiling patterns with images',
    params: {
      patternType: { type: 'select', options: ['squares', 'triangles', 'hexagons'], default: 'squares' },
      tileCount: { type: 'number', min: 4, max: 50, default: 16 }
    }
  },
  {
    id: 'mosaic-template-001',
    key: 'scrambledMosaic',
    name: 'Scrambled Mosaic',
    family: 'organic',
    description: 'Creates organic, scrambled image compositions',
    params: {
      imageCount: { type: 'number', min: 3, max: 15, default: 8 }
    }
  },
  {
    id: 'arch-template-001',
    key: 'dynamicArchitecturalTemplate',
    name: 'Dynamic Architecture',
    family: 'architectural',
    description: 'Creates architectural compositions with geometric forms',
    params: {
      complexity: { type: 'number', min: 1, max: 10, default: 5 }
    }
  },
  {
    id: 'mixed-template-001',
    key: 'mixedMediaTemplate',
    name: 'Mixed Media',
    family: 'experimental',
    description: 'Combines multiple techniques and effects',
    params: {
      blend: { type: 'select', options: ['multiply', 'overlay', 'screen'], default: 'multiply' }
    }
  }
];

export async function seedBasicTemplates() {
  console.log('🌱 Seeding basic templates...');
  
  const results = {
    created: [],
    updated: [],
    errors: []
  };

  for (const template of basicTemplates) {
    try {
      // Check if template already exists
      const { data: existing, error: checkError } = await supabase
        .from('templates')
        .select('id, key')
        .eq('key', template.key)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      if (checkError) {
        throw checkError;
      }

      if (existing) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('templates')
          .update(template)
          .eq('id', existing.id);

        if (updateError) throw updateError;
        
        console.log(`✅ Updated template: ${template.key}`);
        results.updated.push(template.key);
      } else {
        // Create new template
        const { error: insertError } = await supabase
          .from('templates')
          .insert(template);

        if (insertError) throw insertError;
        
        console.log(`🆕 Created template: ${template.key}`);
        results.created.push(template.key);
      }
    } catch (error) {
      console.error(`❌ Error seeding template ${template.key}:`, error);
      results.errors.push({ key: template.key, error: error.message });
    }
  }

  console.log('\n📊 Seed Summary:');
  console.log(`✅ Created: ${results.created.length}`);
  console.log(`🔄 Updated: ${results.updated.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  return results;
}
