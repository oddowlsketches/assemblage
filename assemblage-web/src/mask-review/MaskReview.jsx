import React, { useState } from 'react';
import { maskRegistry } from '../masks/maskRegistry';

function getRandomParams(type) {
  // Generate random params for each mask type
  switch (type) {
    case 'sliceHorizontalWide':
    case 'sliceHorizontalNarrow':
      return { offset: Math.floor(Math.random() * 31) - 15, rotation: Math.floor(Math.random() * 41) - 20 };
    case 'slice3xHorizontal':
      return { spacing: Math.floor(Math.random() * 21) + 5, random: Math.random() > 0.5 };
    case 'sliceVerticalWide':
    case 'sliceVerticalNarrow':
      return { offset: Math.floor(Math.random() * 31) - 15, rotation: Math.floor(Math.random() * 41) - 20 };
    case 'slice4xMixed':
      return {};
    case 'sliceAngled':
      return { angle: Math.floor(Math.random() * 21) - 10 };
    case 'archClassical':
      return { width: Math.floor(Math.random() * 61) + 40, height: Math.floor(Math.random() * 51) + 20, legHeight: Math.floor(Math.random() * 41) + 10 };
    case 'archFlat':
    case 'triptychArch':
    case 'windowRect':
    case 'windowGrid':
    case 'columnPair':
    case 'columnSingle':
    case 'columnTriplet':
    case 'facadeGrid':
      return {};
    case 'blobIrregular':
    case 'polygonSoft':
      return { rotation: Math.floor(Math.random() * 360) };
    case 'blobCrescent':
    case 'cloudLike':
    case 'archBlob':
      return {};
    case 'abstractRotated':
      return { mask: ['blobIrregular', 'blobCrescent', 'polygonSoft', 'cloudLike', 'archBlob'][Math.floor(Math.random() * 5)], rotation: Math.floor(Math.random() * 360) };
    case 'nicheArch':
    case 'nicheCluster':
    case 'circleInset':
    case 'nicheStack':
    case 'circleAboveArch':
      return {};
    case 'nicheOffset':
      return { offset: Math.floor(Math.random() * 21) - 10 };
    case 'panelRectWide':
      return { align: ['center', 'top', 'bottom'][Math.floor(Math.random() * 3)] };
    case 'panelRectTall':
      return { align: ['left', 'right', 'center'][Math.floor(Math.random() * 3)] };
    case 'panelSquare':
      return { align: ['center', 'left', 'right', 'top', 'bottom'][Math.floor(Math.random() * 5)] };
    case 'panelOverlap':
      return { angle: Math.floor(Math.random() * 21) - 10 };
    case 'panelLShape':
      return {};
    case 'panelGutter':
      return { margin: Math.floor(Math.random() * 16) + 5 };
    case 'houseGable':
      return { width: Math.floor(Math.random() * 31) + 30, baseHeight: Math.floor(Math.random() * 41) + 40, roofHeight: Math.floor(Math.random() * 21) + 20 };
    case 'gableAltar':
      return { width: Math.floor(Math.random() * 49) + 40, baseHeight: Math.floor(Math.random() * 41) + 40, gableHeight: Math.floor(Math.random() * 31) + 30 };
    case 'circleMask':
      return { r: Math.floor(Math.random() * 51) + 20 };
    case 'ovalMask':
      return { rx: Math.floor(Math.random() * 41) + 20, ry: Math.floor(Math.random() * 31) + 10 };
    case 'diamondMask':
      return { w: Math.floor(Math.random() * 61) + 20, h: Math.floor(Math.random() * 61) + 20 };
    case 'hexagonMask':
      return { r: Math.floor(Math.random() * 41) + 20 };
    case 'semiCircleMask':
      return { r: Math.floor(Math.random() * 41) + 20, orientation: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] };
    case 'triangleMask':
      return { size: Math.floor(Math.random() * 61) + 20, orientation: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] };
    case 'beamMask':
      return { widthTop: Math.floor(Math.random() * 101) + 40, widthBottom: Math.floor(Math.random() * 61) + 20, height: Math.floor(Math.random() * 101) + 40, angle: Math.floor(Math.random() * 360) - 180, offsetX: Math.floor(Math.random() * 101) + 20, offsetY: Math.floor(Math.random() * 101) + 20 };
    default:
      return {};
  }
}

export default function MaskReview() {
  const [uniqueMode, setUniqueMode] = useState(false);
  // Parameter presets for each mask type
  const paramPresets = {
    // SLICED
    sliceHorizontalWide: [
      { offset: 0, rotation: 0 },
      { offset: -15, rotation: 0 },
      { offset: 15, rotation: 10 },
      { offset: 0, rotation: -15 },
    ],
    sliceHorizontalNarrow: [
      { offset: 0 }, { offset: 10 }, { offset: -10 }, { rotation: 15 }
    ],
    slice3xHorizontal: [
      { spacing: 10, random: false }, { spacing: 20, random: true }
    ],
    sliceVerticalWide: [
      { offset: 0 }, { offset: 10 }, { offset: -10 }, { rotation: 15 }
    ],
    sliceVerticalNarrow: [
      { offset: 0 }, { offset: 10 }, { offset: -10 }, { rotation: -10 }
    ],
    slice4xMixed: [{}],
    sliceAngled: [ { angle: 10 }, { angle: -15 } ],
    // ARCHITECTURAL
    archClassical: [
      { width: 60, height: 40, legHeight: 30 }, // classic
      { width: 60, height: 20, legHeight: 40 }, // shallow
      { width: 40, height: 50, legHeight: 20 }, // tall, narrow
      { width: 80, height: 30, legHeight: 20 }, // wide, low
      { width: 60, height: 40, legHeight: 10 }, // short legs
    ],
    archFlat: [ {} ],
    triptychArch: [
      { archWidth: 18, archHeight: 24, spacing: 5 }, // default
      { archWidth: 14, archHeight: 30, spacing: 8 }, // tall, narrow, more space
      { archWidth: 22, archHeight: 18, spacing: 2 }, // wide, shallow, tight
      { archWidth: 16, archHeight: 28, spacing: 10 }, // medium, tall, loose
    ],
    windowRect: [ {} ],
    windowGrid: [ {} ],
    columnPair: [ {} ],
    columnSingle: [ {} ],
    columnTriplet: [ {} ],
    facadeGrid: [ {} ],
    // ABSTRACT
    blobIrregular: [ { rotation: 0 }, { rotation: 30 }, { rotation: 60 } ],
    blobCrescent: [ {} ],
    polygonSoft: [ { rotation: 0 }, { rotation: 45 } ],
    cloudLike: [
      { count: 3, seed: 1 },
      { count: 4, seed: 2 },
      { count: 5, seed: 3 },
      { count: 3, seed: 4 },
    ],
    archBlob: [
      { width: 60, height: 30, baseHeight: 15, archiness: 0.5 },
      { width: 50, height: 40, baseHeight: 10, archiness: 0.8 },
      { width: 70, height: 20, baseHeight: 20, archiness: 0.2 },
      { width: 60, height: 30, baseHeight: 25, archiness: 0.7 },
    ],
    abstractRotated: [ {}, { mask: 'polygonSoft' }, { mask: 'blobIrregular', rotation: 90 } ],
    // ALTAR
    nicheArch: [
      { width: 28, height: 44, legHeight: 30 },
      { width: 20, height: 50, legHeight: 20 },
      { width: 36, height: 30, legHeight: 40 },
    ],
    nicheCluster: [
      { width: 12, height: 20, legHeight: 12, spacing: 6 },
      { width: 10, height: 28, legHeight: 10, spacing: 8 },
      { width: 16, height: 16, legHeight: 16, spacing: 4 },
    ],
    nicheStack: [
      { width: 36, height: 28, legHeight: 18, smallWidth: 10, smallHeight: 10, smallLeg: 6, spacing: 2 },
      { width: 30, height: 36, legHeight: 10, smallWidth: 8, smallHeight: 12, smallLeg: 8, spacing: 4 },
    ],
    circleInset: [ {} ],
    circleAboveArch: [
      { width: 28, height: 44, legHeight: 30, circleY: 30, circleR: 10 },
      { width: 20, height: 50, legHeight: 20, circleY: 22, circleR: 8 },
      { width: 36, height: 30, legHeight: 40, circleY: 36, circleR: 12 },
    ],
    nicheOffset: [
      { offset: 10, width: 28, height: 44, legHeight: 30, smallWidth: 14, smallHeight: 20, smallLeg: 16 },
      { offset: -10, width: 28, height: 44, legHeight: 30, smallWidth: 14, smallHeight: 20, smallLeg: 16 },
      { offset: 5, width: 36, height: 30, legHeight: 40, smallWidth: 10, smallHeight: 16, smallLeg: 10 },
    ],
    // NARRATIVE
    panelRectWide: [ { align: 'center' }, { align: 'top' }, { align: 'bottom' } ],
    panelRectTall: [ { align: 'left' }, { align: 'right' }, { align: 'center' } ],
    panelSquare: [ { align: 'center' }, { align: 'left' }, { align: 'right' }, { align: 'top' }, { align: 'bottom' } ],
    panelOverlap: [ { angle: 10 }, { angle: -10 } ],
    panelLShape: [ {} ],
    panelGutter: [ { margin: 10 }, { margin: 20 } ],
    houseGable: [
      { width: 30, baseHeight: 40, roofHeight: 20 },
      { width: 24, baseHeight: 30, roofHeight: 30 },
      { width: 36, baseHeight: 36, roofHeight: 18 },
    ],
    gableAltar: [
      { width: 40, baseHeight: 40, gableHeight: 30 },
      { width: 32, baseHeight: 32, gableHeight: 36 },
      { width: 48, baseHeight: 28, gableHeight: 24 },
    ],
    // BASIC
    circleMask: [
      { r: 30 },
      { r: 20 },
      { r: 40 },
    ],
    ovalMask: [
      { rx: 32, ry: 20 },
      { rx: 20, ry: 32 },
      { rx: 24, ry: 12 },
    ],
    diamondMask: [
      { w: 40, h: 40 },
      { w: 30, h: 50 },
      { w: 50, h: 30 },
    ],
    hexagonMask: [
      { r: 28 },
      { r: 20 },
      { r: 36 },
    ],
    semiCircleMask: [
      { r: 30, orientation: 'up' },
      { r: 30, orientation: 'down' },
      { r: 30, orientation: 'left' },
      { r: 30, orientation: 'right' },
    ],
    triangleMask: [
      { size: 40, orientation: 'up' },
      { size: 40, orientation: 'down' },
      { size: 40, orientation: 'left' },
      { size: 40, orientation: 'right' },
    ],
    beamMask: [
      { widthTop: 80, widthBottom: 40, height: 80, angle: 0, offsetX: 50, offsetY: 60 },
      { widthTop: 60, widthBottom: 60, height: 60, angle: 20, offsetX: 50, offsetY: 50 },
      { widthTop: 100, widthBottom: 20, height: 90, angle: -15, offsetX: 60, offsetY: 55 },
      { widthTop: 40, widthBottom: 80, height: 70, angle: 10, offsetX: 40, offsetY: 65 },
    ],
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>SVG Mask System Review</h1>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <label style={{ fontWeight: 500, fontSize: '1.1rem' }}>
          <input
            type="checkbox"
            checked={uniqueMode}
            onChange={e => setUniqueMode(e.target.checked)}
            style={{ marginRight: '0.5em' }}
          />
          Show unique (randomized) variant for each mask
        </label>
      </div>
      {Object.entries(maskRegistry).map(([family, types]) => (
        <div key={family} style={{ marginBottom: '3rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px #0001', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{family}</div>
          {Object.entries(types).map(([type, fn]) => (
            <div key={type}>
              <div style={{ fontSize: '1.1rem', margin: '1.2rem 0 0.5rem 0', color: '#444' }}>{type}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {uniqueMode && (
                  (() => {
                    const params = getRandomParams(type);
                    const svgString = fn(params);
                    return (
                      <div key="unique" style={{ width: '150px', background: '#ffe7b2', borderRadius: '8px', boxShadow: '0 1px 4px #0001', padding: '1rem 0.5rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid #ffb300' }}>
                        <div style={{ width: '120px', height: '120px', background: '#222', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div
                            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            dangerouslySetInnerHTML={{ __html: svgString }}
                          />
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.2rem', textAlign: 'center', color: '#b26a00' }}>unique</div>
                        <div style={{ color: '#555', fontSize: '0.95rem', textAlign: 'center', wordBreak: 'break-all' }}>
                          {JSON.stringify(params)}
                        </div>
                      </div>
                    );
                  })()
                )}
                {(paramPresets[type] || [{}]).map((params, i) => {
                  const svgString = fn(params);
                  // console.log(`SVG for ${type} with params`, params, ':', svgString);
                  return (
                    <div key={i} style={{ width: '150px', background: '#f4f4f4', borderRadius: '8px', boxShadow: '0 1px 4px #0001', padding: '1rem 0.5rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '120px', height: '120px', background: '#222', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div
                          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          dangerouslySetInnerHTML={{ __html: svgString }}
                        />
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.2rem', textAlign: 'center' }}>{type}</div>
                      <div style={{ color: '#555', fontSize: '0.95rem', textAlign: 'center', wordBreak: 'break-all' }}>
                        {JSON.stringify(params)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 