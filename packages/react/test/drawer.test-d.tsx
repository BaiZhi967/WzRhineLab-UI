import { describe, expectTypeOf, it } from 'vitest';
import { Drawer } from '../src';
import type { DrawerProps, DrawerSide, DrawerSize } from '../src';
// Imported from the module until the coordinator re-exports them from src/index.ts.
import { DrawerClose } from '../src/components/Drawer';
import type { DrawerCloseReason } from '../src/components/Drawer';

describe('Drawer types', () => {
  it('side and size are closed unions', () => {
    expectTypeOf<DrawerSide>().toEqualTypeOf<'start' | 'end'>();
    expectTypeOf<DrawerSize>().toEqualTypeOf<'sm' | 'md' | 'lg'>();
    // @ts-expect-error physical sides are not accepted; side is logical
    void (<Drawer title="t" side="right" />);
    // @ts-expect-error bottom is chosen by the viewport, not by the caller
    void (<Drawer title="t" side="bottom" />);
    // @ts-expect-error unknown size
    void (<Drawer title="t" size="xl" />);
  });

  it('title is required', () => {
    void (<Drawer title="ARC-1024" />);
    // @ts-expect-error title names the dialog
    void (<Drawer description="记录详情" />);
  });

  it('close reasons are the Dialog reasons plus swipe', () => {
    expectTypeOf<DrawerCloseReason>().toEqualTypeOf<'escape' | 'outside' | 'close-button' | 'trigger' | 'swipe'>();
    expectTypeOf<NonNullable<DrawerProps['onCloseRequest']>>().parameters.toEqualTypeOf<[DrawerCloseReason]>();
    void (<Drawer title="t" onCloseRequest={(reason) => reason !== 'outside'} />);
    void (<Drawer title="t" onCloseRequest={() => undefined} />);
    // @ts-expect-error must return boolean or void
    void (<Drawer title="t" onCloseRequest={() => 'no'} />);
  });

  it('closeLabel is a string (it names an IconButton)', () => {
    expectTypeOf<DrawerProps['closeLabel']>().toEqualTypeOf<string | undefined>();
    // @ts-expect-error not a node
    void (<Drawer title="t" closeLabel={<span>关闭</span>} />);
  });

  it('DrawerClose wraps a single element', () => {
    void (
      <DrawerClose>
        <button type="button">取消</button>
      </DrawerClose>
    );
    // @ts-expect-error text is not an element
    void (<DrawerClose>取消</DrawerClose>);
  });
});
