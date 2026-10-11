import * as React from 'react';
import { AgentEmptyState, AgentHeader, AgentShell, AgentSidePane, AgentWorkspaceEmpty, ConversationList, ResizeHandle } from '@wzrhine/agent';
import type { AgentShellLayout, AgentSidePaneSection, ConversationSection, ConversationView } from '@wzrhine/agent';
import { Button, Textarea } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { sampleConversations } from '../../../../packages/agent/src/fixtures/session';

/*
 * Shell family showcase (atlas 01–04, 26): AgentShell, AgentHeader, ConversationList,
 * ConversationRow, AgentSidePane, ResizeHandle and the empty states. Every title, time, count and
 * status on this page is sample data (示例); nothing is fetched, saved or deleted for real.
 */

/** Fixed reference time so the sample timestamps read as "today" (示例). */
const NOW = new Date('2026-10-11T18:00:00+08:00');

/* Docs-only frame (inline tokens: style.css belongs to the showcase shell). */
const frame: React.CSSProperties = {
  border: 'var(--rl-border-width) solid var(--rl-border-default)',
  borderRadius: 'var(--rl-radius-md)',
  overflow: 'hidden',
  background: 'var(--rl-bg-canvas)',
};

const allSamples: ConversationView[] = sampleConversations.flatMap((section) => section.items);

/** Groups a flat list the way a host would: pinned, recent, archived. Empty groups are skipped by the list. */
function group(items: ConversationView[]): ConversationSection[] {
  return [
    { id: 'pinned', label: '置顶（示例）', items: items.filter((i) => i.pinned && !i.archived) },
    { id: 'recent', label: '最近（示例）', items: items.filter((i) => !i.pinned && !i.archived) },
    { id: 'archived', label: '已归档（示例）', items: items.filter((i) => i.archived) },
  ];
}

const paneSections: AgentSidePaneSection[] = [
  {
    id: 'summary',
    label: '摘要',
    content: (
      <div className="sc-card-list">
        <p className="sc-small">目标：比较样本图像的分类结果（示例）。</p>
        <p className="sc-small">切换标签时每个标签保留自己的滚动位置。</p>
      </div>
    ),
  },
  {
    id: 'files',
    label: '文件',
    count: 3,
    content: (
      <ul className="sc-card-list">
        <li className="sc-small">manifest.csv（示例）</li>
        <li className="sc-small">classify.py（示例）</li>
        <li className="sc-small">report.md（示例）</li>
      </ul>
    ),
  },
  { id: 'notes', label: '备注', content: <p className="sc-small">没有备注（示例）。</p> },
];

/** Placeholder reading area: a real host puts a MessageList here. */
function ReadingPlaceholder({ item }: { item: ConversationView }) {
  return (
    <div className="sc-card-list" data-testid="reading">
      <p className="sc-small">阅读区占位（示例）：此处放置 MessageList。</p>
      <p>
        当前会话：<strong>{item.title}</strong>
      </p>
      <p className="sc-small">{item.preview ?? '没有预览'}（示例）</p>
    </div>
  );
}

/* ---------- 01 · full three-column demo ---------- */

function ShellDemo() {
  const [items, setItems] = React.useState<ConversationView[]>(allSamples);
  const [selectedId, setSelectedId] = React.useState<string | undefined>('c-coral');
  const [query, setQuery] = React.useState('');
  const [contextOpen, setContextOpen] = React.useState(true);
  const [tab, setTab] = React.useState('summary');
  const [log, setLog] = React.useState('尚无操作');
  const [created, setCreated] = React.useState(0);

  const q = query.trim().toLowerCase();
  const sections = group(q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items);
  const current = items.find((i) => i.id === selectedId);
  const update = (id: string, patch: Partial<ConversationView>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const create = () => {
    const n = created + 1;
    const item: ConversationView = { id: `c-new-${n}`, title: `新会话 ${n}（示例）`, preview: '0 条消息', updatedAt: NOW.toISOString(), runStatus: 'idle' };
    setCreated(n);
    setItems((list) => [item, ...list]);
    setSelectedId(item.id);
    setLog(`已新建「${item.title}」`);
  };

  return (
    <div className="sc-card-list">
      <p className="sc-small" role="status" data-testid="shell-log">
        最近操作（示例）：{log}
      </p>
      <div style={{ ...frame, height: '36rem' }}>
        <AgentShell
          data-testid="shell-demo"
          mainLabel="对话（示例）"
          indexLabel="会话索引（示例）"
          contextLabel="会话详情（示例）"
          breakpoints={{ context: 52 }}
          activeId={selectedId}
          contextOpen={contextOpen}
          onContextOpenChange={(open) => setContextOpen(open)}
          index={
            <ConversationList
              label="会话列表（示例）"
              headingLevel={3}
              sections={sections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              search={query}
              onSearchChange={setQuery}
              now={NOW}
              onPin={(item, pinned) => {
                update(item.id, { pinned });
                setLog(`${pinned ? '已置顶' : '已取消置顶'}「${item.title}」`);
              }}
              onArchive={(item) => {
                update(item.id, { archived: true, pinned: false });
                setLog(`已归档「${item.title}」`);
              }}
              onUnarchive={(item) => {
                update(item.id, { archived: false });
                setLog(`已取消归档「${item.title}」`);
              }}
              onDelete={(item) => {
                setItems((list) => list.filter((i) => i.id !== item.id));
                if (item.id === selectedId) setSelectedId(undefined);
                setLog(`已删除「${item.title}」`);
              }}
            />
          }
          header={
            current ? (
              <AgentHeader
                headingLevel={3}
                title={current.title}
                identity={{ id: 'agent', name: 'Research', role: '示例 Agent', monogram: 'R' }}
                runStatus={current.runStatus}
                runPhase={current.runPhase}
                syncStatus="live"
                badges={[{ id: 'files', count: 3, label: '3 个文件（示例）' }]}
              />
            ) : undefined
          }
          conversation={current ? <ReadingPlaceholder item={current} /> : <AgentWorkspaceEmpty headingLevel={3} onCreate={create} />}
          composer={current ? <Textarea aria-label="消息草稿（示例）" rows={2} placeholder="输入消息（示例，不会发送）" /> : undefined}
          context={current ? <AgentSidePane label="会话详情（示例）" headingLevel={3} activeTab={tab} onTabChange={setTab} sections={paneSections} /> : undefined}
        />
      </div>
    </div>
  );
}
/* ---------- 04 · ConversationRow states ---------- */

const rowStates: ConversationView[] = [
  { id: 's-default', title: '默认：样本登记（示例）', preview: '2 条消息', updatedAt: '2026-10-11T09:12:00+08:00' },
  { id: 's-selected', title: '选中：海洋塑料样本分析（示例）', preview: '4 条消息', updatedAt: '2026-10-11T10:30:00+08:00', runStatus: 'completed' },
  { id: 's-running', title: '运行中：珊瑚礁图像分类（示例）', preview: '6 条消息', updatedAt: '2026-10-11T14:20:00+08:00', runStatus: 'running', runPhase: 'executing-tool' },
  { id: 's-unread', title: '未读：气象站数据（示例）', preview: '11 条消息', updatedAt: '2026-10-11T13:05:00+08:00', unread: 3, runStatus: 'completed' },
  { id: 's-approval', title: '待批准：卫星影像处理（示例）', preview: '14 条消息', updatedAt: '2026-10-11T14:18:00+08:00', runStatus: 'waiting', runPhase: 'waiting-approval', attention: 'approval' },
  { id: 's-error', title: '出错：实验报告草稿（示例）', preview: '3 条消息', updatedAt: '2026-10-10T16:40:00+08:00', runStatus: 'failed', attention: 'error' },
  { id: 's-disabled', title: '禁用：切换中的会话（示例）', preview: '不可操作', updatedAt: '2026-10-09T08:00:00+08:00' },
  {
    id: 's-long-cjk',
    title: '长中文标题：酶结构比对与蛋白质折叠路径的多轮分析记录，用于验证单行截断不挤压时间列（示例）',
    preview: '9 条消息',
    updatedAt: '2026-10-11T11:45:00+08:00',
    pinned: true,
  },
  {
    id: 's-long-en',
    title: 'Long English title: Helix aurelia comparative study across seasonal sampling sites (sample)',
    preview: '12 messages',
    updatedAt: '2026-10-08T15:00:00+08:00',
    unread: 128,
  },
];

function RowStates() {
  const [log, setLog] = React.useState('尚无操作');
  return (
    <div className="sc-card-list">
      <div style={{ ...frame, maxWidth: '22rem' }}>
        <ConversationList
          label="行状态（示例）"
          headingLevel={3}
          sections={[{ id: 'states', label: '状态矩阵（示例）', items: rowStates }]}
          selectedId="s-selected"
          isDisabled={(item) => item.id === 's-disabled'}
          now={NOW}
          onPin={(item, pinned) => setLog(`${pinned ? '置顶' : '取消置顶'}「${item.title}」（演示，未改变列表）`)}
        />
      </div>
      <p className="sc-small" role="status">
        行操作（示例）：{log}
      </p>
    </div>
  );
}

/* ---------- 02 · AgentHeader variants ---------- */

function HeaderFrame({ label, children, narrow = false }: { label: string; children: React.ReactNode; narrow?: boolean }) {
  return (
    <figure style={{ margin: 0, display: 'grid', gap: 'var(--rl-space-1)', minWidth: 0 }}>
      <figcaption className="sc-small">{label}</figcaption>
      <div style={{ ...frame, background: 'var(--rl-bg-surface)', maxWidth: narrow ? '20rem' : undefined }}>{children}</div>
    </figure>
  );
}

function HeaderVariants() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState('尚无操作');
  const say = (text: string) => () => setLog(text);
  return (
    <div className="sc-card-list" style={{ gap: 'var(--rl-space-4)' }}>
      <HeaderFrame label="空闲（示例）">
        <AgentHeader headingLevel={3} title="样本登记（示例）" runStatus="idle" onRename={say('请求重命名「样本登记」')} />
      </HeaderFrame>
      <HeaderFrame label="运行中（示例）">
        <AgentHeader
          headingLevel={3}
          title="珊瑚礁图像分类（示例）"
          identity={{ id: 'a', name: 'Research', role: '示例 Agent', monogram: 'R' }}
          runStatus="running"
          runPhase="thinking"
          badges={[{ id: 'term', count: 2, label: '2 个终端运行中（示例）' }]}
          contextOpen={open}
          onToggleContext={() => setOpen((v) => !v)}
        />
      </HeaderFrame>
      <HeaderFrame label="子任务：返回与来源（示例）">
        <AgentHeader
          headingLevel={3}
          title="核对图像标签（示例）"
          origin={{ kind: 'subagent', parentId: 'c-coral', parentTitle: '珊瑚礁图像分类（示例）' }}
          onOpenOrigin={say('打开上级对话「珊瑚礁图像分类」')}
          onBack={say('返回上级对话')}
          runStatus="running"
          runPhase="executing-tool"
        />
      </HeaderFrame>
      <HeaderFrame label="待批准（示例）">
        <AgentHeader
          headingLevel={3}
          title="卫星影像处理（示例）"
          runStatus="waiting"
          runPhase="waiting-approval"
          pending
          onRename={say('不会触发：待处理时重命名禁用')}
        />
      </HeaderFrame>
      <HeaderFrame label="同步：正在重新连接（示例）">
        <AgentHeader headingLevel={3} title="气象站数据（示例）" runStatus="completed" syncStatus="reconnecting" />
      </HeaderFrame>
      <HeaderFrame label="窄容器（示例）" narrow>
        <AgentHeader
          headingLevel={3}
          title="酶结构比对：一个非常长的中文标题，窄容器里截断但状态与操作不被挤压（示例）"
          runStatus="failed"
          syncStatus="offline"
          onBack={say('返回上级对话')}
          onRename={say('请求重命名长标题会话')}
          badges={[{ id: 'files', count: 12, label: '12 个文件（示例）' }]}
          contextOpen={false}
          onToggleContext={say('切换详情面板（窄容器演示）')}
        />
      </HeaderFrame>
      <p className="sc-small" role="status">
        标题栏操作（示例）：{log}
      </p>
    </div>
  );
}

/* ---------- 01 · layout matrix ---------- */

const matrixWidths: Record<AgentShellLayout, string> = { wide: '56rem', compact: '40rem', narrow: '22rem' };
const matrixCopy: Record<AgentShellLayout, string> = {
  wide: 'wide：索引、阅读列、详情面板都在行内',
  compact: 'compact：详情面板改为抽屉，索引保留',
  narrow: 'narrow：索引与详情都改为抽屉，只留阅读列',
};

function LayoutCell({ layout }: { layout: AgentShellLayout }) {
  const [selected, setSelected] = React.useState('c-coral');
  const current = allSamples.find((i) => i.id === selected);
  return (
    <figure style={{ margin: 0, display: 'grid', gap: 'var(--rl-space-1)' }}>
      <figcaption className="sc-small">{matrixCopy[layout]}（示例）</figcaption>
      <div style={{ ...frame, width: matrixWidths[layout], height: '20rem' }}>
        <AgentShell
          layout={layout}
          defaultContextOpen
          contextMin={192}
          defaultContextSize={224}
          mainLabel={`对话（${layout} 示例）`}
          indexLabel={`会话索引（${layout} 示例）`}
          contextLabel={`会话详情（${layout} 示例）`}
          activeId={selected}
          index={
            <ConversationList
              label={`会话列表（${layout} 示例）`}
              headingLevel={3}
              sections={[sampleConversations[1]!]}
              selectedId={selected}
              onSelect={setSelected}
              now={NOW}
            />
          }
          header={<AgentHeader headingLevel={3} title={current?.title} runStatus={current?.runStatus} runPhase={current?.runPhase} />}
          conversation={<p className="sc-small">阅读区占位（{layout} 示例）。</p>}
          context={
            <AgentSidePane
              label={`会话详情（${layout} 示例）`}
              headingLevel={3}
              sections={[
                { id: 'summary', label: '摘要', content: <p className="sc-small">摘要（示例）</p> },
                { id: 'files', label: '文件', count: 3, content: <p className="sc-small">3 个文件（示例）</p> },
              ]}
            />
          }
        />
      </div>
    </figure>
  );
}

function LayoutMatrix() {
  return (
    // Fixed-size frames: on narrow screens this wrapper scrolls sideways (named and focusable).
    <div className="sc-table-wrap" role="region" aria-label="布局矩阵（示例，可横向滚动）" tabIndex={0} style={{ padding: 'var(--rl-space-1)', background: 'none' }}>
      <div style={{ display: 'grid', gap: 'var(--rl-space-4)', width: 'max-content' }}>
        <LayoutCell layout="wide" />
        <LayoutCell layout="compact" />
        <LayoutCell layout="narrow" />
      </div>
    </div>
  );
}

/* ---------- 01 · ResizeHandle ---------- */

function ResizeDemo() {
  const [size, setSize] = React.useState(144);
  return (
    <div className="sc-card-list">
      <div style={{ ...frame, display: 'flex', height: '8rem' }} data-testid="resize-demo">
        <div style={{ flex: '1 1 0', minWidth: 0, padding: 'var(--rl-space-3)' }}>
          <p className="sc-small" style={{ margin: 0 }}>
            阅读列（示例）
          </p>
        </div>
        <ResizeHandle size={size} onSizeChange={setSize} min={96} max={200} step={8} largeStep={32} resetSize={144} label="调整示例面板宽度" />
        <div style={{ flex: 'none', width: `${size}px`, padding: 'var(--rl-space-3)', background: 'var(--rl-bg-surface)', borderInlineStart: 'var(--rl-border-width) solid var(--rl-border-subtle)' }}>
          <p className="sc-small" style={{ margin: 0 }}>
            面板（示例）
          </p>
        </div>
      </div>
      <p className="sc-small" data-testid="resize-value">
        当前宽度：{size} 像素（示例，范围 96–200）
      </p>
    </div>
  );
}

/* ---------- 26 · AgentSidePane standalone ---------- */

function SidePaneDemo() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="sc-card-list">
      {open ? (
        <div style={{ ...frame, height: '14rem', maxWidth: '24rem' }}>
          <AgentSidePane label="独立详情面板（示例）" headingLevel={3} sections={paneSections} onClose={() => setOpen(false)} />
        </div>
      ) : (
        <div>
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            重新打开面板
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- empty states ---------- */

function EmptyDemo() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="sc-card-list">
      <div style={frame}>
        <AgentEmptyState headingLevel={3} />
      </div>
      <div style={frame}>
        <AgentEmptyState headingLevel={3} title="还没有会话（示例）" description="新建后会出现在会话列表里。" onCreate={() => setCount((n) => n + 1)} />
      </div>
      <p className="sc-small" role="status">
        已点击新建（示例）：{count} 次
      </p>
    </div>
  );
}

export function AgentShellPage() {
  return (
    <>
      <PageHeader index="AG" section="Agent UI" title="Shell">
        工作台框架、会话索引、会话行、标题栏、详情面板、调宽手柄与空状态。页面上的会话标题、时间、数量与状态都是示例数据，删除、归档等操作只改动本页状态。
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="shell-demo"
          index="01"
          title="AgentShell · 完整工作台"
          description="三栏：会话索引（搜索、选择、置顶、归档、删除）、阅读列（标题栏、阅读区、输入区）、详情面板（标签页）。宽度不足时详情面板先改为抽屉，再窄时索引也改为抽屉。"
          note="外壳测量自身宽度决定布局；详情面板开合为单轴平移 + 透明度（--rl-motion-panel），宽度不做动画；减动时立即到位。"
        >
          <ShellDemo />
        </Specimen>
        <Specimen id="shell-rows" index="04" title="ConversationRow · 状态" span="half" description="默认、选中、运行中、未读、待批准、出错、禁用、长中文与长英文标题。状态用图形 + 文字，不只靠颜色。" note="↑ / ↓ 在行间移动焦点，Enter 选择；时间与未读在固定列，长标题不会挤掉它们。">
          <RowStates />
        </Specimen>
        <Specimen id="shell-header" index="02" title="AgentHeader · 变体" span="half" description="空闲、运行中、子任务（返回 + 来源）、待批准、同步重连、窄容器。同步状态只在非「已同步」时出现。" note="详情面板开关名称固定，状态用 aria-pressed；长标题视觉截断，全文保留在标题文本与 title 中。">
          <HeaderVariants />
        </Specimen>
        <Specimen id="shell-layouts" index="01" title="布局矩阵" description="同一个 AgentShell 用 layout 强制为 wide / compact / narrow。compact 与 narrow 下点击标题栏的按钮打开抽屉。" note="固定尺寸的演示框在窄屏上横向滚动（示例）。">
          <LayoutMatrix />
        </Specimen>
        <Specimen id="shell-resize" index="01" title="ResizeHandle" span="half" description="← / → 按步长移动，Shift 加大步长，Home / End 到最小 / 最大，双击恢复默认，也可拖动。" note="role=separator，aria-valuenow / min / max 与 aria-valuetext；面板在行尾时 ← 让面板变宽。">
          <ResizeDemo />
        </Specimen>
        <Specimen id="shell-pane" index="26" title="AgentSidePane" span="half" description="aside 地标 + 标签页；所有面板保持挂载，各自滚动。只有提供 onClose 才有关闭按钮。">
          <SidePaneDemo />
        </Specimen>
        <Specimen id="shell-empty" index="EM" title="AgentEmptyState" description="未选择会话时的阅读列。没有 onCreate 就没有按钮；不使用实时播报。">
          <EmptyDemo />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
