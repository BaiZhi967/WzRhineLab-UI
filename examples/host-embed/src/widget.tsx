import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  DataTable,
  Dialog,
  DialogClose,
  Field,
  Input,
  MetadataList,
  RhineProvider,
  Select,
  StatusBadge,
  Tooltip,
  useToast,
} from '@wzrhine/react';
import type { DataTableColumn, RhineDensity, RhineTheme } from '@wzrhine/react';
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';

/**
 * Embeddable archive widget. The host page knows nothing about React: it calls
 * `mountArchiveWidget(element, options)` and gets back `update()` / `unmount()`.
 * Every instance has its own RhineProvider, so theme, portal and toasts stay per-instance.
 */

export interface WidgetOptions {
  title: string;
  theme?: RhineTheme;
  density?: RhineDensity;
  /** Called when the user requests a record; the host decides what to do. */
  onRequest?: (id: string) => void;
}

export interface WidgetHandle {
  update: (next: Partial<WidgetOptions>) => void;
  unmount: () => void;
}

interface Row {
  id: string;
  title: string;
  level: '公开' | '内部';
}

const rows: Row[] = [
  { id: 'ARC-2001', title: '年度设备巡检报告', level: '公开' },
  { id: 'ARC-2002', title: '样本库迁移计划', level: '内部' },
  { id: 'ARC-2003', title: '安全培训记录', level: '公开' },
];

const columns: DataTableColumn<Row>[] = [
  { key: 'id', header: '编号', mono: true, rowHeader: true },
  { key: 'title', header: '标题' },
  { key: 'level', header: '级别', cell: (r) => <StatusBadge status={r.level === '公开' ? 'success' : 'warning'}>{r.level}</StatusBadge> },
];

function Widget({ title, onRequest }: Pick<WidgetOptions, 'title' | 'onRequest'>) {
  const toast = useToast();
  const [record, setRecord] = React.useState<string | null>('ARC-2001');
  const [reason, setReason] = React.useState('');
  const selected = rows.find((r) => r.id === record);

  return (
    <div className="rl-embed" data-slot="embed">
      <h2 className="rl-embed__title">{title}</h2>
      <DataTable caption={`${title} · 记录`} hideCaption density="compact" columns={columns} rows={rows} getRowId={(r) => r.id} />
      <div className="rl-embed__row">
        <Field label="申请调阅">
          <Select
            size="sm"
            value={record}
            onValueChange={setRecord}
            options={rows.map((r) => ({ value: r.id, label: `${r.id} · ${r.title}` }))}
          />
        </Field>
      </div>
      {selected && (
        <MetadataList
          size="sm"
          items={[
            { label: '编号', value: selected.id, mono: true },
            { label: '级别', value: selected.level },
          ]}
        />
      )}
      <div className="rl-embed__row">
        <Dialog
          trigger={<Button size="sm">提交调阅申请</Button>}
          title="提交调阅申请"
          description={selected ? `${selected.id} · ${selected.title}` : undefined}
          size="sm"
          actions={
            <>
              <DialogClose>
                <Button variant="ghost">取消</Button>
              </DialogClose>
              <DialogClose>
                <Button
                  onClick={() => {
                    if (!selected) return;
                    onRequest?.(selected.id);
                    toast.show({ title: `已提交 ${selected.id} 的调阅申请`, status: 'success' });
                    setReason('');
                  }}
                >
                  提交
                </Button>
              </DialogClose>
            </>
          }
        >
          <Field label="事由" optional>
            <Input value={reason} onValueChange={setReason} maxLength={40} />
          </Field>
        </Dialog>
        <Tooltip content="申请会发送给档案管理员审批。">
          <Button size="sm" variant="ghost">
            说明
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

export function mountArchiveWidget(element: HTMLElement, options: WidgetOptions): WidgetHandle {
  const root = createRoot(element);
  let current: WidgetOptions = { theme: 'light', density: 'comfortable', ...options };
  const render = () =>
    root.render(
      <React.StrictMode>
        <RhineProvider theme={current.theme} density={current.density} className="rl-embed-root">
          <Widget title={current.title} onRequest={current.onRequest} />
        </RhineProvider>
      </React.StrictMode>,
    );
  render();
  return {
    update: (next) => {
      current = { ...current, ...next };
      render();
    },
    unmount: () => root.unmount(),
  };
}
