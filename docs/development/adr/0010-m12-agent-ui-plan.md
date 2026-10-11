# ADR-0010 · M12 高级交互与 Agent UI 包：范围、拆包与顺序

- 状态：**Accepted** · 关联里程碑：M12 Advanced interaction + Agent UI 平台（原 M13 的 Agent 部分提前）
- 决策人：维护者（2026-10-11 要求「跳过 M11，开始规划 M12 和 agent UI 包；可以对 agent 包更细致地拆分；依赖后续路线的内容可以提前开发」）
- 关联：[Agent UI 平台规划](../../planning/agent-ui-platform-plan.md)、[Agent UI 公共契约](../../planning/agent-ui-contracts.md)、[Agent 组件概念图册](../../concepts/agent/README.md)、ADR-0011（Agent 契约）、ADR-0012（Agent 动效）

## 背景
- M11 Rendering Lab（Canvas 实验）对 Agent UI 没有阻塞，维护者决定跳过、保留为 Planned。
- `agent-ui-platform-plan.md` 原计划「第一版只增加一个包」，并把 Agent UI 放在 M13。维护者明确授权更细的拆分，并要求一次构建完整的 Agent 组件族。
- 参考实现 Wpi-Agent（`packages/agent-ui`）已经验证了 IME、token 镜像、审批证据门禁、问卷 revision、滚动跟随等行为，但它绑定 TanStack Query、Radix、lucide、react-markdown 与 Tauri，视觉也不是 Rhine 语言。**只参考行为与覆盖面，不搬运代码与视觉。**
- 概念图册（46 个组件）只是提案：色值、尺寸、时长一律回到 tokens；snake/kebab 不一致等问题在 ADR-0011 统一。

## 决策

### 1. 里程碑合并
M12 = 「高级交互基础组件（`@wzrhine/react`）」+「Agent UI 平台（新包）」。Agent UI 依赖的高级交互组件在同一里程碑交付，避免先做一半 Agent 再回头补控件。原 M13 只保留非 Agent 的 Rhine 领域模式（InstrumentPanel、EvidencePanel…）。

### 2. `@wzrhine/react` 新增（高级交互）
| 组件 | 底座 | Agent 用途 |
| --- | --- | --- |
| Collapsible | Base UI `collapsible` | 工具详情、思考块、审批详情、摘要分区（高度过渡唯一实现） |
| Accordion | Base UI `accordion` | 侧栏分区、设置分组 |
| Slider | Base UI `slider` | 模型执行强度（离散档位） |
| NumberField | Base UI `number-field` | 并发上限等数值参数 |
| ContextMenu | Base UI `context-menu` | 会话行右键菜单 |
| Combobox | Base UI `combobox` | 可搜索选择（模型、文件路径） |
| CommandPalette | Base UI `dialog` + `combobox` 列表模式 | 全局命令 |
| FileDropZone | 原生 `<input type=file>` + drop 事件 | 附件拖放 |

FilterBar、DatePicker 维持 Planned（无 Agent 需求；DatePicker 仍等 locale / 时区策略）。

### 3. Agent 拆包（偏离原规划「只增加一个包」）
```text
@wzrhine/tokens
      ↓
@wzrhine/react ─────────────┐
      ↓                     │
@wzrhine/agent  ←── @wzrhine/agent-core（无 React、无 DOM、无依赖）
```
- **`@wzrhine/agent-core`**：view-model 类型、三个状态轴、状态元数据（字形 + 色调，不含文案）、纯函数（去重 / revision 守卫 / 树 / diff / composer token / 格式化）。理由：adapter 运行在 Node、Worker、Rust bridge 的 TS 侧或服务端，需要契约与去重逻辑，但不能引入 React。这是「依赖隔离出现真实问题」——规划中允许拆分的条件。
- **`@wzrhine/agent`**：React 组件、文案表、动效、样式。peer：`@wzrhine/react`、react、react-dom、motion；依赖：`@wzrhine/agent-core`、`@wzrhine/tokens`、`@base-ui/react`（同一精确版本，经子路径）。
- `@wzrhine/agent` 重新导出 agent-core 的全部公开项，普通使用者只装一个入口。
- 不再细拆 agent-motion / agent-tools 等子包：tree-shaking 已由逐文件 ESM 保证，`size:check` 会度量「只导入 AgentShell」与「全部」的比例。

### 4. 依赖边界（boundary 测试强制）
`@wzrhine/agent` 不得依赖：TanStack、Tauri、MCP SDK、任何 Agent SDK、请求库、Markdown / 高亮库、图标库、Radix / React Aria。Markdown、代码高亮、Diff 着色、文件打开都通过 renderer 注入；包内只提供**安全的纯文本兜底**（不解析 HTML、不加载远程图片）。

### 5. 组件族与顺序（并行开发、统一验收）
1. 契约与基座（agent-core、文案表、状态字形、AgentSpark、动效层）——先行，已完成；
2. Shell & Conversation：AgentShell、AgentHeader、ConversationList、ConversationRow、AgentSidePane、ResizeHandle；
3. Message & Process：MessageList、AgentMessage、MessagePart、ThinkingBlock、AgentProcess、RunStatus、JumpToLatest、CitationChip、MessageActions；
4. Tools：ToolActivity、ToolRecord、CodeModeToolTree、ToolOutput、ToolHistory、十个工具专项详情、DiffPreview；
5. Composer：Composer、ComposerInput（token 镜像）、MentionMenu、SlashCommandMenu、AttachmentList、SendStopButton、ModelPicker、PermissionPicker；
6. Intervention：ApprovalPanel、QuestionnaireCard、ErrorRecoveryNotice；
7. Workspace & Artifact：PersistentTerminal、TerminalRow、SubAgentCard、ContextUsage、PinnedSummary、ArtifactCard、FilePreview、ActivityLedger、RunSummary。

### 6. 门禁
沿用 M7–M10：单测、类型反向测试、三内核 E2E、axe、视觉基线、减动扫描、5 宽度截图、组件文档、API 报告、size 预算、`release:check`。新增：
- agent boundary 测试（依赖、CSS token、CJK、`'use client'`、减动）；
- 同页两个 AgentShell 实例不串状态（DOM id、滚动、草稿）；
- 中文 IME 合成期间 Enter 不发送（自动化模拟 `compositionstart` / `isComposing`；真实输入法人工验收单列）。

## 代价
- 多一个包要维护版本、changelog、API 报告与 license 审计；
- 一次交付面很大，验收以「每个组件都有测试 + 页面 + 文档」为最低线，人工读屏与真实 IME 仍需维护者验收；
- Wpi-Agent 的真实接入（消费项目验收）不在本仓库内完成，M12 只交付静态 fixture、交互示例与接入指南；ADR 规定的「真实消费页面」门禁留待 Wpi 侧接入后关闭。

## 验证方法
见 M12 验收记录：每条门禁对应真实执行的命令与结果；未执行的检查写「未做」。
