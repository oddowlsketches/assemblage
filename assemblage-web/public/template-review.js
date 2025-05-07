// template-review.js
// Template review UI for testing different template modules

// Import directly from public path to avoid module conflicts
import { generateMosaic } from './scrambledMosaic.js';
import { generatePairedForms } from '../src/templates/pairedForms.js';
import { renderTangram, tangramArrangementOptions } from '../src/templates/tangramTemplate.js';

class TemplateReviewer {
  constructor() {
    // DOM elements
    this.templateSelect = document.getElementById('template-select');
    this.canvas = document.getElementById('template-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.controls = document.getElementById('mosaic-controls');
    this.templateInfo = document.querySelector('.template-info');
    
    // Current template
    this.currentTemplate = 'scrambledMosaic';
    
    // Template-specific parameters
    this.templateParams = {
      // Scrambled Mosaic params
      scrambledMosaic: {
        gridSize: 8,
        revealPct: 75,
        pattern: 'random',
        cellShape: 'square',
        operation: 'reveal',
        bgColor: '#FFFFFF',
        useMultiply: true
      },
      // Paired Forms params
      pairedForms: {
        formCount: 3,
        formType: 'rectangular',
        complexity: 0.5,
        alignmentType: 'edge',
        rotation: 0,
        bgColor: '#FFFFFF',
        useMultiply: true
      },
      // Tangram Puzzle params (none for now)
      tangramPuzzle: {}
    };
    
    // Active params reference (points to current template's params)
    this.params = this.templateParams[this.currentTemplate];
    
    // Image collection
    this.images = [];
    
    // Initialize
    this.init();
  }
  
  async init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Populate tangram arrangement selector
    const arrangementSelect = document.getElementById('tangram-arrangement');
    if (arrangementSelect) {
      arrangementSelect.innerHTML = '';
      tangramArrangementOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        arrangementSelect.appendChild(option);
      });
      arrangementSelect.value = '0';
      this.params.arrangementIndex = 0;
      // Initialize pieceImageOrder for tangram
      if (this.currentTemplate === 'tangramPuzzle' || this.params.pieceImageOrder === undefined) {
        this.params.pieceImageOrder = this.shuffleArray([...Array(7).keys()]);
      }
      arrangementSelect.addEventListener('change', (e) => {
        this.params.arrangementIndex = parseInt(e.target.value, 10);
        // Shuffle pieceImageOrder on arrangement change
        this.params.pieceImageOrder = this.shuffleArray([...Array(7).keys()]);
        this.render();
      });
    }
    
    // Load images
    await this.loadImages();
    
    // Initial render
    this.render();
    
    console.log('Template reviewer initialized');
  }
  
  setupEventListeners() {
    // Template selector
    this.templateSelect?.addEventListener('change', (e) => {
      this.switchTemplate(e.target.value);
    });
    
    // Grid size
    document.getElementById('mosaic-gridSize')?.addEventListener('input', (e) => {
      this.params.gridSize = parseInt(e.target.value, 10);
      this.render();
    });
    
    // Reveal percentage
    document.getElementById('mosaic-revealPct')?.addEventListener('input', (e) => {
      this.params.revealPct = parseFloat(e.target.value) * 100;
      document.getElementById('revealPctValue').textContent = `${Math.round(this.params.revealPct)}%`;
      this.render();
    });
    
    // Pattern type
    document.getElementById('mosaic-patternType')?.addEventListener('change', (e) => {
      this.params.pattern = e.target.value;
      this.render();
    });
    
    // Shape type
    document.getElementById('mosaic-shapeType')?.addEventListener('change', (e) => {
      this.params.cellShape = e.target.value;
      this.render();
    });
    
    // Operation
    document.getElementById('mosaic-operation')?.addEventListener('change', (e) => {
      this.params.operation = e.target.value;
      this.updateUILabels();
      this.render();
    });
    
    // Background color
    document.getElementById('mosaic-bgColor')?.addEventListener('input', (e) => {
      this.params.bgColor = e.target.value;
      this.render();
    });
    
    // Multiply blend
    document.getElementById('mosaic-multiply')?.addEventListener('change', (e) => {
      this.params.useMultiply = e.target.checked;
      this.render();
    });
    
    // Paired Forms controls
    document.getElementById('paired-forms-count')?.addEventListener('change', (e) => {
      this.params.formCount = parseInt(e.target.value, 10);
      this.render();
    });
    
    document.getElementById('paired-forms-type')?.addEventListener('change', (e) => {
      this.params.formType = e.target.value;
      this.render();
    });
    
    document.getElementById('paired-forms-complexity')?.addEventListener('input', (e) => {
      this.params.complexity = parseFloat(e.target.value);
      document.getElementById('complexityValue').textContent = this.params.complexity;
      this.render();
    });
    
    document.getElementById('paired-forms-rotation')?.addEventListener('input', (e) => {
      this.params.rotation = parseFloat(e.target.value);
      document.getElementById('rotationValue').textContent = `${this.params.rotation}°`;
      this.render();
    });
    
    document.getElementById('paired-forms-bgColor')?.addEventListener('input', (e) => {
      this.params.bgColor = e.target.value;
      this.render();
    });
    
    document.getElementById('paired-forms-multiply')?.addEventListener('change', (e) => {
      this.params.useMultiply = e.target.checked;
      this.render();
    });
    
    // Generate button
    document.getElementById('generate')?.addEventListener('click', () => {
      this.generateSamples();
    });
    
    // Generate mosaic button
    document.getElementById('generate-mosaic')?.addEventListener('click', () => {
      this.render();
    });
    
    // Feedback buttons
    document.getElementById('thumbs-up')?.addEventListener('click', () => {
      this.saveFeedback(true);
    });
    
    document.getElementById('thumbs-down')?.addEventListener('click', () => {
      this.saveFeedback(false);
    });
    
    // Export feedback button
    document.getElementById('export-feedback')?.addEventListener('click', () => {
      this.exportFeedback();
    });
    
    document.getElementById('tangram-bgColor')?.addEventListener('input', (e) => {
      this.params.bgColor = e.target.value;
      // Shuffle pieceImageOrder on bg color change for variety
      if (this.currentTemplate === 'tangramPuzzle') {
        this.params.pieceImageOrder = this.shuffleArray([...Array(7).keys()]);
      }
      this.render();
    });
  }
  
  updateUILabels() {
    const operation = this.params.operation;
    const percentageLabel = document.getElementById('percentageLabel');
    
    if (percentageLabel) {
      // Change the label text based on the operation
      switch (operation) {
        case 'reveal':
          percentageLabel.firstChild.textContent = 'Reveal %: ';
          break;
        case 'rotate':
          percentageLabel.firstChild.textContent = 'Rotate %: ';
          break;
        case 'swap':
          percentageLabel.firstChild.textContent = 'Swap %: ';
          break;
      }
    }
  }
  
  async loadImages() {
    // List of available collage images
    const COLLAGE_IMAGES = [
      'imgfffd72f0.jpg',
      'imgffe16d35.jpg',
      'imgfeb5027a.jpg',
      'imgff3b21b1.jpg',
      'imgffbc438c.jpg',
      'imgfd68a30c.jpg',
      'imgfa93fdc7.jpg',
      'imgfb3af322.jpg',
      'imgfcd0a7cb.jpg',
      'imgf944368f.jpg'
    ];
    
    // Load all images from the collage list
    const loadedImages = await Promise.all(
      COLLAGE_IMAGES.map(filename => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.warn(`Failed to load image: ${filename}`);
            resolve(null); // Resolve with null instead of rejecting
          };
          img.src = `/images/collages/${filename}`;
        });
      })
    );
    
    // Filter out any failed image loads
    this.images = loadedImages.filter(img => img !== null);
    console.log(`Loaded ${this.images.length} images`);
    
    return this.images;
  }
  
  render() {
    if (!this.canvas || !this.ctx || this.images.length === 0) {
      console.warn('Cannot render: canvas or images not available');
      return;
    }
    
    // Configure the parameters for the current template
    const config = {
      ...this.params,
      useMultiplyBlend: this.params.useMultiply,
      backgroundColor: this.params.bgColor
    };
    
    // Generate based on current template
    if (this.currentTemplate === 'scrambledMosaic') {
      generateMosaic(this.canvas, this.images, config);
    } else if (this.currentTemplate === 'pairedForms') {
      generatePairedForms(this.canvas, this.images, config);
    } else if (this.currentTemplate === 'tangramPuzzle') {
      // Ensure pieceImageOrder exists and is shuffled if needed
      if (!this.params.pieceImageOrder || this.params.pieceImageOrder.length !== 7) {
        this.params.pieceImageOrder = this.shuffleArray([...Array(7).keys()]);
      }
      renderTangram(this.canvas, this.images, config);
    }
  }
  
  generateSamples() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.innerHTML = '';
    
    // Generate 5 samples with slight variations
    for (let i = 0; i < 5; i++) {
      // Create a new canvas for this sample
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 300;
      sampleCanvas.height = 300;
      
      // Create slight variations in parameters
      const variedParams = { ...this.params };
      variedParams.gridSize = Math.max(4, Math.min(16, this.params.gridSize + Math.floor((Math.random() - 0.5) * 2)));
      variedParams.revealPct = Math.max(40, Math.min(90, this.params.revealPct + Math.floor((Math.random() - 0.5) * 10)));
      
      // Generate the mosaic on this canvas
      const config = {
        gridSize: variedParams.gridSize,
        revealPercentage: variedParams.revealPct,
        gridPatternType: variedParams.pattern,
        shapeType: variedParams.cellShape,
        operation: variedParams.operation,
        useMultiplyBlend: variedParams.useMultiply,
        backgroundColor: variedParams.bgColor
      };
      
      generateMosaic(sampleCanvas, this.images, config);
      
      // Create a sample container
      const sample = document.createElement('div');
      sample.className = 'sample';
      sample.appendChild(sampleCanvas);
      
      // Add the sample to the gallery
      gallery.appendChild(sample);
    }
  }
  
  saveFeedback(liked) {
    const feedback = {
      templateKey: 'scrambledMosaic',
      params: { ...this.params },
      liked,
      timestamp: Date.now()
    };
    
    // Get existing feedback
    const storedFeedback = JSON.parse(localStorage.getItem('templateFeedback') || '[]');
    storedFeedback.push(feedback);
    
    // Store feedback in localStorage
    localStorage.setItem('templateFeedback', JSON.stringify(storedFeedback));
    
    // Show notification
    alert(liked ? 'Saved as a liked template' : 'Saved feedback, generating a new variation');
    
    // Generate a new variant if disliked
    if (!liked) {
      this.randomizeParams();
      this.updateUILabels();
      this.updateControls();
      this.render();
    }
  }
  
  exportFeedback() {
    // Get feedback data from localStorage
    const storedFeedback = JSON.parse(localStorage.getItem('templateFeedback') || '[]');
    
    if (storedFeedback.length === 0) {
      alert('No feedback data available to export.');
      return;
    }
    
    // Add summary statistics
    const summary = this.analyzeFeedbackData(storedFeedback);
    
    // Prepare export object with both raw data and summary
    const exportData = {
      exportDate: new Date().toISOString(),
      summary,
      rawFeedback: storedFeedback
    };
    
    // Convert to JSON string with nice formatting
    const dataStr = JSON.stringify(exportData, null, 2);
    
    // Create a data URI
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    // Create a download link and trigger it
    const exportFileName = 'template-feedback-' + new Date().toISOString().slice(0, 10) + '.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    document.body.appendChild(linkElement); // Required for Firefox
    linkElement.click();
    document.body.removeChild(linkElement);
    
    alert(`Exported ${storedFeedback.length} feedback records.`);
  }
  
  analyzeFeedbackData(feedbackData) {
    // Filter for just the scrambled mosaic template
    const templateFeedback = feedbackData.filter(f => f.templateKey === 'scrambledMosaic');
    
    // Split into liked and disliked
    const liked = templateFeedback.filter(f => f.liked);
    const disliked = templateFeedback.filter(f => !f.liked);
    
    // Basic stats
    const summary = {
      totalFeedback: templateFeedback.length,
      likedCount: liked.length,
      dislikedCount: disliked.length,
      likeRatio: templateFeedback.length > 0 ? (liked.length / templateFeedback.length) : 0,
      parameterAnalysis: {}
    };
    
    // Only continue analysis if we have enough data
    if (liked.length === 0) return summary;
    
    // Analyze each parameter
    const paramKeys = ['gridSize', 'revealPct', 'pattern', 'cellShape', 'operation', 'bgColor', 'useMultiply'];
    
    paramKeys.forEach(key => {
      // For numeric parameters
      if (['gridSize', 'revealPct'].includes(key)) {
        const likedValues = liked.map(f => f.params[key]).filter(v => v !== undefined);
        const dislikedValues = disliked.map(f => f.params[key]).filter(v => v !== undefined);
        
        if (likedValues.length > 0) {
          summary.parameterAnalysis[key] = {
            type: 'numeric',
            liked: {
              avg: likedValues.reduce((sum, v) => sum + v, 0) / likedValues.length,
              min: Math.min(...likedValues),
              max: Math.max(...likedValues),
              // Count frequency of each value
              frequency: this.countFrequency(likedValues)
            }
          };
          
          // Add disliked stats if available
          if (dislikedValues.length > 0) {
            summary.parameterAnalysis[key].disliked = {
              avg: dislikedValues.reduce((sum, v) => sum + v, 0) / dislikedValues.length,
              min: Math.min(...dislikedValues),
              max: Math.max(...dislikedValues),
              frequency: this.countFrequency(dislikedValues)
            };
          }
        }
      }
      // For categorical parameters
      else {
        const likedValues = liked.map(f => f.params[key]).filter(v => v !== undefined);
        const dislikedValues = disliked.map(f => f.params[key]).filter(v => v !== undefined);
        
        if (likedValues.length > 0) {
          summary.parameterAnalysis[key] = {
            type: 'categorical',
            liked: {
              // Count frequency of each value
              frequency: this.countFrequency(likedValues)
            }
          };
          
          // Add disliked stats if available
          if (dislikedValues.length > 0) {
            summary.parameterAnalysis[key].disliked = {
              frequency: this.countFrequency(dislikedValues)
            };
          }
        }
      }
    });
    
    return summary;
  }
  
  countFrequency(values) {
    const counts = {};
    values.forEach(value => {
      // For numbers, round to nearest integer to group similar values
      const key = typeof value === 'number' ? Math.round(value) : value;
      counts[key] = (counts[key] || 0) + 1;
    });
    
    // Convert to array and sort by frequency
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  randomizeParams() {
    // Randomize parameters within their valid ranges
    this.params.gridSize = Math.floor(Math.random() * 13) + 4; // 4-16
    this.params.revealPct = Math.floor(Math.random() * 51) + 40; // 40-90
    
    // Random pattern
    const patterns = ['random', 'clustered', 'silhouette', 'portrait'];
    this.params.pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Random shape
    const shapes = ['square', 'rectHorizontal', 'rectVertical', 'circle', 'stripe'];
    this.params.cellShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    // Random operation
    const operations = ['reveal', 'swap', 'rotate'];
    this.params.operation = operations[Math.floor(Math.random() * operations.length)];
    
    // Random background color (pastel)
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
    const lightness = Math.floor(Math.random() * 20) + 70; // 70-90%
    this.params.bgColor = this.hslToHex(hue, saturation, lightness);
    
    // Random blend mode
    this.params.useMultiply = Math.random() > 0.3; // 70% chance of being true
  }
  
  updateControls() {
    const mosaicControls = document.getElementById('mosaic-controls');
    const pairedFormsControls = document.getElementById('paired-forms-controls');
    const tangramControls = document.getElementById('tangram-controls');
    if (this.currentTemplate === 'scrambledMosaic') {
      if (mosaicControls) mosaicControls.style.display = 'block';
      if (pairedFormsControls) pairedFormsControls.style.display = 'none';
      if (tangramControls) tangramControls.style.display = 'none';
    } else if (this.currentTemplate === 'pairedForms') {
      if (mosaicControls) mosaicControls.style.display = 'none';
      if (pairedFormsControls) pairedFormsControls.style.display = 'block';
      if (tangramControls) tangramControls.style.display = 'none';
    } else if (this.currentTemplate === 'tangramPuzzle') {
      if (mosaicControls) mosaicControls.style.display = 'none';
      if (pairedFormsControls) pairedFormsControls.style.display = 'none';
      if (tangramControls) tangramControls.style.display = 'block';
    }
  }
  
  hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  
  switchTemplate(templateName) {
    // Update current template
    this.currentTemplate = templateName;
    // Update active params reference
    this.params = this.templateParams[templateName];
    // Update template info
    const templateInfo = document.querySelector('.template-info');
    if (templateInfo) {
      const title = templateInfo.querySelector('h2');
      const description = templateInfo.querySelector('.template-description');
      if (templateName === 'scrambledMosaic') {
        title.textContent = 'Scrambled Mosaic';
        description.textContent = 'A grid-based arrangement with randomized cell operations. Create collages from a regular grid with various operations and patterns.';
      } else if (templateName === 'pairedForms') {
        title.textContent = 'Paired Forms';
        description.textContent = 'A composition of multiple shapes that come together to form a cohesive abstract composition.';
      } else if (templateName === 'tangramPuzzle') {
        title.textContent = 'Tangram Puzzle';
        description.textContent = 'A tangram puzzle template with 7 geometric pieces that fit together perfectly. Each piece can be filled with a different image or color.';
      }
    }
    // Update controls visibility
    this.updateControls();
    // Re-render
    this.render();
  }
  
  // Utility: Fisher-Yates shuffle
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TemplateReviewer();
});
