# ADR-0013 · 开放分类法：展示性枚举开放，状态机枚举封闭

- 状态：**Accepted** · 关联里程碑：M13（WPI UI）
- 范围：`@wzrhine/agent-core` 契约与 `@wzrhine/agent` / `@wzrhine/react` 组件中所有「取值集合」的开放与封闭规则；自定义值的标签、图标、兜底展示
- 不在范围：状态机值（`RunStatus` / `ToolStatus` / `SyncStatus` 等）的增删——它们仍由 ADR-0011 §3 封闭定义；运行时适配层如何把厂商枚举映射进来

## 背景

ADR-0011 把 Agent UI 的视图模型定为「可序列化快照」，其中一批字段是封闭字符串联合：`ModelEffort`（6 档思考强度）、`AttachmentView.kind`、`ReferenceView.kind`、`CitationView.sourceType`、`ArtifactKind`、`ToolCategory`、`RecoveryView.kind`、`QuestionKind`。组件内部用 `Record<联合类型, 图标/文案>` 做映射，文案表同样以封闭联合为键。

这套设计在「库里自带的场景」下是自洽的，但宿主接入真实 agent 时一定会带来库之外的取值：厂商特有的思考档位（`adaptive`、`minimal`、数值级）、自定义附件类型（音频、看板）、自定义引用来源、内部工具类别、宿主特有错误类型……封闭联合把这些全部挡在类型层之外，宿主只能 `as any` 或滥用 `unknown` / `other` / `custom`，丢失区分度的同时也丢掉了可访问文案。

M13 实践（SkillPicker 用 `tone="invalid"`、ZCode 侧思考强度档位超出内置 6 档）证明这不是假设性需求。本 ADR 定一条统一规则，并把已封闭的字段逐一放开。

## 决策

### 1. 区分两类枚举：展示性开放，状态机封闭

- **状态机枚举保持封闭**：`RunStatus` / `RunPhase` / `ToolStatus` / `SyncStatus` / `ActionStatus` / `DraftStatus` / `ApprovalStatus` / `QuestionnaireStatus` / `MessageStatus` 及各 `status` 字段。组件行为（可否停止、动效相位、aria 语义、回执对账）依赖这些值的完备性，宿主不得扩展；适配层在边界完成映射。
- **展示性分类（taxonomy）开放**：`ModelEffort`、`ModelCapability`、`AttachmentKind`、`ReferenceKind`、`CitationSourceType`、`ArtifactKind`、`ToolCategory`、`RecoveryKind`、`QuestionKind`。这些值只驱动标签、图标与色调，不驱动行为。

### 2. 开放模式：已知键联合 + `(string & {})`，兜底永不空白

- 契约保留「已知值」联合类型并导出（`KnownModelEffort`、`AttachmentKind`、`ReferenceKind`、`CitationSourceType`、`ArtifactKind`、`ToolCategory`、`RecoveryKind`、`QuestionKind`、`ModelCapability`），视图模型字段写为 `Known | (string & {})`：内置值保留字面量补全，任意字符串在类型层合法。
- 组件内的 `Record<Known, …>` 图标/色调映射保留，作为**兜底表**：未知取值一律回落（附件→`file` 图标、引用→`custom` 图标、引用来源→`other` 图标、产物→`file`、工具类别→`other` 的图标与 tone、恢复类型→`unknown` 的 warning 呈现）。标签回落为原始 id 文本——永远不渲染空白，也绝不把自定义类别误标成「其他」。
- `data-kind` / `data-category` / `data-source` 等 DOM 属性照常输出自定义值，宿主可用 `[data-kind="…"]` 自行加样式。

### 3. 图标逃生口：children 覆盖

`AgentIcon`、`StatusGlyph`（`@wzrhine/agent`）与 `Icon`（`@wzrhine/react`）的 `name` 放开为 `内置名 | (string & {})`，新增 `children`：传入时作为 SVG 内容渲染，覆盖内置路径；自定义 name 必须搭配 children（否则渲染空 SVG）。图标不进视图模型——契约仍是纯数据，自定义图标经由组件属性（如 `CitationChip` 的 `icon`）或直接渲染图元组件注入。

### 4. 结构性扩展走渲染逃生口

`QuestionKind` 开放后，自定义题型不再复用选择题控件：QuestionnaireCard 新增 `renderQuestion({ question, answer, editable, update, defaultBody })`，对每个问题调用，返回非空即替换内置题目体（返回 `defaultBody` 即保留默认）。未提供渲染器时自定义题型回落为自由文本回答。`answerState` / `normalizeAnswers`（`isChoiceQuestion` / `isKnownQuestionKind` 判定）把自定义题型的答案视为渲染器私有：`optionIds` 不按内置选项过滤、原样提交，任何非空 `optionIds` / `text` 均计为已回答。

消息部件的 `custom` part + `renderers.custom` 注册表（ADR-0010 §4）是本模式的既有实例，不变。

### 5. 标签解析优先级与文案表放宽

- 文案表中所有分类标签 Record 改为 `Record<已知联合, string> & Partial<Record<string, string>>`：内置键必填（保住 zh / en 两表完整性检查），自定义键允许添加。
- `AgentMessagesOverrides` 与 `WorkspaceMessagesProp` 的合并改为：值为纯字符串记录的条目**按键合并**（其余条目照旧整体替换）。宿主新增一个自定义标签不再需要复制整表。既有整表覆盖（如传 `agentEnUS`）行为不变。
- 标签解析统一遵循 ADR-0009 优先级：**组件属性 > 视图模型自带 > 最近 Provider 文案表 > 原始 id**。ModelPicker 的思考强度为例：`effortLabels` prop > `ModelEffortOption.label` > `composer.effort` 文案表 > id 原文。`ModelOptionView.efforts` 相应扩展为 `(ModelEffort | ModelEffortOption)[]`，选项可自带 `label` / `description`。

## 后果

- 新增公开 API（全部向后兼容的可选新增）：`KnownModelEffort`、`ModelEffortOption`、`ModelCapability`、`AttachmentKind`、`ReferenceKind`、`CitationSourceType`、`RecoveryKind` 类型导出；`ModelPickerProps.effortLabels`、`CitationChipProps.icon`、`QuestionnaireCardProps.renderQuestion` 与 `QuestionRenderContext`；`normalizeEfforts`、`isChoiceQuestion`、`isKnownQuestionKind` 辅助函数；`AgentIcon` / `StatusGlyph` / `Icon` 的 `children`。
- 默认渲染结果对内置取值逐像素不变（既有测试与视觉基线保证）；自定义取值只有在宿主传入时才出现。
- `mergeAgentMessages` / `useWorkspaceMessages` 对纯字符串记录条目改为按键合并：对既有的「整表覆盖」调用方结果相同；此前没有调用方依赖「传部分记录即丢弃其余键」（类型上也不可能传入部分记录）。
- 新组件检查项增加一条：新增展示性枚举必须遵守本 ADR（开放联合 + 兜底 + 文案表已知键必填）；新增状态枚举必须保持封闭并在 ADR-0011 §3 语义下评审。

## 验证方法

单测：`packages/agent/test/open-taxonomies.test.tsx`（自定义思考档位的三种标签来源与回落、自定义 capability 原文展示、自定义引用来源/产物类别/工具类别/恢复类型的图标与文案兜底、`CitationChip` 图标覆盖、图元 children 覆盖、自定义题型的答案语义 / 文本回落 / `renderQuestion` 替换与包裹）、`packages/react/test/icon.test.tsx`（自定义图标）；既有全部单测与类型检查（含 vitest typecheck）保证零回归；`pnpm build` 与 `pnpm api:check` 通过。无默认视觉变化，不更新视觉基线。
