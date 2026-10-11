import * as React from 'react';
import { mergeById } from '@wzrhine/agent';
import type {
  ActionStatus,
  AgentActionContext,
  AgentActionResult,
  ApprovalScope,
  ApprovalView,
  ConversationSection,
  MessageView,
  ReferenceView,
  RunView,
  SendInput,
  ToolCallView,
} from '@wzrhine/agent';
import { sampleApproval, sampleConversations, sampleMessages, sampleRun, sampleTools } from '../../../../../packages/agent/src/fixtures/session';

/*
 * Scripted demo adapter: plays the role a real consumer adapter has (ADR-0011 §1). It owns the
 * snapshot, turns actions into state changes and feeds view-models to the components. Every
 * value is sample data (示例); timers only run after the user presses send and stop on unmount.
 */

export type DemoStage = 'idle' | 'thinking' | 'tool' | 'approval' | 'finishing' | 'done';

export interface DemoSession {
  sections: ConversationSection[];
  selectedId: string;
  select: (id: string) => void;
  messages: MessageView[];
  run: RunView;
  tools: ToolCallView[];
  approval: ApprovalView | null;
  stage: DemoStage;
  submitStatus: ActionStatus;
  send: (input: SendInput) => void;
  stop: () => void;
  approve: (scope: ApprovalScope, ctx: AgentActionContext) => Promise<AgentActionResult>;
  reject: (ctx: AgentActionContext) => Promise<AgentActionResult>;
  references: ReferenceView[];
  addReference: (reference: ReferenceView) => void;
  removeReference: (reference: ReferenceView) => void;
  reset: () => void;
}

const idleRun: RunView = { id: 'run-idle', status: 'completed', syncStatus: 'live', actionStatus: 'idle' };

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter += 1)}`;

export function useDemoSession(): DemoSession {
  const [sections, setSections] = React.useState(sampleConversations);
  const [selectedId, setSelectedId] = React.useState('c-coral');
  const [messages, setMessages] = React.useState<MessageView[]>(() => sampleMessages.slice(0, 2));
  const [run, setRun] = React.useState<RunView>(idleRun);
  const [tools, setTools] = React.useState<ToolCallView[]>([]);
  const [approval, setApproval] = React.useState<ApprovalView | null>(null);
  const [stage, setStage] = React.useState<DemoStage>('idle');
  const [submitStatus, setSubmitStatus] = React.useState<ActionStatus>('idle');
  const [references, setReferences] = React.useState<ReferenceView[]>([]);
  const timers = React.useRef<number[]>([]);

  const later = React.useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = React.useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);
  React.useEffect(() => clearTimers, [clearTimers]);

  const setConversationStatus = React.useCallback((patch: Partial<ConversationSection['items'][number]>) => {
    setSections((current) =>
      current.map((section) => ({ ...section, items: section.items.map((item) => (item.id === 'c-coral' ? { ...item, ...patch } : item)) })),
    );
  }, []);

  const updateAssistant = React.useCallback((id: string, patch: (m: MessageView) => MessageView) => {
    setMessages((current) => current.map((m) => (m.id === id ? patch(m) : m)));
  }, []);

  const send = React.useCallback(
    (input: SendInput) => {
      if (!input.text.trim()) return;
      clearTimers();
      setSubmitStatus('submitting');
      const userId = nextId('m-user');
      const assistantId = nextId('m-agent');
      const runId = nextId('run');
      later(300, () => {
        setSubmitStatus('accepted');
        setReferences([]);
        setMessages((current) =>
          mergeById(current, [
            {
              id: userId,
              role: 'user',
              author: '你',
              createdAt: new Date().toISOString(),
              status: 'complete',
              parts: [
                { type: 'text', id: `${userId}-t`, text: input.text },
                ...input.references.map((reference) => ({ type: 'reference' as const, id: `${userId}-${reference.id}`, reference })),
              ],
            },
            {
              id: assistantId,
              role: 'assistant',
              author: 'Research agent',
              createdAt: new Date().toISOString(),
              status: 'streaming',
              runId,
              parts: [{ type: 'status', id: `${assistantId}-s`, status: 'running', phase: 'thinking' }],
            },
          ]),
        );
        setRun({ ...sampleRun, id: runId, status: 'running', phase: 'thinking', elapsedMs: 0, calls: sampleRun.calls?.slice(0, 1) });
        setTools([]);
        setStage('thinking');
        setConversationStatus({ runStatus: 'running', runPhase: 'thinking', attention: undefined });
      });
      later(1500, () => {
        setStage('tool');
        setRun((r) => ({ ...r, phase: 'executing-tool', elapsedMs: 4200 }));
        setTools([{ ...sampleTools[0]! }, { ...sampleTools[1]!, status: 'running' }]);
        setConversationStatus({ runPhase: 'executing-tool' });
        updateAssistant(assistantId, (m) => ({
          ...m,
          parts: [
            { type: 'status', id: `${assistantId}-s`, status: 'running', phase: 'executing-tool' },
            { type: 'markdown', id: `${assistantId}-p1`, source: '已读取样本清单，正在运行分类脚本（示例）。', streaming: true },
          ],
        }));
      });
      later(3000, () => {
        setStage('approval');
        setRun((r) => ({ ...r, status: 'waiting', phase: 'waiting-approval', elapsedMs: 8400 }));
        setTools((current) => [
          ...current.map((tool) => (tool.id === 'op-2' ? { ...tool, status: 'completed' as const, summary: '退出码 0 · 8.4s' } : tool)),
          { ...sampleTools[2]! },
        ]);
        setApproval({ ...sampleApproval, status: 'waiting' });
        setConversationStatus({ runStatus: 'waiting', runPhase: 'waiting-approval', attention: 'approval' });
      });
    },
    [clearTimers, later, setConversationStatus, updateAssistant],
  );

  const finish = React.useCallback(
    (outcome: 'approved' | 'rejected' | 'stopped') => {
      setStage('finishing');
      setRun((r) => ({ ...r, status: outcome === 'stopped' ? 'cancelling' : 'running', phase: outcome === 'stopped' ? 'cancelling' : 'responding' }));
      later(900, () => {
        const status = outcome === 'stopped' ? 'cancelled' : 'completed';
        setRun((r) => ({ ...r, status, phase: undefined, elapsedMs: 12_400 }));
        setTools((current) =>
          current.map((tool) =>
            tool.id === 'op-3' ? { ...tool, status: outcome === 'approved' ? 'completed' : outcome === 'rejected' ? 'denied' : 'cancelled' } : tool,
          ),
        );
        setMessages((current) =>
          current.map((m) =>
            m.status === 'streaming'
              ? {
                  ...m,
                  status: outcome === 'stopped' ? 'cancelled' : 'complete',
                  parts: [
                    {
                      type: 'markdown',
                      id: `${m.id}-p1`,
                      source:
                        outcome === 'approved'
                          ? '已关闭 `src/config.py` 中的调试开关，并新增 `log_level`（示例）。'
                          : outcome === 'rejected'
                            ? '你拒绝了这次修改，配置保持不变（示例）。'
                            : '已按你的要求停止（示例）。',
                    },
                  ],
                  usage: { input: 8_200, output: 1_400, total: 9_600, completeness: 'estimated' },
                }
              : m,
          ),
        );
        setApproval(null);
        setStage('done');
        setConversationStatus({ runStatus: status, runPhase: undefined, attention: undefined });
      });
    },
    [later, setConversationStatus],
  );

  const approve = React.useCallback(
    async (_scope: ApprovalScope, _ctx: AgentActionContext): Promise<AgentActionResult> => {
      setApproval((a) => (a ? { ...a, status: 'submitting' } : a));
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      setApproval((a) => (a ? { ...a, status: 'approved', receipt: { status: 'accepted' } } : a));
      finish('approved');
      return { status: 'accepted' };
    },
    [finish],
  );

  const reject = React.useCallback(
    async (_ctx: AgentActionContext): Promise<AgentActionResult> => {
      setApproval((a) => (a ? { ...a, status: 'rejected', receipt: { status: 'accepted' } } : a));
      finish('rejected');
      return { status: 'accepted' };
    },
    [finish],
  );

  const stop = React.useCallback(() => {
    clearTimers();
    setApproval(null);
    finish('stopped');
  }, [clearTimers, finish]);

  const reset = React.useCallback(() => {
    clearTimers();
    setMessages(sampleMessages.slice(0, 2));
    setRun(idleRun);
    setTools([]);
    setApproval(null);
    setStage('idle');
    setSubmitStatus('idle');
    setSections(sampleConversations);
  }, [clearTimers]);

  return {
    sections,
    selectedId,
    select: setSelectedId,
    messages,
    run,
    tools,
    approval,
    stage,
    submitStatus,
    send,
    stop,
    approve,
    reject,
    references,
    addReference: (reference) => setReferences((current) => mergeById(current, [reference])),
    removeReference: (reference) => setReferences((current) => current.filter((r) => r.id !== reference.id)),
    reset,
  };
}
