# @wzrhine/agent-core

WzRhineLab UI Agent 界面的**框架无关契约**：view-model 类型、三条状态轴（运行 / 同步 / 动作回执）、状态元数据（字形 + 色调），以及 adapter 共用的纯函数（`mergeById` 去重与 revision 守卫、`buildTree`、`lineDiff` / `parseUnifiedDiff`、composer token 编码、格式化）。不依赖 React、DOM 或任何运行时，可以在 Node、Worker 或服务端使用。

> 实验性（0.x 期间 API 可能调整）；MIT 许可证。组件在 [`@wzrhine/agent`](../agent/README.md)，它会重新导出本包的全部公开项。

```ts
import { mergeById, runStatusMeta, toPlainText } from '@wzrhine/agent-core';
import type { MessageView, RunView } from '@wzrhine/agent-core';
```

- 契约：[ADR-0011](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/adr/0011-agent-contracts.md)
- API 参考（自动生成）：[docs/api/agent-core.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/api/agent-core.md)
- 变更记录：[CHANGELOG.md](./CHANGELOG.md)
- 许可证：[MIT](./LICENSE)
