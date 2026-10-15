# MOTION-PATTERNS · 动效模式目录（M10）

每个模式都按 [动效与渲染长期规划 §6](../planning/motion-and-rendering-plan.md) 的字段记录。属性所有权、预设与 token 的映射、减动解析规则见 [ADR-0007](../development/adr/0007-motion-ownership.md)，原则见 [MOTION.md](MOTION.md)。Showcase：`/#/motion`（Motion Core 四通道对照、模式表）与 `/#/motion/effects`。

通用约定（每条不再重复）：

- 时长和缓动只来自预设（`transition.*` / `useRhineMotion().resolve`）或 `--rl-motion-*` / `--rl-ease-*`，不写数字。
- 减动来源：系统 `prefers-reduced-motion`、`RhineProvider motion="reduce"`（`MotionConfig reducedMotion="always"` + `data-rl-motion="reduce"`）。
- 「视觉基线」指 `apps/docs/e2e/visual/baseline.spec.ts` 中的截图名；视觉基线全部在 `reducedMotion: 'reduce'` 下截取，因此记录的是动效的静止或减动状态。
- 「许可证和来源」：除特别注明外，均为本仓库原创实现，只依赖 `motion`（MIT）与 Base UI（MIT），没有复制第三方动效源码。

| 模式 | 状态 | 所有者 | 实现 |
| --- | --- | --- | --- |
| [press](#press) | 已实现 | motion/react `scale` | Button、IconButton |
| [presence / panel](#presence--panel) | 已实现 | motion/react 或 CSS（按组件） | MotionPresence、Dialog、AlertDialog、Popover、Toast |
| [stagger](#stagger) | 已实现 | motion/react | RhineMotionGroup / RhineMotionItem |
| [indicator retarget](#indicator-retarget) | 已实现 | CSS transition `translate` / `width` | Tabs |
| [shared identity（shared-layout）](#shared-identity) | 已实现 | motion/react `layoutId` | ArchiveCard `motion="identity"` + ArchiveIdentity |
| [reveal / text-scramble](#reveal--text-scramble) | 已实现 | rAF（effects） | ArchiveReveal |
| [scan](#scan) | 已实现 | CSS `@keyframes` | ScanSurface |
| [orbit](#orbit) | 已实现 | motion/react motion value（SVG） | OrbitalDiagram |
| [status-pulse / progress-flow / skeleton / spinner](#status-pulse--progress-flow--skeleton--spinner) | 已实现 | CSS `@keyframes`；Spinner 为 motion/react | StatusIndicator、Progress、Skeleton（DataTable / Stat 骨架）、Spinner（Button、Toast promise） |
| [disclosure-height](#disclosure-height) | 已实现（M12） | CSS `height`（Base UI `--collapsible-panel-height` / `--accordion-panel-height`） | Collapsible、Accordion；Agent 工具详情、思考块、审批详情 |
| [agent-entrance](#agent-entrance) | 已实现（M12） | motion/react `opacity` / `y` / `scale` | AgentEntrance（消息、工具行、干预卡） |
| [agent-spark / agent-breathe](#agent-spark--agent-breathe) | 已实现（M12） | CSS `@keyframes`（`[data-loop='running']`） | AgentSpark、运行中状态字形 |
| [icon-swap](#icon-swap) | 已实现（M12） | motion/react `opacity` | SendStopButton |
| anchored signal / annotation / calibration | 已实现（MFX-01，未发布） | motion/react MotionValue + 实际元素测量 | SignalPath、AnnotationTrace、CalibrationReticle；见 [底座合同](../development/adr/0015-effect-geometry-and-progress.md) |
| beam | MFX-01 提前实现轻量路径子集；完整渲染实验仍延期 | — | 不含粒子或图布局 |
| particle-field | **未实现（M11）** | Canvas 2D | — |
| shader-surface | **未实现（M11）** | WebGL | — |

---

## press
- 语义：反馈。告诉用户按下已被接收。
- 触发：指针按下 / 键盘激活（`whileTap`）。
- 不适用：非交互元素；会改变布局或命中区域的缩放；大面积卡片（用颜色反馈）。
- 时长 / 缓动 / token：按下 `press` 80ms，松开 `release` 120ms，`ease.out`；缩放 `pressScale` 0.985。
- 生命周期：手势驱动，没有循环。
- 中断：松开或移出时从当前缩放回弹，不排队。
- 减动：`get('press')` 为 `instant`，不缩放；颜色与边框仍由 CSS 变化。
- 页面隐藏：不适用（无循环）。
- 语义 fallback：按钮本身的 `:active` 颜色与焦点环；动效不承载状态。
- 性能预算：只写 `transform`（合成层），不触发布局。
- 视觉基线：`button-*-1280/390`、`button-specimen-light`（静止状态）。
- 许可证和来源：原创。

## presence / panel
- 语义：空间关系。面板从哪里出现、退到哪里。
- 触发：`show` / `open` 变化。
- 不适用：页面加载时就存在的内容（默认 `initial={false}`，直接出现）；需要拖动跟手的面板（Drawer，见 ADR-0006 §4，transform 归 CSS）。
- 时长 / 缓动 / token：`MotionPresence` 预设 `fade`（fast 120ms，0 位移）、`panel`（panel 280ms，8px 上移）、`rise`（base 200ms，4px）；Dialog / AlertDialog 面板 `panel` + 8px，遮罩 `fast`；Popover / Menu `--rl-motion-fast` 透明度 + `scale 0.98`；Toast `--rl-motion-panel` 透明度 + `transform`。全部 `ease.out`。
- 生命周期：一次性进出场；退出完成后卸载（`onExitComplete` / Base UI `onOpenChangeComplete`）。
- 中断：中途切换从当前视觉状态反向（motion `AnimatePresence`、CSS transition 都可中断），不会出现第二个弹层，不排队。E2E 按帧验证：Dialog 退出中重新打开时透明度从当前值回升且始终只有一个弹层；Popover 快速开关结束于打开且焦点在内；Toast 进场中关闭时从当前位置连续退出。
- 减动：位移和缩放去掉（`transform` → `instant`），只保留不超过 120ms 的淡入淡出（`opacity` → `min(预设, fast)`）。
- 页面隐藏：不适用（无循环）。
- 语义 fallback：隐藏后卸载，不留在无障碍树里；Dialog 焦点进入 / 归还由 Base UI 负责，与动效无关；动效不延迟 `aria-expanded`、`role="dialog"` 或 live region。
- 性能预算：只写 `opacity` 与 `transform`；同时进行的进出场不超过一个面板。
- 视觉基线：`dialog-open-*-1280/390`、`select-open-*`（打开后的静止状态）。
- 许可证和来源：原创；基于 motion `AnimatePresence` 与 Base UI 状态属性。

## stagger
- 语义：空间关系 + 顺序。一组短列表按阅读顺序进入。
- 触发：`RhineMotionGroup show` 变为 `true`（默认首帧不播放）。
- 不适用：长列表、虚拟列表、分页表格行、每次数据刷新；超过约 8 项时只会让后面的项同时出现。
- 时长 / 缓动 / token：每项 `rise`（base 200ms，4px）或 `fade`；第 n 项延迟 `n × 24ms`，上限 `fast`（120ms）。
- 生命周期：一次性；退出为整组一次 `fast` 淡出，不倒序级联。
- 中断：中途 `show={false}` 从当前状态淡出并卸载；重新显示时只有一份。
- 减动：没有错峰、没有位移，所有项同时以不超过 120ms 的淡入出现。
- 页面隐藏：不适用。
- 语义 fallback：列表语义保留（`as="ul"` + `RhineMotionItem as="li"`）；内容立即在 DOM 中，不等动画。
- 性能预算：每项只写 `opacity` 与 `transform`；总时长 ≤ 120ms + 200ms。
- 视觉基线：无（Motion 页没有基线）。E2E 验证：7 项按顺序出现，第 5、6 项同帧出现（上限生效），Reduced 通道全部同帧且无 `transform`。
- 许可证和来源：原创。

## indicator retarget
- 语义：空间关系。当前选中项在哪里。
- 触发：Tabs 选中值变化。
- 不适用：没有连续轨道的选择（例如不相邻的分组）。
- 时长 / 缓动 / token：`translate` 与 `width` 各 `--rl-motion-base` 200ms，`--rl-ease-out`。所有者为 CSS（Base UI 把 `--active-tab-left` / `--active-tab-width` 写成 CSS 变量）。
- 生命周期：一次性过渡。
- 中断：CSS transition 从当前计算值重新出发。E2E 按帧验证：在第二与第四个标签之间改道时，指示器位于两站之间，之后单调地移向新目标，不会先跳回起点或继续冲过头。
- 减动：`transition: none`，直接定位。
- 页面隐藏：不适用。
- 语义 fallback：`aria-selected` 与面板立即切换，不等指示器。
- 性能预算：`translate` 走合成；`width` 会引起该元素自身的布局，范围限于指示器。
- 视觉基线：无单独基线（Tabs 页未截图）。
- 许可证和来源：原创；基于 Base UI Tabs Indicator。

## shared identity
- 语义：身份连续。同一份档案在列表与详情之间是同一个对象。
- 触发：`ArchiveCard motion="identity"` 被 `ArchiveIdentity id`（同一记录）**替换**时。
- 不适用：卡片与详情同时在屏幕上（motion 会隐藏非主导成员）；多份相同列表未用 `LayoutGroup id` 隔离；整卡的大范围缩放。
- 时长 / 缓动 / token：`scene` 420ms，`ease.inOut`；`layout="position"`，文字不拉伸。
- 生命周期：一次性布局动画。
- 中断：中途反向时从当前位置回到卡片（Showcase 的 Interrupt 通道）。
- 减动：`layout` → `instant`，直接切换；E2E 验证 Reduced 通道和 Provider 减动下没有中间帧。
- 页面隐藏：不适用。
- 语义 fallback：编号是普通文本；卡片的可访问名称不变（仍为标题）；详情内容立即可读。
- 性能预算：只对编号一个节点做 `layoutId`，不对整卡做 layout 动画。
- 视觉基线：无（默认关闭，`archive-*` 基线不受影响）。
- 许可证和来源：原创；基于 motion `layoutId`。

## reveal / text-scramble
- 语义：过程表达（展示用）。受限内容被用户主动揭示。
- 触发：`ArchiveReveal revealed` 变化，必须由用户操作触发。
- 不适用：业务数据加载、默认自动播放、长文本、需要立即读取的数值。
- 时长 / 缓动 / token：默认 640ms，每 48ms 换一次字形；Showcase 慢放按 `EffectClock speed` 缩放。
- 生命周期：一次性 rAF 循环，到达目标后停止；卸载时取消。
- 中断：中途切换从当前进度反向，不重新开始。
- 减动：直接显示最终文本，没有字形循环。
- 页面隐藏：冻结在当前进度，恢复后接续（单测与 E2E 均验证）。
- 语义 fallback：真实文本始终在 `.rl-effect-sr` 中，字形层 `aria-hidden`；遮蔽时读出 `concealedLabel`。动效不延迟业务结果。
- 性能预算：只替换单个文本节点的内容，不逐字符插入 DOM；短标签（≤ 约 40 字符）。
- 视觉基线：无（effects 页没有基线）。
- 许可证和来源：原创。

## scan
- 语义：过程表达（展示用）。一次扫描已经执行。
- 触发：`ScanSurface scanKey` 变化（每次一次）。
- 不适用：持续的「扫描中」背景、加载占位、全屏扫光。
- 时长 / 缓动 / token：默认 900ms，`--rl-ease-in-out`，单次。
- 生命周期：一次性；结束或卸载时清理计时器，`onScanEnd` 只触发一次。
- 中断：新的 `scanKey` 重新挂载扫描线；其他 prop 变化不会重新触发。
- 减动：没有移动的扫描线，改为约 160ms 的静态内描边。
- 页面隐藏：隐藏时立即结束本次扫描；隐藏期间请求的扫描不运行。
- 语义 fallback：扫描线 `aria-hidden`、`pointer-events: none`，内容在扫描中仍可点击和阅读。
- 性能预算：一条绝对定位元素的 `translate`。
- 视觉基线：无。
- 许可证和来源：原创。

## orbit
- 语义：装饰性结构（展示用）。围绕真实标签的仪器感图形，不是数据可视化。
- 触发：`OrbitalDiagram animate` 显式开启。
- 不适用：表达真实数值或进度；默认开启；多个同时旋转。
- 时长 / 缓动 / token：默认每圈 60s，linear，无限；慢放通道按 `EffectClock speed` 缩放。
- 生命周期：`useMotionLifecycle({ active: animate, viewportRef })`；`data-lifecycle` 为 `idle / running / paused / stopped`，`data-paused` 给出原因。暂停时保持角度，恢复时从该角度接续；停止回到 0°。
- 中断：开关随时生效；恢复不跳角度。
- 减动：不旋转（`paused / reduced`）。
- 页面隐藏：暂停（`paused / hidden`）；离开视口同样暂停（`offscreen`）。
- 语义 fallback：节点标签是无障碍列表，SVG `aria-hidden`。
- 性能预算：一个 `<g>` 的 `rotate`，由 motion value 写入，不触发 React 重渲染。
- 视觉基线：无。
- 许可证和来源：原创。

## status-pulse / progress-flow / skeleton / spinner
- 语义：过程表达。连接在线、任务进行中、内容加载中。
- 触发：`StatusIndicator pulse`（仅真实在线连接）、`Progress` 不确定态、`Skeleton`（DataTable 首次加载、Stat `loading` 也由它渲染）、`Spinner`（Button `loading`、Toast `promise` 的处理中阶段也由它渲染）。
- 不适用：装饰；已完成的任务；有确定百分比时不用不确定态。
- 时长 / 缓动 / token：`--rl-motion-loop` 900ms；脉冲 2 × loop；`rl-progress-travel`、`rl-skeleton-pulse`（Skeleton，`status.css`）为 `--rl-ease-in-out` 往返；Spinner 为 motion/react `rotate` + `transition.loop`（linear）。
- 生命周期：随状态属性存在而运行，状态结束即移除；不跟踪视口。
- 中断：状态变化时直接移除，不等循环结束。
- 减动：所有 `@keyframes` 在两种减动条件下都是 `animation: none`（package-boundary 测试强制）；不确定进度改为静态条纹；Skeleton 为静态色块；Spinner 停止旋转并显示较长的静态弧线（`data-reduced`，读 `useRhineMotion().reduced`，同时尊重系统与 Provider）。E2E `reduced-motion.spec.ts` 在全部路由上验证没有无限循环。
- 页面隐藏：CSS 动画由浏览器在后台标签页节流；不额外暂停。
- 语义 fallback：`aria-busy`、`role="progressbar"`（不确定态无 `aria-valuenow`）、Button 的 `aria-busy` 与可见文字；Skeleton 始终 `aria-hidden`，由容器负责 `aria-busy` 与「正在加载」文字；Spinner 传 `label` 时为 `role="status"`，不传时为装饰（`aria-hidden`）。动效不承载状态。
- 性能预算：`opacity` / `scale` / `translate` 关键帧；同屏骨架数量受表格行数限制。
- 视觉基线：`data-progress-meter-*`、`data-stat-*`、`data-*-1280/390`、`feedback-skeleton-*`、`feedback-spinner-*`（减动下的静态状态）。
- 许可证和来源：原创。M9 的 Skeleton / Spinner 组件合入后已按 ADR-0006 §7 与本条复核（ADR-0007 §1 所有权表同步更新）；Button、DataTable、Stat 改由它们渲染后，既有视觉基线组件区域零差异（M9 验收记录）。

## beam
MFX-01 已实现轻量 DOM/SVG 子集（尚未发布）：SignalPath 连接真实元素锚点，提供静态关系线与受控的单次进度；AnnotationTrace 复用相同底座。内容与任务状态由宿主提供，动画不代表执行成功。减动直接目标，隐藏／离屏暂停，反向从当前值接续；详细合同、触发、清理与几何验证见 [效果底座](../components/effect-foundations.md) 和 [ADR-0015](../development/adr/0015-effect-geometry-and-progress.md)。

高成本 renderer、粒子、shader 与图布局不属于该子集，仍按 R6 独立评估，不因轻量连线完成而视为整个 Rendering Lab 已交付。

## particle-field
未实现（M11）。Canvas 2D，需满足规划 §8 的全部 12 条（DOM fallback、减动、可见性暂停、DPR、context loss、独立 bundle 等）。

## shader-surface
未实现（M11）。WebGL，同上；不进入 `@wzrhine/react`。


---

## disclosure-height
- 语义：空间关系。告诉用户内容从哪里展开、收回到哪里。
- 触发：用户点击 / 键盘切换 Collapsible、Accordion 的触发按钮。
- 时长：`base`（高度 + 不透明度），chevron 旋转 `fast`。
- 所有者：CSS transition，读 Base UI 测得的面板高度变量；稳定后回到 `auto`，流式内容可继续增长。
- 中断：过渡中再次切换，从当前高度反向。
- 减动：时长 token 归零，即时展开 / 收起；内容不丢失。
- 隐藏页：无循环，无需处理。

## agent-entrance
- 语义：新内容来自哪里。只在**首次挂载**时播放（ADR-0012 §2）：流式更新、状态变化、历史与恢复的快照都不重放。
- 预设：`message`（6px + `base`）、`row`（4px + `fast`，同批错峰 24ms、封顶 120ms）、`card`（8px + scale .985 + `panel`）。
- 所有者：motion/react；元素的 `opacity` / `transform` 不再被其他动画占用。
- 中断：卸载即取消；不留残影。
- 减动：无位移与缩放，保留 ≤`fast` 的淡入（`resolve('opacity', …)`）。

## agent-spark / agent-breathe
- 语义：任务过程（Agent 正在思考 / 回答 / 执行 / 等待）。永远是文字状态的**辅助**，`aria-hidden`。
- 节奏：周期为 `--rl-motion-loop` 的 1–2 倍，按阶段区分（思考自中心扩散、回答逐行、执行逐列、等待整体呼吸）；呼吸点 `loop × 2`。
- 生命周期：`useAgentLoop` → `useMotionLifecycle`，只有「被请求 + 页面可见 + 在视口内 + 非减动」时 `data-loop="running"`，CSS 只在该属性上挂 animation。
- 减动 / 暂停：静态帧，每个阶段的静态图形不同，仍可区分。
- 预算：同屏 12 个也只有可见的在动；不使用 JS 帧循环。

## icon-swap
- 语义：反馈（同一按钮从「发送」变为「停止生成」）。
- 时长：进入 `base`，退出 `fast`，两枚图标叠放交叉淡入；按钮元素不变，焦点不丢失。
- 减动：直接替换图标。
