// @wzrhine/agent: Agent UI components (ADR-0010 … ADR-0012). View-models in (`@wzrhine/agent-core`),
// actions out; no runtime, transport, cache or SDK dependency. Styles are opt-in via
// `@wzrhine/agent/styles.css`; this entry has no CSS side effects.

// ---------- provider & copy ----------
export { AgentMessagesProvider, agentEnUS, agentZhCN, mergeAgentMessages, useAgentFormat, useAgentMessages } from './provider/AgentMessages.js';
export type { AgentFormat, AgentMessages, AgentMessagesOverrides, AgentMessagesProviderProps } from './provider/AgentMessages.js';

// ---------- primitives & motion ----------
export { AgentIcon } from './primitives/icons.js';
export type { AgentIconName, AgentIconProps } from './primitives/icons.js';
export { StatusGlyph } from './primitives/StatusGlyph.js';
export type { StatusGlyphProps } from './primitives/StatusGlyph.js';
export { AgentStatus, statusProps } from './primitives/AgentStatus.js';
export type { AgentStatusProps } from './primitives/AgentStatus.js';
export { AgentSpark } from './primitives/AgentSpark.js';
export type { AgentSparkProps } from './primitives/AgentSpark.js';
export { AGENT_STAGGER_CAP_MS, AGENT_STAGGER_MS, AgentEntrance, agentStaggerDelay, loopAttributes, useAgentLoop, useSwapTransition } from './motion/agent-motion.js';
export type { AgentEntranceKind, AgentEntranceProps } from './motion/agent-motion.js';

// ---------- contracts (re-exported for convenience) ----------
export * from '@wzrhine/agent-core';

// ---------- shell & conversation ----------
export { AgentShell, useAgentContextPresentation, useAgentShell } from './components/shell/AgentShell.js';
export type { AgentContextPresentation, AgentShellContextValue, AgentShellLayout, AgentShellOpenReason, AgentShellProps } from './components/shell/AgentShell.js';
export { ResizeHandle } from './components/shell/ResizeHandle.js';
export type { ResizeHandleProps } from './components/shell/ResizeHandle.js';
export { AgentHeader } from './components/shell/AgentHeader.js';
export type { AgentHeaderBadge, AgentHeaderProps } from './components/shell/AgentHeader.js';
export { AgentSidePane } from './components/shell/AgentSidePane.js';
export type { AgentSidePaneProps, AgentSidePaneSection } from './components/shell/AgentSidePane.js';
export { AgentEmptyState, AgentWorkspaceEmpty } from './components/shell/AgentEmptyState.js';
export type { AgentEmptyStateProps } from './components/shell/AgentEmptyState.js';
export { ConversationList } from './components/conversation/ConversationList.js';
export type { ConversationListProps } from './components/conversation/ConversationList.js';
export { ConversationRow } from './components/conversation/ConversationRow.js';
export type { ConversationRowProps } from './components/conversation/ConversationRow.js';
export type { AgentShellMessages } from './provider/messages/shell.js';

// ---------- message, thinking & process ----------
export { FOLLOW_THRESHOLD_PX, MessageList } from './components/message/MessageList.js';
export type { MessageListHandle, MessageListProps } from './components/message/MessageList.js';
export { JumpToLatest } from './components/message/JumpToLatest.js';
export type { JumpToLatestProps } from './components/message/JumpToLatest.js';
export { AgentMessage, messagePlainText } from './components/message/AgentMessage.js';
export type { AgentMessagePartHandlers, AgentMessageProps } from './components/message/AgentMessage.js';
export { ArtifactFallback, MessageErrorNotice, MessagePart, ToolFallback, UnsupportedPart } from './components/message/MessagePart.js';
export type { MessagePartProps } from './components/message/MessagePart.js';
export type { ArtifactRenderer, CodePart, CustomPart, MarkdownRenderContext, MessagePartRenderers, ToolRenderer } from './components/message/renderers.js';
export { CodeBlock } from './components/message/CodeBlock.js';
export type { CodeBlockProps } from './components/message/CodeBlock.js';
export { ThinkingBlock } from './components/message/ThinkingBlock.js';
export type { ThinkingBlockProps } from './components/message/ThinkingBlock.js';
export { CitationChip } from './components/message/CitationChip.js';
export type { CitationChipProps } from './components/message/CitationChip.js';
export { MessageActions } from './components/message/MessageActions.js';
export type { MessageActionCapabilities, MessageActionKey, MessageActionsProps, MessageFeedback } from './components/message/MessageActions.js';
export { RunDetails, hasRunDetails } from './components/message/RunDetails.js';
export type { RunDetailsProps } from './components/message/RunDetails.js';
export { DIGEST_LENGTH, SkillUseList } from './components/message/SkillUseList.js';
export type { SkillUseListProps } from './components/message/SkillUseList.js';
export { COPY_FEEDBACK_MS } from './components/message/use-copy.js';
export type { CopyHandler, CopyState } from './components/message/use-copy.js';
export { AgentProcess } from './components/process/AgentProcess.js';
export type { AgentProcessProps } from './components/process/AgentProcess.js';
export { RunStatus } from './components/process/RunStatus.js';
export type { RunStatusProps } from './components/process/RunStatus.js';

// ---------- tools & execution ----------
export { ToolRecord } from './components/tools/ToolRecord.js';
export type { ToolRecordProps } from './components/tools/ToolRecord.js';
export { ToolActivity, orderTools } from './components/tools/ToolActivity.js';
export type { ToolActivityProps, ToolRowSharedProps } from './components/tools/ToolActivity.js';
export { CodeModeToolTree, ScriptDisclosure, childOutcome } from './components/tools/CodeModeToolTree.js';
export type { CodeModeToolTreeProps } from './components/tools/CodeModeToolTree.js';
export { ToolOutput } from './components/tools/ToolOutput.js';
export type { ToolOutputProps } from './components/tools/ToolOutput.js';
export { ChunkPager } from './components/tools/ChunkPager.js';
export type { ChunkPagerActions, ChunkPagerProps } from './components/tools/ChunkPager.js';
export { ToolHistory, useStableOrder } from './components/tools/ToolHistory.js';
export type { ToolHistoryProps } from './components/tools/ToolHistory.js';
export { DiffPreview, DiffStats, DiffStatusPill, MultiFileDiff, resolveDiff } from './components/tools/DiffPreview.js';
export type { DiffPreviewProps, MultiFileDiffProps } from './components/tools/DiffPreview.js';
export { ApplyPatchDetail, EditFileDetail, FileReadDetail, FileWriteDetail, GenericToolDetail, MCPExecuteDetail, ManageFilesDetail, NativeModelDetail, QuestionToolDetail, RunCommandDetail, SubagentToolDetail, ToolDetail } from './components/tools/ToolDetails.js';
export type { ApplyPatchDetailProps, EditFileDetailProps, FileReadDetailProps, FileWriteDetailProps, GenericToolDetailProps, MCPExecuteDetailProps, ManageFilesDetailProps, NativeModelDetailProps, QuestionToolDetailProps, RunCommandDetailProps, SubagentToolDetailProps, ToolDetailActions, ToolDetailProps } from './components/tools/ToolDetails.js';
export { ToolCategoryChip, ToolStatusPill } from './components/tools/shared.js';

// ---------- composer & selection ----------
export { Composer } from './components/composer/Composer.js';
export type { ComposerProps } from './components/composer/Composer.js';
export { ComposerInput } from './components/composer/ComposerInput.js';
export type { ComposerInputHandle, ComposerInputProps, ComposerSelection, ComposerTokenKind } from './components/composer/ComposerInput.js';
export { MentionMenu } from './components/composer/MentionMenu.js';
export type { MentionMenuProps } from './components/composer/MentionMenu.js';
export { SlashCommandMenu } from './components/composer/SlashCommandMenu.js';
export type { SlashCommandMenuProps } from './components/composer/SlashCommandMenu.js';
export { AttachmentList } from './components/composer/AttachmentList.js';
export type { AttachmentListProps } from './components/composer/AttachmentList.js';
export { SendStopButton } from './components/composer/SendStopButton.js';
export type { SendStopButtonProps } from './components/composer/SendStopButton.js';
export { ModelPicker } from './components/composer/ModelPicker.js';
export type { ModelPickerProps } from './components/composer/ModelPicker.js';
export { PermissionPicker } from './components/composer/PermissionPicker.js';
export type { PermissionPickerProps } from './components/composer/PermissionPicker.js';
export { ComposerNotice } from './components/composer/ComposerNotice.js';
export type { ComposerNoticeAction, ComposerNoticeProps, ComposerNoticeTone } from './components/composer/ComposerNotice.js';
export {
  defaultMentionTokenName,
  drillQuery,
  filterCommandOptions,
  filterMentionOptions,
  moveActiveIndex,
  orderCommandOptions,
  removeTokens,
  resolveSendStop,
  splitMentionQuery,
} from './components/composer/composer-utils.js';
export type { SendStopInput, SendStopResolved, SendStopState } from './components/composer/composer-utils.js';
export type { AgentComposerMessages } from './provider/messages/composer.js';

// ---------- approval & questionnaire ----------
export { ApprovalPanel } from './components/intervention/ApprovalPanel.js';
export type { ApprovalPanelProps } from './components/intervention/ApprovalPanel.js';
export { QuestionnaireCard } from './components/intervention/QuestionnaireCard.js';
export type { QuestionnaireCardHandle, QuestionnaireCardProps } from './components/intervention/QuestionnaireCard.js';
export { answerState, answerText, isOverLimit, isQuestionOptional, normalizeAnswers } from './components/intervention/questionnaire-answers.js';
export type { QuestionAnswerState } from './components/intervention/questionnaire-answers.js';
export { ErrorRecoveryNotice } from './components/intervention/ErrorRecoveryNotice.js';
export type { ErrorRecoveryNoticeProps } from './components/intervention/ErrorRecoveryNotice.js';
export { InterventionDock } from './components/intervention/InterventionDock.js';
export type { InterventionDockProps } from './components/intervention/InterventionDock.js';
export { GrantList } from './components/intervention/GrantList.js';
export type { GrantListProps } from './components/intervention/GrantList.js';
export type { AgentInterventionMessages } from './provider/messages/intervention.js';

// ---------- terminals, sub-agents, context & artifacts ----------
export { PersistentTerminal, TerminalTabs, isTerminalReadOnly } from './components/workspace/PersistentTerminal.js';
export type { PersistentTerminalProps, TerminalTabsProps } from './components/workspace/PersistentTerminal.js';
export { TerminalList, TerminalRow, terminalGroup } from './components/workspace/TerminalRow.js';
export type { TerminalListProps, TerminalRowProps } from './components/workspace/TerminalRow.js';
export { SubAgentCard, SubAgentList, subagentSparkPhase } from './components/workspace/SubAgentCard.js';
export type { SubAgentCardProps, SubAgentListProps } from './components/workspace/SubAgentCard.js';
export { ContextUsage } from './components/workspace/ContextUsage.js';
export type { ContextUsageProps, ContextUsageVariant } from './components/workspace/ContextUsage.js';
export { PinnedSummary } from './components/workspace/PinnedSummary.js';
export type { PinnedSummaryProps } from './components/workspace/PinnedSummary.js';
export { ActivityLedger, orderLedger } from './components/workspace/ActivityLedger.js';
export type { ActivityLedgerProps } from './components/workspace/ActivityLedger.js';
export { RunSummary } from './components/workspace/RunSummary.js';
export type { RunSummaryProps } from './components/workspace/RunSummary.js';
export { CompactionNotice } from './components/workspace/CompactionNotice.js';
export type { CompactionNoticeProps, CompactionPhase, CompactionStatus } from './components/workspace/CompactionNotice.js';
export { ArtifactCard, ArtifactList, artifactKindIcon } from './components/artifact/ArtifactCard.js';
export type { ArtifactCardProps, ArtifactListProps } from './components/artifact/ArtifactCard.js';
export { FilePreview, pathCrumbs } from './components/artifact/FilePreview.js';
export type { FileOpenTarget, FilePreviewProps, FilePreviewZoom } from './components/artifact/FilePreview.js';
export { FilePreviewTabs } from './components/artifact/FilePreviewTabs.js';
export type { FilePreviewTab, FilePreviewTabsProps } from './components/artifact/FilePreviewTabs.js';
export type { AgentWorkspaceMessages, LedgerFilterKey, TerminalGroupKey } from './provider/messages/workspace.js';
