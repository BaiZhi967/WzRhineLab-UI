# ADR-0005 · M8 数据与导航组件契约

- 状态：**Accepted** · 关联里程碑：M8 Data & Navigation
- 范围：`Pagination`、`Breadcrumb`、`Progress`、`Meter`、`Stat`，以及 `DataTable` 的加载、空、错误状态与分页
- 约束：Base UI 1.9.0 是唯一的 headless 底座（ADR-0001）；token 契约冻结（M6），不新增或修改 token

## 背景
`docs/planning/execution-backlog.md` 的 M8-1 要求先确定这些组件的 API、状态矩阵、键盘与读屏契约以及减动方案，再动手实现。本 ADR 记录这些决定，组件文档（`docs/components/data-navigation.md`）按本文实现后补齐用法细节。

## 决策

### 1. 底座选择
| 组件 | 底座 | 理由 |
| --- | --- | --- |
| Progress | Base UI `progress` | 提供 `role="progressbar"`、`aria-valuenow / valuetext`、不确定态，以及按 locale 格式化 |
| Meter | Base UI `meter` | 提供 `role="meter"`、min / max / value 语义 |
| Pagination | 原生 `<nav>` + `<button>` | Base UI 没有分页原语；分页只是一组按钮，不需要复合焦点管理 |
| Breadcrumb | 原生 `<nav>` + `<ol>` + `<a>` | 静态链接列表，不需要 headless 行为 |
| Stat | 原生 `<dl>`（或 `<div>` + 语义标签） | 静态展示 |

不引入新依赖。Pagination 用普通 Tab 顺序，不做 roving tabindex：它是导航而不是复合控件，WAI-ARIA APG 也没有为分页定义复合键盘模型。

### 2. Progress 与 Meter 的边界
- **Progress**：任务**随时间推进**到完成，例如导入、批量导出、实验步骤。值可以为 `null`（不确定，用于时长未知的任务）。
- **Meter**：在已知范围内的**静态测量值**，例如存储占用、样本温度相对安全区间。没有「完成」的概念，也不能不确定。
- Meter 可选 `low` / `high` / `optimum` 三个阈值，仿照原生 `<meter>`。根据阈值得到 `tone`（`success` / `warning` / `danger`），状态同时**以文字表达**（`valueText` 或格式化后的值，加可选的状态标签），不只依赖颜色。
- 两者都必须有可见的 `label`；`aria-valuetext` 默认使用格式化后的值，可以通过 `getValueText` 覆盖。

### 3. Pagination
```tsx
<Pagination page={page} pageCount={42} onPageChange={setPage} />
<Pagination defaultPage={1} pageCount={42} />
<Pagination page={page} totalItems={1000} pageSize={25} onPageChange={setPage} />
```
- 受控 `page` / `onPageChange`，非受控 `defaultPage`。页码从 1 开始，传入的值会被限制在 `1..pageCount` 内。
- 总页数可以直接传 `pageCount`，也可以传 `totalItems` + `pageSize` 由组件计算。
- 页码列表：首页、末页、当前页前后各 `siblingCount` 页（默认 1）；中间缺口用省略号表示，省略号不可聚焦、`aria-hidden`。
- 每个页码是 `<button>`，可访问名称为「第 N 页」。当前页用 `aria-current="page"`，**不禁用**，以便读屏用户能停留在当前页并听到它。
- 「上一页 / 下一页」在边界时设为 `disabled`。
- 窄屏（容器宽度不足）时只显示「上一页 · 第 N / M 页 · 下一页」，靠容器查询切换，不依赖视口宽度。
- `<nav aria-label>` 默认为「分页」，可以覆盖。
- 可选的 `status` 槽在列表旁显示「第 26–50 条，共 1000 条」，用 `aria-live="polite"` 宣告。
- `disabled` 时整组禁用（原生 `disabled`）。
- `busy`（请求进行中）时所有按钮设置 `aria-disabled`、忽略点击，但**保持可聚焦**：若在加载时用原生 `disabled`，刚按下的按钮会失去焦点并掉到 `<body>`（E2E 首轮实测发现）。
- **翻页后的焦点**：组件保持焦点在用户点击的按钮上。如果按钮因页码列表重排而消失（例如点了省略号附近的页码），焦点移到当前页按钮，不会掉到 `<body>`。

### 4. Breadcrumb
```tsx
<Breadcrumb items={[{ label: '档案库', href: '#/' }, { label: '样本', href: '#/samples' }, { label: 'ARC-1024' }]} />
```
- 数据结构与 `RecordHeader` 的 `trail` 相同：`RecordTrailItem` 改为 `BreadcrumbItem` 的别名，`RecordHeader` 内部改用 `Breadcrumb` 渲染，DOM 与外观保持不变。
- 最后一项且没有 `href` 时，用 `aria-current="page"` 的 `<span>` 渲染；其余有 `href` 的项渲染为 `<a>`。
- 分隔符用 CSS 生成（`::before`），不进入可访问树，读屏只读到列表项。
- 窄屏：中间项折叠为「…」按钮（`maxItems`，默认 4 项以上时折叠）。按钮名称为「显示全部 N 级路径」，点击后展开，不用浮层。首项和最后两项始终可见。
- 超长标签单行截断，鼠标悬停显示 `title`，完整文字仍保留在可访问树中。
- 可选的 `renderLink` 让使用者接入自己的路由组件（例如 React Router 的 `Link`），不绑定特定路由库。

### 5. Stat
```tsx
<Stat label="待复核记录" value={128} unit="条" delta={{ value: -12, label: '较上周' }} status="warning" />
```
- 归入基础 **Data** 组件，而不是 Rhine pattern：它与领域无关，只是「标签 + 数值 + 可选变化」的格式。
- 由 `<dl>` 包裹的 `<dt>` / `<dd>`，标签在前、数值在后，读屏顺序与视觉一致。
- `delta.value` 的正负**不预设好坏**：涨不一定是好事。`delta.tone` 由调用方决定，默认 `neutral`。方向以箭头加可见符号（+ / −）表达，并在 `VisuallyHidden` 中给出「上升 / 下降」文字。
- 没有值时（`value` 为 `null` / `undefined`），显示「—」，读屏读作「无数据」，不编造 0（DESIGN.md §6）。
- `loading` 时数值显示占位骨架，`aria-busy="true"`。
- 数值格式化交给调用方（字符串）或 `format`（`Intl.NumberFormat` 选项）。组件不做单位换算。

### 6. DataTable 状态与分页
新增属性，不改变已有属性的行为：
```tsx
<DataTable
  status="loading" | "error" | "ready"   // 默认 ready
  loadingRows={5}                          // 骨架行数，默认 = 上一次的行数或 5
  errorText="加载失败，请重试。"
  onRetry={() => refetch()}
  emptyText="没有符合条件的记录"
  pagination={{ page, pageCount, onPageChange, totalItems, pageSize }}
/>
```
- **四种状态互斥且可区分**：`ready` 且有行（正常）；`ready` 且无行（空状态，文字 + 可选 `emptyAction`）；`loading`（骨架行，表格 `aria-busy="true"`，并有一条可见文字「正在加载…」，用 `role="status"` 宣告）；`error`（错误文字带图标，可选「重试」按钮，用 `role="alert"` 宣告）。
- **再次加载时保留旧行**：有旧数据时 `loading` 不清空表格，而是保留旧行并降低不透明度、设置 `aria-busy`，避免整页跳动（「stale while loading」）。首次加载（无行）才显示骨架。
- 加载与错误时，排序按钮和全选框禁用；分页进入 `busy`（`aria-disabled`、可聚焦、不响应），防止重复请求，同时不丢失焦点。
- **分页适配**：`pagination` 属性在表格下方渲染 `Pagination`，并把「第 a–b 条，共 n 条」作为分页状态。DataTable 仍然**不自己切片数据**（与排序一致：调用方提供当前页的行），这样服务端分页和客户端分页都能用。导出一个辅助函数 `paginate(rows, page, pageSize)` 供客户端分页使用。
- **翻页保留状态**：选中集合由调用方持有（`selectedIds`），跨页保留；表头全选只作用于当前页，并在有跨页选中时显示「已选 N 条（含其他页）」。排序变化时调用方应把页码重置为 1（文档写明，示例照做）。
- **翻页后的焦点**：焦点保留在分页控件上，不跳到表格顶部；表格滚动区滚回顶部（`scrollTop = 0`），让新页从第一行开始可见。

### 7. Motion 与减动
| 组件 | 动效 | 减动 |
| --- | --- | --- |
| Progress | 指示条宽度变化 `--rl-motion-base`；不确定态为横向往返的 `@keyframes` | 宽度直接跳变；不确定态改为静态的斜纹填充，不动 |
| Meter | 宽度变化 `--rl-motion-base` | 直接跳变 |
| DataTable 骨架 | 骨架块的明暗呼吸 `@keyframes`（`--rl-motion-loop`） | 静态色块 |
| DataTable 再次加载 | 旧行不透明度 `--rl-motion-fast` | 直接切换 |
| Pagination / Breadcrumb / Stat | 无动效，只有 hover / focus 的颜色过渡 | — |

所有 `@keyframes` 都受 package-boundary 测试约束：必须在 `prefers-reduced-motion` 中设为 `animation: none`，并对 `data-rl-motion="reduce"` 生效。

### 8. 默认文案
默认文案为中文（「上一页」「第 N 页」「分页」「正在加载…」「重试」等），每一条都可以通过属性覆盖。统一的 locale 方案留给 M9.5 的 locale ADR，本 ADR 不引入 i18n 机制。

## 后果
- `RecordTrailItem` 变成 `BreadcrumbItem` 的类型别名，属于非破坏性变更。RecordHeader 的外观与语义结构不变（视觉基线与单测保证），但路径元素多了 `rl-breadcrumb*` 类名：按精确 class 字符串匹配的代码需要调整（ssr-hydrate 示例的断言因此改为结构匹配，见 M8 验收记录）。
- DataTable 新增 `status`、`pagination` 等属性都是可选的；不传时行为与 M7 完全一致。
- 「千行数据」场景用确定性 fixture（固定种子生成，不用 `Math.random()`），保证 E2E 与视觉基线稳定，同时不冒充真实监测数据（AGENTS.md）。

## 验证方法
单测（语义、键盘、受控 / 非受控、边界、反向验证）、类型反向测试、三内核 E2E（包括 1000 行分页与焦点保持）、axe、320 / 390 / 768 / 1280 / 1920 截图审查、视觉基线。结果记录在 `docs/development/acceptance/2026-10-10-m8.md`。
