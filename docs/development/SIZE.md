# SIZE · 包体积基线与预算

依据 ADR-0008 §3。`pnpm size:check`（`scripts/size-check.mjs`）是 `release:check` 的最后一步，预算存于仓库根目录的 `size-budget.json`。

## 怎么量
1. 先执行 `pnpm build:packages`，量的是 `packages/*/dist` 产物，不是源码。`--no-build` 跳过构建，直接量现有 `dist`。
2. `@wzrhine/*` 按各包 `publishConfig.exports` 解析到 `dist/`（工作区内的 `exports` 指向 `src/`，这里不用）。如果打包结果里混进了 `packages/*/src/`，脚本直接失败。
3. 每个 JS 条目在系统临时目录生成一个只有一行的入口文件，用 esbuild 打包：`bundle`、`minify`、`format: 'esm'`、`platform: 'browser'`、`treeShaking`，`process.env.NODE_ENV` 定义为 `"production"`。
   - 外部依赖（使用方本来就有的 peer）：`react`、`react-dom`、`react/*`、`react-dom/*`、`motion`、`motion/*`。
   - **计入体积**：`@base-ui/react`（以及它依赖的 `@floating-ui/*` 等）和 `@wzrhine/tokens`，因为它们是随包安装、最终打进用户应用的真实依赖。
   - `effects-full` 额外把 `@wzrhine/react` 视为外部依赖（它是 effects 的 peer，费用已计入 `react-*` 条目）。
   - `'use client'` 指令（ADR-0008 §2）不影响度量：esbuild 0.25.12 打包这些文件时不产生告警（已实测），脚本仍把 `module-level-directive` 设为静默，以防将来版本像 Rollup 那样报告。
4. CSS 条目用 esbuild 的 CSS 打包，会跟随 `@import` 把全部分片合并后压缩。
5. 输出用 `zlib.gzipSync`（level 9）压缩，同时报告压缩后（minified）与 gzip 两个字节数。**门禁只看 gzip。**

esbuild 通过 Vite（`apps/docs` 的依赖）解析，没有新增依赖；当前版本 0.25.12。

| 条目 | 入口 |
| --- | --- |
| `react-full` | `export * from '@wzrhine/react'` |
| `react-button` | `export { Button } from '@wzrhine/react'` |
| `react-datatable` | `export { DataTable } from '@wzrhine/react'` |
| `react-css` | `@wzrhine/react/styles.css`（含八个 `@import` 分片） |
| `tokens-css` | `@wzrhine/tokens/styles.css` |
| `effects-full` | `export * from '@wzrhine/effects'` |
| `effects-css` | `@wzrhine/effects/styles.css` |

## 失败条件
- 任一条目 gzip 体积 > 预算：逐项输出超出的字节数。
- 有度量但 `size-budget.json` 中没有预算，或有预算但脚本不再度量（改名或删除条目时必须同步预算文件）。
- tree-shaking 检查：`react-button` 的 gzip 体积必须小于 `react-full` 的 25%。超过说明只导入一个组件就拉进了大半个包（检查 `sideEffects` 和模块顶层副作用）。
- `pnpm build:packages` 失败：什么都不量，直接失败。

## 当前数值
2026-10-11 M9.5 初版测得，由协调者在合并时用 `pnpm size:check --update` 重新生成；以 `size-budget.json` 和命令输出为准。

| 条目 | minified | gzip | 预算（gzip） | 余量 |
| --- | ---: | ---: | ---: | ---: |
| `react-full` | 416.61 KB | 137.14 KB | 152 KB | 9.8% |
| `react-button` | 6.60 KB | 2.53 KB | 4 KB | 36.8% |
| `react-datatable` | 16.24 KB | 5.93 KB | 7 KB | 15.3% |
| `react-css` | 80.01 KB | 12.07 KB | 15 KB | 19.5% |
| `tokens-css` | 6.18 KB | 1.64 KB | 3 KB | 45.3% |
| `effects-full` | 8.27 KB | 3.32 KB | 5 KB | 33.5% |
| `effects-css` | 5.82 KB | 1.58 KB | 3 KB | 47.2% |

`react-button` / `react-full` = 1.8%。`react-full` 中约 3/4 来自 `@base-ui/react` 及其依赖（全部组件同时导入时），本包自身代码约 59 KB（minified）。小体积条目的余量比例偏高，是因为「取整到 1 KB」在几 KB 的量级上占比大。

## 修改预算
预算规则：`ceil(ceil(gzip / 1024) × 1.1) × 1024`，即先向上取整到 1 KB，再加约 10% 并向上取整到整 KB。

1. 确认体积增长是预期的（新增组件、依赖升级等），而不是误把依赖打进来或 tree-shaking 失效。
2. 执行 `pnpm size:check --update`：按上述规则从当前实测值重写 `size-budget.json` 的全部条目，然后照常比较。
3. 在 PR 中说明原因并附 `size:check` 输出前后对比，在对应包的 CHANGELOG 中记录（ADR-0008 §3）。同步更新本文「当前数值」表。

新增度量条目时，在 `scripts/size-check.mjs` 的 `entries` 中添加，并用 `--update` 生成预算。
