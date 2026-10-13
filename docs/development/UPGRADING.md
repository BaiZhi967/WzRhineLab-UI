# UPGRADING · 升级指南

本文面向已经在使用（源码直出期）或即将接入 `@wzrhine/*` 的项目，按版本列出**需要使用方动手**的变更。每个包的完整变更见各自的 CHANGELOG；本文只收集影响升级的条目，并给出改前 / 改后。

版本策略见 [RELEASING.md](RELEASING.md)：`0.x` 允许破坏性变更，但每一项都会出现在这里。五个包同一版本线；使用 Agent UI 时连同 `@wzrhine/agent-core` 与 `@wzrhine/agent` 一起升级。

## 升级前检查清单
1. 基础包升级到同一版本：`@wzrhine/tokens`、`@wzrhine/react`、以及使用了的话 `@wzrhine/effects`；使用 Agent UI 时再加入 `@wzrhine/agent-core` 与 `@wzrhine/agent`。
2. 运行类型检查。破坏性的 API 变化都会体现在类型上（例如被移除的 variant 会报错）。
3. 搜索下面每一节列出的关键字，逐项处理。
4. 打开应用，在浅色、深色和系统主题下各看一遍；有弹层（Dialog / AlertDialog / Drawer / Select / Menu / Popover / Toast）的页面请实际打开一次。

---

## 升到 0.1.0（首个发布版本，自源码直出期升级）

### 1. 样式需要显式导入（破坏性，ADR-0002）
组件入口不再自带 CSS。没有导入样式时，组件会以浏览器默认样式渲染。

```diff
+ import '@wzrhine/tokens/styles.css';
+ import '@wzrhine/react/styles.css';
+ import '@wzrhine/effects/styles.css'; // 仅在使用 effects 时
+ import '@wzrhine/agent/styles.css'; // 仅在使用 Agent UI 时，放在 react 样式之后
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
Dialog、AlertDialog、Drawer、Select、Tooltip、Popover、Menu、Toast 会挂载到 Provider 内的弹层节点，以继承主题和减动设置。放在 Provider 外时它们会退回到 `<body>`，失去主题。

```tsx
<RhineProvider theme="light">
  <App />
</RhineProvider>
```

嵌入到非 React 宿主页时，每个挂载点使用各自的 `RhineProvider`；主题、弹层与通知队列互不影响（见 [examples/host-embed](../../examples/host-embed)）。

### 4. 包只提供 ESM
`require('@wzrhine/react')` 不受支持。Node 中请使用 `import`；Jest 等仍使用 CJS 的工具需要开启 ESM 支持或改用 Vitest。

### 5. React Server Components
（M9.5 起已改变，见下文「0.1.0 基线之后」第 10 条。）0.1.0 基线的产物中没有 `"use client"` 指令，在 Next.js App Router 等 RSC 环境中需要在使用组件的边界文件顶部自行标注 `'use client'`。普通 SSR（`renderToString` / `renderToPipeableStream` + `hydrateRoot`）无需额外处理，见 [examples/ssr-hydrate](../../examples/ssr-hydrate)。

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

## 0.1.0 基线之后（M7–M12，尚未发布）
上面一节是 M6 时整理的 0.1.0 基线。之后 M7–M10 的变更仍在 `[Unreleased]` 中，首次发布时会一起归入 `0.1.0`；已经按 M6 基线以源码方式接入的项目，按本节处理。来源：[`@wzrhine/react` CHANGELOG](../../packages/react/CHANGELOG.md)、[`@wzrhine/effects` CHANGELOG](../../packages/effects/CHANGELOG.md)（`@wzrhine/tokens` 在 M7–M10 没有改动；M12 新增的 Agent 包见第 13 条）。没有破坏性的类型变化；需要动手的是下面标「行为变化」或「DOM 变化」的项。

### 1. 点击 Toast 操作后默认关闭（行为变化，M9）
过去点击「撤销」等操作按钮后通知仍停留，现在执行 `onClick` 后关闭该通知。

```diff
- toast.show({ title: '已归档', action: { label: '撤销', onClick: undo } }); // 依赖点击后仍停留
+ toast.show({ title: '已归档', action: { label: '撤销', onClick: undo, keepOpen: true } });
```

搜索关键字：`action:`、`useToast`。只想在点击后关闭的不用改。

### 2. 带操作的 Toast 至少停留 10 秒（行为变化，M9）
带 `action` 且没写 `timeout` 的通知，自动消失时间改为 `max(toastTimeout, 10000)`；`RhineProvider toastTimeout={0}` 时仍为 0。需要更短时显式传 `timeout`；`update()` 不套用这个下限。

### 3. `RecordHeader` 的位置路径改由 Breadcrumb 渲染（DOM 变化，M8）
外观、结构与语义不变，但 `<nav class="rl-record__trail">` 现在还带 `rl-breadcrumb` 类，内部元素带 `rl-breadcrumb__*` 类；`RecordTrailItem` 成为 `BreadcrumbItem` 的类型别名（字段兼容）。

- 用精确字符串 `class="rl-record__trail"` 匹配服务端 HTML 的，改为匹配类名本身。
- 样式里写了 `.rl-record__trail li` 等后代选择器的，改用 `.rl-breadcrumb__item` / `.rl-breadcrumb__link` / `.rl-breadcrumb__current`。

搜索关键字：`rl-record__trail`。

### 4. Button / DataTable / Stat 的内部元素多了类名（DOM 变化，M9）
Button 的加载指示、DataTable 的首次加载骨架与空状态、Stat 的加载骨架改由 Spinner / Skeleton / EmptyState 渲染。原有类名（`rl-button__spinner`、`rl-table__skeleton`、`rl-table__empty`、`rl-stat__skeleton` 等）保留，外观不变（既有视觉基线组件区域零差异），元素额外带 `rl-spinner` / `rl-skeleton` / `rl-empty` 类。

- 通常不用改。若宿主样式或测试快照里已经用到 `.rl-spinner`、`.rl-skeleton`、`.rl-empty` 这些名字，会同时命中这些内部元素，请改用自己的类名，或更新快照。
- DataTable 的空状态文字现在在单元格内居中（M8；此前因选择器特异性实际左对齐）。

### 5. `ToastProvider` 改为包装组件（M9，无需改动）
过去是 Base UI Toast Provider 的别名，现在是一个包装组件，属性不变，用来向下传递带操作通知的默认超时。只在代码里比较过 `ToastProvider === …` 引用、或依赖它与 Base UI 是同一个组件时才需要调整。`RhineProvider` 默认已挂载通知队列，一般不直接使用它。

### 6. 新增的样式分片自动包含（M7–M9，无需改动）
`forms.css`（M7）、`data.css`（M8）、`drawer.css`、`status.css`（M9）都由 `@wzrhine/react/styles.css` 引入，导入方式不变。只有把 `components.css` 单独复制出包的项目，需要连同同目录的全部分片一起复制。

### 7. `useRhineMotion()` 返回值增加字段（M10，类型新增）
返回值新增 `speed` 与 `resolve(kind, name)`；`get(name)` 行为不变（减动时一律 `instant`）。只有在测试里 mock 了 `useRhineMotion`、或自己实现 `RhineMotion` 类型的对象时，需要补上这两个字段。新代码按属性类型用 `resolve`（ADR-0007 §3）。减动下的淡入回退不再受 `MotionSpeed` 慢放影响，始终不超过 `fast`。

### 8. `@wzrhine/effects` 的行为调整（M10）
- `usePageVisible` / `useInViewport` 改为重新导出 `@wzrhine/react` 的实现，导入路径不变，无需改动。
- `OrbitalDiagram` 暂停（页面隐藏、离开视口）时保持当前角度，恢复后从该角度接续，不再回到 0°；新增 `data-lifecycle` / `data-paused` 属性。依赖「恢复后从 0° 开始」的截图或测试需更新。
- `ScanSurface` 在页面隐藏时立即结束本次扫描并触发 `onScanEnd`，隐藏期间请求的扫描不运行。
- `MotionPlayer` 的 Default / Slow / Interrupt 通道改为继承外层减动偏好（行为修复）：外层 `RhineProvider motion="reduce"` 或系统减动时，这些通道也不再有位移。

### 9. React 18 不再在 peer 声明中（破坏性，声明层面，M9.5，ADR-0008）
`@wzrhine/react` 与 `@wzrhine/effects` 的 peer 收窄为 `react` / `react-dom` `^19.0.0`。React 18 项目安装时会收到 peer 冲突提示。
- 迁移：升级到 React 19。项目此前从未正式支持 React 18，组件行为没有变化。
- 搜索关键字：`"react": "^18`。

### 10. 产物带 `'use client'`，服务端组件可以直接导入（M9.5，ADR-0008）
使用 React 的模块在产物首行带 `'use client'`。在 Next.js App Router 中：
- 可以删除只为了加 `'use client'` 而写的包装文件，直接从 `@wzrhine/react` 导入；
- 只接收可序列化 props 的组件可以直接在服务端组件中渲染，`RhineProvider` 可以放在根布局里；
- 需要函数 props 的组件（DataTable 的 `getRowId` / `cell`、各种 `onClick` / `onValueChange`）仍然要放在你自己的 `'use client'` 文件中，这是 RSC 的规则；
- `paginate`、`getPaginationItems`、`getMeterState` 可以在服务端调用。
完整示例见 [examples/next-app-router](../../examples/next-app-router)。

### 11. 默认文案可以整体替换（M9.5，ADR-0009，无需改动）
默认仍是中文，输出逐字不变。需要其他语言时给 `RhineProvider` 传 `messages`（例如内置的 `enUS`）、`locale` 与 `lang`，见 [locale.md](../components/locale.md)。已有的组件文案属性（`labels`、`cancelLabel`、`loadingText`…）优先级更高，继续生效。

### 12. 不用改、但值得知道
- 交互底座 Base UI 1.8.0 → 1.9.0（ADR-0001 修订），公开 API 无变化。
- `Dialog` 新增 `onCloseRequest(reason)`：返回 `false` 取消用户发起的关闭，用于「放弃未保存的更改？」。
- `DataTable` 新增 `status` / `onRetry` / `emptyAction` / `emptyDescription` / `pagination`（M8–M9）；不传时渲染结果与之前相同。
- `ToastOptions` 新增 `id`（同 id 原地更新），`ToastApi` 新增 `promise()`。
- 放在 `Form` 内且设置了 `name` 的 `Field` 会显示 `errors` 中对应的服务端错误（M7）。
- `ArchiveCard` 新增可选 `motion="identity"` 与 `ArchiveIdentity`，默认关闭。
- 新组件：M7 表单控件、M8 数据与导航、M9 覆盖层与反馈、M10 Motion Core（见 [COMPONENTS.md](../design/COMPONENTS.md)）。AlertDialog、Drawer 与其他弹层一样必须放在 `RhineProvider` 内（第 3 条）。

### 13. M12：新组件与两个新包（新增，无需改动）
- `@wzrhine/react` 新增 Collapsible、Accordion、Slider、NumberField、ContextMenu、Combobox、CommandPalette、FileDropZone、SplitButton、ScrollArea。新样式分片由 `styles.css` 自动引入，不改导入。
- 新包 `@wzrhine/agent-core` 与 `@wzrhine/agent`，只在使用 Agent 组件时安装，并额外导入 `@wzrhine/agent/styles.css`（放在 react 样式之后），见 [Agent 接入指南](../planning/agent-ui-adoption.md)。
- `RhineMessages` 新增命名空间（numberField、combobox、commandPalette、fileDropZone、splitButton、scrollArea 等）。若你维护**完整的**自定义文案表（类型标注为 `RhineMessages`），TypeScript 会提示补齐新字段；只传部分覆盖（`RhineMessagesOverrides`）的不受影响。
- `useRhineLocale()` 改为公开导出（agent 包使用它读取数字 locale）。
- 体积：只在同时导入全部组件时，`@wzrhine/react` 整包 gzip 由约 138 KB 增至约 182 KB；按需导入不受影响（[SIZE.md](SIZE.md)）。

---

## 以后的版本
每次发布时在这里追加一节，格式与上面相同：标题写目标版本；每项写明是否破坏性、搜索关键字和改前 / 改后。未列出的版本表示无需动手。

## 升到 0.2.0（Wpi 接入补齐，待发布）

- 五个包一起升级到 0.2.0。`react`、`effects`、`agent` 的 motion peer 为 `^14.0.0`，本仓验证使用 14.1.0；使用方应统一安装 motion 14.1.0，确保 React / motion 各一份。
- `@wzrhine/react` 新增公共图标入口 `@wzrhine/react/icons`，原创线性 SVG 的 viewBox 为 24×24、描边 1.75；原 AgentIcon 继续兼容。
- token 名称允许空格；历史草稿由 `reconcileTokens(value, bindings)` 与宿主绑定对账。
- 复制失败提示持续保留，直到下一次复制成功；不要额外用自动消失的 Toast 代替该错误。
- 新组件和 API 仍由现有 `styles.css` 包含，导入顺序保持 tokens → react → effects → agent。
