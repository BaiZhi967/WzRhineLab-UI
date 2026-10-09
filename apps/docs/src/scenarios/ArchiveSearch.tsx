import * as React from 'react';
import {
  ArchiveCard,
  Button,
  DataTable,
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
import { Download, Grid, Search } from '../icons';
import { categoryLabel, records, statusLabel, statusTone } from './data';
import type { ArchiveRecord, RecordCategory, RecordStatus } from './data';

/**
 * Scenario 1 · 档案检索. A searchable, filterable archive list with list/table views and a
 * detail pane. Every count and label is derived from the fixture records.
 */

type View = 'list' | 'table';

function matches(record: ArchiveRecord, query: string) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return [record.id, record.title, record.discipline, ...record.tags].some((v) => v.toLowerCase().includes(q));
}

function List(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden="true" focusable="false" {...p}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
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
        <Button size="sm" variant="ghost" onClick={() => setActiveId(r.id)}>
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
                        id={r.id}
                        title={r.title}
                        category={categoryLabel[r.category]}
                        subcategory={r.discipline}
                        status={{ tone: statusTone[r.status], label: statusLabel[r.status] }}
                        updatedAt={r.updated}
                        selected={r.id === activeId}
                        onOpen={() => setActiveId(r.id)}
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

      <section className="sc-scenario__pane sc-scenario__detail" aria-label="记录详情">
        {active ? (
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
        ) : (
          <p className="sc-small">请选择一条记录。</p>
        )}
      </section>
    </div>
  );
}
