import * as React from 'react';
import {
  Alert,
  AlertDialog,
  Breadcrumb,
  Button,
  DataTable,
  Drawer,
  Field,
  MetadataList,
  Meter,
  Pagination,
  Progress,
  RhineProvider,
  Select,
  Stat,
  Textarea,
  enUS,
  useToast,
} from '@wzrhine/react';
import type { DataTableColumn } from '@wzrhine/react';
import { ScopeContext } from '../app/ThemeScope';
import { CodeBlock, PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

/**
 * ADR-0009 specimen: the same components side by side with the built-in zh-CN copy and with
 * `messages={enUS}`. Only the caller's own text (titles, labels, rows) is written per column;
 * every other word comes from the message tables.
 */

type Lang = 'zh' | 'en';

interface DemoRow {
  id: string;
  title: string;
}

const copy = {
  zh: {
    region: 'zh-CN · 默认文案',
    groupNav: '导航',
    groupData: '数据表',
    groupMetrics: '指标',
    groupForms: '表单',
    groupFeedback: '反馈与操作',
    caption: '样例记录',
    emptyCaption: '筛选结果（空）',
    colId: '编号',
    colTitle: '标题',
    rows: [
      { id: 'REC-001', title: '样例记录 A' },
      { id: 'REC-002', title: '样例记录 B' },
    ],
    path: ['档案库', '样本', '海洋来源', '第三批次', 'REC-001'],
    statTotal: '示例 · 记录总数',
    statDelta: '较上周（示例）',
    statMissing: '示例 · 今日新增',
    statLoading: '示例 · 加载中',
    unit: '条',
    progress: '示例 · 导出',
    progressSteps: '示例 · 校验',
    meter: '示例 · 存储占用',
    meterHigh: '偏高',
    note: '复核意见',
    noteValue: '样例意见。',
    kind: '记录类别',
    kinds: [
      { value: 'sample', label: '样本' },
      { value: 'report', label: '报告' },
    ],
    alertTitle: '2 条记录未通过校验',
    alertBody: '导出前请先修正（示例）。',
    restore: '重新显示提示',
    deleteTrigger: '删除记录…',
    deleteTitle: '删除 REC-001？',
    deleteBody: '示例：确认操作总是失败，用来展示内置的错误文案。',
    deleteConfirm: '删除',
    drawerTrigger: '查看详情',
    drawerTitle: 'REC-001',
    owner: '负责人',
    created: '创建',
    toastTrigger: '显示通知',
    toastTitle: '记录已归档（示例）',
  },
  en: {
    region: 'en-US · enUS',
    groupNav: 'Navigation',
    groupData: 'Tables',
    groupMetrics: 'Metrics',
    groupForms: 'Forms',
    groupFeedback: 'Feedback & actions',
    caption: 'Sample records',
    emptyCaption: 'Filtered results (empty)',
    colId: 'ID',
    colTitle: 'Title',
    rows: [
      { id: 'REC-001', title: 'Sample record A' },
      { id: 'REC-002', title: 'Sample record B' },
    ],
    path: ['Archive', 'Specimens', 'Marine', 'Batch 3', 'REC-001'],
    statTotal: 'Sample · Records',
    statDelta: 'vs last week (sample)',
    statMissing: 'Sample · Added today',
    statLoading: 'Sample · Loading',
    unit: 'items',
    progress: 'Sample · Export',
    progressSteps: 'Sample · Checks',
    meter: 'Sample · Storage',
    meterHigh: 'high',
    note: 'Review note',
    noteValue: 'Sample note.',
    kind: 'Record kind',
    kinds: [
      { value: 'sample', label: 'Specimen' },
      { value: 'report', label: 'Report' },
    ],
    alertTitle: '2 records failed validation',
    alertBody: 'Fix them before exporting (sample).',
    restore: 'Show the alert again',
    deleteTrigger: 'Delete record…',
    deleteTitle: 'Delete REC-001?',
    deleteBody: 'Sample: confirming always fails, to show the built-in error message.',
    deleteConfirm: 'Delete',
    drawerTrigger: 'View details',
    drawerTitle: 'REC-001',
    owner: 'Owner',
    created: 'Created',
    toastTitle: 'Record archived (sample)',
    toastTrigger: 'Show toast',
  },
} satisfies Record<Lang, Record<string, unknown>>;

type Copy = (typeof copy)[Lang];

function AlertDemo({ t }: { t: Copy }) {
  const [open, setOpen] = React.useState(true);
  const restoreRef = React.useRef<HTMLButtonElement>(null);
  const dismissed = React.useRef(false);
  React.useEffect(() => {
    if (!open && dismissed.current) restoreRef.current?.focus();
  }, [open]);
  return open ? (
    <Alert
      tone="warning"
      title={t.alertTitle}
      onDismiss={() => {
        dismissed.current = true;
        setOpen(false);
      }}
    >
      {t.alertBody}
    </Alert>
  ) : (
    <Button ref={restoreRef} size="sm" variant="secondary" onClick={() => setOpen(true)}>
      {t.restore}
    </Button>
  );
}

function ToastDemo({ t }: { t: Copy }) {
  const toast = useToast();
  return (
    <Button size="sm" variant="secondary" onClick={() => toast.show({ title: t.toastTitle, status: 'success' })}>
      {t.toastTrigger}
    </Button>
  );
}

function LocaleColumn({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [page, setPage] = React.useState(3);
  // REC-009 sits on another page, so the summary shows the off-page count.
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(['REC-001', 'REC-009']));
  const columns: DataTableColumn<DemoRow>[] = [
    { key: 'id', header: t.colId, mono: true, rowHeader: true },
    { key: 'title', header: t.colTitle },
  ];
  const path = t.path.map((label, i) => (i < t.path.length - 1 ? { label, href: '#/foundations/locale' } : { label }));

  return (
    <div className="sc-locale-column">
      <div className="sc-locale-group">
        <h3 className="sc-locale-group__title">{t.groupNav}</h3>
        <Pagination page={page} totalItems={1000} pageSize={25} onPageChange={setPage} />
        <Breadcrumb items={path} maxItems={3} />
      </div>
      <div className="sc-locale-group">
        <h3 className="sc-locale-group__title">{t.groupData}</h3>
        <DataTable
          caption={t.caption}
          columns={columns}
          rows={t.rows}
          getRowId={(r) => r.id}
          getRowLabel={(r) => r.id}
          selectedIds={selected}
          onSelectionChange={setSelected}
          density="compact"
        />
        <DataTable caption={t.emptyCaption} columns={columns} rows={[]} getRowId={(r) => r.id} density="compact" />
      </div>
      <div className="sc-locale-group">
        <h3 className="sc-locale-group__title">{t.groupMetrics}</h3>
        <div className="sc-stat-row--tight">
          <Stat label={t.statTotal} value={12480} unit={t.unit} delta={{ value: -36, label: t.statDelta }} size="sm" />
          <Stat label={t.statMissing} value={null} size="sm" />
          <Stat label={t.statLoading} value={0} loading size="sm" />
        </div>
        <Progress label={t.progress} value={null} size="sm" />
        <Progress label={t.progressSteps} value={42} size="sm" tone="accent" />
        <Meter label={t.meter} value={86} high={80} optimum={20} stateLabels={{ suboptimum: t.meterHigh, critical: t.meterHigh }} size="sm" />
      </div>
      <div className="sc-locale-group">
        <h3 className="sc-locale-group__title">{t.groupForms}</h3>
        <Field label={t.kind} optional>
          <Select options={t.kinds} />
        </Field>
        <Field label={t.note} optional>
          <Textarea rows={2} maxLength={200} showCount defaultValue={t.noteValue} />
        </Field>
      </div>
      <div className="sc-locale-group">
        <h3 className="sc-locale-group__title">{t.groupFeedback}</h3>
        <AlertDemo t={t} />
        <div className="sc-row sc-row--end">
          <AlertDialog
            trigger={<Button size="sm" variant="ghost">{t.deleteTrigger}</Button>}
            title={t.deleteTitle}
            description={t.deleteBody}
            confirmLabel={t.deleteConfirm}
            onConfirm={() => new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('demo')), 300))}
          />
          <Drawer trigger={<Button size="sm" variant="secondary">{t.drawerTrigger}</Button>} title={t.drawerTitle} size="sm">
            <MetadataList
              empty="placeholder"
              items={[
                { label: t.created, value: '2026-10-01', dateTime: '2026-10-01', mono: true },
                { label: t.owner, value: null },
              ]}
            />
          </Drawer>
          <ToastDemo t={t} />
        </div>
      </div>
    </div>
  );
}

const usage = `import { RhineProvider, enUS } from '@wzrhine/react';

// Whole app in English: copy, number locale and the lang attribute.
<RhineProvider messages={enUS} locale="en-US" lang="en">
  <App />
</RhineProvider>

// One key, everything else stays zh-CN.
<RhineProvider messages={{ drawer: { close: '收起' } }}>…</RhineProvider>`;

export function LocalePage() {
  const scope = React.useContext(ScopeContext);
  return (
    <div className="sc-page">
      <PageHeader index="24" section="Foundations" title="Locale & messages">
        <p>
          组件内置的可见文字与读屏文字集中在一张文案表中（ADR-0009）。默认 <code>zhCN</code>；通过 <code>RhineProvider</code> 的{' '}
          <code>messages</code> 覆盖，优先级为「组件属性 &gt; 最近 Provider 的 messages &gt; zhCN」。<code>locale</code>{' '}
          决定数字格式，<code>lang</code> 写到主题根节点。<code>enUS</code> 是参考译文，措辞在 1.0 前可能调整。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="locale-zh" index="01" title={copy.zh.region} span="half" note="不设置 messages：与 M9 之前逐字相同。">
          <LocaleColumn lang="zh" />
        </Specimen>
        <Specimen
          id="locale-en"
          index="02"
          title={copy.en.region}
          span="half"
          note='嵌套 RhineProvider messages={enUS} locale="en-US" lang="en" toasts：通知由本区域自己的队列显示，关闭按钮用英文名称。'
        >
          <RhineProvider
            className="sc-locale-scope"
            theme={scope.theme}
            density={scope.density}
            motion={scope.motion}
            messages={enUS}
            locale="en-US"
            lang="en"
            toasts
          >
            <LocaleColumn lang="en" />
          </RhineProvider>
        </Specimen>
        <Specimen id="locale-usage" index="03" title="Usage" note="组件已有的文案属性（labels、closeLabel、emptyText…）仍然优先。">
          <CodeBlock code={usage} />
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
