import * as React from 'react';
import { isStaleRevision, mergeById, sequenceGaps } from '@wzrhine/agent-core';
import type {
  ActionReceipt,
  AgentActionContext,
  AgentActionResult,
  ApprovalScope,
  ApprovalStatus,
  ApprovalView,
  ArtifactView,
  ConversationSection,
  ConversationView,
  MessagePartView,
  MessageStatus,
  MessageView,
  RunPhase,
  RunStatus,
  RunView,
  SendInput,
  TerminalSessionStatus,
  TerminalView,
  ToolCallView,
  ToolDetailView,
  ToolStatus,
} from '@wzrhine/agent-core';
import { createMockRuntime } from './mockRuntime';
import type {
  MockRuntime,
  RuntimeApprovalDTO,
  RuntimeArtifactDTO,
  RuntimeCommandResult,
  RuntimeConversationDTO,
  RuntimeEvent,
  RuntimeMessageDTO,
  RuntimeMessageState,
  RuntimeRunDTO,
  RuntimeRunState,
  RuntimeTerminalDTO,
  RuntimeTerminalState,
  RuntimeToolDTO,
  RuntimeToolState,
} from './mockRuntime';

/*
 * Consumer adapter (agent-ui-adoption §1–2). It sits between the runtime and @wzrhine/agent:
 *
 * - maps snake_case runtime DTOs to kebab-case view-models once (ADR-0011 §3);
 * - dedupes the event stream: exact duplicate `event_seq` is dropped, older revisions are guarded
 *   with `isStaleRevision`, rows are merged with `mergeById` (sequence order fixes out-of-order
 *   delivery) and `sequenceGaps` reports missing events until they arrive;
 * - turns component actions into runtime commands and returns `AgentActionResult`, keeping the
 *   action identity of an `unknown` receipt so a retry reuses the same `actionId`.
 *
 * Every step is written to a visible adapter log so the behaviour can be checked by hand and in
 * E2E. Components never see a DTO.
 */

// ---------- status mapping (snake_case → kebab-case) ----------

export const runStateMap: Record<RuntimeRunState, { status: RunStatus; phase?: RunPhase }> = {
  idle: { status: 'idle' },
  thinking: { status: 'running', phase: 'thinking' },
  executing_tool: { status: 'running', phase: 'executing-tool' },
  waiting_approval: { status: 'waiting', phase: 'waiting-approval' },
  responding: { status: 'running', phase: 'responding' },
  cancelling: { status: 'cancelling', phase: 'cancelling' },
  completed: { status: 'completed' },
  cancelled: { status: 'cancelled' },
  failed: { status: 'failed' },
};

export const toolStateMap: Record<RuntimeToolState, ToolStatus> = {
  queued: 'queued',
  running: 'running',
  waiting_approval: 'waiting-approval',
  completed: 'completed',
  failed: 'failed',
  denied: 'denied',
  cancelled: 'cancelled',
};

const messageStateMap: Record<RuntimeMessageState, MessageStatus> = {
  streaming: 'streaming',
  complete: 'complete',
  cancelled: 'cancelled',
  failed: 'failed',
};

const terminalStateMap: Record<RuntimeTerminalState, TerminalSessionStatus> = {
  running: 'running',
  waiting_input: 'waiting-input',
  idle: 'idle',
  ended: 'ended',
};

const approvalStateMap: Record<RuntimeApprovalDTO['state'], ApprovalStatus> = {
  pending: 'waiting',
  approved: 'approved',
  rejected: 'rejected',
  expired: 'expired',
};

// ---------- DTO → view-model ----------

export function toToolView(dto: RuntimeToolDTO): ToolCallView {
  let detail: ToolDetailView | undefined;
  if (dto.read) {
    detail = { kind: 'file-read', path: dto.read.path, preview: dto.read.preview, totalLines: dto.read.total_lines, eof: true };
  } else if (dto.command) {
    detail = {
      kind: 'command',
      command: dto.command.cmd,
      cwd: dto.command.cwd,
      exitCode: dto.command.exit_code,
      execution: dto.state === 'running' ? 'running' : 'returned',
      output: dto.command.output ? { kind: 'terminal', content: dto.command.output, status: 'complete' } : undefined,
      terminalId: 'term-1',
    };
  } else if (dto.edit) {
    detail = {
      kind: 'file-edit',
      path: dto.edit.path,
      edits: [{ id: `${dto.op_id}-e1`, before: dto.edit.before, after: dto.edit.after }],
      expectedVersion: dto.edit.expected_version,
      materialReady: true,
    };
  }
  return {
    id: dto.op_id,
    sequence: dto.op_seq,
    name: dto.tool_name,
    displayName: dto.display_name,
    subject: dto.subject,
    category: dto.category,
    status: toolStateMap[dto.state],
    summary: dto.summary,
    elapsedMs: dto.elapsed_ms,
    detail,
    detailsLoaded: true,
  };
}

function toArtifactView(dto: RuntimeArtifactDTO): ArtifactView {
  return { id: dto.artifact_id, title: dto.title, kind: dto.kind, path: dto.path, size: dto.size_bytes, status: dto.saved ? 'saved' : 'generating' };
}

export function toMessageView(dto: RuntimeMessageDTO): MessageView {
  const parts: MessagePartView[] = [];
  if (dto.state === 'streaming' && dto.phase) {
    const run = runStateMap[dto.phase];
    parts.push({ type: 'status', id: `${dto.msg_id}-status`, status: run.status, phase: run.phase });
  }
  if (dto.text) {
    parts.push(
      dto.role === 'user'
        ? { type: 'text', id: `${dto.msg_id}-text`, text: dto.text }
        : { type: 'markdown', id: `${dto.msg_id}-text`, source: dto.text, streaming: dto.state === 'streaming' },
    );
  }
  for (const ref of dto.refs ?? []) {
    parts.push({ type: 'reference', id: `${dto.msg_id}-${ref.ref_id}`, reference: { id: ref.ref_id, kind: 'file', label: ref.name, detail: ref.path, status: 'ready' } });
  }
  // Settled turns carry their tool rows inline; the live round is shown by ToolActivity instead.
  if (dto.state !== 'streaming') {
    for (const tool of dto.tool_ops ?? []) parts.push({ type: 'tool-call', id: `${dto.msg_id}-${tool.op_id}`, tool: toToolView(tool) });
  }
  for (const artifact of dto.artifacts ?? []) parts.push({ type: 'artifact', id: `${dto.msg_id}-${artifact.artifact_id}`, artifact: toArtifactView(artifact) });
  return {
    id: dto.msg_id,
    conversationId: dto.conversation_id,
    runId: dto.run_id,
    role: dto.role,
    author: dto.author,
    createdAt: dto.created_at,
    revision: String(dto.rev),
    sequence: dto.msg_seq,
    status: messageStateMap[dto.state],
    parts,
    usage: dto.usage
      ? { input: dto.usage.input_tokens, output: dto.usage.output_tokens, total: dto.usage.input_tokens + dto.usage.output_tokens, completeness: dto.usage.estimated ? 'estimated' : 'exact' }
      : undefined,
  };
}

export function toRunView(dto: RuntimeRunDTO): RunView {
  const mapped = runStateMap[dto.state];
  return { id: dto.run_id, status: mapped.status, phase: mapped.phase, elapsedMs: dto.elapsed_ms, syncStatus: 'live' };
}

export function toApprovalView(dto: RuntimeApprovalDTO, previous?: ApprovalView): ApprovalView {
  const status = approvalStateMap[dto.state];
  const settled = status === 'approved' || status === 'rejected';
  return {
    operationId: dto.op_id,
    revision: String(dto.rev),
    status,
    tool: {
      name: dto.tool_name,
      displayName: dto.display_name,
      subject: dto.edit.path,
      category: 'write',
      detail: { kind: 'file-edit', path: dto.edit.path, edits: [{ id: `${dto.op_id}-e1`, before: dto.edit.before, after: dto.edit.after }], materialReady: true },
    },
    summary: dto.summary,
    reason: dto.reason,
    risk: 'medium',
    scope: dto.scope_text,
    evidence: [
      { id: 'path', label: '目标文件（示例）', value: dto.edit.path, format: 'path' },
      { id: 'version', label: '期望版本（示例）', value: dto.edit.expected_version, format: 'text' },
    ],
    // The adapter verified the full edit material and its revision, so approval is allowed.
    availability: { allowed: true },
    scopes: ['once'],
    receipt: settled ? { ...previous?.receipt, status: 'accepted', at: previous?.receipt?.at ?? new Date().toISOString() } : previous?.receipt,
  };
}

function toTerminalView(dto: RuntimeTerminalDTO): TerminalView {
  return {
    id: dto.term_id,
    name: dto.name,
    backend: 'pty',
    cwd: dto.cwd,
    shell: dto.shell,
    lastCommand: dto.last_command,
    status: terminalStateMap[dto.state],
    exitCode: dto.exit_code,
    output: dto.output,
  };
}

function toConversationView(dto: RuntimeConversationDTO): ConversationView {
  return { id: dto.conversation_id, title: dto.title, preview: dto.preview, updatedAt: dto.updated_at, pinned: dto.pinned };
}

export function toActionResult(result: RuntimeCommandResult): AgentActionResult {
  if (result.ok === true) return { status: 'accepted', revision: result.rev !== undefined ? String(result.rev) : undefined };
  if (result.ok === 'timeout') return { status: 'unknown', retryable: result.retryable };
  return { status: 'rejected', reason: result.error, code: result.code };
}

// ---------- store ----------

export type AdapterLogKind = 'event' | 'duplicate' | 'stale' | 'gap' | 'command' | 'result';

export interface AdapterLogEntry {
  id: number;
  kind: AdapterLogKind;
  text: string;
  /** Set on command / result entries: the action identity sent to the runtime. */
  actionId?: string;
  /** The command name for command / result entries (`send`, `approve`, `reject`, `stop`). */
  command?: string;
}

type LogInput = Omit<AdapterLogEntry, 'id'>;

const LOG_LIMIT = 120;

interface ConsoleState {
  conversations: ConversationView[];
  messages: Record<string, MessageView[]>;
  runs: Record<string, RunView>;
  /** Last applied run revision by run id. */
  runRevs: Record<string, number>;
  /** Live tool rows of the current run, by conversation. */
  tools: Record<string, ToolCallView[]>;
  /** Last applied event_seq by operation id (tools carry no revision of their own). */
  toolSeq: Record<string, number>;
  approvals: Record<string, ApprovalView | undefined>;
  terminal: TerminalView;
  /** Event sequence numbers already applied, ascending. */
  seen: number[];
  gaps: Array<{ from: number; to: number }>;
  submit: Record<string, ActionReceipt | undefined>;
  stop: Record<string, ActionReceipt | undefined>;
  log: AdapterLogEntry[];
  nextLogId: number;
}

type ConsoleAction =
  | { type: 'event'; event: RuntimeEvent }
  | { type: 'log'; entries: LogInput[] }
  | { type: 'approval-local'; conversationId: string; operationId: string; status?: ApprovalStatus; receipt?: ActionReceipt; entries?: LogInput[] }
  | { type: 'receipt'; slot: 'submit' | 'stop'; conversationId: string; receipt: ActionReceipt; entries?: LogInput[] };

function appendLog(state: ConsoleState, entries: readonly LogInput[]): Pick<ConsoleState, 'log' | 'nextLogId'> {
  if (entries.length === 0) return { log: state.log, nextLogId: state.nextLogId };
  let id = state.nextLogId;
  const added = entries.map((entry) => ({ ...entry, id: (id += 1) }));
  return { log: [...state.log, ...added].slice(-LOG_LIMIT), nextLogId: id };
}

function initState(runtime: MockRuntime): ConsoleState {
  const snapshot = runtime.snapshot();
  const messages: Record<string, MessageView[]> = {};
  for (const dto of snapshot.messages) {
    messages[dto.conversation_id] = mergeById(messages[dto.conversation_id] ?? [], [toMessageView(dto)]);
  }
  return {
    conversations: snapshot.conversations.map(toConversationView),
    messages,
    runs: {},
    runRevs: {},
    tools: {},
    toolSeq: {},
    approvals: {},
    terminal: toTerminalView(snapshot.terminal),
    seen: [],
    gaps: [],
    submit: {},
    stop: {},
    log: [{ id: 1, kind: 'event', text: `载入快照：${snapshot.conversations.length} 个会话、${snapshot.messages.length} 条消息（示例）` }],
    nextLogId: 1,
  };
}

const gapText = (gap: { from: number; to: number }) => (gap.from === gap.to ? `#${gap.from}` : `#${gap.from}–#${gap.to}`);

function applyEvent(state: ConsoleState, event: RuntimeEvent): ConsoleState {
  const seq = event.event_seq;
  if (state.seen.includes(seq)) {
    return { ...state, ...appendLog(state, [{ kind: 'duplicate', text: `事件 #${seq}（${event.type}）重复到达，已丢弃` }]) };
  }
  const seen = [...state.seen, seq].sort((a, b) => a - b);
  const gaps = sequenceGaps(seen.map((sequence) => ({ sequence })));
  const logs: LogInput[] = [];
  const key = (g: { from: number; to: number }) => `${g.from}-${g.to}`;
  const before = new Set(state.gaps.map(key));
  const after = new Set(gaps.map(key));
  for (const gap of gaps) if (!before.has(key(gap))) logs.push({ kind: 'gap', text: `缺口：事件 ${gapText(gap)} 尚未到达（乱序），先按序号排列已到达的数据` });
  for (const gap of state.gaps) if (!after.has(key(gap))) logs.push({ kind: 'gap', text: `缺口 ${gapText(gap)} 已补齐` });

  let next: ConsoleState = { ...state, seen, gaps };

  switch (event.type) {
    case 'message.upsert': {
      const dto = event.message;
      const conv = dto.conversation_id;
      const current = next.messages[conv] ?? [];
      const existing = current.find((m) => m.id === dto.msg_id);
      if (existing && isStaleRevision(existing.revision, String(dto.rev))) {
        logs.push({ kind: 'stale', text: `事件 #${seq}：消息 ${dto.msg_id} 的旧修订 rev ${dto.rev}（当前 rev ${existing.revision}），已忽略` });
        break;
      }
      next = { ...next, messages: { ...next.messages, [conv]: mergeById(current, [toMessageView(dto)]) } };
      logs.push({ kind: 'event', text: `事件 #${seq}：message.upsert ${dto.msg_id} rev ${dto.rev}` });
      break;
    }
    case 'run.update': {
      const dto = event.run;
      const conv = dto.conversation_id;
      const prevRev = next.runRevs[dto.run_id];
      if (isStaleRevision(prevRev === undefined ? undefined : String(prevRev), String(dto.rev))) {
        logs.push({ kind: 'stale', text: `事件 #${seq}：运行 ${dto.run_id} 的旧修订 rev ${dto.rev}，已忽略` });
        break;
      }
      const isNewRun = next.runs[conv]?.id !== dto.run_id;
      next = {
        ...next,
        runs: { ...next.runs, [conv]: toRunView(dto) },
        runRevs: { ...next.runRevs, [dto.run_id]: dto.rev },
        // A new run starts with an empty tool round and no previous approval receipt.
        tools: isNewRun ? { ...next.tools, [conv]: [] } : next.tools,
        approvals: isNewRun ? { ...next.approvals, [conv]: undefined } : next.approvals,
        // A stop receipt belongs to the run it stopped.
        stop: isNewRun ? { ...next.stop, [conv]: undefined } : next.stop,
      };
      logs.push({ kind: 'event', text: `事件 #${seq}：run.update ${dto.run_id} ${dto.state} → ${runStateMap[dto.state].status}${runStateMap[dto.state].phase ? ` / ${runStateMap[dto.state].phase}` : ''}` });
      break;
    }
    case 'tool.upsert': {
      const dto = event.tool;
      const conv = event.conversation_id;
      const prev = next.toolSeq[dto.op_id];
      if (isStaleRevision(prev === undefined ? undefined : String(prev), String(seq))) {
        logs.push({ kind: 'stale', text: `事件 #${seq}：操作 ${dto.op_id} 晚于 #${prev} 到达，已忽略` });
        break;
      }
      next = {
        ...next,
        tools: { ...next.tools, [conv]: mergeById(next.tools[conv] ?? [], [toToolView(dto)]) },
        toolSeq: { ...next.toolSeq, [dto.op_id]: seq },
      };
      logs.push({ kind: 'event', text: `事件 #${seq}：tool.upsert ${dto.op_id} ${dto.state} → ${toolStateMap[dto.state]}` });
      break;
    }
    case 'approval.update': {
      const dto = event.approval;
      const conv = dto.conversation_id;
      const prev = next.approvals[conv];
      const same = prev?.operationId === dto.op_id ? prev : undefined;
      if (same && isStaleRevision(same.revision, String(dto.rev))) {
        logs.push({ kind: 'stale', text: `事件 #${seq}：审批 ${dto.op_id} 的旧修订 rev ${dto.rev}，已忽略` });
        break;
      }
      next = { ...next, approvals: { ...next.approvals, [conv]: toApprovalView(dto, same) } };
      logs.push({ kind: 'event', text: `事件 #${seq}：approval.update ${dto.op_id} ${dto.state} → ${approvalStateMap[dto.state]}` });
      break;
    }
    case 'terminal.update': {
      next = { ...next, terminal: toTerminalView(event.terminal) };
      logs.push({ kind: 'event', text: `事件 #${seq}：terminal.update ${event.terminal.term_id} ${event.terminal.state}` });
      break;
    }
  }
  return { ...next, ...appendLog(next, logs) };
}

function reducer(state: ConsoleState, action: ConsoleAction): ConsoleState {
  switch (action.type) {
    case 'event':
      return applyEvent(state, action.event);
    case 'log':
      return { ...state, ...appendLog(state, action.entries) };
    case 'approval-local': {
      const current = state.approvals[action.conversationId];
      const logged = appendLog(state, action.entries ?? []);
      if (!current || current.operationId !== action.operationId) return { ...state, ...logged };
      // Settled facts come from runtime events; a late local update never moves them back.
      const settled = current.status === 'approved' || current.status === 'rejected' || current.status === 'expired';
      const updated: ApprovalView = {
        ...current,
        status: action.status && !settled ? action.status : current.status,
        receipt: action.receipt ?? current.receipt,
      };
      return { ...state, ...logged, approvals: { ...state.approvals, [action.conversationId]: updated } };
    }
    case 'receipt':
      return { ...state, ...appendLog(state, action.entries ?? []), [action.slot]: { ...state[action.slot], [action.conversationId]: action.receipt } };
  }
}

// ---------- hook ----------

export interface AgentConsole {
  sections: ConversationSection[];
  selectedId: string;
  select: (id: string) => void;
  conversation: ConversationView | undefined;
  messages: MessageView[];
  run: RunView;
  tools: ToolCallView[];
  approval: ApprovalView | undefined;
  terminal: TerminalView;
  submitReceipt: ActionReceipt | undefined;
  stopReceipt: ActionReceipt | undefined;
  log: AdapterLogEntry[];
  send: (input: SendInput) => Promise<AgentActionResult>;
  stop: () => Promise<AgentActionResult>;
  approve: (scope: ApprovalScope, ctx: AgentActionContext) => Promise<AgentActionResult>;
  reject: (ctx: AgentActionContext) => Promise<AgentActionResult>;
}

const resultText = (result: AgentActionResult) =>
  result.status === 'accepted' ? 'accepted' : result.status === 'unknown' ? `unknown（retryable: ${result.retryable}）` : `rejected：${result.reason}`;

/** One adapter + one runtime per call site: two consoles on a page share nothing. */
export function useAgentConsole(initialConversation = 'c-coral'): AgentConsole {
  const prefix = React.useId().replace(/[^\w-]/g, '');
  const [runtime] = React.useState(() => createMockRuntime());
  const [state, dispatch] = React.useReducer(reducer, runtime, initState);
  const [selectedId, setSelectedId] = React.useState(initialConversation);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const counter = React.useRef(0);
  const sentActions = React.useRef(new Set<string>());

  React.useEffect(() => runtime.subscribe((event) => dispatch({ type: 'event', event })), [runtime]);
  React.useEffect(() => () => runtime.dispose(), [runtime]);

  const nextActionId = React.useCallback((kind: string) => `${prefix}-${kind}-${(counter.current += 1)}`, [prefix]);

  /** Command log line; marks a repeated actionId as a retry of the same action. */
  const commandEntry = React.useCallback((command: string, actionId: string, detail: string): LogInput => {
    const retry = sentActions.current.has(actionId);
    sentActions.current.add(actionId);
    return { kind: 'command', command, actionId, text: `${retry ? '重试同一动作 ' : ''}${command} → 运行时 · actionId=${actionId} · ${detail}` };
  }, []);

  const send = React.useCallback(
    async (input: SendInput): Promise<AgentActionResult> => {
      const conversationId = selectedId;
      const actionId = nextActionId('send');
      dispatch({
        type: 'receipt',
        slot: 'submit',
        conversationId,
        receipt: { status: 'submitting', actionId },
        entries: [commandEntry('send', actionId, `引用 ${input.references.length} 个`)],
      });
      const result = toActionResult(
        await runtime.send({
          action_id: actionId,
          conversation_id: conversationId,
          text: input.text,
          refs: input.references.map((r) => ({ ref_id: r.id, name: r.label, path: r.detail ?? r.label })),
        }),
      );
      dispatch({
        type: 'receipt',
        slot: 'submit',
        conversationId,
        receipt: { status: result.status, actionId, reason: result.status === 'rejected' ? result.reason : undefined, retryable: result.status === 'unknown' ? result.retryable : undefined },
        entries: [{ kind: 'result', command: 'send', actionId, text: `send ← ${resultText(result)} · actionId=${actionId}` }],
      });
      return result;
    },
    [commandEntry, nextActionId, runtime, selectedId],
  );

  const stop = React.useCallback(async (): Promise<AgentActionResult> => {
    const conversationId = selectedId;
    const actionId = nextActionId('stop');
    dispatch({ type: 'receipt', slot: 'stop', conversationId, receipt: { status: 'submitting', actionId }, entries: [commandEntry('stop', actionId, conversationId)] });
    const result = toActionResult(await runtime.stop({ action_id: actionId, conversation_id: conversationId }));
    dispatch({
      type: 'receipt',
      slot: 'stop',
      conversationId,
      receipt: { status: result.status, actionId },
      entries: [{ kind: 'result', command: 'stop', actionId, text: `stop ← ${resultText(result)} · actionId=${actionId}` }],
    });
    return result;
  }, [commandEntry, nextActionId, runtime, selectedId]);

  const decide = React.useCallback(
    async (decision: 'approve' | 'reject', scope: ApprovalScope, ctx: AgentActionContext): Promise<AgentActionResult> => {
      const conversationId =
        Object.entries(stateRef.current.approvals).find(([, approval]) => approval?.operationId === ctx.targetId)?.[0] ?? selectedId;
      const operationId = ctx.targetId;
      dispatch({
        type: 'approval-local',
        conversationId,
        operationId,
        status: 'submitting',
        entries: [commandEntry(decision, ctx.actionId, `目标 ${operationId} · baseRevision ${ctx.baseRevision ?? '—'}`)],
      });
      const result = toActionResult(
        await runtime.decide({ action_id: ctx.actionId, op_id: operationId, base_rev: ctx.baseRevision, decision, scope }),
      );
      const entries: LogInput[] = [{ kind: 'result', command: decision, actionId: ctx.actionId, text: `${decision} ← ${resultText(result)} · actionId=${ctx.actionId}` }];
      const at = new Date().toISOString();
      if (result.status === 'unknown') {
        dispatch({
          type: 'approval-local',
          conversationId,
          operationId,
          status: 'unknown',
          receipt: { status: 'unknown', actionId: ctx.actionId, retryable: result.retryable, at },
          entries,
        });
      } else if (result.status === 'rejected') {
        dispatch({
          type: 'approval-local',
          conversationId,
          operationId,
          status: 'waiting',
          receipt: { status: 'rejected', actionId: ctx.actionId, reason: result.reason, at },
          entries,
        });
      } else {
        // Status follows the runtime's approval.update event; only the receipt is recorded here.
        dispatch({ type: 'approval-local', conversationId, operationId, receipt: { status: 'accepted', actionId: ctx.actionId, at }, entries });
      }
      return result;
    },
    [commandEntry, runtime, selectedId],
  );

  const approve = React.useCallback((scope: ApprovalScope, ctx: AgentActionContext) => decide('approve', scope, ctx), [decide]);
  const reject = React.useCallback((ctx: AgentActionContext) => decide('reject', 'once', ctx), [decide]);

  const sections = React.useMemo<ConversationSection[]>(() => {
    const items = state.conversations.map((conversation): ConversationView => {
      const run = state.runs[conversation.id];
      const approval = state.approvals[conversation.id];
      return {
        ...conversation,
        runStatus: run?.status,
        runPhase: run?.phase,
        attention: approval && (approval.status === 'waiting' || approval.status === 'unknown') ? 'approval' : undefined,
      };
    });
    return [
      { id: 'pinned', label: '置顶（示例）', items: items.filter((c) => c.pinned) },
      { id: 'recent', label: '最近（示例）', items: items.filter((c) => !c.pinned) },
    ];
  }, [state.conversations, state.runs, state.approvals]);

  return {
    sections,
    selectedId,
    select: setSelectedId,
    conversation: state.conversations.find((c) => c.id === selectedId),
    messages: state.messages[selectedId] ?? [],
    run: state.runs[selectedId] ?? { id: `${selectedId}-idle`, status: 'idle', syncStatus: 'live' },
    tools: state.tools[selectedId] ?? [],
    approval: state.approvals[selectedId],
    terminal: state.terminal,
    submitReceipt: state.submit[selectedId],
    stopReceipt: state.stop[selectedId],
    log: state.log,
    send,
    stop,
    approve,
    reject,
  };
}
