# 示例应用（M6 / M9.5）

四个独立的小应用，用来验证组件库在真实集成方式下是否好用。它们只通过公开入口（`@wzrhine/react`、`@wzrhine/tokens` 及其 `styles.css`）使用组件库，不引用 Showcase 的任何代码。数据都是写死的示例，界面上标注为示例。

| 示例 | 集成方式 | 验证重点 | 命令 |
| --- | --- | --- | --- |
| [archive-desk](archive-desk) | 独立 SPA（Vite） | 新建 / 校验 / 搜索 / 排序 / 推进状态 / 删除确认，localStorage 持久化，主题切换与弹层主题继承 | `pnpm --filter @wzrhine/example-archive-desk dev` |
| [host-embed](host-embed) | 挂件嵌入非 React 旧页面 | 宿主带有敌意的全局 CSS（`:root` 同名变量、元素选择器、`* { box-sizing }`）；样式双向隔离、多实例独立主题与弹层、卸载后不留节点 | `pnpm --filter @wzrhine/example-host-embed dev` |
| [ssr-hydrate](ssr-hydrate) | 服务端渲染 + `hydrateRoot` | 首屏 HTML 完整且已带主题、无 JS 可读；水合不产生不匹配或控制台告警；水合后弹层、Tabs、Toast、Tooltip 正常 | `pnpm --filter @wzrhine/example-ssr-hydrate build && pnpm --filter @wzrhine/example-ssr-hydrate preview` |
| [next-app-router](next-app-router) | Next.js 16 App Router（React Server Components） | 服务器组件页面直接 `import` 组件与纯函数 `paginate`（无包装文件）；`RhineProvider` 在根布局；首屏 HTML 已含组件标记，水合零控制台告警；客户端岛（AlertDialog + Toast）焦点与主题正确；axe 0 违规 | `pnpm --filter @wzrhine/example-next-app-router build && pnpm --filter @wzrhine/example-next-app-router start` |

验收：`pnpm build:examples`（包含在 `pnpm check` 中）与 `pnpm test:examples`（四个 Playwright 套件依次运行，端口 4174 / 4175 / 4176 / 4177）。

SSR 示例的 `server.mjs` 只监听 `127.0.0.1`，没有任何鉴权，只用于本地演示，不要部署到公网。

Next.js 示例的使用要点（ADR-0008 §2）：

- 只接收可序列化 props 的组件（`Button`、`RecordHeader`、`Tabs`、`Alert`、`MetadataList` 等）可以直接在服务器组件中渲染；需要函数 props 的组件（`DataTable` 的 `getRowId` / `cell`、`onClick`、`onConfirm`、`useToast`）放在使用者自己的 `'use client'` 文件中（本例的 `app/samples-table.tsx`、`app/actions.tsx`）。纯函数 `paginate`、`getPaginationItems`、`getMeterState` 可以在服务器上调用。
- 工作区内包导出的是 TypeScript 源码，源码内部用 `.js` 后缀互相导入，所以 `next.config.ts` 需要 `transpilePackages` 和 `experimental.extensionAlias`；Turbopack 不支持 `extensionAlias`，因此本例用 `next build --webpack`。安装发布产物（`dist/*.js`，已是带 `.js` 的编译结果）的项目不需要这两项；产物配合 Turbopack 尚未在本仓库验证。
- `.next/` 与 Next 生成的 `next-env.d.ts` 不入库（按 Next 16 文档建议）；`typecheck` 脚本先运行 `next typegen` 重新生成。`next start` 只监听 `127.0.0.1`，同样只用于本地演示。Playwright 的 webServer 设置了 `NEXT_TELEMETRY_DISABLED=1`；手动运行时如需关闭遥测请自行设置该环境变量。
