'use client';

import * as React from 'react';
import { Button, useRhineMotion } from '@wzrhine/react';
import { codePointLength, toPlainText } from '@wzrhine/agent-core';
import type {
  ActionReceipt,
  ActionStatus,
  AttachmentView,
  CommandOption,
  ComposerToken,
  DraftStatus,
  MentionOption,
  ReferenceView,
  RunStatus,
  SendInput,
  TriggerMatch,
} from '@wzrhine/agent-core';
import { canStopRun } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { AttachmentList } from './AttachmentList.js';
import { ComposerInput } from './ComposerInput.js';
import type { ComposerInputHandle, ComposerTokenKind } from './ComposerInput.js';
import {
  defaultMentionTokenName,
  drillQuery,
  filterCommandOptions,
  filterMentionOptions,
  menuOptionId,
  moveActiveIndex,
  orderCommandOptions,
} from './composer-utils.js';
import { MentionMenu } from './MentionMenu.js';
import { SendStopButton } from './SendStopButton.js';
import { SlashCommandMenu } from './SlashCommandMenu.js';

export type ComposerProps = {
  // ---------- text ----------
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  submitOn?: 'enter' | 'mod-enter';
  slash?: 'line-start' | 'word-start';
  /** Shows a character counter and blocks sending above the limit (code points of the plain text). */
  maxLength?: number;
  /** Show the counter without a limit. */
  showCount?: boolean;
  /** A token disappeared from the text (whole-token delete, cut, overwrite): unbind its reference. */
  onTokenRemoved?: (token: ComposerToken) => void;
  tokenKind?: (token: ComposerToken) => ComposerTokenKind;

  // ---------- send / stop ----------
  /** Receives the plain text (`@name` / `/name`), the raw value with markers, references and attachments. */
  onSubmit?: (input: SendInput) => void;
  /** Allow sending when the text is empty if at least one attachment/reference exists. */
  allowEmptyText?: boolean;
  /** Receipt of the last send. `submitting` / `unknown` block Enter and the button (no duplicates). */
  submitStatus?: ActionStatus | ActionReceipt;
  runStatus?: RunStatus;
  onStop?: () => void;
  stopStatus?: ActionStatus | ActionReceipt;
  /** Retry an `unknown` send / stop with its original actionId (ADR-0011 §4). */
  onRetryAction?: (kind: 'send' | 'stop', actionId: string | undefined) => void;
  /** Extra condition for sending (e.g. a model must be selected), with its reason. */
  canSend?: boolean;
  sendDisabledReason?: string;

  // ---------- draft ----------
  draftStatus?: DraftStatus;
  onRetryDraftSave?: () => void;
  persistence?: DraftStatus | 'idle';
  onRetryPersistence?: () => void;
  retryBusy?: boolean;

  // ---------- references & attachments ----------
  references?: readonly ReferenceView[];
  attachments?: readonly AttachmentView[];
  onRemoveReference?: (reference: ReferenceView) => void;
  onRemoveAttachment?: (attachment: AttachmentView) => void;
  onRetryAttachment?: (attachment: AttachmentView) => void;
  /** Files dropped on the frame (drag-over highlight while dragging). No callback → no drop zone. */
  onFilesDrop?: (files: File[]) => void;
  /** Files pasted into the textarea. Text paste is untouched. */
  onFilesPaste?: (files: File[]) => void;

  // ---------- @ mentions ----------
  /** Enables the `@` menu. Filtered locally unless `onMentionQuery` is given (then the host filters). */
  mentionOptions?: readonly MentionOption[];
  mentionLoading?: boolean;
  mentionError?: React.ReactNode;
  onMentionRetry?: () => void;
  /** Query typed after `@` while the menu is open; `null` when it closes. */
  onMentionQuery?: (query: string | null) => void;
  /** Token text for a chosen option (default: drilled folder + label). */
  mentionTokenName?: (option: MentionOption, query: string) => string;
  /** A mention was inserted as a token: bind the reference. */
  onReferenceAdd?: (option: MentionOption, tokenName: string) => void;
  /** A folder was drilled into (the query is already rewritten to `folder/`). */
  onMentionDrill?: (option: MentionOption) => void;

  // ---------- / commands ----------
  /** Enables the `/` menu (commands first, then skills). Filtered locally unless `onCommandQuery` is given. */
  commandOptions?: readonly CommandOption[];
  commandLoading?: boolean;
  onCommandQuery?: (query: string | null) => void;
  /**
   * A command or skill was chosen. Return `'insert'` to replace the typed `/query` with a token;
   * otherwise the typed query is removed and the host dispatches its own action.
   */
  onCommand?: (option: CommandOption, match: TriggerMatch) => 'insert' | void;
  /** A disabled command was chosen: nothing is dispatched; its reason shows in the feedback line. */
  onDisabledCommand?: (option: CommandOption, match: TriggerMatch) => 'consume' | void;

  // ---------- states & slots ----------
  disabled?: boolean;
  /** Why the composer is disabled (feedback line). */
  disabledReason?: string;
  readOnly?: boolean;
  /**
   * Input blocked by a pending intervention (e.g. a questionnaire): the textarea becomes read-only
   * and `aria-disabled`, the reason replaces the placeholder and shows in the feedback line.
   * `true` uses the default copy ("请先在上方回答问题").
   */
  blocked?: boolean | string;
  /** Approval / questionnaire cards docked above the frame (height animates via grid rows). */
  intervention?: React.ReactNode;
  /**
   * Rendered instead of the input frame, menus and feedback line, e.g. a `ComposerNotice` for a
   * sub-agent, archived or inherited thread. The `intervention` slot stays above it, so approvals
   * and questions still dock. The draft value is kept and comes back when `replacement` is removed.
   */
  replacement?: React.ReactNode;
  /** Toolbar start (e.g. a "+" Menu: 添加图片 / 引用文件 / 使用技能). */
  toolbarStart?: React.ReactNode;
  /** Toolbar end before the send button (ModelPicker, PermissionPicker, context ring). */
  toolbarEnd?: React.ReactNode;
  /** Extra feedback content after the status text. */
  feedback?: React.ReactNode;
  /** Side the menus open on. */
  menuSide?: 'top' | 'bottom';
  className?: string;
  id?: string;
};

function receiptStatus(input: ActionStatus | ActionReceipt | undefined): ActionStatus | undefined {
  if (input === undefined) return undefined;
  return typeof input === 'string' ? input : input.status;
}

/** Esc memory: the trigger position and the whole word typed there (`@src/comp`). */
interface DismissedMenu {
  trigger: string;
  from: number;
  word: string;
}

/** The trigger word starting at `from` (up to the next whitespace), independent of the caret. */
const wordAt = (value: string, from: number) => /^\S*/.exec(value.slice(from))![0];
const sameDismissed = (d: DismissedMenu, m: TriggerMatch, value: string) => d.trigger === m.trigger && d.from === m.from && d.word === wordAt(value, m.from);

/**
 * Full agent input frame (atlas 14): intervention slot, attachment / reference row, the
 * token-mirror textarea, `@` / `/` menus, toolbar slots, the send / stop button and a feedback line.
 *
 * Keyboard (textarea keeps focus throughout):
 * - Enter sends (Shift+Enter newline; `submitOn="mod-enter"` swaps them). Never while composing
 *   (IME), never while a menu consumed the key, never while the send is `submitting` / `unknown`
 *   or a run is in progress — the send / stop button shows 停止生成 instead.
 * - `@` / `/` open the menus (role="combobox" + aria-activedescendant on the textarea);
 *   ↑ / ↓ move (clamped), Enter / Tab choose, Tab / Enter on a folder drills, Esc closes and the
 *   same trigger + query stays closed until the query changes.
 *
 * States: empty, focused (frame ring via :focus-within), multiline, mentions, sending, running,
 * failed (draft kept + retry), blocked, disabled, drag-over, replaced (`replacement` stands in for
 * the frame, e.g. ComposerNotice; the intervention slot stays).
 * Motion: menus fade (MotionPresence `fade`), send / stop icons cross-fade, the intervention slot
 * expands with CSS grid rows (`--rl-motion-base`); reduced motion → instant.
 */
export const Composer = React.forwardRef<ComposerInputHandle, ComposerProps>(function Composer(
  {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    placeholder,
    'aria-label': ariaLabel,
    submitOn = 'enter',
    slash = 'line-start',
    maxLength,
    showCount = false,
    onTokenRemoved,
    tokenKind,
    onSubmit,
    allowEmptyText = false,
    submitStatus,
    runStatus,
    onStop,
    stopStatus,
    onRetryAction,
    canSend: canSendProp = true,
    sendDisabledReason,
    draftStatus,
    onRetryDraftSave,
    persistence,
    onRetryPersistence,
    retryBusy = false,
    references = [],
    attachments = [],
    onRemoveReference,
    onRemoveAttachment,
    onRetryAttachment,
    onFilesDrop,
    onFilesPaste,
    mentionOptions,
    mentionLoading = false,
    mentionError,
    onMentionRetry,
    onMentionQuery,
    mentionTokenName,
    onReferenceAdd,
    onMentionDrill,
    commandOptions,
    commandLoading = false,
    onCommandQuery,
    onCommand,
    onDisabledCommand,
    disabled = false,
    disabledReason,
    readOnly = false,
    blocked = false,
    intervention,
    replacement,
    toolbarStart,
    toolbarEnd,
    feedback,
    menuSide = 'top',
    className,
    id,
  },
  ref,
) {
  const messages = useAgentMessages().composer;
  const format = useAgentFormat();
  const { reduced } = useRhineMotion();
  const autoId = React.useId();
  const baseId = id ?? autoId;
  const inputRef = React.useRef<ComposerInputHandle>(null);
  React.useImperativeHandle(
    ref,
    (): ComposerInputHandle => ({
      focus: () => inputRef.current?.focus(),
      insertToken: (trigger, name, range) => inputRef.current?.insertToken(trigger, name, range),
      replaceRange: (from, to, text) => inputRef.current?.replaceRange(from, to, text),
      getSelection: () => inputRef.current?.getSelection() ?? { start: 0, end: 0 },
      get element() {
        return inputRef.current?.element ?? null;
      },
    }),
    [],
  );

  const [inner, setInner] = React.useState(defaultValue);
  const value = valueProp ?? inner;
  const [match, setMatch] = React.useState<TriggerMatch | null>(null);
  const [dismissed, setDismissed] = React.useState<DismissedMenu | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const dragDepth = React.useRef(0);

  // ---------- derived ----------
  const plain = React.useMemo(() => toPlainText(value), [value]);
  const count = codePointLength(plain);
  const overLimit = maxLength !== undefined && count > maxLength;
  const uploading = attachments.some((a) => a.status === 'uploading');
  const submit = receiptStatus(submitStatus);
  const sendBusy = submit === 'submitting' || submit === 'unknown';
  const running = runStatus !== undefined && (canStopRun(runStatus) || runStatus === 'cancelling');
  const blockedReason = typeof blocked === 'string' ? blocked : blocked ? messages.blockedPlaceholder : undefined;
  const replaced = replacement != null && replacement !== false;
  const inert = disabled || readOnly || blockedReason !== undefined || replaced;
  const hasPayload = plain.trim() !== '' || attachments.length > 0 || references.length > 0;
  const sendReason =
    disabled
      ? disabledReason
      : blockedReason
        ? blockedReason
        : sendBusy
          ? messages.submittingReason
          : running
            ? onStop
              ? undefined
              : messages.runningReason
              : (!allowEmptyText && plain.trim() === '') || (allowEmptyText && !hasPayload)
              ? messages.emptyReason
              : uploading
                ? messages.uploadingReason
                : overLimit
                  ? messages.overLimitReason
                  : !canSendProp
                    ? sendDisabledReason
                    : undefined;
  const canSend = onSubmit !== undefined && !inert && !sendBusy && !running && (allowEmptyText ? hasPayload : plain.trim() !== '') && !uploading && !overLimit && canSendProp && persistence !== 'error';

  // The Esc memory survives caret moves and leaving the word; editing the word (or another
  // trigger) forgets it, so the menu reopens once the query really changes.
  if (dismissed && match && !sameDismissed(dismissed, match, value)) setDismissed(null);
  const menuKind: '@' | '/' | null =
    match && !inert && !(dismissed && sameDismissed(dismissed, match, value))
      ? match.trigger === '@' && mentionOptions !== undefined
        ? '@'
        : match.trigger === '/' && commandOptions !== undefined
          ? '/'
          : null
      : null;
  const query = match?.query ?? '';
  const shownMentions = React.useMemo(
    () => (mentionOptions ? (onMentionQuery ? [...mentionOptions] : filterMentionOptions(mentionOptions, query)) : []),
    [mentionOptions, onMentionQuery, query],
  );
  const shownCommands = React.useMemo(
    () => (commandOptions ? orderCommandOptions(onCommandQuery ? commandOptions : filterCommandOptions(commandOptions, query)) : []),
    [commandOptions, onCommandQuery, query],
  );
  const menuLoading = menuKind === '@' ? mentionLoading : menuKind === '/' ? commandLoading : false;
  const menuError = menuKind === '@' && mentionError != null && mentionError !== false;
  const optionCount = menuKind === '@' ? shownMentions.length : menuKind === '/' ? shownCommands.length : 0;
  const listReady = menuKind !== null && !menuLoading && !menuError && optionCount > 0;
  const active = listReady ? Math.min(Math.max(activeIndex, 0), optionCount - 1) : -1;
  const listboxId = menuKind === '@' ? `${baseId}-mention-listbox` : `${baseId}-command-listbox`;

  // ---------- host queries ----------
  const mentionQuery = menuKind === '@' ? query : null;
  const commandQuery = menuKind === '/' ? query : null;
  const lastMentionQuery = React.useRef<string | null>(null);
  const lastCommandQuery = React.useRef<string | null>(null);
  // Layout effects: the host's filtered options must be in place before the next key event,
  // otherwise a fast Enter would choose from the previous query's list.
  React.useLayoutEffect(() => {
    if (mentionQuery === lastMentionQuery.current) return;
    lastMentionQuery.current = mentionQuery;
    onMentionQuery?.(mentionQuery);
  }, [mentionQuery, onMentionQuery]);
  React.useLayoutEffect(() => {
    if (commandQuery === lastCommandQuery.current) return;
    lastCommandQuery.current = commandQuery;
    onCommandQuery?.(commandQuery);
  }, [commandQuery, onCommandQuery]);

  // ---------- text ----------
  const handleValueChange = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const matchRef = React.useRef<TriggerMatch | null>(null);
  const handleTrigger = (next: TriggerMatch | null) => {
    const prev = matchRef.current;
    matchRef.current = next;
    if (!next || !prev || prev.trigger !== next.trigger || prev.query !== next.query) setActiveIndex(0);
    setMatch(next);
    setNotice(null);
  };

  const doSubmit = () => {
    if (!canSend || !onSubmit) return;
    onSubmit({ text: plain, raw: value, references: [...references], attachments: [...attachments] });
  };

  // ---------- menu actions ----------
  const chooseMention = (option: MentionOption, how: 'enter' | 'tab' | 'click') => {
    if (!match) return;
    if (option.disabled) {
      setNotice(messages.optionUnavailable(option.disabledReason));
      return;
    }
    if (option.drillable && (how === 'tab' || how === 'enter' || how === 'click')) {
      inputRef.current?.replaceRange(match.from + 1, match.to, drillQuery(match.query, option));
      onMentionDrill?.(option);
      return;
    }
    const name = mentionTokenName ? mentionTokenName(option, match.query) : defaultMentionTokenName(option, match.query);
    inputRef.current?.insertToken('@', name, { from: match.from, to: match.to });
    onReferenceAdd?.(option, name);
  };

  const chooseCommand = (option: CommandOption) => {
    if (!match) return;
    if (option.disabled) {
      setNotice(messages.optionUnavailable(option.disabledReason));
      if (onDisabledCommand) {
        // Preserve the original one-argument callback while enabling the richer match-aware API.
        if (onDisabledCommand.length >= 2) onDisabledCommand(option, match);
        else (onDisabledCommand as (option: CommandOption) => unknown)(option);
      }
      return;
    }
    const result = onCommand?.(option, match);
    if (result === 'insert') inputRef.current?.insertToken('/', option.name, { from: match.from, to: match.to });
    else inputRef.current?.replaceRange(match.from, match.to, '');
  };

  const handleMenuKey = (event: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (menuKind === null || !match) return false;
    if (event.key === 'Escape') {
      event.stopPropagation();
      setDismissed({ trigger: match.trigger, from: match.from, word: wordAt(value, match.from) });
      return true;
    }
    if (!listReady) return false;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      setActiveIndex(moveActiveIndex(optionCount, active, event.key === 'ArrowDown' ? 1 : -1));
      return true;
    }
    if (event.key === 'Home' && (event.ctrlKey || event.metaKey)) return false;
    const isEnter = event.key === 'Enter' && !event.shiftKey && !event.altKey;
    const isTab = event.key === 'Tab' && !event.shiftKey;
    if (!isEnter && !isTab) return false;
    if (menuKind === '@') {
      const option = shownMentions[active];
      if (option) chooseMention(option, isTab ? 'tab' : 'enter');
    } else {
      const option = shownCommands[active];
      if (option) chooseCommand(option);
    }
    return true;
  };

  // ---------- files ----------
  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');
  const dropHandlers = onFilesDrop
    ? {
        onDragEnter: (event: React.DragEvent<HTMLDivElement>) => {
          if (!hasFiles(event) || inert) return;
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        },
        onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
          if (!hasFiles(event) || inert) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        },
        onDragLeave: () => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        },
        onDrop: (event: React.DragEvent<HTMLDivElement>) => {
          dragDepth.current = 0;
          setDragging(false);
          if (!hasFiles(event) || inert) return;
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files);
          if (files.length > 0) onFilesDrop(files);
        },
      }
    : {};

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onFilesPaste || inert) return;
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length === 0) return;
    if (!event.clipboardData.types.includes('text/plain')) event.preventDefault();
    onFilesPaste(files);
  };

  // ---------- intervention slot (keeps its last content while collapsing) ----------
  const [shownIntervention, setShownIntervention] = React.useState<React.ReactNode>(intervention);
  const interventionOpen = intervention != null && intervention !== false;
  if (interventionOpen && shownIntervention !== intervention) setShownIntervention(intervention);
  // Without a transition (reduced motion: duration tokens are 0) no transitionend fires.
  if (!interventionOpen && shownIntervention != null && reduced) setShownIntervention(null);

  // ---------- feedback ----------
  let statusText: string | undefined;
  let statusTone: 'danger' | 'warning' | 'neutral' = 'neutral';
  let retry: { label: string; onClick: () => void } | undefined;
  if (notice) {
    statusText = notice;
    statusTone = 'warning';
  } else if (blockedReason) {
    statusText = blockedReason;
  } else if (disabled && disabledReason) {
    statusText = disabledReason;
  } else if (submit === 'rejected') {
    statusText = messages.submitFailed;
    statusTone = 'danger';
    if (onSubmit) retry = { label: messages.retry, onClick: doSubmit };
  } else if (submit === 'unknown') {
    statusText = messages.submitUnknown;
    statusTone = 'warning';
  } else if (draftStatus === 'error' || persistence === 'error') {
    statusText = messages.draftError;
    statusTone = 'danger';
    if (onRetryPersistence || onRetryDraftSave) retry = { label: messages.retrySave, onClick: onRetryPersistence ?? onRetryDraftSave! };
  } else if (draftStatus === 'saving') {
    statusText = messages.draftSaving;
  } else if (draftStatus === 'saved') {
    statusText = messages.draftSaved;
  }
  const counter =
    maxLength !== undefined || showCount ? messages.characters(format.number(count), maxLength !== undefined ? format.number(maxLength) : undefined) : undefined;

  const comboProps =
    mentionOptions !== undefined || commandOptions !== undefined
      ? {
          role: 'combobox' as const,
          'aria-expanded': menuKind !== null,
          // The listbox only exists with options; while loading / empty / failed the panel is controlled.
          'aria-controls': menuKind === null ? undefined : listReady ? listboxId : `${baseId}-${menuKind === '@' ? 'mention' : 'command'}-panel`,
          'aria-autocomplete': 'list' as const,
          'aria-haspopup': 'listbox' as const,
          'aria-activedescendant': listReady && active >= 0 ? menuOptionId(listboxId, active) : undefined,
        }
      : {};

  const feedbackId = `${baseId}-feedback`;

  return (
    <div
      className={cx('rl-agent-composer', className)}
      data-slot="composer"
      data-disabled={disabled || undefined}
      data-blocked={blockedReason !== undefined || undefined}
      data-running={running || undefined}
      data-replaced={replaced || undefined}
    >
      <div
        className="rl-agent-composer__intervention"
        data-open={interventionOpen || undefined}
        onTransitionEnd={(event) => {
          if (!interventionOpen && event.target === event.currentTarget) setShownIntervention(null);
        }}
      >
        <div className="rl-agent-composer__intervention-inner" inert={!interventionOpen}>
          {interventionOpen ? intervention : shownIntervention}
        </div>
      </div>
      {replaced ? (
        <div className="rl-agent-composer__replacement">{replacement}</div>
      ) : (
        <>
          <div className="rl-agent-composer__anchor">
            {mentionOptions !== undefined && (
              <MentionMenu
                id={`${baseId}-mention`}
                open={menuKind === '@'}
                query={query}
                options={shownMentions}
                activeIndex={active}
                onActiveIndexChange={setActiveIndex}
                onSelect={(option) => chooseMention(option, 'click')}
                onDrill={(option) => chooseMention(option, 'click')}
                loading={mentionLoading}
                error={mentionError}
                onRetry={onMentionRetry}
                side={menuSide}
              />
            )}
            {commandOptions !== undefined && (
              <SlashCommandMenu
                id={`${baseId}-command`}
                open={menuKind === '/'}
                query={query}
                options={shownCommands}
                activeIndex={active}
                onActiveIndexChange={setActiveIndex}
                onSelect={chooseCommand}
                onDisabledSelect={chooseCommand}
                loading={commandLoading}
                side={menuSide}
              />
            )}
            <div className="rl-agent-composer__frame" data-dragging={dragging || undefined} {...dropHandlers}>
              <AttachmentList
                className="rl-agent-composer__attachments"
                references={references}
                attachments={attachments}
                disabled={disabled || sendBusy}
                onRemove={
                  onRemoveAttachment || onRemoveReference
                    ? (item) => (item.type === 'attachment' ? onRemoveAttachment?.(item.attachment) : onRemoveReference?.(item.reference))
                    : undefined
                }
                onRetry={onRetryAttachment}
              />
              <ComposerInput
                ref={inputRef}
                {...comboProps}
                value={value}
                onValueChange={handleValueChange}
                onSubmit={onSubmit ? doSubmit : undefined}
                submitOn={submitOn}
                slash={slash}
                onMenuKey={handleMenuKey}
                onTriggerChange={handleTrigger}
                onTokenRemoved={onTokenRemoved}
                tokenKind={
                  tokenKind ??
                  ((token) =>
                    token.trigger === '@' ? 'file' : commandOptions?.some((o) => o.name === token.name && o.kind === 'skill') ? 'skill' : 'command')
                }
                disabled={disabled}
                readOnly={readOnly || blockedReason !== undefined}
                aria-disabled={blockedReason !== undefined || undefined}
                aria-label={ariaLabel}
                aria-describedby={statusText ? feedbackId : undefined}
                placeholder={blockedReason ?? placeholder}
                onPaste={handlePaste}
                className="rl-agent-composer__input"
              />
              {dragging && (
                <div className="rl-agent-composer__drop" aria-hidden="true">
                  {messages.dropFiles}
                </div>
              )}
              <div className="rl-agent-composer__toolbar">
                <div className="rl-agent-composer__tools">{toolbarStart}</div>
                <div className="rl-agent-composer__tools" data-end="">
                  {toolbarEnd}
                  <SendStopButton
                    className="rl-agent-composer__send"
                    canSend={canSend}
                    runStatus={runStatus}
                    sendReceipt={submitStatus}
                    stopReceipt={stopStatus}
                    onSend={onSubmit ? doSubmit : undefined}
                    onStop={onStop}
                    draftStatus={draftStatus ?? (persistence === 'error' ? 'error' : persistence === 'saving' ? 'saving' : undefined)}
                    onRetrySave={persistence ? (onRetryPersistence ?? onRetryDraftSave) : undefined}
                    retryBusy={retryBusy}
                    onRetry={onRetryAction}
                    disabledReason={sendReason}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="rl-agent-composer__feedback" data-tone={statusTone}>
            <p id={feedbackId} className="rl-agent-composer__status" role="status">
              {statusText}
            </p>
            {retry && (
              <Button size="sm" variant="ghost" onClick={retry.onClick}>
                {retry.label}
              </Button>
            )}
            {feedback}
            {counter && (
              <span className="rl-agent-composer__count" data-over={overLimit || undefined}>
                {counter}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
});
