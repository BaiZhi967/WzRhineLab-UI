/*
 * A fake agent runtime (示例). It plays the backend side of the boundary in agent-ui-adoption §1:
 * snake_case DTOs, an event stream with monotonic `event_seq`, and commands that answer with a
 * runtime-specific result. The stream is deliberately unreliable, so the adapter has to dedupe:
 *
 * - an exact duplicate event (same `event_seq` delivered twice);
 * - out-of-order delivery (`event_seq` n+2 arrives before n+1, leaving a short gap);
 * - a reconnect replay of an older message revision (rev 2 after rev 3) with a fresh `event_seq`;
 * - the first approve decision loses its receipt (`{ ok: 'timeout' }`): the runtime recorded the
 *   action id, so a retry with the same id is applied once and answered `ok`.
 *
 * Nothing here knows about React or @wzrhine/agent. All texts and numbers are sample data.
 */

// ---------- DTOs (runtime vocabulary, snake_case) ----------

export type RuntimeRunState =
  | 'idle'
  | 'thinking'
  | 'executing_tool'
  | 'waiting_approval'
  | 'responding'
  | 'cancelling'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type RuntimeToolState = 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'denied' | 'cancelled';
export type RuntimeMessageState = 'streaming' | 'complete' | 'cancelled' | 'failed';
export type RuntimeTerminalState = 'running' | 'waiting_input' | 'idle' | 'ended';

export interface RuntimeRefDTO {
  ref_id: string;
  name: string;
  path: string;
}

export interface RuntimeToolDTO {
  op_id: string;
  op_seq: number;
  tool_name: string;
  display_name: string;
  category: 'read' | 'execute' | 'write';
  subject: string;
  state: RuntimeToolState;
  summary?: string;
  elapsed_ms?: number;
  read?: { path: string; preview: string; total_lines: number };
  command?: { cmd: string; cwd: string; exit_code?: number; output?: string };
  edit?: { path: string; before: string; after: string; expected_version: string };
}

export interface RuntimeArtifactDTO {
  artifact_id: string;
  title: string;
  kind: 'data' | 'markdown';
  path: string;
  size_bytes?: number;
  saved: boolean;
}

export interface RuntimeMessageDTO {
  msg_id: string;
  conversation_id: string;
  run_id?: string;
  /** Position in the conversation. */
  msg_seq: number;
  /** Content revision; replays may carry an older one. */
  rev: number;
  role: 'user' | 'assistant';
  author: string;
  created_at: string;
  state: RuntimeMessageState;
  /** What the run was doing when this revision was produced (assistant only). */
  phase?: RuntimeRunState;
  text: string;
  refs?: RuntimeRefDTO[];
  tool_ops?: RuntimeToolDTO[];
  artifacts?: RuntimeArtifactDTO[];
  usage?: { input_tokens: number; output_tokens: number; estimated: boolean };
}

export interface RuntimeRunDTO {
  run_id: string;
  conversation_id: string;
  rev: number;
  state: RuntimeRunState;
  elapsed_ms: number;
}

export interface RuntimeApprovalDTO {
  op_id: string;
  conversation_id: string;
  rev: number;
  state: 'pending' | 'approved' | 'rejected' | 'expired';
  tool_name: string;
  display_name: string;
  reason: string;
  summary: string;
  scope_text: string;
  edit: { path: string; before: string; after: string; expected_version: string };
}

export interface RuntimeTerminalDTO {
  term_id: string;
  name: string;
  state: RuntimeTerminalState;
  cwd: string;
  shell: string;
  last_command?: string;
  output: string;
  exit_code?: number;
}

export interface RuntimeConversationDTO {
  conversation_id: string;
  title: string;
  preview: string;
  updated_at: string;
  pinned?: boolean;
}

export type RuntimeEvent =
  | { event_seq: number; type: 'message.upsert'; message: RuntimeMessageDTO }
  | { event_seq: number; type: 'run.update'; run: RuntimeRunDTO }
  | { event_seq: number; type: 'tool.upsert'; conversation_id: string; run_id: string; tool: RuntimeToolDTO }
  | { event_seq: number; type: 'approval.update'; approval: RuntimeApprovalDTO }
  | { event_seq: number; type: 'terminal.update'; terminal: RuntimeTerminalDTO };

/** Runtime command answer. `timeout` = the request may or may not have been applied. */
export type RuntimeCommandResult = { ok: true; rev?: number } | { ok: false; error: string; code?: string } | { ok: 'timeout'; retryable: boolean };

export interface RuntimeSnapshot {
  conversations: RuntimeConversationDTO[];
  messages: RuntimeMessageDTO[];
  terminal: RuntimeTerminalDTO;
}

export interface MockRuntime {
  snapshot(): RuntimeSnapshot;
  subscribe(listener: (event: RuntimeEvent) => void): () => void;
  send(cmd: { action_id: string; conversation_id: string; text: string; refs: RuntimeRefDTO[] }): Promise<RuntimeCommandResult>;
  decide(cmd: { action_id: string; op_id: string; base_rev?: string; decision: 'approve' | 'reject'; scope: 'once' | 'session' }): Promise<RuntimeCommandResult>;
  stop(cmd: { action_id: string; conversation_id: string }): Promise<RuntimeCommandResult>;
  /** Cancels scheduled script steps (unmount). The runtime stays usable. */
  dispose(): void;
}

export interface MockRuntimeOptions {
  /** Simulated round-trip of a command (ms). */
  latencyMs?: number;
  /** Lose the receipt of the first approve decision. Default true. */
  dropFirstApproveReceipt?: boolean;
}

// ---------- seed (示例) ----------

const minutesAgo = (n: number) => new Date(Date.UTC(2026, 9, 10, 6, 0) - n * 60_000).toISOString();

function seedMessages(): RuntimeMessageDTO[] {
  return [
    {
      msg_id: 'm-1',
      conversation_id: 'c-coral',
      msg_seq: 1,
      rev: 1,
      role: 'user',
      author: '你',
      created_at: minutesAgo(30),
      state: 'complete',
      text: '先统计一下样本清单里的珊瑚类型（示例）。',
    },
    {
      msg_id: 'm-2',
      conversation_id: 'c-coral',
      run_id: 'run-0',
      msg_seq: 2,
      rev: 2,
      role: 'assistant',
      author: '研究助手（示例）',
      created_at: minutesAgo(29),
      state: 'complete',
      text: '清单中共有 3 类样本（示例数据，非真实监测结果）。统计表已保存为产物。',
      tool_ops: [
        {
          op_id: 'op-0',
          op_seq: 1,
          tool_name: 'read_file',
          display_name: '读取文件',
          category: 'read',
          subject: 'data/manifest.csv',
          state: 'completed',
          summary: '读取 40 行（示例）',
          elapsed_ms: 900,
          read: { path: 'data/manifest.csv', preview: 'id,species\nR-01,staghorn\nR-02,brain', total_lines: 40 },
        },
      ],
      artifacts: [{ artifact_id: 'art-0', title: 'species_count.csv', kind: 'data', path: 'out/species_count.csv', size_bytes: 512, saved: true }],
      usage: { input_tokens: 3_200, output_tokens: 410, estimated: true },
    },
    {
      msg_id: 'm-s1',
      conversation_id: 'c-sensor',
      msg_seq: 1,
      rev: 1,
      role: 'user',
      author: '你',
      created_at: minutesAgo(120),
      state: 'complete',
      text: '把传感器日志按小时汇总（示例）。',
    },
    {
      msg_id: 'm-s2',
      conversation_id: 'c-sensor',
      msg_seq: 2,
      rev: 1,
      role: 'assistant',
      author: '研究助手（示例）',
      created_at: minutesAgo(118),
      state: 'complete',
      text: '已按小时汇总 24 段示例日志。',
    },
    {
      msg_id: 'm-a1',
      conversation_id: 'c-archive',
      msg_seq: 1,
      rev: 1,
      role: 'user',
      author: '你',
      created_at: minutesAgo(1_500),
      state: 'complete',
      text: '整理归档目录的命名规则（示例）。',
    },
  ];
}

const seedConversations: RuntimeConversationDTO[] = [
  { conversation_id: 'c-coral', title: '珊瑚样本分类（示例）', preview: '研究助手 · 2 条消息', updated_at: minutesAgo(29), pinned: true },
  { conversation_id: 'c-sensor', title: '传感器日志汇总（示例）', preview: '研究助手 · 2 条消息', updated_at: minutesAgo(118) },
  { conversation_id: 'c-archive', title: '归档命名规则（示例）', preview: '1 条消息', updated_at: minutesAgo(1_500) },
];

const seedTerminal: RuntimeTerminalDTO = {
  term_id: 'term-1',
  name: '终端 1（示例）',
  state: 'idle',
  cwd: '/workspace/reef',
  shell: 'bash',
  output: '$ ls data\nmanifest.csv  images/',
};

const EDIT = { path: 'src/config.py', before: 'debug = True', after: 'debug = False\nlog_level = "info"', expected_version: 'v7' };

// ---------- runtime ----------

export function createMockRuntime(options: MockRuntimeOptions = {}): MockRuntime {
  const latency = options.latencyMs ?? 250;
  let dropNextApprove = options.dropFirstApproveReceipt ?? true;

  const messages = new Map<string, RuntimeMessageDTO>(seedMessages().map((m) => [m.msg_id, m]));
  let terminal: RuntimeTerminalDTO = { ...seedTerminal };
  const listeners = new Set<(event: RuntimeEvent) => void>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let eventSeq = 0;
  let runCounter = 0;

  interface ActiveRun {
    runId: string;
    conversationId: string;
    rev: number;
    assistantId: string;
    tools: Map<string, RuntimeToolDTO>;
    approval?: RuntimeApprovalDTO;
    timers: Set<ReturnType<typeof setTimeout>>;
  }
  const runs = new Map<string, ActiveRun>();
  /** action_id → applied. Present but false = recorded, receipt lost, not applied yet. */
  const actions = new Map<string, boolean>();

  const nextSeq = () => (eventSeq += 1);
  const deliver = (event: RuntimeEvent) => {
    for (const listener of listeners) listener(event);
  };
  const later = (ms: number, fn: () => void, run?: ActiveRun) => {
    const id = setTimeout(() => {
      timers.delete(id);
      run?.timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    run?.timers.add(id);
  };
  const reply = (result: RuntimeCommandResult) => new Promise<RuntimeCommandResult>((resolve) => later(latency, () => resolve(result)));

  const upsertMessage = (message: RuntimeMessageDTO): RuntimeEvent => {
    messages.set(message.msg_id, message);
    return { event_seq: nextSeq(), type: 'message.upsert', message };
  };
  const runEvent = (run: ActiveRun, state: RuntimeRunState, elapsed: number): RuntimeEvent => {
    run.rev += 1;
    return { event_seq: nextSeq(), type: 'run.update', run: { run_id: run.runId, conversation_id: run.conversationId, rev: run.rev, state, elapsed_ms: elapsed } };
  };
  const toolEvent = (run: ActiveRun, tool: RuntimeToolDTO): RuntimeEvent => {
    run.tools.set(tool.op_id, tool);
    return { event_seq: nextSeq(), type: 'tool.upsert', conversation_id: run.conversationId, run_id: run.runId, tool };
  };
  const terminalEvent = (next: Partial<RuntimeTerminalDTO>): RuntimeEvent => {
    terminal = { ...terminal, ...next };
    return { event_seq: nextSeq(), type: 'terminal.update', terminal };
  };
  const assistant = (run: ActiveRun, patch: Partial<RuntimeMessageDTO>): RuntimeMessageDTO => {
    const current = messages.get(run.assistantId)!;
    return { ...current, ...patch, rev: current.rev + 1 };
  };
  const conversationLength = (id: string) => [...messages.values()].filter((m) => m.conversation_id === id).length;

  const activeRunIn = (conversationId: string) => [...runs.values()].find((r) => r.conversationId === conversationId);

  /** The scripted run: think → read → command → edit waiting for approval. */
  const startRun = (conversationId: string, text: string, refs: RuntimeRefDTO[]) => {
    runCounter += 1;
    const runId = `run-${runCounter}`;
    const base = conversationLength(conversationId);
    const userId = `${runId}-u`;
    const run: ActiveRun = { runId, conversationId, rev: 0, assistantId: `${runId}-a`, tools: new Map(), timers: new Set() };
    runs.set(runId, run);
    const now = new Date().toISOString();

    later(
      0,
      () => {
        const userEvent = upsertMessage({
          msg_id: userId,
          conversation_id: conversationId,
          run_id: runId,
          msg_seq: base + 1,
          rev: 1,
          role: 'user',
          author: '你',
          created_at: now,
          state: 'complete',
          text,
          refs,
        });
        deliver(userEvent);
        deliver(
          upsertMessage({
            msg_id: run.assistantId,
            conversation_id: conversationId,
            run_id: runId,
            msg_seq: base + 2,
            rev: 1,
            role: 'assistant',
            author: '研究助手（示例）',
            created_at: now,
            state: 'streaming',
            phase: 'thinking',
            text: '',
          }),
        );
        deliver(runEvent(run, 'thinking', 0));
        // Flaky transport: the user message event is delivered a second time (same event_seq).
        deliver(userEvent);
      },
      run,
    );

    later(
      600,
      () => {
        deliver(
          toolEvent(run, {
            op_id: `${runId}-op1`,
            op_seq: 1,
            tool_name: 'read_file',
            display_name: '读取文件',
            category: 'read',
            subject: 'src/config.py',
            state: 'running',
            read: { path: 'src/config.py', preview: 'debug = True\nseed = 7', total_lines: 2 },
          }),
        );
        deliver(runEvent(run, 'executing_tool', 600));
        deliver(upsertMessage(assistant(run, { phase: 'executing_tool', text: '正在读取配置文件（示例）。' })));
      },
      run,
    );

    later(
      1100,
      () => {
        // Out of order: the command event (n + 1) arrives before the read completion (n).
        const readDone = toolEvent(run, { ...run.tools.get(`${runId}-op1`)!, state: 'completed', summary: '2 行（示例）', elapsed_ms: 480 });
        const command = toolEvent(run, {
          op_id: `${runId}-op2`,
          op_seq: 2,
          tool_name: 'run_command',
          display_name: '执行命令',
          category: 'execute',
          subject: 'python check.py',
          state: 'running',
          command: { cmd: 'python check.py', cwd: '/workspace/reef' },
        });
        deliver(command);
        later(150, () => deliver(readDone), run);
      },
      run,
    );

    later(
      1500,
      () => {
        deliver(terminalEvent({ state: 'running', last_command: 'python check.py', output: `${terminal.output}\n$ python check.py\n检查 3 项配置（示例）…` }));
      },
      run,
    );

    later(
      2100,
      () => {
        const op2 = run.tools.get(`${runId}-op2`)!;
        deliver(
          toolEvent(run, {
            ...op2,
            state: 'completed',
            summary: '退出码 0（示例）',
            elapsed_ms: 820,
            command: { ...op2.command!, exit_code: 0, output: '检查 3 项配置（示例）…\ndebug 仍为 True' },
          }),
        );
        deliver(terminalEvent({ state: 'idle', output: `${terminal.output}\ndebug 仍为 True\n$` }));
        deliver(
          toolEvent(run, {
            op_id: `${runId}-op3`,
            op_seq: 3,
            tool_name: 'edit_file',
            display_name: '编辑文件',
            category: 'write',
            subject: EDIT.path,
            state: 'waiting_approval',
            edit: EDIT,
          }),
        );
        run.approval = {
          op_id: `${runId}-op3`,
          conversation_id: conversationId,
          rev: 1,
          state: 'pending',
          tool_name: 'edit_file',
          display_name: '编辑文件',
          reason: '修改代码文件',
          summary: '把 src/config.py 中的 debug 改为 False，并新增 log_level（示例）。',
          scope_text: '1 个文件 · 工作区内（示例）',
          edit: EDIT,
        };
        deliver({ event_seq: nextSeq(), type: 'approval.update', approval: run.approval });
        deliver(runEvent(run, 'waiting_approval', 2100));
        const stale = { ...messages.get(run.assistantId)! };
        deliver(upsertMessage(assistant(run, { phase: 'waiting_approval', text: '检查完成，需要修改 `src/config.py`，等待你的批准（示例）。' })));
        // Reconnect replay: an older revision of the assistant message, with a fresh event_seq.
        later(200, () => deliver({ event_seq: nextSeq(), type: 'message.upsert', message: stale }), run);
      },
      run,
    );
  };

  const finishRun = (run: ActiveRun, outcome: 'approved' | 'rejected' | 'stopped') => {
    for (const id of run.timers) {
      clearTimeout(id);
      timers.delete(id);
    }
    run.timers.clear();
    const opId = `${run.runId}-op3`;
    if (run.approval && run.approval.state === 'pending') {
      run.approval = { ...run.approval, rev: run.approval.rev + 1, state: outcome === 'approved' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'expired' };
      deliver({ event_seq: nextSeq(), type: 'approval.update', approval: run.approval });
    }
    if (outcome === 'stopped') deliver(runEvent(run, 'cancelling', 2400));
    else deliver(runEvent(run, 'responding', 2400));
    if (outcome === 'approved') {
      const op3 = run.tools.get(opId);
      if (op3) deliver(toolEvent(run, { ...op3, state: 'running' }));
    }

    later(700, () => {
      for (const tool of run.tools.values()) {
        if (tool.op_id === opId) {
          const state: RuntimeToolState = outcome === 'approved' ? 'completed' : outcome === 'rejected' ? 'denied' : 'cancelled';
          deliver(toolEvent(run, { ...tool, state, summary: outcome === 'approved' ? '已写入（示例）' : undefined, elapsed_ms: outcome === 'approved' ? 120 : undefined }));
        } else if (tool.state === 'running' || tool.state === 'queued') {
          deliver(toolEvent(run, { ...tool, state: 'cancelled' }));
        }
      }
      const text =
        outcome === 'approved'
          ? '已把 `src/config.py` 中的 debug 改为 False，并新增 `log_level`（示例）。'
          : outcome === 'rejected'
            ? '你拒绝了这次修改，配置保持不变（示例）。'
            : '已按你的要求停止（示例）。';
      deliver(
        upsertMessage(
          assistant(run, {
            state: outcome === 'stopped' ? 'cancelled' : 'complete',
            phase: undefined,
            text,
            tool_ops: [...run.tools.values()].sort((a, b) => a.op_seq - b.op_seq),
            artifacts:
              outcome === 'approved'
                ? [{ artifact_id: `${run.runId}-art`, title: 'config.py', kind: 'data', path: 'src/config.py', size_bytes: 64, saved: true }]
                : undefined,
            usage: { input_tokens: 5_400, output_tokens: 620, estimated: true },
          }),
        ),
      );
      deliver(runEvent(run, outcome === 'stopped' ? 'cancelled' : 'completed', 3100));
      runs.delete(run.runId);
    });
  };

  return {
    snapshot: () => ({
      conversations: seedConversations.map((c) => ({ ...c })),
      messages: [...messages.values()].map((m) => ({ ...m })),
      terminal: { ...terminal },
    }),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send(cmd) {
      if (actions.has(cmd.action_id)) return reply({ ok: true });
      if (activeRunIn(cmd.conversation_id)) return reply({ ok: false, error: '该会话已有运行中的任务（示例）', code: 'busy' });
      actions.set(cmd.action_id, true);
      return reply({ ok: true }).then((result) => {
        startRun(cmd.conversation_id, cmd.text, cmd.refs);
        return result;
      });
    },
    decide(cmd) {
      const run = [...runs.values()].find((r) => r.approval?.op_id === cmd.op_id);
      const recorded = actions.get(cmd.action_id);
      if (recorded === true) return reply({ ok: true, rev: run?.approval?.rev });
      if (!run || !run.approval) return reply({ ok: false, error: '找不到待审批的操作（示例）', code: 'not-found' });
      if (recorded === undefined && run.approval.state !== 'pending') return reply({ ok: false, error: '该操作已有决定（示例）', code: 'decided' });
      if (cmd.base_rev !== undefined && Number(cmd.base_rev) !== run.approval.rev) return reply({ ok: false, error: '审批材料已更新（示例）', code: 'stale' });
      if (recorded === undefined && cmd.decision === 'approve' && dropNextApprove) {
        // The runtime records the action but the receipt is lost on the way back.
        dropNextApprove = false;
        actions.set(cmd.action_id, false);
        return reply({ ok: 'timeout', retryable: true });
      }
      actions.set(cmd.action_id, true);
      return reply({ ok: true, rev: run.approval.rev + 1 }).then((result) => {
        finishRun(run, cmd.decision === 'approve' ? 'approved' : 'rejected');
        return result;
      });
    },
    stop(cmd) {
      const run = activeRunIn(cmd.conversation_id);
      if (!run) return reply({ ok: false, error: '没有运行中的任务（示例）', code: 'idle' });
      actions.set(cmd.action_id, true);
      return reply({ ok: true }).then((result) => {
        finishRun(run, 'stopped');
        return result;
      });
    },
    dispose() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
      for (const run of runs.values()) run.timers.clear();
    },
  };
}
