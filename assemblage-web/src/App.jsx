import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { CollageService } from './core/CollageService';
import './styles/legacy-app.css';
import { getMaskDescriptor } from './masks/maskRegistry';
import TemplateReview from './components/TemplateReview';

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
      <nav style={{ padding: '1rem', textAlign: 'center' }}>
        <Link to="/">Main App</Link>
        {' | '}
        <Link to="/dev-review">Template Review (Dev Tool)</Link>
      </nav>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/dev-review" element={<TemplateReview />} />
      </Routes>
    </Router>
  );
} 