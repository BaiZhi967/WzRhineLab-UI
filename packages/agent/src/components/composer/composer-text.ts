import { TOKEN_CLOSE, TOKEN_OPEN, parseTokens, stripStray } from '@wzrhine/agent-core';

/**
 * `stripStray` that also maps the caret: isolate characters left over from partial edits (e.g. a
 * selection that cut half a token) are removed, and the caret moves left by the number of removed
 * characters before it. Returns the input untouched when nothing is stray.
 */
export function stripStrayWithCaret(value: string, caret: number): { value: string; caret: number } {
  if (!value.includes(TOKEN_OPEN) && !value.includes(TOKEN_CLOSE)) return { value, caret };
  const next = stripStray(value);
  if (next === value) return { value, caret };
  const keep = new Set<number>();
  for (const token of parseTokens(value)) {
    keep.add(token.start);
    keep.add(token.end - 1);
  }
  let removedBefore = 0;
  for (let i = 0; i < Math.min(caret, value.length); i += 1) {
    const ch = value[i];
    if ((ch === TOKEN_OPEN || ch === TOKEN_CLOSE) && !keep.has(i)) removedBefore += 1;
  }
  return { value: next, caret: Math.max(0, caret - removedBefore) };
}
