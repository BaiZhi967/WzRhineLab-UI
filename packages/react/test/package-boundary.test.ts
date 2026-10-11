import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { duration, transition } from '../src';
import { motionDurations } from '@wzrhine/tokens';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const cssFiles = ['../src/components.css', '../src/reset.css', '../src/overlays.css', '../src/feedback.css', '../src/archive.css', '../src/forms.css', '../src/data.css', '../src/drawer.css', '../src/status.css', '../src/disclosure.css', '../src/advanced.css', '../src/command.css', '../src/split.css'];
const stripped = (path: string) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import\s+['"][^'"]+['"];/g, '');
const allCss = () => cssFiles.map(stripped).join('\n');
/** CSS without @keyframes bodies, whose from / to / % steps are not element selectors. */
const selectorCss = () => allCss().replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');

const componentFiles = [
  'Button',
  'IconButton',
  'StatusBadge',
  'Surface',
  'Text',
  'Field',
  'Input',
  'Tabs',
  'Tooltip',
  'Dialog',
  'Select',
  'Popover',
  'Menu',
  'Toast',
  'RecordHeader',
  'MetadataList',
  'ArchiveCard',
  'StatusIndicator',
  'Timeline',
  'DataTable',
  'Textarea',
  'Checkbox',
  'Radio',
  'Switch',
  'Fieldset',
  'Separator',
  'VisuallyHidden',
  'Form',
  'fieldParts',
  'Pagination',
  'Breadcrumb',
  'Progress',
  'Stat',
  'AlertDialog',
  'Drawer',
  'Alert',
  'EmptyState',
  'Skeleton',
  'Spinner',
  'Collapsible',
  'Accordion',
  'Slider',
  'NumberField',
  'ContextMenu',
  'Combobox',
  'CommandPalette',
  'FileDropZone',
  'SplitButton',
  'ScrollArea',
];

/**
 * Source without comments. Strings and template literals are kept (with their contents), so a
 * `//` inside a string is not mistaken for a comment.
 */
function stripComments(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
    } else if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      const start = i;
      i += 1;
      while (i < source.length && source[i] !== ch) i += source[i] === '\\' ? 2 : 1;
      i += 1;
      out += source.slice(start, i);
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

/** CJK ideographs, kana, hangul and full-width punctuation (（）、，。：). */
const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/;

/** Lines of `source` (comments removed) that contain CJK text. */
function cjkLines(source: string): string[] {
  return stripComments(source)
    .split('\n')
    .filter((line) => CJK.test(line))
    .map((line) => line.trim());
}

/** The single source of built-in copy (ADR-0009 §2). */
const MESSAGE_TABLE = 'provider/messages.tsx';
const sourceDirs = ['components', 'provider'];
// Resolved from this file (not `new URL('../src/')`, which Vite rewrites as an asset URL).
const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const sourceFiles = () =>
  sourceDirs.flatMap((dir) =>
    readdirSync(join(srcRoot, dir))
      .filter((name) => /\.tsx?$/.test(name))
      .map((name) => `${dir}/${name}`),
  );

function splitTopLevel(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i += 1) {
    if (selector[i] === '(') depth += 1;
    else if (selector[i] === ')') depth -= 1;
    else if (selector[i] === ',' && depth === 0) {
      parts.push(selector.slice(start, i));
      start = i + 1;
    }
  }
  return [...parts, selector.slice(start)];
}

describe('package boundary', () => {
  it('entry point has no CSS side effects', () => {
    const entry = read('../src/index.ts');
    expect(entry).not.toMatch(/^\s*import\s+['"][^'"]+\.css['"]/m);
  });

  it('the single style entry imports every partial stylesheet', () => {
    const entry = read('../src/components.css');
    // The host-isolation reset comes first so component rules win specificity ties.
    expect(entry.indexOf("@import './reset.css';")).toBeGreaterThan(-1);
    expect(entry.indexOf("@import './reset.css';")).toBeLessThan(entry.indexOf("@import './overlays.css';"));
    expect(entry).toMatch(/@import '\.\/overlays\.css';/);
    expect(entry).toMatch(/@import '\.\/feedback\.css';/);
    expect(entry).toMatch(/@import '\.\/archive\.css';/);
    expect(entry).toMatch(/@import '\.\/forms\.css';/);
    expect(entry).toMatch(/@import '\.\/data\.css';/);
  });

  it('Base UI is only imported through subpaths', () => {
    for (const file of componentFiles) {
      const source = read(`../src/components/${file}.tsx`);
      expect(source, file).not.toMatch(/from '@base-ui\/react'/);
    }
  });

  it('component CSS uses tokens instead of literal colours', () => {
    const css = allCss();
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/i);
    expect(css).not.toMatch(/\bhsla?\(/i);
  });

  it('component CSS uses tokens instead of literal pixel lengths', () => {
    const literals = [...allCss().matchAll(/(?<![\w-])\d+(?:\.\d+)?px\b/g)].map((m) => m[0]);
    expect(literals).toEqual([]);
  });

  it('component CSS never targets :root, html, body or bare elements', () => {
    const selectors = [...selectorCss().matchAll(/(^|})\s*([^{}@]+)\{/g)].map((m) => m[2]!.trim());
    for (const selector of selectors) {
      for (const part of splitTopLevel(selector)) {
        expect(part.trim(), part).toMatch(/^(:where\(|:is\()?\.rl-/);
      }
    }
  });

  it('every @keyframes animation is switched off under reduced motion', () => {
    const css = allCss();
    const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!);
    expect(names.length).toBeGreaterThan(0);
    const reduceBlocks = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)].map((m) => m[1]!);
    for (const name of names) {
      const selectorsUsing = [...css.matchAll(new RegExp(`([^{}]+)\\{[^{}]*animation:[^;]*\\b${name}\\b`, 'g'))].map((m) =>
        m[1]!.trim(),
      );
      expect(selectorsUsing.length, name).toBeGreaterThan(0);
      for (const selector of selectorsUsing) {
        const disabled = reduceBlocks.some((block) => block.includes(selector) && /animation:\s*none/.test(block));
        expect(disabled, `${name} via ${selector}`).toBe(true);
      }
    }
  });

  it('motion presets derive from the shared duration tokens', () => {
    for (const [name, ms] of Object.entries(motionDurations)) {
      expect(duration[name as keyof typeof duration]).toBeCloseTo(ms / 1000, 6);
    }
    // Every duration token has a same-named preset (M10 exit gate: Motion API ↔ tokens mapping).
    for (const [name, ms] of Object.entries(motionDurations)) {
      expect((transition as Record<string, { duration: number }>)[name]?.duration, name).toBeCloseTo(ms / 1000, 6);
    }
    expect(transition.press.duration).toBe(motionDurations.press / 1000);
    expect(transition.instant.duration).toBe(0);
  });

  it('component and provider code contains no CJK text outside the message table (ADR-0009)', () => {
    const files = sourceFiles();
    expect(files).toContain(MESSAGE_TABLE);
    expect(files.length).toBeGreaterThan(componentFiles.length);
    for (const file of files) {
      if (file === MESSAGE_TABLE) continue;
      expect(cjkLines(read(`../src/${file}`)), file).toEqual([]);
    }
    // The table itself must keep the Chinese defaults, or the rule above proves nothing.
    expect(cjkLines(read(`../src/${MESSAGE_TABLE}`)).length).toBeGreaterThan(20);
  });

  it('the CJK rule ignores comments but catches literals, JSX text and templates', () => {
    expect(cjkLines("// 注释\n/* 块注释\n 第二行 */\n/** 文档 */\nconst url = 'https://x.test';")).toEqual([]);
    expect(cjkLines("const a = '关闭';")).toEqual(["const a = '关闭';"]);
    expect(cjkLines('<span>（可选）</span>')).toHaveLength(1);
    expect(cjkLines('const t = `第 ${n} 页`; // ok')).toHaveLength(1);
    expect(cjkLines("const s = '//'; const b = '取消';")).toHaveLength(1);
  });

  it('components never hard-code animation numbers', () => {
    for (const file of componentFiles) {
      const source = read(`../src/components/${file}.tsx`);
      expect(source, file).not.toMatch(/duration\s*:\s*[\d.]/);
      expect(source, file).not.toMatch(/scale\s*:\s*[\d.]/);
    }
  });
});
