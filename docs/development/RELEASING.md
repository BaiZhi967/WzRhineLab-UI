# RELEASING · 构建、校验与手动发布

本项目不使用自动 CI 发布（AGENTS.md）。下面的步骤都在维护者本地执行，每一步都会在条件不满足时直接失败。

## 包与产物
| 包 | 内容 | 入口 |
| --- | --- | --- |
| `@wzrhine/tokens` | CSS 变量与 token 清单 | `.`、`./styles.css` |
| `@wzrhine/react` | 组件 | `.`、`./styles.css` |
| `@wzrhine/effects` | 可选展示动效（ADR-0004） | `.`、`./styles.css` |
| `@wzrhine/agent-core` | 框架无关 Agent 契约与纯函数 | `.` |
| `@wzrhine/agent` | React Agent UI、文案与动效 | `.`、`./styles.css` |

- 开发时 `exports` 指向 `src/`（workspace 内由 Vite / Vitest 直接编译，ADR-0002）。
- 打包或发布时 pnpm 使用 `publishConfig` 覆盖为 `dist/`：ESM `.js`、`.d.ts`、source map 和原样复制的 CSS。`workspace:` 版本号会被替换为真实版本。
- `files` 只包含 `dist`、`README.md`、`CHANGELOG.md`；`sideEffects` 只声明 CSS。

## 命令
| 命令 | 作用 |
| --- | --- |
| `pnpm build:packages` | 用 `tsc -p tsconfig.build.json` 构建五个包到 `dist/`，并复制 CSS |
| `pnpm api:report` | 根据 `dist/*.d.ts` 重新生成 `docs/api/*.md` |
| `pnpm api:check` | API 报告与构建结果不一致时失败，用来在评审中暴露公开 API 的变化 |
| `pnpm docs:check` | 文档搜索索引（`apps/docs/src/search-index.json`）与路由、文档标题、API 报告不一致时失败；`pnpm docs:index` 重新生成 |
| `pnpm license:audit` | 审计运行时依赖树的许可证（白名单），记录每个依赖的许可文件、版权声明与上游仓库，缺少许可文件时失败；生成 `THIRD-PARTY-LICENSES.md` |
| `pnpm verify:packages` | 打包后在**工作区之外**的临时项目中安装 tarball 并逐项验证，见下文 |
| `pnpm size:check` | 构建后用 esbuild 压缩打包各入口并统计 gzip 体积，超出 `size-budget.json` 预算即失败（ADR-0008 §3，见 [SIZE.md](SIZE.md)） |
| `pnpm release:check` | 依次执行 `check`、`api:check`、`docs:check`、`license:audit`、`verify:packages`、`size:check` |
| `pnpm release:dry` | 跑完全部门禁并执行 `pnpm publish --dry-run`，同时列出尚未满足的发布前置条件 |
| `node scripts/release.mjs <ver> --publish` | 真正发布；任一前置条件不满足就拒绝，没有跳过开关 |

### `verify:packages` 验证的内容
1. tarball 不含 `src/` 和测试；manifest 中没有 `workspace:`；带有类型声明、`sideEffects`、README、CHANGELOG、`repository`；每个 export 指向的文件都在包内。
2. 在临时目录新建一个使用方项目，安装五个 tarball 以及 npm 上的 react、react-dom、motion。
3. 用 `skipLibCheck: false` 的严格模式类型检查使用方代码；并用 `@ts-expect-error` 确认错误用法（未知 variant、缺少名称的 IconButton）会被发布出去的类型拒绝。
4. 在纯 Node ESM 下用 `react-dom/server` 渲染组件。
5. 用 Vite 打包：tokens、`components.css` 以及它 `@import` 的全部八个分片（reset / overlays / feedback / archive / forms / data / drawer / status）都必须出现，每个分片用一个只属于它的选择器检查；没有引入 effects 的应用中不能出现 effects 代码。
6. `'use client'` 指令（ADR-0008 §2）：以源码为准，运行时使用 React 的模块必须带指令、纯模块不得带；打包后 tarball 中每个 `dist/*.js` 的指令与其源码一致，且不存在找不到源码的产物文件。

反向测试已经实际跑过：删掉一个 `@import`（含 M9.5 新增的 drawer 分片）后 verify 失败；把 `ButtonVariant` 放宽为 `string` 后类型检查失败；删掉组件源码的指令、给纯模块加上指令、去掉 tarball 中产物的指令，三种情况都失败。这说明上述检查确实能拦住对应的回归。

### `size:check` 体积门禁
`release:check` 的最后一步。度量对象是 `dist/` 产物，`react` / `react-dom` / `motion` 视为外部依赖，`@base-ui/react` 与 `@wzrhine/tokens` 计入体积。任一条目的 gzip 体积超过预算、预算与度量条目不一致、或只导入 `Button` 的体积达到全量入口的 25%（tree-shaking 失效）时退出码为 1。度量方式、当前数值和修改预算的流程见 [SIZE.md](SIZE.md)。

## 发布前置条件（`release.mjs --publish` 强制）
- [x] **维护者选定许可证**：已定为 MIT（2026-10-12，版权人 WhiteZhi）。仓库根目录与五个可发布包各有一份 `LICENSE`，六个 `package.json` 的 `license` 字段均为 `"MIT"`。
- [x] 去掉五个可发布包的 `"private": true`（2026-10-12；根 workspace 的 `private` 保留，它不发布）。
- [x] 核验 npm 包名：2026-10-12 对官方 registry（`registry.npmjs.org`）复验，五个包名当时均可用；`wzrhine` 组织随后创建（owner：whitezhi），登录与发布验证通过。
- [x] 每个 CHANGELOG 已定版 `## [0.1.0] - 2026-10-12`；破坏性变更与迁移步骤已在各节写明。
- [x] 在 `main` 分支、工作区干净（2026-10-12 发布时满足）。
- [x] `pnpm release:check` 通过（2026-10-12，完整两轮）。

首发 `0.1.0` 已于 2026-10-12 发布。因 npm 账号开启 2FA（auth-and-writes），实际流程为：脚本 dry run + `--publish` 阶段的 `pnpm release:check` 完成全部门禁校验，最终上传在交互终端手动逐包执行 `pnpm publish --access public --no-git-checks --registry https://registry.npmjs.org/`（每包输入一次 OTP）。后续版本如用脚本直发，可加 `--otp=<code>`（门禁耗时可能耗尽首码，剩余包用新码重试）。发布后提交版本号变更并打 tag `v<version>`。

### 0.2.0 发布记录（2026-10-14）

`0.1.0` 之后的全部变更（M13 的 Wpi 接入补齐 B0–B9、图标方向调整、ADR-0013 开放分类法）在五个包的 `[Unreleased]` 中累积，本次整体定版为 `## [0.2.0] - 2026-10-14`。版本号自 B0 批次起就是 0.2.0，所以 `release.mjs` 不会改写 `package.json`，只需提交定版文档并打 tag。

- [x] 五个包的 CHANGELOG 均有 `## [0.2.0] - 2026-10-14` 段落；破坏性项（`react` / `effects` / `agent` 的 motion peer 收窄为 `^14.0.0`）与迁移步骤写在各自 CHANGELOG 与 [UPGRADING.md](UPGRADING.md)「升到 0.2.0」。
- [x] 定版同时重新生成了派生产物：`pnpm api:report`（`@wzrhine/react` 265 → 294 个导出，`agent-core` 128 → 138，`agent` 377 → 400）、`pnpm docs:index`（2006 条）、`pnpm license:audit`（17 个运行时依赖 = MIT 16 + 0BSD 1，并补记 Showcase 的 Lucide 基础层）。
- [x] 在 `main` 分支、工作区干净。
- [x] `pnpm release:check` 通过（2026-10-14）：`typecheck` 11 个项目；单测 1329（tokens 247 / agent-core 24 / react 511 / effects 48 / agent 499）；`build` 与五个示例构建；`api:check`、`docs:check`（2006 条）、`license:audit`、`verify:packages`（tarball 安装 / SSR / Vite / `'use client'`）、`size:check`（11 个条目全部在预算内，未调整预算）。
- [x] 相对 0.1.0 无删除或重命名的公开 API（`docs/api/*.md` 逐名比对）；新增 API 见各包 CHANGELOG。
- [x] 定版前重跑了浏览器套件（2026-10-14，本机 Windows）：`pnpm test:e2e`（Chromium）**623/623 通过**；`pnpm test:visual` 11 通过 / 99 失败，**全部失败画面只差两处图标字形**——390px 的移动端菜单按钮、1280px 的搜索框前置图标，以及渲染了这些图标的页面内容（用逐像素聚类核对，差异全部落在 ~14×14 的图标盒内）。根因是 2026-10-14 的图标方向提交把 Showcase 基础图标切到 Lucide 基础层，而视觉基线停留在切换之前；这些图标与基线都在私有 Showcase（`apps/docs`）内，**不影响 npm 包内容**。跨内核结果仍见 [M13 验收记录](acceptance/2026-10-13-m13-wpi-ui.md)。
- [ ] 重生成视觉基线：`pnpm test:visual:update`（99 张，逐张确认差异只在上述图标），评审后提交；此后 `pnpm test:visual` 应为全绿。
- [ ] 上传后：`git tag v0.2.0` 并推送 tag；GitHub Pages 会因 `packages/**` 变更自动重新部署 Showcase。

发布执行（维护者在仓库根、`main` 分支上，先确认 `npm whoami` 已是 `wzrhine` 组织的发布者）：

```sh
pnpm release:dry                            # 全部门禁 + 五包 pnpm publish --dry-run，不写 registry
node scripts/release.mjs 0.2.0 --publish --otp=<新码>   # 逐包上传；首码若在门禁阶段过期，剩余包用新码重试
git tag v0.2.0 && git push origin v0.2.0
```

逐包手动发布（与 0.1.0 相同的做法，每包一次 OTP）：

```sh
pnpm --filter @wzrhine/tokens publish --access public --no-git-checks --registry https://registry.npmjs.org/
pnpm --filter @wzrhine/react publish --access public --no-git-checks --registry https://registry.npmjs.org/
pnpm --filter @wzrhine/effects publish --access public --no-git-checks --registry https://registry.npmjs.org/
pnpm --filter @wzrhine/agent-core publish --access public --no-git-checks --registry https://registry.npmjs.org/
pnpm --filter @wzrhine/agent publish --access public --no-git-checks --registry https://registry.npmjs.org/
```

## 文档站
ROADMAP M5 写的是「Storybook 或自研 explorer」。本项目选择自研：`apps/docs` 就是 explorer，包括组件页、Playground、状态矩阵、动效对照和验收场景，并有三种浏览器内核的 E2E 覆盖。API 参考由 `api:report` 从类型声明自动生成，放在 `docs/api/`。目前不引入 Storybook，避免维护两套示例。

## 版本策略
- `0.x`：允许破坏性变更，但必须写进 CHANGELOG 的 Changed 段，标注「破坏性」并附迁移说明。
- 五个包保持相同的版本号并按依赖顺序发布；`effects` 以 peer 方式依赖同版本线的 react 包，`agent` 依赖 `agent-core`。
- 公开 API 的任何变化都会让 `api:check` 失败，需要重新生成 `docs/api/*.md`，并在 PR 中评审 diff。
