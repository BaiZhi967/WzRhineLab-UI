import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as react from '@wzrhine/react';
import { ArchiveReveal, EffectClock, OrbitalDiagram, ScanSurface, useInViewport, usePageVisible } from '../src';

/** M10: effects share @wzrhine/react's visibility source and lifecycle; every loop has explicit stop conditions. */

const sleep = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

afterEach(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});

const nodes = [
  { id: 'a', label: '样本登记', ring: 0, angle: 0 },
  { id: 'b', label: '结构观测', ring: 1, angle: 120, active: true },
];

describe('single visibility source', () => {
  it('effects re-exports the @wzrhine/react hooks instead of a second implementation', () => {
    expect(usePageVisible).toBe(react.usePageVisible);
    expect(useInViewport).toBe(react.useInViewport);
  });
});

describe('OrbitalDiagram · stop conditions', () => {
  it('hidden page pauses the rotation; visible again resumes it', () => {
    const { container } = render(<OrbitalDiagram nodes={nodes} label="流程" animate />);
    const orbit = container.querySelector('.rl-orbit')!;
    expect(orbit).toHaveAttribute('data-lifecycle', 'running');
    expect(orbit).toHaveAttribute('data-spinning', 'true');
    setHidden(true);
    expect(orbit).not.toHaveAttribute('data-spinning');
    expect(orbit).toHaveAttribute('data-lifecycle', 'paused');
    expect(orbit).toHaveAttribute('data-paused', 'hidden');
    setHidden(false);
    expect(orbit).toHaveAttribute('data-spinning', 'true');
  });

  it('reduced motion and animate={false} are explicit states', () => {
    const { container, rerender } = render(
      <EffectClock reduced>
        <OrbitalDiagram nodes={nodes} label="流程" animate />
      </EffectClock>,
    );
    const orbit = container.querySelector('.rl-orbit')!;
    expect(orbit).toHaveAttribute('data-paused', 'reduced');
    rerender(
      <EffectClock reduced>
        <OrbitalDiagram nodes={nodes} label="流程" animate={false} />
      </EffectClock>,
    );
    expect(orbit).toHaveAttribute('data-lifecycle', 'stopped');
    expect(orbit).not.toHaveAttribute('data-paused');
    expect(orbit).not.toHaveAttribute('data-spinning');
  });

  it('leaving the viewport pauses it', () => {
    let callback: IntersectionObserverCallback = () => {};
    const disconnect = vi.fn();
    class FakeObserver {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe() {}
      disconnect = disconnect;
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    try {
      const { container, unmount } = render(<OrbitalDiagram nodes={nodes} label="流程" animate />);
      const orbit = container.querySelector('.rl-orbit')!;
      expect(orbit).toHaveAttribute('data-spinning', 'true');
      act(() => callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
      expect(orbit).toHaveAttribute('data-paused', 'offscreen');
      act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
      expect(orbit).toHaveAttribute('data-spinning', 'true');
      unmount();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('ScanSurface · stop conditions', () => {
  const ui = (key: number, onScanEnd?: () => void) => (
    <ScanSurface scanKey={key} duration={2000} onScanEnd={onScanEnd}>
      <p>内容</p>
    </ScanSurface>
  );

  it('page hidden mid-sweep ends the sweep immediately', () => {
    const onScanEnd = vi.fn();
    const { container, rerender } = render(ui(0, onScanEnd));
    rerender(ui(1, onScanEnd));
    expect(container.querySelector('.rl-scan__line')).not.toBeNull();
    setHidden(true);
    expect(container.querySelector('.rl-scan__line')).toBeNull();
    expect(onScanEnd).toHaveBeenCalledTimes(1);
  });

  it('a scan requested while hidden does not run', () => {
    const { container, rerender } = render(ui(0));
    setHidden(true);
    rerender(ui(1));
    expect(container.querySelector('.rl-scan__line')).toBeNull();
  });

  it('unmount mid-sweep clears the timer (no late onScanEnd)', async () => {
    const onScanEnd = vi.fn();
    const { rerender, unmount } = render(
      <ScanSurface scanKey={0} duration={60} onScanEnd={onScanEnd}>
        <p>内容</p>
      </ScanSurface>,
    );
    rerender(
      <ScanSurface scanKey={1} duration={60} onScanEnd={onScanEnd}>
        <p>内容</p>
      </ScanSurface>,
    );
    unmount();
    await sleep(120);
    expect(onScanEnd).not.toHaveBeenCalled();
  });
});

describe('ArchiveReveal · semantic fallback', () => {
  it('the accessible text is the final text at every frame, including mid-animation', async () => {
    const { container, rerender } = render(<ArchiveReveal text="ARC-1024 · 样本" revealed={false} duration={400} />);
    rerender(<ArchiveReveal text="ARC-1024 · 样本" revealed duration={400} />);
    const sr = container.querySelector('.rl-effect-sr')!;
    const glyphs = container.querySelector('.rl-reveal__glyphs')!;
    const samples: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      await sleep(60);
      samples.push(sr.textContent ?? '');
      expect(glyphs).toHaveAttribute('aria-hidden', 'true');
    }
    expect(container.querySelector('.rl-reveal')).toHaveAttribute('data-state', 'animating');
    expect(new Set(samples)).toEqual(new Set(['ARC-1024 · 样本']));
    // The scrambled glyphs never reach the accessible name.
    expect(screen.getByText('ARC-1024 · 样本')).toBe(sr);
    await waitFor(() => expect(container.querySelector('.rl-reveal')).toHaveAttribute('data-state', 'revealed'), { timeout: 2000 });
  });

  it('hidden page pauses mid-flight and resumes from the same progress', async () => {
    const resolved = (el: Element) => el.querySelectorAll('.rl-reveal__cell[data-resolved]').length;
    const { container, rerender } = render(<ArchiveReveal text="ABCDEFGHIJKLMNOP" revealed={false} duration={600} />);
    rerender(<ArchiveReveal text="ABCDEFGHIJKLMNOP" revealed duration={600} />);
    await sleep(200);
    const root = container.querySelector('.rl-reveal')!;
    setHidden(true);
    const atPause = resolved(root);
    await sleep(300);
    expect(resolved(root)).toBe(atPause);
    expect(root).toHaveAttribute('data-state', 'animating');
    setHidden(false);
    await waitFor(() => expect(root).toHaveAttribute('data-state', 'revealed'), { timeout: 2000 });
  });
});
