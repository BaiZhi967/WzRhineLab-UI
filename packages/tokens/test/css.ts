import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface CssBlock {
  selector: string;
  media: string | null;
  declarations: Map<string, string>;
}

export const tokensCssPath = fileURLToPath(new URL('../src/tokens.css', import.meta.url));

/** Minimal brace-depth parser: enough for the flat, comment-annotated tokens file. */
export function parseBlocks(source: string): CssBlock[] {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: CssBlock[] = [];
  let media: string | null = null;
  let cursor = 0;
  let depth = 0;
  let selectorStart = 0;
  let current: CssBlock | null = null;

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === '{') {
      const prelude = css.slice(selectorStart, i).trim();
      if (prelude.startsWith('@media')) {
        media = prelude;
      } else {
        current = { selector: prelude, media, declarations: new Map() };
        cursor = i + 1;
      }
      depth += 1;
      selectorStart = i + 1;
    } else if (char === '}') {
      if (current) {
        for (const decl of css.slice(cursor, i).split(';')) {
          const colon = decl.indexOf(':');
          if (colon === -1) continue;
          current.declarations.set(decl.slice(0, colon).trim(), decl.slice(colon + 1).trim());
        }
        blocks.push(current);
        current = null;
      } else {
        media = null;
      }
      depth -= 1;
      selectorStart = i + 1;
    }
  }
  if (depth !== 0) throw new Error('Unbalanced braces in tokens.css');
  return blocks;
}

export function loadTokenBlocks(): CssBlock[] {
  return parseBlocks(readFileSync(tokensCssPath, 'utf8'));
}

/** Resolve the declared value of a token for a theme, following one level of var() aliasing. */
export function themeValues(blocks: CssBlock[], theme: 'light' | 'dark' | 'system'): Map<string, string> {
  const result = new Map<string, string>();
  const apply = (block: CssBlock) => block.declarations.forEach((v, k) => result.set(k, v));
  blocks.filter((b) => b.selector === '.rl-theme' && b.media === null).forEach(apply);
  if (theme === 'dark') {
    blocks.filter((b) => b.selector === ".rl-theme[data-rl-theme='dark']").forEach(apply);
  }
  if (theme === 'system') {
    blocks
      .filter((b) => b.selector === ".rl-theme[data-rl-theme='system']" && b.media?.includes('prefers-color-scheme: dark'))
      .forEach(apply);
  }
  return result;
}
