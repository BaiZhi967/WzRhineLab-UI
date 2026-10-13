'use client';

import * as React from 'react';
import { Button, Collapsible, IconButton } from '@wzrhine/react';
import { terminalStatusMeta } from '@wzrhine/agent-core';
import type { AgentActionHandler, TerminalView } from '@wzrhine/agent-core';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentStatus, statusProps } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { isTerminalReadOnly } from './PersistentTerminal.js';
import { useWorkspaceMessages } from './shared.js';
import type { WorkspaceMessagesProp } from './shared.js';
import type { TerminalGroupKey } from '../../provider/messages/workspace.js';

export type TerminalRowProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  terminal: TerminalView;
  /** Opens the terminal (row button). Without it the row is plain text. */
  onOpen?: (terminal: TerminalView) => void;
  /** Stop action; a separate button, drawn only when the terminal is stoppable. */
  onStop?: AgentActionHandler<[terminal: TerminalView, context: { actionId: string }]>;
  /** Marks the open terminal (`aria-current`). */
  current?: boolean;
  messages?: WorkspaceMessagesProp;
};

/**
 * TerminalRow (atlas 23): sidebar summary of one terminal. Opening and stopping are two separate
 * buttons (never nested). The long cwd is truncated visually, the full path is in the title and
 * in the open button's description. Read-only rows say so in text, not only by missing controls.
 * Motion: none beyond the colour transitions of the buttons.
 */
export const TerminalRow = React.forwardRef<HTMLDivElement, TerminalRowProps>(function TerminalRow(
  { terminal, onOpen, onStop, current, messages: override, className, ...rest },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const status = useAgentMessages().status;
  const id = React.useId();
  const descId = `${id}-desc`;
  const readOnly = isTerminalReadOnly(terminal);
  const meta = terminalStatusMeta[terminal.status];
  const receiptPending = terminal.receipt?.status === 'submitting' || terminal.receipt?.status === 'accepted';
  const receiptUnknown = terminal.receipt?.status === 'unknown' && terminal.receipt.retryable !== false;
  const receiptUnretryable = terminal.receipt?.status === 'unknown' && terminal.receipt.retryable === false;
  const canStop = Boolean(onStop) && Boolean(terminal.stoppable) && !readOnly && !meta.settled && !receiptPending && !receiptUnretryable && terminal.status !== 'stop-pending' && terminal.status !== 'closing';

  const name = (
    <>
      <span className="rl-agent-terminal-row__name">{terminal.name}</span>
      {terminal.backend && <span className="rl-agent-terminal-row__backend">{m.terminalBackend[terminal.backend]}</span>}
    </>
  );
  const description = (
    <span id={descId} className="rl-agent-terminal-row__detail">
      {terminal.lastCommand && (
        <span className="rl-agent-terminal-row__command" title={terminal.lastCommand}>
          <span className="rl-agent-sr">{m.terminalLastCommand} </span>
          {terminal.lastCommand}
        </span>
      )}
      {terminal.cwd && (
        <span className="rl-agent-terminal-row__cwd" title={terminal.cwd}>
          <span className="rl-agent-sr">{m.terminalCwd} </span>
          {terminal.cwd}
        </span>
      )}
      {terminal.source && <span className="rl-agent-terminal-row__source">{terminal.source}</span>}
      {terminal.activity && <span className="rl-agent-terminal-row__activity">{terminal.activity}</span>}
      {terminal.tail && <span className="rl-agent-terminal-row__tail" title={terminal.tail}>{terminal.tail}</span>}
      {terminal.receipt && terminal.receipt.status !== 'idle' && <span className="rl-agent-terminal-row__receipt" data-status={terminal.receipt.status}>{status.action[terminal.receipt.status]}{terminal.receipt.reason ? ` · ${terminal.receipt.reason}` : ''}</span>}
      <span className="rl-agent-terminal-row__meta">
        {terminal.calls !== undefined && <span>{m.terminalCalls(terminal.calls)}</span>}
        {readOnly && <span className="rl-agent-terminal-row__readonly">{m.terminalReadOnlyDescription}</span>}
      </span>
    </span>
  );

  return (
    <div
      {...rest}
      ref={ref}
      className={cx('rl-agent-terminal-row', className)}
      data-status={terminal.status}
      data-readonly={readOnly || undefined}
      data-current={current || undefined}
    >
      <div className="rl-agent-terminal-row__main">
        {onOpen ? (
          <button
            type="button"
            className="rl-agent-terminal-row__open"
            aria-label={m.terminalOpen(terminal.name)}
            aria-describedby={descId}
            aria-current={current ? 'true' : undefined}
            onClick={() => onOpen(terminal)}
          >
            {name}
          </button>
        ) : (
          <span className="rl-agent-terminal-row__title">{name}</span>
        )}
        <AgentStatus className="rl-agent-terminal-row__status" {...statusProps(meta, status.terminal[terminal.status])} />
        {canStop && (
          <IconButton size="sm" variant="ghost" icon={<AgentIcon name={receiptUnknown ? 'retry' : 'stop'} />} label={receiptUnknown ? m.terminalRetryStop : m.terminalStop(terminal.name)} onClick={() => void onStop!(terminal, { actionId: receiptUnknown ? (terminal.receipt?.actionId ?? `${terminal.id}:stop`) : `${terminal.id}:stop` })} />
        )}
      </div>
      {description}
    </div>
  );
});

/** Which TerminalList group a terminal belongs to. Inherited first, then status. */
export function terminalGroup(terminal: TerminalView): TerminalGroupKey {
  if (isTerminalReadOnly(terminal)) return 'inherited';
  if (terminal.status === 'unknown') return 'unknown';
  if (terminal.status === 'ended' || terminal.status === 'failed') return 'ended';
  return 'open';
}

const GROUP_ORDER: TerminalGroupKey[] = ['open', 'unknown', 'ended', 'inherited'];

export type TerminalListProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  terminals: TerminalView[];
  currentId?: string;
  onOpen?: TerminalRowProps['onOpen'];
  onStop?: TerminalRowProps['onStop'];
  /** `false` hides the 「加载更多终端」 button even when `onLoadMore` is given. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Groups collapsed on first render (uncontrolled per group). Default: inherited. */
  defaultCollapsed?: TerminalGroupKey[];
  messages?: WorkspaceMessagesProp;
  loading?: boolean;
  error?: React.ReactNode;
  onRetry?: () => void;
  empty?: React.ReactNode;
  loadingMore?: boolean;
  total?: number;
};

/**
 * Terminals grouped into 未关闭 / 状态待确认 / 已结束 / 继承记录, each a Collapsible with a count.
 * Within a group the given order is kept: a status flicker moves a row between groups at most,
 * never reshuffles a group. Empty groups are not drawn.
 */
export function TerminalList({
  terminals,
  currentId,
  onOpen,
  onStop,
  hasMore,
  onLoadMore,
  defaultCollapsed = ['inherited'],
  messages: override,
  loading = false,
  error,
  onRetry,
  empty,
  loadingMore = false,
  total,
  className,
  ...rest
}: TerminalListProps) {
  const m = useWorkspaceMessages(override);
  const groups = React.useMemo(() => {
    const map = new Map<TerminalGroupKey, TerminalView[]>();
    const seen = new Set<string>();
    for (const terminal of terminals) {
      if (seen.has(terminal.id)) continue;
      seen.add(terminal.id);
      const key = terminalGroup(terminal);
      map.set(key, [...(map.get(key) ?? []), terminal]);
    }
    return GROUP_ORDER.filter((key) => map.has(key)).map((key) => ({ key, items: map.get(key)! }));
  }, [terminals]);

  return (
    <div {...rest} className={cx('rl-agent-terminal-list', className)} role="group" aria-label={m.terminalList}>
      {loading && <p role="status">{m.terminalLoading}</p>}
      {error && <p role="alert">{error}{onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>{m.retry}</Button>}</p>}
      {!loading && !error && total !== undefined && <p className="rl-agent-terminal-list__total" aria-live="polite">{terminals.length} / {total}</p>}
      {!loading && !error && groups.length === 0 && <p className="rl-agent-terminal-list__empty">{empty ?? m.terminalEmpty}</p>}
      {groups.map(({ key, items }) => (
        <Collapsible
          key={key}
          className="rl-agent-terminal-list__group"
          data-group={key}
          defaultOpen={!defaultCollapsed.includes(key)}
          trigger={
            <>
              <span className="rl-agent-terminal-list__label">{m.terminalGroup[key]}</span>
              <span className="rl-agent-terminal-list__count">{items.length}</span>
            </>
          }
        >
          <ul className="rl-agent-terminal-list__items">
            {items.map((terminal) => (
              <li key={terminal.id}>
                <TerminalRow terminal={terminal} onOpen={onOpen} onStop={onStop} current={terminal.id === currentId} messages={override} />
              </li>
            ))}
          </ul>
        </Collapsible>
      ))}
      {hasMore !== false && onLoadMore && (
        <Button size="sm" variant="ghost" loading={loadingMore} className="rl-agent-terminal-list__more" onClick={onLoadMore}>
          {total !== undefined ? `${m.terminalLoadMore} (${total})` : m.terminalLoadMore}
        </Button>
      )}
    </div>
  );
}
