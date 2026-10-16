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

describe('@wzrhine/editor boundary', () => {
  it('provides a side-effect-free root entry, optional adapter entry and style entry', () => {
    expect(existsSync(join(srcRoot, 'index.ts'))).toBe(true);
    expect(existsSync(join(srcRoot, 'codemirror.ts'))).toBe(true);
    expect(existsSync(join(srcRoot, 'components.css'))).toBe(true);
    expect(readFileSync(join(srcRoot, 'index.ts'), 'utf8')).not.toMatch(/codemirror/i);
    expect(readFileSync(join(srcRoot, 'index.ts'), 'utf8')).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
  });

  it('keeps CodeMirror imports out of the root entry and package dependencies optional', () => {
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      peerDependencies?: Record<string, string>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };
    for (const dependency of ['@codemirror/commands', '@codemirror/lang-markdown', '@codemirror/search', '@codemirror/state', '@codemirror/view']) {
      expect(manifest.peerDependencies?.[dependency], dependency).toBeTruthy();
      expect(manifest.peerDependenciesMeta?.[dependency]?.optional, dependency).toBe(true);
    }
  });

  it('uses only editor-prefixed selectors and token values', () => {
    const cssFiles = walk(srcRoot).filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);
    for (const file of cssFiles) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import\s+['"][^'"]+['"];/g, '');
      expect(css, rel(file)).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(css, rel(file)).not.toMatch(/\b(?:rgba?|hsla?|oklch)\(/i);
      expect(css, rel(file)).not.toMatch(/(?<![\w-])\d+(?:\.\d+)?px\b/g);
      for (const selector of [...css.matchAll(/(^|[{}])\s*([^{}@]+)\{/g)].map((match) => match[2]!.trim())) {
        expect(selector, `${rel(file)}: ${selector}`).toMatch(/^(:where\(|:is\()?(?:\.rl-editor|\.rl-theme)/);
      }
    }
  });

  it('keeps runtime modules client-marked and does not import host runtimes', () => {
    for (const file of walk(srcRoot).filter((candidate) => /\.tsx?$/.test(candidate))) {
      const source = readFileSync(file, 'utf8');
      expect(source, rel(file)).not.toMatch(/from ['"](?:@tauri-apps\/|@wzrhine\/agent|axios|node:fs|node:path)/);
      const runtimeReact = rel(file) === 'codemirror.ts' || file.endsWith('.tsx') || /^import (?!type)[^;]*from ['"](?:react|motion\/react|@wzrhine\/react)/m.test(source);
      expect(source.startsWith("'use client';"), rel(file)).toBe(runtimeReact);
    }
  });
});
