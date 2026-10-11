// @wzrhine/agent-core: framework-free Agent UI contracts (ADR-0011). No React, no DOM, no runtime
// dependency. `@wzrhine/agent` renders these view-models; adapters produce them.
export type {
  ActionStatus,
  AgentTone,
  Completeness,
  DraftStatus,
  RunPhase,
  RunStatus,
  StatusGlyphName,
  SyncStatus,
  ToolStatus,
} from './contracts/status.js';
export type {
  ActionReceipt,
  AgentActionContext,
  AgentActionHandler,
  AgentActionResult,
  Capability,
  CapabilityInput,
} from './contracts/actions.js';
export type {
  AgentIdentityView,
  ArtifactKind,
  ArtifactView,
  AttachmentView,
  CitationView,
  ConversationOrigin,
  ConversationSection,
  ConversationView,
  MessagePartType,
  MessagePartView,
  MessageRole,
  MessageStatus,
  MessageView,
  ProcessBlockView,
  ProcessCallView,
  RecoveryView,
  ReferenceView,
  RunView,
  ThinkingView,
  TokenUsageView,
} from './contracts/conversation.js';
export type {
  DiffHunkView,
  DiffLineView,
  FileDiffView,
  ReadRangeView,
  ToolAuthorizationView,
  ToolCallView,
  ToolCategory,
  ToolDetailKind,
  ToolDetailView,
  ToolOutputView,
} from './contracts/tools.js';
export type {
  ApprovalEvidenceView,
  ApprovalRisk,
  ApprovalScope,
  ApprovalStatus,
  ApprovalView,
  QuestionAnswer,
  QuestionKind,
  QuestionnaireStatus,
  QuestionnaireView,
  QuestionOptionView,
  QuestionView,
} from './contracts/intervention.js';
export type {
  CommandOption,
  ComposerState,
  MentionOption,
  ModelEffort,
  ModelOptionView,
  ModelProviderView,
  PermissionModeView,
  SendInput,
  TriggerChar,
} from './contracts/composer.js';
export type {
  ContextUsageSegment,
  ContextUsageView,
  FilePreviewMode,
  FilePreviewView,
  LedgerActor,
  LedgerEventView,
  PinnedSummaryView,
  RunSummaryView,
  SubagentStatus,
  SubagentView,
  TerminalSessionStatus,
  TerminalView,
} from './contracts/workspace.js';

export { buildTree, capability, compareRevision, dedupeById, isStaleRevision, mergeById, sequenceGaps } from './helpers/snapshot.js';
export {
  actionStatusMeta,
  canStopRun,
  effectivePhase,
  runPhaseMeta,
  runStatusMeta,
  sparkPhase,
  subagentStatusMeta,
  syncStatusMeta,
  terminalStatusMeta,
  toolStatusMeta,
} from './helpers/status-meta.js';
export type { SparkPhase, StatusMeta } from './helpers/status-meta.js';
export {
  TOKEN_CLOSE,
  TOKEN_OPEN,
  deleteTokenAt,
  detectTrigger,
  encodeToken,
  insertToken,
  parseTokens,
  snapCaret,
  stripStray,
  tokenCounts,
  toPlainText,
} from './helpers/composer-tokens.js';
export type { ComposerToken, EditResult, TriggerMatch } from './helpers/composer-tokens.js';
export { diffStats, lineDiff, parseUnifiedDiff } from './helpers/diff.js';
export type { LineDiffOptions } from './helpers/diff.js';
export { codePointLength, formatBytes, formatCompact, formatDuration, lastLine, matchRanges, usageLevel, usagePercent } from './helpers/format.js';
