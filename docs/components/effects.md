# Showcase effects · `@wzrhine/effects`

- 状态：**Experimental**（M4 起；MFX-01 扩展尚未发布） · 源码：`packages/effects/src/*` · Showcase：`#/motion/effects`
- 仪器对准、关系传导、标注线及共享几何／进度底座见 [Effect foundations](effect-foundations.md)；继承本文内容先于动画、按需启用与减动规则。
- **可选包**：`@wzrhine/react` 不导入、不依赖它（包边界测试强制）。只在需要演示效果的页面引入，并且只导入单个效果时可以按需裁剪。

```tsx
import '@wzrhine/effects/styles.css';
import { ArchiveReveal, MotionPlayer, OrbitalDiagram, ScanSurface } from '@wzrhine/effects';
```

## 规则（MOTION.md「扫描/解密属于 Showcase effect」）
1. **内容先于动画**：真实文字从一开始就在无障碍树中，动画只是 `aria-hidden` 的装饰层，不延迟业务结果。
2. **只在用户主动触发时播放**，不在业务页默认开启无限循环（STYLE.md 禁止默认无限扫描）。
3. **可中断**：播放中途反向时，从当前进度回退，不重新开始，也不排队。
4. **减动等价**：系统偏好、`RhineProvider motion="reduce"` 或 `EffectClock reduced` 任一生效时，直接切换到结果，不做位移或字形循环。
5. **生命周期**：页面隐藏时暂停逐帧循环；轨道离开视口时停止旋转；动画完成或卸载时取消 `requestAnimationFrame`。M10 起全部循环使用 `@wzrhine/react` 的共享生命周期与可见性来源（`useMotionLifecycle`、`usePageVisible` / `useInViewport`，ADR-0007 §4–5），本包的 `usePageVisible` / `useInViewport` 是同一实现的重新导出。
6. **确定性**：解密字形由文字、进度和帧号计算得出，不使用随机数（测试强制），截图与测试稳定。

## ArchiveReveal
```tsx
<ArchiveReveal text="ARC-1024" revealed={open} concealedLabel="受限编号" onSettled={(r) => …} />
```
逐字从左到右解密，640ms（`duration`）。中文使用全角字形，空白保留，行宽不变。隐藏时读屏读 `concealedLabel`，显示时读真实文字。

## ScanSurface
```tsx
<ScanSurface scanKey={scanCount} onScanEnd={…}><RecordCard /></ScanSurface>
```
每次 `scanKey` 变化扫描一遍，900ms，ease-in-out。挂载时不扫描；相同的 key 重新渲染也不会再扫。扫描线 `pointer-events: none`，内容一直可以操作。减动时改为约 160ms 的静态描边。页面隐藏时立即结束本次扫描并触发 `onScanEnd`，隐藏期间请求的扫描不运行（M10）。

## OrbitalDiagram
「仪器」视觉语法的装饰结构：同心细线圆环、节点、准星。标签是真实的无障碍列表（`label` 为列表名称），图形 `aria-hidden`。节点位置由 `angle` 决定。`animate` 需显式开启，减动、页面隐藏或离开视口时停止。M10 起暂停（页面隐藏、离开视口）时保持当前角度，恢复后从该角度接续；关闭 `animate` 或减动时回到 0°。`data-lifecycle`（`idle` / `running` / `paused` / `stopped`）与 `data-paused`（`reduced` / `hidden` / `offscreen`）给出当前状态。容器较窄时图例换到图形下方。

## MotionPlayer
MOTION.md 要求展示动画时提供 Default / Slow ×0.25 / Reduced / Interrupt 四种状态。MotionPlayer 把同一个演示并排渲染成四个通道，由同一个播放按钮驱动：

| 通道 | 速度 | 减动 | 用途 |
| --- | --- | --- | --- |
| Default | ×1 | 跟随用户偏好 | 实际效果 |
| Slow ×0.25 | ×0.25 | 跟随用户偏好 | 检查缓动与编排 |
| Reduced | ×1 | 强制（`MotionConfig always` + `data-rl-motion`） | 减动等价表现 |
| Interrupt | ×1 | 跟随用户偏好 | 播放后 `interruptAfterMs` 自动反向，验证可中断 |

```tsx
<MotionPlayer title="ArchiveReveal" spec="640ms · 逐字" interruptAfterMs={260}
  demo={({ active }) => <ArchiveReveal text="ARC-1024" revealed={active} />} />
```
- `demo({ play, active, lane })` 必须对相同输入给出确定输出。
- 状态行是 polite 实时区域。通道按 4 → 2 → 1 列排布（容器查询），不会出现单独一格在一行。
- 也可以用 `EffectClock`（`speed`、`reduced`）给自定义效果提供同样的计时；效果内部通过 `useEffectTiming()` 读取。

## 当前体积与验证（MFX-01，未发布）

当前基于真实 dist 的 esbuild 门禁实测：effects 全量约 **6.77 KB gzip**，CSS 约 **1.92 KB**；独立路径生成 0.29 KB、SignalPath 2.77 KB、CalibrationReticle 1.19 KB、ArchiveReveal 1.34 KB。peer 外置，算法、预算与独立入口隔离规则见 [SIZE](../development/SIZE.md)。

当前 effects 单元测试 **72 项**；新增效果三浏览器 **54 项**、原有动效／减动／布局三浏览器定向回归 **279 项**通过。实际执行范围、首次失败、未覆盖项与已知问题见 [MFX-01 验收记录](../development/acceptance/2026-10-15-mfx-01.md)，不把这些数字当作完整全路由 E2E 或外部无障碍审计。

## 历史体积（M4，非当前基线）

以下为 M4 时 Vite 库模式实测，外置 react / motion / @wzrhine/react，保留作历史对照。
| 导入 | min | gzip |
| --- | --- | --- |
| `@wzrhine/effects` 全部 | 11.0 kB | 3.8 kB |
| 只导入 `MotionPlayer` | 3.4 kB | 1.3 kB |
| `@wzrhine/react` 的 Button + Text（对照） | 6.5 kB | 2.5 kB，不含任何 effects 代码 |

M4 时 Showcase 用 `React.lazy` 按需加载效果页，生成独立的 5.4 kB JS 和 1.6 kB CSS（gzip）；这些历史分包数值不代表 MFX-01 构建。当前首页仪器 recipe 与效果实验区独立懒加载，普通组件页不加载它们。

## 历史测试（M4／M10）
- 单测 `packages/effects/test`（共 45 项）：scramble 7 项、计时与组件 23 项、生命周期 9 项（M10，`lifecycle.test.tsx`）、包边界 6 项。
- 浏览器 `apps/docs/e2e/effects.spec.ts`：通道布局 4 项、MotionPlayer 4 项、减动扫描 1 项、页面内效果 5 项（含「效果代码只在本页加载」）、明暗 axe 2 项。Chromium、Firefox、WebKit 均通过。M10 的隐藏页暂停与轨道接续另见 `motion-core.spec.ts`。
