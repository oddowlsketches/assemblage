/**
 * Fortune Generator for Oracle Stack
 * 
 * Generates poetic, mystical interpretations based on image tags
 * Creates a collage-like text display with dynamic styling
 */

class FortuneGenerator {
    constructor() {
        this.fortuneMessages = [
            "Beauty emerges from the juxtaposition of elements that don't seem to belong together.",
            "The fragments that seem disconnected often reveal their pattern when viewed from a different perspective.",
            "What appears broken is merely rearranging itself into a more truthful formation.",
            "Sometimes meaning resides in the spaces between things rather than the things themselves.",
            "The borders between what is intended and what is discovered are beautifully blurred.",
            "Shadows create meaning just as much as what stands in the light.",
            "Notice what draws your eye first—it holds a message about what deserves your attention now.",
            "What's fragmented isn't broken—it's creating space for something new to emerge.",
            "The echoes between seemingly unrelated elements often contain the most profound truths.",
            "What appears random at first glance contains a hidden order when viewed through intuition.",
            "The unexpected connections reveal patterns that were always there, waiting to be noticed.",
            "In the overlap between memory and anticipation, you'll find the most honest view of the present.",
            "Meaning shifts when elements are rearranged—the same is true of your narrative.",
            "The tension between opposing elements creates the energy needed for transformation.",
            "What feels like an ending might actually be an unexpected beginning.",
            "Patterns that seem chaotic up close reveal their logic when viewed from a distance.",
            "The boundaries you perceive are more permeable than they appear.",
            "Look for meaning in the negative space—sometimes absence speaks more clearly than presence.",
            "The unexpected harmonies between contrasting elements reveal deeper connections.",
            "What appears incomplete may actually be perfectly whole in its own way."
        ];
    }

    calculateComplementaryColor(color) {
        // Parse the RGB values from the color string
        const rgb = color.match(/\d+/g).map(Number);
        
        // Calculate complementary color (opposite on the color wheel)
        const compRGB = rgb.map(val => 255 - val);
        
        // Brighten the color a bit to ensure it's visible
        const brightenedRGB = compRGB.map(val => Math.min(val + 40, 255));
        
        // Return as RGB string
        return `rgb(${brightenedRGB[0]}, ${brightenedRGB[1]}, ${brightenedRGB[2]})`;
    }

    getContrastingTextColor(backgroundColor) {
        // Convert RGB string to RGB values
        const rgb = backgroundColor.match(/\d+/g).map(Number);
        
        // Calculate relative luminance
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000' : '#fff';
    }

    generateFortune(images) {
        if (!images || images.length === 0) {
            return {
                text: "No images available for fortune generation.",
                style: "color: #000;"
            };
        }

        // Get a random message from our curated list
        const randomIndex = Math.floor(Math.random() * this.fortuneMessages.length);
        const messageText = this.fortuneMessages[randomIndex];
        
        // Calculate complementary color for highlighting
        const backgroundColor = document.body.style.backgroundColor || getComputedStyle(document.body).backgroundColor;
        const highlightColor = this.calculateComplementaryColor(backgroundColor);
        const textColor = this.getContrastingTextColor(highlightColor);
        
        // Generate random position within viewport (30% to 70% from edges)
        const top = Math.random() * 40 + 30;
        const left = Math.random() * 40 + 30;
        
        // Generate random rotation between -5 and 5 degrees
        const rotation = Math.random() * 10 - 5;
        
        // Generate random font size between 1.2rem and 2rem
        const fontSize = 1.2 + Math.random() * 0.8;
        
        // Generate random letter spacing between -0.02em and 0.02em
        const letterSpacing = (Math.random() * 0.04 - 0.02).toFixed(3);
        
        // Generate random opacity between 0.9 and 1
        const opacity = 0.9 + Math.random() * 0.1;
        
        // Generate random text alignment
        const textAlign = ['left', 'center', 'right'][Math.floor(Math.random() * 3)];
        
        // Generate random text case
        const textTransform = ['normal', 'uppercase', 'lowercase'][Math.floor(Math.random() * 3)];
        
        // Generate random text style
        const fontStyle = ['normal', 'italic'][Math.floor(Math.random() * 2)];
        
        // Generate random font
        const fontFamily = [
            "'Space Grotesk', sans-serif",
            "'IBM Plex Mono', monospace",
            "'Courier New', monospace",
            "'Georgia', serif",
            "'Times New Roman', serif",
            "'Arial', sans-serif",
            "'Helvetica', sans-serif"
        ][Math.floor(Math.random() * 7)];
        
        // Create the style string
        const style = `
            position: fixed;
            top: ${top}%;
            left: ${left}%;
            transform: rotate(${rotation}deg);
            font-size: ${fontSize}rem;
            font-family: ${fontFamily};
            letter-spacing: ${letterSpacing}em;
            opacity: ${opacity};
            text-align: ${textAlign};
            text-transform: ${textTransform};
            font-style: ${fontStyle};
            background-color: ${highlightColor} !important;
            color: ${textColor} !important;
            padding: 3px 5px !important;
            box-decoration-break: clone !important;
            -webkit-box-decoration-break: clone !important;
            line-height: 1.6;
            z-index: 15;
            max-width: 80%;
            mix-blend-mode: normal !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: inline-block !important;
        `;

        return {
            text: messageText,
            style: style
        };
    }

    generateStyling(tags) {
        // This method is kept for compatibility but now just returns a default style
        return 'background-color: var(--highlight-color); color: var(--text-color);';
    }
}

export default FortuneGenerator;

// This will be initialized in app.js
// const fortuneGenerator = new FortuneGenerator();
