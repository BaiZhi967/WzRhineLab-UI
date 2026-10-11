# ADR-0012 · Agent 动效设计

- 状态：**Accepted** · 关联里程碑：M12 · 基于 ADR-0007（动效所有权）与 MOTION.md
- 实现：`packages/agent/src/motion/agent-motion.tsx`、`packages/agent/src/primitives/AgentSpark.tsx`、`packages/agent/src/styles/*.css`、`packages/react/src/disclosure.css`

## 背景
Wpi-Agent 用自写 spring（显式欧拉积分 + WAAPI 线性关键帧）、grid-rows 折叠、点阵 spark、选中幽灵与光晕呼吸。这些行为有价值，但实现绕过了 Rhine 的 motion 层（无统一减动解析、无共享生命周期、数值不走 tokens）。图册只给出定性描述（「短暂呼吸」「单轴位移」「一次短反馈」）。本 ADR 把它们映射到 Rhine 的预设与所有权规则。

## 决策

### 1. 节奏表（全部来自 tokens）
| 模式 | 所有者 | 预设 / token | 减动 |
| --- | --- | --- | --- |
| 新消息入场（只在首次挂载） | motion/react `opacity`+`y` 6px | `base` | 无位移，≤`fast` 淡入 |
| 工具 / 账本行入场，批量错峰 | motion/react `opacity`+`y` 4px | `fast`，每项 24ms，封顶 120ms | 无错峰、无位移 |
| 审批 / 问卷 / 恢复卡入场 | motion/react `opacity`+`y` 8px+`scale` .985 | `panel` | 无位移缩放 |
| 折叠（工具详情、思考、审批详情、摘要） | CSS `height`（Collapsible） | `base`；chevron `rotate` `fast` | 即时 |
| Send ↔ Stop 图标交换 | motion/react `opacity`（叠放交叉淡入） | 进 `base`、出 `fast` | 直接替换 |
| 会话选中背景（选中幽灵） | motion/react `layoutId`（只在列表内） | `base` | 直接定位 |
| 侧栏开合 | CSS `translate`+`opacity` 单轴 | `panel` | 直接显示 |
| 侧栏拖动调宽 | 指针直接驱动 width，无动画 | — | — |
| 视图下钻（主对话 ↔ 子任务、模型选择器层级） | motion/react `x` 单轴 + `opacity` | `panel` | 直接切换 |
| JumpToLatest 出现 | MotionPresence `fade` | `fast` | 即时 |
| 平滑滚到最新 | `scrollTo({behavior})` | 浏览器平滑滚动 | `behavior: 'auto'` |
| AgentSpark 点阵 | CSS `@keyframes` opacity | 周期 = `loop` × 1–2（按阶段） | 静态帧（每阶段不同） |
| 运行中状态点呼吸 | CSS `@keyframes` opacity | `loop` × 2 | 静态 |
| 完成反馈（RunSummary / 已发送） | CSS 颜色过渡一次 | `fast` | 颜色直接变化 |
| 按压 | 继承 Button / IconButton | `press` | 即时 |

- **不用 spring**：Rhine 只在可拖拽目标上允许 spring（MOTION.md），Agent 没有可拖拽动画目标；侧栏拖动直接跟手。Wpi 的 `bounce > 0` 反馈不迁移。
- **不使用文字扫光（shimmer）**：它是装饰性持续动画，违反 STYLE「默认无限扫描循环」禁令；阶段文字静态显示，活动由 AgentSpark 表达。

### 2. 只在首次出现时动
`AgentEntrance` 在挂载时冻结「是否播放」：流式更新、状态切换、重新渲染都不重放入场；历史消息、恢复的快照、加载更早消息传 `animate={false}`。长列表不使用 `layout` 动画；同一批到达的行最多错峰 5 项（120ms 封顶）。

### 3. 循环的生命周期
AgentSpark、呼吸点等循环通过 `useAgentLoop` → `useMotionLifecycle`：只在「被请求 + 页面可见 + 元素在视口内 + 非减动」时运行，CSS 只在 `[data-loop='running']` 上挂 animation。十二个 spark 同屏时只有可见的在动；`animate={false}` 强制静态帧。

### 4. 动效不延迟语义
状态文字、`role=status` 播报、按钮可用性与动画无关，先于动画更新。流式播报按消息 / 阶段合并（节流），不逐 token 朗读。

### 5. 中断
- 折叠在过渡中再次切换，从当前高度反向（CSS transition）；
- 入场进行中卸载不留残影（motion/react 自动取消）；
- Send/Stop 快速切换从当前不透明度接续；
- 侧栏开合中再次切换从当前位置反向。

## 验证
- 单测：AgentEntrance 首次挂载后不重放、`animate={false}` 无初始态、减动无位移；AgentSpark 的 `data-loop` 随页面隐藏 / 减动暂停；
- E2E：reduced-motion 全页扫描、折叠中断、Send/Stop 快切；
- boundary 测试：agent CSS 无字面时长、每个 keyframe 在两种减动来源下都关闭。
