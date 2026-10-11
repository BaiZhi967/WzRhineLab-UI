# ADR-0002 · 源码直出导出与样式入口边界

- 状态：**Accepted（开发阶段）**；M5 发布前需复审（已在 M5 落实，见文末「复审 · M5」）。
- 日期：2026-10-09 · 关联里程碑：M0 验收 / M1-A

## 背景
`@wzrhine/react` 与 `@wzrhine/tokens` 的 `exports` 直接指向 `src/*.ts(x)` 与 `src/*.css`。此前 `@wzrhine/react` 的入口 `index.ts` 内 `import` 了两份 CSS，导致：
- 任何命名导入都会把全部样式作为副作用拉入，违背「单组件可 tree-shake、无不透明 barrel 副作用」（ARCHITECTURE.md）。
- 非 Vite 宿主（Node SSR、Jest/Vitest node 环境、Next.js 服务端）导入 `.ts` 入口时会因 CSS import 失败。

## 决策
1. **入口无副作用**：`packages/react/src/index.ts` 只导出 JS；样式由使用方显式导入：
   ```ts
   import '@wzrhine/tokens/styles.css';
   import '@wzrhine/react/styles.css';
   ```
   `package-boundary.test.ts` 断言入口不含 CSS import。
2. **开发阶段继续源码直出**：workspace 内由 Vite / Vitest 直接编译 TS 源码，不引入构建步骤；两包均为 `private: true`，不会被误发布。
3. **依赖方向**：`@wzrhine/react` → `@wzrhine/tokens`（运行时读取 `motionDurations` 等 manifest）；tokens 不依赖 React。`motion` 改为 `peerDependency`（devDependency 同版本用于测试），避免宿主出现两份 motion 实例导致 `MotionConfig` 上下文失效。
4. **Token 单一来源**：`tokens.css` 为 CSS 权威值，`manifest.ts` 为机器可读索引；二者一致性、对比度、4px 网格、暗色/系统主题镜像由 `packages/tokens/test` 守护。
5. **组件 CSS 约束**：`components.css` 不得出现字面颜色、字面 px、非 `.rl-` 选择器（测试强制）。

## 发布前（M5）需完成，不在本 ADR 范围
- 增加 `tsup`/`tsc` 构建，`exports` 改为 `dist/*.js` + `types` + `./styles.css`，并保留 `sideEffects: ["**/*.css"]`。
- 验证 ESM 类型声明、CJS 是否需要、`"use client"` 指令（RSC 宿主）。
- 发布名占用核验、许可证确认（README 已注明未定）。

## 代价
- 使用方需要多写两行样式导入；换来可预测的副作用与 SSR 兼容。
- 源码直出期间，外部（非 workspace）项目无法直接消费；这是有意的，直到 M5。

## 验证
`pnpm -r typecheck`、`pnpm test`（含 package-boundary 测试）、`pnpm build` 在 2026-10-09 本地通过，见 `docs/development/acceptance/2026-10-09-sprint-01.md`。

## 复审 · M5（2026-10-09）
决策 1–5 不变。「发布前（M5）需完成」三项的落实情况，证据见 [M5 验收记录](../acceptance/2026-10-09-m5.md)：
- 构建：三个包用 `tsc -p tsconfig.build.json` 构建到 `dist/`；workspace 内 `exports` 仍指向 `src/`（本 ADR 决策 2），打包 / 发布时由 `publishConfig.exports` 覆盖为 `dist/*.js` + `.d.ts` + `./styles.css`，`sideEffects` 只声明 CSS。
- 验证：`pnpm verify:packages` 在工作区之外安装 tarball，做严格类型检查、Node ESM SSR 与 Vite 打包检查。只提供 ESM，不提供 CJS；产物不含 `"use client"`，RSC 使用方需在边界自行标注（M9.5 再评估）。
- 包名与许可证：仍待维护者决定，因此没有实际发布（RELEASING.md「发布前置条件」）。
