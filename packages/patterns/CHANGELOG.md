# Changelog · @wzrhine/patterns

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。`0.x` 阶段允许破坏性变更，但都会在这里写明，并附迁移说明。

## [Unreleased]

`@wzrhine/patterns` 的首个版本，与其余五包同属 0.3.0 版本线。共 32 个公开导出；全量入口 5.52 KB gzip。

### Added

- 建包（[ADR-0014](../../docs/development/adr/0014-patterns-package-and-p030-scope.md)）：`PatternsMessagesProvider`、`usePatternsMessages`、`mergePatternsMessages`、`patternsZhCN` / `patternsEnUS` 文案表与 `@wzrhine/patterns/styles.css` 样式入口（自动 `@import` layout／collection／record 三个分片）。`@wzrhine/react`、`react`、`react-dom`、`motion` 均为 peer 依赖；文案表独立，不并入 `RhineMessages`。
- `ListDetail`：可嵌入主从布局。按自身容器宽度解析 split／overlay（不读全局窗口宽度），SSR 首帧为确定的 split 结构；overlay 打开时列表保持挂载但隐藏且 `inert`，滚动位置在往返间保持；关闭后焦点回到打开它的控件，控件已消失时回到列表区。
- `InspectorPanel`：属性检查区域，标题／eyebrow／元数据／操作／内容槽可组合。`open=false` 时整个区域隐藏且不残留可聚焦控件；覆盖层形态由调用者组合既有 `Drawer`。
- `QueryToolbar`：显式提交的查询工具区。`compositionstart`–`compositionend` 期间 Enter 不提交（含 Safari 先发 `compositionend` 的情形）；`busy` 期间控件保持可聚焦（`aria-disabled`）并丢弃重复提交，焦点不掉到 `body`。
- `AppliedFilters`：已应用条件芯片组，条件 ID 由调用者拥有。移除单项后焦点落到相邻移除按钮；移除最后一项时区域卸载，焦点回落由调用者接管。
- `ViewSwitcher`：视图切换，`radiogroup` / `radio` 语义与 `aria-checked`，方向键在选项间移动。
- `SelectionToolbar`：批量操作工具区，作用于显式有限选择集。操作执行中按钮保持可聚焦并防重复提交，焦点留在工具区。
- `ResourceGrid`：资源卡片网格。选择与打开分离、复选框具名、缩略图保留固有尺寸避免布局抖动；单张图片加载失败只降级该项并给出可访问的失败说明，调用者替换 `src` 后自动恢复；空态与加载骨架复用 `EmptyState` / `Skeleton`。
- `SectionIndex`：章节索引。章节 id 由调用者拥有且与正文标题一一对应；观察器在章节变化与正文后到时重新绑定、卸载时清理；无 JS 时退化为普通锚点链接，减动偏好下不平滑滚动。
