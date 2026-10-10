# 组件平台长期规划

## 1. 组件分层

WzRhineLab-UI 使用六层结构：

| 层级 | 责任 | 当前状态 |
| --- | --- | --- |
| Primitives | 语义元素、尺寸、视觉表面、辅助技术工具 | 基本完成 |
| Fields | Field 语义、表单控件、错误和提交 | M7 已完成首批 |
| Navigation / Overlay | Tabs、Menu、Popover、Dialog、Toast、路径 | 基础已完成，Breadcrumb 待做 |
| Data | Table、Pagination、Progress、Meter、Stat | DataTable 已有，M8 补齐 |
| Rhine Patterns | 归档、实验、Agent、证据和指标场景 | 首批已完成，M13 扩展 |
| Effects | 展示型视觉效果和渲染适配器 | DOM/SVG 已有，Canvas/WebGL 后置 |

### 分层规则

- Primitives 不知道业务数据；
- Fields 不知道页面布局；
- Navigation / Overlay 不拥有业务状态；
- Data 提供展示和交互契约，不绑定请求库；
- Rhine Patterns 通过 slots、children 和 render props 注入业务内容；
- Effects 不阻塞业务结果、不替代语义 DOM；
- WebGL 不得进入 @wzrhine/react 依赖链。

## 2. 当前组件矩阵

### 已完成

- Button；
- IconButton；
- Surface；
- StatusBadge；
- Text；
- Separator；
- VisuallyHidden；
- Field；
- Input；
- Textarea；
- Checkbox；
- CheckboxGroup；
- RadioGroup；
- Radio；
- Switch；
- Fieldset；
- Form；
- Tabs；
- Tooltip；
- Dialog；
- Select；
- Popover；
- Menu；
- Toast；
- RecordHeader；
- MetadataList；
- ArchiveCard；
- StatusIndicator；
- Timeline；
- DataTable。

README 当前将这些列为三十个组件和 RhineProvider。后续统计以实际导出和 API 报告为准，不以文件数量为准。

### M8 必做

| 组件 | 使用场景 | 关键验收 |
| --- | --- | --- |
| Pagination | DataTable、归档浏览 | 当前页、总页数、键盘、加载状态 |
| Breadcrumb | 记录路径、归档层级 | 当前项、链接语义、窄屏溢出 |
| Progress | 任务或实验进度 | determinate、indeterminate、语义值 |
| Meter | 范围内数值 | min、max、value、label |
| Stat | 指标摘要 | value、label、trend、status |
| DataTable loading | 请求等待 | skeleton / busy / empty 区分 |
| DataTable pagination | 大数据表 | 保留焦点、选中和排序状态 |

### M9 评估后再做

- Combobox；
- Drawer；
- Slider；
- NumberField；
- Accordion；
- Collapsible；
- CommandPalette；
- FilterBar；
- FileUpload；
- ContextMenu；
- DatePicker。

这些组件必须绑定真实场景后进入排期。DatePicker 需要单独 ADR。

### M13 领域候选

- InstrumentPanel；
- SectionIndex；
- ExperimentTimeline；
- InspectorPanel；
- EvidencePanel；
- MetricPanel；
- AgentRunCard；
- RecordDetail；
- RunComparison；
- TraceSummary。

领域模式的验收页面：

1. Archive Desk：检索、路径、记录详情、数据表；
2. Experiment Console：运行状态、指标、事件时间线；
3. Agent Console：运行记录、工具调用、错误、证据和对比。

## 3. 新组件进入标准

新组件必须同时回答以下问题：

### 场景

- 哪个真实页面需要它？
- 使用频率是否足够高？
- 是否可以由已有组件组合完成？
- 不做它会产生什么重复实现？

### API

- 哪些属性是语义状态？
- 哪些属性是视觉变体？
- 是否同时支持受控和非受控？
- 是否支持原生 DOM props？
- 是否需要 ref？
- 是否需要 slots、children 或 render props？
- 是否会泄漏 Base UI 类型？

### 可访问性

- 名称、角色、状态是什么？
- Tab、Enter、Escape、方向键如何工作？
- focus-visible 是否清晰？
- disabled、loading、invalid 如何被读屏感知？
- 200% 缩放是否仍可用？
- forced colors 如何降级？

### 动效

- 动效表达什么？
- 哪个属性由 CSS 或 Motion 负责？
- 能否中断？
- 页面隐藏时是否暂停？
- reduced motion 的静态结果是什么？
- 动效是否会延迟业务状态？

### 数据和响应式

- 空、加载、错误、成功状态是什么？
- 中文长文本和英文长词如何处理？
- 320px 和 1920px 是否都合理？
- 宿主页面的全局样式是否会破坏它？
- 是否有 SSR hydration 风险？

### 测试

- 单测；
- 三内核 E2E；
- axe；
- 视觉基线；
- 键盘；
- 手动屏幕阅读器；
- 真实设备；
- 反向测试：删除关键语义或样式时测试是否能失败。

## 4. API 规则

### 语义状态与视觉变体分开

推荐：

~~~tsx
<StatusBadge status="warning" variant="subtle" />
~~~

不推荐：

~~~tsx
<StatusBadge variant="yellow" />
~~~

### 受控和非受控一致

~~~tsx
<Select
  value={value}
  defaultValue={defaultValue}
  onValueChange={setValue}
/>
~~~

复杂组件不能一个使用 value，一个使用 selected，一个使用 activeItem，除非 ADR 说明原因。

### 尽量减少布尔属性

如果一组布尔属性实际上描述状态，应改为枚举：

~~~tsx
<Panel status="idle | running | success | error" />
~~~

### 原生能力优先

如果原生 HTML 已经提供语义和键盘行为，优先包裹原生元素，不要为了统一外观重新实现。

### 容器和布局组件谨慎增加

Stack、Cluster、Container、Grid 等布局组件只有在真实项目中出现重复模式后再增加。不要为了完整而复制整个 styled-system。

## 5. 组件文档模板

每个组件文档需要包括：

1. 用途；
2. 非用途；
3. 安装和导入；
4. API；
5. 受控 / 非受控；
6. 状态矩阵；
7. 键盘行为；
8. 屏幕阅读器语义；
9. 主题和密度；
10. Motion 时序；
11. reduced-motion；
12. 响应式和长文本；
13. 正例；
14. 反例；
15. 测试清单；
16. 变更记录；
17. 相关 ADR；
18. 已知限制。

## 6. 组件优先级评分

每个候选组件用 0–2 分评估：

| 维度 | 0 分 | 1 分 | 2 分 |
| --- | --- | --- | --- |
| 真实场景 | 没有 | 仅概念 | 已有至少两个页面 |
| 复用价值 | 页面特例 | 少量复用 | 多页面复用 |
| 可访问性价值 | 没有新增 | 可以包裹原生 | 复杂行为需要共享 |
| API 稳定性 | 尚不清楚 | 可实验 | 已有明确契约 |
| 实现成本 | 高且依赖未定 | 中等 | 可复用现有基座 |
| 测试可行性 | 难以稳定验证 | 可做视觉验证 | 可做行为和语义验证 |

总分 9 分以上进入近期排期；6–8 分进入候选；5 分以下保留在概念或领域层。

