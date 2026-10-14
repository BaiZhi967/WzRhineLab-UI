import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon, iconNames } from '../src/index';

describe('Icon custom content', () => {
  it('renders children for a name outside the built-in set', () => {
    const { container } = render(
      <Icon name="CustomMark" aria-label="自定义标记">
        <circle data-testid="mark" cx="12" cy="12" r="4" />
      </Icon>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('data-icon', 'CustomMark');
    expect(container.querySelector('svg')).toHaveAccessibleName('自定义标记');
    expect(container.querySelector('[data-testid="mark"]')).toBeInTheDocument();
  });

  it('children win over the built-in path', () => {
    const { container } = render(
      <Icon name="Check">
        <rect data-testid="override" x="4" y="4" width="16" height="16" />
      </Icon>,
    );
    expect(container.querySelector('[data-testid="override"]')).toBeInTheDocument();
    expect(container.querySelector('path')).toBeNull();
  });

  it('built-in names keep their default path without children', () => {
    const { container } = render(<Icon name="Check" />);
    expect(container.querySelector('path')).not.toBeNull();
  });
});

describe('Icon built-in registry', () => {
  it('has no duplicate names', () => {
    expect(new Set(iconNames).size).toBe(iconNames.length);
  });

  it.each(iconNames.map((name) => [name] as const))('%s renders glyph content on the shared grid', (name) => {
    const { container } = render(<Icon name={name} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '1.75');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('stroke-linejoin', 'round');
    expect(svg).toHaveAttribute('data-icon', name);
    expect(svg!.querySelector('path, circle, rect, ellipse, line, polyline, polygon')).not.toBeNull();
  });

  it('glyphs use only allowed primitive elements', () => {
    for (const name of iconNames) {
      const { container } = render(<Icon name={name} />);
      const nodes = container.querySelectorAll('svg *');
      expect(nodes.length).toBeGreaterThan(0);
      nodes.forEach((node) => {
        expect(['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon']).toContain(node.tagName);
      });
    }
  });
});
