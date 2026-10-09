import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allPublicTokens, publicTokens, themeAttributes, themedPublicTokens, tokenVar } from '../src/contract';
import { themedTokens } from '../src/manifest';
import { loadTokenBlocks, tokensCssPath } from './css';

const blocks = loadTokenBlocks();
const raw = readFileSync(tokensCssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const block = (selector: string, media: 'none' | string = 'none') =>
  blocks.find((b) => b.selector === selector && (media === 'none' ? b.media === null : b.media?.includes(media)));

const declaredInCss = new Set(blocks.flatMap((b) => [...b.declarations.keys()].filter((k) => k.startsWith('--'))));

describe('stable theme contract', () => {
  it('lists every token exactly once', () => {
    expect(new Set(allPublicTokens).size).toBe(allPublicTokens.length);
  });

  it('tokens.css defines exactly the contract — no undeclared additions, no removals', () => {
    const missing = allPublicTokens.filter((t) => !declaredInCss.has(t));
    const extra = [...declaredInCss].filter((t) => !(allPublicTokens as readonly string[]).includes(t));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it('the base .rl-theme block defines every token, so light needs no attribute', () => {
    const base = blocks.filter((b) => b.selector === '.rl-theme' && b.media === null);
    const defined = new Set(base.flatMap((b) => [...b.declarations.keys()]));
    expect(allPublicTokens.filter((t) => !defined.has(t))).toEqual([]);
  });

  it.each([
    ['dark', block(".rl-theme[data-rl-theme='dark']")],
    ['system (dark media)', block(".rl-theme[data-rl-theme='system']", 'prefers-color-scheme: dark')],
  ])('%s redefines exactly the themed tokens', (_name, themeBlock) => {
    expect(themeBlock).toBeDefined();
    const keys = [...themeBlock!.declarations.keys()].filter((k) => k.startsWith('--')).sort();
    expect(keys).toEqual([...themedPublicTokens].sort());
  });

  it('manifest colour groups cover every colour token', () => {
    expect([...themedTokens].sort()).toEqual([...publicTokens.color].sort());
  });

  it('compact density only touches size tokens', () => {
    const compact = block(".rl-theme[data-rl-density='compact']");
    for (const key of compact!.declarations.keys()) {
      expect(publicTokens.size as readonly string[], key).toContain(key);
    }
  });

  it('reduced-motion blocks only touch motion tokens', () => {
    const reduce = blocks.filter((b) => b.media?.includes('prefers-reduced-motion') || b.selector.includes('data-rl-motion'));
    expect(reduce.length).toBe(2);
    for (const b of reduce) {
      for (const key of b.declarations.keys()) expect(publicTokens.motion as readonly string[], key).toContain(key);
    }
  });

  it('has no duplicate declarations inside any block', () => {
    for (const body of raw.match(/\{[^{}]*\}/g) ?? []) {
      const names = [...body.matchAll(/(--rl-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      expect(dupes).toEqual([]);
    }
  });

  it('every theme attribute value has a matching selector', () => {
    for (const value of themeAttributes.theme.values) {
      if (value === 'light') continue; // the default; no attribute selector needed
      expect(raw).toContain(`[data-rl-theme='${value}']`);
    }
    expect(raw).toContain(`[data-rl-density='compact']`);
    expect(raw).toContain(`[data-rl-motion='reduce']`);
  });

  it('tokenVar builds typed var() references', () => {
    expect(tokenVar('--rl-accent')).toBe('var(--rl-accent)');
    expect(tokenVar('--rl-space-4', '16px')).toBe('var(--rl-space-4, 16px)');
  });
});
