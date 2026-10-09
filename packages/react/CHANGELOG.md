# Changelog · @wzrhine/react

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。`0.x` 阶段允许破坏性变更，但都会在这里写明，并附迁移说明（COMPONENTS.md「API 稳定政策」）。

## [Unreleased]

尚未发布到 npm。以下内容为截至 M5 的全部变更，首次发布时会归入 `0.1.0`。

### Added
- **M1-A**：`Button`（primary / accent / secondary / ghost，sm / md / lg，loading 保持焦点并阻止重复提交）、`Surface`、`StatusBadge`；`motion/presets` 与 `useRhineMotion()`。
- **M1-B**：`Text`、`IconButton`（必须提供 `label` 或 `aria-labelledby`）、`Field`、`Input`。交互底座为 Base UI 1.8.0（ADR-0001）。
- **M2-A**：`RhineProvider`（主题作用域、弹层挂载点、减动策略、Tooltip 延迟）、`Tabs` / `TabList` / `Tab` / `TabPanel`、`Tooltip`、`Dialog` / `DialogClose`、`Select`。
- **M2-B**：`Popover` / `PopoverClose`、`Menu` 及其子项、`useToast` / `ToastViewport` / `ToastProvider`。`RhineProvider` 默认挂载通知队列。
- **M3**：`RecordHeader`、`MetadataList`、`ArchiveCard`、`StatusIndicator`、`Timeline`、`DataTable`。字段为空时自动隐藏，组件不会编造数据。
- **M5**：通过 `dist/` 发布 ESM 与 `.d.ts`；`publishConfig.exports` 提供 `.`、`./styles.css`、`./package.json`。

### Changed
- **破坏性（M1-A，ADR-0003）**：`variant="primary"` 由橙底改为深墨底；橙色信号改用新增的 `variant="accent"`。
  - 迁移：原本需要橙色强调的按钮改为 `variant="accent"`；其余不用改。
- **破坏性（M1-A，ADR-0002）**：入口不再自动引入 CSS。
  - 迁移：在应用入口显式导入 `@wzrhine/tokens/styles.css` 和 `@wzrhine/react/styles.css`。
- **M2-B**：Popover、Menu、Select、Tooltip 改为 fixed 定位，打开浮层时不再导致页面滚动。

### Fixed
- **M2-B**：`RhineProvider` 首次渲染时弹层可能挂到 `<body>`、拿不到主题的问题。
- **M3**：DataTable 视觉隐藏的表头会撑宽页面；窄容器中单元格被压成一字一行。

### Requirements
- peer：`react` / `react-dom` ^18.2 || ^19，`motion` ^12。
- 所有弹层组件必须放在 `RhineProvider` 内。
