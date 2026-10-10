# Changelog · @wzrhine/react

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。`0.x` 阶段允许破坏性变更，但都会在这里写明，并附迁移说明（COMPONENTS.md「API 稳定政策」）。

## [Unreleased]

尚未发布到 npm。以下内容为截至 M9 的全部变更，首次发布时会归入 `0.1.0`。

### Added
- **M1-A**：`Button`（primary / accent / secondary / ghost，sm / md / lg，loading 保持焦点并阻止重复提交）、`Surface`、`StatusBadge`；`motion/presets` 与 `useRhineMotion()`。
- **M1-B**：`Text`、`IconButton`（必须提供 `label` 或 `aria-labelledby`）、`Field`、`Input`。交互底座为 Base UI 1.8.0（ADR-0001）。
- **M2-A**：`RhineProvider`（主题作用域、弹层挂载点、减动策略、Tooltip 延迟）、`Tabs` / `TabList` / `Tab` / `TabPanel`、`Tooltip`、`Dialog` / `DialogClose`、`Select`。
- **M2-B**：`Popover` / `PopoverClose`、`Menu` 及其子项、`useToast` / `ToastViewport` / `ToastProvider`。`RhineProvider` 默认挂载通知队列。
- **M3**：`RecordHeader`、`MetadataList`、`ArchiveCard`、`StatusIndicator`、`Timeline`、`DataTable`。字段为空时自动隐藏，组件不会编造数据。
- **M5**：通过 `dist/` 发布 ESM 与 `.d.ts`；`publishConfig.exports` 提供 `.`、`./styles.css`、`./package.json`。
- **M7**：表单控件 `Textarea`（计数、自动增高）、`Checkbox`（含 indeterminate）、`CheckboxGroup`、`RadioGroup` / `Radio`、`Switch`、`Fieldset`、`Form`（提交时统一校验、聚焦第一个错误、`errors` 显示服务端错误），以及 `Separator`、`VisuallyHidden`。样式在新的 `forms.css` 中，由 `styles.css` 引入，无需额外导入。
- **M8**：`Pagination`（受控 / 非受控，当前页 `aria-current` 且可聚焦，`busy` 时保持焦点，窄容器紧凑模式）、`Breadcrumb`（折叠中间项、`renderLink` 接入路由）、`Progress`（含不确定态）、`Meter`（`low` / `high` / `optimum` 阈值，状态以文字表达）、`Stat`；辅助函数 `paginate`、`getPaginationItems`、`getMeterState`。`DataTable` 新增 `status`（loading / error）、`onRetry`、`emptyAction`、`pagination`，翻页保留调用方的选中集合。样式在 `data.css`，由 `styles.css` 引入。见 ADR-0005。
- **M9**：`AlertDialog`（`role="alertdialog"`，初始焦点在取消按钮；`onConfirm` 可返回 Promise，等待中不可取消，失败时保持打开并以 `role="alert"` 提示）、`Drawer` / `DrawerClose`（侧边面板，窄于 40rem 时为底部弹出，可滑动关闭）、`Alert`（`live` 显式选择 off / polite / assertive）、`Callout`（`role="note"`）、`EmptyState`、`Skeleton`、`Spinner`。`Dialog` 新增 `onCloseRequest(reason)` 关闭保护；`DataTable` 新增 `emptyDescription`；`ToastOptions` 新增 `id`（同 id 原地更新并重新计时）与 `action.keepOpen`，`ToastApi` 新增 `promise()`。样式在 `drawer.css`、`status.css`，由 `styles.css` 引入。见 ADR-0006。

### Changed
- **破坏性（M1-A，ADR-0003）**：`variant="primary"` 由橙底改为深墨底；橙色信号改用新增的 `variant="accent"`。
  - 迁移：原本需要橙色强调的按钮改为 `variant="accent"`；其余不用改。
- **破坏性（M1-A，ADR-0002）**：入口不再自动引入 CSS。
  - 迁移：在应用入口显式导入 `@wzrhine/tokens/styles.css` 和 `@wzrhine/react/styles.css`。
- **M2-B**：Popover、Menu、Select、Tooltip 改为 fixed 定位，打开浮层时不再导致页面滚动。
- **M7 前**：交互底座 Base UI 1.8.0 → 1.9.0（ADR-0001 修订）。上游修复覆盖本项目全部包裹模块（Menu focus guard、Popover/Tooltip 过渡完成判定、Select 大列表性能、Tabs 函数值、Toast 计时器、Field `defaultValue` 告警等），传递依赖 `@base-ui/utils` 0.4.0 → 0.5.0。公开 API 无变化（`api:check` 无漂移），对使用者无需任何改动。

### Changed（M9）
- **行为变化**：点击 Toast 的操作按钮后，默认关闭该通知（此前保持打开）。
  - 迁移：需要旧行为时传 `action: { label, onClick, keepOpen: true }`。
- 带操作且未指定 `timeout` 的 Toast 至少停留 10 秒（`max(toastTimeout, 10000)`；`toastTimeout=0` 时仍为 0）。
- `ToastProvider` 由 Base UI Provider 的别名改为包装组件，属性不变。
- `Button` 的加载指示、`DataTable` 的首次加载骨架与空状态、`Stat` 的加载骨架改由 `Spinner` / `Skeleton` / `EmptyState` 渲染。原有类名保留，外观不变（既有视觉基线组件区域零差异）；元素额外带 `rl-spinner` / `rl-skeleton` / `rl-empty` 类。

### Changed（M8，非破坏性）
- `RecordHeader` 的位置路径改由 `Breadcrumb` 渲染（`maxItems={0}`，从不折叠）。外观不变（既有视觉基线零像素差异），结构与语义不变；`<nav class="rl-record__trail">` 现在同时带 `rl-breadcrumb` 类，内部元素带 `rl-breadcrumb__*` 类。`RecordTrailItem` 改为 `BreadcrumbItem` 的类型别名。
  - 迁移：若用精确的 `class="rl-record__trail"` 字符串匹配服务端 HTML，或在样式里写了 `.rl-record__trail li` 等后代选择器，请改为匹配类名本身或改用 `.rl-breadcrumb__*`。
- `DataTable` 不传新属性时渲染结果与之前完全相同（单测断言）；空状态文字改为在单元格中居中（此前因选择器特异性实际左对齐）。

### Changed（M7，非破坏性）
- `Field` 与新控件共用标签和错误部件，DOM 与外观不变（31 张既有视觉基线中组件区域零像素差异）。放在 `Form` 内并设置了 `name` 的 `Field` 会显示 `errors` 中对应的服务端错误。

### Fixed
- **M2-B**：`RhineProvider` 首次渲染时弹层可能挂到 `<body>`、拿不到主题的问题。
- **M3**：DataTable 视觉隐藏的表头会撑宽页面；窄容器中单元格被压成一字一行。
- **M6**：宿主页面的全局元素样式会改变组件外观，包括 `button` 的大写和字距、`table / th / td` 的边框和内距、`h2` 字体，以及在组件样式**之后**加载的 `* { box-sizing: content-box }`。新增 `reset.css`（由 `styles.css` 首先引入），只在 `rl-` 类上复位这些属性；组件根节点的 `box-sizing` 改为类级选择器。宿主自身样式不受影响（`examples/host-embed` 的 E2E 双向验证）。
  - 迁移：通常无需改动。若曾借助宿主全局规则调整组件外观，请改为给组件传 `className`。
- **M6**：DataTable 渲染单元格时把 `key` 展开进 JSX，React 19 在开发模式与 SSR 中会输出告警。

### Requirements
- peer：`react` / `react-dom` ^18.2 || ^19，`motion` ^12。
- 所有弹层组件必须放在 `RhineProvider` 内。

升级步骤见 [UPGRADING.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/UPGRADING.md)。
