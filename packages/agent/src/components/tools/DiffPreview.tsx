'use client';

import * as React from 'react';
import type { AgentTone, DiffLineView, FileDiffView, StatusGlyphName } from '@wzrhine/agent-core';
import { diffStats, lineDiff } from '@wzrhine/agent-core';
import { Collapsible } from '@wzrhine/react';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { ActionButton, Notice, Pill } from './shared.js';

/**
 * DiffPreview (atlas 31): one file diff. Header = path, change kind, `+N −M` stats and the
 * proposal status. Lines sit in their own horizontally scrolling, focusable region (the page
 * never overflows); each line is old line no · new line no · sign · code. The sign is visible
 * text (`+` / `−` / space) and screen readers hear 「新增」/「删除」; line numbers are hidden from
 * assistive tech and unselectable, so copying a block copies code only. Added / removed lines
 * are tinted with the success / danger subtle tokens *and* carry the sign, never colour alone.
 *
 * A conflict renders a warning (「文件版本冲突 · 重新读取最新文件后再决定」) with `onReload`;
 * binary files show a message instead of hunks; `truncated` shows a notice and `onViewFull`.
 * Pass `diff` (canonical, from the adapter) or `before` / `after` strings for a bounded preview
 * computed with `lineDiff` (a preview aid, not a patch engine). No motion.
 */
export type DiffPreviewProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  diff?: FileDiffView;
  /** Convenience: compute a preview diff from two strings (ignored when `diff` is given). */
  before?: string;
  after?: string;
  /** Path for the `before` / `after` form. */
  path?: string;
  /** Status for the `before` / `after` form (defaults to `preview`). */
  status?: FileDiffView['status'];
  /** Hide the header (when an outer disclosure already shows it). */
  hideHeader?: boolean;
  /** Open the full diff (shown when the diff is truncated). */
  onViewFull?: () => void;
  /** Re-read the latest file (shown on conflict). */
  onReload?: () => void;
};

const statusMeta: Record<NonNullable<FileDiffView['status']>, { glyph: StatusGlyphName; tone: AgentTone }> = {
  preview: { glyph: 'pending', tone: 'neutral' },
  proposed: { glyph: 'approval', tone: 'warning' },
  applied: { glyph: 'done', tone: 'success' },
  conflict: { glyph: 'failed', tone: 'warning' },
  unavailable: { glyph: 'unknown', tone: 'neutral' },
};

/** Resolve the props into one FileDiffView. */
export function resolveDiff(props: Pick<DiffPreviewProps, 'diff' | 'before' | 'after' | 'path' | 'status'>): FileDiffView | undefined {
  if (props.diff) return props.diff;
  if (props.before === undefined && props.after === undefined) return undefined;
  const before = props.before ?? '';
  const after = props.after ?? '';
  const result = lineDiff(before, after);
  return {
    path: props.path ?? '',
    change: before === '' ? 'add' : after === '' ? 'delete' : 'update',
    hunks: [result.hunk],
    additions: result.additions,
    deletions: result.deletions,
    truncated: result.truncated,
    status: props.status ?? 'preview',
  };
}

function totals(diff: FileDiffView) {
  const counted = diffStats([diff]);
  return {
    additions: diff.additions ?? counted.additions,
    deletions: diff.deletions ?? counted.deletions,
  };
}

/** `+N −M` with a spoken label. */
export function DiffStats({ additions, deletions }: { additions: number; deletions: number }) {
  const m = useAgentMessages().tools;
  return (
    <span className="rl-agent-diff-stats">
      <span aria-hidden="true">
        <span className="rl-agent-diff-stats__add">+{additions}</span> <span className="rl-agent-diff-stats__del">−{deletions}</span>
      </span>
      <span className="rl-agent-sr">{m.diffStatsLabel(additions, deletions)}</span>
    </span>
  );
}

export function DiffStatusPill({ status }: { status: NonNullable<FileDiffView['status']> }) {
  const m = useAgentMessages().tools;
  const meta = statusMeta[status];
  return <Pill glyph={meta.glyph} tone={meta.tone} label={m.diffStatus[status]} />;
}

const SIGN: Record<DiffLineView['kind'], string> = {
  add: '+',
  remove: '−',
  context: ' ',
  meta: ' ',
};

function DiffLines({ diff, label }: { diff: FileDiffView; label: string }) {
  const m = useAgentMessages().tools;
  return (
    <div className="rl-agent-diff__scroll" role="region" tabIndex={0} aria-label={label}>
      <div className="rl-agent-diff__lines">
        {diff.hunks.map((hunk) => (
          <React.Fragment key={hunk.id}>
            {hunk.header && (
              <div className="rl-agent-diff__line" data-kind="hunk">
                <span className="rl-agent-diff__ln" aria-hidden="true" />
                <span className="rl-agent-diff__ln" aria-hidden="true" />
                <span className="rl-agent-diff__sign" aria-hidden="true" />
                <code className="rl-agent-diff__code">{hunk.header}</code>
              </div>
            )}
            {hunk.lines.map((line, i) => (
              <div key={i} className="rl-agent-diff__line" data-kind={line.kind}>
                <span className="rl-agent-diff__ln" aria-hidden="true">
                  {line.oldLine ?? ''}
                </span>
                <span className="rl-agent-diff__ln" aria-hidden="true">
                  {line.newLine ?? ''}
                </span>
                <span className="rl-agent-diff__sign" aria-hidden="true">
                  {SIGN[line.kind]}
                </span>
                {line.kind === 'add' && <span className="rl-agent-sr">{m.diffAdded} </span>}
                {line.kind === 'remove' && <span className="rl-agent-sr">{m.diffRemoved} </span>}
                <code className="rl-agent-diff__code">{line.text === '' ? '\u00a0' : line.text}</code>
              </div>
            ))}
          </React.Fragment>
        ))}
        {diff.noNewlineAtEnd?.old && (
          <div className="rl-agent-diff__line" data-kind="meta">
            <span className="rl-agent-diff__ln" aria-hidden="true" />
            <span className="rl-agent-diff__ln" aria-hidden="true" />
            <span className="rl-agent-diff__sign" aria-hidden="true" />
            <span className="rl-agent-diff__code">{m.noNewlineAtEnd('old')}</span>
          </div>
        )}
        {diff.noNewlineAtEnd?.new && (
          <div className="rl-agent-diff__line" data-kind="meta">
            <span className="rl-agent-diff__ln" aria-hidden="true" />
            <span className="rl-agent-diff__ln" aria-hidden="true" />
            <span className="rl-agent-diff__sign" aria-hidden="true" />
            <span className="rl-agent-diff__code">{m.noNewlineAtEnd('new')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Body of a diff (notices + lines), shared by DiffPreview and MultiFileDiff. */
function DiffBody({ diff, onViewFull, onReload }: { diff: FileDiffView; onViewFull?: () => void; onReload?: () => void }) {
  const m = useAgentMessages().tools;
  const noticeId = React.useId();
  const hasLines = diff.hunks.some((h) => h.lines.length > 0);
  return (
    <>
      {diff.status === 'conflict' && (
        <div className="rl-agent-diff__conflict">
          <Notice
            tone="warning"
            action={
              onReload && (
                <ActionButton icon="retry" onClick={onReload}>
                  {m.reloadFile}
                </ActionButton>
              )
            }
          >
            <strong>{m.conflictTitle}</strong> · {diff.conflictReason ?? m.conflictBody}
          </Notice>
        </div>
      )}
      {diff.binary ? (
        <p className="rl-agent-diff__placeholder">{m.diffBinary}</p>
      ) : diff.status === 'unavailable' && !hasLines ? (
        <p className="rl-agent-diff__placeholder">{m.diffUnavailable}</p>
      ) : hasLines ? (
        <DiffLines diff={diff} label={m.diffRegion(diff.path)} />
      ) : (
        <p className="rl-agent-diff__placeholder">{m.diffEmpty}</p>
      )}
      {diff.truncated && (
        <Notice
          tone="info"
          id={noticeId}
          action={
            onViewFull && (
              <ActionButton icon="external" onClick={onViewFull} describedBy={noticeId}>
                {m.diffViewFull}
              </ActionButton>
            )
          }
        >
          {m.diffTruncated}
        </Notice>
      )}
    </>
  );
}

function DiffHeaderParts({ diff }: { diff: FileDiffView }) {
  const m = useAgentMessages().tools;
  const t = totals(diff);
  return (
    <>
      <span className="rl-agent-diff__path" title={diff.path}>
        {diff.path}
      </span>
      {diff.movedTo && (
        <span className="rl-agent-diff__moved" title={diff.movedTo}>
          {m.movedTo(diff.movedTo)}
        </span>
      )}
      <span className="rl-agent-diff__change">{m.diffChange[diff.change]}</span>
      {!diff.binary && <DiffStats additions={t.additions} deletions={t.deletions} />}
      {diff.status && <DiffStatusPill status={diff.status} />}
    </>
  );
}

export const DiffPreview = React.forwardRef<HTMLDivElement, DiffPreviewProps>(function DiffPreview(
  { diff: diffProp, before, after, path, status, hideHeader, onViewFull, onReload, className, ...rest },
  ref,
) {
  const m = useAgentMessages().tools;
  const diff = React.useMemo(() => resolveDiff({ diff: diffProp, before, after, path, status }), [diffProp, before, after, path, status]);
  if (!diff) {
    return (
      <div {...rest} ref={ref} className={cx('rl-agent-diff', className)}>
        <p className="rl-agent-diff__placeholder">{m.diffUnavailable}</p>
      </div>
    );
  }
  return (
    <div {...rest} ref={ref} className={cx('rl-agent-diff', className)} data-status={diff.status} data-change={diff.change}>
      {!hideHeader && (
        <div className="rl-agent-diff__header">
          <DiffHeaderParts diff={diff} />
        </div>
      )}
      <DiffBody diff={diff} onViewFull={onViewFull} onReload={onReload} />
    </div>
  );
});

/**
 * MultiFileDiff: several file diffs as a list of disclosures, each with its own status (a
 * conflict in one file never colours the others). The first file and every conflicting file are
 * open by default; `expanded` / `onExpandedChange` control it by path.
 */
export type MultiFileDiffProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  files: readonly FileDiffView[];
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (paths: string[]) => void;
  onViewFull?: (path: string) => void;
  onReload?: (path: string) => void;
  /** List name; defaults to 「改动的文件」. */
  label?: string;
};

export const MultiFileDiff = React.forwardRef<HTMLDivElement, MultiFileDiffProps>(function MultiFileDiff(
  { files, expanded, defaultExpanded, onExpandedChange, onViewFull, onReload, label, className, ...rest },
  ref,
) {
  const m = useAgentMessages().tools;
  const [inner, setInner] = React.useState<string[]>(() =>
    defaultExpanded ? [...defaultExpanded] : files.filter((f, i) => i === 0 || f.status === 'conflict').map((f) => f.path),
  );
  const open = expanded ?? inner;
  const stats = diffStats(files);
  const toggle = (p: string, next: boolean) => {
    const list = next ? [...open.filter((x) => x !== p), p] : open.filter((x) => x !== p);
    if (expanded === undefined) setInner(list);
    onExpandedChange?.(list);
  };
  return (
    <div {...rest} ref={ref} className={cx('rl-agent-multidiff', className)}>
      <p className="rl-agent-multidiff__summary">
        <span>{m.diffFiles(files.length)}</span>
        <DiffStats additions={stats.additions} deletions={stats.deletions} />
      </p>
      <ul className="rl-agent-multidiff__list" aria-label={label ?? m.multiFileList}>
        {files.map((file) => (
          <li key={file.path} className="rl-agent-multidiff__item" data-status={file.status}>
            <Collapsible
              className="rl-agent-multidiff__file"
              open={open.includes(file.path)}
              onOpenChange={(next) => toggle(file.path, next)}
              trigger={<DiffHeaderParts diff={file} />}
              triggerProps={{ className: 'rl-agent-multidiff__trigger' }}
            >
              <div className="rl-agent-diff" data-status={file.status} data-change={file.change}>
                <DiffBody
                  diff={file}
                  onViewFull={onViewFull ? () => onViewFull(file.path) : undefined}
                  onReload={onReload ? () => onReload(file.path) : undefined}
                />
              </div>
            </Collapsible>
          </li>
        ))}
      </ul>
    </div>
  );
});
