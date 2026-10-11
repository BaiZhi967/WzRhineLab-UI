# Agent Component Atlas · Agent 组件概念图册

面向 [Agent UI 平台规划](../../planning/agent-ui-platform-plan.md)（拟议包 `@wzrhine/agent`）的原创概念图册：**46 个独立组件**、九个分组，每个组件一张 1600×1000 PNG，并附用途、解剖结构、状态、交互、可访问性、动效、API 与验收清单。

此为视觉/接口设计提案，**不代表仓库已实现相应组件，也不表示图中 API 已正式发布**。按仓库真值优先顺序，生产代码与可执行测试 > 规范化 tokens > 指定规范 > 本图册；图中任意 Props、状态矩阵、数值均须回到 STYLE / MOTION / tokens 复核后方可进入实现。

## 目录结构

```text
docs/concepts/agent/
  README.md            # 本索引
  manifest.json        # 46 个组件的机读元数据（分组、解剖、状态、API 草案）
  COMPONENT-SPECS.md   # 逐组件设计规格（需求初稿，非已批准规范）
  index.html           # 本地离线浏览器（缩略图 + 点击查看大图）
  images/              # 12 张版面级概念图 + contact-sheet 总览 + 46 张单组件 PNG
  source-pages/        # 46 个组件的语义线框 HTML 源页
  SHA256SUMS.txt       # 全部原件的 SHA-256 校验表
```

## 版面级概念图（images/ 根目录）

编号沿用交付原始系列（01–04、08 未包含在本册，编号保留不重排）：

1. `05-three-column-home.png` —— 三栏研究工作台首页
2. `06-agent-conversation-anatomy.png` —— 会话与消息结构解剖
3. `07-responsive-collapse.png` —— 窄屏响应式折叠
4. `09-composer-intervention.png` —— Composer 输入与人工干预
5. `10-agent-run-state-components.png` —— 运行状态组件
6. `11-tool-invocation-components.png` —— 工具调用组件
7. `12-agent-output-intervention-components.png` —— 输出与干预组件
8. `13-agent-components-atlas.png` —— 组件图谱总览
9. `14-process-thinking-detail.png` —— 过程与思考详情
10. `15-permission-approval-detail.png` —— 权限审批详情
11. `16-terminals-child-agents-detail.png` —— 终端与子代理详情
12. `17-context-output-composer-detail.png` —— 上下文 / 输出 / Composer 详情

`images/contact-sheet.png` 为全部 46 个组件的一览拼版；`images/01-*.png` 至 `images/46-*.png` 为单组件图，命名与 `manifest.json` 的 `slug` 一一对应。

## 组件分组（46 个）

工作台（4）· 对话与思考（6）· 工具与执行（3）· 输入与选择（6）· 人工干预（2）· 终端与子代理（4）· 上下文与产物（8）· 状态与恢复（3）· 工具专项（10）。逐项清单见 `COMPONENT-SPECS.md` 开头的导航。

## 设计约束（来自图册本身）

暖纸色 Rhine 研究档案视觉、语义线框、4px 节奏、少量研究橙提示；Agent 包不得依赖 Wpi / Tauri / Query / SDK；减动保留完整信息；运行、同步、动作回执分轴。

## 使用原则

- 在浏览器打开 `index.html` 离线浏览缩略图，点击组件查看完整 PNG。
- 开发实现时以 `COMPONENT-SPECS.md` 为需求初稿，并复核最新仓库代码与 ADR（尤其 [ADR-0008 消费边界](../../development/adr/0008-consumption-boundary.md)）。
- 不要照抄图中任意文本、色码、尺寸与时长数值；一切以 STYLE / MOTION tokens 为准。
- 组件实现完成后，以浏览器真实运行截图与概念图对照，而不只贴概念图。

## 导入记录（2026-10-11）

来源：交付目录 `WzRhine_Agent_Component_Atlas`（维护者本机）。相对交付原件做了两处整理，内容零改动：

- 剔除 5 张与编号文件 SHA-256 完全一致的中文名重复 PNG，及顶层冗余 `contact-sheet.jpg`（保留 PNG 版）；
- `images/source-page/` 下的 46 张单组件 PNG 平铺至 `images/` 根目录，恢复 `index.html` 引用的原始布局。

原件校验表见本目录 `SHA256SUMS.txt`；归档说明见 [ASSET-MANIFEST](../../research/ASSET-MANIFEST.md)。
