import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * Guardrails for @wzrhine/agent (ADR-0010 §4, ADR-0012). Each family adds files freely; these
 * checks hold for all of them automatically.
 */

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(srcRoot);
const rel = (file: string) => relative(srcRoot, file).replace(/\\/g, '/');
const read = (file: string) => readFileSync(file, 'utf8');
const tsFiles = files.filter((f) => /\.tsx?$/.test(f));
const cssFiles = files.filter((f) => f.endsWith('.css'));

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

const cssWithoutComments = (file: string) => read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import\s+['"][^'"]+['"];/g, '');
const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/;

/** Copy lives in message tables only; fixtures are sample data for tests and the showcase. */
const CJK_ALLOWED = (path: string) => path.startsWith('provider/messages/') || path.startsWith('fixtures/');

describe('@wzrhine/agent boundary', () => {
  it('entry point has no CSS side effects', () => {
    expect(read(join(srcRoot, 'index.ts'))).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
  });

  it('style entry imports every stylesheet', () => {
    const entry = read(join(srcRoot, 'agent.css'));
    for (const file of cssFiles) {
      const path = rel(file);
      if (path === 'agent.css') continue;
      expect(entry, path).toContain(`@import './${path}';`);
    }
  });

  it('never depends on runtimes, transports, caches or SDKs', () => {
    const forbidden = /from ['"](@tanstack\/|@tauri-apps\/|axios|@modelcontextprotocol\/|@whitezhi\/|react-markdown|highlight\.js|lucide-react|@radix-ui\/|react-aria)/;
    for (const file of tsFiles) expect(read(file), rel(file)).not.toMatch(forbidden);
  });

  it('imports Base UI only through subpaths and Motion only through motion/react', () => {
    for (const file of tsFiles) {
      const source = read(file);
      expect(source, rel(file)).not.toMatch(/from '@base-ui\/react'/);
      expect(source, rel(file)).not.toMatch(/from 'framer-motion'/);
      expect(source, rel(file)).not.toMatch(/from 'motion'(?!\/)/);
    }
  });

  it("puts 'use client' first in every module that renders React", () => {
    for (const file of tsFiles) {
      const source = read(file);
      const usesReact = file.endsWith('.tsx') || /^import (?!type)[^;]*from '(react|motion\/react|@base-ui\/react[^']*|@wzrhine\/react)'/m.test(source);
      const path = rel(file);
      if (usesReact) expect(source.startsWith("'use client';"), path).toBe(true);
      else expect(source.startsWith("'use client';"), path).toBe(false);
    }
  });

  it('keeps CJK text in the message tables', () => {
    for (const file of tsFiles) {
      const path = rel(file);
      if (CJK_ALLOWED(path)) continue;
      const lines = stripComments(read(file))
        .split('\n')
        .filter((line) => CJK.test(line));
      expect(lines, path).toEqual([]);
    }
  });

  it('CSS uses tokens: no literal colours or pixel lengths', () => {
    for (const file of cssFiles) {
      const css = cssWithoutComments(file);
      expect(css, rel(file)).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(css, rel(file)).not.toMatch(/\b(rgba?|hsla?|oklch)\(/i);
      expect([...css.matchAll(/(?<![\w-])\d+(?:\.\d+)?px\b/g)].map((m) => m[0]), rel(file)).toEqual([]);
      expect([...css.matchAll(/(?<![\w-])\d+(?:\.\d+)?m?s\b/g)].map((m) => m[0]), `${rel(file)}: durations must come from --rl-motion-*`).toEqual([]);
    }
  });

  it('CSS targets only rl-agent- classes (and the .rl-theme scope for variables)', () => {
    for (const file of cssFiles) {
      const css = cssWithoutComments(file).replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
      const selectors = [...css.matchAll(/(^|[{}])\s*([^{}@]+)\{/g)].map((m) => m[2]!.trim()).filter(Boolean);
      for (const selector of selectors) {
        for (const part of splitTopLevel(selector)) {
          expect(part.trim(), `${rel(file)}: ${part}`).toMatch(/^(:where\(|:is\()?\.(rl-agent|rl-theme)/);
        }
      }
    }
  });

  it('switches every keyframe animation off under reduced motion', () => {
    for (const file of cssFiles) {
      const css = cssWithoutComments(file);
      const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!);
      if (names.length === 0) continue;
      const reduceSystem = /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none/.test(css);
      const reduceProvider = /\.rl-theme\[data-rl-motion='reduce'\][^{]*\{[^}]*animation:\s*none/.test(css);
      expect(reduceSystem && reduceProvider, `${rel(file)}: ${names.join(', ')}`).toBe(true);
    }
  });
});
