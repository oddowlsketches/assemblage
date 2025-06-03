import { EffectBase, EffectParams, MaskPlacement } from './EffectBase';
import { maskRegistry } from '../masks/maskRegistry';
import { svgToPath2D } from '../core/svgUtils';
import { drawImageInMask, adjustMaskProportions } from '../utils/imageScaling.js';

// Update MaskPlacement type to allow polygon points and new properties
// (If MaskPlacement is imported, we can extend it locally)
type PolygonMaskPlacement = MaskPlacement & { 
  polygon?: {x: number, y: number}[],
  image_role?: 'texture' | 'narrative' | 'conceptual',
  useColorBlockEcho?: boolean,
  echoType?: 'complementary' | 'background'
};

const validArchMasks = [
  'architectural/archClassical',
  'architectural/archFlat',
  'architectural/triptychArch',
  'architectural/houseGable',
  'altar/nicheArch',
  'altar/gableAltar',
  'basic/diamondMask',
  'basic/hexagonMask',
  'basic/circleMask',
  'basic/triangleMask',
  'basic/semiCircleMask',
  'basic/rectangleMask'
];

// Architectural composition presets keyed by prompt
const presets: Record<string, (width: number, height: number) => MaskPlacement[]> = {
  // Single large arch with small secondary mask
  singleArch: (w, h) => {
    // Add more variation to size and position
    const sizeVariation = 0.1; // 10% variation
    const positionVariation = 0.15; // 15% variation
    
    // Randomly determine if we want a larger or smaller main arch
    const mainSizeFactor = 0.7 + (Math.random() * 2 - 1) * sizeVariation;
    const mainArchHeight = h * mainSizeFactor;
    const mainArchWidth = mainArchHeight * 0.8; // FIXED: Use proper arch proportions
    
    // Randomly position the main arch
    const mainX = w * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const mainY = h * (0.15 + (Math.random() * 2 - 1) * positionVariation);
    
    // Randomly determine if we want a larger or smaller secondary element
    const smallSizeFactor = 0.2 + (Math.random() * 2 - 1) * sizeVariation;
    const smallArchHeight = h * smallSizeFactor;
    const smallArchWidth = smallArchHeight * 0.8; // FIXED: Use proper arch proportions
    
    // Randomly position the secondary element
    const smallX = w * (0.8 + (Math.random() * 2 - 1) * positionVariation);
    const smallY = h * (0.6 + (Math.random() * 2 - 1) * positionVariation);
    
    // Use masks from the registry
    return [
      {
        maskName: validArchMasks[Math.floor(Math.random() * validArchMasks.length)],
        x: mainX - mainArchWidth/2,
        y: mainY,
        width: mainArchWidth,
        height: mainArchHeight,
        rotation: 0,
        layer: 1
      },
      {
        maskName: validArchMasks[Math.floor(Math.random() * validArchMasks.length)],
        x: smallX - smallArchWidth/2,
        y: smallY - smallArchHeight/2,
        width: smallArchWidth,
        height: smallArchHeight,
        rotation: Math.random() * 360,
        layer: 2
      }
    ];
  },

  // Portal/window-like arch series inspired by physical collages
  archSeries: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Create LARGE arches that fill at least 70% of canvas with dynamic arrangements
    const layoutType = Math.random();
    
    if (layoutType < 0.4) {
      // Single large arch centered at bottom - MASSIVE SIZE
      // FIXED: Make arches fill 90-100% of canvas height and allow horizontal bleed
      const mainArchHeight = Math.max(h * 0.90, h * (0.90 + Math.random() * 0.10)); // 90-100% height
      const mainArchWidth = mainArchHeight * 0.8; // Maintain proper arch ratio - can exceed canvas width
      const mainArchX = (w - mainArchWidth) / 2;
      const mainArchY = Math.max(0, h - mainArchHeight); // Ensure top is always visible
      
      console.log(`[archSeries] LARGE Main arch: ${mainArchWidth.toFixed(1)}x${mainArchHeight.toFixed(1)} = ratio ${(mainArchWidth/mainArchHeight).toFixed(2)} - fills ${(mainArchHeight/h*100).toFixed(1)}% of canvas height`);
      
      placements.push({
        maskName: 'architectural/archClassical',
        x: mainArchX,
        y: mainArchY,
        width: mainArchWidth,
        height: mainArchHeight,
        rotation: 0,
        layer: 1,
        image_role: 'texture',
        useColorBlockEcho: true,
        echoType: 'complementary',
        useSolidColor: false
      });
      
      // Add 1-2 smaller overlapping arches in front - still large
      const numOverlays = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numOverlays; i++) {
        const overlayHeight = h * (0.70 + Math.random() * 0.25); // 70-95% height (increased)
        const overlayWidth = overlayHeight * 0.8; // No width cap - can exceed canvas
        const overlayX = mainArchX + (mainArchWidth - overlayWidth) * (0.1 + Math.random() * 0.8);
        const overlayY = Math.max(0, h - overlayHeight); // Ensure top is always visible
        
        console.log(`[archSeries] LARGE Overlay arch: ${overlayWidth.toFixed(1)}x${overlayHeight.toFixed(1)} = ratio ${(overlayWidth/overlayHeight).toFixed(2)} - fills ${(overlayHeight/h*100).toFixed(1)}% of canvas height`);
        
        placements.push({
          maskName: 'architectural/archClassical',
          x: overlayX,
          y: overlayY,
          width: overlayWidth,
          height: overlayHeight,
          rotation: 0,
          layer: 2,
          image_role: Math.random() < 0.5 ? 'narrative' : 'conceptual',
          useColorBlockEcho: true,
          echoType: 'background',
          useSolidColor: false
        });
      }
    } else if (layoutType < 0.7) {
      // Two large arches side by side - MASSIVE SIZE
      const leftArchHeight = Math.max(h * 0.92, h * (0.92 + Math.random() * 0.08)); // 92-100% height
      const rightArchHeight = Math.max(h * 0.85, h * (0.85 + Math.random() * 0.15)); // 85-100% height
      const leftArchWidth = leftArchHeight * 0.8; // No width cap - natural ratio
      const rightArchWidth = rightArchHeight * 0.8; // No width cap - natural ratio
      
      // Position with minimal spacing, allowing horizontal bleed
      const totalWidth = leftArchWidth + rightArchWidth;
      const spacing = Math.min(w * 0.02, 40); // Minimal spacing, max 40px
      const leftX = (w - totalWidth - spacing) / 2;
      const rightX = leftX + leftArchWidth + spacing;
      
      console.log(`[archSeries] LARGE Left arch: ${leftArchWidth.toFixed(1)}x${leftArchHeight.toFixed(1)} = ratio ${(leftArchWidth/leftArchHeight).toFixed(2)} - fills ${(leftArchHeight/h*100).toFixed(1)}% of canvas height`);
      console.log(`[archSeries] LARGE Right arch: ${rightArchWidth.toFixed(1)}x${rightArchHeight.toFixed(1)} = ratio ${(rightArchWidth/rightArchHeight).toFixed(2)} - fills ${(rightArchHeight/h*100).toFixed(1)}% of canvas height`);
      
      placements.push({
        maskName: 'architectural/archClassical',
        x: leftX,
        y: Math.max(0, h - leftArchHeight), // Ensure top visible
        width: leftArchWidth,
        height: leftArchHeight,
        rotation: 0,
        layer: 1,
        image_role: 'texture',
        useColorBlockEcho: true,
        echoType: 'complementary',
        useSolidColor: Math.random() < 0.3
      });
      
      placements.push({
        maskName: 'architectural/archClassical',
        x: rightX,
        y: Math.max(0, h - rightArchHeight), // Ensure top visible (staggered heights)
        width: rightArchWidth,
        height: rightArchHeight,
        rotation: 0,
        layer: 1,
        image_role: 'texture',
        useColorBlockEcho: true,
        echoType: 'complementary',
        useSolidColor: Math.random() < 0.3
      });
      
      // Add small overlapping element - still reasonably large
      const smallHeight = h * (0.55 + Math.random() * 0.30); // 55-85% height (increased)
      const smallWidth = smallHeight * 0.8; // Natural ratio
      const smallX = leftX + leftArchWidth * 0.3; // Position over left arch
      
      console.log(`[archSeries] LARGE Small arch: ${smallWidth.toFixed(1)}x${smallHeight.toFixed(1)} = ratio ${(smallWidth/smallHeight).toFixed(2)} - fills ${(smallHeight/h*100).toFixed(1)}% of canvas height`);
      
      placements.push({
        maskName: 'architectural/archClassical',
        x: smallX,
        y: Math.max(0, h - smallHeight), // Ensure top visible
        width: smallWidth,
        height: smallHeight,
        rotation: 0,
        layer: 2,
        image_role: 'narrative',
        useColorBlockEcho: true,
        echoType: 'background',
        useSolidColor: false
      });
    } else {
      // Three overlapping arches - MASSIVE SIZE
      const archHeights = [
        Math.max(h * 0.95, h * (0.95 + Math.random() * 0.05)), // 95-100% height
        Math.max(h * 0.85, h * (0.85 + Math.random() * 0.15)), // 85-100% height
        h * (0.75 + Math.random() * 0.20) // 75-95% height
      ];
      
      const archSizes = archHeights.map((height, i) => {
        const width = height * 0.8; // Natural ratio, no width cap
        console.log(`[archSeries] LARGE Arch ${i}: ${width.toFixed(1)}x${height.toFixed(1)} = ratio ${(width/height).toFixed(2)} - fills ${(height/h*100).toFixed(1)}% of canvas height`);
        return { width, height };
      });
      
      // Position them with overlap - center the group, allow horizontal bleed
      const totalWidthWithOverlap = archSizes.reduce((sum, size, i) => sum + size.width * (i === 0 ? 1 : 0.5), 0);
      let currentX = (w - totalWidthWithOverlap) / 2; // Center the group
      
      archSizes.forEach((size, i) => {
        const archX = currentX;
        const archY = Math.max(0, h - size.height); // Ensure top visible
        
        const isTopmostLayer = (3 - i) === Math.max(...archSizes.map((_, idx) => 3 - idx));
        const useSolidColor = !isTopmostLayer && Math.random() < 0.3;
        
        placements.push({
          maskName: 'architectural/archClassical',
          x: archX,
          y: archY,
          width: size.width,
          height: size.height,
          rotation: 0,
          layer: 3 - i,
          image_role: i === 0 ? 'texture' : (Math.random() < 0.5 ? 'narrative' : 'conceptual'),
          useColorBlockEcho: true,
          echoType: i === 0 ? 'complementary' : 'background',
          useSolidColor: useSolidColor
        });
        
        currentX += size.width * 0.5; // 50% overlap for next arch (increased overlap)
      });
    }
    
    return placements;
  },

    

  // Three concentric arches with more variation
  nestedArches: (w, h) => {
    console.log('[nestedArches preset] Called with dimensions:', w, h);
    const variation = Math.random(); // More variation options
    let variationType;
    if (variation < 0.2) {
      variationType = 'centered';
    } else if (variation < 0.4) {
      variationType = 'bottomAligned';
    } else if (variation < 0.6) {
      variationType = 'verticallyOffset';
    } else {
      variationType = 'staggered';
    }
    console.log('[nestedArches preset] Using variation:', variationType);
    
    const placements: MaskPlacement[] = [];
    const numShapes = 2 + Math.floor(Math.random() * 2); // 2-3 nested shapes (was 2-4) for cleaner look
    const baseSizeFactor = 1.1; // Start with 110% of canvas min dimension for better coverage
    const baseSize = Math.min(w, h) * baseSizeFactor;
    
    // Ensure minimum coverage of 85% of canvas for better visual impact
    const minSize = Math.min(w, h) * 0.85;
    const effectiveBaseSize = Math.max(baseSize, minSize);
    
    // Use a variety of mask shapes that work well
    const shapeMasks = [
      'architectural/archClassical',
      'architectural/archFlat',
      'altar/nicheArch',
      'altar/gableAltar',
      'basic/circleMask',
      'basic/diamondMask',
      'basic/hexagonMask',
      'basic/triangleMask',
      'basic/semiCircleMask'
    ];
    
    // Shuffle the masks array to get random order
    const shuffled = [...shapeMasks].sort(() => Math.random() - 0.5);
    
    if (variationType === 'centered') {
      const centerX = w * 0.5;
      const centerY = h * 0.5;
      
      // Create nested shapes from largest to smallest with more dramatic size differences
      for (let i = 0; i < numShapes; i++) {
          const sizeFactor = 1 - (i * 0.2); // Each inner shape is 20% smaller for more dramatic nesting
          const currentSize = effectiveBaseSize * sizeFactor;
        
        // Use different aspect ratios for different shapes
        const maskName = shuffled[i % shuffled.length];
        let shapeWidth, shapeHeight;
        
        if (maskName.includes('arch') || maskName.includes('gable')) {
          // Arches and gables are taller than wide - use proper 4:5 aspect ratio
          shapeHeight = currentSize;
          shapeWidth = shapeHeight * 0.8; // FIXED: Proper arch proportions (height * 0.8 = width)
        } else if (maskName.includes('diamond')) {
          // Diamonds are square-ish but slightly taller
          shapeHeight = currentSize;
          shapeWidth = currentSize * 0.85;
        } else if (maskName.includes('hexagon')) {
          // Hexagons are wider
          shapeHeight = currentSize * 0.9;
          shapeWidth = currentSize;
        } else if (maskName.includes('semiCircle')) {
          // Semi-circles depend on orientation
          shapeHeight = currentSize;
          shapeWidth = currentSize;
        } else {
          // Default square-ish shapes
          shapeHeight = currentSize;
          shapeWidth = currentSize;
        }
        
        placements.push({
          maskName: maskName,
          x: centerX - shapeWidth / 2,
          y: centerY - shapeHeight / 2,
          width: shapeWidth,
          height: shapeHeight,
          rotation: 0, // No rotation for nested arches - keep them aligned
          layer: numShapes - i - 1 // Reverse layer order so largest is on bottom
        });
      }
    } else if (variationType === 'bottomAligned') {
      // All shapes aligned to bottom of canvas
      const centerX = w * 0.5;
      const bottomY = h * 0.95; // 5% margin from bottom
      
      for (let i = 0; i < numShapes; i++) {
        const sizeFactor = 1 - (i * 0.2);
        const currentSize = effectiveBaseSize * sizeFactor;
        
        const maskName = shuffled[i % shuffled.length];
        let shapeWidth, shapeHeight;
        
        if (maskName.includes('arch') || maskName.includes('gable')) {
          shapeHeight = currentSize;
          shapeWidth = shapeHeight * 0.8;
        } else {
          shapeHeight = currentSize;
          shapeWidth = currentSize;
        }
        
        // Add slight horizontal offset for visual interest
        const xOffset = (Math.random() - 0.5) * w * 0.1;
        
        placements.push({
          maskName: maskName,
          x: centerX - shapeWidth / 2 + xOffset,
          y: bottomY - shapeHeight,
          width: shapeWidth,
          height: shapeHeight,
          rotation: 0,
          layer: numShapes - i - 1
        });
      }
    } else if (variationType === 'verticallyOffset') {
      // Shapes vertically offset with some overlap
      const centerX = w * 0.5;
      const totalHeight = h * 0.8;
      const startY = h * 0.1;
      
      for (let i = 0; i < numShapes; i++) {
        const sizeFactor = 1 - (i * 0.15); // Less aggressive size reduction
        const currentSize = effectiveBaseSize * sizeFactor;
        
        const maskName = shuffled[i % shuffled.length];
        let shapeWidth, shapeHeight;
        
        if (maskName.includes('arch') || maskName.includes('gable')) {
          shapeHeight = currentSize;
          shapeWidth = shapeHeight * 0.8;
        } else {
          shapeHeight = currentSize;
          shapeWidth = currentSize * 0.9;
        }
        
        // Calculate vertical position with overlap
        const verticalStep = totalHeight / (numShapes + 1);
        const yPos = startY + (i * verticalStep);
        
        // Add horizontal variation
        const xOffset = (Math.random() - 0.5) * w * 0.15;
        
        placements.push({
          maskName: maskName,
          x: centerX - shapeWidth / 2 + xOffset,
          y: yPos,
          width: shapeWidth,
          height: shapeHeight,
          rotation: 0,
          layer: numShapes - i - 1
        });
      }
    } else { // 'staggered' variation
      // Don't center the group - instead create dynamic staggered layouts
      
      // Special staggered composition types
      const compositionType = Math.random();
      
      if (compositionType < 0.3 && numShapes >= 3) {
        // Diagonal cascade - shapes progressively offset diagonally
        const stepX = w * 0.15; // Horizontal step between shapes
        const stepY = h * 0.12; // Vertical step between shapes
        const startX = w * 0.1; // Start from left side
        const startY = h * 0.1; // Start from top
        
        for (let i = 0; i < numShapes; i++) {
          const sizeFactor = 1 - (i * 0.08); // Progressive size reduction (was 0.1)
          const currentSize = effectiveBaseSize * sizeFactor * 0.95; // Larger for cascade, use effectiveBaseSize
          
          const maskName = shuffled[i % shuffled.length];
          let shapeWidth, shapeHeight;
          
          // Dynamic sizing based on mask type with proper proportions
          if (maskName.includes('arch') || maskName.includes('gable')) {
            shapeHeight = currentSize * 1.1;
            shapeWidth = shapeHeight * 0.8; // FIXED: Proper arch proportions
          } else if (maskName.includes('diamond') || maskName.includes('hexagon')) {
            shapeHeight = currentSize;
            shapeWidth = currentSize * 0.9;
          } else {
            shapeHeight = currentSize;
            shapeWidth = currentSize;
          }
          
          placements.push({
            maskName: maskName,
            x: startX + (i * stepX),
            y: startY + (i * stepY),
            width: shapeWidth,
            height: shapeHeight,
            rotation: 0, // No rotation for nested arches - keep them aligned
            layer: numShapes - i - 1
          });
        }
      } else if (compositionType < 0.6) {
        // Horizontal overlap - shapes overlap horizontally with vertical offset
        const totalWidth = w * 0.9;
        const overlapFactor = 0.3 + Math.random() * 0.2; // 30-50% overlap
        
        for (let i = 0; i < numShapes; i++) {
          const sizeFactor = 0.98 - (i * 0.06); // Less aggressive size reduction (was 0.95 - 0.08)
          const currentSize = effectiveBaseSize * sizeFactor;
          
          const maskName = shuffled[i % shuffled.length];
          let shapeWidth, shapeHeight;
          
          if (maskName.includes('arch') || maskName.includes('gable')) {
            shapeHeight = currentSize;
            shapeWidth = shapeHeight * 0.8; // FIXED: Proper arch proportions
          } else if (maskName.includes('triangle')) {
            shapeHeight = currentSize * 0.9;
            shapeWidth = currentSize;
          } else {
            shapeHeight = currentSize * 0.95;
            shapeWidth = currentSize * 0.95;
          }
          
          // Calculate position with overlap
          const xProgress = i / (numShapes - 1 || 1);
          const baseX = (w - shapeWidth) * xProgress;
          const verticalWave = Math.sin(xProgress * Math.PI) * h * 0.15; // Sine wave vertical offset
          
          placements.push({
            maskName: maskName,
            x: baseX,
            y: (h - shapeHeight) / 2 + verticalWave,
            width: shapeWidth,
            height: shapeHeight,
            rotation: 0, // No rotation for nested arches - keep them aligned
            layer: i % 2 ? i : numShapes - i - 1 // Alternate layering for overlap effect
          });
        }
      } else {
        // Clustered overlap - shapes cluster with significant overlap
        const clusterCenterX = w * (0.3 + Math.random() * 0.4); // Cluster can be anywhere 30-70% across
        const clusterCenterY = h * (0.3 + Math.random() * 0.4);
        const clusterSpread = Math.min(w, h) * 0.3; // How far shapes spread from center
        
        for (let i = 0; i < numShapes; i++) {
          const sizeFactor = 0.95 - (i * 0.06); // Better size progression (was 0.9 - 0.08)
          const currentSize = effectiveBaseSize * sizeFactor;
          
          const maskName = shuffled[i % shuffled.length];
          let shapeWidth, shapeHeight;
          
          // Size variations by shape type with proper proportions
          if (maskName.includes('circle')) {
            shapeHeight = currentSize;
            shapeWidth = currentSize;
          } else if (maskName.includes('arch')) {
            shapeHeight = currentSize * 1.1;
            shapeWidth = shapeHeight * 0.8; // FIXED: Proper arch proportions
          } else if (maskName.includes('diamond')) {
            shapeHeight = currentSize;
            shapeWidth = currentSize * 0.8;
          } else {
            shapeHeight = currentSize * 0.95;
            shapeWidth = currentSize * 0.95;
          }
          
          // Position shapes in a cluster with controlled randomness
          const angle = (i / numShapes) * Math.PI * 2 + Math.random() * 0.5;
          const distance = clusterSpread * (0.3 + i * 0.2); // Shapes get further from center
          
          placements.push({
            maskName: maskName,
            x: clusterCenterX + Math.cos(angle) * distance - shapeWidth / 2,
            y: clusterCenterY + Math.sin(angle) * distance - shapeHeight / 2,
            width: shapeWidth,
            height: shapeHeight,
            rotation: 0, // No rotation for nested arches - keep them aligned
            layer: Math.floor(Math.random() * numShapes) // Random layering for organic feel
          });
        }
      }
    }
    
    console.log('[nestedArches preset] Returning placements:', placements.length, 'items');
    console.log('[nestedArches preset] First placement:', placements[0]);
    return placements;
  },

  // Minimal coliseum with large central arch
  coliseum: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Add more variation to size and position
    const sizeVariation = 0.15; // 15% variation
    const positionVariation = 0.1; // 10% variation
    
    // Randomly determine if we want a larger or smaller central arch
    const archSizeFactor = 0.8 + (Math.random() * 2 - 1) * sizeVariation;
    const archSize = Math.min(w, h) * archSizeFactor;
    
    // Randomly position the central arch
    const centerX = w * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const centerY = h * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    
    // Mix of architectural elements
    const centralArch = Math.random() > 0.5 ? 'architectural/archClassical' : 'altar/nicheArch';
    const sideElements = ['architectural/columnSingle', 'architectural/windowRect', 'architectural/archFlat'];
    
    // Add the central arch
    placements.push({
      maskName: centralArch,
      x: centerX - archSize/2,
      y: centerY - archSize/2,
      width: archSize,
      height: archSize,
      rotation: 0,
      layer: 1
    });

    // Two smaller elements on sides with more variation
    const sideSizeFactor = 0.4 + (Math.random() * 2 - 1) * sizeVariation;
    const sideSize = archSize * sideSizeFactor;
    
    // Randomly position the side elements
    const leftX = centerX - archSize * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const rightX = centerX + archSize * (0.5 + (Math.random() * 2 - 1) * positionVariation);
    const sideY = centerY + archSize * (0.2 + (Math.random() * 2 - 1) * positionVariation);
    
    // Add the side elements
    placements.push({
      maskName: sideElements[Math.floor(Math.random() * sideElements.length)],
      x: leftX - sideSize/2,
      y: sideY - sideSize/2,
      width: sideSize,
      height: sideSize,
      rotation: 0,
      layer: 2
    });
    
    placements.push({
      maskName: sideElements[Math.floor(Math.random() * sideElements.length)],
      x: rightX - sideSize/2,
      y: sideY - sideSize/2,
      width: sideSize,
      height: sideSize,
      rotation: 0,
      layer: 2
    });

    return placements;
  },

  // Classic facade composition
  classic: (w, h) => {
    const placements: MaskPlacement[] = [];
    const randomFactor = (factor = 0.1) => (Math.random() - 0.5) * factor; // Helper for small random adjustments

    // Top element (cornice or arch)
    const topElements = ['architectural/archClassical', 'architectural/facadeGrid', 'altar/gableAltar'];
    placements.push({
      maskName: topElements[Math.floor(Math.random() * topElements.length)],
      x: w * (0.15 + randomFactor(0.1)), // Slightly more inset, less wide
      y: h * (0.08 + randomFactor(0.05)), // Slightly lower, more variable
      width: w * (0.7 + randomFactor(0.15)), // Base 70% width, variable
      height: h * (0.18 + randomFactor(0.08)), // Taller, base 18% height, variable
      rotation: randomFactor(5), // Slight rotation
      layer: 1
    });

    // Side columns
    const columnTypes = ['architectural/columnSingle', 'architectural/columnPair', 'architectural/columnTriplet'];
    const columnType = columnTypes[Math.floor(Math.random() * columnTypes.length)];
    const baseColumnWidth = w * (0.12 + randomFactor(0.04));
    const baseColumnHeight = h * (0.6 + randomFactor(0.1));
    
    placements.push({ // Left Column
      maskName: columnType,
      x: w * (0.1 + randomFactor(0.05)),
      y: h * (0.25 + randomFactor(0.1)),
      width: baseColumnWidth + w * randomFactor(0.03),
      height: baseColumnHeight + h * randomFactor(0.05),
      rotation: randomFactor(3),
      layer: 1
    });
    
    placements.push({ // Right Column
      maskName: columnType, // Could be different for more variety, but classic often symmetrical
      x: w * (0.78 - baseColumnWidth/w + randomFactor(0.05)), // Position based on its own width
      y: h * (0.25 + randomFactor(0.1)),
      width: baseColumnWidth + w * randomFactor(0.03),
      height: baseColumnHeight + h * randomFactor(0.05),
      rotation: randomFactor(3),
      layer: 1
    });
    
    // Windows
    const windowTypes = ['architectural/windowRect', 'architectural/windowGrid', 'altar/nicheCluster'];
    const numWindows = 2 + Math.floor(Math.random() * 2); // 2 or 3 windows
    const windowZoneXStart = w * 0.3;
    const windowZoneWidth = w * 0.4;
    
    for (let i = 0; i < numWindows; i++) {
      const xPos = windowZoneXStart + (i * windowZoneWidth / numWindows) + windowZoneWidth / (numWindows * 2) + w * randomFactor(0.05); // Centered in segment + jitter
      const yPos = h * (0.3 + randomFactor(0.1));
      placements.push({
        maskName: windowTypes[Math.floor(Math.random() * windowTypes.length)],
        x: xPos - (w * (0.18 + randomFactor(0.04))) / 2, // Center the window after calculating its width
        y: yPos,
        width: w * (0.18 + randomFactor(0.04)), // Larger base, more variable
        height: h * (0.22 + randomFactor(0.06)), // Larger base, more variable
        rotation: randomFactor(5),
        layer: 2
      });
    }
    
    // Door or entrance
    const doorTypes = ['altar/gableAltar', 'architectural/archFlat', 'altar/nicheArch'];
    const doorWidth = w * (0.2 + randomFactor(0.08));
    placements.push({
      maskName: doorTypes[Math.floor(Math.random() * doorTypes.length)],
      x: w * (0.5 - doorWidth / (2*w) + randomFactor(0.08)), // Centered + jitter
      y: h * (0.65 + randomFactor(0.05)),
      width: doorWidth,
      height: h * (0.3 + randomFactor(0.08)), // Taller, more variable
      rotation: randomFactor(3),
      layer: 2
    });
    
    return placements;
  },

  // Modern minimalist composition
  modern: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Large geometric shapes
    const modernShapes = ['basic/rectangleMask', 'narrative/panelRectWide', 'narrative/panelSquare', 'abstract/polygonSoft'];
    
    // Main large element
    placements.push({
      maskName: modernShapes[Math.floor(Math.random() * modernShapes.length)],
      x: w * 0.2,
      y: h * 0.1,
      width: w * 0.6,
      height: h * 0.4,
      rotation: Math.random() > 0.7 ? Math.random() * 15 - 7.5 : 0,
      layer: 1
    });
    
    // Secondary elements
    const numSecondary = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numSecondary; i++) {
      const size = w * (0.1 + Math.random() * 0.2);
      placements.push({
        maskName: modernShapes[Math.floor(Math.random() * modernShapes.length)],
        x: w * (0.1 + Math.random() * 0.7),
        y: h * (0.5 + Math.random() * 0.3),
        width: size,
        height: size * (0.5 + Math.random()),
        rotation: Math.random() > 0.5 ? Math.random() * 30 - 15 : 0,
        layer: 2
      });
    }
    
    return placements;
  },

  // Gothic-inspired composition
  gothic: (w, h) => {
    const placements: MaskPlacement[] = [];
    
    // Pointed arch elements
    const gothicElements = ['altar/nicheArch', 'altar/circleAboveArch', 'architectural/triptychArch'];
    
    // Central tall arch
    placements.push({
      maskName: gothicElements[Math.floor(Math.random() * gothicElements.length)],
      x: w * 0.35,
      y: h * 0.1,
      width: w * 0.3,
      height: h * 0.6,
      rotation: 0,
      layer: 1
    });
    
    // Side arches
    placements.push({
      maskName: 'altar/nicheCluster',
      x: w * 0.1,
      y: h * 0.2,
      width: w * 0.2,
      height: h * 0.5,
      rotation: 0,
      layer: 2
    });
    
    placements.push({
      maskName: 'altar/nicheCluster',
      x: w * 0.7,
      y: h * 0.2,
      width: w * 0.2,
      height: h * 0.5,
      rotation: 0,
      layer: 2
    });
    
    // Rose window or circular element at top
    placements.push({
      maskName: 'altar/circleInset',
      x: w * 0.4,
      y: h * 0.05,
      width: w * 0.2,
      height: w * 0.2,
      rotation: 0,
      layer: 3
    });
    
    return placements;
  }
};

interface ArchitecturalEffectParams extends EffectParams {
  promptText?: string;         // optional, used to influence architectural composition
  useMixedBlending?: boolean; // whether to use mixed blending modes for fragments
  useComplementaryShapes?: boolean; // whether to add complementary color shapes
  bgColor?: string;            // optional background color
  dpr?: number;                // optional device pixel ratio
  imageMode?: 'single' | 'unique'; // Added imageMode
  useMultiply?: boolean;       // whether to use multiply blend mode (used for the main image draw before echo logic)

  // New parameters for Color Block Echo
  useColorBlockEcho?: boolean;
  echoPolicy?: 'all' | 'subset' | 'none';
  echoOpacity?: number; // Opacity for the echo color block itself
  elementOpacity?: number; // General opacity for the masked elements (renamed from opacity)
}

// Add ShapeType type definition
// (If MaskPlacement is imported, we can extend it locally)
type ShapeType = 'door' | 'window' | 'arch' | 'column' | 'cornice';

// Define favored masks for architectural effect
const favoredMasks = [
  'architectural/archClassical',
  'architectural/archFlat',
  'architectural/houseGable',
  'altar/nicheArch',
  'altar/gableAltar',
  'basic/triangleMask',
  'basic/diamondMask',
  'basic/hexagonMask',
  'basic/circleMask',
  'basic/semiCircleMask'
];

// Helper to pick a random favored mask
function pickFavoredMask() {
  return favoredMasks[Math.floor(Math.random() * favoredMasks.length)];
}

// Helper to pick a random 90-degree rotation
function pickRotation90() {
  const options = [0, 90, 180, 270];
  return options[Math.floor(Math.random() * options.length)];
}

interface OverlapEchoParams {
  active: boolean;
  useComplementary: boolean;
  // Could add specific opacity/color if needed later
}

// Update MaskPlacement type to include overlapEcho
type ExtendedMaskPlacement = PolygonMaskPlacement & { overlapEcho?: OverlapEchoParams };

export class ArchitecturalEffect extends EffectBase {
  static id = "architectural";
  
  // Image mode: 'single' uses one image for all masks, 'unique' uses different images
  private imageMode: 'single' | 'unique' = 'unique';
  private singleImage?: HTMLImageElement;

  private readonly shapeTypes = ['door', 'window', 'arch', 'column', 'cornice'] as const;
  private readonly architecturalPresets: Record<string, MaskPlacement[]> = {
    'classic': [
      // Main building structure (cornice)
      { maskName: 'basic/rectangleMask', x: 0.1, y: 0.1, width: 0.8, height: 0.1, rotation: 0, layer: 1 },
      { maskName: 'architectural/columnSingle', x: 0.1, y: 0.2, width: 0.1, height: 0.7, rotation: 0, layer: 1 },
      { maskName: 'architectural/columnSingle', x: 0.8, y: 0.2, width: 0.1, height: 0.7, rotation: 0, layer: 1 },
      // Windows
      { maskName: 'architectural/windowRect', x: 0.3, y: 0.3, width: 0.15, height: 0.2, rotation: 0, layer: 2 },
      { maskName: 'architectural/windowGrid', x: 0.55, y: 0.3, width: 0.15, height: 0.2, rotation: 0, layer: 2 },
      // Door
      { maskName: 'altar/nicheArch', x: 0.4, y: 0.7, width: 0.2, height: 0.2, rotation: 0, layer: 2 },
      // Arches above windows
      { maskName: 'architectural/archClassical', x: 0.25, y: 0.25, width: 0.2, height: 0.15, rotation: 0, layer: 3 },
      { maskName: 'architectural/archFlat', x: 0.5, y: 0.25, width: 0.2, height: 0.15, rotation: 0, layer: 3 }
    ],
    'modern': [
      // Minimalist structure
      { maskName: 'basic/rectangleMask', x: 0.2, y: 0.1, width: 0.6, height: 0.05, rotation: 0, layer: 1 },
      // Large windows
      { maskName: 'architectural/windowRect', x: 0.25, y: 0.2, width: 0.5, height: 0.4, rotation: 0, layer: 2 },
      // Minimal door
      { maskName: 'altar/gableAltar', x: 0.4, y: 0.6, width: 0.2, height: 0.3, rotation: 0, layer: 2 },
      // Decorative elements
      { maskName: 'abstract/polygonSoft', x: 0.3, y: 0.15, width: 0.4, height: 0.1, rotation: 0, layer: 3 }
    ],
    'gothic': [
      // Main structure (cornice)
      { maskName: 'basic/rectangleMask', x: 0.1, y: 0.1, width: 0.8, height: 0.15, rotation: 0, layer: 1 },
      // Tall columns
      { maskName: 'architectural/columnPair', x: 0.15, y: 0.25, width: 0.08, height: 0.65, rotation: 0, layer: 1 },
      { maskName: 'architectural/columnPair', x: 0.77, y: 0.25, width: 0.08, height: 0.65, rotation: 0, layer: 1 },
      // Pointed windows
      { maskName: 'architectural/windowGrid', x: 0.3, y: 0.3, width: 0.15, height: 0.3, rotation: 0, layer: 2 },
      { maskName: 'architectural/windowGrid', x: 0.55, y: 0.3, width: 0.15, height: 0.3, rotation: 0, layer: 2 },
      // Grand entrance
      { maskName: 'altar/gableAltar', x: 0.4, y: 0.6, width: 0.2, height: 0.3, rotation: 0, layer: 2 },
      // Pointed arches
      { maskName: 'architectural/triptychArch', x: 0.25, y: 0.25, width: 0.2, height: 0.2, rotation: 0, layer: 3 },
      { maskName: 'architectural/triptychArch', x: 0.55, y: 0.25, width: 0.2, height: 0.2, rotation: 0, layer: 3 }
    ]
  };

  protected declare params: ArchitecturalEffectParams;

  constructor(
    ctx: CanvasRenderingContext2D,
    images: HTMLImageElement[],
    params: Partial<ArchitecturalEffectParams> = {}
  ) {
    super(ctx, images, params);
    console.log('[ArchEffect Constructor] Received images:', images.length, images.map(img => ({ src: img.src, complete: img.complete })));
    this.params = {
        imageMode: 'unique',
        useComplementaryShapes: true,
        useMixedBlending: false,
        useMultiply: true,
        useColorBlockEcho: false,
        echoPolicy: 'subset',
        echoOpacity: 0.6,
        elementOpacity: 1,
        ...this.params,
        ...params
    };
    console.log('[ArchEffect Constructor] Effective Params:', JSON.parse(JSON.stringify(this.params)));
    this.imageMode = this.params.imageMode || 'unique';
  }

  private _chooseRandomBackgroundColor(alpha: number = 1.0): string {
    // Import the enhanced palette function dynamically to use smart color selection
    // This ensures color photos get light backgrounds and B&W photos get vibrant ones
    let baseColor: string;
    
    try {
      // Use the smart palette function that analyzes images
      const { getRandomColorFromPalette } = require('../utils/colors.js');
      baseColor = getRandomColorFromPalette(this.images, 'auto');
    } catch (error) {
      console.warn('[ArchitecturalEffect] Could not load smart color palette, using fallback');
      // Fallback to a safe light color to prevent dark backgrounds on color photos
      const fallbackColors = ['#F8F8FF', '#F5F5DC', '#F0F8FF', '#F5FFFA', '#FFF8DC'];
      baseColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
    }
    
    return alpha < 1.0 ? `${baseColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}` : baseColor;
  }

  private drawImageFragment(x: number, y: number, width: number, height: number): void {
    if (this.images.length === 0) return;
    
    const image = this.images[Math.floor(Math.random() * this.images.length)];
    if (!image || !image.complete) return;
    
    const imgAspectRatio = image.naturalWidth / image.naturalHeight;
    const shapeAspectRatio = width / height;
    let drawWidth, drawHeight;
    
    if (imgAspectRatio > shapeAspectRatio) {
      drawHeight = height;
      drawWidth = height * imgAspectRatio;
    } else {
      drawWidth = width;
      drawHeight = width / imgAspectRatio;
    }
    
    const offsetX = (drawWidth - width) / 2;
    const offsetY = (drawHeight - height) / 2;
    
    this.ctx.drawImage(image, x - offsetX, y - offsetY, drawWidth, drawHeight);
  }

  private getComplementaryColor(baseColor: string): string {
    // Use the enhanced complementary color function for better readability
    try {
      const { getComplementaryColor } = require('../utils/colorUtils.js');
      return getComplementaryColor(baseColor);
    } catch (error) {
      console.warn('[ArchitecturalEffect] Could not load enhanced complementary color function, using fallback');
      // Fallback implementation with basic safeguards
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      
      // Simple inversion with minimum brightness to ensure readability
      const compR = Math.max(40, 255 - r);
      const compG = Math.max(40, 255 - g);
      const compB = Math.max(40, 255 - b);
      
      return `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`;
    }
  }

  private lightenColor(color: string, amount: number): string {
    // Helper function to lighten a color by a given amount (0-1)
    if (!color || !color.startsWith('#')) return color;
    
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Lighten by blending with white
    const lightenedR = Math.round(r + (255 - r) * amount);
    const lightenedG = Math.round(g + (255 - g) * amount);
    const lightenedB = Math.round(b + (255 - b) * amount);
    
    return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
  }

  private calculateOverlap(rect1: MaskPlacement, rect2: MaskPlacement): number {
    const x_overlap = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x));
    const y_overlap = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y));
    const overlapArea = x_overlap * y_overlap;

    const area1 = rect1.width * rect1.height;
    const area2 = rect2.width * rect2.height;

    if (area1 === 0 || area2 === 0) return 0;
    // Return overlap as a percentage of the smaller area
    return overlapArea / Math.min(area1, area2);
  }

  public draw(): void {
    console.log('[ArchEffect draw()] Start. Images available:', this.images.length, this.images.map(img => ({ src: img.src, complete: img.complete })));
    console.log('[ArchEffect draw()] Current singleImage before plan:', this.singleImage ? { src: this.singleImage.src, complete: this.singleImage.complete } : 'undefined');

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // FIXED: Use the bgColor parameter if provided, otherwise use smart palette selection
    let bgColor = this.params.bgColor;
    if (!bgColor) {
      bgColor = this._chooseRandomBackgroundColor();
    }
    console.log('[ArchEffect] Using background color:', bgColor, 'from', this.params.bgColor ? 'params' : 'smart palette');
    
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Option for background image fill (30% chance for arch series)
    let hasBackgroundImage = false;
    if (this.params.promptText === 'archSeries' && Math.random() < 0.3 && this.images.length > 0) {
      // Use a texture image for background fill
      const textureImages = this.images.filter(img => (img as any).image_role === 'texture');
      const bgImage = textureImages.length > 0 ? 
        textureImages[Math.floor(Math.random() * textureImages.length)] :
        this.images[Math.floor(Math.random() * this.images.length)];
      
      if (bgImage && bgImage.complete) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.7 + Math.random() * 0.25; // 70-95% opacity (increased from 30%)
        this.ctx.globalCompositeOperation = 'multiply';
        
        // Scale image to fill canvas
        const canvasAspect = this.ctx.canvas.width / this.ctx.canvas.height;
        const imageAspect = bgImage.width / bgImage.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        if (imageAspect > canvasAspect) {
          drawHeight = this.ctx.canvas.height;
          drawWidth = drawHeight * imageAspect;
          drawX = (this.ctx.canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = this.ctx.canvas.width;
          drawHeight = drawWidth / imageAspect;
          drawX = 0;
          drawY = (this.ctx.canvas.height - drawHeight) / 2;
        }
        
        this.ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);
        this.ctx.restore();
        hasBackgroundImage = true;
        console.log('[ArchEffect] Drew background image for arch series with opacity:', this.ctx.globalAlpha);
      }
    }

    let plan: MaskPlacement[];
    console.log('[ArchEffect] Selecting plan for promptText:', this.params.promptText);
    console.log('[ArchEffect] Canvas dimensions:', this.ctx.canvas.width, 'x', this.ctx.canvas.height, 'DPR:', this.params.dpr || 1);
    
    // FIXED: Use actual canvas pixel dimensions for all calculations
    const canvasPixelWidth = this.ctx.canvas.width;
    const canvasPixelHeight = this.ctx.canvas.height;
    
    if (this.params.promptText && presets[this.params.promptText]) {
        console.log('[ArchEffect] Using preset for:', this.params.promptText);
        plan = presets[this.params.promptText](canvasPixelWidth, canvasPixelHeight);
    } else if (this.params.promptText && this.architecturalPresets[this.params.promptText]) {
        console.log('[ArchEffect] Using architectural preset for:', this.params.promptText);
        const scaledPreset = this.architecturalPresets[this.params.promptText].map(p => ({
            ...p,
            x: p.x * canvasPixelWidth,
            y: p.y * canvasPixelHeight,
            width: p.width * canvasPixelWidth,
            height: p.height * canvasPixelHeight,
        }));
        plan = scaledPreset;
    }else {
        console.log('[ArchEffect] Using fallback generated plan');
        plan = this.generateArchitecturalPlan();
    }
    
    console.log('[ArchEffect] Generated plan with', plan.length, 'elements. First element:', plan[0]?.maskName);

    // Cast to ExtendedMaskPlacement for overlap logic
    let extendedPlan = plan as ExtendedMaskPlacement[];

    // Overlap detection logic
    const OVERLAP_THRESHOLD = 0.3; // 30% overlap
    for (let i = 0; i < extendedPlan.length; i++) {
      for (let j = i + 1; j < extendedPlan.length; j++) {
        const elementA = extendedPlan[i];
        const elementB = extendedPlan[j];

        const overlapPercentage = this.calculateOverlap(elementA, elementB);

        if (overlapPercentage > OVERLAP_THRESHOLD) {
          // Determine which element is on top (higher layer, or later in array if same layer)
          let topElement = (elementA.layer || 0) > (elementB.layer || 0) ? elementA :
                           (elementB.layer || 0) > (elementA.layer || 0) ? elementB :
                           j > i ? elementB : elementA; // if layers are same, j is later so B is on top
          let bottomElement = topElement === elementA ? elementB : elementA;

          console.log(`[ArchEffect Overlap] Significant overlap (${(overlapPercentage * 100).toFixed(1)}%) between:`, elementA.maskName, `(layer ${elementA.layer}) and`, elementB.maskName, `(layer ${elementB.layer}). Top: ${topElement.maskName}`);

          if (!topElement.overlapEcho || !topElement.overlapEcho.active) { // Only apply if not already set by another overlap
             topElement.overlapEcho = {
              active: true,
              useComplementary: Math.random() < 0.5, // 50% chance for complementary, else use background color
            };
          }
        }
      }
    }

    this.imageMode = this.params.imageMode || 'unique';
    if (this.imageMode === 'single' && this.images.length > 0) {
      this.singleImage = this.images[Math.floor(Math.random() * this.images.length)];
    } else {
      this.singleImage = undefined;
    }

    this.drawPlan(plan as PolygonMaskPlacement[]);

    if (this.params.useComplementaryShapes && !this.params.useColorBlockEcho) {
      this.drawComplementaryShape(bgColor);
    }
  }

  private drawComplementaryShape(baseBgColor: string): void {
    const ctx = this.ctx;
    const canvasWidth = ctx.canvas.width / (this.params.dpr || 1);
    const canvasHeight = ctx.canvas.height / (this.params.dpr || 1);
    
    const compColor = this.getComplementaryColor(baseBgColor);
    
    const numShapes = Math.random() > 0.5 ? 1 : 2;
    for (let i = 0; i < numShapes; i++) {
      const shapeType = Math.random() > 0.5 ? 'arch' : 'rect';
      const size = Math.min(canvasWidth, canvasHeight) * (0.3 + Math.random() * 0.2);
      const x = canvasWidth * (0.2 + Math.random() * 0.6) - size / 2;
      const y = canvasHeight * (0.2 + Math.random() * 0.6) - size / 2;
      
      ctx.save();
      ctx.fillStyle = compColor;
      ctx.globalAlpha = 0.5 + Math.random() * 0.3;
      ctx.beginPath();
      if (shapeType === 'arch') {
        ctx.moveTo(x, y + size);
        ctx.arc(x + size/2, y + size * 0.6, size/2, Math.PI, 0, false);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
      } else {
        ctx.rect(x, y, size, size);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  private drawMask(type: ShapeType, x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    
    if (type === 'door') {
      ctx.rect(x, y, w, h);
    }
    else if (type === 'window') {
      ctx.rect(x, y, w, h);
      ctx.moveTo(x + w/2, y);
      ctx.lineTo(x + w/2, y + h);
      ctx.moveTo(x, y + h/2);
      ctx.lineTo(x + w, y + h/2);
    }
    else if (type === 'arch') {
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + h*0.6);
      ctx.arc(x + w/2, y + h*0.6, w/2, Math.PI, 0);
      ctx.lineTo(x + w, y + h);
    }
    else if (type === 'column') {
      ctx.moveTo(x + w*0.2, y);
      ctx.rect(x + w*0.2, y, w*0.6, h);
    }
    else if (type === 'cornice') {
      const bar = h * 0.2;
      ctx.rect(x, y, w, bar);
    }
  }
  
  public drawPlan(plan: PolygonMaskPlacement[]): void {
    console.log('[ArchEffect drawPlan()] Start. Images available:', this.images.length, 'Single image:', this.singleImage ? { src: this.singleImage.src, complete: this.singleImage.complete } : 'undefined');
    this.imageMode = this.params.imageMode || 'unique';
    if (this.imageMode === 'single' && this.images.length > 0 && (!this.singleImage || !this.singleImage.complete)) {
      this.singleImage = this.images[Math.floor(Math.random() * this.images.length)];
    }
    
    const mainBgColorForEcho = this.params.bgColor || '#FFFFFF';
    let imgIndex = 0;

    plan.forEach((placement) => {
      const extendedPlacement = placement as ExtendedMaskPlacement;
      const { maskName, x, y, width: maskWidth, height: maskHeight, rotation, polygon } = placement;
      
      this.ctx.save(); // Outer save for each placement
      try {
        let path: Path2D;
        let maskAspectRatio = 1; // Track the original mask aspect ratio
        
        // Get mask path
        if (polygon && polygon.length >= 3) {
          path = new Path2D();
          // Convert polygon points to 0-100 space relative to maskWidth/Height
          path.moveTo((polygon[0].x - x) * 100 / maskWidth, (polygon[0].y - y) * 100 / maskHeight); 
          for (let i = 1; i < polygon.length; i++) {
            path.lineTo((polygon[i].x - x) * 100 / maskWidth, (polygon[i].y - y) * 100 / maskHeight);
          }
          path.closePath();
          maskAspectRatio = maskWidth / maskHeight;
        } else if (maskName.includes('/')) {
          const [family, type] = maskName.split('/');
          const maskFn = maskRegistry[family]?.[type];
          if (maskFn) {
            // FIXED: Let the mask registry handle its own proportions
            // No need to override mask parameters - the registry creates proper shapes
            let svgParams = {};
            
            let svgDesc = maskFn(svgParams); // Call with calculated parameters
            let svg = '';
            if (svgDesc && svgDesc.kind === 'svg' && typeof svgDesc.getSvg === 'function') {
              svg = svgDesc.getSvg(); // Call getSvg on the descriptor without arguments
            }
            const maskPathFromSvg = svgToPath2D(svg);
            path = maskPathFromSvg || new Path2D();
            if (!maskPathFromSvg) path.rect(0, 0, 100, 100);
            
            // The mask registry creates properly proportioned SVGs
            maskAspectRatio = placement.width / placement.height;
            console.log(`[ArchitecturalEffect] Using ${maskName} with placement ratio: ${maskAspectRatio.toFixed(2)} (w:${placement.width.toFixed(1)} h:${placement.height.toFixed(1)})`);
          } else {
            console.warn(`Mask not found in registry: ${maskName}, using fallback rectangle.`);
            path = new Path2D(); path.rect(0, 0, 100, 100);
            maskAspectRatio = maskWidth / maskHeight;
          }
        } else {
           console.warn(`Mask name ${maskName} does not conform to 'family/type' format, using fallback rectangle.`);
           path = new Path2D(); path.rect(0,0,100,100);
           maskAspectRatio = maskWidth / maskHeight;
        }

        // Apply transformations for the current element
        this.ctx.translate(placement.x + placement.width / 2, placement.y + placement.height / 2); 
        if (rotation) this.ctx.rotate(rotation * Math.PI / 180);
        this.ctx.translate(-placement.width / 2, -placement.height / 2); 
        
        // CRITICAL FIX: Use UNIFORM scaling to prevent any distortion
        // Calculate uniform scale that maintains proper proportions
        const scaleX = placement.width / 100;
        const scaleY = placement.height / 100;
        const uniformScale = Math.min(scaleX, scaleY); // Use smaller scale to prevent stretching
        
        // Calculate the actual rendered size with uniform scaling
        const renderedWidth = 100 * uniformScale;
        const renderedHeight = 100 * uniformScale;
        
        // Center the uniformly scaled mask within the placement area
        const offsetX = (placement.width - renderedWidth) / 2;
        const offsetY = (placement.height - renderedHeight) / 2;
        
        // Apply the centering offset
        this.ctx.translate(offsetX, offsetY);
        
        // Apply uniform scaling - this prevents any distortion
        this.ctx.scale(uniformScale, uniformScale);
        
        // Use the standard mask dimensions (100x100) for image scaling
        const effectiveWidth = 100;
        const effectiveHeight = 100;
        
        console.log(`[ArchitecturalEffect] Applied UNIFORM scaling for ${maskName}: scale(${uniformScale.toFixed(2)}, ${uniformScale.toFixed(2)}) - prevents distortion`);
        console.log(`[ArchitecturalEffect] Rendered size: ${renderedWidth.toFixed(1)}x${renderedHeight.toFixed(1)}, centered with offset: ${offsetX.toFixed(1)}, ${offsetY.toFixed(1)}`);
        
        this.ctx.clip(path); 

        let drawStandardEcho = false;
        let useOverlapEcho = false;
        let useArchSeriesEcho = false;
        let echoColorToUse = 'transparent';
        let finalImageOpacity = this.params.elementOpacity !== undefined ? this.params.elementOpacity : 1.0;
        let imageBlendMode = (this.params.useMultiply !== false ? 'multiply' : 'source-over') as GlobalCompositeOperation;
        let finalEchoOpacity = this.params.echoOpacity !== undefined ? this.params.echoOpacity : 0.7;

        // Check for arch series specific echo settings
        if ((placement as any).useColorBlockEcho) {
          useArchSeriesEcho = true;
          const echoType = (placement as any).echoType || 'complementary';
          
          if (echoType === 'complementary') {
            // FIXED: Use a lighter version of the complementary color for color block echo
            const baseComplementary = this.getComplementaryColor(mainBgColorForEcho);
            echoColorToUse = this.lightenColor(baseComplementary, 0.3); // Lighten by 30%
          } else if (echoType === 'background') {
            // FIXED: Use a slightly tinted version of the background color
            echoColorToUse = this.lightenColor(mainBgColorForEcho, 0.2); // Lighten by 20%
          }
          
          finalImageOpacity = 1.0;
          imageBlendMode = 'multiply';
          finalEchoOpacity = 0.6; // Reduced from 0.8 for better transparency
          console.log(`[ArchitecturalEffect] Arch Series Echo for ${maskName}: ${echoType} color (lightened)`);
        } else if (extendedPlacement.overlapEcho?.active) {
          useOverlapEcho = true;
          console.log(`[ArchitecturalEffect] Overlap Echo active for ${maskName}`);
          const baseEchoColor = extendedPlacement.overlapEcho.useComplementary
            ? this.getComplementaryColor(mainBgColorForEcho)
            : mainBgColorForEcho;
          // FIXED: Lighten overlap echo colors too
          echoColorToUse = this.lightenColor(baseEchoColor, 0.25); // Lighten by 25%
          finalImageOpacity = 1.0;
          imageBlendMode = 'multiply';
          finalEchoOpacity = 0.7; // Reduced from 0.85
        } else if (this.params.useColorBlockEcho) {
          const policy = this.params.echoPolicy || 'subset';
          if (policy === 'all' || (policy === 'subset' && (maskName.length + x + y) % 10 < 5) ) {
            drawStandardEcho = true;
            console.log(`[ArchitecturalEffect] Standard Echo for ${maskName}`);
            // FIXED: Use lighter complementary color for standard echo too
            const baseComplementary = this.getComplementaryColor(mainBgColorForEcho);
            echoColorToUse = this.lightenColor(baseComplementary, 0.3); // Lighten by 30%
            imageBlendMode = 'multiply'; 
          }
        }

        if (useOverlapEcho || drawStandardEcho || useArchSeriesEcho) {
          // FIXED: Draw the echo color using the mask path to match the exact shape
          this.ctx.fillStyle = echoColorToUse;
          this.ctx.globalAlpha = finalEchoOpacity;
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.fill(path); // Use the mask path to ensure perfect shape matching
          console.log(`[ArchitecturalEffect] Drew shaped echo for ${maskName} using mask path`);
        }

        let imageToDraw: HTMLImageElement | undefined;
        if (this.imageMode === 'single') {
            imageToDraw = this.singleImage;
        } else if (this.images.length > 0) {
            // Handle image_role preference for arch series
            if ((placement as any).image_role && this.images.length > 0) {
              const preferred_role = (placement as any).image_role;
              const filteredImages = this.images.filter(img => 
                (img as any).image_role === preferred_role
              );
              
              if (filteredImages.length > 0) {
                imageToDraw = filteredImages[imgIndex % filteredImages.length];
              } else {
                // Fallback to any available image
                imageToDraw = this.images[imgIndex % this.images.length];
              }
            } else {
              imageToDraw = this.images[imgIndex % this.images.length];
            }
            
            if (this.imageMode === 'unique') imgIndex++; // Corrected: check for 'unique' not '!== single'
        }

        console.log(`[ArchEffect drawPlan Loop] Mask ${maskName}: imageMode='${this.imageMode}', Image: ${imageToDraw ? imageToDraw.src.substring(imageToDraw.src.lastIndexOf('/')+1) : 'N/A'}, Complete: ${imageToDraw?.complete}, Broken: ${(imageToDraw as any)?.isBroken}`);

        // Check if this should be solid color only (for arch series)
        const useSolidColor = this.params.promptText === 'archSeries' && (placement as any).useSolidColor;
        
        if (useSolidColor) {
          // FIXED: Draw solid color using the mask path for perfect shape matching
          this.ctx.fillStyle = echoColorToUse || this.getComplementaryColor(mainBgColorForEcho);
          this.ctx.globalAlpha = 1.0;
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.fill(path); // Use the mask path for perfect shape matching
          console.log(`[ArchitecturalEffect] Drew solid color for ${maskName} using mask path: ${this.ctx.fillStyle}`);
        } else if (imageToDraw && imageToDraw.complete && !(imageToDraw as any)?.isBroken) {
          // FIXED: Use the standard mask dimensions for proper image scaling
          drawImageInMask(this.ctx, imageToDraw, effectiveWidth, effectiveHeight, {
            maskAspectRatio: maskAspectRatio,
            opacity: finalImageOpacity,
            blendMode: imageBlendMode
          });
          
          console.log(`[ArchitecturalEffect] Drew image for ${maskName} using utility function. Mask area: ${effectiveWidth}x${effectiveHeight}, ratio: ${maskAspectRatio.toFixed(2)}, blend: ${imageBlendMode}, opacity: ${finalImageOpacity}`);
        } else {
            console.warn(`[ArchitecturalEffect] Image for mask ${maskName} not drawn${useSolidColor ? ' (using solid color instead)' : ''}.`);
        }

      } catch (error) {
        console.error('Error drawing architectural element:', placement.maskName, error);
      } finally {
        this.ctx.restore(); 
      }
    });
  }
  
  public generateArchitecturalPlan(): MaskPlacement[] {
    // FIXED: Use actual canvas pixel dimensions
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;

    const numPrimary = 1 + Math.floor(Math.random() * 3);
    const placements: MaskPlacement[] = [];
    for (let i = 0; i < numPrimary; i++) {
      const maskName = pickFavoredMask();
      const w = canvasWidth * (0.3 + Math.random() * 0.3);
      const h = canvasHeight * (0.3 + Math.random() * 0.3);
      const x = Math.random() * (canvasWidth - w);
      const y = Math.random() * (canvasHeight - h);
      placements.push({
        maskName,
        x,
        y,
        width: w,
        height: h,
        rotation: pickRotation90(),
        layer: 1
      });
    }
    const numSecondary = Math.floor(Math.random() * 3);
    for (let i = 0; i < numSecondary; i++) {
      const maskName = pickFavoredMask();
      const w = canvasWidth * (0.15 + Math.random() * 0.15);
      const h = canvasHeight * (0.15 + Math.random() * 0.15);
      const x = Math.random() * (canvasWidth - w);
      const y = Math.random() * (canvasHeight - h);
      placements.push({
        maskName,
        x,
        y,
        width: w,
        height: h,
        rotation: pickRotation90(),
        layer: 2
      });
    }
    return placements;
  }

  private generateRandomArchitecturalPlan(): MaskPlacement[] {
    const plan: MaskPlacement[] = [];
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    
    plan.push({
      maskName: 'cornice',
      x: width * 0.1,
      y: height * 0.1,
      width: width * 0.8,
      height: height * 0.1,
      rotation: 0,
      layer: 1
    });
    
    plan.push({
      maskName: 'column',
      x: width * 0.1,
      y: height * 0.2,
      width: width * 0.1,
      height: height * 0.7,
      rotation: 0,
      layer: 1
    });
    
    plan.push({
      maskName: 'column',
      x: width * 0.8,
      y: height * 0.2,
      width: width * 0.1,
      height: height * 0.7,
      rotation: 0,
      layer: 1
    });
    
    const numWindows = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numWindows; i++) {
      const xPos = width * (0.2 + (i * 0.8 / (numWindows + 1)));
      plan.push({
        maskName: 'window',
        x: xPos,
        y: height * 0.3,
        width: width * 0.15,
        height: height * 0.2,
        rotation: 0,
        layer: 2
      });
      
      plan.push({
        maskName: 'arch',
        x: xPos - width * 0.05,
        y: height * 0.25,
        width: width * 0.25,
        height: height * 0.15,
        rotation: 0,
        layer: 3
      });
    }
    
    plan.push({
      maskName: 'door',
      x: width * 0.4,
      y: height * 0.7,
      width: width * 0.2,
      height: height * 0.2,
      rotation: 0,
      layer: 2
    });
    
    return plan;
  }
}

function voronoiFragments(placement: PolygonMaskPlacement, numFragments = 4): PolygonMaskPlacement[] {
  const { x, y, width, height, ...rest } = placement;
  const points = Array.from({ length: numFragments }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));
  points.push({ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height });
  const cells: PolygonMaskPlacement[] = [];
  for (let i = 0; i < numFragments; i++) {
    const px = points[i].x, py = points[i].y;
    const jitter = (v: number) => v + (Math.random() - 0.5) * width * 0.1;
    const poly = [
      { x: jitter(px - width * 0.15), y: jitter(py - height * 0.15) },
      { x: jitter(px + width * 0.15), y: jitter(py - height * 0.15) },
      { x: jitter(px + width * 0.15), y: jitter(py + height * 0.15) },
      { x: jitter(px - width * 0.15), y: jitter(py + height * 0.15) },
    ].map(pt => ({ x: Math.max(0, Math.min(width, pt.x)), y: Math.max(0, Math.min(height, pt.y)) }));
    cells.push({
      ...rest,
      x, y, width, height,
      polygon: poly,
    });
  }
  return cells;
}

function organicFragmentGrid(
  placement: PolygonMaskPlacement,
  rows: number,
  cols: number,
  jitterRatio = 0.04,
  gapRatio = 0.02
): PolygonMaskPlacement[] {
  const { x, y, width, height, ...rest } = placement;
  const points: { x: number, y: number }[][] = [];
  for (let r = 0; r <= rows; r++) {
    points[r] = [];
    for (let c = 0; c <= cols; c++) {
      const px = x + (c * width) / cols;
      const py = y + (r * height) / rows;
      const jx = px + (Math.random() - 0.5) * width * jitterRatio;
      const jy = py + (Math.random() - 0.5) * height * jitterRatio;
      points[r][c] = { x: jx, y: jy };
    }
  }
  const fragments: PolygonMaskPlacement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const centerX = (points[r][c].x + points[r][c+1].x + points[r+1][c+1].x + points[r+1][c].x) / 4;
      const centerY = (points[r][c].y + points[r][c+1].y + points[r+1][c+1].y + points[r+1][c].y) / 4;
      const shrink = (pt: {x: number, y: number}) => ({
        x: centerX + (pt.x - centerX) * (1 - gapRatio),
        y: centerY + (pt.y - centerY) * (1 - gapRatio),
      });
      fragments.push({
        ...rest,
        x: centerX, y: centerY,
        width: width / cols, height: height / rows,
        rotation: 0,
        polygon: [
          shrink(points[r][c]),
          shrink(points[r][c+1]),
          shrink(points[r+1][c+1]),
          shrink(points[r+1][c]),
        ]
      });
    }
  }
  return fragments;
}
