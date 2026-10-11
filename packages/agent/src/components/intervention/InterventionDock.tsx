'use client';

import * as React from 'react';
import { AgentEntrance } from '../../motion/agent-motion.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

/**
 * Stacks the current interventions (ApprovalPanel, QuestionnaireCard, ErrorRecoveryNotice)
 * directly above the composer.
 *
 * - Children are the cards; give each a stable `key` (operation / questionnaire id). Cards that
 *   arrive after the first render enter once with `AgentEntrance kind="card"` (opacity + 8px +
 *   scale .985, `panel`); cards present on first render are static unless `animateInitial`.
 *   The entrance is frozen at mount, so status updates never replay it.
 * - The dock opens with a CSS `grid-template-rows: 0fr → 1fr` transition on
 *   `--rl-motion-base` (zero under reduced motion: it snaps open, nothing is hidden).
 * - `moreCount` > 0 shows 「还有 N 个待处理」 for approvals queued behind the visible one.
 * - It is a labelled region only while it has content. It never moves focus.
 */
export interface InterventionDockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of further pending interventions not shown. */
  moreCount?: number;
  /** Animate cards already present on the first render. Default false (restored state). */
  animateInitial?: boolean;
  /** Accessible name of the region. */
  label?: string;
}

export const InterventionDock = React.forwardRef<HTMLDivElement, InterventionDockProps>(function InterventionDock(
  { moreCount = 0, animateInitial = false, label, className, children, ...rest },
  ref,
) {
  const m = useAgentMessages().intervention;
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const open = items.length > 0;
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    firstRender.current = false;
  }, []);
  const animate = !firstRender.current || animateInitial;

  return (
    <div
      {...rest}
      ref={ref}
      className={cx('rl-agent-dock', className)}
      data-open={open || undefined}
      role={open ? 'region' : undefined}
      aria-label={open ? (label ?? m.dockLabel) : undefined}
    >
      <div className="rl-agent-dock__inner">
        {open && (
          <div className="rl-agent-dock__stack">
            {moreCount > 0 && <p className="rl-agent-dock__more">{m.dockMore(moreCount)}</p>}
            {items.map((item) => (
              <AgentEntrance key={item.key ?? undefined} kind="card" animate={animate} className="rl-agent-dock__item">
                {item}
              </AgentEntrance>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
