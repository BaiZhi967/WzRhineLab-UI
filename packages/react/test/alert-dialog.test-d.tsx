import { describe, expectTypeOf, it } from 'vitest';
import { AlertDialog, Dialog } from '../src';
import type { AlertDialogProps, AlertDialogTone, DialogProps } from '../src';
// Imported from the module until the coordinator re-exports it from src/index.ts.
import type { DialogCloseReason } from '../src/components/Dialog';

const noop = () => {};

describe('AlertDialog types', () => {
  it('tone is a closed union', () => {
    expectTypeOf<AlertDialogTone>().toEqualTypeOf<'danger' | 'default'>();
    expectTypeOf<AlertDialogProps['tone']>().toEqualTypeOf<'danger' | 'default' | undefined>();
    // @ts-expect-error unknown tone
    void (<AlertDialog title="t" description="d" confirmLabel="c" onConfirm={noop} tone="warning" />);
  });

  it('title, description, confirmLabel and onConfirm are required', () => {
    void (<AlertDialog title="t" description="d" confirmLabel="c" onConfirm={noop} />);
    // @ts-expect-error description is required: a confirmation must state the consequence
    void (<AlertDialog title="t" confirmLabel="c" onConfirm={noop} />);
    // @ts-expect-error title is required
    void (<AlertDialog description="d" confirmLabel="c" onConfirm={noop} />);
    // @ts-expect-error confirmLabel is required
    void (<AlertDialog title="t" description="d" onConfirm={noop} />);
    // @ts-expect-error onConfirm is required
    void (<AlertDialog title="t" description="d" confirmLabel="c" />);
  });

  it('onConfirm may return void or a Promise', () => {
    void (<AlertDialog title="t" description="d" confirmLabel="c" onConfirm={() => Promise.resolve(1)} />);
    void (<AlertDialog title="t" description="d" confirmLabel="c" onConfirm={async () => {}} />);
    expectTypeOf<AlertDialogProps['onConfirm']>().returns.toEqualTypeOf<void | Promise<unknown>>();
  });

  it('naming comes from title, not aria-label', () => {
    // @ts-expect-error the accessible name is the title
    void (<AlertDialog title="t" description="d" confirmLabel="c" onConfirm={noop} aria-label="x" />);
  });

  it('onOpenChange receives a boolean', () => {
    expectTypeOf<NonNullable<AlertDialogProps['onOpenChange']>>().parameters.toEqualTypeOf<[boolean]>();
  });
});

describe('Dialog onCloseRequest types', () => {
  it('reason is a closed union and the guard may return boolean or void', () => {
    expectTypeOf<DialogCloseReason>().toEqualTypeOf<'escape' | 'outside' | 'close-button' | 'trigger'>();
    expectTypeOf<NonNullable<DialogProps['onCloseRequest']>>().parameters.toEqualTypeOf<[DialogCloseReason]>();
    void (<Dialog title="t" onCloseRequest={(reason) => reason !== 'outside'} />);
    void (<Dialog title="t" onCloseRequest={() => {}} />);
    // @ts-expect-error must not return a string
    void (<Dialog title="t" onCloseRequest={() => 'no'} />);
  });
});
