# QUALITY GATES · 验收门槛

## G0 — 仓库基础
- [ ] 基础目录完整，README 与文档导航均无死链
- [ ] pnpm install / typecheck / build 本地真实运行通过
- [ ] 无 secrets，生成资源有源数据与版权标注
- [ ] 无被误设为自动 push 的 CI

## G1 — Design System
- [ ] tokens 用语义命名，无重复硬编码
- [ ] 浅色对比度 AA 实测；暗色的每一组配色再验证
- [ ] 4px 间距刻度、统一字号与焦点规范
- [ ] 320/390/768/1280/1920 多尺寸无截断和大面积布局漂移

## G2 — Component
- [ ] API + 示例 + Props 类型 + 状态矩阵
- [ ] 禁用时行为一致，loading 无重复提交
- [ ] 键盘路径、focus-visible、错误与提示语义
- [ ] 主要动态效果具备 reduce 等价反馈
- [ ] 中文长文和系统字体放大
- [ ] 有自动化测试证明回归范围；未运行不得填「通过」

## G3 — Release
- [ ] 公开许可证确认（**待维护者选定**），第三方字体/图片/图标权利核对（✅ `pnpm license:audit` → THIRD-PARTY-LICENSES.md）
- [x] npm exports/CSS sideEffects/ESM 类型声明测试（`pnpm verify:packages`，M5）
- [x] 示例与包版本匹配、changelog 更新（三个包同一版本线，各自 CHANGELOG）
- [x] 手动 CI（如获授权）与本地验收记录（未启用 CI；本地 `pnpm release:check` 与验收记录）
- [x] semver 破坏性变更和迁移说明（CHANGELOG「破坏性」条目附迁移步骤；`pnpm api:check` 暴露 API 变化）

详细流程见 [RELEASING.md](RELEASING.md)。
