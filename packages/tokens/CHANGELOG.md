# Changelog · @wzrhine/tokens

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。token **重命名或删除**视为破坏性变更；**色值调整**会注明对比度验证结果。

## [Unreleased]

目标发行版本 0.2.0，与四个组件/契约包保持同一版本线。本包没有删除或重命名 token。

## [0.1.0] - 2026-10-12

首次发布。

### Added
- `.rl-theme` 作用域下的语义 CSS 变量：背景、前景、边框、研究橙信号、状态色、焦点、字体角色、4px 间距、圆角、边框宽度、密度、动效时长与缓动。不修改 `:root`。
- 明 / 暗 / system 三套主题（`data-rl-theme`），以及 compact 密度（`data-rl-density`）和强制减动（`data-rl-motion="reduce"`）。
- 类型化的 manifest（`colorGroups`、`typeRoles`、`spaceScale`、`motionDurations`、`contrastPairs` 等）和 `contrastRatio()` 工具。
- 随组件逐步新增的 token：字段（`--rl-bg-readonly`、`--rl-field-label-width`）、浮层宽度与层级、`--rl-fg-on-danger`、`--rl-orbit-size`。
- **M5**：通过 `dist/` 发布 ESM 与 `.d.ts`；`./styles.css` 导出。
- **M6 · 稳定主题契约**：`publicTokens`（按用途分组）、`allPublicTokens`、`themedPublicTokens`、`themeAttributes`、类型 `PublicToken` / `TokenCategory`，以及 `tokenVar(name, fallback?)`。测试保证 `tokens.css` 定义的变量与契约完全一致（114 个），且 dark / system 主题恰好重定义全部颜色与阴影 token。此后删除或重命名契约内的 token 视为破坏性变更。

### Changed
- **M1-A（ADR-0003）**：浅色 `--rl-fg-muted`、`--rl-fg-subtle`、`--rl-accent-text` 与各状态色较 STYLE.md Draft 0.1 有所加深，以满足 WCAG 2.2 AA。`--rl-focus` 改为独立的蓝墨色。所有组合由测试在三种主题下验证。

### Fixed
- **M6**：system 主题块中 `--rl-bg-readonly` 重复声明（值相同，无视觉变化）；新增测试禁止任何块内重复声明。

升级步骤见 [UPGRADING.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/UPGRADING.md)。
