import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '../src/index';

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
