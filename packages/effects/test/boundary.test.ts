import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vitest runs with the package directory as cwd (also under `pnpm -r test`); `packages/` is one level up.
const root = resolve(process.cwd(), '..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('package boundary: effects stay optional', () => {
  it('@wzrhine/react source never imports @wzrhine/effects', () => {
    const files = walk(join(root, 'react/src')).filter((f) => /\.(ts|tsx|css)$/.test(f));
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/@wzrhine\/effects|\.\.\/\.\.\/effects/);
    }
  });

  it('@wzrhine/react does not list effects as any kind of dependency', () => {
    const pkg = JSON.parse(read('react/package.json')) as Record<string, Record<string, string> | undefined>;
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      expect(Object.keys(pkg[field] ?? {}), field).not.toContain('@wzrhine/effects');
    }
  });

  it('effects depends on react only as a peer', () => {
    const pkg = JSON.parse(read('effects/package.json')) as Record<string, Record<string, string> | undefined>;
    expect(pkg.peerDependencies?.['@wzrhine/react']).toBeDefined();
    expect(pkg.dependencies?.['@wzrhine/react']).toBeUndefined();
  });

  it('effects entry has no CSS side effects and no WebGL / canvas', () => {
    const entry = read('effects/src/index.ts');
    expect(entry).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
    for (const file of walk(join(root, 'effects/src'))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/getContext\(|WebGL|three/);
    }
  });

  it('effects CSS uses tokens, not literal colours or pixel lengths', () => {
    const css = read('effects/src/effects.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/i);
    expect([...css.matchAll(/(?<![\w-])\d+(?:\.\d+)?px\b/g)].map((m) => m[0])).toEqual([]);
  });

  it('every effects animation has a reduced-motion override', () => {
    const css = read('effects/src/effects.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!);
    expect(names.length).toBeGreaterThan(0);
    const reduceBlock = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(reduceBlock).toMatch(/animation:\s*none/);
    expect(css).toMatch(/\[data-rl-motion='reduce'\][^{]*\{[^}]*animation:\s*none/);
  });
});
