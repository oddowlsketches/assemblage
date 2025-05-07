// Tangram Template (initial version)
// This template defines the 7 tangram pieces and a classic square arrangement.
// It renders each piece as a polygon mask and fills it with an image.

const tangramPieces = [
  // Large triangle 1
  [ {x:0, y:0}, {x:50, y:50}, {x:0, y:100} ],
  // Large triangle 2
  [ {x:0, y:0}, {x:100, y:0}, {x:50, y:50} ],
  // Medium triangle
  [ {x:100, y:0}, {x:100, y:100}, {x:50, y:50} ],
  // Small triangle 1
  [ {x:0, y:100}, {x:25, y:75}, {x:50, y:100} ],
  // Small triangle 2
  [ {x:75, y:75}, {x:100, y:100}, {x:50, y:100} ],
  // Square
  [ {x:25, y:75}, {x:50, y:50}, {x:75, y:75}, {x:50, y:100} ],
  // Parallelogram
  [ {x:25, y:75}, {x:50, y:50}, {x:75, y:25}, {x:50, y:0} ]
];

// Arrangements: each is an array of { piece, x, y, rotation, flip }
const tangramArrangements = [
  {
    name: 'Classic Square',
    pieces: [
      { piece: 0, x: 0, y: 0, rotation: 0, flip: false },
      { piece: 1, x: 0, y: 0, rotation: 0, flip: false },
      { piece: 2, x: 0, y: 0, rotation: 0, flip: false },
      { piece: 3, x: 0, y: 0, rotation: 0, flip: false },
      { piece: 4, x: 0, y: 0, rotation: 0, flip: false },
      { piece: 5, x: 0, y: 0, rotation: 0, flip: false },
      { piece: 6, x: 0, y: 0, rotation: 0, flip: false }
    ]
  },
  {
    name: 'Cat',
    pieces: [
      { piece: 0, x: 0, y: 0, rotation: 0, flip: false },
      { piece: 1, x: 50, y: 0, rotation: 45, flip: false },
      { piece: 2, x: 60, y: 40, rotation: 90, flip: false },
      { piece: 3, x: 20, y: 60, rotation: 0, flip: false },
      { piece: 4, x: 70, y: 70, rotation: 0, flip: false },
      { piece: 5, x: 40, y: 80, rotation: 0, flip: false },
      { piece: 6, x: 80, y: 20, rotation: 0, flip: true }
    ]
  }
];

function drawPolygon(ctx, points, fillStyle) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle || 'white';
  ctx.fill();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPolygonMask(ctx, points, drawImageFn) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.clip();
  drawImageFn();
  ctx.restore();
}

function transformPoints(points, x, y, rotation, flip) {
  // rotation in degrees, flip horizontally if true
  const rad = (rotation || 0) * Math.PI / 180;
  return points.map(pt => {
    let px = pt.x, py = pt.y;
    if (flip) px = 100 - px;
    // Rotate around (0,0)
    const rx = Math.cos(rad) * px - Math.sin(rad) * py;
    const ry = Math.sin(rad) * px + Math.cos(rad) * py;
    return { x: rx + x, y: ry + y };
  });
}

export function renderTangram(canvas, images, params) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Fill background color
  ctx.save();
  ctx.fillStyle = params.bgColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.save();
  ctx.scale(canvas.width / 100, canvas.height / 100);
  const arrangementIndex = params.arrangementIndex || 0;
  const arrangement = tangramArrangements[arrangementIndex] || tangramArrangements[0];

  // --- Auto-fit logic ---
  // 1. Transform all piece points and collect them
  let allTransformedPoints = [];
  const transformedPieces = arrangement.pieces.map(({ piece, x, y, rotation, flip }) => {
    const basePoints = tangramPieces[piece];
    const points = transformPoints(basePoints, x, y, rotation, flip);
    allTransformedPoints.push(...points);
    return points;
  });
  // 2. Compute bounding box
  const minX = Math.min(...allTransformedPoints.map(p => p.x));
  const minY = Math.min(...allTransformedPoints.map(p => p.y));
  const maxX = Math.max(...allTransformedPoints.map(p => p.x));
  const maxY = Math.max(...allTransformedPoints.map(p => p.y));
  const boxW = maxX - minX;
  const boxH = maxY - minY;
  // 3. Compute scale and offset to fit in 100x100
  const scale = Math.min(100 / boxW, 100 / boxH);
  const offsetX = (100 - boxW * scale) / 2 - minX * scale;
  const offsetY = (100 - boxH * scale) / 2 - minY * scale;

  for (let i = 0; i < arrangement.pieces.length; i++) {
    const points = transformedPieces[i].map(p => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY
    }));
    // Use pieceImageOrder for image assignment if available
    let imgIdx = i % images.length;
    if (params.pieceImageOrder && Array.isArray(params.pieceImageOrder)) {
      imgIdx = params.pieceImageOrder[i % params.pieceImageOrder.length] % images.length;
    }
    const img = images[imgIdx];
    drawPolygonMask(ctx, points, () => {
      if (img) {
        ctx.globalCompositeOperation = 'multiply';
        const minX = Math.min(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxX = Math.max(...points.map(p => p.x));
        const maxY = Math.max(...points.map(p => p.y));
        const polyW = maxX - minX;
        const polyH = maxY - minY;
        const destAspect = polyW / polyH;
        const imgAspect = img.width / img.height;
        let sx, sy, sWidth, sHeight;
        if (imgAspect > destAspect) {
          sHeight = img.height;
          sWidth = sHeight * destAspect;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = img.width;
          sHeight = sWidth / destAspect;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, minX, minY, polyW, polyH);
        ctx.globalCompositeOperation = 'source-over';
      }
    });
    if (window.debugTangram) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let j = 1; j < points.length; j++) {
        ctx.lineTo(points[j].x, points[j].y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  return canvas;
}

export const tangramArrangementOptions = tangramArrangements.map((a, i) => ({ label: a.name, value: i }));

export default {
  name: 'Tangram Puzzle',
  key: 'tangramPuzzle',
  render: renderTangram
}; 