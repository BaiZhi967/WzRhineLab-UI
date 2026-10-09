# AGENTS.md · Codex / Vibecoding 项目开发指令

适用范围：仓库根及所有子目录。如未来模块需要额外约束，可在对应目录添加更具体的 AGENTS.md；**本项目只维护 AGENTS，不创建 CLAUDE.md**。

## 项目身份
React + TypeScript + Motion 的原创科研机构/档案风格组件库（不是官方 Arknights 项目）。优先级：正确与可访问 > 一致性 > 可维护 > 性能 > 装饰。

## 开工前
- 阅读 `DESIGN.md` 和 `docs/README.md`；根据触及的领域读取 STYLE/MOTION/COMPONENTS/ICONS/ACCESSIBILITY。
- 阅读 `docs/ROADMAP.md` 判定所属里程碑和退出条件。
- 在提交之前检查 git diff；不得覆盖别人未提交的修改。
- 如规范冲突，先提出有据可查的 ADR，不得只按生成概念图覆盖规范。

## 编码边界
- React 组件保持语义 HTML；禁止 div onClick 冒充 button。
- 样式统一 `rl-` 前缀与 `--rl-*` tokens；不污染 `:root`、宿主全局标签。
- 动效只使用 `motion/react`，尊重系统 reduce；交互反馈必须可中断。
- 复杂 focus trap、menu、select 不从零手写，先通过 ADR 选用并验证 headless 包。
- 不加入未授权商标、游戏界面、字体文件或无来源图片。
- 组件应可独立被 tree-shake；不要把 WebGL 强制绑进 @wzrhine/react。
- 不将样例数值伪装成真实监测指标。

## 执行与验证
按影响选择：pnpm typecheck、pnpm build、test、Playwright、manual keyboard、a11y / contrast。**没有真实跑过的检查不能写 passed。** 视觉变更要记录 320/390/768/1280/1920 截图并标注相较基线的差异。

## 提交和汇报
勤 commit，commit message 中文，推荐 `类型：摘要`。每次汇报需有「改动文件、执行检查、是否通过、遗留风险、下步动作」。
暂时不创建自动 CI workflow；需要使用 GitHub Actions 配额前先取得确认。默认用特性分支+PR，只有最初空仓库初始化可直接入 main。
