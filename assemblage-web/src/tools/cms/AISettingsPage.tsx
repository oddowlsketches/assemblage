import React, { useState, useEffect } from 'react';
import { cmsSupabase as supa } from './supabaseClient';
import { FloppyDisk, ArrowCounterClockwise, Info } from 'phosphor-react';

const DEFAULT_PROMPT = `Analyze this collage image. Provide a detailed description of its composition, textures, and artistic elements. Also suggest 5 relevant tags that capture its essence and classify it as either "texture", "narrative", or "conceptual" based on its primary visual nature. Format your response as JSON {"description":string, "tags":string[], "image_role":string}`;

const DEFAULT_ENRICHED_PROMPT = `Analyze this black and white collage/assemblage image in detail.

First, determine if this image contains any recognizable human figures or faces in the foreground or as primary subjects. If yes, classify as "narrative". If the image is primarily abstract patterns, textures, or backgrounds without clear subjects, classify as "texture". If it contains symbolic or metaphorical elements but no clear human subjects, classify as "conceptual".

Provide:
1. A rich, detailed description (2-3 sentences) focusing on composition, visual elements, and artistic qualities
2. 5-8 specific, relevant tags (avoid generic terms)
3. Whether the image is truly black and white or has color elements
4. Whether it appears to be a photograph or an illustration/artwork
5. A score (0-1) for how much white/light edge space the image has

Format your response as JSON:
{
  "description": "detailed description here",
  "tags": ["tag1", "tag2", ...],
  "image_role": "texture|narrative|conceptual",
  "is_black_and_white": true/false,
  "is_photograph": true/false,
  "white_edge_score": 0.0-1.0,
  "palette_suitability": "vibrant|neutral|earthtone|muted|pastel"
}`;

const AISettingsPage: React.FC = () => {
  const [currentPrompt, setCurrentPrompt] = useState(DEFAULT_PROMPT);
  const [enrichedPrompt, setEnrichedPrompt] = useState(DEFAULT_ENRICHED_PROMPT);
  const [isModified, setIsModified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'enriched'>('basic');

  // Load saved prompts from a KV store or settings table
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      // Try to load from kv_store table
      const { data, error } = await supa
        .from('kv_store')
        .select('*')
        .in('key', ['ai_prompt_basic', 'ai_prompt_enriched']);
      
      if (!error && data) {
        data.forEach(item => {
          if (item.key === 'ai_prompt_basic' && item.value) {
            setCurrentPrompt(item.value);
          } else if (item.key === 'ai_prompt_enriched' && item.value) {
            setEnrichedPrompt(item.value);
          }
        });
        
        if (data.length > 0 && data[0].updated_at) {
          setLastSaved(new Date(data[0].updated_at));
        }
      }
    } catch (err) {
      console.error('Error loading prompts:', err);
    }
  };

  const savePrompts = async () => {
    setSaving(true);
    try {
      // Save both prompts
      const updates = [
        {
          key: 'ai_prompt_basic',
          value: currentPrompt,
          updated_at: new Date().toISOString()
        },
        {
          key: 'ai_prompt_enriched',
          value: enrichedPrompt,
          updated_at: new Date().toISOString()
        }
      ];

      for (const update of updates) {
        const { error } = await supa
          .from('kv_store')
          .upsert(update, { onConflict: 'key' });
        
        if (error) {
          throw error;
        }
      }

      setIsModified(false);
      setLastSaved(new Date());
      alert('Prompts saved successfully!');
    } catch (err: any) {
      console.error('Error saving prompts:', err);
      alert('Failed to save prompts: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (activeTab === 'basic') {
      setCurrentPrompt(DEFAULT_PROMPT);
    } else {
      setEnrichedPrompt(DEFAULT_ENRICHED_PROMPT);
    }
    setIsModified(true);
  };

  const handlePromptChange = (value: string) => {
    if (activeTab === 'basic') {
      setCurrentPrompt(value);
    } else {
      setEnrichedPrompt(value);
    }
    setIsModified(true);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">AI Settings</h1>
        <p className="text-gray-600">Configure how AI analyzes and categorizes your images</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How image analysis works:</p>
          <p>When you upload images, they're sent to OpenAI's GPT-4 Vision model with the prompt below. The AI analyzes each image and returns metadata including description, tags, and categorization.</p>
          <p className="mt-2">Modify the prompt to improve accuracy for your specific image collection. Changes will apply to new uploads only.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic Prompt
          </button>
          <button
            onClick={() => setActiveTab('enriched')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enriched'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Enriched Prompt (Recommended)
          </button>
        </nav>
      </div>

      {/* Prompt Editor */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {activeTab === 'basic' ? 'Basic Analysis Prompt' : 'Enriched Analysis Prompt'}
          </label>
          <textarea
            value={activeTab === 'basic' ? currentPrompt : enrichedPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            rows={activeTab === 'enriched' ? 20 : 10}
            className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your prompt here..."
          />
        </div>

        {/* Expected Output Format */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Expected Output Format:</h3>
          <pre className="text-xs text-gray-600 overflow-x-auto">
{activeTab === 'basic' ? 
`{
  "description": "A detailed description of the image...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "image_role": "texture" // or "narrative" or "conceptual"
}` :
`{
  "description": "A rich, detailed description...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "image_role": "narrative", // or "texture" or "conceptual"
  "is_black_and_white": false,
  "is_photograph": true,
  "white_edge_score": 0.15,
  "palette_suitability": "vibrant" // or neutral/earthtone/muted/pastel
}`}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <button
              onClick={savePrompts}
              disabled={!isModified || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FloppyDisk size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowCounterClockwise size={16} />
              Reset to Default
            </button>
          </div>
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleString()}
            </span>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-2">Tips for better results:</h3>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>Be specific about what constitutes "texture" vs "narrative" vs "conceptual" for your collection</li>
            <li>Include examples of the types of tags you want (e.g., specific vs. general)</li>
            <li>Mention if your images have specific characteristics (e.g., "vintage collages", "black and white photos")</li>
            <li>The enriched prompt provides more detailed metadata including color analysis and edge detection</li>
            <li>Test changes on a few images before processing your entire collection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AISettingsPage;
