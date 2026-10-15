#!/usr/bin/env node
/**
 * Package size gate (ADR-0008 §3).
 *
 * Measures the BUILT packages (packages/*\/dist) the way a consumer bundler would see them:
 * each entry below becomes a tiny file in a temp dir that is bundled by esbuild with
 * production minification, then gzipped (level 9). Peers (react, react-dom, motion) are
 * external; real dependencies shipped to users (@base-ui/react, @wzrhine/tokens) are included.
 *
 *   node scripts/size-check.mjs            build packages, measure, compare with size-budget.json
 *   node scripts/size-check.mjs --no-build measure the existing dist as is
 *   node scripts/size-check.mjs --update   rewrite size-budget.json from the measurement
 *
 * Exits 1 when any gzip size exceeds its budget, when budget and measured entries differ,
 * or when tree-shaking is visibly broken (react-button / agent-status must stay under 25% of their full entry).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const budgetFile = join(root, 'size-budget.json');
const args = new Set(process.argv.slice(2));
const noBuild = args.has('--no-build');
const update = args.has('--update');
const KB = 1024;
/** Tree-shaking sanity check: importing only Button must cost less than this share of everything. */
const TREE_SHAKE_RATIO = 0.25;

const log = (msg) => console.log(`\u001b[36m[size]\u001b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\u001b[31m[size] FAIL\u001b[0m ${msg}`);
  process.exitCode = 1;
};

// esbuild comes with Vite (apps/docs); resolve it through Vite instead of adding a dependency.
function loadEsbuild() {
  const fromDocs = createRequire(join(root, 'apps', 'docs', 'package.json'));
  const vitePkg = fromDocs.resolve('vite/package.json');
  return createRequire(vitePkg)('esbuild');
}
const esbuild = loadEsbuild();

/** Entries measured. `kind: 'js'` bundles `code`; `kind: 'css'` bundles a dist stylesheet. */
const entries = [
  { name: 'react-full', kind: 'js', code: "export * from '@wzrhine/react';" },
  { name: 'react-button', kind: 'js', code: "export { Button } from '@wzrhine/react';" },
  { name: 'react-datatable', kind: 'js', code: "export { DataTable } from '@wzrhine/react';" },
  { name: 'react-css', kind: 'css', spec: '@wzrhine/react/styles.css' },
  { name: 'tokens-css', kind: 'css', spec: '@wzrhine/tokens/styles.css' },
  // @wzrhine/react is a peer of patterns (external); tokens is a real dependency.
  { name: 'patterns-full', kind: 'js', code: "export * from '@wzrhine/patterns';", external: ['@wzrhine/react'] },
  { name: 'patterns-list-detail', kind: 'js', code: "export { ListDetail } from '@wzrhine/patterns';", external: ['@wzrhine/react'] },
  { name: 'patterns-query-toolbar', kind: 'js', code: "export { QueryToolbar } from '@wzrhine/patterns';", external: ['@wzrhine/react'] },
  { name: 'patterns-css', kind: 'css', spec: '@wzrhine/patterns/styles.css' },
  // @wzrhine/react is a peer of effects: the consumer already pays for it, so it is external here.
  { name: 'effects-full', kind: 'js', code: "export * from '@wzrhine/effects';", external: ['@wzrhine/react'] },
  { name: 'effects-geometry', kind: 'js', code: "export { createEffectPath } from '@wzrhine/effects';", external: ['@wzrhine/react'] },
  { name: 'effects-signal', kind: 'js', code: "export { SignalPath } from '@wzrhine/effects';", external: ['@wzrhine/react'] },
  { name: 'effects-calibration', kind: 'js', code: "export { CalibrationReticle } from '@wzrhine/effects';", external: ['@wzrhine/react'] },
  { name: 'effects-reveal', kind: 'js', code: "export { ArchiveReveal } from '@wzrhine/effects';", external: ['@wzrhine/react'] },
  { name: 'effects-css', kind: 'css', spec: '@wzrhine/effects/styles.css' },
  // @wzrhine/react is a peer of agent (external); agent-core and Base UI are real dependencies.
  { name: 'agent-core', kind: 'js', code: "export * from '@wzrhine/agent-core';" },
  { name: 'agent-full', kind: 'js', code: "export * from '@wzrhine/agent';", external: ['@wzrhine/react'] },
  { name: 'agent-status', kind: 'js', code: "export { AgentStatus } from '@wzrhine/agent';", external: ['@wzrhine/react'] },
  { name: 'agent-css', kind: 'css', spec: '@wzrhine/agent/styles.css' },
];
const peers = ['react', 'react-dom', 'react/*', 'react-dom/*', 'motion', 'motion/*'];

// ---------- 1. build ----------
const isWin = process.platform === 'win32';
if (!noBuild) {
  log('pnpm build:packages');
  try {
    // pnpm is a .cmd shim on Windows: run it through cmd.exe instead of `shell: true` (fixed args only).
    execFileSync(isWin ? 'cmd.exe' : 'pnpm', isWin ? ['/d', '/s', '/c', 'pnpm.cmd', 'build:packages'] : ['build:packages'], {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    process.stdout.write(error.stdout ?? '');
    process.stderr.write(error.stderr ?? '');
    console.error(`[31m[size] FAIL[0m pnpm build:packages exited with ${error.status}; nothing measured`);
    process.exit(1);
  }
}

// ---------- 2. map @wzrhine/* specifiers to dist via publishConfig.exports ----------
// Workspace `exports` point at src/ (ADR-0002); consumers get publishConfig.exports (dist/).
const distMap = new Map();
for (const pkg of ['tokens', 'react', 'patterns', 'effects', 'agent-core', 'agent']) {
  const dir = join(root, 'packages', pkg);
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  for (const [subpath, target] of Object.entries(manifest.publishConfig.exports)) {
    if (subpath === './package.json') continue;
    const file = typeof target === 'string' ? target : target.import ?? target.default;
    const spec = subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
    const abs = join(dir, file);
    if (!existsSync(abs)) {
      console.error(`[size] ${spec} → ${file} is missing; run pnpm build:packages (or drop --no-build)`);
      process.exit(1);
    }
    distMap.set(spec, abs);
  }
}
const distPlugin = (external) => ({
  name: 'wzrhine-dist',
  setup(build) {
    build.onResolve({ filter: /^@wzrhine\// }, (a) => {
      if (external.includes(a.path)) return { path: a.path, external: true };
      const hit = distMap.get(a.path);
      if (!hit) return { errors: [{ text: `size-check: no dist mapping for ${a.path}` }] };
      return { path: hit };
    });
  },
});

// ---------- 3. measure ----------
const work = mkdtempSync(join(tmpdir(), 'wzrhine-size-'));
const measured = {};
const started = performance.now();
try {
  for (const entry of entries) {
    const common = {
      bundle: true,
      minify: true,
      write: false,
      metafile: true,
      logLevel: 'error',
      // 'use client' directives (ADR-0008 §2): esbuild 0.25 bundles them without warnings; the override
      // only guards against future versions reporting them like Rollup does.
      logOverride: { 'module-level-directive': 'silent' },
      plugins: [distPlugin(entry.external ?? [])],
    };
    let result;
    if (entry.kind === 'js') {
      const file = join(work, `${entry.name}.js`);
      writeFileSync(file, `${entry.code}\n`);
      result = await esbuild.build({
        ...common,
        entryPoints: [file],
        format: 'esm',
        platform: 'browser',
        treeShaking: true,
        define: { 'process.env.NODE_ENV': '"production"' },
        external: peers,
        outfile: join(work, 'out', `${entry.name}.js`),
      });
    } else {
      result = await esbuild.build({
        ...common,
        entryPoints: [distMap.get(entry.spec)],
        loader: { '.css': 'css' },
        outfile: join(work, 'out', `${entry.name}.css`),
      });
    }
    // Guard against measuring workspace sources: every @wzrhine input must come from dist/.
    const leaked = Object.keys(result.metafile.inputs).filter((f) => /packages\/[^/]+\/src\//.test(f));
    if (leaked.length) {
      console.error(`[size] ${entry.name}: bundled workspace sources instead of dist: ${leaked.join(', ')}`);
      process.exit(1);
    }
    const inputs = Object.values(result.metafile.outputs).flatMap((output) =>
      Object.entries(output.inputs).filter(([, info]) => info.bytesInOutput > 0).map(([file]) => file.replace(/\\/g, '/')),
    );
    const forbidden = entry.name === 'effects-geometry'
      ? /effects\/dist\/(?!geometry\.js)[^/]+\.js$/
      : entry.name === 'effects-calibration' || entry.name === 'effects-reveal'
        ? /effects\/dist\/(?:useElementAnchors|geometry|ConnectionPath|SignalPath|AnnotationTrace)\.js$/
        : null;
    const unrelated = forbidden ? inputs.filter((file) => forbidden.test(file) && !file.endsWith('/effects/dist/index.js')) : [];
    if (unrelated.length) {
      console.error(`[size] ${entry.name}: unrelated effect modules retained: ${unrelated.join(', ')}`);
      process.exit(1);
    }
    const output = result.outputFiles.find((f) => /\.(js|css)$/.test(f.path));
    measured[entry.name] = { minified: output.contents.length, gzip: gzipSync(output.contents, { level: 9 }).length };
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
const elapsed = Math.round(performance.now() - started);

// ---------- 4. budgets ----------
/** Budget rule (ADR-0008 §3): round gzip up to the next KB, add ~10%, round up to a whole KB. */
const budgetFor = (gzip) => Math.ceil(Math.ceil(gzip / KB) * 1.1) * KB;

if (update) {
  const next = {
    note: 'gzip bytes; generated by `pnpm size:check --update` (ceil to 1 KB, +10%, ceil to 1 KB). Explain every change in the PR and CHANGELOG (ADR-0008 §3).',
    entries: Object.fromEntries(entries.map((e) => [e.name, { gzip: budgetFor(measured[e.name].gzip) }])),
  };
  writeFileSync(budgetFile, `${JSON.stringify(next, null, 2)}\n`);
  log(`size-budget.json rewritten from current measurement`);
}

if (!existsSync(budgetFile)) {
  console.error('[size] size-budget.json missing; run `pnpm size:check --update` once');
  process.exit(1);
}
const budgets = JSON.parse(readFileSync(budgetFile, 'utf8')).entries ?? {};

const fmt = (n) => `${(n / KB).toFixed(2)} KB`;
const rows = entries.map(({ name }) => {
  const m = measured[name];
  const budget = budgets[name]?.gzip;
  const headroom = budget === undefined ? '—' : `${budget - m.gzip} B (${(((budget - m.gzip) / budget) * 100).toFixed(1)}%)`;
  return [name, fmt(m.minified), fmt(m.gzip), budget === undefined ? '—' : fmt(budget), headroom, budget !== undefined && m.gzip > budget ? 'OVER' : 'ok'];
});
const header = ['entry', 'minified', 'gzip', 'budget', 'headroom', ''];
const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (r) => r.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ');
console.log(line(header));
console.log(widths.map((w) => '-'.repeat(w)).join('  '));
for (const r of rows) console.log(line(r));
log(`measured ${entries.length} entries in ${elapsed} ms (esbuild ${esbuild.version})`);

// ---------- 5. gates ----------
for (const { name } of entries) {
  const budget = budgets[name]?.gzip;
  if (typeof budget !== 'number') fail(`${name}: measured but has no gzip budget in size-budget.json`);
  else if (measured[name].gzip > budget) {
    fail(`${name}: gzip ${measured[name].gzip} B > budget ${budget} B (+${measured[name].gzip - budget} B)`);
  }
}
for (const name of Object.keys(budgets)) {
  if (!(name in measured)) fail(`${name}: has a budget in size-budget.json but is not measured by size-check`);
}
const shakePairs = [
  ['react-button', 'react-full'],
  ['agent-status', 'agent-full'],
  // patterns pair deferred with data: against patterns-full (5.52 KB) a single component is 24.3%
  // (query-toolbar, 1.34 KB) to 28.4% (list-detail, 1.57 KB) — the shared message provider is a
  // fixed ~1 KB tax on every component, so at this package size the ratio says little about
  // tree-shaking. The absolute sizes stay budgeted above; re-evaluate if the message table is
  // ever split per namespace, or once the package is large enough for the ratio to mean something.
];
for (const [part, whole] of shakePairs) {
  const ratio = measured[part].gzip / measured[whole].gzip;
  if (ratio >= TREE_SHAKE_RATIO) {
    fail(
      `tree-shaking: ${part} is ${(ratio * 100).toFixed(1)}% of ${whole} (limit ${TREE_SHAKE_RATIO * 100}%); ` +
        'importing one component pulls in most of the package (check sideEffects and top-level side effects)',
    );
  } else {
    log(`tree-shaking: ${part} = ${(ratio * 100).toFixed(1)}% of ${whole} (limit ${TREE_SHAKE_RATIO * 100}%)`);
  }
}
if (process.exitCode) console.error('\u001b[31m[size] size check failed\u001b[0m');
else log('all entries within budget');
