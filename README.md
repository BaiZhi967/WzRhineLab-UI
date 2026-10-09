# WzRhineLab UI

面向 React + Motion 的原创科研机构 / 档案终端风格设计系统。

> 设计灵感来自《明日方舟》莱茵生命的科研机构、档案、航天信息表达，但本项目非官方项目，不使用原作的商标、标识、人物、专有素材或原始 UI 资源。

## 当前阶段

- **Stage 0 — Foundation**：目录与规范初始化；不声称已有成熟组件库。
- 规范入口：[docs/README.md](docs/README.md)、[DESIGN.md](DESIGN.md)、[docs/ROADMAP.md](docs/ROADMAP.md)。
- 原型画板：[docs/concepts/README.md](docs/concepts/README.md)。

## 技术方向

React 19 · TypeScript · Motion (`motion/react`) · CSS Variables / Semantic Tokens · pnpm workspace · Vite。基础交互优先使用原生语义与已验证的 headless primitives，不重复实现复杂焦点管理。

## 使用与状态

初期用于设计规范校准、交互实验和文档演示；完成首批可用组件前不发布稳定版。开发前请阅读 [AGENTS.md](AGENTS.md) 与 [docs/development/CONTRIBUTING.md](docs/development/CONTRIBUTING.md)。

## 授权与素材

源代码许可证尚待维护者决定；**未附许可证不表示获得复用授权**。设计概念图属于原创探索，AI 生成的文字、数值和排版不是经过校验的产品规范。第三方品牌及参考素材保持各自权利归属。


## 本地运行
需要 Node.js 20+，并启用 Corepack / pnpm 10：

```sh
corepack enable
pnpm install
pnpm dev
# 新终端里执行
pnpm typecheck
pnpm build
```

Showcase 默认由 Vite 启动，本地浏览器访问终端输出的地址。本仓库当前只内置 Button、Surface、StatusBadge 三个原型组件，不应当作稳定版组件库发布。**上述命令尚未在有依赖环境下完成验收**，请按 [质量门禁](docs/development/QUALITY-GATES.md) 执行。

## 视觉原件与参考资料
- [原始高保真 PNG 概念图索引](docs/concepts/README.md)：以此前生成的视觉概念图为唯一视觉参考，不再使用简化 SVG 草图。
- [原始图片和研究 PDF 的完整清单](docs/research/ASSET-MANIFEST.md) 记录了应归档的 8 PNG / 8 WebP / 22 页 PDF。
- 原件 ZIP 当前在本次 ChatGPT 对话作为可下载文件提供；由于 GitHub 二进制写入路径限制，**原始 PNG/PDF 尚未进入 GitHub**。Windows 用户可使用 [导入脚本](scripts/import-visual-assets.ps1) 校验 SHA-256 并向仓库提交。
- [研究摘要](docs/research/RESEARCH-SUMMARY.md) 与 [参考链接](docs/research/REFERENCES.md) 已经入库。

## 设计与工程状态
M0 基础设施是起始骨架，并非完成验收。根目录尚未选择源代码许可证，未配置自动 GitHub Actions（避免配额消耗），首次 npm 依赖与浏览器验收仍待执行。
