# ARCHITECTURE · 目录与技术方案

## 目录结构（2026-10-11，M10 合入后的 main）
```text
WzRhineLab-UI/
├─ README.md / DESIGN.md / AGENTS.md
├─ package.json / pnpm-workspace.yaml / tsconfig.base.json / .editorconfig
├─ docs/
│  ├─ README.md        # 文档导航
│  ├─ ROADMAP.md       # 里程碑摘要；M11 起的长期规划在 planning/roadmap.md
│  ├─ design/          # STYLE / MOTION / MOTION-PATTERNS / COMPONENTS / ICONS / ACCESSIBILITY
│  ├─ components/      # 组件使用说明（按组件族分文件）
│  ├─ api/             # 六个包的 API 参考，由 `pnpm api:report` 从 .d.ts 生成
│  ├─ development/     # ARCHITECTURE / CONTRIBUTING / QUALITY-GATES / RELEASING / UPGRADING / INSTALL / SIZE / THIRD-PARTY-LICENSES
│  │  ├─ adr/          # ADR-0001 … 0014
│  │  └─ acceptance/   # 每个里程碑的验收记录
│  ├─ roadmap/         # 当前权威路线：阶段目标、架构、0.3.0 计划与合同、执行清单
│  ├─ planning/        # 历史背景：旧 M 系列规划、各领域规划、需求模板
│  ├─ concepts/        # 原创概念图与索引（images/ 下 8 PNG + 8 WebP）
│  └─ research/        # 来源链接、许可风险、研究报告 PDF
├─ packages/
│  ├─ tokens/          # @wzrhine/tokens：tokens.css、manifest、contract（公开 token 契约）、contrast
│  ├─ react/           # @wzrhine/react：组件、Provider、Motion Core，无业务代码
│  ├─ patterns/        # @wzrhine/patterns：页面模式（layout / collection / record），peer 依赖 react 包（ADR-0014）
│  ├─ content/         # @wzrhine/content：Markdown 内容渲染、标题索引与代码块（0.3.0 / R2）
│  ├─ editor/           # @wzrhine/editor：Markdown 源码编辑合同、预览和可选 CodeMirror adapter（0.3.0 / R4）
│  └─ effects/         # @wzrhine/effects：可选展示动效与动效播放器（ADR-0004），react 包不依赖它
├─ apps/
│  └─ docs/            # @wzrhine/showcase：Vite 文档 / Showcase；e2e/ 为三内核 E2E，e2e/visual 为视觉回归基线（121 项，win32 Chromium）
├─ examples/           # 示例应用，只用公开入口：archive-desk / host-embed / ssr-hydrate（M6），next-app-router（M9.5，端口 4177）
├─ size-budget.json    # size:check 的 gzip 预算（ADR-0008 §3）
└─ scripts/            # build-package、api-report、docs-index、license-audit、verify-packages、size-check、release、import-visual-assets.ps1
```

M12 新增两个包（[ADR-0010](adr/0010-m12-agent-ui-plan.md)）：

```text
packages/
├─ agent-core/         # @wzrhine/agent-core：Agent view-model、状态轴、状态元数据、纯函数（无 React / DOM / 依赖）
│  └─ src/contracts/ · src/helpers/
└─ agent/              # @wzrhine/agent：Agent UI 组件（peer @wzrhine/react），重新导出 agent-core
   └─ src/
      ├─ components/{shell,conversation,message,process,tools,composer,intervention,workspace,artifact}/
      ├─ primitives/   # AgentIcon、StatusGlyph、AgentStatus、AgentSpark
      ├─ motion/       # Agent 动效层（ADR-0012）
      ├─ provider/     # AgentMessagesProvider、文案表 messages/*.ts（agent 源码中唯一允许 CJK 的位置）
      ├─ styles/*.css  # 由 agent.css（`./styles.css`）统一引入
      └─ fixtures/     # 测试与 Showcase 共用的示例会话（不进入构建产物）
```

### `packages/react/src` 布局
```text
packages/react/src/
├─ index.ts            # 唯一入口，只导出 JS（无 CSS 副作用，ADR-0002）
├─ components/         # 每个组件一个 .tsx（首行 'use client'）；fieldParts.tsx 为 Field 与选择控件共用的标签 / 错误部件；pagination-utils.ts、meter-utils.ts 为不带指令的纯函数
├─ provider/           # RhineProvider.tsx（.rl-theme 作用域、MotionConfig、Tooltip 延迟、通知队列、messages / locale / lang）、portal.ts（弹层挂载点 usePortalContainer）、messages.tsx（默认文案表 zhCN / enUS，组件中唯一允许出现中文的源码文件，ADR-0009）
├─ motion/             # Motion Core（ADR-0007）
│  ├─ presets.ts       # duration / ease / transition / pressScale / fadePresence，数值来自 @wzrhine/tokens
│  ├─ resolve.tsx      # resolveMotion（按属性类型减动）、MotionSpeed / useMotionSpeed
│  ├─ useRhineMotion.ts # 组件内唯一入口：reduced / speed / get / resolve
│  ├─ presence.tsx     # MotionPresence、RhineMotionGroup / RhineMotionItem
│  ├─ lifecycle.ts     # useMotionLifecycle、useLatestGuard
│  └─ visibility.ts    # usePageVisible、useInViewport（全库唯一可见性来源，effects 重新导出）
├─ utils/cx.ts
├─ components.css      # 样式入口（`./styles.css`）：依次 @import 下列分片，再写基础组件样式
├─ reset.css           # 宿主全局样式隔离（M6）
├─ overlays.css        # Tabs、Tooltip、Dialog、Select、Provider 挂载点
├─ feedback.css        # Popover、Menu、Toast
├─ archive.css         # RecordHeader、MetadataList、StatusIndicator、ArchiveCard、Timeline、DataTable、VisuallyHidden
├─ forms.css           # Textarea、Checkbox、Radio、Switch、选择组、Fieldset、Separator
├─ data.css            # Breadcrumb、Pagination、Progress、Meter、Stat、DataTable 状态
├─ drawer.css          # Drawer、AlertDialog
└─ status.css          # Alert、Callout、EmptyState、Skeleton、Spinner
```
分片都只用 `rl-` 类与 `--rl-*` tokens（package-boundary 测试禁止字面颜色与 px）；使用方只导入 `@wzrhine/react/styles.css`，新增分片由 `components.css` 自动引入。

## 依赖规则
- React 19（peer `^19.0.0`，ADR-0008）；Motion npm 包通过 `motion/react` 导入，避免混用历史 `framer-motion` 包名。
- 运行时使用 React 的模块首行写 `'use client'`，纯函数 / 常量模块不写（ADR-0008 §2，`verify:packages` 检查）。
- TypeScript strict；pnpm workspace；CSS Variables 为样式权威；视觉主题 scope 到 `.rl-theme` 容器。
- docs 应用**可以**依赖 React 包与 Tokens；React 包只依赖 React/必要 headless 基础，独立可用；Tokens 不依赖 React。
- agent 包 peer 依赖 `@wzrhine/react`、react、motion，依赖 `@wzrhine/agent-core`、`@wzrhine/tokens`、`@base-ui/react`（同一精确版本）；不得依赖 Agent SDK、请求库、Tauri、MCP client、Markdown / 高亮 / 图标库或具体后端协议（`packages/agent/test/package-boundary.test.ts` 强制）；agent-core 没有任何运行时依赖；react 包不依赖 agent 包。
- patterns 包 peer 依赖 `@wzrhine/react`、react、react-dom、motion，运行时只依赖 `@wzrhine/tokens`；不得直接依赖 Base UI 或 agent 系列（通过 `@wzrhine/react` 组合），中文字面量只允许出现在 `src/provider/PatternMessages.tsx`（`packages/patterns/test/package-boundary.test.ts` 强制，ADR-0014 §3、§5）。
- content 包 peer 依赖 `@wzrhine/react`、react、react-dom、motion，运行时依赖 `@wzrhine/tokens`、`react-markdown`、`remark-gfm`；不得依赖 Base UI、agent、文件系统、网络客户端或编辑器内核，原始 HTML 默认关闭，中文字面量只允许出现在 `src/provider/ContentMessages.tsx`（`packages/content/test/package-boundary.test.ts` 强制，ADR-0016）。
- editor 包根入口保持 engine-neutral，peer 依赖 `@wzrhine/react`、react、react-dom、motion 和可选 CodeMirror 6；运行时依赖 `@wzrhine/content`、`@wzrhine/tokens`，只有 `./codemirror` 子路径加载 CodeMirror。Markdown 原文、保存状态和冲突策略由宿主持有，不读取文件或网络，也不建立 WYSIWYM 文档模型。
- WebGL、粒子、音效和复杂图表置于可选包/示例，禁止拉入基础 `Button` 的依赖链。
- 复杂可访问交互的单一 headless 底座已由 [ADR-0001](adr/0001-headless-primitives.md) 选定 Base UI（`@base-ui/react` 1.9.0，精确锁定），不与 React Aria / Radix 混用。
- 不把 React package 中的 CSS 注入全局原生元素；所有类名 `rl-` 前缀，主题采用 `data-rl-theme`。

## 产品 API
发布路径：@wzrhine/tokens、@wzrhine/react、@wzrhine/patterns、@wzrhine/content、@wzrhine/editor、@wzrhine/effects、@wzrhine/agent-core、@wzrhine/agent（发布顺序同此，依赖在前）。`@wzrhine/content` 与 `@wzrhine/editor` 属于候选开发包，完成真实构建、安装和验收前不能声称已发布。单组件可访问的命名导出，避免不透明 barrel 导出副作用。Style 与 Token 保留明确导入路径。

@wzrhine/agent 公开的是 view-model、actions、capabilities、renderer 和 slots。运行时事件、缓存、权限事实、文件系统、终端、窗口和路由属于消费项目。

## 发布与版本
- M0 阶段无自动 CI（避免不必要占用配额），本地运行检查是合并前必备门禁。
- M3 起先配置 workflow_dispatch 手动触发，再根据资源与权限决定是否开放 PR 自动检查。
  - 现状（2026-10-14，M13 后）：有一个经维护者批准的 `.github/workflows/pages.yml`，只做 Showcase → GitHub Pages 部署（`apps/docs`、`packages` 或 lockfile 变化时触发，另有 `workflow_dispatch`），**不运行测试、也不发布 npm**。测试门禁仍是本地的 `pnpm release:check` 与三内核 E2E，结果写入验收记录；新增或改动任何 workflow 都需维护者批准（AGENTS.md）。
- 首次推送不包含私有凭证、官方游戏截图、字体安装包、未授权素材。
- License：2026-10-12 定为 MIT（版权人 WhiteZhi），当时的五个可发布包各有一份 `LICENSE` 并自同日发布到 public npm（最新发布版本 0.2.0）。0.3.0 新增 `@wzrhine/patterns` 后为六份，七个 `package.json` 的 `license` 字段均为 `"MIT"`；patterns 随 0.3.0 一同发布。
