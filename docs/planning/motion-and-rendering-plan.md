# 动效与渲染长期规划

## 目标

建立一套“有语义、可中断、可减动、可测试、可扩展”的 Rhine 动效系统，同时明确 DOM、CSS、SVG、Motion、Canvas 和 WebGL 的边界。

动效的目的只有四类：

1. 反馈：告诉用户操作已经发生；
2. 空间关系：告诉用户元素从哪里来、要到哪里去；
3. 身份连续：让相同对象在不同视图之间保持识别；
4. 过程表达：表达任务仍在运行或已经完成。

为了制造“科技感”而添加持续闪烁、全屏扫光、无意义弹跳和无限循环，不属于核心动效目标。

## 1. 渲染层责任

| 层 | 默认用途 | 是否进入 react 核心包 |
| --- | --- | --- |
| CSS transition / animation | hover、focus、颜色、边框、简单显隐 | 是 |
| DOM + CSS variables | 状态、主题、布局和响应式 | 是 |
| SVG | 轨道、路径、线条、图标、轻量图表 | 是或 effects |
| Motion for React | presence、layout、shared identity、可中断交互 | 是，按需使用 |
| Canvas 2D | 粒子、热力图、噪声、大量 2D 图形 | 否，未来可选 |
| WebGL / WebGPU | 3D、shader、大规模 GPU 场景 | 否，未来可选 |
| GSAP | 长时间线、复杂展示编排 | 否，adapter |
| Rive / Lottie | 资产驱动的插画和状态机 | 否，adapter |
| Theatre.js | 设计制作和展示编排 | 否，开发工具 |

## 2. 动画所有权

同一个 DOM 节点的同一个属性只能由一个系统负责。

| 属性 | 默认所有者 |
| --- | --- |
| color | CSS |
| background-color | CSS |
| border-color | CSS |
| opacity | CSS 或 Motion，按场景选择 |
| transform | 一个明确的动画所有者 |
| layout size | CSS 或 Motion layout |
| scroll position | 页面或专门 scroll adapter |
| SVG stroke progress | SVG/CSS 或 effects |
| Canvas uniforms | Canvas renderer |
| WebGL uniforms | WebGL renderer |

Motion 和 React Spring 不应该同时写同一个元素的 transform。GSAP 也不应该悄悄接管 Motion 正在管理的节点。

## 3. Rhine Motion contract

以下内部能力已在 M10 建立（契约见 [ADR-0007](../development/adr/0007-motion-ownership.md)，模式见 [MOTION-PATTERNS.md](../design/MOTION-PATTERNS.md)，验收见 [M10 验收记录](../development/acceptance/2026-10-10-m10.md)）。下面的类型草案是规划时的写法，实际实现为 `transition.*` 预设（instant / press / release / fast / base / panel / scene / showcase / loop）、`RhineProvider motion="user | reduce"` 与 `useMotionLifecycle()`（state 为 idle / running / paused / stopped）：

~~~ts
type RhineMotionPreset =
  | "instant"
  | "press"
  | "fast"
  | "base"
  | "panel"
  | "scene"
  | "showcase";

type RhineMotionMode = "user" | "reduce" | "never";

type EffectLifecycle = {
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
};
~~~

实际公开 API 可以更小，基础组件使用语义 prop。下例是规划时的示意；M10 实际只采用了 `ArchiveCard motion="none | identity"`，Dialog、Toast 等组件内部使用固定预设，**没有** `motion` prop（ADR-0007 §8）：

~~~tsx
<Dialog motion="panel" />   // 示意，未采用
<Toast motion="fast" />     // 示意，未采用
<ArchiveCard motion="identity" />  // 已实现（M10）
~~~

不要把底层 Motion 的完整 animate、variants、transition 对象扩散到每个业务页面。

### 计划中的公共能力（M10 后的状态）

- RhineMotionProvider：**未做，有意延后**（ADR-0007「留给 M11」）；沿用 `RhineProvider motion` + `MotionConfig`；
- MotionConfig：已采用（`RhineProvider` 内部设置 `reducedMotion`，应用也可自行包裹）；
- useRhineMotion：已实现，返回 `reduced`、`speed`、`get`、`resolve`；
- MotionPresence：已实现（预设 fade / panel / rise）；
- RhineMotionGroup：已实现（配合 RhineMotionItem）；
- named variants：以语义预设实现（`transition.*`、MotionPresence 预设），不公开任意 variants；
- page visibility pause：已实现（`usePageVisible`、`useInViewport`、`useMotionLifecycle`）；
- reduced-motion resolver：已实现（`resolveMotion`，按属性类型降级）；
- animation cancellation：由 motion/react 的目标接续承担，三内核中断 E2E 覆盖；没有单独的公开 API；
- stale async result guard：已实现（`useLatestGuard`）。

## 4. 时间和曲线

当前 tokens 保持：

| Token | 建议值 | 用途 |
| --- | ---: | --- |
| instant | 0ms | 直接状态切换 |
| press | 80ms | 按压 |
| fast | 120ms | hover / focus |
| base | 200ms | 普通反馈 |
| panel | 280ms | Dialog / Popover / panel |
| scene | 420ms | 档案身份连续 |
| showcase | 700ms | 用户主动触发的展示 |
| loop | 900ms | 必须有语义的循环 |

当前 easing：

- out：0.16, 1, 0.3, 1；
- inOut：0.65, 0, 0.35, 1；
- linear：只用于真实进度；
- spring：只用于拖拽、可中断目标和物理反馈。

## 5. reduced motion

reduced motion 不能只等于把所有视觉效果删除，也不能只把 duration 改成 0。

### 建议策略

| 动画类型 | reduce 行为 |
| --- | --- |
| 颜色 / 边框 | 可以保留短过渡 |
| opacity | 可以保留短过渡 |
| 位移 transform | 直接到目标 |
| layout | 关闭 |
| 大范围缩放 | 关闭 |
| 无限循环 | 停止 |
| 视差 | 停止 |
| Dialog | 保留显隐，删除位移 |
| Progress | 保留确定性数值变化 |
| 文本 scramble | 直接显示最终文本 |
| Canvas / WebGL | 静态图或停止渲染 |

## 6. 动效模式目录

M10 起维护于 [MOTION-PATTERNS.md](../design/MOTION-PATTERNS.md)（beam、particle-field、shader-surface 标为未实现，留给 M11）：

- orbit；
- beam；
- reveal；
- stagger；
- shared-layout；
- text-scramble；
- status-pulse；
- progress-flow；
- particle-field；
- shader-surface。

每个模式必须记录：

- 传达的语义；
- 触发条件；
- 不适用的场景；
- duration、easing 和 token；
- start / pause / resume / stop；
- 中断行为；
- reduced motion；
- 页面隐藏；
- 语义 fallback；
- 性能预算；
- 视觉基线；
- 许可证和来源。

## 7. 参考其他动效库的方式

### Motion

借鉴：

- presence；
- layout；
- layoutId；
- motion values；
- gesture；
- reduced motion；
- 当前目标值接续。

保留 Rhine 自己的 preset 和 API，不直接暴露任意动画对象。

### React Spring

借鉴：

- spring；
- inertia；
- drag release；
- snap；
- 物理回弹。

只在需要物理行为的组件或 adapter 中使用。

### GSAP

借鉴：

- timeline；
- label；
- pause；
- reverse；
- seek；
- nested sequence。

用于展示编排，不进入基础组件依赖。

### use-gesture

借鉴输入模型：

~~~text
pointer / touch / wheel
        ↓
gesture input
        ↓
motion value / spring value
        ↓
DOM / SVG / Canvas / WebGL
~~~

### Motion Primitives、Magic UI、React Bits、Aceternity、Animate UI

借鉴：

- orbit；
- beam；
- border flow；
- text reveal；
- text scramble；
- animated group；
- shared layout；
- copy-first 的展示方式；
- headless primitive 加 Motion 外壳的分层。

默认自己用 Rhine tokens、CSS、SVG 和 Motion 重写。源码适配前必须逐文件核对许可证，不把 MIT、MIT + Commons Clause、商业或自定义条款混在一起。

## 8. Canvas / WebGL 进入条件

必须同时具备：

1. 有真实产品场景；
2. DOM/SVG 在目标设备上有可证明的性能问题，或无法表达目标视觉；
3. 效果不承担核心语义；
4. 有 DOM/SVG fallback；
5. 有 reduced motion；
6. 有 visibility pause；
7. 有 DPR 和低性能设备策略；
8. 有 context loss 或 renderer failure 处理；
9. 有独立 bundle；
10. 有视觉和性能验收；
11. 不影响 @wzrhine/react 安装；
12. 许可证和依赖已审查。

### 推荐结构

~~~text
@wzrhine/effects
  DOM / SVG effects

@wzrhine/effects/canvas
  ParticleField
  HeatmapLayer
  NoiseSurface

@wzrhine/effects/three
  OrbitScene
  ShaderSurface
  Three-dimensional data view
~~~

## 9. Canvas / WebGL 组件契约

视觉层和语义层必须分开：

~~~tsx
<OrbitScene>
  <OrbitSceneRenderer aria-hidden="true" />
  <OrbitSceneSemanticSummary />
  <OrbitSceneFallback />
</OrbitScene>
~~~

Renderer 负责：

- 图形；
- 生命周期；
- renderer 初始化和销毁；
- DPR；
- 可见性；
- reduced motion；
- 性能统计。

SemanticSummary 负责：

- 标题；
- 节点列表；
- 状态；
- 键盘和辅助技术；
- 业务结果。

## 10. 动效测试矩阵

每类动效至少验证：

- default；
- slow；
- reduced；
- interrupt；
- rapid reverse；
- unmount；
- hidden page；
- mobile；
- low frame rate；
- SSR hydration；
- focus restore；
- stale async result。

effects 另外验证：

- lazy import；
- fallback；
- renderer failure；
- context loss；
- DPR；
- 页面离开视口；
- 多实例；
- 资源清理。

