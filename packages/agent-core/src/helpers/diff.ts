import type { DiffHunkView, DiffLineView, FileDiffView } from '../contracts/tools.js';

/**
 * Bounded line diff for previews (ADR-0011 §5). Trims the common head and tail, keeps `context`
 * lines around the replaced block and caps each side at `maxLines`. It is a preview aid, not a
 * patch engine: the adapter's canonical diff wins whenever one exists.
 */
export interface LineDiffOptions {
  context?: number;
  maxLines?: number;
}

export function lineDiff(before: string, after: string, { context = 3, maxLines = 200 }: LineDiffOptions = {}): {
  hunk: DiffHunkView;
  additions: number;
  deletions: number;
  truncated: boolean;
} {
  const a = before === '' ? [] : before.split('\n');
  const b = after === '' ? [] : after.split('\n');
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;

  const removed = a.slice(head, a.length - tail);
  const added = b.slice(head, b.length - tail);
  const lines: DiffLineView[] = [];
  const ctxStart = Math.max(0, head - context);
  for (let i = ctxStart; i < head; i += 1) lines.push({ kind: 'context', text: a[i]!, oldLine: i + 1, newLine: i + 1 });
  let truncated = false;
  removed.slice(0, maxLines).forEach((text, i) => lines.push({ kind: 'remove', text, oldLine: head + i + 1 }));
  if (removed.length > maxLines) truncated = true;
  added.slice(0, maxLines).forEach((text, i) => lines.push({ kind: 'add', text, newLine: head + i + 1 }));
  if (added.length > maxLines) truncated = true;
  const oldTailStart = a.length - tail;
  const newTailStart = b.length - tail;
  for (let i = 0; i < Math.min(context, tail); i += 1) {
    lines.push({ kind: 'context', text: a[oldTailStart + i]!, oldLine: oldTailStart + i + 1, newLine: newTailStart + i + 1 });
  }
  return { hunk: { id: 'h0', lines }, additions: added.length, deletions: removed.length, truncated };
}

/**
 * Parse a unified diff (`--- a/x`, `+++ b/x`, `@@ -1,3 +1,4 @@`) into file diffs. Unknown lines
 * become `meta` lines so nothing is silently dropped.
 */
export function parseUnifiedDiff(source: string): FileDiffView[] {
  const files: FileDiffView[] = [];
  let file: FileDiffView | undefined;
  let hunk: DiffHunkView | undefined;
  let oldLine = 0;
  let newLine = 0;
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  for (const line of lines) {
    if (line.startsWith('--- ')) {
      const path = line.slice(4).replace(/^a\//, '').trim();
      file = { path, change: path === '/dev/null' ? 'add' : 'update', hunks: [], additions: 0, deletions: 0 };
      files.push(file);
      hunk = undefined;
      continue;
    }
    if (line.startsWith('+++ ') && file) {
      const path = line.slice(4).replace(/^b\//, '').trim();
      if (path === '/dev/null') file.change = 'delete';
      else {
        if (file.change === 'add' || file.path === '/dev/null') file.change = 'add';
        file.path = path;
      }
      continue;
    }
    const header = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/.exec(line);
    if (header) {
      if (!file) {
        file = { path: '', change: 'update', hunks: [], additions: 0, deletions: 0 };
        files.push(file);
      }
      oldLine = Number(header[1]);
      newLine = Number(header[2]);
      hunk = { id: `h${file.hunks.length}`, header: line, lines: [] };
      file.hunks.push(hunk);
      continue;
    }
    if (!hunk || !file) continue;
    if (line.startsWith('+')) {
      hunk.lines.push({ kind: 'add', text: line.slice(1), newLine: newLine++ });
      file.additions = (file.additions ?? 0) + 1;
    } else if (line.startsWith('-')) {
      hunk.lines.push({ kind: 'remove', text: line.slice(1), oldLine: oldLine++ });
      file.deletions = (file.deletions ?? 0) + 1;
    } else if (line.startsWith(' ')) {
      hunk.lines.push({ kind: 'context', text: line.slice(1), oldLine: oldLine++, newLine: newLine++ });
    } else if (line.startsWith('\\')) {
      hunk.lines.push({ kind: 'meta', text: line });
    } else if (line !== '') {
      hunk.lines.push({ kind: 'meta', text: line });
    }
  }
  return files;
}

/** Totals across files. */
export function diffStats(files: readonly FileDiffView[]): { files: number; additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const file of files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.kind === 'add') additions += 1;
        else if (line.kind === 'remove') deletions += 1;
      }
    }
  }
  return { files: files.length, additions, deletions };
}
