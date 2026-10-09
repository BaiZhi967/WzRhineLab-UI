import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { EffectClock } from './clock';

/**
 * Side-by-side motion comparison (MOTION.md "Showcase 每类动画提供 Default / Slow x0.25 /
 * Reduced / Interrupt 四组状态"). Renders the same demo in four lanes:
 * - Default:   speed 1, user motion preference.
 * - Slow ×0.25: four times slower, for reviewing easing and choreography.
 * - Reduced:   forced reduced motion (MotionConfig "always" + data-rl-motion), the equivalent fallback.
 * - Interrupt: speed 1; the player re-triggers the demo while it is still running, proving the effect
 *              retargets from its current state instead of queueing or restarting.
 * One shared play control drives every lane, so the lanes stay in step.
 */

export type MotionLane = 'default' | 'slow' | 'reduced' | 'interrupt';

export interface MotionDemoProps {
  /** Monotonic play counter; each increment is one "play". */
  play: number;
  /** Target state toggled by each play (e.g. revealed / concealed). */
  active: boolean;
  lane: MotionLane;
}

export type MotionPlayerProps = {
  /** Visible title of the comparison; also names the region. */
  title: React.ReactNode;
  /** One-line timing spec shown under the title, e.g. "scene 420ms · ease-in-out". */
  spec?: React.ReactNode;
  /** Renders one lane. Must be deterministic for a given (play, active). */
  demo: (props: MotionDemoProps) => React.ReactNode;
  /** Lanes to show; defaults to all four. */
  lanes?: readonly MotionLane[];
  /** How long after each play (ms) the Interrupt lane reverses; keep it shorter than the demo's duration. */
  interruptAfterMs?: number;
  /** Initial active state. */
  defaultActive?: boolean;
  className?: string;
};

const laneMeta: Record<MotionLane, { label: string; hint: string; speed: number; reduced: boolean }> = {
  default: { label: 'Default', hint: '×1 · 跟随系统偏好', speed: 1, reduced: false },
  slow: { label: 'Slow ×0.25', hint: '四倍慢放，检查缓动', speed: 0.25, reduced: false },
  reduced: { label: 'Reduced', hint: '强制减少动态效果', speed: 1, reduced: true },
  interrupt: { label: 'Interrupt', hint: '播放中途反向触发', speed: 1, reduced: false },
};

const allLanes: readonly MotionLane[] = ['default', 'slow', 'reduced', 'interrupt'];

export function MotionPlayer({
  title,
  spec,
  demo,
  lanes = allLanes,
  interruptAfterMs = 180,
  defaultActive = false,
  className,
}: MotionPlayerProps) {
  const titleId = React.useId();
  const [play, setPlay] = React.useState(0);
  const [active, setActive] = React.useState(defaultActive);
  // The interrupt lane gets its own state: it follows the shared play, then reverses shortly after.
  const [interrupt, setInterrupt] = React.useState({ play: 0, active: defaultActive });

  const trigger = () => {
    const next = !active;
    setActive(next);
    setPlay((p) => p + 1);
    setInterrupt((s) => ({ play: s.play + 1, active: next }));
  };

  React.useEffect(() => {
    if (play === 0) return;
    const t = window.setTimeout(() => setInterrupt((s) => ({ play: s.play + 1, active: !s.active })), interruptAfterMs);
    return () => window.clearTimeout(t);
  }, [play, interruptAfterMs]);

  const reset = () => {
    setActive(defaultActive);
    setPlay(0);
    setInterrupt({ play: 0, active: defaultActive });
  };

  return (
    <section className={['rl-player', className].filter(Boolean).join(' ')} aria-labelledby={titleId} data-slot="motion-player">
      <header className="rl-player__head">
        <div className="rl-player__titles">
          <h3 id={titleId} className="rl-player__title">
            {title}
          </h3>
          {spec != null && <p className="rl-player__spec">{spec}</p>}
        </div>
        <div className="rl-player__controls">
          <button type="button" className="rl-player__button" data-primary onClick={trigger} aria-describedby={`${titleId}-state`}>
            {active ? '反向播放' : '播放'}
          </button>
          <button type="button" className="rl-player__button" onClick={reset} disabled={play === 0}>
            重置
          </button>
          <span id={`${titleId}-state`} className="rl-player__state" aria-live="polite">
            第 {play} 次 · 目标：{active ? '激活' : '初始'}
          </span>
        </div>
      </header>
      <ol className="rl-player__lanes">
        {lanes.map((lane) => {
          const meta = laneMeta[lane];
          const laneProps = lane === 'interrupt' ? { play: interrupt.play, active: interrupt.active, lane } : { play, active, lane };
          return (
            <li key={lane} className="rl-player__lane" data-lane={lane}>
              <p className="rl-player__lane-label">
                <span>{meta.label}</span>
                <span className="rl-player__lane-hint">{meta.hint}</span>
              </p>
              <MotionConfig reducedMotion={meta.reduced ? 'always' : 'user'}>
                <EffectClock speed={meta.speed} reduced={meta.reduced}>
                  <div className="rl-player__stage" data-rl-motion={meta.reduced ? 'reduce' : undefined}>
                    {demo(laneProps)}
                  </div>
                </EffectClock>
              </MotionConfig>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
