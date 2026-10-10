import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ArchiveCard,
  ArchiveIdentity,
  MotionPresence,
  MotionSpeed,
  RhineMotionGroup,
  RhineMotionItem,
  duration,
  resolveMotion,
  transition,
  useLatestGuard,
  useMotionLifecycle,
  usePageVisible,
  useRhineMotion,
} from '../src';
import { presenceVariants, staggerDelay, staggerMaxMs, staggerStepMs } from '../src/motion/presence';

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

describe('resolveMotion · reduced motion by property kind', () => {
  it('returns the named preset when motion is allowed', () => {
    for (const kind of ['color', 'opacity', 'transform', 'layout'] as const) {
      expect(resolveMotion(kind, 'panel', false)).toEqual(transition.panel);
    }
    expect(resolveMotion('loop', 'loop', false)).toEqual(transition.loop);
  });

  it('colour and opacity keep a short fade, capped at the fast token', () => {
    expect(resolveMotion('opacity', 'panel', true)).toEqual({ duration: duration.fast, ease: transition.fast.ease });
    expect(resolveMotion('color', 'scene', true)).toMatchObject({ duration: duration.fast });
    // Already shorter than fast: keep its own length.
    expect(resolveMotion('opacity', 'press', true)).toMatchObject({ duration: duration.press });
    expect(resolveMotion('opacity', 'instant', true)).toEqual(transition.instant);
  });

  it('transform and layout jump straight to the target; loops stop', () => {
    expect(resolveMotion('transform', 'panel', true)).toEqual(transition.instant);
    expect(resolveMotion('layout', 'scene', true)).toEqual(transition.instant);
    const loop = resolveMotion('loop', 'loop', true);
    expect(loop).toEqual(transition.instant);
    expect(loop).not.toHaveProperty('repeat');
    // A repeating preset never survives as an opacity fade either.
    expect(resolveMotion('opacity', 'loop', true)).toEqual(transition.instant);
  });

  it('speed scales durations for review lanes only', () => {
    expect(resolveMotion('transform', 'panel', false, 0.25)).toMatchObject({ duration: duration.panel * 4 });
    expect(resolveMotion('transform', 'panel', true, 0.25)).toEqual(transition.instant);
    // Reduce wins over review speed: the fade fallback is never stretched past the fast token.
    expect(resolveMotion('opacity', 'panel', true, 0.25)).toEqual({ duration: duration.fast, ease: transition.fast.ease });
  });
});

describe('useRhineMotion · resolve and speed', () => {
  function Probe() {
    const m = useRhineMotion();
    return <output data-testid="p">{JSON.stringify({ reduced: m.reduced, speed: m.speed, get: m.get('base'), op: m.resolve('opacity', 'panel') })}</output>;
  }
  const read = () => JSON.parse(screen.getByTestId('p').textContent!) as Record<string, { duration?: number } | number | boolean>;

  it('get() stays instant under reduce; resolve() keeps the opacity fade', () => {
    render(
      <MotionConfig reducedMotion="always">
        <Probe />
      </MotionConfig>,
    );
    expect(read()).toMatchObject({ reduced: true, get: { duration: 0 }, op: { duration: duration.fast } });
  });

  it('MotionSpeed slows every preset in its subtree', () => {
    render(
      <MotionConfig reducedMotion="never">
        <MotionSpeed speed={0.25}>
          <Probe />
        </MotionSpeed>
      </MotionConfig>,
    );
    expect(read()).toMatchObject({ speed: 0.25, get: { duration: duration.base * 4 }, op: { duration: duration.panel * 4 } });
  });

  it('ignores non-positive speeds', () => {
    render(
      <MotionSpeed speed={0}>
        <Probe />
      </MotionSpeed>,
    );
    expect(read()).toMatchObject({ speed: 1 });
  });
});

describe('MotionPresence', () => {
  function Toggle({ show, preset, onExitComplete }: { show: boolean; preset?: 'fade' | 'panel' | 'rise'; onExitComplete?: () => void }) {
    return (
      <MotionConfig reducedMotion="never">
        <MotionPresence show={show} preset={preset} onExitComplete={onExitComplete} role="region" aria-label="详情层">
          <p>详情</p>
        </MotionPresence>
      </MotionConfig>
    );
  }

  it('mounts without an entrance animation by default (initial={false})', () => {
    render(<Toggle show preset="panel" />);
    const region = screen.getByRole('region', { name: '详情层' });
    expect(region).toHaveAttribute('data-rl-presence', 'panel');
    // Rendered straight at the visible state: nothing to wait for.
    expect(region.style.opacity === '' || region.style.opacity === '1').toBe(true);
  });

  it('animates out, then unmounts and reports completion once', async () => {
    let exits = 0;
    const { rerender } = render(<Toggle show onExitComplete={() => (exits += 1)} />);
    rerender(<Toggle show={false} onExitComplete={() => (exits += 1)} />);
    // Still present during the exit.
    expect(screen.getByRole('region', { name: '详情层' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('region', { name: '详情层' })).toBeNull());
    expect(exits).toBe(1);
  });

  it('interrupt: hide then show mid-exit keeps a single element and ends visible', async () => {
    const { rerender, container } = render(<Toggle show preset="panel" />);
    rerender(<Toggle show={false} preset="panel" />);
    await sleep(40);
    rerender(<Toggle show preset="panel" />);
    await sleep(duration.panel * 1000 + 120);
    expect(container.querySelectorAll('[data-rl-presence]')).toHaveLength(1);
    const region = screen.getByRole('region', { name: '详情层' });
    expect(Number(region.style.opacity || '1')).toBeCloseTo(1, 2);
  });

  it('reduced motion: no offset, opacity-only fade capped at fast', () => {
    const reduced = presenceVariants('panel', true);
    expect(reduced.hidden).toMatchObject({ opacity: 0, y: 0 });
    expect((reduced.visible as { transition: { y: unknown; opacity: { duration: number } } }).transition.y).toEqual(transition.instant);
    expect((reduced.visible as { transition: { opacity: { duration: number } } }).transition.opacity.duration).toBe(duration.fast);
    const full = presenceVariants('panel', false);
    expect(full.hidden).toMatchObject({ opacity: 0, y: 8 });
    expect(presenceVariants('fade', false).hidden).toMatchObject({ y: 0 });
  });

  it('reduced motion exits faster than the full panel exit', async () => {
    const t0 = performance.now();
    const { rerender } = render(
      <MotionConfig reducedMotion="always">
        <MotionPresence show preset="panel" data-testid="x">
          详情
        </MotionPresence>
      </MotionConfig>,
    );
    rerender(
      <MotionConfig reducedMotion="always">
        <MotionPresence show={false} preset="panel" data-testid="x">
          详情
        </MotionPresence>
      </MotionConfig>,
    );
    await waitFor(() => expect(screen.queryByTestId('x')).toBeNull());
    expect(performance.now() - t0).toBeLessThan(duration.panel * 1000 + 200);
  });
});

describe('RhineMotionGroup', () => {
  it('stagger is 24ms per item, capped at the fast token; none under reduce', () => {
    expect(staggerStepMs).toBeGreaterThanOrEqual(20);
    expect(staggerStepMs).toBeLessThanOrEqual(30);
    expect(staggerMaxMs).toBe(duration.fast * 1000);
    expect(staggerDelay(0, false)).toBe(0);
    expect(staggerDelay(1, false)).toBeCloseTo(0.024);
    expect(staggerDelay(3, false)).toBeCloseTo(0.072);
    // Item 40 waits no longer than item 5.
    expect(staggerDelay(40, false)).toBeCloseTo(staggerMaxMs / 1000);
    expect(staggerDelay(5, false)).toBeCloseTo(staggerMaxMs / 1000);
    expect(staggerDelay(4, true)).toBe(0);
    expect(staggerDelay(2, false, 0.25)).toBeCloseTo(0.192);
  });

  it('indexes items in order and keeps list semantics', () => {
    render(
      <RhineMotionGroup as="ul" aria-label="最近记录">
        {['ARC-1', 'ARC-2', 'ARC-3'].map((id) => (
          <RhineMotionItem key={id} as="li">
            {id}
          </RhineMotionItem>
        ))}
      </RhineMotionGroup>,
    );
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-rl-motion-item'))).toEqual(['0', '1', '2']);
    expect(screen.getByRole('list', { name: '最近记录' })).toBeInTheDocument();
  });

  it('show={false} fades the whole group out and unmounts it', async () => {
    const ui = (show: boolean) => (
      <MotionConfig reducedMotion="never">
        <RhineMotionGroup show={show} data-testid="g">
          <RhineMotionItem>甲</RhineMotionItem>
          <RhineMotionItem>乙</RhineMotionItem>
        </RhineMotionGroup>
      </MotionConfig>
    );
    const { rerender } = render(ui(true));
    rerender(ui(false));
    expect(screen.getByTestId('g')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('g')).toBeNull());
  });

  it('entrance stagger is visible mid-flight: later items lag earlier ones', async () => {
    const ui = (show: boolean) => (
      <MotionConfig reducedMotion="never">
        <MotionSpeed speed={0.25}>
          <RhineMotionGroup show={show}>
            {[0, 1, 2, 3].map((i) => (
              <RhineMotionItem key={i} data-testid={`i${i}`}>
                {i}
              </RhineMotionItem>
            ))}
          </RhineMotionGroup>
        </MotionSpeed>
      </MotionConfig>
    );
    const { rerender } = render(ui(false));
    rerender(ui(true));
    await sleep(140);
    const op = (i: number) => Number(screen.getByTestId(`i${i}`).style.opacity || '0');
    expect(op(0)).toBeGreaterThan(op(3));
  });
});

describe('usePageVisible', () => {
  it('follows visibilitychange', () => {
    const { result } = renderHook(() => usePageVisible());
    expect(result.current).toBe(true);
    setHidden(true);
    expect(result.current).toBe(false);
    setHidden(false);
    expect(result.current).toBe(true);
  });
});

describe('useMotionLifecycle', () => {
  it('start / pause / resume / stop', () => {
    const { result } = renderHook(() => useMotionLifecycle());
    expect(result.current.state).toBe('idle');
    act(() => result.current.start());
    expect(result.current).toMatchObject({ state: 'running', running: true, pauseReason: null });
    act(() => result.current.pause());
    expect(result.current).toMatchObject({ state: 'paused', running: false, pauseReason: 'manual' });
    act(() => result.current.resume());
    expect(result.current.state).toBe('running');
    act(() => result.current.stop());
    expect(result.current).toMatchObject({ state: 'stopped', running: false });
  });

  it('pauses while the page is hidden and resumes when it returns', () => {
    const { result } = renderHook(() => useMotionLifecycle({ autoStart: true }));
    expect(result.current.running).toBe(true);
    setHidden(true);
    expect(result.current).toMatchObject({ state: 'paused', pauseReason: 'hidden' });
    setHidden(false);
    expect(result.current.state).toBe('running');
  });

  it('reduced motion keeps a requested loop paused', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <MotionConfig reducedMotion="always">{children}</MotionConfig>;
    const { result } = renderHook(() => useMotionLifecycle({ autoStart: true }), { wrapper });
    expect(result.current).toMatchObject({ state: 'paused', pauseReason: 'reduced', running: false });
    const forced = renderHook(() => useMotionLifecycle({ active: true, reduced: true }));
    expect(forced.result.current.pauseReason).toBe('reduced');
  });

  it('controlled `active` overrides start/stop', () => {
    const { result, rerender } = renderHook(({ active }) => useMotionLifecycle({ active }), { initialProps: { active: false } });
    expect(result.current.state).toBe('idle');
    rerender({ active: true });
    expect(result.current.state).toBe('running');
    rerender({ active: false });
    expect(result.current.state).toBe('stopped');
  });

  it('unmount removes its visibility listener', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useMotionLifecycle({ autoStart: true }));
    const added = add.mock.calls.filter(([type]) => type === 'visibilitychange').map(([, fn]) => fn);
    expect(added.length).toBeGreaterThan(0);
    unmount();
    const removed = remove.mock.calls.filter(([type]) => type === 'visibilitychange').map(([, fn]) => fn);
    for (const fn of added) expect(removed).toContain(fn);
  });
});

describe('useLatestGuard · stale async result', () => {
  it('only the newest run is current; cancel and unmount invalidate', () => {
    const { result, unmount } = renderHook(() => useLatestGuard());
    const first = result.current.begin();
    const second = result.current.begin();
    expect(first()).toBe(false);
    expect(second()).toBe(true);
    result.current.cancel();
    expect(second()).toBe(false);
    const third = result.current.begin();
    unmount();
    expect(third()).toBe(false);
  });

  it('a late response cannot reopen a panel that was closed meanwhile', async () => {
    let resolveLoad: (v: string) => void = () => {};
    function Loader() {
      const guard = useLatestGuard();
      const [open, setOpen] = React.useState(false);
      const [data, setData] = React.useState<string | null>(null);
      const load = async () => {
        const isCurrent = guard.begin();
        const value = await new Promise<string>((r) => (resolveLoad = r));
        if (!isCurrent()) return;
        setData(value);
        setOpen(true);
      };
      return (
        <>
          <button type="button" onClick={load}>
            加载
          </button>
          <button
            type="button"
            onClick={() => {
              guard.cancel();
              setOpen(false);
            }}
          >
            关闭
          </button>
          <MotionPresence show={open} role="region" aria-label="结果">
            {data}
          </MotionPresence>
        </>
      );
    }
    render(<Loader />);
    act(() => screen.getByRole('button', { name: '加载' }).click());
    act(() => screen.getByRole('button', { name: '关闭' }).click());
    await act(async () => resolveLoad('迟到的结果'));
    await sleep(20);
    expect(screen.queryByRole('region', { name: '结果' })).toBeNull();
  });
});

describe('ArchiveCard · shared identity', () => {
  it('is off by default: no layout identity on the ID', () => {
    const { container } = render(<ArchiveCard id="ARC-1024" title="样本" />);
    expect(container.querySelector('[data-rl-identity]')).toBeNull();
    expect(container.querySelector('.rl-archive-card__id')).toHaveTextContent('ARC-1024');
  });

  it('motion="identity" marks the ID as a shared element; the card keeps its accessible name', () => {
    render(<ArchiveCard id="ARC-1024" title="样本" motion="identity" onOpen={() => {}} />);
    const card = screen.getByRole('button', { name: '样本' });
    const id = card.querySelector('.rl-archive-card__id')!;
    expect(id).toHaveAttribute('data-rl-identity', 'ARC-1024');
    expect(id).toHaveTextContent('ARC-1024');
  });

  it('list → detail: the identity continues into ArchiveIdentity (one visible owner at a time)', async () => {
    function View() {
      const [open, setOpen] = React.useState(false);
      return open ? (
        <section aria-label="详情">
          <ArchiveIdentity id="ARC-1024" />
          <button type="button" onClick={() => setOpen(false)}>
            返回
          </button>
        </section>
      ) : (
        <ArchiveCard id="ARC-1024" title="样本" motion="identity" onOpen={() => setOpen(true)} />
      );
    }
    render(
      <MotionConfig reducedMotion="never">
        <View />
      </MotionConfig>,
    );
    act(() => screen.getByRole('button', { name: '样本' }).click());
    const detail = screen.getByRole('region', { name: '详情' });
    // The detail is in the DOM and readable immediately; motion never delays it.
    expect(detail.querySelector('[data-rl-identity="ARC-1024"]')).toHaveTextContent('ARC-1024');
    expect(document.querySelectorAll('[data-rl-identity="ARC-1024"]')).toHaveLength(1);
    act(() => screen.getByRole('button', { name: '返回' }).click());
    expect(screen.getByRole('button', { name: '样本' })).toBeInTheDocument();
  });
});
