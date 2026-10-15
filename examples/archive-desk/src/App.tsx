import * as React from 'react';
import {
  Button,
  DataTable,
  paginate,
  AlertDialog,
  Dialog,
  DialogClose,
  Field,
  IconButton,
  Input,
  Menu,
  MenuItem,
  MenuSeparator,
  MetadataList,
  MotionPresence,
  RecordHeader,
  RhineProvider,
  Select,
  StatusIndicator,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  Timeline,
  useToast,
} from '@wzrhine/react';
import type { DataTableColumn, RhineTheme, SortState } from '@wzrhine/react';
import { statusLabel, statusTone } from './store';
import { DeskStoreProvider, useRecords, useResetAll } from './DeskStore';
import type { DeskRecord, NewRecord, RecordStatus } from './store';
import { ResourcesPage } from './ResourcesPage';
import { SettingsPage } from './SettingsPage';
import { defaultFaults } from './resources';
import type { Faults } from './resources';

/**
 * Archive desk: a complete small app assembled only from the public `@wzrhine/react` API —
 * create, search, sort, advance and delete records, with persistence and a theme switch.
 * No showcase helpers are imported; anything the app needs beyond the library lives here.
 */

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function sortRows(rows: readonly DeskRecord[], sort: SortState | null): DeskRecord[] {
  const copy = [...rows];
  if (!sort) return copy;
  const key = sort.column as keyof DeskRecord;
  copy.sort((a, b) => String(a[key]).localeCompare(String(b[key]), 'zh-CN'));
  return sort.direction === 'descending' ? copy.reverse() : copy;
}

const emptyDraft: NewRecord = { title: '', discipline: '', owner: '', summary: '' };

function CreateDialog({ onCreate }: { onCreate: (input: NewRecord) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(emptyDraft);
  const [submitted, setSubmitted] = React.useState(false);
  const titleError = submitted && !draft.title.trim() ? '请填写标题。' : undefined;
  const disciplineError = submitted && !draft.discipline.trim() ? '请填写学科。' : undefined;
  const set = (key: keyof NewRecord) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));
  // Without this the dialog's own close button is the first tabbable element, so a keyboard user
  // opening the form lands on 「关闭」 instead of the first field (the showcase form dialog does
  // the same — see DialogPage's initialFocus).
  const titleRef = React.useRef<HTMLInputElement | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!draft.title.trim() || !draft.discipline.trim()) return;
    onCreate({ ...draft, title: draft.title.trim(), discipline: draft.discipline.trim(), owner: draft.owner.trim() || '未指定' });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(emptyDraft);
          setSubmitted(false);
        }
      }}
      trigger={<Button variant="accent">新建记录</Button>}
      eyebrow="ARCHIVE / NEW"
      title="新建档案记录"
      description="编号由系统按顺序分配，新记录以草稿状态保存。"
      initialFocus={titleRef}
    >
      <form id="create-form" className="desk-form" onSubmit={submit} noValidate>
        <Field label="标题" required error={titleError} invalid={!!titleError}>
          <Input ref={titleRef} value={draft.title} onValueChange={set('title')} maxLength={40} required />
        </Field>
        <Field label="学科" required error={disciplineError} invalid={!!disciplineError}>
          <Input value={draft.discipline} onValueChange={set('discipline')} maxLength={20} required />
        </Field>
        <Field label="负责人" optional>
          <Input value={draft.owner} onValueChange={set('owner')} maxLength={20} />
        </Field>
        <Field label="摘要" optional>
          <Input value={draft.summary} onValueChange={set('summary')} maxLength={80} />
        </Field>
        <div className="desk-form__actions">
          <DialogClose>
            <Button variant="ghost">取消</Button>
          </DialogClose>
          <Button type="submit">保存草稿</Button>
        </div>
      </form>
    </Dialog>
  );
}

const PAGE_SIZE = 8;

function Desk({ theme, onThemeChange }: { theme: RhineTheme; onThemeChange: (t: RhineTheme) => void }) {
  const toast = useToast();
  const { records, create, advance, remove, reset } = useRecords();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<RecordStatus | 'all'>('all');
  const [sort, setSort] = React.useState<SortState | null>({ column: 'id', direction: 'ascending' });
  const [activeId, setActiveId] = React.useState<string | null>(records[0]?.id ?? null);
  const [pendingDelete, setPendingDelete] = React.useState<DeskRecord | null>(null);
  const [page, setPage] = React.useState(1);

  const q = query.trim().toLowerCase();
  const rows = sortRows(
    records.filter(
      (r) => (status === 'all' || r.status === status) && (!q || [r.id, r.title, r.discipline, r.owner].some((v) => v.toLowerCase().includes(q))),
    ),
    sort,
  );
  const active = records.find((r) => r.id === activeId) ?? null;
  const pageRows = paginate(rows, page, PAGE_SIZE);
  // Filters and sorting change the result set: start again from page 1.
  const changeQuery = (v: string) => {
    setQuery(v);
    setPage(1);
  };
  const changeStatus = (v: RecordStatus | 'all') => {
    setStatus(v);
    setPage(1);
  };
  const changeSort = (s: SortState) => {
    setSort(s);
    setPage(1);
  };

  const columns: DataTableColumn<DeskRecord>[] = [
    { key: 'id', header: '编号', sortable: true, mono: true, rowHeader: true },
    { key: 'title', header: '标题', sortable: true },
    { key: 'discipline', header: '学科' },
    { key: 'status', header: '状态', cell: (r) => <StatusIndicator tone={statusTone[r.status]} label={statusLabel[r.status]} /> },
    { key: 'updated', header: '更新', sortable: true, mono: true, align: 'end' },
    {
      key: 'actions',
      header: '操作',
      hideHeader: true,
      align: 'end',
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => setActiveId(r.id)} aria-label={`查看 ${r.id}`}>
          查看
        </Button>
      ),
    },
  ];

  const onCreate = (input: NewRecord) => {
    const id = create(input);
    setActiveId(id);
    toast.show({ title: `已创建 ${id}`, description: '草稿已保存在本机浏览器中。', status: 'success' });
  };

  return (
    <div className="desk">
      <header className="desk__bar">
        <div>
          <Text variant="eyebrow">WzRhineLab UI · 示例应用</Text>
          <Text as="h1" variant="heading-1">
            档案台
          </Text>
        </div>
        <div className="desk__bar-actions">
          <Field label="主题" layout="inline" className="desk__theme">
            <Select
              size="sm"
              value={theme}
              onValueChange={(v) => onThemeChange((v ?? 'light') as RhineTheme)}
              options={[
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
                { value: 'system', label: '跟随系统' },
              ]}
            />
          </Field>
          <CreateDialog onCreate={onCreate} />
        </div>
      </header>

      <main className="desk__main">
        <section className="desk__list" aria-labelledby="list-title">
          <div className="desk__list-head">
            <Text as="h2" variant="heading-3" id="list-title">
              记录
            </Text>
            <Text variant="mono" tone="muted" aria-live="polite">
              {rows.length} / {records.length} 条
            </Text>
          </div>
          <form className="desk__filters" role="search" aria-label="筛选记录" onSubmit={(e) => e.preventDefault()}>
            <Input type="search" aria-label="搜索编号、标题、学科或负责人" placeholder="搜索编号、标题、学科或负责人" value={query} onValueChange={changeQuery} />
            <Select
              size="md"
              aria-label="状态"
              value={status}
              onValueChange={(v) => changeStatus((v ?? 'all') as RecordStatus | 'all')}
              options={[{ value: 'all', label: '全部状态' }, ...Object.entries(statusLabel).map(([value, label]) => ({ value, label }))]}
            />
          </form>
          <DataTable
            caption="档案记录"
            hideCaption
            columns={columns}
            rows={pageRows}
            getRowId={(r) => r.id}
            sort={sort}
            onSortChange={changeSort}
            pagination={rows.length > PAGE_SIZE ? { page, onPageChange: setPage, pageSize: PAGE_SIZE, totalItems: rows.length } : undefined}
            emptyText={records.length === 0 ? '还没有记录，点击「新建记录」开始。' : '没有符合条件的记录。'}
          />
        </section>

        <section className="desk__detail" aria-label="记录详情">
          {/* Purely visual feedback: replacing the marker never retains the old record's
              actions, waits for an exit, shares a layoutId, or moves the keyboard focus. */}
          <div className="rl-desk-detail-marker-slot" aria-hidden="true">
            <MotionPresence key={active?.id ?? 'empty'} show={active !== null} initial preset="fade" className="rl-desk-detail-marker">
              <span />
            </MotionPresence>
          </div>
          {active ? (
            <>
              <RecordHeader
                headingLevel={2}
                trail={[{ label: '档案台' }, { label: statusLabel[active.status] }, { label: active.id }]}
                trailLabel="记录位置"
                recordId={active.id}
                status={{ tone: statusTone[active.status], label: statusLabel[active.status] }}
                title={active.title}
                classification={[active.discipline, active.sample ? '示例数据' : '本机记录']}
                summary={active.summary || undefined}
                meta={[
                  { label: '负责人', value: active.owner },
                  { label: '创建', value: active.created, mono: true, dateTime: active.created },
                  { label: '更新', value: active.updated, mono: true, dateTime: active.updated },
                ]}
                actions={
                  <>
                    <Button size="sm" disabled={active.status === 'archived'} onClick={() => advance(active.id)}>
                      {active.status === 'draft' ? '提交审核' : active.status === 'review' ? '归档' : '已归档'}
                    </Button>
                    <Menu trigger={<IconButton label={`${active.id} 的更多操作`} icon={<MoreIcon />} size="sm" variant="secondary" />} align="end">
                      <MenuItem
                        onSelect={() => {
                          void navigator.clipboard?.writeText(active.id).catch(() => undefined);
                          toast.show({ title: `已复制 ${active.id}` });
                        }}
                      >
                        复制编号
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem tone="danger" onSelect={() => setPendingDelete(active)}>
                        删除记录
                      </MenuItem>
                    </Menu>
                  </>
                }
              />
              <Text as="h3" variant="heading-3">
                处理记录
              </Text>
              <Timeline
                aria-label="处理记录"
                reversed
                events={[...active.history].reverse().map((h, i) => ({ id: `${active.id}-${i}`, title: h.text, dateTime: h.at }))}
              />
            </>
          ) : (
            <Text tone="muted">未选择记录。</Text>
          )}
          <MetadataList
            size="sm"
            aria-label="统计"
            items={(Object.keys(statusLabel) as RecordStatus[]).map((s) => ({
              key: s,
              label: statusLabel[s],
              value: `${records.filter((r) => r.status === s).length} 条`,
              mono: true,
            }))}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              reset();
              setActiveId('ARC-0001');
              toast.show({ title: '已恢复示例数据' });
            }}
          >
            恢复示例数据
          </Button>
        </section>
      </main>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`删除 ${pendingDelete?.id ?? ''}？`}
        description="删除后无法恢复。"
        confirmLabel="删除"
        onConfirm={() => {
          if (!pendingDelete) return;
          remove(pendingDelete.id);
          setActiveId(records.find((r) => r.id !== pendingDelete.id)?.id ?? null);
          toast.show({ title: `已删除 ${pendingDelete.id}`, status: 'warning' });
        }}
      />
    </div>
  );
}

const THEME_KEY = 'wzrhine-example:archive-desk:theme';

export function App() {
  // The provider owns the data; `DeskPages` consumes it, so the hooks below run inside it.
  return (
    <DeskStoreProvider>
      <DeskPages />
    </DeskStoreProvider>
  );
}

function DeskPages() {
  const [page, setPage] = React.useState<'archives' | 'resources' | 'settings'>('archives');
  const [theme, setTheme] = React.useState<RhineTheme>(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'dark' || saved === 'system' ? saved : 'light';
  });
  React.useEffect(() => window.localStorage.setItem(THEME_KEY, theme), [theme]);

  const [faults, setFaults] = React.useState<Faults>(defaultFaults);
  const resetAll = useResetAll();

  return (
    <RhineProvider theme={theme} className="desk-root">
      <Tabs value={page} onValueChange={(next) => setPage(next as 'archives' | 'resources' | 'settings')}>
        <TabList aria-label="页面" className="desk-tabs">
          <Tab value="archives">档案</Tab>
          <Tab value="resources">资源</Tab>
          <Tab value="settings">设置</Tab>
        </TabList>
        <TabPanel value="archives">
          <Desk theme={theme} onThemeChange={setTheme} />
        </TabPanel>
        <TabPanel value="resources">
          <ResourcesPage faults={faults} />
        </TabPanel>
        <TabPanel value="settings">
          <SettingsPage faults={faults} onFaultsChange={setFaults} onResetAll={resetAll} />
        </TabPanel>
      </Tabs>
    </RhineProvider>
  );
}
