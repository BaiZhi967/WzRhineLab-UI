# ApprovalPanel · QuestionnaireCard · ErrorRecoveryNotice · InterventionDock

- 状态：**Alpha（M12）** · 契约：[ADR-0011](../development/adr/0011-agent-contracts.md) §4、§6、§10，动效 [ADR-0012](../development/adr/0012-agent-motion.md)
- 底座：语义 HTML + `@wzrhine/react`（Button、IconButton、Callout、Alert、Collapsible、Skeleton、StatusBadge、RadioGroup/Radio、CheckboxGroup/Checkbox、Textarea）；页切换 `motion/react`
- 源码：`packages/agent/src/components/intervention/*`，样式 `styles/intervention.css`，文案 `provider/messages/intervention.ts` · Showcase：`#/agent/intervention`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `ApprovalPanel` | 工具执行前向用户展示完整依据、风险与范围，发出「允许 / 拒绝」 | 权限模式设置；问卷；校验材料真实性（由宿主 adapter 负责） |
| `QuestionnaireCard` | Agent 向用户提出单选 / 多选 / 文本问题，分页、草稿、提交回执 | **授予任何工具权限**——问卷只收集信息；长表单 |
| `ErrorRecoveryNotice` | 说明已保留什么、什么仍未确认、可安全执行的恢复动作 | 字段错误；短暂反馈（Toast）；自动重放有副作用的工具 |
| `InterventionDock` | 把当前待处理的干预卡片叠放在输入框上方 | 通用列表；对话流中的历史卡片 |

## API
```tsx
<ApprovalPanel
  approval={approvalView}                       // ApprovalView
  onApprove={(scope, ctx) => adapter.approve(scope, ctx)}
  onReject={(ctx) => adapter.reject(ctx)}
  onRetryMaterial={reloadMaterial}              // unavailable
  onRefresh={refresh}                           // expired
  renderMaterial={(a) => <DiffPreview diff={a.diff!} />}  // 可选；默认内部只读 diff
  density="compact"                             // 'full'（默认）| 'compact'
/>

<QuestionnaireCard
  ref={handle}                                  // { flush(), focus() }
  questionnaire={view}                          // QuestionnaireView（answers = 宿主草稿）
  onAnswerChange={(answer) => saveDraft(answer)}
  onSubmit={(answers, ctx) => adapter.submit(answers, ctx)}
  onRetrySave={retrySave}
  onFlush={(answers) => flushDraft(answers)}
  onCopyAnswers={(text) => navigator.clipboard.writeText(text)}
/>

<ErrorRecoveryNotice recovery={recoveryView} onAction={(id) => run(id)} announce onDismiss={hide} />

<InterventionDock moreCount={pending.length - 1}>
  <ApprovalPanel key={a.operationId} approval={a} density="compact" … />
</InterventionDock>
```

| 组件 | 属性 | 说明 |
| --- | --- | --- |
| ApprovalPanel | `approval` | `status` 8 态、`tool`、`summary`、`reason`、`risk`、`scope`、`irreversible`、`unsandboxed`、`evidence[]`、`diff`、`availability`、`scopes`、`receipt` |
| ApprovalPanel | `onApprove(scope, ctx)` / `onReject(ctx)` | `ctx = { actionId, targetId: operationId, baseRevision: revision }`；无回调不渲染按钮 |
| ApprovalPanel | `renderMaterial` | 自定义材料视图；返回 `null` / `undefined` 时退回内部 diff |
| ApprovalPanel | `density` / `autoFocus` / `headingLevel` / `evidenceCollapseAt` | 紧凑密度；挂载时聚焦标题；标题级别（默认 3）；依据超过 N 项或单项过长时折叠（默认 3） |
| ApprovalPanel | `rejectNote` / `rejectLabel` / `allowLabel` / `allowSessionLabel` | 文案覆盖；其余文案走 `AgentMessagesProvider` 的 `intervention` 命名空间 |
| QuestionnaireCard | `questionnaire` | `questions[]`（`single` / `multiple` / `text`，`allowCustom`、`optional`（默认 true）、`maxLength`）、`answers`、`revision`、`status`、`draftStatus`、`submitStatus`、`receipt` |
| QuestionnaireCard | `onAnswerChange(answer)` | 每次修改上报一题；无回调时只读 |
| QuestionnaireCard | `onSubmit(answers, ctx)` | 规范化答案（未答可选题 → `skipped: true`）；`ctx.baseRevision = revision` |
| QuestionnaireCard | `ref.flush()` / `onFlush` | 宿主关闭页面前调用 `flush()`，组件把当前镜像答案交给 `onFlush` |
| QuestionnaireCard | `title` / `initialPage` | 标题覆盖；起始页（默认第一道未答题） |
| QuestionnaireCard | `renderQuestion(ctx)` | 自定义题型渲染（ADR-0013 §4）：`ctx` 含 `question` / `answer` / `editable` / `update(next)` / `defaultBody`；返回非空即替换内置题目体（可包裹 `defaultBody`）。`kind` 开放：single / multiple / text 之外的自定义题型无渲染器时回落为自由文本；`answerState` / `normalizeAnswers` 对自定义题型不过滤 `optionIds`，答案原样提交 |
| ErrorRecoveryNotice | `recovery` | `kind` 内置 8 种（自定义类型回落到 `unknown` 的 warning 呈现并显示原始 id，ADR-0013 §2）、`title`、`message`、`code`、`preserved[]`、`actions[]`（`tone`） |
| ErrorRecoveryNotice | `onAction(id)` / `busyActionIds` / `announce` / `onDismiss` | 动作回传 id；忙碌按钮；危险类是否 `role=alert`（默认 true）；仅 `resolved` 可关闭 |
| InterventionDock | `children` / `moreCount` / `animateInitial` / `label` | 卡片（需稳定 `key`）；「还有 N 个待处理」；首屏已有卡片是否入场；区域名称 |
| 纯函数 | `normalizeAnswers` / `answerState` / `answerText` / `isOverLimit` / `isQuestionOptional` / `isChoiceQuestion` / `isKnownQuestionKind` | 与组件同一套规则，adapter 可复用 |

「其他」答案编码（契约无额外字段）：选择题中 `text` 为字符串即表示选中「其他」，`undefined` 表示未选；单选选中「其他」时 `optionIds` 为空。

## 受控与数据流
- **数据进、动作出。** 组件不请求、不轮询；按钮只发出意图，`accepted / rejected / unknown` 由宿主更新 view-model 决定。
- **ApprovalPanel**：`actionId` = `React.useId` 前缀 + 计数；同一次挂载内唯一，两张卡片不冲突。双击在同一帧内被 ref 锁拦截；处理函数返回 Promise 时按钮显示忙碌；返回 `accepted` / `unknown` / `void` 后保持锁定直到 view-model（operationId / revision / status）变化；`rejected` 或抛错立即解锁。
- **unknown**：原按钮变为「重试提交」，以**同一** handler、scope 与 `actionId` 重发；`receipt.retryable === false` 时不提供重试。
- **QuestionnaireCard**：`answers` 由宿主持久化；组件保留本地镜像保证输入流畅。只有 `revision` 变新（或问卷 id 变化）才用 props 覆盖镜像，旧 revision（`isStaleRevision`）被忽略，晚到快照不回滚草稿。unknown 时「重试提交相同答案」复用上次答案与 `actionId`；重新挂载后用 `receipt.actionId`。

## 可访问性
- ApprovalPanel 为 `<section aria-labelledby>`，标题含工具名与原因；状态 = 字形 + 文字；风险徽标带文字。「允许」禁用原因是可见文字并经 `aria-describedby` 关联（不只放在 title）。拒绝始终可用（提交中除外），从不依赖材料。隐藏的 `role=status` 随卡片挂载，播报提交中 / 待确认 / 回执。
- 新审批**不抢焦点**；`autoFocus` 只在挂载时聚焦标题（`tabIndex=-1`）。
- 内部 diff：`<figure>` 以路径命名；每行符号 `+` / `−` 为文字，另有隐藏的「新增 / 删除」，不只靠颜色；长行在帧内横向滚动（可聚焦滚动区）。
- 依据为 `<dl>`；code / json 为 `<pre>`（可聚焦滚动），路径为等宽 `<code>`。
- QuestionnaireCard 为 `<form aria-labelledby>`；单选 `radiogroup`、多选 checkbox 组，题目为 legend；分页点 `aria-current="step"`、名称「第 n 题，已回答 / 未回答 / 已跳过」。未答确认是 `role=alert`，出现时焦点移到「返回填写」。草稿状态在 `role=status` 中。字数按码点计（`codePointLength`）。
- ErrorRecoveryNotice：仅危险类（`tool-side-effects`）且 `announce` 时 `role=alert`，角色落在消息上，按钮不在宣告内。从历史恢复的提示传 `announce={false}`。
- InterventionDock：有内容时才是带名称的 `region`；从不移动焦点。

## 键盘
| 范围 | 按键 | 行为 |
| --- | --- | --- |
| 问卷 | `1`…`n` | 选择第 n 个选项（单选替换、多选切换）；文本框内不触发 |
| 问卷 | `n+1` | 切换「其他」并聚焦其文本框 |
| 问卷 | `Enter` | 下一题；最后一题提交（文本框与按钮内不触发） |
| 问卷 | `←` / `→` | 翻页（文本框内不触发）；单选组内 `↑` / `↓` 仍按 radio 模式移动 |
| 问卷 | `Ctrl` / `⌘` + `Enter` | 任意位置提交 |
| 问卷 | 翻页后 | 焦点移到新页第一个控件（已选单选优先） |
| 全部 | IME 合成中 | `isComposing` / `keyCode 229` 时快捷键全部忽略 |
| 审批 | `Tab` | 主体 → 依据折叠 → 拒绝 → 本次会话信任 → 允许一次 |

## 状态矩阵
| ApprovalPanel `status` | 显示 | 允许 | 拒绝 |
| --- | --- | --- | --- |
| `waiting` | 材料 + 依据 | `availability.allowed` 时可用，否则禁用 + 原因 | 可用 |
| `material-loading` | 「正在读取完整审批内容…」+ Skeleton（`aria-busy`） | 禁用 + 原因 | 可用 |
| `unavailable` | 「完整审批内容暂不可用」+「重新读取审批内容」 | 禁用 + 原因 | 可用 |
| `submitting` | 按钮忙碌 | 禁用 | 禁用 |
| `unknown` | 「结果待确认」警示 + 「重试提交」（同一 actionId） | 由重试替代（若上次为允许） | 可用（若上次为允许） |
| `approved` / `rejected` | 静态回执（可带 `<time>`） | — | — |
| `expired` | 「授权已过期」+ 可选「刷新审批状态」 | — | — |

| QuestionnaireCard `status` | 行为 |
| --- | --- |
| `waiting` / `drafting` / `saving` | 可编辑；草稿行显示 saving / saved / error（+ 重试保存） |
| `submit-pending` | `aria-busy`，控件禁用，提交忙碌 |
| `unknown` | 「提交结果待确认」+「重试提交相同答案」 |
| `completed` / `expired` / `interrupted` | 只读摘要：「已跳过」/「未回答」/「未回答（已中断）」+ 可选「复制回答」 |

| ErrorRecoveryNotice `kind` | 色调 | 固定后果说明 |
| --- | --- | --- |
| `retryable` / `offline` | info | — |
| `save-pending` | warning | 重试保存不会再次调用模型 |
| `cancel-unconfirmed` | warning | 停止尚未确认，工具可能仍在运行 |
| `tool-side-effects` | danger（`role=alert`） | 工具可能已产生外部影响，不会自动重放 |
| `timeout` | warning | — |
| `unknown` | warning | 结果尚未确认，请先核对状态 |
| `resolved` | success（可关闭） | — |

## Motion
| 部位 | 所有者 | 预设 / token | 减动 |
| --- | --- | --- | --- |
| 卡片入场（Dock 内新卡片） | motion/react `AgentEntrance kind="card"`：opacity + y 8px + scale .985 | `panel`；挂载时冻结，不重放 | 无位移缩放 |
| Dock 展开 | CSS `grid-template-rows 0fr → 1fr` | `--rl-motion-base` | token 归零，即时 |
| 问卷翻页 | motion/react `x` ±12px + opacity（单轴，按方向） | `fast` | 即时切换 |
| 审批依据折叠 | Collapsible 高度（disclosure.css） | `base` | 即时 |
| 分页点、颜色 | CSS 颜色过渡 | `--rl-motion-fast` | 即时 |

无 `@keyframes`、无循环、无闪烁；状态文字与按钮可用性先于动画更新。

## 减动
系统设置与 `RhineProvider motion="reduce"` 都生效：motion/react 经 `useRhineMotion().resolve` 去掉位移，CSS 时长 token 归零。减动下不隐藏任何信息。

## 测试
- 单测：`packages/agent/test/intervention-approval.test.tsx`（21）、`intervention-questionnaire.test.tsx`（23）、`intervention-recovery.test.tsx`（15）——全部状态、能力门禁、双击、Promise 忙碌、unknown 同 actionId 重试、revision 防回退、IME、键盘、减动、多实例 id、英文文案。
- 浏览器：`apps/docs/e2e/agent-intervention.spec.ts`（Chromium）——允许禁用 / 拒绝可用、提交 → 未知 → 重试 → 已允许、数字键 / Enter / ←→ / aria-current、未答确认、danger `role=alert`、Dock、明暗 axe、320px 无横向溢出。
- 未做：Firefox / WebKit、读屏人工走查、5 宽度截图基线。
