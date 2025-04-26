import { useState, useRef, useEffect } from 'react'
import { CollageService } from './core/CollageService'
import './styles/legacy-app.css'

export default function App() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);
  const [effect, setEffect] = useState('crystal');
  const [crystalVariant, setCrystalVariant] = useState('standard');
  const [isLoading, setIsLoading] = useState(true);
  const showDevUI = import.meta.env.MODE === 'development';

  //  ❶ resize canvas to full viewport and draw once on mount
  useEffect(() => {
    console.log('App useEffect running');
    const cvs = canvasRef.current;
    console.log('Canvas ref:', cvs);
    
    const resize = () => {
      cvs.width  = window.innerWidth;
      cvs.height = window.innerHeight - cvs.getBoundingClientRect().top;
      serviceRef.current?.setCanvas(cvs);
    };
    window.addEventListener('resize', resize);
    resize();

    // Initialize the collage service
    const initCollage = async () => {
      try {
        console.log('Initializing collage service');
        setIsLoading(true);
        
        // Create the service if it doesn't exist
        if (!serviceRef.current) {
          console.log('Creating new CollageService');
          serviceRef.current = new CollageService(cvs);
        }
        
        // Set the crystal effect
        console.log('Setting crystal effect');
        serviceRef.current?.setEffect('crystal');
        
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

  const handleShift = () => serviceRef.current?.shiftPerspective();
  const handleSave  = () => serviceRef.current?.saveCollage();
  const handleEffectChange = (newEffect) => {
    setEffect(newEffect);
    serviceRef.current?.setEffect(newEffect);
    serviceRef.current?.generateCollage();
  };

  const handleCrystalVariantChange = (variant) => {
    setCrystalVariant(variant);
    serviceRef.current?.setCrystalVariant(variant);
    serviceRef.current?.generateCollage();
  };

  return (
    <div id="wrapper">
      <header>
        <div className="header-text">
          <h1>Assemblage</h1>
          <p className="tagline">EPHEMERAL VISIONS, ASSEMBLED MEANINGS</p>
        </div>
        <div className="header-controls">
          {showDevUI && (
            <div className="effect-buttons">
              <button 
                className={`effect-button ${effect === 'crystal' ? 'active' : ''}`}
                data-effect="crystal"
                onClick={() => handleEffectChange('crystal')}
              >
                Crystal
              </button>
              {effect === 'crystal' && (
                <>
                  <button 
                    className={`effect-button ${crystalVariant === 'standard' ? 'active' : ''}`}
                    onClick={() => handleCrystalVariantChange('standard')}
                  >
                    Standard
                  </button>
                  <button 
                    className={`effect-button ${crystalVariant === 'isolated' ? 'active' : ''}`}
                    onClick={() => handleCrystalVariantChange('isolated')}
                  >
                    Isolated
                  </button>
                </>
              )}
              <button 
                className={`effect-button ${effect === 'mosaic' ? 'active' : ''}`}
                data-effect="mosaic"
                onClick={() => handleEffectChange('mosaic')}
              >
                Mosaic
              </button>
              <button 
                className={`effect-button ${effect === 'fragments' ? 'active' : ''}`}
                data-effect="fragments"
                onClick={() => handleEffectChange('fragments')}
              >
                Fragments
              </button>
            </div>
          )}
          <div className="action-buttons">
            <button id="generateButton" onClick={handleShift}>Shift Perspective</button>
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