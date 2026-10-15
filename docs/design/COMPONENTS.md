# COMPONENTS · 组件设计与 API 规范（v0.2）

> 状态：v0.4（2026-10-15，按 0.3.0 的 `packages/react/src/index.ts`、`packages/patterns/src/index.ts` 与 `packages/agent/src/index.ts` 核对）。Draft 0.1（2026-10-09）只有层级规划，没有实现。

## 计数口径
API report 是导出符号的机器生成真值；本目录是按设计族整理的人工目录。当前数字如下：

| 包 | API report 总导出 | API report 组件导出 | 本目录的主组件族 |
| --- | ---: | ---: | ---: |
| `@wzrhine/react` | 294 | 83 | 52 |
| `@wzrhine/patterns` | 32 | 9 | 8（页面模式，见第 11 层） |
| `@wzrhine/effects` | 48 | 8 | 6 个视觉效果 + 2 个展示／计时工具 |
| `@wzrhine/agent-core` | 138 | — | —（框架无关契约与纯函数） |
| `@wzrhine/agent` | 400 | 87 | 46 个概念图册条目对应的实际实现族 |

因此，`@wzrhine/react` 的 52 是不计子部件、`RhineProvider` 与 Motion 工具的主组件族数量；API report 的 83 是所有公开组件导出符号，二者不再混称。`@wzrhine/patterns` 的 9 个组件导出含 `PatternsMessagesProvider`，主组件族为 8 个。Agent 组件在独立包 `@wzrhine/agent`（见第 10 层）；完整签名见自动生成的 [API 参考](../api/react.md) 与 [Agent API 参考](../api/agent.md)。

## 层级
第 1–7 层与第 9 层是 `@wzrhine/react` 的 52 个主组件族（M12 新增 10 个高级交互组件）；第 8、10、11 层分别在独立包 `@wzrhine/effects`、`@wzrhine/agent`(+`agent-core`)、`@wzrhine/patterns`。名称与各包 `index.ts` 的导出一致。

1. **Primitives**：Button、IconButton、Text、Surface、Separator、VisuallyHidden。文档：[IconButton · Text](../components/icon-button-text.md)、[Separator · VisuallyHidden](../components/forms.md)；Button、Surface 只有 [API 参考](../api/react.md)。
2. **Fields**：Field、Input、Textarea、Checkbox、CheckboxGroup、RadioGroup / Radio、Switch、Fieldset、Form。文档：[Field & Input](../components/field.md)、[Choice controls · Textarea · Fieldset · Form](../components/forms.md)。
3. **Navigation / Overlay**：Tabs（TabList / Tab / TabPanel）、Breadcrumb、Pagination（另有 `paginate`、`getPaginationItems`）、Tooltip、Dialog / DialogClose、AlertDialog、Drawer / DrawerClose、Select、Popover / PopoverClose、Menu（MenuItem / MenuCheckboxItem / MenuRadioGroup / MenuRadioItem / MenuGroup / MenuSeparator）、Toast（ToastProvider / ToastViewport / `useToast`）。文档：[Tabs · Tooltip · Dialog · Select](../components/overlays.md)、[AlertDialog](../components/alert-dialog.md)、[Drawer](../components/drawer.md)、[Popover · Menu · Toast](../components/popover-menu-toast.md)、[Breadcrumb · Pagination](../components/data-navigation.md)。
4. **Data**：DataTable、MetadataList、Timeline、StatusBadge、StatusIndicator、Progress、Meter（另有 `getMeterState`）、Stat。文档：[Archive patterns](../components/archive.md)、[Data & navigation](../components/data-navigation.md)；StatusBadge 只有 [API 参考](../api/react.md)。
5. **Feedback**：Alert、Callout、EmptyState、Skeleton、Spinner。文档：[Alert · Callout · EmptyState · Skeleton · Spinner](../components/feedback.md)。
6. **Rhine Patterns（原创科研/档案语法）**：RecordHeader、ArchiveCard（`motion="identity"` 与 ArchiveIdentity）。文档：[Archive patterns](../components/archive.md)。SectionIndex 已在 0.3.0 实现于 `@wzrhine/patterns`（见第 11 层）。InstrumentPanel、ExperimentTimeline **未实现**，仍是 Rhine domain patterns 的候选（[总路线](../roadmap/README.md)）。
7. **Provider 与 Motion**：RhineProvider、`usePortalContainer`；预设 `duration` / `ease` / `transition` / `pressScale` / `fadePresence`；`useRhineMotion`、`resolveMotion`、MotionSpeed / `useMotionSpeed`、MotionPresence、RhineMotionGroup / RhineMotionItem、`useMotionLifecycle`、`useLatestGuard`、`usePageVisible`、`useInViewport`。文档：[RhineProvider](../components/overlays.md)、[MOTION.md](MOTION.md)、[MOTION-PATTERNS.md](MOTION-PATTERNS.md)、[ADR-0007](../development/adr/0007-motion-ownership.md)。
8. **Optional showcase（`@wzrhine/effects`，ADR-0004／ADR-0015）**：视觉效果 ArchiveReveal、ScanSurface、OrbitalDiagram、CalibrationReticle、SignalPath、AnnotationTrace；工具 MotionPlayer、EffectClock。共享能力包括 useElementAnchors、createEffectPath、effectAnchorPoint、toEffectPoint、useEffectProgress。后三个视觉效果及共享底座为 MFX-01 开发线增量，已实现、尚未发布。文档：[Showcase effects](../components/effects.md)、[效果底座与扩展](../components/effect-foundations.md)。不得让普通组件依赖 WebGL。

9. **Advanced interaction（M12，[ADR-0010](../development/adr/0010-m12-agent-ui-plan.md)）**：Collapsible、Accordion / AccordionItem、Slider、NumberField、ContextMenu、Combobox、CommandPalette、FileDropZone、SplitButton、ScrollArea。文档：[Advanced interaction](../components/advanced.md)、[Combobox · CommandPalette · FileDropZone](../components/command.md)。
10. **Agent UI（独立包 `@wzrhine/agent` + `@wzrhine/agent-core`，M12；`@wzrhine/agent` API report 有 84 个组件导出）**：工作台（AgentShell、AgentHeader、ConversationList、AgentSidePane…）、消息与过程（MessageList、AgentMessage、MessagePart、ThinkingBlock、AgentProcess、RunStatus…）、工具（ToolActivity、ToolRecord、CodeModeToolTree、DiffPreview、11 类工具专项详情…）、Composer（Composer、MentionMenu、SlashCommandMenu、ModelPicker、PermissionPicker…）、人工干预（ApprovalPanel、QuestionnaireCard、ErrorRecoveryNotice、GrantList）、工作区与产物（PersistentTerminal、SubAgentCard、ContextUsage、ArtifactCard、FilePreview…）。文档：[Shell](../components/agent-shell.md)、[Message](../components/agent-message.md)、[Tools](../components/agent-tools.md)、[Composer](../components/agent-composer.md)、[Intervention](../components/agent-intervention.md)、[Workspace](../components/agent-workspace.md)；契约 [ADR-0011](../development/adr/0011-agent-contracts.md)，动效 [ADR-0012](../development/adr/0012-agent-motion.md)。
11. **页面模式（独立包 `@wzrhine/patterns`，0.3.0，[ADR-0014](../development/adr/0014-patterns-package-and-p030-scope.md)；API report 有 9 个组件导出，主组件族 8 个）**：布局（ListDetail、InspectorPanel）、集合（QueryToolbar、AppliedFilters、ViewSwitcher、SelectionToolbar、ResourceGrid）、记录（SectionIndex），外加独立文案表 Provider（PatternsMessagesProvider）。这一层是**应用级模式**，不是新的交互底座：它用第 1–5 层的组件组合页面骨架，查询、筛选、选择与详情状态全部由调用者持有，宽窄形态按自身容器可用空间解析（不读全局窗口宽度）。记录详情页按 ADR-0014 §2 以 recipe 形态交付，不做成组件。文档：[页面模式](../components/patterns.md)；受控合同见 [0.3.0 公共合同](../roadmap/0.3.0-contracts.md)。

**未实现、已排期**：FilterBar、DatePicker（等 locale / 时区策略）仍属 M12 余项；EvidencePanel 等非 Agent 领域组件待后续阶段立项。顺序与进入条件见 [总路线](../roadmap/README.md)。

## 命名与 API
使用 PascalCase 组件名、camelCase 属性；导出所有公开 Props 类型。状态语义要与外观分离，例如 `variant="primary"` 描述按钮视觉，`status="warning"` 描述业务状态。支持原生 DOM Props、`ref`、`className`、`data-slot`（必要时）。优先 CSS tokens 而不是用海量布尔属性改变视觉。受控/非受控 API 必须有一致 `value/defaultValue/onValueChange` 模式。

### 标准 Button 合约
```tsx
<Button variant="primary" size="md" loading={saving} onClick={save}>
  保存记录
</Button>
```
要求 type=button 默认防止表单误提交；loading 时阻止重复提交、保留可读名称；icon-only 必须提供可访问名称；disabled 必须禁用交互；按压动效不应影响布局或点击命中。

### 标准档案卡
```tsx
<ArchiveCard id="ARC-1024" title="分子结构观测" category="实验记录"
  status={{ tone: 'info', label: '审核中' }} updatedAt="2026-10-09" onOpen={openRecord} />
```
`status` 是 `{ tone, label }`：`tone` 取 StatusBadge 的 `neutral / info / success / warning / danger`，`label` 是可见文字（状态不能只靠颜色表达）。
必须可显示真实 ID、标题、类别、状态及时间，任意缺省字段需安全隐藏。不要生成伪造时间、设备读数或随机权限信息。

## 设计状态与边界
组件需在 default/hover/focus-visible/pressed/selected/disabled/loading/invalid/empty 适用状态下逐一评审；至少覆盖窄屏长中文、英文长词、浏览器缩放 200%、高对比/减动、键盘与屏幕阅读器基本语义。图标文字组合必须中心对齐，按钮不因 loading 内容变更大幅抖动。

## 技术边界
复杂交互（Dialog/Select/Menu/Popover/Tabs）优先使用成熟 headless 原语。[ADR-0001](../development/adr/0001-headless-primitives.md) 已选定 Base UI（`@base-ui/react`，2026-10-10 升级到 1.9.0），不与 React Aria Components 或 Radix 混用。底座不是视觉框架，所有 UI 风格仍来自项目 tokens。Motion 作为可选行为层，基础组件没有 JS 动画时仍可用。

## 组件文档模板
每个组件文档必须具备：用途 / 非用途 / API / 受控行为 / 可访问性 / 键盘 / 状态矩阵 / Motion 时序 / reduce 方案 / 主题与密度 / 用例与反例 / 测试清单 / 变更记录。

## API 稳定政策
`0.x` 允许破坏性改动但必须在 changelog 说明；M5 才冻结稳定导出。禁止为迁就单个设计稿引入不可组合的布局 API。复杂高阶组件应将业务数据映射交给使用者（render props/slots/children），避免与具体后端数据模型耦合。
