# UPGRADING · 升级指南

本文面向已经在使用（源码直出期）或即将接入 `@wzrhine/*` 的项目，按版本列出**需要使用方动手**的变更。每个包的完整变更见各自的 CHANGELOG；本文只收集影响升级的条目，并给出改前 / 改后。

版本策略见 [RELEASING.md](RELEASING.md)：`0.x` 允许破坏性变更，但每一项都会出现在这里。三个包同一版本线，请一起升级。

## 升级前检查清单
1. 三个包升级到同一版本：`@wzrhine/tokens`、`@wzrhine/react`，以及使用了的话 `@wzrhine/effects`。
2. 运行类型检查。破坏性的 API 变化都会体现在类型上（例如被移除的 variant 会报错）。
3. 搜索下面每一节列出的关键字，逐项处理。
4. 打开应用，在浅色、深色和系统主题下各看一遍；有弹层（Dialog / Select / Menu / Popover / Toast）的页面请实际打开一次。

---

## 升到 0.1.0（首个发布版本，自源码直出期升级）

### 1. 样式需要显式导入（破坏性，ADR-0002）
组件入口不再自带 CSS。没有导入样式时，组件会以浏览器默认样式渲染。

```diff
+ import '@wzrhine/tokens/styles.css';
+ import '@wzrhine/react/styles.css';
+ import '@wzrhine/effects/styles.css'; // 仅在使用 effects 时
  import { Button } from '@wzrhine/react';
```

在应用入口（`main.tsx` 等）导入一次即可。SSR 应用在客户端入口导入。

### 2. `Button variant="primary"` 改为深墨色（破坏性，ADR-0003）
`primary` 原为橙底，现为深墨底；橙色改由新增的 `accent` 承担，每个视图建议只用一处。

```diff
- <Button variant="primary">开始扫描</Button>   {/* 想要橙色信号按钮 */}
+ <Button variant="accent">开始扫描</Button>
```

只是普通主操作的按钮不用改。搜索关键字：`variant="primary"`、`variant: 'primary'`。

### 3. 弹层必须在 `RhineProvider` 内
Dialog、Select、Tooltip、Popover、Menu、Toast 会挂载到 Provider 内的弹层节点，以继承主题和减动设置。放在 Provider 外时它们会退回到 `<body>`，失去主题。

```tsx
<RhineProvider theme="light">
  <App />
</RhineProvider>
```

嵌入到非 React 宿主页时，每个挂载点使用各自的 `RhineProvider`；主题、弹层与通知队列互不影响（见 [examples/host-embed](../../examples/host-embed)）。

### 4. 包只提供 ESM
`require('@wzrhine/react')` 不受支持。Node 中请使用 `import`；Jest 等仍使用 CJS 的工具需要开启 ESM 支持或改用 Vitest。

### 5. React Server Components
产物中没有 `"use client"` 指令。在 Next.js App Router 等 RSC 环境中，需要在使用组件的边界文件顶部自行标注 `'use client'`。普通 SSR（`renderToString` / `renderToPipeableStream` + `hydrateRoot`）无需额外处理，见 [examples/ssr-hydrate](../../examples/ssr-hydrate)。

### 6. 主题 token 已冻结为契约（M6）
`@wzrhine/tokens` 导出 `publicTokens` / `allPublicTokens`，列出全部 114 个公开 `--rl-*` 变量，测试保证 `tokens.css` 与之完全一致。
- 自定义样式只应引用契约中的变量。组件内部的 `--rl-button-*`、`--rl-toast-*` 等不属于契约，随时可能变化。
- 在 CSS-in-JS 或内联样式中可用 `tokenVar('--rl-accent')`：变量名拼错或被移除时会在编译期报错。
- 以后 token 被删除或重命名属于破坏性变更，会列在本文。

```ts
import { tokenVar } from '@wzrhine/tokens';
const style = { borderColor: tokenVar('--rl-border-strong') };
```

### 7. 宿主全局样式不再泄漏进组件（M6，行为修复）
以前宿主页面的 `button { text-transform: uppercase }`、`table, td { border; padding }`、后加载的 `* { box-sizing: content-box }` 等全局规则会改变组件外观。现在组件在自己的 `rl-` 类上复位这些属性。
- 通常不用改。若你曾经依赖宿主全局规则来「调整」组件（例如让按钮文字大写），这些写法将不再生效，请改为给组件传 `className` 并写带类名的规则。
- 宿主自身的样式不受影响（由 E2E 双向验证）。

### 8. 不再变化、但需要知道的约定
- 主题与密度只通过 `RhineProvider` 的 `theme` / `density` / `motion`，或等价的 `data-rl-theme` / `data-rl-density` / `data-rl-motion` 属性切换，不会写入 `:root`。
- `IconButton` 必须有 `label` 或 `aria-labelledby`（类型强制）。
- `DataTable` 的排序是受控的：组件只报告排序请求，行顺序由调用方提供。

---

## 以后的版本
每次发布时在这里追加一节，格式与上面相同：标题写目标版本；每项写明是否破坏性、搜索关键字和改前 / 改后。未列出的版本表示无需动手。
