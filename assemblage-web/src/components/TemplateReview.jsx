import React, { useEffect, useRef, useState, useCallback } from 'react';
import { templates } from '../templates';
import { CollageService } from '../core/CollageService';
import { validateTemplate, getAvailableMasks } from '../core/TemplateValidator';
import { extendCollageService, initCollageServiceExtensions } from '../core/CollageServiceExtensions';

export function TemplateReview() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [images, setImages] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [availableMasks, setAvailableMasks] = useState({});
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [params, setParams] = useState({});
  const canvasRef = useRef(null);
  const collageServiceRef = useRef(null);

  // Initialize CollageService and load images
  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize CollageService
    collageServiceRef.current = new CollageService(canvasRef.current, {
      initCrystals: false,
      initPaper: false,
      initPromptPlanner: false,
      initLegacy: false
    });
    
    // Extend CollageService with template parameterization
    extendCollageService(CollageService);
    initCollageServiceExtensions();
    
    // Load images
    collageServiceRef.current.loadImages().then(loadedImages => {
      setImages(loadedImages);
    });

    // Get available masks
    setAvailableMasks(getAvailableMasks());
  }, []);

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

  // Validate and render template
  const validateAndRenderTemplate = useCallback(() => {
    if (!selectedTemplate || !collageServiceRef.current || images.length === 0) return;

    const result = validateTemplate(selectedTemplate);
    setValidationResult(result);
    
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

  // Run validation and rendering when params change
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
    if (schema.type === 'number') {
      return (
        <div key={`param-${paramName}`} className="param-control">
          <label>{paramName}</label>
          <input
            type="number"
            min={schema.min}
            max={schema.max}
            value={params[paramName]}
            onChange={(e) => handleParamChange(paramName, Number(e.target.value))}
          />
        </div>
      );
    } else if (schema.type === 'select') {
      return (
        <div key={`param-${paramName}`} className="param-control">
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
        <div key={`param-${paramName}`} className="param-control">
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
    }
    return null;
  };

  // Function to generate a new random version of the current template
  const generateRandomVersion = () => {
    if (!selectedTemplate || !collageServiceRef.current) return;
    
    // Use the new randomization function
    const randomized = collageServiceRef.current.drawRandomizedTemplate(selectedTemplate);
    setCurrentTemplate(randomized);
  };

  // Function to record feedback
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

  // Function to download feedback history
  const downloadFeedbackHistory = () => {
    if (collageServiceRef.current) {
      collageServiceRef.current.downloadFeedbackHistory();
    }
  };

  return (
    <div className="template-review">
      <div className="controls">
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
            {Object.entries(selectedTemplate.params).map(([paramName, schema]) => 
              renderParamControl(paramName, schema)
            )}
          </div>
        )}
        
        <div className="validation-status">
          {validationResult && (
            <div className={`status ${validationResult.valid ? 'valid' : 'invalid'}`}>
              {validationResult.valid ? '✓ Template Valid' : '✗ Template Invalid'}
              
              {!validationResult.valid && (
                <button 
                  className="show-details-btn"
                  onClick={() => setShowValidationDetails(!showValidationDetails)}
                >
                  {showValidationDetails ? 'Hide Details' : 'Show Details'}
                </button>
              )}
            </div>
          )}
          
          {showValidationDetails && validationResult && !validationResult.valid && (
            <div className="validation-details">
              <h4>Validation Errors:</h4>
              <ul>
                {validationResult.errorMessages.map((msg, i) => (
                  <li key={`error-${i}`}>{msg}</li>
                ))}
              </ul>
              
              {validationResult.missingMasks.length > 0 && (
                <>
                  <h4>Missing Masks:</h4>
                  <ul>
                    {validationResult.missingMasks.map((mask, i) => (
                      <li key={i}>{mask}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="action-buttons">
          <button 
            className="action-button" 
            onClick={generateRandomVersion}
            disabled={!validationResult?.valid}
          >
            Generate New Version
          </button>
        </div>
        
        <div className="feedback-controls">
          <button 
            className="feedback-button good" 
            onClick={() => recordFeedback(true)}
            disabled={!validationResult?.valid}
          >
            👍 Good Composition
          </button>
          <button 
            className="feedback-button bad" 
            onClick={() => recordFeedback(false)}
            disabled={!validationResult?.valid}
          >
            👎 Poor Composition
          </button>
        </div>
        
        {feedbackHistory.length > 0 && (
          <div className="feedback-history">
            <h3>Feedback History</h3>
            <p>{feedbackHistory.length} compositions rated</p>
            <button 
              className="action-button" 
              onClick={downloadFeedbackHistory}
            >
              Download Feedback Data
            </button>
            
            <div className="feedback-metrics">
              <h4>Template Metrics</h4>
              {Array.from(new Set(feedbackHistory.map(f => f.templateKey))).map(key => {
                const templateFeedback = feedbackHistory.filter(f => f.templateKey === key);
                const positive = templateFeedback.filter(f => f.isPositive).length;
                const negative = templateFeedback.length - positive;
                const ratio = templateFeedback.length ? (positive / templateFeedback.length * 100).toFixed(0) : 0;
                
                return (
                  <div key={key} className="metric-item">
                    <span className="metric-name">{key}</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-positive" 
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                    <span className="metric-count">{positive}/{templateFeedback.length} ({ratio}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {selectedTemplate && selectedTemplate.description && (
          <div className="template-description">
            <h3>Description</h3>
            <p>{selectedTemplate.description}</p>
          </div>
        )}
        
        <div className="template-info">
          <h3>Current Template: {selectedTemplate.name}</h3>
          <pre>{JSON.stringify(currentTemplate || selectedTemplate, null, 2)}</pre>
        </div>
      </div>

      <div className="canvas-container">
        <canvas 
          ref={canvasRef}
          style={{ border: '1px solid #ccc' }}
          width={800}
          height={600}
        />
      </div>

      <style jsx>{`
        .template-review {
          padding: 20px;
          display: flex;
          gap: 40px;
          max-width: 1800px;
          margin: 0 auto;
          min-height: calc(100vh - 80px);
        }
        .controls {
          width: 300px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          height: fit-content;
          position: sticky;
          top: 20px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .canvas-container {
          flex: 1;
          background: #232323;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 800px;
          overflow: hidden;
        }
        .template-info {
          margin-top: 20px;
        }
        pre {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          font-size: 12px;
          max-height: 400px;
        }
        .validation-status {
          margin-bottom: 16px;
        }
        .status {
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-weight: bold;
        }
        .valid {
          background: #e6ffe6;
          color: #006600;
        }
        .invalid {
          background: #ffe6e6;
          color: #990000;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .show-details-btn {
          background: none;
          border: none;
          color: #990000;
          cursor: pointer;
          text-decoration: underline;
          font-size: 12px;
        }
        .validation-details {
          background: #ffe6e6;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .validation-details h4 {
          margin: 8px 0;
        }
        .validation-details ul {
          margin: 0;
          padding-left: 20px;
        }
        .action-buttons {
          margin-bottom: 16px;
        }
        .action-button {
          width: 100%;
          padding: 10px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 8px;
        }
        .action-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        .feedback-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .feedback-button {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        .feedback-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        .feedback-button.good {
          background: #4CAF50;
          color: white;
        }
        .feedback-button.bad {
          background: #f44336;
          color: white;
        }
        .feedback-history {
          margin-bottom: 16px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        .feedback-history h3 {
          margin-top: 0;
        }
        .metric-item {
          margin-bottom: 8px;
        }
        .metric-name {
          font-weight: bold;
          margin-right: 8px;
        }
        .metric-bar {
          height: 12px;
          background: #ffcccc;
          border-radius: 6px;
          margin: 4px 0;
          overflow: hidden;
        }
        .metric-positive {
          height: 100%;
          background: #66cc66;
        }
        .metric-count {
          font-size: 12px;
          color: #666;
        }
        .template-description {
          margin-bottom: 16px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        .template-description h3 {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .template-description p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
