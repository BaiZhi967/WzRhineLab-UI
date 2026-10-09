# 示例应用（M6）

三个独立的小应用，用来验证组件库在真实集成方式下是否好用。它们只通过公开入口（`@wzrhine/react`、`@wzrhine/tokens` 及其 `styles.css`）使用组件库，不引用 Showcase 的任何代码。数据都是写死的示例，界面上标注为示例。

| 示例 | 集成方式 | 验证重点 | 命令 |
| --- | --- | --- | --- |
| [archive-desk](archive-desk) | 独立 SPA（Vite） | 新建 / 校验 / 搜索 / 排序 / 推进状态 / 删除确认，localStorage 持久化，主题切换与弹层主题继承 | `pnpm --filter @wzrhine/example-archive-desk dev` |
| [host-embed](host-embed) | 挂件嵌入非 React 旧页面 | 宿主带有敌意的全局 CSS（`:root` 同名变量、元素选择器、`* { box-sizing }`）；样式双向隔离、多实例独立主题与弹层、卸载后不留节点 | `pnpm --filter @wzrhine/example-host-embed dev` |
| [ssr-hydrate](ssr-hydrate) | 服务端渲染 + `hydrateRoot` | 首屏 HTML 完整且已带主题、无 JS 可读；水合不产生不匹配或控制台告警；水合后弹层、Tabs、Toast、Tooltip 正常 | `pnpm --filter @wzrhine/example-ssr-hydrate build && pnpm --filter @wzrhine/example-ssr-hydrate preview` |

验收：`pnpm build:examples`（包含在 `pnpm check` 中）与 `pnpm test:examples`（三个 Playwright 套件依次运行，端口 4174 / 4175 / 4176）。

SSR 示例的 `server.mjs` 只监听 `127.0.0.1`，没有任何鉴权，只用于本地演示，不要部署到公网。
