import React, { useState, useRef, useEffect } from 'react';
import { generateMosaic } from '../templates/scrambledMosaic.js';

const TEMPLATE_OPTIONS = [
  { value: 'scrambledMosaic', label: 'Scrambled Mosaic' },
  { value: 'pairedForms', label: 'Paired Forms' },
  { value: 'tilingPatterns', label: 'Tiling Patterns' },
  { value: 'scrambledMosaicDev', label: 'Scrambled Mosaic Dev Harness' },
];

const DEFAULT_MOSAIC_PARAMS = {
  gridSize: 8,
  revealPct: 0.75,
  pattern: 'clustered',
  cellShape: 'square',
  operation: 'reveal',
  bgColor: '#FFFFFF',
  useMultiply: true,
};

export default function TemplateReviewApp() {
  const [selectedTemplate, setSelectedTemplate] = useState('scrambledMosaic');
  const [mosaicParams, setMosaicParams] = useState(DEFAULT_MOSAIC_PARAMS);
  const canvasRef = useRef(null);

  // Placeholder: create a dummy image for demonstration
  const [placeholderImg, setPlaceholderImg] = useState(null);

  useEffect(() => {
    // Create a simple colored image as a placeholder
    const img = new window.Image();
    const size = 800;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = '#bada55';
    ctx.fillRect(0, 0, size, size);
    img.src = tempCanvas.toDataURL();
    img.onload = () => setPlaceholderImg(img);
  }, []);

  useEffect(() => {
    if (selectedTemplate !== 'scrambledMosaic') return;
    if (!canvasRef.current || !placeholderImg) return;
    // TODO: Replace [placeholderImg] with real images array
    generateMosaic(canvasRef.current, [placeholderImg], mosaicParams);
  }, [mosaicParams, selectedTemplate, placeholderImg]);

  // Handlers for Mosaic controls
  const handleMosaicChange = (e) => {
    const { id, value, type, checked } = e.target;
    setMosaicParams((prev) => {
      switch (id) {
        case 'mosaic-gridSize':
          return { ...prev, gridSize: parseInt(value, 10) };
        case 'mosaic-revealPct':
          return { ...prev, revealPct: parseFloat(value) };
        case 'mosaic-patternType':
          return { ...prev, pattern: value };
        case 'mosaic-shapeType':
          return { ...prev, cellShape: value };
        case 'mosaic-operation':
          return { ...prev, operation: value };
        case 'mosaic-bgColor':
          return { ...prev, bgColor: value };
        case 'mosaic-multiply':
          return { ...prev, useMultiply: checked };
        default:
          return prev;
      }
    });
  };

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
  };

  // Render controls panels
  const renderControls = () => {
    switch (selectedTemplate) {
      case 'scrambledMosaic':
        return (
          <div className="controls" id="mosaic-controls">
            <div className="parameter-control">
              <label htmlFor="mosaic-gridSize">Grid Size</label>
              <input
                id="mosaic-gridSize"
                type="number"
                min="4"
                max="16"
                value={mosaicParams.gridSize}
                step="1"
                onChange={handleMosaicChange}
              />
              <div className="description">Number of cells in each dimension</div>
            </div>
            <div className="parameter-control">
              <label id="percentageLabel">Reveal %:</label>
              <div className="number-control">
                <input
                  id="mosaic-revealPct"
                  type="range"
                  min="0.4"
                  max="0.9"
                  step="0.05"
                  value={mosaicParams.revealPct}
                  onChange={handleMosaicChange}
                />
                <span id="revealPctValue">{Math.round(mosaicParams.revealPct * 100)}%</span>
              </div>
              <div className="description">Percentage of cells to show</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="mosaic-patternType">Pattern Type</label>
              <select
                id="mosaic-patternType"
                value={mosaicParams.pattern}
                onChange={handleMosaicChange}
              >
                <option value="random">Random</option>
                <option value="clustered">Clustered</option>
                <option value="silhouette">Silhouette</option>
                <option value="portrait">Portrait</option>
              </select>
              <div className="description">How cells are organized in the grid</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="mosaic-shapeType">Cell Shape</label>
              <select
                id="mosaic-shapeType"
                value={mosaicParams.cellShape}
                onChange={handleMosaicChange}
              >
                <option value="square">Square</option>
                <option value="rectHorizontal">Rect Horizontal</option>
                <option value="rectVertical">Rect Vertical</option>
                <option value="circle">Circle</option>
                <option value="stripe">Stripe</option>
              </select>
              <div className="description">Shape of each visible cell</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="mosaic-operation">Cell Operation</label>
              <select
                id="mosaic-operation"
                value={mosaicParams.operation}
                onChange={handleMosaicChange}
              >
                <option value="reveal">Reveal</option>
                <option value="swap">Swap</option>
                <option value="rotate">Rotate</option>
              </select>
              <div className="description">What to do with each affected cell</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="mosaic-bgColor">Background Color</label>
              <input
                id="mosaic-bgColor"
                type="color"
                value={mosaicParams.bgColor}
                onChange={handleMosaicChange}
              />
              <div className="description">Canvas background color</div>
            </div>
            <div className="parameter-control">
              <div className="checkbox-control">
                <input
                  id="mosaic-multiply"
                  type="checkbox"
                  checked={mosaicParams.useMultiply}
                  onChange={handleMosaicChange}
                />
                <label htmlFor="mosaic-multiply">Multiply Blend</label>
              </div>
              <div className="description">Apply multiply blend mode to cells</div>
            </div>
            <div className="parameter-control">
              <button id="generate-mosaic">Apply Changes</button>
              <button id="generate">Generate Gallery</button>
            </div>
          </div>
        );
      case 'pairedForms':
        return (
          <div className="controls" id="paired-forms-controls">
            <div className="parameter-control">
              <label htmlFor="paired-forms-count">Form Count</label>
              <select id="paired-forms-count">
                <option value="2">2 (Diptych)</option>
                <option value="3">3 (Triptych)</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
              <div className="description">Number of forms in the composition</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="paired-forms-type">Form Type</label>
              <select id="paired-forms-type" defaultValue="mixed">
                <option value="rectangular">Rectangular</option>
                <option value="circular">Circular</option>
                <option value="triangular">Triangular</option>
                <option value="mixed">Mixed</option>
              </select>
              <div className="description">Type of forms in the composition</div>
            </div>
            <div className="parameter-control">
              <button id="generate-paired-forms">Generate Forms</button>
            </div>
          </div>
        );
      case 'tilingPatterns':
        return (
          <div className="controls" id="tiling-patterns-controls">
            <div className="parameter-control">
              <label htmlFor="tiling-patterns-count">Pattern Count</label>
              <select id="tiling-patterns-count">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <div className="description">Number of patterns in the composition</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="tiling-patterns-type">Pattern Type</label>
              <select id="tiling-patterns-type" defaultValue="random">
                <option value="random">Random</option>
                <option value="geometric">Geometric</option>
                <option value="organic">Organic</option>
                <option value="abstract">Abstract</option>
              </select>
              <div className="description">Type of patterns in the composition</div>
            </div>
            <div className="parameter-control">
              <button id="generate-tiling-patterns">Generate Patterns</button>
            </div>
          </div>
        );
      case 'scrambledMosaicDev':
        return (
          <div className="controls" id="scrambled-mosaic-dev-controls">
            <div className="parameter-control">
              <label htmlFor="scrambled-mosaic-dev-gridSize">Grid Size</label>
              <input
                id="scrambled-mosaic-dev-gridSize"
                type="number"
                min="4"
                max="16"
                value={mosaicParams.gridSize}
                step="1"
                onChange={handleMosaicChange}
              />
              <div className="description">Number of cells in each dimension</div>
            </div>
            <div className="parameter-control">
              <label id="percentageLabel">Reveal %:</label>
              <div className="number-control">
                <input
                  id="scrambled-mosaic-dev-revealPct"
                  type="range"
                  min="0.4"
                  max="0.9"
                  step="0.05"
                  value={mosaicParams.revealPct}
                  onChange={handleMosaicChange}
                />
                <span id="scrambled-mosaic-dev-revealPctValue">{Math.round(mosaicParams.revealPct * 100)}%</span>
              </div>
              <div className="description">Percentage of cells to show</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="scrambled-mosaic-dev-patternType">Pattern Type</label>
              <select
                id="scrambled-mosaic-dev-patternType"
                value={mosaicParams.pattern}
                onChange={handleMosaicChange}
              >
                <option value="random">Random</option>
                <option value="clustered">Clustered</option>
                <option value="silhouette">Silhouette</option>
                <option value="portrait">Portrait</option>
              </select>
              <div className="description">How cells are organized in the grid</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="scrambled-mosaic-dev-shapeType">Cell Shape</label>
              <select
                id="scrambled-mosaic-dev-shapeType"
                value={mosaicParams.cellShape}
                onChange={handleMosaicChange}
              >
                <option value="square">Square</option>
                <option value="rectHorizontal">Rect Horizontal</option>
                <option value="rectVertical">Rect Vertical</option>
                <option value="circle">Circle</option>
                <option value="stripe">Stripe</option>
              </select>
              <div className="description">Shape of each visible cell</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="scrambled-mosaic-dev-operation">Cell Operation</label>
              <select
                id="scrambled-mosaic-dev-operation"
                value={mosaicParams.operation}
                onChange={handleMosaicChange}
              >
                <option value="reveal">Reveal</option>
                <option value="swap">Swap</option>
                <option value="rotate">Rotate</option>
              </select>
              <div className="description">What to do with each affected cell</div>
            </div>
            <div className="parameter-control">
              <label htmlFor="scrambled-mosaic-dev-bgColor">Background Color</label>
              <input
                id="scrambled-mosaic-dev-bgColor"
                type="color"
                value={mosaicParams.bgColor}
                onChange={handleMosaicChange}
              />
              <div className="description">Canvas background color</div>
            </div>
            <div className="parameter-control">
              <div className="checkbox-control">
                <input
                  id="scrambled-mosaic-dev-multiply"
                  type="checkbox"
                  checked={mosaicParams.useMultiply}
                  onChange={handleMosaicChange}
                />
                <label htmlFor="scrambled-mosaic-dev-multiply">Multiply Blend</label>
              </div>
              <div className="description">Apply multiply blend mode to cells</div>
            </div>
            <div className="parameter-control">
              <button id="generate-scrambled-mosaic-dev">Apply Changes</button>
              <button id="generate">Generate Gallery</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="template-review-app">
      <div className="template-selector">
        <label htmlFor="template-selector">Select Template:</label>
        <select
          id="template-selector"
          value={selectedTemplate}
          onChange={handleTemplateChange}
        >
          {TEMPLATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} />
      </div>
      {renderControls()}
    </div>
  );
} 