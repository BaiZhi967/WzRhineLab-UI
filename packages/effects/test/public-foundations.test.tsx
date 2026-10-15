import { act } from '@testing-library/react';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { AnnotationTrace, CalibrationReticle, createEffectPath, SignalPath } from '../src/index.js';

function StaticScene() {
  const containerRef = createRef<HTMLDivElement>();
  const fromRef = createRef<HTMLDivElement>();
  const toRef = createRef<HTMLDivElement>();
  return <RhineProvider motion="reduce">
    <div ref={containerRef}>
      <div ref={fromRef}>Source record</div>
      <div ref={toRef}>Destination record</div>
      <CalibrationReticle active />
      <SignalPath containerRef={containerRef} fromRef={fromRef} toRef={toRef} active />
      <AnnotationTrace containerRef={containerRef} fromRef={fromRef} toRef={toRef} active />
    </div>
  </RhineProvider>;
}

describe('public effect foundations', () => {
  it('exposes deterministic geometry from the package entry', () => {
    const input = [{ x: 10.25, y: 40 }, { x: 90.5, y: 40 }] as const;
    const path = createEffectPath(...input, { route: 'rail', bend: 24 });
    expect(path).toBe(createEffectPath(...input, { route: 'rail', bend: 24 }));
    expect(path).not.toMatch(/NaN|Infinity/);
    expect(path).toContain('10.25');
    expect(path).toContain('90.5');
  });

  it('SSR keeps readable content and does not guess unmeasured paths', () => {
    const html = renderToString(<StaticScene />);
    expect(html).toContain('Source record');
    expect(html).toContain('Destination record');
    expect(html).toContain('rl-calibration');
    expect(html).toContain('rl-signal-path');
    expect(html).not.toContain('rl-effect-connection__track');
  });

  it('hydrates the same static initial state without recoverable errors', async () => {
    const errors: unknown[] = [];
    const host = document.createElement('div');
    host.innerHTML = renderToString(<StaticScene />);
    document.body.append(host);
    const log = vi.spyOn(console, 'error');
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <StaticScene />, { onRecoverableError: (error) => errors.push(error) });
      });
      expect(errors).toEqual([]);
      expect(log.mock.calls.map((args) => args.join(' ')).join('\n')).not.toMatch(/hydration|did not match|server rendered/i);
      expect(host.querySelector('.rl-calibration')).toHaveAttribute('data-active', 'true');
      expect(host.querySelectorAll('.rl-effect-connection__track')).toHaveLength(0);
    } finally {
      await act(async () => root?.unmount());
      host.remove();
      log.mockRestore();
    }
  });
});
