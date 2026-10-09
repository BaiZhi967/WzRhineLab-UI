import * as React from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import { Button, StatusBadge, Surface } from '../src';
import type { ButtonProps, StatusBadgeProps, SurfaceProps } from '../src';

describe('public prop types', () => {
  it('Button accepts native button props and its own variants', () => {
    expectTypeOf<ButtonProps['variant']>().toEqualTypeOf<'primary' | 'accent' | 'secondary' | 'ghost' | undefined>();
    expectTypeOf<ButtonProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
    expectTypeOf<ButtonProps>().toHaveProperty('onClick');
    expectTypeOf<ButtonProps>().toHaveProperty('aria-label');
    void (<Button type="submit" form="f" name="n" value="v" onClick={(e) => e.currentTarget.blur()} />);
  });

  it('Button rejects unknown variants', () => {
    // @ts-expect-error unknown variant
    void (<Button variant="danger" />);
    // @ts-expect-error unknown size
    void (<Button size="xl" />);
  });

  it('Button ref targets HTMLButtonElement', () => {
    const ref = React.createRef<HTMLButtonElement>();
    void (<Button ref={ref} />);
    const divRef = React.createRef<HTMLDivElement>();
    // @ts-expect-error wrong element type
    void (<Button ref={divRef} />);
  });

  it('StatusBadge status is a closed union', () => {
    expectTypeOf<StatusBadgeProps['status']>().toEqualTypeOf<
      'neutral' | 'info' | 'success' | 'warning' | 'danger' | undefined
    >();
    // @ts-expect-error unknown status
    void (<StatusBadge status="online" />);
  });

  it('Surface element is restricted to semantic containers', () => {
    expectTypeOf<SurfaceProps['as']>().toEqualTypeOf<'section' | 'div' | 'article' | 'aside' | undefined>();
    // @ts-expect-error not a container
    void (<Surface as="button" />);
  });
});
