const maskImplementations = {
    diamond: {
        draw: (ctx, width, height) => {
            const centerX = 0;
            const centerY = 0;
            const size = Math.min(width, height) * 0.8;
            
            ctx.moveTo(centerX, centerY - size/2); // Top
            ctx.lineTo(centerX + size/2, centerY); // Right
            ctx.lineTo(centerX, centerY + size/2); // Bottom
            ctx.lineTo(centerX - size/2, centerY); // Left
        }
    },
    hexagon: {
        draw: (ctx, width, height) => {
            const centerX = 0;
            const centerY = 0;
            const size = Math.min(width, height) * 0.8;
            const sides = 6;
            const angle = (Math.PI * 2) / sides;
            
            for (let i = 0; i < sides; i++) {
                const x = centerX + size * Math.cos(angle * i);
                const y = centerY + size * Math.sin(angle * i);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
    },
    star: {
        draw: (ctx, width, height) => {
            const centerX = 0;
            const centerY = 0;
            const size = Math.min(width, height) * 0.8;
            const spikes = 5;
            const outerRadius = size / 2;
            const innerRadius = outerRadius * 0.4;
            
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 * i) / (spikes * 2);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
    },
    arc: {
        draw: (ctx, width, height) => {
            const centerX = 0;
            const centerY = 0;
            const radius = Math.min(width, height) * 0.4;
            
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        }
    },
    arch: {
        draw: (ctx, width, height) => {
            const centerX = 0;
            const centerY = 0;
            const radius = Math.min(width, height) * 0.4;
            
            // Draw the arch curve
            ctx.arc(centerX, centerY, radius, Math.PI, 0);
            
            // Draw the sides
            ctx.lineTo(centerX + radius, centerY + radius);
            ctx.lineTo(centerX - radius, centerY + radius);
            ctx.lineTo(centerX - radius, centerY);
        }
    },
    window: {
        draw: (ctx, width, height) => {
            const x = -width/2;
            const y = -height/2;
            const w = width;
            const h = height;
            
            // Main window frame
            ctx.rect(x, y, w, h);
            // Window panes
            ctx.moveTo(x + w/2, y);
            ctx.lineTo(x + w/2, y + h);
            ctx.moveTo(x, y + h/2);
            ctx.lineTo(x + w, y + h/2);
        }
    },
    door: {
        draw: (ctx, width, height) => {
            const x = -width/2;
            const y = -height/2;
            const w = width;
            const h = height;
            
            // Door frame
            ctx.rect(x, y, w, h);
            // Door panel details
            ctx.rect(x + w*0.1, y + h*0.1, w*0.8, h*0.8);
        }
    },
    column: {
        draw: (ctx, width, height) => {
            const x = -width/2;
            const y = -height/2;
            const w = width;
            const h = height;
            
            // Column shaft
            ctx.rect(x, y, w, h);
            // Capital
            ctx.rect(x - w*0.2, y, w*1.4, h*0.1);
            // Base
            ctx.rect(x - w*0.2, y + h*0.9, w*1.4, h*0.1);
        }
    },
    cornice: {
        draw: (ctx, width, height) => {
            const x = -width/2;
            const y = -height/2;
            const w = width;
            const h = height;
            
            // Main cornice band
            ctx.rect(x, y, w, h);
            // Decorative top edge
            ctx.moveTo(x, y);
            for(let i = 0; i <= 10; i++) {
                const px = x + (w/10) * i;
                const py = i % 2 === 0 ? y - h*0.2 : y;
                if(i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
        }
    }
};

export default maskImplementations; 