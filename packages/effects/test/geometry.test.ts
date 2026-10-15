import { describe, expect, it } from 'vitest';
import { createEffectPath, effectAnchorPoint, toEffectPoint } from '../src/geometry.js';

describe('effect geometry', () => {
  it('anchors every edge to its actual midpoint', () => {
    const rect = { left: 17, top: 23, width: 123, height: 57 };
    expect(effectAnchorPoint(rect, 'bottom')).toEqual({ x: 78.5, y: 80 });
    expect(effectAnchorPoint(rect, 'top')).toEqual({ x: 78.5, y: 23 });
    expect(effectAnchorPoint(rect, 'left')).toEqual({ x: 17, y: 51.5 });
    expect(effectAnchorPoint(rect, 'right')).toEqual({ x: 140, y: 51.5 });
    expect(effectAnchorPoint(rect)).toEqual({ x: 78.5, y: 51.5 });
  });
  it('converts viewport coordinates through scale, border and container scrolling', () => {
    expect(toEffectPoint({ x: 220, y: 140 }, {
      rect: { left: 100, top: 40, width: 400, height: 200 }, width: 200, height: 100,
      borderLeft: 3, borderTop: 2, scrollLeft: 17, scrollTop: 11,
    })).toEqual({ x: 74, y: 59 });
  });
  it('rejects zero-sized and nonfinite coordinate spaces', () => {
    expect(toEffectPoint({ x: 1, y: 2 }, { rect: { left: 0, top: 0, width: 0, height: 1 }, width: 10, height: 10 })).toBeNull();
    expect(createEffectPath({ x: NaN, y: 0 }, { x: 3, y: 4 })).toBe('');
  });
  it('uses the same endpoints for all routes without DOM or random state', () => {
    const from = { x: 10, y: 30 }, to = { x: 150, y: 50 };
    expect(createEffectPath(from, to)).toBe('M10 30L150 50');
    expect(createEffectPath(from, to, { route: 'rail', bend: 20 })).toBe('M10 30V70H150V50');
    expect(createEffectPath(from, to, { route: 'curve', bend: 20 })).toBe('M10 30C80 50 80 70 150 50');
    expect(createEffectPath(from, to, { route: 'rail', bend: Infinity })).not.toContain('Infinity');
  });
});
