import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnnotationTrace, CalibrationReticle, EffectClock, SignalPath } from '../src/index.js';

describe('signature effect components', () => {
  it('calibration is decorative, initially static and never announces device status', () => {
    const settled = vi.fn();
    const { container } = render(<CalibrationReticle active onSettled={settled} />);
    const effect = container.querySelector('.rl-calibration');
    expect(effect).toHaveAttribute('aria-hidden', 'true');
    expect(effect).toHaveAttribute('data-state', 'settled');
    expect(effect).toHaveAttribute('data-active', 'true');
    expect(container.querySelectorAll('button,[tabindex], [role="status"]')).toHaveLength(0);
    expect(settled).not.toHaveBeenCalled();
    for (const group of container.querySelectorAll('g[style]')) {
      expect((group as SVGGElement).style.transformOrigin).toMatch(/^(160px 130px|50% 50%)$/);
      expect((group as SVGGElement).style.transformBox).toBe('view-box');
    }
  });
  it('two calibrated instances retain independent targets and respect forced reduction', () => {
    const { container, rerender } = render(<EffectClock reduced><CalibrationReticle /><CalibrationReticle active /></EffectClock>);
    expect([...container.querySelectorAll('.rl-calibration')].map((node) => node.getAttribute('data-active'))).toEqual(['false', 'true']);
    rerender(<EffectClock reduced><CalibrationReticle active /><CalibrationReticle /></EffectClock>);
    for (const node of container.querySelectorAll('.rl-calibration')) {
      expect(node).toHaveAttribute('data-reduced', 'true');
      expect(node).toHaveAttribute('data-state', 'settled');
    }
  });
  it('missing endpoints produce a noninteractive empty overlay, not guessed coordinates', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(<><SignalPath containerRef={ref} fromRef={ref} toRef={ref} /><AnnotationTrace containerRef={ref} fromRef={ref} toRef={ref} /></>);
    expect(container.querySelectorAll('svg')).toHaveLength(2);
    expect(container.querySelectorAll('path')).toHaveLength(0);
    for (const overlay of container.querySelectorAll('svg')) {
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
      expect(overlay).toHaveAttribute('focusable', 'false');
    }
  });
});
