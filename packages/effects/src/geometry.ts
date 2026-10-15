export interface EffectPoint { x: number; y: number }
export type EffectAnchorSide = 'top' | 'right' | 'bottom' | 'left' | 'center';
export type EffectPathKind = 'straight' | 'curve' | 'rail';
export interface EffectRect { left: number; top: number; width: number; height: number }
export interface EffectCoordinateSpace {
  rect: EffectRect;
  width: number;
  height: number;
  borderLeft?: number;
  borderTop?: number;
  scrollLeft?: number;
  scrollTop?: number;
}
export interface EffectPathOptions { route?: EffectPathKind; bend?: number }

const finite = (point: EffectPoint) => Number.isFinite(point.x) && Number.isFinite(point.y);

/** An edge midpoint in viewport coordinates, before conversion to the overlay's space. */
export function effectAnchorPoint(rect: EffectRect, side: EffectAnchorSide = 'center'): EffectPoint {
  return {
    x: rect.left + rect.width * (side === 'left' ? 0 : side === 'right' ? 1 : .5),
    y: rect.top + rect.height * (side === 'top' ? 0 : side === 'bottom' ? 1 : .5),
  };
}

/** Convert a viewport point to an absolute child's local coordinate system. */
export function toEffectPoint(point: EffectPoint, space: EffectCoordinateSpace): EffectPoint | null {
  const { rect, width, height } = space;
  if (!finite(point) || ![rect.left, rect.top, rect.width, rect.height, width, height].every(Number.isFinite)
    || rect.width <= 0 || rect.height <= 0 || width <= 0 || height <= 0) return null;
  const local = {
    x: (point.x - rect.left) * width / rect.width - (space.borderLeft ?? 0) + (space.scrollLeft ?? 0),
    y: (point.y - rect.top) * height / rect.height - (space.borderTop ?? 0) + (space.scrollTop ?? 0),
  };
  return finite(local) ? local : null;
}

/** Deterministic SVG geometry. No routing, layout, animation or DOM ownership. */
export function createEffectPath(from: EffectPoint, to: EffectPoint, { route = 'straight', bend = 24 }: EffectPathOptions = {}): string {
  if (!finite(from) || !finite(to)) return '';
  const gap = Number.isFinite(bend) ? Math.max(0, bend) : 24;
  const start = `M${from.x} ${from.y}`;
  if (route === 'rail') {
    const rail = Math.max(from.y, to.y) + gap;
    return Number.isFinite(rail) ? `${start}V${rail}H${to.x}V${to.y}` : '';
  }
  if (route === 'curve') {
    const middle = from.x / 2 + to.x / 2;
    if (![middle, from.y + gap, to.y + gap].every(Number.isFinite)) return '';
    return `${start}C${middle} ${from.y + gap} ${middle} ${to.y + gap} ${to.x} ${to.y}`;
  }
  return `${start}L${to.x} ${to.y}`;
}
