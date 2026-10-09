import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor } from '../src/contrast';
import {
  borderWidths,
  contrastPairs,
  densityTokens,
  easingTokens,
  minimumContrast,
  motionLoopMs,
  motionTokens,
  radiusScale,
  spaceScale,
  themedTokens,
  typeRoles,
} from '../src/manifest';
import { loadTokenBlocks, themeValues } from './css';

const blocks = loadTokenBlocks();
const light = themeValues(blocks, 'light');
const dark = themeValues(blocks, 'dark');
const system = themeValues(blocks, 'system');

describe('contrast helper', () => {
  it('matches known WCAG reference ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('rejects translucent colours instead of guessing', () => {
    expect(parseColor('rgb(0 0 0 / 0.5)')).toBeNull();
    expect(contrastRatio('rgba(0,0,0,0.5)', '#fff')).toBeNaN();
  });
});

describe('token structure', () => {
  it('never declares tokens on :root or bare elements', () => {
    for (const block of blocks) {
      expect(block.selector.startsWith('.rl-theme'), block.selector).toBe(true);
    }
  });

  it('uses the --rl- prefix for every custom property', () => {
    for (const block of blocks) {
      for (const name of block.declarations.keys()) {
        if (name.startsWith('--')) expect(name, block.selector).toMatch(/^--rl-[a-z0-9-]+$/);
      }
    }
  });

  const staticTokens = [
    ...typeRoles.map((r) => r.token),
    ...spaceScale.map((s) => s.token),
    ...radiusScale.map((r) => r.token),
    ...borderWidths.map((b) => b.token),
    ...densityTokens.map((d) => d.token),
    ...motionTokens.map((m) => m.token),
  ];

  it.each(staticTokens)('defines %s', (token) => {
    expect(light.get(token)).toBeTruthy();
  });

  it('keeps the spacing scale on a 4px grid', () => {
    for (const { token, px } of spaceScale) {
      expect(light.get(token)).toBe(`${px}px`);
      expect(px % 4).toBe(0);
    }
  });

  it.each(themedTokens)('%s is defined for light and redefined for dark', (token) => {
    expect(light.get(token), 'light').toBeTruthy();
    const darkBlock = blocks.find((b) => b.selector === ".rl-theme[data-rl-theme='dark']");
    expect(darkBlock?.declarations.has(token), 'dark override').toBe(true);
  });

  it('system theme mirrors the dark theme exactly', () => {
    const darkBlock = blocks.find((b) => b.selector === ".rl-theme[data-rl-theme='dark']");
    const systemBlock = blocks.find((b) => b.selector === ".rl-theme[data-rl-theme='system']");
    expect(systemBlock).toBeDefined();
    expect(Object.fromEntries(systemBlock!.declarations)).toEqual(Object.fromEntries(darkBlock!.declarations));
  });

  it('compact density only lowers control sizes', () => {
    const compact = blocks.find((b) => b.selector === ".rl-theme[data-rl-density='compact']");
    expect(compact).toBeDefined();
    for (const key of ['--rl-control-height-sm', '--rl-control-height-md', '--rl-control-height-lg']) {
      const base = Number.parseInt(light.get(key)!, 10);
      const dense = Number.parseInt(compact!.declarations.get(key)!, 10);
      expect(dense).toBeLessThan(base);
      // WCAG 2.2 target size minimum (24×24) is the floor even in compact mode.
      expect(dense).toBeGreaterThanOrEqual(24);
    }
  });

  it('keeps CSS motion values in sync with the TS manifest', () => {
    for (const { token, ms } of motionTokens) {
      expect(light.get(token), token).toBe(`${ms}ms`);
    }
    for (const { token, points } of easingTokens) {
      expect(light.get(token), token).toBe(`cubic-bezier(${points.join(', ')})`);
    }
    expect(light.get('--rl-motion-loop')).toBe(`${motionLoopMs}ms`);
  });

  it('collapses CSS motion durations for reduced motion', () => {
    const reduce = blocks.filter(
      (b) => b.media?.includes('prefers-reduced-motion') || b.selector.includes("data-rl-motion='reduce'"),
    );
    expect(reduce).toHaveLength(2);
    for (const block of reduce) {
      for (const { token, name } of motionTokens) {
        if (name === 'instant') continue;
        expect(block.declarations.get(token), `${block.selector} ${token}`).toBe('0ms');
      }
    }
  });
});

describe.each([
  ['light', light],
  ['dark', dark],
  ['system (dark media)', system],
] as const)('WCAG 2.2 AA contrast · %s', (_theme, values) => {
  it.each(contrastPairs.map((p) => [`${p.fg} on ${p.bg}`, p] as const))('%s', (_label, pair) => {
    const fg = values.get(pair.fg);
    const bg = values.get(pair.bg);
    expect(fg, pair.fg).toBeTruthy();
    expect(bg, pair.bg).toBeTruthy();
    const ratio = contrastRatio(fg!, bg!);
    expect(ratio, `${pair.usage}: ${fg} / ${bg}`).toBeGreaterThanOrEqual(minimumContrast[pair.level]);
  });
});
