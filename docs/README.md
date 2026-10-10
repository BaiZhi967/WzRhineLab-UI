# 文档导航

| 文档 | 目的 |
| --- | --- |
| [../DESIGN.md](../DESIGN.md) | 设计总纲：产品目标、审美逻辑与设计决策 |
| [design/STYLE.md](design/STYLE.md) | 配色 / 字体 / 布局 / 状态 / 密度与主题 |
| [design/MOTION.md](design/MOTION.md) | Motion 设计原则、时长、缓动、生命周期、减动 |
| [design/MOTION-PATTERNS.md](design/MOTION-PATTERNS.md) | 动效模式目录：每个模式的语义、触发、时长、生命周期、中断、减动、隐藏页、fallback、预算 |
| [design/COMPONENTS.md](design/COMPONENTS.md) | 分类、命名、组件 API、验收矩阵 |
| [design/ICONS.md](design/ICONS.md) | 图标语法、尺寸、对齐与许可 |
| [design/ACCESSIBILITY.md](design/ACCESSIBILITY.md) | WCAG 2.2 AA 目标与测试方案 |
| [development/ARCHITECTURE.md](development/ARCHITECTURE.md) | workspace、包结构、依赖边界与发布约束 |
| [development/CONTRIBUTING.md](development/CONTRIBUTING.md) | 开发约束、commit、分支、评审与测试 |
| [development/QUALITY-GATES.md](development/QUALITY-GATES.md) | 可执行质量门槛 |
| [ROADMAP.md](ROADMAP.md) | M0–M9 里程碑摘要、验收与依赖 |
| [planning/README.md](planning/README.md) | M8–M18 顺序路线、组件、动效、质量和执行计划 |
| [concepts/README.md](concepts/README.md) | 概念图索引、用途与局限 |
| [research/REFERENCES.md](research/REFERENCES.md) | 官方 / 社区 / 技术参考资料及授权提醒 |

**真值优先顺序**：生产代码和可执行测试 > 规范化 tokens > 本文指定规范 > 人工审定稿 > 生成的概念图。冲突需提 Issue/ADR，不允许单靠截图覆盖规范。


## 额外资料与导入
- [研究摘要](research/RESEARCH-SUMMARY.md)
- [长期规划中心](planning/README.md)
- [研究参考链接](research/REFERENCES.md)
- [视觉原件清单](research/ASSET-MANIFEST.md)
- [ADR-0001 交互底座 · Base UI（Accepted）](development/adr/0001-headless-primitives.md)
- [ADR-0002 源码直出导出与样式入口](development/adr/0002-source-exports-and-style-entry.md)
- [ADR-0003 Token 对比度校准与 Button variant](development/adr/0003-token-tuning-and-button-variants.md)
- [ADR-0004 展示动效独立为可选包](development/adr/0004-optional-effects-package.md)
- [ADR-0005 M8 数据与导航组件契约](development/adr/0005-data-navigation-contracts.md)
- [ADR-0006 M9 覆盖层与反馈组件契约](development/adr/0006-overlays-feedback-contracts.md)
- [ADR-0007 M10 动效属性所有权与 Motion Core 契约](development/adr/0007-motion-ownership.md)
- [Sprint 01 验收记录](development/acceptance/2026-10-09-sprint-01.md)
- [M1-B 验收记录](development/acceptance/2026-10-09-m1b.md)
- [M2-A 验收记录](development/acceptance/2026-10-09-m2a.md)
- [M2-B 验收记录](development/acceptance/2026-10-09-m2b.md)
- [M3 验收记录](development/acceptance/2026-10-09-m3.md)
- [M4 验收记录](development/acceptance/2026-10-09-m4.md)
- [M5 验收记录](development/acceptance/2026-10-09-m5.md)
- [M6 验收记录](development/acceptance/2026-10-10-m6.md) · [示例应用](../examples/README.md)
- [M7 验收记录](development/acceptance/2026-10-10-m7.md)
- [M8 验收记录](development/acceptance/2026-10-10-m8.md)
- [M9 验收记录](development/acceptance/2026-10-10-m9.md)
- [M10 验收记录](development/acceptance/2026-10-10-m10.md)
- [发布流程 RELEASING](development/RELEASING.md) · [升级指南 UPGRADING](development/UPGRADING.md) · [第三方许可证](development/THIRD-PARTY-LICENSES.md)
- API 参考（自动生成）：[tokens](api/tokens.md) · [react](api/react.md) · [effects](api/effects.md)
- 组件文档：[Field & Input](components/field.md) · [Choice · Textarea · Fieldset · Form](components/forms.md) · [Data & navigation](components/data-navigation.md) · [AlertDialog](components/alert-dialog.md) · [Drawer](components/drawer.md) · [Alert & feedback](components/feedback.md) · [IconButton · Text](components/icon-button-text.md) · [Provider · Tabs · Tooltip · Dialog · Select](components/overlays.md) · [Popover · Menu · Toast](components/popover-menu-toast.md) · [Archive patterns](components/archive.md) · [Showcase effects](components/effects.md)
- [Windows 资源导入脚本](../scripts/import-visual-assets.ps1)
- [Showcase 源码](../apps/docs/src/App.tsx)

**视觉基线**：八张高保真 PNG 已入库于 `concepts/images/`（另有 WebP 预览与研究 PDF）。先前不符合视觉规范的 SVG 草图已删除，不再恢复。
