# WzRhineLab UI

面向 React + Motion 的原创科研机构 / 档案终端风格设计系统。

> 设计灵感来自《明日方舟》莱茵生命的科研机构、档案、航天信息表达，但本项目非官方项目，不使用原作的商标、标识、人物、专有素材或原始 UI 资源。

## 当前阶段

- **M7 — Forms（内容补齐阶段）**：在 M6 Release Candidate 的基础上补齐表单层：Textarea、Checkbox、CheckboxGroup、RadioGroup、Switch、Fieldset、Form，以及 Separator、VisuallyHidden（见 [M7 验收记录](docs/development/acceptance/2026-10-10-m7.md)）。后续 M8–M9 规划见 [ROADMAP](docs/ROADMAP.md)。
- **M8 — Data & Navigation**：Pagination、Breadcrumb、Progress、Meter、Stat，DataTable 加载 / 错误 / 空状态与分页（见 [M8 验收记录](docs/development/acceptance/2026-10-10-m8.md)）。下一步 M9 覆盖层与反馈。
- **暂不发布到 npm**（维护者决定，先补齐内容）；发布前仍需选定许可证、创建 npm scope 并确认版本号（见 [M6 验收记录](docs/development/acceptance/2026-10-10-m6.md)）。React 18 暂不正式支持。
- 规范入口：[docs/README.md](docs/README.md)、[DESIGN.md](DESIGN.md)、[docs/ROADMAP.md](docs/ROADMAP.md)。
- 原型画板：[docs/concepts/README.md](docs/concepts/README.md)。

## 技术方向

React 19 · TypeScript · Motion (`motion/react`) · CSS Variables / Semantic Tokens · pnpm workspace · Vite。基础交互优先使用原生语义与已验证的 headless primitives，不重复实现复杂焦点管理。

## 使用与状态

初期用于设计规范校准、交互实验和文档演示；完成首批可用组件前不发布稳定版。开发前请阅读 [AGENTS.md](AGENTS.md) 与 [docs/development/CONTRIBUTING.md](docs/development/CONTRIBUTING.md)。

## 授权与素材

源代码许可证尚待维护者决定；**未附许可证不表示获得复用授权**。设计概念图属于原创探索，AI 生成的文字、数值和排版不是经过校验的产品规范。第三方品牌及参考素材保持各自权利归属。


## 本地运行
需要 Node.js 20.19+，并启用 Corepack / pnpm 10：

```sh
corepack enable
pnpm install
pnpm dev            # Showcase：http://127.0.0.1:5173
pnpm check          # typecheck + 单元测试 + 构建
pnpm test:e2e       # Playwright（Chromium）：响应式截图、键盘、axe、减动
pnpm test:e2e:all   # 同一套件依次在 Chromium、Firefox、WebKit 上运行
pnpm test:examples  # 三个示例应用的 E2E（test:examples:all 为三内核）
pnpm test:visual    # 视觉回归基线；有意的视觉变更用 test:visual:update 更新
pnpm release:check  # 发布门禁：check + API 漂移 + 许可证审计 + 临时项目安装验证
```

首次运行 E2E 前如未安装浏览器：`pnpm --filter @wzrhine/showcase exec playwright install chromium firefox webkit`。

在应用中使用组件时需显式导入样式（入口无 CSS 副作用，见 [ADR-0002](docs/development/adr/0002-source-exports-and-style-entry.md)）：

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import { Button, RhineProvider } from '@wzrhine/react';

<RhineProvider theme="light">
  <Button variant="primary">保存记录</Button>
</RhineProvider>
```

`RhineProvider` 提供 `.rl-theme` 作用域、弹层挂载点、减动策略和通知队列（`useToast()`）；所有弹层组件都必须放在它内部才能拿到主题。

当前内置 Button、IconButton、Surface、StatusBadge、Text、Separator、VisuallyHidden，表单组件 Field、Input、Textarea、Checkbox、CheckboxGroup、RadioGroup、Radio、Switch、Fieldset、Form，Tabs、Tooltip、Dialog、Select、Popover、Menu、Toast，以及档案组件 RecordHeader、MetadataList、ArchiveCard、StatusIndicator、Timeline、DataTable，以及数据与导航组件 Pagination、Breadcrumb、Progress、Meter、Stat，以及覆盖层与反馈组件 AlertDialog、Drawer、Alert、Callout、EmptyState、Skeleton、Spinner，共四十二个组件和 `RhineProvider`（交互底座为 Base UI，见 ADR-0001）。三个包目前仍为 `private`，发布前请勿在外部项目中依赖。

集成方式参考 [examples/](examples/README.md)：独立 SPA、嵌入非 React 旧页面、SSR 水合。从源码直出期升级请看 [UPGRADING.md](docs/development/UPGRADING.md)。

## 视觉原件与参考资料
- [高保真 PNG 概念图索引](docs/concepts/README.md)：八张 PNG 已入库，为唯一视觉参考；不再使用简化 SVG 草图。
- [原始图片和研究 PDF 清单](docs/research/ASSET-MANIFEST.md)：8 PNG / 8 WebP / 研究 PDF。
- [研究摘要](docs/research/RESEARCH-SUMMARY.md) 与 [参考链接](docs/research/REFERENCES.md)。

## 设计与工程状态
M0–M8 每个里程碑都有验收记录（[docs/README.md](docs/README.md) 中列出），只记录真实执行过的命令。根目录尚未选择源代码许可证；未配置自动 GitHub Actions（避免配额消耗）。Chromium、Firefox、WebKit 的自动化验收已通过；屏幕阅读器、200% 缩放与真机仍需人工验收。
