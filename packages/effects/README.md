# @wzrhine/effects

WzRhineLab UI 的**可选**展示动效：解密、扫描、轨道，以及用于对照的四通道动效播放器。`@wzrhine/react` 不依赖本包。

> 实验性（0.x 期间 API 可能调整）；MIT 许可证。

```sh
pnpm add @wzrhine/effects @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import '@wzrhine/effects/styles.css';
import { ArchiveReveal, MotionPlayer } from '@wzrhine/effects';

<MotionPlayer title="ArchiveReveal" demo={({ active }) => <ArchiveReveal text="ARC-1024" revealed={active} />} />;
```

规则：只在用户触发时播放；内容先于动画可读；减动时有等价表现；页面隐藏时暂停。

- 使用说明：[docs/components/effects.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/components/effects.md)
- API 参考（自动生成）：[docs/api/effects.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/api/effects.md)
- 变更记录：[CHANGELOG.md](./CHANGELOG.md)
- 许可证：[MIT](./LICENSE)
