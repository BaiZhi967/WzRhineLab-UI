# ROADMAP · WzRhineLab UI 实施路线

> 本文件是里程碑摘要，「状态」列以验收记录为准；每一里程碑均以验收结果关闭，不以文档标记代替执行证据。M11–M18 的详细规划见 [planning/roadmap.md](planning/roadmap.md)，可执行任务见 [planning/execution-backlog.md](planning/execution-backlog.md)。
>
> **当前状态**：M0–M10、M9.5 与 M12 已完成；当前主线是 M13 的 Wpi-Agent 真实接入与 Rhine 领域模式门禁。M11 Rendering Lab 已延期为独立 Planned 实验，不是 M13 的前置条件，可按真实需求单独排期。之后依次进入 M14 人工可访问性 / 国际化验收与 M15 公开发布门禁。仍未完成：npm scope、版本号、读屏软件 / 200% 缩放 / 真机的人工验收、自动 CI（需维护者批准）；许可证已定为 MIT（根与各包 `LICENSE`、`license` 字段已就位）。
>
> **进度（M0–M6）**：M0–M5 已合并（PR #1–#7）：基础组件、导航与浮层、档案组件、可选包 `@wzrhine/effects`（可选 3D 有意延后）、dist 构建与发布流程。M6 已实现并有测试：三个示例应用（独立 SPA / 宿主嵌入 / SSR 水合）、冻结的主题 token 契约、31 张视觉回归基线（M6 时的数量；M9 之后为 74 张）、升级指南；试用中发现的 3 个库缺陷已修复（[M6 验收记录](development/acceptance/2026-10-10-m6.md)）。三内核自动化验收通过。**仍未完成**：发布审批（维护者需选定许可证、创建 npm scope、确认版本号），以及读屏软件、200% 缩放与真机的人工验收。
>
> **进度（M7）**：表单层已补齐并有测试（[M7 验收记录](development/acceptance/2026-10-10-m7.md)）。
>
> **进度（M12）**：维护者决定先交付 M12，交付高级交互组件与 Agent UI 两个新包（`@wzrhine/agent-core`、`@wzrhine/agent`）。M12 已完成；M11 保留为独立的 Rendering Lab 实验，M13 则承接 M12 输出并负责真实 Wpi-Agent 消费页面与 Rhine 领域模式。见 [M12 验收记录](development/acceptance/2026-10-11-m12.md) 与 [ADR-0010](development/adr/0010-m12-agent-ui-plan.md)。
>
> **进度（M8）**：已完成并有测试（[M8 验收记录](development/acceptance/2026-10-10-m8.md)，契约 [ADR-0005](development/adr/0005-data-navigation-contracts.md)）。M8 之后按维护者决定先做 M9 覆盖层与反馈，原 Ecosystem 改为 M9.5。
>
> **进度（M9）**：AlertDialog、Drawer、Alert / Callout、EmptyState、Skeleton、Spinner 与 Toast / Dialog 补强已完成并有测试（[M9 验收记录](development/acceptance/2026-10-10-m9.md)，契约 [ADR-0006](development/adr/0006-overlays-feedback-contracts.md)）。
>
> **进度（M10）**：Motion Core 2.0 已实现并有测试（[M10 验收记录](development/acceptance/2026-10-10-m10.md)，契约 [ADR-0007](development/adr/0007-motion-ownership.md)，[模式目录](design/MOTION-PATTERNS.md)）：MotionPresence、RhineMotionGroup、按属性类型的减动、统一可见性与生命周期、Dialog / Popover / Toast / Tabs / ArchiveCard 中断 E2E、全路由减动扫描。与 M9 并行开发，合入后统一复验。

| 里程碑 | 目标 | 核心产物 | 退出门禁 | 状态 |
| --- | --- | --- | --- | --- |
| **M0 Foundation** | 代码仓与设计系统初始化 | docs、Tokens、React 包骨架、Showcase 起始页、参考资料 | 结构完整；本地依赖可安装并完成 typecheck/build | ✅ [Sprint 01](development/acceptance/2026-10-09-sprint-01.md) |
| **M1 Primitives** | 建立高频基础组件与交互底座 | Button/IconButton/Surface/Text/Badge/Input/Field；headless ADR | API/状态/键盘/减动测试通过 | ✅ [M1-B](development/acceptance/2026-10-09-m1b.md) |
| **M2 Navigation & Overlay** | 复杂交互 | Tabs/Dialog/Popover/Tooltip/Menu/Toast/Select | 焦点管理、Portal、可中断退出动画、暗色和响应式通过 | ✅ [M2-A](development/acceptance/2026-10-09-m2a.md) · [M2-B](development/acceptance/2026-10-09-m2b.md) |
| **M3 Data & Archive** | 莱茵科研档案识别系统 | RecordHeader/ArchiveCard/MetadataList/Timeline/DataTable/StatusIndicator | 三个真实使用场景替代演示假数据；无障碍回归 | ✅ [M3](development/acceptance/2026-10-09-m3.md) |
| **M4 Motion & Showcase** | 独有视觉与演示体验 | 原创扫描/轨道/解密模式、动效播放器、reduce 对照、可选 3D | 不影响基础包体；性能/减动/中断验收 | ✅ [M4](development/acceptance/2026-10-09-m4.md)（可选 3D 有意延后） |
| **M5 Package & Docs** | 对外复用准备 | API docs、Storybook 或自研 explorer、版本/变更/手动发布 | 包导出/安装/许可/无障碍/跨浏览器 | ✅ [M5](development/acceptance/2026-10-09-m5.md) |
| **M6 Release Candidate** | 真实业务集成与稳定 | 3 个示例应用、升级指南、稳定主题、视觉回归基线 | 真实试用问题关闭与发布审批 | ✅ [M6](development/acceptance/2026-10-10-m6.md)（发布审批 ⏸ 待维护者） |

## 内容补齐阶段（M7–M10，M9.5）
维护者决定：**暂不发布**，先补齐 [COMPONENTS.md](design/COMPONENTS.md) 规划但未实现的组件（通用组件已在 M7–M9 补齐；InstrumentPanel / SectionIndex / ExperimentTimeline 等领域模式归入 M13）；**暂不正式支持 React 18**（M9.5 由 [ADR-0008](development/adr/0008-consumption-boundary.md) 定案：只承诺 React 19，peer 收窄为 `^19.0.0`）。每个里程碑沿用 M1–M6 的门禁：单测、三内核 E2E、axe、视觉基线、组件文档、验收记录。

M10 与 M9 并行完成，因此表中 M10 排在 M9.5 之前；编号保持不变，避免交叉引用失效。

| 里程碑 | 目标 | 核心产物 | 退出门禁 | 状态 |
| --- | --- | --- | --- | --- |
| **M7 Forms** | 补齐 Fields 层与基础原语 | Textarea、Checkbox、CheckboxGroup、RadioGroup / Radio、Switch、Fieldset、Separator、VisuallyHidden | 全部接入 Field 语义（标签 / 描述 / 错误 / 禁用）；原生表单提交值正确；「设置表单」场景改用新组件 | ✅ [M7](development/acceptance/2026-10-10-m7.md) |
| **M8 Data & Navigation** | 数据与导航补齐 | Pagination（接入 DataTable）、Breadcrumb（与 RecordHeader trail 共用）、Progress / Meter、Stat；DataTable 加载态 | DataTable 千行分页场景实测；键盘与读屏语义；视觉基线 | ✅ [M8](development/acceptance/2026-10-10-m8.md) |
| **M9 Overlays & Feedback** | 覆盖层与反馈补齐 | AlertDialog、Drawer、Alert / Callout、EmptyState、Skeleton、Spinner；Toast / Dialog 补强 | 焦点进出与归还、live region 语义、可中断动效；三内核 E2E 与视觉基线 | ✅ [M9](development/acceptance/2026-10-10-m9.md) |
| **M10 Motion Core 2.0** | 统一动效契约 | MotionPresence、RhineMotionGroup、按属性类型的减动、可见性暂停与生命周期、属性所有权 ADR、[动效模式目录](design/MOTION-PATTERNS.md) | Dialog / Popover / Toast / Tabs / ArchiveCard 中断测试；全路由减动扫描；隐藏页暂停 | ✅ [M10](development/acceptance/2026-10-10-m10.md)（公开 `RhineMotionProvider` 延后，见 ADR-0007） |
| **M9.5 Ecosystem hardening** | 生态与工程化 | React 18 / 19 支持策略 ADR；locale 与默认文案 ADR；`'use client'` 产物指令与 App Router 示例；SSR hydration 回归；包体积基线与预算（超标时 `release:check` 失败）；文档搜索索引；packages 安装 / 导出 / CSS 导入文档；升级指南与 CHANGELOG；决定 npm scope（暂不发布）；第三方许可证来源 | 两份 ADR 已定案；示例构建与三内核 E2E；hydration 回归通过；预算超标时 `release:check` 失败（反向验证）；验收记录 | ✅ [M9.5](development/acceptance/2026-10-11-m9.5.md)（ADR-0008、ADR-0009） |

## 高级交互与 Agent UI（M12）
M12 已完成。维护者决定先交付 M12，并把原 M13 的 Agent UI 提前；M11 Rendering Lab 保留为独立 Planned 实验，M13 承接真实消费和领域模式门禁（[ADR-0010](development/adr/0010-m12-agent-ui-plan.md)）。

| 里程碑 | 目标 | 核心产物 | 退出门禁 | 状态 |
| --- | --- | --- | --- | --- |
| **M12 Advanced interaction + Agent UI** | 高级交互与可复用的 Agent 界面 | `@wzrhine/react`：Collapsible、Accordion、Slider、NumberField、ContextMenu、Combobox、CommandPalette、FileDropZone、SplitButton、ScrollArea；新包 `@wzrhine/agent-core`（view-model、状态轴、纯函数，[ADR-0011](development/adr/0011-agent-contracts.md)）与 `@wzrhine/agent`（概念图册 46 个组件 + Wpi 缺口补充、Agent 动效 [ADR-0012](development/adr/0012-agent-motion.md)）；Showcase 集成工作台；示例 `agent-console` | 单测、三内核 E2E、axe、视觉基线、减动、size 预算、`release:check`；agent 边界测试 | ✅ [M12](development/acceptance/2026-10-11-m12.md)（Wpi-Agent 真实接入与人工读屏 / IME 验收待维护者） |

M11 Rendering Lab、M13 领域模式到 M18 治理的目标、依赖与门禁见 [planning/roadmap.md](planning/roadmap.md)。M12 已完成；M13 是当前主线门禁，M11 是可独立插入的实验，不是 M13 的前置条件。

### M11、M12、M13 的关系

- **M11** 是渲染证据实验，维护者已决定暂缓；它不再是 M12 或 M13 的前置条件。
- **M12** 已完成高级交互与 Agent UI 的交付，输出 `@wzrhine/agent-core`、`@wzrhine/agent` 以及 React 高级控件。
- **M13** 是 M12 之后的当前主线：先完成 Wpi-Agent 真实消费页面和双层验收，再按真实科研 / 档案场景补齐领域模式。只有 M13 的消费项目门禁通过，Agent UI 平台才算完成定义。
- **M14 → M15** 依次负责人工可访问性 / 国际化和公开发布；M11 的实验结果可在 M17 适配器排期时复用。

暂缓：可选 3D（M11 实验后再决定，适配器在 M17）、InstrumentPanel / SectionIndex（M13 领域模式）、FilterBar 与 DatePicker（无真实需求 / 等 locale 与时区策略）、公开 `RhineMotionProvider`（ADR-0007 延后，沿用 `RhineProvider motion` + `MotionConfig`）。

## 首批任务顺序（M0–M3，已完成）
**Foundation / M0**：落实文档、8 张概念图、22 页研究报告；起草并确认源码许可；搭建可运行的 pnpm workspace；验证 HTML 文档展示与导出路径。
**M1-A**：Tokens 与 theme/density；Button/StatusBadge/Surface；测试基础设施。
**M1-B**：Input/Field/IconButton/Text；确定 Base UI / React Aria / Radix 单一交互底座并记录 ADR（结果：[ADR-0001](development/adr/0001-headless-primitives.md) 选定 Base UI）。
**M2**：Tabs → Tooltip → Dialog → Select → Popover → Toast，每完成一个组件即发布文档预览。
**M3**：以「档案检索 / 实验监测 / 设置表单」作为真实验收样例。

## 风险与约束
- 专有视觉素材：原创设计与同人作品界限需要维护；禁止直接发游戏 UI 素材。
- 动效/性能：大量 DOM、WebGL 与 filters 可能破坏低配设备体验。
- 开发效率：避免一开始引入 3D 与全量无样式组件重复开发。
- CI 成本：未经用户确认，不自动配置 push/PR CI。
- Licenses：已选定 MIT（2026-10-12）；根目录与五个可发布包各有一份 `LICENSE`。
- 参考图：AI 生成视觉稿只用于艺术方向审核，不能被认为真实的 CSS、响应式规范或用户数据。

## 每个里程碑的完成定义
完成列表 + 真实运行命令和结果 + 浏览器截图 + 可访问性证据 + 已知缺陷 + 下一里程碑交接。M0 文档已写入本身不构成 M0 验收完成。

## 长期规划入口

M11–M18 的长期规划、组件平台、动效与渲染、质量发布和执行清单统一维护在 [docs/planning/](planning/README.md)。状态记录分工：本文件是摘要（只写状态与验收链接）；[planning/roadmap.md](planning/roadmap.md) 写每个阶段的目标、产物、依赖和门禁；[planning/execution-backlog.md](planning/execution-backlog.md) 写可勾选的任务。三者不一致时，以代码、验收记录和 ADR 为事实依据并同步修正。
