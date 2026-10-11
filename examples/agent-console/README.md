# agent-console · Agent 控制台示例（M12）

独立 Vite SPA，演示「消费者 adapter」接入模式（[agent-ui-adoption.md](../../docs/planning/agent-ui-adoption.md) §1–2、[ADR-0011](../../docs/development/adr/0011-agent-contracts.md)）。只使用公开入口 `@wzrhine/agent`、`@wzrhine/agent-core`、`@wzrhine/react`、`@wzrhine/tokens` 及其 `styles.css`，不引用 `packages/*/src` 或 Showcase。界面上的所有数据都是示例，不是真实监测指标。

## 结构

- `src/adapter/mockRuntime.ts`：模拟运行时，DTO 使用 snake_case（`waiting_approval`、`executing_tool`）。事件流里故意放了同一 `event_seq` 的重复事件、乱序到达（留下短暂缺口）和旧修订重放；第一次批准会丢失回执（`timeout`），但运行时记下了 action_id，用同一 id 重试时只执行一次。
- `src/adapter/adapter.ts`：DTO → view-model（kebab-case）映射一次完成；用 `mergeById` 合并、`isStaleRevision` 拦截旧修订、`sequenceGaps` 报告缺口；把组件动作转成运行时命令并返回 `AgentActionResult`（`accepted` / `rejected` / `unknown`）。每一步都写进页面上的「适配器日志」。
- `src/AgentConsole.tsx`：一个完整实例（AgentShell + ConversationList + AgentHeader + MessageList / AgentMessage + ToolActivity + Composer（@ 引用、Enter 发送、运行中停止）+ InterventionDock / ApprovalPanel（DiffPreview 材料）+ AgentSidePane（ContextUsage、PersistentTerminal、SubAgentList））。
- `src/App.tsx`：主题（浅 / 深）与语言（中 / 英：`AgentMessagesProvider` + `agentEnUS`，`RhineProvider messages={enUS} locale="en-US"`）切换；同页第二个独立实例，用来验证多实例隔离。

## 命令

```bash
pnpm --filter @wzrhine/example-agent-console dev        # http://127.0.0.1:5178
pnpm --filter @wzrhine/example-agent-console typecheck
pnpm --filter @wzrhine/example-agent-console build
pnpm --filter @wzrhine/example-agent-console test:e2e   # Chromium，构建后在 4178 端口预览
pnpm --filter @wzrhine/example-agent-console test:e2e:all
```

E2E（`e2e/agent-console.spec.ts`）覆盖：发送 → 工具行 → 审批 → unknown 回执 → 用同一 actionId 重试 → 已允许；停止；重复 / 乱序 / 旧修订不产生重复消息；切换英文后文案变化；两个实例互不影响且页面无重复 id；浅色与深色 axe 无违规；390 宽度无横向溢出。

## 已知限制

- 适配器日志的行文只有中文；切换英文只影响界面与组件文案。
- 模拟运行时只有一个剧本（读文件 → 运行命令 → 编辑文件待审批）；未演示问卷、断线状态（`reconnecting`）和发送 / 停止的 unknown 回执。
- 预览服务器只监听 `127.0.0.1`、没有鉴权，只用于本地演示。
