# Agent Workspace · 终端、子任务、上下文、摘要、产物、文件预览、事件、运行摘要

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
| `FilePreview` | 宿主已读取的文件内容的只读预览 / 原始 / 元数据 | 读文件、编辑文件 |
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
<FilePreview file={file} mode={mode} onModeChange={setMode} onLoadMore={next} onReload={reload} onOpenExternal={ext} onReference={ref} />
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
| PersistentTerminal | `headingLevel` / `hideName` | 名称标题级别（默认 3）；在 Tabs 中隐藏可见名称 |
| TerminalTabs | `terminals` / `value` / `defaultValue` / `onValueChange` | 每个标签显示名称与状态；其余属性透传给 PersistentTerminal |
| TerminalRow | `terminal` / `onOpen` / `onStop` / `current` | 打开与停止是两个按钮；`current` → `aria-current` |
| TerminalList | `terminals` / `currentId` / `defaultCollapsed` / `onLoadMore` / `hasMore` | 分组 `open` / `unknown` / `ended` / `inherited`（默认折叠继承组） |
| SubAgentCard | `agent` / `onOpen(id)` / `animate` / `headingLevel` | `animate={false}` 强制 AgentSpark 静态帧 |
| SubAgentList | `agents` / `title` / `onOpen` | 有 `title` 时为可见标题（比卡片高一级），否则 `aria-label` |
| ContextUsage | `usage` / `variant` | `ring`（圆环触发 Popover）/ `bar`（单行）/ `full`（默认：Meter + 构成 + 警告 + 说明） |
| ContextUsage | `side` / `align` | ring 的 Popover 位置（默认 `top` / `end`） |
| PinnedSummary | `expanded` / `defaultExpanded` / `onExpandedChange` | 正文折叠（默认展开） |
| PinnedSummary | `pinned` / `onPinChange` | 固定开关（`aria-pressed`），无回调不绘制 |
| PinnedSummary | `onOpenSource(citation)` / `renderMarkdown` | 来源按钮；失效来源禁用并显示原因 |
| ArtifactCard | `artifact` / `onOpen` / `onDownload` / `onReveal` / `onRetry` / `renderPreview` | 动作只随回调出现；`failed` 只出现重试；`unavailable` / `deleted` 不可打开 |
| FilePreview | `mode` / `defaultMode` / `onModeChange` | `preview` / `raw` / `metadata`；图片与二进制无 `raw` |
| FilePreview | `renderMarkdown` / `renderCode` | 注入渲染器；默认纯文本 + 装饰性行号 |
| FilePreview | `onRetry` / `onReload` / `onLoadMore` / `onOpenExternal` / `onReference` / `onClose` / `copyable` | 对应 error / changed / 部分加载 / 外部打开 / 引用 / 关闭 / 复制 |
| ActivityLedger | `events` / `filter` / `defaultFilter` / `onFilterChange` / `onOpenEvent` / `loading` / `showFilters` | 筛选 `all` / `agent` / `tool` / `system` / `user` |
| RunSummary | `run` / `onOpenTrace` / `onOpenDetails` / `onRetrySave` / `onOpenArtifact` | `persistence: 'failed'` 时才出现「重试保存」 |
| CompactionNotice | `status` / `tokensBefore` / `tokensAfter` / `elapsedMs` / `summary` / `onCancel` / `onRetrySave` / `summaryOpen` / `busy` | `status`：`running` / `completed` / `cancelled` / `failed` / `save-pending`（类型本地定义，未改 agent-core 契约） |
| 全部 | `messages` | 覆盖本组件的部分文案（`Partial<AgentWorkspaceMessages>`） |

辅助导出：`isTerminalReadOnly`、`terminalGroup`、`subagentSparkPhase`、`orderLedger`、`artifactKindIcon`。

## 受控
- TerminalTabs `value`、PinnedSummary `expanded`、FilePreview `mode`、ActivityLedger `filter`、CompactionNotice `summaryOpen` 均可受控；不传时组件内部持有状态。
- 组件不判断动作是否成功：停止后由宿主把状态改为 `stop-pending`，确认后改为 `ended`；未知回执（`terminal.receipt.status === 'unknown'`）显示「结果待确认」。

## 可访问性
- 终端输出是 `role="log"` + `aria-live="off"`，流式输出不逐块朗读；会话状态在 `role="status"` 内。输出区可聚焦（键盘滚动）；用户上滚后不再自动跟随，出现「有新输出」按钮，点击后回到底部并聚焦输出区。
- 终端输入是带标签的单行输入（「向 终端 A 输入」）；IME 合成期间（`compositionstart` / `isComposing` / `keyCode 229`）Enter 不发送。
- 只读终端显示「继承的终端记录 · 只读」，不绘制任何控件；TerminalRow 在打开按钮的描述中说明只读。
- 每个状态 = 字形 + 文字（+ 色调）；`unknown` 永远不显示为「已结束」。
- ContextUsage 只有 `usagePercent` 返回数字时才渲染 `role="meter"`（含 value/max 与朗读文本）；未知上限 / 部分数据只有文字，非精确值标注「估计值 / 部分数据」。ring 触发按钮名为「上下文用量 12.4K / 32K · 估计值」，Popover 为带标题的 dialog。
- SubAgentCard、ArtifactCard 是带标题的 `<article>`，操作按钮在卡片内部，Tab 逐个经过；PinnedSummary、RunSummary、FilePreview 是由标题命名的 `<section>`。
- 时间为 `<time dateTime>`；FilePreview 的行号 `aria-hidden` 且不可选中，复制结果在隐藏的 `role="status"` 中宣告。
- 强制颜色模式下边框、圆环、分段条改为 `CanvasText` / `Highlight`。

## 键盘
| 位置 | 按键 | 行为 |
| --- | --- | --- |
| TerminalTabs / FilePreview / ActivityLedger 标签 | ←/→、Home/End、Enter/Space | 移动焦点并激活（Tabs 组件） |
| 终端输入 | Enter | 发送（合成期间除外） |
| 终端输出 | ↑/↓/PageUp/PageDown | 滚动 |
| ContextUsage ring | Enter / Space；Esc | 打开 Popover；关闭并把焦点还给触发按钮 |
| TerminalList 分组、PinnedSummary、CompactionNotice 摘要 | Enter / Space | 展开 / 收起（Collapsible） |

## 状态矩阵
| 组件 | 状态 |
| --- | --- |
| PersistentTerminal | opening / running / waiting-input（可输入）/ idle（「命令已返回，终端尚未关闭」）/ stop-pending（「停止尚未确认」+ 重试停止）/ closing / ended（退出码）/ failed / unknown（状态待确认）/ 只读继承 / 输出截断 / 部分捕获 / 无输出 |
| TerminalList | 未关闭 / 状态待确认 / 已结束 / 继承记录（空组不绘制）/ 空列表 / 加载更多 |
| SubAgentCard | 10 个 SubagentStatus；运行中按 phase 显示 AgentSpark；需要处理（警示边框 + 文字 + 待回答数）；部分 / 估计 / 未知用量 |
| ContextUsage | 估计 / 精确 / 部分 / 未知；正常 / 接近上限（≥80%）/ 超过上限；上限未知；说明文字 |
| PinnedSummary | 展开 / 收起；最新 / 正在更新 / 可能过期 / 暂无；来源可用 / 失效 |
| ArtifactCard | generating / partial / saved / failed / unavailable / stale；新建 / 已修改 / 已移动 / 已删除 |
| FilePreview | loading / ready（文本、代码、Markdown、图片）/ binary·unknown / error / large-file·partial / changed / missing / unavailable / 外部文件 |
| ActivityLedger | all / agent / tool / system / user；loading / empty / 筛选后为空 |
| RunSummary | completed / partial / failed / cancelled / interrupted / saving / running；保存中 / 保存失败 / 保存未知；副作用 |
| CompactionNotice | running / completed / cancelled / failed / save-pending；有 / 无摘要 |

## Motion
| 组件 | 动效 | 所有者 |
| --- | --- | --- |
| SubAgentCard、CompactionNotice（running） | AgentSpark 点阵循环（只在活动、页面可见、在视口内时运行） | CSS keyframes（base.css），`useAgentLoop` |
| ArtifactList、ActivityLedger 新增行 | 挂载后新出现的 id 一次入场（`row`：4px + fast） | motion/react `AgentEntrance` |
| TerminalList 分组、PinnedSummary、CompactionNotice 摘要 | 高度过渡，可中途反向 | CSS（Collapsible） |
| RunSummary | 状态变化时左边框颜色过渡一次（fast），无循环 | CSS transition |
| 终端光标 | 静态，不闪烁 | — |

首次渲染已存在的行、摘要正文更新、筛选切换都不重放入场。

## 减动
系统设置与 `RhineProvider motion="reduce"` 都生效：AgentSpark 静态帧（每阶段不同）、入场无位移、折叠与颜色过渡即时（时长 token 归零）、Spinner 停止旋转。本族样式没有自己的 `@keyframes`。

## 测试
- 单测（vitest + Testing Library，jsdom）：`packages/agent/test/workspace-terminal.test.tsx`（24：输入 / IME / 停止 / 只读 / 跟随底部 / Tabs / 分组顺序）、`workspace-context.test.tsx`（22：子任务、上下文百分比门禁、ring Popover 键盘、摘要状态与来源）、`workspace-artifacts.test.tsx`（26：产物状态与动作、文件预览标签 / 图片 / 分块 / 复制、事件顺序与筛选、运行摘要、整理提示、只有新行入场、减动）。
- 浏览器：`apps/docs/e2e/agent-workspace.spec.ts`（Chromium：终端 Enter 发送、停止待确认、继承终端无控件、未知上限无 meter、ring 键盘打开、事件筛选顺序与 aria-selected、「已保存」只出现在 saved、文件预览方向键、明暗 axe、320 宽无横向溢出）。Firefox / WebKit 未跑。
- 未做：读屏人工验收、真实 IME 人工验收、5 宽度截图基线。
