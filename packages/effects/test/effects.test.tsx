import * as React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { ArchiveReveal, EffectClock, MotionPlayer, OrbitalDiagram, ScanSurface, useEffectTiming } from '../src';
import type { MotionDemoProps } from '../src';

const sleep = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));

describe('EffectClock / useEffectTiming', () => {
  function Probe() {
    const t = useEffectTiming();
    return <output>{`${t.speed}|${t.reduced}|${t.scale(200)}`}</output>;
  }

  it('defaults to speed 1 and the user preference', () => {
    render(<Probe />);
    expect(screen.getByRole('status')).toHaveTextContent('1|false|200');
  });

  it('scales durations and can force reduced motion', () => {
    render(
      <EffectClock speed={0.25} reduced>
        <Probe />
      </EffectClock>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('0.25|true|800');
  });

  it('honours RhineProvider motion="reduce"', () => {
    render(
      <RhineProvider motion="reduce">
        <Probe />
      </RhineProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1|true|200');
  });

  it('ignores non-positive speeds', () => {
    render(
      <EffectClock speed={0}>
        <Probe />
      </EffectClock>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1|false|200');
  });
});

describe('ArchiveReveal', () => {
  it('exposes the real text to assistive tech; glyphs are aria-hidden', () => {
    const { container } = render(<ArchiveReveal text="ARC-1024" revealed={false} concealedLabel="受限编号" />);
    expect(screen.getByText('受限编号')).toBeInTheDocument();
    expect(container.querySelector('.rl-reveal__glyphs')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.rl-reveal')).toHaveAttribute('data-state', 'concealed');
    expect(container.querySelector('.rl-reveal__glyphs')!.textContent).not.toContain('ARC');
  });

  it('starts revealed without animating when mounted revealed', () => {
    const { container } = render(<ArchiveReveal text="ARC-1024" revealed />);
    expect(container.querySelector('.rl-reveal')).toHaveAttribute('data-state', 'revealed');
    expect(container.querySelector('.rl-reveal__glyphs')).toHaveTextContent('ARC-1024');
  });

  it('animates to revealed and reports settling once', async () => {
    const onSettled = vi.fn();
    const { container, rerender } = render(<ArchiveReveal text="ARC-1024" revealed={false} duration={80} onSettled={onSettled} />);
    rerender(<ArchiveReveal text="ARC-1024" revealed duration={80} onSettled={onSettled} />);
    await waitFor(() => expect(container.querySelector('.rl-reveal')).toHaveAttribute('data-state', 'revealed'), { timeout: 2000 });
    expect(container.querySelector('.rl-reveal__glyphs')).toHaveTextContent('ARC-1024');
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith(true);
  });

  it('reduced motion swaps instantly with no intermediate frames', async () => {
    const states: string[] = [];
    const onSettled = vi.fn();
    const { container, rerender } = render(
      <EffectClock reduced>
        <ArchiveReveal text="ARC-1024" revealed={false} onSettled={onSettled} />
      </EffectClock>,
    );
    rerender(
      <EffectClock reduced>
        <ArchiveReveal text="ARC-1024" revealed onSettled={onSettled} />
      </EffectClock>,
    );
    states.push(container.querySelector('.rl-reveal')!.getAttribute('data-state')!);
    await sleep(30);
    states.push(container.querySelector('.rl-reveal')!.getAttribute('data-state')!);
    expect(states).toEqual(['revealed', 'revealed']);
    expect(container.querySelector('.rl-reveal')).toHaveAttribute('data-reduced', 'true');
    expect(onSettled).toHaveBeenCalledWith(true);
  });

  it('interrupting mid-flight reverses from the current progress instead of restarting', async () => {
    const resolved = (el: Element) => el.querySelectorAll('.rl-reveal__cell[data-resolved]').length;
    const { container, rerender } = render(<ArchiveReveal text="ABCDEFGHIJKLMNOP" revealed={false} duration={600} />);
    rerender(<ArchiveReveal text="ABCDEFGHIJKLMNOP" revealed duration={600} />);
    await sleep(240);
    const root = container.querySelector('.rl-reveal')!;
    const mid = resolved(root);
    expect(root).toHaveAttribute('data-state', 'animating');
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(16);

    rerender(<ArchiveReveal text="ABCDEFGHIJKLMNOP" revealed={false} duration={600} />);
    await sleep(40);
    const afterReverse = resolved(root);
    // Continues from where it was (no jump to fully concealed or back to 0) and now decreases.
    expect(afterReverse).toBeGreaterThan(0);
    expect(afterReverse).toBeLessThanOrEqual(mid);
    await waitFor(() => expect(root).toHaveAttribute('data-state', 'concealed'), { timeout: 2000 });
  });

  it('stops its loop once settled and on unmount', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const { container, rerender, unmount } = render(<ArchiveReveal text="AB" revealed={false} duration={40} />);
    rerender(<ArchiveReveal text="AB" revealed duration={40} />);
    await waitFor(() => expect(container.querySelector('.rl-reveal')).toHaveAttribute('data-state', 'revealed'), { timeout: 2000 });
    const callsAtSettle = raf.mock.calls.length;
    await sleep(60);
    expect(raf.mock.calls.length).toBe(callsAtSettle);
    rerender(<ArchiveReveal text="AB" revealed={false} duration={400} />);
    const error = vi.spyOn(console, 'error');
    unmount();
    await sleep(30);
    expect(error).not.toHaveBeenCalled();
  });
});

describe('ScanSurface', () => {
  it('renders children immediately and does not scan on mount', () => {
    const { container } = render(
      <ScanSurface>
        <button type="button">复核</button>
      </ScanSurface>,
    );
    expect(screen.getByRole('button', { name: '复核' })).toBeInTheDocument();
    expect(container.querySelector('.rl-scan__line')).toBeNull();
  });

  it('runs exactly one sweep per scanKey change, then removes the line', async () => {
    const onScanEnd = vi.fn();
    const { container, rerender } = render(
      <ScanSurface scanKey={0} duration={60} onScanEnd={onScanEnd}>
        <p>内容</p>
      </ScanSurface>,
    );
    rerender(
      <ScanSurface scanKey={1} duration={60} onScanEnd={onScanEnd}>
        <p>内容</p>
      </ScanSurface>,
    );
    expect(container.querySelector('.rl-scan__line')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.rl-scan')).toHaveAttribute('data-scanning', 'true');
    await waitFor(() => expect(container.querySelector('.rl-scan__line')).toBeNull(), { timeout: 2000 });
    expect(onScanEnd).toHaveBeenCalledTimes(1);

    // Re-rendering with the same key must not start another sweep.
    rerender(
      <ScanSurface scanKey={1} duration={30} onScanEnd={onScanEnd}>
        <p>更新后的内容</p>
      </ScanSurface>,
    );
    expect(container.querySelector('.rl-scan__line')).toBeNull();
    await sleep(60);
    expect(onScanEnd).toHaveBeenCalledTimes(1);
  });

  it('marks reduced motion so CSS swaps the sweep for a static outline', async () => {
    const { container, rerender } = render(
      <EffectClock reduced>
        <ScanSurface scanKey={0}>
          <p>内容</p>
        </ScanSurface>
      </EffectClock>,
    );
    rerender(
      <EffectClock reduced>
        <ScanSurface scanKey={1}>
          <p>内容</p>
        </ScanSurface>
      </EffectClock>,
    );
    expect(container.querySelector('.rl-scan')).toHaveAttribute('data-reduced', 'true');
    await waitFor(() => expect(container.querySelector('.rl-scan__line')).toBeNull(), { timeout: 1000 });
  });

  it('slow speed lengthens the sweep', () => {
    const { container } = render(
      <EffectClock speed={0.25}>
        <ScanSurface duration={900}>
          <p>内容</p>
        </ScanSurface>
      </EffectClock>,
    );
    expect((container.querySelector('.rl-scan') as HTMLElement).style.getPropertyValue('--rl-scan-duration')).toBe('3600ms');
  });
});

describe('OrbitalDiagram', () => {
  const nodes = [
    { id: 'a', label: '样本登记', ring: 0, angle: 0 },
    { id: 'b', label: '结构观测', ring: 1, angle: 120, active: true },
    { id: 'c', label: '结论归档', ring: 2, angle: 240 },
  ];

  it('labels are an accessible list; the drawing is aria-hidden', () => {
    const { container } = render(<OrbitalDiagram nodes={nodes} label="流程阶段" center="ARC-1024" />);
    const list = screen.getByRole('list', { name: '流程阶段' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText(/结构观测/)).toHaveTextContent('当前');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.rl-orbit__node')).toHaveLength(3);
  });

  it('does not spin unless asked, and never under reduced motion', () => {
    const { container, rerender } = render(<OrbitalDiagram nodes={nodes} label="x" />);
    expect(container.querySelector('.rl-orbit')).not.toHaveAttribute('data-spinning');
    rerender(<OrbitalDiagram nodes={nodes} label="x" animate />);
    expect(container.querySelector('.rl-orbit')).toHaveAttribute('data-spinning', 'true');
    rerender(
      <EffectClock reduced>
        <OrbitalDiagram nodes={nodes} label="x" animate />
      </EffectClock>,
    );
    expect(container.querySelector('.rl-orbit')).not.toHaveAttribute('data-spinning');
  });

  it('places nodes deterministically from their angle', () => {
    const { container } = render(<OrbitalDiagram nodes={[{ id: 'top', label: 'T', ring: 0, angle: 0 }]} label="x" />);
    const node = container.querySelector('.rl-orbit__node')!;
    expect(Number(node.getAttribute('cx'))).toBeCloseTo(120);
    expect(Number(node.getAttribute('cy'))).toBeLessThan(120);
  });
});

describe('MotionPlayer', () => {
  function Demo({ play, active, lane }: MotionDemoProps) {
    const t = useEffectTiming();
    return (
      <output data-lane={lane}>
        {`play=${play} active=${active} speed=${t.speed} reduced=${t.reduced}`}
      </output>
    );
  }

  function renderPlayer(props: Partial<React.ComponentProps<typeof MotionPlayer>> = {}) {
    return render(<MotionPlayer title="档案解密" spec="scene 420ms" demo={(p) => <Demo {...p} />} {...props} />);
  }

  const lane = (name: string) => document.querySelector(`output[data-lane="${name}"]`)!;

  it('is a labelled region with four lanes in the MOTION.md order', () => {
    renderPlayer();
    const region = screen.getByRole('region', { name: '档案解密' });
    const items = within(region).getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-lane'))).toEqual(['default', 'slow', 'reduced', 'interrupt']);
    expect(within(region).getByText('Slow ×0.25')).toBeInTheDocument();
    expect(within(region).getByText('scene 420ms')).toBeInTheDocument();
  });

  it('gives each lane its own timing: default ×1, slow ×0.25, reduced forced', () => {
    renderPlayer();
    expect(lane('default')).toHaveTextContent('speed=1 reduced=false');
    expect(lane('slow')).toHaveTextContent('speed=0.25 reduced=false');
    expect(lane('reduced')).toHaveTextContent('speed=1 reduced=true');
    expect(lane('interrupt')).toHaveTextContent('speed=1 reduced=false');
    expect(lane('reduced').closest('.rl-player__stage')).toHaveAttribute('data-rl-motion', 'reduce');
  });

  it('one play control drives every lane; the interrupt lane reverses mid-play', async () => {
    const user = userEvent.setup();
    renderPlayer({ interruptAfterMs: 60 });
    await user.click(screen.getByRole('button', { name: '播放' }));
    for (const name of ['default', 'slow', 'reduced']) {
      expect(lane(name)).toHaveTextContent('play=1 active=true');
    }
    expect(lane('interrupt')).toHaveTextContent('play=1 active=true');
    await waitFor(() => expect(lane('interrupt')).toHaveTextContent('play=2 active=false'), { timeout: 2000 });
    expect(lane('default')).toHaveTextContent('play=1 active=true');
    expect(screen.getByRole('button', { name: '反向播放' })).toBeInTheDocument();
  });

  it('announces state politely and reset returns every lane to the start', async () => {
    const user = userEvent.setup();
    renderPlayer({ interruptAfterMs: 20 });
    const reset = screen.getByRole('button', { name: '重置' });
    expect(reset).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '播放' }));
    const status = screen.getByText(/第 1 次/);
    expect(status).toHaveAttribute('aria-live', 'polite');
    await sleep(40);
    await user.click(reset);
    for (const name of ['default', 'slow', 'reduced', 'interrupt']) {
      expect(lane(name)).toHaveTextContent('play=0 active=false');
    }
    expect(screen.getByRole('button', { name: '重置' })).toBeDisabled();
  });

  it('a surrounding reduced-motion preference is kept in every lane (lanes never re-enable motion)', () => {
    render(
      <MotionConfig reducedMotion="always">
        <MotionPlayer title="档案解密" demo={(p) => <Demo {...p} />} />
      </MotionConfig>,
    );
    for (const name of ['default', 'slow', 'reduced', 'interrupt']) {
      expect(lane(name)).toHaveTextContent('reduced=true');
    }
  });

  it('can show a subset of lanes', () => {
    renderPlayer({ lanes: ['default', 'reduced'] });
    expect(screen.getAllByRole('listitem').map((li) => li.getAttribute('data-lane'))).toEqual(['default', 'reduced']);
  });
});
