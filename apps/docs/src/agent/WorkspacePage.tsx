import * as React from 'react';
import type { ArtifactView, ContextUsageView, FilePreviewMode, FilePreviewView, LedgerFilterKey, MaterialPageView, PinnedSummaryView, RunSummaryView, SubagentView, TerminalView } from '@wzrhine/agent';
import {
  ActivityLedger,
  ArtifactList,
  CompactionNotice,
  ContextUsage,
  FilePreview,
  FilePreviewTabs,
  PersistentTerminal,
  PinnedSummary,
  RunSummary,
  SubAgentList,
  TerminalList,
  TerminalTabs,
} from '@wzrhine/agent';
import { Button } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import {
  sampleArtifacts,
  sampleContextUsage,
  sampleLedger,
  samplePinnedSummary,
  sampleRun,
  sampleSubagents,
  sampleTerminals,
} from '../../../../packages/agent/src/fixtures/session';

/*
 * Workspace & artifact family showcase (atlas 22–24, 27–30, 33, 36 + compaction notice). Every
 * value here is sample data (示例): paths, commands, token counts and timings are illustrative,
 * never live measurements.
 */

/** Original sample image (inline SVG): a stylised specimen plate with three marks. */
const sampleImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#E9E8E1"/>' +
    '<g fill="none" stroke="#505850" stroke-width="2"><circle cx="160" cy="100" r="70"/><circle cx="160" cy="100" r="40" stroke-dasharray="6 6"/>' +
    '<path d="M60 100h40M220 100h40M160 10v40M160 150v40"/></g>' +
    '<g fill="#A8421B"><circle cx="130" cy="80" r="8"/><circle cx="185" cy="115" r="6"/><circle cx="150" cy="130" r="5"/></g></svg>',
)}`;

const codeSample = `# 示例代码：分类流程（示例）
import os
from pathlib import Path

def classify(images: list[Path]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for image in images:
        label = predict(image)
        counts[label] = counts.get(label, 0) + 1
    return counts
`;

const codeFile: FilePreviewView = {
  id: 'f-code',
  name: 'classify.py',
  path: 'workspace/reef/src/classify.py',
  kind: 'code',
  language: 'python',
  mimeType: 'text/x-python',
  size: 412,
  version: 'v7',
  status: 'ready',
  content: codeSample,
  metadata: [{ label: '来源', value: '示例工作区' }],
};

const imageFile: FilePreviewView = {
  id: 'f-image',
  name: 'specimen-plate.svg',
  path: 'out/specimen-plate.svg',
  kind: 'image',
  mimeType: 'image/svg+xml',
  size: 720,
  status: 'ready',
  content: sampleImage,
  alt: '示例标本图：同心圆刻度与三个橙色标记点',
};

const largeFile: FilePreviewView = {
  id: 'f-large',
  name: 'run.log',
  path: 'logs/run.log',
  kind: 'text',
  size: 4_800_000,
  status: 'large-file',
  partial: { loadedBytes: 64 * 1024, totalBytes: 4_800_000 },
  content: Array.from({ length: 12 }, (_, i) => `[示例] 第 ${i + 1} 行日志：processing batch ${i + 1}`).join('\n'),
};

const changedFile: FilePreviewView = { ...codeFile, id: 'f-changed', status: 'changed', version: 'v7', reason: '磁盘上已有 v8（示例）' };
const errorFile: FilePreviewView = { id: 'f-error', name: 'secret.env', path: '~/secret.env', kind: 'text', status: 'error', external: true, reason: '没有读取权限（示例）' };
const binaryFile: FilePreviewView = { id: 'f-bin', name: 'model.bin', path: 'models/model.bin', kind: 'binary', mimeType: 'application/octet-stream', size: 52_000_000, status: 'ready' };

const fileOptions = [
  { id: 'code', label: '代码', file: codeFile },
  { id: 'image', label: '图片', file: imageFile },
  { id: 'large', label: '大文件', file: largeFile },
  { id: 'changed', label: '已更新', file: changedFile },
  { id: 'error', label: '错误', file: errorFile },
  { id: 'binary', label: '二进制', file: binaryFile },
] as const;

/** Interactive terminal: input echoes into the output; stop goes stop-pending → ended. */
function TerminalDemo() {
  const [terminals, setTerminals] = React.useState<TerminalView[]>(() => [
    { ...sampleTerminals[0]!, status: 'waiting-input', output: `${sampleTerminals[0]!.output}\n继续处理剩余图像？(y/n)（示例）` },
    sampleTerminals[1]!,
    sampleTerminals[2]!,
  ]);
  const [active, setActive] = React.useState('term-a');
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const patch = (id: string, next: Partial<TerminalView>) => setTerminals((list) => list.map((t) => (t.id === id ? { ...t, ...next } : t)));

  return (
    <div className="sc-card-list">
      <TerminalTabs
        terminals={terminals}
        value={active}
        onValueChange={setActive}
        onInput={(text, terminal) => {
          patch(terminal.id, { output: `${terminal.output ?? ''}\n> ${text}\n已收到输入（示例回显）：${text}`, status: 'running', calls: (terminal.calls ?? 0) + 1 });
        }}
        onStop={(terminal) => {
          window.clearTimeout(timer.current);
          patch(terminal.id, { status: 'stop-pending' });
          timer.current = window.setTimeout(() => patch(terminal.id, { status: 'ended', exitCode: 130, stoppable: false }), 1500);
        }}
      />
      <div className="sc-row">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            window.clearTimeout(timer.current);
            setTerminals((list) => list.map((t, i) => (i === 0 ? { ...sampleTerminals[0]!, status: 'waiting-input', stoppable: true } : t)));
            setActive('term-a');
          }}
        >
          重置示例终端
        </Button>
        <span className="sc-small">输入后按 Enter 回显；停止先显示「停止尚未确认」，1.5 秒后确认结束（示例）。</span>
      </div>
    </div>
  );
}

function TerminalStates() {
  const states: TerminalView[] = [
    { ...sampleTerminals[0]!, id: 'term-idle', name: '终端 D', status: 'idle', output: '$ npm run build\n构建完成（示例）', outputTruncated: true },
    { ...sampleTerminals[0]!, id: 'term-unknown', name: '终端 E', status: 'unknown', partialCapture: true, output: '$ ./sync.sh\n…（示例：连接中断后未能确认状态）' },
  ];
  return (
    <div className="sc-card-list">
      {states.map((t) => (
        <PersistentTerminal key={t.id} terminal={t} onLoadEarlier={() => undefined} onStop={() => undefined} />
      ))}
    </div>
  );
}

function TerminalListDemo() {
  const list: TerminalView[] = [
    ...sampleTerminals,
    { id: 'term-d', name: '终端 D', backend: 'process', cwd: '/workspace/reef', lastCommand: 'pytest -q', status: 'unknown', stoppable: true, calls: 1 },
    { id: 'term-e', name: '终端 E', backend: 'pty', cwd: '/workspace', lastCommand: 'git status', status: 'ended', exitCode: 0, calls: 2 },
  ];
  const [current, setCurrent] = React.useState('term-a');
  const [log, setLog] = React.useState('尚未操作');
  return (
    <div className="sc-card-list">
      <TerminalList
        terminals={list}
        currentId={current}
        onOpen={(t) => {
          setCurrent(t.id);
          setLog(`打开 ${t.name}`);
        }}
        onStop={(t) => setLog(`请求停止 ${t.name}（示例，不改变状态）`)}
        onLoadMore={() => setLog('加载更多（示例：没有更多）')}
      />
      <p className="sc-small" aria-live="polite">
        最近操作：{log}
      </p>
    </div>
  );
}

const ctx = (patch: Partial<ContextUsageView>): ContextUsageView => ({ ...sampleContextUsage, ...patch });
const contextCases: { title: string; usage: ContextUsageView }[] = [
  { title: '估计值', usage: sampleContextUsage },
  { title: '精确 · 接近上限', usage: ctx({ used: 27_600, completeness: 'exact' }) },
  { title: '超过上限', usage: ctx({ used: 35_200, completeness: 'exact', note: '下一轮会自动整理上下文（示例）' }) },
  { title: '上限未知', usage: ctx({ max: undefined, note: '模型配置已变化，等待重新估计（示例）' }) },
  { title: '部分数据', usage: ctx({ completeness: 'partial' }) },
];

function ContextDemo() {
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        {contextCases.map((c) => (
          <ContextUsage key={c.title} usage={c.usage} variant="ring" data-case={c.title} />
        ))}
      </div>
      {contextCases.map((c) => (
        <div key={c.title} className="sc-card-list" data-case={c.title}>
          <p className="sc-small">{c.title}（示例）</p>
          <ContextUsage usage={c.usage} variant={c.title === '估计值' ? 'full' : 'bar'} />
        </div>
      ))}
    </div>
  );
}

function SummaryDemo() {
  const [pinned, setPinned] = React.useState(true);
  const [opened, setOpened] = React.useState('未打开');
  const withSources: PinnedSummaryView = {
    ...samplePinnedSummary,
    sources: [...(samplePinnedSummary.sources ?? []), { id: 'ci-x', index: 2, title: '旧版报告.md', sourceType: 'file', unavailable: true, reason: '文件已不存在（示例）' }],
  };
  return (
    <div className="sc-card-list">
      <PinnedSummary summary={withSources} pinned={pinned} onPinChange={setPinned} onOpenSource={(c) => setOpened(c.title)} />
      <p className="sc-small" aria-live="polite">
        最近打开的来源：{opened}
      </p>
      <PinnedSummary summary={{ ...samplePinnedSummary, id: 'ps-2', title: '更新中的摘要', status: 'updating' }} defaultExpanded={false} />
      <PinnedSummary summary={{ ...samplePinnedSummary, id: 'ps-3', title: '可能过期的摘要', status: 'stale' }} defaultExpanded={false} />
      <PinnedSummary summary={{ id: 'ps-4', title: '尚无摘要', body: '', status: 'missing' }} />
    </div>
  );
}
const extraArtifacts: ArtifactView[] = [
  { id: 'a-4', title: 'figure-2.png', kind: 'image', status: 'saved', change: 'modified', version: '2', size: 720, preview: sampleImage, alt: '示例标本图缩略图', path: 'out/figure-2.png' },
  { id: 'a-5', title: 'summary.json', kind: 'data', status: 'failed', reason: '写入失败：磁盘空间不足（示例）', path: 'out/summary.json' },
  { id: 'a-6', title: 'draft-old.md', kind: 'markdown', status: 'unavailable', change: 'deleted', reason: '文件已被删除（示例）' },
  { id: 'a-7', title: 'notes.txt', kind: 'text', status: 'stale', preview: '第一轮观察记录（示例）…', reason: '源文件已改动，产物可能过期（示例）', path: 'out/notes.txt' },
];

function ArtifactDemo() {
  const [items, setItems] = React.useState<ArtifactView[]>([...sampleArtifacts, ...extraArtifacts]);
  const [log, setLog] = React.useState('尚未操作');
  return (
    <div className="sc-card-list">
      <ArtifactList
        artifacts={items}
        onOpen={(a) => setLog(`打开 ${a.title}`)}
        onDownload={(a) => setLog(`下载 ${a.title}`)}
        onReveal={(a) => setLog(`在文件夹中显示 ${a.title}`)}
        onRetry={(a) => {
          setLog(`重试 ${a.title}`);
          setItems((list) => list.map((x) => (x.id === a.id ? { ...x, status: 'generating', reason: undefined } : x)));
        }}
      />
      <div className="sc-row">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setItems((list) => [...list, { id: `a-new-${list.length}`, title: `report-${list.length}.md`, kind: 'markdown', status: 'generating', path: 'out/' }])}
        >
          添加一个示例产物
        </Button>
        <span className="sc-small" aria-live="polite">
          最近操作：{log}
        </span>
      </div>
    </div>
  );
}

function FileDemo() {
  const [which, setWhich] = React.useState<(typeof fileOptions)[number]['id']>('code');
  const [mode, setMode] = React.useState<FilePreviewMode>('preview');
  const [log, setLog] = React.useState('尚未操作');
  const current = fileOptions.find((o) => o.id === which)!.file;
  return (
    <div className="sc-card-list">
      <div className="sc-row" role="group" aria-label="示例文件">
        {fileOptions.map((o) => (
          <Button key={o.id} size="sm" variant={which === o.id ? 'primary' : 'secondary'} aria-pressed={which === o.id} onClick={() => setWhich(o.id)}>
            {o.label}
          </Button>
        ))}
      </div>
      <FilePreview
        key={current.id}
        file={current}
        mode={mode}
        onModeChange={setMode}
        onRetry={() => setLog('重试读取（示例）')}
        onReload={() => setLog('重新加载（示例）')}
        onLoadMore={() => setLog('加载下一块（示例）')}
        onOpenExternal={(f) => setLog(`在外部打开 ${f.name}（示例）`)}
        onReference={(f) => setLog(`引用 ${f.name}（示例）`)}
      />
      <p className="sc-small" aria-live="polite">
        最近操作：{log}
      </p>
    </div>
  );
}

function LedgerDemo() {
  const [filter, setFilter] = React.useState<LedgerFilterKey>('all');
  const [events, setEvents] = React.useState(sampleLedger);
  const [opened, setOpened] = React.useState('未打开');
  return (
    <div className="sc-card-list">
      <ActivityLedger events={events} filter={filter} onFilterChange={setFilter} onOpenEvent={(e) => setOpened(e.title)} />
      <div className="sc-row">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            setEvents((list) => {
              const next = list.length + 1;
              return [...list, { id: `ev-${next}`, sequence: next, actor: 'system', title: `运行完成（示例事件 ${next}）`, at: list[list.length - 1]!.at, outcome: 'success' }];
            })
          }
        >
          追加一个示例事件
        </Button>
        <span className="sc-small" aria-live="polite">
          最近查看：{opened}
        </span>
      </div>
    </div>
  );
}

const baseRun: RunSummaryView = {
  id: 'run-2186',
  title: '本轮运行（示例）',
  status: 'completed',
  elapsedMs: sampleRun.elapsedMs ?? 12_400,
  toolCount: 4,
  usage: { tokens: 15_500, completeness: 'exact' },
  artifacts: sampleArtifacts.slice(0, 2),
  persistence: 'saved',
};

const runCases: RunSummaryView[] = [
  baseRun,
  { ...baseRun, id: 'run-p', title: '部分完成（示例）', status: 'partial', failedTools: 1, usage: { tokens: 8_200, completeness: 'partial' }, artifacts: [sampleArtifacts[2]!] },
  { ...baseRun, id: 'run-f', title: '运行失败（示例）', status: 'failed', failedTools: 2, artifacts: [], persistence: 'failed' },
  { ...baseRun, id: 'run-c', title: '已停止（示例）', status: 'cancelled', toolCount: 2, sideEffects: true, artifacts: [] },
  { ...baseRun, id: 'run-s', title: '保存中（示例）', status: 'saving', persistence: 'saving' },
  { ...baseRun, id: 'run-e', title: '有副作用（示例）', sideEffects: true, persistence: 'saving' },
];

function RunDemo() {
  const [log, setLog] = React.useState('尚未操作');
  return (
    <div className="sc-card-list">
      {runCases.map((run) => (
        <RunSummary
          key={run.id}
          run={run}
          onOpenTrace={() => setLog(`查看过程：${run.title}`)}
          onOpenDetails={() => setLog(`查看详情：${run.title}`)}
          onRetrySave={() => setLog(`重试保存：${run.title}`)}
        />
      ))}
      <p className="sc-small" aria-live="polite">
        最近操作：{log}
      </p>
    </div>
  );
}

function CompactionDemo() {
  return (
    <div className="sc-card-list">
      <CompactionNotice status="running" elapsedMs={3_400} onCancel={() => undefined} />
      <CompactionNotice status="completed" tokensBefore={32_000} tokensAfter={12_000} summary={'保留：研究目标、数据范围、已确认的分类结论。\n移除：重复的工具输出（示例）。'} />
      <CompactionNotice status="cancelled" />
      <CompactionNotice status="failed" />
      <CompactionNotice status="save-pending" tokensBefore={32_000} tokensAfter={11_800} onRetrySave={() => undefined} />
    </div>
  );
}

/** Terminal with newer output, notes, call history and a stored-output pager (all 示例). */
function TerminalExtrasDemo() {
  const base: TerminalView = {
    ...sampleTerminals[0]!,
    id: 'term-f',
    name: '终端 F',
    status: 'idle',
    stoppable: false,
    newerOutput: true,
    notes: ['空闲为推断（示例）', '结果待保存（示例）'],
    history: [
      { id: 'h-1', command: 'python classify.py --batch 1', status: 'returned', exitCode: 0, at: '2026-10-09T08:12:00Z' },
      { id: 'h-2', command: 'pytest -q tests/test_reef.py', status: 'failed', exitCode: 1, at: '2026-10-09T08:14:30Z' },
      { id: 'h-3', command: './sync.sh', status: 'unknown', at: '2026-10-09T08:16:05Z' },
    ],
  };
  const [terminal, setTerminal] = React.useState(base);
  const [log, setLog] = React.useState('尚未操作');
  const pageOf = (offset: number): MaterialPageView => {
    const lines = Array.from({ length: 60 }, (_, i) => `[示例] 第 ${i + 1} 行终端输出`);
    const slice = lines.slice(offset, offset + 20);
    const end = offset + slice.length;
    return { offset, length: slice.length, total: lines.length, unit: 'lines', complete: end >= lines.length, nextOffset: end >= lines.length ? undefined : end, content: slice.join('\n'), status: 'ready' };
  };
  const [history, setHistory] = React.useState<number[]>([]);
  const [page, setPage] = React.useState<MaterialPageView>(() => pageOf(0));
  return (
    <div className="sc-card-list" data-testid="terminal-extras">
      <PersistentTerminal
        terminal={terminal}
        onReadLatest={() => {
          setTerminal((t) => ({ ...t, newerOutput: false, output: `${t.output ?? ''}\n最新输出已读取（示例）` }));
          setLog('读取最新输出');
        }}
        onLoadMoreHistory={() => setLog('加载更早的调用（示例：没有更多）')}
      />
      <p className="sc-small">已保存的输出按页读取（示例）：</p>
      <PersistentTerminal
        terminal={{ ...base, id: 'term-g', name: '终端 G', newerOutput: false, notes: undefined, history: undefined, status: 'ended', exitCode: 0 }}
        page={page}
        pager={{
          canGoBack: history.length > 0,
          onFirst: () => {
            setHistory([]);
            setPage(pageOf(0));
          },
          onPrevious: () => {
            setPage(pageOf(history[history.length - 1] ?? 0));
            setHistory((h) => h.slice(0, -1));
          },
          onNext: (next) => {
            setHistory((h) => [...h, page.offset]);
            setPage(pageOf(next));
          },
        }}
      />
      <p className="sc-small" aria-live="polite">
        最近操作：{log}
      </p>
    </div>
  );
}

/** Context usage with provider-neutral statistics (示例 values; missing values show —). */
const statsUsage: ContextUsageView = {
  ...sampleContextUsage,
  stats: [
    {
      id: 'cache',
      title: '缓存（示例）',
      rows: [
        { label: '命中率', value: 62.5, unit: 'percent' },
        { label: '缓存读取', value: 8_000, unit: 'tokens' },
        { label: '缓存写入', unit: 'tokens' },
      ],
    },
    {
      id: 'speed',
      title: '速度（示例）',
      rows: [
        { label: '首字延迟', value: 840, unit: 'ms' },
        { label: '生成速度', value: 42.3, unit: 'tokens-per-s', completeness: 'estimated' },
        { label: '请求次数', value: 3, unit: 'count' },
      ],
    },
  ],
};

function ContextStatsDemo() {
  return (
    <div className="sc-card-list" data-testid="context-stats">
      <div className="sc-row">
        <ContextUsage usage={statsUsage} variant="ring" openOnHover />
        <span className="sc-small">悬停、聚焦或点击打开（示例）</span>
      </div>
      <ContextUsage usage={statsUsage} variant="full" />
    </div>
  );
}

const inheritedAgents: SubagentView[] = [
  ...sampleSubagents.slice(0, 2),
  { id: 's-old-1', name: '旧版核查（示例）', task: '上一轮留下的文件核查记录', status: 'completed', inherited: true, usage: { tokens: 2_100, completeness: 'exact' }, resultAvailable: true },
  { id: 's-old-2', name: '旧版汇总（示例）', task: '上一轮中断的汇总', status: 'interrupted', inherited: true },
];

function SubagentInheritedDemo() {
  const [log, setLog] = React.useState('尚未操作');
  return (
    <div className="sc-card-list">
      <SubAgentList agents={inheritedAgents} groupInherited onOpen={(id) => setLog(`查看子任务 ${id}`)} onOpenSnapshot={(id) => setLog(`查看快照 ${id}`)} />
      <p className="sc-small" aria-live="polite">
        最近操作：{log}
      </p>
    </div>
  );
}

const tabFiles: FilePreviewView[] = [
  { ...codeFileForTabs(), id: 't-code' },
  { id: 't-md', name: 'notes-with-a-rather-long-file-name.md', path: '/workspace/reef/docs/notes-with-a-rather-long-file-name.md', kind: 'markdown', status: 'ready', content: '# 观察记录（示例）\n\n- 珊瑚 12\n- 海绵 4' },
  { id: 't-ext', name: 'secret.env', path: '/home/user/secret.env', kind: 'text', status: 'error', reason: '没有读取权限（示例）' },
];

function codeFileForTabs(): FilePreviewView {
  return { ...codeFile, path: '/workspace/reef/src/classify.py' };
}

const openTargets = [
  { id: 'editor', label: '代码编辑器（示例）' },
  { id: 'system', label: '系统默认应用（示例）' },
  { id: 'folder', label: '文件管理器（示例）', group: 'reveal' as const },
];

/** Open files as tabs, each a FilePreview with the split "open with" control and a breadcrumb. */
function FileTabsDemo() {
  const [open, setOpen] = React.useState(tabFiles);
  const [active, setActive] = React.useState(tabFiles[0]!.id);
  const [log, setLog] = React.useState('尚未操作');
  const reopen = React.useRef<HTMLButtonElement>(null);
  return (
    <div className="sc-card-list" data-testid="file-tabs">
      {open.length > 0 ? (
        <FilePreviewTabs
          tabs={open.map((f) => ({ id: f.id, name: f.name, kind: f.kind }))}
          activeId={active}
          onActivate={setActive}
          onCloseTab={(id) => {
            setOpen((list) => list.filter((f) => f.id !== id));
            setLog(`关闭 ${id}`);
          }}
          onCloseAll={() => {
            setOpen([]);
            setLog('关闭全部');
          }}
          returnFocusRef={reopen}
          renderPanel={(id) => {
            const f = open.find((x) => x.id === id)!;
            return (
              <FilePreview
                file={f}
                headingLevel={4}
                breadcrumbRoot="/workspace/reef"
                openTargets={openTargets}
                defaultOpenTarget="editor"
                onOpenWith={(target, file) => setLog(`用 ${target} 打开 ${file.name}（示例）`)}
                onCopyPath={(path) => setLog(`复制路径 ${path}（示例）`)}
                onReference={(file) => setLog(`引用 ${file.name}（示例）`)}
                onReload={() => setLog('重新读取（示例）')}
                onRetry={() => setLog('重试读取（示例）')}
              />
            );
          }}
        />
      ) : (
        <p className="sc-small">没有打开的文件（示例）</p>
      )}
      <div className="sc-row">
        <Button
          ref={reopen}
          size="sm"
          variant="secondary"
          onClick={() => {
            setOpen(tabFiles);
            setActive(tabFiles[0]!.id);
          }}
        >
          重新打开示例文件
        </Button>
        <span className="sc-small" aria-live="polite">
          最近操作：{log}
        </span>
      </div>
    </div>
  );
}

function CompactionExtrasDemo() {
  return (
    <div className="sc-card-list">
      <CompactionNotice status="running" phase="compacting" elapsedMs={5_200} onCancel={() => undefined} />
      <CompactionNotice status="interrupted" />
    </div>
  );
}

function ArtifactTruncatedDemo() {
  const [log, setLog] = React.useState('尚未操作');
  return (
    <div className="sc-card-list">
      <ArtifactList artifacts={sampleArtifacts.slice(0, 2)} truncated onShowAll={() => setLog('查看全部产物（示例）')} />
      <p className="sc-small" aria-live="polite">
        最近操作：{log}
      </p>
    </div>
  );
}

export function AgentWorkspacePage() {
  return (
    <>
      <PageHeader index="AG" section="Agent UI" title="Workspace">
        终端、子任务、上下文用量、固定摘要、产物、文件预览、运行事件、运行摘要与上下文整理提示。页面上的路径、命令、数字与时间均为示例数据。
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="ws-terminal" index="22" title="PersistentTerminal · TerminalTabs" description="命令返回不代表终端关闭；停止要等确认；继承终端只读。输出区不逐块播报。" note="role=log aria-live=off；Enter 发送，IME 合成期间不发送；光标静态。">
          <TerminalDemo />
        </Specimen>
        <Specimen id="ws-terminal-states" index="22" title="终端状态" span="half" description="空闲（命令已返回）、状态待确认、仅部分捕获、加载更早输出。">
          <TerminalStates />
        </Specimen>
        <Specimen id="ws-terminal-extras" index="22" title="终端 · 新输出、说明、调用记录、分页" description="快照之后有新输出时提示「有新输出，读取最新」；说明以小字列出；调用记录为有序列表（命令、状态文字、退出码、时间）；已保存输出可用 ChunkPager 翻页。">
          <TerminalExtrasDemo />
        </Specimen>
        <Specimen id="ws-terminal-list" index="23" title="TerminalList · TerminalRow" span="half" description="按未关闭 / 状态待确认 / 已结束 / 继承记录分组；打开与停止是两个按钮。" note="组内顺序保持传入顺序，状态波动不重排。">
          <TerminalListDemo />
        </Specimen>
        <Specimen id="ws-subagents" index="24" title="SubAgentList · SubAgentCard" description="父子任务分开追踪；部分用量显式标注；不按状态推算进度。" note="运行中使用 AgentSpark（减动时静态帧）。">
          <SubAgentList agents={sampleSubagents} onOpen={() => undefined} />
        </Specimen>
        <Specimen id="ws-context" index="27" title="ContextUsage" description="只有可靠上限时才画百分比；未知上限显示虚线圆环与文字，不出现 role=meter。" note="ring 变体点击或 Enter 打开 Popover。">
          <ContextDemo />
        </Specimen>
        <Specimen id="ws-context-stats" index="27" title="ContextUsage · 统计" span="half" description="缓存命中率、首字延迟、生成速度等统计按分组以 <dl> 显示；缺失值显示「—」，不显示 0。" note="ring 变体 openOnHover：悬停也可打开 Popover。">
          <ContextStatsDemo />
        </Specimen>
        <Specimen id="ws-subagents-inherited" index="24" title="SubAgentList · 继承记录" span="half" description="继承的子任务记录是只读快照：不显示待处理提示，只提供「查看快照」；可单独分组。">
          <SubagentInheritedDemo />
        </Specimen>
        <Specimen id="ws-summary" index="28" title="PinnedSummary" span="half" description="折叠、固定、来源（失效来源禁用并说明原因）、更新中 / 可能过期 / 暂无。">
          <SummaryDemo />
        </Specimen>
        <Specimen id="ws-compaction" index="CN" title="CompactionNotice" span="half" description="整理中（可取消）、完成（token 变化 + 摘要）、取消、失败（/compact 重试）、待保存。">
          <CompactionDemo />
        </Specimen>
        <Specimen id="ws-compaction-extras" index="CN" title="CompactionNotice · 阶段与中断" span="half" description="整理中显示子阶段；中断后保留旧上下文并提示 /compact 重试。">
          <CompactionExtrasDemo />
        </Specimen>
        <Specimen id="ws-artifacts-truncated" index="29" title="ArtifactList · 部分列出" span="half" description="宿主只列出部分产物时说明「部分产物未列出」，不编造数量。">
          <ArtifactTruncatedDemo />
        </Specimen>
        <Specimen id="ws-artifacts" index="29" title="ArtifactList · ArtifactCard" description="只有真正保存后才显示「已保存」；生成中无百分比；失败可重试；删除 / 不可用不能打开。" note="新增产物一次轻量入场（AgentEntrance row）。">
          <ArtifactDemo />
        </Specimen>
        <Specimen id="ws-file" index="30" title="FilePreview" description="预览 / 原始 / 元数据标签可用方向键切换；大文件分块；文件已更新可重新加载；二进制可在外部打开。">
          <FileDemo />
        </Specimen>
        <Specimen id="ws-file-tabs" index="30" title="FilePreviewTabs · 打开方式" description="已打开文件的标签条：←/→、Home/End 切换并激活，Delete 或中键关闭，Esc 关闭全部；关闭当前标签时焦点移到相邻标签。面板内为带路径面包屑与「打开方式」拆分按钮的 FilePreview。" note="拆分按钮的菜单：打开方式、在文件夹中显示、复制路径、在对话中引用。工作区外文件显示「外部」。">
          {/* The tab strip scrolls inside itself; the wrapper marks it as an intentional scroller. */}
          <div className="sc-table-wrap" style={{ padding: 'var(--rl-space-1)', background: 'none' }}>
            <FileTabsDemo />
          </div>
        </Specimen>
        <Specimen id="ws-ledger" index="33" title="ActivityLedger" description="按 sequence 排序、按 id 去重；筛选只隐藏，不改变顺序。" note="挂载后新到的事件才有入场。">
          <LedgerDemo />
        </Specimen>
        <Specimen id="ws-run" index="36" title="RunSummary" description="运行结果与保存结果分开显示；工具副作用单独提醒；完成态只做一次颜色过渡。">
          <RunDemo />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
