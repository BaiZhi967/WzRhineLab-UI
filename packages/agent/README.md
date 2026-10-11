# @wzrhine/agent

WzRhineLab UI 的 **Agent 界面组件**：工作台外壳、会话索引、消息流与思考过程、工具记录（含十类工具专项与 Diff）、Composer（token 镜像、@ 引用、/ 命令、模型与权限选择）、审批与问卷、终端、子任务、上下文用量、产物与文件预览，以及配套的 Agent 动效。

组件只接收 view-model 快照（类型来自 [`@wzrhine/agent-core`](../agent-core/README.md)，本包会重新导出）并发出动作回调；不包含任何运行时、请求、缓存、Markdown / 高亮库或桌面 API。

> 实验性；未发布到 npm（许可证待定）。

```sh
pnpm add @wzrhine/agent @wzrhine/agent-core @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/agent/styles.css';
import { RhineProvider } from '@wzrhine/react';
import { AgentStatus, runStatusMeta } from '@wzrhine/agent';

<RhineProvider>
  <AgentStatus {...runStatusMeta.running} label="运行中" />
</RhineProvider>;
```

- 范围与拆包：[ADR-0010](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/adr/0010-m12-agent-ui-plan.md)；契约：[ADR-0011](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/adr/0011-agent-contracts.md)；动效：[ADR-0012](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/adr/0012-agent-motion.md)
- 接入指南：[docs/planning/agent-ui-adoption.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/planning/agent-ui-adoption.md)
- API 参考（自动生成）：[docs/api/agent.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/api/agent.md)
- 变更记录：[CHANGELOG.md](./CHANGELOG.md)
