# 页面模式（@wzrhine/patterns）

- 状态：**0.3.0（P030）** · 契约：[ADR-0014](../development/adr/0014-patterns-package-and-p030-scope.md) · [0.3.0 公共合同](../roadmap/0.3.0-contracts.md)
- 底座：`@wzrhine/react` 公开组件（peer），不直接依赖 Base UI；动效与主题沿用现有 Provider
- 源码：`packages/patterns/src/`，样式经 `@wzrhine/patterns/styles.css` 显式导入 · Showcase：`#/patterns`（组件样张）、`#/recipes`（页面组合）
- 参考应用：`examples/archive-desk`（档案 / 资源两种数据形态 + 故障注入）

## 用途 / 非用途

| 用于 | 不用于 |
| --- | --- |
| 集合浏览页：查询、条件、视图切换、批量选择、资源网格 | 应用外壳（继续用 `Workbench`） |
| 页内主从布局与返回路径、记录详情章节定位 | 完整编辑器、图表、虚拟化长列表（另行立项） |
| 属性检查区域与批量操作条 | 宿主业务动作（组件只回传意图，执行在调用者） |

**状态合同**：查询、筛选项、排序、页码、视图模式、`selectedIds`、详情 ID、异步事实全部由调用者持有；组件提供受控值与变更回调，不发起请求、不读写存储、不绑定路由。选择基于显式有限 ID 集合（`ReadonlySet<string>`，与 DataTable 一致），当前页 / 已加载 / 全部结果三种范围分别说明，不暗示「全部结果已选择」。

## 安装

```sh
pnpm add @wzrhine/patterns @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/patterns/styles.css';
```

## 组件

### ListDetail · 主从布局

可嵌入页面任意位置、可同页多实例的主从容器；不渲染 `nav` 与第二个 `main`。`auto` 模式测量**自身容器**（非全局窗口宽度）在 `split`／`overlay` 间切换；SSR 首屏恒为确定的结构。打开详情后焦点进入返回入口；关闭回到触发控件，控件已消失时回落到列表区域；记录快速切换不产生过期焦点任务。overlay 打开期间列表保持挂载（隐藏 + `inert`），滚动位置在往返之间保留。

```tsx
<ListDetail
  mode="auto" modeThreshold={720} onModeResolve={(m) => …}
  detailId={detailId} onDetailChange={setDetailId}
  list={<DataTable … />}        // 或 ResourceGrid / 自定义列表
  detail={<RecordHeader … />}   // detailId 非 null 时渲染
/>
```

覆盖层形态由调用者组合现有 `Drawer` 实现（样张见 `#/patterns` 的「InspectorPanel · 覆盖层组合」），patterns 不新增焦点陷阱：焦点捕获、Escape 关闭、滚动锁定与关闭后焦点回收全部来自 `Drawer`。

### InspectorPanel · 属性检查区域

带可访问名称的语义区域：眉标、标题、元数据（组合 `MetadataList`，空值沿用其「未记录」合同）、操作与内容槽。`open={false}` 时整个区域经原生 `hidden` 隐藏，不残留可聚焦控件。不执行业务动作。

### QueryToolbar · 查询工具区

搜索输入 + 提交 + 重置 + 筛选控件槽（`children`）+ 结果摘要（`role="status"` 播报）。输入中值与已提交查询分离，仅显式提交（Enter／按钮／空提交），**中文 IME 组合期间 Enter 不提交**（覆盖 Chrome `isComposing` 与 Safari compositionend 两种时序）。`busy` 时提交与重置禁用、输入保留。查询变更后的页码重置由调用者处理（recipe 中演示）。

### AppliedFilters · 已应用条件

稳定条件 ID + 可读标签；单项移除后焦点落相邻项，移除最后一项时由调用方接管焦点回落（区域已卸载）；提供 `onClearAll` 时渲染清空入口。无条件时不渲染。「没有记录」与「没有结果」的区分由集合区空状态承担。

### ViewSwitcher · 视图切换

工具栏分段的 `radiogroup`：roving tabindex、方向键移动即选择（跳过禁用项、支持 Home/End）、`aria-checked` 播报当前值；图标不能是唯一标签。切换只回传意图——保持查询、选择与页码是调用者的职责。`value` 越界时渲染无选中态，fallback 由调用者保证。

### SelectionToolbar · 批量操作条

已选数量（数字经 Provider 的 locale 格式化）、范围说明、清空与批量动作。零选择不渲染。动作执行在调用者；`busy` 动作禁用自身防重复提交，失败后选择保持可恢复（调用者继续如实回传 `selectedCount`）。

### ResourceGrid · 资源网格

`ul > li` 列表语义 + 命名 checkbox + 标题作打开入口，三入口互不嵌套；不实现 ARIA grid 导航。缩略图保留固有尺寸（防布局跳动），加载失败单项降级为占位（不影响整格），`src` 更换后自动恢复；无缩略图仍可操作。`loading` 骨架卡、`error` 重试、空态文案；对象 URL 与观察器的释放归创建方。

### SectionIndex · 章节目录

锚点导航 + 被动当前章节高亮（`IntersectionObserver`，显式 `scrollRoot` + 固定标题偏移；观察不抢焦点）。无 JS 时为普通锚点；`smoothScroll` 默认关闭且减动时强制不平滑；卸载与章节变化时清理/重建观察器。章节 ID 由调用者提供且稳定，重复标题靠 ID 区分。

## 文案

独立 `PatternsMessagesProvider`（机制对齐 ADR-0009：组件属性 > 最近 Provider > 内置 zhCN；`patternsEnUS` 为参考译文）。键位不并入 react 的 `RhineMessages`——两包升级节奏解耦（ADR-0014 §3）。

## 迁移 / 兼容

- 0.3.0 新包首版，无既有消费者迁移。
- react／tokens／effects／agent 系列公开 API 在本版零改动；`archive-desk` 本地存储键升级为带版本（`records:v2`、`resources:v1`），旧键数据失效后回到样例数据，无迁移必要。
