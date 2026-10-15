import * as React from 'react';
import '@wzrhine/patterns/styles.css';
import { Button, Drawer, MetadataList, RecordHeader, StatusBadge } from '@wzrhine/react';
import type { MetadataItem } from '@wzrhine/react';
import {
  AppliedFilters,
  InspectorPanel,
  ListDetail,
  QueryToolbar,
  ResourceGrid,
  SectionIndex,
  SelectionToolbar,
  ViewSwitcher,
} from '@wzrhine/patterns';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

/** Static specimen records: deterministic content for screenshots and e2e (no live data). */
const records = [
  { id: 'ARC-1024', title: '近海沉积样本分析', status: 'archived' as const, category: '样本' },
  { id: 'ARC-1025', title: '潮间带微生物群落观测', status: 'review' as const, category: '观测' },
  { id: 'ARC-1026', title: '年度浮游生物普查底稿', status: 'draft' as const, category: '普查' },
  { id: 'ARC-1027', title: '深海热液区水样采集记录', status: 'archived' as const, category: '样本' },
];

const statusTone = { archived: 'success', review: 'info', draft: 'warning' } as const;

const inspectorMeta: MetadataItem[] = [
  { key: 'path', label: '路径', value: 'archive/2026/samples/ARC-1024.html', mono: true, wide: true },
  { key: 'owner', label: '负责人', value: '白芷' },
  { key: 'updated', label: '更新', value: '2026-10-12' },
];

/**
 * Inline SVG placeholder: a resolvable src that stays offline, same approach as
 * examples/archive-desk. An empty string resolves to the page itself, renders the browser's
 * broken-image glyph and never fires `error` — neither the ready nor the degraded state.
 */
function thumbnailSrc(id: string, caption: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#dcdcd4"/><rect x="12" y="12" width="296" height="216" fill="none" stroke="#7b8579" stroke-dasharray="6 4"/><text x="160" y="126" font-family="monospace" font-size="18" fill="#505850" text-anchor="middle">${id}</text><text x="160" y="152" font-family="monospace" font-size="12" fill="#5d655b" text-anchor="middle">${caption}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const resourceItems = [
  { id: 'RES-1', title: '浅层水体照片', note: 'ST-07 平台，能见度良好', badge: '已归档', broken: false },
  { id: 'RES-2', title: '沉积物显微图像', note: '40× 物镜，偏光', badge: '审核中', broken: false },
  { id: 'RES-3', title: '航拍底图切片', note: '2026-09 潮间带普查', broken: false },
  // Last card exercises the per-item degradation path: an unloadable scheme fires `error`.
  { id: 'RES-4', title: '声呐剖面记录', note: '浅地层剖面仪（缩略图缺失）', broken: true },
];

/** Record rows shared by the ListDetail and Drawer specimens. */
function RecordRows({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <ul className="patterns-rows">
      {records.map((record) => (
        <li key={record.id}>
          <Button variant="ghost" className="patterns-row" onClick={() => onOpen(record.id)}>
            <span className="patterns-row__id">{record.id}</span>
            <span className="patterns-row__title">{record.title}</span>
            <StatusBadge status={statusTone[record.status]}>{record.category}</StatusBadge>
          </Button>
        </li>
      ))}
    </ul>
  );
}

function RecordBody({ record }: { record: (typeof records)[number] }) {
  return (
    <div className="patterns-detail-body">
      <RecordHeader
        recordId={record.id}
        title={record.title}
        status={{ tone: statusTone[record.status], label: record.category }}
        headingLevel={2}
        meta={[
          { label: '类别', value: record.category },
          { label: '入库', value: '2026-09-30' },
        ]}
      />
      <p>
        本记录为示例数据：用于展示主从布局在集合与详情之间的往返。窄容器下详情替换列表视图，
        关闭后焦点回到打开它的条目；列表滚动位置在往返之间保持。
      </p>
      <MetadataList
        layout="stacked"
        items={[
          { label: '采样站点', value: 'ST-07 近海平台' },
          { label: '保存条件', value: '4°C 避光' },
          { label: '关联条目', value: 'ARC-0998、ARC-1003', mono: true },
        ]}
      />
    </div>
  );
}

function ListDetailSpecimen() {
  const [detailId, setDetailId] = React.useState<string | null>('ARC-1024');
  const current = records.find((record) => record.id === detailId);
  return (
    <div className="patterns-stage">
      <ListDetail
        mode="auto"
        modeThreshold={640}
        detailId={detailId}
        onDetailChange={setDetailId}
        listLabel="样本档案"
        detailLabel="档案详情"
        list={<RecordRows onOpen={setDetailId} />}
        detail={current ? <RecordBody record={current} /> : null}
      />
    </div>
  );
}

function InspectorSpecimen() {
  const [open, setOpen] = React.useState(true);
  const reopenRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <div className="patterns-inspector-stage">
      <InspectorPanel
        title="样本 ARC-1024"
        eyebrow="INSPECTOR"
        meta={inspectorMeta}
        open={open}
        onClose={() => {
          setOpen(false);
          // The panel unmounts its own controls on close; the caller lands focus on the reopen entry.
          window.requestAnimationFrame(() => reopenRef.current?.focus());
        }}
        actions={
          <>
            <Button size="sm" variant="secondary">
              校验
            </Button>
            <Button size="sm" variant="ghost">
              导出
            </Button>
          </>
        }
      >
        <p>属性检查区域：元数据与操作由调用者组合，面板本身不执行业务动作。隐藏时整个区域不可聚焦。</p>
      </InspectorPanel>
      {!open && (
        <Button ref={reopenRef} variant="secondary" onClick={() => setOpen(true)}>
          重新打开检查面板
        </Button>
      )}
    </div>
  );
}

/**
 * Overlay form of the inspector (ADR-0014 §2 / contracts §6.2): the panel itself has no overlay
 * mode — a recipe composes the existing Drawer around it. Focus trapping, Escape, scroll lock and
 * focus return all come from Drawer; InspectorPanel only renders the region.
 */
function InspectorOverlaySpecimen() {
  return (
    <div className="patterns-overlay-stage">
      <Drawer
        trigger={<Button variant="secondary">打开检查面板（覆盖层）</Button>}
        title="样本 ARC-1024"
        eyebrow="ARCHIVE / INSPECTOR"
        side="end"
        size="sm"
      >
        <InspectorPanel
          title="样本 ARC-1024"
          eyebrow="INSPECTOR"
          meta={inspectorMeta}
          actions={
            <Button size="sm" variant="secondary">
              校验
            </Button>
          }
        >
          <p>窄视口或临时查看时，把同一个属性检查区域放进 Drawer；焦点合同由 Drawer 提供。</p>
        </InspectorPanel>
      </Drawer>
      <p className="patterns-hint">
        抽屉提供焦点捕获、Escape 关闭、滚动锁定与关闭后焦点回到触发按钮；面板本身不感知覆盖层。
      </p>
    </div>
  );
}

function QueryToolbarSpecimen() {
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [filters, setFilters] = React.useState([
    { id: 'category', label: '类别：样本' },
    { id: 'year', label: '年份：2026' },
  ]);
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <div className="patterns-stack" ref={toolbarRef}>
      <QueryToolbar
        query={query}
        onQueryChange={setQuery}
        onReset={() => {
          setQuery('');
          setFilters([]);
        }}
        resultSummary={<span>共 4 条结果</span>}
      >
        <Button variant="secondary" size="sm">
          类别
        </Button>
        <Button variant="secondary" size="sm">
          年份
        </Button>
      </QueryToolbar>
      <AppliedFilters
        filters={filters}
        onRemove={(id) => {
          setFilters((prev) => prev.filter((f) => f.id !== id));
          // Removing the final item unmounts the region: the caller owns the focus fallback.
          if (filters.length === 1) {
            window.requestAnimationFrame(() => {
              toolbarRef.current?.querySelector<HTMLInputElement>('.rl-query-toolbar__input input')?.focus();
            });
          }
        }}
        onClearAll={() => setFilters([])}
      />
      <ViewSwitcher
        label="视图"
        value={view}
        onValueChange={setView}
        options={[
          { value: 'list', label: '列表' },
          { value: 'grid', label: '网格' },
        ]}
      />
    </div>
  );
}

function ResourceGridSpecimen() {
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set(['RES-2']));
  return (
    <div className="patterns-stack">
      <SelectionToolbar
        selectedCount={selected.size}
        scope="loaded"
        totalLabel="已加载 100 条"
        onClear={() => setSelected(new Set())}
        actions={[{ id: 'export', label: '导出所选', onRun: () => {} }]}
      />
      <ResourceGrid
        label="资源集合"
        items={resourceItems}
        getItemId={(item) => item.id}
        getItemTitle={(item) => item.title}
        getItemSpec={(item) => ({
          badge: item.badge,
          description: item.note,
          thumbnail: {
            src: item.broken ? `missing-src://${item.id}` : thumbnailSrc(item.id, item.note),
            alt: item.title,
            width: 320,
            height: 240,
          },
        })}
        getItemLabel={(item) => `选择 ${item.title}`}
        selectedIds={selected}
        onSelectionChange={setSelected}
        onOpen={() => {}}
      />
    </div>
  );
}

/** SectionIndex needs real anchor targets: every section id matches a heading in the body. */
function SectionIndexSpecimen() {
  const scrollRoot = React.useRef<HTMLDivElement | null>(null);
  return (
    <div className="patterns-section-stage">
      <SectionIndex
        label="本记录章节"
        scrollRoot={scrollRoot}
        sections={[
          { id: 'spec-summary', label: '概览' },
          { id: 'spec-method', label: '方法' },
          { id: 'spec-result', label: '结果' },
        ]}
      />
      <div className="patterns-section-body" ref={scrollRoot}>
        <section id="spec-summary">
          <h3>概览</h3>
          <p>近海沉积样本的分层描述与保存状态。当前章节随滚动位置更新，也可由调用者受控。</p>
        </section>
        <section id="spec-method">
          <h3>方法</h3>
          <p>柱状取样器分层取样，现场冷藏运输；实验室筛分后称重并记录含水率。</p>
        </section>
        <section id="spec-result">
          <h3>结果</h3>
          <p>示例数值仅用于排版演示，不代表真实监测指标。</p>
        </section>
      </div>
    </div>
  );
}

export function PatternsPage() {
  return (
    <>
      <PageHeader index="39" section="Archive & Patterns" title="页面模式">
        <p>
          <code>@wzrhine/patterns</code> 的应用级模式：主从布局、属性检查、集合工具区、资源网格与章节索引。
          查询、选择与详情状态全部由调用者持有；宽窄模式由容器可用空间决定（非全局窗口宽度），
          SSR 首屏为确定的 split 结构。示例数据为静态样张，不代表真实库藏。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="patterns-list-detail"
          index="01"
          title="ListDetail · 主从布局"
          span="full"
          note="auto 模式按容器宽度切换 split／overlay；详情打开时窄布局替换列表并保留滚动位置"
        >
          <ListDetailSpecimen />
        </Specimen>
        <Specimen
          id="patterns-inspector"
          index="02"
          title="InspectorPanel · 属性检查"
          span="half"
          note="标题、元数据、操作与内容槽；open=false 时整个区域隐藏且不可聚焦，焦点由调用者落位"
        >
          <InspectorSpecimen />
        </Specimen>
        <Specimen
          id="patterns-inspector-overlay"
          index="03"
          title="InspectorPanel · 覆盖层组合"
          span="half"
          note="覆盖层形态由 recipe 组合既有 Drawer：焦点捕获、Escape 与焦点回收来自 Drawer"
        >
          <InspectorOverlaySpecimen />
        </Specimen>
        <Specimen
          id="patterns-collection"
          index="04"
          title="集合工具区 · QueryToolbar / AppliedFilters / ViewSwitcher"
          span="full"
          note="显式提交（IME 组合期 Enter 不误提交）、稳定条件 ID 与移除焦点落位、radiogroup 视图切换"
        >
          <QueryToolbarSpecimen />
        </Specimen>
        <Specimen
          id="patterns-resource-grid"
          index="05"
          title="SelectionToolbar / ResourceGrid · 批量选择与资源网格"
          span="full"
          note="选择与打开分离、具名复选框、缩略图保留固有尺寸；末张卡片演示单项图片降级"
        >
          <ResourceGridSpecimen />
        </Specimen>
        <Specimen
          id="patterns-section-index"
          index="06"
          title="SectionIndex · 章节索引"
          span="full"
          note="章节 id 与正文标题一一对应；当前章节随滚动容器更新，aria-current 标注所在章节"
        >
          <SectionIndexSpecimen />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
