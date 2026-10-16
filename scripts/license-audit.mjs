#!/usr/bin/env node
/**
 * Third-party license audit for the publishable packages (QUALITY-GATES G3).
 * Walks the real installed runtime dependency tree (dependencies + peerDependencies) of
 * @wzrhine/tokens, @wzrhine/react and @wzrhine/effects, then writes
 * docs/development/THIRD-PARTY-LICENSES.md. Fails if any license is not on the allow list.
 * Dev-only tooling (vitest, playwright, vite…) is not shipped and is out of scope.
 */
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const allow = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD']);
const seen = new Map();

function resolveDep(fromDir, dep) {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, 'node_modules', ...dep.split('/'));
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate);
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** Where the license text comes from: the shipped LICENSE file, its copyright line and the upstream repository. */
function source(pkgDir, pj) {
  const file = readdirSync(pkgDir).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  const text = file ? readFileSync(join(pkgDir, file), 'utf8') : '';
  const copyright = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => /^(copyright\b|\(c\))/i.test(l)) ?? '';
  const raw = typeof pj.repository === 'string' ? pj.repository : (pj.repository?.url ?? '');
  const repo = raw
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^github:/, 'https://github.com/')
    .replace(/^([\w.-]+\/[\w.-]+)$/, 'https://github.com/$1')
    .replace(/\.git$/, '');
  return { file: file ?? '', copyright: copyright.replace(/\|/g, '\\|'), repo };
}

function walk(pkgDir, via) {
  const pj = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
  const key = `${pj.name}@${pj.version}`;
  const existing = seen.get(key);
  if (existing) {
    // Already visited from this package: stop. From a new package: record it and keep descending
    // so transitive dependencies credit every package that pulls them in.
    if (existing.via.has(via)) return;
    existing.via.add(via);
  } else {
    const license = typeof pj.license === 'string' ? pj.license : (pj.licenses ?? []).map((l) => l.type).join(' OR ') || 'UNKNOWN';
    seen.set(key, { name: pj.name, version: pj.version, license, via: new Set([via]), ...source(pkgDir, pj) });
  }
  for (const dep of Object.keys(pj.dependencies ?? {})) {
    const found = resolveDep(pkgDir, dep);
    if (found) walk(found, via);
  }
}

for (const p of ['tokens', 'react', 'patterns', 'content', 'effects', 'agent-core', 'agent']) {
  const dir = join(root, 'packages', p);
  const pj = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  for (const dep of [...Object.keys(pj.dependencies ?? {}), ...Object.keys(pj.peerDependencies ?? {})]) {
    if (dep.startsWith('@wzrhine/')) continue;
    const found = resolveDep(dir, dep);
    if (!found) {
      console.error(`license-audit: cannot resolve ${dep} from packages/${p}`);
      process.exit(1);
    }
    walk(found, pj.name);
  }
}

const rows = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
const disallowed = rows.filter((r) => !r.license.split(/\s+OR\s+|[()]/).some((l) => allow.has(l.trim())));
const counts = rows.reduce((acc, r) => ({ ...acc, [r.license]: (acc[r.license] ?? 0) + 1 }), {});

let md = '# Third-party licenses（运行时依赖）\n\n';
md += '> 由 `scripts/license-audit.mjs` 根据实际安装的依赖树生成。范围：可发布包的 dependencies 与 peerDependencies 及其传递依赖。开发工具不随包发布，不在范围内。\n\n';
md += `共 ${rows.length} 个包：${Object.entries(counts).map(([k, v]) => `${k} × ${v}`).join('，')}。允许的许可证：${[...allow].join('、')}。\n\n`;
md += '| 包 | 版本 | 许可证 | 许可文件 · 版权声明 | 来源 | 引入方 |\n| --- | --- | --- | --- | --- | --- |\n';
for (const r of rows) {
  const notice = r.file ? `\`${r.file}\`${r.copyright ? ` · ${r.copyright}` : ''}` : '**缺失**';
  const repo = r.repo ? `[${r.repo.replace(/^https:\/\//, '')}](${r.repo})` : '—';
  md += `| \`${r.name}\` | ${r.version} | ${r.license} | ${notice} | ${repo} | ${[...r.via].sort().join('、')} |\n`;
}
md += '\n## 非代码素材\n\n';
md += '- 字体：仓库不内置字体文件。tokens 只声明字体栈（Inter、Noto Sans SC、IBM Plex Mono 等），由使用方自行按上游许可引入（STYLE.md §2）。\n';
md += '- 图标：npm 包内与 Showcase 自绘的 SVG 图标均为本项目原创（[../design/ICONS.md](../design/ICONS.md)）。Showcase 应用另外以 `lucide-react` 1.48.0（ISC · Copyright (c) Lucide Contributors · [github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide)）作为通用图标基础层，只随 GitHub Pages 演示站分发，不进入任何 npm 包。\n';
md += '- 图片：`docs/concepts/images/` 为本项目原创的概念图，仅用于设计参考，不随 npm 包发布（`files` 只包含 `dist`、README、CHANGELOG）。\n';
writeFileSync(join(root, 'docs/development/THIRD-PARTY-LICENSES.md'), md);

console.log(`license-audit: ${rows.length} runtime packages, ${JSON.stringify(counts)}`);
const missingFile = rows.filter((r) => !r.file);
if (missingFile.length) {
  console.error(`license-audit: no LICENSE file shipped: ${missingFile.map((r) => `${r.name}@${r.version}`).join(', ')}`);
  process.exit(1);
}
if (disallowed.length) {
  console.error(`license-audit: not on allow list: ${disallowed.map((r) => `${r.name}@${r.version} (${r.license})`).join(', ')}`);
  process.exit(1);
}
