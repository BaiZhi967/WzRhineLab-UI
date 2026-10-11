# Changelog · @wzrhine/agent

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。本包为 **Experimental**，0.x 期间 API 可能调整。

## [Unreleased]

尚未发布到 npm。首次发布时归入 `0.1.0`。

### Added
- **M12（ADR-0010 / 0011 / 0012）**：新包。基座：`AgentMessagesProvider`（`agentZhCN` / `agentEnUS`）、`useAgentFormat`、`AgentIcon`、`StatusGlyph`、`AgentStatus`、`AgentSpark`、`AgentEntrance`、`useAgentLoop`。
- 组件族（图册 46 个组件全覆盖）：
  - Shell：AgentShell（自测宽度三档布局）、ResizeHandle、AgentHeader、ConversationList / ConversationRow、AgentSidePane、AgentEmptyState。
  - Message：MessageList（跟随、锚点、`holdFollow`）、JumpToLatest、AgentMessage、MessagePart（13 类，未知类型兜底）、CodeBlock、ThinkingBlock、CitationChip、MessageActions（能力禁用原因、重新编辑本轮输入）、RunDetails、SkillUseList、AgentProcess、RunStatus。
  - Tools：ToolActivity、ToolRecord、CodeModeToolTree、ToolOutput、ToolHistory、ChunkPager、DiffPreview / MultiFileDiff，以及 11 类工具专项详情。
  - Composer：Composer、ComposerInput（token 镜像、IME 防护）、MentionMenu、SlashCommandMenu、AttachmentList、SendStopButton、ModelPicker、PermissionPicker、ComposerNotice。
  - Intervention：ApprovalPanel（材料门禁、未知回执用同一 actionId 重试）、QuestionnaireCard、ErrorRecoveryNotice、InterventionDock、GrantList。
  - Workspace 与产物：PersistentTerminal / TerminalTabs、TerminalRow / TerminalList、SubAgentCard / SubAgentList、ContextUsage、PinnedSummary、ActivityLedger、RunSummary、CompactionNotice、ArtifactCard / ArtifactList、FilePreview、FilePreviewTabs。
- 动效（ADR-0012）：首次出现才入场、折叠高度过渡、Send ↔ Stop 交叉淡入、AgentSpark 分阶段节奏与静态帧；循环只在可见、在视口内且非减动时运行。
- 文案：`agentZhCN` / `agentEnUS`（英文未经母语审校），按组件族拆分；数字与时间使用最近 `RhineProvider` 的 locale。
