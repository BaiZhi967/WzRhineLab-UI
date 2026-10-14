import { codePointLength } from '@wzrhine/agent-core';
import type { QuestionAnswer, QuestionView } from '@wzrhine/agent-core';

/**
 * Pure answer helpers for QuestionnaireCard (ADR-0011 §6). No React; safe for adapters.
 *
 * Encoding of the custom "other" answer inside `QuestionAnswer` (the contract has no extra flag):
 * - `text === undefined` → the custom option is not selected;
 * - `text` is a string (possibly empty) → the custom option is selected and `text` is its content.
 * For `single` questions a selected custom answer clears `optionIds`, and choosing an option clears `text`.
 * For `text` questions `text` is the answer itself.
 */

export type QuestionAnswerState = 'answered' | 'skipped' | 'unanswered';

/** Questions are optional unless `optional === false`. */
export const isQuestionOptional = (question: QuestionView) => question.optional !== false;

/** `single` / `multiple` are the built-in choice kinds; anything else (incl. `text` and custom
 * kinds, ADR-0013 §4) answers through free text and/or renderer-owned option ids. */
export const isChoiceQuestion = (question: QuestionView) => question.kind === 'single' || question.kind === 'multiple';

/** Built-in kinds with their own controls; any other string is a custom kind. */
export const isKnownQuestionKind = (question: QuestionView) => isChoiceQuestion(question) || question.kind === 'text';

/** Code-point length of the free text is over `maxLength`. */
export function isOverLimit(question: QuestionView, answer: QuestionAnswer | undefined): boolean {
  if (question.maxLength == null || answer?.text == null) return false;
  return codePointLength(answer.text) > question.maxLength;
}

export function answerState(question: QuestionView, answer: QuestionAnswer | undefined): QuestionAnswerState {
  if (!answer) return 'unanswered';
  if (answer.skipped) return 'skipped';
  const hasText = typeof answer.text === 'string' && answer.text.trim() !== '';
  if (question.kind === 'text') return hasText ? 'answered' : 'unanswered';
  if (!isKnownQuestionKind(question)) {
    // Custom kinds own their answer shape: any option id or text counts (nothing is filtered out).
    return hasText || (answer.optionIds ?? []).length > 0 ? 'answered' : 'unanswered';
  }
  const known = new Set((question.options ?? []).map((o) => o.id));
  const hasOption = (answer.optionIds ?? []).some((id) => known.has(id));
  return hasOption || (question.allowCustom === true && hasText) ? 'answered' : 'unanswered';
}

/**
 * The answers to submit: answered questions normalised (unknown option ids and an unselected
 * custom text dropped), explicitly skipped and unanswered optional questions as `skipped: true`.
 * Unanswered required questions are returned in `missing` and must block submission.
 */
export function normalizeAnswers(
  questions: readonly QuestionView[],
  answers: ReadonlyMap<string, QuestionAnswer> | readonly QuestionAnswer[],
): { answers: QuestionAnswer[]; missing: string[]; overLimit: string[] } {
  const map = answers instanceof Map ? answers : new Map((answers as readonly QuestionAnswer[]).map((a) => [a.questionId, a]));
  const out: QuestionAnswer[] = [];
  const missing: string[] = [];
  const overLimit: string[] = [];
  for (const question of questions) {
    const answer = map.get(question.id);
    const state = answerState(question, answer);
    if (state === 'answered' && isOverLimit(question, answer)) overLimit.push(question.id);
    if (state === 'answered') {
      const next: QuestionAnswer = { questionId: question.id };
      if (question.kind === 'text') {
        next.text = answer!.text;
      } else if (!isKnownQuestionKind(question)) {
        // Custom kinds keep their answer verbatim; the custom renderer owns the shape.
        if (answer!.optionIds !== undefined) next.optionIds = [...answer!.optionIds];
        if (typeof answer!.text === 'string') next.text = answer!.text;
      } else {
        const known = new Set((question.options ?? []).map((o) => o.id));
        const ids = (answer!.optionIds ?? []).filter((id: string) => known.has(id));
        const custom = question.allowCustom === true && typeof answer!.text === 'string' && answer!.text.trim() !== '';
        if (question.kind === 'single' && custom) {
          next.optionIds = [];
          next.text = answer!.text;
        } else {
          next.optionIds = question.kind === 'single' ? ids.slice(0, 1) : ids;
          if (custom && question.kind === 'multiple') next.text = answer!.text;
        }
      }
      out.push(next);
    } else if (state === 'skipped' || isQuestionOptional(question)) {
      out.push({ questionId: question.id, skipped: true });
    } else {
      missing.push(question.id);
    }
  }
  return { answers: out, missing, overLimit };
}

/** Human-readable answer of one question; `null` when there is none (caller picks the label). */
export function answerText(question: QuestionView, answer: QuestionAnswer | undefined, join: string): string | null {
  if (!answer || answer.skipped) return null;
  const parts: string[] = [];
  if (question.kind !== 'text') {
    for (const option of question.options ?? []) if (answer.optionIds?.includes(option.id)) parts.push(option.label);
  }
  if (typeof answer.text === 'string' && answer.text.trim() !== '') parts.push(answer.text);
  return parts.length ? parts.join(join) : null;
}
