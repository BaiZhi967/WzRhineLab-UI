import * as React from 'react';
import '@wzrhine/patterns/styles.css';
import { Button, MetadataList, RecordHeader, StatusBadge } from '@wzrhine/react';
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

function ListDetailSpecimen() {
  const [detailId, setDetailId] = React.useState<string | null>('ARC-1024');
  const current = records.find((record) => record.id === detailId);
  return (
    <div style={{ height: '380px' }}>
      <ListDetail
        mode="auto"
        modeThreshold={640}
        detailId={detailId}
        onDetailChange={setDetailId}
        listLabel="样本档案"
        detailLabel="档案详情"
        list={
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
            {records.map((record) => (
              <li key={record.id}>
                <Button variant="ghost" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => setDetailId(record.id)}>
                  <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{record.id}</span>
                    <span>{record.title}</span>
                  </span>
                  <StatusBadge status={statusTone[record.status]}>{record.category}</StatusBadge>
                </Button>
              </li>
            ))}
          </ul>
        }
        detail={
          current ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <RecordHeader
                recordId={current.id}
                title={current.title}
                status={{ tone: statusTone[current.status], label: current.category }}
                headingLevel={2}
                meta={[
                  { label: '类别', value: current.category },
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
              <SectionIndex
                label="本记录章节"
                sections={[
                  { id: 'spec-summary', label: '概览' },
                  { id: 'spec-method', label: '方法' },
                  { id: 'spec-result', label: '结果' },
                ]}
                activeId="spec-summary"
              />
            </div>
          ) : null
        }
      />
    </div>
  );
}

function InspectorSpecimen() {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ height: '320px', display: 'grid', gap: '12px', gridTemplateColumns: 'minmax(16rem, 22rem)' }}>
      <InspectorPanel
        title="样本 ARC-1024"
        eyebrow="INSPECTOR"
        meta={inspectorMeta}
        open={open}
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button size="sm" variant="secondary">校验</Button>
            <Button size="sm" variant="ghost">导出</Button>
          </>
        }
      >
        <p>属性检查区域：元数据与操作由调用者组合，面板本身不执行业务动作。隐藏时整个区域不可聚焦。</p>
      </InspectorPanel>
      {!open && <Button variant="secondary" onClick={() => setOpen(true)}>重新打开检查面板</Button>}
    </div>
  );
}

function CollectionSpecimen() {
  const [query, setQuery] = React.useState('');
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [filters, setFilters] = React.useState([
    { id: 'category', label: '类别：样本' },
    { id: 'year', label: '年份：2026' },
  ]);
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <QueryToolbar
        query={query}
        onQueryChange={setQuery}
        onReset={() => {
          setQuery('');
          setFilters([]);
        }}
        resultSummary={<span>共 4 条结果</span>}
      >
        <Button variant="secondary" size="sm">类别</Button>
        <Button variant="secondary" size="sm">年份</Button>
      </QueryToolbar>
      <AppliedFilters
        filters={filters}
        onRemove={(id) => setFilters((prev) => prev.filter((f) => f.id !== id))}
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
      <SelectionToolbar
        selectedCount={2}
        scope="loaded"
        totalLabel="已加载 100 条"
        onClear={() => {}}
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
          thumbnail: { src: item.src, alt: item.title, width: 320, height: 240 },
        })}
        getItemLabel={(item) => `选择 ${item.title}`}
        selectedIds={new Set(['RES-2'])}
        onSelectionChange={() => {}}
        onOpen={() => {}}
      />
    </div>
  );
}

const resourceItems = [
  { id: 'RES-1', title: '浅层水体照片', note: 'ST-07 平台，能见度良好', badge: '已归档', src: '' },
  { id: 'RES-2', title: '沉积物显微图像', note: '40× 物镜，偏光', badge: '审核中', src: '' },
  { id: 'RES-3', title: '航拍底图切片', note: '2026-09 潮间带普查', src: '' },
  { id: 'RES-4', title: '声呐剖面记录', note: '浅地层剖面仪', src: '' },
];

export function PatternsPage() {
  return (
    <>
      <PageHeader index="39" section="Archive & Patterns" title="页面模式">
        <p>
          <code>@wzrhine/patterns</code> 的应用级模式：<code>ListDetail</code> 主从布局与 <code>InspectorPanel</code>{' '}
          属性检查区域。查询、选择与详情状态全部由调用者持有；宽窄模式由容器可用空间决定（非全局窗口宽度），
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
          id="patterns-collection"
          index="03"
          title="集合工具区 · QueryToolbar / AppliedFilters / ViewSwitcher"
          span="full"
          note="显式提交（IME 组合期 Enter 不误提交）、稳定条件 ID 与移除焦点落位、radiogroup 视图切换"
        >
          <CollectionSpecimen />
        </Specimen>
        <Specimen
          id="patterns-inspector"
          index="02"
          title="InspectorPanel · 属性检查"
          span="half"
          note="标题、元数据、操作与内容槽；open=false 时整个区域隐藏且不可聚焦"
        >
          <InspectorSpecimen />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
