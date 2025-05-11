import React, { useEffect, useRef, useState, useCallback } from 'react';
import templates from '../templates';
console.log('TEMPLATES:', templates);
import { CollageService } from '../core/CollageService';
import { validateTemplate, getAvailableMasks } from '../core/TemplateValidator';
import { extendCollageService, initCollageServiceExtensions } from '../core/CollageServiceExtensions';
import { useImages } from '../hooks/useImages';

// Find the first React-based template (with a .component property)
const defaultTemplate = templates[0];

export function TemplateReview() {
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [images, setImages] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [availableMasks, setAvailableMasks] = useState({});
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [params, setParams] = useState({});
  const canvasRef = useRef(null);
  const collageServiceRef = useRef(null);

  // Fetch metadata from Supabase
  const { images: metaImages } = useImages();

  // Initialize CollageService once when canvas available (all non-component templates now)
  useEffect(() => {
    if (!canvasRef.current) return;
    if (collageServiceRef.current) return; // Prevent double init

    collageServiceRef.current = new CollageService(canvasRef.current, {
      initCrystals: false,
      initPaper: false,
      initPromptPlanner: false,
      initLegacy: false
    });
    
    // Extend CollageService with template parameterization
    extendCollageService(CollageService);
    initCollageServiceExtensions();
    
    // When the Supabase metadata arrives, load actual Image elements
    if (metaImages && metaImages.length) {
      const preload = async () => {
        const loaded = await Promise.all(
          metaImages.map((meta) => new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = meta.src;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
          }))
        );
        setImages(loaded.filter(Boolean));
      };
      preload();
    }

    // Get available masks
    setAvailableMasks(getAvailableMasks());

    collageServiceRef.current.resizeCanvas();

    const handleResize = () => collageServiceRef.current && collageServiceRef.current.resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef.current, metaImages]);

  // Initialize params when template changes
  useEffect(() => {
    if (!selectedTemplate) return;

    const initialParams = {};
    if (selectedTemplate.params) {
      Object.entries(selectedTemplate.params).forEach(([key, schema]) => {
        initialParams[key] = schema.default;
      });
    }
    setParams(initialParams);
    setCurrentTemplate(selectedTemplate);
  }, [selectedTemplate]);

  // Validate and render template (legacy only)
  const validateAndRenderTemplate = useCallback(() => {
    if (!selectedTemplate || !collageServiceRef.current || images.length === 0) return;

    let isLegacyPlacementTemplate = Array.isArray(selectedTemplate.placements) && selectedTemplate.placements.length > 0;

    let result = { valid: true };
    if (isLegacyPlacementTemplate) {
      result = validateTemplate(selectedTemplate);
    setValidationResult(result);
    }
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (result.valid) {
      collageServiceRef.current.renderTemplate(selectedTemplate.key, params);
    } else {
      ctx.fillStyle = '#ffeeee';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = '#ff0000';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Template validation failed', canvasRef.current.width / 2, canvasRef.current.height / 2);
      ctx.font = '16px sans-serif';
      ctx.fillText('Check console for details', canvasRef.current.width / 2, canvasRef.current.height / 2 + 30);
      
      console.error('Template validation failed:', result.errorMessages);
    }
  }, [selectedTemplate, images, params]);

  // Run validation and rendering when params change (legacy only)
  useEffect(() => {
    validateAndRenderTemplate();
  }, [validateAndRenderTemplate]);

  const handleParamChange = (paramName, value) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const renderParamControl = (paramName, schema) => {
    const wrapperStyle = { marginBottom: 8, display: 'flex', flexDirection: 'column' };
    if (schema.type === 'number') {
      return (
        <div key={`param-${paramName}`} className="param-control" style={wrapperStyle}>
          <label>{paramName}</label>
          <input
            type="number"
            min={schema.min}
            max={schema.max}
            step={schema.step || 1}
            value={params[paramName]}
            onChange={(e) => handleParamChange(paramName, Number(e.target.value))}
          />
        </div>
      );
    } else if (schema.type === 'select') {
      return (
        <div key={`param-${paramName}`} className="param-control" style={wrapperStyle}>
          <label>{paramName}</label>
          <select
            value={params[paramName]}
            onChange={(e) => handleParamChange(paramName, e.target.value)}
          >
            {schema.options.map(option => (
              <option key={`option-${option}`} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    } else if (schema.type === 'boolean') {
      return (
        <div key={`param-${paramName}`} className="param-control" style={wrapperStyle}>
          <label>
            <input
              type="checkbox"
              checked={params[paramName]}
              onChange={(e) => handleParamChange(paramName, e.target.checked)}
            />
            {paramName}
          </label>
        </div>
      );
    } else if (schema.type === 'color') {
      return (
        <div key={`param-${paramName}`} className="param-control" style={wrapperStyle}>
          <label>{paramName}</label>
          <input
            type="color"
            value={params[paramName]}
            onChange={(e) => handleParamChange(paramName, e.target.value)}
          />
        </div>
      );
    }
    return null;
  };

  // Function to generate a new random version of the current template (legacy only)
  const generateRandomVersion = () => {
    if (!selectedTemplate || !collageServiceRef.current) return;
    // Use the new randomization function
    const randomized = collageServiceRef.current.drawRandomizedTemplate(selectedTemplate);
    setCurrentTemplate(randomized);
  };

  // Function to record feedback (legacy only)
  const recordFeedback = (isPositive) => {
    if (!collageServiceRef.current || !currentTemplate) return;
    // Record feedback in CollageService
    const count = collageServiceRef.current.recordTemplateFeedback(currentTemplate, isPositive);
    // Add to local state for display
    const feedback = {
      templateKey: currentTemplate.key,
      timestamp: new Date().toISOString(),
      isPositive,
      template: { ...currentTemplate } // Store a copy of the template
    };
    // Add to history
    setFeedbackHistory(prevHistory => [feedback, ...prevHistory]);
    // Generate a new random version
    generateRandomVersion();
  };

  // Function to download feedback history (legacy only)
  const downloadFeedbackHistory = () => {
    if (collageServiceRef.current) {
      collageServiceRef.current.downloadFeedbackHistory();
    }
  };

  // Keep CollageService images in sync with state
  useEffect(() => {
    if (collageServiceRef.current) {
      collageServiceRef.current.images = images;
    }
  }, [images]);

  return (
    <div className="template-review">
      {/* Global nav placeholder */}
      <nav className="global-nav" style={{ width: '100%', padding: '1rem', background: '#fff', borderBottom: '1px solid #eee', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 20 }}>Assemblage Template Review</span>
      </nav>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <div className="controls" style={{ minWidth: 320, maxWidth: 400, padding: 24, borderRight: '1px solid #eee', background: '#fafafa', overflowY: 'auto' }}>
        <h2>Template Review</h2>
        <select 
          value={selectedTemplate?.key}
          onChange={(e) => {
            const template = templates.find(t => t.key === e.target.value);
            setSelectedTemplate(template);
          }}
        >
          {templates.map(template => (
            <option key={`template-${template.key}`} value={template.key}>{template.name}</option>
          ))}
        </select>
        {selectedTemplate?.params && (
          <div className="params">
              {Object.entries(selectedTemplate.params).map(([paramName, schema]) => {
                // Hide swapPct / rotatePct / revealPct depending on current operation
                if (selectedTemplate.key === 'scrambledMosaic') {
                  const op = params.operation;
                  if (paramName === 'swapPct' && op !== 'swap') return null;
                  if (paramName === 'rotatePct' && op !== 'rotate') return null;
                  if (paramName === 'revealPct' && op !== 'reveal') return null;
                }
                return renderParamControl(paramName, schema);
              })}
            </div>
          )}
          {/* Feedback / validation controls */}
          <div className="feedback-controls">
            <button onClick={() => recordFeedback(true)}>👍 Good</button>
            <button onClick={() => recordFeedback(false)}>👎 Needs Work</button>
            <button onClick={downloadFeedbackHistory}>Download Feedback</button>
            <button onClick={() => setShowValidationDetails(v => !v)}>
              {showValidationDetails ? 'Hide' : 'Show'} Validation Details
            </button>
          </div>
          {/* Show validation details for legacy templates */}
          {showValidationDetails && validationResult && (
            <div className="validation-details">
              <h4>Validation Details</h4>
              <pre>{JSON.stringify(validationResult, null, 2)}</pre>
            </div>
          )}
          {/* Feedback history display for legacy templates */}
          {feedbackHistory.length > 0 && (
            <div className="feedback-history">
              <h4>Feedback History</h4>
              <ul>
                {feedbackHistory.map((item, idx) => (
                  <li key={idx}>
                    {item.timestamp}: {item.templateKey} - {item.isPositive ? '👍' : '👎'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="preview-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', overflowY: 'auto' }}>
        <canvas 
          ref={canvasRef}
            style={{ border: '1px solid #ccc', background: '#fff' }}
          width={800}
          height={600}
        />
      </div>
      </div>
    </div>
  );
}

export default TemplateReview;
