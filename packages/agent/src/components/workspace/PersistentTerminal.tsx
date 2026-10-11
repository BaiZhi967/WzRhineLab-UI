'use client';

import * as React from 'react';
import { Button, Input, Tab, TabList, TabPanel, Tabs } from '@wzrhine/react';
import { terminalStatusMeta } from '@wzrhine/agent-core';
import type { AgentActionHandler, AgentTone, MaterialPageView, StatusGlyphName, TerminalSessionStatus, TerminalView } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { ChunkPager } from '../tools/ChunkPager.js';
import type { ChunkPagerActions } from '../tools/ChunkPager.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { AgentStatus, statusProps } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { Heading, useWorkspaceMessages } from './shared.js';
import type { HeadingLevel, WorkspaceMessagesProp } from './shared.js';

/** Statuses in which the session accepts input. */
const INPUT_STATUSES: TerminalSessionStatus[] = ['running', 'waiting-input'];
/** Statuses in which a stop request still makes sense. */
const STOP_STATUSES: TerminalSessionStatus[] = ['opening', 'running', 'waiting-input', 'idle', 'unknown'];

/** Inherited / read-only terminals are history only: no input, no stop. */
export function isTerminalReadOnly(terminal: TerminalView): boolean {
  return Boolean(terminal.readOnly || terminal.inherited);
}

/** Distance from the bottom (in CSS pixels) that still counts as "following" the output. */
const FOLLOW_SLACK = 8;

export type PersistentTerminalProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onInput'> & {
  terminal: TerminalView;
  /** Sends one line to the session. Without it (or when read-only) no input line is drawn. */
  onInput?: AgentActionHandler<[text: string, terminal: TerminalView]>;
  /** Requests a stop. Drawn only when `terminal.stoppable`. Also used by 「重试停止」. */
  onStop?: AgentActionHandler<[terminal: TerminalView]>;
  /** Loads older output (`terminal.outputTruncated`). The scroll position is kept. */
  onLoadEarlier?: AgentActionHandler<[terminal: TerminalView]>;
  /** Reads the newest output (`terminal.newerOutput`); draws 「有新输出，读取最新」. */
  onReadLatest?: AgentActionHandler<[terminal: TerminalView]>;
  /** Loads earlier entries of `terminal.history`. */
  onLoadMoreHistory?: AgentActionHandler<[terminal: TerminalView]>;
  /** One page of stored output; replaces the live tail with a `ChunkPager`. */
  page?: MaterialPageView;
  /** Paging callbacks for `page` (`canGoBack` defaults to false). */
  pager?: Partial<ChunkPagerActions>;
  headingLevel?: HeadingLevel;
  /** Hide the name heading (e.g. inside `TerminalTabs`, where the tab already names it). */
  hideName?: boolean;
  messages?: WorkspaceMessagesProp;
};

/**
 * PersistentTerminal (atlas 22): one terminal session with its own lifecycle. A command
 * returning never closes the session (`idle` says so); a stop request shows 「停止尚未确认」 until
 * the adapter confirms it; `unknown` is never shown as ended.
 *
 * Accessibility: the console is `role="log"` with `aria-live="off"`, so streamed chunks are never
 * read out one by one; the session status sits in a polite `role="status"` instead. The console
 * is focusable for keyboard scrolling. The input is a labelled single-line field; Enter sends,
 * except while an IME composition is active.
 *
 * `terminal.newerOutput` (the loaded snapshot is older than the session) adds 「有新输出，读取最新」
 * (`onReadLatest`); `terminal.notes` render as small notes; `terminal.history` is an ordered list
 * 「调用记录」 (command, glyph + status text, exit code, `<time>`) with `onLoadMoreHistory`. With
 * `page` the stored output is read through a `ChunkPager` instead of the live tail.
 *
 * Motion: none. The cursor is a static block; the console follows new output only while the
 * reader is at the bottom, otherwise a 「有新输出」 button appears.
 */
export const PersistentTerminal = React.forwardRef<HTMLElement, PersistentTerminalProps>(function PersistentTerminal(
  {
    terminal,
    onInput,
    onStop,
    onLoadEarlier,
    onReadLatest,
    onLoadMoreHistory,
    page,
    pager,
    headingLevel = 3,
    hideName = false,
    messages: override,
    className,
    ...rest
  },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const status = useAgentMessages().status;
  const id = React.useId();
  const nameId = `${id}-name`;
  const readOnly = isTerminalReadOnly(terminal);
  const meta = terminalStatusMeta[terminal.status];
  const canInput = Boolean(onInput) && !readOnly && INPUT_STATUSES.includes(terminal.status);
  const canStop = Boolean(onStop) && Boolean(terminal.stoppable) && !readOnly;
  const stopPending = terminal.status === 'stop-pending';
  const settled = terminal.status === 'ended' || terminal.status === 'failed';

  return (
    <section
      {...rest}
      ref={ref}
      className={cx('rl-agent-terminal', className)}
      aria-labelledby={nameId}
      data-status={terminal.status}
      data-readonly={readOnly || undefined}
    >
      <header className="rl-agent-terminal__header">
        <AgentIcon name="terminal" className="rl-agent-terminal__icon" />
        <div className="rl-agent-terminal__identity">
          <Heading level={headingLevel} id={nameId} className={hideName ? 'rl-agent-sr' : 'rl-agent-terminal__name'}>
            {terminal.name}
          </Heading>
          <span className="rl-agent-terminal__id">{terminal.id}</span>
          {terminal.backend && <span className="rl-agent-terminal__backend">{m.terminalBackend[terminal.backend]}</span>}
          {terminal.shell && <span className="rl-agent-terminal__shell">{terminal.shell}</span>}
        </div>
        <span role="status" className="rl-agent-terminal__status">
          <AgentStatus {...statusProps(meta, status.terminal[terminal.status])} />
          {settled && terminal.exitCode !== undefined && <span className="rl-agent-terminal__exit">{m.terminalExitCode(terminal.exitCode)}</span>}
        </span>
        {canStop && !stopPending && STOP_STATUSES.includes(terminal.status) && (
          <Button
            size="sm"
            variant="secondary"
            className="rl-agent-terminal__stop"
            iconStart={<AgentIcon name="stop" />}
            aria-label={m.terminalStop(terminal.name)}
            onClick={() => void onStop!(terminal)}
          >
            {m.terminalStopVisible}
          </Button>
        )}
      </header>
      {terminal.cwd && (
        <p className="rl-agent-terminal__cwd" title={terminal.cwd}>
          <span className="rl-agent-terminal__cwd-label">{m.terminalCwd}</span>
          <span className="rl-agent-terminal__cwd-path">{terminal.cwd}</span>
        </p>
      )}
      {readOnly && (
        <p className="rl-agent-terminal__notice" data-tone="neutral">
          <AgentIcon name="history" />
          {m.terminalReadOnly}
        </p>
      )}
      {stopPending && (
        <div className="rl-agent-terminal__notice" data-tone="warning">
          <AgentIcon name="warning" />
          <span>{m.terminalStopPending}</span>
          {canStop && (
            <Button size="sm" variant="ghost" iconStart={<AgentIcon name="retry" />} onClick={() => void onStop!(terminal)}>
              {m.terminalRetryStop}
            </Button>
          )}
        </div>
      )}
      {terminal.status === 'unknown' && (
        <p className="rl-agent-terminal__notice" data-tone="warning">
          <AgentIcon name="warning" />
          {m.terminalUnknownNotice}
        </p>
      )}
      {terminal.status === 'idle' && !readOnly && (
        <p className="rl-agent-terminal__notice" data-tone="neutral">
          <AgentIcon name="info" />
          {m.terminalIdleNotice}
        </p>
      )}
      {terminal.receipt && (terminal.receipt.status === 'rejected' || terminal.receipt.status === 'unknown') && (
        <p className="rl-agent-terminal__notice" data-tone={terminal.receipt.status === 'rejected' ? 'danger' : 'warning'}>
          <AgentIcon name="warning" />
          {status.action[terminal.receipt.status]}
          {terminal.receipt.reason ? ` · ${terminal.receipt.reason}` : ''}
        </p>
      )}
      {terminal.notes && terminal.notes.length > 0 && (
        <ul className="rl-agent-terminal__notes" aria-label={m.terminalNotes}>
          {terminal.notes.map((note, i) => (
            <li key={i} className="rl-agent-terminal__note">
              <AgentIcon name="info" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
      {terminal.newerOutput && onReadLatest && (
        <div className="rl-agent-terminal__latest">
          <Button size="sm" variant="secondary" iconStart={<AgentIcon name="arrow-down" />} onClick={() => void onReadLatest(terminal)}>
            {m.terminalReadLatest}
          </Button>
        </div>
      )}
      {page ? (
        <ChunkPager {...pager} className="rl-agent-terminal__pager" page={page} label={m.terminalOutput(terminal.name)} canGoBack={pager?.canGoBack ?? false} />
      ) : (
        <TerminalConsole terminal={terminal} messages={m} onLoadEarlier={onLoadEarlier} showCursor={canInput} />
      )}
      {canInput && <TerminalInput terminal={terminal} onInput={onInput!} messages={m} />}
      {terminal.history && terminal.history.length > 0 && (
        <TerminalHistory terminal={terminal} onLoadMore={onLoadMoreHistory} messages={m} />
      )}
    </section>
  );
});

function TerminalConsole({
  terminal,
  messages: m,
  onLoadEarlier,
  showCursor,
}: {
  terminal: TerminalView;
  messages: ReturnType<typeof useWorkspaceMessages>;
  onLoadEarlier?: PersistentTerminalProps['onLoadEarlier'];
  showCursor: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const following = React.useRef(true);
  const anchorFromBottom = React.useRef<number | null>(null);
  const [hasNew, setHasNew] = React.useState(false);
  const output = terminal.output ?? '';

  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (anchorFromBottom.current !== null) {
      // Older output was prepended: keep the same lines under the reader's eyes.
      el.scrollTop = el.scrollHeight - anchorFromBottom.current;
      anchorFromBottom.current = null;
      return;
    }
    if (following.current) el.scrollTop = el.scrollHeight;
    else setHasNew(true);
  }, [output]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_SLACK;
    following.current = atBottom;
    if (atBottom) setHasNew(false);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    following.current = true;
    setHasNew(false);
    if (el) el.scrollTop = el.scrollHeight;
    el?.focus();
  };

  const loadEarlier = () => {
    const el = scrollRef.current;
    if (el) anchorFromBottom.current = el.scrollHeight - el.scrollTop;
    void onLoadEarlier?.(terminal);
  };

  return (
    <div className="rl-agent-terminal__console-wrap">
      {(terminal.outputTruncated || terminal.partialCapture) && (
        <div className="rl-agent-terminal__console-meta">
          {terminal.outputTruncated && onLoadEarlier && (
            <Button size="sm" variant="ghost" iconStart={<AgentIcon name="arrow-up" />} onClick={loadEarlier}>
              {m.terminalLoadEarlier}
            </Button>
          )}
          {terminal.partialCapture && (
            <span className="rl-agent-terminal__partial">
              <AgentIcon name="warning" />
              {m.terminalPartialCapture}
            </span>
          )}
        </div>
      )}
      <div
        ref={scrollRef}
        className="rl-agent-terminal__console"
        role="log"
        aria-live="off"
        aria-label={m.terminalOutput(terminal.name)}
        tabIndex={0}
        onScroll={onScroll}
      >
        {output ? (
          <pre className="rl-agent-terminal__output">
            {output}
            {showCursor && <span className="rl-agent-terminal__cursor" aria-hidden="true" />}
          </pre>
        ) : (
          <p className="rl-agent-terminal__empty">{m.terminalNoOutput}</p>
        )}
      </div>
      {hasNew && (
        <Button size="sm" variant="secondary" className="rl-agent-terminal__new" iconStart={<AgentIcon name="arrow-down" />} onClick={jumpToLatest}>
          {m.terminalNewOutput}
        </Button>
      )}
    </div>
  );
}

const historyGlyph: Record<NonNullable<TerminalView['history']>[number]['status'], { glyph: StatusGlyphName; tone: AgentTone }> = {
  running: { glyph: 'active', tone: 'info' },
  returned: { glyph: 'done', tone: 'success' },
  failed: { glyph: 'failed', tone: 'danger' },
  unknown: { glyph: 'unknown', tone: 'warning' },
};

function TerminalHistory({
  terminal,
  onLoadMore,
  messages: m,
}: {
  terminal: TerminalView;
  onLoadMore?: PersistentTerminalProps['onLoadMoreHistory'];
  messages: ReturnType<typeof useWorkspaceMessages>;
}) {
  const format = useAgentFormat();
  const id = React.useId();
  const items = terminal.history ?? [];
  return (
    <section className="rl-agent-terminal__history" aria-labelledby={`${id}-title`}>
      <p id={`${id}-title`} className="rl-agent-terminal__history-title">
        {m.terminalHistory}
      </p>
      {onLoadMore && (
        <Button size="sm" variant="ghost" className="rl-agent-terminal__history-more" iconStart={<AgentIcon name="arrow-up" />} onClick={() => void onLoadMore(terminal)}>
          {m.terminalHistoryLoadMore}
        </Button>
      )}
      <ol className="rl-agent-terminal__history-list">
        {items.map((item) => {
          const g = historyGlyph[item.status] ?? historyGlyph.unknown;
          return (
            <li key={item.id} className="rl-agent-terminal__history-item" data-status={item.status}>
              <code className="rl-agent-terminal__history-command" title={item.command}>
                {item.command}
              </code>
              <span className="rl-agent-terminal__history-status" data-tone={g.tone}>
                <StatusGlyph name={g.glyph} tone={g.tone} />
                <span>{m.terminalHistoryStatus[item.status] ?? m.terminalHistoryStatus.unknown}</span>
              </span>
              {item.exitCode !== undefined && <span className="rl-agent-terminal__history-exit">{m.terminalExitCode(item.exitCode)}</span>}
              {item.at && (
                <time className="rl-agent-terminal__history-time" dateTime={item.at}>
                  {format.time(item.at)}
                </time>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TerminalInput({
  terminal,
  onInput,
  messages: m,
}: {
  terminal: TerminalView;
  onInput: NonNullable<PersistentTerminalProps['onInput']>;
  messages: ReturnType<typeof useWorkspaceMessages>;
}) {
  const [draft, setDraft] = React.useState('');
  const composing = React.useRef(false);
  const inputId = React.useId();

  const send = () => {
    const text = draft;
    setDraft('');
    void onInput(text, terminal);
  };

  return (
    <form
      className="rl-agent-terminal__input"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label htmlFor={inputId} className="rl-agent-sr">
        {m.terminalInputLabel(terminal.name)}
      </label>
      <span className="rl-agent-terminal__prompt" aria-hidden="true">
        &gt;
      </span>
      <Input
        id={inputId}
        size="sm"
        mono
        className="rl-agent-terminal__field"
        value={draft}
        placeholder={m.terminalInputPlaceholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.currentTarget.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== 'Enter') return;
          // IME guard (ADR-0011 §8): composition flag, native isComposing and keyCode 229.
          if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          send();
        }}
      />
      <Button type="submit" size="sm" variant="secondary" className="rl-agent-terminal__send" iconStart={<AgentIcon name="send" />}>
        {m.terminalSend}
      </Button>
    </form>
  );
}

export type TerminalTabsProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onInput' | 'defaultValue'> & {
  terminals: TerminalView[];
  /** Active terminal id (controlled). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  onInput?: PersistentTerminalProps['onInput'];
  onStop?: PersistentTerminalProps['onStop'];
  onLoadEarlier?: PersistentTerminalProps['onLoadEarlier'];
  onReadLatest?: PersistentTerminalProps['onReadLatest'];
  onLoadMoreHistory?: PersistentTerminalProps['onLoadMoreHistory'];
  headingLevel?: HeadingLevel;
  messages?: WorkspaceMessagesProp;
};

/**
 * Several terminals as tabs (Tabs from `@wzrhine/react`: roving focus, arrow keys, Home / End).
 * Each tab names the terminal and its status, so the status is readable without opening it.
 */
export function TerminalTabs({
  terminals,
  value,
  defaultValue,
  onValueChange,
  onInput,
  onStop,
  onLoadEarlier,
  onReadLatest,
  onLoadMoreHistory,
  headingLevel,
  messages: override,
  className,
  ...rest
}: TerminalTabsProps) {
  const m = useWorkspaceMessages(override);
  const status = useAgentMessages().status;
  if (terminals.length === 0) {
    return (
      <p {...rest} className={cx('rl-agent-terminal-tabs__empty', className)}>
        {m.terminalEmpty}
      </p>
    );
  }
  return (
    <div {...rest} className={cx('rl-agent-terminal-tabs', className)}>
      <Tabs value={value} defaultValue={value === undefined ? (defaultValue ?? terminals[0]!.id) : undefined} onValueChange={onValueChange} size="sm">
        <TabList aria-label={m.terminalTabs}>
          {terminals.map((terminal) => (
            <Tab key={terminal.id} value={terminal.id} meta={status.terminal[terminal.status]}>
              {terminal.name}
            </Tab>
          ))}
        </TabList>
        {terminals.map((terminal) => (
          <TabPanel key={terminal.id} value={terminal.id} className="rl-agent-terminal-tabs__panel">
            <PersistentTerminal
              terminal={terminal}
              onInput={onInput}
              onStop={onStop}
              onLoadEarlier={onLoadEarlier}
              onReadLatest={onReadLatest}
              onLoadMoreHistory={onLoadMoreHistory}
              headingLevel={headingLevel}
              hideName
              messages={override}
            />
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
