import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArchiveReveal, OrbitalDiagram, ScanSurface } from '../src/index.js';

describe('Wpi effect additions', () => {
  it('forwards native attributes and exposes a paused archive reveal', () => {
    render(<ArchiveReveal text="ARC-1" revealed paused data-testid="reveal" />);
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-paused', 'true');
    expect(screen.getByTestId('reveal')).toHaveAttribute('aria-label', 'ARC-1');
  });

  it('supports size and node tone on orbital diagrams', () => {
    render(<OrbitalDiagram label="Orbit" size={320} nodes={[{ id: 'a', label: 'A', ring: 0, angle: 0, tone: 'accent', selected: true }]} />);
    expect(document.querySelector('[data-slot="orbital-diagram"]')).toHaveAttribute('data-size', '320');
  });

  it('allows scan container side effects to be disabled', () => {
    render(<ScanSurface scanKey={1} overflow="visible" containerType={false} tone="warning"><span>content</span></ScanSurface>);
    const node = document.querySelector('[data-slot="scan-surface"]')!;
    expect(node).toHaveAttribute('data-tone', 'warning');
    expect(node).toHaveAttribute('data-container-type', 'none');
  });
});
