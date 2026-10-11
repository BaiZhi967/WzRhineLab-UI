import * as React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { QuestionAnswer, QuestionnaireView } from '@wzrhine/agent-core';
import { QuestionnaireCard, normalizeAnswers } from '../src/index';
import type { QuestionnaireCardHandle } from '../src/index';
import { sampleQuestionnaire } from '../src/fixtures/session';

const make = (patch: Partial<QuestionnaireView> = {}): QuestionnaireView => ({ ...sampleQuestionnaire, ...patch });

/** Host with real draft persistence in state, like an adapter would do. */
function Host({ view = make(), onSubmit = vi.fn(), onAnswer }: { view?: QuestionnaireView; onSubmit?: (...args: never[]) => unknown; onAnswer?: (a: QuestionAnswer) => void }) {
  const [answers, setAnswers] = React.useState(view.answers);
  return (
    <QuestionnaireCard
      questionnaire={{ ...view, answers }}
      onAnswerChange={(a) => {
        onAnswer?.(a);
        setAnswers((prev) => [...prev.filter((x) => x.questionId !== a.questionId), a]);
      }}
      onSubmit={onSubmit as never}
    />
  );
}

const dots = () => within(screen.getByRole('navigation', { name: '问题分页' })).getAllByRole('button', { name: /^第/ });
const current = () => dots().find((d) => d.getAttribute('aria-current') === 'step');

describe('QuestionnaireCard', () => {
  it('form with title, progress, pager dots with aria-current=step and page number', () => {
    render(<Host />);
    expect(screen.getByRole('form', { name: '需要你的回答' })).toBeInTheDocument();
    expect(screen.getByText('已答 1 / 3')).toBeInTheDocument();
    expect(dots()).toHaveLength(3);
    // Opens on the first unanswered question (q1 already answered in the fixture).
    expect(current()).toHaveAccessibleName('第 2 题，未回答');
    expect(dots()[0]).toHaveAccessibleName('第 1 题，已回答');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('single choice is a radiogroup with legend + 其他 reveals a counted textarea', async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(dots()[0]!);
    const group = screen.getByRole('radiogroup', { name: '输出形式' });
    expect(within(group).getByRole('radio', { name: /表格/ })).toHaveAttribute('aria-checked', 'true');
    await user.click(within(group).getByRole('radio', { name: /其他/ }));
    const box = screen.getByRole('textbox', { name: '输出形式：其他回答' });
    await user.type(box, '图文😀');
    expect(box).toHaveValue('图文😀');
    expect(within(group).getByRole('radio', { name: /表格/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('text question counts code points against maxLength', async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(dots()[2]!);
    const box = screen.getByRole('textbox', { name: '补充说明' });
    await user.type(box, 'a😀');
    expect(screen.getByText('已输入 2 / 2000')).toBeInTheDocument();
    expect(box).toHaveAccessibleDescription(/还有需要注意的地方吗？/);
  });

  it('number keys choose options, Enter goes next, ←/→ page and focus the first control', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<Host onAnswer={onAnswer} />);
    await user.click(dots()[0]!);
    const first = screen.getByRole('radio', { name: /表格/ });
    expect(first).toHaveFocus();
    await user.keyboard('1');
    expect(onAnswer).toHaveBeenLastCalledWith({ questionId: 'q-1-a', optionIds: ['report'] });
    expect(screen.getByRole('radio', { name: /报告/ })).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('4');
    expect(screen.getByRole('textbox', { name: '输出形式：其他回答' })).toBeInTheDocument();
    screen.getByRole('radio', { name: /其他/ }).focus();
    await user.keyboard('{Enter}');
    expect(current()).toHaveAccessibleName(/第 2 题/);
    expect(screen.getAllByRole('checkbox')[0]).toHaveFocus();
    await user.keyboard('2');
    expect(onAnswer).toHaveBeenLastCalledWith({ questionId: 'q-1-b', optionIds: ['figures'] });
    await user.keyboard('{ArrowRight}');
    expect(current()).toHaveAccessibleName(/第 3 题/);
    expect(screen.getByRole('textbox', { name: '补充说明' })).toHaveFocus();
    // In a textarea ← / → move the caret, digits type.
    await user.keyboard('1{ArrowLeft}');
    expect(current()).toHaveAccessibleName(/第 3 题/);
    expect(screen.getByRole('textbox', { name: '补充说明' })).toHaveValue('1');
    screen.getByRole('button', { name: '上一页' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(current()).toHaveAccessibleName(/第 2 题/);
  });

  it('ignores shortcuts while an IME composes', () => {
    const onAnswer = vi.fn();
    render(<Host onAnswer={onAnswer} />);
    const form = screen.getByRole('form');
    fireEvent.keyDown(form, { key: '1', keyCode: 229 });
    fireEvent.keyDown(form, { key: 'Enter', isComposing: true });
    expect(onAnswer).not.toHaveBeenCalled();
    expect(current()).toHaveAccessibleName(/第 2 题/);
  });

  it('submit with unanswered asks for confirmation (role=alert) then submits them as skipped', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Host onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: '提交回答' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('还有 2 题未回答，将按跳过提交。');
    expect(screen.getByRole('button', { name: '返回填写' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: '跳过并提交' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [answers, ctx] = onSubmit.mock.calls[0]!;
    expect(answers).toEqual([{ questionId: 'q-1-a', optionIds: ['table'] }, { questionId: 'q-1-b', skipped: true }, { questionId: 'q-1-c', skipped: true }]);
    expect(ctx).toMatchObject({ targetId: 'q-1', baseRevision: '3' });
  });

  it('返回填写 goes back to the first open question', async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(dots()[2]!);
    await user.click(screen.getByRole('button', { name: '提交回答' }));
    await user.click(screen.getByRole('button', { name: '返回填写' }));
    expect(current()).toHaveAccessibleName(/第 2 题/);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('required questions block submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = make({ questions: sampleQuestionnaire.questions.map((q) => (q.id === 'q-1-b' ? { ...q, optional: false } : q)) });
    render(<Host view={view} onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: '跳过本题' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '提交回答' }));
    expect(screen.getByRole('alert')).toHaveTextContent('还有 1 道必答题未回答。');
    expect(screen.queryByRole('button', { name: '跳过并提交' })).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('skip and undo skip', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<Host onAnswer={onAnswer} />);
    await user.click(screen.getByRole('button', { name: '跳过本题' }));
    expect(onAnswer).toHaveBeenLastCalledWith({ questionId: 'q-1-b', skipped: true });
    expect(current()).toHaveAccessibleName(/第 3 题/);
    expect(dots()[1]).toHaveAccessibleName('第 2 题，已跳过');
    await user.click(dots()[1]!);
    expect(screen.getByText('已跳过此题')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '撤销跳过' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('Ctrl+Enter submits from a textarea; double submit sends once', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const all: QuestionAnswer[] = [
      { questionId: 'q-1-a', optionIds: ['table'] },
      { questionId: 'q-1-b', optionIds: ['data'] },
    ];
    render(<Host view={make({ answers: all })} onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox', { name: '补充说明' }), 'ok');
    await user.keyboard('{Control>}{Enter}{/Control}');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0]).toContainEqual({ questionId: 'q-1-c', text: 'ok' });
  });

  it('unknown: retry re-sends the same answers and actionId', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const all: QuestionAnswer[] = [
      { questionId: 'q-1-a', optionIds: ['table'] },
      { questionId: 'q-1-b', optionIds: ['data'] },
      { questionId: 'q-1-c', text: '无' },
    ];
    const { rerender } = render(<QuestionnaireCard questionnaire={make({ answers: all })} onAnswerChange={() => {}} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: '提交回答' }));
    rerender(<QuestionnaireCard questionnaire={make({ answers: all, status: 'unknown', submitStatus: 'unknown', receipt: { status: 'unknown', retryable: true } })} onAnswerChange={() => {}} onSubmit={onSubmit} />);
    expect(screen.getByText('提交结果待确认')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重试提交相同答案' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit.mock.calls[1]).toEqual(onSubmit.mock.calls[0]);
  });

  it('unknown after remount reuses receipt.actionId', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuestionnaireCard questionnaire={make({ status: 'unknown', submitStatus: 'unknown', receipt: { status: 'unknown', actionId: 'act-42', retryable: true } })} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: '重试提交相同答案' }));
    expect(onSubmit.mock.calls[0]![1]).toEqual({ actionId: 'act-42', targetId: 'q-1', baseRevision: '3' });
  });

  it('submit-pending: busy, no new submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuestionnaireCard questionnaire={make({ status: 'submit-pending', submitStatus: 'submitting' })} onAnswerChange={() => {}} onSubmit={onSubmit} />);
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');
    await user.click(screen.getByRole('button', { name: '提交回答' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute('aria-disabled', 'true');
  });

  it('never rolls back to an older revision; a newer revision resets the mirror', () => {
    const { rerender } = render(<QuestionnaireCard questionnaire={make()} onAnswerChange={() => {}} initialPage={0} />);
    expect(screen.getByRole('radio', { name: /表格/ })).toHaveAttribute('aria-checked', 'true');
    rerender(<QuestionnaireCard questionnaire={make({ revision: '5', answers: [{ questionId: 'q-1-a', optionIds: ['chart'] }] })} onAnswerChange={() => {}} initialPage={0} />);
    expect(screen.getByRole('radio', { name: /图示/ })).toHaveAttribute('aria-checked', 'true');
    rerender(<QuestionnaireCard questionnaire={make({ revision: '4', answers: [{ questionId: 'q-1-a', optionIds: ['report'] }] })} onAnswerChange={() => {}} initialPage={0} />);
    expect(screen.getByRole('radio', { name: /图示/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('local mirror keeps typing responsive when the host has not echoed yet', async () => {
    const user = userEvent.setup();
    render(<QuestionnaireCard questionnaire={make()} onAnswerChange={() => {}} initialPage={2} />);
    await user.type(screen.getByRole('textbox', { name: '补充说明' }), 'abc');
    expect(screen.getByRole('textbox', { name: '补充说明' })).toHaveValue('abc');
  });

  it('draft status line and retry save', async () => {
    const user = userEvent.setup();
    const onRetrySave = vi.fn();
    const { rerender } = render(<QuestionnaireCard questionnaire={make({ draftStatus: 'saving' })} onAnswerChange={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('正在保存草稿…');
    rerender(<QuestionnaireCard questionnaire={make({ draftStatus: 'error' })} onAnswerChange={() => {}} onRetrySave={onRetrySave} />);
    expect(screen.getByRole('status')).toHaveTextContent('草稿保存失败');
    await user.click(screen.getByRole('button', { name: '重试保存草稿' }));
    expect(onRetrySave).toHaveBeenCalled();
  });

  it('flush() hands the current answers to onFlush', async () => {
    const onFlush = vi.fn();
    const ref = React.createRef<QuestionnaireCardHandle>();
    render(<QuestionnaireCard ref={ref} questionnaire={make()} onAnswerChange={() => {}} onFlush={onFlush} />);
    await act(async () => {
      await ref.current!.flush();
    });
    expect(onFlush).toHaveBeenCalledWith(sampleQuestionnaire.answers);
  });

  it.each([
    ['completed', '已提交回答', '已跳过'],
    ['expired', '问卷已过期', '未回答'],
    ['interrupted', '运行已中断，问卷未提交', '未回答（已中断）'],
  ] as const)('%s renders a read-only summary', async (status, title, emptyLabel) => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const answers: QuestionAnswer[] =
      status === 'completed' ? [{ questionId: 'q-1-a', optionIds: ['table'] }, { questionId: 'q-1-b', skipped: true }, { questionId: 'q-1-c', skipped: true }] : [{ questionId: 'q-1-a', optionIds: ['table'] }];
    render(<QuestionnaireCard questionnaire={make({ status, answers })} onCopyAnswers={onCopy} onAnswerChange={() => {}} onSubmit={() => {}} />);
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText('表格')).toBeInTheDocument();
    expect(screen.getAllByText(emptyLabel).length).toBeGreaterThan(0);
    expect(screen.queryByRole('radio')).toBeNull();
    await user.click(screen.getByRole('button', { name: '复制回答' }));
    expect(onCopy.mock.calls[0]![0]).toContain('输出形式\n表格');
  });

  it('reduced motion: paging is instant (no transform on the page)', async () => {
    const user = userEvent.setup();
    render(
      <MotionConfig reducedMotion="always">
        <Host />
      </MotionConfig>,
    );
    await user.click(screen.getByRole('button', { name: '下一题' }));
    const page = screen.getByRole('textbox', { name: '补充说明' }).closest('.rl-agent-question__page') as HTMLElement;
    expect(page.style.transform === '' || page.style.transform === 'none').toBe(true);
    expect(page.style.opacity === '' || page.style.opacity === '1').toBe(true);
  });

  it('two cards keep separate ids and action ids', async () => {
    const user = userEvent.setup();
    const a = vi.fn();
    const b = vi.fn();
    const all: QuestionAnswer[] = [
      { questionId: 'q-1-a', optionIds: ['table'] },
      { questionId: 'q-1-b', optionIds: ['data'] },
      { questionId: 'q-1-c', text: 'x' },
    ];
    render(
      <>
        <QuestionnaireCard questionnaire={make({ answers: all })} onSubmit={a} />
        <QuestionnaireCard questionnaire={make({ answers: all, id: 'q-2' })} onSubmit={b} />
      </>,
    );
    const forms = screen.getAllByRole('form');
    expect(forms[0]!.getAttribute('aria-labelledby')).not.toBe(forms[1]!.getAttribute('aria-labelledby'));
    await user.click(within(forms[0]!).getByRole('button', { name: '提交回答' }));
    await user.click(within(forms[1]!).getByRole('button', { name: '提交回答' }));
    expect(a.mock.calls[0]![1].actionId).not.toBe(b.mock.calls[0]![1].actionId);
  });
});

describe('normalizeAnswers', () => {
  it('drops unknown ids, keeps custom text for single, marks unanswered optional as skipped', () => {
    const { answers, missing } = normalizeAnswers(sampleQuestionnaire.questions, [
      { questionId: 'q-1-a', optionIds: ['zzz'], text: '自定义' },
      { questionId: 'q-1-b', optionIds: ['data', 'nope'] },
    ]);
    expect(missing).toEqual([]);
    expect(answers).toEqual([
      { questionId: 'q-1-a', optionIds: [], text: '自定义' },
      { questionId: 'q-1-b', optionIds: ['data'] },
      { questionId: 'q-1-c', skipped: true },
    ]);
  });
});
