# Visual Asset Manifest · 原件归档表

截至 2026-10-09，以下资源已在本次交付 ZIP `WzRhineLab-UI_concepts_and_research_2026-10-09.zip` 中打包，并保留源文件无损 PNG。先前不符合视觉规范的八张简化 SVG 已删除；本清单中的 PNG 原件才是视觉基准。

| Source PNG | 目标仓库路径 | 大小 |
| --- | --- | --- |
| 北境实验室科研界面系统.png | `docs/concepts/images/01-research-ui-overview.png` | 1672×941 |
| atlas_ui设计系统组件库_dashboard.png | `docs/concepts/images/02-component-library.png` | 1672×941 |
| 未来研究档案控制台.png | `docs/concepts/images/03-archive-dashboard.png` | 1672×941 |
| 未来档案_跨屏研究界面系统.png | `docs/concepts/images/04-responsive-mobile-tablet.png` | 1672×941 |
| 轨道档案设计令牌系统海报.png | `docs/concepts/images/05-foundation-tokens.png` | 1672×941 |
| 极光研究档案界面.png | `docs/concepts/images/06-archive-workbench-detail.png` | 1672×941 |
| react动态设计系统信息图.png | `docs/concepts/images/07-motion-storyboard.png` | 1672×941 |
| 极光研究系统响应式设计板.png | `docs/concepts/images/08-responsive-ecosystem.png` | 1672×941 |

每张 PNG 配有同名 960×540 WebP 优化预览，便于后续文档站加载。

研究报告：`docs/research/Rhine_Lab_React_Motion_Research_2026-10-09.pdf`，A4 22 页。

## GitHub 二进制验收门槛
- [x] GitHub API tree 中存在以上 8 张 PNG + 8 张 WebP + 1 份 PDF（2026-10-11 以 `git ls-tree origin/main` 核对，17 个文件都在；仓库匿名访问 GitHub API 返回 404，本机 `gh` 登录已失效，因此没有直接调用 API）
- [x] 下载后与本次交付 ZIP 里 SHA256SUMS.txt 校验一致（2026-10-11 对工作区文件（与已提交版本相同，`git status` 无改动）逐一计算 SHA-256，17 / 17 一致；ZIP 取自维护者本机下载目录）
- [x] 明确概念图为 AI 辅助原创设计参考，不能代替规范和源代码（[concepts/README.md](../concepts/README.md) 开头与 [DESIGN.md](../../DESIGN.md) §8）

**本记录不虚报已提交的二进制文件**；它们需经仓库所支持的 Git push / 资源导入流程归档。ZIP 已含完整目录和校验表。
- 归档记录：2026-10-09 由 `scripts/import-visual-assets.ps1` 导入并提交（5ddee17，17 个文件），已在 `main`。

## Agent 组件概念图册（2026-10-11 导入）

第二批概念资源：`WzRhine_Agent_Component_Atlas`（Agent UI 平台规划配套图册），来源为维护者本机交付目录（无 ZIP / SHA256SUMS 交付表）。相对交付原件的整理与校验记录见 [concepts/agent/README.md](../concepts/agent/README.md) 的「导入记录」一节。

| 内容 | 数量 | 仓库路径 | 规格 |
| --- | --- | --- | --- |
| 版面级概念图 + 总览拼版 | 13 | `docs/concepts/agent/images/`（编号 05–17 + `contact-sheet.png`） | 1600×1000 PNG |
| 单组件图 | 46 | `docs/concepts/agent/images/01-*.png` … `46-*.png` | 1600×1000 PNG |
| 语义线框 HTML 源页 | 46 | `docs/concepts/agent/source-pages/` | 每个约 17 KB |
| 机读元数据 / 逐项规格 / 离线浏览器 | 3 | `manifest.json` / `COMPONENT-SPECS.md` / `index.html` | — |

- 剔除项：5 张与编号文件 SHA-256 完全一致的中文名重复 PNG、顶层冗余 `contact-sheet.jpg`（保留无损 PNG 版）。
- 目录内自带 `SHA256SUMS.txt`（109 个文件），本次以工作区文件实时计算生成；入库提交后可据此复验。
- 未做项：未生成 WebP 预览对（现有 8 张基础概念图有 PNG + WebP 对，本册暂只有 PNG，如需文档站加速可后补）；许可说明沿用项目整体状态——源代码采用 MIT 许可证。
- 归档记录：2026-10-11 手动导入（非 `import-visual-assets.ps1`），提交 22c290c（113 个文件），已在 `main`。
