# 图标批次 2026-10-14-batch-02 · 方向变更与定制集收敛

依据：[ICONS.md](../../../ICONS.md)（1.0 提案版）｜[REVIEW-CHECKLIST.md](../../REVIEW-CHECKLIST.md)｜日期：2026-10-14

> 本批取代 [2026-10-14-batch-01](../2026-10-14-batch-01/scope.md) 的扩展路线。batch-01 的 67 枚候选经维护者评审整体不满意，除本文保留的 4 枚外全部移除；batch-01 文档保留为过程记录。

## 1. 方向决策（维护者，2026-10-14）

1. **基础图标移交 Lucide**：消费项目（Wpi-Agent）以 `lucide-react` 为基础图标层，本库不再自建搜索、箭头、文件、状态等通用字形。
2. **本库只做定制图标**：`@wzrhine/react` 的公共 `Icon` 仅新增 Lucide 未覆盖、且承载 WzRhineLab 科研／档案／智能体语义的字形；本库保持零运行时图标依赖（Draft 0.1 契约不变）。
3. **混排线宽统一为 1.75**：Lucide 默认 strokeWidth=2，宿主（如 Wpi 的 `AppIcon`）应将 Lucide 组件统一设为 `strokeWidth={1.75}`，使两层视觉重量一致。
4. 存量 35 枚内置图标（Settings 等）与 Lucide 重复，属遗留契约；是否废弃单独决策，本批不处理。

## 2. 变更范围

| 字段 | 内容 |
| --- | --- |
| 分支 | `feature/icon-custom-set`（worktree `.worktree/icon-custom-set`，基于 main `a4d3c73`） |
| 变更类型 | 移除 63 枚候选字形；4 枚定制字形经重绘后保留 |
| 受影响文件 | `packages/react/src/components/Icon.tsx`、本证据目录 |
| 公共 API | `iconNames` 由 102 收敛为 39；删除的名称为 batch-01 候选（从未发布），无破坏性变更 |
| 支持尺寸 | 16／20／24px |
| 环境 | Windows 11、Chromium（IAB）、DPR 1 |
| 当前状态 | 4 枚定制字形 **approved**（维护者 WhiteZhi，2026-10-14 批准进入正式基线；macOS 实机证据仍为遗留 blocked 项，不阻断候选基线使用） |

## 3. 保留的定制集与重绘记录

Lucide 全量目录（1890 枚，`lucide-static` icon-nodes.json）核对确认以下语义无等价物。

### Agent · 智能体徽记

最终几何：`<path d="M12 3l8 5v8l-8 5-8-5V8Z"/><circle cx="12" cy="12" r="2.5"/>`

- 迭代：v1 六边形＋十字＋实心点（读作"医疗十字"）→ v2 六边形＋中心圆环（通过）。
- 语义：容器中的智能体核心；Wpi 品牌与子智能体角标（替代 lucide `Bot` 的机器人脸）。
- 不再有实心点（F04 登记项随之取消）。

### Caliper · 精密测量（游标卡尺）

最终几何：`<path d="M3 7h15M18 8.5h3M3 7v10M3 7V4h2M6 7v1.75M9 7v1.75M11 9v8"/><rect x="11" y="4.5" width="5" height="4.5" rx="1"/><path d="M13.5 4.5V3"/>`

- 迭代：v1 概念稿 L 形尺架（读作"椅子"）；v2 量爪夹球（笔画相切读作"挂锁"）；v3 F 形尺架（读作字母 F）；v4 横梁＋方块（不像卡尺）→ v5 按实物结构重构（维护者确认方向）。
- 结构件对照：上量爪钩（M3 7V4h2）、主尺（M3 7h15）、主尺刻度（M6/M9 v1.75）、深度尺（M18 8.5h3）、固定量爪（M3 7v10）、游标框（rect 11,4.5 5×4.5）、锁紧螺钉（M13.5 4.5V3）、游标量爪（M11 9v8）；两爪底端对齐于 y17 形成测量口。
- 结构件 8 项，达 §6.4 复杂度复审线；每项均对应实物零件，语义可回答"删掉会损失什么"。
- 16px 可辨主尺、游标框与双爪关系；14px 未声明。

### Sample · 样本容器

最终几何：`<rect x="9" y="3" width="6" height="3" rx="1"/><rect x="6" y="6" width="12" height="15" rx="2"/><path d="M8 11h8"/><circle cx="12" cy="15.5" r="2.5"/>`

- 迭代：v1 概念稿方框＋圆＋双线（读作"手机"）；v2 瓶＋圆＋底线（圆＋底线读作"人形"）→ v3 瓶盖＋瓶身＋液面线＋液下样本圆（通过）。
- 与 Lucide `test-tube`（试管）语义区分：宽口样本瓶。

### Index · 索引卡

最终几何：`<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M5 6V4h5v2M7 11h10M7 15h6"/>`

- 迭代：v1 概念稿竖向卡片；v2 横卡＋居中页签（读作"手提箱"）→ v3 横卡＋左置页签＋两行内容线（通过）。

## 4. 移除清单

batch-01 的其余 63 枚候选全部移除，基础语义由 Lucide 承担：箭头四向、AtSign、MoreHorizontal、Play、Pause、Search、Menu、List、Copy、Pencil、Pin、Trash2、Paperclip、RefreshCw、RotateCw、Download、Upload、Filter、Link、SquareArrowOutUpRight、CircleCheck、Info、TriangleAlert、Lock、Clock、Globe、Archive、ArchiveRestore、Bookmark、File、FileText、FileSearch、Folder、Tag、Database、History、Activity、Flask、Focus、Layers、Microscope、Molecule、Orbit、Satellite、Scope、Signal、Telemetry、Code2、Command、Cpu、GitBranch、GitFork、Grid2X2、Home、Image、MessageCircleQuestion、ShieldCheck、Sparkles、Terminal、Wrench。

## 5. 验证记录

| 项目 | 环境 | 结果 | 证据 |
| --- | --- | --- | --- |
| 类型检查 `pnpm --filter @wzrhine/react typecheck` | Windows / Node 24 | 通过 | 本节命令记录 |
| 单元测试 `pnpm --filter @wzrhine/react test` | 同上 | 通过（注册表结构测试覆盖 39 名） | 同上 |
| 构建 `pnpm --filter @wzrhine/react build` | 同上 | 通过 | 同上 |
| 4 枚定制字形结构放大（216px 含网格与安全框）＋16/20/24px 实尺寸 | Chromium DPR1 | 维护者评审交互完成，确认 v5/v3/v3/v2 方案 | [optical/](optical/) |
| Lucide 等价物核对 | lucide-static icon-nodes.json（1890 枚） | Agent／Caliper／Sample／Index 无等价物 | §3 |
| showcase 类型检查 `pnpm --filter @wzrhine/showcase typecheck` | Windows / Node 24 | 通过 | 本节命令记录 |
| showcase 构建 `pnpm --filter @wzrhine/showcase build`＋预览人工检查 | 同上，Chromium DPR1 | 通过；Lucide 层与定制层混排视觉一致 | [contexts/](contexts/) |
| macOS 实机、屏幕阅读器 | — | 未执行（blocked） | 后续批次 |

## 6. Showcase 迁移（2026-10-14）

展示站（`apps/docs`）按本决策接入 Lucide 基础层：

- `apps/docs/package.json` 新增 `lucide-react@1.48.0`（showcase 为消费演示应用；`@wzrhine/react` 库本体仍零图标依赖）。
- `apps/docs/src/icons.tsx` 由 11 枚自绘基础图标改为 Lucide 适配层：统一 `width/height=1em`、`strokeWidth=1.75`、`currentColor` 的薄封装，调用方签名不变；`BrandMark`（定制品牌字形）保留为唯一定绘。
- 页面内联图标清理：`AlertDialogPage`／`MenuPage` 的重复 `More`（fill 风格三点）→ `Ellipsis`；`CommandPage` 的 16×16 `DocIcon` → `FileText`；`ArchiveSearch` 的自绘 `List` → `List`（Lucide）。非图标内联 SVG（动效曲线、占位图）未动。
- `IconButtonPage` 新增 "Custom icons" 区块，用公共 `Icon` 展示 4 枚 approved 定制字形（[contexts/showcase-custom-icons.png](contexts/showcase-custom-icons.png)）。
- **视觉基线影响**：多页图标字形更换（Button／Menu／IconButton／Overview／ArchiveSearch 等），`apps/docs/e2e` 视觉基线预期产生差异；按 AGENTS 规则未静默更新基线，待维护者确认视觉变化后执行 `pnpm --filter @wzrhine/showcase test:visual:update`。

## 7. 待决事项

1. 规范 §1.4"不混用图标库"条款已按本决策加注（见 ICONS.md 附记）；规范下一次修订时并入正文。
2. 存量 35 枚内置图标的去留（废弃／保留兼容）需单独 ADR。
3. `packages/agent` 的 16×16 AgentIcon 与 Lucide 层的收敛（规范阶段 E）未执行。
4. Wpi 侧接入动作：`AppIcon` 增加 `strokeWidth={1.75}` 统一线宽；品牌位 `Bot` 换用 `Agent`。
5. 组件库内联控件图标（Select chevron、Dialog close 等 16×16 内联 SVG）属库内实现，随阶段 E 一并核对。
