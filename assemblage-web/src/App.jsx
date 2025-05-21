import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { CollageService } from './core/CollageService';
import './styles/legacy-app.css';
import { getMaskDescriptor } from './masks/maskRegistry';
import TemplateReview from './components/TemplateReview';
import { getSupabase } from './supabaseClient';

function MainApp() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const cvs = canvasRef.current;
    const resize = () => {
      serviceRef.current?.resizeCanvas();
    };
    window.addEventListener('resize', resize);

    // Initialize collage service and wire up loading events
    const supabase = getSupabase();
    if (!serviceRef.current) {
      serviceRef.current = new CollageService(cvs, { supabaseClient: supabase });
      resize();
    }
    serviceRef.current.events.on('imagesLoadingStart', () => setIsLoading(true));
    serviceRef.current.events.on('imageLoaded', ({ loaded, total }) => {
      // Optionally update a progress indicator: console.log(`Loaded ${loaded}/${total}`);
    });
    serviceRef.current.events.on('imagesLoaded', () => {
      setIsLoading(false);
      serviceRef.current.generateCollage();
    });
    serviceRef.current.events.on('imagesLoadError', (err) => {
      console.error('Image load error:', err);
      setIsLoading(false);
    });
    // Start loading images; initial collage draw will happen on 'imagesLoaded'
    serviceRef.current.loadImages();

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
  return (
    <Router>
      {/* <nav style={{ padding: '1rem', textAlign: 'center' }}>
        <Link to="/">Main App</Link>
        {' | '}
        <Link to="/dev-review">Template Review (Dev Tool)</Link>
      </nav> */}
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/dev-review" element={<TemplateReview />} />
      </Routes>
    </Router>
  );
} 