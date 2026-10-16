export type MarkdownHeadingDepth = 1 | 2 | 3 | 4 | 5 | 6;

export interface MarkdownHeading {
  id: string;
  depth: MarkdownHeadingDepth;
  text: string;
  line: number;
}

function headingText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[\\*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyHeading(text: string, occurrence = 1): string {
  const normalized = headingText(text)
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = normalized || 'heading';
  return occurrence > 1 ? `${base}-${occurrence}` : base;
}

function fenceStart(line: string): { char: '`' | '~'; length: number } | undefined {
  const match = line.match(/^\s*(`{3,}|~{3,})/);
  return match ? { char: match[1]![0] as '`' | '~', length: match[1]!.length } : undefined;
}

function fenceEnd(line: string, fence: { char: '`' | '~'; length: number }): boolean {
  const escaped = fence.char === '`' ? '`' : '~';
  return new RegExp(`^\\s*${escaped}{${fence.length},}\\s*$`).test(line);
}

export function extractHeadings(source: string): readonly MarkdownHeading[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const headings: MarkdownHeading[] = [];
  const occurrences = new Map<string, number>();
  let fence: { char: '`' | '~'; length: number } | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (fence) {
      if (fenceEnd(line, fence)) fence = undefined;
      continue;
    }
    const start = fenceStart(line);
    if (start) {
      fence = start;
      continue;
    }

    const atx = line.match(/^ {0,3}(#{1,6})(?:\s+|$)(.*?)\s*$/);
    if (atx) {
      const text = headingText(atx[2]!.replace(/\s+#+\s*$/, ''));
      if (text) {
        const base = slugifyHeading(text);
        const occurrence = (occurrences.get(base) ?? 0) + 1;
        occurrences.set(base, occurrence);
        headings.push({ id: slugifyHeading(text, occurrence), depth: atx[1]!.length as MarkdownHeadingDepth, text, line: index + 1 });
      }
      continue;
    }

    const next = lines[index + 1];
    if (line.trim() && next && /^ {0,3}(=+|-+)\s*$/.test(next)) {
      const text = headingText(line);
      const base = slugifyHeading(text);
      const occurrence = (occurrences.get(base) ?? 0) + 1;
      occurrences.set(base, occurrence);
      headings.push({ id: slugifyHeading(text, occurrence), depth: next.trimStart()[0] === '=' ? 1 : 2, text, line: index + 1 });
      index += 1;
    }
  }

  return headings;
}
