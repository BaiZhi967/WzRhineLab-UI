import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(packageRoot, 'src');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const rel = (file: string) => relative(srcRoot, file).replace(/\\/g, '/');

describe('@wzrhine/content boundary', () => {
  it('provides a side-effect-free entry and explicit style entry', () => {
    expect(existsSync(join(srcRoot, 'index.ts'))).toBe(true);
    expect(existsSync(join(srcRoot, 'components.css'))).toBe(true);
    expect(readFileSync(join(srcRoot, 'index.ts'), 'utf8')).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
  });

  it('uses only content-prefixed selectors and token values', () => {
    const cssFiles = walk(srcRoot).filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);
    for (const file of cssFiles) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import\s+['"][^'"]+['"];/g, '');
      expect(css, rel(file)).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(css, rel(file)).not.toMatch(/\b(?:rgba?|hsla?|oklch)\(/i);
      expect(css, rel(file)).not.toMatch(/(?<![\w-])\d+(?:\.\d+)?px\b/g);
      for (const selector of [...css.matchAll(/(^|[{}])\s*([^{}@]+)\{/g)].map((match) => match[2]!.trim())) {
        expect(selector, `${rel(file)}: ${selector}`).toMatch(/^(:where\(|:is\()?(?:\.rl-content|\.rl-theme)/);
      }
    }
  });

  it('does not import runtimes, transports, agents, or file APIs', () => {
    for (const file of walk(srcRoot).filter((candidate) => /\.tsx?$/.test(candidate))) {
      const source = readFileSync(file, 'utf8');
      expect(source, rel(file)).not.toMatch(/from ['"](?:@base-ui\/react|@wzrhine\/agent|axios|node:fs|node:path|@tauri-apps\/)/);
    }
  });

  it('keeps runtime React modules client-marked and pure modules server-importable', () => {
    for (const file of walk(srcRoot).filter((candidate) => /\.tsx?$/.test(candidate))) {
      const source = readFileSync(file, 'utf8');
      const runtimeReact = file.endsWith('.tsx') || /^import (?!type)[^;]*from ['"](?:react|motion\/react|@wzrhine\/react)/m.test(source);
      expect(source.startsWith("'use client';"), rel(file)).toBe(runtimeReact);
    }
  });

  it('keeps CJK copy in the content message table', () => {
    const cjk = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;
    for (const file of walk(srcRoot).filter((candidate) => /\.tsx?$/.test(candidate))) {
      if (rel(file) === 'provider/ContentMessages.tsx') continue;
      expect(readFileSync(file, 'utf8').split('\n').filter((line) => cjk.test(line)), rel(file)).toEqual([]);
    }
  });
});
