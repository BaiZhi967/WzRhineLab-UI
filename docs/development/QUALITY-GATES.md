# QUALITY GATES · 验收门槛

勾选只依据验收记录中真实执行过的检查（2026-10-11 按 M10 合入后的 main 核对）；没有证据或只有部分证据的项保持未勾选，并注明缺什么。

## G0 — 仓库基础
- [ ] 基础目录完整，README 与文档导航均无死链（目录完整；**没有做过死链检查**，只有人工维护）
- [x] pnpm install / typecheck / build 本地真实运行通过（[Sprint 01](acceptance/2026-10-09-sprint-01.md) 起每个里程碑；最近一次为 [M10 验收](acceptance/2026-10-10-m10.md)合入 M9 后的 `pnpm release:check`）
- [ ] 无 secrets，生成资源有源数据与版权标注（`.gitignore` 排除 `.env*`；概念图与研究 PDF 与交付 ZIP 的 SHA256SUMS 一致、来源见 [ASSET-MANIFEST](../research/ASSET-MANIFEST.md)；**没有做过 secrets 扫描**）
- [x] 无被误设为自动 push 的 CI（仓库没有 `.github/workflows`，见 [ARCHITECTURE.md](ARCHITECTURE.md)「发布与版本」）

## G1 — Design System
- [x] tokens 用语义命名，无重复硬编码（`packages/tokens/test`：结构、CSS↔manifest 同步、块内无重复声明；`package-boundary.test.ts` 禁止组件 CSS 出现字面颜色与 px；M6 冻结公开契约）
- [x] 浅色对比度 AA 实测；暗色的每一组配色再验证（tokens 测试在明 / 暗 / 系统三主题下验证全部对比组合，[ADR-0003](adr/0003-token-tuning-and-button-variants.md)；Showcase 与示例明暗 axe 0 violations）
- [x] 4px 间距刻度、统一字号与焦点规范（tokens 测试「spacing scale on a 4px grid」；字体角色与 2px 焦点环来自 tokens，[Sprint 01](acceptance/2026-10-09-sprint-01.md) 键盘与焦点检查）
- [x] 320/390/768/1280/1920 多尺寸无截断和大面积布局漂移（`responsive.spec.ts` 全路由无横向溢出；每个里程碑的 5 宽度截图审查，最近为 [M9](acceptance/2026-10-10-m9.md)）

## G2 — Component
- [ ] API + 示例 + Props 类型 + 状态矩阵（API 参考自动生成、Showcase 示例与公开 Props 类型齐全；**状态矩阵只有** field、forms、data-navigation 三份组件文档有，其余组件文档缺）
- [x] 禁用时行为一致，loading 无重复提交（Button loading 阻止重复激活并保持焦点、Pagination `busy`、AlertDialog 等待中不可取消，单测与 E2E 覆盖）
- [x] 键盘路径、focus-visible、错误与提示语义（三内核 E2E 键盘、焦点进入 / 循环 / 归还、Field 错误关联、live region；**人工键盘与读屏抽检未做**，见 [ACCESSIBILITY.md](../design/ACCESSIBILITY.md)）
- [x] 主要动态效果具备 reduce 等价反馈（`reduced-motion.spec.ts` 全路由减动扫描、ADR-0007 按属性类型减动，[M10 验收](acceptance/2026-10-10-m10.md)）
- [ ] 中文长文和系统字体放大（Button、Choice 等 Showcase 有长中文 / 长英文示例，随 5 宽度截图审查与无溢出 E2E 覆盖；**系统字体放大与 200% 缩放未验证**，留给 M14）
- [x] 有自动化测试证明回归范围；未运行不得填「通过」（tokens 235 / react 323 / effects 45 单测，三内核 E2E 各 385 项，74 张视觉基线；验收记录只列真实执行过的命令）

## G3 — Release
- [ ] 公开许可证确认（**待维护者选定**），第三方字体/图片/图标权利核对（✅ `pnpm license:audit` → THIRD-PARTY-LICENSES.md）
- [x] npm exports/CSS sideEffects/ESM 类型声明测试（`pnpm verify:packages`，M5）
- [x] 示例与包版本匹配、changelog 更新（三个包同一版本线，各自 CHANGELOG；三个示例应用以 `workspace:*` 引用，`pnpm check` 构建它们）
- [x] 视觉回归基线（`pnpm test:visual`；M6 建立 31 张，M9 后为 74 张，Chromium on Windows）与升级指南（[UPGRADING.md](UPGRADING.md)）
- [x] 主题契约冻结（`@wzrhine/tokens` 的 `publicTokens`，测试保证与 CSS 一致，M6）
- [x] 手动 CI（如获授权）与本地验收记录（未启用 CI；本地 `pnpm release:check` 与验收记录）
- [x] semver 破坏性变更和迁移说明（CHANGELOG「破坏性」条目附迁移步骤；`pnpm api:check` 暴露 API 变化）

详细流程见 [RELEASING.md](RELEASING.md)。
