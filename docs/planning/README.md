# WzRhineLab-UI 长期规划中心

> 状态：Working plan  
> 基线：M0–M10 与 M9.5 已合入 main（Base UI 1.9.0，只支持 React 19）；下一里程碑 M11 Rendering Lab  
> 维护方式：规划文档描述目标和门禁，验收记录描述已经真实执行的结果。

本目录是 WzRhineLab-UI 后续规划的统一入口。现有的 design、development 和 acceptance 文档继续作为规范、实现约束和事实记录；本目录负责回答三个问题：

1. 接下来应该做什么；
2. 为什么按这个顺序做；
3. 什么证据出现后才可以认为一个阶段完成。

本目录不替代生产代码、测试、tokens、ADR 或验收记录。计划中的内容没有经过实现和检查时，不得在 README、变更日志或对外文档中写成已支持能力。

## 当前基线

当前 main 已经完成：

- React + TypeScript + Motion 的 pnpm workspace；
- @wzrhine/tokens、@wzrhine/react、@wzrhine/effects 三个包；
- Base UI 1.9.0 作为唯一 headless 交互底座；
- 基础原语、Fields、Navigation / Overlay、Data、Rhine archive patterns；
- Agent UI 公共包尚未实现；其目标边界和契约见 Agent UI 平台规划；
- M7 表单层：Textarea、Checkbox、CheckboxGroup、RadioGroup、Radio、Switch、Fieldset、Form、Separator、VisuallyHidden；
- M8 数据与导航：Pagination、Breadcrumb、Progress、Meter、Stat，DataTable 加载 / 错误 / 空状态与分页（[验收记录](../development/acceptance/2026-10-10-m8.md)）；
- M9 覆盖层与反馈：AlertDialog、Drawer、Alert / Callout、EmptyState、Skeleton、Spinner，Toast 操作 / 撤销 / 更新与 Dialog 关闭保护（[验收记录](../development/acceptance/2026-10-10-m9.md)）；
- M10 Motion Core 2.0：MotionPresence、RhineMotionGroup、按属性类型的减动、可见性暂停与生命周期、[动效模式目录](../design/MOTION-PATTERNS.md)（[验收记录](../development/acceptance/2026-10-10-m10.md)）；
- 共四十二个组件和 RhineProvider（以 `packages/react/src/index.ts` 与 [API 报告](../api/react.md) 为准）；
- 3 个示例应用：archive-desk、host-embed、ssr-hydrate；
- 三内核自动化验收（Showcase E2E 每个内核 385 项）、axe 检查、74 张视觉回归基线（Windows Chromium）、package verification；
- effects 包与 react 核心包之间的依赖边界；
- 语义 token、主题作用域、Motion 时长与减动规范。

当前明确未完成：

- 屏幕阅读器人工验收；
- 200% 缩放人工验收；
- 真实设备触摸、滚动和焦点验收；
- 根目录许可证、npm scope、公开版本号；
- 公开发布前的版本号确认与 npm scope 创建（M9.5 已决定保留 `@wzrhine`，暂不发布）；
- 公开的 RhineMotionProvider（M10 有意延后，见 [ADR-0007](../development/adr/0007-motion-ownership.md)）；
- Canvas/WebGL 可选渲染实验（M11）；
- 自动 CI（需维护者批准后才配置）。

## 规划文件

| 文件 | 内容 |
| --- | --- |
| [roadmap.md](roadmap.md) | 从 M8 到公共生态的阶段路线、依赖关系和每个阶段的状态 |
| [component-platform-plan.md](component-platform-plan.md) | 组件分层、优先级、API、验收矩阵和领域模式 |
| [motion-and-rendering-plan.md](motion-and-rendering-plan.md) | CSS、Motion、SVG、Canvas、WebGL 和第三方适配器的长期边界 |
| [quality-release-and-ecosystem-plan.md](quality-release-and-ecosystem-plan.md) | 质量门禁、兼容性、许可、发布、文档与生态计划 |
| [execution-backlog.md](execution-backlog.md) | 当前及后续阶段的可执行任务清单 |
| [demand-insertion-workflow.md](demand-insertion-workflow.md) | 真实需求插入、Agent 引导问询、消费项目验收和路线回填 |
| [templates/component-demand.md](templates/component-demand.md) | 组件需求记录与范围确认模板 |
| [agent-ui-platform-plan.md](agent-ui-platform-plan.md) | @wzrhine/agent 的组件分层、迁移顺序和质量门禁 |
| [agent-ui-contracts.md](agent-ui-contracts.md) | Agent view-model、actions、状态、流式恢复和异步交互契约 |
| [agent-ui-adoption.md](agent-ui-adoption.md) | Wpi-Agent 与其他 Agent 应用的接入方式和双层验收 |

## 计划使用规则

### 1. 以里程碑而不是文件数量判断进度

每个里程碑必须有：

- 可运行的代码或可审阅的文档产物；
- 对应的单元、E2E、视觉或人工验证；
- 已知限制；
- 回滚或延期说明；
- 下一阶段的交接记录。

新增一个组件文件不等于完成一个组件；加入一个动画库不等于完成动效能力。

### 2. 生产基座保持单一

核心组件继续使用 Base UI 1.9.0、原生语义 HTML、Rhine tokens 和 motion/react。除非新增 ADR 证明现有基座无法满足一个真实需求，否则不混用 Radix、React Aria、Ark UI 或其他行为基座。

### 3. 展示能力必须可选

DOM/SVG 展示效果可以留在 @wzrhine/effects。Canvas、WebGL、Rive、Lottie、GSAP 和其他高成本能力必须通过独立入口、lazy loading、静态 fallback 和明确的性能门禁引入，不得进入 Button、Field、Dialog、DataTable 等基础组件的依赖链。

### 4. 先场景，后组件

一个新组件进入排期前，至少需要一个真实页面场景：

- archive-desk；
- creator / content workbench；
- agent / evaluation console；
- 或明确的文档、设置、数据分析场景。

只有展示概念而没有使用场景的效果，放入 showcase backlog，不进入核心组件排期。

Agent UI 采用独立的 @wzrhine/agent 包。一个真实的 Agent 消费项目就可以提出组件插入需求；第二个消费者用于验证公共契约，不是进入规划的前置条件。Agent UI 的运行时、传输、权限事实和宿主 API 必须留在消费项目。

### 5. 真实需求可以插入，但必须可回填

当其他项目的真实页面被缺少的组件阻塞时，可以提前实现目标里程碑中的一个最小支持子集。Agent 必须先按 [真实需求插入与 Agent 引导流程](demand-insertion-workflow.md) 逐步询问，一次只确认一个关键问题，不要求用户一次填写完整表单。

插入前必须记录场景、归属、最小范围、必要依赖、组件库验收、消费项目验收、主线暂停点和恢复点。提前完成组件不等于完成整个目标里程碑；消费项目未真实接入时，不能写成已解决。

### 6. 评分用于排序，不是阻塞门槛

组件优先级评分用于比较候选项。真实项目的明确阻塞可以提前进入插入队列，即使当前只有一个消费项目或一个页面。涉及第二套 headless 底座、渲染内核、公共 package 边界或许可证变化时，必须先做 ADR 或架构评估。

## 阶段状态约定

- Proposed：已提出，尚未完成需求和风险评估；
- Planned：已进入路线，但没有开始实现；
- In progress：已有分支或明确实现任务；
- Validating：代码已完成，等待自动化或人工门禁；
- Accepted：有验收记录和可复现证据；
- Deferred：有意延后并记录原因；
- Rejected：经过评估不再进入路线。

## 维护要求

- 修改组件 API、token、行为底座、渲染边界或许可证策略时，先修改对应 ADR 或规划文档；
- 每个里程碑结束时更新本目录和 docs/ROADMAP.md；
- 任何“已通过”“已支持”“可发布”都必须链接到真实验收记录；
- 不创建自动 GitHub Actions workflow，除非维护者明确批准并重新评估配额；
- 规划文件使用中文，代码 API 和外部库名称保留原文；
- commit message 使用中文，按小步、可回滚的范围提交。

## 当前推荐起点

M8、M9、M10 与 M9.5 已完成（M10 与 M9 并行；M9.5 证据见 [验收记录](../development/acceptance/2026-10-11-m9.5.md)）。下一个开发里程碑是 M11 Rendering Lab（[路线图](roadmap.md#m11rendering-lab)、[执行清单](execution-backlog.md#m11rendering-lab)）。M9.5 已完成的范围：

1. React 18 / 19 支持策略 ADR；
2. locale 与默认文案 ADR；
3. `'use client'` 产物指令与 App Router 示例；
4. SSR hydration 回归；
5. 包体积基线与预算，超标时 `release:check` 失败；
6. 文档搜索索引；
7. packages 安装 / 导出 / CSS 导入文档；
8. 升级指南与 CHANGELOG；
9. 决定 npm scope（暂不发布）；
10. 第三方许可证来源；
11. 完成 M9.5 验收记录。M11 仍然先用实验决定是否需要 Canvas，而不是立即引入 3D 或第二套组件底座。

Agent UI 的实现应按 [Agent UI 平台规划](agent-ui-platform-plan.md) 的依赖顺序推进；遇到 WzRhine 尚未支持的 Combobox、Slider 或 Accordion 时（Drawer 已在 M9 交付），按照 [需求插入流程（PR #11）](https://github.com/BaiZhi967/WzRhineLab-UI/pull/11) 提交最小支持闭环。
