# ROADMAP · WzRhineLab UI 实施路线（2026-10-09）

> 初始计划，不代表已实现。每一里程碑均以验收结果关闭，不以文档标记代替执行证据。
>
> **进度（2026-10-10）**：M0–M5 已合并（PR #1–#7）：基础组件、导航与浮层、档案组件、可选包 `@wzrhine/effects`（可选 3D 有意延后）、dist 构建与发布流程。M6 已实现并有测试：三个示例应用（独立 SPA / 宿主嵌入 / SSR 水合）、冻结的主题 token 契约、31 张视觉回归基线、升级指南；试用中发现的 3 个库缺陷已修复（[M6 验收记录](development/acceptance/2026-10-10-m6.md)）。三内核自动化验收通过。**仍未完成**：发布审批（维护者需选定许可证、创建 npm scope、确认版本号），以及读屏软件、200% 缩放与真机的人工验收。

| 里程碑 | 目标 | 核心产物 | 退出门禁 |
| --- | --- | --- | --- |
| **M0 Foundation** | 代码仓与设计系统初始化 | docs、Tokens、React 包骨架、Showcase 起始页、参考资料 | 结构完整；本地依赖可安装并完成 typecheck/build |
| **M1 Primitives** | 建立高频基础组件与交互底座 | Button/IconButton/Surface/Text/Badge/Input/Field；headless ADR | API/状态/键盘/减动测试通过 |
| **M2 Navigation & Overlay** | 复杂交互 | Tabs/Dialog/Popover/Tooltip/Menu/Toast/Select | 焦点管理、Portal、可中断退出动画、暗色和响应式通过 |
| **M3 Data & Archive** | 莱茵科研档案识别系统 | RecordHeader/ArchiveCard/MetadataList/Timeline/DataTable/StatusIndicator | 三个真实使用场景替代演示假数据；无障碍回归 |
| **M4 Motion & Showcase** | 独有视觉与演示体验 | 原创扫描/轨道/解密模式、动效播放器、reduce 对照、可选 3D | 不影响基础包体；性能/减动/中断验收 |
| **M5 Package & Docs** | 对外复用准备 | API docs、Storybook 或自研 explorer、版本/变更/手动发布 | 包导出/安装/许可/无障碍/跨浏览器 |
| **M6 Release Candidate** | 真实业务集成与稳定 | 3 个示例应用、升级指南、稳定主题、视觉回归基线 | 真实试用问题关闭与发布审批 |

## 内容补齐阶段（M7–M9，2026-10-10 起）
维护者决定：**暂不发布**，先补齐 [COMPONENTS.md](design/COMPONENTS.md) 规划但未实现的组件；**暂不正式支持 React 18**（peer 声明保持不变，但不做验证，也不承诺）。每个里程碑沿用 M1–M6 的门禁：单测、三内核 E2E、axe、视觉基线、组件文档、验收记录。

| 里程碑 | 目标 | 核心产物 | 退出门禁 |
| --- | --- | --- | --- |
| **M7 Forms** | 补齐 Fields 层与基础原语 | Textarea、Checkbox、CheckboxGroup、RadioGroup / Radio、Switch、Fieldset、Separator、VisuallyHidden | 全部接入 Field 语义（标签 / 描述 / 错误 / 禁用）；原生表单提交值正确；「设置表单」场景改用新组件 |
| **M8 Data & Navigation** | 数据与导航补齐 | Pagination（接入 DataTable）、Breadcrumb（与 RecordHeader trail 共用）、Progress / Meter、Stat；DataTable 加载态 | DataTable 千行分页场景实测；键盘与读屏语义；视觉基线 |
| **M9 Ecosystem** | 生态与工程化 | `'use client'` 产物指令与 App Router 示例、组件默认文案 locale（ADR）、体积预算门禁 | 示例构建与 E2E；预算超标时 `release:check` 失败 |

暂缓：可选 3D、InstrumentPanel、SectionIndex、Combobox（M8 视档案检索需求再定）。

## 推荐的首批任务顺序
**Week 0 / M0**：落实文档、8 张概念图、22 页研究报告；起草并确认源码许可；搭建可运行的 pnpm workspace；验证 HTML 文档展示与导出路径。
**M1-A**：Tokens 与 theme/density；Button/StatusBadge/Surface；测试基础设施。
**M1-B**：Input/Field/IconButton/Text；确定 Base UI / React Aria / Radix 单一交互底座并记录 ADR。
**M2**：Tabs → Tooltip → Dialog → Select → Popover → Toast，每完成一个组件即发布文档预览。
**M3**：以「档案检索 / 实验监测 / 设置表单」作为真实验收样例。

## 风险与约束
- 专有视觉素材：原创设计与同人作品界限需要维护；禁止直接发游戏 UI 素材。
- 动效/性能：大量 DOM、WebGL 与 filters 可能破坏低配设备体验。
- 开发效率：避免一开始引入 3D 与全量无样式组件重复开发。
- CI 成本：未经用户确认，不自动配置 push/PR CI。
- Licenses：目前无根 LICENSE；确定维护者许可策略后再公开发行。
- 参考图：AI 生成视觉稿只用于艺术方向审核，不能被认为真实的 CSS、响应式规范或用户数据。

## 每个里程碑的完成定义
完成列表 + 真实运行命令和结果 + 浏览器截图 + 可访问性证据 + 已知缺陷 + 下一里程碑交接。M0 文档已写入本身不构成 M0 验收完成。
