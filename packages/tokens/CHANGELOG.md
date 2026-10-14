# Changelog · @wzrhine/tokens

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。token **重命名或删除**视为破坏性变更；**色值调整**会注明对比度验证结果。

## [Unreleased]

## [0.2.0] - 2026-10-14

与四个组件 / 契约包保持同一版本线。本包没有删除或重命名 token，既有 token 的取值未变。

### Added
- 分类色 `--rl-category-1` … `--rl-category-8`：展示性分类（工具类别、材料分类等）的色调，随 `publicTokens` 纳入冻结合约（ADR-0013：展示性分类只驱动标签、图标与色调，不驱动行为）。
- `--rl-danger-hover`：危险操作悬停背景。浅色 `#bf3a34`（5.01:1）、深色 `#ffaba3`（9.92:1），system 主题同名重定义并登记对比度配对。

### Fixed
- 危险按钮悬停背景此前透明，因为对应的悬停 token 缺失；补齐后由 `@wzrhine/react` 的 Button `tone="danger"` 使用，组件侧修复见该包 changelog。

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
