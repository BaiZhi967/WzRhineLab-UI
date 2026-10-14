# Changelog · @wzrhine/agent

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。本包为 **Experimental**，0.x 期间 API 可能调整。

## [Unreleased]

## [0.2.0] - 2026-10-14

### Added
- **B5 · 选择器与 composer 回执**：`SkillPicker`、`ReferencePicker`（异步加载、失败重试、IME 防护）；Composer 支持只发附件与引用（`allowEmptyText`）与持久化重试（`onRetryPersistence`、`retryBusy`），slash 触发规则与 `agent-core` 的 `options.slash` 对齐；ModelPicker 的失效 effort 重置（`effortState`、`onEffortReset`）与 `effortLabels`；PermissionPicker 的权限错误与回执（`receipt`）。
- **B6 · 运行概览与会话结构**：`RunOverview`（含 `RunOverviewFact`、`RunOverviewSection`）；会话列表分组（`collapsibleGroups`、`collapsedGroups`、`onCollapsedGroupsChange`）；MessageList 的 `followThreshold`、`jumpThreshold` 与 `nestedScrollSelector`；ContextUsage 受控打开与估算状态；AgentShell 下钻与附件入场动效。
- **B7 · 工具与工作区状态**：工具材料的计数、分页与可靠性展示（`counts`、`total`、`page`、`statsReliable`、`observedBytes`）；终端与子 Agent 列表的加载 / 错误 / 重试（`onRetry`、`retrying`）与按状态分组（`groupBy="state"`）；终端停止操作；问卷单选推进。
- **ADR-0013 · 开放分类法**：`AgentIcon`、`StatusGlyph` 的 `name` 接受任意字符串并新增 `children` 覆盖；`CitationChip` 的 `icon`；文案表中分类标签改为「已知键必填 + 自定义键可选」，纯字符串记录按按键合并（新增一个自定义标签不再需要复制整表）；`renderQuestion` / `QuestionRenderContext`、`isChoiceQuestion`、`isKnownQuestionKind`、`normalizeEfforts`。

### Fixed
- MessageActions / CodeBlock 复制失败保留可访问错误，直到下一次复制成功（不再自动消失）。
- MessageList 嵌套滚动可以标记内部归属；历史阅读阈值可配置。

### Changed
- peer `motion` 为 `^14.0.0`，本仓开发与验证版本为 14.1.0；与其余四个包同一版本线。
  - 迁移：升级到 motion 14.1.0，并确保应用内 React 与 motion 各只有一份。
- 标签解析优先级（ADR-0009）：组件属性 > 视图模型自带 > 最近 Provider 的文案表 > 原始 id；自定义取值一律回落到此顺序末尾，不渲染空白。
- 工作区组件的 `messages` 属性类型由 `Partial<AgentWorkspaceMessages>` 放宽为 `WorkspaceMessagesProp`（嵌套文案表可以只传部分键）；原本的 `Partial<AgentWorkspaceMessages>` 仍然合法，无需改动。
- 体积（ADR-0008 §3）：`agent-full` gzip 89.45 → 94.96 KB、`agent-css` 16.41 → 16.69 KB；**预算未调整**（仍是 100 KB / 19 KB），`agent-status` / `agent-full` = 1.2%（[SIZE.md](../../docs/development/SIZE.md)）。

## [0.1.0] - 2026-10-12

首次发布。

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
