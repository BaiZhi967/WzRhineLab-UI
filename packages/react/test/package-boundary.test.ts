import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { duration, transition } from '../src';
import { motionDurations } from '@wzrhine/tokens';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('package boundary', () => {
  it('entry point has no CSS side effects', () => {
    const entry = read('../src/index.ts');
    expect(entry).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
  });

  it('component CSS uses tokens instead of literal colours', () => {
    const css = read('../src/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/i);
    expect(css).not.toMatch(/\bhsla?\(/i);
  });

  it('component CSS uses tokens instead of literal pixel lengths', () => {
    const css = read('../src/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const literals = [...css.matchAll(/(?<![\w-])\d+(?:\.\d+)?px\b/g)].map((m) => m[0]);
    expect(literals).toEqual([]);
  });

  it('component CSS never targets :root, html, body or bare elements', () => {
    const css = read('../src/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = [...css.matchAll(/(^|})\s*([^{}@]+)\{/g)].map((m) => m[2]!.trim());
    const splitTopLevel = (selector: string) => {
      const parts: string[] = [];
      let depth = 0;
      let start = 0;
      for (let i = 0; i < selector.length; i += 1) {
        if (selector[i] === '(') depth += 1;
        else if (selector[i] === ')') depth -= 1;
        else if (selector[i] === ',' && depth === 0) {
          parts.push(selector.slice(start, i));
          start = i + 1;
        }
      }
      return [...parts, selector.slice(start)];
    };
    for (const selector of selectors) {
      for (const part of splitTopLevel(selector)) {
        expect(part.trim(), part).toMatch(/^(:where\()?\.rl-/);
      }
    }
  });

  it('motion presets derive from the shared duration tokens', () => {
    for (const [name, ms] of Object.entries(motionDurations)) {
      expect(duration[name as keyof typeof duration]).toBeCloseTo(ms / 1000, 6);
    }
    expect(transition.press.duration).toBe(motionDurations.press / 1000);
    expect(transition.instant.duration).toBe(0);
  });

  it('components never hard-code animation numbers', () => {
    for (const file of ['Button', 'StatusBadge', 'Surface']) {
      const source = read(`../src/components/${file}.tsx`);
      expect(source, file).not.toMatch(/duration\s*:\s*[\d.]/);
      expect(source, file).not.toMatch(/scale\s*:\s*[\d.]/);
    }
  });
});
