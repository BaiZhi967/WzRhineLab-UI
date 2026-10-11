# @wzrhine/react

面向科研、档案类界面的 React 组件库：可访问性优先，交互底座为 Base UI，动效使用 `motion/react`，视觉全部由 `--rl-*` tokens 决定。

> 原创设计，非官方项目。`0.x` 阶段，未发布到 npm（许可证待定）。

```sh
pnpm add @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import { Button, Field, Input, RhineProvider } from '@wzrhine/react';

export function App() {
  return (
    <RhineProvider theme="light">
      <Field label="记录编号" description="格式 ARC-0000。">
        <Input mono />
      </Field>
      <Button>保存记录</Button>
    </RhineProvider>
  );
}
```

- 入口没有 CSS 副作用：样式需要按上面的方式显式导入（ADR-0002）。
- Dialog、AlertDialog、Drawer、Select、Tooltip、Popover、Menu、Toast 必须放在 `RhineProvider` 内，才能继承主题和减动设置。
- 组件：Button、IconButton、Surface、StatusBadge、Text、Separator、VisuallyHidden、Field、Input、Textarea、Checkbox、CheckboxGroup、RadioGroup、Radio、Switch、Fieldset、Form、Tabs、Tooltip、Dialog、Select、Popover、Menu、Toast、RecordHeader、MetadataList、ArchiveCard、StatusIndicator、Timeline、DataTable，以及 Pagination、Breadcrumb、Progress、Meter、Stat，以及 AlertDialog、Drawer、Alert、Callout、EmptyState、Skeleton、Spinner。
- Motion Core（ADR-0007）：动效预设 `transition` / `duration` / `ease`，`useRhineMotion()`（`reduced`、`resolve(kind, name)` 按属性类型减动），`MotionPresence`、`RhineMotionGroup` / `RhineMotionItem`，`useMotionLifecycle`、`usePageVisible`、`useInViewport`、`useLatestGuard`；`ArchiveCard motion="identity"` 与 `ArchiveIdentity`。见 [MOTION-PATTERNS.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/design/MOTION-PATTERNS.md)。

文档：
- 组件说明：[docs/components](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/components)
- API 参考（自动生成）：[docs/api/react.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/api/react.md)
- 变更记录与迁移：[CHANGELOG.md](./CHANGELOG.md)
