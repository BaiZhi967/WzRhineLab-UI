# Alert · Callout · EmptyState · Skeleton · Spinner

- 状态：**Beta（M9）** · 契约：[ADR-0006](../development/adr/0006-overlays-feedback-contracts.md) §5–7、§9
- 底座：原生语义 HTML（`<div>` / `<span>` / `<svg>`），不依赖 Base UI；Spinner 旋转用 `motion/react`
- 源码：`packages/react/src/components/{Alert,EmptyState,Skeleton,Spinner}.tsx`，样式 `status.css` · Showcase：`#/components/feedback`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `Alert` | 页面内、与当前区域相关的状态消息（校验结果、服务维护、导出失败） | 短暂的操作反馈（用 Toast）；字段错误（放在字段旁） |
| `Callout` | 说明性旁注：数据来源、限制条件、口径 | 需要用户处理的状态；任何需要宣告的消息 |
| `EmptyState` | 列表、表格、区域没有内容时说明原因和下一步 | 加载中（用 Skeleton）；错误（用 Alert） |
| `Skeleton` | 首次加载时占住内容的形状 | 再次加载（保留旧内容并变淡）；不确定布局的内容 |
| `Spinner` | 时长未知、范围很小的等待（按钮、单元格、通知内） | 整页加载（用 Skeleton）；可计算进度的任务（用 Progress） |

## API
```tsx
<Alert tone="warning" title="3 条记录未通过校验" action={<Button size="sm">查看</Button>} onDismiss={hide}>
  导出前请先修正。
</Alert>
<Alert live="polite" tone="success" title="校验完成">12 条记录全部通过。</Alert>
<Callout tone="info" title="关于样例数据">本页数值由固定种子生成，不代表真实监测。</Callout>

<EmptyState kind="no-results" headingLevel={3} title="没有符合条件的记录" description="调整筛选条件后重试。"
            action={<Button size="sm" variant="secondary">清除筛选</Button>} />

<div aria-busy="true">
  <Skeleton shape="circle" width="var(--rl-space-8)" />
  <Skeleton lines={3} />
  <VisuallyHidden>正在加载记录摘要</VisuallyHidden>
</div>
<Spinner size="sm" label="正在加载批次列表" />
```

| 组件 | 属性 | 说明 |
| --- | --- | --- |
| Alert / Callout | `tone` | `neutral` / `info`（默认）/ `success` / `warning` / `danger`；颜色之外必有图标，标题建议必写 |
| Alert / Callout | `title` / `children` | 标题（tone 色）与正文（`--rl-fg-primary`）；都可选，但至少给一个 |
| Alert / Callout | `icon` | 覆盖默认图标；`null` 去掉。图标始终 `aria-hidden` |
| Alert | `live` | `off`（默认，不宣告）/ `polite`（`role="status"`）/ `assertive`（`role="alert"`） |
| Alert | `action` | 后续操作，渲染在正文下方，不在 live 区域内 |
| Alert | `onDismiss` / `dismissLabel` | 显示关闭按钮（IconButton，名称默认「关闭提示」）；组件不自行隐藏 |
| EmptyState | `title` *必填* / `description` / `action` | 说明为什么没有内容，以及下一步 |
| EmptyState | `kind` | `empty`（默认）/ `no-results` / `no-permission` / `first-use`，只影响默认图标 |
| EmptyState | `headingLevel` | 2–6 时标题为 `<h2>`–`<h6>`；不传为 `<p>`（表格、卡片内） |
| EmptyState | `size` / `icon` | `sm`（表格、卡片内）/ `md`（默认，整块区域）；`icon={null}` 去掉图标 |
| Skeleton | `shape` | `text`（默认，一行高）/ `block`（默认高 `--rl-space-16`）/ `circle` |
| Skeleton | `width` / `height` | CSS 长度字符串，经 `--rl-skeleton-width/height` 传入；只写宽或高时 circle 取同值 |
| Skeleton | `lines` | `text` 多行，末行 60% 宽；`width` 作用于整段 |
| Spinner | `size` | `sm` / `md`（默认）/ `lg`，对应 `--rl-icon-size-*`；颜色为 `currentColor` |
| Spinner | `label` | 传入时 `role="status"` + 隐藏文字；不传为装饰（`aria-hidden`） |

`DataTable` 的空状态改由 `EmptyState size="sm"` 渲染（标题为段落，无图标，外观与 M8 一致），新增 `emptyDescription`；`emptyText`、`emptyAction` 不变。Button 的加载指示、DataTable 首次加载骨架和 Stat 加载骨架改用 Spinner / Skeleton，原有类名（`rl-button__spinner`、`rl-table__skeleton`、`rl-stat__skeleton`）保留。

## 可访问性
- **一个消息只有一个 live 容器。** Alert 默认 `live="off"`：页面加载时就存在的提示不宣告。需要宣告时，先渲染 `live="polite"` 的 Alert（可以是占位文字），再改变内容；直接挂载一个新的 live 区域，部分读屏不会播报。
- `assertive` 只用于失败和需要立刻处理的情况。同一结果已经用 Alert 宣告时，不再弹 Toast；反之亦然。
- live 角色落在消息文字上，操作按钮和关闭按钮不在宣告内容里。
- 关闭后焦点由调用方决定：移到相邻的合理位置（触发区域、能重新显示提示的按钮、所在区域的标题），不要留在已移除的按钮上（焦点会落回 `<body>`）。
- Callout 是 `role="note"`，永不宣告、不可关闭。
- EmptyState 没有 live 角色：空结果由触发它的筛选结果计数宣告（例如「0 / 24 条」）。标题层级按页面大纲选择，表格单元格内不用标题。
- Skeleton 始终 `aria-hidden`；容器负责 `aria-busy` 与可见或隐藏的「正在加载」文字。加载完成后移除 `aria-busy`。
- Spinner 放在已有 `aria-busy` 的控件里（如 Button `loading`）时不要传 `label`，避免重复宣告。
- 对比度：正文 `--rl-fg-primary` 在各 `*-subtle` 底色上 ≥ 10:1；tone 色标题使用清单已登记的 `--rl-<tone>` / `--rl-<tone>-subtle` 配对（徽标同款）。neutral 用 `--rl-fg-primary` / `--rl-bg-subtle`。强制颜色模式下边框、图标为 `CanvasText`，骨架为 `GrayText`。

## Motion
| 组件 | 动效 | 减动 |
| --- | --- | --- |
| Alert / Callout / EmptyState | 无（出现 / 消失由调用方决定是否包在 presence 中） | — |
| Skeleton | `@keyframes rl-skeleton-pulse`，`--rl-motion-loop` 明暗呼吸 | `animation: none`，静态色块（系统设置与 `RhineProvider motion="reduce"` 都生效） |
| Spinner | `motion/react` 线性旋转 `transition.loop`（`--rl-motion-loop`） | 停止旋转，静态的较长弧线（`data-reduced`，读 `useRhineMotion().reduced`，同时尊重系统和 Provider） |

## 测试
- 单测：`packages/react/test/status.test.tsx`（Alert 6、Callout 1、EmptyState 4、Skeleton 3、Spinner 4）；类型：`status.test-d.tsx`。
- 浏览器：`apps/docs/e2e/feedback-m9.spec.ts`（live 角色、关闭焦点、Callout、标题层级、aria-busy、Spinner status、减动下动画为 none、DataTable 空状态、明暗 axe；含 Toast §8），Chromium / Firefox / WebKit。
