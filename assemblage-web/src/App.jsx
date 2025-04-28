import { useState, useRef, useEffect } from 'react'
import { CollageService } from './core/CollageService'
import './styles/legacy-app.css'

export default function App() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const showDevUI = import.meta.env.MODE === 'development';

  //  ❶ resize canvas to full viewport and draw once on mount
  useEffect(() => {
    console.log('App useEffect running');
    const cvs = canvasRef.current;
    console.log('Canvas ref:', cvs);
    
    const resize = () => {
      serviceRef.current?.resizeCanvas();
    };
    window.addEventListener('resize', resize);
    
    // Initialize the collage service
    const initCollage = async () => {
      try {
        console.log('Initializing collage service');
        setIsLoading(true);
        
        // Create the service if it doesn't exist
        if (!serviceRef.current) {
          console.log('Creating new CollageService');
          serviceRef.current = new CollageService(cvs);
          // Call resize after service is created
          resize();
        }
        
        // Load images from the original image library
        console.log('Loading images from library');
        await serviceRef.current?.loadImages();
        
        // Generate the initial collage
        console.log('Generating initial collage');
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

  const handleShift = () => {
    serviceRef.current?.shiftPerspective();
  };
  
  const handleSave = () => serviceRef.current?.saveCollage();
  
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleShiftPerspective = () => {
    if (serviceRef.current) {
      serviceRef.current.shiftPerspective(prompt);
    }
  };

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