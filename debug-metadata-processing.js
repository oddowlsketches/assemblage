#!/usr/bin/env node

// Simple script to debug metadata processing pipeline
// Run with: node debug-metadata-processing.js

const fetch = require('node-fetch');

async function debugMetadataProcessing() {
  const siteUrl = 'https://magnificent-griffin-3c98d7.netlify.app';
  
  console.log('🔍 Debugging metadata processing pipeline...\n');
  
  try {
    // 1. Trigger the background processor
    console.log('1. Triggering background metadata processor...');
    const bgResponse = await fetch(`${siteUrl}/.netlify/functions/batch-update-metadata-bg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceProcess: true })
    });
    
    console.log(`   Response status: ${bgResponse.status}`);
    if (bgResponse.ok) {
      const bgData = await bgResponse.json();
      console.log(`   Response: ${JSON.stringify(bgData)}`);
    } else {
      const errorText = await bgResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  }
}

debugMetadataProcessing();
