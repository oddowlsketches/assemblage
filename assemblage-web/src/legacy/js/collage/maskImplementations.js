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
    }
};

export default maskImplementations; 