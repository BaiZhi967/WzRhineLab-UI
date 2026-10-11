# MessageList · AgentMessage · MessagePart · ThinkingBlock · AgentProcess · RunStatus · CitationChip · JumpToLatest · MessageActions · CodeBlock

- 状态：**Beta（M12）** · 契约：[ADR-0010](../development/adr/0010-m12-agent-ui-plan.md) §4–5、[ADR-0011](../development/adr/0011-agent-contracts.md)、[ADR-0012](../development/adr/0012-agent-motion.md)
- 底座：语义 HTML；ThinkingBlock / AgentProcess 用 `@wzrhine/react` Collapsible，CitationChip 用 Tooltip，JumpToLatest 用 MotionPresence
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
| `MessageActions` | 消息级工具栏（复制、重新生成、编辑、分叉、反馈） | 批量操作 |

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
                  renderArtifact: (a) => <ArtifactCard artifact={a} />, onRetry, onRegenerate, onEdit, onFork, onFeedback }}
/>
list.current?.scrollToLatest();

<ThinkingBlock thinking={thinking} expanded={open} onExpandedChange={setOpen} onOpenFull={openRecord} />
<AgentProcess run={run} renderTool={(t) => <ToolRecord tool={t} />} onLoadRecord={load} onOpenFull={openRun} />
<RunStatus run={run} announce />            // 或 status / phase / syncStatus / actionStatus / labelOverride
<CitationChip citation={c} onOpen={openSource} />
<CodeBlock code={src} language="python" filename="classify.py" showLineNumbers maxHeight="20rem" />
```

| 组件 | 属性 | 说明 |
| --- | --- | --- |
| MessageList | `messages` | 适配器已去重、排序的 `MessageView[]`，按 `id` 保持身份 |
| MessageList | `renderMessage` / `messageProps` | 自定义整条渲染（仍包在 `<li data-message-id>` 中）/ 传给默认 AgentMessage 的属性 |
| MessageList | `loading` / `empty` / `footer` | 首次加载、空状态替换、列表末尾插槽 |
| MessageList | `hasEarlier` / `onLoadEarlier` / `loadingEarlier` / `earlierError` | 加载更早消息；`earlierError` 为 `true` 时用默认文案，节点则原样显示，均附重试按钮 |
| MessageList | `onFollowChange` / ref `scrollToLatest()` `isFollowing()` `viewport()` | 跟随状态回调与命令式句柄 |
| AgentMessage | `message` / `model` / `renderPart` / `footer` | `renderPart(part, rendered)` 可包裹默认渲染 |
| AgentMessage | `onRetry` `onCopy` `onRegenerate` `onEdit` `onFork` `onFeedback` `feedback` | 每项只在提供回调时出现；重新生成、反馈只对助手，编辑只对非继承的用户消息 |
| MessagePart | `renderers.markdown / code / custom[name]` | 均可选；缺省走安全兜底 |
| MessagePart | `renderTool` / `renderArtifact` | 缺省为一行兜底：名称 + 状态 / 标题 + 状态 |
| MessagePart | `onOpenCitation` / `onRecoveryAction(errorId, actionId)` / `onOpenThinking` | error 片段的动作按钮只在有 `onRecoveryAction` 时渲染 |
| CodeBlock | `code` `language` `filename` `showLineNumbers` `maxHeight` `copyable` `onCopy` `children` | `children` 替换 `<code>` 内容（宿主高亮），复制仍用 `code` |
| ThinkingBlock | `thinking` `label` `expanded` `defaultExpanded` `onExpandedChange` `renderers` `onOpenFull` | 默认折叠 |
| AgentProcess | `run` `renderTool` `renderers` `expanded` `defaultExpanded` `onExpandedChange` `onLoadRecord` `onOpenFull` `onOpenThinking` `headingLevel` | 运行中默认展开、结束后折叠；用户切换后以用户为准 |
| RunStatus | `run` 或 `status` `phase` `elapsedMs` `syncStatus` `actionStatus` `labelOverride` `hint` `appearance` `size` `announce` `announceInterval` | `appearance`：`pill`（默认）/ `inline` / `line`（spark + 阶段 + 耗时） |
| CitationChip | `citation` `onOpen` `label` `showIcon` `selected` | 不可用来源永不调用 `onOpen` |
| JumpToLatest | `atLatest` `unreadCount` `onJump` `loading` `label` | |
| MessageActions | `copyText` `onCopy` `onRegenerate` `onEdit` `onFork` `feedback` `onFeedback` `label` `children` | 无任何能力时不渲染 |

`CopyHandler = (text) => void | boolean | Promise<void | boolean>`：返回 `false`、抛错或 reject 视为失败。没有 `onCopy` 时使用 `navigator.clipboard.writeText`；两者都没有就不渲染复制按钮。

`RunStatus` 组件与 agent-core 的 `RunStatus` 类型同名：入口同时导出两者（`import type { RunStatus }` 仍是状态联合类型）。

## 受控
- ThinkingBlock：`expanded` + `onExpandedChange`；不传为非受控（`defaultExpanded`）。流式更新只替换内容，不折叠面板、不重挂载、不清除选区。
- AgentProcess：`expanded` + `onExpandedChange`；非受控时 `defaultExpanded` 优先，其次跟随运行是否活动，用户切换一次之后保持用户选择。
- MessageActions：`feedback` 由调用方持有；再次按下当前选项回传 `null`。

## 滚动所有权（MessageList）
- 距底部 ≤ `FOLLOW_THRESHOLD_PX`（4，JS 测量）视为在底部；在底部时跟随新消息、流式增长与折叠展开（ResizeObserver，不存在时跳过）。
- 停止跟随：滚轮上滚、触摸下拉、视口内 PageUp / Home / ArrowUp / Shift+Space、拖动滚动条（任何不是组件自己造成的 `scrollTop` 减小）。回到底部恢复跟随。
- 不跟随时出现 JumpToLatest，计数为离开后追加的消息数；点击平滑滚到底（减动时 `auto`）。
- 末尾新增 `user` 消息（刚发送）时滚到最新一次，即使正在阅读历史。
- 加载更早消息：调用 `onLoadEarlier` 前记录第一条可见 `[data-message-id]` 与偏移，前插后恢复；`earlierError` 清除锚点。
- 整个列表与之前没有共同 id（切换会话）时视为历史：不入场动画，回到底部并恢复跟随。
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
- MessageActions：`role="toolbar"` + `aria-label`，单一 Tab 停靠点，方向键移动；反馈按钮 `aria-pressed`；复制状态通过按钮名称和 polite status 各告知一次。
- JumpToLatest 出现时不抢焦点，名称「返回最新消息，N 条新消息」，`loading` 时 `aria-busy`。

## 键盘
| 位置 | 按键 | 行为 |
| --- | --- | --- |
| MessageList 视口 | ↑ / ↓ / PageUp / PageDown / Home / End / Space | 原生滚动；向上的按键停止跟随 |
| ThinkingBlock / AgentProcess 触发器 | Enter / Space | 切换展开 |
| MessageActions | Tab | 进入 / 离开工具栏（一个停靠点） |
| MessageActions | ← → ↑ ↓ / Home / End | 在按钮间移动 |
| CodeBlock 滚动区 | 方向键 | 横向 / 纵向滚动 |
| CitationChip | Enter / Space | 可用且有 `onOpen` 时打开；不可用时无动作 |

## 状态矩阵
| 组件 | 状态 |
| --- | --- |
| MessageList | empty / loading / following / reading-history（JumpToLatest + 计数）/ loading-earlier / earlier-error / streaming |
| AgentMessage | user / assistant / system / tool × pending / streaming / complete / partial / failed（用户消息为「发送失败」）/ cancelled / interrupted；edited；inherited；usage exact / estimated（「估计」）/ partial（「部分统计」）/ unknown |
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
| ThinkingBlock / AgentProcess | Collapsible 高度（CSS，可中断）；流式时 AgentSpark | 即时切换；静态帧 |
| RunStatus | 活动字形呼吸（`useAgentLoop`，离屏 / 隐藏页暂停）；`line` 用 AgentSpark | 静态 |
| CitationChip / JumpToLatest / CodeBlock | 背景色 `fast` 过渡 | token 归零，直接变化 |

本族 CSS 不定义 `@keyframes`，循环全部来自 base.css（已在两种减动来源下关闭）。

## 测试
- 单测（vitest + Testing Library，jsdom）：
  - `packages/agent/test/message-parts.test.tsx`（27）：plain-text 分段、每种 part（含 HTML 不解析、custom 兜底、未知类型、英文表）、CodeBlock 复制 / 失败 / 剪贴板 / 行号 / 滚动区、CitationChip 可用 / 不可用 / 多实例、ThinkingBlock 键盘 / 受控 / 流式不重挂载 / 中断 / 截取 / 减动 / 多实例。
  - `packages/agent/test/message-list.test.tsx`（18）：语义（非 log）、空 / 加载、插槽；跟随、上滚停止 + 计数、PageUp / 滚轮、回到底部恢复、发送滚到最新、ResizeObserver、加载更早保持锚点、错误重试、ref 句柄不移焦点；入场只对追加消息、减动、切换会话、双实例；JumpToLatest。
  - `packages/agent/test/message-message.test.tsx`（29）：AgentMessage 角色 / 用量完整度 / 失败重试 / 能力门控 / 流式节流播报 / renderPart；MessageActions roving、反馈、复制状态；AgentProcess 展开策略、当前步骤、迟到记录、嵌套、截取；RunStatus 三轴、全状态、announce 节流、减动。
- 浏览器：`apps/docs/e2e/agent-message.spec.ts`（Chromium，9）：滚轮上滚停止跟随 + JumpToLatest 出现 / 点击回底并隐藏、PageUp 与发送、加载更早保持位置、ThinkingBlock Enter / Space、复制（stub `navigator.clipboard`）、不可用引用不能打开、custom / 未知兜底、明暗 axe、320px 无横向溢出。
- 未做：Firefox / WebKit、真实读屏人工验收、触摸设备上的拖动停止跟随（仅单测模拟 touchmove）。
