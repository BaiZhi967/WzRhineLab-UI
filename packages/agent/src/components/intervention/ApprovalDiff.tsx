'use client';

import * as React from 'react';
import type { FileDiffView } from '@wzrhine/agent-core';
import { useAgentMessages } from '../../provider/AgentMessages.js';

/**
 * Minimal read-only diff list for approval material (internal; not exported). Hosts that want
 * the full tools `DiffPreview` pass it through `ApprovalPanel renderMaterial`.
 *
 * A11y: a `<figure>` named by the path; each hunk is an `<ol>` whose rows carry the sign as text
 * (`+` / `−`, plus a visually hidden "新增 / 删除" word) so the change is never colour only.
 * Long lines scroll horizontally inside the bounded frame instead of widening the page.
 */
export function ApprovalDiff({ diff }: { diff: FileDiffView }) {
  const m = useAgentMessages().intervention;
  const captionId = React.useId();
  const additions = diff.additions ?? diff.hunks.reduce((n, h) => n + h.lines.filter((l) => l.kind === 'add').length, 0);
  const deletions = diff.deletions ?? diff.hunks.reduce((n, h) => n + h.lines.filter((l) => l.kind === 'remove').length, 0);
  const empty = diff.hunks.every((h) => h.lines.length === 0);
  return (
    <figure className="rl-agent-approval-diff" aria-labelledby={captionId}>
      <figcaption id={captionId} className="rl-agent-approval-diff__caption">
        <span className="rl-agent-approval-diff__change">{m.diffChange[diff.change]}</span>
        <span className="rl-agent-approval-diff__path">
          {diff.path}
          {diff.movedTo ? ` → ${diff.movedTo}` : ''}
        </span>
        <span className="rl-agent-approval-diff__stats">{m.diffStats(additions, deletions)}</span>
        <span className="rl-agent-sr">{m.diffLabel(diff.path)}</span>
      </figcaption>
      {diff.binary ? (
        <p className="rl-agent-approval-diff__note">{m.diffBinary}</p>
      ) : empty ? (
        <p className="rl-agent-approval-diff__note">{m.diffEmpty}</p>
      ) : (
        <div className="rl-agent-approval-diff__scroll" tabIndex={0} role="group" aria-labelledby={captionId}>
          {diff.hunks.map((hunk) => (
            <div key={hunk.id} className="rl-agent-approval-diff__hunk">
              {hunk.header && <p className="rl-agent-approval-diff__header">{hunk.header}</p>}
              <ol className="rl-agent-approval-diff__lines">
                {hunk.lines.map((line, i) => {
                  const sign = line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' ';
                  const number = line.kind === 'remove' ? line.oldLine : (line.newLine ?? line.oldLine);
                  return (
                    <li key={i} className="rl-agent-approval-diff__line" data-kind={line.kind}>
                      <span className="rl-agent-approval-diff__no" aria-hidden="true">
                        {number ?? ''}
                      </span>
                      <span className="rl-agent-approval-diff__sign" aria-hidden="true">
                        {sign}
                      </span>
                      {line.kind === 'add' && <span className="rl-agent-sr">{m.diffAdded} </span>}
                      {line.kind === 'remove' && <span className="rl-agent-sr">{m.diffRemoved} </span>}
                      <code className="rl-agent-approval-diff__text">{line.text === '' ? ' ' : line.text}</code>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
      {diff.truncated && <p className="rl-agent-approval-diff__note">{m.diffTruncated}</p>}
    </figure>
  );
}
