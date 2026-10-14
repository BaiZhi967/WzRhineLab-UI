# Changelog · @wzrhine/agent-core

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。本包为 **Experimental**，0.x 期间 API 可能调整。

## [Unreleased]

## [0.2.0] - 2026-10-14

### Added
- **B2 · 材料与运行事实**：`ModelEffort.xhigh`；文件材料的可信统计（`statsReliable`、`observedBytes`）与原文 / 编辑 / 补丁三类材料的分页（`MaterialPageView`、`hasMore`、`materialReady`）和补丁基线 `expectedVersion`；manage-files 的操作计数与分页（`counts`、`total`、`page`）及 `created`；原生模型运行事实（`endpoint`、`route`、`timeoutMs`、`sha256`、`arguments`、`remote`、`stopReason`、`saveRetry`、`saveError`）；结构化工具失败；终端 `source` / `activity` / `tail`；上下文估算的 `estimated` 标记与回执投递状态（`delivered`、`unreadOutcome`）。
- **B5 · Composer token**：`reconcileTokens(value, bindings)` 按触发符与完整名称把宿主绑定对账到当前草稿（保留原顺序、丢弃失效绑定、不发明绑定）与 `pathCrumbs(path, root)`（相对路径按根路径处理，绝对路径在 `root` 下时首段为根目录）；`TokenBinding` 类型导出。
- **ADR-0013 · 开放分类法**：新增 `KnownModelEffort`、`ModelEffortOption`、`ModelCapability`、`AttachmentKind`、`ReferenceKind`、`CitationSourceType`、`RecoveryKind` 类型导出；展示性分类字段放宽为 `Known | (string & {})`，状态机枚举（`RunStatus` / `ToolStatus` / `SyncStatus` / `ActionStatus` 等）保持封闭。

### Changed
- **行为变化**：token 编码不再把名称中的空格替换为连字符。历史草稿用 `reconcileTokens(value, bindings)` 与宿主绑定对账；不匹配的绑定会被丢弃。
- `detectTrigger` 增加第四个参数 `options.slash`（`"line-start" | "word-start"`），用于斜杠命令只在行首 / 词首识别的场景。
- `ModelOptionView.efforts` 接受 `(ModelEffort | ModelEffortOption)[]`，选项可自带 `label` / `description`。

## [0.1.0] - 2026-10-12

首次发布。

### Added
- **M12（ADR-0010 / ADR-0011）**：新包。Conversation、Message（13 种 part）、Run / Process、Tool（11 种专项 detail）、Approval、Questionnaire、Composer、Terminal、Subagent、ContextUsage、PinnedSummary、Ledger、FilePreview、RunSummary 的 view-model；状态轴 `RunStatus` / `RunPhase` / `SyncStatus` / `ActionStatus` / `ToolStatus` 等（统一 kebab-case）；`AgentActionContext` / `AgentActionResult` / `Capability`。
- 纯函数：`mergeById`、`dedupeById`、`sequenceGaps`、`buildTree`、`compareRevision`、`isStaleRevision`、`capability`；状态元数据 `runStatusMeta` 等与 `sparkPhase`、`canStopRun`；composer token（`encodeToken`、`parseTokens`、`toPlainText`、`insertToken`、`snapCaret`、`deleteTokenAt`、`detectTrigger`…）；`lineDiff`、`parseUnifiedDiff`、`diffStats`；`formatCompact`、`formatDuration`、`formatBytes`、`usagePercent`（不完整数据不给百分比）等。
