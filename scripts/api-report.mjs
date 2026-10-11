#!/usr/bin/env node
/**
 * API reference generator / checker for the publishable packages.
 *
 * Reads each package's built declarations (dist/index.d.ts, run `pnpm build:packages` first) with the
 * TypeScript compiler API and writes docs/api/<package>.md listing every public export with its kind,
 * signature and JSDoc summary. Component props are expanded member by member.
 *
 *   node scripts/api-report.mjs          # regenerate docs/api/*.md
 *   node scripts/api-report.mjs --check  # fail if the committed reports are out of date
 *
 * The --check mode is the API-change gate: any change to a public export shows up as a diff in review.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(join(root, 'packages/react/package.json'));
const ts = require('typescript');
const check = process.argv.includes('--check');
const packages = [
  { dir: 'tokens', name: '@wzrhine/tokens' },
  { dir: 'react', name: '@wzrhine/react' },
  { dir: 'effects', name: '@wzrhine/effects' },
  { dir: 'agent-core', name: '@wzrhine/agent-core' },
  { dir: 'agent', name: '@wzrhine/agent' },
];

const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope | ts.TypeFormatFlags.WriteArrowStyleSignature;

function doc(checker, symbol) {
  const text = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  return text.split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ') ?? '';
}

function kindOf(decl, checker, symbol) {
  if (!decl) return 'unknown';
  if (ts.isInterfaceDeclaration(decl)) return 'interface';
  if (ts.isTypeAliasDeclaration(decl)) return 'type';
  if (ts.isFunctionDeclaration(decl)) {
    // PascalCase functions returning JSX are function components; document their props like forwardRef ones.
    const sig = checker.getSignatureFromDeclaration(decl);
    const ret = sig ? checker.typeToString(checker.getReturnTypeOfSignature(sig)) : '';
    if (/^[A-Z]/.test(symbol.getName()) && /\bElement\b|ReactNode|ReactElement/.test(ret)) return 'component';
    return 'function';
  }
  if (ts.isVariableDeclaration(decl)) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
    const text = checker.typeToString(type, decl, flags);
    if (/ForwardRefExoticComponent|NamedExoticComponent|=> React\.JSX\.Element|JSX\.Element/.test(text)) return 'component';
    return 'const';
  }
  return ts.SyntaxKind[decl.kind];
}

function escapeCell(s) {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/** Props of a component: the first parameter type of its call signature, or of the forwardRef render props. */
function componentProps(checker, type, decl) {
  const sigs = type.getCallSignatures();
  const param = sigs[0]?.getParameters()[0];
  if (!param) return null;
  return checker.getTypeOfSymbolAtLocation(param, decl);
}

const ownProp = (prop) =>
  (prop.getDeclarations() ?? []).some((d) => !d.getSourceFile().fileName.includes('node_modules'));

function propsTable(checker, propsType, decl) {
  const rows = [];
  for (const prop of propsType.getProperties()) {
    if (!ownProp(prop)) continue;
    const pdecl = prop.valueDeclaration ?? prop.getDeclarations()?.[0];
    if (!pdecl) continue;
    const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
    const t = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, decl), decl, flags).replace(/ \| undefined$/, '');
    rows.push(`| \`${prop.getName()}\`${optional ? '' : ' *'} | \`${escapeCell(t)}\` | ${escapeCell(doc(checker, prop))} |`);
  }
  rows.sort();
  return rows;
}

function report(pkg) {
  const entry = join(root, 'packages', pkg.dir, 'dist/index.d.ts');
  if (!existsSync(entry)) throw new Error(`${entry} missing — run pnpm build:packages`);
  const program = ts.createProgram([entry], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exports = checker.getExportsOfModule(moduleSymbol).sort((a, b) => a.getName().localeCompare(b.getName()));
  const version = JSON.parse(readFileSync(join(root, 'packages', pkg.dir, 'package.json'), 'utf8')).version;

  const sections = { component: [], function: [], const: [], interface: [], type: [] };
  for (const exp of exports) {
    const symbol = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
    const decl = symbol.valueDeclaration ?? symbol.getDeclarations()?.[0];
    const kind = kindOf(decl, checker, symbol);
    const summary = doc(checker, symbol);
    const lines = [`### \`${exp.getName()}\``, '', `*${kind}*${summary ? ` — ${summary}` : ''}`, ''];
    if (kind === 'component' && symbol.valueDeclaration) {
      const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
      const generic = type.getCallSignatures()[0]?.getTypeParameters()?.length;
      if (generic) lines.push(`泛型组件：\`${exp.getName()}<${type.getCallSignatures()[0].getTypeParameters().map((t) => t.symbol.getName()).join(', ')}>\`。`, '');
      const props = componentProps(checker, type, symbol.valueDeclaration);
      const rows = props ? propsTable(checker, props, symbol.valueDeclaration) : [];
      if (rows.length) lines.push('| Prop | Type | Description |', '| --- | --- | --- |', ...rows, '', '`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。', '');
    } else if (kind === 'function' || kind === 'const') {
      const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
      lines.push('```ts', `${kind === 'function' ? 'function' : 'const'} ${exp.getName()}: ${checker.typeToString(type, decl, flags)}`, '```', '');
    } else if (kind === 'interface') {
      const type = checker.getDeclaredTypeOfSymbol(symbol);
      const rows = propsTable(checker, type, decl);
      if (rows.length) lines.push('| Member | Type | Description |', '| --- | --- | --- |', ...rows, '');
    } else if (kind === 'type' && decl && ts.isTypeAliasDeclaration(decl)) {
      const text = decl.type.getText(decl.getSourceFile()).replace(/\s+/g, ' ');
      if (text.length < 240) lines.push('```ts', `type ${exp.getName()} = ${text}`, '```', '');
    }
    (sections[kind] ?? (sections.type)).push(lines.join('\n'));
  }

  const titles = { component: 'Components', function: 'Functions & hooks', const: 'Constants', interface: 'Interfaces', type: 'Types' };
  const counts = Object.entries(sections).filter(([, v]) => v.length).map(([k, v]) => `${v.length} ${titles[k].toLowerCase()}`);
  let out = `# ${pkg.name} · API reference\n\n`;
  out += `> 由 \`scripts/api-report.mjs\` 从 \`dist/index.d.ts\` 生成，请勿手改。版本 ${version}，共 ${exports.length} 个导出（${counts.join('，')}）。\n\n`;
  for (const [kind, items] of Object.entries(sections)) {
    if (!items.length) continue;
    out += `## ${titles[kind]}\n\n${items.join('\n')}\n`;
  }
  return { out: out.replace(/\n{3,}/g, '\n\n'), count: exports.length };
}

const apiDir = join(root, 'docs/api');
mkdirSync(apiDir, { recursive: true });
let stale = [];
for (const pkg of packages) {
  const { out, count } = report(pkg);
  const file = join(apiDir, `${pkg.dir}.md`);
  const current = existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
  if (check) {
    if (current !== out) stale.push(`docs/api/${pkg.dir}.md`);
  } else {
    writeFileSync(file, out);
    console.log(`api-report: ${pkg.name} → docs/api/${pkg.dir}.md (${count} exports)`);
  }
}
if (check) {
  if (stale.length) {
    console.error(`api-report: out of date: ${stale.join(', ')}. Run \`pnpm api:report\` and review the diff.`);
    process.exit(1);
  }
  console.log('api-report: docs/api is up to date with the built declarations');
}
