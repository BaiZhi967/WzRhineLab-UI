# Changelog · @wzrhine/tokens

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。token **重命名或删除**视为破坏性变更；**色值调整**会注明对比度验证结果。

## [Unreleased]

尚未发布到 npm。首次发布时归入 `0.1.0`。

### Added
- `.rl-theme` 作用域下的语义 CSS 变量：背景、前景、边框、研究橙信号、状态色、焦点、字体角色、4px 间距、圆角、边框宽度、密度、动效时长与缓动。不修改 `:root`。
- 明 / 暗 / system 三套主题（`data-rl-theme`），以及 compact 密度（`data-rl-density`）和强制减动（`data-rl-motion="reduce"`）。
- 类型化的 manifest（`colorGroups`、`typeRoles`、`spaceScale`、`motionDurations`、`contrastPairs` 等）和 `contrastRatio()` 工具。
- 随组件逐步新增的 token：字段（`--rl-bg-readonly`、`--rl-field-label-width`）、浮层宽度与层级、`--rl-fg-on-danger`、`--rl-orbit-size`。
- **M5**：通过 `dist/` 发布 ESM 与 `.d.ts`；`./styles.css` 导出。

### Changed
- **M1-A（ADR-0003）**：浅色 `--rl-fg-muted`、`--rl-fg-subtle`、`--rl-accent-text` 与各状态色较 STYLE.md Draft 0.1 有所加深，以满足 WCAG 2.2 AA。`--rl-focus` 改为独立的蓝墨色。所有组合由测试在三种主题下验证。
