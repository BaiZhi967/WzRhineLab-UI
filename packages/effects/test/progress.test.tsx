import * as React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EffectClock } from '../src/clock.js';
import { useEffectProgress } from '../src/useEffectProgress.js';

const sleep = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

let latest: ReturnType<typeof useEffectProgress> | undefined;

function Probe({ active, viewportRef, onSettled }: { active: boolean; viewportRef: React.RefObject<Element | null>; onSettled?: (active: boolean) => void }) {
  latest = useEffectProgress({ active, viewportRef, onSettled });
  return <output data-state={latest.state} data-reduced={latest.reduced}>{latest.progress.get()}</output>;
}

function Harness({ active, onSettled, reduced = false }: { active: boolean; onSettled?: (active: boolean) => void; reduced?: boolean }) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  return (
    <EffectClock reduced={reduced}>
      <div ref={viewportRef}>
        <Probe active={active} viewportRef={viewportRef} onSettled={onSettled} />
      </div>
    </EffectClock>
  );
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
}

afterEach(() => {
  latest = undefined;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  vi.unstubAllGlobals();
});

describe('useEffectProgress', () => {
  it('starts at the controlled target without autoplay and settles a changed target once', async () => {
    const onSettled = vi.fn();
    const { rerender } = render(<Harness active={false} onSettled={onSettled} />);
    expect(latest?.progress.get()).toBe(0);
    expect(latest?.state).toBe('settled');
    expect(onSettled).not.toHaveBeenCalled();

    rerender(<Harness active onSettled={onSettled} />);
    expect(latest?.state).toBe('running');
    await waitFor(() => expect(latest?.state).toBe('settled'), { timeout: 1500 });
    expect(latest?.progress.get()).toBe(1);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith(true);
  });

  it('retargets from the current value when reversed and cancels stale settlement', async () => {
    const onSettled = vi.fn();
    const { rerender } = render(<Harness active={false} onSettled={onSettled} />);
    rerender(<Harness active onSettled={onSettled} />);
    await sleep(100);
    const mid = latest?.progress.get() ?? 0;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);

    rerender(<Harness active={false} onSettled={onSettled} />);
    const startOfReverse = latest?.progress.get() ?? 0;
    expect(startOfReverse).toBeGreaterThan(0);
    expect(startOfReverse).toBeLessThan(1);
    await waitFor(() => expect(latest?.progress.get()).toBeLessThan(startOfReverse), { timeout: 1000 });
    await waitFor(() => expect(latest?.state).toBe('settled'), { timeout: 1500 });
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenLastCalledWith(false);
  });

  it('freezes while hidden and resumes from the same value', async () => {
    const { rerender } = render(<Harness active={false} />);
    rerender(<Harness active />);
    await sleep(100);
    setHidden(true);
    expect(latest?.state).toBe('paused');
    const paused = latest?.progress.get() ?? 0;
    await sleep(140);
    expect(latest?.progress.get()).toBeCloseTo(paused, 5);
    setHidden(false);
    await sleep(100);
    expect(latest?.progress.get()).toBeGreaterThan(paused);
  });

  it('pauses offscreen, disconnects the observer, and resumes after re-entry', async () => {
    let callback: IntersectionObserverCallback = () => {};
    const disconnect = vi.fn();
    class FakeObserver {
      constructor(next: IntersectionObserverCallback) {
        callback = next;
      }
      observe() {}
      disconnect = disconnect;
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const viewportRef = React.createRef<HTMLDivElement>();
    function ViewportProbe({ active }: { active: boolean }) {
      latest = useEffectProgress({ active, viewportRef });
      return <output data-state={latest.state}>{latest.progress.get()}</output>;
    }
    const { rerender, unmount } = render(<div ref={viewportRef}><ViewportProbe active={false} /></div>);
    rerender(<div ref={viewportRef}><ViewportProbe active /></div>);
    await sleep(60);
    act(() => callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(latest?.state).toBe('paused');
    const paused = latest?.progress.get() ?? 0;
    await sleep(100);
    expect(latest?.progress.get()).toBeCloseTo(paused, 5);
    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    await sleep(80);
    expect(latest?.progress.get()).toBeGreaterThan(paused);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('jumps to the newest target under reduced motion and does not call after unmount', async () => {
    const onSettled = vi.fn();
    const { rerender, unmount } = render(<Harness active={false} reduced onSettled={onSettled} />);
    rerender(<Harness active reduced onSettled={onSettled} />);
    expect(latest?.reduced).toBe(true);
    expect(latest?.progress.get()).toBe(1);
    expect(latest?.state).toBe('settled');
    await sleep(30);
    expect(onSettled).toHaveBeenCalledTimes(1);

    rerender(<Harness active={false} reduced onSettled={onSettled} />);
    unmount();
    await sleep(500);
    expect(onSettled).toHaveBeenCalledTimes(2);
  });

  it('renders on the server without reading browser globals', async () => {
    const { renderToString } = await import('react-dom/server');
    const viewportRef = React.createRef<HTMLDivElement>();
    expect(() => renderToString(<Probe active viewportRef={viewportRef} />)).not.toThrow();
  });
});
