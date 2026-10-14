# MessageList · AgentMessage · MessagePart · ThinkingBlock · AgentProcess · RunStatus · CitationChip · JumpToLatest · MessageActions · CodeBlock · RunDetails · SkillUseList

- 状态：**Beta（M12）** · 契约：[ADR-0010](../development/adr/0010-m12-agent-ui-plan.md) §4–5、[ADR-0011](../development/adr/0011-agent-contracts.md)、[ADR-0012](../development/adr/0012-agent-motion.md)
- 底座：语义 HTML；ThinkingBlock / AgentProcess / 运行详情用 `@wzrhine/react` Collapsible，CitationChip 与能力关闭的 MessageActions 按钮用 Tooltip，JumpToLatest 用 MotionPresence
- 源码：`packages/agent/src/components/{message,process}/`，样式 `styles/{message,process}.css`，文案 `provider/messages/message.ts` · Showcase：`#/agent/messages`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `MessageList` | 对话阅读视口：顺序、滚动跟随、返回最新、加载更早消息 | 非对话的长列表（用 DataTable / 虚拟列表） |
| `AgentMessage` | 单条用户 / 助手 / 系统 / 工具消息 | 工具调用详情（tools 族 ToolRecord） |
| `MessagePart` | 按 `part.type` 渲染一个片段，带安全兜底 | Markdown 解析、代码高亮（通过 renderer 注入） |
| `CodeBlock` | 带标题与复制的代码块，内部横向滚动 | 可编辑代码、Diff（tools 族 DiffPreview） |
| `ThinkingBlock` | 一次模型调用的**可公开**思考摘要 | 私有推理全文（不假定存在） |
| `AgentProcess` | 一次运行按模型调用分组的过程记录 | 完整 Code Mode 树（tools 族 CodeModeToolTree） |
| `RunStatus` | 运行轴状态 + 同步 / 动作回执两条独立的轴 | 单个工具状态（ToolStatusPill） |
| `CitationChip` | 正文中的来源标注 | 普通链接 |
| `JumpToLatest` | 阅读历史时回到最新内容 | 页面级「回到顶部」 |
| `MessageActions` | 消息级工具栏（复制、重新生成、编辑、重新编辑本轮输入、分叉、反馈） | 批量操作 |
| `RunDetails` | 一轮实际运行的权限、模型、耗时、用量、错误码（`<dl>`） | 运行级汇总卡片（workspace 族 RunSummary） |
| `SkillUseList` | 本轮**实际加载**的技能：名称 · 来源 · 方式 · 摘要前 8 位 | 可选技能清单、技能选择器 |

## API
```tsx
const list = React.useRef<MessageListHandle>(null);
<MessageList
  ref={list}
  messages={messages}
  isStreaming={run.status === 'running'}
  hasEarlier onLoadEarlier={loadEarlier} loadingEarlier={loading} earlierError={error}
  onFollowChange={setFollowing}
  footer={<RunSummary … />}
  messageProps={{ renderers: { markdown: (src) => <Markdown source={src} /> }, renderTool: (t) => <ToolRecord tool={t} />,
                  renderArtifact: (a) => <ArtifactCard artifact={a} />, onRetry, onRegenerate, onEdit, onFork, onFeedback,
                  onRestoreInput: restoreDraft,
                  actionCapabilities: () => ({ fork: running ? { enabled: false, reason: '运行中不可分叉' } : true }) }}
  holdFollow={approvalDocked}
/>
list.current?.scrollToLatest();

<ThinkingBlock thinking={thinking} expanded={open} onExpandedChange={setOpen} onOpenFull={openRecord} />
<AgentProcess run={run} renderTool={(t) => <ToolRecord tool={t} />} onLoadRecord={load} onOpenFull={openRun} />
<RunStatus run={run} announce />            // 或 status / phase / syncStatus / actionStatus / labelOverride
<CitationChip citation={c} onOpen={openSource} />
<CodeBlock code={src} language="python" filename="classify.py" showLineNumbers maxHeight="20rem" />
<RunDetails details={message.details} aria-label="运行详情" />
<SkillUseList skills={message.skillUses ?? []} />
```

| 组件 | 属性 | 说明 |
| --- | --- | --- |
| MessageList | `messages` | 适配器已去重、排序的 `MessageView[]`，按 `id` 保持身份 |
| MessageList | `renderMessage` / `messageProps` | 自定义整条渲染（仍包在 `<li data-message-id>` 中）/ 传给默认 AgentMessage 的属性 |
| MessageList | `loading` / `empty` / `footer` | 首次加载、空状态替换、列表末尾插槽 |
| MessageList | `hasEarlier` / `onLoadEarlier` / `loadingEarlier` / `earlierError` | 加载更早消息；`earlierError` 为 `true` 时用默认文案，节点则原样显示，均附重试按钮 |
| MessageList | `onFollowChange` / ref `scrollToLatest()` `isFollowing()` `viewport()` | 跟随状态回调与命令式句柄 |
| MessageList | `holdFollow` | 为 `true` 时新内容不自动滚动（如审批停靠在输入框上方）；见「滚动所有权」 |
| AgentMessage | `message` / `model` / `renderPart` / `footer` | `renderPart(part, rendered)` 可包裹默认渲染 |
| AgentMessage | `onRetry` `onCopy` `onRegenerate` `onEdit` `onFork` `onFeedback` `feedback` | 每项只在提供回调时出现；重新生成、反馈只对助手，编辑只对非继承的用户消息 |
| AgentMessage | `onRestoreInput(messageId)` | 「重新编辑本轮输入」：把本轮输入放回输入框；用户 / 助手、非继承消息，失败消息上同样提供 |
| AgentMessage | `actionCapabilities(message)` | 返回该消息的 `MessageActionCapabilities`，用于按消息关闭单个操作并给出原因 |
| AgentMessage | `details` `detailsOpen` `defaultDetailsOpen` `onDetailsOpenChange` | 运行详情（缺省为 `message.details`）；没有可显示字段时不渲染折叠区 |
| AgentMessage | `message.skillUses` | 存在时自动渲染 SkillUseList |
| MessagePart | `renderers.markdown / code / custom[name]` | 均可选；缺省走安全兜底 |
| MessagePart | `renderTool` / `renderArtifact` | 缺省为一行兜底：名称 + 状态 / 标题 + 状态 |
| MessagePart | `onOpenCitation` / `onRecoveryAction(errorId, actionId)` / `onOpenThinking` | error 片段的动作按钮只在有 `onRecoveryAction` 时渲染 |
| CodeBlock | `code` `language` `filename` `showLineNumbers` `maxHeight` `copyable` `onCopy` `children` | `children` 替换 `<code>` 内容（宿主高亮），复制仍用 `code` |
| ThinkingBlock | `thinking` `label` `expanded` `defaultExpanded` `onExpandedChange` `renderers` `onOpenFull` | 默认折叠 |
| AgentProcess | `run` `renderTool` `renderers` `expanded` `defaultExpanded` `onExpandedChange` `onLoadRecord` `onOpenFull` `onOpenThinking` `headingLevel` | 运行中默认展开、结束后折叠；用户切换后以用户为准 |
| RunStatus | `run` 或 `status` `phase` `elapsedMs` `syncStatus` `actionStatus` `labelOverride` `hint` `appearance` `size` `announce` `announceInterval` | `appearance`：`pill`（默认）/ `inline` / `line`（spark + 阶段 + 耗时） |
| CitationChip | `citation` `onOpen` `label` `showIcon` `icon` `selected` | 不可用来源永不调用 `onOpen`；`sourceType` 开放（ADR-0013 §2）：自定义类型回落到 `link` 图标并显示原始 id，`icon` 属性可换成自定义 SVG 内容，文案可经 `message.sourceType` 文案表增补 |
| JumpToLatest | `atLatest` `unreadCount` `onJump` `loading` `label` | |
| MessageActions | `copyText` `onCopy` `onRegenerate` `onEdit` `onRestoreInput` `onFork` `feedback` `onFeedback` `capabilities` `label` `children` | 无任何能力时不渲染 |
| MessageActions | `capabilities: Partial<Record<'copy' \| 'regenerate' \| 'edit' \| 'fork' \| 'restore' \| 'feedback', CapabilityInput>>` | 缺省 = 可用；`false` / `{ enabled: false, reason }` = 显示但 `aria-disabled`，从不调用回调 |
| RunDetails | `details: RunDetailsView` | 行顺序：权限、提供商、模型、模型 ID（等宽）、推理强度、开始时间、耗时、最近活动、聊天用量、缓存、工具内模型用量、上下文压缩、错误码（等宽）、备注 |
| SkillUseList | `skills: SkillUseView[]` `label` | 空数组不渲染；摘要截取前 `DIGEST_LENGTH`（8）位，完整值在 `title` |

`CopyHandler = (text) => void | boolean | Promise<void | boolean>`：返回 `false`、抛错或 reject 视为失败。没有 `onCopy` 时使用 `navigator.clipboard.writeText`；两者都没有就不渲染复制按钮。

`RunStatus` 组件与 agent-core 的 `RunStatus` 类型同名：入口同时导出两者（`import type { RunStatus }` 仍是状态联合类型）。

附件与引用片段的 `kind` 同样开放（ADR-0013 §2）：内置类别有图标与文案，自定义类别回落到 `file` / `custom` 图标与原始 id，可经 `composer.kind` / `composer.referenceKind`、`message.referenceKind` 文案表增补。错误片段（`RecoveryView.kind`）的自定义类型回落到 `unknown` 的 warning 呈现并显示原始 id。

## 受控
- ThinkingBlock：`expanded` + `onExpandedChange`；不传为非受控（`defaultExpanded`）。流式更新只替换内容，不折叠面板、不重挂载、不清除选区。
- AgentProcess：`expanded` + `onExpandedChange`；非受控时 `defaultExpanded` 优先，其次跟随运行是否活动，用户切换一次之后保持用户选择。
- MessageActions：`feedback` 由调用方持有；再次按下当前选项回传 `null`。`capabilities` 每次渲染读取，切换能力不重挂载按钮、不丢焦点。
- AgentMessage 运行详情：`detailsOpen` + `onDetailsOpenChange`；不传为非受控（`defaultDetailsOpen`，默认折叠）。

## 滚动所有权（MessageList）
- 距底部 ≤ `FOLLOW_THRESHOLD_PX`（4，JS 测量）视为在底部；在底部时跟随新消息、流式增长与折叠展开（ResizeObserver，不存在时跳过）。
- 停止跟随：滚轮上滚、触摸下拉、视口内 PageUp / Home / ArrowUp / Shift+Space、拖动滚动条（任何不是组件自己造成的 `scrollTop` 减小）。回到底部恢复跟随。
- 不跟随时出现 JumpToLatest，计数为离开后追加的消息数；点击平滑滚到底（减动时 `auto`）。
- 末尾新增 `user` 消息（刚发送）时滚到最新一次，即使正在阅读历史。
- 加载更早消息：调用 `onLoadEarlier` 前记录第一条可见 `[data-message-id]` 与偏移，前插后恢复；`earlierError` 清除锚点。
- 整个列表与之前没有共同 id（切换会话）时视为历史：不入场动画，回到底部并恢复跟随。
- `holdFollow`：为 `true` 时追加消息与内容增长都不移动视口（挂载与切换会话仍定位到最新）；跟随意图保留，不触发 `onFollowChange(false)`。被搁置的内容到达后显示 JumpToLatest（计数从开始搁置时算起），点击或发送新的用户消息仍会滚动。变回 `false` 时，若读者没有向上滚动，回到底部并继续跟随；向上滚动过则保持阅读位置。
- `overflow-anchor: none`；组件从不移动焦点。

## 可访问性
- MessageList 是可聚焦的 `<section aria-label="对话消息">` + `<ol>`。**不用 `role="log"`**：log 隐含 polite live region，会逐 token 朗读流式文本。播报由每条消息自己的节流状态行负责。
- AgentMessage 是 `<article aria-labelledby>`，名称来自头部（作者 + 时间）；时间是 `<time dateTime>`；流式中 `aria-busy`。流式期间的 `role="status"` 只读阶段（「执行工具」），按 `announceInterval`（默认 1.5s）合并；结束时读一次「回答已完成」。历史消息没有 live region。
- 失败 / 中断 / 停止 / 部分输出是字形 + 文字的静态提示，不是 `role="alert"`（失败由运行层的通知负责宣告，避免一次失败多处宣告）。
- MessagePart 的 markdown 兜底**不解析 HTML**（`<b>` 原样显示），fenced code 变成 CodeBlock；未知 / 未注册类型显示「无法显示此内容 · 内容类型：x」+ summary，从不空白。图片必须有 `alt`，`loading="lazy"`。
- CodeBlock：`<figure>` + `<figcaption>`；滚动区 `tabIndex=0`、`role="region"`，名称为标题，键盘可滚动；行号 `aria-hidden`、不参与复制。
- ThinkingBlock / AgentProcess 的触发器是 Collapsible 的 `<button>`（`aria-expanded` / `aria-controls`）；折叠态最新一行预览 `aria-hidden`，触发器名称不随 token 变化。AgentProcess 每轮是 `<section aria-label="模型调用 N">`，当前步骤 `aria-current="step"`，嵌套工具为带名称的 `<ul>`。
- CitationChip 是 `<button>`，名称「引用 n：标题」，来源卡片同时作为 `aria-describedby` 文本（不只靠悬停）。不可用：`aria-disabled`、仍可聚焦、名称附「来源不可用」、描述含原因。
- RunStatus：同步与动作回执是独立的小标签；`unknown` 回执为警示色 + 菱形问号，从不显示为成功；`announce` 渲染节流的 `role="status"`。
- MessageActions：`role="toolbar"` + `aria-label`，单一 Tab 停靠点，方向键移动；反馈按钮 `aria-pressed`；复制状态通过按钮名称和 polite status 各告知一次。能力关闭的按钮是 `aria-disabled`（不是 `disabled`），仍可聚焦、仍在方向键顺序里；原因既是 `aria-describedby` 文本（不只靠悬停），也在聚焦 / 悬停时以 Tooltip「名称 · 原因」显示；点击、Enter、Space 都不调用回调。
- RunDetails 是 `<dl>`，每行 `<div>` 包 `<dt>` + `<dd>`；时间是 `<time dateTime>`；用量行总带完整度标签（含「完整统计」），部分统计不会被读成完整数字。在 AgentMessage 中折叠区触发器为「运行详情」按钮，`<dl>` 以同名 `aria-label` 命名。
- SkillUseList 是 `aria-labelledby` 指向可见「已加载技能」的 `<ul>`；分隔符 `aria-hidden`；摘要前有读屏前缀「摘要」。
- JumpToLatest 出现时不抢焦点，名称「返回最新消息，N 条新消息」，`loading` 时 `aria-busy`。

## 键盘
| 位置 | 按键 | 行为 |
| --- | --- | --- |
| MessageList 视口 | ↑ / ↓ / PageUp / PageDown / Home / End / Space | 原生滚动；向上的按键停止跟随 |
| ThinkingBlock / AgentProcess 触发器 | Enter / Space | 切换展开 |
| MessageActions | Tab | 进入 / 离开工具栏（一个停靠点） |
| MessageActions | ← → ↑ ↓ / Home / End | 在按钮间移动（含能力关闭的按钮） |
| MessageActions 能力关闭的按钮 | Enter / Space | 无动作；聚焦时显示原因 |
| 运行详情触发器 | Enter / Space | 切换展开 |
| CodeBlock 滚动区 | 方向键 | 横向 / 纵向滚动 |
| CitationChip | Enter / Space | 可用且有 `onOpen` 时打开；不可用时无动作 |

## 状态矩阵
| 组件 | 状态 |
| --- | --- |
| MessageList | empty / loading / following / reading-history（JumpToLatest + 计数）/ loading-earlier / earlier-error / streaming / hold-follow（`data-hold`） |
| AgentMessage | user / assistant / system / tool × pending / streaming / complete / partial / failed（用户消息为「发送失败」）/ cancelled / interrupted；edited；inherited；usage exact / estimated（「估计」）/ partial（「部分统计」）/ unknown；skillUses；details 折叠 / 展开 |
| RunDetails | 每个字段 有 / 缺失（缺失不显示行）；耗时 exact / lower-bound（「至少 N」）/ unknown（「未记录」）；用量 4 种完整度；工具内模型「N 次调用未返回用量」；显式 0 照常显示 |
| SkillUseList | 空（不渲染）/ 有来源 / 无来源 / 有摘要 / 无摘要 × 手动选择 / 模型加载 |
| MessageActions | 每个操作 无回调（不渲染）/ 可用 / 能力关闭（无原因）/ 能力关闭（有原因） |
| MessagePart | text / markdown / code / image / thinking / tool-call / attachment / reference / citation / artifact / status / error / custom / 未知类型 |
| ThinkingBlock | collapsed / expanded × streaming / completed / interrupted；truncated；无摘要 |
| AgentProcess | active（展开、阶段标题）/ settled（折叠、「N 次模型调用 · M 个操作」）；call running / completed / interrupted / failed；pending-record；truncated |
| RunStatus | 9 种 RunStatus × 13 种 RunPhase（只在活动状态显示）；sync ≠ live、action ≠ idle 时附加标签 |
| CitationChip | default / hover / focus / selected / unavailable |
| JumpToLatest | hidden-at-bottom / visible / new-messages / loading |

## Motion
| 组件 | 动效 | 减动 |
| --- | --- | --- |
| MessageList | 挂载后追加的消息 AgentEntrance `message`（opacity + 6px，`base`）；历史、前插、切换会话不动；不做列表 layout 动画 | 无位移，≤ `fast` 淡入 |
| JumpToLatest | MotionPresence `fade`（`fast`） | 即时显隐 |
| 平滑滚到最新 | `scrollTo({ behavior: 'smooth' })` | `auto` |
| ThinkingBlock / AgentProcess / 运行详情 | Collapsible 高度（CSS，可中断）；流式时 AgentSpark | 即时切换；静态帧 |
| MessageActions 原因提示 | Tooltip 自身淡入 | 即时显隐 |
| RunDetails / SkillUseList | 无 | — |
| RunStatus | 活动字形呼吸（`useAgentLoop`，离屏 / 隐藏页暂停）；`line` 用 AgentSpark | 静态 |
| CitationChip / JumpToLatest / CodeBlock | 背景色 `fast` 过渡 | token 归零，直接变化 |

本族 CSS 不定义 `@keyframes`，循环全部来自 base.css（已在两种减动来源下关闭）。

## 测试
- 单测（vitest + Testing Library，jsdom）：
  - `packages/agent/test/message-parts.test.tsx`（27）：plain-text 分段、每种 part（含 HTML 不解析、custom 兜底、未知类型、英文表）、CodeBlock 复制 / 失败 / 剪贴板 / 行号 / 滚动区、CitationChip 可用 / 不可用 / 多实例、ThinkingBlock 键盘 / 受控 / 流式不重挂载 / 中断 / 截取 / 减动 / 多实例。
  - `packages/agent/test/message-list.test.tsx`（18）：语义（非 log）、空 / 加载、插槽；跟随、上滚停止 + 计数、PageUp / 滚轮、回到底部恢复、发送滚到最新、ResizeObserver、加载更早保持锚点、错误重试、ref 句柄不移焦点；入场只对追加消息、减动、切换会话、双实例；JumpToLatest。
  - `packages/agent/test/message-gaps.test.tsx`（31）：RunDetails 行顺序 / dt-dd / 缺失不显示 / 显式 0 / 耗时「至少」「未记录」/ 工具内未返回用量 / 英文表；SkillUseList 文本与 8 位摘要 / 空 / 多实例 id；运行详情折叠区（键盘、受控、覆盖 `message.details`、减动）；能力关闭不调用且有描述、Tab 聚焦显示原因 Tooltip、`false` 无原因、无回调不渲染、反馈、切换不丢焦点、多实例；重新编辑本轮输入（独立于编辑、失败消息、继承 / 流式不显示、`actionCapabilities`、英文）；holdFollow（挂载定位、搁置不滚动 + 计数、释放回底、释放不拉回已上滚的读者、跳转 / 发送仍滚动、回到底部清除）。
  - `packages/agent/test/message-message.test.tsx`（29）：AgentMessage 角色 / 用量完整度 / 失败重试 / 能力门控 / 流式节流播报 / renderPart；MessageActions roving、反馈、复制状态；AgentProcess 展开策略、当前步骤、迟到记录、嵌套、截取；RunStatus 三轴、全状态、announce 节流、减动。
- 浏览器：`apps/docs/e2e/agent-message.spec.ts`（Chromium，13）：滚轮上滚停止跟随 + JumpToLatest 出现 / 点击回底并隐藏、PageUp 与发送、加载更早保持位置、ThinkingBlock Enter / Space、复制（stub `navigator.clipboard`）、不可用引用不能打开、custom / 未知兜底、运行详情 Enter / Space 切换、能力关闭的分叉可聚焦 + Tooltip 原因 + 键盘 / 点击无动作、失败消息「重新编辑本轮输入」、holdFollow 搁置与释放、明暗 axe、320px 无横向溢出。
- 未做：Firefox / WebKit、真实读屏人工验收、触摸设备上的拖动停止跟随（仅单测模拟 touchmove）。
