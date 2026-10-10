# Agent UI 公共契约

> 状态：Proposed。以下类型和名称是 @wzrhine/agent 的设计草案，尚未成为稳定导出。

## 1. 契约原则

Agent UI 接受的是“当前事实的可渲染快照”，发出的是“用户希望执行的动作”。它不拥有后端事实，也不决定一个 action 是否已经被服务端接受。

~~~text
runtime events / query
        ↓
consumer adapter
  恢复、去重、排序、校验、映射
        ↓
Agent view-model snapshot
        ↓
@wzrhine/agent
        ↓
actions / renderer callbacks
        ↓
consumer adapter
        ↓
runtime command
~~~

## 2. 基础标识

所有可能收到增量事件或异步回执的对象都必须有稳定标识：

~~~ts
type AgentIdentity = {
  conversationId: string;
  runId?: string;
  messageId?: string;
  partId?: string;
  operationId?: string;
  revision?: string;
  sequence?: number;
};
~~~

消费项目可以使用自己的字符串格式，但不能让组件依赖数组下标、时间戳或 React key 作为事实身份。

## 3. Conversation 和 Message

~~~ts
type ConversationView = {
  id: string;
  title: string;
  preview?: string;
  updatedAt?: string;
  selected?: boolean;
  unreadCount?: number;
  runStatus?: RunStatus;
  syncStatus?: SyncStatus;
  capabilities?: ConversationCapabilities;
};

type MessageView = {
  id: string;
  conversationId: string;
  runId?: string;
  role: "user" | "assistant" | "system" | "tool";
  createdAt?: string;
  updatedAt?: string;
  revision?: string;
  sequence?: number;
  parts: MessagePartView[];
  status: MessageStatus;
  actions?: MessageCapabilities;
};

type MessagePartView =
  | { type: "text"; id: string; text: string; streaming?: boolean }
  | { type: "markdown"; id: string; source: string; streaming?: boolean }
  | { type: "tool-call"; id: string; tool: ToolCallView }
  | { type: "tool-result"; id: string; output: ToolOutputView }
  | { type: "attachment"; id: string; attachment: AttachmentView }
  | { type: "citation"; id: string; citation: CitationView }
  | { type: "artifact"; id: string; artifact: ArtifactView }
  | { type: "status"; id: string; status: RunStatus }
  | { type: "custom"; id: string; renderer: string; payload: unknown };
~~~

未知 part 必须显示受控 fallback 或交给注册的 renderer。组件不能偷偷丢弃无法识别的内容。

## 4. 三个状态轴

~~~ts
type RunStatus =
  | "idle"
  | "queued"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled";

type SyncStatus =
  | "live"
  | "reconnecting"
  | "stale"
  | "unknown";

type ActionStatus =
  | "idle"
  | "submitting"
  | "accepted"
  | "rejected"
  | "unknown";
~~~

一个 view-model 可以同时具有：

~~~ts
{
  runStatus: "waiting",
  syncStatus: "reconnecting",
  actionStatus: "unknown"
}
~~~

这表示运行正在等待、连接正在恢复、上一个用户动作回执未知。UI 不能把它简化成失败或成功。

## 5. Actions 和 capability

~~~ts
type AgentActionContext = {
  actionId: string;
  targetId: string;
  baseRevision?: string;
};

type AgentActionResult =
  | { status: "accepted"; revision?: string }
  | { status: "rejected"; reason: string; code?: string }
  | { status: "unknown"; retryable: boolean; reason?: string };

type AgentCapabilities = {
  canSend?: boolean;
  canStop?: boolean;
  canRetry?: boolean;
  canEdit?: boolean;
  canRegenerate?: boolean;
  canBranch?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  disabledReasons?: Record<string, string>;
};

type AgentActions = {
  onSend?: (input: SendInput, context: AgentActionContext) => Promise<AgentActionResult> | AgentActionResult;
  onStop?: (context: AgentActionContext) => Promise<AgentActionResult> | AgentActionResult;
  onRetry?: (context: AgentActionContext) => Promise<AgentActionResult> | AgentActionResult;
  onSelectConversation?: (id: string) => void;
  onLoadMore?: (context: LoadMoreContext) => Promise<void> | void;
};
~~~

没有 callback 的 capability 不应渲染成可操作按钮。未知回执必须保留原 action identity，不能在 UI 内自动生成新的 action。

## 6. Composer 契约

Composer 的公开状态必须能够表达：

- 文本；
- composition 状态；
- selection；
- draft 保存状态；
- mention 和 command token；
- attachments；
- file references；
- send 状态；
- stop 状态；
- 失败和重试；
- 当前 capability。

~~~ts
type ComposerState = {
  value: string;
  isComposing: boolean;
  selection?: { start: number; end: number };
  draftStatus: "clean" | "dirty" | "saving" | "saved" | "error";
  submitStatus: ActionStatus;
  attachments: AttachmentView[];
  references: ReferenceView[];
};

type ComposerActions = {
  onChange?: (value: string) => void;
  onCompositionChange?: (composing: boolean) => void;
  onSubmit?: (input: SendInput) => Promise<AgentActionResult> | AgentActionResult;
  onStop?: () => Promise<AgentActionResult> | AgentActionResult;
  onAddReference?: (reference: ReferenceView) => void;
  onRemoveReference?: (id: string) => void;
};
~~~

输入法组合期间不能因为 Enter、Backspace 或 picker 操作误提交。Picker 关闭时必须支持把焦点和光标归还给原 textarea。

## 7. Tool 和输出契约

~~~ts
type ToolCallView = {
  id: string;
  name: string;
  displayName?: string;
  status: "queued" | "running" | "waiting" | "completed" | "failed" | "cancelled";
  input?: unknown;
  output?: ToolOutputView;
  startedAt?: string;
  completedAt?: string;
  canExpand?: boolean;
};

type ToolOutputView = {
  kind: "text" | "json" | "code" | "diff" | "terminal" | "artifact" | "error";
  summary?: string;
  content?: string;
  truncated?: boolean;
  loading?: boolean;
  error?: string;
  rendererKey?: string;
};
~~~

大输出必须支持摘要、截断、分页、惰性展开或外部 renderer。组件不能默认把所有输出一次性挂载到 DOM。

## 8. Approval 契约

审批视图必须能够表达事实检查后的可用性：

~~~ts
type ApprovalView = {
  operationId: string;
  revision: string;
  status: "pending" | "submitting" | "unknown" | "approved" | "rejected" | "expired";
  actionStatus: ActionStatus;
  operationKind: "read" | "write" | "execute" | "network" | "custom";
  summary: string;
  writeProposal?: WriteProposalView;
  evidence: ApprovalEvidenceView[];
  approvalAvailability: {
    allowed: boolean;
    reason?: string;
  };
  capabilities: {
    canApprove: boolean;
    canReject: boolean;
  };
};
~~~

材料不完整、revision 过期或 canonical record 缺失时，批准必须禁用，但拒绝仍然可以保留。WzRhine 负责展示这些状态；Wpi 或其他消费项目负责真实性校验。

## 9. Questionnaire 契约

~~~ts
type QuestionnaireView = {
  id: string;
  revision: string;
  currentPage: number;
  totalPages: number;
  questions: QuestionView[];
  draftStatus: "clean" | "dirty" | "saving" | "saved" | "error";
  submitStatus: ActionStatus;
  result?: "submitted" | "skipped" | "unknown";
};

type QuestionnaireActions = {
  onDraftChange?: (revision: string, answer: QuestionAnswer) => void;
  onFlush?: (revision: string) => Promise<void> | void;
  onSubmit?: (revision: string, result: QuestionResult) => Promise<AgentActionResult> | AgentActionResult;
  onRetryUnknown?: (revision: string, result: QuestionResult) => Promise<AgentActionResult> | AgentActionResult;
};
~~~

unknown 提交必须继续使用原 revision 和原 result。组件不能在网络异常时创建第二份答案。

## 10. File、Artifact 和 renderer

公共组件只接收文件或 Artifact 的描述：

~~~ts
type ArtifactView = {
  id: string;
  title: string;
  kind: "text" | "code" | "image" | "file" | "diff" | "unknown";
  mimeType?: string;
  size?: number;
  status: "available" | "loading" | "missing" | "forbidden" | "expired" | "error";
  preview?: string;
};
~~~

真实读取、下载、打开系统应用、目录权限和 Tauri API 都由 renderer 或 action 注入。

## 11. Stream、恢复和滚动

adapter 必须负责：

- 稳定 ID；
- revision 校验；
- sequence 排序；
- 重放去重；
- 缺口检测；
- 当前会话隔离；
- 断线恢复；
- 过期事件丢弃。

MessageList 负责：

- 当前阅读锚点；
- 用户位于底部时自动跟随；
- 用户向上阅读时停止抢滚动；
- JumpToLatest；
- 历史加载后的锚点恢复；
- 内容展开或媒体加载后的必要修正。

新 token 到达不应让用户正在阅读的旧消息自动跳走，也不应把焦点移动到消息区域。

## 12. 可访问性和动效

所有组件都需要：

- 语义 HTML；
- 可见 focus-visible；
- 键盘路径；
- 明确名称、角色和状态；
- loading、empty、error、unknown；
- 异步状态的合理 live-region；
- reduced-motion；
- 长文本和窄屏行为。

实时消息不能逐 token 朗读。应按消息、阶段或错误进行合并播报。

Agent 动效只能使用 motion/react 和 Rhine tokens，遵守同一元素同一属性只有一个动画所有者的规则。组件卸载、隐藏、快速反向、重复提交和 reduced-motion 都需要测试。

## 13. 契约变更规则

- Proposed 类型不直接进入稳定导出；
- 破坏性变更必须更新 adoption guide 和 migration note；
- 新增字段优先可选并提供 fallback；
- 删除字段前至少保留弃用说明；
- 改变 action 语义时必须更新消费项目 adapter；
- 任何将运行时、网络或渲染内核加入依赖的变化都需要 ADR。

