import type {
  ActionStatus,
  AgentTone,
  RunPhase,
  RunStatus,
  StatusGlyphName,
  SyncStatus,
  ToolStatus,
} from '../contracts/status.js';
import type { SubagentStatus, TerminalSessionStatus } from '../contracts/workspace.js';

/**
 * Glyph + tone for every status (ADR-0011 §3). Labels are not here: copy lives in the
 * `@wzrhine/agent` message tables so it can be localised. A state is always rendered as
 * glyph + text, so tone is never the only signal.
 */
export interface StatusMeta {
  glyph: StatusGlyphName;
  tone: AgentTone;
  /** Activity is ongoing (may show a slow indicator; static under reduced motion). */
  active: boolean;
  /** Terminal state: nothing will change without a new action. */
  settled: boolean;
}

const m = (glyph: StatusGlyphName, tone: AgentTone, active = false, settled = false): StatusMeta => ({ glyph, tone, active, settled });

export const runStatusMeta: Record<RunStatus, StatusMeta> = {
  idle: m('idle', 'neutral', false, true),
  queued: m('pending', 'neutral', true),
  running: m('active', 'accent', true),
  waiting: m('waiting-user', 'warning'),
  cancelling: m('stopping', 'warning', true),
  completed: m('done', 'success', false, true),
  failed: m('failed', 'danger', false, true),
  cancelled: m('stopped', 'neutral', false, true),
  interrupted: m('failed', 'warning', false, true),
};

export const runPhaseMeta: Record<RunPhase, StatusMeta> = {
  queued: m('pending', 'neutral', true),
  preparing: m('pending', 'info', true),
  'waiting-model': m('pending', 'info', true),
  thinking: m('thinking', 'accent', true),
  responding: m('active', 'accent', true),
  'executing-tool': m('tool', 'accent', true),
  'waiting-user': m('waiting-user', 'warning'),
  'waiting-approval': m('approval', 'warning'),
  'waiting-children': m('children', 'info', true),
  'waiting-resource': m('pending', 'neutral', true),
  compacting: m('compacting', 'info', true),
  saving: m('saving', 'info', true),
  cancelling: m('stopping', 'warning', true),
};

export const syncStatusMeta: Record<SyncStatus, StatusMeta> = {
  live: m('active', 'success', false, true),
  reconnecting: m('reconnecting', 'warning', true),
  stale: m('unknown', 'warning'),
  offline: m('offline', 'danger'),
  unknown: m('unknown', 'neutral'),
};

export const actionStatusMeta: Record<ActionStatus, StatusMeta> = {
  idle: m('idle', 'neutral', false, true),
  submitting: m('pending', 'info', true),
  accepted: m('done', 'success', false, true),
  rejected: m('failed', 'danger', false, true),
  unknown: m('unknown', 'warning'),
};

export const toolStatusMeta: Record<ToolStatus, StatusMeta> = {
  queued: m('pending', 'neutral', true),
  running: m('tool', 'accent', true),
  'waiting-approval': m('approval', 'warning'),
  'waiting-user': m('waiting-user', 'warning'),
  'waiting-children': m('children', 'info', true),
  partial: m('unknown', 'warning', false, true),
  completed: m('done', 'success', false, true),
  failed: m('failed', 'danger', false, true),
  denied: m('stopped', 'danger', false, true),
  cancelled: m('stopped', 'neutral', false, true),
  'timed-out': m('failed', 'warning', false, true),
  unknown: m('unknown', 'warning'),
};

export const terminalStatusMeta: Record<TerminalSessionStatus, StatusMeta> = {
  opening: m('pending', 'info', true),
  running: m('terminal', 'accent', true),
  'waiting-input': m('waiting-user', 'warning'),
  idle: m('terminal', 'neutral'),
  'stop-pending': m('stopping', 'warning', true),
  closing: m('stopping', 'neutral', true),
  ended: m('done', 'neutral', false, true),
  failed: m('failed', 'danger', false, true),
  unknown: m('unknown', 'warning'),
};

export const subagentStatusMeta: Record<SubagentStatus, StatusMeta> = {
  queued: m('pending', 'neutral', true),
  preparing: m('pending', 'info', true),
  running: m('active', 'accent', true),
  'waiting-children': m('children', 'info', true),
  'waiting-user': m('waiting-user', 'warning'),
  'needs-attention': m('approval', 'warning'),
  completed: m('done', 'success', false, true),
  failed: m('failed', 'danger', false, true),
  interrupted: m('failed', 'warning', false, true),
  cancelled: m('stopped', 'neutral', false, true),
};

/** Phase shown for a run: explicit phase, else derived from the run status. */
export function effectivePhase(status: RunStatus, phase?: RunPhase): RunPhase | undefined {
  if (phase) return phase;
  if (status === 'queued') return 'queued';
  if (status === 'cancelling') return 'cancelling';
  if (status === 'running') return 'responding';
  return undefined;
}

/** Statuses for which the run can still be stopped. */
export function canStopRun(status: RunStatus): boolean {
  return status === 'queued' || status === 'running' || status === 'waiting';
}

/** AgentSpark phase (dot-matrix rhythm) for a run phase. */
export type SparkPhase = 'idle' | 'thinking' | 'responding' | 'executing' | 'waiting' | 'done' | 'error';

export function sparkPhase(status: RunStatus, phase?: RunPhase): SparkPhase {
  if (status === 'completed') return 'done';
  if (status === 'failed' || status === 'interrupted') return 'error';
  if (status === 'idle' || status === 'cancelled') return 'idle';
  switch (effectivePhase(status, phase)) {
    case 'thinking':
      return 'thinking';
    case 'executing-tool':
    case 'compacting':
    case 'saving':
      return 'executing';
    case 'waiting-user':
    case 'waiting-approval':
    case 'waiting-children':
    case 'waiting-resource':
    case 'cancelling':
      return 'waiting';
    case 'responding':
    case 'waiting-model':
    case 'preparing':
    case 'queued':
      return 'responding';
    default:
      return status === 'waiting' ? 'waiting' : 'responding';
  }
}
