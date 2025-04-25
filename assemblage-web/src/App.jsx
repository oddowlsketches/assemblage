import { useState, useRef, useEffect } from 'react'
import { CollageService } from './core/CollageService'
import './App.css'

function App() {
  const canvasRef = useRef(null);
  const [collageService, setCollageService] = useState(null);
  const [imagePool, setImagePool] = useState([]);

  // Load images on component mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Load metadata from the image processor server
        const response = await fetch('http://localhost:5001/images/metadata.json');
        const metadata = await response.json();
        
        // Load all images
        const loadedImages = await Promise.all(
          metadata.map(async (img) => {
            const image = new Image();
            // Use the full URL for images
            image.src = `http://localhost:5001/images/collages/${img.id}.jpg`;
            await new Promise((resolve, reject) => {
              image.onload = resolve;
              image.onerror = () => {
                console.warn(`Failed to load image: ${img.id}`);
                resolve(null); // Resolve with null instead of rejecting
              };
            });
            return image;
          })
        );
        
        // Filter out any failed image loads
        const validImages = loadedImages.filter(img => img !== null);
        console.log(`Loaded ${validImages.length} images`);
        
        setImagePool(validImages);
        
        // Initialize CollageService with the loaded images
        if (validImages.length > 0) {
          setCollageService(new CollageService(validImages));
        }
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };
    
    loadImages();
  }, []);

  // Generate a new collage when the "Shift Perspective" button is clicked
  const handleShiftPerspective = async () => {
    if (collageService && canvasRef.current) {
      const effectType = collageService.selectEffectType();
      console.log('Selected effect type:', effectType);
      await collageService.createCollage(canvasRef.current, effectType);
    }
  };

  // Save the collage when the "Save Collage" button is clicked
  const handleSaveCollage = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'assemblage-collage.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="app-container">
      <h1>Assemblage Collage Generator</h1>
      
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          style={{ 
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
      
      <div className="button-container">
        <button 
          onClick={handleShiftPerspective}
          disabled={!collageService}
        >
          Shift Perspective
        </button>
        
        <button 
          onClick={handleSaveCollage}
          disabled={!canvasRef.current}
        >
          Save Collage
        </button>
      </div>
    </div>
  )
}

export default App
