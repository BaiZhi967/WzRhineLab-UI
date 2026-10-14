# 图标批次 2026-10-14-batch-01 · 范围与记录

依据：[ICONS.md](../../../ICONS.md)（1.0 提案版）｜[REVIEW-CHECKLIST.md](../../REVIEW-CHECKLIST.md)｜日期：2026-10-14

> **状态更新（2026-10-14）：本批 67 枚候选经维护者评审整体未获认可，方向调整为"基础图标用 Lucide、本库只做定制"。仅 Agent／Caliper／Sample／Index 保留并经重绘后进入公共集（见 [2026-10-14-batch-02](../2026-10-14-batch-02/scope.md)），其余 63 枚已移除；Wpi 的 66 项 lucide 映射随之作废（Wpi 直接沿用 Lucide）。本文保留为过程记录。**

## 1. 变更范围

| 字段 | 内容 |
| --- | --- |
| 任务 | Wpi-Agent 接入需求（R01）：补齐公共图标集，覆盖 Wpi 现用 66 个 lucide 图标及常用高频语义 |
| 分支 | `feature/icon-system`（worktree `.worktree/icon-system`，基于 main `c53f00f`） |
| 变更类型 | 新增字形（67 枚）＋注册表结构测试 |
| 受影响文件 | `packages/react/src/components/Icon.tsx`、`packages/react/test/icon.test.tsx`、本证据目录 |
| 使用场景 | Wpi-Agent 工作台/会话/工具/设置/文件预览等 119 处 `AppIcon` 调用点；组件库后续消费 |
| 支持尺寸 | 16／20／24px（本批证据覆盖）；14px 未声明 |
| 环境 | Windows 11（26200）、Chromium（IAB）、DPR 1、100% 缩放 |
| 规范版本 | specVersion 1.0 提案版；字形 designRevision 2026-10-14-a |
| 当前状态 | **candidate**（全部 67 枚）；未经维护者逐枚批准前不得描述为 approved |

## 2. Wpi-Agent lucide → 公共 IconName 映射

Wpi 现用 66 个 lucide 名称（`lucide-react@1.48.0`，迁移阶段 P6 计划移除）。下表为完整映射：**66/66 全覆盖**，其中 30 个由既有公共图标承担、36 个由本批新增承担（含 3 个语义映射）。

### 既有公共图标承担（30）

`Settings Settings2 SlidersHorizontal Minus Maximize2 Minimize2 PanelTopClose Power Square FolderOpen FolderPlus FolderMinus FileCode2 FoldVertical Plug Puzzle Boxes ShieldAlert ShieldHalf ChevronUp ChevronDown ChevronLeft ChevronRight Eye ImagePlus MessagesSquare PinOff RotateCcw SquareChartGantt Users X Check Plus`

注：`Maximize`/`PanelTopOpen` 既有但 Wpi 未用；Wpi 的窗口还原用 `Copy`（见下表）。

### 本批新增承担（33 直名 + 3 语义映射）

| lucide (Wpi) | IconName | 说明 |
| --- | --- | --- |
| Archive | `Archive` | 档案盒：盖＋盒体＋把手，源自概念稿，把手双线简化为单线 |
| ArchiveRestore | `ArchiveRestore` | 同母体，把手替换为上行箭头 |
| ArrowDown / ArrowLeft / ArrowRight / ArrowUp | 同名 | 杆 5→19、箭头 6u，`ArrowUp` 即 Wpi 发送钮 |
| AtSign | `AtSign` | @ 提及；外环 r8.5、内环 r3.5、尾钩与外环在 (20.5,12) 相接 |
| Code2 | `Code2` | 双侧尖括号＋斜杠；边界从 lucide 的 2→22 收至 3→21 |
| Copy | `Copy` | 前后双框错位，笔画不交叉 |
| Cpu | `Cpu` | 外框 5→19、引脚至 2.5，收自 lucide 的 2→22 |
| Ellipsis | `MoreHorizontal` | 同形去重：Wpi 中 Ellipsis 与 MoreHorizontal 混用，统一映射 |
| File | `File` | 派生自既有 `FileCode2` 文档母体（6→18、折页 (14,3)→(18,7)） |
| FileText | `FileText` | 同母体＋两条内容横线（概念稿 file 的折页比例与母体冲突，未直接采用） |
| Folder | `Folder` | 既有文件夹母体（`M3 6h7l2 2h9v10H3z`）的关闭态；概念稿 folder 未采用 |
| GitBranch | `GitBranch` | 弧终点与节点圆边精确相接；未采用第一批草案 branch（越界） |
| GitFork | `GitFork` | 三节点＋汇流，连接点均落在圆边 |
| History | `History` | 概念稿采用；逆时针箭头＋表针，与 `Clock` 共享表针几何 |
| Image | `Image` | 既有 `ImagePlus` 母体去掉加号 |
| Info | `Info` | 圆 r8.5＋i；点用圆头点笔法（同 `ShieldAlert` 族） |
| MessageCircleQuestion | `MessageCircleQuestion` | 圆泡 r8.5＋尾尖 (3,21) 收在留白内 |
| MoreHorizontal | `MoreHorizontal` | 三点圆头点 |
| Paperclip | `Paperclip` | 45° 回形针；顶部弧尖距边 ≥1.5u |
| Pencil | `Pencil` | 斜向铅笔＋箍线 |
| Pin | `Pin` | 派生自既有 `PinOff` 的图钉母体去斜线 |
| RefreshCw | `RefreshCw` | 双弧双箭头；与 `RotateCcw`/`RotateCw` 区分语义（刷新 vs 重置/重做） |
| RotateCw | `RotateCw` | `RotateCcw` 的镜像（sweep 翻转） |
| Search | `Search` | 概念稿采用：圆 (10.5,10.5) r6.5＋柄 |
| ShieldCheck | `ShieldCheck` | 既有盾牌母体＋勾（概念稿 shield 的 y2→22 越界，未直接采用） |
| Sparkles | `Sparkles` | 大芒星 (12,4)→(18,12)→(12,20)→(6,12)＋右上小芒星 |
| Trash2 | `Trash2` | 桶身底从 y22 收至 y21、提手起自 y2.5 |
| TriangleAlert | `TriangleAlert` | 三角 M12 4l9 16H3Z，圆连接成形；叹号族同 `ShieldAlert` |
| TerminalSquare | `Terminal` | 语义映射：屏幕族框（4,5→20,19, rx1）＋提示符＋光标 |
| Bot | `Agent` | 语义映射：WzRhine 智能体徽记（六边形＋十字＋实心语义点） |
| Copy（窗口还原） | `Copy` | 语义复用：Wpi 以 Copy 表示 maximized 态还原 |

### 本批其余新增（高频与科研/档案族，34 枚）

Foundation：`Play`（轮廓三角，光学微调候选=零偏移，见 §5 待决）、`Pause`、`Menu`、`List`、`Download`／`Upload`（共用托盘基线 M4 18v3h16v-3）、`Filter`、`Link`、`SquareArrowOutUpRight`、`CircleCheck`（r8.5 统一大圆）、`Lock`、`Clock`、`Globe`。
Archive：`Bookmark`、`FileSearch`（文档母体＋页内放大镜）、`Tag`、`Index`、`Database`（椭圆柱顶从 y2 收至 y2.5）。
Research：`Activity`、`Caliper`、`Flask`、`Focus`、`Layers`（删去概念稿中心微线）、`Microscope`、`Molecule`（键线止于圆边）、`Orbit`（卫星实心点）、`Sample`、`Satellite`、`Scope`（刻度从 2/22 收至 3/21）、`Signal`（删去与柱顶相切的趋势线）、`Telemetry`（概念稿 thermal 更名，屏幕族框）。
Workspace：`Command`（rx3→2）、`GitBranch`、`GitFork`、`Grid2X2`、`Home`。

### 概念稿未采用项

| 概念稿 | 处置 | 理由 |
| --- | --- | --- |
| icon-settings | 未采用 | 现有 `Settings` 是公共契约；概念齿轮无语义增量（SEM-02） |
| icon-file | 重构采用 | 折页 (14,3)→(19,8)、页宽至 x19 与 `FileCode2` 母体冲突（F07），按母体重绘为 `File`/`FileText` |
| icon-folder | 重构采用 | 同上，改用既有文件夹母体 |
| icon-shield | 重构采用 | 概念稿 y2→22 可见笔画越出 [1.5,22.5]（GEO-06），改用既有盾牌母体 |
| icon-document-search | 重构采用 | 概念稿页形未闭合、放大镜探出页外；按文档母体闭合页形、镜内收 |
| icon-thermal | 更名采用 | 字形语义为遥测面板，命名 `Telemetry`（SEM-03 表达稳定对象） |

## 3. 几何与光学决策

- 族不变量：全部 24u 母版、1.75u、round cap/join、`fill=none`、`stroke=currentColor`、透明字形（F01–F05）。
- 实心语义点 2 处（F04 登记）：`Agent` 中心 r1.25、`Orbit` 卫星 r1.25，均 `fill="currentColor" stroke="none"`；空心节点不再被连线穿越（GEO-08）。
- 大圆族统一 r8.5：`Info`、`CircleCheck`、`Clock`、`Globe`、`MessageCircleQuestion`、`AtSign`（外环）。
- 可见笔画边界：全部控制在 [2,22] 优先区内；`Paperclip` 顶部弧尖约 y1.7（>1.5，登记为最贴近边界者，无越界例外）。
- 归一化与微调分开记录：本批几何均直接在规范坐标系绘制（geometryNormalization=N/A）；opticalCorrection 全部为 0（候选基线，等待与基准样本混排人工复核）。
- 成对稳定：`Download`/`Upload` 托盘同坐标；`Play`/`Pause` 同槽位；`RotateCcw`/`RotateCw`/`RefreshCw` 弧族一致；箭头四向同杆长。

## 4. 验证记录

| 项目 | 环境 | 结果 | 证据 |
| --- | --- | --- | --- |
| 类型检查 `pnpm --filter @wzrhine/react typecheck` | Windows / Node 24 | 通过，exit 0 | 本节命令记录 |
| 单元测试 `pnpm --filter @wzrhine/react test` | 同上 | 34 文件 573 用例全过（含新增注册表结构测试：去重、共享栅格属性、元素白名单） | 同上 |
| 构建 `pnpm --filter @wzrhine/react build` | 同上 | 通过（dist 13 css） | 同上 |
| 依赖包 `agent`/`effects` typecheck | 同上 | 通过 | 同上 |
| 结构放大检查（23 枚复杂/新绘字形，240px 含网格与安全框） | Chromium DPR1 | 人工检查通过：无粘连、无意外相切、无越界 | [optical/](optical/) |
| 尺寸×主题矩阵 16/20/24px × 浅/深 | Chromium DPR1 | 人工检查通过：16px 全部可辨，深色系无白块（实心点为 currentColor） | [sizes-themes/](sizes-themes/) |
| 成对切换（Play/Pause、Download/Upload、旋转族、文件夹族、盾牌族、箭头/chevron） | 同上，同槽位 24px | 人工检查通过：共用基线无跳位 | sizes-themes/dark-24px-and-pairs.png |
| macOS 实机 | — | **未执行（blocked）** | 需维护者抽样 |
| 14/18px、屏幕阅读器、RTL 实机 | — | 未执行（14px 未声明；RTL 仅物理方向图标按 §13.2 记录） | 后续批次 |

## 5. 待决与限制

1. `Play` 轮廓三角的光学微调：当前为零偏移候选（几何基线 x7.5→19.5）；需与 `Pause` 在真实按钮中做零微调 vs ±0.125u 候选人工对照后定案（OPT-03）。
2. 67 枚全部保持 `candidate`；建议基准样本组（覆盖稀疏/密集/对称/非对称）：`Search`、`Folder`、`FileText`、`Archive`、`Check`、`X`、`Play`、`Layers`、`Scope`、`Microscope`、`Home`、`Terminal`。
3. 存量收敛（规范阶段 E）未执行：`packages/agent` 的 16×16 `AgentIcon`、展示站内联图标与本批存在语义重叠（send/stop/attach 等），需按组件逐批核对，不在本批处理。
4. Wpi 侧高频但暂无对应功能的图标（Mic、ThumbsUp/Down、Sun/Moon 主题切换）未纳入；Wpi 当前为浅色单主题。
5. macOS 真实平台证据缺失（RND-05），进入正式基线前需补。

## 6. 结论

通过作者自检，进入**候选基线**；等待维护者按《验收清单》复核并决定基准样本与 `Play` 微调。未提交、未推送、未发布。
