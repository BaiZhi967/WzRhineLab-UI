# Archive patterns · RecordHeader · MetadataList · ArchiveCard · StatusIndicator · Timeline · DataTable

- 状态：**Beta（M3）** · 源码：`packages/react/src/components/*.tsx`、`archive.css`
- Showcase：`#/archive`（组件）、`#/archive/scenarios`（三个验收场景）
- 不依赖 Base UI；只引入这些组件时不会打包任何浮层代码。

## 共同原则：不生成数据
DESIGN.md 与 COMPONENTS.md 要求「真实信息优先，缺少真实数据时不生成假读数」。因此：
- 除标识（`title`，ArchiveCard 另需 `id`）外，所有字段都可省略。值为 `null`、`undefined`、`false` 或空字符串时，**整行或整块隐藏**，不显示占位文字。
- MetadataList 的 `empty="placeholder"` 是唯一例外：保留该行，显示「—」，读屏读作「未记录」。适合需要固定行结构的表单概览。
- Timeline、DataTable 不排序、不生成、不改写时间；排序由调用方完成，组件只报告用户请求的排序方向。
- StatusIndicator 的 `pulse` 只能用于真实的在线连接，开启减少动态效果后停止。

## RecordHeader
```tsx
<RecordHeader
  trail={[{ label: '档案', href: '#/archive' }, { label: '实验记录' }, { label: 'ARC-1024' }]}
  recordId="ARC-1024" status={{ tone: 'info', label: '审核中' }}
  title="晶体结构观测流程" classification={['实验记录', '材料学']}
  summary="…" meta={[{ label: '更新', value: '2026-10-08', dateTime: '2026-10-08', mono: true }]}
  actions={<Button variant="secondary">导出</Button>} headingLevel={1}
/>
```
- 渲染为 `<header>`。`trail` 是 `<nav aria-label="档案位置">` 面包屑，没有 `href` 的末项带 `aria-current="page"`。
- 标题层级由 `headingLevel` 决定，需与页面结构一致。状态用文字加形状表达，不只靠颜色。
- 元数据列在宽容器中位于标题右侧，空间不够时用 flex-wrap 换到下方，不依赖断点。

## MetadataList
`<dl>` 结构：`dt` 为标签，`dd` 为值。
- 每项可设 `mono`（编号、时间、计量值）、`dateTime`（包成 `<time>`）、`hint`（补充说明）、`wide`（跨整行）。
- `layout`：`inline` 为标签列加值，`stacked` 为标签在上。
- `columns`：1 / 2 / 3 为**上限**。每列有最小可读宽度，容器较窄时自动减列，不使用断点。
- `size`：sm / md。

## ArchiveCard
COMPONENTS.md「标准档案卡」。
- 传 `href` 时整卡是一个链接，传 `onOpen` 时是一个按钮，都不传时是 `<article>`。可访问名称是标题，日期与状态作为描述（`aria-describedby`）。
- 选中态：按钮用 `aria-pressed`，链接用 `aria-current`。视觉上是左侧研究橙细线加浮起底色，与 hover、focus 区分。
- `media` 必须提供 `alt`；纯装饰图片传 `alt=""`。`layout`：`row`（列表）或 `tile`（网格）。
- `status` 是 `{ tone, label }`（tone 同 StatusBadge），渲染为描边小徽标。

### 身份连续：`motion="identity"` 与 `ArchiveIdentity`（M10，ADR-0007 §9）
```tsx
import { LayoutGroup } from 'motion/react';

<LayoutGroup id="search-results">
  {selected == null
    ? records.map((r) => <ArchiveCard key={r.id} id={r.id} title={r.title} motion="identity" onOpen={() => setSelected(r.id)} />)
    : <header><ArchiveIdentity id={selected} /> …</header>}
</LayoutGroup>
```
- 默认 `motion="none"`，不影响既有用法。设为 `identity` 时，卡片的记录编号是共享元素，同一 `id` 的 `<ArchiveIdentity>`（例如详情标题行）出现时，编号从卡片位置移到新位置：`scene` 420ms，`layout="position"`，文字不被拉伸。减动时直接切换。
- 只用于「详情**替换**卡片」（列表视图 → 详情视图）：motion 会隐藏同一身份里非主导的成员，卡片与详情不能同时在屏幕上。并列的列表 + 详情面板（如档案检索宽屏）不要开启。
- 同一页有多份含相同记录的列表时，用 motion 的 `<LayoutGroup id>` 隔离。
- `ArchiveIdentity` 的属性：`id`（必填，与卡片一致）、`children`（可见文字，默认为 `id`）、`className`。编号是普通文本，卡片的可访问名称仍是标题。
- Showcase：`#/motion`（Motion Core 四通道中的「ArchiveCard · 身份连续」）；模式字段见 [MOTION-PATTERNS.md](../design/MOTION-PATTERNS.md#shared-identity)。

## StatusIndicator
行内状态：形状标记加可见文字，可选 `detail`。`live` 模式是 polite 实时区域，用于会变化的状态。标记形状与 StatusBadge 一致：中性为空心圆，警告为菱形，危险为方形。

## Timeline
`<ol>` 有序列表，按传入顺序渲染。每项需要 `dateTime`（机器可读）和可选的 `time`（显示文本）。最新在前时设 `reversed`。空数组显示 `emptyText`，不会编造事件。

## DataTable
```tsx
<DataTable caption="检索结果" columns={columns} rows={sorted} getRowId={(r) => r.id}
  sort={sort} onSortChange={setSort} selectedIds={selected} onSelectionChange={setSelected}
  getRowLabel={(r) => r.title} density="compact" />
```
- 使用原生 `<table>`，带 `<caption>`（可用 `hideCaption` 视觉隐藏）。`rowHeader` 列渲染为 `<th scope="row">`。
- 可排序列的表头是按钮，`th` 上报告 `aria-sort`。排序是受控的：组件只回调用户请求的方向，由调用方提供排好序的行。
- 行选择：每行复选框的名称为「选择 {getRowLabel(row)}」；表头复选框支持全选与半选（indeterminate）。
- 宽表在可聚焦、有名称的区域内横向滚动，两侧有随滚动变化的阴影提示。单元格不会被压缩成一字一行；`mono` 列不换行。
- `emptyText` 跨所有列显示；`density` 为 comfortable 或 compact。
- M8–M9 新增（不传时渲染与之前相同）：`status`（`loading` / `error`，首次加载为 Skeleton 骨架行，再次加载保留旧行变淡）、`onRetry` / `errorText`、`emptyDescription` / `emptyAction`（空状态由 EmptyState 渲染）、`pagination`（内置 Pagination，翻页保留选中集合）。用法、状态矩阵与读屏行为见 [Data & navigation · DataTable 状态](data-navigation.md)。

## 验收场景（ROADMAP M3）
| 场景 | 用到的组件 | 验证点 |
| --- | --- | --- |
| 档案检索 | Input、Select、Field、Tabs、ArchiveCard、DataTable、RecordHeader、MetadataList、Menu、Tooltip、IconButton、StatusIndicator、Drawer、Toast | 计数随筛选变化；列表与表格两种视图；排序、多选、导出；详情面板联动；单列布局（< 1024px）时详情改用 Drawer，关闭后焦点回到打开它的卡片或「查看」按钮；390px 下表格在区域内滚动 |
| 实验监测 | RecordHeader、StatusIndicator（live）、Progress、Timeline、MetadataList、Field、Input、Surface、AlertDialog、Toast | 只有操作员点击才会推进步骤，无定时器、无随机读数；规程进度用 Progress；时间线记录用户本机时间；重置用 AlertDialog「重置演示流程？」确认 |
| 设置表单 | Tabs、Field、Input、Textarea、Select、Switch、RadioGroup、CheckboxGroup、Popover、MetadataList（placeholder）、StatusIndicator、AlertDialog、Toast | 提交时校验，自动跳到第一个出错的分组；高优先级播报错误数；保存中 loading；放弃更改用 AlertDialog「放弃未保存的更改？」确认 |

场景用到的组件按 `apps/docs/src/scenarios/*.tsx` 的导入核对（2026-10-11）：M7 起设置表单接入选择控件，M8 实验监测接入 Progress，M9 起破坏性确认由 Dialog 改为 AlertDialog、档案检索窄布局详情改为 Drawer（ADR-0006）。分页与位置路径的完整用法在 `examples/archive-desk`：DataTable `pagination` + `paginate()` 分页，RecordHeader `trail`（由 Breadcrumb 渲染）显示记录位置，删除确认用 AlertDialog。

样例数据集中在 `apps/docs/src/scenarios/data.ts`，是静态的确定性数据，并在界面上标注为样例。

## 测试
- 单测：`packages/react/test/archive.test.tsx`（RecordHeader 6、MetadataList 7、ArchiveCard 5、StatusIndicator 3、Timeline 4、DataTable 7）；ArchiveCard 身份连续 3 项在 `motion-core.test.tsx`；DataTable 状态与分页在 `datatable-states.test.tsx`。
- 浏览器：`apps/docs/e2e/archive.spec.ts`，覆盖组件页 5 项、档案检索 6 项（含窄布局 Drawer 2 项）、实验监测 2 项、设置表单 4 项，以及三个场景明暗主题 axe 共 6 项；身份连续的按帧采样在 `motion-core.spec.ts`。
