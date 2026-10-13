# Changelog · @wzrhine/agent-core

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。本包为 **Experimental**，0.x 期间 API 可能调整。

## [Unreleased]

### Added
- `ModelEffort.xhigh`；文件材料的可信统计、原文/编辑/补丁分页、基线版本；manage-files 计数与分页、原生模型结果字段、结构化工具失败、终端来源/活动/尾输出、上下文估算。
- `reconcileTokens` 和 `pathCrumbs`；token 名称支持空格，保留宿主绑定。

### Changed
- 目标发行版本为 0.2.0，token 编码不再把名称中的空格替换为连字符。

## [0.1.0] - 2026-10-12

首次发布。

### Added
- **M12（ADR-0010 / ADR-0011）**：新包。Conversation、Message（13 种 part）、Run / Process、Tool（11 种专项 detail）、Approval、Questionnaire、Composer、Terminal、Subagent、ContextUsage、PinnedSummary、Ledger、FilePreview、RunSummary 的 view-model；状态轴 `RunStatus` / `RunPhase` / `SyncStatus` / `ActionStatus` / `ToolStatus` 等（统一 kebab-case）；`AgentActionContext` / `AgentActionResult` / `Capability`。
- 纯函数：`mergeById`、`dedupeById`、`sequenceGaps`、`buildTree`、`compareRevision`、`isStaleRevision`、`capability`；状态元数据 `runStatusMeta` 等与 `sparkPhase`、`canStopRun`；composer token（`encodeToken`、`parseTokens`、`toPlainText`、`insertToken`、`snapCaret`、`deleteTokenAt`、`detectTrigger`…）；`lineDiff`、`parseUnifiedDiff`、`diffStats`；`formatCompact`、`formatDuration`、`formatBytes`、`usagePercent`（不完整数据不给百分比）等。
