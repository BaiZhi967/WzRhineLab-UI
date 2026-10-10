# ADR-0007 · M10 动效属性所有权与 Motion Core 契约

- 状态：**Accepted** · 关联里程碑：M10 Motion Core 2.0
- 范围：`@wzrhine/react` 的动效预设、`resolveMotion` / `useRhineMotion`、`MotionPresence`、`RhineMotionGroup`、`useMotionLifecycle`、`usePageVisible` / `useInViewport`、`useLatestGuard`、`ArchiveCard motion="identity"`；`@wzrhine/effects` 的循环与生命周期
- 约束：动效只用 `motion/react`（AGENTS.md）；token 契约冻结（M6），不新增或修改 token；基础组件不引入 Canvas / WebGL（ADR-0004）
- 依据：[MOTION.md](../../design/MOTION.md)、[动效与渲染长期规划](../../planning/motion-and-rendering-plan.md) §2–§6、[ADR-0006](0006-overlays-feedback-contracts.md) §4

## 背景
M1–M9 的动效分散在各组件里：Dialog 用 motion/react，Popover / Toast / Tabs 用 CSS transition，effects 各自监听 `visibilitychange`，减动只有一种处理（`get()` 返回 duration 0）。三个问题随之出现：

1. 同一属性可能被两套系统同时写（M9 Drawer 的 transform 同时被 Base UI 滑动和 motion/react 争用，见 ADR-0006 §4）；
2. 减动「全部变成 0」与规划 §5 不符：颜色和透明度可以保留短过渡，位移、布局和循环才必须去掉；
3. 「页面隐藏时停止」「过期结果不能重新打开对话框」只是文字约定，没有共享实现和测试。

本 ADR 固定属性所有权、预设与 token 的映射、按属性类型的减动解析、生命周期与可见性契约，并说明哪些留给 M11。

## 决策

### 1. 属性所有权
同一个 DOM 节点的同一个属性只能有一个动画所有者。所有者在组件源码注释和 [模式目录](../../design/MOTION-PATTERNS.md) 里写明。

| 属性 | 所有者 | 现有例子 |
| --- | --- | --- |
| `color` / `background-color` / `border-color` / `box-shadow` | CSS transition（`--rl-motion-fast`） | Button、Field、Tabs 文字 |
| `opacity`（进出场） | motion/react **或** CSS，按组件选一个 | Dialog / AlertDialog（motion）；Popover / Menu / Toast / Drawer（CSS，Base UI `data-starting-style` / `data-ending-style`） |
| `transform` / `translate` / `scale`（进出场、按压） | 一个明确所有者；motion/react 优先 | Dialog `y`、Button `scale`（motion）；Tabs 指示器 `translate`、Toast 堆叠 `transform`（CSS） |
| `transform`（被拖动写入的节点） | **CSS**，不得交给 motion/react | Drawer、Toast：Base UI 通过 `--drawer-swipe-movement-*` / `--toast-swipe-movement-*` 写同一个 transform，motion 再写会互相覆盖（ADR-0006 §4） |
| 布局位置（共享身份） | motion/react `layoutId` + `layout="position"` | ArchiveCard → ArchiveIdentity |
| 宽高 | CSS transition（只限指示器）；其余不做动画 | Tabs 指示器 `width` |
| SVG `transform`（旋转） | motion/react motion value | OrbitalDiagram 转子 |
| SVG / 装饰性扫描线 | CSS `@keyframes` | ScanSurface 扫描线 |
| 侧边 / 底部面板位移 | CSS transition（Base UI 滑动写同一 transform） | `Drawer`（ADR-0006 §4） |
| 逐帧文本（scramble） | `requestAnimationFrame`，effects 内部 | ArchiveReveal |
| 无限循环（脉冲、骨架、不确定进度） | CSS `@keyframes`，`--rl-motion-loop` | StatusIndicator 脉冲、`Skeleton`（DataTable / Stat 骨架）、Progress 不确定态 |
| 加载旋转 | motion/react `rotate` + `transition.loop` | `Spinner`（Button 的加载指示也用它；M9 合入后复核一致） |
| Canvas / WebGL uniforms | 对应 renderer（M11，尚未实现） | — |

规则：

- motion/react 节点上不再写同一属性的 CSS transition；CSS 负责的节点不包 `motion.*`。
- 新组件要做动效时先在本表找到所有者；表里没有的属性组合需要修订本 ADR。

### 2. 预设与 token 的映射
预设名与时长 token 一一对应，数值只来自 `@wzrhine/tokens` 的 `motionDurations` / `motionEasings`（同一份 manifest 也生成 `--rl-motion-*`）。

| 预设（`transition.*`） | token | 时长 | 缓动 | 用途 |
| --- | --- | ---: | --- | --- |
| `instant` | `--rl-motion-instant` | 0ms | — | 减动后的位移、布局 |
| `press` | `--rl-motion-press` | 80ms | out | 按压 |
| `release` | `--rl-motion-fast` | 120ms | out | 按压回弹 |
| `fast` | `--rl-motion-fast` | 120ms | out | hover / focus、Tooltip、遮罩 |
| `base` | `--rl-motion-base` | 200ms | out | 选中、行内反馈、列表项 |
| `panel` | `--rl-motion-panel` | 280ms | out | Dialog / 面板 / 详情层 |
| `scene` | `--rl-motion-scene` | 420ms | inOut | 档案身份连续 |
| `showcase` | `--rl-motion-showcase` | 700ms | inOut | 仅用户主动触发的展示 |
| `loop` | `--rl-motion-loop` | 900ms | linear，重复 | 必须有语义的循环 |

`package-boundary.test.ts` 断言每个时长 token 都有同名预设且数值相等；组件源码禁止出现数字 `duration:` / `scale:`。

### 3. 按属性类型的减动解析
`resolveMotion(kind, name, reduced, speed?)`（组件内用 `useRhineMotion().resolve(kind, name)`）按属性类型降级：

| `kind` | 不减动 | 减动 |
| --- | --- | --- |
| `color` | 预设 | 保留短过渡，时长取 `min(预设, fast)` |
| `opacity` | 预设 | 同上：最多 120ms 的淡入淡出 |
| `transform` | 预设 | `instant`：直接到目标 |
| `layout` | 预设 | `instant`：共享身份直接切换 |
| `loop` | 预设 | `instant`，没有 `repeat`：停止 |

- 带 `repeat` 的预设在任何类型下减动都变成 `instant`，循环不会以「短淡入」的形式残留。
- `speed`（Showcase 的 Slow ×0.25）只放慢**未减动**的结果；减动回退永远不超过 `fast`（M10 E2E 发现慢放通道曾把减动淡入拉长到 480ms，已修复并有单测）。
- 减动来源：系统 `prefers-reduced-motion`，或最近的 `<MotionConfig reducedMotion>`；`RhineProvider motion="reduce"` 会同时设置 `MotionConfig reducedMotion="always"` 和 `data-rl-motion="reduce"`，后者供 CSS 动效使用。所有 `@keyframes` 必须在两种减动条件下都 `animation: none`（package-boundary 测试强制）。
- 组件包里的演示容器（MotionPlayer 的非 Reduced 通道、Motion 页 Default 栏）**不得**把外层的减动偏好重置为 `user`；它们只能额外强制减动，不能重新打开动效。
- 旧接口 `get(name)` 保持原样（减动时一律 `instant`），等价于 `resolve('transform', name)`；新代码按属性选 `resolve`。

### 4. 生命周期：start / pause / resume / stop
`useMotionLifecycle({ active?, autoStart?, viewportRef?, reduced? })` 返回 `{ state, running, pauseReason, start, pause, resume, stop }`：

- `state`：`idle`（从未开始）/ `running` / `paused` / `stopped`（开始过，之后被停止）。
- 一个循环只在以下条件**同时**满足时运行：已请求（`active` 或 `start()`），没有被手动 `pause()`，页面可见，元素在视口内（传了 `viewportRef` 时），没有减动。
- 不满足时是 `paused`，并给出原因，优先级为 `reduced` > `manual` > `hidden` > `offscreen`，调用方据此显示合适的静态状态。
- 受控 `active` 优先于 `start()` / `stop()`。
- 暂停时保持当前视觉状态，恢复时从这个状态接续；停止（或减动）回到静止位置。OrbitalDiagram 照此实现：隐藏时角度不变，恢复后从原角度继续转。

### 5. 页面可见性
`usePageVisible()`（`useSyncExternalStore` 订阅 `visibilitychange`，SSR 与水合期为可见）和 `useInViewport(ref)`（`IntersectionObserver`，没有该 API 时视为可见）是全库**唯一**的可见性来源。`@wzrhine/effects` 重新导出这两个 hook，不再保留第二套实现（单测断言函数引用相同）。

页面隐藏时：OrbitalDiagram 暂停；ArchiveReveal 冻结在当前进度、恢复后接续；ScanSurface 立即结束本次扫描并触发 `onScanEnd`；隐藏期间请求的扫描不运行。

### 6. 过期异步守卫
`useLatestGuard()` 返回 `{ begin, cancel }`：`begin()` 开始一次异步请求并返回 `isCurrent()`；新的 `begin()`、`cancel()` 或卸载都会让之前的请求失效。用来保证「过期的结果不会把已经关闭的对话框重新打开、不会覆盖更新的状态」（MOTION.md 中断规则 2）。它只是守卫，不取消网络请求；需要真正取消时调用方另传 `AbortSignal`。

### 7. Presence 与 Stagger
- `MotionPresence show preset="fade | panel | rise"`：基于 `AnimatePresence`，预设决定位移（0 / 8px / 4px）和时长（fast / panel / base）；中途切换 `show` 从当前视觉状态反向，不排队；隐藏后卸载，不留在无障碍树里；默认首帧不播放（`initial={false}`）。
- `RhineMotionGroup` + `RhineMotionItem`：每项延迟 24ms，总延迟上限为 `fast`（120ms），超出的项同时出现；减动时没有错峰、没有位移，只有最多 120ms 的淡入；退出是整组一次淡出，不倒序级联。只用于短列表（约 8 项以内）。
- 两者只接受语义预设，不接受 `variants` / `transition` / `animate`。

### 8. 基础组件不暴露原始引擎配置
基础组件的动效接口只有语义 prop（例如 `ArchiveCard motion="none | identity"`）。`variants`、`transition`、`animate`、spring 参数都不进组件 props；页面需要动效时用 `MotionPresence` / `RhineMotionGroup` 或 `useRhineMotion().resolve`。`MotionSpeed` 只用于审查与 Showcase，不能出现在产品视图里。

### 9. 共享身份（ArchiveCard）
`ArchiveCard motion="identity"` 把记录编号作为共享元素（`layoutId`，`layout="position"`，文字不会被拉伸），`<ArchiveIdentity id>` 是另一端（例如详情标题行）。时长为 `scene`，减动时直接切换。motion 会隐藏同一身份里非主导的成员，因此只适用于「详情**替换**卡片」的场景，卡片和详情不能同时在屏幕上；同一页有多份列表时用 `<LayoutGroup id>` 隔离。默认关闭，不影响既有用法。

## 留给 M11（Rendering Lab）
- `beam`、`particle-field`、`shader-surface` 模式，Canvas 2D / WebGL renderer，以及它们的 DPR、低性能设备策略、context loss、renderer failure 与独立 bundle（规划 §8–§9）。
- 低帧率（CPU 降速）与真机性能验收；M10 只在 Chromium 下用 CPU 降速做了 Dialog 中断的抽查。
- GSAP / Rive / Lottie adapter 与 spring 预设：目前没有需要拖拽物理的组件，M10 不提供默认 spring。
- 公开的 `RhineMotionProvider`：M10 继续沿用 `RhineProvider motion` + `MotionConfig`，没有单独的 Provider。

## 后果
- `@wzrhine/react` 新增导出：`MotionPresence`、`RhineMotionGroup`、`RhineMotionItem`、`MotionSpeed`、`resolveMotion`、`useMotionSpeed`、`useMotionLifecycle`、`useLatestGuard`、`usePageVisible`、`useInViewport`、`ArchiveIdentity`、`transition.showcase`；`useRhineMotion()` 增加 `speed` 与 `resolve`。全部是新增，不破坏既有用法。
- `ArchiveCardProps` 增加可选 `motion`。
- `@wzrhine/effects` 的 `usePageVisible` / `useInViewport` 改为重新导出核心包实现；OrbitalDiagram 增加 `data-lifecycle` / `data-paused`；MotionPlayer 的非 Reduced 通道改为继承外层减动偏好（之前会把系统或 Provider 的减动重置为 `user`）。

## 验证方法
单测（`motion-core.test.tsx`、`motion-interrupt.test.tsx`、`package-boundary.test.ts`、effects `lifecycle.test.tsx` / `effects.test.tsx`）；三内核 E2E `motion-core.spec.ts`（按帧采样的中断、身份连续、错峰上限、隐藏页暂停）与 `reduced-motion.spec.ts`（全部路由的减动扫描）；反向验证。结果记录在 `docs/development/acceptance/2026-10-10-m10.md`。
