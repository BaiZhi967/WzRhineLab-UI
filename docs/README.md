# 文档导航

## 当前开发路线

WzUI 主要服务维护者个人长期 React 前端开发。0.2.0 是发布基线；0.3.0 的页面与集合浏览（`@wzrhine/patterns`）库侧已实现，经外部独立验收后完成一轮返修，当前处于 Validating，**尚未发布到 npm**（逐条处置见 [审计响应](roadmap/execution-backlog.md#9-审计响应2026-10-15外部独立验收)）。开发自主推进，消费反馈经过评估进入版本，不以其他应用的接入节奏作为等待条件。

Markdown 写作工作台的编辑器层位于 `@wzrhine/editor`，当前为 R4 候选开发包。它以 Markdown 原文为唯一事实源，CodeMirror 只通过可选 `./codemirror` 子路径接入；完整 WYSIWYM 暂不属于当前发布范围。设计说明见 [编辑器层文档](components/editor.md)。

| 文档 | 用途 |
| --- | --- |
| [ROADMAP.md](ROADMAP.md) | 当前版本、阶段摘要与历史映射 |
| [roadmap/README.md](roadmap/README.md) | 完整后续路线、阶段目标、依赖、产物与非目标 |
| [roadmap/architecture.md](roadmap/architecture.md) | 包边界、数据／状态所有权、组件与 recipe 分工 |
| [roadmap/0.3.0-plan.md](roadmap/0.3.0-plan.md) | 九个候选能力、行为合同、参考应用与版本验收 |
| [roadmap/execution-backlog.md](roadmap/execution-backlog.md) | P030 的 12 项任务、依赖、证据与后续阶段任务卡 |
| [roadmap/demand-workflow.md](roadmap/demand-workflow.md) | 反馈受理、分类、排期、范围变更与消费结果 |
| [roadmap/requests/README.md](roadmap/requests/README.md) | 已完成初步评估的组件与 recipe 需求记录 |
| [roadmap/quality-and-release.md](roadmap/quality-and-release.md) | 质量门禁、版本、发布和回滚 |
| [planning/templates/component-demand.md](planning/templates/component-demand.md) | 单条需求记录模板，所有消费项目共用 |

0.3.0 的 patterns 页面模式已实现（见 [api/patterns.md](api/patterns.md) 与 [components/patterns.md](components/patterns.md)），但版本状态是 Validating 而非 Accepted；R2 及以后的能力仍为规划状态，不能仅凭计划在业务代码中调用。源码与发布包证明已有 API，验收记录证明实际执行结果。

Markdown 内容层、编辑器层和写作工作台的设计方案见 [2026-10-16 设计方案](superpowers/specs/2026-10-16-markdown-writing-workbench-design.md)，对应需求卡见 [roadmap/requests](roadmap/requests/README.md)。这些文档只冻结分析范围与候选合同，不表示相关包、组件或 recipe 已实现。

## 设计与开发规范

| 文档 | 目的 |
| --- | --- |
| [../AGENTS.md](../AGENTS.md) | Agent 开工、范围、worktree、提交与验证约束 |
| [../DESIGN.md](../DESIGN.md) | 设计总纲与平台边界 |
| [design/STYLE.md](design/STYLE.md) | 配色、字体、布局、状态、密度与主题 |
| [design/MOTION.md](design/MOTION.md) | 动效原则、生命周期与减动 |
| [design/MOTION-PATTERNS.md](design/MOTION-PATTERNS.md) | 动效模式与中断、隐藏、fallback 规则 |
| [design/COMPONENTS.md](design/COMPONENTS.md) | 组件分类、命名、API 与验收 |
| [design/ICONS.md](design/ICONS.md) | 图标语法、视觉居中、基础层与定制层 |
| [design/icons/README.md](design/icons/README.md) | 图标评审、规格与资产资料 |
| [design/ACCESSIBILITY.md](design/ACCESSIBILITY.md) | 可访问性目标和测试策略 |
| [development/ARCHITECTURE.md](development/ARCHITECTURE.md) | 已有 workspace 与包工程 |
| [development/CONTRIBUTING.md](development/CONTRIBUTING.md) | 开发与评审要求 |
| [development/QUALITY-GATES.md](development/QUALITY-GATES.md) | 已有可执行质量门禁 |

规范冲突需记录 ADR。生成概念图不能覆盖已采用的规范、tokens、批准资产和可执行合同；计划不代替实现与验收。

## 额外资料与导入

[INSTALL](development/INSTALL.md) · [RELEASING](development/RELEASING.md) · [UPGRADING](development/UPGRADING.md) · [SIZE](development/SIZE.md) · [第三方许可证](development/THIRD-PARTY-LICENSES.md) · [示例应用](../examples/README.md)。

API 参考（自动生成）：[tokens](api/tokens.md) · [react](api/react.md) · [patterns](api/patterns.md) · [content](api/content.md) · [effects](api/effects.md) · [agent-core](api/agent-core.md) · [agent](api/agent.md)。

组件文档：[表单](components/forms.md) · [字段](components/field.md) · [数据与导航](components/data-navigation.md) · [基础操作](components/icon-button-text.md) · [覆盖层](components/overlays.md) · [菜单与通知](components/popover-menu-toast.md) · [确认框](components/alert-dialog.md) · [抽屉](components/drawer.md) · [反馈](components/feedback.md) · [档案](components/archive.md) · [页面模式](components/patterns.md) · [Markdown 内容层](components/content.md) · [动效](components/effects.md) · [效果底座](components/effect-foundations.md) · [文案](components/locale.md) · [高级交互](components/advanced.md) · [命令与选择](components/command.md)。

领域 UI 文档：[外壳](components/agent-shell.md) · [消息](components/agent-message.md) · [工具](components/agent-tools.md) · [输入](components/agent-composer.md) · [干预](components/agent-intervention.md) · [工作空间](components/agent-workspace.md)。

## 历史与设计资料

[历史规划入口](planning/README.md) · [ADR 目录](development/adr/) · [验收记录](development/acceptance/) · [概念图](concepts/README.md) · [研究资料](research/REFERENCES.md) · [研究摘要](research/RESEARCH-SUMMARY.md) · [视觉资产清单](research/ASSET-MANIFEST.md)。

旧 M 系列规划、已完成范围卡和实施记录保留追溯，不再决定当前开工顺序。新增规划在 `roadmap/`，旧设计契约没有因目录迁移而失效。

视觉基线与已批准资产保持现状；不恢复先前已淘汰的图稿，不用概念图替代真实组件验收。
