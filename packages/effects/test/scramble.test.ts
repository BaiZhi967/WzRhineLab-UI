import { describe, expect, it } from 'vitest';
import { isWide, isWideGlyph, maskText, scrambleCells, scrambleText, stepToward } from '../src';

describe('scramble', () => {
  it('is deterministic for the same text, progress and frame', () => {
    const a = scrambleText('ARC-1024 样本', 0.4, 7);
    const b = scrambleText('ARC-1024 样本', 0.4, 7);
    expect(a).toBe(b);
    expect(scrambleText('ARC-1024 样本', 0.4, 8)).not.toBe(a);
  });

  it('progress 1 returns the original text; progress 0 returns the mask', () => {
    expect(scrambleText('ARC-1024', 1, 3)).toBe('ARC-1024');
    expect(scrambleText('ARC-1024', 0, 3)).toBe(maskText('ARC-1024'));
    expect(scrambleText('ARC-1024', 1.5, 0)).toBe('ARC-1024');
    expect(scrambleText('ARC-1024', -1, 0)).toBe(maskText('ARC-1024'));
  });

  it('keeps length and whitespace so the line never reflows', () => {
    const text = 'REC 样本 07';
    for (const p of [0, 0.2, 0.5, 0.8, 1]) {
      const out = Array.from(scrambleText(text, p, 5));
      expect(out).toHaveLength(Array.from(text).length);
      expect(out[3]).toBe(' ');
      expect(out[6]).toBe(' ');
    }
  });

  it('uses full-width glyphs for CJK characters', () => {
    expect(isWide('样')).toBe(true);
    expect(isWide('A')).toBe(false);
    const cells = scrambleCells('样本A', 0.1, 2);
    expect(isWideGlyph(cells[0]!.char)).toBe(true);
    expect(isWideGlyph(cells[1]!.char)).toBe(true);
    expect(isWideGlyph(cells[2]!.char)).toBe(false);
  });

  it('resolves characters left to right as progress increases', () => {
    const resolvedCount = (p: number) => scrambleCells('ABCDEFGH', p, 1).filter((c) => c.resolved).length;
    expect(resolvedCount(0.25)).toBe(2);
    expect(resolvedCount(0.5)).toBe(4);
    expect(resolvedCount(0.75)).toBe(6);
    const half = scrambleCells('ABCDEFGH', 0.5, 1);
    expect(half.slice(0, 4).every((c) => c.resolved)).toBe(true);
    expect(half.slice(4).every((c) => !c.resolved)).toBe(true);
  });

  it('contains no randomness', () => {
    const original = Math.random;
    Math.random = () => {
      throw new Error('Math.random must not be used');
    };
    try {
      expect(() => scrambleText('ARC-1024 样本', 0.3, 9)).not.toThrow();
    } finally {
      Math.random = original;
    }
  });

  it('stepToward moves without overshooting in both directions', () => {
    expect(stepToward(0, 1, 0.3)).toBeCloseTo(0.3);
    expect(stepToward(0.9, 1, 0.3)).toBe(1);
    expect(stepToward(0.5, 0, 0.2)).toBeCloseTo(0.3);
    expect(stepToward(0.1, 0, 0.2)).toBe(0);
    expect(stepToward(0.4, 0.4, 0.2)).toBe(0.4);
  });
});
