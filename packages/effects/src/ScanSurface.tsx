import * as React from 'react';
import { useEffectTiming } from './clock.js';
import { usePageVisible } from './usePageVisible.js';

/**
 * Single-pass scan line over a surface, triggered by the user (e.g. "re-scan"). Showcase effect:
 * - One sweep per `scanKey` change, never an idle infinite loop (STYLE.md forbids default infinite scans).
 * - Children render immediately and stay interactive; the sweep is a pointer-events:none overlay.
 * - Reduced motion: no moving line; a brief static outline marks the "scanned" moment instead.
 * - Stop conditions (ADR-0007): skipped while the page is hidden, cut short if the page hides mid-sweep,
 *   cleared on unmount. One-shot, so it does not track the viewport.
 */

export type ScanSurfaceProps = {
  children: React.ReactNode;
  /** Change this value to run one sweep (a counter or timestamp). */
  scanKey?: number | string;
  /** Sweep duration at speed 1 (ms). */
  duration?: number;
  onScanEnd?: () => void;
  className?: string;
};

export function ScanSurface({ children, scanKey, duration = 900, onScanEnd, className }: ScanSurfaceProps) {
  const timing = useEffectTiming();
  const visible = usePageVisible();
  const [running, setRunning] = React.useState(false);
  const lastKey = React.useRef(scanKey);
  const timer = React.useRef<number | undefined>(undefined);
  const latest = React.useRef({ visible, reduced: timing.reduced, ms: timing.scale(duration), onScanEnd });
  latest.current = { visible, reduced: timing.reduced, ms: timing.scale(duration), onScanEnd };

  // Only a change of scanKey starts a sweep; other prop changes must not retrigger it.
  React.useEffect(() => {
    if (Object.is(lastKey.current, scanKey)) return;
    lastKey.current = scanKey;
    const { visible: isVisible, reduced, ms } = latest.current;
    if (scanKey === undefined || !isVisible) return;
    setRunning(true);
    const t = window.setTimeout(
      () => {
        setRunning(false);
        latest.current.onScanEnd?.();
      },
      reduced ? 160 : ms,
    );
    timer.current = t;
    return () => window.clearTimeout(t);
  }, [scanKey]);

  // Hidden mid-sweep: end it now instead of finishing off-screen.
  React.useEffect(() => {
    if (visible || !running) return;
    window.clearTimeout(timer.current);
    setRunning(false);
    latest.current.onScanEnd?.();
  }, [visible, running]);

  const style = { '--rl-scan-duration': `${timing.scale(duration)}ms` } as React.CSSProperties;

  return (
    <div
      className={['rl-scan', className].filter(Boolean).join(' ')}
      data-slot="scan-surface"
      data-scanning={running || undefined}
      data-reduced={timing.reduced || undefined}
      style={style}
    >
      {children}
      {running && <span key={String(scanKey)} className="rl-scan__line" aria-hidden="true" />}
    </div>
  );
}
