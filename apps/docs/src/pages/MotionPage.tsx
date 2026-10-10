import * as React from 'react';
import { MotionConfig, motion } from 'motion/react';
import { easingTokens, motionTokens, motionUsage } from '@wzrhine/tokens';
import { Button, transition, useRhineMotion } from '@wzrhine/react';
import type { RhineTransitionName } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented } from '../ui/controls';

// MotionPlayer lives in the optional effects package: keep it out of the main chunk.
const MotionCoreLab = React.lazy(() => import('./MotionCoreLab'));

const patternCatalogue = 'https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/design/MOTION-PATTERNS.md';

const patterns: readonly { name: string; owner: string; reduced: string }[] = [
  { name: 'press', owner: 'motion/react · scale', reduced: '无缩放，颜色即时' },
  { name: 'presence / panel', owner: 'MotionPresence · opacity + y', reduced: '仅透明度 ≤120ms' },
  { name: 'stagger', owner: 'RhineMotionGroup', reduced: '无错峰、无位移' },
  { name: 'indicator retarget', owner: 'CSS transition · translate（Tabs）', reduced: '直接定位' },
  { name: 'shared identity', owner: 'motion/react layoutId（ArchiveCard）', reduced: '直接切换' },
  { name: 'reveal / text-scramble', owner: 'rAF（ArchiveReveal）', reduced: '直接显示最终文本' },
  { name: 'scan', owner: 'CSS @keyframes（ScanSurface）', reduced: '静态描边' },
  { name: 'orbit', owner: 'motion/react · SVG rotate', reduced: '不旋转' },
  { name: 'status-pulse / progress-flow', owner: 'CSS @keyframes', reduced: '静态' },
];

type Speed = '1' | '0.25';
type Mode = 'default' | 'reduce';

/** Mirrors the token curve as an SVG path so the preview cannot drift from the value. */
function CurvePreview({ points, label }: { points: readonly number[]; label: string }) {
  const [x1, y1, x2, y2] = points as [number, number, number, number];
  const s = 64;
  const path = `M0 ${s} C ${x1 * s} ${s - y1 * s}, ${x2 * s} ${s - y2 * s}, ${s} 0`;
  return (
    <svg className="sc-curve" viewBox={`-4 -4 ${s + 8} ${s + 8}`} role="img" aria-label={`${label} 曲线`}>
      <rect x="0" y="0" width={s} height={s} className="sc-curve__frame" />
      <path d={path} className="sc-curve__path" />
    </svg>
  );
}

function scaled(name: RhineTransitionName, speed: Speed) {
  const t = transition[name] as { duration: number };
  return { ...transition[name], duration: t.duration / Number(speed) };
}

/** A track whose indicator slides between stops; clicking mid-flight retargets from the current position. */
function InterruptDemo({ speed }: { speed: Speed }) {
  const prefs = useRhineMotion();
  const stops = ['Overview', 'Records', 'Imagery', 'Notes'] as const;
  const [active, setActive] = React.useState(0);
  return (
    <div className="sc-interrupt">
      <div className="sc-interrupt__track" role="group" aria-label="指示器目标">
        {stops.map((stop, i) => (
          <button
            key={stop}
            type="button"
            className="sc-interrupt__stop"
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            {stop}
          </button>
        ))}
        <motion.span
          className="sc-interrupt__indicator"
          aria-hidden="true"
          initial={false}
          animate={{ x: `${active * 100}%` }}
          transition={prefs.reduced ? transition.instant : scaled('base', speed)}
        />
      </div>
      <p className="sc-small">快速连续点击：指示器从当前视觉位置改道，不排队播放过时动画。</p>
    </div>
  );
}

function FeedbackDemo() {
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (!busy) return;
    const t = window.setTimeout(() => setBusy(false), 1800);
    return () => window.clearTimeout(t);
  }, [busy]);
  return (
    <div className="sc-row">
      <Button variant="secondary">按住观察按压</Button>
      <Button loading={busy} onClick={() => setBusy(true)}>
        触发加载
      </Button>
    </div>
  );
}

function PresenceDemo({ speed }: { speed: Speed }) {
  const prefs = useRhineMotion();
  const [open, setOpen] = React.useState(true);
  return (
    <div className="sc-presence">
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="presence-panel">
        {open ? '收起面板' : '展开面板'}
      </Button>
      <div id="presence-panel" className="sc-presence__slot">
        <motion.div
          className="sc-presence__panel"
          initial={false}
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: prefs.reduced ? 0 : 8 }}
          transition={prefs.reduced ? transition.instant : scaled('panel', speed)}
          style={{ pointerEvents: open ? 'auto' : 'none' }}
          aria-hidden={!open}
        >
          <p className="sc-subhead">详情层</p>
          <p className="sc-small">panel 280ms · ease-out · 8px 位移；减动时只显隐。</p>
        </motion.div>
      </div>
    </div>
  );
}

function ComparePane({ mode, speed }: { mode: Mode; speed: Speed }) {
  return (
    <MotionConfig reducedMotion={mode === 'reduce' ? 'always' : 'user'}>
      <div className="sc-compare__pane" data-rl-motion={mode === 'reduce' ? 'reduce' : undefined}>
        <p className="sc-compare__label">{mode === 'reduce' ? 'Reduced motion' : 'Default'}</p>
        <InterruptDemo speed={speed} />
        <PresenceDemo speed={speed} />
      </div>
    </MotionConfig>
  );
}

export function MotionPage() {
  const [speed, setSpeed] = React.useState<Speed>('1');
  return (
    <div className="sc-page">
      <PageHeader index="18" section="Motion" title="Motion Foundations">
        <p>
          可解释、精确、克制、可中断。组件通过 <code>useRhineMotion()</code> 取用统一预设，系统「减少动态效果」或
          <code>&lt;MotionConfig reducedMotion&gt;</code> 生效时全部降级为即时变化。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="durations" index="01" title="Duration tokens" span="two-thirds" note="CSS 变量与 motion/react 预设由同一份 manifest 生成，并由测试保持一致。">
          <div className="sc-table-wrap" tabIndex={0} role="region" aria-label="时长 tokens（可横向滚动）">
            <table className="sc-table">
              <thead>
                <tr>
                  <th scope="col">名称</th>
                  <th scope="col" className="sc-num">
                    时长
                  </th>
                  <th scope="col">用途</th>
                  <th scope="col">CSS</th>
                </tr>
              </thead>
              <tbody>
                {motionTokens.map((t) => (
                  <tr key={t.name}>
                    <td>
                      <code className="sc-mono-sm">{t.name}</code>
                    </td>
                    <td className="sc-num">
                      <code className="sc-mono-sm">{t.ms}ms</code>
                    </td>
                    <td>{motionUsage[t.name]}</td>
                    <td>
                      <code className="sc-mono-sm">{t.token}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Specimen>
        <Specimen id="easing" index="02" title="Easing" span="third" note="linear 仅用于真实进度；Spring 仅用于可拖拽目标。">
          <ul className="sc-easing">
            {easingTokens.map((e) => (
              <li key={e.name}>
                <CurvePreview points={e.points} label={e.name} />
                <div>
                  <code className="sc-mono-sm">{e.token}</code>
                  <p className="sc-small">{e.usage}</p>
                  <code className="sc-mono-sm sc-muted">[{e.points.join(', ')}]</code>
                </div>
              </li>
            ))}
            <li>
              <CurvePreview points={[0, 0, 1, 1]} label="linear" />
              <div>
                <code className="sc-mono-sm">--rl-ease-linear</code>
                <p className="sc-small">仅用于真实进度与不确定加载循环</p>
                <code className="sc-mono-sm sc-muted">linear</code>
              </div>
            </li>
          </ul>
          <dl className="sc-easing-rules">
            <div>
              <dt>Spring</dt>
              <dd>暂不提供默认预设；仅可拖拽 / 可打断目标使用，禁止无语义弹跳。</dd>
            </div>
            <div>
              <dt>Reduce</dt>
              <dd>所有曲线退化为 duration 0，仅保留颜色、透明度的即时变化。</dd>
            </div>
          </dl>
        </Specimen>
        <Specimen id="feedback" index="03" title="Button feedback" span="half" note="press 80ms · scale 0.985；不改变布局或命中区域。加载时宽度保持不变。">
          <FeedbackDemo />
        </Specimen>
        <Specimen id="compare" index="04" title="Default vs reduced · interrupt" note="左右两侧使用同一组件；右侧强制 reducedMotion=always。Slow ×0.25 只影响本演示。">
          <div className="sc-compare__toolbar">
            <Segmented
              legend="播放速度"
              name="motion-speed"
              value={speed}
              onChange={setSpeed}
              options={[
                { value: '1', label: '×1' },
                { value: '0.25', label: 'Slow ×0.25' },
              ]}
            />
          </div>
          <div className="sc-compare">
            <ComparePane mode="default" speed={speed} />
            <ComparePane mode="reduce" speed={speed} />
          </div>
        </Specimen>
        <Specimen
          id="motion-core"
          index="05"
          title="Motion Core · 四通道对照"
          note="同一演示的 Default / Slow ×0.25 / Reduced / Interrupt；Interrupt 通道在播放中途反向，证明从当前视觉状态接续。"
        >
          <div className="sc-lab">
            <React.Suspense fallback={<p className="sc-small" role="status">正在加载对照演示…</p>}>
              <MotionCoreLab />
            </React.Suspense>
          </div>
        </Specimen>
        <Specimen
          id="motion-patterns"
          index="06"
          title="Pattern catalogue"
          note="每个模式的语义、触发、时长、生命周期、中断、减动、隐藏页、语义 fallback 与性能预算见模式目录；属性所有权见 ADR-0007。"
        >
          <div className="sc-table-wrap" tabIndex={0} role="region" aria-label="动效模式（可横向滚动）">
            <table className="sc-table">
              <thead>
                <tr>
                  <th scope="col">模式</th>
                  <th scope="col">所有者</th>
                  <th scope="col">减动</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <code className="sc-mono-sm">{p.name}</code>
                    </td>
                    <td>{p.owner}</td>
                    <td>{p.reduced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sc-small">
            beam、particle-field、shader-surface 尚未实现（M11 Rendering Lab 评估）。{' '}
            <a className="sc-doc-link" href={patternCatalogue}>阅读完整模式目录（docs/design/MOTION-PATTERNS.md）</a>
          </p>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
