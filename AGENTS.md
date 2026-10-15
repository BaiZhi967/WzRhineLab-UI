# AGENTS.md · Codex / Vibecoding 项目开发指令

适用范围：仓库根及所有子目录。如未来模块需要额外约束，可在对应目录添加更具体的 AGENTS.md；**本项目只维护 AGENTS，不创建 CLAUDE.md**。

## 项目身份
React + TypeScript + Motion 的原创科研机构／档案风格前端基础平台，主要服务维护者个人 React 项目（不是官方 Arknights 项目）。优先级：正确与可访问 > 一致性 > 可维护 > 性能 > 装饰。

## 开工前
- 阅读 `DESIGN.md` 和 `docs/README.md`；根据触及的领域读取 STYLE/MOTION/COMPONENTS/ICONS/ACCESSIBILITY。
- 当前开发顺序以 `docs/ROADMAP.md` 和 `docs/roadmap/README.md` 为准；任务见 `docs/roadmap/execution-backlog.md`。`docs/planning/` 中旧 M 系列文件保留为历史背景，不继承其过时的开工依赖。
- 0.2.0 是 npm 发布基线；0.3.0（`@wzrhine/patterns` 与八个页面模式组件）库侧已实现、处于返修验证中，**尚未发布**，当前状态以 `docs/roadmap/execution-backlog.md` 为准。0.4.0 及以后的新包／组件属于 Planned，未实现前不能声称已支持。
- 在提交之前检查 git diff；不得覆盖别人未提交的修改。
- 如规范冲突，先提出有据可查的 ADR，不得只按生成概念图覆盖规范。

## 需求与范围
- 主线独立推进，不等待消费项目接入或全部验证。
- 新反馈按 `docs/roadmap/demand-workflow.md` 评估；继续使用 `docs/planning/templates/component-demand.md` 记录，进入目标版本后再实施。
- 区分缺陷、增强、公共组件、recipe、宿主业务和架构实验；禁止把所有请求直接插入当前版本。
- 库侧验收、真实发布、消费方验证分别记录，不能互相代替。

## 编码边界
- React 组件保持语义 HTML；禁止 div onClick 冒充 button。
- 样式统一 `rl-` 前缀与 `--rl-*` tokens；不污染 `:root`、宿主全局标签。
- 动效只使用 `motion/react`，尊重系统 reduce；交互反馈必须可中断。
- 复杂 focus trap、menu、select 不从零手写，先通过 ADR 选用并验证 headless 包。
- 不加入未授权商标、游戏界面、字体文件或无来源图片。
- 组件应可独立被 tree-shake；不要把 WebGL、编辑器或图表引擎强制绑进基础包。
- 公共模式使用受控状态与明确 actions；接口、权限事实、凭据、文件系统与运行时留在宿主。
- 纯页面排版优先 recipe；不能只为扩大组件数量增加无独立行为的公共包装。
- 不将样例数值伪装成真实监测指标。

## 执行与验证
按影响选择：pnpm typecheck、pnpm build、test、Playwright、manual keyboard、a11y / contrast。**没有真实跑过的检查不能写 passed。** 视觉变更要记录 320/390/768/1280/1920 截图并标注相较基线的差异。
新增包必须进入 API、docs、license、size、真实安装与构建门禁。人工、浏览器、SSR 和消费结果分别记录。文档工作包不伪装成组件验收。

## 提交和汇报
在 `.worktree/` 下建立隔离 worktree；先检查忽略规则和现有改动。勤 commit，commit message 中文，推荐 `类型：摘要`。每次汇报需有「改动文件、执行检查、是否通过、遗留风险、下步动作」。
同一确认工作包全部完成后汇总一个最终 PR，不按阶段提交多个 PR；不直接写 main，不擅自合并或发布。
不创建或触发未经授权的 Actions；已有获批 workflow 保持原范围，提交前核对事件和路径规则。需要使用额外配额或变更自动流程时先取得确认。
