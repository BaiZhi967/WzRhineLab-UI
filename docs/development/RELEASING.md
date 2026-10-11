# RELEASING · 构建、校验与手动发布

本项目不使用自动 CI 发布（AGENTS.md）。下面的步骤都在维护者本地执行，每一步都会在条件不满足时直接失败。

## 包与产物
| 包 | 内容 | 入口 |
| --- | --- | --- |
| `@wzrhine/tokens` | CSS 变量与 token 清单 | `.`、`./styles.css` |
| `@wzrhine/react` | 组件 | `.`、`./styles.css` |
| `@wzrhine/effects` | 可选展示动效（ADR-0004） | `.`、`./styles.css` |

- 开发时 `exports` 指向 `src/`（workspace 内由 Vite / Vitest 直接编译，ADR-0002）。
- 打包或发布时 pnpm 使用 `publishConfig` 覆盖为 `dist/`：ESM `.js`、`.d.ts`、source map 和原样复制的 CSS。`workspace:` 版本号会被替换为真实版本。
- `files` 只包含 `dist`、`README.md`、`CHANGELOG.md`；`sideEffects` 只声明 CSS。

## 命令
| 命令 | 作用 |
| --- | --- |
| `pnpm build:packages` | 用 `tsc -p tsconfig.build.json` 构建三个包到 `dist/`，并复制 CSS |
| `pnpm api:report` | 根据 `dist/*.d.ts` 重新生成 `docs/api/*.md` |
| `pnpm api:check` | API 报告与构建结果不一致时失败，用来在评审中暴露公开 API 的变化 |
| `pnpm license:audit` | 审计运行时依赖树的许可证（白名单），生成 `THIRD-PARTY-LICENSES.md` |
| `pnpm verify:packages` | 打包后在**工作区之外**的临时项目中安装 tarball 并逐项验证，见下文 |
| `pnpm size:check` | 构建后用 esbuild 压缩打包各入口并统计 gzip 体积，超出 `size-budget.json` 预算即失败（ADR-0008 §3，见 [SIZE.md](SIZE.md)） |
| `pnpm release:check` | 依次执行 `check`、`api:check`、`license:audit`、`verify:packages`、`size:check` |
| `pnpm release:dry` | 跑完全部门禁并执行 `pnpm publish --dry-run`，同时列出尚未满足的发布前置条件 |
| `node scripts/release.mjs <ver> --publish` | 真正发布；任一前置条件不满足就拒绝，没有跳过开关 |

### `verify:packages` 验证的内容
1. tarball 不含 `src/` 和测试；manifest 中没有 `workspace:`；带有类型声明、`sideEffects`、README、CHANGELOG、`repository`；每个 export 指向的文件都在包内。
2. 在临时目录新建一个使用方项目，安装三个 tarball 以及 npm 上的 react、react-dom、motion。
3. 用 `skipLibCheck: false` 的严格模式类型检查使用方代码；并用 `@ts-expect-error` 确认错误用法（未知 variant、缺少名称的 IconButton）会被发布出去的类型拒绝。
4. 在纯 Node ESM 下用 `react-dom/server` 渲染组件。
5. 用 Vite 打包：tokens、`components.css` 以及它 `@import` 的全部八个分片（reset / overlays / feedback / archive / forms / data / drawer / status）都必须出现，每个分片用一个只属于它的选择器检查；没有引入 effects 的应用中不能出现 effects 代码。

两项反向测试已经实际跑过：删掉一个 `@import` 后 verify 失败；把 `ButtonVariant` 放宽为 `string` 后类型检查失败。这说明上述检查确实能拦住对应的回归。

### `size:check` 体积门禁
`release:check` 的最后一步。度量对象是 `dist/` 产物，`react` / `react-dom` / `motion` 视为外部依赖，`@base-ui/react` 与 `@wzrhine/tokens` 计入体积。任一条目的 gzip 体积超过预算、预算与度量条目不一致、或只导入 `Button` 的体积达到全量入口的 25%（tree-shaking 失效）时退出码为 1。度量方式、当前数值和修改预算的流程见 [SIZE.md](SIZE.md)。

## 发布前置条件（`release.mjs --publish` 强制）
- [ ] **维护者选定许可证**：在仓库根目录加入 `LICENSE`，三个包都填写相同的 `license` 字段。**目前未选定**，README 中已注明。
- [ ] 去掉三个包的 `"private": true`。
- [ ] 核验 npm 包名：截至 2026-10-09，`@wzrhine/tokens`、`@wzrhine/react`、`@wzrhine/effects` 均返回 404，`@wzrhine` scope 不存在。发布前需要由维护者在 npm 上创建该 scope（或组织），并确认归属。
- [ ] 每个 CHANGELOG 把 `[Unreleased]` 改为 `## [x.y.z] - 日期`，并写明破坏性变更与迁移步骤。
- [ ] 在 `main` 分支、工作区干净。
- [ ] `pnpm release:check` 通过。

满足后执行 `node scripts/release.mjs 0.1.0 --publish`，然后提交版本号变更并打 tag `v0.1.0`。

## 文档站
ROADMAP M5 写的是「Storybook 或自研 explorer」。本项目选择自研：`apps/docs` 就是 explorer，包括组件页、Playground、状态矩阵、动效对照和验收场景，并有三种浏览器内核的 E2E 覆盖。API 参考由 `api:report` 从类型声明自动生成，放在 `docs/api/`。目前不引入 Storybook，避免维护两套示例。

## 版本策略
- `0.x`：允许破坏性变更，但必须写进 CHANGELOG 的 Changed 段，标注「破坏性」并附迁移说明。
- 三个包保持相同的版本号，一起发布（effects 以 peer 方式依赖同版本线的 react 包）。
- 公开 API 的任何变化都会让 `api:check` 失败，需要重新生成 `docs/api/*.md`，并在 PR 中评审 diff。
