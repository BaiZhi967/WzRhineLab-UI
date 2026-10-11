import * as React from 'react';
import type { AgentActionContext, ApprovalScope, ApprovalView, QuestionAnswer, QuestionnaireView, RecoveryView } from '@wzrhine/agent';
import { ApprovalPanel, ErrorRecoveryNotice, InterventionDock, QuestionnaireCard } from '@wzrhine/agent';
import { Button } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { sampleApproval, sampleQuestionnaire } from '../../../../packages/agent/src/fixtures/session';

/*
 * Intervention family showcase (atlas 20, 21, 34). Every value is sample data (示例): operation
 * ids, paths, commands, revisions and answers are illustrative and never live runtime state.
 * Interactive demos simulate the host adapter with local state and short timers.
 */

const approval: ApprovalView = {
  ...sampleApproval,
  diff: {
    path: 'src/config.py',
    change: 'update',
    additions: 2,
    deletions: 1,
    hunks: [
      {
        id: 'h1',
        header: '@@ -11,3 +11,4 @@',
        lines: [
          { kind: 'context', text: 'class Settings:', oldLine: 11, newLine: 11 },
          { kind: 'remove', text: '    debug = True', oldLine: 12 },
          { kind: 'add', text: '    debug = False', newLine: 12 },
          { kind: 'add', text: '    log_level = "info"  # 示例：较长的一行用于验证差异区在窄屏内部横向滚动', newLine: 13 },
          { kind: 'context', text: '    retries = 3', oldLine: 13, newLine: 14 },
        ],
      },
    ],
  },
};

const deleteApproval: ApprovalView = {
  operationId: 'op-21',
  revision: '2',
  status: 'waiting',
  tool: { name: 'manage_files', displayName: '管理文件', subject: 'out/archive/2026-q3/', category: 'write' },
  summary: '递归删除 out/archive/2026-q3/ 目录及其中 48 个文件（示例）。',
  reason: '删除工作区文件',
  risk: 'high',
  scope: '48 个文件 · 工作区内（示例）',
  irreversible: '删除后不能自动恢复。工作区没有回收站，未纳入版本控制的文件会永久丢失。',
  evidence: [
    { id: 'e1', label: '目标目录', value: 'out/archive/2026-q3/', format: 'path' },
    { id: 'e2', label: '递归', value: '是' },
  ],
  availability: { allowed: true },
};

const commandApproval: ApprovalView = {
  operationId: 'op-22',
  revision: '1',
  status: 'waiting',
  tool: { name: 'run_command', displayName: '执行命令', subject: 'pip install -r requirements.txt --target ./vendor', category: 'execute' },
  summary: '在工作区安装 Python 依赖（示例命令）。',
  reason: '执行终端命令',
  risk: 'medium',
  scope: '工作区 · 访问网络',
  unsandboxed: true,
  evidence: [
    { id: 'e1', label: '工作目录', value: '/workspace/reef', format: 'path' },
    { id: 'e2', label: '命令', value: 'pip install -r requirements.txt --target ./vendor', format: 'code' },
  ],
  availability: { allowed: true },
};

const mcpApproval: ApprovalView = {
  operationId: 'op-23',
  revision: '4',
  status: 'waiting',
  tool: { name: 'mcp.execute', displayName: 'MCP 工具', subject: 'specimens · analyze', category: 'network' },
  summary: '调用远端 specimens 服务分析样本 sp-001（示例）。',
  reason: '调用远端服务',
  risk: 'low',
  scope: '1 次远端调用 · 只读（示例）',
  evidence: [
    { id: 'e1', label: '端点', value: 'wzrhinelab://specimens/v1/analyze', format: 'path' },
    { id: 'e2', label: '目录版本', value: 'cat-12' },
    {
      id: 'e3',
      label: '参数',
      format: 'json',
      value: JSON.stringify({ type: 'dataset', id: 'sp-001', fields: ['species', 'confidence', 'depth_m'], options: { threshold: 0.5, note: '示例参数' } }, null, 2),
    },
    { id: 'e4', label: '超时', value: '30s（示例）' },
  ],
  availability: { allowed: true },
};

const states: Array<{ id: string; title: string; view: ApprovalView; note?: string }> = [
  { id: 'loading', title: 'material-loading', view: { ...approval, operationId: 'op-11', status: 'material-loading', availability: { allowed: false } } },
  { id: 'unavailable', title: 'unavailable', view: { ...approval, operationId: 'op-12', status: 'unavailable', diff: undefined, availability: { allowed: false, reason: '审批材料超出读取上限，无法完整核验（示例）。' } } },
  { id: 'blocked', title: 'waiting · 材料未核验', view: { ...approval, operationId: 'op-13', availability: { allowed: false, reason: '文件版本已变化，需要重新读取（示例）。' } } },
  { id: 'submitting', title: 'submitting', view: { ...approval, operationId: 'op-14', status: 'submitting' } },
  { id: 'unknown', title: 'unknown', view: { ...approval, operationId: 'op-15', status: 'unknown', receipt: { status: 'unknown', retryable: true } } },
  { id: 'approved', title: 'approved', view: { ...approval, operationId: 'op-16', status: 'approved', receipt: { status: 'accepted', at: '2026-10-10T06:21:00Z' } } },
  { id: 'rejected', title: 'rejected', view: { ...approval, operationId: 'op-17', status: 'rejected', receipt: { status: 'accepted', at: '2026-10-10T06:22:00Z' } } },
  { id: 'expired', title: 'expired', view: { ...approval, operationId: 'op-18', status: 'expired' } },
];

const noop = () => {};

/**
 * The page-level overflow test only whitelists `.sc-table-wrap` ancestors. Diffs and JSON evidence
 * scroll inside their own clipped frames, so this wrapper never scrolls itself.
 */
function Wide({ children }: { children: React.ReactNode }) {
  return (
    <div className="sc-table-wrap" style={{ padding: 'var(--rl-space-1)', background: 'none' }}>
      {children}
    </div>
  );
}

/* Fake composer frame (docs-only, inline tokens: style.css belongs to the shell). */
const composerFrame: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--rl-space-2)',
  minWidth: 0,
  padding: 'var(--rl-space-3)',
  border: 'var(--rl-border-width) dashed var(--rl-border-default)',
  borderRadius: 'var(--rl-radius-md)',
  background: 'var(--rl-bg-canvas)',
};
const composerFake: React.CSSProperties = {
  minHeight: 'var(--rl-agent-composer-min)',
  padding: 'var(--rl-space-3)',
  border: 'var(--rl-border-width) solid var(--rl-border-strong)',
  borderRadius: 'var(--rl-radius-md)',
  background: 'var(--rl-bg-surface)',
  color: 'var(--rl-fg-muted)',
  font: 'var(--rl-type-body-sm)',
};

/** Simulated adapter: allow → submitting → unknown (lost receipt) → retry → approved. */
function InteractiveApproval() {
  const [view, setView] = React.useState<ApprovalView>({ ...approval, operationId: 'op-31', revision: '9' });
  const [log, setLog] = React.useState<string[]>([]);
  const attempts = React.useRef(0);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const write = (line: string) => setLog((prev) => [...prev.slice(-3), line]);

  const decide = (kind: 'approve' | 'reject', scope: ApprovalScope, ctx: AgentActionContext) => {
    attempts.current += 1;
    const first = attempts.current === 1 && kind === 'approve';
    write(`${kind === 'approve' ? `允许（${scope}）` : '拒绝'} · actionId ${ctx.actionId} · revision ${ctx.baseRevision}`);
    setView((v) => ({ ...v, status: 'submitting' }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (first) setView((v) => ({ ...v, status: 'unknown', receipt: { status: 'unknown', actionId: ctx.actionId, retryable: true, reason: '回执丢失：决定可能已送达（示例）。重试会使用同一动作编号。' } }));
      else setView((v) => ({ ...v, status: kind === 'approve' ? 'approved' : 'rejected', receipt: { status: 'accepted', actionId: ctx.actionId } }));
    }, 600);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    attempts.current = 0;
    setLog([]);
    setView({ ...approval, operationId: 'op-31', revision: String(Number(view.revision) + 1) });
  };

  return (
    <div className="sc-card-list">
      <ApprovalPanel
        key={view.revision}
        approval={view}
        onApprove={(scope, ctx) => decide('approve', scope, ctx)}
        onReject={(ctx) => decide('reject', 'once', ctx)}
      />
      <div className="sc-row">
        <Button size="sm" variant="secondary" onClick={reset}>
          重置演示
        </Button>
        <span className="sc-small" data-testid="approval-log">
          {log.length ? log.join(' → ') : '尚未提交（示例适配器：第一次允许会得到未知回执）'}
        </span>
      </div>
    </div>
  );
}

/** Simulated host: persists draft answers in state with a short "saving" phase; submit → completed. */
function InteractiveQuestionnaire() {
  const [view, setView] = React.useState<QuestionnaireView>(sampleQuestionnaire);
  const [last, setLast] = React.useState<string>('');
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const change = (answer: QuestionAnswer) => {
    setView((v) => ({ ...v, draftStatus: 'saving', answers: [...v.answers.filter((a) => a.questionId !== answer.questionId), answer] }));
    later(() => setView((v) => ({ ...v, draftStatus: 'saved' })), 400);
  };
  const submit = (answers: QuestionAnswer[], ctx: AgentActionContext) => {
    setLast(`提交 ${answers.length} 项 · actionId ${ctx.actionId} · revision ${ctx.baseRevision}`);
    setView((v) => ({ ...v, status: 'submit-pending', submitStatus: 'submitting' }));
    later(() => setView((v) => ({ ...v, answers, status: 'completed', submitStatus: 'accepted' })), 600);
  };
  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    setLast('');
    setView({ ...sampleQuestionnaire, revision: String(Number(view.revision) + 1) });
  };

  return (
    <div className="sc-card-list">
      <QuestionnaireCard key={view.revision} questionnaire={view} onAnswerChange={change} onSubmit={submit} onCopyAnswers={(text) => setLast(`已复制 ${text.length} 个字符（示例）`)} />
      <div className="sc-row">
        <Button size="sm" variant="secondary" onClick={reset}>
          重置问卷
        </Button>
        <span className="sc-small" data-testid="questionnaire-log">
          {last || '数字键选择 · Enter 下一题 · ←/→ 翻页 · Ctrl+Enter 提交（示例数据）'}
        </span>
      </div>
    </div>
  );
}

const allAnswers: QuestionAnswer[] = [
  { questionId: 'q-1-a', optionIds: ['table'] },
  { questionId: 'q-1-b', optionIds: ['data', 'summary'] },
  { questionId: 'q-1-c', skipped: true },
];

const questionnaireStates: Array<{ id: string; title: string; view: QuestionnaireView }> = [
  { id: 'q-pending', title: 'submit-pending', view: { ...sampleQuestionnaire, id: 'q-2', answers: allAnswers, status: 'submit-pending', submitStatus: 'submitting' } },
  { id: 'q-unknown', title: 'unknown', view: { ...sampleQuestionnaire, id: 'q-3', answers: allAnswers, status: 'unknown', submitStatus: 'unknown', receipt: { status: 'unknown', actionId: 'act-q3-1', retryable: true } } },
  { id: 'q-error', title: 'draft error', view: { ...sampleQuestionnaire, id: 'q-4', draftStatus: 'error' } },
  { id: 'q-completed', title: 'completed', view: { ...sampleQuestionnaire, id: 'q-5', answers: allAnswers, status: 'completed', submitStatus: 'accepted' } },
  { id: 'q-expired', title: 'expired', view: { ...sampleQuestionnaire, id: 'q-6', status: 'expired' } },
  { id: 'q-interrupted', title: 'interrupted', view: { ...sampleQuestionnaire, id: 'q-7', status: 'interrupted' } },
];

const recoveries: RecoveryView[] = [
  {
    id: 'r1',
    kind: 'retryable',
    title: '提供商请求未成功',
    message: '连接中断，本轮没有新的输出（示例）。',
    code: 'PROVIDER_REQUEST_FAILED',
    preserved: ['已有对话'],
    actions: [{ id: 'retry', label: '重新发送本轮', tone: 'primary' }],
  },
  {
    id: 'r2',
    kind: 'save-pending',
    title: '运行结果尚未保存',
    message: '模型输出已生成，本地写入未完成（示例）。',
    code: 'AGENT_PERSISTENCE_PENDING',
    preserved: ['已有输出', '工具记录'],
    actions: [{ id: 'retry-save', label: '仅重试本地保存', tone: 'primary' }],
  },
  {
    id: 'r3',
    kind: 'cancel-unconfirmed',
    title: '停止请求已发出',
    message: '运行时没有确认停止，任务仍保留占用（示例）。',
    code: 'AGENT_CANCEL_UNCONFIRMED',
    actions: [{ id: 'check', label: '检查运行状态' }],
  },
  {
    id: 'r4',
    kind: 'tool-side-effects',
    title: '工具操作结果未确认',
    message: 'run_command 已开始执行，回执丢失（示例）。',
    code: 'AGENT_HOST_FAILED',
    preserved: ['终端输出'],
    actions: [
      { id: 'verify', label: '核对外部结果', tone: 'primary' },
      { id: 'discard', label: '放弃本轮并新建对话', tone: 'danger' },
    ],
  },
  { id: 'r5', kind: 'timeout', title: '本轮运行已超时', message: '已保留可确认的输出（示例）。', code: 'AGENT_RUN_TIMEOUT', preserved: ['已有输出'], actions: [{ id: 'continue', label: '从已保留输出继续' }] },
  { id: 'r6', kind: 'offline', title: '与 Agent 服务的连接已断开', message: '恢复连接后会重新同步（示例）。', actions: [{ id: 'reconnect', label: '立即重新连接' }] },
  { id: 'r7', kind: 'unknown', title: '运行状态未知', message: '最近一次快照已过期（示例）。', actions: [{ id: 'refresh', label: '刷新运行状态' }] },
  { id: 'r8', kind: 'resolved', title: '本地保存已完成', message: '运行结果已写入历史（示例）。', preserved: ['已有输出'] },
];

function RecoveryMatrix() {
  const [last, setLast] = React.useState('');
  const [dismissed, setDismissed] = React.useState(false);
  return (
    <div className="sc-card-list">
      {recoveries
        .filter((r) => !(dismissed && r.kind === 'resolved'))
        .map((r) => (
          <ErrorRecoveryNotice key={r.id} recovery={r} onAction={(id) => setLast(`${r.kind} → ${id}`)} onDismiss={r.kind === 'resolved' ? () => setDismissed(true) : undefined} />
        ))}
      <div className="sc-row">
        {dismissed && (
          <Button size="sm" variant="secondary" onClick={() => setDismissed(false)}>
            重新显示已恢复提示
          </Button>
        )}
        <span className="sc-small">{last ? `最近动作：${last}` : '动作只回传 id；是否安全由宿主决定（示例）。'}</span>
      </div>
    </div>
  );
}

/** Dock above a fake composer frame: add / remove interventions to see the grid-rows transition. */
function DockDemo() {
  const [items, setItems] = React.useState<string[]>([]);
  const queue = ['approval', 'questionnaire', 'recovery'];
  const add = () => setItems((prev) => (prev.length >= queue.length ? prev : [...prev, queue[prev.length]!]));
  const pendingApprovals = 2;
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <Button size="sm" variant="secondary" onClick={add} disabled={items.length >= queue.length}>
          添加干预
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setItems((prev) => prev.slice(0, -1))} disabled={items.length === 0}>
          移除最后一个
        </Button>
        <span className="sc-small">当前 {items.length} 个（示例）</span>
      </div>
      <div style={composerFrame}>
        <InterventionDock moreCount={items.includes('approval') ? pendingApprovals : 0}>
          {items.map((kind) =>
            kind === 'approval' ? (
              <ApprovalPanel key="dock-approval" density="compact" approval={{ ...approval, operationId: 'op-41' }} onApprove={noop} onReject={noop} />
            ) : kind === 'questionnaire' ? (
              <QuestionnaireCard key="dock-q" questionnaire={{ ...sampleQuestionnaire, id: 'q-41' }} onAnswerChange={noop} onSubmit={noop} />
            ) : (
              <ErrorRecoveryNotice key="dock-r" recovery={recoveries[1]!} onAction={noop} />
            ),
          )}
        </InterventionDock>
        <div style={composerFake} aria-hidden="true">
          输入框占位（示例，非真实 Composer）
        </div>
      </div>
    </div>
  );
}

export function AgentInterventionPage() {
  return (
    <>
      <PageHeader index="35" section="Agent UI" title="Approval & questions">
        审批、问卷与错误恢复：组件只发出动作，真实校验在宿主 adapter。拒绝永远可用；允许需要完整、已核验的材料；未知回执不显示成功，重试复用原动作编号。问卷只收集信息，不授予工具权限。本页所有数值、路径与编号均为示例数据。
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="approval-waiting" index="20.01" title="ApprovalPanel · waiting" description="完整材料（内部只读 diff）、依据列表、可选的「本次会话信任」。" note="Allow = accent；Reject = secondary；actionId = useId + 计数；baseRevision = approval.revision">
          <Wide>
            <ApprovalPanel approval={approval} onApprove={noop} onReject={noop} />
          </Wide>
        </Specimen>
        <Specimen id="approval-interactive" index="20.02" title="ApprovalPanel · interactive" description="模拟适配器：允许 → 提交中 → 结果待确认 → 重试（同一 actionId）→ 已允许。">
          <Wide>
            <InteractiveApproval />
          </Wide>
        </Specimen>
        <Specimen id="approval-risk" index="20.03" title="High risk · irreversible" span="half" description="删除操作写明目标、方式与不可撤销。">
          <Wide>
            <ApprovalPanel approval={deleteApproval} onApprove={noop} onReject={noop} />
          </Wide>
        </Specimen>
        <Specimen id="approval-command" index="20.04" title="Command · unsandboxed" span="half" description="不在沙箱中运行的命令单独提示。">
          <Wide>
            <ApprovalPanel approval={commandApproval} onApprove={noop} onReject={noop} />
          </Wide>
        </Specimen>
        <Specimen id="approval-mcp" index="20.05" title="MCP · JSON evidence" span="half" description="依据较长时收进折叠区（Collapsible 高度过渡）。">
          <Wide>
            <ApprovalPanel approval={mcpApproval} onApprove={noop} onReject={noop} />
          </Wide>
        </Specimen>
        <Specimen id="approval-compact" index="20.06" title="Compact density" span="half" description="停靠在输入框上方时的紧凑密度；依据总在折叠区内。">
          <Wide>
            <ApprovalPanel density="compact" approval={{ ...approval, operationId: 'op-19' }} onApprove={noop} onReject={noop} />
          </Wide>
        </Specimen>
        {states.map((s, i) => (
          <Specimen key={s.id} id={`approval-${s.id}`} index={`20.${String(i + 7).padStart(2, '0')}`} title={`ApprovalPanel · ${s.title}`} span="half">
            <Wide>
              <ApprovalPanel approval={s.view} onApprove={noop} onReject={noop} onRetryMaterial={noop} onRefresh={noop} />
            </Wide>
          </Specimen>
        ))}

        <Specimen id="questionnaire-interactive" index="21.01" title="QuestionnaireCard · interactive" description="单选（含「其他」）、多选、文本三题；草稿由宿主保存。" note="页切换：x 12px + opacity（fast）；减动瞬时切换">
          <Wide>
            <InteractiveQuestionnaire />
          </Wide>
        </Specimen>
        {questionnaireStates.map((s, i) => (
          <Specimen key={s.id} id={s.id} index={`21.${String(i + 2).padStart(2, '0')}`} title={`QuestionnaireCard · ${s.title}`} span="half">
            <Wide>
              <QuestionnaireCard questionnaire={s.view} onAnswerChange={noop} onSubmit={noop} onRetrySave={noop} onCopyAnswers={noop} />
            </Wide>
          </Specimen>
        ))}

        <Specimen id="recovery-kinds" index="34.01" title="ErrorRecoveryNotice · kinds" description="每种状态有独立的严重程度与后果说明；只有危险类使用 role=alert。">
          <Wide>
            <RecoveryMatrix />
          </Wide>
        </Specimen>

        <Specimen id="intervention-dock" index="34.02" title="InterventionDock" description="停靠在输入框上方；高度用 grid-template-rows 0fr → 1fr 过渡，新卡片只入场一次。" note="--rl-motion-base；AgentEntrance kind=card（panel）；减动即时">
          <Wide>
            <DockDemo />
          </Wide>
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
