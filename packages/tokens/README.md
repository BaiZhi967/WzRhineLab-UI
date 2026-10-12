# @wzrhine/tokens

WzRhineLab UI 的语义设计变量：`--rl-*` CSS 自定义属性（作用域为 `.rl-theme`，不修改 `:root`），以及一份类型化的 token 清单和对比度工具。

> 原创配色，不是任何游戏的官方色板。MIT 许可证。

```sh
pnpm add @wzrhine/tokens
```

```ts
import '@wzrhine/tokens/styles.css';
import { contrastRatio, motionDurations } from '@wzrhine/tokens';
```

```html
<div class="rl-theme" data-rl-theme="dark" data-rl-density="compact">…</div>
```

- 主题：`data-rl-theme="light" | "dark" | "system"`
- 密度：`data-rl-density="comfortable" | "compact"`
- 强制减动：`data-rl-motion="reduce"`

所有组件实际用到的前景/背景组合，都由测试在三种主题下验证 WCAG 2.2 AA。

- API 参考（自动生成）：[docs/api/tokens.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/api/tokens.md)
- 变更记录：[CHANGELOG.md](./CHANGELOG.md)
- 许可证：[MIT](./LICENSE)
