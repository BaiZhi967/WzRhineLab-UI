/**
 * Deterministic glyph scramble for the decrypt-style reveal. The same (text, progress, frame)
 * always yields the same output, so tests and screenshots are stable; nothing here is random.
 */

const NARROW = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ#/-';
const WIDE = '▓▒░▚▞';

/** CJK and other full-width characters get full-width glyphs so the line does not reflow. */
export function isWide(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return code >= 0x2e80;
}

/** True for glyphs drawn from the full-width scramble set. */
export function isWideGlyph(ch: string): boolean {
  return WIDE.includes(ch);
}

function isBlank(ch: string): boolean {
  return /\s/.test(ch);
}

/** Static mask shown while content is concealed. */
export function maskText(text: string): string {
  return Array.from(text)
    .map((ch) => (isBlank(ch) ? ch : isWide(ch) ? '▒' : '·'))
    .join('');
}

export interface ScrambleCell {
  char: string;
  resolved: boolean;
}

/**
 * Characters resolve left to right as progress goes 0 → 1; unresolved positions cycle through
 * glyphs as `frame` advances. progress ≥ 1 returns the text; progress ≤ 0 returns the mask.
 */
export function scrambleCells(text: string, progress: number, frame: number): ScrambleCell[] {
  const chars = Array.from(text);
  const n = chars.length;
  if (progress >= 1) return chars.map((char) => ({ char, resolved: true }));
  if (progress <= 0) return Array.from(maskText(text)).map((char) => ({ char, resolved: false }));
  return chars.map((ch, i) => {
    if (isBlank(ch)) return { char: ch, resolved: true };
    if (progress >= (i + 1) / n) return { char: ch, resolved: true };
    const set = isWide(ch) ? WIDE : NARROW;
    return { char: set[(i * 7 + frame * 13) % set.length]!, resolved: false };
  });
}

export function scrambleText(text: string, progress: number, frame: number): string {
  return scrambleCells(text, progress, frame)
    .map((cell) => cell.char)
    .join('');
}

/** Move `current` toward `target` by `step` without overshooting. */
export function stepToward(current: number, target: number, step: number): number {
  if (current < target) return Math.min(target, current + step);
  if (current > target) return Math.max(target, current - step);
  return current;
}
