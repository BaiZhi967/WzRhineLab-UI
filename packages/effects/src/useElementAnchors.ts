'use client';

import * as React from 'react';
import { useInViewport, usePageVisible } from '@wzrhine/react';
import { effectAnchorPoint, toEffectPoint } from './geometry.js';
import type { EffectAnchorSide, EffectPoint } from './geometry.js';

export interface ElementAnchor {
  ref: React.RefObject<HTMLElement | null>;
  side?: EffectAnchorSide;
  offset?: EffectPoint;
}
export interface ElementAnchorsOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  anchors: Readonly<Record<string, ElementAnchor>>;
  active?: boolean;
  /** Follow transform-only motion while visible. Off by default; idle effects do not poll. */
  tracking?: boolean;
}
export interface ElementAnchorsResult {
  width: number;
  height: number;
  points: Readonly<Record<string, EffectPoint | null>>;
  refresh: () => void;
}
interface Geometry { width: number; height: number; points: Record<string, EffectPoint | null> }
const empty: Geometry = { width: 0, height: 0, points: {} };
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const sameGeometry = (a: Geometry, b: Geometry) => a.width === b.width && a.height === b.height
  && Object.keys(a.points).length === Object.keys(b.points).length
  && Object.keys(b.points).every((id) => id in a.points && a.points[id]?.x === b.points[id]?.x && a.points[id]?.y === b.points[id]?.y);

/** Measure actual edge midpoints in the positioning container's local CSS-pixel space. */
export function useElementAnchors({ containerRef, anchors, active = true, tracking = false }: ElementAnchorsOptions): ElementAnchorsResult {
  const visible = usePageVisible();
  const inView = useInViewport(containerRef);
  const [geometry, setGeometry] = React.useState<Geometry>(empty);
  const current = React.useRef({ anchors, active, tracking, visible, inView });
  current.current = { anchors, active, tracking, visible, inView };
  const manager = React.useRef<{ update: () => void; schedule: () => void } | null>(null);
  const refresh = React.useCallback(() => manager.current?.schedule(), []);

  useLayoutEffect(() => {
    let disposed = false;
    let frame = 0;
    let container: HTMLElement | null = null;
    let signature = '';
    let observed: Element[] = [];
    let resize: ResizeObserver | undefined;
    let mutation: MutationObserver | undefined;
    let listening = false;
    const documentObject = containerRef.current?.ownerDocument ?? document;
    const view = documentObject.defaultView ?? window;
    const canMeasure = () => current.current.active && current.current.visible;
    const publish = (value: Geometry) => setGeometry((previous) => sameGeometry(previous, value) ? previous : value);
    const measure = () => {
      if (disposed || !canMeasure()) return;
      const points: Geometry['points'] = {};
      const rect = container?.getBoundingClientRect();
      if (!container?.isConnected || !rect || !rect.width || !rect.height || !container.offsetWidth || !container.offsetHeight) {
        Object.keys(current.current.anchors).forEach((id) => { points[id] = null; });
        publish({ width: 0, height: 0, points });
        return;
      }
      const space = {
        rect, width: container.offsetWidth, height: container.offsetHeight,
        borderLeft: container.clientLeft, borderTop: container.clientTop,
        scrollLeft: container.scrollLeft, scrollTop: container.scrollTop,
      };
      for (const [id, anchor] of Object.entries(current.current.anchors)) {
        const element = anchor.ref.current;
        if (!element?.isConnected || element.ownerDocument !== documentObject || !element.getClientRects().length) {
          points[id] = null;
          continue;
        }
        const bounds = element.getBoundingClientRect();
        const point = bounds.width && bounds.height ? toEffectPoint(effectAnchorPoint(bounds, anchor.side), space) : null;
        const offset = anchor.offset;
        points[id] = point ? { x: point.x + (offset?.x ?? 0), y: point.y + (offset?.y ?? 0) } : null;
        if (points[id] && (!Number.isFinite(points[id]!.x) || !Number.isFinite(points[id]!.y))) points[id] = null;
      }
      publish({ width: container.clientWidth, height: container.clientHeight, points });
    };
    const tick = () => {
      frame = 0;
      measure();
      if (!disposed && canMeasure() && current.current.tracking && current.current.inView) frame = view.requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!disposed && canMeasure() && !frame) frame = view.requestAnimationFrame(tick);
    };
    const setListening = (enabled: boolean) => {
      if (listening === enabled) return;
      listening = enabled;
      if (enabled) {
        view.addEventListener('resize', schedule);
        documentObject.addEventListener('scroll', schedule, true);
        documentObject.fonts?.addEventListener('loadingdone', schedule);
      } else {
        view.removeEventListener('resize', schedule);
        documentObject.removeEventListener('scroll', schedule, true);
        documentObject.fonts?.removeEventListener('loadingdone', schedule);
      }
    };
    const disconnect = () => {
      resize?.disconnect();
      mutation?.disconnect();
      resize = undefined;
      mutation = undefined;
      view.cancelAnimationFrame(frame);
      frame = 0;
    };
    const update = () => {
      const nextContainer = containerRef.current;
      const next = new Set<Element>();
      const addAncestors = (element: HTMLElement | null) => {
        while (element) { next.add(element); element = element.parentElement; }
      };
      addAncestors(nextContainer);
      Object.values(current.current.anchors).forEach((anchor) => addAncestors(anchor.ref.current));
      const nextObserved = [...next];
      const nextSignature = JSON.stringify(Object.entries(current.current.anchors).map(([id, anchor]) => [id, anchor.side, anchor.offset]));
      const changed = nextContainer !== container || nextSignature !== signature || nextObserved.length !== observed.length
        || nextObserved.some((element, index) => element !== observed[index]);
      container = nextContainer;
      setListening(canMeasure());
      if (!canMeasure()) {
        disconnect();
        if (!current.current.active) publish(empty);
        return;
      }
      if (changed || !mutation) {
        disconnect();
        observed = nextObserved;
        signature = nextSignature;
        if (typeof ResizeObserver !== 'undefined') {
          resize = new ResizeObserver(schedule);
          observed.forEach((element) => resize!.observe(element));
        }
        if (typeof MutationObserver !== 'undefined') {
          mutation = new MutationObserver((records) => {
            const relevant = records.some((record) => {
              // Motion/SVG writes are output, not a new layout input.
              if (record.target instanceof SVGElement) return false;
              if (record.type === 'childList') {
                return [...record.addedNodes, ...record.removedNodes].some((node) => !(node instanceof SVGElement));
              }
              return true;
            });
            if (relevant) schedule();
          });
          observed.forEach((element) => mutation!.observe(element, { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'], childList: true }));
        }
        measure();
      }
      if (current.current.tracking && current.current.inView) schedule();
      else if (frame) { view.cancelAnimationFrame(frame); frame = 0; measure(); }
    };
    manager.current = { update, schedule };
    update();
    return () => {
      disposed = true;
      disconnect();
      setListening(false);
      manager.current = null;
    };
  }, [containerRef]);
  useLayoutEffect(() => { manager.current?.update(); });
  return { ...geometry, refresh };
}
