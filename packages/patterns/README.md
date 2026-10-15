# @wzrhine/patterns

面向科研、档案类界面的页面级公共模式：主从布局、集合查询工具区、已应用条件、视图切换、批量选择操作、资源网格与章节索引。基于 `@wzrhine/react` 组合，不新增交互底座；查询、筛选、选择与详情状态全部由调用者持有（受控合同见 [0.3.0 公共合同](../../docs/roadmap/0.3.0-contracts.md)）。

> 原创设计，非官方项目。MIT 许可证；`0.x` 阶段 API 可能调整。

```sh
pnpm add @wzrhine/patterns @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/patterns/styles.css';
import { PatternsMessagesProvider, patternsEnUS } from '@wzrhine/patterns';

export function App() {
  return (
    <PatternsMessagesProvider messages={patternsEnUS}>
      {/* ListDetail、QueryToolbar 等组件自 0.3.0 起加入（P030-02…06） */}
    </PatternsMessagesProvider>
  );
}
```

当前公开能力：`PatternsMessagesProvider`（文案表 Provider，机制对齐 ADR-0009）、`usePatternsMessages`、`mergePatternsMessages`、`patternsZhCN` / `patternsEnUS`。组件按 [执行清单](../../docs/roadmap/execution-backlog.md) 逐任务加入。
