# Agent 工作台外壳与会话索引

`@wzrhine/agent` · 图册 01–04、26 · 契约 [ADR-0011](../development/adr/0011-agent-contracts.md) · 动效 [ADR-0012](../development/adr/0012-agent-motion.md) · Showcase `/#/agent/shell`

组件：`AgentShell`、`ResizeHandle`、`AgentHeader`、`ConversationList`、`ConversationRow`、`AgentSidePane`、`AgentEmptyState` / `AgentWorkspaceEmpty`，以及 `useAgentShell`、`useAgentContextPresentation`。

## 用途
- `AgentShell`：工作台的区域框架：应用导航 `rail`、会话索引 `index`、阅读列（`header` / `conversation` / `composer`）、分隔条、上下文面板 `context`。只负责区域、插槽、焦点与响应式。
- `ConversationList` / `ConversationRow`：分组会话索引，带选择、搜索和行操作（置顶、归档、取消归档、删除）。
- `AgentHeader`：当前会话的标题栏：返回、分支来源、标题与重命名、Agent 身份、运行与同步状态、上下文开关、计数徽标、`actions` 插槽。
- `AgentSidePane`：上下文 / 详情面板（`<aside>` + Tabs）。
- `AgentEmptyState`：未选中会话时的空态。

## 非用途
- 不负责路由、窗口标题栏、桌面按钮、会话数据的读取、排序、去重或搜索过滤（宿主传入已处理好的 `sections`）。
- 不持久化面板宽度或开合状态：宿主经 `onContextSizeChange` / `onContextOpenChange` 自行保存。
- 不强制 `main` 地标：阅读列是带名称的 `<section>`（`mainLabel`），整页主体时由宿主包一层 `<main>`。

## API（要点）
| 组件 | 主要 props |
| --- | --- |
| AgentShell | `rail` `index` `header` `conversation` `composer` `context`；`mainLabel` `indexLabel` `contextLabel`；`contextOpen` / `defaultContextOpen` / `onContextOpenChange(open, reason)`；`indexOpen` / `defaultIndexOpen` / `onIndexOpenChange`；`contextSize` / `defaultContextSize` / `onContextSizeChange` / `contextMin` / `contextMax`；`resizable`；`breakpoints {context, index}`（rem，默认 64 / 40）；`layout`（强制 `wide` / `compact` / `narrow`）；`activeId` |
| ResizeHandle | `size` / `defaultSize` / `onSizeChange`、`min` / `max`、`step` / `largeStep`、`resetSize`、`label` |
| AgentHeader | `title` `identity` `runStatus` `runPhase` `statusLabel` `syncStatus` `origin` `onOpenOrigin` `onBack` `onRename` `contextOpen` `onToggleContext` `badges` `actions` `headingLevel` `pending` |
| ConversationList | `sections` `selectedId` `onSelect` `search` `onSearchChange` `loading` `error` `onRetry` `empty` `renderActions` `onPin` `onArchive` `onUnarchive` `onDelete` `isDisabled` `headingLevel` `label` |
| ConversationRow | `item` `selected` `disabled` 及与列表相同的行操作回调 |
| AgentSidePane | `sections: {id, label, count?, content}[]`、`activeTab` / `defaultTab` / `onTabChange`、`onClose`、`label`、`headingLevel` |
| AgentEmptyState | `title` `description` `onCreate` |

`onContextOpenChange` / `onIndexOpenChange` 的 `reason`：`toggle`（用户切换）、`dismiss`（抽屉关闭）、`layout`（断点导致显示 / 隐藏）、`select`（窄屏选中会话后关闭索引抽屉）。

## 受控行为
- 上下文与索引的开合、上下文宽度、侧栏当前标签都支持受控 / 非受控两种写法。
- 选择只由 `selectedId` + `onSelect` 决定；后台刷新（新的 `sections`）不会改变选择，也不移动焦点。若当前聚焦的行被移除且焦点落到 `<body>`，焦点移到最近的剩余行。
- 布局断点：缩小越过断点时关闭放不下的面板（回调 `reason: 'layout'`，头部开关的 `aria-pressed` 始终与可见状态一致）；放大回来后重新打开，除非用户在此期间手动切换过。

## 响应式
外壳测量**自身**宽度（ResizeObserver；不可用时保持 `wide`），同页两个外壳、或外壳放在卡片里时各自决定：
- `wide`：所有列内联；
- `compact`（< `breakpoints.context`）：上下文面板先离开行内，打开时以 Drawer 抽屉呈现，不挤压阅读列；
- `narrow`（< `breakpoints.index`）：会话索引也变成抽屉，`rail` 隐藏，只剩阅读列；头部出现索引开关。
每一列独立滚动（`min-height: 0` + `overflow: auto`），阅读内容封顶 `--rl-agent-reading-width` 并居中。

## 可访问性
- 阅读列 `<section aria-label>`；索引列为带名称的 section；`AgentSidePane` 是 `complementary`（`<aside aria-label>`）。
- 分隔条 `role="separator"` + `aria-orientation="vertical"` + `aria-valuenow / min / max` + `aria-valuetext`。
- 会话行：两个**并列**按钮（主按钮与「更多」），从不嵌套，菜单里的操作不会冒泡成选择；主按钮名称 = 标题 + 置顶 + 状态 + 未读，时间与预览为描述；选中行 `aria-current="true"`。
- 状态 = 字形 + 文字，永不只靠颜色；需要处理（审批、问题、子任务、错误）优先于运行状态显示。
- 头部标题是可配置级别的标题元素，视觉上单行截断，完整文字在 `title` 中且读屏完整读出；尾部操作组不收缩，长标题挤不掉状态与按钮。
- 上下文开关是 IconButton，名称稳定，`aria-pressed` = 面板打开。
- 搜索结果数通过预先挂载的 polite status 播报。
- 关闭行内面板时若焦点在面板内，焦点回到打开时的元素（通常是头部开关）；抽屉由 Drawer 归还焦点。

## 键盘
| 位置 | 按键 | 行为 |
| --- | --- | --- |
| 会话列表 | Tab | 进入列表（聚焦行，否则选中行，否则第一行），再 Tab 到该行的「更多」，然后离开列表 |
| 会话列表 | ↑ / ↓、Home / End | 在所有分组的行之间移动焦点 / 跳到首末行 |
| 会话列表 | Enter / Space | 选中（原生按钮） |
| 行菜单 | 方向键、Enter、Esc | Base UI Menu；Esc 关闭并归还焦点 |
| 分隔条 | ← / →（Shift 加大步长）、Home / End、双击 | 调整宽度 / 跳到最小最大 / 复位；方向按物理方向，随 `dir="rtl"` 翻转 |
| 侧栏标签 | ← / →、Home / End | Tabs 漫游焦点 |

## 状态矩阵
| 组件 | 状态 |
| --- | --- |
| AgentShell | wide · compact（上下文为抽屉）· narrow（索引与上下文为抽屉）· context-open · empty（`AgentEmptyState`） |
| ConversationRow | default · hover · selected · running（呼吸字形）· unread · attention（approval / question / children / error）· pinned · disabled · 长中文 / 长英文标题 |
| ConversationList | loading（骨架行，`aria-busy`）· 有数据时 loading（保留旧数据）· error（Alert + 重试）· empty · search-empty |
| AgentHeader | idle · running（阶段文字）· waiting / pending 审批 · 子任务（返回 + 来源）· sync 非 live 时第二个状态 · 窄容器 |
| AgentSidePane | 多标签 · 单分区（无标签条）· 抽屉内（不重复标题与关闭按钮） |

## Motion
- 会话选中背景：一个共享的「选中幽灵」，motion/react `layoutId`（按实例 `useId` 隔离）+ `resolve('transform', 'base')`；行本身不做布局动画，300 行也不额外开销。
- 行内上下文面板开合：CSS 单轴 `translate` + `opacity`（`--rl-motion-panel`），可中断；宽度不做动画（打开时直接到位，退出淡出后才释放）。
- 拖动分隔条直接跟手，没有动画。
- 重命名按钮的显隐：opacity `--rl-motion-fast`。
- 运行中的行与头部状态呼吸：共享循环生命周期（离屏、页面隐藏、减动时静止）。

## 减动
时长 token 归零，所有过渡即时完成；选中幽灵直接定位；呼吸字形静止。信息与焦点行为不变。

## 测试
- 单测：`packages/agent/test/shell-conversation.test.tsx`（列表、行、菜单、归档二次确认、删除确认、键盘、后台刷新不改选择、搜索播报、多实例）与 `shell-layout.test.tsx`（外壳插槽、强制布局、受控 / 非受控开合、抽屉、多实例 id；ResizeHandle 键盘、Shift 步长、Home / End、双击复位、夹取；Header 各按钮的出现条件、`aria-pressed`、同步状态；SidePane 标签与地标；空态）。
- E2E：`apps/docs/e2e/agent-shell.spec.ts`（点击与 ↑ / ↓ 选择、行菜单不改变选择、删除确认、上下文开关、compact 抽屉、分隔条键盘、明暗 axe 与菜单打开时 axe、320 宽无横向溢出）。

## 已知限制
- 会话索引列不能拖动调宽（只有上下文面板可以）。
- 主对话 ↔ 子任务的视图横移动画未实现（ADR-0012 节奏表中列出，留作后续）。
- 没有内置的「会话搜索弹窗」；可用 `CommandPalette`（`@wzrhine/react`）组合。
- 人工读屏与真实触屏长按未验证。
