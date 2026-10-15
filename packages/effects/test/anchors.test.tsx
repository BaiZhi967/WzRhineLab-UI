import * as React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useElementAnchors } from '../src/useElementAnchors.js';
import type { ElementAnchorsResult } from '../src/useElementAnchors.js';

let last: ElementAnchorsResult;
const observers: { callback: ResizeObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
let targetLeft = 250;
let layoutReads = 0;
const box = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

function Fixture({ active = true, tracking = false, target = true, targetKey = 'a', prefix = '' }: { active?: boolean; tracking?: boolean; target?: boolean; targetKey?: string; prefix?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fromRef = React.useRef<HTMLDivElement>(null);
  const toRef = React.useRef<HTMLDivElement>(null);
  last = useElementAnchors({ containerRef, active, tracking, anchors: { from: { ref: fromRef, side: 'bottom' }, to: { ref: toRef, side: 'bottom' } } });
  return <div ref={containerRef} data-box="container" data-testid={prefix + 'container'}>
    <div ref={fromRef} data-box="from" />
    {target && <div key={targetKey} ref={toRef} data-box="to" data-testid={prefix + 'target'} />}
  </div>;
}

function flush() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(performance.now()));
  });
}

beforeEach(() => {
  targetLeft = 250;
  layoutReads = 0;
  observers.length = 0;
  frames.clear();
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(public callback: ResizeObserverCallback) { observers.push(this); }
  });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { const id = ++nextFrame; frames.set(id, callback); return id; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    layoutReads += 1;
    if (this.dataset.box === 'container') return box(100, 50, 400, 200);
    if (this.dataset.box === 'from') return box(130, 70, 80, 40);
    return box(targetLeft, 80, 120, 60);
  });
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (this: HTMLElement) {
    return (this.style.display === 'none' ? [] : [this.getBoundingClientRect()]) as unknown as DOMRectList;
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(194);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96);
  vi.spyOn(HTMLElement.prototype, 'clientLeft', 'get').mockReturnValue(3);
  vi.spyOn(HTMLElement.prototype, 'clientTop', 'get').mockReturnValue(2);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); frames.clear(); });

describe('useElementAnchors', () => {
  it('measures real bottom centers through container scale and border', () => {
    render(<Fixture />);
    expect(last.width).toBe(194);
    expect(last.height).toBe(96);
    expect(last.points.from).toEqual({ x: 32, y: 28 });
    expect(last.points.to).toEqual({ x: 102, y: 43 });
    expect(frames.size).toBe(0);
  });
  it('coalesces observer invalidations and has no idle frame loop', () => {
    render(<Fixture />);
    targetLeft = 290;
    act(() => {
      observers[0].callback([], {} as ResizeObserver);
      observers[0].callback([], {} as ResizeObserver);
    });
    expect(frames.size).toBe(1);
    flush();
    expect(last.points.to?.x).toBe(122);
    expect(frames.size).toBe(0);
    const before = layoutReads;
    flush();
    expect(layoutReads).toBe(before);
  });
  it('uses fresh geometry on ref replacement and removes detached endpoints', () => {
    const { rerender } = render(<Fixture />);
    targetLeft = 300;
    rerender(<Fixture targetKey="b" />);
    expect(last.points.to?.x).toBe(127);
    rerender(<Fixture target={false} />);
    expect(last.points.to).toBeNull();
  });
  it('refreshes hidden and revealed endpoints without retaining stale points', () => {
    const { getByTestId } = render(<Fixture />);
    getByTestId('target').style.display = 'none';
    last.refresh(); flush();
    expect(last.points.to).toBeNull();
    getByTestId('target').style.display = '';
    last.refresh(); flush();
    expect(last.points.to).toEqual({ x: 102, y: 43 });
  });
  it('accounts for container content scrolling and listens to nested scroll', () => {
    const { getByTestId } = render(<Fixture />);
    getByTestId('container').scrollLeft = 17;
    getByTestId('container').scrollTop = 11;
    act(() => getByTestId('target').dispatchEvent(new Event('scroll')));
    flush();
    expect(last.points.from).toEqual({ x: 49, y: 39 });
  });
  it('disconnects when disabled and cleans pending tracking on unmount', () => {
    const { rerender, unmount } = render(<Fixture tracking />);
    expect(frames.size).toBe(1);
    flush();
    expect(frames.size).toBe(1);
    rerender(<Fixture active={false} tracking />);
    expect(frames.size).toBe(0);
    expect(last.width).toBe(0);
    expect(observers[0].disconnect).toHaveBeenCalled();
    rerender(<Fixture tracking />);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });
  it('pauses tracking while the document is hidden and remeasures on return', () => {
    render(<Fixture tracking />);
    act(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(frames.size).toBe(0);
    targetLeft = 350;
    act(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(last.points.to?.x).toBe(152);
  });
  it('isolates observers between instances', () => {
    const one = render(<Fixture prefix="one-" />);
    const two = render(<Fixture prefix="two-" />);
    expect(observers).toHaveLength(2);
    one.unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(observers[1].disconnect).not.toHaveBeenCalled();
    two.unmount();
    expect(observers[1].disconnect).toHaveBeenCalled();
  });
});
