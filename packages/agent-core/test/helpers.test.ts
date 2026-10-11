import { describe, expect, it } from 'vitest';
import {
  TOKEN_CLOSE,
  TOKEN_OPEN,
  buildTree,
  canStopRun,
  capability,
  codePointLength,
  compareRevision,
  dedupeById,
  deleteTokenAt,
  detectTrigger,
  diffStats,
  encodeToken,
  formatBytes,
  formatCompact,
  formatDuration,
  insertToken,
  isStaleRevision,
  lastLine,
  lineDiff,
  matchRanges,
  mergeById,
  parseTokens,
  parseUnifiedDiff,
  runPhaseMeta,
  runStatusMeta,
  sequenceGaps,
  snapCaret,
  sparkPhase,
  stripStray,
  tokenCounts,
  toolStatusMeta,
  toPlainText,
  usageLevel,
  usagePercent,
} from '../src/index.js';

describe('snapshot helpers', () => {
  it('normalises capabilities', () => {
    expect(capability(undefined)).toBeUndefined();
    expect(capability(true)).toEqual({ enabled: true });
    expect(capability({ enabled: false, reason: 'x' })).toEqual({ enabled: false, reason: 'x' });
  });

  it('compares numeric and lexical revisions', () => {
    expect(compareRevision('9', '10')).toBeLessThan(0);
    expect(compareRevision('10', '9')).toBeGreaterThan(0);
    expect(compareRevision('r-a', 'r-b')).toBeLessThan(0);
    expect(compareRevision(undefined, '1')).toBeLessThan(0);
    expect(isStaleRevision('5', '4')).toBe(true);
    expect(isStaleRevision('5', '5')).toBe(false);
    expect(isStaleRevision(undefined, '1')).toBe(false);
  });

  it('merges replayed events without duplicates or rollback', () => {
    const current = [
      { id: 'a', sequence: 1, revision: '2', text: 'a2' },
      { id: 'b', sequence: 2, revision: '1', text: 'b1' },
    ];
    const merged = mergeById(current, [
      { id: 'a', sequence: 1, revision: '1', text: 'a1-old' },
      { id: 'c', sequence: 0, revision: '1', text: 'c1' },
      { id: 'b', sequence: 2, revision: '3', text: 'b3' },
      { id: 'c', sequence: 0, revision: '1', text: 'c1-dup' },
    ]);
    expect(merged.map((m) => m.id)).toEqual(['c', 'a', 'b']);
    expect(merged.find((m) => m.id === 'a')!.text).toBe('a2');
    expect(merged.find((m) => m.id === 'b')!.text).toBe('b3');
  });

  it('keeps insertion order when sequences are missing', () => {
    expect(mergeById([{ id: 'x' }], [{ id: 'y' }, { id: 'x' }]).map((m) => m.id)).toEqual(['x', 'y']);
    expect(dedupeById([{ id: '1' }, { id: '2' }, { id: '1' }]).map((m) => m.id)).toEqual(['1', '2']);
  });

  it('finds sequence gaps', () => {
    expect(sequenceGaps([{ sequence: 1 }, { sequence: 2 }, { sequence: 5 }, {}])).toEqual([{ from: 3, to: 4 }]);
  });

  it('builds a parent/child tree and keeps orphans at the root', () => {
    const tree = buildTree([
      { id: 'root' },
      { id: 'c1', parentId: 'root' },
      { id: 'c2', parentId: 'root' },
      { id: 'orphan', parentId: 'missing' },
    ]);
    expect(tree.map((n) => n.id)).toEqual(['root', 'orphan']);
    expect(tree[0]!.children.map((c) => c.id)).toEqual(['c1', 'c2']);
  });
});

describe('status metadata', () => {
  it('covers every run status and phase with a glyph and tone', () => {
    for (const meta of [...Object.values(runStatusMeta), ...Object.values(runPhaseMeta), ...Object.values(toolStatusMeta)]) {
      expect(meta.glyph).toBeTruthy();
      expect(meta.tone).toBeTruthy();
    }
    expect(toolStatusMeta.unknown.settled).toBe(false);
    expect(toolStatusMeta.unknown.tone).not.toBe('success');
  });

  it('maps phases to spark rhythms and stop availability', () => {
    expect(sparkPhase('running', 'thinking')).toBe('thinking');
    expect(sparkPhase('running', 'executing-tool')).toBe('executing');
    expect(sparkPhase('waiting', 'waiting-approval')).toBe('waiting');
    expect(sparkPhase('completed')).toBe('done');
    expect(sparkPhase('failed')).toBe('error');
    expect(canStopRun('running')).toBe(true);
    expect(canStopRun('cancelling')).toBe(false);
    expect(canStopRun('completed')).toBe(false);
  });
});

describe('composer tokens', () => {
  const file = encodeToken('@', 'src/agent.ts');
  const skill = encodeToken('/', 'analyze');

  it('encodes with isolates and parses positions', () => {
    expect(file).toBe(`${TOKEN_OPEN}@src/agent.ts${TOKEN_CLOSE}`);
    const value = `看 ${file} 然后 ${skill}`;
    const tokens = parseTokens(value);
    expect(tokens.map((t) => [t.trigger, t.name])).toEqual([
      ['@', 'src/agent.ts'],
      ['/', 'analyze'],
    ]);
    expect(value.slice(tokens[0]!.start, tokens[0]!.end)).toBe(file);
    expect(toPlainText(value)).toBe('看 @src/agent.ts 然后 /analyze');
  });

  it('strips stray isolates left by partial edits', () => {
    expect(stripStray(`a${TOKEN_OPEN}@x b`)).toBe('a@x b');
    expect(stripStray(`${file}${TOKEN_CLOSE}`)).toBe(file);
  });

  it('inserts with padding and returns the caret after the trailing space', () => {
    const r = insertToken('看@ag', 1, 4, '@', 'agent.ts');
    expect(r.value).toBe(`看 ${encodeToken('@', 'agent.ts')} `);
    expect(r.caret).toBe(r.value.length);
  });

  it('snaps a caret inside a token to the nearer edge', () => {
    const value = `x ${file} y`;
    const t = parseTokens(value)[0]!;
    expect(snapCaret(value, t.start + 1)).toBe(t.start);
    expect(snapCaret(value, t.end - 1)).toBe(t.end);
    expect(snapCaret(value, 0)).toBe(0);
  });

  it('deletes a whole token with one adjacent space', () => {
    const value = `x ${file} y`;
    const t = parseTokens(value)[0]!;
    expect(deleteTokenAt(value, t.end, t.end, 'Backspace')).toMatchObject({ value: 'x y', caret: 2 });
    expect(deleteTokenAt(value, t.end + 1, t.end + 1, 'Backspace')).toMatchObject({ value: 'x y' });
    expect(deleteTokenAt(value, t.start, t.start, 'Delete')).toMatchObject({ value: 'x y' });
    expect(deleteTokenAt(value, 0, 0, 'Backspace')).toBeNull();
    expect(deleteTokenAt(value, 0, 3, 'Backspace')).toBeNull();
  });

  it('counts tokens per name', () => {
    expect(tokenCounts(`${file} ${file} ${skill}`).get('@src/agent.ts')).toBe(2);
  });

  it('detects triggers only at word boundaries and outside code', () => {
    expect(detectTrigger('看 @src/co', 9)).toEqual({ trigger: '@', query: 'src/co', from: 2, to: 9 });
    expect(detectTrigger('/ana', 4)).toEqual({ trigger: '/', query: 'ana', from: 0, to: 4 });
    expect(detectTrigger('mail@host', 9)).toBeNull();
    expect(detectTrigger('see /etc', 8)).toBeNull();
    expect(detectTrigger('`@x', 3)).toBeNull();
    expect(detectTrigger('```\n@x', 6)).toBeNull();
    expect(detectTrigger(`${file} /an`, file.length + 4)).toMatchObject({ trigger: '/', query: 'an' });
    expect(detectTrigger('@x', 2, ['/'])).toBeNull();
  });
});

describe('diff helpers', () => {
  it('builds a bounded line diff around the change', () => {
    const before = ['a', 'b', 'c', 'd', 'e'].join('\n');
    const after = ['a', 'b', 'C', 'd', 'e', 'f'].join('\n');
    const { hunk, additions, deletions, truncated } = lineDiff(before, after, { context: 1 });
    expect(additions).toBe(4);
    expect(deletions).toBe(3);
    expect(truncated).toBe(false);
    expect(hunk.lines[0]).toMatchObject({ kind: 'context', text: 'b', oldLine: 2 });
    expect(hunk.lines.filter((l) => l.kind === 'add').map((l) => l.text)).toEqual(['C', 'd', 'e', 'f']);
  });

  it('caps very large replacements', () => {
    const r = lineDiff('', Array.from({ length: 10 }, (_, i) => `l${i}`).join('\n'), { maxLines: 4 });
    expect(r.truncated).toBe(true);
    expect(r.hunk.lines.filter((l) => l.kind === 'add')).toHaveLength(4);
  });

  it('parses unified diffs with line numbers', () => {
    const files = parseUnifiedDiff(
      ['--- a/src/config.py', '+++ b/src/config.py', '@@ -12,2 +12,3 @@', '-debug = true', '+debug = false', '+log = 1', ' x', '\\ No newline at end of file'].join('\n'),
    );
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ path: 'src/config.py', change: 'update', additions: 2, deletions: 1 });
    expect(files[0]!.hunks[0]!.lines[1]).toMatchObject({ kind: 'add', newLine: 12 });
    expect(files[0]!.hunks[0]!.lines.at(-1)!.kind).toBe('meta');
    expect(diffStats(files)).toEqual({ files: 1, additions: 2, deletions: 1 });
    expect(parseUnifiedDiff('--- /dev/null\n+++ b/new.txt\n@@ -0,0 +1 @@\n+hi')[0]).toMatchObject({ path: 'new.txt', change: 'add' });
  });
});

describe('format helpers', () => {
  it('formats compact numbers, durations and bytes', () => {
    expect(formatCompact(12400)).toBe('12.4K');
    expect(formatCompact(1_500_000)).toBe('1.5M');
    expect(formatCompact(999)).toBe('999');
    expect(formatDuration(850)).toBe('850ms');
    expect(formatDuration(12_400)).toBe('12.4s');
    expect(formatDuration(185_000)).toBe('3m 05s');
    expect(formatDuration(3_720_000)).toBe('1h 02m');
    expect(formatBytes(2_516_582)).toBe('2.4 MB');
    expect(formatBytes(512)).toBe('512 B');
  });

  it('never invents a percentage', () => {
    expect(usagePercent(12_400, 32_000, 'exact')).toBe(39);
    expect(usagePercent(12_400, 32_000, 'estimated')).toBe(39);
    expect(usagePercent(12_400, 32_000, 'partial')).toBeNull();
    expect(usagePercent(12_400, undefined, 'exact')).toBeNull();
    expect(usagePercent(1, 0, 'exact')).toBeNull();
    expect(usageLevel(90, 100)).toBe('near');
    expect(usageLevel(110, 100)).toBe('over');
    expect(usageLevel(1, undefined)).toBe('unknown');
  });

  it('counts code points and picks the last non-empty line', () => {
    expect(codePointLength('a😀中')).toBe(3);
    expect(lastLine('one\ntwo\n\n  ')).toBe('two');
    expect(matchRanges('Agent agent', 'ag')).toEqual([
      [0, 2],
      [6, 8],
    ]);
  });
});
