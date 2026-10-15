# ADR-0015 · 可选效果的几何锚点与受控进度底座

- 状态：Implemented / Validating · 2026-10-15（未发布，维护者视觉验收独立记录）
- 关联：维护者确认首批动效方向，指出关系线宽屏错位，并要求接入时补强底层；范围见 [需求记录](../../roadmap/requests/WZUI-REQ-20261015-001.md)。
- 基线：8aef2f9，隔离分支 `feature/motion-foundations`。

## 问题与边界

研究样张使用固定 SVG viewBox 与固定端点，卡片由 CSS Grid 布局，二者独立缩放导致端点不在卡片底边中点。仅修改某个宽度的坐标会把同类问题带到后续连线、标注与仪器效果中。

复用 ADR-0007 的 token、减动、可见性和生命周期，不引入动画引擎、全局 Provider、画布、图编辑器或宿主业务状态。本次所有新增时间插值使用 `motion/react`；requestAnimationFrame 仅合并几何测量，不驱动动画。存量 CSS／rAF 所有权不在本次改写。

## 决策

### 1. 几何、时间和图形分层

`@wzrhine/effects` 增加纯几何函数、`useElementAnchors` 测量层与 `useEffectProgress` 受控进度。React 基础包不反向依赖 effects。

- 几何函数不访问 DOM：矩形上的 top/right/bottom/left/center 锚点、坐标转换、straight/curve/rail 路径。
- 测量层读真实节点 border box，不假设等宽、无间距、固定窗口或节点顺序。
- 时间层返回 0–1 MotionValue，负责当前值重定向、减动、暂停、恢复与取消。
- 图形组件只消费锚点与进度；同一属性只由一个所有者写入。

### 2. 锚点合同

`useElementAnchors({ containerRef, anchors, active?, tracking? })` 返回 `{ width, height, points, refresh }`。

`anchors` 为稳定 ID 到 `{ ref, side?, offset? }` 的映射；side 默认 center，offset 是本地 CSS 像素偏移 `{ x, y }`。不存在、已卸载或 display:none 的端点为 null，不保留旧位置。容器未测量时返回零尺寸与空 points；SSR 不访问浏览器、不绘制错误连线。

坐标以 absolute 子元素所在的容器 padding box 为基准，扣除容器边框并换算轴向缩放；容器自身滚动需加 scrollLeft/Top，使路径随同一内容空间滚动而仍贴合节点。absolute SVG 用 `inset:0; width:100%; height:100%`，viewBox 使用同一测量宽高，不使用独立固定画布。祖先旋转、倾斜、透视及负比例镜像不在首版支持范围，文档明确；正向轴向缩放、内外滚动与内容尺寸变化在范围内。

每个测量作用域共享一组 ResizeObserver 和订阅；观察容器及端点，捕获后代／祖先滚动并合并到一帧。属性／子节点变更导致位置变化时请求重测；读坐标与写 React state 分离，不因自身 SVG 属性更新产生观察循环。相同数据不重复 setState。

默认没有持续帧循环。只有显式 `tracking=true` 且 active、页面可见、容器在视口时才逐帧跟踪 CSS transform；隐藏时停止，恢复重测。ref 替换、active=false、卸载清理观察器、监听和待执行帧；提供 refresh 供宿主已知布局变更调用。

### 3. 受控进度合同

`useEffectProgress({ active, viewportRef, preset?, onSettled? })` 返回 `{ progress, state, reduced }`；preset 默认为 scene，仅接受现有语义预设。

- 首帧与 SSR 直接显示受控目标，不默认自动播放。
- active 变化从当前 progress 向 0/1 接续，取消旧控制器与过期完成回调。
- 页面隐藏／离开视口冻结当前进度，恢复后继续；减动直接到最新目标，无循环。
- 同一目标只有当实际变化／待完成目标落定时通知一次 onSettled；暂停不视为完成；卸载不通知。
- 计时继承 useEffectTiming 的速度与减动，以及 RhineProvider；不创建第二套偏好来源。
- progress 是纯视觉进度，不代表业务任务完成；业务文字与状态由宿主立即更新。

### 4. 系统偏好的实时订阅

浏览器测试发现 motion 14.1.0 的 useReducedMotionConfig 读取 mount 时快照，系统偏好在运行中改变不会驱动更新。新增 react 内部 `useMotionPreference`（不增加公开入口），通过 useSyncExternalStore 共享一组 matchMedia change 订阅；useRhineMotion 与 useMotionLifecycle 同时使用它。保留 MotionConfig user/always/never 的优先级，SSR serverSnapshot 为确定初值，卸载最后订阅后释放监听。effects 不另外监听媒体查询。

### 5. 首批效果

- `CalibrationReticle`：受控 active 的同心仪器／括角对准，SVG 装饰，外围文字由宿主提供。
- `SignalPath`：fromRef/toRef 连接的静态关系线与一次受控路径传导；默认两端 bottom，rail 向下避开卡片；其他路线由 route 决定。
- `AnnotationTrace`：同一锚点与路径底座，用于目标到说明的线条揭示；默认 right 到 left。

连线组件 absolute 填充一个宿主 `position:relative` 容器，端点与 SVG 共享坐标系；不占据布局，不拦截指针，不含任务执行／权限判断。Props 提供 active、端点 ref、side、route、bend、tracking 与 className，不扩散原始 animate/variants。

### 6. 组合与兼容

展示页保留旧三个效果及其合同。首页仪器组合按需加载，用户主动触发；不能把首页渲染直接算作播放。档案详情交接使用既有 MotionPresence，只包非交互视觉标记或安全内容层，不使旧内容在退出期间可操作，不更改 ListDetail 焦点合同；宽屏不使用互斥共享 layoutId。

不变更公共 tokens，不新增运行时依赖或包，不提升包版本，不改动已批准图标，不触发 Actions。API 与预算以实际构建证据更新，新增效果体积不能偷偷由提高全仓预算掩盖。

## 验证

先写失败用例：不等宽节点与 gap、边框／padding／缩放、滚动、端点替换／移除、隐藏再显示、容器单独缩放、SSR、批量失效只测一次、清理与无空闲循环；进度快速反向、暂停／恢复、减动切换与过期完成回调。

浏览器按 SVG getScreenCTM 将实际路径端点映射回屏幕坐标，与目标边中点断言误差不超过 1 CSS px。覆盖 320/390/768/1280/1920、容器宽度变化、滚动与多实例。静态无横向溢出不足以证明端点正确。

正常／慢放／减动／中断四通道；主题、键盘、axe、SSR、包边界、真实产物安装、API/docs/license/size 与原有回归按影响执行。未跑结果不得写通过，视觉截图不替代几何与动态验证。
