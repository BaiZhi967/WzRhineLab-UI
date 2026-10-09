import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { duration, transition } from '../src';
import { motionDurations } from '@wzrhine/tokens';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const cssFiles = ['../src/components.css', '../src/overlays.css', '../src/feedback.css', '../src/archive.css'];
const stripped = (path: string) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import\s+['"][^'"]+['"];/g, '');
const allCss = () => cssFiles.map(stripped).join('\n');
/** CSS without @keyframes bodies, whose from / to / % steps are not element selectors. */
const selectorCss = () => allCss().replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');

const componentFiles = [
  'Button',
  'IconButton',
  'StatusBadge',
  'Surface',
  'Text',
  'Field',
  'Input',
  'Tabs',
  'Tooltip',
  'Dialog',
  'Select',
  'Popover',
  'Menu',
  'Toast',
  'RecordHeader',
  'MetadataList',
  'ArchiveCard',
  'StatusIndicator',
  'Timeline',
  'DataTable',
];

function splitTopLevel(selector: string): string[] {
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
}

describe('package boundary', () => {
  it('entry point has no CSS side effects', () => {
    const entry = read('../src/index.ts');
    expect(entry).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
  });

  it('the single style entry imports every partial stylesheet', () => {
    const entry = read('../src/components.css');
    expect(entry).toMatch(/@import '\.\/overlays\.css';/);
    expect(entry).toMatch(/@import '\.\/feedback\.css';/);
    expect(entry).toMatch(/@import '\.\/archive\.css';/);
  });

  it('Base UI is only imported through subpaths', () => {
    for (const file of componentFiles) {
      const source = read(`../src/components/${file}.tsx`);
      expect(source, file).not.toMatch(/from '@base-ui\/react'/);
    }
  });

  it('component CSS uses tokens instead of literal colours', () => {
    const css = allCss();
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/i);
    expect(css).not.toMatch(/\bhsla?\(/i);
  });

  it('component CSS uses tokens instead of literal pixel lengths', () => {
    const literals = [...allCss().matchAll(/(?<![\w-])\d+(?:\.\d+)?px\b/g)].map((m) => m[0]);
    expect(literals).toEqual([]);
  });

  it('component CSS never targets :root, html, body or bare elements', () => {
    const selectors = [...selectorCss().matchAll(/(^|})\s*([^{}@]+)\{/g)].map((m) => m[2]!.trim());
    for (const selector of selectors) {
      for (const part of splitTopLevel(selector)) {
        expect(part.trim(), part).toMatch(/^(:where\(|:is\()?\.rl-/);
      }
    }
  });

  it('every @keyframes animation is switched off under reduced motion', () => {
    const css = allCss();
    const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!);
    expect(names.length).toBeGreaterThan(0);
    const reduceBlocks = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)].map((m) => m[1]!);
    for (const name of names) {
      const selectorsUsing = [...css.matchAll(new RegExp(`([^{}]+)\\{[^{}]*animation:[^;]*\\b${name}\\b`, 'g'))].map((m) =>
        m[1]!.trim(),
      );
      expect(selectorsUsing.length, name).toBeGreaterThan(0);
      for (const selector of selectorsUsing) {
        const disabled = reduceBlocks.some((block) => block.includes(selector) && /animation:\s*none/.test(block));
        expect(disabled, `${name} via ${selector}`).toBe(true);
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
    for (const file of componentFiles) {
      const source = read(`../src/components/${file}.tsx`);
      expect(source, file).not.toMatch(/duration\s*:\s*[\d.]/);
      expect(source, file).not.toMatch(/scale\s*:\s*[\d.]/);
    }
  });
});
