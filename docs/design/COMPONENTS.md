# COMPONENTS · 组件设计与 API 规范（v0.2）

> 状态：v0.2（2026-10-11，按 M10 合入后的 `packages/react/src/index.ts` 核对）。Draft 0.1（2026-10-09）只有层级规划，没有实现。

## 层级
`@wzrhine/react` 现有 42 个组件（不计子部件、RhineProvider 与 Motion 工具）。名称与 `index.ts` 的导出一致；完整签名见自动生成的 [API 参考](../api/react.md)。

1. **Primitives**：Button、IconButton、Text、Surface、Separator、VisuallyHidden。文档：[IconButton · Text](../components/icon-button-text.md)、[Separator · VisuallyHidden](../components/forms.md)；Button、Surface 只有 [API 参考](../api/react.md)。
2. **Fields**：Field、Input、Textarea、Checkbox、CheckboxGroup、RadioGroup / Radio、Switch、Fieldset、Form。文档：[Field & Input](../components/field.md)、[Choice controls · Textarea · Fieldset · Form](../components/forms.md)。
3. **Navigation / Overlay**：Tabs（TabList / Tab / TabPanel）、Breadcrumb、Pagination（另有 `paginate`、`getPaginationItems`）、Tooltip、Dialog / DialogClose、AlertDialog、Drawer / DrawerClose、Select、Popover / PopoverClose、Menu（MenuItem / MenuCheckboxItem / MenuRadioGroup / MenuRadioItem / MenuGroup / MenuSeparator）、Toast（ToastProvider / ToastViewport / `useToast`）。文档：[Tabs · Tooltip · Dialog · Select](../components/overlays.md)、[AlertDialog](../components/alert-dialog.md)、[Drawer](../components/drawer.md)、[Popover · Menu · Toast](../components/popover-menu-toast.md)、[Breadcrumb · Pagination](../components/data-navigation.md)。
4. **Data**：DataTable、MetadataList、Timeline、StatusBadge、StatusIndicator、Progress、Meter（另有 `getMeterState`）、Stat。文档：[Archive patterns](../components/archive.md)、[Data & navigation](../components/data-navigation.md)；StatusBadge 只有 [API 参考](../api/react.md)。
5. **Feedback**：Alert、Callout、EmptyState、Skeleton、Spinner。文档：[Alert · Callout · EmptyState · Skeleton · Spinner](../components/feedback.md)。
6. **Rhine Patterns（原创科研/档案语法）**：RecordHeader、ArchiveCard（`motion="identity"` 与 ArchiveIdentity）。文档：[Archive patterns](../components/archive.md)。InstrumentPanel、SectionIndex、ExperimentTimeline **未实现**，是 M13 Rhine domain patterns 的候选（[长期路线图](../planning/roadmap.md)）。
7. **Provider 与 Motion**：RhineProvider、`usePortalContainer`；预设 `duration` / `ease` / `transition` / `pressScale` / `fadePresence`；`useRhineMotion`、`resolveMotion`、MotionSpeed / `useMotionSpeed`、MotionPresence、RhineMotionGroup / RhineMotionItem、`useMotionLifecycle`、`useLatestGuard`、`usePageVisible`、`useInViewport`。文档：[RhineProvider](../components/overlays.md)、[MOTION.md](MOTION.md)、[MOTION-PATTERNS.md](MOTION-PATTERNS.md)、[ADR-0007](../development/adr/0007-motion-ownership.md)。
8. **Optional showcase（`@wzrhine/effects`，ADR-0004）**：ArchiveReveal、ScanSurface、OrbitalDiagram、MotionPlayer、EffectClock。文档：[Showcase effects](../components/effects.md)。不得让普通组件依赖 WebGL。

**未实现、已排期**：Combobox / Autocomplete、Slider、NumberField、Accordion / Collapsible、CommandPalette、FilterBar、FileUpload、DatePicker 属于 M12 Advanced interaction；InspectorPanel、EvidencePanel、AgentRunCard 等领域组件属于 M13。顺序与进入条件见 [长期路线图](../planning/roadmap.md)。

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
