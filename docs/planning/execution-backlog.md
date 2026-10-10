# 后续执行清单

本文件是规划目录中的执行入口。它把长期路线压缩成可提交、可验证的小任务。完成一项后，应把对应验收证据链接回这里，并在必要时更新路线图。

## 当前基线

- 主分支：main；
- Base UI：1.9.0；
- 当前里程碑：M7 Forms 已完成；
- 下一里程碑：M8 Data & Navigation；
- 发布状态：暂不发布；
- React 18：未正式验证；
- 自动 CI：暂不创建；
- 遗留人工验收：读屏、200% 缩放、真机。

## M8-1：设计和行为契约

- [ ] 阅读并确认 DataTable 当前分页、排序、选择和 loading API。
- [ ] 写 M8 Data & Navigation ADR 或补充现有组件规划。
- [ ] 确认 Pagination 的受控 / 非受控 API。
- [ ] 确认 Breadcrumb 是否复用 RecordHeader trail。
- [ ] 确认 Progress 与 Meter 的语义边界。
- [ ] 确认 Stat 是否属于基础 Data 组件还是 Rhine pattern。
- [ ] 为每个 M8 组件写状态矩阵。
- [ ] 为每个 M8 组件写键盘和读屏契约。
- [ ] 为每个 M8 组件写 Motion / reduced-motion 方案。
- [ ] 为 DataTable 千行场景准备确定性数据 fixture。
- [ ] 写 M8 验收记录模板。

## M8-2：实现

- [ ] 实现 Pagination。
- [ ] 为 Pagination 增加单测和类型反向测试。
- [ ] 实现 Breadcrumb。
- [ ] 为 Breadcrumb 增加窄屏和长文本测试。
- [ ] 实现 Progress。
- [ ] 实现 Meter。
- [ ] 实现 Stat。
- [ ] 为 DataTable 增加 loading、empty、error 状态。
- [ ] 为 DataTable 增加分页适配。
- [ ] 将 pagination 接入 archive-desk。
- [ ] 将 breadcrumb 接入 archive-desk。
- [ ] 将 progress / stat 接入一个真实示例场景。
- [ ] 更新组件文档和 docs 导航。
- [ ] 更新 API report。
- [ ] 运行单测、typecheck、build。
- [ ] 运行 Chromium / Firefox / WebKit E2E。
- [ ] 运行 axe。
- [ ] 运行视觉回归。
- [ ] 记录人工键盘验收。

## M8-3：验收

- [ ] 执行 pnpm check。
- [ ] 执行 pnpm test:e2e:all。
- [ ] 执行 pnpm test:examples:all。
- [ ] 执行 pnpm test:visual。
- [ ] 执行 pnpm api:check。
- [ ] 记录 320 / 390 / 768 / 1280 / 1920 截图。
- [ ] 记录长中文和英文长词结果。
- [ ] 记录 1000 行表格性能观察。
- [ ] 保留 Firefox 失败时的 trace 和 test-results。
- [ ] 完成 M8 acceptance 文档。
- [ ] 更新 docs/ROADMAP.md。
- [ ] 创建 M8 合并 PR。

## M9：生态工程化

- [ ] 写 React 18 / React 19 支持策略 ADR。
- [ ] 写 locale 和默认文案策略 ADR。
- [ ] 增加 App Router / use client 示例。
- [ ] 增加 SSR hydration 回归。
- [ ] 统计 tokens、react、effects 包体基线。
- [ ] 设计 bundle budget 配置。
- [ ] 让 release:check 在预算超标时失败。
- [ ] 增加文档搜索索引。
- [ ] 完成 packages 的安装和 export 文档。
- [ ] 更新 upgrade guide。
- [ ] 更新 package changelog。
- [ ] 决定 npm scope，但暂不发布。
- [ ] 补齐第三方许可证来源。
- [ ] 完成 M9 acceptance。

## M10：Motion Core 2.0

- [ ] 建立 motion pattern 目录。
- [ ] 写 motion ownership ADR。
- [ ] 统一 CSS / Motion / SVG 的属性边界。
- [ ] 提炼 RhineMotionGroup。
- [ ] 提炼 MotionPresence。
- [ ] 统一 page visibility pause。
- [ ] 增加 start / pause / resume / stop 生命周期。
- [ ] 为 Dialog、Popover、Toast、Tabs 增加 interrupt 测试。
- [ ] 为 ArchiveCard 增加 shared identity 验证。
- [ ] 为 text reveal 提供语义 fallback。
- [ ] 为 effects 循环动画提供停止条件。
- [ ] 增加 Default / Slow / Reduced / Interrupt showcase。
- [ ] 重新验证 reduced motion。
- [ ] 完成 M10 acceptance。

## M11：Rendering Lab

- [ ] 建立 effects 性能 fixture。
- [ ] 实现 DOM/SVG 粒子对照。
- [ ] 实现 Canvas 粒子实验，不进入 react 包。
- [ ] 记录初始化时间、bundle、DPR 和帧率。
- [ ] 测试页面隐藏和离开视口。
- [ ] 测试 reduced motion。
- [ ] 测试 renderer failure 和 fallback。
- [ ] 评估是否需要 @wzrhine/effects/canvas。
- [ ] 只有有明确 3D 需求时才评估 @wzrhine/effects/three。
- [ ] 写 Canvas / WebGL adapter ADR。
- [ ] 完成 M11 acceptance。

## M12：高级交互

按真实需求择一排期：

- [ ] Drawer。
- [ ] Combobox / Autocomplete。
- [ ] Slider。
- [ ] NumberField。
- [ ] Accordion / Collapsible。
- [ ] CommandPalette。
- [ ] FilterBar。
- [ ] FileUpload。
- [ ] ContextMenu。
- [ ] DatePicker 专项需求和 locale ADR。

每个组件都要附：

- [ ] 真实页面；
- [ ] API 契约；
- [ ] 状态矩阵；
- [ ] 键盘；
- [ ] 读屏；
- [ ] reduced motion；
- [ ] SSR；
- [ ] 三内核；
- [ ] 视觉基线；
- [ ] 验收记录。

## M13：领域模式

- [ ] InstrumentPanel。
- [ ] SectionIndex。
- [ ] ExperimentTimeline。
- [ ] InspectorPanel。
- [ ] EvidencePanel。
- [ ] MetricPanel。
- [ ] AgentRunCard。
- [ ] RecordDetail。
- [ ] RunComparison。
- [ ] TraceSummary。

每个领域模式必须经过至少一个真实页面验证，并确保不绑定后端模型。

## Agent UI 平台：拟议 @wzrhine/agent

### 设计与契约

- [ ] 确认 @wzrhine/agent 的 package 边界和依赖方向。
- [ ] 定义 Conversation、Message、MessagePart、Run、Tool、Approval、Questionnaire、Artifact 和 Sync view-model。
- [ ] 定义 runStatus、syncStatus、actionStatus 三个状态轴。
- [ ] 定义 actionId、targetId、baseRevision 和 unknown 回执。
- [ ] 定义 capability、禁用原因和 action callback。
- [ ] 定义 renderer、slots、children 和 render props 的使用边界。
- [ ] 定义 Markdown、Code、Diff、Artifact 和 Terminal renderer 接口。
- [ ] 定义多实例、portal、DOM id、draft 和 scroll 隔离。
- [ ] 建立静态 Agent fixture，不依赖 Wpi DTO。
- [ ] 为公开类型建立 API report 和变更规则。

### 第一组：Shell、Conversation、Message

- [ ] 建立 packages/agent workspace 包骨架。
- [ ] 实现 AgentShell、AgentHeader、AgentSidebar、AgentWorkspace。
- [ ] 实现 ConversationList、ConversationItem、ConversationSearch。
- [ ] 实现 MessageList、Message、MessagePart、MessageActions。
- [ ] 实现 default、loading、empty、error、unknown 状态。
- [ ] 验证稳定 ID、revision、sequence、去重和未知 part fallback。
- [ ] 验证键盘、focus、live-region 和 reduced-motion。

### 第二组：Composer 和消息流

- [ ] 实现 Composer、ComposerInput、ComposerToolbar。
- [ ] 保留中文 IME、selection、Token Mirror 和光标恢复。
- [ ] 实现 MentionPicker、CommandPicker、AttachmentList、FileReferenceList。
- [ ] 实现 SendStopButton 和 actionStatus。
- [ ] 实现流式内容、JumpToLatest、阅读锚点和历史加载。
- [ ] 验证重复事件、旧 revision、断线重放和快速切换会话。
- [ ] 验证 compositionstart、compositionend、Enter、Backspace、Delete、粘贴和撤销。

### 第三组：工具和运行过程

- [ ] 实现 RunStatus、RunPhase、ToolActivity、ToolGroup、ToolCall。
- [ ] 实现 ToolInput、ToolOutput、ProcessOutput、ActivityFeed。
- [ ] 实现 RunSummary、ContextUsage、截断和权限不足状态。
- [ ] 支持摘要、惰性展开、分页或外部 renderer。
- [ ] 验证大输出、错误输出、未知工具和输出中断。
- [ ] 验证工具详情展开时的焦点和屏幕阅读器语义。

### 第四组：审批和问卷

- [ ] 实现 ApprovalPanel、ApprovalCard、PermissionSummary。
- [ ] 实现 ApprovalEvidence 和 approvalAvailability。
- [ ] 表现 pending、submitting、unknown、approved、rejected、expired。
- [ ] 保留缺少材料时禁用批准但允许拒绝。
- [ ] 实现 Questionnaire、QuestionCard、QuestionnaireProgress。
- [ ] 实现草稿串行保存、关闭前 flush、revision 防回退和 unknown 重试。
- [ ] 验证 actionId、operationId、canonical record 和材料 revision。

### 第五组：Artifact、文件和代码

- [ ] 实现 ArtifactList、ArtifactCard、ArtifactPreview。
- [ ] 实现 Citation、SourceList、FileReference。
- [ ] 实现 FilePreview、CodePreview、DiffPreview、TerminalOutput。
- [ ] 支持 renderer 替换、未知类型 fallback、加载、缺失、禁止和过期状态。
- [ ] 不把文件读取、下载、Tauri open 或终端连接放入公共包。
- [ ] 验证大文件和高密度输出的懒加载或摘要策略。

### 第六组：Wpi-Agent 接入

- [ ] 建立 Wpi view-model adapter，不直接传入 agent-client DTO。
- [ ] 接入 Agent Header、Conversation、Message、Composer 和 RunStatus。
- [ ] 接入 Tool、Approval、Questionnaire、Artifact 和 File renderer。
- [ ] 保留 Wpi Query、持久化、权限真实性、文件系统和 Tauri。
- [ ] 完成真实流式、断线、审批未知回执和问卷恢复验证。
- [ ] 删除已经被 @wzrhine/agent 替代的 Wpi 视觉重复实现。

### 动效和质量

- [ ] 使用 motion/react 和 Rhine tokens 建立 Agent motion patterns。
- [ ] 验证消息进入、工具展开、审批出现、Send/Stop、AgentSpark 和侧栏切换。
- [ ] 验证中断、快速反向、卸载、隐藏页和 reduced-motion。
- [ ] 验证 320 / 390 / 768 / 1280 / 1920 布局。
- [ ] 验证 Chromium / Firefox / WebKit、axe、键盘和静态 fixture。
- [ ] 完成 Wpi-Agent 消费项目验收。
- [ ] 更新 Agent UI acceptance 记录和路线回填。

## M14：人工无障碍和国际化

- [ ] NVDA 或等价读屏。
- [ ] VoiceOver 或等价读屏。
- [ ] 200% 缩放。
- [ ] 触摸设备。
- [ ] 触摸目标尺寸。
- [ ] forced colors。
- [ ] RTL。
- [ ] 英文长词。
- [ ] 中文长文本。
- [ ] locale。
- [ ] 日期和时间格式。
- [ ] 异步错误朗读。
- [ ] 更新 ACCESSIBILITY.md 和 acceptance 记录。

## M15：公开发布

- [ ] 选择根许可证。
- [ ] 核验 npm scope。
- [ ] 确认版本号。
- [ ] 确认 package public/private。
- [ ] 完成 npm pack。
- [ ] 完成临时项目安装。
- [ ] 完成 SSR 安装。
- [ ] 完成浏览器安装。
- [ ] 完成第三方许可清单。
- [ ] 完成 changelog。
- [ ] 完成升级指南。
- [ ] 完成公开文档。
- [ ] 创建 release candidate。
- [ ] 执行 release:check。
- [ ] 发布前人工复核。
- [ ] 发布后记录安装和回滚方式。

## 长期治理

- [ ] semver 和 deprecation；
- [ ] API report；
- [ ] token 变更流程；
- [ ] 兼容性矩阵；
- [ ] 性能预算；
- [ ] accessibility regression；
- [ ] 贡献者指南；
- [ ] 安全和供应链审计；
- [ ] registry；
- [ ] CLI；
- [ ] agent-readable metadata；
- [ ] 组件模板；
- [ ] 领域页面模板；
- [ ] 迁移工具。

## 每次提交前

- [ ] 阅读 AGENTS.md 和关联规范。
- [ ] 检查 git diff。
- [ ] 没有覆盖未提交修改。
- [ ] 代码、测试、文档和示例同步。
- [ ] 只使用已核验的依赖和素材。
- [ ] 真实执行检查命令。
- [ ] 汇报改动文件、检查结果、遗留风险和下一步。
- [ ] 使用中文 commit message。


