# ADR-0008 · M9.5 包的消费边界：React 版本、客户端边界、体积预算与 npm scope

- 状态：**Accepted** · 关联里程碑：M9.5 Ecosystem hardening
- 范围：`@wzrhine/tokens`、`@wzrhine/react`、`@wzrhine/effects` 被外部 React 应用安装和使用时的承诺
- 不在范围：第二个 headless 底座、Canvas / WebGL（M11）、实际发布（维护者决定暂不发布）

## 背景
三个包已经通过 `verify:packages` 在工作区之外安装、类型检查、SSR 和打包，但有四件事没有定论：

1. peer 声明写着 `react: ^18.2.0 || ^19.0.0`，维护者又决定「暂不正式支持 React 18」，声明和承诺不一致；
2. 组件依赖 hooks 与浏览器 API，在 Next.js App Router 等 React Server Components 环境中必须处于客户端边界内，但产物里没有 `'use client'` 指令，使用者只能自己再包一层；
3. 没有包体积基线，任何依赖或实现变化都可能悄悄让体积翻倍；
4. npm scope `@wzrhine` 尚不存在（2026-10-11 复核仍为 404）。

## 决策

### 1. React 版本：只承诺 React 19
- 正式支持：React 19（当前验证版本 19.3.0），配合 `motion` 12。
- **收窄 peer 声明**为 `react: ^19.0.0`、`react-dom: ^19.0.0`（`@wzrhine/react`、`@wzrhine/effects`），与「不正式支持 React 18」的维护者决定保持一致。保留宽声明而不验证，会让包管理器在 React 18 项目里静默安装、出问题时无从追溯。
- 源码目前只用了 React 18 也有的 API（`forwardRef`、`useSyncExternalStore`、`useId`），没有刻意排斥 React 18；将来如有真实需求，可以先补 React 18 的单测与 SSR 验证，再放宽声明（新 ADR）。
- `@types/react` 只在开发依赖中，不进入 peer。

### 2. 客户端边界：产物逐文件保留 `'use client'`
- 规则：`@wzrhine/react` 与 `@wzrhine/effects` 中**运行时使用 React 的模块**（`.tsx` 文件，或对 `react` / `motion/react` / `@base-ui/react*` 有非类型导入的文件）在源码首行写 `'use client';`。只导出常量、类型和纯函数的模块不写，服务端组件可以直接调用：`motion/presets.ts`、`utils/cx.ts`、两个入口 `index.ts`，以及从组件文件中拆出的 `components/pagination-utils.ts`（`paginate`、`getPaginationItems`）与 `components/meter-utils.ts`（`getMeterState`）。
- `tsc` 保留文件首行的指令字符串，产物 `dist/**/*.js` 天然带上指令。`verify:packages` 以源码为准做数据驱动的检查：源码带指令的文件在打包产物中首个语句也必须是指令，纯模块不得带。
- 入口 `index.js` 是纯 re-export，不写指令（打包工具按被引用模块的指令划分边界）。
- **服务端组件中的用法**（React Server Components 的硬规则：函数不能作为 props 从服务端传给客户端组件）：
  - 所有组件都可以在服务端组件中直接 `import`；
  - 只接收可序列化 props 的组件（`Button` 不带 `onClick`、`RecordHeader`、`Tabs`、`Alert`、`MetadataList` 等）可以直接在服务端组件中渲染；
  - 需要函数 props 的组件（`DataTable` 的 `getRowId` / `cell`、任何 `onClick` / `onValueChange`）放在使用者自己的 `'use client'` 文件中，服务端只传可序列化的数据（例如用 `paginate` 在服务端切好的行）；
  - 不为此改动组件 API（例如不给 DataTable 增加可序列化的 `rowIdKey`）；如有真实需求另立 ADR。
- 新增 `examples/next-app-router`（端口 4177）：Next.js App Router，根布局（服务端组件）直接渲染 `RhineProvider`，页面（服务端组件）直接渲染上面第二类组件并调用 `paginate`，DataTable 与交互岛放在示例自己的 `'use client'` 文件中。E2E 验证首屏 HTML 已渲染、水合无告警、弹层可用。示例依赖只在该示例中，不进入三个包。
  - 偏差：示例用 `next build --webpack`。工作区内的包导出 TypeScript 源码，源码之间以 `.js` 后缀互相导入，需要 `transpilePackages` 加 `experimental.extensionAlias`，而 Turbopack 不支持 `extensionAlias`。安装发布产物的使用者不需要这两项；「发布产物 + Turbopack」尚未验证。
- `@wzrhine/tokens` 只有 CSS 与常量，不需要指令。

### 3. 包体积基线与预算
- 新增 `scripts/size-check.mjs`（`pnpm size:check`），`release:check` 在 `verify:packages` 之后运行。度量方式：对已打包的 `dist` 用 esbuild（经 Vite 解析，不新增依赖）做生产压缩打包，peer 依赖 `react` / `react-dom` / `motion` 及其子路径（`react/jsx-runtime`、`motion/react`）视为外部依赖；`@base-ui/react` 与 `@wzrhine/tokens` 是真实依赖，计入体积；度量 effects 时 `@wzrhine/react` 也是外部依赖（它是 effects 的 peer）。统计 **gzip（level 9）后**字节数，说明见 [SIZE.md](../SIZE.md)。
- 度量条目（预算存于 `size-budget.json`，提交到仓库）：
  - `@wzrhine/react` 整个入口（全部组件）JS；
  - `@wzrhine/react` 只导入 `Button`（tree-shaking 是否生效）；
  - `@wzrhine/react` 只导入 `DataTable`；
  - `@wzrhine/react/styles.css`（压缩 + gzip）；
  - `@wzrhine/tokens/styles.css`；
  - `@wzrhine/effects` 整个入口 JS 与 `styles.css`。
- 预算 = 当前实测值向上取整到 1 KB 后再加约 10% 余量（`--update` 按此规则重写）。超出任一预算时 `size-check` 以非零码退出，`release:check` 失败；输出逐项的实测值、预算与差值。
- 另外三道检查同样会失败：预算与度量条目不一致；只导入 `Button` 的体积不小于整个入口的 25%（tree-shaking 失效）；打包结果中混入了 `packages/*/src`（量到了源码而不是产物）。
- 修改预算必须在 PR 中说明原因（新增组件、依赖升级等），并在 CHANGELOG 记录。

### 4. npm scope：保留 `@wzrhine`，暂不创建、不发布
- 包名维持 `@wzrhine/tokens`、`@wzrhine/react`、`@wzrhine/effects`，不改名（改名会波及全部文档、示例与导入路径）。
- 维护者决定暂不发布，因此本里程碑**不创建** scope、不运行 `npm publish`；`RELEASING.md` 的发布前置条件中保留「创建 scope 并确认归属」。
- 三个包继续 `private: true`。

## 后果
- **破坏性（声明层面）**：React 18 项目安装时会收到 peer 冲突提示。此前也从未承诺支持，CHANGELOG 与 UPGRADING 写明。
- 源码增加 `'use client'` 指令，对 Vite / 普通 SPA 无影响（Rollup 会提示指令被忽略，`verify:packages` 已经过滤该告警）。
- `release:check` 多一个体积门禁；预算文件成为评审对象。
- 仓库多一个 Next.js 示例及其开发依赖（只在 `examples/next-app-router` 中）。

## 验证方法
`verify:packages`（产物指令检查）、`size-check`（含一次「故意超预算」的反向验证）、`examples/next-app-router` 构建与 E2E、既有 `ssr-hydrate` 示例回归。结果记录在 `docs/development/acceptance/2026-10-11-m9.5.md`。
