const maskImplementations = {
    diamond: {
        draw: (ctx, width, height) => {
            const centerX = width / 2;
            const centerY = height / 2;
            const size = Math.min(width, height) * 0.8; // Scale to 80% of the smaller dimension
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - size/2); // Top
            ctx.lineTo(centerX + size/2, centerY); // Right
            ctx.lineTo(centerX, centerY + size/2); // Bottom
            ctx.lineTo(centerX - size/2, centerY); // Left
            ctx.closePath();
        }
    },
    hexagon: {
        draw: (ctx, width, height) => {
            const centerX = width / 2;
            const centerY = height / 2;
            const size = Math.min(width, height) * 0.8; // Scale to 80% of the smaller dimension
            const sides = 6;
            const angle = (Math.PI * 2) / sides;
            
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const x = centerX + size * Math.cos(angle * i);
                const y = centerY + size * Math.sin(angle * i);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }
    },
    star: {
        draw: (ctx, width, height) => {
            const centerX = width / 2;
            const centerY = height / 2;
            const size = Math.min(width, height) * 0.8; // Scale to 80% of the smaller dimension
            const spikes = 5;
            const outerRadius = size / 2;
            const innerRadius = outerRadius * 0.4;
            
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 * i) / (spikes * 2);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }
    },
    arc: {
        draw: (ctx, width, height) => {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.4; // Scale to 40% of the smaller dimension
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.closePath();
        }
    },
    arch: {
        draw: (ctx, width, height) => {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.4; // Scale to 40% of the smaller dimension
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI * 0.2, Math.PI * 1.8);
            ctx.closePath();
        }
    },
    window: {
        draw: (ctx, width, height) => {
            const x = width * 0.1;
            const y = height * 0.1;
            const w = width * 0.8;
            const h = height * 0.8;
            
            ctx.beginPath();
            // Main window frame
            ctx.rect(x, y, w, h);
            // Window panes
            ctx.moveTo(x + w/2, y);
            ctx.lineTo(x + w/2, y + h);
            ctx.moveTo(x, y + h/2);
            ctx.lineTo(x + w, y + h/2);
            ctx.closePath();
        }
    },
    door: {
        draw: (ctx, width, height) => {
            const x = width * 0.2;
            const y = height * 0.1;
            const w = width * 0.6;
            const h = height * 0.8;
            
            ctx.beginPath();
            // Door frame
            ctx.rect(x, y, w, h);
            // Door panel details
            ctx.rect(x + w*0.1, y + h*0.1, w*0.8, h*0.8);
            ctx.closePath();
        }
    },
    column: {
        draw: (ctx, width, height) => {
            const x = width * 0.3;
            const y = height * 0.1;
            const w = width * 0.4;
            const h = height * 0.8;
            
            ctx.beginPath();
            // Column shaft
            ctx.rect(x, y, w, h);
            // Capital
            ctx.rect(x - w*0.2, y, w*1.4, h*0.1);
            // Base
            ctx.rect(x - w*0.2, y + h*0.9, w*1.4, h*0.1);
            ctx.closePath();
        }
    },
    cornice: {
        draw: (ctx, width, height) => {
            const x = width * 0.1;
            const y = height * 0.4;
            const w = width * 0.8;
            const h = height * 0.2;
            
            ctx.beginPath();
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
            ctx.closePath();
        }
    }
};

export default maskImplementations; 