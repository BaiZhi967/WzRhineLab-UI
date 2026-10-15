# Changelog · @wzrhine/patterns

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。`0.x` 阶段允许破坏性变更，但都会在这里写明，并附迁移说明。

## [Unreleased]

### Added

- 建包（[ADR-0014](../../docs/development/adr/0014-patterns-package-and-p030-scope.md)）：`PatternsMessagesProvider`、`usePatternsMessages`、`mergePatternsMessages`、`patternsZhCN` / `patternsEnUS` 文案表与 `@wzrhine/patterns/styles.css` 样式入口。`@wzrhine/react` 为 peer 依赖；组件自 P030-02 起加入。
