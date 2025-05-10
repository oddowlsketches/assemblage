import React, { useState } from 'react';
import scrambledMosaic from '../scrambledMosaic.js';

const DEFAULT_GRID_SIZE = 4;
const DEFAULT_REVEAL_PCT = 75;
const DEFAULT_SWAP_PCT = 0;
const DEFAULT_ROTATE_PCT = 0;
const DEFAULT_SEED = 1;

function randomSeed(seed: number) {
  // Simple deterministic pseudo-random generator
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Accept images as a prop
interface DevHarnessProps {
  images?: HTMLImageElement[];
  cellSize?: number;
}

const ScrambledMosaicDevHarness = ({ images = [], cellSize = 200 }: DevHarnessProps) => {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [revealPct, setRevealPct] = useState(DEFAULT_REVEAL_PCT);
  const [swapPct, setSwapPct] = useState(DEFAULT_SWAP_PCT);
  const [rotatePct, setRotatePct] = useState(DEFAULT_ROTATE_PCT);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Always use a visible placeholder image if images is empty
  let imgs = images && images.length > 0 ? images : undefined;
  if (!imgs || imgs.length === 0) {
    // Create a visible colored placeholder image
    const dummyImg = new window.Image();
    const size = cellSize;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#bada55';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('IMG', size / 2, size / 2);
    }
    dummyImg.src = tempCanvas.toDataURL();
    imgs = [dummyImg];
  }

  // Render the mosaic whenever params change
  React.useEffect(() => {
    if (!canvasRef.current) return;
    const params = {
      gridSize,
      revealPct,
      swapPct,
      rotatePct,
      seed,
      pattern: 'random',
      cellShape: 'square',
      operation: 'reveal',
      bgColor: '#fff',
      useMultiply: false,
    };
    scrambledMosaic.generate(canvasRef.current, imgs, params);
  }, [gridSize, revealPct, swapPct, rotatePct, seed, cellSize, imgs]);

  return (
    <div>
      <h2>Scrambled Mosaic Dev Harness</h2>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div>
          <label>Grid Size: {gridSize}</label>
          <input type="range" min={2} max={8} value={gridSize} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGridSize(Number(e.target.value))} />
        </div>
        <div>
          <label>Reveal %: {revealPct}%</label>
          <input type="range" min={0} max={100} step={1} value={revealPct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRevealPct(Number(e.target.value))} />
        </div>
        <div>
          <label>Swap %: {Math.round(swapPct * 100)}%</label>
          <input type="range" min={0} max={1} step={0.01} value={swapPct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSwapPct(Number(e.target.value))} />
        </div>
        <div>
          <label>Rotate %: {Math.round(rotatePct * 100)}%</label>
          <input type="range" min={0} max={1} step={0.01} value={rotatePct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRotatePct(Number(e.target.value))} />
        </div>
        <div>
          <label>Seed: {seed}</label>
          <input type="range" min={0} max={100} value={seed} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeed(Number(e.target.value))} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          width={cellSize}
          height={cellSize}
          style={{ border: '1px solid #ccc', background: '#fafafa' }}
        />
      </div>
    </div>
  );
};

export default ScrambledMosaicDevHarness; 