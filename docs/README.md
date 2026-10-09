# 文档导航

| 文档 | 目的 |
| --- | --- |
| [../DESIGN.md](../DESIGN.md) | 设计总纲：产品目标、审美逻辑与设计决策 |
| [design/STYLE.md](design/STYLE.md) | 配色 / 字体 / 布局 / 状态 / 密度与主题 |
| [design/MOTION.md](design/MOTION.md) | Motion 设计原则、时长、缓动、生命周期、减动 |
| [design/COMPONENTS.md](design/COMPONENTS.md) | 分类、命名、组件 API、验收矩阵 |
| [design/ICONS.md](design/ICONS.md) | 图标语法、尺寸、对齐与许可 |
| [design/ACCESSIBILITY.md](design/ACCESSIBILITY.md) | WCAG 2.2 AA 目标与测试方案 |
| [development/ARCHITECTURE.md](development/ARCHITECTURE.md) | workspace、包结构、依赖边界与发布约束 |
| [development/CONTRIBUTING.md](development/CONTRIBUTING.md) | 开发约束、commit、分支、评审与测试 |
| [development/QUALITY-GATES.md](development/QUALITY-GATES.md) | 可执行质量门槛 |
| [ROADMAP.md](ROADMAP.md) | M0–M6 里程碑、验收与依赖 |
| [concepts/README.md](concepts/README.md) | 概念图索引、用途与局限 |
| [research/REFERENCES.md](research/REFERENCES.md) | 官方 / 社区 / 技术参考资料及授权提醒 |

**真值优先顺序**：生产代码和可执行测试 > 规范化 tokens > 本文指定规范 > 人工审定稿 > 生成的概念图。冲突需提 Issue/ADR，不允许单靠截图覆盖规范。


## 额外资料与导入
- [研究摘要](research/RESEARCH-SUMMARY.md)
- [研究参考链接](research/REFERENCES.md)
- [视觉原件清单](research/ASSET-MANIFEST.md)
- [交互底座 ADR](development/adr/0001-headless-primitives.md)
- [Windows 资源导入脚本](../scripts/import-visual-assets.ps1)
- [原型源码](../apps/docs/src/App.tsx)

**注意**：SVG 结构图已上传，八张 PNG 和 PDF 原件尚在独立 ZIP 中等待二进制导入。验收 GitHub 二进制文件时，以实际 Git tree 为准。
