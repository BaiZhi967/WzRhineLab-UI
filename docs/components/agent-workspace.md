# Agent Workspace · 终端、子任务、上下文、摘要、产物、文件预览与标签、事件、运行摘要

- 状态：**Beta（M12）** · 契约：[ADR-0011](../development/adr/0011-agent-contracts.md) §4、§7、§10 · 动效：[ADR-0012](../development/adr/0012-agent-motion.md)
- 底座：`@wzrhine/react` 的 Tabs、Collapsible、Popover、Meter、Button、IconButton、Input、Alert、Spinner、Skeleton；状态字形 / AgentSpark / AgentEntrance 来自 `@wzrhine/agent`
- 源码：`packages/agent/src/components/{workspace,artifact}/*`，样式 `styles/{workspace,artifact}.css`，文案 `provider/messages/workspace.ts` · Showcase：`#/agent/workspace`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `PersistentTerminal` / `TerminalTabs` | 有独立生命周期的终端会话：输出、输入、停止、状态 | 一次性命令输出（用 ToolOutput）；真正的终端仿真（ANSI、光标定位由宿主处理） |
| `TerminalRow` / `TerminalList` | 侧栏中的终端索引，按状态分组 | 终端详情（用 PersistentTerminal） |
| `SubAgentCard` / `SubAgentList` | 子 Agent 的身份、父任务、状态、部分用量、查看入口 | 推算进度百分比 |
| `ContextUsage` | 上下文 / token 预算，区分精确、估计、部分、未知 | 任务进度（用 Progress） |
| `PinnedSummary` | 会话的固定摘要（只读）与来源 | 编辑摘要 |
| `ArtifactCard` / `ArtifactList` | 生成的文件、报告、图片及其保存状态 | 代码差异（用 DiffPreview） |
| `FilePreview` | 宿主已读取的文件内容的只读预览 / 原始 / 元数据；路径面包屑；「打开方式」拆分按钮 | 读文件、编辑文件 |
| `FilePreviewTabs` | 已打开文件的标签条 + 当前文件面板 | 视图切换（用 Tabs）；文件树 |
| `ActivityLedger` | 按 sequence 排列的审计事件，按来源筛选 | 工具详情（用 ToolRecord） |
| `RunSummary` | 一轮运行的结果、指标、产物、副作用提醒 | 运行中的阶段展示（用 RunStatus） |
| `CompactionNotice` | 消息流中的上下文整理横条 | 普通系统消息 |

## API
```tsx
<TerminalTabs terminals={terminals} value={id} onValueChange={setId}
              onInput={(text, t) => send(t.id, text)} onStop={(t) => stop(t.id)} onLoadEarlier={(t) => older(t.id)} />
<TerminalList terminals={terminals} currentId={id} onOpen={(t) => setId(t.id)} onStop={(t) => stop(t.id)} onLoadMore={more} />
<SubAgentList agents={subagents} onOpen={(id) => openChild(id)} title="子任务" />
<ContextUsage usage={usage} variant="ring" />
<PinnedSummary summary={summary} pinned={pinned} onPinChange={setPinned} onOpenSource={open} renderMarkdown={md} />
<ArtifactList artifacts={artifacts} onOpen={open} onDownload={download} onReveal={reveal} onRetry={retry} />
<FilePreview file={file} mode={mode} onModeChange={setMode} onLoadMore={next} onReload={reload} onOpenExternal={ext} onReference={ref}
             breadcrumbRoot="/workspace/reef" openTargets={targets} defaultOpenTarget="editor" onOpenWith={(id, f) => openWith(id, f)} />
<FilePreviewTabs tabs={open} activeId={active} onActivate={setActive} onCloseTab={close} onCloseAll={closeAll}
                 returnFocusRef={openerRef} renderPanel={(id) => <FilePreview file={files[id]} />} />
<ActivityLedger events={events} filter={filter} onFilterChange={setFilter} onOpenEvent={openEvent} />
<RunSummary run={summary} onOpenTrace={trace} onOpenDetails={details} onRetrySave={retrySave} />
<CompactionNotice status="completed" tokensBefore={32000} tokensAfter={12000} summary={text} />
```

| 组件 | 属性 | 说明 |
| --- | --- | --- |
| PersistentTerminal | `terminal` | `TerminalView`；`readOnly` / `inherited` 为只读历史 |
| PersistentTerminal | `onInput(text, terminal)` | 只在非只读且状态为 `running` / `waiting-input` 时绘制输入行 |
| PersistentTerminal | `onStop(terminal)` | 只在 `terminal.stoppable` 时绘制；`stop-pending` 时作为「重试停止」 |
| PersistentTerminal | `onLoadEarlier` | `outputTruncated` 时绘制「加载更早输出」，保持阅读位置 |
| PersistentTerminal | `onReadLatest(terminal)` | `terminal.newerOutput` 时绘制「有新输出，读取最新」 |
| PersistentTerminal | `onLoadMoreHistory(terminal)` | `terminal.history` 的「加载更早的调用」 |
| PersistentTerminal | `page` / `pager` | 传入 `MaterialPageView` 时用 `ChunkPager` 代替实时输出尾部（`pager` 为翻页回调） |
| PersistentTerminal | `headingLevel` / `hideName` | 名称标题级别（默认 3）；在 Tabs 中隐藏可见名称 |
| TerminalTabs | `terminals` / `value` / `defaultValue` / `onValueChange` | 每个标签显示名称与状态；其余属性透传给 PersistentTerminal |
| TerminalRow | `terminal` / `onOpen` / `onStop` / `current` | 打开与停止是两个按钮；`current` → `aria-current` |
| TerminalList | `terminals` / `currentId` / `defaultCollapsed` / `onLoadMore` / `hasMore` | 分组 `open` / `unknown` / `ended` / `inherited`（默认折叠继承组） |
| SubAgentCard | `agent` / `onOpen(id)` / `animate` / `headingLevel` | `animate={false}` 强制 AgentSpark 静态帧 |
| SubAgentCard | `onOpenSnapshot(id)` | `agent.inherited` 时只读：显示「继承的子任务记录」，不显示待处理提示与 `onOpen`，只提供「查看快照」 |
| SubAgentList | `agents` / `title` / `onOpen` / `onOpenSnapshot` | 有 `title` 时为可见标题（比卡片高一级），否则 `aria-label` |
| SubAgentList | `groupInherited` | 继承记录放到单独的「继承的子任务记录」标题之下（在活动子任务之后） |
| ContextUsage | `usage` / `variant` | `ring`（圆环触发 Popover）/ `bar`（单行）/ `full`（默认：Meter + 构成 + 警告 + 说明） |
| ContextUsage | `side` / `align` / `openOnHover` | ring 的 Popover 位置（默认 `top` / `end`）；`openOnHover` 透传给 Popover（悬停也打开，焦点与点击照常） |
| ContextUsage | `usage.stats` | 在 full 视图与 Popover 中按分组渲染 `<dl>`；单位 ms（时长）/ tokens / percent / tokens-per-s / count；缺失或 `unknown` 显示「—」（读作「无数据」），从不显示 0；非精确值带「估计值 / 部分数据」 |
| PinnedSummary | `expanded` / `defaultExpanded` / `onExpandedChange` | 正文折叠（默认展开） |
| PinnedSummary | `pinned` / `onPinChange` | 固定开关（`aria-pressed`），无回调不绘制 |
| PinnedSummary | `onOpenSource(citation)` / `renderMarkdown` | 来源按钮；失效来源禁用并显示原因 |
| ArtifactCard | `artifact` / `onOpen` / `onDownload` / `onReveal` / `onRetry` / `renderPreview` | 动作只随回调出现；`failed` 只出现重试；`unavailable` / `deleted` 不可打开 |
| ArtifactList | `truncated` / `onShowAll` | 「部分产物未列出」说明（不编造数量）+ 可选「查看全部产物」；列表为空但被截断时不显示「暂无产物」 |
| FilePreview | `mode` / `defaultMode` / `onModeChange` | `preview` / `raw` / `metadata`；图片与二进制无 `raw` |
| FilePreview | `renderMarkdown` / `renderCode` | 注入渲染器；默认纯文本 + 装饰性行号 |
| FilePreview | `onRetry` / `onReload` / `onLoadMore` / `onOpenExternal` / `onReference` / `onClose` / `copyable` | 对应 error / changed / 部分加载 / 外部打开 / 引用 / 关闭 / 复制；`onReload` 另在操作栏常驻为「重新读取」 |
| FilePreview | `openTargets` / `defaultOpenTarget` / `onOpenWith(targetId, file)` / `onCopyPath(path, file)` | `{ id, label, group?: 'app' \| 'reveal' }[]`；有 `onOpenWith` 时绘制拆分按钮：主按钮「用 X 打开」（默认目标或第一个 app），菜单按钮（`Menu`）列出打开方式 / 在文件夹中显示两组 + 「复制路径」（默认写剪贴板）+ 「在对话中引用」 |
| FilePreview | `zoomLevels` / `defaultZoom` | 图片缩放百分比（相对原始宽度，默认 25/50/100/200/400，去重排序）+ 始终存在的「适应宽度」（默认） |
| FilePreview | `breadcrumbRoot` | 路径以 `Breadcrumb` 显示；在根目录下时为相对路径（根目录名开头），在根目录外时加「外部」标记（`file.external` 同样） |
| FilePreviewTabs | `tabs` / `activeId` / `onActivate` / `onCloseTab` / `renderPanel` | `{ id, name, kind? }[]`；按 kind 显示图标；名称截断，完整名称在 `title` |
| FilePreviewTabs | `onCloseAll` / `returnFocusRef` | Esc 与末尾的关闭按钮调用 `onCloseAll`；最后一个标签关闭后焦点移到 `returnFocusRef` |
| ActivityLedger | `events` / `filter` / `defaultFilter` / `onFilterChange` / `onOpenEvent` / `loading` / `showFilters` | 筛选 `all` / `agent` / `tool` / `system` / `user` |
| RunSummary | `run` / `onOpenTrace` / `onOpenDetails` / `onRetrySave` / `onOpenArtifact` | `persistence: 'failed'` 时才出现「重试保存」 |
| CompactionNotice | `status` / `tokensBefore` / `tokensAfter` / `elapsedMs` / `summary` / `onCancel` / `onRetrySave` / `summaryOpen` / `busy` | `status`：`running` / `completed` / `cancelled` / `failed` / `interrupted` / `save-pending`（类型本地定义，未改 agent-core 契约） |
| CompactionNotice | `phase` / `retryHint` | 运行中的子阶段 `preparing` / `compacting` / `saving`；`failed` 与 `interrupted` 的提示，默认「可输入 /compact 重试」，`null` 隐藏 |
| 全部 | `messages` | 覆盖本组件的部分文案（`Partial<AgentWorkspaceMessages>`） |

辅助导出：`isTerminalReadOnly`、`terminalGroup`、`subagentSparkPhase`、`orderLedger`、`artifactKindIcon`、`pathCrumbs`（路径 → 面包屑项与是否在根目录外）。

## 受控
- TerminalTabs `value`、PinnedSummary `expanded`、FilePreview `mode`、ActivityLedger `filter`、CompactionNotice `summaryOpen` 均可受控；不传时组件内部持有状态。
- FilePreviewTabs 完全受控：组件只回调 `onActivate` / `onCloseTab`；关闭当前标签时先 `onActivate(相邻标签)` 再 `onCloseTab(id)`。
- 组件不判断动作是否成功：停止后由宿主把状态改为 `stop-pending`，确认后改为 `ended`；未知回执（`terminal.receipt.status === 'unknown'`）显示「结果待确认」。

## 可访问性
- 终端输出是 `role="log"` + `aria-live="off"`，流式输出不逐块朗读；会话状态在 `role="status"` 内。输出区可聚焦（键盘滚动）；用户上滚后不再自动跟随，出现「有新输出」按钮，点击后回到底部并聚焦输出区。
- 终端输入是带标签的单行输入（「向 终端 A 输入」）；IME 合成期间（`compositionstart` / `isComposing` / `keyCode 229`）Enter 不发送。
- 只读终端显示「继承的终端记录 · 只读」，不绘制任何控件；TerminalRow 在打开按钮的描述中说明只读。
- 每个状态 = 字形 + 文字（+ 色调）；`unknown` 永远不显示为「已结束」。
- ContextUsage 只有 `usagePercent` 返回数字时才渲染 `role="meter"`（含 value/max 与朗读文本）；未知上限 / 部分数据只有文字，非精确值标注「估计值 / 部分数据」。ring 触发按钮名为「上下文用量 12.4K / 32K · 估计值」，Popover 为带标题的 dialog。
- SubAgentCard、ArtifactCard 是带标题的 `<article>`，操作按钮在卡片内部，Tab 逐个经过；PinnedSummary、RunSummary、FilePreview 是由标题命名的 `<section>`。
- 时间为 `<time dateTime>`；FilePreview 的行号 `aria-hidden` 且不可选中，复制结果在隐藏的 `role="status"` 中宣告。
- 终端的说明是 `<ul>`（「终端说明」），调用记录是由「调用记录」命名的区域内的 `<ol>`：命令（等宽，完整命令在 `title`）、字形 + 状态文字、退出码、`<time dateTime>`。
- ContextUsage 统计是命名分组「用量统计」，每组为由组标题命名的 `<section>` + `<dl>`；「—」`aria-hidden`，读屏读「无数据」。
- FilePreview 路径面包屑是 `<nav aria-label="name 的路径">` + `<ol>`；拆分按钮两半都是真实按钮，菜单按钮名为「name 的更多打开方式」，菜单为 Base UI Menu（方向键、Esc、焦点返回）。复制路径结果在隐藏的 `role="status"` 中宣告。
- FilePreviewTabs：`role="tablist"`（「已打开的文件」）只包含 tab；每个标签的关闭按钮（「关闭 name」）在 tablist 外、视觉上紧邻（`display: contents` + `order`），因此 tablist 的子元素规则与 axe 都通过。roving tabIndex：只有当前标签与它的关闭按钮在 Tab 序列中。面板为 `role="tabpanel"`，由当前标签命名。
- 继承的子任务卡片带虚线边框与「继承的子任务记录 · 只读」文字，不只靠样式区分。
- 强制颜色模式下边框、圆环、分段条改为 `CanvasText` / `Highlight`；当前文件标签的下边线改为 `Highlight`。

## 键盘
| 位置 | 按键 | 行为 |
| --- | --- | --- |
| TerminalTabs / FilePreview / ActivityLedger 标签 | ←/→、Home/End、Enter/Space | 移动焦点并激活（Tabs 组件） |
| 终端输入 | Enter | 发送（合成期间除外） |
| 终端输出 | ↑/↓/PageUp/PageDown | 滚动 |
| ContextUsage ring | Enter / Space；Esc | 打开 Popover；关闭并把焦点还给触发按钮（`openOnHover` 时悬停也打开） |
| FilePreviewTabs 标签 | ←/→（循环）、Home/End | 移动焦点并激活 |
| FilePreviewTabs 标签 | Delete / Backspace；鼠标中键 | 关闭该标签；关闭当前标签后相邻标签激活并获得焦点 |
| FilePreviewTabs 标签条 | Esc | `onCloseAll`，焦点到 `returnFocusRef` |
| FilePreview 拆分按钮 | Enter / Space；菜单内 ↑/↓、Enter、Esc | 主按钮用默认目标打开；菜单按钮打开菜单，Esc 关闭并返回触发按钮 |
| TerminalList 分组、PinnedSummary、CompactionNotice 摘要 | Enter / Space | 展开 / 收起（Collapsible） |

## 状态矩阵
| 组件 | 状态 |
| --- | --- |
| PersistentTerminal 补充 | newerOutput（读取最新）/ notes / history（running / returned / failed / unknown，退出码，时间）/ 分页输出（ChunkPager） |
| PersistentTerminal | opening / running / waiting-input（可输入）/ idle（「命令已返回，终端尚未关闭」）/ stop-pending（「停止尚未确认」+ 重试停止）/ closing / ended（退出码）/ failed / unknown（状态待确认）/ 只读继承 / 输出截断 / 部分捕获 / 无输出 |
| TerminalList | 未关闭 / 状态待确认 / 已结束 / 继承记录（空组不绘制）/ 空列表 / 加载更多 |
| SubAgentCard | 继承记录（只读、无待处理提示、无 spark、可查看快照）；10 个 SubagentStatus；运行中按 phase 显示 AgentSpark；需要处理（警示边框 + 文字 + 待回答数）；部分 / 估计 / 未知用量 |
| ContextUsage | 估计 / 精确 / 部分 / 未知；正常 / 接近上限（≥80%）/ 超过上限；上限未知；说明文字；统计（有值 / 缺失「—」/ 非精确标注） |
| PinnedSummary | 展开 / 收起；最新 / 正在更新 / 可能过期 / 暂无；来源可用 / 失效 |
| ArtifactList | 完整 / 部分列出（可查看全部）/ 空 / 空但部分列出 |
| ArtifactCard | generating / partial / saved / failed / unavailable / stale；新建 / 已修改 / 已移动 / 已删除 |
| FilePreview | loading / ready（文本、代码、Markdown、图片）/ binary·unknown / error / large-file·partial / changed / missing / unavailable / 外部文件；图片「适应宽度」或百分比；有 / 无打开方式；有 / 无 `breadcrumbRoot` |
| FilePreviewTabs | 单个 / 多个标签；当前标签关闭（相邻激活）；最后一个关闭（焦点返回）；全部关闭 |
| ActivityLedger | all / agent / tool / system / user；loading / empty / 筛选后为空 |
| RunSummary | completed / partial / failed / cancelled / interrupted / saving / running；保存中 / 保存失败 / 保存未知；副作用 |
| CompactionNotice | running（preparing / compacting / saving）/ completed / cancelled / failed / interrupted / save-pending；有 / 无摘要；重试提示默认 / 自定义 / 隐藏 |

## Motion
| 组件 | 动效 | 所有者 |
| --- | --- | --- |
| SubAgentCard、CompactionNotice（running） | AgentSpark 点阵循环（只在活动、页面可见、在视口内时运行） | CSS keyframes（base.css），`useAgentLoop` |
| ArtifactList、ActivityLedger 新增行 | 挂载后新出现的 id 一次入场（`row`：4px + fast） | motion/react `AgentEntrance` |
| TerminalList 分组、PinnedSummary、CompactionNotice 摘要 | 高度过渡，可中途反向 | CSS（Collapsible） |
| RunSummary | 状态变化时左边框颜色过渡一次（fast），无循环 | CSS transition |
| 终端光标 | 静态，不闪烁 | — |
| FilePreviewTabs | 当前标签的颜色与下边线过渡（fast）；切换时 `scrollIntoView({ inline: 'nearest' })`（无该 API 时跳过），无平滑滚动 | CSS transition |
| 继承的子任务卡片 | 不显示 AgentSpark | — |

首次渲染已存在的行、摘要正文更新、筛选切换都不重放入场。

## 减动
系统设置与 `RhineProvider motion="reduce"` 都生效：AgentSpark 静态帧（每阶段不同）、入场无位移、折叠与颜色过渡即时（时长 token 归零）、Spinner 停止旋转。本族样式没有自己的 `@keyframes`。

## 测试
- 单测（vitest + Testing Library，jsdom）：`packages/agent/test/workspace-terminal.test.tsx`（24：输入 / IME / 停止 / 只读 / 跟随底部 / Tabs / 分组顺序）、`workspace-context.test.tsx`（22：子任务、上下文百分比门禁、ring Popover 键盘、摘要状态与来源）、`workspace-artifacts.test.tsx`（26：产物状态与动作、文件预览标签 / 图片 / 分块 / 复制、事件顺序与筛选、运行摘要、整理提示、只有新行入场、减动）。
- 补充单测：`packages/agent/test/gaps-tools-workspace.test.tsx`（FilePreview 拆分按钮菜单 / 复制路径回退 / 面包屑 / Windows 路径 / 重新读取 / 缩放；FilePreviewTabs 语义 / 方向键 / Delete 与相邻焦点 / 中键 / Esc / scrollIntoView 守卫 / 多实例 id；ContextUsage 统计「—」与 Popover；终端新输出 / 说明 / 调用记录 / 分页；CompactionNotice 中断 / 阶段 / 提示；ArtifactList 部分列出；子任务继承与分组）。
- 浏览器：`apps/docs/e2e/agent-workspace.spec.ts`（Chromium：文件标签方向键 / Delete / 关闭按钮 / 中键 / Esc 与焦点返回、拆分按钮主按钮与键盘打开菜单、面包屑相对路径、终端读取最新 / 调用记录 / 分页、统计缺失值「—」；终端 Enter 发送、停止待确认、继承终端无控件、未知上限无 meter、ring 键盘打开、事件筛选顺序与 aria-selected、「已保存」只出现在 saved、文件预览方向键、明暗 axe、320 宽无横向溢出）。Firefox / WebKit 未跑。
- 未做：读屏人工验收、真实 IME 人工验收、5 宽度截图基线。
