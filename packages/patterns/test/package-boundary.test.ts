import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const cssFiles = ['../src/components.css', '../src/layout.css', '../src/collection.css', '../src/record.css'];
const stripped = (path: string) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import\s+['"][^'"]+['"];/g, '');
const allCss = () => cssFiles.map(stripped).join('\n');
/** CSS without @keyframes bodies, whose from / to / % steps are not element selectors. */
const selectorCss = () => allCss().replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');

/** Source directories that exist so far; components arrive with P030-02 onwards. */
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const sourceDirs = readdirSync(srcRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const sourceFiles = () =>
  sourceDirs.flatMap((dir) =>
    readdirSync(join(srcRoot, dir))
      .filter((name) => /\.tsx?$/.test(name))
      .map((name) => `${dir}/${name}`),
  );

/**
 * Source without comments. Strings and template literals are kept (with their contents), so a
 * `//` inside a string is not mistaken for a comment.
 */
function stripComments(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
    } else if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      const start = i;
      i += 1;
      while (i < source.length && source[i] !== ch) i += source[i] === '\\' ? 2 : 1;
      i += 1;
      out += source.slice(start, i);
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

/** CJK ideographs, kana, hangul and full-width punctuation (（）、，。：). */
const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/;

describe('package boundary', () => {
  it('entry point has no CSS side effects', () => {
    const entry = read('../src/index.ts');
    expect(entry).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
  });

  it('composes @wzrhine/react instead of importing Base UI or agent packages directly', () => {
    for (const file of sourceFiles()) {
      const source = read(`../src/${file}`);
      expect(source, file).not.toMatch(/from '@base-ui\/react/);
      expect(source, file).not.toMatch(/from '@wzrhine\/agent/);
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
      expect(selector.trim(), selector).toMatch(/^(:where\(|:is\()?\.rl-/);
    }
  });

  it('CJK text lives only in the message table (ADR-0009 §2 / ADR-0014 §3)', () => {
    for (const file of sourceFiles()) {
      const lines = stripComments(read(`../src/${file}`))
        .split('\n')
        .filter((line) => CJK.test(line));
      if (file === 'provider/PatternMessages.tsx') continue;
      expect(lines, file).toEqual([]);
    }
    expect(existsSync(join(srcRoot, 'provider', 'PatternMessages.tsx'))).toBe(true);
  });
});
