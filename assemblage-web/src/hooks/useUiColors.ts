import { useState, useEffect } from 'react';

interface UiColors {
  bg: string;
  fg: string;
  border: string;
  complementaryColor: string;
}

/**
 * Hook that provides UI colors based on the current collage background color
 * Watches for changes to CSS variables and returns appropriate colors for UI elements
 */
export const useUiColors = (): UiColors => {
  const [colors, setColors] = useState<UiColors>({
    bg: '#ffffff',
    fg: '#333333',
    border: '#333333',
    complementaryColor: '#007bff'
  });

  useEffect(() => {
    const updateColors = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      
      // Get current background color from CSS variable
      const bgColor = rootStyle.getPropertyValue('--background-color').trim() || '#ffffff';
      
      // Get computed complementary colors from existing CSS variables
      // These are already calculated by CollageService
      const textColor = rootStyle.getPropertyValue('--text-color').trim() || '#333333';
      const borderColor = rootStyle.getPropertyValue('--button-border-color').trim() || '#333333';
      
      // Calculate complementary color - for now use the text color
      // You might want to calculate a proper complementary color here
      const complementaryColor = textColor;
      
      setColors({
        bg: bgColor,
        fg: textColor,
        border: borderColor,
        complementaryColor: complementaryColor
      });
    };

    // Initial update
    updateColors();

    // Watch for changes to CSS variables
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          updateColors();
        }
      });
    });

    // Observe changes to body and document element
    observer.observe(document.body, { attributes: true, subtree: true });
    observer.observe(document.documentElement, { attributes: true });

    // Also listen for custom event that might be dispatched when colors change
    const handleColorChange = () => updateColors();
    window.addEventListener('collage-colors-changed', handleColorChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('collage-colors-changed', handleColorChange);
    };
  }, []);

  return colors;
};
