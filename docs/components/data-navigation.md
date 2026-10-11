# Data & navigation · Pagination · Breadcrumb · Progress · Meter · Stat · DataTable 状态

- 状态：**Beta（M8）** · 契约：[ADR-0005](../development/adr/0005-data-navigation-contracts.md)
- 底座：Progress / Meter 基于 Base UI 1.9.0 的 `progress` / `meter`；Pagination、Breadcrumb、Stat 是原生语义 HTML（Base UI 没有对应原语）
- 源码：`packages/react/src/components/{Pagination,Breadcrumb,Progress,Stat,DataTable}.tsx`，样式 `data.css` · Showcase：`#/archive/data`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `Pagination` | 表格、列表的分页导航 | 步骤导航（用步骤列表）；无限滚动 |
| `Breadcrumb` | 当前页面在层级中的位置 | 操作历史；Tabs 式切换 |
| `Progress` | 随时间推进到完成的任务（导出、导入、规程步骤）；`value={null}` 表示时长未知 | 静态测量值（用 `Meter`） |
| `Meter` | 已知范围内的静态测量（存储占用、温度与安全区间） | 任务进度；没有范围的数字（用 `Stat`） |
| `Stat` | 标签 + 数值 + 可选变化的指标摘要 | 编造的实时读数（DESIGN.md §6）；图表 |
| `DataTable` 状态 | 加载、空、错误、分页 | 虚拟滚动（未实现，超过数百行时分页） |

## API
```tsx
// 分页：受控 / 非受控；页数来自 pageCount，或 totalItems + pageSize
<Pagination page={page} totalItems={1000} pageSize={25} onPageChange={setPage} />
<Pagination defaultPage={1} pageCount={40} siblingCount={2} aria-label="结果分页" />

// 面包屑：最后一项无 href 即当前页；超过 maxItems（默认 4）折叠中间项
<Breadcrumb items={[{ label: '档案库', href: '/' }, { label: '样本', href: '/samples' }, { label: 'ARC-1024' }]}
            renderLink={({ href, className, children }) => <Link to={href} className={className}>{children}</Link>} />

<Progress label="导出档案" value={42} description="已处理 420 / 1000 条。" />
<Progress label="重建索引" value={null} />
<Progress label="规程步骤" value={3} max={5} valueText="3 / 5 步" getValueText={(_, v) => `第 ${v} 步，共 5 步`} />

<Meter label="存储占用" value={86} low={60} high={80} optimum={20}
       stateLabels={{ suboptimum: '偏高', critical: '接近上限' }} />

<Stat label="待复核记录" value={128} unit="条" status="warning" delta={{ value: 12, label: '较上周', tone: 'warning' }} />

// 表格：仍由调用方提供当前页的行（与排序一致）
<DataTable
  caption="检索结果" columns={columns} getRowId={(r) => r.id}
  rows={paginate(sorted, page, 25)}
  status={status}                       // 'ready' | 'loading' | 'error'
  onRetry={refetch} errorText="加载失败。"
  emptyText="没有匹配的记录。" emptyAction={<Button>清除筛选</Button>}
  pagination={{ page, onPageChange: setPage, pageSize: 25, totalItems: total }}
/>
```

| 组件 | 关键属性 |
| --- | --- |
| `Pagination` | `page` / `defaultPage` / `onPageChange`；`pageCount` 或 `totalItems` + `pageSize`（类型强制二选一）；`siblingCount`；`disabled`；`busy`；`showStatus`；`labels`（全部默认文案可覆盖）；`aria-label` |
| `Breadcrumb` | `items` *必填*；`label`（地标名称，默认「路径」）；`maxItems`（`0` 不折叠）；`expandLabel`；`renderLink` |
| `Progress` | `label` *必填*；`value`（`number \| null`，必填）；`min` / `max`；`format`；`valueText`（`false` 隐藏）；`getValueText`；`description`；`size`；`tone`；`hideLabel` |
| `Meter` | `label` *必填*；`value`（不能为 `null`）；`min` / `max`；`low` / `high` / `optimum`；`stateLabels`；`valueText`；`getValueText`；`description` |
| `Stat` | `label` *必填*；`value`（`number \| string \| null`）；`format` / `locale`；`unit`；`delta`（`value`、`text`、`label`、`tone`）；`status`；`description`；`loading`；`size`；`emptyLabel` |
| `DataTable`（新增） | `status`、`loadingRows`、`loadingText`、`errorText`、`onRetry`、`retryLabel`、`emptyAction`、`pagination`；M9 另增 `emptyDescription`（空状态的补充说明） |

辅助函数：`paginate(rows, page, pageSize)`（客户端分页切片，页码自动夹到有效范围）、`getPaginationItems(page, pageCount, siblingCount)`、`getMeterState(value, thresholds)`。

可访问名称只来自 `label`：Progress、Meter 在类型上禁止 `aria-label` / `aria-labelledby`。

## 受控行为
- `Pagination`：受控时组件不会自己翻页，只报告请求的页码；点当前页不触发回调。页码自动限制在 `1..pageCount`。
- `DataTable`：排序、分页、选中都由调用方持有。**排序或筛选变化时调用方应把页码重置为 1**（示例与 archive-desk 都这样做）。选中集合跨页保留。

## 可访问性与键盘
- **Pagination**：`<nav>` 地标；每个页码是 `<button>`，名称「第 N 页」；当前页 `aria-current="page"` 且**保持可聚焦**；省略号 `aria-hidden`；上一页 / 下一页在边界时禁用。普通 Tab 顺序，不做 roving tabindex。
  - 翻页后焦点留在按下的按钮上；该按钮在边界变为禁用时，焦点移到当前页按钮，不会掉到 `<body>`。
  - `busy`（请求进行中）：按钮设 `aria-disabled` 并忽略点击，但仍可聚焦。若用原生 `disabled`，刚按下的按钮会失去焦点（E2E 首轮实测发现）。
  - 范围摘要「第 a–b 条，共 n 条」是 `role="status"`，翻页后会被读出。
- **Breadcrumb**：`<nav>` + `<ol>`，始终单行；不超过 4 个字的祖先项不压缩，更长的最多压缩到「3 个字 + …」，当前项只在行满时截断，仍放不下时在自身框内横向滚动；分隔符「//」由 CSS 生成，读屏只读到列表项；当前页 `aria-current="page"`；折叠按钮名称「显示全部 N 级路径」，展开后焦点移到第一个新显示的链接。长标签单行截断，完整文字保留在 DOM 与 `title` 中。
- **Progress**：`role="progressbar"`，`aria-valuenow / min / max / valuetext`；不确定态没有 `aria-valuenow`，`valuetext` 为「进行中」。
- **Meter**：`role="meter"`；有阈值时状态文字（如「接近上限」）追加到 `aria-valuetext`，同时可见，不只靠颜色。
- **Stat**：`<dl>`：`<dt>` 标签在前，`<dd>` 数值在后；变化方向用视觉隐藏的「上升 / 下降 / 持平」读出；无数据显示「—」并读作「无数据」，不会显示 0；加载时 `aria-busy`。
- **DataTable 状态**：首次加载显示 `aria-hidden` 的骨架行，加上可见的 `role="status"`「正在加载…」，表格 `aria-busy`；再次加载保留旧行（变淡），宣告文字视觉隐藏；错误用 `role="alert"`；空状态没有任何 live region。加载与错误时排序按钮、全选框和行选择禁用，分页进入 `busy`。
- forced-colors：页码与步进按钮 `ButtonText` 边框，当前页 `Highlight`；进度条轨道 `CanvasText` 边框、填充 `Highlight`；骨架 `GrayText`。

## 状态矩阵
| 组件 | 状态 |
| --- | --- |
| Pagination | default · hover · focus-visible · current · 边界禁用 · `disabled` · `busy` · 紧凑模式（容器窄于 26rem）· 仅图标模式（窄于 14rem） |
| Breadcrumb | 链接 · 当前页 · 折叠 / 展开 · 长标签截断 · 超长未折叠路径在自身框内横向滚动 |
| Progress | determinate · indeterminate · complete · tone（neutral / accent / success / warning / danger）· sm / md |
| Meter | 无阈值（neutral）· optimum · suboptimum · critical |
| Stat | 有值 · 有变化（三个方向 × tone）· 无数据 · 加载 · status 侧边线 · sm / md / lg |
| DataTable | ready · 空 · 空 + 操作 · 首次加载 · 再次加载（旧行变淡）· 错误 · 错误 + 重试 · 分页 · 跨页选中 |

## Motion 与减动
| 组件 | 动效 | 减动 |
| --- | --- | --- |
| Progress / Meter | 指示条宽度 `--rl-motion-base` | `transition: none`，直接跳变 |
| Progress 不确定态 | 片段左右往返 `@keyframes rl-progress-travel`（`--rl-motion-loop`） | 静态斜纹填满轨道 |
| DataTable / Stat 骨架 | 明暗呼吸 `@keyframes rl-skeleton-pulse`（M9 起由 [Skeleton](feedback.md) 渲染） | 静态色块 |
| DataTable 再次加载 | 旧行不透明度 `--rl-motion-fast` | 时长 token 归零 |

两个 `@keyframes` 都受 package-boundary 测试约束（`prefers-reduced-motion` 下必须为 `animation: none`），也对 `data-rl-motion="reduce"` 生效。E2E 断言减动时 `animationName` 为 `none`，非减动时为 `rl-progress-travel`。

## 主题与密度
颜色全部来自语义 token，未新增 token。分页按钮高度为 `--rl-control-height-sm`，跟随紧凑密度。

## 用例与反例
- ✅ 服务端分页：`rows` 传当前页结果，`totalItems` 传服务端总数。
- ✅ 用 Meter 表示「存储占用 86%，接近上限」，状态以文字呈现。
- ✅ Stat 的 `delta.tone` 由业务决定：待复核数上升用 `warning`。
- ❌ 用 Progress 表示温度：温度不会「完成」，应用 Meter。
- ❌ 把缺失的指标写成 0：传 `null`，显示「—」。
- ❌ 翻页时把 `status` 设为 `loading` 并清空 `rows`：会退回骨架、整页跳动。应保留旧行，只改 `status`。

## 已知限制
- DataTable 没有虚拟滚动。1000 行分页场景（每页 25 行）在三内核 E2E 中无布局退化；没有做不分页渲染上千行的性能测量。
- Breadcrumb 的 `maxItems` 按项数折叠，不按可用宽度折叠：未折叠的长路径在窄屏上会在自身框内横向滚动（不撑宽页面）。非文本标签（ReactNode）的祖先项不压缩。
- 默认文案为中文，可逐项覆盖；统一的 locale 方案见 M9.5。
- DataTable 的行选择仍使用原生 checkbox（M7 已记录）。

## 测试
- 单测：`packages/react/test/data-nav.test.tsx`（Pagination 算法与组件、paginate、Breadcrumb、RecordHeader 复用、Progress、Meter、Stat）与 `datatable-states.test.tsx`（1000 行分页、跨页选中、排序回到第 1 页、四种状态）；`types.test-d.tsx` 中 M8 类型反向测试。7 项反向验证见 M8 验收记录。
- E2E：`apps/docs/e2e/data-nav.spec.ts`（翻页焦点与滚动、排序、错误与重试、表格状态、紧凑分页、面包屑在 4 种宽度下单行不重叠、Progress / Meter 语义与减动、实验监测进度、明暗 axe）；archive-desk 新增分页与面包屑 1 项；三内核运行。
- 视觉基线：新页面 4 张，Pagination / Breadcrumb / Progress & Meter / Stat 近景明暗 8 张，Pagination forced-colors 1 张。

## 变更记录
- 0.0.0：首次加入（M8）。`RecordHeader` 的 `trail` 改由 `Breadcrumb` 渲染：外观不变（既有视觉基线零差异），结构与语义不变（`<nav>` + `<ol>`、`aria-current`）；DOM 上 `<nav>` 多了 `rl-breadcrumb` 类，列表与列表项多了 `rl-breadcrumb__*` 类。`RecordTrailItem` 成为 `BreadcrumbItem` 的别名。
- M9：`DataTable` 新增 `emptyDescription`；首次加载骨架、空状态、Stat 加载骨架改由 Skeleton / EmptyState 渲染，原有类名保留，外观不变，元素额外带 `rl-skeleton` / `rl-empty` 类（ADR-0006）。
