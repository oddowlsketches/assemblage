export interface MaskPlacement {
  maskName: string;
  x: number;     // relative 0–1 across canvas
  y: number;     // relative 0–1
  width: number; // relative 0–1 of canvas width
  height: number;// relative 0–1 of canvas height
  rotation?: number; // degrees
}

export interface Template {
  key: string;          // e.g. "archesRow", "windowsGrid", "houseFacade", "slicedLegacy"
  name: string;         // human-friendly
  placements: MaskPlacement[];
  defaultBG?: string;   // optional default background color
}

export const templates: Template[] = [
  {
    key: "archesRow",
    name: "Row of Three Arches",
    placements: [
      { maskName: "arch", x: 0.10, y: 0.50, width: 0.25, height: 0.40 },
      { maskName: "arch", x: 0.50, y: 0.50, width: 0.25, height: 0.40 },
      { maskName: "arch", x: 0.90, y: 0.50, width: 0.25, height: 0.40 }
    ],
    defaultBG: "#eeeeee"
  },
  {
    key: "windowsGrid",
    name: "Grid of Windows",
    placements: [
      { maskName: "window", x: 0.25, y: 0.25, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.50, y: 0.25, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.75, y: 0.25, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.25, y: 0.50, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.50, y: 0.50, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.75, y: 0.50, width: 0.20, height: 0.20 }
    ],
    defaultBG: "#ffffff"
  },
  {
    key: "slicedLegacy",
    name: "Sliced Legacy",
    placements: [
      { maskName: "window", x: 0.10, y: 0.10, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.30, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.50, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.70, width: 0.80, height: 0.10, rotation: 0 },
      { maskName: "window", x: 0.10, y: 0.90, width: 0.80, height: 0.10, rotation: 0 }
    ],
    defaultBG: "#ffffff"
  },
  {
    key: "altarComposition",
    name: "Altar Composition",
    placements: [
      { maskName: "arch", x: 0.50, y: 0.50, width: 0.40, height: 0.40 },
      { maskName: "arch", x: 0.50, y: 0.30, width: 0.30, height: 0.30 },
      { maskName: "arc", x: 0.50, y: 0.20, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.25, y: 0.50, width: 0.20, height: 0.20 },
      { maskName: "window", x: 0.75, y: 0.50, width: 0.20, height: 0.20 }
    ],
    defaultBG: "#f5f5f5"
  }
]; 