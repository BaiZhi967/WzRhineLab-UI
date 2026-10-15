# ADR-0014 · 建立 patterns 包与 0.3.0 九候选裁决

- 状态：**Accepted**（2026-10-15 维护者确认三项关键决策）· 关联：P030-00（0.3.0 规划）；基线 0.2.0（`c6b2af6`）
- 范围：`@wzrhine/patterns` 新包的建立与否、目录与依赖边界；0.3.0 九个候选能力的公共组件／recipe 归属；patterns 组件的文案与样式接入方式
- 不在范围：组件 Props 的逐项签名与测试矩阵（见 `docs/roadmap/0.3.0-contracts.md`）；recipes 的示例文件位置（P030-01 决定）；对现有五包公开 API 的任何改动

## 背景

[0.3.0 计划](../../roadmap/0.3.0-plan.md) 列出九个候选能力：ListDetail、InspectorPanel、QueryToolbar、AppliedFilters、ViewSwitcher、SelectionToolbar、ResourceGrid、RecordDetail、SectionIndex，并要求 P030-00 逐一裁决公共组件或 recipe，再决定是否创建 `@wzrhine/patterns`。

[架构文档](../../roadmap/architecture.md) §3/§4 给出判定标准：只有存在稳定交互合同、独立消费价值与实际公共组件时才拆包；只有布局拼接时先交付 recipes，不为占位创建空包。新建公共组件必须能回答：可复用的行为是什么、现有能力为何不足、为什么不是一个 recipe。

现状事实（2026-10-15 核对）：

- `@wzrhine/react` 已有 50+ 公开组件。与本裁决相关的现有契约：`DataTable`（`getRowId` / `sort` / `selectedIds: ReadonlySet<string>` / `status: 'ready' | 'loading' | 'error'` / `onRetry` / `pagination`）、`Workbench`（应用级 rail + index + main 外壳，`indexOpen` / `indexSize` 受控）、`Drawer`（`initialFocus` / `finalFocus` / `onCloseRequest` / `onClosed` 焦点合同）、`RecordHeader`（`recordId` / `status` / `trail` / `meta` / `headingLevel`）、`MetadataList`、`EmptyState`（`kind: 'empty' | 'no-results' | 'no-permission' | 'first-use'` 已区分无记录与无结果）、`Pagination`（`busy` 期间控件保持可聚焦）。
- react 包无 toolbar 类组件、无 SegmentedControl、无滚动观察类组件；`ArchiveCard` 为纯展示卡，无受控选择与图片生命周期合同。
- 文案机制由 ADR-0009 固定：Provider 级文案表 + 组件属性覆盖，组件代码内不得出现中文字面量。

## 决策

### 1. 建立 `@wzrhine/patterns` 包

裁决通过后 0.3.0 有八个公共模式组件（见 §2），满足拆包三条件：稳定交互合同（焦点返回、IME 提交保护、选择范围语义、观察器生命周期）、独立消费价值（任何集合浏览页可直接组合）、实际公共组件数量足够。

依赖闭包保持单向：

```text
tokens ← react ← patterns
              ← effects / agent-core / agent（不依赖 patterns，也不被 patterns 依赖）
```

- `dependencies`：`@wzrhine/tokens`（`workspace:*`）
- `peerDependencies`：`@wzrhine/react`（`workspace:^`）、`react` / `react-dom`（`^19.0.0`）、`motion`（`^14.0.0`）
- patterns 不依赖 `@wzrhine/agent` 系列；基础组件不反向依赖 patterns

> 2026-10-15 实施修订：初稿把 `@wzrhine/react` 写入 dependencies；实施时改为 peer（`workspace:^`），与 effects／agent 的既有惯例一致——patterns 组件必须与宿主共享同一份 `@wzrhine/react`，否则 RhineProvider 上下文与类型身份会出现双实例。

目录（实现任务中实际创建）：

```text
packages/patterns/
  src/layout/        # ListDetail、InspectorPanel
  src/collection/    # QueryToolbar、AppliedFilters、ViewSwitcher、SelectionToolbar、ResourceGrid
  src/record/        # SectionIndex
  src/provider/     # PatternMessages.tsx：文案表与 Provider（见 §3）
  src/index.ts
  src/components.css # 聚合样式，经包导出 "./styles.css"
```

与 `Workbench` 的边界：Workbench 是每页一个的应用级外壳（rail + index + main，含导航语义与唯一 main landmark）；ListDetail 是可嵌入页面任意位置、可同页多实例的主从模式容器，不渲染 nav、不渲染第二个 main。InspectorPanel 是区域组件；覆盖层形态由调用者组合现有 Drawer 实现（样张见 showcase `#/patterns`），patterns 不新增焦点陷阱。

### 2. 九候选裁决：八组件 + 一 recipe

| 候选 | 裁决 | 核心理由（可复用行为 / 现有能力为何不足） |
| --- | --- | --- |
| ListDetail | 公共组件 | 容器测量宽窄切换（非全局窗口宽度）、关闭后焦点返回与稳定 fallback、快速切换取消过期焦点任务、同页多实例隔离、SSR 确定初始模式、滚动位置保持。Workbench 的 index/main 是应用级外壳，不可页内嵌入、不可多实例 |
| InspectorPanel | 公共组件 | 可访问名称合同、隐藏时不得残留可聚焦控件、长路径／未知类型／禁用／执行中的既有表现。焦点清理是组件级责任，recipe 无法承诺 |
| QueryToolbar | 公共组件 | 中文 IME 组合期间 Enter 不误提交（composition 事件保护）、输入中值与已提交查询分离、reset 动作聚合。Input／Field 无提交语义区分 |
| AppliedFilters | 公共组件 | 稳定条件 ID、单项移除后焦点落位、清空最后一项的焦点去向、长标签换行。Tag／Badge 无移除交互合同 |
| ViewSwitcher | 公共组件 | 工具栏分段的 radiogroup 语义、当前值播报、图标不得作唯一标签、禁用与缺失选项 fallback。react 包无 SegmentedControl；RadioGroup 是表单控件，视觉与语义形态不符 |
| SelectionToolbar | 公共组件 | 已选数量与范围说明（当前页／已加载／全部）、执行中防重复提交、失败保持选择可恢复。无任何 toolbar 类现有能力 |
| ResourceGrid | 公共组件 | 图片生命周期（保留尺寸、加载／失败占位）、选择／打开／更多操作三入口不嵌套、列表语义 + 命名 checkbox、观察器与对象 URL 清理、无缩略图仍可操作。ArchiveCard 无受控选择 |
| RecordDetail | **降为 recipe** | 组合 RecordHeader + MetadataList + 分区容器 + 状态槽位，均为已发布能力；真正行为（章节定位）由 SectionIndex 承载，剩余部分是排版骨架，触发「仅增加 padding、标题与背景不足以证明公共组件」红线 |
| SectionIndex | 公共组件 | 显式滚动根、固定标题偏移、内容高度变化重观察、当前章节被动高亮不抢焦点、无 JS 锚点降级、减动不平滑滚动、卸载清理观察器、稳定非随机 ID。无对应现有能力 |

**RecordDetail 降级记录**（按 0.3.0 计划 §3 要求）：

- 原因：见上表；不删除任何场景交付目标。
- 替代方式：详情页 recipe 以 RecordHeader + MetadataList + SectionIndex + Surface／Skeleton／Alert 组合出完整详情布局，包含 loading／error／旧数据槽位的标准组合方式（`aria-busy`、错误重试入口、旧内容与新 ID 的视觉区分）。
- 验收位置：详情页 recipe（P030-07）与 archive-desk 档案页／资源页（P030-08）。
- 若维护者评审否决本降级，恢复为带状态槽位的薄组件，不影响其余八项裁决。

### 3. 文案机制：独立 PatternsMessages 表

遵循 ADR-0009 的机制（Provider 表 + 组件属性覆盖 + zhCN 内置默认 + enUS 参考译文 + 双表键一致性测试），但 patterns 的键位**不并入** react 的 `RhineMessages` 接口：

- react 的文案表不为页面模式层增长，两包升级节奏解耦，且不产生「react 类型知道 patterns 组件」的反向耦合。
- patterns 提供 `PatternsMessagesProvider`（嵌套浅合并，机制同 ADR-0009 §1）与 `zhCN` / `enUS` 表；宿主已有 `RhineMessagesProvider` 时两者独立使用，互不干扰。
- patterns 组件内同样禁止中文字面量；package-boundary 检查规则扩展到 `packages/patterns`。
- 主题、密度、动效与 portal 继续由 react 的 `RhineProvider` 提供；patterns 不新建主题体系。

### 4. 样式与类名

- 类名继续 `rl-` 前缀 + 组件名（`rl-list-detail`、`rl-query-toolbar`…），继续消费 `--rl-*` tokens，不新增前缀体系。
- 样式经 `@wzrhine/patterns/styles.css` 显式导入，发布入口无 CSS 副作用，与 react 包的 `sideEffects` / `exports` 约定一致。

## 后果

- 正面：react 包保持基础层定位与体积；页面模式获得独立版本与 tree-shaking 边界；8 个组件的交互合同有了统一归属。
- 代价：P030-01 必须完成新包全套门禁（workspace 构建、dist/types、API report、license、size、真实安装验证），版本同步进包组发布流程。
- 风险与对策：若后续裁决被推翻（如更多候选降级为 recipe）导致 patterns 组件数明显缩水，重开本 ADR 记录取舍，不静默保留空壳包。
