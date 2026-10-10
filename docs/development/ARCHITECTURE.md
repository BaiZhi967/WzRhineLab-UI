# ARCHITECTURE · 目录与技术方案

## 目标结构
```text
WzRhineLab-UI/
├─ README.md / DESIGN.md / AGENTS.md
├─ docs/
│  ├─ design/          # STYLE / MOTION / COMPONENTS / ICONS / ACCESSIBILITY
│  ├─ development/     # ARCHITECTURE / CONTRIBUTING / QUALITY-GATES
│  ├─ concepts/        # 原创概念图与索引
│  ├─ research/        # 来源链接、许可风险、研究报告
│  └─ ROADMAP.md
├─ packages/
│  ├─ tokens/          # CSS 变量、主题值、语义层
│  ├─ react/           # React + TS 组件，无业务代码
│  ├─ agent/           # 可选 Agent UI 领域组件，无运行时/传输依赖
│  └─ effects/         # 可选展示动效与动效播放器（ADR-0004），react 包不依赖它
├─ apps/
│  └─ docs/            # Vite 文档 / Showcase；e2e/visual 为视觉回归基线
└─ examples/           # M6 示例应用：archive-desk / host-embed / ssr-hydrate，只用公开入口
```

## 依赖规则
- React >=18.2；Motion npm 包通过 `motion/react` 导入，避免混用历史 `framer-motion` 包名。
- TypeScript strict；pnpm workspace；CSS Variables 为样式权威；视觉主题 scope 到 `.rl-theme` 容器。
- docs 应用**可以**依赖 React 包与 Tokens；React 包只依赖 React/必要 headless 基础，独立可用；Tokens 不依赖 React。
- agent 包可以依赖 react、tokens 和 motion/react；agent 包不得依赖 Agent SDK、请求库、Tauri、MCP client 或具体后端协议；react 包不依赖 agent 包。
- WebGL、粒子、音效和复杂图表置于可选包/示例，禁止拉入基础 `Button` 的依赖链。
- 复杂可访问交互将在 M1 由 ADR 决定单一 headless 底座（Base UI / React Aria / Radix），不得无理由混用。
- 不把 React package 中的 CSS 注入全局原生元素；所有类名 `rl-` 前缀，主题采用 `data-rl-theme`。

## 产品 API
计划发布路径：@wzrhine/tokens、@wzrhine/react、@wzrhine/agent；agent 包仍处于规划阶段，内测包名需先核验 npm 占用情况。现在是源码工作区，**不是已发布 npm 包**。单组件可访问的命名导出，避免不透明 barrel 导出副作用。Style 与 Token 保留明确导入路径。

@wzrhine/agent 公开的是 view-model、actions、capabilities、renderer 和 slots。运行时事件、缓存、权限事实、文件系统、终端、窗口和路由属于消费项目。

## 发布与版本
- M0 阶段无自动 CI（避免不必要占用配额），本地运行检查是合并前必备门禁。
- M3 起先配置 workflow_dispatch 手动触发，再根据资源与权限决定是否开放 PR 自动检查。
- 首次推送不包含私有凭证、官方游戏截图、字体安装包、未授权素材。
- License 待确认；未确定之前不发布 public npm，也不声称项目 MIT。

