#!/usr/bin/env node
/**
 * Builds the documentation search index (M9.5, docs search) at apps/docs/src/search-index.json.
 * Sources, all read from the repository so the index cannot drift from what ships:
 *   - Showcase routes (apps/docs/src/app/routes.ts) and each page's Specimen titles;
 *   - Markdown headings under docs/ (design, components, development, planning; not api/);
 *   - public exports listed in the generated API reports (docs/api/*.md).
 * `--check` exits 1 when the committed index is stale (run by `pnpm docs:check`).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'apps/docs/src/search-index.json');
const repoUrl = 'https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/';
const check = process.argv.includes('--check');

const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');

/** GitHub heading anchor: lower-case, drop punctuation except - and _, spaces to -. CJK is kept. */
function slug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

const entries = [];

// 1. Showcase routes and specimens.
const routesSource = read('apps/docs/src/app/routes.ts');
const routeRe = /\{ id: '([^']+)', path: '([^']+)', label: '([^']+)', group: '([^']+)'/g;
const pageFiles = readdirSync(join(root, 'apps/docs/src/pages')).filter((f) => f.endsWith('.tsx'));
const appSource = read('apps/docs/src/App.tsx');
for (const [, id, path, label, group] of routesSource.matchAll(routeRe)) {
  entries.push({ kind: 'page', title: label, section: group, href: `#${path}` });
  // `case 'button': return <ButtonPage />` → ButtonPage.tsx
  const caseMatch = appSource.match(new RegExp(`case '${id}':[\\s\\S]*?<(\\w+)`));
  const file = caseMatch && pageFiles.find((f) => f === `${caseMatch[1]}.tsx`);
  if (!file) continue;
  const page = read(`apps/docs/src/pages/${file}`);
  for (const [, title] of page.matchAll(/<Specimen[\s\S]*?\btitle="([^"]+)"/g)) {
    entries.push({ kind: 'specimen', title, section: label, href: `#${path}` });
  }
}

// 2. Markdown headings.
function walk(dir) {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`;
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : rel.endsWith('.md') ? [rel] : [];
  });
}
for (const file of ['docs/design', 'docs/components', 'docs/development', 'docs/planning'].flatMap(walk).sort()) {
  const text = read(file);
  const docTitle = (text.match(/^# (.+)$/m)?.[1] ?? file).trim();
  let inFence = false;
  for (const line of text.split('\n')) {
    if (/^(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^(#{1,3}) (.+)$/);
    if (!m) continue;
    const heading = m[2].trim();
    const href = `${repoUrl}${relative(root, join(root, file)).replace(/\\/g, '/')}${m[1].length === 1 ? '' : `#${slug(heading)}`}`;
    entries.push({ kind: 'doc', title: heading.replace(/`/g, ''), section: m[1].length === 1 ? 'docs' : docTitle, href });
  }
}

// 3. API exports from the generated reports.
for (const pkg of ['react', 'tokens', 'patterns', 'content', 'editor', 'effects', 'agent-core', 'agent']) {
  const text = read(`docs/api/${pkg}.md`);
  for (const [, name] of text.matchAll(/^### `([^`]+)`$/gm)) {
    entries.push({ kind: 'api', title: name, section: `@wzrhine/${pkg}`, href: `${repoUrl}docs/api/${pkg}.md#${slug(name)}` });
  }
}

const seen = new Set();
const unique = entries.filter((e) => {
  const key = `${e.kind}|${e.title}|${e.href}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
// Compact rows ([kind, title, section, href]) with the repository prefix factored out: the
// index ships inside the Showcase bundle, so size matters.
const kinds = ['page', 'specimen', 'doc', 'api'];
const rows = unique.map((e) => [kinds.indexOf(e.kind), e.title, e.section, e.href.startsWith(repoUrl) ? e.href.slice(repoUrl.length) : e.href]);
const json = `${JSON.stringify({ repo: repoUrl, kinds, rows })}\n`;

if (check) {
  let current = '';
  try {
    current = readFileSync(out, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    // missing index is stale
  }
  if (current !== json) {
    console.error('docs-index: apps/docs/src/search-index.json is stale; run `pnpm docs:index`');
    process.exit(1);
  }
  console.log(`docs-index: up to date (${unique.length} entries)`);
} else {
  writeFileSync(out, json);
  const counts = unique.reduce((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }), {});
  console.log(`docs-index: ${unique.length} entries ${JSON.stringify(counts)} → ${relative(root, out)}`);
}
