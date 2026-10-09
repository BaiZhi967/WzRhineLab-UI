# STYLE · 视觉样式与主题规范（Draft 0.1）

## 1. 基础色 / Semantic Tokens
以下均为**本项目原创建议初始值**，不是游戏官方调色板。实现需通过 CSS 自定义属性使用，不得在组件中重复硬编码。

| token | 浅色建议值 | 含义 |
| --- | --- | --- |
| `--rl-bg-canvas` | `#F3F2ED` | 页面底色 |
| `--rl-bg-surface` | `#FCFBF7` | 内容表面 |
| `--rl-bg-subtle` | `#E9E8E1` | 次级区域 |
| `--rl-fg-primary` | `#20251F` | 主文本 |
| `--rl-fg-muted` | `#60685F` | 次级文本 |
| `--rl-border-subtle` | `#CFD3CA` | 纯装饰分隔 |
| `--rl-border-strong` | `#7B8579` | 必须识别的轮廓 |
| `--rl-accent` | `#E56A32` | 品牌橙、重要操作填充 |
| `--rl-accent-text` | `#AA431C` | 浅底强调文字 |
| `--rl-accent-amber` | `#C89B45` | 档案辅助标记 |
| `--rl-info` | `#226A84` | 信息反馈 |
| `--rl-success` | `#23734A` | 确认完成 |
| `--rl-danger` | `#B93430` | 高风险/错误 |
| `--rl-warning` | `#925900` | 注意/警告 |

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
主题用 `data-rl-theme="light|dark"` 作用于作用域容器；支持系统主题的映射，但不能污染宿主 `:root`。深色建议底色 `#11181B`、表面 `#1D272B`、文字 `#E6E9E2`，其余值在 M2 前通过对比检查定稿。密度用 `data-rl-density="comfortable|compact"`；紧凑模式仍要符合触控场景目标尺寸或给出桌面鼠标密集模式开关。

## 6. 禁止事项
禁止：所有按钮统一橙底白字；全站 8px 以下小字；把背景网格当必要信息边界；假指标；hover 是唯一反馈；动画停止后数据才可读；默认无限扫描循环；复制原作标识/官方 UI 素材。

## 7. 验证方法
`docs`/Showcase 固定展示 320、390、768、1280、1920px；颜色检测遵循 WCAG 2.2 AA：普通文字 4.5:1、大文字 3:1、关键非文本控件 3:1，并对半透明/背景图叠加状态实际取样；键盘 Tab / Shift+Tab 逐项人工复核。
