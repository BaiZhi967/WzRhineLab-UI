# WzRhineLab-UI 长期路线图

## 目标

把 WzRhineLab-UI 建设成一个可长期维护、可被真实产品采用、可公开发布的 React 科研 / 档案终端设计系统：

- 基础组件行为可靠；
- 视觉语言原创且稳定；
- 复杂控件可访问；
- 动效有语义、可中断、可减动；
- 展示效果和基础控件边界清楚；
- 包可以独立安装、tree-shake、SSR 使用和升级；
- 文档能够让新贡献者和 AI agent 按规范继续开发；
- 不因为追逐组件数量或视觉噱头而失去一致性。

这不是把项目做成 MUI 的替代品，也不是把所有动画库聚合到一个包。长期目标是让 Rhine 在“科研档案、实验监测、证据链、Agent 运行状态和高密度数据界面”这些场景中具备明确的识别度和复用价值。

## 路线总览

| 顺序 | 核心目标 | 关键结果 |
| --- | --- | --- |
| M8 | Data & Navigation | Pagination、Breadcrumb、Progress / Meter、Stat、DataTable loading / pagination |
| M9 | Ecosystem hardening | App Router / use client 产物策略、locale ADR、体积预算、文档搜索 |
| M10 | Motion Core 2.0 | 统一 motion contract、生命周期、模式目录、减动和中断测试 |
| M11 | Rendering Lab | Canvas/SVG 性能实验、渲染适配器契约、是否引入 Canvas 的证据 |
| M12 | Advanced interaction | Combobox、Drawer、Slider、Accordion、CommandPalette、FilterBar |
| M13 | Rhine domain patterns and Agent UI | InstrumentPanel、EvidencePanel、AgentRunCard、Message、Tool、Approval、Questionnaire、Artifact patterns；拟议 @wzrhine/agent |
| M14 | Accessibility & internationalization | 屏幕阅读器、200% 缩放、真机、RTL、locale、日期时间策略 |
| M15 | Public release | 许可证、npm scope、版本、changelog、公开文档和安装验证 |
| M16 | Source distribution | registry、源码模板、CLI 评估、示例生成 |
| M17 | Optional visual adapters | Canvas / WebGL / Rive / Lottie / GSAP 的独立入口 |
| M18 | Governance and sustainability | 稳定版本策略、贡献者指南、兼容性矩阵、迁移工具、性能预算治理 |

顺序只用于表达前置关系，不代表发布日期或时间承诺。任何阶段只有完成对应门禁后才能关闭。

## M8：Data & Navigation

### 目标

让当前组件库能够覆盖数据密集型归档、实验和记录页面的基本操作流。

### 主要产物

- Pagination；
- Breadcrumb；
- Progress；
- Meter；
- Stat；
- DataTable loading state；
- DataTable pagination；
- DataTable 空状态、错误状态和分页后的键盘行为；
- RecordHeader 与 Breadcrumb 的路径数据复用；
- 至少一个真实千行数据场景。

### 依赖

- M7 Form 已完成；
- DataTable 当前 API；
- RecordHeader 当前 trail 结构；
- tokens 契约保持冻结；
- Base UI 1.9.0 保持单一 headless 底座。

### 退出门禁

- DataTable 的分页不会丢失焦点或选中状态；
- 页码按钮有明确的当前页语义；
- 进度和数值状态可被读屏读取；
- 1000 行数据场景没有明显布局和交互退化；
- 320、390、768、1280、1920 宽度均有验证；
- Chromium、Firefox、WebKit E2E 通过；
- axe 通过；
- 视觉基线只包含有意的变化；
- 完成文档、示例和验收记录。

## M9：Ecosystem hardening

### 目标

让组件可以被不同 React 应用稳定消费，并为后续公开发布消除工程障碍。

### 主要产物

- App Router 与 use client 边界说明；
- SSR、hydration 和浏览器入口验证；
- 默认文案与 locale 策略 ADR；
- 包体积基线和预算；
- docs 页面搜索；
- 每个包的安装、导出、CSS 导入和升级示例；
- 体积超预算时使 release:check 失败；
- React 19 正式支持说明；
- React 18 是继续验证、暂不支持还是移除声明的决策。

### 注意

M9 不负责建立第二个 headless 组件底座，也不负责加入 Canvas 或 WebGL。它只解决“包被安装和使用时是否稳定”。

## M10：Motion Core 2.0

### 目标

把当前散落在组件和 effects 中的动效约定收敛成可以持续扩展的内部契约。

### 主要产物

- RhineMotionProvider 或等价的 motion contract；
- 语义化 preset：press、fast、panel、scene、showcase；
- MotionPresence；
- RhineMotionGroup；
- visibility pause；
- start / pause / resume / stop 生命周期；
- 快速打开、关闭、反向和目标变化的中断测试；
- Default / Slow / Reduced / Interrupt showcase；
- motion pattern 文档；
- CSS、Motion、SVG、Canvas 的属性所有权规范。

### 退出门禁

- 基础组件不直接暴露任意动画引擎配置；
- reduced motion 能够按属性类型降级；
- Dialog、Popover、Toast、Tabs、ArchiveCard 的中断行为有测试；
- 页面不可见时展示型循环停止；
- 动效不会延迟业务状态和屏幕阅读器状态；
- Motion API 和 tokens 之间有明确映射。

## M11：Rendering Lab

### 目标

用可复现的实验决定是否需要 Canvas，而不是先把 WebGL 加入依赖。

### 实验项目

- SVG 与 Canvas 粒子场对比；
- DOM/SVG 与 Canvas 热力图对比；
- CSS noise、Canvas noise 和 shader noise 对比；
- 高 DPI、移动端、低性能设备和页面隐藏状态；
- reduced motion；
- fallback；
- bundle 和初始化时间；
- 视觉回归稳定性。

### 结果可能有三种

1. DOM/SVG 已经满足需求：不引入 Canvas；
2. Canvas 适合展示效果：新增 @wzrhine/effects/canvas；
3. 只有 3D、shader 或大规模粒子才可行：新增 @wzrhine/effects/three，并保持独立 bundle。

### 关闭门禁

- 有至少一个真实使用场景；
- 有对照数据；
- 组件语义不依赖 Canvas；
- 有静态 DOM/SVG fallback；
- 有 context loss、DPR、visibility、reduced motion 处理；
- 不能影响 @wzrhine/react 安装和 bundle。

## M12：Advanced interaction

### 推荐顺序

1. Drawer；
2. Combobox / Autocomplete；
3. Slider；
4. NumberField；
5. Accordion / Collapsible；
6. CommandPalette；
7. FilterBar；
8. FileUpload；
9. Pagination 的高级变体；
10. DatePicker。

DatePicker 必须等 locale、时区、日期库、RTL 和提交格式策略确定后再做。

### Agent UI 前置关系

Agent UI 会优先消费真实场景中需要的高级交互能力：

- Combobox / Autocomplete：模型、技能、文件引用和 mention；
- Drawer：窄窗口 Agent 详情和文件预览；
- Slider / NumberField：模型执行参数；
- Accordion / Collapsible：工具详情、上下文和审批材料；
- CommandPalette：快捷命令和全局 Agent 操作；
- FileUpload：附件和拖放引用。

这些组件可以在真实 Wpi-Agent 阻塞时按需求插入流程提前交付。提前交付只关闭当前组件的最小闭环，不关闭整个 M12。

## M13：Rhine domain patterns

### 目标

让组件库在科研档案和 Agent 工作台中形成自己的价值，而不是继续堆普通控件。

### 组件候选

- InstrumentPanel；
- SectionIndex；
- ExperimentTimeline；
- InspectorPanel；
- EvidencePanel；
- MetricPanel；
- AgentRunCard；
- RecordDetail；
- ActivityFeed；
- RunComparison；
- TraceSummary。

这些组件必须使用 slots、children、render props 或 column definitions，不应该绑定某个后端 API 或数据库模型。

### Agent UI 平台

Agent 领域模式扩展为独立的 @wzrhine/agent 包，纳入以下公共组件族：

- Shell：AgentShell、AgentHeader、AgentSidebar、AgentWorkspace；
- Conversation：ConversationList、ConversationItem、ConversationSearch；
- Message：MessageList、Message、MessagePart、StreamingText、JumpToLatest；
- Composer：Composer、MentionPicker、CommandPicker、AttachmentList、SendStopButton；
- Execution：RunStatus、ToolActivity、ToolCall、ToolOutput、ProcessOutput、RunSummary；
- Approval：ApprovalPanel、PermissionSummary、ApprovalEvidence；
- Questionnaire：Questionnaire、QuestionCard、QuestionnaireRecovery；
- Artifact：ArtifactCard、ArtifactPreview、Citation、FileReference、CodePreview、DiffPreview；
- Multi-agent：TaskList、SubagentActivity、TraceSummary、RunComparison。

公共包只接收 view-model 快照并发出 actions。Wpi-Agent 和其他消费项目继续负责查询、缓存、事件恢复、权限真实性、文件系统、终端、Tauri 和运行时协议。

### M13 Agent UI 退出门禁

- 公开 view-model、actions、capability 和 renderer 契约；
- 至少有静态 fixture 和 Wpi-Agent 真实消费页面；
- 消息流能够处理稳定 ID、revision、sequence、去重和断线恢复；
- Composer 能够处理中文 IME、光标、引用和发送/停止；
- Approval 能够表现 pending、submitting、unknown、acknowledged 和材料缺失；
- Questionnaire 能够表现草稿、flush、revision 和 unknown 提交；
- 动效使用 motion/react，支持中断、页面隐藏和 reduced-motion；
- 不依赖 Wpi DTO、Tauri、Query 或具体 Agent SDK；
- 组件库和消费项目分别完成行为、a11y、视觉和构建验收。

## M14：Accessibility & internationalization

### 必须完成

- NVDA 或等价 Windows 屏幕阅读器；
- VoiceOver 或等价 macOS / iOS 屏幕阅读器；
- 200% 浏览器缩放；
- 触摸设备；
- 触摸目标尺寸；
- forced colors；
- 键盘无鼠标操作；
- RTL；
- 英文长词和中文长文本；
- locale 文案；
- 日期、时间、数字格式；
- 表单错误和异步状态朗读。

M14 之前，README 不应该声称“完整支持无障碍”和“生产就绪”。

## M15：Public release

### 先决条件

- 维护者选择许可证；
- 选择并核验 npm scope；
- 确认版本号；
- 每个包的 public/private 策略；
- 公开安装测试；
- changelog；
- migration guide；
- 第三方许可证清单；
- 源码和示例中的素材来源核验；
- 公开文档不包含未授权素材。

### 发布顺序

1. 0.x preview；
2. 内部应用试用；
3. 0.x patch 修复；
4. 0.1 或首个明确的公开版本；
5. 之后再讨论 1.0 稳定承诺。

## M16：Source distribution

参考 shadcn、Park UI 和 Animate UI 的源码分发思路，但保持 Rhine 自己的包模型。

可能的产物：

- component registry；
- source template；
- CLI；
- 领域页面模板；
- 可复制的 effects 示例；
- AI agent 生成组件所需的 metadata；
- token 和 API 约束文件。

registry 不是 M8–M15 的阻塞项。

## M17：Optional visual adapters

只有在 M11 实验证明必要后再加入：

- @wzrhine/effects/canvas；
- @wzrhine/effects/three；
- @wzrhine/rive-adapter；
- @wzrhine/lottie-adapter；
- @wzrhine/gsap-adapter。

每个适配器都必须独立安装、lazy import、提供 fallback、支持 reduced motion，并在文档中写明许可证和性能成本。

## M18：治理

长期治理包括：

- semver 和 deprecation；
- 组件弃用周期；
- API 报告；
- token 变更流程；
- 浏览器支持矩阵；
- 性能预算；
- accessibility regression；
- 贡献者指南；
- 设计决策记录；
- 安全和供应链审计；
- 迁移工具；
- examples 的版本同步。

