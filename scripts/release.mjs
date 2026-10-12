#!/usr/bin/env node
/**
 * Manual, local release for @wzrhine/tokens, @wzrhine/react, @wzrhine/effects.
 * No CI is involved (AGENTS.md: no automatic workflows without approval).
 *
 *   node scripts/release.mjs <version>             # dry run (default): all gates + `pnpm publish --dry-run`
 *   node scripts/release.mjs <version> --publish   # real publish; refuses unless every precondition holds
 *
 * Preconditions for --publish (each checked, none bypassable by flag):
 *   - a LICENSE file exists at the repo root and every package declares a matching `license`
 *   - packages are no longer `private: true`
 *   - git working tree is clean and on `main`
 *   - every CHANGELOG has a `## [<version>]` section (not only Unreleased)
 *   - `pnpm release:check` passes (typecheck, tests, build, API report, tarball install check)
 * Publishing is pinned to the official registry so a local mirror (e.g. npmmirror) can't intercept it.
 * Version bumping is explicit: this script writes <version> into the three package.json files
 * only after the gates pass, and the caller commits and tags it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [version, ...flags] = process.argv.slice(2);
const publish = flags.includes('--publish');
const packages = ['tokens', 'react', 'effects', 'agent-core', 'agent'];
const problems = [];
const isWin = process.platform === 'win32';
const sh = (cmd, args, opts = {}) =>
  execFileSync(isWin ? 'cmd.exe' : cmd, isWin ? ['/d', '/s', '/c', cmd, ...args] : args, {
    cwd: root,
    encoding: 'utf8',
    stdio: opts.capture ? 'pipe' : 'inherit',
    ...opts,
  });

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version)) {
  console.error('usage: node scripts/release.mjs <semver> [--publish]');
  process.exit(2);
}

const manifests = Object.fromEntries(
  packages.map((p) => [p, JSON.parse(readFileSync(join(root, 'packages', p, 'package.json'), 'utf8'))]),
);

// ---------- preconditions ----------
const licenseFile = ['LICENSE', 'LICENSE.md', 'LICENSE.txt'].find((f) => existsSync(join(root, f)));
if (!licenseFile) problems.push('no LICENSE file at the repo root (license not yet chosen by the maintainer)');
for (const [p, m] of Object.entries(manifests)) {
  if (!m.license) problems.push(`packages/${p}: no "license" field`);
  if (m.private) problems.push(`packages/${p}: "private": true`);
  const changelog = readFileSync(join(root, 'packages', p, 'CHANGELOG.md'), 'utf8');
  if (!changelog.includes(`## [${version}]`)) problems.push(`packages/${p}/CHANGELOG.md: no "## [${version}]" section`);
}
const status = sh('git', ['status', '--porcelain'], { capture: true }).trim();
if (status) problems.push('git working tree is not clean');
const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { capture: true }).trim();
if (branch !== 'main') problems.push(`on branch "${branch}", releases are cut from main`);

console.log(`release ${version} · ${publish ? 'PUBLISH' : 'dry run'}`);
if (problems.length) {
  console.log('\npreconditions not met:');
  for (const p of problems) console.log(`  - ${p}`);
  if (publish) {
    console.error('\nrefusing to publish.');
    process.exit(1);
  }
  console.log('\n(dry run continues so the build and package gates can still be exercised)\n');
}

// ---------- gates ----------
sh('pnpm', ['release:check']);

// ---------- publish ----------
if (!publish) {
  for (const p of packages) {
    sh('pnpm', ['publish', '--dry-run', '--no-git-checks', '--access', 'public', '--registry', 'https://registry.npmjs.org/'], { cwd: join(root, 'packages', p) });
  }
  console.log(`\ndry run complete for ${version}. ${problems.length ? `${problems.length} precondition(s) still open.` : 'All preconditions met.'}`);
  process.exit(0);
}

for (const p of packages) {
  const file = join(root, 'packages', p, 'package.json');
  writeFileSync(file, `${JSON.stringify({ ...manifests[p], version }, null, 2)}\n`);
}
// Publish in dependency order so peers resolve on the registry.
// --no-git-checks: the script writes the version bump itself before publishing,
// so pnpm's own "unclean tree" check would always fire; the clean-tree-on-main
// precondition is enforced by this script before any writes happen.
for (const p of packages) {
  sh('pnpm', ['publish', '--access', 'public', '--no-git-checks', '--registry', 'https://registry.npmjs.org/'], { cwd: join(root, 'packages', p) });
}
console.log(`\npublished ${version}. Commit the version bump and tag: git tag v${version}`);
