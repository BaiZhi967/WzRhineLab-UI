import * as React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Alert,
  AlertDialog,
  Breadcrumb,
  Button,
  DataTable,
  Drawer,
  Field,
  Input,
  Meter,
  MetadataList,
  Pagination,
  Progress,
  RecordHeader,
  RhineProvider,
  Select,
  Stat,
  Textarea,
  Timeline,
  useToast,
} from '../src';
import type { ToastApi } from '../src';
// Imported from the module until the coordinator re-exports them from src/index.ts.
import { RhineMessagesProvider, enUS, mergeMessages, useRhineMessages, zhCN } from '../src/provider/messages';
import type { RhineMessages } from '../src/provider/messages';

/** ADR-0009: built-in copy table, priority, nesting, locale and lang. */

const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/;

/** Deep key paths with the value kind, e.g. `pagination.page:function`. */
function keyPaths(table: object, prefix = ''): string[] {
  return Object.entries(table)
    .flatMap(([key, value]) =>
      value !== null && typeof value === 'object'
        ? keyPaths(value as object, `${prefix}${key}.`)
        : [`${prefix}${key}:${typeof value}`],
    )
    .sort();
}

/** Every text an assistive technology or a sighted user could get from `root`. */
function exposedText(root: Element): string {
  const attrs = [...root.querySelectorAll('[aria-label],[placeholder],[title],[aria-valuetext],[aria-roledescription]')].flatMap((el) =>
    ['aria-label', 'placeholder', 'title', 'aria-valuetext', 'aria-roledescription'].map((name) => el.getAttribute(name) ?? ''),
  );
  return [root.textContent ?? '', ...attrs].join('\n');
}

const rows = [
  { id: 'r1', name: 'Alpha' },
  { id: 'r2', name: 'Beta' },
];
const columns = [{ key: 'name', header: 'Name', rowHeader: true }];

describe('message tables', () => {
  it('zhCN and enUS have identical key sets, including function-valued entries', () => {
    const zh = keyPaths(zhCN);
    expect(zh.length).toBeGreaterThan(30);
    expect(keyPaths(enUS)).toEqual(zh);
  });

  it('enUS contains no CJK text and zhCN keeps the pre-M9.5 strings', () => {
    const f = (n: number) => String(n);
    const sample = (table: RhineMessages) =>
      [
        ...Object.values(table).flatMap((ns) => Object.values(ns).filter((v): v is string => typeof v === 'string')),
        table.breadcrumb.expand(6, f),
        table.dataTable.selectRow('r1'),
        table.dataTable.selection(3, 1, f),
        table.pagination.page(2, f),
        table.pagination.compact(2, 40, f),
        table.pagination.status(26, 50, 1000, f),
        table.pagination.status(0, 0, 0, f),
        table.progress.meterValue('72%', 'high'),
        table.textarea.count(3, 10, f),
      ].join('\n');
    expect(sample(enUS)).not.toMatch(CJK);
    expect(zhCN.pagination.status(51, 75, 1000, f)).toBe('第 51–75 条，共 1000 条');
    expect(zhCN.dataTable.selection(3, 1, f)).toBe('已选 3 条（其中 1 条在其他页）');
    expect(zhCN.dataTable.selection(3, 0, f)).toBe('已选 3 条');
    expect(zhCN.textarea.count(3, 10, f)).toBe('已输入 3 / 10');
  });

  it('mergeMessages merges per namespace and ignores undefined entries', () => {
    const merged = mergeMessages(zhCN, { drawer: { close: 'X' }, stat: { up: undefined } });
    expect(merged.drawer.close).toBe('X');
    expect(merged.stat.up).toBe('上升');
    expect(merged.alert).toBe(zhCN.alert);
    expect(zhCN.drawer.close).toBe('关闭');
  });
});

describe('priority: component prop > nearest provider > zhCN', () => {
  it('falls back to zhCN without any provider', () => {
    render(<Timeline events={[]} />);
    expect(screen.getByText('暂无记录')).toBeInTheDocument();
  });

  it('provider messages replace the default; the prop still wins', () => {
    const { rerender } = render(
      <RhineMessagesProvider messages={{ timeline: { empty: 'Nothing yet' } }}>
        <Timeline events={[]} />
      </RhineMessagesProvider>,
    );
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    rerender(
      <RhineMessagesProvider messages={{ timeline: { empty: 'Nothing yet' } }}>
        <Timeline events={[]} emptyText="From prop" />
      </RhineMessagesProvider>,
    );
    expect(screen.getByText('From prop')).toBeInTheDocument();
  });

  it('Pagination: labels prop > provider > zhCN, per key', () => {
    render(
      <RhineProvider messages={{ pagination: { next: 'Next page', previous: 'Prev page' } }}>
        <Pagination pageCount={5} labels={{ next: '往后' }} />
      </RhineProvider>,
    );
    expect(screen.getByRole('button', { name: '往后' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev page' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '分页' })).toBeInTheDocument();
  });

  it('nested providers merge per namespace with the outer one', () => {
    function Probe() {
      const m = useRhineMessages();
      return <output>{[m.drawer.close, m.alert.dismiss, m.stat.up, m.stat.down].join('|')}</output>;
    }
    render(
      <RhineProvider messages={{ drawer: { close: 'Outer close' }, stat: { up: 'Outer up', down: 'Outer down' } }}>
        <RhineMessagesProvider messages={{ stat: { up: 'Inner up' } }}>
          <Probe />
        </RhineMessagesProvider>
      </RhineProvider>,
    );
    // stat.down comes from the outer provider; alert from zhCN.
    expect(screen.getByRole('status')).toHaveTextContent('Outer close|关闭提示|Inner up|Outer down');
  });
});

describe('locale and lang', () => {
  it('Stat formats with the provider locale; its own locale prop wins', () => {
    const { container } = render(
      <>
        <RhineProvider locale="en-US">
          <Stat label="a" value={1234567.5} />
        </RhineProvider>
        <RhineProvider locale="de-DE">
          <Stat label="b" value={1234567.5} delta={{ value: 12000 }} />
          <Stat label="c" value={1234567.5} locale="en-US" />
        </RhineProvider>
      </>,
    );
    const numbers = [...container.querySelectorAll('.rl-stat__number')].map((el) => el.textContent);
    expect(numbers).toEqual(['1,234,567.5', '1.234.567,5', '1,234,567.5']);
    expect(container.querySelector('.rl-stat__delta-value')).toHaveTextContent('+12.000');
  });

  it('defaults to zh-CN formatting, never the runtime locale', () => {
    const { container } = render(<Stat label="a" value={1234567.5} />);
    expect(container.querySelector('.rl-stat__number')).toHaveTextContent(new Intl.NumberFormat('zh-CN').format(1234567.5));
  });

  it('Progress and Meter value text follow the provider locale', () => {
    render(
      <RhineProvider locale="de-DE">
        <Progress label="p" value={1234.5} max={10000} format={{ maximumFractionDigits: 1 }} />
        <Meter label="m" value={1234.5} max={10000} format={{ maximumFractionDigits: 1 }} />
      </RhineProvider>,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1.234,5');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '1.234,5');
  });

  it('enUS Pagination formats counts with the locale', () => {
    render(
      <RhineProvider messages={enUS} locale="en-US">
        <Pagination totalItems={12345} pageSize={25} page={2} />
      </RhineProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('26–50 of 12,345 items');
    expect(screen.getByRole('button', { name: 'Page 494' })).toBeInTheDocument();
  });

  it('lang is written on the .rl-theme root only when set', () => {
    const { container } = render(
      <RhineProvider>
        <RhineProvider lang="en">
          <p>x</p>
        </RhineProvider>
      </RhineProvider>,
    );
    const [outer, inner] = container.querySelectorAll('.rl-theme');
    expect(outer).not.toHaveAttribute('lang');
    expect(inner).toHaveAttribute('lang', 'en');
    // Popups mount inside the root, so they inherit it.
    expect(inner!.querySelector(':scope > .rl-portal')).not.toBeNull();
  });
});

describe('every component renders English with enUS', () => {
  let toast: ToastApi;
  function CaptureToast() {
    toast = useToast();
    return null;
  }

  const cases: Array<[string, () => React.ReactElement]> = [
    ['Alert', () => <Alert title="Notice" onDismiss={() => {}} />],
    ['Breadcrumb', () => <Breadcrumb items={['A', 'B', 'C', 'D', 'E', 'F'].map((label) => ({ label, href: '#' }))} />],
    [
      'DataTable empty',
      () => <DataTable caption="Records" columns={columns} rows={[]} getRowId={(r: { id: string }) => r.id} />,
    ],
    [
      'DataTable loading',
      () => <DataTable caption="Records" columns={columns} rows={rows} getRowId={(r) => r.id} status="loading" />,
    ],
    [
      'DataTable error',
      () => <DataTable caption="Records" columns={columns} rows={rows} getRowId={(r) => r.id} status="error" onRetry={() => {}} />,
    ],
    [
      'DataTable selection',
      () => (
        <DataTable
          caption="Records"
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          selectedIds={new Set(['r1', 'r9'])}
          onSelectionChange={() => {}}
          pagination={{ page: 1, onPageChange: () => {}, pageSize: 2, totalItems: 40 }}
        />
      ),
    ],
    ['Field optional', () => <Field label="Note" optional><Input /></Field>],
    ['MetadataList', () => <MetadataList items={[{ label: 'Owner', value: null }]} empty="placeholder" />],
    ['Pagination', () => <Pagination totalItems={100} pageSize={10} page={5} />],
    ['Progress', () => <Progress label="Upload" value={null} />],
    ['Meter', () => <Meter label="Load" value={95} high={80} stateLabels={{ critical: 'high' }} />],
    ['RecordHeader', () => <RecordHeader title="Record" trail={[{ label: 'Archive', href: '#' }, { label: 'R1' }]} />],
    ['Select', () => <Select aria-label="Kind" options={[{ value: 'a', label: 'A' }]} />],
    ['Stat', () => <><Stat label="Total" value={null} /><Stat label="Rate" value={3} delta={{ value: 1 }} /><Stat label="Load" value={1} loading /></>],
    ['Textarea', () => <Textarea aria-label="Note" maxLength={100} showCount defaultValue="abc" />],
    ['Timeline', () => <Timeline events={[]} />],
  ];

  it.each(cases)('%s', (_, ui) => {
    render(
      <RhineProvider messages={enUS} locale="en-US" lang="en">
        {ui()}
      </RhineProvider>,
    );
    expect(exposedText(document.body)).not.toMatch(CJK);
    expect(document.body.textContent).not.toBe('');
  });

  it('AlertDialog (portalled) incl. the failure message', async () => {
    const user = userEvent.setup();
    render(
      <RhineProvider messages={enUS}>
        <AlertDialog
          trigger={<Button>Delete</Button>}
          title="Delete record?"
          description="This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => Promise.reject(new Error('x'))}
        />
      </RhineProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(enUS.alertDialog.error);
    expect(exposedText(document.body)).not.toMatch(CJK);
  });

  it('Drawer (portalled)', async () => {
    render(
      <RhineProvider messages={enUS}>
        <Drawer title="Details" defaultOpen />
      </RhineProvider>,
    );
    const drawer = await screen.findByRole('dialog', { name: 'Details' });
    expect(within(drawer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(exposedText(document.body)).not.toMatch(CJK);
  });

  it('Toast: close label and region name come from the provider that mounts the viewport', async () => {
    render(
      <RhineProvider messages={enUS}>
        <CaptureToast />
      </RhineProvider>,
    );
    act(() => {
      toast.show({ title: 'Saved', timeout: 0 });
    });
    // The close button is aria-hidden while the stack is collapsed and unfocused (Base UI), so read the attribute.
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(document.querySelector('.rl-toast__close')).toHaveAttribute('aria-label', 'Dismiss notification');
    expect(document.querySelector('.rl-toast-viewport')).toHaveAttribute('aria-label', 'Notifications');
    expect(exposedText(document.body)).not.toMatch(CJK);
  });

  it('Toast: a nested provider without its own queue uses the outer viewport (and its messages)', async () => {
    render(
      <RhineProvider>
        <RhineProvider messages={enUS}>
          <CaptureToast />
        </RhineProvider>
      </RhineProvider>,
    );
    act(() => {
      toast.show({ title: 'Saved', timeout: 0 });
    });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(document.querySelectorAll('.rl-toast-viewport')).toHaveLength(1);
    expect(document.querySelector('.rl-toast__close')).toHaveAttribute('aria-label', '关闭通知');
  });

  it('Toast: a nested provider with toasts mounts its own English viewport', async () => {
    render(
      <RhineProvider>
        <RhineProvider messages={enUS} toasts>
          <CaptureToast />
        </RhineProvider>
      </RhineProvider>,
    );
    act(() => {
      toast.show({ title: 'Saved', timeout: 0 });
    });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(document.querySelectorAll('.rl-toast-viewport')).toHaveLength(2);
    expect(document.querySelector('.rl-toast__close')).toHaveAttribute('aria-label', 'Dismiss notification');
  });
});

describe('default Chinese output is unchanged', () => {
  it('selection summary, row checkboxes, optional marker, counter, missing value', () => {
    const { container } = render(
      <>
        <DataTable
          caption="记录"
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          getRowLabel={(r) => r.name}
          selectedIds={new Set(['r1', 'r2', 'r9'])}
          onSelectionChange={() => {}}
          pagination={{ page: 1, onPageChange: () => {}, pageSize: 2, totalItems: 4 }}
        />
        <Field label="备注" optional><Input /></Field>
        <Textarea aria-label="意见" maxLength={10} showCount defaultValue="abc" />
        <MetadataList items={[{ label: '负责人', value: null }]} empty="placeholder" />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: '取消全选' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '选择 Alpha' })).toBeInTheDocument();
    expect(container.querySelector('.rl-table__selection')).toHaveTextContent('已选 3 条（其中 1 条在其他页）');
    expect(container.querySelector('.rl-field__optional')).toHaveTextContent('（可选）');
    expect(container.querySelector('.rl-textarea__count')).toHaveTextContent('已输入 3 / 10');
    expect(container.querySelector('.rl-meta__empty')).toHaveTextContent('未记录');
  });
});
