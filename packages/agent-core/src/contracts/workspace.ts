import type { ActionReceipt } from './actions.js';
import type { ArtifactView, CitationView } from './conversation.js';
import type { Completeness, RunPhase, RunStatus } from './status.js';

/**
 * Workspace view-models (ADR-0011 §7): terminals, sub-agents, context usage, pinned summary,
 * activity ledger and file preview. Data comes from the adapter; components never read files,
 * spawn processes or poll.
 */

/**
 * `unclosed`: the session is alive (a command returning does not close it).
 * `stop-pending`: a stop was requested and is not confirmed yet.
 */
export type TerminalSessionStatus =
  | 'opening'
  | 'running'
  | 'waiting-input'
  | 'idle'
  | 'stop-pending'
  | 'closing'
  | 'ended'
  | 'failed'
  | 'unknown';

export interface TerminalView {
  id: string;
  name: string;
  backend?: 'pty' | 'process';
  cwd?: string;
  shell?: string;
  lastCommand?: string;
  status: TerminalSessionStatus;
  exitCode?: number;
  /** Inherited from a parent / earlier run: history only, no input, no stop. */
  readOnly?: boolean;
  inherited?: boolean;
  /** The host can stop it. Without it no stop control is drawn. */
  stoppable?: boolean;
  /** Loaded output tail (plain text; ANSI already stripped by the adapter). */
  output?: string;
  /** Older output exists. */
  outputTruncated?: boolean;
  /** Only part of the output was captured. */
  partialCapture?: boolean;
  calls?: number;
  receipt?: ActionReceipt;
  /** Newer output exists than the loaded snapshot. */
  newerOutput?: boolean;
  /** Short facts shown as notes ("空闲为推断", "结果待保存"). */
  notes?: string[];
  /** Commands run in this terminal, newest last. */
  history?: { id: string; command: string; status: 'running' | 'returned' | 'failed' | 'unknown'; exitCode?: number; at?: string }[];
  source?: string;
  stopReason?: string;
  activity?: string;
  tail?: string;
  disabled?: boolean | { reason?: string };
}

export type SubagentStatus =
  | 'queued'
  | 'preparing'
  | 'running'
  | 'waiting-children'
  | 'waiting-user'
  | 'needs-attention'
  | 'completed'
  | 'failed'
  | 'interrupted'
  | 'cancelled';

export interface SubagentView {
  id: string;
  name: string;
  task: string;
  parentId?: string;
  parentLabel?: string;
  status: SubagentStatus;
  phase?: RunPhase;
  elapsedMs?: number;
  /** Usage so far, labelled partial when incomplete. */
  usage?: { tokens?: number; completeness: Completeness };
  resultAvailable?: boolean;
  pendingInput?: number;
  /** Record inherited from an earlier run / parent: a read-only snapshot. */
  inherited?: boolean;
}

export interface ContextUsageSegment {
  id: string;
  label: string;
  value: number;
  tone?: 'info' | 'accent' | 'success' | 'warning' | 'neutral';
}

export interface UsageStatRow {
  label: string;
  /** Missing values render as "—", never 0. */
  value?: number;
  unit: 'tokens' | 'percent' | 'ms' | 'tokens-per-s' | 'count';
  completeness?: Completeness;
}

export interface UsageStatSection {
  id: string;
  title: string;
  rows: UsageStatRow[];
}

export interface ContextUsageView {
  used?: number;
  /** Only reliable maxima produce a percentage. */
  max?: number;
  unit: 'tokens' | 'calls' | 'bytes' | 'items';
  completeness: Completeness;
  label?: string;
  segments?: ContextUsageSegment[];
  /** "模型配置已变化，等待重新估计" etc. */
  note?: string;
  /** Extra provider-neutral statistics (cache hit rate, TTFT, TPS…). */
  stats?: UsageStatSection[];
  /** The number is an estimate rather than a sampled provider value. */
  estimated?: boolean;
  disabled?: boolean | { reason?: string };
}

export interface PinnedSummaryView {
  id: string;
  title: string;
  body: string;
  status: 'current' | 'updating' | 'stale' | 'missing';
  tags?: string[];
  sources?: CitationView[];
  updatedAt?: string;
}

export type LedgerActor = 'agent' | 'tool' | 'system' | 'user';

export interface LedgerEventView {
  id: string;
  sequence: number;
  actor: LedgerActor;
  title: string;
  detail?: string;
  /** ISO timestamp. */
  at: string;
  outcome?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

export type FilePreviewMode = 'preview' | 'raw' | 'metadata';

export interface FilePreviewView {
  id: string;
  name: string;
  path?: string;
  kind: 'text' | 'markdown' | 'code' | 'image' | 'binary' | 'unknown';
  language?: string;
  mimeType?: string;
  size?: number;
  version?: string;
  status: 'loading' | 'ready' | 'error' | 'large-file' | 'unavailable' | 'changed' | 'missing';
  /** Loaded text (possibly a chunk) or image URL. */
  content?: string;
  alt?: string;
  /** Only part of the file is loaded. */
  partial?: { loadedBytes: number; totalBytes?: number };
  external?: boolean;
  metadata?: { label: string; value: string }[];
  reason?: string;
}

export interface RunSummaryView {
  id: string;
  title?: string;
  status: RunStatus | 'partial' | 'saving';
  elapsedMs?: number;
  toolCount?: number;
  failedTools?: number;
  artifacts?: ArtifactView[];
  /** Run success and persistence are separate facts. */
  persistence?: 'saved' | 'saving' | 'failed' | 'unknown';
  sideEffects?: boolean;
  usage?: { tokens?: number; completeness: Completeness };
}
