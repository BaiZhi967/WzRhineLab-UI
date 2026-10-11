import * as React from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import { Accordion, AccordionItem, ContextMenu, MenuItem, NumberField, Slider } from '../src';
import type {
  AccordionHeadingLevel,
  AccordionItemData,
  AccordionProps,
  ContextMenuProps,
  NumberFieldProps,
  RhineMessages,
  SliderChangeValue,
  SliderMark,
  SliderProps,
} from '../src';

describe('M12 group 1 types (ADR-0010 §2)', () => {
  it('Accordion: string[] values, heading level 2–6, items or composition', () => {
    expectTypeOf<AccordionHeadingLevel>().toEqualTypeOf<2 | 3 | 4 | 5 | 6>();
    expectTypeOf<AccordionProps['value']>().toEqualTypeOf<string[] | undefined>();
    expectTypeOf<NonNullable<AccordionProps['onValueChange']>>().parameters.toEqualTypeOf<[string[]]>();
    expectTypeOf<AccordionItemData['value']>().toEqualTypeOf<string>();
    void (<Accordion items={[{ value: 'a', title: '甲', content: '一' }]} multiple headingLevel={2} />);
    void (
      <Accordion defaultValue={['a']}>
        <AccordionItem value="a" title="甲" meta="3 项" disabled>
          一
        </AccordionItem>
      </Accordion>
    );
    // @ts-expect-error h1 is reserved for the page title
    void (<Accordion headingLevel={1} />);
    // @ts-expect-error item value is required
    void (<AccordionItem title="甲" />);
    // @ts-expect-error values are string arrays
    void (<Accordion value="a" />);
  });

  it('Slider: label is required; value shape decides the callback shape', () => {
    expectTypeOf<SliderChangeValue<number>>().toEqualTypeOf<number>();
    expectTypeOf<SliderChangeValue<number[]>>().toEqualTypeOf<number[]>();
    expectTypeOf<SliderMark>().toHaveProperty('value').toEqualTypeOf<number>();
    void (<Slider label="强度" defaultValue={2} onValueChange={(v) => expectTypeOf(v).toEqualTypeOf<number>()} />);
    void (<Slider label="范围" defaultValue={[1, 2]} onValueChange={(v) => expectTypeOf(v).toEqualTypeOf<number[]>()} />);
    void (<Slider label="强度" marks={[{ value: 0, label: '关闭' }]} format={{ style: 'percent' }} showValue name="effort" />);
    // @ts-expect-error label is required
    void (<Slider defaultValue={2} />);
    // @ts-expect-error the name comes from `label`
    void (<Slider label="强度" aria-label="x" />);
    // @ts-expect-error orientation is horizontal only
    void (<Slider label="强度" orientation="vertical" />);
    expectTypeOf<SliderProps>().not.toHaveProperty('orientation');
  });

  it('NumberField: number | null value, size sm | md | lg, Intl format', () => {
    expectTypeOf<NumberFieldProps['value']>().toEqualTypeOf<number | null | undefined>();
    expectTypeOf<NonNullable<NumberFieldProps['onValueChange']>>().parameters.toEqualTypeOf<[number | null]>();
    expectTypeOf<NumberFieldProps['format']>().toEqualTypeOf<Intl.NumberFormatOptions | undefined>();
    void (<NumberField label="并发" min={1} max={16} step={1} size="sm" name="n" unit="个" invalid error="超出范围" />);
    // @ts-expect-error label is required
    void (<NumberField defaultValue={1} />);
    // @ts-expect-error defaultValue is a number
    void (<NumberField label="并发" defaultValue="1" />);
  });

  it('ContextMenu: trigger element + Menu items', () => {
    expectTypeOf<ContextMenuProps['trigger']>().toEqualTypeOf<React.ReactElement<Record<string, unknown>>>();
    void (
      <ContextMenu trigger={<div>行</div>} onOpenChange={(open) => expectTypeOf(open).toEqualTypeOf<boolean>()}>
        <MenuItem>复制</MenuItem>
      </ContextMenu>
    );
    // @ts-expect-error trigger is required
    void (<ContextMenu>x</ContextMenu>);
    // @ts-expect-error trigger must be an element, not text
    void (<ContextMenu trigger="行">x</ContextMenu>);
  });

  it('messages table has the numberField namespace', () => {
    expectTypeOf<RhineMessages['numberField']>().toEqualTypeOf<{ decrement: string; increment: string; roleDescription: string }>();
  });
});
