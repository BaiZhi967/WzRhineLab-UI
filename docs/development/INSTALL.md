# INSTALL · 安装、导出与样式导入

三个包目前都是 `private`，**尚未发布到 npm**（维护者决定，ADR-0008 §4）。下面的写法与发布后的用法一致；在本仓库内通过 `workspace:*` 引用即可试用，示例应用就是这样接入的。

## 1. 安装
| 包 | 用途 | 依赖（随包安装） | peer（由使用方安装） |
| --- | --- | --- | --- |
| `@wzrhine/tokens` | `--rl-*` 设计变量、token 清单、对比度工具 | — | — |
| `@wzrhine/react` | 组件、`RhineProvider`、Motion Core、默认文案表 | `@base-ui/react`（精确版本）、`@wzrhine/tokens` | `react` `^19`、`react-dom` `^19`、`motion` `^12` |
| `@wzrhine/effects` | 可选展示动效（解密、扫描、轨道、动效播放器） | — | `@wzrhine/react`（同版本线）、`react` / `react-dom` `^19`、`motion` `^12` |

```sh
pnpm add @wzrhine/react @wzrhine/tokens react react-dom motion
pnpm add @wzrhine/effects   # 可选
```

只支持 React 19（ADR-0008 §1）。三个包同一版本线，请一起升级（[UPGRADING.md](UPGRADING.md)）。

## 2. 导出
发布产物只提供 ESM（`dist/*.js` + `.d.ts` + source map），`sideEffects` 只声明 CSS。

| 包 | 子路径 | 内容 |
| --- | --- | --- |
| `@wzrhine/tokens` | `.` | `publicTokens`、`motionDurations` / `motionEasings`、`contrastRatio` 等（[API](../api/tokens.md)） |
| | `./styles.css` | 全部 `--rl-*` 变量，作用域为 `.rl-theme`，不写 `:root` |
| `@wzrhine/react` | `.` | 全部组件与 hooks（[API](../api/react.md)）；无 CSS 副作用 |
| | `./styles.css` | 组件样式入口，自动 `@import` 八个分片 |
| `@wzrhine/effects` | `.` | 展示动效（[API](../api/effects.md)） |
| | `./styles.css` | 动效样式 |

`./package.json` 也在导出中，便于工具读取版本。没有其他子路径：不要从 `dist/components/…` 深层导入，它们不属于公开 API。

## 3. 样式导入
入口没有 CSS 副作用（ADR-0002），在应用入口显式导入一次：

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/effects/styles.css'; // 仅在使用 effects 时
```

- 顺序：tokens 在前。组件样式只用 `rl-` 类与 `--rl-*` 变量，不污染宿主的全局标签；宿主自己的全局样式不会泄漏进组件（`reset.css`，`examples/host-embed` 双向验证）。
- 所有组件放在 `RhineProvider` 内：它渲染 `.rl-theme` 作用域、弹层挂载点、减动策略、通知队列和默认文案（[overlays.md](../components/overlays.md#rhineprovider)、[locale.md](../components/locale.md)）。
- 字体：tokens 只声明字体栈，不内置字体文件（[THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md)）。

## 4. 不同运行环境
| 环境 | 做法 | 验证 |
| --- | --- | --- |
| Vite / 普通 SPA | 按上文导入即可 | [examples/archive-desk](../../examples/archive-desk) |
| 嵌入非 React 旧页面 | 每个挂载点一个 `createRoot` + `RhineProvider`，可各自设置主题 | [examples/host-embed](../../examples/host-embed) |
| SSR（`renderToString` / `hydrateRoot`） | 服务端与客户端渲染同一棵树；不需要额外配置 | [examples/ssr-hydrate](../../examples/ssr-hydrate) |
| Next.js App Router（RSC） | 可在服务端组件中直接导入；需要函数 props 的组件放在自己的 `'use client'` 文件中（ADR-0008 §2） | [examples/next-app-router](../../examples/next-app-router) |

在本仓库内用 Next.js 引用**源码**（`workspace:*`）时，需要 `transpilePackages` 与 `experimental.extensionAlias`，并以 `next build --webpack` 构建（见示例的 `next.config.ts`）；安装发布产物时不需要。

## 5. 体积
每个入口的 gzip 体积与预算见 [SIZE.md](SIZE.md)。只导入单个组件时，打包工具会摇掉其余组件（`size:check` 检查只导入 `Button` 的体积不到全量入口的 25%）。
