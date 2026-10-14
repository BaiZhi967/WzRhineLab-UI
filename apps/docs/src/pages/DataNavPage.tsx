import * as React from 'react';
import {
  Breadcrumb,
  Button,
  DataTable,
  Meter,
  Pagination,
  Progress,
  Stat,
  StatusIndicator,
  paginate,
} from '@wzrhine/react';
import type { DataTableColumn, DataTableStatus, SortState } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented } from '../ui/controls';
import { bulkRecords } from '../scenarios/bulk';
import type { BulkRecord } from '../scenarios/bulk';
import { statusLabel, statusTone } from '../scenarios/data';

const pageSize = 25;

function compare(a: BulkRecord, b: BulkRecord, sort: SortState) {
  const key = sort.column as keyof BulkRecord;
  const order = String(a[key]).localeCompare(String(b[key]), 'zh-CN');
  return sort.direction === 'ascending' ? order : -order;
}

/** 1000 sample rows, client-side sort + pagination, simulated latency so loading states are real. */
function ThousandRows() {
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [status, setStatus] = React.useState<DataTableStatus>('ready');
  const [failNext, setFailNext] = React.useState(false);
  const [shown, setShown] = React.useState({ page: 1, sort: null as SortState | null });
  const timer = React.useRef<number | undefined>(undefined);

  const sorted = React.useMemo(
    () => (shown.sort ? [...bulkRecords].sort((a, b) => compare(a, b, shown.sort!)) : bulkRecords),
    [shown.sort],
  );
  const rows = paginate(sorted, shown.page, pageSize);

  // Every request waits 600 ms (demo latency); the last request wins, earlier ones are dropped.
  const request = (next: { page: number; sort: SortState | null }) => {
    window.clearTimeout(timer.current);
    setPage(next.page);
    setSort(next.sort);
    setStatus('loading');
    timer.current = window.setTimeout(() => {
      if (failNext) {
        setStatus('error');
        setFailNext(false);
        return;
      }
      setShown(next);
      setStatus('ready');
    }, 600);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const columns: DataTableColumn<BulkRecord>[] = [
    { key: 'id', header: '编号', sortable: true, mono: true, rowHeader: true },
    { key: 'title', header: '标题', sortable: true },
    { key: 'category', header: '类别' },
    { key: 'status', header: '状态', cell: (r) => <StatusIndicator tone={statusTone[r.status]} label={statusLabel[r.status]} /> },
    { key: 'updated', header: '更新', sortable: true, mono: true, align: 'end' },
  ];

  return (
    <div className="sc-stack sc-stack--wide">
      <div className="sc-inline-controls">
        <Button size="sm" variant="secondary" onClick={() => setFailNext(true)} disabled={failNext}>
          {failNext ? '下一次请求将失败' : '让下一次请求失败'}
        </Button>
        <p className="sc-small">示例数据：1000 条确定性生成的样本记录，每次翻页或排序模拟 600 ms 延迟。</p>
      </div>
      <DataTable
        caption="样本记录（1000 条示例）"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        sort={sort}
        onSortChange={(next) => request({ page: 1, sort: next })}
        selectedIds={selected}
        onSelectionChange={setSelected}
        getRowLabel={(r) => r.id}
        status={status}
        errorText="请求失败（演示）。"
        onRetry={() => request({ page, sort })}
        density="compact"
        pagination={{ page, onPageChange: (p) => request({ page: p, sort }), pageSize, totalItems: bulkRecords.length }}
      />
    </div>
  );
}

function TableStates() {
  const [state, setState] = React.useState<'loading' | 'empty' | 'error'>('loading');
  const columns: DataTableColumn<BulkRecord>[] = [
    { key: 'id', header: '编号', mono: true, rowHeader: true },
    { key: 'title', header: '标题' },
    { key: 'updated', header: '更新', mono: true, align: 'end' },
  ];
  return (
    <div className="sc-stack sc-stack--wide">
      <Segmented
        legend="状态"
        name="table-state"
        value={state}
        onChange={setState}
        options={[
          { value: 'loading', label: '首次加载' },
          { value: 'empty', label: '空结果' },
          { value: 'error', label: '错误' },
        ]}
      />
      <DataTable
        caption="状态示例"
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        loadingRows={3}
        status={state === 'empty' ? 'ready' : state}
        emptyText="没有符合筛选条件的记录。"
        emptyAction={
          <Button size="sm" variant="secondary">
            清除筛选
          </Button>
        }
        errorText="档案服务暂时不可用。"
        onRetry={() => setState('loading')}
      />
    </div>
  );
}

function PagerDemo() {
  const [page, setPage] = React.useState(7);
  return (
    <div className="sc-stack sc-stack--wide">
      <Pagination page={page} pageCount={40} onPageChange={setPage} />
      <Pagination page={page} totalItems={1000} pageSize={25} onPageChange={setPage} siblingCount={2} />
      <div className="sc-narrow-frame">
        <Pagination page={page} pageCount={40} onPageChange={setPage} aria-label="分页（窄容器）" />
      </div>
    </div>
  );
}

const longPath = [
  { label: '档案库', href: '#/components/data' },
  { label: '样本', href: '#/components/data' },
  { label: '海洋来源', href: '#/components/data' },
  { label: '2026 年第三批次沉积物采样', href: '#/components/data' },
  { label: 'ARC-1024 晶体结构观测流程（第二版修订稿）' },
];

export function DataNavPage() {
  return (
    <div className="sc-page">
      <PageHeader index="20" section="Data & Archive / Navigation" title="Data & navigation">
        <p>
          Pagination、Breadcrumb、Progress、Meter、Stat 与 DataTable 的加载、空、错误状态（ADR-0005）。表格不切片数据：调用方传入当前页的行，
          服务端分页与客户端分页（<code>paginate()</code>）用法相同。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="data-thousand"
          index="01"
          title="1000 rows"
          note="翻页后焦点留在分页控件，表格滚回顶部；选中跨页保留，全选只作用于当前页。再次加载保留旧行并变淡，首次加载才显示骨架。"
        >
          <ThousandRows />
        </Specimen>
        <Specimen id="data-breadcrumb" index="02" title="Breadcrumb" span="half" align="start" note="超过 4 级折叠中间项，点击后原地展开；长标签单行截断，完整文字保留给读屏。">
          <div className="sc-stack sc-stack--wide">
            <Breadcrumb items={longPath} label="路径（折叠）" />
            <Breadcrumb items={longPath} label="路径（完整）" maxItems={0} />
          </div>
        </Specimen>
        <Specimen id="data-pagination" index="03" title="Pagination" span="half" align="start" note="当前页 aria-current 且可聚焦；容器窄于 30rem 时切换为紧凑模式。">
          <PagerDemo />
        </Specimen>
        <Specimen id="data-states" index="04" title="Table states" span="half" align="start" note="加载 / 空 / 错误互斥；加载与错误时排序和分页禁用。">
          <TableStates />
        </Specimen>
        <Specimen id="data-progress" index="05" title="Progress & Meter" span="half" align="start" note="Progress 表示随时间推进的任务；Meter 表示范围内的静态测量。阈值状态以文字表达。">
          <ProgressDemo />
        </Specimen>
        <Specimen id="data-stat" index="06" title="Stat" note="变化的方向不预设好坏：tone 由调用方决定。无数据显示「—」，不显示 0。数值为示例。">
          <div className="sc-stat-row sc-stat-row--tight">
            <Stat label="示例 · 记录总数" value={bulkRecords.length} unit="条" />
            <Stat label="示例 · 待复核" value={128} unit="条" status="warning" delta={{ value: 12, label: '较上周', tone: 'warning' }} />
            <Stat label="示例 · 本周归档" value={46} unit="条" delta={{ value: -3, label: '较上周' }} />
            <Stat label="示例 · 今日新增" value={null} />
            <Stat label="示例 · 加载中" value={0} loading />
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}

function ProgressDemo() {
  const [value, setValue] = React.useState(40);
  return (
    <div className="sc-stack">
      <Progress label="导出档案（示例）" value={value} description={`已处理 ${value * 10} / 1000 条。`} />
      <div className="sc-inline-controls">
        <Button size="sm" variant="secondary" onClick={() => setValue((v) => Math.max(0, v - 20))}>
          −20%
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setValue((v) => Math.min(100, v + 20))}>
          +20%
        </Button>
      </div>
      <Progress label="重建索引（时长未知）" value={null} size="sm" />
      <Progress label="规程步骤" value={3} max={5} valueText="3 / 5 步" getValueText={(_, v) => `第 ${v} 步，共 5 步`} tone="accent" />
      <Meter
        label="示例 · 存储占用"
        value={86}
        low={60}
        high={80}
        optimum={20}
        stateLabels={{ suboptimum: '偏高', critical: '接近上限' }}
        description="超过 80% 时建议清理过期草稿。"
      />
      <Meter label="示例 · 样本柜温度" value={-18} min={-40} max={0} low={-30} high={-15} optimum={-22} valueText="−18 °C" getValueText={(_, v) => `${v} 摄氏度`} stateLabels={{ optimum: '正常' }} />
    </div>
  );
}
