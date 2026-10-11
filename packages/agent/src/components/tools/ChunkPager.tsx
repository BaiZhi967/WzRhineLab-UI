'use client';

import * as React from 'react';
import type { MaterialPageView } from '@wzrhine/agent-core';
import { Skeleton } from '@wzrhine/react';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { ActionButton, Notice } from './shared.js';

/** Paging callbacks shared by every component that can show a `MaterialPageView`. */
export interface ChunkPagerActions {
  /** A previous page exists in the host's offset history (drives 「上一页」). */
  canGoBack: boolean;
  /** Back to offset 0. Enabled when the page does not start at 0. */
  onFirst?: () => void;
  onPrevious?: () => void;
  /** Next page. Enabled only when `page.nextOffset` is defined (never computed here). */
  onNext?: (nextOffset: number) => void;
  /** Retries a page that failed to load. */
  onRetry?: () => void;
  /** Newer material exists than this snapshot. */
  newer?: boolean;
  /** Drops back to the newest snapshot; draws 「读取最新」 next to the `newer` notice. */
  onReadLatest?: () => void;
}

export type ChunkPagerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
  ChunkPagerActions & {
    page: MaterialPageView;
    /** Name of the material (「终端输出」, 「旧文件内容」); names the group and the scroll region. */
    label: string;
    /** Custom renderer of the page text (highlighting); default is wrapped monospace text. */
    renderContent?: (text: string) => React.ReactNode;
  };

type Reason = string | undefined;

/**
 * ChunkPager: an honest view of one page of stored material (old file content, manifests,
 * patches, terminal output). The header says which range is shown — 「字节 0–4096 / 18200」 or
 * 「第 1–200 行 / 812」 (line and item offsets are 0-based in the contract and shown 1-based) — and
 * whether this page reaches the end (「已读至末尾」) or is a fragment (「片段」).
 *
 * Paging never invents positions: 「下一页」 is enabled only when the runtime returned
 * `nextOffset`; 「上一页」 depends on the host's offset history (`canGoBack`); 「返回开头」 needs a
 * non-zero offset. Buttons that cannot act stay focusable with `aria-disabled` and describe why
 * (title + `aria-describedby`), so keyboard and screen-reader users learn the reason too.
 *
 * Content sits in a bounded, focusable, named scroll region (pre-wrap mono). Loading shows a
 * Skeleton inside `aria-busy`; an error shows its reason plus 「重试」. Motion: none; the region
 * scrolls back to the top when a new page arrives.
 */
export const ChunkPager = React.forwardRef<HTMLDivElement, ChunkPagerProps>(function ChunkPager(
  { page, label, canGoBack, onFirst, onPrevious, onNext, onRetry, newer, onReadLatest, renderContent, className, ...rest },
  ref,
) {
  const m = useAgentMessages().tools;
  const fmt = useAgentFormat();
  const id = React.useId();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const loading = page.status === 'loading';
  const failed = page.status === 'error';

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [page.offset]);

  const oneBased = page.unit !== 'bytes';
  const start = oneBased ? page.offset + (page.length > 0 ? 1 : 0) : page.offset;
  const end = page.offset + page.length;
  const range = m.pagerRange(fmt.number(start), fmt.number(end), page.total !== undefined ? fmt.number(page.total) : undefined, page.unit);

  const busyReason: Reason = loading ? m.pagerBusy : undefined;
  const firstReason: Reason = busyReason ?? (page.offset === 0 ? m.pagerAtStart : undefined);
  const previousReason: Reason = busyReason ?? (!canGoBack ? m.pagerAtStart : undefined);
  const nextReason: Reason =
    busyReason ?? (failed ? m.pagerFailed : page.nextOffset === undefined ? (page.complete ? m.pagerAtEnd : m.pagerNoNextOffset) : undefined);

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="rl-agent-pager__loading" aria-busy="true">
        <Skeleton shape="text" lines={3} />
        <span className="rl-agent-sr">{m.pagerLoading}</span>
      </div>
    );
  } else if (failed) {
    body = (
      <Notice tone="danger" action={onRetry && <ActionButton icon="retry" onClick={onRetry}>{m.pagerRetry}</ActionButton>}>
        <span className="rl-agent-pager__error">{m.pagerError}</span>
        {page.reason && <span className="rl-agent-pager__reason">{page.reason}</span>}
      </Notice>
    );
  } else if (!page.content) {
    body = <p className="rl-agent-pager__empty">{m.pagerEmpty}</p>;
  } else {
    body = (
      <div ref={scrollRef} className="rl-agent-pager__scroll" role="region" tabIndex={0} aria-label={m.pagerRegion(label)}>
        {renderContent ? renderContent(page.content) : <pre className="rl-agent-pager__pre">{page.content}</pre>}
      </div>
    );
  }

  return (
    <div {...rest} ref={ref} role="group" aria-label={label} className={cx('rl-agent-pager', className)} data-status={page.status} data-complete={page.complete || undefined}>
      {newer && (
        <Notice tone="info" action={onReadLatest && <ActionButton icon="arrow-down" onClick={onReadLatest}>{m.pagerReadLatest}</ActionButton>}>
          {m.pagerNewer}
        </Notice>
      )}
      {!loading && !failed && (
        <p className="rl-agent-pager__header">
          <span className="rl-agent-pager__range">{range}</span>
          <span className="rl-agent-pager__extent" data-complete={page.complete || undefined}>
            {page.complete ? m.pagerComplete : m.pagerFragment}
          </span>
        </p>
      )}
      {body}
      {(onFirst || onPrevious || onNext) && (
        <div className="rl-agent-pager__nav" role="group" aria-label={m.pagerNavigation(label)}>
          {onFirst && <PagerButton id={`${id}-first`} icon="arrow-up" reason={firstReason} onClick={onFirst}>{m.pagerFirst}</PagerButton>}
          {onPrevious && <PagerButton id={`${id}-prev`} icon="chevron-left" reason={previousReason} onClick={onPrevious}>{m.pagerPrevious}</PagerButton>}
          {onNext && (
            <PagerButton id={`${id}-next`} icon="chevron-right" reason={nextReason} onClick={() => page.nextOffset !== undefined && onNext(page.nextOffset)}>
              {m.pagerNext}
            </PagerButton>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * A pager button that stays in the tab order when it cannot act: `aria-disabled` + a described
 * reason instead of the native `disabled`, which would hide both the button and its reason.
 */
function PagerButton({ id, icon, reason, onClick, children }: { id: string; icon: AgentIconName; reason: Reason; onClick: () => void; children: React.ReactNode }) {
  const reasonId = `${id}-reason`;
  const disabled = reason !== undefined;
  return (
    <>
      <button
        type="button"
        className="rl-agent-tool-button"
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? reasonId : undefined}
        title={reason}
        onClick={disabled ? undefined : onClick}
      >
        <AgentIcon name={icon} />
        <span className="rl-agent-tool-button__text">{children}</span>
      </button>
      {disabled && (
        <span id={reasonId} className="rl-agent-sr">
          {reason}
        </span>
      )}
    </>
  );
}
