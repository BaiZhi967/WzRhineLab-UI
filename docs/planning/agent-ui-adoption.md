# Agent UI 接入指南

> 本指南面向 Wpi-Agent 和后续使用 WzRhineLab-UI 的 Agent 应用。M12 起 `@wzrhine/agent-core`（契约与纯函数）与 `@wzrhine/agent`（组件）已在工作区实现并有测试（[ADR-0010](../development/adr/0010-m12-agent-ui-plan.md)、[ADR-0011](../development/adr/0011-agent-contracts.md)），尚未发布到 npm。下文 §4 是真实 API；可运行的完整接入见示例 [`examples/agent-console`](../../examples/agent-console) 与 Showcase `/#/agent`。

## 1. 接入模型

一个 Agent 应用分为三层：

~~~text
Application runtime
  Agent SDK / HTTP / SSE / WebSocket / Tauri / storage
        ↓
Consumer adapter
  DTO mapping / recovery / dedupe / permissions / actions
        ↓
@wzrhine/agent
  view-model rendering / focus / keyboard / motion / a11y
~~~

@wzrhine/agent 不应该知道应用是 Web、Tauri、移动端还是 SSR。宿主通过 props、callbacks、slots 和 renderers 提供运行时能力。

## 2. 最小接入步骤

### 步骤一：建立 adapter

先把运行时数据转换为公共 view-model：

- conversation；
- messages；
- run；
- tools；
- approval；
- questionnaire；
- artifacts；
- capabilities；
- sync status。

不要把原始 SDK 对象直接传给组件。原始对象通常含有请求方法、缓存引用、循环结构或后端特有状态。

### 步骤二：建立 actions

将发送、停止、重试、批准、拒绝、回答、选择会话和加载历史转换成 actions：

- 每个异步动作拥有 actionId；
- 需要事实校验的动作拥有 baseRevision；
- 结果区分 accepted、rejected 和 unknown；
- unknown 保留原动作身份；
- 组件不自行重试一个已经未知的动作。

### 步骤三：提供 renderer

通过 renderer 或 slot 注入：

- Markdown；
- 代码高亮；
- Diff；
- 图片；
- 文件打开；
- Artifact；
- 终端输出；
- 自定义消息 part。

这样不同 Agent 应用可以使用不同的 Markdown、代码和文件系统实现，而公共消息结构保持一致。

### 步骤四：接入 Rhine Provider

应用根节点需要提供 Rhine 主题和动效上下文。portal 内容、Dialog、Popover、Toast 和 Agent 面板都必须位于正确的 theme scope 内。

桌面应用可以在 Provider 外层放置 Tauri 标题栏；标题栏自身不进入 @wzrhine/agent。

## 3. Wpi-Agent 的迁移映射

| Wpi 当前能力 | WzRhine 组件（已实现） | Wpi 保留内容 |
| --- | --- | --- |
| agent.tsx 布局 / workbench | `AgentShell`、`AgentHeader`、`AgentSidePane`、`ResizeHandle` | Tauri 窗口、路由、面板宽度持久化、icon rail |
| 会话索引 | `ConversationList`、`ConversationRow` | 会话查询、排序、未读集合、空会话回收、搜索防抖 |
| agent-messages | `MessageList`、`AgentMessage`、`MessagePart`、`JumpToLatest`、`RunDetails`、`SkillUseList` | 查询、排序、事件恢复；Markdown / 高亮通过 `renderers` 注入 |
| agent-process / 思考 | `AgentProcess`、`ThinkingBlock`、`RunStatus`、`AgentSpark` | run 事件到 `RunView` 的映射 |
| agent-tools / tool-preview / edit-preview | `ToolActivity`、`ToolRecord`、`CodeModeToolTree`、`ToolOutput`、`ToolHistory`、`DiffPreview`、`ChunkPager`、11 类工具专项详情 | 工具 DTO、分页、MCP 事实、材料读取 |
| composer-input / tokens / mention / slash | `Composer`、`ComposerInput`、`MentionMenu`、`SlashCommandMenu`、`AttachmentList`、`SendStopButton` | IME 之外的业务：文件查询、技能来源、草稿持久化、发送请求 |
| model-picker / permissions | `ModelPicker`、`PermissionPicker`、`GrantList` | 模型配置、权限策略、授权事实 |
| agent-permissions（审批浮层） | `ApprovalPanel`、`InterventionDock` | canonical record、材料核验（结果写入 `availability`） |
| agent-questions / use-questionnaire | `QuestionnaireCard` | 问卷持久化、revision 对账、提交请求、flush 时机 |
| 终端 / 子任务 / 摘要 / 上下文 | `PersistentTerminal`、`TerminalList`、`SubAgentList`、`PinnedSummary`、`ContextUsage`、`CompactionNotice`、`RunSummary`、`ActivityLedger` | 轮询与 watch、终端控制、整理请求 |
| file-preview / artifacts | `FilePreview`、`FilePreviewTabs`、`ArtifactCard` / `ArtifactList` | 文件读取、Tauri 打开方式探测、权限与缓存 |
| agent-motion / lib/motion | Agent 动效层（`AgentEntrance`、`useAgentLoop`、ADR-0012） | 应用状态编排 |
| 标题栏 / 关闭保护 / 设置中心 | 不迁移（应用职责） | 全部保留在 Wpi |

迁移时不复制整个 Wpi 文件。每个组件先提取 view-model、actions、capability 和 renderer，再改用 `@wzrhine/agent` 的视图。

### 状态名映射（Wpi DTO → ADR-0011）
公共契约统一使用 kebab-case；adapter 只映射一次：

| Wpi / 运行时 | `RunStatus` | `RunPhase` |
| --- | --- | --- |
| `starting` | `queued` | `preparing` |
| `running` + phase `thinking` / `responding` / `executing_tool` | `running` | `thinking` / `responding` / `executing-tool` |
| `running` + phase `waiting_user` / `waiting_approval` / `waiting_children` | `waiting` | `waiting-user` / `waiting-approval` / `waiting-children` |
| phase `queued_resume` / `waiting_resource` / `waiting_model` | `queued` / `running` | `queued` / `waiting-resource` / `waiting-model` |
| phase `compacting` / `saving` / `cancelling` | `running` / `running` / `cancelling` | 同名 kebab-case |
| `completed` / `cancelled` / `failed` / `interrupted` | 同名 | — |

工具：`waiting_approval` → `waiting-approval`，`approved` → `running`（审批通过、尚未结束），未当前待决的 `waiting_approval` → `cancelled` 并在 `summary` 写「未执行」。`result_info.status === 'unknown'` → `ToolStatus 'unknown'`，`partial` → `'partial'`。

## 4. 接入示例（真实 API）

~~~tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/agent/styles.css';
import { RhineProvider } from '@wzrhine/react';
import { AgentShell, AgentHeader, ConversationList, MessageList, AgentMessage, ToolRecord, Composer, ApprovalPanel, InterventionDock } from '@wzrhine/agent';

<RhineProvider theme="light">
  <AgentShell
    index={<ConversationList sections={sections} selectedId={id} onSelect={adapter.select} />}
    header={<AgentHeader title={conversation.title} runStatus={run.status} runPhase={run.phase} syncStatus={run.syncStatus} />}
    conversation={
      <MessageList
        messages={messages}
        isStreaming={run.status === 'running'}
        renderMessage={(m) => <AgentMessage message={m} renderTool={(t) => <ToolRecord tool={t} />} renderers={{ markdown: renderMarkdown }} />}
      />
    }
    composer={
      <Composer
        onSubmit={adapter.send}
        onStop={adapter.stop}
        runStatus={run.status}
        submitStatus={receipt.send}
        intervention={approval && (
          <InterventionDock>
            <ApprovalPanel approval={approval} onApprove={adapter.approve} onReject={adapter.reject} />
          </InterventionDock>
        )}
      />
    }
  />
</RhineProvider>
~~~

组件不读取 Query cache，也不需要知道 `adapter.send` 是 HTTP、SSE、Rust command 还是本地 mock。去重与 revision 守卫用 agent-core 的 `mergeById` / `isStaleRevision`，所有消费者规则一致。

## 5. Web、Tauri 和 SSR 的差异

### Web

- 应用提供网络同步和文件上传；
- 文件打开、下载和权限由 Web adapter 实现；
- portal 和 SSR hydration 需要验证；
- 不把 window API 直接写入公共组件。

### Tauri

- Tauri adapter 提供文件读取、文件打开、终端、窗口和系统通知；
- WindowHost、Titlebar、CloseGuard 留在应用；
- Agent UI 只接收文件和 action 结果；
- 不让公共包直接调用 Tauri。

### SSR

- 初始快照必须可序列化；
- 浏览器专属 API 延迟到 effect 或宿主 adapter；
- reduced-motion 和 hydration 不产生不一致；
- streaming 更新由客户端 adapter 接续；
- Portal 容器由 RhineProvider 负责。

## 6. 多 Agent 应用共用规则

多个应用可以拥有不同的：

- 后端协议；
- 模型供应商；
- 工具集合；
- 权限政策；
- 文件系统；
- Markdown 渲染器；
- 主题扩展；
- 路由和窗口壳层。

但应共享：

- Message view-model；
- Tool view-model；
- Approval 状态表达；
- Questionnaire 行为；
- Composer 基础语义；
- focus 和 keyboard；
- reduced-motion；
- Agent 动效节奏；
- loading、empty、error 和 unknown 状态。

## 7. 真实需求插入

当消费项目需要 @wzrhine/agent 当前没有的组件时，遵循需求插入流程：

1. 说明项目、页面和真实用户操作；
2. 说明当前替代实现和阻塞点；
3. 分开本次必须支持与明确延后；
4. 判断它属于公共 Agent 组件、WzRhine 基础组件、消费项目组合还是效果适配器；
5. 确认 API、状态、键盘、焦点、动效和 renderer；
6. 记录组件库和消费项目两层验收；
7. 记录主线暂停点、恢复点和路线回填位置。

一个真实消费项目就足以提出插入需求。第二个消费者用于验证公共性，不是组件进入规划的前提。

## 8. 接入验收清单

### 包层

- 导入路径和类型可用；
- 样式和主题 scope 正确；
- 不重复安装 React 或 Motion；
- 构建和 tree-shaking 正常；
- 没有引入应用专属 SDK；
- SSR 或目标桌面环境行为正常。

### 组件层

- 静态 fixture 可渲染；
- 受控和非受控行为清晰；
- default、loading、empty、error、unknown、disabled 有定义；
- keyboard、focus、ARIA 和 axe 有证据；
- reduced-motion 有证据；
- 长内容和窄屏有证据；
- 动效可以中断和停止。

### 真实应用层

- 真实消息能流式显示；
- 断线重放不重复；
- 用户阅读历史时不会被新内容抢走；
- 中文 IME 不误提交；
- 工具输出过大时仍可用；
- 审批材料缺失时不能误批准；
- 未知回执不会产生重复 action；
- 问卷关闭前保存并能恢复；
- 文件、Artifact 和 renderer 失败时有 fallback；
- 页面路由、窗口壳和宿主样式不破坏组件。

## 9. 已知限制

第一版（M12）不承诺：

- 内置某个 Agent SDK；
- 内置统一数据缓存；
- 内置完整 PTY 终端；
- 内置所有 Markdown 和代码语言；
- 内置文件系统；
- 内置权限决策；
- 内置虚拟化实现；
- 内置 Canvas/WebGL；
- 统一模型供应商能力；
- 统一消息协议。

这些能力可以通过 adapter、renderer、独立子包或消费项目组合逐步增加。

