/**
 * Background Manager for Oracle Stack
 * 
 * Handles dynamic background color generation and transitions
 */

export default class BackgroundManager {
    constructor() {
        this.body = document.body;
        this.container = document.getElementById('imageContainer');
        this.currentColor = null;
        
        // HSL ranges for pleasing colors
        this.hueRange = [0, 360];        // Full hue range
        this.saturationRange = [60, 85]; // Medium to high saturation
        this.lightnessRange = [70, 85];  // Medium to high lightness
    }

    /**
     * Calculate relative luminance of a color
     * @param {string} hexColor - Hex color string
     * @returns {number} Luminance value between 0 and 1
     */
    calculateLuminance(hexColor) {
        // Remove the hash if present
        const hex = hexColor.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        // Calculate relative luminance using WCAG formula
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance;
    }

    /**
     * Determine if white or black text should be used based on background color
     * @param {string} hexColor - Hex color string
     * @returns {string} '#000000' for black text, '#ffffff' for white text
     */
    getContrastColor(hexColor) {
        const luminance = this.calculateLuminance(hexColor);
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    /**
     * Generate a random HSL color
     * @returns {string} Hex color string
     */
    generateRandomColor() {
        // Generate random HSL color
        const hue = Math.random() * 360; // Full hue range
        const saturation = 60 + Math.random() * 20; // 60-80% saturation
        const lightness = 70 + Math.random() * 10; // 70-80% lightness
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    calculateTextColor(backgroundColor) {
        // Convert HSL to RGB
        const rgb = this.hslToRgb(
            parseInt(backgroundColor.match(/\d+/)[0]) / 360,
            parseInt(backgroundColor.match(/\d+/)[1]) / 100,
            parseInt(backgroundColor.match(/\d+/)[2]) / 100
        );

        // Calculate relative luminance using the formula
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]);
        
        // Return black for light backgrounds, white for dark backgrounds
        return luminance > 186 ? '#000000' : '#ffffff';
    }

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r * 255, g * 255, b * 255];
    }

    /**
     * Set background color and update text colors
     * @param {string} color - Hex color string
     */
    setBackgroundColor(color) {
        this.currentColor = color;
        
        // Set background color
        this.body.style.backgroundColor = color;
        this.container.style.backgroundColor = color;
        
        // Calculate and set text color based on background brightness
        const textColor = this.calculateTextColor(color);
        document.documentElement.style.setProperty('--text-color', textColor);
        
        // Set highlight color as a complementary color
        const complementaryColor = this.getComplementaryColor(color);
        document.documentElement.style.setProperty('--highlight-color', complementaryColor);
        
        // Apply text color to UI elements
        const uiElements = [
            document.querySelector('header'),
            document.querySelector('.controls'),
            document.querySelector('footer')
        ];
        
        uiElements.forEach(element => {
            if (element) {
                element.style.color = textColor;
                element.style.backgroundColor = color;
            }
        });
        
        // Update button styles
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.color = textColor;
            button.style.backgroundColor = color;
            button.style.borderColor = textColor;
        });
    }

    getComplementaryColor(color) {
        // Convert HSL to RGB
        const rgb = this.hslToRgb(
            parseInt(color.match(/\d+/)[0]) / 360,
            parseInt(color.match(/\d+/)[1]) / 100,
            parseInt(color.match(/\d+/)[2]) / 100
        );
        
        // Calculate complementary color (255 - each RGB value)
        const complementary = rgb.map(c => 255 - c);
        
        // Return the complementary color as an HSL string
        const [h, s, l] = this.rgbToHsl(complementary[0], complementary[1], complementary[2]);
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s * 100, l * 100];
    }

    /**
     * Set background color from current images
     */
    setBackgroundFromImages() {
        const color = this.generateRandomColor();
        this.setBackgroundColor(color);
    }
} 