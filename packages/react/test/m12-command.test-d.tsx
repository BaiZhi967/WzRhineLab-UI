import * as React from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import { Combobox, CommandPalette, FileDropZone } from '../src';
import type {
  CommandItem,
  CommandPaletteProps,
  ComboboxFilter,
  ComboboxOption,
  ComboboxProps,
  FileDropZoneProps,
  FileRejection,
  FileRejectionReason,
  RhineMessages,
} from '../src';

const items: ComboboxOption[] = [{ value: 'a', label: 'A' }];

describe('Combobox types', () => {
  it('label and items are required', () => {
    void (<Combobox label="类别" items={items} />);
    // @ts-expect-error label names the input
    void (<Combobox items={items} />);
    // @ts-expect-error items are required
    void (<Combobox label="类别" />);
  });

  it('values are strings; onValueChange receives string | null', () => {
    expectTypeOf<NonNullable<ComboboxProps['onValueChange']>>().parameters.toEqualTypeOf<[string | null]>();
    void (<Combobox label="类别" items={items} value={null} />);
    // @ts-expect-error values are strings
    void (<Combobox label="类别" items={items} value={1} />);
  });

  it('option labels are strings (they fill the input and drive filtering)', () => {
    expectTypeOf<ComboboxOption['label']>().toEqualTypeOf<string>();
    // @ts-expect-error label must be text
    const bad: ComboboxOption = { value: 'a', label: <b>A</b> };
    void bad;
  });

  it('filter is a predicate or null', () => {
    expectTypeOf<ComboboxFilter>().toEqualTypeOf<(option: ComboboxOption, query: string) => boolean>();
    void (<Combobox label="类别" items={items} filter={null} />);
    void (<Combobox label="类别" items={items} filter={(o, q) => o.label.startsWith(q)} />);
    // @ts-expect-error filter must return a boolean
    void (<Combobox label="类别" items={items} filter={() => 'yes'} />);
  });

  it('size is the Input size union', () => {
    expectTypeOf<ComboboxProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
    // @ts-expect-error unknown size
    void (<Combobox label="类别" items={items} size="xl" />);
  });

  it('forwards a ref to the input', () => {
    const ref = React.createRef<HTMLInputElement>();
    void (<Combobox ref={ref} label="类别" items={items} />);
  });
});

describe('CommandPalette types', () => {
  it('commands and onSelect are required', () => {
    void (<CommandPalette commands={[]} onSelect={() => undefined} />);
    // @ts-expect-error onSelect runs the command
    void (<CommandPalette commands={[]} />);
  });

  it('onSelect may return false to keep the palette open', () => {
    expectTypeOf<CommandPaletteProps['onSelect']>().returns.toEqualTypeOf<boolean | void>();
    void (<CommandPalette commands={[]} onSelect={() => false} />);
    // @ts-expect-error not a string
    void (<CommandPalette commands={[]} onSelect={() => 'close'} />);
  });

  it('command ids and labels are strings; keywords a string list', () => {
    expectTypeOf<CommandItem['id']>().toEqualTypeOf<string>();
    expectTypeOf<CommandItem['keywords']>().toEqualTypeOf<readonly string[] | undefined>();
    // @ts-expect-error label is required
    const bad: CommandItem = { id: 'x' };
    void bad;
  });

  it('hotkey and title are strings', () => {
    void (<CommandPalette commands={[]} onSelect={() => undefined} hotkey="mod+k" title="命令" />);
    // @ts-expect-error title names the dialog; a node would not
    void (<CommandPalette commands={[]} onSelect={() => undefined} title={<span>命令</span>} />);
  });
});

describe('FileDropZone types', () => {
  it('label is required', () => {
    void (<FileDropZone label="附件" />);
    // @ts-expect-error label names the input
    void (<FileDropZone accept="image/*" />);
  });

  it('callbacks receive File[] and typed rejections', () => {
    expectTypeOf<NonNullable<FileDropZoneProps['onFiles']>>().parameters.toEqualTypeOf<[File[]]>();
    expectTypeOf<NonNullable<FileDropZoneProps['onReject']>>().parameters.toEqualTypeOf<[FileRejection[]]>();
    expectTypeOf<FileRejectionReason>().toEqualTypeOf<'type' | 'size' | 'count'>();
    // @ts-expect-error maxSize is a byte count
    void (<FileDropZone label="附件" maxSize="1MB" />);
  });

  it('forwards a ref to the native input', () => {
    const ref = React.createRef<HTMLInputElement>();
    void (<FileDropZone ref={ref} label="附件" />);
  });
});

describe('message namespaces', () => {
  it('fileDropZone messages are functions with typed arguments', () => {
    expectTypeOf<RhineMessages['fileDropZone']['rejectedSize']>().parameters.toEqualTypeOf<[string, string]>();
    expectTypeOf<RhineMessages['combobox']['empty']>().toEqualTypeOf<string>();
    expectTypeOf<RhineMessages['commandPalette']['hint']>().toEqualTypeOf<string>();
  });
});
