# Changelog · @wzrhine/react

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。`0.x` 阶段允许破坏性变更，但都会在这里写明，并附迁移说明（COMPONENTS.md「API 稳定政策」）。

## [Unreleased]

### Fixed
- **MFX-01**：统一 `useRhineMotion` 与 `useMotionLifecycle` 的系统减动订阅，运行中改变 `prefers-reduced-motion` 时立即通知所有消费者；保留 MotionConfig user/always/never 优先级，SSR 首帧确定且只有一组共享媒体监听。未新增公开 API 或依赖。

## [0.2.0] - 2026-10-14

Wpi-Agent 接入补齐（M13，B0–B9）。五个包同一版本线，公开 API 相对 0.1.0 只有新增，没有重命名或删除。

### Added
- **B1 · 公共图标入口**：`@wzrhine/react/icons` 导出 `Icon`、`iconNames`、`IconName`、`IconProps`。家族语法为 24×24 网格、1.75 描边、圆端圆角、`currentColor`，本包保持零运行时图标依赖（[ICONS.md](../../docs/design/ICONS.md)）。
  - 方向（2026-10-14 batch-02）：搜索、箭头、文件、状态等通用字形交给消费方（如 Wpi-Agent）的 Lucide 基础层；本库只保留既有内置字形与 4 枚承载科研 / 档案 / 智能体语义的定制字形 `Agent`、`Caliper`、`Sample`、`Index`。混排时把 Lucide 组件统一设为 `strokeWidth={1.75}`。
- **B3、B4 · 壳层与导航**：`Workbench`（含 `WorkbenchIndex`、`useWorkbench`）、`NavRail`、`NavList`、`NavGroup`、`NavItem`、`Tree`（含 `TreeNode`：展开、选择、方向键、Home / End、typeahead、懒加载与重试）、`CountBadge`、`Tag`、公共 `ResizeHandle`（`@wzrhine/agent` 原有导出保留）。
- **B5、B8 · 覆盖层与表单扩展**：Popover 外部 `anchor`（元素、ref 或虚拟矩形）、`sideOffset`、`initialFocus={false}`；AlertDialog 第三按钮（`AlertDialogAlternateAction`）、禁用确认与强调方式；Dialog 关闭按钮与 `finalFocus`；RadioGroup `appearance="chip" | "card"`、隐藏标签与图标槽；Form `submitOnEnter`；Button `tone="danger"`（`ButtonTone`）；Alert `size`（`AlertSize`）；ScrollArea `reveal`（`ScrollReveal`）。
- **ADR-0013 · 开放分类法**：`Icon` 的 `name` 接受任意字符串，新增 `children` 覆盖内置路径；自定义图标必须搭配 `children`，否则渲染空 SVG。

### Changed
- **破坏性（声明层面）**：peer `motion` 由 `^12` 升到 `^14.0.0`，本仓开发与验证版本为 14.1.0。
  - 迁移：升级到 motion 14.1.0，并确保应用内 React 与 motion 各只有一份；其余不用改（见 UPGRADING「升到 0.2.0」）。
- 体积（ADR-0008 §3）：`react-full` gzip 182.34 → 189.00 KB、`react-css` 15.17 → 16.10 KB；**预算未调整**（仍是 202 KB / 18 KB），`react-button` / `react-full` = 1.4%，tree-shaking 正常（[SIZE.md](../../docs/development/SIZE.md)）。

### Fixed
- Button `tone="danger"` 悬停背景此前透明（`--rl-danger-hover` 未定义），现在按 accent 的惯例在悬停时变亮；两种主题均有 E2E 断言。
- Tree 选中行引用未定义的 `--rl-bg-selected`（选中态透明），改用 `--rl-bg-subtle`。
- CountBadge 引用未定义的 `--rl-type-meta-size`，字号回落到 mono 12px。

## [0.1.0] - 2026-10-12

首次发布（截至 M12 的全部变更）。

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
- **M10（ADR-0007）**：Motion Core。`MotionPresence`（`fade` / `panel` / `rise` 预设，中途反向、隐藏后卸载）、`RhineMotionGroup` / `RhineMotionItem`（每项 24ms 错峰，总延迟上限 120ms，减动时无错峰无位移）；`resolveMotion` 与 `useRhineMotion().resolve(kind, name)`：按属性类型减动（颜色 / 透明度保留不超过 120ms 的淡入，位移 / 布局直接到位，循环停止）；`MotionSpeed` / `useMotionSpeed`（仅用于审查慢放）；`useMotionLifecycle`（start / pause / resume / stop，页面隐藏、离开视口、减动时暂停并给出原因）；`usePageVisible` / `useInViewport`（全库唯一的可见性来源）；`useLatestGuard`（过期异步结果守卫）；`transition.showcase` 预设（700ms，每个时长 token 现在都有同名预设）。`ArchiveCard` 新增可选 `motion="identity"` 与 `ArchiveIdentity`：记录编号从卡片连续移动到详情（`scene`，减动时直接切换），默认关闭。

- **M9.5（ADR-0008、ADR-0009）**：默认文案表 `RhineMessages` 与 `zhCN`（内置默认，逐字不变）/ `enUS`（参考译文）、`useRhineMessages()`、`RhineMessagesProvider`；`RhineProvider` 新增 `messages`、`locale`（数字格式，默认 `zh-CN`）与 `lang`（写到 `.rl-theme` 根元素）。此前无法覆盖的内置文字现在都可覆盖：DataTable 全选 / 行选择 / 已选摘要、Toast 关闭按钮与通知视口名称、Field「（可选）」、MetadataList「未记录」、Textarea 计数、Stat 的加载与方向文字、Meter 读屏值。`Progress` / `Meter` 新增 `locale` 属性。优先级：组件属性 > 最近 Provider 的 `messages` > `zhCN`。见 [locale.md](../../docs/components/locale.md)。

- **M12（ADR-0010）**：Collapsible（Base UI，高度过渡可中断）、Accordion / AccordionItem（`headingLevel`、单 / 多开）、Slider（刻度标签作为读屏值、范围滑块 `thumbLabels`）、NumberField（Field 语义、本地化格式、`aria-roledescription` 可覆盖）、ContextMenu（复用 Menu 部件；右键、长按、Shift+F10 / ContextMenu 键）、Combobox（分组、异步搜索、`filter={null}`、表单值）、CommandPalette（分组、`<mark>` 高亮、快捷键 `hotkey`、禁用原因；异步模式 `query` / `onQueryChange` / `loading`，命令 `meta` / `icon`）、FileDropZone（`accept` / `maxSize` / `maxFiles` 校验、拒绝原因 polite 播报）、SplitButton、ScrollArea（Base UI scroll-area，可聚焦 region，forced-colors 下保留原生滚动条）。`useRhineLocale` 改为公开导出。见 [advanced.md](../../docs/components/advanced.md)、[command.md](../../docs/components/command.md)。

### Changed（M12，非破坏性）
- `RhineMessages` 新增命名空间（见 UPGRADING 第 13 条）；`size-budget.json` 中 react-full / react-css 预算上调（[SIZE.md](../../docs/development/SIZE.md)）。

### Fixed（M12）
- ContextMenu：Firefox 不会为聚焦元素派发 `contextmenu`，现在显式处理 Shift+F10 / ContextMenu 键。

### Changed（M9.5）
- **破坏性（声明层面，ADR-0008）**：peer `react` / `react-dom` 由 `^18.2.0 || ^19.0.0` 收窄为 `^19.0.0`。React 18 项目安装时会收到 peer 冲突提示；此前也未正式支持 React 18。
  - 迁移：升级到 React 19。
- 运行时使用 React 的模块在产物首行带 `'use client'`，Next.js App Router 的服务端组件可以直接导入组件，不再需要包装文件；需要函数 props 的组件（如 DataTable）仍要放在使用者自己的 `'use client'` 文件中。
- `paginate`、`getPaginationItems`、`getMeterState` 移到不带指令的纯模块，服务端组件可以直接调用；从入口导入的写法不变。
- 默认文案改为从文案表读取，默认输出逐字不变（既有单测、SSR 示例与视觉基线保证）；组件源码中不再出现中文字面量（package-boundary 测试）。

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

### Changed（M10，非破坏性）
- `useRhineMotion()` 返回值增加 `speed` 与 `resolve`；`get(name)` 行为不变（减动时一律 `instant`）。
- 减动下的淡入回退不再受 `MotionSpeed` 慢放影响，始终不超过 `fast`。

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
- peer：`react` / `react-dom` ^19（M9.5 起），`motion` ^12。
- 所有弹层组件必须放在 `RhineProvider` 内。

升级步骤见 [UPGRADING.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/UPGRADING.md)。
