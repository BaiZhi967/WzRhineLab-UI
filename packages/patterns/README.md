# @wzrhine/patterns

面向科研、档案类界面的页面级公共模式：主从布局、集合查询工具区、已应用条件、视图切换、批量选择操作、资源网格与章节索引。基于 `@wzrhine/react` 组合，不新增交互底座；查询、筛选、选择与详情状态全部由调用者持有（受控合同见 [0.3.0 公共合同](../../docs/roadmap/0.3.0-contracts.md)）。

> 原创设计，非官方项目。MIT 许可证；`0.x` 阶段 API 可能调整。

```sh
pnpm add @wzrhine/patterns @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import * as React from 'react';
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/patterns/styles.css';
import { ListDetail, QueryToolbar } from '@wzrhine/patterns';

export function ArchivePage() {
  const [query, setQuery] = React.useState('');
  const [detailId, setDetailId] = React.useState<string | null>(null);

  return (
    <ListDetail
      mode="auto"
      detailId={detailId}
      onDetailChange={setDetailId}
      list={
        <>
          <QueryToolbar query={query} onQueryChange={setQuery} resultSummary={<span>共 24 条</span>} />
          {/* 任意列表：DataTable、ResourceGrid 或自定义结构 */}
        </>
      }
      detail={detailId ? <RecordBody id={detailId} /> : null}
    />
  );
}
```

## 组件

| 组件 | 用途 |
| --- | --- |
| `ListDetail` | 可嵌入的主从布局。按**自身容器**宽度（非全局窗口）解析 split／overlay；SSR 首帧为确定的 split 结构；关闭详情后焦点回到打开它的控件，列表滚动位置在往返间保持。 |
| `InspectorPanel` | 属性检查区域：标题、元数据、操作与内容槽。`open=false` 时整个区域不残留可聚焦控件。覆盖层形态由调用者用 `Drawer` 组合。 |
| `QueryToolbar` | 显式提交的查询工具区。IME 组合期间 Enter 不误提交；`busy` 期间控件保持可聚焦（`aria-disabled`），焦点不掉到 `body`。 |
| `AppliedFilters` | 已应用条件芯片组。移除单项后焦点落到相邻移除按钮；移除最后一项时区域卸载，焦点回落由调用者接管。 |
| `ViewSwitcher` | 列表／网格等视图切换，`radiogroup` 语义 + 方向键。 |
| `SelectionToolbar` | 批量操作工具区，作用于显式有限选择集。操作执行中按钮保持可聚焦并防重复提交。 |
| `ResourceGrid` | 资源卡片网格。选择与打开分离、复选框具名、缩略图保留固有尺寸；单张图片加载失败只降级该项，调用者换 `src` 后自动恢复。 |
| `SectionIndex` | 记录详情的章节索引。章节 id 由调用者拥有且须与正文标题对应；无 JS 时退化为普通锚点链接，减动偏好下不平滑滚动。 |

## 文案与 locale

文案表独立于 `@wzrhine/react`，不并入 `RhineMessages`（[ADR-0014](../../docs/development/adr/0014-patterns-package-and-p030-scope.md) §3）：

```tsx
import { PatternsMessagesProvider, mergePatternsMessages, patternsEnUS } from '@wzrhine/patterns';

<PatternsMessagesProvider messages={mergePatternsMessages(patternsEnUS, { listDetail: { back: 'Back' } })}>
  {children}
</PatternsMessagesProvider>;
```

内置 `patternsZhCN`（默认）与 `patternsEnUS`；数字格式沿用最近的 `RhineProvider` / `RhineMessagesProvider` 的 locale。

## 其他

- 组件说明与键盘路径：[docs/components/patterns.md](../../docs/components/patterns.md)
- 完整 API（32 个公开导出）：[docs/api/patterns.md](../../docs/api/patterns.md)
- 样式入口 `@wzrhine/patterns/styles.css` 自动 `@import` layout／collection／record 三个分片；入口本身无 CSS 副作用（[ADR-0002](../../docs/development/adr/0002-source-exports-and-style-entry.md)）。
- [CHANGELOG](CHANGELOG.md) · [LICENSE](LICENSE)
