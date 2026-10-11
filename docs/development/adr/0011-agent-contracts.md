# ADR-0011 · Agent UI 契约：view-model、状态轴、action、renderer 与文案

- 状态：**Accepted** · 关联里程碑：M12 · 取代 [agent-ui-contracts.md](../../planning/agent-ui-contracts.md) 中的 Proposed 草案（该文件保留为背景）
- 实现：`packages/agent-core/src/contracts/*`、`packages/agent-core/src/helpers/*`、`packages/agent/src/provider/*`

## 1. 原则
组件接收「当前事实的可渲染快照」，发出「用户想做的动作」。不拥有后端事实，不判断动作是否被接受，不读文件、不轮询、不开进程。快照是可序列化的纯数据（SSR / RSC 可直接传递）；函数只出现在 action / renderer props 上。

## 2. 标识与快照
- 每个可增量更新的对象都有稳定 `id`；可选 `revision`（字符串，数字串按数值比较）与 `sequence`（单调序号）。
- 不以数组下标、时间戳或 React key 作为事实身份。
- 去重、排序、revision 守卫由 adapter 负责；agent-core 提供 `mergeById`（旧 revision 不回退、不产生重复 id、全部有 sequence 时按其排序）、`dedupeById`、`sequenceGaps`、`buildTree`、`isStaleRevision`，所有消费者用同一套规则。
- 未知 message part（`type: 'custom'` 未注册 renderer、或未来新增类型）显示受控 fallback：类型名 + `summary`，从不静默丢弃。

## 3. 状态轴与命名
- **命名统一为 kebab-case**（`waiting-approval`、`executing-tool`），与库内其它枚举一致；图册中的 snake_case 与 `awaiting-approval` 不再使用，adapter 一次映射。
- 轴：`RunStatus`（9：idle / queued / running / waiting / cancelling / completed / failed / cancelled / interrupted，决定可用动作）、`RunPhase`（13，只描述「在做什么」，决定文案与 AgentSpark 节奏）、`SyncStatus`（live / reconnecting / stale / offline / unknown）、`ActionStatus`（idle / submitting / accepted / rejected / unknown）、`ToolStatus`（12）、`TerminalSessionStatus`（9）、`SubagentStatus`（10）、`DraftStatus`、`Completeness`。
- 图册 RunStatus 的 12 个状态拆为 RunStatus + RunPhase：`thinking` / `responding` / `executing_tool` / `waiting_user` / `waiting_approval` / `saving` 是阶段而非生命周期；图中出现但缺失的「停止中」成为 `cancelling`。
- 每个状态 = **字形 + 文字 + 色调**（`runStatusMeta` 等表给出字形与色调，文案在文案表）。`unknown` 永远是警示色 + 菱形问号字形，不显示为成功或失败。
- 同步失败不改变运行状态；未知回执不显示成功；「发出停止」≠「已停止」（`cancelling` / `stop-pending`）。

## 4. Action 与 capability
- `AgentActionContext { actionId, targetId, baseRevision? }`；结果 `accepted | rejected | unknown(retryable)`。
- **没有 callback 的能力不渲染为按钮**；`Capability { enabled, reason }` 禁用时显示原因（可见提示 + `aria-describedby`，不只放在 title）。
- unknown 回执保留原 action 身份；组件提供「重试同一动作」入口时回传原 `actionId`，不自行生成新动作。
- 防重复：提交中（`submitting`）与未知（`unknown`）期间同一控件不可再次触发新动作。

## 5. 工具
- `ToolCallView` 为统一行；`detail` 是判别联合：`generic`、`file-read`、`file-write`、`file-edit`、`patch`、`manage-files`、`command`、`mcp`、`model`、`question`、`agent`。未知工具走 `generic`（参数 JSON + 输出）。
- 截断区分两种：`truncated: 'display'`（界面只显示片段，完整内容另有入口）与 `'execution'`（工具自身输出被截断）。两者文案不同，不得混用。
- 分页 / 下一偏移只来自真实结果（`nextOffset`），组件不推算。
- 大输出默认显示有界片段（`--rl-agent-output-max-height` 内滚动），完整内容通过 `onLoadMore` / `onOpenFull`。

## 6. 审批与问卷
- 批准需要 `availability.allowed === true`（adapter 已核验材料完整、revision 未过期）；否则「允许」禁用并显示原因，**拒绝始终可用**。按钮只发出动作，真实性校验在宿主。
- `scopes` 决定是否出现「本次会话信任」；默认只有 `once`。
- 危险操作必须写明目标、写入方式与是否可撤销（`irreversible`、`unsandboxed`）。
- 问卷只收集信息，不授予工具权限；unknown 提交保持同一 `revision` 与答案，按钮文案变为「重试提交相同答案」。

## 7. 工作区
终端：命令工具返回 ≠ 终端关闭；不可停止的终端不画停止按钮；继承终端只读。子任务：父子分别追踪，部分用量标注「部分」，不从状态推算进度百分比。上下文用量：只有 `completeness` 为 exact / estimated 且 max 可靠时才画百分比（`usagePercent` 返回 `null` 即不画）。

## 8. Composer
- 真实 `<textarea>` 拥有输入、选区、IME、撤销与无障碍；`aria-hidden` 镜像层只负责 token 着色。
- token 编码：`U+2068 + 触发符 + 名称 + U+2069`；发送时 `toPlainText` 转为 `@名称` / `/名称`；真实绑定以 `references` 为准。
- 光标吸附到 token 边界；Backspace / Delete 整体删除 token；触发符只在行首或空白后识别，代码块内不识别，`/` 只在行首（之前只有 token）识别。
- IME：`compositionstart/end` + `nativeEvent.isComposing` + `keyCode 229` 三重判断，合成期间 Enter / Tab / 方向键不交给菜单与发送。
- 菜单关闭（Esc）后记住「触发符 + query」，同一 query 不立即重开。

## 9. renderer 与 slots
- `renderers`：`markdown`、`code`、`diff`（可选）、`image`、`custom[key]`。未提供时：markdown → 纯文本段落（保留换行，不解析 HTML），code → 带语言标签与复制按钮的 `<pre>`。
- Shell 只提供区域、插槽、焦点与响应式；路由、窗口标题栏、桌面按钮由宿主放入插槽。

## 10. 文案与格式
- 与 ADR-0009 同构：组件 prop > 最近的 `AgentMessagesProvider` > `agentZhCN`。另提供 `agentEnUS`（未经母语审校）。
- 文案表按组件族拆成 `provider/messages/*.ts`，是 agent 源码中**唯一允许 CJK** 的位置（fixtures 为示例数据，同样豁免）。
- 数字、时间、日期使用最近 `RhineProvider` 的 `locale`（`useAgentFormat`）；数值缩写 `12.4K`、时长 `12.4s` / `3m 05s`、字节 1024 进制。

## 11. Fixture
`packages/agent/src/fixtures/session.ts`：一个确定性的会话快照，供测试、Showcase 与示例共用；所有数值为示例数据，界面上标注「示例」。不从包入口导出。

## 后果
- adapter 要做一次状态名映射（snake → kebab）与 DTO → view-model 转换；Wpi 侧的映射写在接入指南里。
- 新增工具专项只需扩展 `ToolDetailView` 联合（可选字段优先，删除字段先弃用）。
