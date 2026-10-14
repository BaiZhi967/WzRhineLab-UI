import * as React from 'react';
import '@wzrhine/patterns/styles.css';
import { Button, Pagination, Text, useToast } from '@wzrhine/react';
import {
  AppliedFilters,
  InspectorPanel,
  ListDetail,
  QueryToolbar,
  ResourceGrid,
  SelectionToolbar,
  ViewSwitcher,
} from '@wzrhine/patterns';
import { runQuery, thumbnailSrc, useResources } from './resources';
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
  }, [items, query, category, faults, toast]);

  const ready = state.phase === 'ready' ? state : null;
  const pageCount = Math.max(1, Math.ceil((ready?.items.length ?? 0) / PAGE_SIZE));
  const pageItems = React.useMemo(
    () => (ready ? ready.items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : []),
    [ready, page],
  );
  const inspected = ready?.items.find((resource) => resource.id === inspectorId) ?? null;

  const filters = category === '全部' ? [] : [{ id: 'category', label: `类别：${category}` }];

  return (
    <div className="desk resources">
      <div className="resources__toolbar">
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
        {filters.length > 0 && <AppliedFilters filters={filters} onRemove={() => setCategory('全部')} />}
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
              status={state.phase === 'loading' ? 'loading' : state.phase === 'error' ? 'error' : 'ready'}
              loadingRows={8}
              onRetry={() => setQuery((prev) => `${prev}`)}
              emptyText={query || filters.length > 0 ? '没有符合条件的资源。' : '暂无资源。'}
            />
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
