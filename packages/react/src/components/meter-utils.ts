// Pure meter helpers (no React): importable from React Server Components (ADR-0008 §2).

/** Which native <meter> region a value falls in, relative to `optimum`. */
export type MeterState = 'optimum' | 'suboptimum' | 'critical';

/**
 * Native <meter> rules: the range is split by `low` / `high`; the region containing `optimum` is
 * good, the adjacent region is "suboptimum", the far region "critical". Without thresholds every
 * value is optimum.
 */
export function getMeterState(value: number, { min = 0, max = 100, low, high, optimum }: { min?: number; max?: number; low?: number; high?: number; optimum?: number }): MeterState {
  const lo = Math.max(min, Math.min(low ?? min, max));
  const hi = Math.min(max, Math.max(high ?? max, lo));
  const opt = optimum ?? (min + max) / 2;
  const region = (v: number) => (v < lo ? 0 : v > hi ? 2 : 1);
  const distance = Math.abs(region(value) - region(opt));
  return distance === 0 ? 'optimum' : distance === 1 ? 'suboptimum' : 'critical';
}
