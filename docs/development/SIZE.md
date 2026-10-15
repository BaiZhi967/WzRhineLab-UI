# SIZE · 包体积基线与预算

依据 ADR-0008 §3。`pnpm size:check`（`scripts/size-check.mjs`）是 `release:check` 的最后一步，预算存于仓库根目录的 `size-budget.json`。

## 怎么量
1. 先执行 `pnpm build:packages`，量的是 `packages/*/dist` 产物，不是源码。`--no-build` 跳过构建，直接量现有 `dist`。
2. `@wzrhine/*` 按各包 `publishConfig.exports` 解析到 `dist/`（工作区内的 `exports` 指向 `src/`，这里不用）。如果打包结果里混进了 `packages/*/src/`，脚本直接失败。
3. 每个 JS 条目在系统临时目录生成一个只有一行的入口文件，用 esbuild 打包：`bundle`、`minify`、`format: 'esm'`、`platform: 'browser'`、`treeShaking`，`process.env.NODE_ENV` 定义为 `"production"`。
   - 外部依赖（使用方本来就有的 peer）：`react`、`react-dom`、`react/*`、`react-dom/*`、`motion`、`motion/*`。
   - **计入体积**：`@base-ui/react`（以及它依赖的 `@floating-ui/*` 等）和 `@wzrhine/tokens`，因为它们是随包安装、最终打进用户应用的真实依赖。
   - `effects-full`、`agent-full` 与三个 `patterns-*` JS 条目额外把 `@wzrhine/react` 视为外部依赖（它是这些包的 peer，费用已计入 `react-*` 条目）。
   - `'use client'` 指令（ADR-0008 §2）不影响度量：esbuild 0.25.12 打包这些文件时不产生告警（已实测），脚本仍把 `module-level-directive` 设为静默，以防将来版本像 Rollup 那样报告。
4. CSS 条目用 esbuild 的 CSS 打包，会跟随 `@import` 把全部分片合并后压缩。
5. 输出用 `zlib.gzipSync`（level 9）压缩，同时报告压缩后（minified）与 gzip 两个字节数。**门禁只看 gzip。**

esbuild 通过 Vite（`apps/docs` 的依赖）解析，没有新增依赖；当前版本 0.25.12。

| 条目 | 入口 |
| --- | --- |
| `react-full` | `export * from '@wzrhine/react'` |
| `react-button` | `export { Button } from '@wzrhine/react'` |
| `react-datatable` | `export { DataTable } from '@wzrhine/react'` |
| `react-css` | `@wzrhine/react/styles.css`（含 12 个 `@import` 分片） |
| `tokens-css` | `@wzrhine/tokens/styles.css` |
| `patterns-full` | `export * from '@wzrhine/patterns'`（`@wzrhine/react` 是 peer，视为外部依赖） |
| `patterns-list-detail` | `export { ListDetail } from '@wzrhine/patterns'` |
| `patterns-query-toolbar` | `export { QueryToolbar } from '@wzrhine/patterns'` |
| `patterns-css` | `@wzrhine/patterns/styles.css`（含三个 `@import` 分片） |
| `effects-full` | `export * from '@wzrhine/effects'` |
| `effects-geometry` | `export { createEffectPath } from '@wzrhine/effects'`（纯几何隔离检查） |
| `effects-signal` | `export { SignalPath } from '@wzrhine/effects'` |
| `effects-calibration` | `export { CalibrationReticle } from '@wzrhine/effects'`（不得带入锚点测量） |
| `effects-reveal` | `export { ArchiveReveal } from '@wzrhine/effects'`（存量效果隔离对照） |
| `effects-css` | `@wzrhine/effects/styles.css` |
| `agent-core` | `export * from '@wzrhine/agent-core'` |
| `agent-full` | `export * from '@wzrhine/agent'`（`@wzrhine/react` 是 peer，视为外部依赖） |
| `agent-status` | `export { AgentStatus } from '@wzrhine/agent'`（tree-shaking 检查） |
| `agent-css` | `@wzrhine/agent/styles.css`（含十个 `@import` 分片） |

## 失败条件
- 任一条目 gzip 体积 > 预算：逐项输出超出的字节数。
- 有度量但 `size-budget.json` 中没有预算，或有预算但脚本不再度量（改名或删除条目时必须同步预算文件）。
- tree-shaking 检查：`react-button` 的 gzip 体积必须小于 `react-full` 的 25%，`agent-status` 必须小于 `agent-full` 的 25%。超过说明只导入一个组件就拉进了大半个包（检查 `sideEffects` 和模块顶层副作用）。
  patterns 暂不设此配对：全量入口只有 5.52 KB，而共享文案 Provider 对每个组件都是约 1 KB 的固定开销，单组件占比落在 24.3%（query-toolbar）到 28.4%（list-detail），比值在这个包体量下说明不了 tree-shaking 是否有效。四个 patterns 条目的绝对体积照常受预算约束；若文案表将来按命名空间拆分、或包体增长到比值有意义时再评估。
- `pnpm build:packages` 失败：什么都不量，直接失败。

## MFX-01 增量（未发布）

2026-10-15 新构建实测：effects-full 6.77 KB gzip（新增真实锚点、纯几何、受控进度与三个效果），预算由 5 KB 调至 8 KB；CSS 1.92 KB，保留 3 KB 预算。独立 geometry 0.29 KB、signal 2.77 KB、calibration 1.19 KB、存量 reveal 1.34 KB，按同一向上取整规则分别新增 2/4/3/3 KB 预算。独立条目的 metafile 额外验证无关模块不留在输出中，不以全量入口增长掩盖 tree-shaking。

react-button 由 2.66 KB 增至约 2.92 KB，原因是统一实时减动订阅与 memoized Motion resolver，不包含 effects；原 4 KB 预算不变。react-full 约189.21 KB、DataTable约7.53 KB，均沿用既有预算；其他包预算未改。新增 effects 成本只在显式使用时进入，首页 recipe 继续独立懒加载。

以下是 P030 的历史对照，不代表 MFX-01 的当前数值。

## 当前数值
2026-10-15，0.3.0（P030）后的 `pnpm size:check` 输出，15 个条目全部在预算内。新增四个 `patterns-*` 条目；**其余条目的预算未变**，沿用 0.2.0 的数值。以 `size-budget.json` 和命令输出为准。

| 条目 | minified | gzip | 预算（gzip） | 余量 |
| --- | ---: | ---: | ---: | ---: |
| `react-full` | 569.62 KB | 189.00 KB | 202 KB | 9.1% |
| `react-button` | 7.24 KB | 2.66 KB | 4 KB | 33.5% |
| `react-datatable` | 20.10 KB | 7.27 KB | 8 KB | 19.2% |
| `react-css` | 113.07 KB | 16.10 KB | 18 KB | 15.3% |
| `tokens-css` | 6.85 KB | 1.76 KB | 3 KB | 41.4% |
| `patterns-full` | 15.44 KB | 5.52 KB | 7 KB | 21.1% |
| `patterns-list-detail` | 3.21 KB | 1.57 KB | 3 KB | 47.8% |
| `patterns-query-toolbar` | 2.78 KB | 1.34 KB | 3 KB | 55.3% |
| `patterns-css` | 10.60 KB | 1.87 KB | 3 KB | 37.8% |
| `effects-full` | 9.43 KB | 3.85 KB | 5 KB | 23.1% |
| `effects-css` | 6.75 KB | 1.76 KB | 3 KB | 41.3% |
| `agent-core` | 10.59 KB | 3.81 KB | 5 KB | 23.9% |
| `agent-full` | 334.64 KB | 94.96 KB | 100 KB | 5.0% |
| `agent-status` | 2.67 KB | 1.13 KB | 3 KB | 62.2% |
| `agent-css` | 133.56 KB | 16.69 KB | 19 KB | 12.1% |

**0.3.0 变化**：新增 `@wzrhine/patterns` 的四个条目（`patterns-full` 5.52 KB gzip，含八个组件与文案表；`@wzrhine/react` 为 peer 不计入）。其余五个包本版未改动一行源码，实测值与 0.2.0 一致，预算沿用原值未动——`18284b5` 曾因 `--update` 重写全部条目而连带抬高 `react-full` / `react-datatable` / `react-css` / `agent-full` 四条，经核对旧预算并未被突破，已回退（ADR-0008 §3：预算调整必须有自己的理由）。tree-shaking 仍正常：`react-button` / `react-full` = 1.4%，`agent-status` / `agent-full` = 1.2%。

<details>
<summary>M13（2026-10-14，0.2.0 定版）数值</summary>

| 条目 | minified | gzip | 预算（gzip） | 余量 |
| --- | ---: | ---: | ---: | ---: |
| `react-full` | 569.62 KB | 189.00 KB | 202 KB | 6.4% |
| `react-button` | 7.24 KB | 2.66 KB | 4 KB | 33.5% |
| `react-datatable` | 20.10 KB | 7.27 KB | 8 KB | 9.1% |
| `react-css` | 113.07 KB | 16.10 KB | 18 KB | 10.5% |
| `tokens-css` | 6.85 KB | 1.76 KB | 3 KB | 41.4% |
| `effects-full` | 9.43 KB | 3.85 KB | 5 KB | 23.1% |
| `effects-css` | 6.75 KB | 1.76 KB | 3 KB | 41.3% |
| `agent-core` | 10.59 KB | 3.81 KB | 5 KB | 23.9% |
| `agent-full` | 334.64 KB | 94.96 KB | 100 KB | 5.0% |
| `agent-status` | 2.67 KB | 1.13 KB | 3 KB | 62.2% |
| `agent-css` | 133.56 KB | 16.69 KB | 19 KB | 12.1% |

**M13 变化（预算未调整）**：`react-full` 182.34 → 189.00 KB、`agent-full` 89.45 → 94.96 KB、`agent-css` 16.41 → 16.69 KB、`react-css` 15.17 → 16.10 KB；增长来自 B3–B5 的新组件（Workbench、Nav、Tree、CountBadge、Tag、ResizeHandle、选择器与覆盖层扩展）和公共图标入口，只在同时导入全部组件时计入，按需导入不受影响。

</details>

<details>
<summary>M12（2026-10-11）数值</summary>

| 条目 | minified | gzip | 预算（gzip） | 余量 |
| --- | ---: | ---: | ---: | ---: |
| `react-full` | 549.36 KB | 182.34 KB | 202 KB | 9.7% |
| `react-button` | 6.60 KB | 2.53 KB | 4 KB | 36.8% |
| `react-datatable` | 19.06 KB | 6.99 KB | 8 KB | 12.6% |
| `react-css` | 106.30 KB | 15.17 KB | 18 KB | 15.7% |
| `tokens-css` | 6.18 KB | 1.64 KB | 3 KB | 45.3% |
| `effects-full` | 8.27 KB | 3.32 KB | 5 KB | 33.5% |
| `effects-css` | 5.82 KB | 1.58 KB | 3 KB | 47.2% |
| `agent-core` | 10.02 KB | 3.60 KB | 5 KB | 27.9% |
| `agent-full` | 315.95 KB | 89.45 KB | 100 KB | 10.6% |
| `agent-status` | 2.65 KB | 1.12 KB | 3 KB | 62.5% |
| `agent-css` | 131.06 KB | 16.41 KB | 19 KB | 13.6% |

**M12 调整**：`react-full` 由 153 KB 调为 202 KB（+44 KB gzip），原因是新增 10 个组件，其中 Combobox、CommandPalette、Slider、NumberField、ScrollArea、Accordion、ContextMenu 各自引入对应的 Base UI 子路径（全部组件同时导入时才计入；按需导入不受影响）；`react-datatable` 增加约 0.4 KB（共享的文案表新增命名空间）；`react-css` 由 15 KB 调为 18 KB（四个新样式分片）。四个 agent 条目为新增。`react-button` / `react-full` = 1.4%，`agent-status` / `agent-full` = 1.3%，tree-shaking 正常。

</details>

M9.5 时 `react-full` 为 138.26 KB、`react-css` 为 12.07 KB；初版（文案表接入前）`react-datatable` 为 5.93 KB、`react-full` 为 137.14 KB。

## 修改预算
预算规则：`ceil(ceil(gzip / 1024) × 1.1) × 1024`，即先向上取整到 1 KB，再加约 10% 并向上取整到整 KB。

1. 确认体积增长是预期的（新增组件、依赖升级等），而不是误把依赖打进来或 tree-shaking 失效。
2. 执行 `pnpm size:check --update`：按上述规则从当前实测值重写 `size-budget.json` 的全部条目，然后照常比较。
3. **检查 `git diff size-budget.json`**：`--update` 重写的是**全部**条目，不只是你关心的那几个。与本次改动无关的包如果也被抬高，说明它们的历史漂移被顺带固化了——把这些条目改回原值，只保留本次确有理由调整的条目。
4. 在 PR 中说明原因并附 `size:check` 输出前后对比，在对应包的 CHANGELOG 中记录（ADR-0008 §3）。同步更新本文「当前数值」表。

新增度量条目时，在 `scripts/size-check.mjs` 的 `entries` 中添加，并用 `--update` 生成预算。
