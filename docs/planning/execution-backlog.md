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


## 需求插入队列

真实消费项目可以提出当前主线之外的组件需求。所有插入需求先使用 [组件需求记录模板](templates/component-demand.md)，由 Agent 按 [真实需求插入与 Agent 引导流程](demand-insertion-workflow.md) 逐步补充信息。

### 需求插入清单

- [ ] 记录消费项目、页面、用户目标、当前替代方案和阻塞。
- [ ] 判断类型：mainline / ahead-of-line / architecture-blocked / consumer-local。
- [ ] 判断归属：基础组件 / Rhine 领域模式 / 消费项目组合 / Effects 适配器。
- [ ] 写本次必须支持和明确延后的范围。
- [ ] 写 API、状态矩阵、键盘、读屏、reduced motion、响应式和 SSR 约定。
- [ ] 列出最小前置依赖，不绕过 Base UI、tokens 和既有 package 边界。
- [ ] 记录当前主线任务、暂停点和恢复点。
- [ ] 记录组件库验收和消费项目验收。
- [ ] 输出范围卡并确认后再实现。
- [ ] 组件库通过后接入消费项目，状态进入 Consumer validating。
- [ ] 完成消费项目真实页面验收。
- [ ] 回填目标里程碑、删除重复待办、记录剩余增强。
- [ ] 恢复原主线；如果插入需求连续增加，先做一次主线重排。

### 范围卡最小字段

```text
消费项目：
真实页面：
当前阻塞：
当前替代方案：
组件归属：
插入类型：
目标里程碑：
本次支持：
本次延后：
必要依赖：
组件库验收：
消费项目验收：
主线暂停点：
主线恢复点：
路线回填位置：
```

拒绝或延期时，必须记录原因、保留的最小替代方案和未来重新触发条件。

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

