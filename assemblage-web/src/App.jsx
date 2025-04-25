import { useState, useRef, useEffect } from 'react'
import { CollageService } from './core/CollageService'
import './styles/legacy-app.css'

export default function App() {
  const canvasRef = useRef(null);
  const serviceRef = useRef(null);

  //  ❶ resize canvas to full viewport and draw once on mount
  useEffect(() => {
    const cvs = canvasRef.current;
    const resize = () => {
      cvs.width  = window.innerWidth;
      cvs.height = window.innerHeight - cvs.getBoundingClientRect().top;
      serviceRef.current?.setCanvas(cvs);
    };
    window.addEventListener('resize', resize);
    resize();

    // initialise CollageService + first collage
    serviceRef.current = new CollageService(cvs);
    serviceRef.current.shiftPerspective();

    return () => window.removeEventListener('resize', resize);
  }, []);

  const handleShift = () => serviceRef.current?.shiftPerspective();
  const handleSave  = () => serviceRef.current?.saveCollage();

  return (
    <div id="wrapper">
      <header>
        <div>
          <h1>Assemblage</h1>
          <h2>EPHEMERAL VISIONS, ASSEMBLED MEANINGS</h2>
        </div>
        <div className="controls">
          <button onClick={handleShift}>Shift Perspective</button>
          <button onClick={handleSave}>Save Collage</button>
        </div>
      </header>

      <canvas ref={canvasRef} />

      <footer>
        <span>© 2025 Assemblage by Emily Schwartzman. All rights reserved.</span>
      </footer>
    </div>
  );
}
