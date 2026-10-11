# STYLE · 视觉样式与主题规范（v0.2）

> 状态：v0.2（2026-10-11）。色值经 [ADR-0003](../development/adr/0003-token-tuning-and-button-variants.md) 校准（Sprint 01），公开 token 契约在 M6 冻结（`@wzrhine/tokens` 的 `publicTokens`，114 个）；此后删除或重命名 token 属于破坏性变更。

## 1. 基础色 / Semantic Tokens
以下均为**本项目原创值**，不是游戏官方调色板。实现需通过 CSS 自定义属性使用，不得在组件中重复硬编码。**权威值以 `packages/tokens/src/tokens.css` 为准**（完整角色与暗色值见该文件与 Showcase Foundations 页）；Sprint 01 的对比度校准见 [ADR-0003](../development/adr/0003-token-tuning-and-button-variants.md)。

| token | 浅色值 | 含义 |
| --- | --- | --- |
| `--rl-bg-canvas` | `#F3F2ED` | 页面底色 |
| `--rl-bg-surface` | `#FCFBF7` | 内容表面 |
| `--rl-bg-subtle` | `#E9E8E1` | 次级区域 |
| `--rl-bg-inverse` | `#20251F` | 深墨填充（Primary 按钮） |
| `--rl-fg-primary` | `#20251F` | 主文本 |
| `--rl-fg-muted` | `#505850` | 次级文本 |
| `--rl-fg-subtle` | `#5D655B` | 元信息 / 编号 |
| `--rl-border-subtle` | `#DCDCD4` | 纯装饰分隔 |
| `--rl-border-default` | `#C8CBC1` | 容器轮廓 |
| `--rl-border-strong` | `#7B8579` | 必须识别的控件轮廓（≥3:1） |
| `--rl-accent` | `#E56A32` | 研究橙信号、Accent 按钮填充 |
| `--rl-accent-text` | `#A8421B` | 浅底强调文字 |
| `--rl-accent-amber` | `#C89B45` | 档案辅助标记（装饰） |
| `--rl-focus` | `#1F5AA8` | 焦点环（独立于品牌橙） |
| `--rl-info` | `#1F6680` | 信息反馈 |
| `--rl-success` | `#22704A` | 确认完成 |
| `--rl-danger` | `#B12F2B` | 高风险/错误 |
| `--rl-warning` | `#8A5400` | 注意/警告 |

每个状态色另有 `*-subtle` 底色用于徽标；所有组件使用的前景/背景组合由 `packages/tokens/test` 在明、暗、系统三种主题下自动验证 WCAG 2.2 AA。

**重要**：不要用白字叠在亮橙按钮上作为默认组合；优先使用主文本深色，明确通过对比度验收。badge/图标的语义必须附文字，不能只靠颜色。焦点色、选中背景、危险语义不能简单复用 brand 角色。

## 2. 字体层级
建议 fallback：
- 内容：`Inter, "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`。
- 数值：`"IBM Plex Mono", "SFMono-Regular", Consolas, monospace`。
- 部分展示标题可采用更窄的字面和较大的英文 tracking，但不能损害中文可读性。
- 提示：Inter、Noto 与 IBM Plex 的字体文件需自行按上游许可引入；当前仓库**不内置字体文件**。

| Role | Size / line-height | Weight | 用途 |
| --- | --- | --- | --- |
| display | 36/44 | 600 | 展示标题 |
| heading-1 | 28/36 | 600 | 页面标题 |
| heading-2 | 22/30 | 600 | 一级内容标题 |
| heading-3 | 18/26 | 600 | 面板标题 |
| body | 16/24 | 400 | 正文、表单 |
| body-sm | 14/21 | 400 | 紧凑信息 |
| meta | 12/18 | 500 | 辅助标签，不用于长正文 |
| mono | 12/18 | 500 | 编号、时间、单位 |

## 3. 几何与空间
基础间距：4px；空间序列：0,4,8,12,16,24,32,48,64。默认边框 1px；焦点视觉边框至少 2px（具体实现依 WCAG 标准验证）。默认圆角 2–6px、表单 4–8px；切角/准星只用在 Archive/Instrument 变体，不作为通用装饰。深浅底色优先于厚重阴影传达层级。

布局：移动端小于 768px，平板 768–1199px，桌面至少 1200px **仅为设计起始断点**；实际以内容发生拥挤的点确定。桌面建议侧栏 224–260px；1280、1440、1920 和高 DPI 均需检查内容填充和对齐。上限宽度由内容类型决定，不应因为超宽屏就让业务区域出现巨大的空边。

## 4. 状态矩阵
组件需要分别处理：default / hover / pressed / focus-visible / selected / loading / disabled / read-only / invalid / success（适用时）。disabled 必须防止动作，而不是只变灰。空状态与长文本不应撑破网格。交互反馈优先 border/fg/surface，避免大面积发光。

## 5. 深色与密度
主题用 `data-rl-theme="light|dark"` 作用于作用域容器；支持系统主题的映射，但不能污染宿主 `:root`。深色底色 `#11181B`、表面 `#1D272B`、文字 `#E6E9E2`。其余暗色值已在 Sprint 01 定稿：ADR-0003 为暗色主题独立定义全部角色，`packages/tokens/test` 在明 / 暗 / 系统三种主题下自动验证所有组件实际使用的对比组合；M6 起随 token 契约冻结，权威值见 `tokens.css`。密度用 `data-rl-density="comfortable|compact"`；紧凑模式仍要符合触控场景目标尺寸或给出桌面鼠标密集模式开关。

## 6. 禁止事项
禁止：所有按钮统一橙底白字；全站 8px 以下小字；把背景网格当必要信息边界；假指标；hover 是唯一反馈；动画停止后数据才可读；默认无限扫描循环；复制原作标识/官方 UI 素材。

## 7. 验证方法
`docs`/Showcase 固定展示 320、390、768、1280、1920px；颜色检测遵循 WCAG 2.2 AA：普通文字 4.5:1、大文字 3:1、关键非文本控件 3:1，并对半透明/背景图叠加状态实际取样；键盘 Tab / Shift+Tab 逐项人工复核。
