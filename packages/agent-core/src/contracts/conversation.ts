import type { ActionReceipt } from './actions.js';
import type { ActionStatus, Completeness, RunPhase, RunStatus, SyncStatus, ToolStatus } from './status.js';
import type { ToolCallView } from './tools.js';

/**
 * Conversation, message and run view-models (ADR-0011 §2). Snapshots only: plain, serialisable
 * data with stable ids. Adapters dedupe, order and guard revisions before they reach a component.
 */

export interface AgentIdentityView {
  id: string;
  name: string;
  /** Short role / kind label, e.g. "Research agent". */
  role?: string;
  /** Initials or a short monogram used when no avatar renderer is given. */
  monogram?: string;
}

/** Where a conversation came from. */
export interface ConversationOrigin {
  kind: 'fork' | 'subagent';
  /** Parent conversation id. */
  parentId: string;
  parentTitle?: string;
}

export interface ConversationView {
  id: string;
  title: string;
  /** Second line: agent name, message count, last activity… */
  preview?: string;
  /** ISO timestamp of the last activity. */
  updatedAt?: string;
  pinned?: boolean;
  archived?: boolean;
  /** Unread finished-run count; 0 / undefined hides the marker. */
  unread?: number;
  runStatus?: RunStatus;
  runPhase?: RunPhase;
  /** Needs the user (approval, question, child needs attention). Shown above unread. */
  attention?: 'approval' | 'question' | 'children' | 'error';
  origin?: ConversationOrigin;
  revision?: string;
}

export interface ConversationSection {
  id: string;
  label: string;
  items: ConversationView[];
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/** Message delivery state; streaming is not a status of its own but `status: 'streaming'`. */
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'partial' | 'failed' | 'cancelled' | 'interrupted';

export interface AttachmentView {
  id: string;
  name: string;
  kind: 'image' | 'file' | 'pdf' | 'text' | 'code' | 'unknown';
  mimeType?: string;
  /** Bytes. */
  size?: number;
  status: 'ready' | 'uploading' | 'failed' | 'stale' | 'disabled';
  /** 0–1 when known; omit for indeterminate uploads. */
  progress?: number;
  /** Thumbnail URL (data: or same-origin). Only rendered for `kind: 'image'`. */
  thumbnail?: string;
  /** Alternative text for image thumbnails. */
  alt?: string;
  /** Reason for `failed` / `stale` / `disabled`. */
  reason?: string;
}

/** A context reference attached to a message or the composer (file, folder, skill, URL…). */
export interface ReferenceView {
  id: string;
  kind: 'file' | 'folder' | 'skill' | 'command' | 'url' | 'symbol' | 'custom';
  label: string;
  /** Full path / URL / description used for the accessible name and tooltip. */
  detail?: string;
  /** Outside the workspace. */
  external?: boolean;
  status?: 'ready' | 'loading' | 'stale' | 'failed';
  reason?: string;
}

export interface CitationView {
  id: string;
  /** Visible index, e.g. 1 → "[1]". */
  index: number;
  title: string;
  sourceType: 'file' | 'web' | 'code' | 'dataset' | 'message' | 'other';
  /** Path, URL or locator shown in the hover card. */
  locator?: string;
  excerpt?: string;
  /** Source is no longer reachable; the chip stays but cannot be opened. */
  unavailable?: boolean;
  reason?: string;
}

export type ArtifactKind = 'text' | 'markdown' | 'code' | 'image' | 'file' | 'diff' | 'data' | 'unknown';

export interface ArtifactView {
  id: string;
  title: string;
  kind: ArtifactKind;
  mimeType?: string;
  size?: number;
  /** Version or revision label. */
  version?: string;
  /**
   * `saved` only after the artifact is actually persisted. `partial` keeps `reason`.
   * `generating` shows activity without a percentage.
   */
  status: 'generating' | 'partial' | 'saved' | 'failed' | 'unavailable' | 'stale';
  /** Change against the workspace, for file artifacts. */
  change?: 'created' | 'modified' | 'moved' | 'deleted';
  path?: string;
  /** Short text preview or thumbnail URL (for `image`). */
  preview?: string;
  alt?: string;
  reason?: string;
}

/** Public thinking summary for one model call. Never assumes full private reasoning exists. */
export interface ThinkingView {
  id: string;
  label?: string;
  status: 'streaming' | 'completed' | 'interrupted';
  /** Approved summary text (markdown allowed through the renderer). */
  summary?: string;
  /** Latest single line, shown collapsed while streaming. */
  latestLine?: string;
  /** Milliseconds. */
  elapsedMs?: number;
  /** The shown summary is cut; offer the full record. */
  truncated?: boolean;
}

export type MessagePartView =
  | { type: 'text'; id: string; text: string; streaming?: boolean }
  | { type: 'markdown'; id: string; source: string; streaming?: boolean }
  | { type: 'code'; id: string; code: string; language?: string; filename?: string }
  | { type: 'image'; id: string; src: string; alt: string; caption?: string; width?: number; height?: number }
  | { type: 'thinking'; id: string; thinking: ThinkingView }
  | { type: 'tool-call'; id: string; tool: ToolCallView }
  | { type: 'attachment'; id: string; attachment: AttachmentView }
  | { type: 'reference'; id: string; reference: ReferenceView }
  | { type: 'citation'; id: string; citation: CitationView }
  | { type: 'artifact'; id: string; artifact: ArtifactView }
  | { type: 'status'; id: string; status: RunStatus; phase?: RunPhase; text?: string }
  | { type: 'error'; id: string; error: RecoveryView }
  | { type: 'custom'; id: string; renderer: string; payload: unknown; summary?: string };

export type MessagePartType = MessagePartView['type'];

export interface TokenUsageView {
  input?: number;
  output?: number;
  total?: number;
  cacheRead?: number;
  cacheWrite?: number;
  completeness: Completeness;
  /** "inherited" history, "not returned by provider"… */
  note?: string;
}

export interface MessageView {
  id: string;
  conversationId?: string;
  runId?: string;
  role: MessageRole;
  /** Visible author name ("你", agent name, model label). */
  author?: string;
  createdAt?: string;
  /** User edited the message after sending. */
  edited?: boolean;
  revision?: string;
  sequence?: number;
  status: MessageStatus;
  parts: MessagePartView[];
  /** Run-level usage footer for assistant messages. */
  usage?: TokenUsageView;
  /** Inherited from a parent/fork; read-only. */
  inherited?: boolean;
}

/** Recoverable error state (ErrorRecoveryNotice). */
export interface RecoveryView {
  id: string;
  kind:
    | 'retryable'
    | 'save-pending'
    | 'cancel-unconfirmed'
    | 'tool-side-effects'
    | 'timeout'
    | 'offline'
    | 'unknown'
    | 'resolved';
  title: string;
  message?: string;
  code?: string;
  /** What is still safe: output kept, draft kept… */
  preserved?: string[];
  /** Safe actions; `id` is passed back to the handler. Labels must say what they act on. */
  actions?: { id: string; label: string; tone?: 'primary' | 'secondary' | 'danger' }[];
}

/** One step inside a model call (stage text, tool reference, thinking). */
export type ProcessBlockView =
  | { type: 'thinking'; id: string; thinking: ThinkingView }
  | { type: 'text'; id: string; text: string; truncated?: boolean }
  | { type: 'tool'; id: string; tool: ToolCallView }
  /** Record exists but has not loaded; shows a late-arrival entry instead of a fake result. */
  | { type: 'pending-record'; id: string; label: string };

export interface ProcessCallView {
  id: string;
  /** 1-based call round. */
  ordinal: number;
  status: 'running' | 'completed' | 'interrupted' | 'failed';
  elapsedMs?: number;
  blocks: ProcessBlockView[];
}

export interface RunView {
  id: string;
  status: RunStatus;
  phase?: RunPhase;
  /** Overrides the default phase label. */
  label?: string;
  startedAt?: string;
  elapsedMs?: number;
  model?: string;
  calls?: ProcessCallView[];
  /** Some calls are not shown. */
  truncated?: boolean;
  syncStatus?: SyncStatus;
  actionStatus?: ActionStatus;
  receipt?: ActionReceipt;
  toolCount?: number;
  toolStatusCounts?: Partial<Record<ToolStatus, number>>;
  artifacts?: ArtifactView[];
  usage?: TokenUsageView;
  error?: RecoveryView;
  /** Run finished but local persistence is pending / failed. */
  persistence?: 'saved' | 'saving' | 'failed' | 'unknown';
  /** Tool calls in this run may have changed external state. */
  sideEffects?: boolean;
}
