export interface TangramPlacement {
  maskName: string; // e.g. "basic/tangramLargeTriangle"
  x: number;        // normalized 0–1
  y: number;
  width: number;    // normalized 0–1 (maps to viewBox 0–100)
  height: number;
  rotation: number; // degrees
}

export interface TangramArrangement {
  key: string;
  placements: TangramPlacement[];
}

export const tangramArrangements: TangramArrangement[] = [
  {
    key: 'classicSquare',
    placements: [
      { maskName: 'basic/tangramLargeTriangle',  x: 0,   y: 0,   width: 1, height: 1, rotation:   0 },
      { maskName: 'basic/tangramLargeTriangle2', x: 0,   y: 0,   width: 1, height: 1, rotation:   0 },
      { maskName: 'basic/tangramMediumTriangle', x: 0,   y: 0.5, width: 0.5, height: 0.5, rotation:   0 },
      { maskName: 'basic/tangramSquare',        x: 0.5, y: 0.5, width: 0.5, height: 0.5, rotation:   0 },
      { maskName: 'basic/tangramSmallTriangle1',x: 0,   y: 0,   width: 0.25, height: 0.25, rotation:   0 },
      { maskName: 'basic/tangramSmallTriangle2',x: 0.75,y: 0.25,width: 0.25, height: 0.25, rotation: -90 },
      { maskName: 'basic/tangramParallelogram', x: 0.5, y: 0,   width: 0.5, height: 0.25, rotation:   0 }
    ]
  },
  {
    key: 'radialStar',
    placements: [
      { maskName: 'basic/tangramLargeTriangle',  x: 0.5, y: 0,   width: 0.5, height: 0.5, rotation:   0 },
      { maskName: 'basic/tangramLargeTriangle2', x: 0.5, y: 0.5, width: 0.5, height: 0.5, rotation: 180 },
      { maskName: 'basic/tangramMediumTriangle', x: 0,   y: 0.5, width: 0.5, height: 0.5, rotation:  90 },
      { maskName: 'basic/tangramSmallTriangle1',x: 0.25,y: 0.25,width: 0.25, height: 0.25, rotation:   45 },
      { maskName: 'basic/tangramSmallTriangle2',x: 0.75,y: 0.25,width: 0.25, height: 0.25, rotation:  -45 },
      { maskName: 'basic/tangramSquare',        x: 0.25,y: 0.75,width: 0.25, height: 0.25, rotation:   0 },
      { maskName: 'basic/tangramParallelogram', x: 0.5, y: 0.25,width: 0.5, height: 0.25, rotation:   90 }
    ]
  }
]; 