import { randomizePlacement } from './core/randomization';
import templates from './templates/index';

export function initGallery() {
    const template = templates.find(t => t.key === 'scrambledMosaic');
    if (!template) {
        throw new Error('Template not found');
    }

    function createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        return canvas;
    }

    function drawMask(ctx: CanvasRenderingContext2D, maskName: string, x: number, y: number, width: number, height: number, rotation: number) {
        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-width/2, -height/2);
        
        // Simple placeholder drawing - replace with actual mask drawing
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeRect(0, 0, width, height);
        
        ctx.restore();
    }

    function generateSample(seed: number) {
        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');
        if (!ctx) return canvas;

        // Fill background
        ctx.fillStyle = template.defaultBG || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw each placement with randomization
        template.placements.forEach(placement => {
            const randomized = randomizePlacement(placement, seed);
            
            // Convert relative coordinates to actual canvas coordinates
            const x = randomized.x * canvas.width;
            const y = randomized.y * canvas.height;
            const width = randomized.width * canvas.width;
            const height = randomized.height * canvas.height;
            
            drawMask(ctx, randomized.maskName, x, y, width, height, randomized.rotation || 0);
        });

        return canvas;
    }

    function updateGallery() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return;

        gallery.innerHTML = '';
        
        // Generate 5 samples with different seeds
        for (let i = 0; i < 5; i++) {
            const sample = document.createElement('div');
            sample.className = 'sample';
            const canvas = generateSample(Date.now() + i);
            sample.appendChild(canvas);
            gallery.appendChild(sample);
        }
    }

    // Initial generation
    updateGallery();

    // Add event listener for the generate button
    document.getElementById('generate')?.addEventListener('click', updateGallery);
} 