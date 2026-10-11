import * as React from 'react';
import type { ActionStatus, CitationView, MessagePartView, MessageView, RunPhase, RunView, SyncStatus, ThinkingView } from '@wzrhine/agent';
import { AgentMessage, AgentProcess, CitationChip, CodeBlock, JumpToLatest, MessageList, MessagePart, RunStatus, ThinkingBlock } from '@wzrhine/agent';
import type { MessageListHandle } from '@wzrhine/agent';
import { Button } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { sampleMessages, sampleRun } from '../../../../packages/agent/src/fixtures/session';

/*
 * Message family showcase (atlas 05–10, 32, 35). Every value on this page is sample data (示例):
 * texts, timings, token counts and sources are illustrative, never live measurements.
 */

const t = (minute: number) => `2026-10-11T14:${String(minute).padStart(2, '0')}:00+08:00`;

const STREAM_TEXT = '（示例流式文本）分类脚本已处理 3 张图像。鹿角珊瑚占比较高，脑珊瑚次之；置信度为示例值，不代表真实监测结果。接下来会把配置中的调试开关关闭并重新运行一次校验。';

const olderMessages: MessageView[] = Array.from({ length: 4 }, (_, i) => ({
  id: `old-${i}`,
  role: i % 2 === 0 ? 'user' : 'assistant',
  author: i % 2 === 0 ? '你' : 'Research agent',
  createdAt: t(10 + i),
  status: 'complete',
  parts: [{ type: 'text', id: `old-${i}-p`, text: `更早的示例消息 ${i + 1}：上一轮关于样本目录结构的讨论。` }],
}));

function cloneMessages(): MessageView[] {
  return sampleMessages.map((m) => ({ ...m, parts: [...m.parts] }));
}

/** Live-ish list: streaming is driven by an interval the user starts; it stops itself. */
function ListDemo() {
  const listRef = React.useRef<MessageListHandle>(null);
  const [messages, setMessages] = React.useState<MessageView[]>(cloneMessages);
  const [streaming, setStreaming] = React.useState(false);
  const [hasEarlier, setHasEarlier] = React.useState(true);
  const [loadingEarlier, setLoadingEarlier] = React.useState(false);
  const [following, setFollowing] = React.useState(true);
  const [lastAction, setLastAction] = React.useState('');
  const timer = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const counter = React.useRef(0);

  React.useEffect(() => () => clearInterval(timer.current), []);

  const startStream = () => {
    if (timer.current) return;
    const id = `stream-${(counter.current += 1)}`;
    setMessages((list) => [
      ...list.map((m) => (m.status === 'streaming' ? { ...m, status: 'complete' as const, parts: m.parts.filter((p) => p.type !== 'status') } : m)),
      {
        id,
        role: 'assistant',
        author: 'Research agent',
        createdAt: t(22),
        status: 'streaming',
        parts: [
          { type: 'status', id: `${id}-s`, status: 'running', phase: 'responding' },
          { type: 'markdown', id: `${id}-p`, source: '', streaming: true },
        ],
      },
    ]);
    setStreaming(true);
    let length = 0;
    timer.current = setInterval(() => {
      length += 4;
      const done = length >= STREAM_TEXT.length;
      setMessages((list) =>
        list.map((m) =>
          m.id !== id
            ? m
            : {
                ...m,
                status: done ? 'complete' : 'streaming',
                parts: done
                  ? [{ type: 'markdown', id: `${id}-p`, source: STREAM_TEXT }]
                  : [m.parts[0]!, { type: 'markdown', id: `${id}-p`, source: STREAM_TEXT.slice(0, length), streaming: true }],
                usage: done ? { output: 96, total: 96, completeness: 'estimated' } : undefined,
              },
        ),
      );
      if (done) {
        clearInterval(timer.current);
        timer.current = undefined;
        setStreaming(false);
      }
    }, 120);
  };

  const addUser = () => {
    counter.current += 1;
    setMessages((list) => [
      ...list,
      { id: `u-${counter.current}`, role: 'user', author: '你', createdAt: t(23), status: 'complete', parts: [{ type: 'text', id: `u-${counter.current}-p`, text: `示例追问 ${counter.current}：把结果整理成表格。` }] },
    ]);
  };

  const addAssistant = () => {
    counter.current += 1;
    setMessages((list) => [
      ...list,
      { id: `a-${counter.current}`, role: 'assistant', author: 'Research agent', createdAt: t(23), status: 'complete', parts: [{ type: 'text', id: `a-${counter.current}-p`, text: `示例回复 ${counter.current}：已追加一条新消息。` }] },
    ]);
  };

  const loadEarlier = () => {
    setLoadingEarlier(true);
    setTimeout(() => {
      setMessages((list) => [...olderMessages, ...list]);
      setLoadingEarlier(false);
      setHasEarlier(false);
    }, 400);
  };

  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <Button size="sm" variant="secondary" onClick={startStream} disabled={streaming}>
          模拟流式
        </Button>
        <Button size="sm" variant="secondary" onClick={addAssistant}>
          追加助手消息
        </Button>
        <Button size="sm" variant="secondary" onClick={addUser}>
          发送示例消息
        </Button>
        <Button size="sm" variant="ghost" onClick={() => listRef.current?.scrollToLatest()}>
          scrollToLatest()
        </Button>
        <span className="sc-small" data-testid="follow-state">
          {following ? '跟随最新' : '阅读历史'}
        </span>
      </div>
      <div data-testid="message-list-demo" style={{ height: '28rem', border: 'var(--rl-border-width) solid var(--rl-border-default)', borderRadius: 'var(--rl-radius-md)', background: 'var(--rl-bg-canvas)' }}>
        <MessageList
          ref={listRef}
          messages={messages}
          isStreaming={streaming}
          hasEarlier={hasEarlier}
          onLoadEarlier={loadEarlier}
          loadingEarlier={loadingEarlier}
          onFollowChange={setFollowing}
          messageProps={{
            onRegenerate: (id) => setLastAction(`重新生成 ${id}`),
            onEdit: (id) => setLastAction(`编辑 ${id}`),
            onFeedback: (id, value) => setLastAction(`反馈 ${id}：${value ?? '取消'}`),
          }}
        />
      </div>
      <p className="sc-small" aria-live="polite">
        {lastAction ? `最近一次操作（示例回调）：${lastAction}` : '操作回调会显示在这里（示例）。'}
      </p>
    </div>
  );
}

const firstTool = sampleRun.calls![0]!.blocks.flatMap((b) => (b.type === 'tool' ? [b.tool] : []))[0]!;

const specimenParts: Array<{ label: string; part: MessagePartView }> = [
  { label: 'text', part: { type: 'text', id: 'sp-text', text: '纯文本保留换行：\n第二行（示例）。' } },
  {
    label: 'markdown（无 renderer：安全纯文本兜底）',
    part: { type: 'markdown', id: 'sp-md', source: '**加粗标记**按原样显示，<b>HTML</b> 不被解析。\n\n```python\nresults = model.predict(images)  # 示例：一行足够长的代码，用于验证窄屏时代码块在内部横向滚动\n```' },
  },
  { label: 'code', part: { type: 'code', id: 'sp-code', language: 'typescript', filename: 'classify.ts', code: "const files = await tools.find_files({ glob: '**/*.png' });\nconsole.log(files.length); // 示例" } },
  {
    label: 'image',
    part: {
      type: 'image',
      id: 'sp-img',
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23e9e8e1'/%3E%3Cpath d='M20 70 60 30l30 30 20-20 30 30' fill='none' stroke='%23505850' stroke-width='3'/%3E%3C/svg%3E",
      alt: '示例折线示意图',
      caption: '图 1 · 示例图像（内联 SVG）',
      width: 160,
      height: 90,
    },
  },
  { label: 'thinking', part: { type: 'thinking', id: 'sp-th', thinking: { id: 'sp-th', label: '思考 1', status: 'completed', summary: '先读取样本清单（示例）。', elapsedMs: 4200 } } },
  { label: 'tool-call（fallback）', part: { type: 'tool-call', id: 'sp-tool', tool: firstTool } },
  { label: 'attachment', part: { type: 'attachment', id: 'sp-att', attachment: { id: 'a', name: 'reef_images.zip', kind: 'file', size: 12_400_000, status: 'uploading', progress: 0.42 } } },
  { label: 'reference', part: { type: 'reference', id: 'sp-ref', reference: { id: 'r', kind: 'file', label: 'classify.py', detail: 'src/classify.py', status: 'stale', reason: '示例：文件已变化' } } },
  { label: 'citation', part: { type: 'citation', id: 'sp-cite', citation: { id: 'c', index: 3, title: '示例数据集', sourceType: 'dataset', locator: 'datasets/reef-v1' } } },
  { label: 'artifact（fallback）', part: { type: 'artifact', id: 'sp-art', artifact: { id: 'art', title: 'reef_report.md', kind: 'markdown', status: 'partial', reason: '示例：本地保存未完成' } } },
  { label: 'status', part: { type: 'status', id: 'sp-st', status: 'running', phase: 'thinking' } },
  {
    label: 'error',
    part: {
      type: 'error',
      id: 'sp-err',
      error: {
        id: 'err-1',
        kind: 'retryable',
        title: '模型请求失败（示例）',
        message: '连接在回答中途断开。',
        code: 'E_STREAM',
        preserved: ['已生成的部分回答', '输入草稿'],
        actions: [
          { id: 'retry', label: '重试此回答', tone: 'primary' },
          { id: 'copy', label: '复制错误信息' },
        ],
      },
    },
  },
  { label: 'custom（未注册 renderer）', part: { type: 'custom', id: 'sp-custom', renderer: 'chart', payload: { series: 3 }, summary: '图表：3 组示例数据' } },
  { label: '未知类型（未来版本）', part: { type: 'hologram', id: 'sp-unknown', summary: '示例：本版本不认识的内容类型' } as unknown as MessagePartView },
];

function PartsSpecimen() {
  const [log, setLog] = React.useState('');
  return (
    <div className="sc-card-list">
      {specimenParts.map(({ label, part }) => (
        <div key={part.id} data-testid={`part-${part.id}`} style={{ display: 'grid', gap: 'var(--rl-space-1)', minWidth: 0 }}>
          <span className="sc-small">{label}</span>
          <MessagePart part={part} onRecoveryAction={(errorId, actionId) => setLog(`${errorId} → ${actionId}`)} onOpenCitation={(c) => setLog(`打开引用 ${c.index}`)} />
        </div>
      ))}
      <p className="sc-small" aria-live="polite">
        {log ? `回调（示例）：${log}` : '点击 error 动作或引用，回调显示在这里。'}
      </p>
    </div>
  );
}

const failedMessage: MessageView = {
  id: 'f-1',
  role: 'assistant',
  author: 'Research agent',
  createdAt: t(24),
  status: 'failed',
  parts: [{ type: 'text', id: 'f-1-p', text: '已完成样本读取（示例），随后连接中断。' }],
  usage: { output: 340, total: 340, completeness: 'partial', note: '示例：服务商未返回完整统计' },
};

function RolesSpecimen() {
  const [retried, setRetried] = React.useState(0);
  return (
    <div className="sc-card-list" style={{ gap: 'var(--rl-space-6)' }}>
      <AgentMessage message={sampleMessages[0]!} onEdit={() => undefined} />
      <AgentMessage message={{ ...sampleMessages[2]!, id: 'edited', edited: true }} />
      <AgentMessage message={{ id: 'sys', role: 'system', status: 'complete', createdAt: t(21), parts: [{ type: 'text', id: 'sys-p', text: '已从「海洋塑料样本分析」分叉（示例）' }] }} />
      <AgentMessage message={sampleMessages[1]!} model="sample-model" onRegenerate={() => undefined} onFork={() => undefined} onFeedback={() => undefined} />
      <div data-testid="failed-message">
        <AgentMessage message={failedMessage} onRetry={() => setRetried((n) => n + 1)} />
      </div>
      <p className="sc-small" aria-live="polite">
        {retried > 0 ? `已触发重试 ${retried} 次（示例回调）` : '失败消息的「重试」只在提供 onRetry 时出现。'}
      </p>
      <AgentMessage message={{ ...failedMessage, id: 'int', status: 'interrupted', usage: undefined }} />
      <AgentMessage message={{ ...failedMessage, id: 'can', status: 'cancelled', usage: undefined }} />
      <AgentMessage message={{ ...sampleMessages[0]!, id: 'send-failed', status: 'failed', parts: [sampleMessages[0]!.parts[0]!] }} onRetry={() => undefined} />
      <AgentMessage message={{ id: 'inh', role: 'assistant', author: 'Research agent', status: 'complete', inherited: true, parts: [{ type: 'text', id: 'inh-p', text: '来自父会话的历史回答（示例，只读）。' }] }} />
    </div>
  );
}

function CopySpecimen() {
  return (
    <div className="sc-card-list" data-testid="copy-specimen">
      <AgentMessage message={{ id: 'copy-me', role: 'assistant', author: 'Research agent', status: 'complete', parts: [{ type: 'text', id: 'copy-me-p', text: '可复制的示例回答。' }] }} />
      <CodeBlock code={'pnpm test\npnpm build'} language="bash" showLineNumbers />
      <CodeBlock code={Array.from({ length: 30 }, (_, i) => `line ${i + 1} // 示例`).join('\n')} filename="long.log" maxHeight="8rem" />
    </div>
  );
}

const thinkingStates: Array<{ label: string; thinking: ThinkingView; expanded?: boolean }> = [
  { label: '折叠 · 流式（最新一行预览）', thinking: { id: 'th-a', label: '思考 2', status: 'streaming', latestLine: '正在核对分类脚本的输入目录与样本清单是否一致，这一行足够长以验证右侧始终显示最新文字（示例）', elapsedMs: 12_400 } },
  { label: '展开 · 已结束', thinking: { id: 'th-b', label: '思考 1', status: 'completed', summary: '先读取样本清单，确认图片数量与字段（示例）。\n\n然后运行分类脚本。', elapsedMs: 4200 }, expanded: true },
  { label: '已中断', thinking: { id: 'th-c', label: '思考 3', status: 'interrupted', summary: '连接中断前的部分摘要（示例）。', elapsedMs: 900 } },
  { label: '截取 · 查看完整记录', thinking: { id: 'th-d', label: '思考 4', status: 'completed', summary: '只展示前 2 段摘要（示例）。', truncated: true, elapsedMs: 31_000 }, expanded: true },
];

function ThinkingSpecimen() {
  const [opened, setOpened] = React.useState('');
  return (
    <div className="sc-card-list">
      {thinkingStates.map(({ label, thinking, expanded }) => (
        <div key={thinking.id} style={{ display: 'grid', gap: 'var(--rl-space-1)', minWidth: 0 }}>
          <span className="sc-small">{label}</span>
          <ThinkingBlock thinking={thinking} defaultExpanded={expanded} onOpenFull={(id) => setOpened(id)} />
        </div>
      ))}
      <p className="sc-small" aria-live="polite">
        {opened ? `onOpenFull(${opened})（示例回调）` : 'ThinkingBlock 默认折叠；Enter / Space 切换。'}
      </p>
    </div>
  );
}

function ProcessSpecimen() {
  const [settled, setSettled] = React.useState(false);
  const run = settled ? { ...sampleRun, status: 'completed' as const, calls: sampleRun.calls!.map((c) => ({ ...c, status: 'completed' as const })) } : sampleRun;
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <Button size="sm" variant="secondary" onClick={() => setSettled((v) => !v)}>
          {settled ? '切回运行中' : '模拟运行结束'}
        </Button>
      </div>
      <AgentProcess run={run} onLoadRecord={() => undefined} />
      <AgentProcess run={{ ...sampleRun, id: 'run-trunc', status: 'interrupted', truncated: true, calls: sampleRun.calls!.slice(0, 1) }} defaultExpanded onOpenFull={() => undefined} />
    </div>
  );
}

const runStatuses: RunView['status'][] = ['idle', 'queued', 'running', 'waiting', 'cancelling', 'completed', 'failed', 'cancelled', 'interrupted'];
const phases: RunPhase[] = ['thinking', 'responding', 'executing-tool', 'waiting-approval', 'saving'];
const syncs: SyncStatus[] = ['reconnecting', 'stale', 'offline', 'unknown'];
const actions: ActionStatus[] = ['submitting', 'accepted', 'rejected', 'unknown'];

function RunStatusSpecimen() {
  return (
    <div className="sc-card-list">
      <div className="sc-table-wrap">
        <table className="sc-matrix">
          <caption className="sc-small" style={{ textAlign: 'start' }}>
            RunStatus × 阶段（阶段只在活动状态下显示）
          </caption>
          <thead>
            <tr>
              <th scope="col">status</th>
              <th scope="col">默认</th>
              <th scope="col">inline</th>
              <th scope="col">line</th>
            </tr>
          </thead>
          <tbody>
            {runStatuses.map((status) => (
              <tr key={status}>
                <td className="sc-mono-sm">{status}</td>
                <td>
                  <RunStatus status={status} />
                </td>
                <td>
                  <RunStatus status={status} appearance="inline" />
                </td>
                <td>
                  <RunStatus status={status} appearance="line" elapsedMs={status === 'running' ? 8400 : undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sc-row">
        {phases.map((phase) => (
          <RunStatus key={phase} status="running" phase={phase} elapsedMs={18_400} />
        ))}
      </div>
      <div className="sc-row">
        {syncs.map((sync) => (
          <RunStatus key={sync} status="running" phase="executing-tool" syncStatus={sync} />
        ))}
      </div>
      <div className="sc-row">
        {actions.map((action) => (
          <RunStatus key={action} status="waiting" phase="waiting-approval" actionStatus={action} />
        ))}
      </div>
      <RunStatus run={sampleRun} syncStatus="reconnecting" actionStatus="unknown" hint="示例：停止请求是否送达尚未确认" />
    </div>
  );
}

const availableCitation: CitationView = { id: 'c1', index: 1, title: 'manifest.csv', sourceType: 'file', locator: 'data/reef/manifest.csv', excerpt: 'id,species,confidence（示例摘录）' };
const unavailableCitation: CitationView = { id: 'c2', index: 2, title: '已删除的旧报告', sourceType: 'file', unavailable: true, reason: '示例：文件已不存在' };

function CitationSpecimen() {
  const [opened, setOpened] = React.useState('');
  const open = (c: CitationView) => setOpened(`${c.index} · ${c.title}`);
  return (
    <div className="sc-card-list" data-testid="citation-specimen">
      <p style={{ margin: 0, maxWidth: '32rem' }}>
        样本清单列出了 19 张图像<CitationChip citation={availableCitation} onOpen={open} />，旧版报告的结论已无法核对
        <CitationChip citation={unavailableCitation} onOpen={open} />。多个引用并列时
        <CitationChip citation={{ ...availableCitation, id: 'c3', index: 3, title: '珊瑚分类方法', sourceType: 'web', locator: 'https://example.org/reef' }} onOpen={open} />
        <CitationChip citation={{ ...availableCitation, id: 'c4', index: 4, title: 'reef-v1', sourceType: 'dataset' }} onOpen={open} />
        <CitationChip citation={{ ...availableCitation, id: 'c5', index: 5, title: 'classify.py', sourceType: 'code' }} label="classify.py" showIcon onOpen={open} />
        也保持行高不变（示例文本）。
      </p>
      <p className="sc-small" aria-live="polite" data-testid="citation-log">
        {opened ? `onOpen：${opened}（示例回调）` : '尚未打开引用。'}
      </p>
    </div>
  );
}

function JumpSpecimen() {
  const [count, setCount] = React.useState(3);
  return (
    <div className="sc-row" style={{ minHeight: 'var(--rl-space-12)' }}>
      <JumpToLatest atLatest={count === 0} unreadCount={count} onJump={() => setCount(0)} />
      <JumpToLatest atLatest={false} onJump={() => undefined} loading />
      <Button size="sm" variant="ghost" onClick={() => setCount((n) => n + 1)}>
        新增 1 条（示例）
      </Button>
    </div>
  );
}

/**
 * The page-level overflow test only whitelists `.sc-table-wrap` ancestors. Code blocks and the
 * thinking preview scroll inside their own clipped boxes, so this wrapper never scrolls itself.
 */
function Wide({ children }: { children: React.ReactNode }) {
  return (
    <div className="sc-table-wrap" style={{ padding: 'var(--rl-space-1)', background: 'none' }}>
      {children}
    </div>
  );
}

export function AgentMessagePage() {
  return (
    <>
      <PageHeader index="AG" section="Agent UI" title="Message">
        MessageList、AgentMessage、MessagePart、ThinkingBlock、AgentProcess、RunStatus、CitationChip、JumpToLatest、MessageActions 与 CodeBlock。页面上的文本、耗时、用量与来源均为示例数据。
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="msg-list"
          index="05"
          title="MessageList"
          description="自有滚动的阅读视口：在底部时跟随新内容，向上阅读即停止跟随并显示「返回最新消息」；发送新消息滚到最新一次；加载更早消息保持阅读锚点。"
          note="跟随阈值 4px（JS 测量）· overflow-anchor: none · 新消息入场 base · 历史不动画"
        >
          <Wide>
            <ListDemo />
          </Wide>
        </Specimen>
        <Specimen id="msg-parts" index="06" title="MessagePart" description="按 part.type 分发；未注册的 custom 与未知类型显示可读兜底，从不空白。" span="half">
          <Wide>
            <PartsSpecimen />
          </Wide>
        </Specimen>
        <Specimen id="msg-roles" index="07" title="AgentMessage" description="用户、助手、系统消息；编辑、继承、用量完整度；失败 / 中断 / 停止状态与重试。" span="half">
          <Wide>
            <RolesSpecimen />
          </Wide>
        </Specimen>
        <Specimen id="msg-copy" index="08" title="MessageActions · CodeBlock" description="复制显示 1.2s 的「已复制 / 复制失败」反馈；能力没有回调则不渲染按钮；代码块在内部横向滚动。" span="half">
          <Wide>
            <CopySpecimen />
          </Wide>
        </Specimen>
        <Specimen id="msg-thinking" index="09" title="ThinkingBlock" description="默认折叠；流式时折叠态显示最新一行；更新不折叠、不重置选区。" span="half">
          <Wide>
            <ThinkingSpecimen />
          </Wide>
        </Specimen>
        <Specimen id="msg-process" index="10" title="AgentProcess" description="按模型调用分组；只有当前步骤带强调线；缺失记录显示「记录稍后到达」，不伪造结果。">
          <Wide>
            <ProcessSpecimen />
          </Wide>
        </Specimen>
        <Specimen id="msg-run-status" index="11" title="RunStatus" description="运行、同步与动作回执是三条独立的轴：同步异常与未知回执作为单独的小标签，未知回执从不显示为成功。">
          <RunStatusSpecimen />
        </Specimen>
        <Specimen id="msg-citation" index="12" title="CitationChip" description="行内引用：悬停 / 聚焦显示来源卡片；不可用来源仍可聚焦并说明原因，但不能打开。" span="half">
          <CitationSpecimen />
        </Specimen>
        <Specimen id="msg-jump" index="13" title="JumpToLatest" description="出现时不抢焦点；名称含新消息数量；loading 时 aria-busy。" span="half">
          <JumpSpecimen />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
