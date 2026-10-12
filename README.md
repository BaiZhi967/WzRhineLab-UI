# WzRhineLab UI

面向 React + Motion 的原创科研机构 / 档案终端风格设计系统。

> 设计灵感来自《明日方舟》莱茵生命的科研机构、档案、航天信息表达，但本项目非官方项目，不使用原作的商标、标识、人物、专有素材或原始 UI 资源。完整声明见[免责声明与商标归属](#免责声明与商标归属)。

## 当前阶段

- **M12 — Advanced interaction + Agent UI（已完成）**：交付 React 高级交互组件、框架无关的 `@wzrhine/agent-core`、React Agent UI `@wzrhine/agent`、Agent 工作台 Showcase 与 `agent-console` 示例（见 [M12 验收记录](docs/development/acceptance/2026-10-11-m12.md)）。
- **M13 — Rhine domain patterns 与 Wpi-Agent 真实接入（下一道门禁）**：当前主线重点是把 Agent UI 接入真实 Wpi-Agent 消费页面，并继续实现 InstrumentPanel、EvidencePanel、MetricPanel、ExperimentTimeline 等 Rhine 领域模式。M13 尚未完成，真实消费项目验收是关闭条件（见 [长期路线图](docs/planning/roadmap.md#m13-rhine-domain-patterns)）。
- **M11 — Rendering Lab（延期的独立实验）**：维护者决定先交付 M12，因此 M11 没有成为 M12 的前置条件；它保留为 Planned，用于用可复现实验证据决定是否需要 Canvas / 其他渲染适配器，也不阻塞 M13。排期关系见 [ROADMAP](docs/ROADMAP.md)。
- **后续 M14–M15**：M14 负责屏幕阅读器、200% 缩放、真机、RTL 与 locale 等人工验收；M15 才处理许可证、npm scope、版本、changelog 和公开发布门禁。
- **已发布到 npm**：`0.1.0`（2026-10-12）已发布 `@wzrhine/tokens`、`@wzrhine/react`、`@wzrhine/effects`、`@wzrhine/agent-core`、`@wzrhine/agent`（见 [RELEASING](docs/development/RELEASING.md)）。许可证 MIT。只支持 React 19（ADR-0008）。
- 规范入口：[docs/README.md](docs/README.md)、[DESIGN.md](DESIGN.md)、[docs/ROADMAP.md](docs/ROADMAP.md)。
- 原型画板：[docs/concepts/README.md](docs/concepts/README.md)。

## 技术方向

React 19 · TypeScript · Motion (`motion/react`) · CSS Variables / Semantic Tokens · pnpm workspace · Vite。基础交互优先使用原生语义与已验证的 headless primitives，不重复实现复杂焦点管理。

## 使用与状态

初期用于设计规范校准、交互实验和文档演示；M12 已交付可复用的 Agent UI，但 M13 的真实 Wpi-Agent 消费页面和 M14 的人工验收仍未完成。开发前请阅读 [AGENTS.md](AGENTS.md) 与 [docs/development/CONTRIBUTING.md](docs/development/CONTRIBUTING.md)。

## 包与 API 规模

以下数字来自自动生成的 [API reports](docs/README.md#额外资料与导入)，不是概念图册中的提案数量：

| workspace 包 | API report 导出 | 其中组件导出 |
| --- | ---: | ---: |
| `@wzrhine/tokens` | 34 | — |
| `@wzrhine/react` | 265 | 73 |
| `@wzrhine/effects` | 24 | 5 |
| `@wzrhine/agent-core` | 128 | — |
| `@wzrhine/agent` | 377 | 84 |

`@wzrhine/react` 的 [COMPONENTS.md](docs/design/COMPONENTS.md) 另外按设计族归并为 52 个主组件族；该归并不计子部件、`RhineProvider` 与 Motion 工具，所以不能与 API report 的 73 个组件导出直接等同。Agent UI 的概念图册有 46 个概念条目，实际 `@wzrhine/agent` API report 已包含 84 个组件导出。

五个包已发布 `0.1.0` 到 npm（`@wzrhine` scope，public access）；未发布的 workspace 版本仅供本仓库内部使用。

## 本地运行

需要 Node.js 20.19+，并启用 Corepack / pnpm 10：

```sh
corepack enable
pnpm install
pnpm dev            # Showcase：http://127.0.0.1:5173
pnpm check          # typecheck + 单元测试 + 构建
pnpm test:e2e       # Playwright（Chromium）：响应式截图、键盘、axe、减动
pnpm test:e2e:all   # 同一套件依次在 Chromium、Firefox、WebKit 上运行
pnpm test:examples  # 示例应用的 E2E（test:examples:all 为三内核）
pnpm test:visual    # 视觉回归基线；有意的视觉变更用 test:visual:update 更新
pnpm release:check  # 发布门禁：check + API 漂移 + 许可证审计 + 临时项目安装验证
```

首次运行 E2E 前如未安装浏览器：`pnpm --filter @wzrhine/showcase exec playwright install chromium firefox webkit`。

在应用中使用 React 组件时需显式导入样式（入口无 CSS 副作用，见 [ADR-0002](docs/development/adr/0002-source-exports-and-style-entry.md)）：

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import { Button, RhineProvider } from '@wzrhine/react';

<RhineProvider theme="light">
  <Button variant="primary">保存记录</Button>
</RhineProvider>
```

使用 Agent UI 时，在 React 样式之后再导入：

```tsx
import '@wzrhine/agent/styles.css';
import { AgentShell } from '@wzrhine/agent';
```

`RhineProvider` 提供 `.rl-theme` 作用域、弹层挂载点、减动策略和通知队列（`useToast()`）；所有弹层组件都必须放在它内部才能拿到主题。

组件分类、子部件和未实现候选见 [COMPONENTS.md](docs/design/COMPONENTS.md)。完整签名以 [`@wzrhine/react` API report](docs/api/react.md)、[`@wzrhine/agent-core` API report](docs/api/agent-core.md) 和 [`@wzrhine/agent` API report](docs/api/agent.md) 为准；集成方式参考 [examples/](examples/README.md)：独立 SPA、嵌入非 React 旧页面、SSR 水合。从源码直出期升级请看 [UPGRADING.md](docs/development/UPGRADING.md)。

## 免责声明与商标归属

- 本项目（WzRhineLab-UI 及 `@wzrhine/*` 各包）是维护者个人开发的**非官方、非商业**开源组件库，用于设计研究与工程实践，与鹰角网络（Hypergryph）及《明日方舟》（Arknights）官方**不存在任何关联、合作或背书**。
- 「明日方舟」「Arknights」「莱茵生命（Rhine Lab）」及相关名称、商标与角色形象归**鹰角网络**所有。本项目命名与视觉气质是对原作科研机构 / 档案美学的致敬，不代表任何官方身份。
- 仓库内的代码、组件实现、设计令牌与文档均为原创；概念图为自行生成的研究素材，不包含、不再分发任何原作的界面资源、图片、字体或音频。
- 设计研究引用的公开资料与社区项目见 [REFERENCES](docs/research/REFERENCES.md)，其权利归各自作者所有。

## 视觉原件与参考资料

- [高保真 PNG 概念图索引](docs/concepts/README.md)：八张 PNG 已入库，为唯一视觉参考；不再使用简化 SVG 草图。
- [原始图片和研究 PDF 清单](docs/research/ASSET-MANIFEST.md)：8 PNG / 8 WebP / 研究 PDF。
- [研究摘要](docs/research/RESEARCH-SUMMARY.md) 与 [参考链接](docs/research/REFERENCES.md)。

## 设计与工程状态

M0–M10、M9.5 与 M12 都有验收记录；M13 的真实 Wpi-Agent 消费页面、M14 的人工可访问性验收和 M15 的发布审批仍未关闭。源代码采用 MIT 许可证（根目录与五个包各带 `LICENSE`）；未配置自动 GitHub Actions（避免配额消耗）。Chromium、Firefox、WebKit 的自动化验收已通过，屏幕阅读器、200% 缩放与真机仍需人工验收。
