import * as React from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import { Alert, Callout, DataTable, EmptyState, Skeleton, Spinner, useToast } from '../src';
import type {
  AlertLive,
  AlertProps,
  AlertTone,
  CalloutProps,
  DataTableProps,
  EmptyStateKind,
  EmptyStateProps,
  SkeletonProps,
  SkeletonShape,
  SpinnerProps,
  SpinnerSize,
  ToastApi,
  ToastOptions,
} from '../src';

describe('status component types (ADR-0006 §5–7)', () => {
  it('Alert / Callout unions and props', () => {
    expectTypeOf<AlertTone>().toEqualTypeOf<'neutral' | 'info' | 'success' | 'warning' | 'danger'>();
    expectTypeOf<AlertLive>().toEqualTypeOf<'off' | 'polite' | 'assertive'>();
    expectTypeOf<AlertProps['onDismiss']>().toEqualTypeOf<(() => void) | undefined>();
    void (<Alert tone="warning" live="polite" title="t" action={<button type="button">查看</button>} onDismiss={() => {}} dismissLabel="关闭" />);
    // @ts-expect-error unknown tone
    void (<Alert tone="error" />);
    // @ts-expect-error live is a closed union
    void (<Alert live="rude" />);
    // @ts-expect-error Alert sets its own role from `live`
    void (<Alert role="alert" />);
  });

  it('Callout is never live and never dismissible', () => {
    void (<Callout tone="info" title="关于样例数据">正文</Callout>);
    expectTypeOf<CalloutProps>().not.toHaveProperty('live');
    expectTypeOf<CalloutProps>().not.toHaveProperty('onDismiss');
    // @ts-expect-error no live on Callout
    void (<Callout live="polite" />);
    // @ts-expect-error no dismiss on Callout
    void (<Callout onDismiss={() => {}} />);
  });

  it('EmptyState requires a title; headingLevel is 2–6', () => {
    expectTypeOf<EmptyStateKind>().toEqualTypeOf<'empty' | 'no-results' | 'no-permission' | 'first-use'>();
    expectTypeOf<EmptyStateProps['headingLevel']>().toEqualTypeOf<2 | 3 | 4 | 5 | 6 | undefined>();
    expectTypeOf<EmptyStateProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
    void (<EmptyState title="暂无记录" kind="first-use" headingLevel={3} size="sm" icon={null} />);
    // @ts-expect-error title is required
    void (<EmptyState kind="empty" />);
    // @ts-expect-error h1 belongs to the page
    void (<EmptyState title="t" headingLevel={1} />);
    // @ts-expect-error unknown kind
    void (<EmptyState title="t" kind="error" />);
  });

  it('Skeleton and Spinner props', () => {
    expectTypeOf<SkeletonShape>().toEqualTypeOf<'text' | 'block' | 'circle'>();
    expectTypeOf<SkeletonProps['width']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SkeletonProps['lines']>().toEqualTypeOf<number | undefined>();
    void (<Skeleton shape="block" width="12rem" height="var(--rl-space-16)" />);
    void (<Skeleton lines={3} />);
    // @ts-expect-error CSS lengths are strings (no implicit px)
    void (<Skeleton width={120} />);
    // @ts-expect-error Skeleton is always aria-hidden; it renders no children
    void (<Skeleton>loading</Skeleton>);
    expectTypeOf<SpinnerSize>().toEqualTypeOf<'sm' | 'md' | 'lg'>();
    expectTypeOf<SpinnerProps['label']>().toEqualTypeOf<string | undefined>();
    void (<Spinner size="lg" label="正在加载" />);
    // @ts-expect-error unknown size
    void (<Spinner size="xl" />);
    // @ts-expect-error role is derived from label
    void (<Spinner role="img" />);
  });

  it('DataTable gains optional emptyDescription', () => {
    expectTypeOf<DataTableProps<{ id: string }>['emptyDescription']>().toEqualTypeOf<React.ReactNode | undefined>();
    void (<DataTable caption="c" columns={[]} rows={[]} getRowId={() => ''} emptyDescription="调整筛选条件。" />);
  });
});

describe('Toast types (ADR-0006 §8)', () => {
  it('options gain id and action.keepOpen', () => {
    expectTypeOf<ToastOptions['id']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<NonNullable<ToastOptions['action']>['keepOpen']>().toEqualTypeOf<boolean | undefined>();
  });

  it('promise maps string / options / function stages and keeps the value type', () => {
    const toast = {} as ToastApi;
    const out = toast.promise(Promise.resolve(3), {
      loading: '处理中',
      success: (n) => {
        expectTypeOf(n).toEqualTypeOf<number>();
        return { title: `完成 ${n}`, status: 'success' };
      },
      error: (e) => {
        expectTypeOf(e).toEqualTypeOf<unknown>();
        return '失败';
      },
    });
    expectTypeOf(out).toEqualTypeOf<Promise<number>>();
    toast.promise(Promise.resolve('x'), {
      // @ts-expect-error loading cannot depend on the result
      loading: () => '处理中',
      success: '完成',
      error: '失败',
    });
    // @ts-expect-error all three stages are required
    toast.promise(Promise.resolve(1), { loading: 'a', success: 'b' });
    expectTypeOf(useToast).returns.toEqualTypeOf<ToastApi>();
  });
});
