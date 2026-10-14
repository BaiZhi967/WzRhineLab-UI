import * as React from 'react';
import {
  ArchiveCard,
  Button,
  DataTable,
  Drawer,
  Field,
  IconButton,
  Input,
  Menu,
  MenuItem,
  MetadataList,
  RecordHeader,
  Select,
  StatusIndicator,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
  useToast,
} from '@wzrhine/react';
import type { DataTableColumn, SortState } from '@wzrhine/react';
import { useMediaQuery } from '../app/settings';
import { Download, Grid, List, Search } from '../icons';
import { categoryLabel, records, statusLabel, statusTone } from './data';
import type { ArchiveRecord, RecordCategory, RecordStatus } from './data';

/**
 * Scenario 1 · 档案检索. A searchable, filterable archive list with list/table views and a
 * detail pane. Every count and label is derived from the fixture records. Where the layout
 * collapses to one column (< 1024px, matching style.css) the detail opens in a Drawer instead of
 * being stacked under the list (ADR-0006 consequences); closing it returns focus to the card.
 */

type View = 'list' | 'table';

function matches(record: ArchiveRecord, query: string) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return [record.id, record.title, record.discipline, ...record.tags].some((v) => v.toLowerCase().includes(q));
}

function sortRecords(rows: readonly ArchiveRecord[], sort: SortState | null) {
  if (!sort) return rows;
  const key = sort.column as keyof ArchiveRecord;
  const sorted = [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key]), 'zh-CN'));
  return sort.direction === 'descending' ? sorted.reverse() : sorted;
}

export function ArchiveSearch() {
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<RecordCategory | 'all'>('all');
  const [status, setStatus] = React.useState<RecordStatus | 'all'>('all');
  const [view, setView] = React.useState<View>('list');
  const [sort, setSort] = React.useState<SortState | null>({ column: 'updated', direction: 'descending' });
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string>(records[0]!.id);
  // One-column layout (same breakpoint as style.css): the detail opens in a Drawer.
  const narrow = useMediaQuery('(max-width: 1023px)');
  const [detailOpen, setDetailOpen] = React.useState(false);
  // Openers by view + id, so focus returns to the card / 查看 button that opened the drawer.
  const openers = React.useRef(new Map<string, HTMLElement>());
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const opener = (key: string) => (el: HTMLElement | null) => {
    if (el) openers.current.set(key, el);
    else openers.current.delete(key);
  };
  const openRecord = (id: string, key: string) => {
    setActiveId(id);
    if (!narrow) return;
    returnFocus.current = openers.current.get(key) ?? null;
    setDetailOpen(true);
  };
  React.useEffect(() => {
    if (!narrow) setDetailOpen(false);
  }, [narrow]);

  const filtered = React.useMemo(
    () =>
      sortRecords(
        records.filter(
          (r) => matches(r, query) && (category === 'all' || r.category === category) && (status === 'all' || r.status === status),
        ),
        sort,
      ),
    [query, category, status, sort],
  );
  const active = records.find((r) => r.id === activeId);

  const detail = active && (
    <>
      <RecordHeader
        headingLevel={2}
        trail={[{ label: '档案' }, { label: categoryLabel[active.category] }, { label: active.id }]}
        recordId={active.id}
        status={{ tone: statusTone[active.status], label: statusLabel[active.status] }}
        title={active.title}
        classification={[categoryLabel[active.category], active.discipline]}
        summary={active.summary}
        actions={
          <>
            <Tooltip content="导出该记录">
              <IconButton
                icon={<Download />}
                label="导出该记录"
                variant="secondary"
                onClick={() => toast.show({ title: `已导出 ${active.id}`, status: 'success' })}
              />
            </Tooltip>
            <Menu trigger={<Button variant="secondary">更多操作</Button>} align="end">
              <MenuItem onSelect={() => navigator.clipboard?.writeText(active.id).catch(() => undefined)}>复制编号</MenuItem>
              <MenuItem
                tone="danger"
                disabled={active.status === 'archived'}
                onSelect={() => toast.show({ title: `已提交 ${active.id} 的归档申请`, description: '演示：状态未真正改变。', status: 'info' })}
              >
                申请归档
              </MenuItem>
            </Menu>
          </>
        }
      />
      <MetadataList
        aria-label="记录元数据"
        columns={2}
        items={[
          { label: '编号', value: active.id, mono: true },
          { label: '负责人', value: active.owner },
          { label: '创建', value: active.created, dateTime: active.created, mono: true },
          { label: '更新', value: active.updated, dateTime: active.updated, mono: true },
          { label: '存放位置', value: active.location },
          { label: '标签', value: active.tags.join('、'), wide: true },
        ]}
      />
      <p className="sc-small">样例档案记录，用于组件验收，不代表真实数据。</p>
    </>
  );

  const columns: DataTableColumn<ArchiveRecord>[] = [
    { key: 'id', header: '编号', sortable: true, mono: true, rowHeader: true },
    { key: 'title', header: '标题', sortable: true },
    { key: 'category', header: '类别', cell: (r) => categoryLabel[r.category] },
    { key: 'status', header: '状态', cell: (r) => <StatusIndicator tone={statusTone[r.status]} label={statusLabel[r.status]} /> },
    { key: 'updated', header: '更新', sortable: true, mono: true, align: 'end' },
    {
      key: 'actions',
      header: '操作',
      hideHeader: true,
      align: 'end',
      cell: (r) => (
        <Button ref={opener(`table:${r.id}`)} size="sm" variant="ghost" onClick={() => openRecord(r.id, `table:${r.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="sc-scenario sc-scenario--search">
      <section className="sc-scenario__pane" aria-labelledby="search-title">
        <div className="sc-scenario__pane-head">
          <h2 id="search-title" className="sc-specimen__title">
            档案检索
          </h2>
          <span className="sc-mono-sm sc-muted" aria-live="polite">
            {filtered.length} / {records.length} 条
          </span>
        </div>
        <form className="sc-search-filters" role="search" aria-label="档案筛选" onSubmit={(e) => e.preventDefault()}>
          <Input
            type="search"
            aria-label="搜索编号、标题、学科或标签"
            prefix={<Search />}
            placeholder="搜索编号、标题、学科或标签"
            value={query}
            onValueChange={setQuery}
          />
          <Field label="类别">
            <Select
              size="sm"
              value={category}
              onValueChange={(v) => setCategory((v ?? 'all') as RecordCategory | 'all')}
              options={[{ value: 'all', label: '全部类别' }, ...Object.entries(categoryLabel).map(([value, label]) => ({ value, label }))]}
            />
          </Field>
          <Field label="状态">
            <Select
              size="sm"
              value={status}
              onValueChange={(v) => setStatus((v ?? 'all') as RecordStatus | 'all')}
              options={[{ value: 'all', label: '全部状态' }, ...Object.entries(statusLabel).map(([value, label]) => ({ value, label }))]}
            />
          </Field>
        </form>

        <div className="sc-scenario__toolbar">
          <Tabs value={view} onValueChange={(v) => setView(v as View)} variant="segmented" size="sm">
            <TabList aria-label="视图">
              <Tab value="list">
                <List /> 列表
              </Tab>
              <Tab value="table">
                <Grid /> 表格
              </Tab>
            </TabList>
            <TabPanel value="list" className="sc-scenario__results">
              {filtered.length === 0 ? (
                <p className="sc-small">没有符合条件的记录。</p>
              ) : (
                <ul className="sc-card-list" aria-label="检索结果">
                  {filtered.map((r) => (
                    <li key={r.id}>
                      <ArchiveCard
                        ref={opener(`list:${r.id}`)}
                        id={r.id}
                        title={r.title}
                        category={categoryLabel[r.category]}
                        subcategory={r.discipline}
                        status={{ tone: statusTone[r.status], label: statusLabel[r.status] }}
                        updatedAt={r.updated}
                        selected={r.id === activeId}
                        onOpen={() => openRecord(r.id, `list:${r.id}`)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>
            <TabPanel value="table" className="sc-scenario__results">
              <DataTable
                caption="检索结果"
                hideCaption
                density="compact"
                columns={columns}
                rows={filtered}
                getRowId={(r) => r.id}
                getRowLabel={(r) => r.title}
                sort={sort}
                onSortChange={setSort}
                selectedIds={selected}
                onSelectionChange={setSelected}
              />
            </TabPanel>
          </Tabs>
          {view === 'table' && (
            <Button
              size="sm"
              variant="secondary"
              iconStart={<Download />}
              disabled={selected.size === 0}
              onClick={() => toast.show({ title: `已导出 ${selected.size} 条记录`, description: '演示：未写入任何文件。', status: 'success' })}
            >
              导出所选（{selected.size}）
            </Button>
          )}
        </div>
      </section>

      {narrow ? (
        <Drawer
          open={detailOpen && active != null}
          onOpenChange={setDetailOpen}
          title={active?.title ?? ''}
          description="记录详情（样例数据）"
          className="sc-detail-drawer"
          finalFocus={returnFocus}
        >
          {detail}
        </Drawer>
      ) : (
        <section className="sc-scenario__pane sc-scenario__detail" aria-label="记录详情">
          {detail || <p className="sc-small">请选择一条记录。</p>}
        </section>
      )}
    </div>
  );
}
