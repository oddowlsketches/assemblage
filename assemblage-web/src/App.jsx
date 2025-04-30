import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react'
import { CollageService } from './core/CollageService'
import './styles/legacy-app.css'
import { maskRegistry } from './masks/maskRegistry';

function MaskReview() {
  // Parameter presets for each mask type
  const paramPresets = {
    // SLICED
    sliceHorizontalWide: [
      { offset: 0, rotation: 0 },
      { offset: -15, rotation: 0 },
      { offset: 15, rotation: 10 },
      { offset: 0, rotation: -15 },
    ],
    sliceHorizontalNarrow: [
      { offset: 0 }, { offset: 10 }, { offset: -10 }, { rotation: 15 }
    ],
    slice3xHorizontal: [
      { spacing: 10, random: false }, { spacing: 20, random: true }
    ],
    sliceVerticalWide: [
      { offset: 0 }, { offset: 10 }, { offset: -10 }, { rotation: 15 }
    ],
    sliceVerticalNarrow: [
      { offset: 0 }, { offset: 10 }, { offset: -10 }, { rotation: -10 }
    ],
    slice4xMixed: [{}],
    sliceAngled: [ { angle: 10 }, { angle: -15 } ],
    // ARCHITECTURAL
    archClassical: [ { height: 80 }, { height: 60, shallow: true }, { height: 90 } ],
    archFlat: [ {} ],
    triptychArch: [ {} ],
    windowRect: [ {} ],
    windowGrid: [ {} ],
    columnPair: [ {} ],
    // ABSTRACT
    blobIrregular: [ { rotation: 0 }, { rotation: 30 }, { rotation: 60 } ],
    blobCrescent: [ {} ],
    polygonSoft: [ { rotation: 0 }, { rotation: 45 } ],
    cloudLike: [ {} ],
    archBlob: [ {} ],
    // ALTAR
    nicheArch: [ {} ],
    nicheCluster: [ {} ],
    circleInset: [ {} ],
    nicheStack: [ {} ],
    // NARRATIVE
    panelRectWide: [ { align: 'center' }, { align: 'top' }, { align: 'bottom' } ],
    panelRectTall: [ { align: 'left' }, { align: 'right' }, { align: 'center' } ],
    panelSquare: [ { align: 'center' }, { align: 'left' }, { align: 'right' }, { align: 'top' }, { align: 'bottom' } ],
    panelOverlap: [ { angle: 10 }, { angle: -10 } ],
    panelLShape: [ {} ],
    panelGutter: [ { margin: 10 }, { margin: 20 } ],
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>SVG Mask System Review</h1>
      {Object.entries(maskRegistry).map(([family, types]) => (
        <div key={family} style={{ marginBottom: '3rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px #0001', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{family}</div>
          {Object.entries(types).map(([type, fn]) => (
            <div key={type}>
              <div style={{ fontSize: '1.1rem', margin: '1.2rem 0 0.5rem 0', color: '#444' }}>{type}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {(paramPresets[type] || [{}]).map((params, i) => (
                  <div key={i} style={{ width: '150px', background: '#f4f4f4', borderRadius: '8px', boxShadow: '0 1px 4px #0001', padding: '1rem 0.5rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '120px', height: '120px', background: '#e0e0e0', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div dangerouslySetInnerHTML={{ __html: fn(params) }} />
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.2rem', textAlign: 'center' }}>{type}</div>
                    <div style={{ color: '#555', fontSize: '0.95rem', textAlign: 'center', wordBreak: 'break-all' }}>
                      {JSON.stringify(params)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MainApp({ canvasRef, serviceRef, isLoading, prompt, handlePromptChange, handleCreateArchitectural, handleShiftPerspective, handleSave }) {
  return (
    <div id="wrapper">
      <header>
        <div className="header-text">
          <h1>Assemblage</h1>
          <p className="tagline">EPHEMERAL VISIONS, ASSEMBLED MEANINGS</p>
        </div>
        <div className="header-controls">
          <div className="prompt-input-container">
            <input 
              id="prompt-input"
              type="text" 
              placeholder="Enter a prompt (e.g., 'architectural')" 
              value={prompt}
              onChange={handlePromptChange}
            />
            <button id="createButton" onClick={handleCreateArchitectural} style={{ marginLeft: 8 }}>Create</button>
          </div>
          <div className="action-buttons">
            <button id="generateButton" onClick={handleShiftPerspective}>Shift Perspective</button>
            <button id="saveButton" onClick={handleSave}>Save Collage</button>
          </div>
        </div>
      </header>

      <div id="canvas-container">
        <canvas ref={canvasRef} id="collageCanvas" />
        {isLoading && <div className="loading">Loading images...</div>}
      </div>

      <footer>
        <p className="copyright">© 2025 Assemblage by Emily Schwartzman. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [showMaskReview, setShowMaskReview] = useState(false);

  useEffect(() => {
    const cvs = canvasRef.current;
    const resize = () => {
      serviceRef.current?.resizeCanvas();
    };
    window.addEventListener('resize', resize);
    
    const initCollage = async () => {
      try {
        setIsLoading(true);
        if (!serviceRef.current) {
          serviceRef.current = new CollageService(cvs);
          resize();
        }
        await serviceRef.current?.loadImages();
        await serviceRef.current?.generateCollage();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize collage service:', error);
        setIsLoading(false);
      }
    };

    initCollage();
    return () => window.removeEventListener('resize', resize);
  }, []);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleShiftPerspective = () => {
    if (serviceRef.current) {
      serviceRef.current.shiftPerspective(prompt);
    }
  };

  const handleCreateArchitectural = () => {
    if (serviceRef.current) {
      serviceRef.current.setEffect('architectural');
      serviceRef.current.generateCollage(prompt);
    }
  };

  const handleSave = () => serviceRef.current?.saveCollage();

  return (
    <div>
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <button 
          onClick={() => setShowMaskReview(!showMaskReview)}
          style={{ 
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: showMaskReview ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showMaskReview ? 'Show Main App' : 'Show Mask Review'}
        </button>
      </div>
      {showMaskReview ? (
        <MaskReview />
      ) : (
        <MainApp
          canvasRef={canvasRef}
          serviceRef={serviceRef}
          isLoading={isLoading}
          prompt={prompt}
          handlePromptChange={handlePromptChange}
          handleCreateArchitectural={handleCreateArchitectural}
          handleShiftPerspective={handleShiftPerspective}
          handleSave={handleSave}
        />
      )}
    </div>
  );
} 