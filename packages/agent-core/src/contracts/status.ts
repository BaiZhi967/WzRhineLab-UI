/**
 * Status axes (ADR-0011 §3). Run, sync and action receipts are separate fields: a view-model can
 * be `running` + `reconnecting` + `unknown` at the same time, and the UI must show all three.
 *
 * Naming: every state key is kebab-case (`waiting-approval`), matching the rest of the library
 * (`DrawerCloseReason 'close-button'`). Adapters map runtime enums (`waiting_approval`) once.
 */

/** Coarse lifecycle of one agent run. Decides which actions are possible (stop, retry). */
export type RunStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'waiting'
  | 'cancelling'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'interrupted';

/**
 * What a run is doing right now. Finer than `RunStatus` and purely descriptive: it drives the
 * label, glyph and AgentSpark phase, never the available actions.
 */
export type RunPhase =
  | 'queued'
  | 'preparing'
  | 'waiting-model'
  | 'thinking'
  | 'responding'
  | 'executing-tool'
  | 'waiting-user'
  | 'waiting-approval'
  | 'waiting-children'
  | 'waiting-resource'
  | 'compacting'
  | 'saving'
  | 'cancelling';

/** Connection / event-stream health for the snapshot being shown. Never changes the run status. */
export type SyncStatus = 'live' | 'reconnecting' | 'stale' | 'offline' | 'unknown';

/**
 * Receipt of one user action (send, stop, approve, submit). `unknown` means the request may or may
 * not have reached the runtime: keep the original action identity and reconcile, never show success.
 */
export type ActionStatus = 'idle' | 'submitting' | 'accepted' | 'rejected' | 'unknown';

/** One tool operation. `unknown` = remote result not confirmed (MCP timeout, lost receipt). */
export type ToolStatus =
  | 'queued'
  | 'running'
  | 'waiting-approval'
  | 'waiting-user'
  | 'waiting-children'
  | 'partial'
  | 'completed'
  | 'failed'
  | 'denied'
  | 'cancelled'
  | 'timed-out'
  | 'unknown';

/** Draft persistence (composer, questionnaire). */
export type DraftStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

/** How complete a number is. Percentages are drawn only for `exact` values with a reliable max. */
export type Completeness = 'exact' | 'estimated' | 'partial' | 'unknown';

/** Visual tone shared with `@wzrhine/react` StatusBadge. */
export type AgentTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

/** Status glyph names drawn by `@wzrhine/agent` (`StatusGlyph`). Each one is paired with text. */
export type StatusGlyphName =
  | 'idle'
  | 'pending'
  | 'thinking'
  | 'tool'
  | 'waiting-user'
  | 'approval'
  | 'saving'
  | 'done'
  | 'failed'
  | 'stopping'
  | 'stopped'
  | 'active'
  | 'unknown'
  | 'terminal'
  | 'children'
  | 'compacting'
  | 'reconnecting'
  | 'offline';
