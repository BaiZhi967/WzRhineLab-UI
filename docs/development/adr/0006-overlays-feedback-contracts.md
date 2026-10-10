# ADR-0006 · M9 覆盖层与反馈组件契约

- 状态：**Accepted** · 关联里程碑：M9 Overlays & Feedback
- 范围：`AlertDialog`、`Drawer`、`Alert` / `Callout`、`EmptyState`、`Skeleton`、`Spinner`，以及 `Dialog` 关闭保护与 `Toast` 补强
- 约束：Base UI 1.9.0 是唯一的 headless 底座（ADR-0001）；token 契约冻结（M6），不新增或修改 token；默认文案中文，可覆盖（locale 留给 M9.5）

## 背景
M8 的 DataTable 已经有加载、空、错误三种状态，但骨架、空结果和错误提示都是表格私有实现；场景里的破坏性确认（「放弃更改」「重置」）用普通 Dialog 拼成，初始焦点落在第一个按钮上，Esc 与外部点击行为也不一致；档案检索的详情面板在窄屏只能堆在列表下方。本 ADR 先固定这些组件的 API、状态、键盘、读屏与动效约定，再实现。

## 决策

### 1. 底座选择
| 组件 | 底座 | 理由 |
| --- | --- | --- |
| AlertDialog | Base UI `alert-dialog` | `role="alertdialog"`、强制模态、禁止外部点击关闭；焦点进入 / 循环 / 归还与 Dialog 同源 |
| Drawer | Base UI `drawer` | Dialog 的焦点与滚动锁定，加上滑动关闭；`swipeDirection` 与位置一致 |
| Alert / Callout | 原生 `<div>` | 静态内容；live region 语义由属性显式选择 |
| EmptyState | 原生 `<div>` + 可选标题元素 | 静态内容 |
| Skeleton / Spinner | 原生 `<span>` / `<svg>` | 纯视觉；语义由所在容器的 `aria-busy` 与状态文字承担 |
| Toast 补强 | Base UI `toast`（已有） | 复用 `add({ id })` 去重、`update`、`promise` |

不引入新依赖。

### 2. AlertDialog
```tsx
<AlertDialog
  trigger={<Button variant="ghost">放弃更改</Button>}
  title="放弃未保存的更改？"
  description="表单将恢复为上次保存的内容。"
  confirmLabel="放弃更改"
  tone="danger"
  onConfirm={() => reset()}
/>
```
- 属性：`title`、`description`（**必填**：确认必须说明后果）、`confirmLabel`、`cancelLabel`（默认「取消」）、`tone`（`danger` / `default`，默认 `danger`）、`onConfirm`、`trigger`、`open` / `defaultOpen` / `onOpenChange`、`onClosed`、`eyebrow`、`children`（后果补充，例如受影响的记录列表）、`errorText`。
- `role="alertdialog"`，标题与描述分别经 `aria-labelledby` / `aria-describedby` 关联。
- **初始焦点落在取消按钮上**，不落在破坏性按钮上（退出门禁）。按钮顺序：取消在前，确认在后；确认按钮 `tone="danger"` 时用危险色填充。
- 外部点击**不**关闭（Base UI 强制）；Esc 等同于取消。
- `onConfirm` 可以返回 Promise：等待期间确认按钮为 `loading`（保持焦点），取消按钮与 Esc 失效（防止「看似取消、实际已提交」）；成功后关闭；失败（reject 或同步抛错）时保持打开，在对话框正文末尾（`children` 之后）用 `role="alert"` 显示 `errorText`（默认「操作未完成，请重试。」），焦点回到确认按钮。每次失败重新挂载错误节点，重复失败也会再次宣告；重新打开时清除上一次错误。
- 过期结果保护：对话框关闭、重新打开或卸载之后才完成的 Promise 被忽略，不会关闭新的一次打开，也不会在卸载后更新状态。
- 关闭后焦点归还触发器；受控用法（例如从菜单打开）由 Base UI 归还到打开前的焦点元素。
- 动效与 Dialog 相同：backdrop `fast` 淡入；面板 `panel` 280ms + 8px 上移；减动时只淡入淡出，无位移。

### 3. Dialog 关闭保护
- 新增 `onCloseRequest?: (reason: DialogCloseReason) => boolean | void`。`reason` 为 `escape` / `outside` / `close-button`（`DialogClose`）/ `trigger`。返回 `false` 时取消本次关闭（Base UI `eventDetails.cancel()`），对话框保持打开、焦点不动。
- 典型用法：表单有未保存修改时返回 `false` 并打开一个嵌套的 AlertDialog「放弃未保存的更改？」；提交进行中时直接返回 `false`。
- 程序化关闭（受控 `open={false}`）不经过 `onCloseRequest`；Base UI 的 `focus-out`、`imperative-action` 原因也不映射（模态对话框不会出现）。
- 嵌套确认：AlertDialog 要放在 Dialog 内部渲染，Esc 只交给最上层。嵌套打开时 Base UI 把父 Dialog 移出可访问树（DOM 仍可见），关闭子层后恢复。

### 4. Drawer
```tsx
<Drawer open={open} onOpenChange={setOpen} title="ARC-1024" description="记录详情" side="end">
  …
</Drawer>
```
- 属性：`title`（必填）、`description`、`eyebrow`、`children`、`actions`（底部操作栏）、`trigger`、`open` / `defaultOpen` / `onOpenChange`、`onClosed`、`side`（`end` / `start`，默认 `end`，跟随书写方向：每次打开时读取容器的 `direction`，RTL 下 `end` 贴左）、`size`（`sm` / `md` / `lg`，复用 `--rl-dialog-width-*`）、`closeLabel`（默认「关闭」）、`onCloseRequest`（同 §3，原因多一个 `swipe`；Android 返回手势 `close-watcher` 归为 `escape`）、`initialFocus` / `finalFocus`（默认初始焦点在面板本身，读屏先读标题与描述；列表 → 详情这类场景用 `finalFocus` 把焦点还给打开它的条目）。另导出 `DrawerClose`，与 `DialogClose` 对应。
- 正文溢出时成为可聚焦的 `region`（名称取标题），键盘可以滚动。
- 模态：焦点进入、Tab 循环、Esc 关闭、滚动锁定、背景 inert、关闭后焦点归还，与 Dialog 一致。外部点击（backdrop）关闭。
- 头部固定一个关闭按钮（`IconButton`，名称取 `closeLabel`），内容区单独滚动。
- **窄屏**：视口宽度小于 `40rem` 时改为底部弹出（bottom sheet），高度上限为视口的 85%，`swipeDirection="down"`；宽屏为侧边面板，`swipeDirection` 与 `side` 一致。断点由组件内的 `matchMedia` 决定，SSR 首帧按宽屏渲染（面板只在打开后出现，不影响水合）。
- 动效：**由 CSS 负责 transform**（Base UI 滑动通过 `--drawer-swipe-movement-*` 写同一属性，不能再让 motion/react 写 transform，见 M10 属性所有权）。进出场 `--rl-motion-panel` + `--rl-ease-out`，从当前位置接续（CSS transition 天然可中断）；拖动时过渡时长为 0。减动：不位移，只淡入淡出。
- 不提供 snap points、嵌套缩进效果（M12 视需求再定）；不接入 `Drawer.VirtualKeyboardProvider`，底部弹出内含输入框时软键盘依赖浏览器默认行为（已知限制）。
- 组件断点（40rem）只决定「侧边 / 底部」。何时用 Drawer 代替常驻面板由页面决定：档案检索在页面单列（< 1024px）时就改用 Drawer，因此 768 宽度下是侧边面板。

### 5. Alert 与 Callout
```tsx
<Alert tone="warning" title="3 条记录未通过校验" action={<Button size="sm">查看</Button>} onDismiss={hide}>
  导出前请先修正。
</Alert>
<Callout tone="info" title="关于样例数据">本页数值由固定种子生成，不代表真实监测。</Callout>
```
- `tone`：`neutral` / `info` / `success` / `warning` / `danger`（默认 `info`）。颜色之外必有图标与文字，状态不只靠颜色。
- **Alert** 是页面内的状态消息。`live` 显式选择宣告方式：`off`（默认，页面加载时就存在的提示，不宣告）、`polite`（`role="status"`）、`assertive`（`role="alert"`，只用于失败与需要立刻处理的情况）。同一消息只有一个 live 容器，不与 Toast 重复宣告。
- **Callout** 是说明性旁注，`role="note"`，永不宣告，不可关闭。
- 可关闭：传 `onDismiss` 时显示关闭按钮（名称默认「关闭提示」，`dismissLabel` 可改）。组件不持有隐藏状态；关闭后焦点去向由调用方决定（文档要求移到相邻的合理位置，Showcase 示例移到触发区域）。
- 无动效（出现 / 消失由调用方决定是否包在 presence 中）。

### 6. EmptyState
```tsx
<EmptyState kind="no-results" title="没有符合条件的记录" description="调整筛选条件后重试。" action={<Button size="sm" variant="secondary">清除筛选</Button>} />
```
- `kind`：`empty`（默认）/ `no-results` / `no-permission` / `first-use`，只影响默认图标（装饰性，`aria-hidden`）。可用 `icon` 覆盖或传 `null` 去掉。
- `title` 必填；`headingLevel`（2–6）时标题渲染为对应的 `<h*>`，否则为 `<p>`（表格单元格等不宜出现标题的位置）。
- `size`：`sm`（表格、卡片内）/ `md`（整块区域）。
- 没有 live 角色：空结果由触发它的筛选结果计数宣告（例如「0 / 24 条」）。
- DataTable 的空状态改由 `EmptyState size="sm"` 渲染，新增 `emptyDescription`；`emptyText`、`emptyAction` 的行为不变。

### 7. Skeleton 与 Spinner
- `Skeleton`：`shape`（`text` / `block` / `circle`）、`width`、`height`、`lines`（多行文本，末行 60%）。**始终 `aria-hidden`**；所在容器负责 `aria-busy` 与可见或隐藏的「正在加载」文字。呼吸动画 `--rl-motion-loop`，减动时静态。
- `Spinner`：`size`（`sm` / `md` / `lg`）、`label`。传 `label` 时渲染为 `role="status"` 并带隐藏文字；不传时为纯装饰（`aria-hidden`），用于 Button 等已有 `aria-busy` 的场景。旋转为 `--rl-motion-loop` 线性循环；减动时停止旋转，改为静态的较长弧线。
- 抽取：Button 的加载指示、DataTable 首次加载骨架、Stat 加载骨架改用这两个组件；外观保持不变（视觉基线零差异作为验证）。

### 8. Toast 补强
- `show({ id })`：同一 `id` 再次 `show` 时原地更新并重置计时（Base UI 去重），用于「已复制」这类重复操作，不堆叠。
- `action.onClick` 执行后**默认关闭该通知**（`action.keepOpen` 可保留）；Base UI 的 Action 本身不关闭。
- 带操作的通知若未指定 `timeout`，默认至少 10 秒；悬停、聚焦时暂停（已有）。可撤销操作不能只靠通知撤销，页面上必须仍有等效入口或结果可见（文档约定）。
- `toast.promise(promise, { loading, success, error })`：一条通知从「处理中」更新为成功或失败；失败默认 `priority: 'high'` 且不自动消失。
- 新增 `update` 的状态切换不重复宣告标题未变的内容（Base UI 只在内容变化时更新 live region）。

### 9. 动效与减动汇总
| 组件 | 动效 | 减动 |
| --- | --- | --- |
| AlertDialog | 同 Dialog（motion/react：backdrop fast，面板 panel + 8px） | 只淡入淡出 |
| Drawer | CSS transform 从边缘滑入，panel；拖动时跟手 | 只淡入淡出，不位移 |
| Alert / Callout / EmptyState | 无 | — |
| Skeleton | 明暗呼吸 `@keyframes`，loop | 静态色块 |
| Spinner | 线性旋转，loop | 停止，静态弧线 |
| Toast | 已有（进出场、堆叠） | 已有 |

所有新增 `@keyframes` 受 package-boundary 测试约束；所有进出场都可在中途反向（快速开关不残留、不排队）。

## 后果
- 新增公开组件 7 个、类型若干；`DataTableProps` 增加 `emptyDescription`；`DialogProps` 增加 `onCloseRequest`；`ToastOptions` 增加 `id`、`action.keepOpen`；`ToastApi` 增加 `promise`。都是可选新增，不破坏既有用法。
- Toast 操作点击后默认关闭是**行为变化**：过去点击「撤销」后通知仍停留。CHANGELOG 标注，需要旧行为的传 `keepOpen: true`。
- Button / DataTable / Stat 的内部 DOM 改由 Spinner / Skeleton 渲染，类名增加 `rl-spinner` / `rl-skeleton`，原有类名保留。
- 两个场景的破坏性确认改用 AlertDialog；档案检索在窄布局下的详情改为 Drawer。

## 验证方法
单测（语义、初始焦点、Promise 确认、关闭保护、live 角色、反向验证）、类型反向测试、三内核 E2E（焦点进入 / 循环 / Esc / 归还、Drawer 窄屏底部弹出、Toast 撤销与去重）、axe（明 / 暗，含打开状态）、320 / 390 / 768 / 1280 / 1920 截图审查、视觉基线。结果记录在 `docs/development/acceptance/2026-10-10-m9.md`。
