#!/usr/bin/env node
/**
 * Consumer install check (QUALITY-GATES G3 "npm exports / CSS sideEffects / ESM 类型声明测试").
 *
 * 1. Builds and packs @wzrhine/tokens, @wzrhine/react, @wzrhine/effects with `pnpm pack`
 *    (prepack builds dist; workspace: ranges are rewritten to real versions).
 * 2. Inspects each tarball: publishConfig exports, no src/ or tests, every export target present.
 *    Client boundary (ADR-0008 §2): every src module that uses React at runtime starts with
 *    'use client', pure modules do not, and the packed dist/*.js keeps exactly that set.
 * 3. Creates a throwaway consumer project OUTSIDE the workspace, installs the tarballs plus
 *    real react / react-dom / motion from the registry, then:
 *    - type-checks a TSX file against the shipped .d.ts (strict, moduleResolution bundler)
 *    - bundles it with Vite and checks CSS is emitted and tree-shaking keeps effects out
 *    - renders the components with react-dom/server under Node ESM
 * Exits non-zero on the first failure. Needs network access for the registry install.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const packages = ['tokens', 'react', 'patterns', 'effects', 'agent-core', 'agent'];
const keep = process.argv.includes('--keep');
const log = (msg) => console.log(`\u001b[36m[verify]\u001b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\u001b[31m[verify] FAIL\u001b[0m ${msg}`);
  process.exit(1);
};
const isWin = process.platform === 'win32';
// Node package bins (pnpm, tsc, vite) are .cmd shims on Windows. Run them through cmd.exe
// explicitly so no `shell: true` is needed; arguments here are paths we generated, never user input.
const shims = new Set(['pnpm', 'tsc', 'vite']);
const run = (cmd, args, opts = {}) => {
  const base = cmd.split(/[\\/]/).pop();
  const viaCmd = isWin && shims.has(base);
  return execFileSync(viaCmd ? 'cmd.exe' : cmd, viaCmd ? ['/d', '/s', '/c', `${cmd}.cmd`, ...args] : args, {
    stdio: opts.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    ...opts,
  });
};

const work = mkdtempSync(join(tmpdir(), 'wzrhine-verify-'));
const packDir = join(work, 'packs');
const app = join(work, 'consumer');
mkdirSync(packDir);
mkdirSync(join(app, 'src'), { recursive: true });
log(`work dir ${work}`);

// ---------- 1. pack ----------
const tarballs = {};
for (const pkg of packages) {
  const dir = join(root, 'packages', pkg);
  // npm falls back to the repository root LICENSE when a package has none, so the tarball check
  // alone would always pass. Assert the package carries its own copy.
  if (!existsSync(join(dir, 'LICENSE'))) fail(`${pkg}: packages/${pkg}/LICENSE missing`);
  run('pnpm', ['pack', '--pack-destination', packDir], { cwd: dir, capture: true });
  const name = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name;
  const file = readdirSync(packDir).find((f) => f.startsWith(name.replace('@', '').replace('/', '-')));
  if (!file) fail(`no tarball for ${name}`);
  tarballs[name] = join(packDir, file);
}
log(`packed ${Object.keys(tarballs).join(', ')}`);

// ---------- 2. inspect tarballs ----------
/** Minimal ustar reader: avoids depending on whichever `tar` binary is on PATH. */
function readTarball(file) {
  const buf = gunzipSync(readFileSync(file));
  const entries = new Map();
  let offset = 0;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    const name = header.toString('utf8', 0, 100).replace(/\0.*$/s, '');
    if (!name) break;
    const prefix = header.toString('utf8', 345, 500).replace(/\0.*$/s, '');
    const size = Number.parseInt(header.toString('utf8', 124, 136).replace(/\0.*$/s, '').trim() || '0', 8);
    const full = prefix ? `${prefix}/${name}` : name;
    entries.set(full, buf.subarray(offset + 512, offset + 512 + size));
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}

for (const [name, tgz] of Object.entries(tarballs)) {
  const entries = readTarball(tgz);
  const list = [...entries.keys()];
  const manifest = JSON.parse(entries.get('package/package.json').toString('utf8'));
  if (list.some((f) => /^package\/(src|test)\//.test(f) || /\.test\.[jt]sx?$/.test(f))) fail(`${name}: tarball contains src/ or tests`);
  if (JSON.stringify(manifest).includes('workspace:')) fail(`${name}: workspace: protocol leaked into the published manifest`);
  if (!manifest.types || !manifest.exports?.['.']?.types) fail(`${name}: missing type declarations in exports`);
  // agent-core ships no CSS: `sideEffects: false`. Every other package lists CSS only.
  const sideEffectsOk = name === '@wzrhine/agent-core' ? manifest.sideEffects === false : Array.isArray(manifest.sideEffects) && manifest.sideEffects.includes('**/*.css');
  if (!sideEffectsOk) fail(`${name}: sideEffects must list CSS only (agent-core: false)`);
  for (const doc of ['package/README.md', 'package/CHANGELOG.md', 'package/LICENSE']) {
    if (!list.includes(doc)) fail(`${name}: ${doc.replace('package/', '')} missing from tarball`);
  }
  if (!manifest.repository?.url) fail(`${name}: repository field missing`);
  for (const target of Object.values(manifest.exports).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v)))) {
    const path = `package/${target.replace(/^\.\//, '')}`;
    if (!list.includes(path)) fail(`${name}: export target ${target} missing from tarball`);
  }
  log(`${name}: ${list.length} files, exports ok, no src/tests, versions resolved`);
}

// ---------- 2b. 'use client' boundary (ADR-0008 §2) ----------
/** True when the first statement (after comments / whitespace) is the 'use client' directive. */
function startsWithUseClient(code) {
  const body = code.replace(/^\uFEFF/, '').replace(/^(?:\s+|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, '');
  return /^(['"])use client\1\s*;?/.test(body);
}
/** A module needs the directive when it runs React code: any .tsx file, or a value import from React / motion / Base UI. */
function usesReactAtRuntime(file, code) {
  if (file.endsWith('.tsx')) return true;
  return /^import\s+(?!type\b)[^;]*?from\s+['"](?:react|motion\/react|@base-ui\/react(?:\/[^'"]*)?)['"]/m.test(code);
}
// Modules that must stay importable from React Server Components (no directive).
const pureModules = {
  '@wzrhine/react': ['index', 'utils/cx', 'motion/presets', 'components/pagination-utils', 'components/meter-utils'],
  '@wzrhine/patterns': ['index', 'utils/cx'],
  '@wzrhine/effects': ['index', 'scramble', 'usePageVisible'],
  '@wzrhine/agent': ['index', 'utils/cx', 'provider/messages/status'],
};
const walkSrc = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkSrc(join(dir, e.name)) : [join(dir, e.name)]));
for (const [name, dirName] of [['@wzrhine/react', 'react'], ['@wzrhine/patterns', 'patterns'], ['@wzrhine/effects', 'effects'], ['@wzrhine/agent', 'agent']]) {
  const srcDir = join(root, 'packages', dirName, 'src');
  const entries = readTarball(tarballs[name]);
  const expected = new Map();
  for (const file of walkSrc(srcDir)) {
    if (!/\.tsx?$/.test(file) || /\.test\.tsx?$|\.d\.ts$/.test(file)) continue;
    // Sample data for tests and the showcase only; excluded from the build (tsconfig.build.json).
    if (file.includes(`${join('src', 'fixtures')}`)) continue;
    const rel = file.slice(srcDir.length + 1).replace(/\\/g, '/').replace(/\.tsx?$/, '');
    const code = readFileSync(file, 'utf8');
    const client = startsWithUseClient(code);
    if (client !== usesReactAtRuntime(file, code)) {
      fail(`${name}: src/${rel} ${client ? "has 'use client' but no React runtime code" : "uses React at runtime but lacks a leading 'use client'"}`);
    }
    expected.set(rel, client);
  }
  for (const rel of pureModules[name]) {
    if (!expected.has(rel)) fail(`${name}: pure module src/${rel} not found`);
    if (expected.get(rel)) fail(`${name}: src/${rel} must stay a pure (server-importable) module`);
  }
  const distJs = [...entries.keys()].filter((f) => f.startsWith('package/dist/') && f.endsWith('.js'));
  for (const f of distJs) {
    const rel = f.slice('package/dist/'.length, -'.js'.length);
    if (!expected.has(rel)) fail(`${name}: ${f} has no matching source module`);
  }
  let clients = 0;
  for (const [rel, client] of expected) {
    const buf = entries.get(`package/dist/${rel}.js`);
    if (!buf) fail(`${name}: dist/${rel}.js missing from tarball`);
    if (startsWithUseClient(buf.toString('utf8')) !== client) {
      fail(`${name}: dist/${rel}.js ${client ? "lost its leading 'use client'" : "unexpectedly starts with 'use client'"}`);
    }
    if (client) clients += 1;
  }
  if (clients === 0) fail(`${name}: no 'use client' modules found`);
  log(`${name}: 'use client' on ${clients} modules, ${expected.size - clients} pure modules without it (src = dist)`);
}

// ---------- 3. consumer project ----------
const rootPkg = JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8'));
const devPin = (dep) => rootPkg.devDependencies[dep].replace(/^[\^~]/, '');
writeFileSync(
  join(app, 'package.json'),
  JSON.stringify(
    {
      name: 'wzrhine-consumer-check',
      private: true,
      type: 'module',
      dependencies: {
        '@wzrhine/tokens': `file:${tarballs['@wzrhine/tokens']}`,
        '@wzrhine/react': `file:${tarballs['@wzrhine/react']}`,
        '@wzrhine/patterns': `file:${tarballs['@wzrhine/patterns']}`,
        '@wzrhine/effects': `file:${tarballs['@wzrhine/effects']}`,
        '@wzrhine/agent-core': `file:${tarballs['@wzrhine/agent-core']}`,
        '@wzrhine/agent': `file:${tarballs['@wzrhine/agent']}`,
        react: '19.3.0',
        'react-dom': '19.3.0',
        motion: '12.43.0',
      },
      devDependencies: {
        typescript: devPin('typescript') === '5.9.0' ? '5.9.3' : devPin('typescript'),
        vite: '6.4.4',
        '@types/react': '19.3.0',
        '@types/react-dom': '19.3.0',
      },
      // file: tarballs need their own deps resolved against each other, not the registry.
      pnpm: {
        overrides: {
          '@wzrhine/tokens': `file:${tarballs['@wzrhine/tokens']}`,
          '@wzrhine/react': `file:${tarballs['@wzrhine/react']}`,
          '@wzrhine/agent-core': `file:${tarballs['@wzrhine/agent-core']}`,
        },
      },
    },
    null,
    2,
  ),
);
writeFileSync(
  join(app, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      types: [],
    },
    include: ['src'],
  }),
);
writeFileSync(
  join(app, 'src/App.tsx'),
  `import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import { Button, DataTable, Field, Input, RhineProvider, StatusBadge } from '@wzrhine/react';
import type { ButtonProps, DataTableColumn } from '@wzrhine/react';
import { contrastRatio, motionDurations } from '@wzrhine/tokens';

interface Row { id: string; title: string }
const columns: DataTableColumn<Row>[] = [{ key: 'id', header: '编号', rowHeader: true, mono: true }, { key: 'title', header: '标题' }];
const variant: ButtonProps['variant'] = 'accent';
export const ratio: number = contrastRatio('#20251f', '#f3f2ed');
export const press: number = motionDurations.press;

export function App() {
  return (
    <RhineProvider theme="light">
      <Button variant={variant}>保存记录</Button>
      <StatusBadge status="success">已归档</StatusBadge>
      <Field label="记录编号"><Input mono /></Field>
      <DataTable caption="记录" columns={columns} rows={[{ id: 'ARC-1', title: '示例' }]} getRowId={(r) => r.id} />
    </RhineProvider>
  );
}
`,
);
writeFileSync(
  join(app, 'src/Effects.tsx'),
  `import '@wzrhine/effects/styles.css';
import { ArchiveReveal, MotionPlayer } from '@wzrhine/effects';
export function Effects() {
  return <MotionPlayer title="Reveal" demo={({ active }) => <ArchiveReveal text="ARC-1024" revealed={active} />} />;
}
`,
);
writeFileSync(
  join(app, 'src/Patterns.tsx'),
  `import '@wzrhine/patterns/styles.css';
import { AppliedFilters, ListDetail, PatternsMessagesProvider, patternsEnUS, usePatternsMessages, ViewSwitcher } from '@wzrhine/patterns';
import type { PatternsMessages, ViewSwitcherOption } from '@wzrhine/patterns';
const table: PatternsMessages = patternsEnUS;
const views: readonly ViewSwitcherOption[] = [{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }];
function Probe() {
  const messages = usePatternsMessages();
  return <span>{messages.listDetail.back}</span>;
}
export function Patterns() {
  return (
    <PatternsMessagesProvider messages={table}>
      <Probe />
      <AppliedFilters filters={[{ id: 'kind', label: 'Kind: sample' }]} />
      <ViewSwitcher label="View" options={views} defaultValue="list" />
      <ListDetail list={<ul><li>record</li></ul>} detail={<p>detail</p>} mode="split" />
    </PatternsMessagesProvider>
  );
}
`,
);
writeFileSync(
  join(app, 'src/Agent.tsx'),
  `import '@wzrhine/agent/styles.css';
import { AgentSpark, AgentStatus, runStatusMeta, toPlainText, encodeToken } from '@wzrhine/agent';
import type { MessageView, RunStatus } from '@wzrhine/agent';
import { mergeById } from '@wzrhine/agent-core';
const status: RunStatus = 'running';
export const messages: MessageView[] = mergeById([], [{ id: 'm1', role: 'user', status: 'complete', parts: [] }]);
export const text: string = toPlainText(encodeToken('@', 'a.ts'));
export function Agent() {
  const meta = runStatusMeta[status];
  return <><AgentSpark phase="thinking" /><AgentStatus glyph={meta.glyph} tone={meta.tone} label="运行中" /></>;
}
`,
);
writeFileSync(
  join(app, 'src/type-errors.tsx'),
  `import { Button, IconButton } from '@wzrhine/react';
// @ts-expect-error unknown variant must be rejected by the published types
export const a = <Button variant="danger">x</Button>;
// @ts-expect-error IconButton requires an accessible name
export const b = <IconButton icon={null} />;
import type { RunStatus } from '@wzrhine/agent-core';
// @ts-expect-error snake_case status names are not part of the contract (ADR-0011 §3)
export const c: RunStatus = 'waiting_approval';
`,
);
writeFileSync(join(app, 'index.html'), '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>');
writeFileSync(
  join(app, 'src/main.tsx'),
  `import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Patterns } from './Patterns';
import { Agent } from './Agent';
createRoot(document.getElementById('root')!).render(<><App /><Patterns /><Agent /></>);
`,
);
writeFileSync(
  join(app, 'ssr.mjs'),
  `import { renderToString } from 'react-dom/server';
import { createElement as h } from 'react';
import { Button, RhineProvider, StatusBadge, Text } from '@wzrhine/react';
import { ArchiveReveal } from '@wzrhine/effects';
import { AgentSpark, AgentStatus } from '@wzrhine/agent';
import { PatternsMessagesProvider, patternsEnUS, usePatternsMessages } from '@wzrhine/patterns';
import { motionDurations } from '@wzrhine/tokens';
const PatternProbe = () => { const m = usePatternsMessages(); return h('span', null, m.listDetail.back); };
const html = renderToString(h(RhineProvider, { theme: 'dark' }, h(Button, null, '保存'), h(StatusBadge, { status: 'info' }, '审核中'), h(Text, { variant: 'mono' }, 'ARC-1'), h(ArchiveReveal, { text: 'ARC-1024', revealed: true }), h(AgentSpark, { phase: 'thinking' }), h(AgentStatus, { glyph: 'active', tone: 'accent', label: '运行中' }), h(PatternsMessagesProvider, { messages: patternsEnUS }, h(PatternProbe))));
for (const needle of ['rl-theme', 'data-rl-theme="dark"', 'rl-button', '保存', 'rl-badge', 'rl-reveal', 'ARC-1024', 'rl-agent-spark', 'data-phase="thinking"', 'rl-agent-status', '运行中', 'Back to list']) {
  if (!html.includes(needle)) { console.error('SSR output missing ' + needle); process.exit(1); }
}
if (motionDurations.press !== 80) process.exit(1);
console.log('ssr ok (' + html.length + ' chars)');
`,
);

log('installing tarballs + react/motion from the registry into the consumer');
run('pnpm', ['install', '--ignore-workspace', '--config.node-linker=hoisted', '--reporter=silent'], { cwd: app });

for (const [name] of Object.entries(tarballs)) {
  const installed = join(app, 'node_modules', ...name.split('/'));
  if (!existsSync(join(installed, 'dist/index.js'))) fail(`${name} not installed from tarball`);
  if (existsSync(join(installed, 'src'))) fail(`${name}: src/ shipped`);
}

log('type-checking consumer code against published .d.ts (skipLibCheck: false)');
run(join(app, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], { cwd: app });

log('rendering with react-dom/server under plain Node ESM');
run(process.execPath, ['ssr.mjs'], { cwd: app });

log('bundling with Vite');
// logLevel error: Rollup warns that upstream "use client" directives are ignored in a client bundle (expected).
run(join(app, 'node_modules/.bin/vite'), ['build', '--logLevel', 'error', '--outDir', 'dist-app'], { cwd: app });
const assets = readdirSync(join(app, 'dist-app/assets'));
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(app, 'dist-app/assets', f), 'utf8')).join('\n');
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(app, 'dist-app/assets', f), 'utf8')).join('\n');
// One selector that exists only in each partial, so a dropped @import is caught
// (class names alone also appear in components.css's shared box-sizing list).
const cssChecks = {
  'tokens.css': '--rl-bg-canvas',
  'components.css': '.rl-button__spinner',
  'reset.css': '.rl-table__checkbox{padding:0',
  'overlays.css': '.rl-dialog__backdrop',
  'feedback.css': '.rl-toast-viewport',
  'archive.css': '.rl-table__sort',
  'forms.css': '.rl-switch__thumb',
  'data.css': '.rl-pagination__page',
  'drawer.css': '.rl-drawer__viewport',
  'status.css': '.rl-callout',
  'disclosure.css': '.rl-collapsible__panel',
  'agent.css': '.rl-agent-spark__dot',
  'patterns/layout.css': '.rl-list-detail__detail-bar',
};
for (const [file, needle] of Object.entries(cssChecks)) {
  if (!css.includes(needle)) fail(`bundled CSS missing ${needle} from ${file} (style entry or @import chain broken)`);
}
if (/rl-reveal|scrambleCells|rl-player/.test(js + css)) fail('effects code leaked into an app that never imports @wzrhine/effects');
log(`vite bundle ok: ${assets.length} assets, tokens + component CSS present, no effects code`);

if (!keep) rmSync(work, { recursive: true, force: true });
log('all package checks passed');
