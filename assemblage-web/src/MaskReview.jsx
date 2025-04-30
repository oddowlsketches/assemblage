import { maskRegistry } from './masks/maskRegistry';

export default function MaskReview() {
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
    archClassical: [ { height: 80 }, { height: 60, shallow: true }, { height: 90 } ],
    archFlat: [ {} ],
    triptychArch: [ {} ],
    windowRect: [ {} ],
    windowGrid: [ {} ],
    columnPair: [ {} ],
    // ABSTRACT
    blobIrregular: [ { rotation: 0 }, { rotation: 30 }, { rotation: 60 } ],
    blobCrescent: [ {} ],
    polygonSoft: [ { rotation: 0 }, { rotation: 45 } ],
    cloudLike: [ {} ],
    archBlob: [ {} ],
    // ALTAR
    nicheArch: [ {} ],
    nicheCluster: [ {} ],
    circleInset: [ {} ],
    nicheStack: [ {} ],
    // NARRATIVE
    panelRectWide: [ { align: 'center' }, { align: 'top' }, { align: 'bottom' } ],
    panelRectTall: [ { align: 'left' }, { align: 'right' }, { align: 'center' } ],
    panelSquare: [ { align: 'center' }, { align: 'left' }, { align: 'right' }, { align: 'top' }, { align: 'bottom' } ],
    panelOverlap: [ { angle: 10 }, { angle: -10 } ],
    panelLShape: [ {} ],
    panelGutter: [ { margin: 10 }, { margin: 20 } ],
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>SVG Mask System Review</h1>
      {Object.entries(maskRegistry).map(([family, types]) => (
        <div key={family} style={{ marginBottom: '3rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px #0001', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{family}</div>
          {Object.entries(types).map(([type, fn]) => (
            <div key={type}>
              <div style={{ fontSize: '1.1rem', margin: '1.2rem 0 0.5rem 0', color: '#444' }}>{type}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {(paramPresets[type] || [{}]).map((params, i) => (
                  <div key={i} style={{ width: '150px', background: '#f4f4f4', borderRadius: '8px', boxShadow: '0 1px 4px #0001', padding: '1rem 0.5rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '120px', height: '120px', background: '#e0e0e0', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div dangerouslySetInnerHTML={{ __html: fn(params) }} />
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.2rem', textAlign: 'center' }}>{type}</div>
                    <div style={{ color: '#555', fontSize: '0.95rem', textAlign: 'center', wordBreak: 'break-all' }}>
                      {JSON.stringify(params)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 