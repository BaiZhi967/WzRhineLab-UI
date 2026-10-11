'use client';

import * as React from 'react';
import type { ToolOutputView } from '@wzrhine/agent-core';
import { Skeleton } from '@wzrhine/react';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { ActionButton, CopyButton, Notice, prettyJson } from './shared.js';

/**
 * ToolOutput (atlas 45): bounded preview of one tool output. The body never grows past
 * `--rl-agent-output-max-height`; it scrolls inside a focusable, named region so keyboard users
 * can scroll it and the page never overflows. Text stays selectable; the copy button copies the
 * loaded portion only.
 *
 * Truncation is never conflated (ADR-0011 §5):
 * - `display`  → 「仅显示部分输出」 + `onLoadMore` / `onOpenFull` (only rendered when given);
 * - `execution` → 「工具输出已达上限，结果本身被截断」: nothing more exists to load.
 *
 * `status: 'loading'` shows a skeleton inside an `aria-busy` container; `unavailable` says so
 * instead of pretending the output is empty. No motion of its own.
 */
export type ToolOutputProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  output: ToolOutputView;
  /** Heading text; defaults to the kind label (「终端输出」, 「JSON」…). */
  label?: React.ReactNode;
  /** Name of the scroll region; defaults to the label text. */
  regionLabel?: string;
  /** Load the next display chunk (`truncated: 'display'`). */
  onLoadMore?: () => void;
  /** Open the full output elsewhere (`truncated: 'display'`). */
  onOpenFull?: () => void;
  /** Busy state for `onLoadMore`. */
  loadingMore?: boolean;
  /** Replace the clipboard write (tests, host clipboards). */
  onCopyText?: (text: string) => void | Promise<void>;
  /** Hide the copy button. */
  copyable?: boolean;
};

export const ToolOutput = React.forwardRef<HTMLElement, ToolOutputProps>(function ToolOutput(
  { output, label, regionLabel, onLoadMore, onOpenFull, loadingMore, onCopyText, copyable = true, className, ...rest },
  ref,
) {
  const m = useAgentMessages().tools;
  const fmt = useAgentFormat();
  const noticeId = React.useId();
  const kind = output.kind;
  const heading = label ?? (kind === 'empty' ? m.outputLabel : m.outputKind[kind]);
  const name = regionLabel ?? (typeof heading === 'string' ? heading : m.outputLabel);
  const loading = output.status === 'loading';
  const unavailable = output.status === 'unavailable';
  const raw = output.content ?? '';
  const text = kind === 'json' ? prettyJson(raw) : raw;
  const empty = kind === 'empty' || (!loading && !unavailable && raw === '' && !output.error);

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="rl-agent-output__loading" aria-busy="true">
        <Skeleton shape="text" lines={3} />
        <span className="rl-agent-sr">{m.outputLoading}</span>
      </div>
    );
  } else if (unavailable) {
    body = <p className="rl-agent-output__placeholder">{output.error ?? m.outputUnavailable}</p>;
  } else if (empty) {
    body = <p className="rl-agent-output__placeholder">{m.emptyOutput}</p>;
  } else if (kind === 'list') {
    const items = text.split('\n').filter((line) => line.trim() !== '');
    body = (
      <div className="rl-agent-output__scroll" role="region" tabIndex={0} aria-label={name}>
        <ul className="rl-agent-output__list">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    );
  } else {
    body = (
      <div className="rl-agent-output__scroll" role="region" tabIndex={0} aria-label={name}>
        {kind === 'error' && output.error && <p className="rl-agent-output__error">{output.error}</p>}
        {text !== '' && (
          <pre className="rl-agent-output__pre" data-wrap={kind === 'text' || kind === 'error' || undefined}>
            <code>{text}</code>
          </pre>
        )}
      </div>
    );
  }

  const showCopy = copyable && !loading && !unavailable && !empty && text !== '';

  return (
    <div
      {...rest}
      ref={ref as React.Ref<HTMLDivElement>}
      role="group"
      className={cx('rl-agent-output', className)}
      data-kind={kind}
      data-status={output.status}
      data-truncated={output.truncated}
      aria-label={name}
    >
      <header className="rl-agent-output__header">
        <span className="rl-agent-output__kind">{heading}</span>
        {output.summary && <span className="rl-agent-output__summary">{output.summary}</span>}
        {output.total != null && output.totalUnit && (
          <span className="rl-agent-output__total">{m.outputTotal(fmt.number(output.total), output.totalUnit)}</span>
        )}
        {output.status === 'partial' && !output.truncated && <span className="rl-agent-output__total">{m.outputStreaming}</span>}
        {showCopy && <CopyButton text={text} onCopyText={onCopyText} className="rl-agent-output__copy" />}
      </header>
      {kind !== 'error' && output.error && !unavailable && <Notice tone="danger">{output.error}</Notice>}
      {body}
      {output.truncated === 'display' && (
        <Notice
          tone="info"
          id={noticeId}
          action={
            (onLoadMore || onOpenFull) && (
              <>
                {onLoadMore && (
                  <ActionButton icon="arrow-down" onClick={onLoadMore} busy={loadingMore} describedBy={noticeId}>
                    {m.loadMore}
                  </ActionButton>
                )}
                {onOpenFull && (
                  <ActionButton icon="external" onClick={onOpenFull} describedBy={noticeId}>
                    {m.openFull}
                  </ActionButton>
                )}
              </>
            )
          }
        >
          {m.truncatedDisplay}
        </Notice>
      )}
      {output.truncated === 'execution' && <Notice tone="warning">{m.truncatedExecution}</Notice>}
    </div>
  );
});
