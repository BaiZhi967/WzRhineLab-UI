/*
 * Safe plain-text reading of Markdown-ish sources (ADR-0010 §4). No HTML is parsed and nothing is
 * fetched: the only structure recognised is fenced code (``` or ~~~), so code keeps its own block
 * and every other character is shown as written. An unclosed fence (still streaming) runs to the
 * end of the source and is flagged `open`.
 */

export type PlainSegment =
  | { kind: 'text'; paragraphs: string[] }
  | { kind: 'code'; code: string; language?: string; open: boolean };

const OPEN_FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/;

function toParagraphs(lines: string[]): string[] {
  return lines
    .join('\n')
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/^\n+|\n+$/g, ''))
    .filter((p) => p.trim() !== '');
}

export function splitFences(source: string): PlainSegment[] {
  const segments: PlainSegment[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let text: string[] = [];
  let code: string[] | null = null;
  let fence = '';
  let language: string | undefined;

  const flushText = () => {
    const paragraphs = toParagraphs(text);
    if (paragraphs.length > 0) segments.push({ kind: 'text', paragraphs });
    text = [];
  };

  for (const line of lines) {
    if (code === null) {
      const open = OPEN_FENCE.exec(line);
      if (open) {
        flushText();
        code = [];
        fence = open[1]!;
        language = open[2] || undefined;
      } else {
        text.push(line);
      }
      continue;
    }
    const trimmed = line.trim();
    const closes = trimmed.length >= fence.length && trimmed[0] === fence[0] && /^(`+|~+)$/.test(trimmed);
    if (closes) {
      segments.push({ kind: 'code', code: code.join('\n'), language, open: false });
      code = null;
    } else {
      code.push(line);
    }
  }
  if (code !== null) segments.push({ kind: 'code', code: code.join('\n'), language, open: true });
  else flushText();
  return segments;
}
