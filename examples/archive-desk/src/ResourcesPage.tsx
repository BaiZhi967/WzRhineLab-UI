import * as React from 'react';
import '@wzrhine/patterns/styles.css';
import { Button, DataTable, Pagination, Text, useToast } from '@wzrhine/react';
import type { DataTableColumn } from '@wzrhine/react';
import {
  AppliedFilters,
  InspectorPanel,
  ListDetail,
  QueryToolbar,
  ResourceGrid,
  SelectionToolbar,
  ViewSwitcher,
} from '@wzrhine/patterns';
import { runQuery, thumbnailSrc } from './resources';
import { useResources } from './DeskStore';
import type { DeskResource, Faults } from './resources';

/**
 * Resources page (P030-08): the second data shape over the same public patterns. Query, view,
 * selection and the inspector id all live here; the grid loads through the fault-injected
 * adapter with a request-token guard so stale responses never overwrite newer results.
 */

const PAGE_SIZE = 24;
const CATEGORIES = ['图像', '剖面', '底图', '记录'] as const;

type GridState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; items: DeskResource[]; stale: boolean };

/** List-view columns. The title cell carries the open entry, so selecting and opening stay
 *  separate interactions in both views (contracts §6.7). */
function buildResourceColumns(onOpen: (id: string) => void): Array<DataTableColumn<DeskResource>> {
  return [
    { key: 'id', header: '编号', rowHeader: true, mono: true, width: 'var(--rl-space-24)' },
    {
      key: 'title',
      header: '名称',
      cell: (resource) => (
        <Button variant="ghost" size="sm" className="resources__open" onClick={() => onOpen(resource.id)}>
          {resource.title}
        </Button>
      ),
    },
    { key: 'category', header: '类别' },
    { key: 'station', header: '站点' },
    { key: 'megapixels', header: '规格', align: 'end' },
  ];
}

export function ResourcesPage({ faults }: { faults: Faults }) {
  const toast = useToast();
  const { items } = useResources();
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState('');
  const [category, setCategory] = React.useState<'全部' | (typeof CATEGORIES)[number]>('全部');
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [inspectorId, setInspectorId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [state, setState] = React.useState<GridState>({ phase: 'loading' });
  const requestRef = React.useRef(0);
  // An explicit revision is what makes "retry" re-issue the same query (audit F02). Writing the
  // query back to its own value is not a refresh signal: React skips an update to an identical
  // value, so the read effect never re-ran.
  const [retryTick, setRetryTick] = React.useState(0);
  const refetch = React.useCallback(() => setRetryTick((tick) => tick + 1), []);

  // Adapter: filter → page through the fault-injected pipeline; only the latest token may land.
  React.useEffect(() => {
    const token = ++requestRef.current;
    setState({ phase: 'loading' });
    const handle = runQuery(
      faults,
      () =>
        items.filter((resource) => {
          const keyword = query.trim().toLowerCase();
          const hitQuery = !keyword || resource.id.toLowerCase().includes(keyword) || resource.title.includes(query.trim());
          const hitCategory = category === '全部' || resource.category === category;
          return hitQuery && hitCategory;
        }),
      (data, meta) => {
        if (requestRef.current !== token) {
          toast.show({ title: '已忽略一条过期响应', status: 'info' });
          return;
        }
        setState({ phase: 'ready', items: data, stale: meta.stale });
        setPage(1);
      },
      (message) => {
        if (requestRef.current !== token) return;
        setState({ phase: 'error', message });
      },
    );
    return () => handle.cancel();
  }, [items, query, category, faults, toast, retryTick]);

  const ready = state.phase === 'ready' ? state : null;
  const pageCount = Math.max(1, Math.ceil((ready?.items.length ?? 0) / PAGE_SIZE));
  const pageItems = React.useMemo(
    () => (ready ? ready.items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : []),
    [ready, page],
  );
  const inspected = ready?.items.find((resource) => resource.id === inspectorId) ?? null;

  const filters = category === '全部' ? [] : [{ id: 'category', label: `类别：${category}` }];
  const gridStatus = state.phase === 'loading' ? 'loading' : state.phase === 'error' ? 'error' : 'ready';
  const resourceColumns = React.useMemo(() => buildResourceColumns(setInspectorId), []);

  // The applied-conditions region unmounts with its last chip, so focus goes back to the search
  // box — the stable entry of the toolbar.
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  const returnFocusToSearch = () => {
    window.requestAnimationFrame(() => {
      toolbarRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    });
  };

  return (
    <div className="desk resources">
      <div className="resources__toolbar" ref={toolbarRef}>
        <QueryToolbar
          query={query}
          pendingQuery={pending}
          onPendingQueryChange={setPending}
          onQueryChange={setQuery}
          onReset={() => {
            setPending('');
            setQuery('');
            setCategory('全部');
            setSelected(new Set());
          }}
          resultSummary={<span>共 {ready?.items.length ?? 0} 条资源 · 示例数据</span>}
        >
          <Button variant="secondary" size="sm" onClick={() => setCategory((prev) => CATEGORIES[(CATEGORIES.indexOf(prev as (typeof CATEGORIES)[number]) + 1) % CATEGORIES.length]!)}>
            类别：{category}
          </Button>
        </QueryToolbar>
        {/* Removing the last condition unmounts the region, so the caller has to land focus — the
            component has nothing focusable left to hand it to (contracts §4.2, audit §5.2). */}
        {filters.length > 0 && (
          <AppliedFilters
            filters={filters}
            onRemove={() => {
              setCategory('全部');
              returnFocusToSearch();
            }}
            onClearAll={() => {
              setCategory('全部');
              returnFocusToSearch();
            }}
          />
        )}
        <div className="resources__row">
          <ViewSwitcher
            label="视图"
            value={view}
            onValueChange={setView}
            options={[
              { value: 'grid', label: '网格' },
              { value: 'list', label: '列表' },
            ]}
          />
          {selected.size > 0 && (
            <SelectionToolbar
              selectedCount={selected.size}
              scope="page"
              totalLabel={`当前页 ${pageItems.length} 条 / 已加载 ${ready?.items.length ?? 0} 条`}
              onClear={() => setSelected(new Set())}
              actions={[{ id: 'tag', label: '标记已核验', onRun: () => toast.show({ title: `已标记 ${selected.size} 条（演示）` }) }]}
            />
          )}
          {ready?.stale && <Text tone="muted">当前结果来自过期响应（注入演示）。</Text>}
        </div>
      </div>

      <ListDetail
        mode="auto"
        modeThreshold={900}
        detailId={inspectorId}
        onDetailChange={(id) => setInspectorId(id)}
        listLabel="资源集合"
        detailLabel="资源属性"
        list={
          <div className="resources__list">
            {/* `view` drives the actual collection, not just the control (audit F01). Both
                branches share the record ids, the query result and the selection set, so the
                same resource stays identifiable, selectable and openable across a switch. */}
            {view === 'grid' ? (
              <ResourceGrid
                label="资源集合"
                items={pageItems}
                getItemId={(resource) => resource.id}
                getItemTitle={(resource) => resource.title}
                getItemLabel={(resource) => `选择 ${resource.title}`}
                getItemSpec={(resource) => ({
                  badge: resource.broken ? <span>图片缺失示例</span> : undefined,
                  description: `${resource.station} · ${resource.megapixels}`,
                  thumbnail: { src: thumbnailSrc(resource), alt: resource.title, width: 320, height: 240 },
                })}
                selectedIds={selected}
                onSelectionChange={setSelected}
                onOpen={setInspectorId}
                status={gridStatus}
                loadingRows={8}
                onRetry={refetch}
                emptyText={query || filters.length > 0 ? '没有符合条件的资源。' : '暂无资源。'}
              />
            ) : (
              <DataTable
                caption="资源集合"
                hideCaption
                columns={resourceColumns}
                rows={pageItems}
                getRowId={(resource) => resource.id}
                getRowLabel={(resource) => `选择 ${resource.title}`}
                selectedIds={selected}
                onSelectionChange={setSelected}
                status={gridStatus}
                loadingRows={8}
                onRetry={refetch}
                emptyText={query || filters.length > 0 ? '没有符合条件的资源。' : '暂无资源。'}
              />
            )}
            {state.phase === 'error' && <p className="resources__error-note">{state.message}</p>}
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalItems={ready?.items.length ?? 0} pageSize={PAGE_SIZE} showStatus />
          </div>
        }
        detail={
          inspected ? (
            <div className="resources__inspector">
              <InspectorPanel
                title={inspected.title}
                eyebrow={`RESOURCES / ${inspected.category}`}
                meta={[
                  { label: '编号', value: inspected.id, mono: true },
                  { label: '采集日期', value: inspected.collected, mono: true },
                  { label: '站点', value: inspected.station, mono: true },
                  { label: '规格', value: inspected.megapixels },
                ]}
                actions={
                  <>
                    <Button size="sm" variant="secondary">下载原件（演示）</Button>
                    <Button size="sm" variant="ghost">复制链接</Button>
                  </>
                }
              >
                <p className="resources__preview-note">预览槽位：真实宿主在此接入授权后的资源地址。</p>
                <img className="resources__preview" src={thumbnailSrc(inspected)} alt={`${inspected.title} 预览`} width={320} height={240} />
              </InspectorPanel>
            </div>
          ) : null
        }
      />
    </div>
  );
}
