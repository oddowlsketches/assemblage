/**
 * Mask Implementations for Assemblage
 * Provides clean implementations of various mask shapes
 */

export const maskImplementations = {
    // Basic shapes
    circle: (ctx, x, y, width, height) => {
        try {
            const radius = Math.min(width, height) / 2;
            if (radius <= 0) {
                console.warn('Invalid circle radius:', radius);
                return;
            }
            ctx.beginPath();
            ctx.arc(x + width/2, y + height/2, radius, 0, Math.PI * 2);
            ctx.closePath();
        } catch (error) {
            console.error('Error drawing circle mask:', error);
        }
    },
    
    rectangle: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid rectangle dimensions:', { width, height });
                return;
            }
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.closePath();
        } catch (error) {
            console.error('Error drawing rectangle mask:', error);
        }
    },
    
    triangle: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid triangle dimensions:', { width, height });
                return;
            }
            ctx.beginPath();
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
            ctx.closePath();
        } catch (error) {
            console.error('Error drawing triangle mask:', error);
        }
    },
    
    ellipse: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid ellipse dimensions:', { width, height });
                return;
            }
            ctx.beginPath();
            ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, Math.PI * 2);
            ctx.closePath();
        } catch (error) {
            console.error('Error drawing ellipse mask:', error);
        }
    },
    
    diamond: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid diamond dimensions:', { width, height });
                return;
            }
            ctx.beginPath();
            ctx.moveTo(x + width/2, y);
            ctx.lineTo(x + width, y + height/2);
            ctx.lineTo(x + width/2, y + height);
            ctx.lineTo(x, y + height/2);
            ctx.closePath();
        } catch (error) {
            console.error('Error drawing diamond mask:', error);
        }
    },
    
    // Enhanced shapes
    hexagon: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid hexagon dimensions:', { width, height });
                return;
            }
            const centerX = x + width/2;
            const centerY = y + height/2;
            const radius = Math.min(width, height) / 2;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const pointX = centerX + radius * Math.cos(angle);
                const pointY = centerY + radius * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(pointX, pointY);
                } else {
                    ctx.lineTo(pointX, pointY);
                }
            }
            ctx.closePath();
        } catch (error) {
            console.error('Error drawing hexagon mask:', error);
        }
    },
    
    star: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid star dimensions:', { width, height });
                return;
            }
            const centerX = x + width/2;
            const centerY = y + height/2;
            const outerRadius = Math.min(width, height) / 2;
            const innerRadius = outerRadius * 0.4;
            
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / 5;
                const pointX = centerX + radius * Math.cos(angle);
                const pointY = centerY + radius * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(pointX, pointY);
                } else {
                    ctx.lineTo(pointX, pointY);
                }
            }
            ctx.closePath();
        } catch (error) {
            console.error('Error drawing star mask:', error);
        }
    },
    
    arc: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid arc dimensions:', { width, height });
                return;
            }
            const centerX = x + width/2;
            const centerY = y + height/2;
            const radius = Math.min(width, height) / 2;
            
            console.log('Drawing arc mask:', {
                center: { x: centerX, y: centerY },
                radius,
                dimensions: { width, height }
            });

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.closePath();
            console.log('Arc mask path completed');
        } catch (error) {
            console.error('Error drawing arc mask:', error);
        }
    },
    
    arch: (ctx, x, y, width, height) => {
        try {
            if (width <= 0 || height <= 0) {
                console.warn('Invalid arch dimensions:', { width, height });
                return;
            }
            
            console.log('Drawing arch mask:', {
                dimensions: { width, height }
            });

            ctx.beginPath();
            
            // Calculate arch dimensions
            const archWidth = width;
            const archHeight = height;
            const archRadius = Math.min(archWidth / 2, archHeight / 2);
            
            // Start at bottom left corner
            ctx.moveTo(x, y + archHeight);
            
            // Draw left vertical line up to arch start
            ctx.lineTo(x, y + archHeight - archRadius);
            
            // Draw the arch (half-circle)
            ctx.arc(x + archWidth/2, y + archHeight - archRadius, archRadius, Math.PI, 0, false);
            
            // Draw right vertical line down
            ctx.lineTo(x + archWidth, y + archHeight);
            
            // Draw bottom line to close the path
            ctx.lineTo(x, y + archHeight);
            
            ctx.closePath();
            console.log('Arch mask path completed');
        } catch (error) {
            console.error('Error drawing arch mask:', error);
        }
    },

    drawCircle(ctx, width, height) {
        try {
            if (!width || !height || width <= 0 || height <= 0) {
                console.warn('Invalid dimensions for circle mask:', { width, height });
                return;
            }

            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2;

            console.log('Drawing circle mask:', {
                center: { x: centerX, y: centerY },
                radius,
                dimensions: { width, height }
            });

            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            console.log('Circle mask path completed');
        } catch (error) {
            console.error('Error drawing circle mask:', error);
        }
    },

    drawRectangle(ctx, width, height) {
        try {
            if (!width || !height || width <= 0 || height <= 0) {
                console.warn('Invalid dimensions for rectangle mask:', { width, height });
                return;
            }

            console.log('Drawing rectangle mask:', {
                dimensions: { width, height }
            });

            ctx.rect(0, 0, width, height);
            console.log('Rectangle mask path completed');
        } catch (error) {
            console.error('Error drawing rectangle mask:', error);
        }
    },

    drawTriangle(ctx, width, height) {
        try {
            if (!width || !height || width <= 0 || height <= 0) {
                console.warn('Invalid dimensions for triangle mask:', { width, height });
                return;
            }

            const centerX = width / 2;
            const topY = height * 0.1;
            const bottomY = height * 0.9;

            console.log('Drawing triangle mask:', {
                center: { x: centerX },
                topY,
                bottomY,
                dimensions: { width, height }
            });

            ctx.moveTo(centerX, topY);
            ctx.lineTo(width * 0.1, bottomY);
            ctx.lineTo(width * 0.9, bottomY);
            ctx.closePath();
            console.log('Triangle mask path completed');
        } catch (error) {
            console.error('Error drawing triangle mask:', error);
        }
    },

    drawEllipse(ctx, width, height) {
        try {
            if (!width || !height || width <= 0 || height <= 0) {
                console.warn('Invalid dimensions for ellipse mask:', { width, height });
                return;
            }

            const centerX = width / 2;
            const centerY = height / 2;
            const radiusX = width / 2;
            const radiusY = height / 2;

            console.log('Drawing ellipse mask:', {
                center: { x: centerX, y: centerY },
                radius: { x: radiusX, y: radiusY },
                dimensions: { width, height }
            });

            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            console.log('Ellipse mask path completed');
        } catch (error) {
            console.error('Error drawing ellipse mask:', error);
        }
    },

    drawDiamond(ctx, width, height) {
        try {
            if (!width || !height || width <= 0 || height <= 0) {
                console.warn('Invalid dimensions for diamond mask:', { width, height });
                return;
            }

            const centerX = width / 2;
            const centerY = height / 2;
            const halfWidth = width / 2;
            const halfHeight = height / 2;

            console.log('Drawing diamond mask:', {
                center: { x: centerX, y: centerY },
                halfDimensions: { width: halfWidth, height: halfHeight },
                dimensions: { width, height }
            });

            ctx.moveTo(centerX, 0);
            ctx.lineTo(width, centerY);
            ctx.lineTo(centerX, height);
            ctx.lineTo(0, centerY);
            ctx.closePath();
            console.log('Diamond mask path completed');
        } catch (error) {
            console.error('Error drawing diamond mask:', error);
        }
    },

    drawHexagon(ctx, width, height) {
        try {
            if (!width || !height || width <= 0 || height <= 0) {
                console.warn('Invalid dimensions for hexagon mask:', { width, height });
                return;
            }

            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2;
            const sides = 6;
            const angle = (Math.PI * 2) / sides;

            console.log('Drawing hexagon mask:', {
                center: { x: centerX, y: centerY },
                radius,
                sides,
                angle,
                dimensions: { width, height }
            });

            ctx.moveTo(centerX + radius, centerY);
            for (let i = 1; i <= sides; i++) {
                const x = centerX + radius * Math.cos(angle * i);
                const y = centerY + radius * Math.sin(angle * i);
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            console.log('Hexagon mask path completed');
        } catch (error) {
            console.error('Error drawing hexagon mask:', error);
        }
    },

    drawStar(ctx, width, height) {
        try {
            if (!width || !height || width <= 0 || height <= 0) {
                console.warn('Invalid dimensions for star mask:', { width, height });
                return;
            }

            const centerX = width / 2;
            const centerY = height / 2;
            const outerRadius = Math.min(width, height) / 2;
            const innerRadius = outerRadius * 0.4;
            const spikes = 5;
            const angle = (Math.PI * 2) / spikes;

            console.log('Drawing star mask:', {
                center: { x: centerX, y: centerY },
                outerRadius,
                innerRadius,
                spikes,
                angle,
                dimensions: { width, height }
            });

            ctx.moveTo(centerX + outerRadius, centerY);
            for (let i = 1; i <= spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = centerX + radius * Math.cos(angle * i / 2);
                const y = centerY + radius * Math.sin(angle * i / 2);
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            console.log('Star mask path completed');
        } catch (error) {
            console.error('Error drawing star mask:', error);
        }
    }
}; 