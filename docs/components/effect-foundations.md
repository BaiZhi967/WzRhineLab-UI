# Effect foundations · 几何锚点与受控视觉进度

状态：MFX-01 已实现、Experimental，库侧验证中，尚未发布。合同：[ADR-0015](../development/adr/0015-effect-geometry-and-progress.md)；入口 `@wzrhine/effects`，样式 `@wzrhine/effects/styles.css`。

## 用途与非用途

为关系线、对象标注、仪器结构及后续 DOM/SVG 效果提供共享底座。不是图编辑器、自动布局、任务执行器、数据源或第二套动画引擎。业务状态由宿主持有，动画结束不能被当成网络／任务成功。

扩展顺序是：**语义内容与布局 → 实际锚点 → 纯路径 → 受控视觉进度 → 装饰图形**。不要先画固定画布，再猜测内容坐标。

## 三层公共能力

### useElementAnchors

```tsx
const geometry = useElementAnchors({
  containerRef,
  anchors: {
    source: { ref: sourceRef, side: 'bottom' },
    target: { ref: targetRef, side: 'bottom' },
  },
});
```

- side 为 top/right/bottom/left/center，默认 center；bottom 使用真实矩形的底边中点。
- width/height 对应容器的局部可见尺寸，points 是稳定 ID 到坐标或 null 的映射。坐标扣除边框、换算轴向 scale，并计入容器自身 scroll，使 absolute 关系层与内容处于同一坐标空间。
- SVG absolute 填充同一个 `position:relative` 容器，并使用 `viewBox="0 0 width height"`；不能再使用固定画布的等比居中来渲染这组点。
- SSR、容器零尺寸、节点缺失／卸载、`display:none` 或无布局矩形时，不用最后一次坐标冒充有效锚点。`visibility:hidden` 与 `opacity:0` 仍占据布局，保留锚点；需要移除路径时由宿主卸载端点、使用 `display:none` 或停用测量。
- 默认事件驱动测量，不持续逐帧轮询。`tracking` 仅适合显式运动中的端点；关闭后恢复按需测量。
- `refresh` 用于宿主已知的布局变化；直接修改 DOM 的重排、动画或 ref 指向后，宿主可以显式请求重测。任意旋转、倾斜、透视、负比例镜像祖先不在首版合同内；正向轴向缩放与滚动由坐标层处理。
- offset 是本地 CSS 像素偏移，不是修补某个窗口宽度的魔数。

### createEffectPath

```tsx
const path = source && target
  ? createEffectPath(source, target, { route: 'rail', bend: 32 })
  : '';
```

straight 直接连接端点；curve 生成轻量曲线；rail 向下经过公共水平段再回到终点。bend 是路径布局间距而非动画时长。调用者需为路径保留足够容器空间，函数不自动避障、不推开卡片、不计算节点布局。

纯函数不读 DOM、不生成随机数，可用于服务端或离线数据。复杂无效输入策略以 API 与单元测试为准，不应输出 NaN/Infinity 路径。

### useEffectProgress

```tsx
const { progress, state, reduced } = useEffectProgress({
  active,
  viewportRef,
  preset: 'scene',
  onSettled: (target) => recordVisualSettlement(target),
});
```

- progress 为 0–1 MotionValue，使用 `useTransform` 映射至 SVG 属性，不每帧更新 React state。
- 首挂显示 active 对应的静态终态，不自动演一遍入场。
- active 改变从当前值接续，快速反向取消过时完成事件。
- hidden/offscreen 冻结当前视觉进度；恢复后继续。
- 系统、RhineProvider 或 EffectClock 减动时直接到最新目标；慢放不能覆盖减动。
- onSettled 是视觉回调，不是保存／执行成功回调；卸载与过期目标不回调。
- 不接受 raw variants/animate，不创造平行速度／偏好 Provider。

## 首批组件

### CalibrationReticle

```tsx
<CalibrationReticle active={aligned} />
```

装饰仪器对准结构；active 由用户操作控制。周围可见文字解释“抽象结构示意”，不要把它当成真实传感器、加载百分比、普通操作图标或品牌标志。初始与减动均有稳定静态构图。

### SignalPath

```tsx
import { useRef, useState } from 'react';
import { Button, RhineProvider } from '@wzrhine/react';
import { SignalPath } from '@wzrhine/effects';
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/effects/styles.css';

export function RelationshipExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [showSignal, setShowSignal] = useState(false);
  return <RhineProvider>
    <Button onClick={() => setShowSignal((value) => !value)} aria-pressed={showSignal}>
      切换关系强调
    </Button>
    <div ref={containerRef} style={{ position: 'relative', paddingBottom: 'var(--rl-space-12)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--rl-space-4)' }}>
        <div ref={sourceRef}>资料</div>
        <div ref={targetRef}>处理</div>
      </div>
      <SignalPath containerRef={containerRef} fromRef={sourceRef} toRef={targetRef}
        fromAnchor="bottom" toAnchor="bottom" route="rail" active={showSignal} />
    </div>
  </RhineProvider>;
}
```

容器必须 `position:relative`，在节点下方留出路径空间。默认 bottom/bottom/rail。静态关系不依赖动画，active 表示视觉目标；没有默认无限循环。SVG 不接管焦点、不拦截点击。

### AnnotationTrace

与 SignalPath 共用容器与端点合同，默认 right/left/curve，适合对象到文字说明的标注。文字始终可读，不能等待描线结束；相同能力不再复制一套端点观察器实现。

## 状态矩阵

| 状态 | 几何／图形 | 语义 |
| --- | --- | --- |
| 未测量／SSR | 不画猜测关系路径 | 内容正常可读 |
| 有效静态 | 实际端点与静态结构 | 无自动运行声明 |
| active 改变 | 视觉进度向最新目标移动 | 文字与按钮立即更新 |
| 快速反向 | 从当前值接续 | 不延迟新意图 |
| hidden/offscreen | 暂停，恢复时重测 | 不虚构完成 |
| reduced | 最新目标静态帧 | 信息不丢失 |
| 端点移除／display:none／无布局矩形 | 相关路径消失 | 不保留错误关联 |
| 卸载 | 清理观察器、监听、控制器 | 无迟到回调 |

## 主题、密度与可访问性

图形使用 `--rl-*` 语义色，跟随作用域主题，不污染宿主。纯装饰层 aria-hidden、pointer-events:none，不增加 Tab 停靠点；按钮继续使用现有 Button。关键信息必须有文字替代，不只靠路径颜色。长文本和密度变化应使布局重新测量，而不是缩小文字到不可读。

## 后续效果接入清单

1. 明确动画回答的语义问题；没有独立行为的布局先做 recipe。
2. 尽量直接复用已有锚点与进度；不得为每种效果复制 ResizeObserver、visibilitychange 或计时器。
3. 明确属性唯一所有者；时间插值采用 motion/react。
4. 静态首帧、减动、隐藏、卸载都必须成立。
5. 保持 SSR 确定；缺失节点与 renderer 失败不影响内容和操作。
6. 验证 getScreenCTM 后的实际端点，不以“无横向溢出”替代几何正确性。
7. 四通道、五宽度、容器独立变化、多实例和快速反向。
8. API、样式、真实 tarball 安装、体积与许可证证据齐备后再谈发布。

## 检查与限制

单元：`packages/effects/test/geometry.test.ts`、`anchors.test.tsx`、`progress.test.tsx`、`signature-effects.test.tsx`，公开入口与 SSR／水合另见 `public-foundations.test.tsx`。浏览器：`apps/docs/e2e/signature-effects.spec.ts`。命令、实际结果与遗留项见 [MFX-01 验收记录](../development/acceptance/2026-10-15-mfx-01.md)，公开类型以生成的 [effects API](../api/effects.md) 为准。
