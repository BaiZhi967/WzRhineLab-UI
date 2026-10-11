# Agent UI 平台长期规划

## 1. 决策摘要

WzRhineLab-UI 将 Agent UI 作为正式的可复用产品线，规划一个独立的 workspace 包：

~~~text
@wzrhine/tokens
        ↓
@wzrhine/react
        ↓
@wzrhine/agent
        ↓
Wpi-Agent / 其他 Agent 应用
~~~

> **状态（M12）**：已实现。实际拆为 `@wzrhine/agent-core`（框架无关契约与纯函数）+ `@wzrhine/agent`（React 组件、文案、动效），偏离本文 §3.1「只增加一个包」的理由见 [ADR-0010 §3](../development/adr/0010-m12-agent-ui-plan.md)；契约以 [ADR-0011](../development/adr/0011-agent-contracts.md) 为准，动效以 [ADR-0012](../development/adr/0012-agent-motion.md) 为准，验收见 [M12 验收记录](../development/acceptance/2026-10-11-m12.md)。§10 完成定义中「至少一套真实 Wpi 消费页面」仍未满足。本文其余内容保留为原始规划。

配套的视觉/接口提案见 [Agent 组件概念图册](../concepts/agent/README.md)（46 个组件的概念图、逐项规格初稿与语义线框源页）；图册为设计参考，不构成本文件的规范依据。

这个决定基于 Wpi-Agent 的真实结构。Wpi 已经具有会话、消息、Composer、工具记录、权限、问卷、文件预览、运行摘要和专用动效。后续目标是把这些组件的可复用视图层和交互契约沉淀到 WzRhine，而不是继续让每个 Agent 应用自行复制一套界面。

## 2. 目标和非目标

### 2.1 目标

- 让多个 Agent 应用共享同一套视觉、组件、动效和可访问性行为；
- 提供受控快照加 actions 的应用无关 API；
- 让不同 Agent 运行时可以通过 adapter 接入，不要求采用同一个 SDK、协议或后端；
- 覆盖文本消息、工具调用、审批、问卷、文件、Artifact、终端输出和运行摘要；
- 保留流式内容、断线恢复、异步回执、未知状态和重试所需要的表达能力；
- 把 Wpi-Agent 当前已经验证过的 IME、焦点、revision、材料核验和滚动行为写成公共契约；
- 使 Agent 专用动效使用 Rhine tokens 和 motion/react，并支持中断、减动和页面不可见暂停；
- 让 Wpi-Agent 成为第一个真实消费者，同时用独立 fixture 验证公共 API 不依赖 Wpi DTO。

### 2.2 非目标

- 不把 Agent Client、TanStack Query、Tauri、MCP SDK、PI SDK、LangGraph 或具体后端协议放入公共包；
- 不把网络连接、轮询、SSE、WebSocket、缓存和持久化隐藏在公共组件内部；
- 不把真实权限策略、审批材料真实性和文件系统能力移入公共包；
- 不把完整终端模拟器、模型服务或凭证管理放进公共包；
- 不把 WebGL、Canvas、Lottie、Rive 或 GSAP 加入 @wzrhine/agent 的基础依赖链；
- 不为了覆盖所有 Agent 产品而一次性制作不可验证的超级组件；
- 不因为出现一个 Agent 组件就修改 Base UI 1.9.0 的底座决策。

## 3. 包边界和依赖方向

### 3.1 推荐包结构

第一版只增加一个包，不提前拆出 agent-core、agent-motion、agent-runtime 等多个包：

~~~text
packages/
  tokens/
  react/
  agent/
  effects/
~~~

推荐包名：

~~~text
@wzrhine/agent
~~~

包内可以使用目录和子路径区分组件族：

~~~text
packages/agent/
  src/
    index.ts
    contracts/
    components/
      shell/
      conversation/
      message/
      composer/
      execution/
      approval/
      questionnaire/
      artifact/
      workspace/
    motion/
    renderers/
    styles/
  test/
  package.json
  README.md
~~~

只有当包体积、依赖隔离、版本发布或 tree-shaking 出现真实问题时，才评估拆分子包。

### 3.2 依赖规则

~~~text
@wzrhine/tokens
    ↓
@wzrhine/react
    ↓
@wzrhine/agent

@wzrhine/effects
    └─ 可选，不是 @wzrhine/agent 的默认依赖
~~~

@wzrhine/agent 可以依赖：

- React；
- @wzrhine/react；
- @wzrhine/tokens；
- motion/react；
- 为语法高亮、Markdown 或代码渲染提供的 peer 或 renderer slot。

@wzrhine/agent 默认不能依赖：

- @whitezhi/agent-client；
- TanStack Query；
- TanStack Router；
- Tauri；
- Rust bridge；
- MCP client；
- 某个 Agent SDK；
- 具体的 Markdown 数据结构；
- 具体的文件协议；
- 具体的鉴权和权限服务。

### 3.3 Wpi-Agent 的职责

Wpi-Agent 负责把应用事实转换为 Agent UI view-model：

1. 读取或订阅运行时事件；
2. 对事件进行 revision 校验、去重、排序和恢复；
3. 维护 Query cache、持久化和事实状态；
4. 将不同后端状态映射为公共语义状态；
5. 将公共 actions 转换为真实请求；
6. 处理未知回执、重试、对账和权限真实性；
7. 把 Tauri、文件系统和终端能力作为 renderer 或 action 提供给组件。

公共组件只消费稳定快照并发出 actions，不直接发起事实请求。

## 4. Agent UI 分层

### 4.1 Shell 层

提供 Agent 页面可以组合的区域结构：

- AgentShell；
- AgentHeader；
- AgentSidebar；
- AgentContent；
- AgentContextPanel；
- AgentDetailsPanel；
- AgentEmptyState；
- AgentErrorState；
- AgentLoadingState。

Shell 只负责区域、尺寸、插槽、焦点和响应式布局。真实路由、导航项目、窗口标题栏和桌面按钮由消费项目传入。

### 4.2 Conversation 层

- ConversationList；
- ConversationGroup；
- ConversationItem；
- ConversationSearch；
- ConversationSelection；
- ConversationLoading；
- ConversationEmpty。

会话组件需要支持当前选中项、未读状态、运行状态、错误标记、重命名入口、删除入口和 capability-driven actions，但不能自行读取会话列表。

### 4.3 Message 层

- MessageList；
- Message；
- MessageHeader；
- MessageContent；
- MessagePart；
- MessageActions；
- StreamingText；
- MessageStatus；
- JumpToLatest；
- MessageLoadMore；
- MessageError。

MessagePart 需要允许 text、markdown、tool-call、tool-result、attachment、citation、artifact、status 和自定义类型。未知 part 必须有可见 fallback 或 renderer 处理，不能静默丢失。

### 4.4 Composer 层

- Composer；
- ComposerInput；
- ComposerToolbar；
- MentionPicker；
- CommandPicker；
- ModelPicker；
- AttachmentList；
- FileReferenceList；
- SendStopButton。

Composer 需要保留输入法组合、光标、选区、Token Mirror、mention、slash command、自适应高度、草稿、附件和停止操作。普通 Textarea 只能作为内部基础控件，不能替代 Composer 的行为契约。

### 4.5 Execution 层

- RunStatus；
- RunPhase；
- ToolActivity；
- ToolGroup；
- ToolCall；
- ToolInput；
- ToolOutput；
- ProcessOutput；
- ActivityFeed；
- RunProgress；
- RunSummary。

Execution 组件只展示执行快照、状态和操作入口。具体工具名称、工具参数真实性和执行请求由应用 adapter 控制。

### 4.6 Approval 和 Questionnaire 层

- ApprovalPanel；
- ApprovalCard；
- PermissionSummary；
- PermissionSelector；
- ApprovalEvidence；
- ApprovalStatus；
- Questionnaire；
- QuestionCard；
- QuestionnaireProgress；
- QuestionnaireRecovery。

审批和问卷是 Agent UI 的核心交互，不作为普通 Dialog 的几个业务按钮处理。它们需要自己的状态矩阵、回执和恢复契约。

### 4.7 Artifact 和上下文层

- ArtifactList；
- ArtifactCard；
- ArtifactPreview；
- Citation；
- SourceList；
- FileReference；
- FilePreview；
- CodePreview；
- DiffPreview；
- TerminalOutput；
- ContextUsage；
- ContextSummary。

渲染内容通过 renderer 或 slots 注入。包本身不负责读取文件、请求来源或创建终端。

### 4.8 Workspace Pattern 层

- AgentWorkspace；
- AgentSidePanel；
- AgentInspector；
- AgentRunHistory；
- SubagentActivity；
- TaskList；
- TraceSummary。

这些是 Agent 领域组合，不属于基础 @wzrhine/react。它们仍然必须保持 DTO 无关，通过 view-model、slots 和 callbacks 接入。

## 5. 状态和事件模型

### 5.1 三个状态轴

公共组件不能使用一个 status 字段同时表达运行、连接和用户动作。至少拆成：

| 状态轴 | 示例 |
| --- | --- |
| runStatus | idle、queued、running、waiting、completed、failed、cancelled |
| syncStatus | live、reconnecting、stale、unknown |
| actionStatus | idle、submitting、accepted、rejected、unknown |

例如“运行正在等待、连接正在恢复、上一个用户动作回执未知”必须能够同时表达，UI 不能把它简化成失败或成功。

### 5.2 Action 契约

~~~ts
type AgentActionContext = {
  actionId: string;
  targetId: string;
  baseRevision?: string;
};

type AgentActionResult =
  | { status: "accepted"; revision?: string }
  | { status: "rejected"; reason: string }
  | { status: "unknown"; retryable: boolean };
~~~

unknown 不能被当成 rejected，也不能自动生成一份新的批准或问卷提交。应用 adapter 必须使用原 actionId、目标对象和 revision 进行查询、重试或对账。

### 5.3 Capability

组件不能假设所有运行时都支持 regenerate、edit、branch、grant、retry 或 stop。宿主通过 capability 提供：

- 是否支持；
- 是否启用；
- 禁用原因；
- action callback；
- 所需前置条件。

没有 callback 的操作不能渲染成可点击按钮。

## 6. 组件路线和依赖顺序

### 6.1 第一组：契约和最小展示骨架

- view-model 类型；
- action 类型；
- capability 类型；
- AgentShell；
- AgentHeader；
- ConversationList；
- Message；
- MessageList；
- 基础 Composer；
- RunStatus；
- 基础空、加载、错误状态。

出口条件：

- 可以用静态 fixture 渲染完整 Agent 页面；
- 不依赖 Wpi DTO；
- 受控选择、发送和停止 callback 可验证；
- keyboard、focus、reduced-motion 有明确契约。

### 6.2 第二组：消息流和 Composer

- multipart message；
- streaming part；
- MessageActions；
- JumpToLatest；
- 自动滚动策略；
- 中文 IME；
- mention 和 command picker；
- 草稿；
- 附件与文件引用。

出口条件：

- 重复事件不会重复显示；
- 旧 revision 不会覆盖新快照；
- 用户向上阅读时新内容不会抢滚动；
- 输入法状态下不会误提交；
- Picker 关闭后光标位置可以恢复。

### 6.3 第三组：工具和过程反馈

- ToolCall；
- ToolGroup；
- ToolOutput；
- ProcessOutput；
- ActivityFeed；
- RunSummary；
- ContextUsage；
- 错误、截断和权限不足状态。

出口条件：

- 大输出不会强制渲染全部内容；
- 工具详情展开不会丢失焦点；
- 终端输出与普通文本输出区分；
- 状态更新不依赖某个 Agent SDK。

### 6.4 第四组：审批和问卷

- ApprovalPanel；
- ApprovalEvidence；
- PermissionSelector；
- Questionnaire；
- QuestionnaireRecovery。

出口条件：

- 材料不完整时批准按钮正确禁用；
- 缺少批准条件时仍能拒绝；
- pending、submitting、unknown、acknowledged 可区分；
- uncertain 提交不会生成第二个 action；
- 关闭页面前能够 flush 草稿。

### 6.5 第五组：Artifact、文件和代码

- ArtifactCard；
- ArtifactPreview；
- Citation；
- SourceList；
- FilePreview；
- CodePreview；
- DiffPreview；
- TerminalOutput。

出口条件：

- renderer 可替换；
- 未知类型有 fallback；
- 大文件支持摘要、分页或懒加载；
- 文件读取不进入公共包；
- 错误和过期状态可表达。

### 6.6 第六组：工作区和多 Agent

- AgentWorkspace；
- AgentSidePanel；
- AgentInspector；
- TaskList；
- SubagentActivity；
- TraceSummary；
- RunComparison。

出口条件：

- 同一个页面允许多个 Agent 实例而不串状态；
- portal、scroll、draft 和 DOM id 按实例隔离；
- 多 Agent 父子关系通过数据传入；
- 不把 Wpi Workbench 或 Tauri 标题栏硬编码进公共包。

## 7. 动效归属

以下动效属于 @wzrhine/agent 的组件动效范围：

- 消息和消息 part 的进入；
- 流式内容的稳定更新；
- 工具展开和折叠；
- 审批卡片进入；
- Send / Stop 状态切换；
- Agent 状态指示；
- 会话选中身份连续；
- JumpToLatest 反馈；
- 侧栏和详情面板切换；
- AgentSpark 等运行阶段展示。

实现约束：

- 只使用 motion/react 和 Rhine tokens；
- CSS、Motion、SVG 对同一属性必须有唯一所有者；
- 动效不能延迟业务状态或屏幕阅读器状态；
- 页面不可见时暂停展示型循环；
- reduced motion 删除位移、缩放和无限循环，保留内容和语义反馈；
- 长消息列表不使用大范围 layout 动画；
- 动画可从当前状态反向和中断。

Wpi 当前的自定义 spring、WAAPI 和 AgentMotion 是迁移参考。迁移后通用动效能力归入 Wz Motion contract，Agent 特定编排归入 @wzrhine/agent 的 motion 目录。

## 8. Wpi-Agent 迁移方式

迁移不采用大规模文件搬运。每一组组件按以下步骤进行：

1. 识别当前组件使用的事实数据和业务 action；
2. 提取公开 view-model；
3. 提取 callback、capability 和 renderer；
4. 保留 Wpi controller、query、持久化和 adapter；
5. 在 @wzrhine/agent 中实现无 Wpi 依赖的视图；
6. 用 Wpi adapter 接入真实页面；
7. 完成组件库和消费项目双层验收；
8. 删除 Wpi 中重复的视觉和交互实现。

第一批适合从 Agent Header、Conversation List、Message List、Model Picker、SendStopButton 和基础 RunStatus 开始。Composer、Approval 和 Questionnaire 需要在契约明确后迁移，不能只做视觉替换。

## 9. 质量门禁

每一组 Agent 组件必须提供：

- 公开 Props 和类型；
- view-model 和 action 文档；
- 受控行为；
- default、loading、empty、error、disabled、unknown 状态；
- 键盘和焦点路径；
- axe 检查；
- Chromium、Firefox、WebKit 行为检查；
- reduced-motion 检查；
- 320、390、768、1280、1920 宽度检查；
- 长中文、英文长词和大内容检查；
- 消费项目 fixture；
- 包构建和 tree-shaking 检查；
- 已知限制和后续增强列表。

Agent 特有的人工验收还包括：

- 中文 IME；
- 屏幕阅读器对流式状态的合理播报；
- 工具输出中断；
- 审批未知回执；
- 问卷草稿恢复；
- 断线重放和 revision 对账；
- 同页多实例隔离。

## 10. 完成定义

@wzrhine/agent 只有在以下条件同时满足时才能被描述为可用：

1. 公开契约稳定并有文档；
2. 至少一套静态 fixture 和一套真实 Wpi 消费页面；
3. 组件库行为测试和消费项目验收都通过；
4. 没有反向依赖 Wpi、Tauri 或具体 Agent SDK；
5. 动效、reduced-motion、focus 和异步状态有验证；
6. 所有未支持能力都写入限制；
7. 路线回填和验收记录已更新。

添加组件文件、完成静态展示或接入一个 mock 数据页面，都不能单独视为 Agent UI 平台完成。

