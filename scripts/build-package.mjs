#!/usr/bin/env node
/**
 * Builds one workspace package into ./dist:
 *   1. clean dist
 *   2. tsc -p tsconfig.build.json  (ESM .js + .d.ts + maps)
 *   3. copy every src/**\/*.css verbatim (relative @import paths are preserved)
 * Run from the package directory: `node ../../scripts/build-package.mjs`.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const cwd = process.cwd();
const src = join(cwd, 'src');
const dist = join(cwd, 'dist');

rmSync(dist, { recursive: true, force: true });

const require = createRequire(join(cwd, 'package.json'));
const tsc = require.resolve('typescript/bin/tsc');
const result = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

let copied = 0;
for (const file of walk(src)) {
  if (!file.endsWith('.css')) continue;
  const target = join(dist, relative(src, file));
  mkdirSync(dirname(target), { recursive: true });
  cpSync(file, target);
  copied += 1;
}

if (!existsSync(join(dist, 'index.js'))) {
  console.error('build-package: dist/index.js missing');
  process.exit(1);
}
console.log(`build-package: ${relative(join(cwd, '..', '..'), cwd)} → dist (${copied} css)`);
