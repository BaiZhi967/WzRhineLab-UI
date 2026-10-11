'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Alert, Button, Callout, Checkbox, CheckboxGroup, IconButton, Radio, RadioGroup, Textarea, useRhineMotion } from '@wzrhine/react';
import { codePointLength, isStaleRevision } from '@wzrhine/agent-core';
import type { AgentActionContext, AgentActionHandler, QuestionAnswer, QuestionnaireView, QuestionView } from '@wzrhine/agent-core';
import { AgentStatus } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import type { AgentInterventionMessages } from '../../provider/messages/intervention.js';
import { cx } from '../../utils/cx.js';
import { useActionLock } from './action-lock.js';
import { answerState, answerText, isOverLimit, isQuestionOptional, normalizeAnswers } from './questionnaire-answers.js';
import type { QuestionAnswerState } from './questionnaire-answers.js';

/**
 * Agent → user questionnaire (atlas 21, ADR-0011 §6). Collects information only: it never grants
 * tool permissions.
 *
 * Data: `questionnaire.answers` is the host's draft. The card keeps a local mirror so typing
 * stays responsive and reports every change with `onAnswerChange(answer)` (the host persists).
 * The mirror is replaced by the props only when `questionnaire.revision` becomes newer (or the
 * questionnaire id changes); an older revision is ignored (`isStaleRevision`), so a late
 * snapshot never rolls the draft back.
 *
 * Submitting emits `onSubmit(answers, { actionId, targetId: id, baseRevision: revision })` with
 * normalised answers (unanswered optional questions become `skipped`). Unanswered optional
 * questions ask for an inline confirmation (`role="alert"`); unanswered required ones block.
 * `unknown` keeps the same answers and revision: 「重试提交相同答案」 re-sends the stored answers
 * with the same `actionId` (after a remount it uses `receipt.actionId`).
 * `completed` / `expired` / `interrupted` render a read-only summary.
 *
 * Keyboard (form level; ignored while an IME composes):
 * - `1`…`n` choose option n, `n+1` toggles 「其他」 (not while typing in a textarea);
 * - `Enter` → next question, or submit on the last (not in a textarea, not on a button);
 * - `←` / `→` page (not in a textarea); `Ctrl/⌘ + Enter` submits from anywhere;
 * - after paging, focus moves to the first control of the new page.
 *
 * Motion: the question body slides in on a single axis (`x` + opacity, `fast`) from the paging
 * direction; reduced motion switches instantly. The dock entrance belongs to the caller.
 */
export interface QuestionnaireCardHandle {
  /** Ask the host to persist the current answers now (e.g. before closing the page). */
  flush: () => void | Promise<void>;
  /** Focus the first control of the current page. */
  focus: () => void;
}

export interface QuestionnaireCardProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children' | 'title'> {
  questionnaire: QuestionnaireView;
  onAnswerChange?: (answer: QuestionAnswer) => void;
  onSubmit?: AgentActionHandler<[QuestionAnswer[], AgentActionContext]>;
  /** Shown with a failed draft save. */
  onRetrySave?: () => void;
  /** Called by the `flush()` handle with the current answers. */
  onFlush?: (answers: QuestionAnswer[]) => void | Promise<void>;
  /** Read-only summary: copy the answers as plain text (host writes the clipboard). */
  onCopyAnswers?: (text: string) => void;
  /** Header title override (default: `questionnaire.title` or 「需要你的回答」). */
  title?: React.ReactNode;
  /** Start on this page instead of the first unanswered question. */
  initialPage?: number;
}

const CUSTOM = '__rl_agent_custom__';
const EDITABLE = new Set(['waiting', 'drafting', 'saving']);
const READ_ONLY = new Set(['completed', 'expired', 'interrupted']);

type Mirror = { id: string; revision: string; answers: Map<string, QuestionAnswer> };

const toMap = (answers: readonly QuestionAnswer[]) => new Map(answers.map((a) => [a.questionId, a]));

function isComposing(event: React.KeyboardEvent) {
  return event.nativeEvent.isComposing || event.keyCode === 229;
}

function summaryText(questions: readonly QuestionView[], answers: Map<string, QuestionAnswer>, m: AgentInterventionMessages, interrupted: boolean) {
  return questions
    .map((q) => {
      const a = answers.get(q.id);
      const text = answerText(q, a, m.questionJoin);
      const value = a?.skipped ? m.questionSummarySkipped : (text ?? (interrupted ? m.questionSummaryUnansweredInterrupted : m.questionSummaryUnanswered));
      return `${q.title}\n${value}`;
    })
    .join('\n\n');
}

/** Read-only answers for completed / expired / interrupted questionnaires. */
function Summary({
  questionnaire,
  answers,
  title,
  onCopyAnswers,
  className,
  rest,
}: {
  questionnaire: QuestionnaireView;
  answers: Map<string, QuestionAnswer>;
  title: React.ReactNode;
  onCopyAnswers?: (text: string) => void;
  className?: string;
  rest: React.HTMLAttributes<HTMLElement>;
}) {
  const m = useAgentMessages().intervention;
  const id = React.useId();
  const status = questionnaire.status as 'completed' | 'expired' | 'interrupted';
  const interrupted = status === 'interrupted';
  const tone = status === 'completed' ? 'success' : interrupted ? 'warning' : 'neutral';
  return (
    <section {...rest} className={cx('rl-agent-question', className)} aria-labelledby={`${id}-title`} data-status={status} data-readonly="">
      <header className="rl-agent-question__header">
        <AgentIcon name="question" className="rl-agent-question__icon" />
        <h3 id={`${id}-title`} className="rl-agent-question__title">
          {title}
        </h3>
        <AgentStatus glyph={status === 'completed' ? 'done' : 'stopped'} tone={tone} label={m.questionStatus[status]} />
      </header>
      <p className="rl-agent-question__summary-title">{m.questionSummaryTitle[status]}</p>
      <dl className="rl-agent-question__summary">
        {questionnaire.questions.map((q) => {
          const a = answers.get(q.id);
          const text = answerText(q, a, m.questionJoin);
          const state = a?.skipped ? 'skipped' : text ? 'answered' : 'unanswered';
          return (
            <div key={q.id} className="rl-agent-question__summary-row" data-state={state}>
              <dt>{q.title}</dt>
              <dd>
                {state === 'skipped'
                  ? m.questionSummarySkipped
                  : (text ?? (interrupted ? m.questionSummaryUnansweredInterrupted : m.questionSummaryUnanswered))}
              </dd>
            </div>
          );
        })}
      </dl>
      {onCopyAnswers && (
        <div className="rl-agent-question__footer">
          <Button size="sm" variant="secondary" iconStart={<AgentIcon name="copy" />} onClick={() => onCopyAnswers(summaryText(questionnaire.questions, answers, m, interrupted))}>
            {m.questionCopy}
          </Button>
        </div>
      )}
    </section>
  );
}

function firstControl(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  return (
    root.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]:not([aria-disabled="true"])') ??
    root.querySelector<HTMLElement>('[role="radio"]:not([aria-disabled="true"]), [role="checkbox"]:not([aria-disabled="true"]), textarea:not([disabled])') ??
    root.querySelector<HTMLElement>('button:not([disabled])')
  );
}

export const QuestionnaireCard = React.forwardRef<QuestionnaireCardHandle, QuestionnaireCardProps>(function QuestionnaireCard(
  { questionnaire, onAnswerChange, onSubmit, onRetrySave, onFlush, onCopyAnswers, title, initialPage, className, ...rest },
  ref,
) {
  const m = useAgentMessages().intervention;
  const { reduced, resolve } = useRhineMotion();
  const id = React.useId();
  const { questions, status, revision } = questionnaire;
  const total = questions.length;
  const formRef = React.useRef<HTMLFormElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // ----- local mirror; never rolls back to an older revision -----
  const [mirror, setMirror] = React.useState<Mirror>(() => ({ id: questionnaire.id, revision, answers: toMap(questionnaire.answers) }));
  let current = mirror;
  if (mirror.id !== questionnaire.id || (revision !== mirror.revision && !isStaleRevision(mirror.revision, revision))) {
    current = { id: questionnaire.id, revision, answers: toMap(questionnaire.answers) };
    setMirror(current);
  }
  const answers = current.answers;

  const [page, setPage] = React.useState(() => {
    if (initialPage != null) return Math.max(0, Math.min(total - 1, initialPage));
    const first = questions.findIndex((q) => answerState(q, questionnaire.answers.find((a) => a.questionId === q.id)) === 'unanswered');
    return Math.max(0, first);
  });
  const index = Math.max(0, Math.min(total - 1, page));
  const [direction, setDirection] = React.useState(0);
  const [confirming, setConfirming] = React.useState<null | 'skip' | 'required' | 'limit'>(null);
  const focusAfterPaging = React.useRef(false);
  const lastSubmit = React.useRef<{ answers: QuestionAnswer[]; ctx: AgentActionContext } | null>(null);
  const lock = useActionLock(`${questionnaire.id}:${revision}:${status}:${questionnaire.submitStatus}`);

  React.useImperativeHandle(
    ref,
    () => ({
      flush: () => onFlush?.([...answers.values()]),
      focus: () => firstControl(bodyRef.current)?.focus(),
    }),
    [answers, onFlush],
  );

  // The confirmation replaces the footer the user just activated: move focus to its safe action.
  const backRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (confirming) backRef.current?.focus();
  }, [confirming]);

  React.useEffect(() => {
    if (!focusAfterPaging.current) return;
    focusAfterPaging.current = false;
    firstControl(bodyRef.current)?.focus();
  }, [index]);

  const heading = title ?? questionnaire.title ?? m.questionTitle;

  if (READ_ONLY.has(status)) {
    return <Summary questionnaire={questionnaire} answers={answers} title={heading} onCopyAnswers={onCopyAnswers} className={className} rest={rest} />;
  }

  const busy = status === 'submit-pending' || questionnaire.submitStatus === 'submitting' || lock.locked;
  const editable = EDITABLE.has(status) && !busy && !!onAnswerChange;
  const unknown = status === 'unknown' || questionnaire.submitStatus === 'unknown';
  const question = questions[index];
  const states: QuestionAnswerState[] = questions.map((q) => answerState(q, answers.get(q.id)));
  const answeredCount = states.filter((s) => s === 'answered').length;
  const last = index === total - 1;

  const update = (q: QuestionView, next: QuestionAnswer) => {
    if (!editable) return;
    setConfirming(null);
    setMirror((prev) => {
      const map = new Map(prev.answers);
      map.set(q.id, next);
      return { ...prev, answers: map };
    });
    onAnswerChange?.(next);
  };

  const go = (next: number) => {
    const target = Math.max(0, Math.min(total - 1, next));
    if (target === index) return;
    setDirection(target > index ? 1 : -1);
    setConfirming(null);
    focusAfterPaging.current = true;
    setPage(target);
  };

  const send = (list: QuestionAnswer[], ctx: AgentActionContext) => {
    if (!onSubmit) return;
    lock.run(() => {
      lastSubmit.current = { answers: list, ctx };
      return onSubmit(list, ctx);
    });
  };

  const submit = (force = false) => {
    if (busy || !onSubmit) return;
    if (unknown) {
      retry();
      return;
    }
    const result = normalizeAnswers(questions, answers);
    if (result.missing.length) {
      setConfirming('required');
      return;
    }
    if (result.overLimit.length) {
      setConfirming('limit');
      return;
    }
    const unanswered = states.filter((s) => s === 'unanswered').length;
    if (unanswered > 0 && !force) {
      setConfirming('skip');
      return;
    }
    setConfirming(null);
    send(result.answers, { actionId: lock.nextActionId(), targetId: questionnaire.id, baseRevision: revision });
  };

  const retry = () => {
    const prev = lastSubmit.current;
    if (prev) {
      send(prev.answers, prev.ctx);
      return;
    }
    const actionId = questionnaire.receipt?.actionId;
    if (!actionId) return;
    send(normalizeAnswers(questions, answers).answers, { actionId, targetId: questionnaire.id, baseRevision: revision });
  };
  const canRetry = unknown && !!onSubmit && questionnaire.receipt?.retryable !== false && (!!lastSubmit.current || !!questionnaire.receipt?.actionId);

  const backToFirstOpen = () => {
    const missing = confirming === 'required' ? questions.findIndex((q, i) => !isQuestionOptional(q) && states[i] === 'unanswered') : -1;
    const over = confirming === 'limit' ? questions.findIndex((q) => isOverLimit(q, answers.get(q.id))) : -1;
    const open = missing >= 0 ? missing : over >= 0 ? over : states.findIndex((s) => s === 'unanswered');
    setConfirming(null);
    if (open >= 0 && open !== index) go(open);
    else window.requestAnimationFrame?.(() => firstControl(bodyRef.current)?.focus());
  };

  // ----- question body -----
  const answer = question ? answers.get(question.id) : undefined;
  const skipped = answer?.skipped === true;
  const customOn = question?.kind !== 'text' && question?.allowCustom === true && typeof answer?.text === 'string';
  const options = question?.options ?? [];

  const choose = (optionId: string) => {
    if (!question) return;
    if (question.kind === 'single') update(question, { questionId: question.id, optionIds: [optionId] });
    else {
      const ids = answer?.optionIds ?? [];
      const nextIds = ids.includes(optionId) ? ids.filter((x) => x !== optionId) : [...ids, optionId];
      update(question, { questionId: question.id, optionIds: nextIds, ...(customOn ? { text: answer?.text } : null) });
    }
  };
  const toggleCustom = (on: boolean) => {
    if (!question) return;
    if (question.kind === 'single') update(question, on ? { questionId: question.id, optionIds: [], text: answer?.text ?? '' } : { questionId: question.id, optionIds: [] });
    else update(question, { questionId: question.id, optionIds: answer?.optionIds ?? [], ...(on ? { text: answer?.text ?? '' } : null) });
  };
  const setText = (text: string) => {
    if (!question) return;
    if (question.kind === 'text') update(question, { questionId: question.id, text });
    else update(question, { questionId: question.id, optionIds: question.kind === 'single' ? [] : (answer?.optionIds ?? []), text });
  };
  const toggleSkip = () => {
    if (!question) return;
    if (skipped) update(question, { questionId: question.id });
    else {
      update(question, { questionId: question.id, skipped: true });
      if (!last) go(index + 1);
    }
  };

  const focusCustomInput = () => window.requestAnimationFrame?.(() => bodyRef.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus());

  // ----- keyboard -----
  const isTextField = (target: EventTarget) => target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type !== 'checkbox' && target.type !== 'radio');

  const onKeyDownCapture = (event: React.KeyboardEvent<HTMLFormElement>) => {
    // ← / → page; ↑ / ↓ keep moving inside a radio group (ARIA radio pattern).
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (isComposing(event) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isTextField(event.target) || total < 2) return;
    event.preventDefault();
    event.stopPropagation();
    go(index + (event.key === 'ArrowRight' ? 1 : -1));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (isComposing(event) || !question) return;
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit(confirming === 'skip');
      return;
    }
    if (isTextField(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter') {
      // Buttons keep their own Enter activation.
      if (event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      if (last) submit(confirming === 'skip');
      else go(index + 1);
      return;
    }
    if (!editable || skipped || question.kind === 'text' || !/^[1-9]$/.test(event.key)) return;
    const digit = Number(event.key);
    if (digit <= options.length) {
      event.preventDefault();
      choose(options[digit - 1]!.id);
    } else if (digit === options.length + 1 && question.allowCustom) {
      event.preventDefault();
      toggleCustom(!customOn);
      if (!customOn) focusCustomInput();
    }
  };

  const titleId = `${id}-title`;
  const promptId = `${id}-prompt`;
  const countId = `${id}-count`;
  const hintId = `${id}-hint`;
  const count = answer?.text != null ? codePointLength(answer.text) : 0;
  const over = question ? isOverLimit(question, answer) : false;
  const unansweredCount = states.filter((s) => s === 'unanswered').length;
  const requiredMissing = questions.filter((q, i) => !isQuestionOptional(q) && states[i] === 'unanswered').length;

  const kbd = (n: number) => (
    <kbd className="rl-agent-question__kbd" aria-hidden="true">
      {n}
    </kbd>
  );

  const textInput = question && (question.kind === 'text' || customOn) && !skipped && (
    <div className="rl-agent-question__text">
      <Textarea
        rows={question.kind === 'text' ? 3 : 2}
        autoResize
        maxRows={8}
        value={answer?.text ?? ''}
        disabled={!editable}
        placeholder={m.questionPlaceholder}
        invalid={over}
        aria-label={question.kind === 'text' ? question.title : m.questionOtherInput(question.title)}
        aria-describedby={[question.kind === 'text' && question.prompt ? promptId : undefined, question.maxLength != null ? countId : undefined].filter(Boolean).join(' ') || undefined}
        onValueChange={(value) => setText(value)}
      />
      {question.maxLength != null && (
        <span id={countId} className="rl-agent-question__count" data-over={over || undefined}>
          {m.questionCount(count, question.maxLength)}
        </span>
      )}
    </div>
  );

  let body: React.ReactNode = null;
  if (question) {
    if (skipped) {
      body = (
        <fieldset className="rl-agent-question__fieldset" disabled={!editable}>
          <legend className="rl-agent-question__legend">{question.title}</legend>
          {question.prompt && <p className="rl-agent-question__prompt">{question.prompt}</p>}
          <p className="rl-agent-question__skipped">{m.questionSkipped}</p>
        </fieldset>
      );
    } else if (question.kind === 'text') {
      body = (
        <fieldset className="rl-agent-question__fieldset">
          <legend className="rl-agent-question__legend">
            {question.title}
            {!isQuestionOptional(question) && <span className="rl-agent-question__required">{m.questionRequired}</span>}
          </legend>
          {question.prompt && (
            <p id={promptId} className="rl-agent-question__prompt">
              {question.prompt}
            </p>
          )}
          {textInput}
        </fieldset>
      );
    } else if (question.kind === 'single') {
      body = (
        <>
          <RadioGroup
            className="rl-agent-question__group"
            label={question.title}
            required={!isQuestionOptional(question)}
            description={question.prompt}
            disabled={!editable}
            value={customOn ? CUSTOM : (answer?.optionIds?.[0] ?? null)}
            onValueChange={(value: unknown) => {
              if (value === CUSTOM) {
                toggleCustom(true);
              } else if (typeof value === 'string') choose(value);
            }}
          >
            {options.map((option, i) => (
              <Radio key={option.id} value={option.id} label={<>{kbd(i + 1)}{option.label}</>} description={option.description} />
            ))}
            {question.allowCustom && <Radio value={CUSTOM} label={<>{kbd(options.length + 1)}{m.questionOther}</>} description={m.questionOtherDescription} />}
          </RadioGroup>
          {textInput}
        </>
      );
    } else {
      const ids = answer?.optionIds ?? [];
      body = (
        <>
          <CheckboxGroup
            className="rl-agent-question__group"
            label={question.title}
            required={!isQuestionOptional(question)}
            description={question.prompt}
            disabled={!editable}
            value={customOn ? [...ids, CUSTOM] : ids}
            onValueChange={(next) => {
              const nextCustom = next.includes(CUSTOM);
              const nextIds = next.filter((x) => x !== CUSTOM);
              update(question, { questionId: question.id, optionIds: nextIds, ...(nextCustom ? { text: answer?.text ?? '' } : null) });
            }}
          >
            {options.map((option, i) => (
              <Checkbox key={option.id} value={option.id} label={<>{kbd(i + 1)}{option.label}</>} description={option.description} />
            ))}
            {question.allowCustom && <Checkbox value={CUSTOM} label={<>{kbd(options.length + 1)}{m.questionOther}</>} description={m.questionOtherDescription} />}
          </CheckboxGroup>
          {textInput}
        </>
      );
    }
  }

  const draftText = m.questionDraft[questionnaire.draftStatus];
  const statusMeta =
    busy ? { glyph: 'pending' as const, tone: 'info' as const, active: true } : unknown ? { glyph: 'unknown' as const, tone: 'warning' as const } : { glyph: 'waiting-user' as const, tone: 'warning' as const };

  return (
    <form
      {...rest}
      ref={formRef}
      className={cx('rl-agent-question', className)}
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      data-status={status}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit(confirming === 'skip');
      }}
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={onKeyDown}
    >
      <header className="rl-agent-question__header">
        <AgentIcon name="question" className="rl-agent-question__icon" />
        <h3 id={titleId} className="rl-agent-question__title">
          {heading}
        </h3>
        <span className="rl-agent-question__progress">{m.questionProgress(answeredCount, total)}</span>
        <AgentStatus glyph={statusMeta.glyph} tone={statusMeta.tone} active={statusMeta.active} label={busy ? m.questionStatus['submit-pending'] : m.questionStatus[unknown ? 'unknown' : status]} />
      </header>

      {total > 1 && (
        <nav className="rl-agent-question__pager" aria-label={m.questionPager}>
          <IconButton size="sm" variant="ghost" icon={<AgentIcon name="chevron-left" />} label={m.questionPagePrev} disabled={index === 0} onClick={() => go(index - 1)} />
          <ol className="rl-agent-question__dots">
            {questions.map((q, i) => (
              <li key={q.id}>
                <button
                  type="button"
                  className="rl-agent-question__dot"
                  data-state={states[i]}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={m.questionDot(i + 1, states[i]!)}
                  onClick={() => go(i)}
                />
              </li>
            ))}
          </ol>
          <span className="rl-agent-question__page-no" aria-hidden="true">
            {m.questionPageNo(index + 1, total)}
          </span>
          <IconButton size="sm" variant="ghost" icon={<AgentIcon name="chevron-right" />} label={m.questionPageNext} disabled={last} onClick={() => go(index + 1)} />
        </nav>
      )}

      <div ref={bodyRef} className="rl-agent-question__viewport">
        <motion.div
          key={question?.id ?? 'empty'}
          className="rl-agent-question__page"
          initial={direction === 0 ? false : { x: reduced ? 0 : direction * 12, opacity: reduced ? 1 : 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ x: resolve('transform', 'fast'), opacity: resolve('opacity', 'fast') }}
        >
          {body}
        </motion.div>
      </div>

      {unknown && (
        <Callout tone="warning" title={m.questionUnknownTitle} className="rl-agent-question__unknown">
          {questionnaire.receipt?.reason ?? m.questionUnknownBody}
        </Callout>
      )}
      {questionnaire.submitStatus === 'rejected' && !unknown && (
        <Alert tone="danger" title={m.questionRejected}>
          {questionnaire.receipt?.reason}
        </Alert>
      )}

      <div className="rl-agent-question__draft" role="status">
        {draftText && (
          <span className="rl-agent-question__draft-text" data-draft={questionnaire.draftStatus}>
            {questionnaire.draftStatus === 'saved' && <AgentIcon name="check" />}
            {questionnaire.draftStatus === 'error' && <AgentIcon name="warning" />}
            {draftText}
          </span>
        )}
        {busy && <span className="rl-agent-sr">{m.questionSubmitting}</span>}
      </div>
      {questionnaire.draftStatus === 'error' && onRetrySave && (
        <div className="rl-agent-question__draft-retry">
          <Button size="sm" variant="ghost" iconStart={<AgentIcon name="retry" />} onClick={onRetrySave}>
            {m.questionRetrySave}
          </Button>
        </div>
      )}

      <footer className="rl-agent-question__footer">
        {confirming ? (
          <div className="rl-agent-question__confirm">
            <p role="alert" className="rl-agent-question__confirm-text">
              <AgentIcon name="warning" />
              {confirming === 'skip'
                ? m.questionConfirm(unansweredCount)
                : confirming === 'required'
                  ? m.questionRequiredMissing(requiredMissing)
                  : m.questionOverLimit(questions.find((q) => isOverLimit(q, answers.get(q.id)))?.title ?? '')}
            </p>
            <div className="rl-agent-question__actions">
              <Button ref={backRef} size="sm" variant="secondary" onClick={backToFirstOpen}>
                {m.questionBack}
              </Button>
              {confirming === 'skip' && (
                <Button size="sm" variant="accent" loading={busy} onClick={() => submit(true)}>
                  {m.questionSkipAndSubmit}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <span id={hintId} className="rl-agent-question__hint">
              {question?.kind === 'text' ? m.questionHintText : m.questionHintChoice(last)}
            </span>
            <div className="rl-agent-question__actions">
              {question && isQuestionOptional(question) && onAnswerChange && !unknown && (
                <Button size="sm" variant="ghost" disabled={!editable} onClick={toggleSkip}>
                  {skipped ? m.questionUndoSkip : m.questionSkip}
                </Button>
              )}
              {!last && (
                <Button size="sm" variant="secondary" onClick={() => go(index + 1)}>
                  {m.questionNext}
                </Button>
              )}
              {onSubmit &&
                (unknown ? (
                  canRetry && (
                    <Button type="submit" size="sm" variant="primary" loading={busy} iconStart={<AgentIcon name="retry" />}>
                      {m.questionRetrySubmit}
                    </Button>
                  )
                ) : (
                  <Button type="submit" size="sm" variant="accent" loading={busy} disabled={!EDITABLE.has(status) && !busy}>
                    {m.questionSubmit}
                  </Button>
                ))}
            </div>
          </>
        )}
      </footer>
    </form>
  );
});
