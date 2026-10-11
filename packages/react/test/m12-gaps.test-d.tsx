import * as React from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import { CommandPalette, MenuItem, ScrollArea, SplitButton } from '../src';
import type { CommandFilter, CommandItem, CommandPaletteProps, RhineMessages, ScrollAreaOrientation, ScrollAreaProps, SplitButtonProps } from '../src';

describe('SplitButton types', () => {
  it('label, menuLabel and menu children are required', () => {
    void (
      <SplitButton label="导出" menuLabel="更多">
        <MenuItem>JSON</MenuItem>
      </SplitButton>
    );
    // @ts-expect-error menuLabel names the toggle
    void (<SplitButton label="导出"><MenuItem>JSON</MenuItem></SplitButton>);
    // @ts-expect-error label names the group and the main button
    void (<SplitButton menuLabel="更多"><MenuItem>JSON</MenuItem></SplitButton>);
    // @ts-expect-error label is plain text (it is also the group's aria-label)
    void (<SplitButton label={<b>导出</b>} menuLabel="更多"><MenuItem>JSON</MenuItem></SplitButton>);
  });

  it('variant / size come from Button; the group role and name are fixed', () => {
    expectTypeOf<SplitButtonProps['variant']>().toEqualTypeOf<'primary' | 'accent' | 'secondary' | 'ghost' | undefined>();
    expectTypeOf<SplitButtonProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
    // @ts-expect-error role is always group
    void (<SplitButton label="a" menuLabel="b" role="toolbar"><MenuItem>x</MenuItem></SplitButton>);
  });

  it('forwards a ref to the group', () => {
    const ref = React.createRef<HTMLDivElement>();
    void (<SplitButton ref={ref} label="a" menuLabel="b"><MenuItem>x</MenuItem></SplitButton>);
  });
});

describe('ScrollArea types', () => {
  it('label is required; orientation is vertical | both', () => {
    void (<ScrollArea label="日志">x</ScrollArea>);
    // @ts-expect-error the region needs a name
    void (<ScrollArea>x</ScrollArea>);
    expectTypeOf<ScrollAreaOrientation>().toEqualTypeOf<'vertical' | 'both'>();
    // @ts-expect-error horizontal-only is not offered
    void (<ScrollArea label="日志" orientation="horizontal">x</ScrollArea>);
  });

  it('viewportRef targets the native scroller; maxHeight is a CSS length string', () => {
    const ref = React.createRef<HTMLDivElement>();
    void (<ScrollArea label="日志" viewportRef={ref} maxHeight="20rem">x</ScrollArea>);
    // @ts-expect-error maxHeight is a CSS length, not px numbers
    void (<ScrollArea label="日志" maxHeight={320}>x</ScrollArea>);
    expectTypeOf<NonNullable<ScrollAreaProps['onScrollIntentUp']>>().toEqualTypeOf<() => void>();
  });
});

describe('CommandPalette async types', () => {
  it('filter is a predicate or null', () => {
    expectTypeOf<CommandFilter>().toEqualTypeOf<(command: CommandItem, query: string) => boolean>();
    expectTypeOf<CommandPaletteProps['filter']>().toEqualTypeOf<CommandFilter | null | undefined>();
    void (<CommandPalette commands={[]} onSelect={() => undefined} filter={null} />);
    // @ts-expect-error filter returns a boolean
    void (<CommandPalette commands={[]} onSelect={() => undefined} filter={() => 'yes'} />);
  });

  it('query is a string and onQueryChange receives it; loading is boolean', () => {
    expectTypeOf<NonNullable<CommandPaletteProps['onQueryChange']>>().parameters.toEqualTypeOf<[string]>();
    void (<CommandPalette commands={[]} onSelect={() => undefined} query="" onQueryChange={() => undefined} loading />);
    // @ts-expect-error query is text
    void (<CommandPalette commands={[]} onSelect={() => undefined} query={1} />);
  });

  it('commands may carry icon and meta nodes', () => {
    const item: CommandItem = { id: 'a', label: 'A', icon: <svg />, meta: <span>ARC</span> };
    void item;
    expectTypeOf<RhineMessages['commandPalette']['loading']>().toEqualTypeOf<string>();
  });
});
