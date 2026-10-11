import * as React from 'react';
import type { FileDiffView, MaterialPageView, ToolCallView, ToolOutputView } from '@wzrhine/agent';
import { ChunkPager, CodeModeToolTree, DiffPreview, MultiFileDiff, ToolActivity, ToolHistory, ToolOutput, ToolRecord } from '@wzrhine/agent';
import { Button } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { sampleTools } from '../../../../packages/agent/src/fixtures/session';

/*
 * Tools family showcase (atlas 11–13, 31, 37–46). Every value on this page is sample data (示例):
 * paths, commands, versions and outputs are illustrative and never live measurements.
 */

const codeModeTool = sampleTools.find((t) => t.id === 'op-5')!;

const configDiff: FileDiffView = {
  path: 'src/config.py',
  change: 'update',
  status: 'proposed',
  hunks: [
    {
      id: 'h0',
      header: '@@ -10,4 +10,5 @@',
      lines: [
        { kind: 'context', text: 'class Settings:', oldLine: 10, newLine: 10 },
        {
          kind: 'context',
          text: '    name = "reef-classifier"',
          oldLine: 11,
          newLine: 11,
        },
        { kind: 'remove', text: '    debug = True', oldLine: 12 },
        { kind: 'add', text: '    debug = False', newLine: 12 },
        {
          kind: 'add',
          text: '    log_level = "info"  # 示例：一行足够长的代码，用于验证代码区在窄屏内部横向滚动而不撑破页面',
          newLine: 13,
        },
        { kind: 'context', text: '    retries = 3', oldLine: 13, newLine: 14 },
      ],
    },
  ],
};

const reportDiff: FileDiffView = {
  path: 'out/reef_report.md',
  change: 'add',
  status: 'preview',
  hunks: [
    {
      id: 'h0',
      lines: [
        { kind: 'add', text: '# 珊瑚分类报告（示例）', newLine: 1 },
        { kind: 'add', text: '', newLine: 2 },
        { kind: 'add', text: '样本 19 张，分类结果见附表。', newLine: 3 },
      ],
    },
  ],
  noNewlineAtEnd: { new: true },
};

const legacyDiff: FileDiffView = {
  path: 'src/legacy/loader.py',
  change: 'update',
  status: 'conflict',
  conflictReason: '示例：文件在提案后被修改（期望 v4，当前 v5），重新读取最新文件后再决定',
  hunks: [
    {
      id: 'h0',
      header: '@@ -1,3 +1,3 @@',
      lines: [
        { kind: 'context', text: 'import csv', oldLine: 1, newLine: 1 },
        { kind: 'remove', text: 'def load(path):', oldLine: 2 },
        { kind: 'add', text: 'def load(path, encoding="utf-8"):', newLine: 2 },
      ],
    },
  ],
};

const binaryDiff: FileDiffView = {
  path: 'assets/figure-1.png',
  change: 'update',
  binary: true,
  hunks: [],
  status: 'applied',
};

const truncatedDiff: FileDiffView = {
  path: 'data/reef/labels.csv',
  change: 'update',
  status: 'preview',
  truncated: true,
  hunks: [
    {
      id: 'h0',
      header: '@@ -1,4 +1,4 @@',
      lines: [
        { kind: 'context', text: 'id,label', oldLine: 1, newLine: 1 },
        { kind: 'remove', text: 'R-01,staghorn', oldLine: 2 },
        { kind: 'add', text: 'R-01,acropora', newLine: 2 },
        { kind: 'meta', text: '… 示例：其余 118 行变更未显示' },
      ],
    },
  ],
};

const movedDiff: FileDiffView = {
  path: 'notes/draft.md',
  movedTo: 'docs/reef/notes.md',
  change: 'move',
  status: 'applied',
  hunks: [],
};

// ---------- detail specimens (all 示例) ----------

const detailTools: Array<{ title: string; tool: ToolCallView }> = [
  {
    title: '读取 · 未到文件末尾',
    tool: {
      id: 'd-read',
      name: 'read_file',
      displayName: '读取文件',
      subject: 'data/reef/manifest.csv',
      category: 'read',
      status: 'completed',
      summary: '示例 · 40 行',
      elapsedMs: 120,
      authorization: { decision: 'auto', source: '只读自动允许' },
      detail: {
        kind: 'file-read',
        path: 'data/reef/manifest.csv',
        range: { start: 1, end: 4, unit: 'lines' },
        preview: 'id,species,confidence\nR-01,staghorn,示例\nR-02,brain,示例\nR-03,table,示例',
        eof: false,
        nextOffset: 41,
        totalLines: 128,
        bytes: 1229,
      },
    },
  },
  {
    title: '读取 · 文件不存在',
    tool: {
      id: 'd-read-missing',
      name: 'read_file',
      displayName: '读取文件',
      subject: 'data/reef/missing.csv',
      category: 'read',
      status: 'failed',
      summary: '找不到文件',
      authorization: { decision: 'auto', source: '只读自动允许' },
      detail: {
        kind: 'file-read',
        path: 'data/reef/missing.csv',
        error: 'not-found',
      },
    },
  },
  {
    title: '写入 · 新建文件',
    tool: {
      id: 'd-write-create',
      name: 'write_file',
      displayName: '写入文件',
      subject: 'out/reef_report.md',
      category: 'write',
      status: 'completed',
      authorization: { decision: 'approved', source: '用户允许本次' },
      detail: {
        kind: 'file-write',
        path: 'out/reef_report.md',
        mode: 'create',
        diff: { ...reportDiff, status: 'applied' },
        materialReady: true,
      },
    },
  },
  {
    title: '写入 · 覆盖时版本冲突',
    tool: {
      id: 'd-write-conflict',
      name: 'write_file',
      displayName: '写入文件',
      subject: 'src/legacy/loader.py',
      category: 'write',
      status: 'waiting-approval',
      detail: {
        kind: 'file-write',
        path: 'src/legacy/loader.py',
        mode: 'overwrite',
        expectedVersion: 'v4',
        currentVersion: 'v5',
        diff: { ...legacyDiff, status: undefined, conflictReason: undefined },
        materialReady: false,
      },
    },
  },
  {
    title: '编辑文件',
    tool: {
      id: 'd-edit',
      name: 'edit_file',
      displayName: '编辑文件',
      subject: 'src/config.py',
      category: 'write',
      status: 'waiting-approval',
      detail: {
        kind: 'file-edit',
        path: 'src/config.py',
        expectedVersion: 'v7',
        materialReady: true,
        edits: [
          {
            id: 'e1',
            range: { start: 12, end: 12, unit: 'lines' },
            before: 'debug = True',
            after: 'debug = False\nlog_level = "info"',
            strategy: '精确匹配',
          },
          {
            id: 'e2',
            range: { start: 30, end: 31, unit: 'lines' },
            before: 'retries = 3\ntimeout = 10',
            after: 'retries = 5\ntimeout = 30',
            strategy: '忽略缩进',
            truncated: true,
          },
        ],
      },
    },
  },
  {
    title: '应用补丁 · 多文件含冲突',
    tool: {
      id: 'd-patch',
      name: 'apply_patch',
      displayName: '应用补丁',
      subject: '3 个文件',
      category: 'write',
      status: 'partial',
      summary: '示例 · 2 个已应用，1 个冲突',
      detail: {
        kind: 'patch',
        revision: 'r12',
        files: [{ ...configDiff, status: 'applied' }, reportDiff, legacyDiff],
      },
    },
  },
  {
    title: '管理文件 · 含删除',
    tool: {
      id: 'd-manage',
      name: 'manage_files',
      displayName: '管理文件',
      subject: '3 项操作',
      category: 'write',
      status: 'waiting-approval',
      detail: {
        kind: 'manage-files',
        hasMore: true,
        operations: [
          {
            id: 'm1',
            type: 'mkdir',
            source: 'out/figures',
            status: 'completed',
          },
          {
            id: 'm2',
            type: 'move',
            source: 'notes/draft.md',
            target: 'docs/reef/notes.md',
            status: 'pending',
          },
          {
            id: 'm3',
            type: 'delete',
            source: 'tmp/cache',
            recursive: true,
            status: 'pending',
          },
        ],
      },
    },
  },
];

const commandTools: Array<{ title: string; tool: ToolCallView }> = [
  {
    title: '命令 · 运行中',
    tool: {
      id: 'd-cmd-running',
      name: 'run_command',
      displayName: '执行命令',
      subject: 'python classify.py --input ./images',
      category: 'execute',
      status: 'running',
      elapsedMs: 8400,
      authorization: { decision: 'approved', source: '命中常用命令规则' },
      detail: {
        kind: 'command',
        command: 'python classify.py --input ./images --model coralnet-v2 --batch-size 8',
        cwd: '/workspace/reef',
        shell: 'bash',
        timeoutMs: 600_000,
        execution: 'running',
        terminalId: 'term-a',
        sandboxed: true,
        output: {
          kind: 'terminal',
          content: 'Loading model…\nProcessing image 1/3\nProcessing image 2/3',
          status: 'partial',
        },
      },
    },
  },
  {
    title: '命令 · 已返回，退出码非零',
    tool: {
      id: 'd-cmd-failed',
      name: 'run_command',
      displayName: '执行命令',
      subject: 'python verify.py',
      category: 'execute',
      status: 'failed',
      summary: 'exit 1',
      elapsedMs: 3100,
      detail: {
        kind: 'command',
        command: 'python verify.py',
        cwd: '/workspace/reef',
        shell: 'bash',
        execution: 'returned',
        exitCode: 1,
        sandboxed: false,
        output: {
          kind: 'terminal',
          content: '$ python verify.py\n[INFO] running checks…\n[ERROR] 1 failed assertion (示例)',
        },
      },
    },
  },
  {
    title: '命令 · 后台仍在运行',
    tool: {
      id: 'd-cmd-bg',
      name: 'run_command',
      displayName: '执行命令',
      subject: 'npm run dev',
      category: 'execute',
      status: 'completed',
      summary: '调用已返回，进程仍在终端中',
      detail: {
        kind: 'command',
        command: 'npm run dev',
        cwd: '/workspace/app',
        execution: 'background',
        terminalId: 'term-b',
        output: {
          kind: 'terminal',
          content: 'VITE ready (示例)',
          status: 'partial',
        },
      },
    },
  },
  {
    title: '命令 · 超时',
    tool: {
      id: 'd-cmd-timeout',
      name: 'run_command',
      displayName: '执行命令',
      subject: 'pytest -q',
      category: 'execute',
      status: 'timed-out',
      elapsedMs: 120_000,
      detail: {
        kind: 'command',
        command: 'pytest -q',
        timeoutMs: 120_000,
        execution: 'timed-out',
        output: {
          kind: 'terminal',
          content: '.......(示例输出被截断)',
          truncated: 'execution',
        },
      },
    },
  },
];

const otherTools: Array<{ title: string; tool: ToolCallView }> = [
  {
    title: 'MCP · 结果待确认，目录已变化',
    tool: {
      id: 'd-mcp',
      name: 'mcp.execute',
      displayName: 'MCP 工具',
      subject: 'specimens · analyze',
      category: 'network',
      status: 'unknown',
      summary: '远端结果待确认',
      detail: {
        kind: 'mcp',
        server: 'specimens',
        tool: 'analyze',
        endpoint: 'wzrhinelab://specimens/v1/analyze',
        catalogRevision: 'cat-12',
        catalogStale: true,
        arguments: {
          type: 'dataset',
          id: 'sp-001',
          options: { depth: 2, note: '示例参数' },
        },
        remote: 'unknown',
      },
    },
  },
  {
    title: '原生模型 · 部分材料已保存',
    tool: {
      id: 'd-model',
      name: 'models_generate_images',
      displayName: '生成图片',
      subject: '珊瑚分布示意图',
      category: 'model',
      status: 'partial',
      detail: {
        kind: 'model',
        provider: 'sample-provider',
        model: 'sample-image-model',
        purpose: '生成示意图（示例）',
        inputs: [
          {
            id: 'i1',
            label: 'reef_map.png',
            size: 248_000,
            mimeType: 'image/png',
            destination: 'sample-provider',
          },
        ],
        params: { size: '1024x1024', count: 2, seed: 7 },
        results: [
          { id: 'r1', label: 'figure-1.png', saved: true },
          { id: 'r2', label: 'figure-2.png', saved: false },
        ],
        save: 'partial',
        costNotice: '示例：模型调用可能产生费用；重新保存不会再次计费。',
      },
    },
  },
  {
    title: '问卷',
    tool: {
      id: 'd-question',
      name: 'ask_question',
      displayName: '询问你',
      subject: '输出形式',
      category: 'question',
      status: 'completed',
      detail: {
        kind: 'question',
        questionnaireId: 'q-1',
        count: 3,
        answers: [
          { question: '分类结果以哪种形式交付？', answer: '表格' },
          { question: '包含内容', answer: '包含数据表、包含结论' },
          { question: '补充说明', skipped: true },
        ],
      },
    },
  },
  {
    title: '子任务',
    tool: {
      id: 'd-agent',
      name: 'spawn_agent',
      displayName: '创建子任务',
      subject: '文件核查',
      category: 'agent',
      status: 'waiting-children',
      detail: {
        kind: 'agent',
        agentName: '文件核查',
        task: '检查输入文件完整性（示例）',
        childConversationId: 'c-child-1',
      },
    },
  },
  {
    title: '未知工具 · 通用详情',
    tool: {
      id: 'd-generic',
      name: 'lab.measure_sample',
      subject: 'sample-042',
      category: 'other',
      status: 'completed',
      summary: '示例 · 返回 3 项',
      detail: {
        kind: 'generic',
        input: { sample: 'sample-042', mode: 'quick' },
        output: {
          kind: 'list',
          content: 'ph: 8.1（示例）\ntemperature: 26.4（示例）\nsalinity: 35（示例）',
          total: 3,
          totalUnit: 'items',
        },
      },
    },
  },
];

const outputs: Array<{ title: string; output: ToolOutputView }> = [
  {
    title: '文本',
    output: {
      kind: 'text',
      summary: '示例 · 2 行',
      content: '分类完成：鹿角珊瑚 12，脑珊瑚 7（示例数据）。\n结果已写入 out/classification_results.csv。',
    },
  },
  {
    title: 'JSON',
    output: {
      kind: 'json',
      summary: '示例',
      content: '{"species":"staghorn","count":12,"confidence":"示例"}',
    },
  },
  {
    title: '终端',
    output: {
      kind: 'terminal',
      content: '$ ls out\nclassification_results.csv\nreef_report.md',
    },
  },
  {
    title: '执行截断',
    output: {
      kind: 'terminal',
      content: 'line 1\nline 2\n… (示例)',
      truncated: 'execution',
      total: 20_000,
      totalUnit: 'lines',
    },
  },
  { title: '空输出', output: { kind: 'empty' } },
  {
    title: '错误',
    output: {
      kind: 'error',
      error: 'PermissionError: /workspace/secret（示例）',
      content: 'Traceback (most recent call last):\n  File "run.py", line 3',
    },
  },
  { title: '加载中', output: { kind: 'text', status: 'loading' } },
  { title: '不可用', output: { kind: 'text', status: 'unavailable' } },
];

/** Simulated adapter latency for the lazy-loading demos (the components never time anything). */
const ADAPTER_DELAY = 700;

function useTimers() {
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  return (fn: () => void, ms = ADAPTER_DELAY) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
}

const extraTool: ToolCallView = {
  id: 'op-6',
  sequence: 8,
  name: 'find_files',
  displayName: '查找文件',
  subject: '**/*.png',
  category: 'read',
  status: 'completed',
  summary: '示例 · 19 个文件',
  elapsedMs: 340,
  detail: {
    kind: 'generic',
    input: { glob: '**/*.png' },
    output: {
      kind: 'list',
      content: 'images/R-01.png\nimages/R-02.png\nimages/R-03.png',
      truncated: 'display',
      total: 19,
      totalUnit: 'items',
    },
  },
};

function LiveActivityDemo() {
  const later = useTimers();
  const [tools, setTools] = React.useState<ToolCallView[]>(sampleTools);
  const historyLink = () => {
    const trigger = document.querySelector<HTMLButtonElement>('#tools-history .rl-agent-history__trigger');
    trigger?.scrollIntoView({ block: 'center' });
    trigger?.focus();
  };
  const added = tools.some((t) => t.id === extraTool.id);
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <Button size="sm" variant="secondary" disabled={added} onClick={() => setTools((list) => [...list, extraTool])}>
          新到一条工具记录（示例）
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setTools((list) => list.map((t) => (t.id === 'op-2' ? { ...t, status: 'running', elapsedMs: 8400 } : t)));
            later(() =>
              setTools((list) =>
                list.map((t) =>
                  t.id === 'op-2'
                    ? {
                        ...t,
                        status: 'completed',
                        summary: '示例 · exit 0',
                        elapsedMs: 9100,
                      }
                    : t,
                ),
              ),
            );
          }}
        >
          让「执行命令」完成（示例）
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setTools(sampleTools)}>
          重置
        </Button>
      </div>
      <ToolActivity tools={tools} elapsedMs={18_400} onOpenHistory={historyLink} />
      <p className="sc-small">展开某行后再让状态变化：展开状态保持；新到的行只播放一次入场。</p>
    </div>
  );
}

const lazyBase: ToolCallView = {
  id: 'lazy-1',
  name: 'read_tool_output',
  displayName: '读取工具材料',
  subject: 'op-2 · 完整输出',
  category: 'read',
  status: 'completed',
  summary: '示例 · 仅摘要已加载',
  detailsLoaded: false,
};

function LazyRecordDemo() {
  const later = useTimers();
  const [tool, setTool] = React.useState<ToolCallView>(lazyBase);
  const [resetKey, setResetKey] = React.useState(0);
  const [failNext, setFailNext] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const load = (id: string) => {
    setError(undefined);
    later(() => {
      if (failNext) {
        setFailNext(false);
        setError('示例：完整记录读取失败（模拟适配器错误）');
        return;
      }
      setTool((t) =>
        t.id === id
          ? {
              ...t,
              detailsLoaded: true,
              authorization: { decision: 'auto', source: '只读自动允许' },
              detail: {
                kind: 'generic',
                input: { operation: 'op-2', offset: 0 },
                output: {
                  kind: 'terminal',
                  content: 'Loading model…\nProcessing image 1/3\nProcessing image 2/3\nProcessing image 3/3\nDone (示例)',
                },
              },
            }
          : t,
      );
    });
  };
  return (
    <div className="sc-card-list" data-testid="lazy-record">
      <ToolRecord key={resetKey} tool={tool} onLoadDetails={load} detailsError={error} />
      <div className="sc-row">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setTool({ ...lazyBase });
            setError(undefined);
            setResetKey((k) => k + 1);
          }}
        >
          重置为未加载
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFailNext(true)} disabled={failNext}>
          下次加载失败（示例）
        </Button>
      </div>
    </div>
  );
}

/** Sample stored material (示例): 3 pages of 40 lines each; the "adapter" returns the next offset. */
const MATERIAL_LINES = Array.from({ length: 104 }, (_, i) => `R-${String(i + 1).padStart(3, '0')}.png, 示例分类 ${['珊瑚', '海绵', '藻类'][i % 3]}`);
const PAGE_SIZE = 40;

function readMaterialPage(offset: number, failOnce: boolean): MaterialPageView {
  if (failOnce) return { offset, length: 0, unit: 'lines', total: MATERIAL_LINES.length, complete: false, status: 'error', reason: '示例：快照读取超时' };
  const slice = MATERIAL_LINES.slice(offset, offset + PAGE_SIZE);
  const end = offset + slice.length;
  const complete = end >= MATERIAL_LINES.length;
  return {
    offset,
    length: slice.length,
    total: MATERIAL_LINES.length,
    unit: 'lines',
    complete,
    nextOffset: complete ? undefined : end,
    content: slice.join('\n'),
    status: 'ready',
  };
}

/** ChunkPager with a host-side offset history (the component never computes offsets). */
function ChunkPagerDemo() {
  const later = useTimers();
  const [history, setHistory] = React.useState<number[]>([]);
  const [page, setPage] = React.useState<MaterialPageView>(() => readMaterialPage(0, false));
  const [failNext, setFailNext] = React.useState(false);
  const [newer, setNewer] = React.useState(false);
  const go = (offset: number, nextHistory: number[]) => {
    setHistory(nextHistory);
    setPage((p) => ({ ...p, offset, status: 'loading', content: undefined }));
    const fail = failNext;
    setFailNext(false);
    later(() => setPage(readMaterialPage(offset, fail)), 400);
  };
  return (
    <div className="sc-card-list" data-testid="chunk-pager">
      <ChunkPager
        page={page}
        label="示例清单 manifest.csv"
        canGoBack={history.length > 0}
        onFirst={() => go(0, [])}
        onPrevious={() => go(history[history.length - 1] ?? 0, history.slice(0, -1))}
        onNext={(next) => go(next, [...history, page.offset].slice(-32))}
        onRetry={() => go(page.offset, history)}
        newer={newer}
        onReadLatest={() => {
          setNewer(false);
          go(0, []);
        }}
      />
      <div className="sc-row">
        <Button size="sm" variant="ghost" onClick={() => setFailNext(true)} disabled={failNext}>
          下次翻页失败（示例）
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNewer(true)} disabled={newer}>
          模拟有更新的快照（示例）
        </Button>
      </div>
    </div>
  );
}

function DisplayTruncatedDemo() {
  const later = useTimers();
  const [lines, setLines] = React.useState(6);
  const [busy, setBusy] = React.useState(false);
  const total = 18;
  const content = Array.from({ length: lines }, (_, i) => `images/R-${String(i + 1).padStart(2, '0')}.png  示例`).join('\n');
  return (
    <div data-testid="display-truncated">
      <ToolOutput
        output={{
          kind: 'terminal',
          summary: '示例 · 文件清单',
          content,
          truncated: lines < total ? 'display' : undefined,
          total,
          totalUnit: 'lines',
        }}
        loadingMore={busy}
        onLoadMore={() => {
          setBusy(true);
          later(() => {
            setLines((n) => Math.min(total, n + 6));
            setBusy(false);
          }, 400);
        }}
        onOpenFull={() => setLines(total)}
      />
    </div>
  );
}

const historyPages: ToolCallView[][] = [
  [
    {
      id: 'h-1',
      sequence: 1,
      name: 'read_file',
      displayName: '读取文件',
      subject: 'data/reef/manifest.csv',
      category: 'read',
      status: 'completed',
      summary: '示例 · 1.2 KB',
      detail: { kind: 'file-read', path: 'data/reef/manifest.csv', eof: true },
    },
    {
      id: 'h-2',
      sequence: 2,
      name: 'find_files',
      displayName: '查找文件',
      subject: '**/*.png',
      category: 'read',
      status: 'completed',
      summary: '示例 · 19 个文件',
    },
    {
      id: 'h-3',
      sequence: 3,
      name: 'run_command',
      displayName: '执行命令',
      subject: 'python classify.py',
      category: 'execute',
      status: 'completed',
      summary: '示例 · exit 0',
    },
  ],
  [
    // h-3 is replayed by the second page: it must not appear twice.
    {
      id: 'h-3',
      sequence: 3,
      name: 'run_command',
      displayName: '执行命令',
      subject: 'python classify.py',
      category: 'execute',
      status: 'completed',
      summary: '示例 · exit 0（重复）',
    },
    {
      id: 'h-4',
      sequence: 4,
      name: 'edit_file',
      displayName: '编辑文件',
      subject: 'src/config.py',
      category: 'write',
      status: 'denied',
      summary: '用户已拒绝',
    },
    {
      id: 'h-5',
      sequence: 5,
      name: 'mcp.execute',
      displayName: 'MCP 工具',
      subject: 'specimens · analyze',
      category: 'network',
      status: 'unknown',
      summary: '远端结果待确认',
    },
  ],
  [
    {
      id: 'h-6',
      sequence: 6,
      name: 'write_file',
      displayName: '写入文件',
      subject: 'out/reef_report.md',
      category: 'write',
      status: 'completed',
      summary: '示例 · 新建文件',
    },
  ],
];

function HistoryDemo() {
  const later = useTimers();
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [failNext, setFailNext] = React.useState(false);
  const items = historyPages.slice(0, pages).flat();
  return (
    <div className="sc-card-list" id="tools-history">
      <ToolHistory
        items={items}
        total={6}
        hasMore={pages < historyPages.length}
        loading={loading}
        error={error || undefined}
        onLoadMore={() => {
          setLoading(true);
          setError(false);
          later(() => {
            setLoading(false);
            if (failNext) {
              setFailNext(false);
              setError(true);
              return;
            }
            setPages((n) => n + 1);
          }, 500);
        }}
        onOpenOperation={() => {}}
      />
      <div className="sc-row">
        <Button size="sm" variant="ghost" disabled={failNext} onClick={() => setFailNext(true)}>
          下次加载失败（示例）
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPages(1);
            setError(false);
          }}
        >
          重置
        </Button>
      </div>
      <p className="sc-small">第 2 页重复返回 h-3（示例）：列表按 id 去重，已读行的位置不变。</p>
    </div>
  );
}

function DetailList({ items, idPrefix }: { items: Array<{ title: string; tool: ToolCallView }>; idPrefix: string }) {
  return (
    <div className="sc-card-list" role="group" aria-label={`${idPrefix}（示例）`}>
      {items.map(({ title, tool }) => (
        <div key={tool.id} className="sc-card-list">
          <p className="sc-small">{title}（示例）</p>
          <ToolRecord
            tool={tool}
            defaultExpanded
            detailActions={{
              onReadMore: () => {},
              onReload: () => {},
              onViewFull: () => {},
              onLoadMoreOperations: () => {},
              onOpenTerminal: () => {},
              onReconcile: () => {},
              onRetrySave: () => {},
              onOpenChild: () => {},
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The page-level overflow test only whitelists `.sc-table-wrap` ancestors; tool components keep
 * wide code inside their own scroll regions, so this wrapper never scrolls itself. The padding
 * keeps focus rings of full-width rows unclipped.
 */
function Wide({ children }: { children: React.ReactNode }) {
  return (
    <div className="sc-table-wrap" style={{ padding: 'var(--rl-space-1)', background: 'none' }}>
      {children}
    </div>
  );
}

export function AgentToolsPage() {
  return (
    <div className="sc-page">
      <PageHeader index="AG-03" section="Agent UI" title="Tools">
        <p>
          工具与执行：工具活动分组、单次工具记录、Code Mode
          嵌套调用树、工具输出、完整工具记录、文件差异与各类工具详情。页面上的路径、命令、版本与输出均为示例数据。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="tools-activity"
          index="11"
          title="ToolActivity"
          description="一轮工具调用：数量、进行中数量、用时与状态统计；进行中时默认展开。行按 id 去重、按 sequence 排序。"
          note="折叠高度：Collapsible（CSS，可中断）；新行 AgentEntrance row，错峰 24ms、封顶 120ms；一次到达超过 20 行不播放。"
        >
          <Wide>
            <LiveActivityDemo />
          </Wide>
        </Specimen>
        <Specimen
          id="tools-lazy"
          index="12"
          title="ToolRecord · 延迟加载"
          span="half"
          description="仅有摘要的记录：展开时请求完整记录（示例适配器延迟 0.7s），加载中显示骨架；失败可重试。"
        >
          <Wide>
            <LazyRecordDemo />
          </Wide>
        </Specimen>
        <Specimen
          id="tools-tree"
          index="13"
          title="CodeModeToolTree"
          span="half"
          description="父任务与派生调用：嵌套列表 + 连接线；子操作各自保留状态，结果行由子操作计算。"
        >
          <Wide>
            <CodeModeToolTree root={codeModeTool} onViewScript={() => {}} />
          </Wide>
        </Specimen>
        <Specimen
          id="tools-details-files"
          index="37–41"
          title="文件类工具详情"
          description="读取、写入、编辑、补丁与文件管理。每行默认展开，展开按钮仍可折叠。"
        >
          <Wide>
            <DetailList items={detailTools} idPrefix="文件类工具" />
          </Wide>
        </Specimen>
        <Specimen
          id="tools-details-command"
          index="42"
          title="RunCommandDetail"
          span="half"
          description="调用返回 ≠ 进程结束；非零退出码、非沙箱与停止未确认都写成文字。"
        >
          <Wide>
            <DetailList items={commandTools} idPrefix="命令工具" />
          </Wide>
        </Specimen>
        <Specimen
          id="tools-details-other"
          index="43–44"
          title="MCP、模型、问卷、子任务与通用"
          span="half"
          description="远端结果未知时提示核对；模型保存部分完成时只重新保存，不再次调用。"
        >
          <Wide>
            <DetailList items={otherTools} idPrefix="其他工具" />
          </Wide>
        </Specimen>
        <Specimen
          id="tools-output"
          index="45"
          title="ToolOutput"
          description="有界预览（内部滚动，可用键盘聚焦滚动）。展示截断与执行截断文案不同，不混用。"
        >
          <Wide>
            <div className="sc-card-list">
              <p className="sc-small">展示截断（示例）：可继续加载或查看完整输出。</p>
              <DisplayTruncatedDemo />
              {outputs.map(({ title, output }) => (
                <div key={title} className="sc-card-list" data-testid={`output-${title}`}>
                  <p className="sc-small">{title}（示例）</p>
                  <ToolOutput output={output} />
                </div>
              ))}
            </div>
          </Wide>
        </Specimen>
        <Specimen
          id="tools-pager"
          index="45"
          title="ChunkPager"
          description="分页读取已保存的材料：范围「第 a–b 行 / N」、已读至末尾 / 片段；下一页只在运行时给出 nextOffset 时可用，上一页依赖宿主的偏移历史。不能操作的按钮保留焦点并说明原因。"
          note="示例适配器延迟 0.4s；加载时 Skeleton，失败显示原因与重试。"
        >
          <Wide>
            <ChunkPagerDemo />
          </Wide>
        </Specimen>
        <Specimen
          id="tools-diff"
          index="31"
          title="DiffPreview"
          description="行号 · 符号列（+/−，读屏读作新增/删除）· 代码；增删行同时有符号与底色。代码区在自身内部横向滚动。"
        >
          <Wide>
            <div className="sc-card-list" data-testid="diff-specimens">
              <p className="sc-small">待批准（示例）</p>
              <DiffPreview diff={configDiff} />
              <p className="sc-small">版本冲突（示例）</p>
              <DiffPreview diff={legacyDiff} onReload={() => {}} />
              <p className="sc-small">截断（示例）</p>
              <DiffPreview diff={truncatedDiff} onViewFull={() => {}} />
              <p className="sc-small">二进制与移动（示例）</p>
              <DiffPreview diff={binaryDiff} />
              <DiffPreview diff={movedDiff} />
              <p className="sc-small">由 before / after 计算的预览（示例）</p>
              <DiffPreview path="notes/summary.md" before={'# 摘要\n样本 18 张\n待核对'} after={'# 摘要\n样本 19 张\n已核对'} />
              <p className="sc-small">多文件（示例）</p>
              <MultiFileDiff files={[configDiff, reportDiff, legacyDiff]} />
            </div>
          </Wide>
        </Specimen>
        <Specimen
          id="tools-history-specimen"
          index="46"
          title="ToolHistory"
          description="完整工具记录：分页加载（示例延迟 0.5s）；跨页按 id 去重，追加不重排已读行；失败时保留已加载记录。"
        >
          <Wide>
            <HistoryDemo />
          </Wide>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
