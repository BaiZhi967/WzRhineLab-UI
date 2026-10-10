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

describe('M1-B prop types', () => {
  it('IconButton requires an accessible name', async () => {
    const { IconButton, Text, Field, Input } = await import('../src');
    void (<IconButton icon={null} label="关闭" />);
    void (<IconButton icon={null} aria-labelledby="x" />);
    // @ts-expect-error missing label / aria-labelledby
    void (<IconButton icon={null} />);
    // @ts-expect-error both naming strategies at once
    void (<IconButton icon={null} label="a" aria-labelledby="b" />);
    // @ts-expect-error unknown variant
    void (<Text variant="huge" />);
    // @ts-expect-error label is required on Field
    void (<Field><Input /></Field>);
    void (<Field label="x"><Input size="sm" mono /></Field>);
  });
});

describe('M7 form prop types', () => {
  it('choice controls require a visible or hidden label', async () => {
    const { Checkbox, CheckboxGroup, Radio, RadioGroup, Switch, Fieldset } = await import('../src');
    void (<Checkbox label="确认" />);
    // @ts-expect-error label is required
    void (<Checkbox />);
    // @ts-expect-error naming goes through label, not aria-label
    void (<Checkbox label="x" aria-label="y" />);
    // @ts-expect-error label is required
    void (<Switch />);
    // @ts-expect-error Switch is not a required-style control; use Checkbox
    void (<Switch label="x" required />);
    // @ts-expect-error group needs a legend
    void (<CheckboxGroup><Checkbox label="a" /></CheckboxGroup>);
    // @ts-expect-error Radio needs a value
    void (<RadioGroup label="g"><Radio label="a" /></RadioGroup>);
    // @ts-expect-error Fieldset needs a legend
    void (<Fieldset>x</Fieldset>);
    void (
      <CheckboxGroup label="g" onValueChange={(value) => expectTypeOf(value).toEqualTypeOf<string[]>()}>
        <Checkbox value="a" label="a" />
      </CheckboxGroup>
    );
  });

  it('Textarea is a textarea, not an input', async () => {
    const { Textarea } = await import('../src');
    const ref = React.createRef<HTMLTextAreaElement>();
    void (<Textarea ref={ref} rows={4} maxLength={10} showCount onValueChange={(v) => expectTypeOf(v).toEqualTypeOf<string>()} />);
    const inputRef = React.createRef<HTMLInputElement>();
    // @ts-expect-error wrong element type
    void (<Textarea ref={inputRef} />);
    // @ts-expect-error unknown resize mode
    void (<Textarea resize="both" />);
  });
});

describe('M8 prop types', () => {
  it('Pagination needs a page count source; DataTable status is a closed union', async () => {
    const { Pagination, DataTable, Progress, Meter, Stat, Breadcrumb } = await import('../src');
    void (<Pagination pageCount={3} />);
    void (<Pagination totalItems={100} pageSize={25} />);
    // @ts-expect-error pageCount or totalItems + pageSize is required
    void (<Pagination page={1} />);
    // @ts-expect-error totalItems needs pageSize
    void (<Pagination totalItems={100} />);
    void (<Pagination pageCount={3} onPageChange={(p) => expectTypeOf(p).toEqualTypeOf<number>()} />);
    // @ts-expect-error unknown status
    void (<DataTable caption="c" columns={[]} rows={[]} getRowId={() => ''} status="pending" />);
    // @ts-expect-error Progress needs a label
    void (<Progress value={1} />);
    // @ts-expect-error indeterminate is null, not undefined
    void (<Progress label="x" />);
    // @ts-expect-error Meter cannot be indeterminate
    void (<Meter label="x" value={null} />);
    // @ts-expect-error name comes from label
    void (<Meter label="x" value={1} aria-label="y" />);
    // @ts-expect-error Stat needs a label
    void (<Stat value={1} />);
    // @ts-expect-error Breadcrumb needs items
    void (<Breadcrumb />);
  });
});
