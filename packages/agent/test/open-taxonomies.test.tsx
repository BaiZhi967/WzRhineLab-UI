import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ArtifactView, CitationView, ModelProviderView, QuestionView, QuestionnaireView, RecoveryView } from '@wzrhine/agent-core';
import { AgentIcon } from '../src/primitives/icons';
import { StatusGlyph } from '../src/primitives/StatusGlyph';
import { AgentMessagesProvider } from '../src/provider/AgentMessages';
import { ModelPicker, normalizeEfforts } from '../src/components/composer/ModelPicker';
import { CitationChip } from '../src/components/message/CitationChip';
import { ArtifactCard } from '../src/components/artifact/ArtifactCard';
import { ToolCategoryChip } from '../src/components/tools/shared';
import { ErrorRecoveryNotice } from '../src/components/intervention/ErrorRecoveryNotice';
import { QuestionnaireCard } from '../src/components/intervention/QuestionnaireCard';
import { answerState, isChoiceQuestion, isKnownQuestionKind, normalizeAnswers } from '../src/components/intervention/questionnaire-answers';

/**
 * ADR-0013: open taxonomies. Built-in values keep their copy / icons; custom values fall back
 * gracefully and can be labelled through props, the message tables or the view model itself.
 */

const customProviders: ModelProviderView[] = [
  {
    id: 'p',
    label: 'P',
    models: [
      {
        id: 'm1',
        label: 'm1',
        providerId: 'p',
        capabilities: ['image', 'audio-native'],
        efforts: ['low', { id: 'adaptive', label: '自适应', description: '按输入长度自动调整' }, 'deep-research'],
      },
    ],
  },
];

describe('ModelPicker custom efforts (ADR-0013 §1)', () => {
  it('normalizeEfforts accepts bare ids and labelled options', () => {
    expect(normalizeEfforts(['low', { id: 'adaptive', label: '自适应' }])).toEqual([{ id: 'low' }, { id: 'adaptive', label: '自适应' }]);
    expect(normalizeEfforts(undefined)).toEqual([]);
  });

  it('option labels and descriptions render; unlabelled ids render raw', async () => {
    const user = userEvent.setup();
    const onEffort = vi.fn();
    render(<ModelPicker providers={customProviders} selectedModel="m1" effort="adaptive" onEffortChange={onEffort} />);
    expect(screen.getByRole('button', { name: '模型：m1，思考强度：自适应' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /模型：m1/ }));
    const dialog = await screen.findByRole('dialog');
    const group = within(dialog).getByRole('radiogroup', { name: '思考强度' });
    expect(within(group).getByRole('radio', { name: '快速' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: '自适应' })).toBeChecked();
    expect(within(group).getByText('按输入长度自动调整')).toBeInTheDocument();
    // No label anywhere: the raw id is the label.
    expect(within(group).getByRole('radio', { name: 'deep-research' })).toBeInTheDocument();
    await user.click(within(group).getByRole('radio', { name: 'deep-research' }));
    expect(onEffort).toHaveBeenCalledWith('deep-research');
  });

  it('effortLabels prop beats the message table; capability tags fall back to the raw id', async () => {
    const user = userEvent.setup();
    render(<ModelPicker providers={customProviders} selectedModel="m1" effort="deep-research" effortLabels={{ 'deep-research': '深度研究' }} defaultLayer="models" defaultOpen />);
    const dialog = await screen.findByRole('dialog');
    // Custom capability tag renders its raw id.
    expect(within(dialog).getByText('audio-native')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '返回思考强度' }));
    const group = await within(dialog).findByRole('radiogroup', { name: '思考强度' });
    expect(within(group).getByRole('radio', { name: '深度研究' })).toBeChecked();
    expect(screen.getByRole('button', { name: '模型：m1，思考强度：深度研究' })).toBeInTheDocument();
  });

  it('message-table overrides merge key by key: custom labels in, built-ins kept', async () => {
    const user = userEvent.setup();
    render(
      <AgentMessagesProvider messages={{ composer: { effort: { 'deep-research': '深度研究' } } }}>
        <ModelPicker providers={customProviders} selectedModel="m1" effort="low" />
      </AgentMessagesProvider>,
    );
    await user.click(screen.getByRole('button', { name: '模型：m1，思考强度：快速' }));
    const group = await screen.findByRole('radiogroup', { name: '思考强度' });
    expect(within(group).getByRole('radio', { name: '深度研究' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: '自适应' })).toBeInTheDocument();
  });
});

describe('CitationChip custom source types (ADR-0013 §2)', () => {
  const citation: CitationView = { id: 'c1', index: 3, title: '设计稿', sourceType: 'design-tool' };

  it('custom source types render the raw id and the fallback icon', () => {
    render(<CitationChip citation={citation} showIcon />);
    const chip = screen.getByRole('button', { name: '引用 3：设计稿' });
    expect(chip).toHaveAccessibleDescription(/design-tool/);
    expect(chip.querySelector('svg')).toHaveAttribute('data-icon', 'link');
  });

  it('the icon prop replaces the built-in source icon', () => {
    render(<CitationChip citation={citation} showIcon icon={<path d="M2 2h12v12H2z" data-testid="custom-path" />} />);
    const chip = screen.getByRole('button', { name: '引用 3：设计稿' });
    expect(chip.querySelector('svg')).toHaveAttribute('data-icon', 'link');
    expect(chip.querySelector('[data-testid="custom-path"]')).toBeInTheDocument();
  });
});

describe('ArtifactCard / ToolCategoryChip / ErrorRecoveryNotice custom kinds (ADR-0013 §2)', () => {
  it('ArtifactCard renders a custom kind with its raw id and the file icon', () => {
    const artifact: ArtifactView = { id: 'a1', title: '指标看板', kind: 'dashboard', status: 'saved' };
    render(<ArtifactCard artifact={artifact} />);
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('data-kind', 'dashboard');
    expect(within(card).getByText('dashboard')).toBeInTheDocument();
    expect(card.querySelector('.rl-agent-artifact__kind-icon')).toHaveAttribute('data-icon', 'file');
  });

  it('ToolCategoryChip renders a custom category with its raw id and the other icon', () => {
    const { container } = render(<ToolCategoryChip category="browser" />);
    const chip = container.querySelector('.rl-agent-tool-chip')!;
    expect(chip).toHaveAttribute('data-category', 'browser');
    expect(chip).toHaveTextContent('browser');
    expect(chip.querySelector('svg')).toHaveAttribute('data-icon', 'tool');
  });

  it('ErrorRecoveryNotice renders a custom kind with the unknown presentation and its raw id', () => {
    const recovery: RecoveryView = { id: 'e1', kind: 'quota-exceeded', title: '额度已用完' };
    const { container } = render(<ErrorRecoveryNotice recovery={recovery} />);
    const notice = container.querySelector('.rl-agent-recovery')!;
    expect(notice).toHaveAttribute('data-kind', 'quota-exceeded');
    expect(notice).toHaveAttribute('data-tone', 'warning');
    expect(within(notice as HTMLElement).getByText('quota-exceeded')).toBeInTheDocument();
    // Not a danger kind: no alert role even with announce on.
    expect(notice.querySelector('[role="alert"]')).toBeNull();
  });
});

describe('icon primitives accept custom content (ADR-0013 §3)', () => {
  it('AgentIcon renders children for a custom name', () => {
    const { container } = render(
      <AgentIcon name="vendor-logo">
        <rect data-testid="logo" x="2" y="2" width="12" height="12" />
      </AgentIcon>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('data-icon', 'vendor-logo');
    expect(container.querySelector('[data-testid="logo"]')).toBeInTheDocument();
  });

  it('AgentIcon children win over a built-in name', () => {
    const { container } = render(
      <AgentIcon name="file">
        <circle data-testid="wins" cx="8" cy="8" r="4" />
      </AgentIcon>,
    );
    expect(container.querySelector('[data-testid="wins"]')).toBeInTheDocument();
  });

  it('StatusGlyph renders children for a custom name', () => {
    const { container } = render(
      <StatusGlyph name="throttled" tone="warning">
        <path data-testid="glyph" d="M3 3h10v10H3z" />
      </StatusGlyph>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('data-glyph', 'throttled');
    expect(container.querySelector('[data-testid="glyph"]')).toBeInTheDocument();
  });
});

const ratingQuestionnaire = (patch: Partial<QuestionnaireView> = {}): QuestionnaireView => ({
  id: 'qq',
  revision: '1',
  status: 'waiting',
  questions: [{ id: 'q1', kind: 'rating', title: '给这次回答打个分' }],
  answers: [],
  draftStatus: 'clean',
  submitStatus: 'idle',
  ...patch,
});

describe('QuestionnaireCard custom question kinds (ADR-0013 §4)', () => {
  it('answer helpers treat custom kinds as renderer-owned', () => {
    const q: QuestionView = { id: 'q1', kind: 'rating', title: '打分' };
    expect(isChoiceQuestion(q)).toBe(false);
    expect(isKnownQuestionKind(q)).toBe(false);
    expect(answerState(q, undefined)).toBe('unanswered');
    expect(answerState(q, { questionId: 'q1' })).toBe('unanswered');
    expect(answerState(q, { questionId: 'q1', text: '5' })).toBe('answered');
    // Custom option ids are the renderer's own vocabulary: never filtered out.
    expect(answerState(q, { questionId: 'q1', optionIds: ['vendor-x'] })).toBe('answered');
    const result = normalizeAnswers([q], [{ questionId: 'q1', optionIds: ['vendor-x'], text: '5' }]);
    expect(result.answers).toEqual([{ questionId: 'q1', optionIds: ['vendor-x'], text: '5' }]);
    expect(result.missing).toEqual([]);
    // A required custom question with no answer still blocks submission.
    const required = normalizeAnswers([{ ...q, optional: false }], []);
    expect(required.missing).toEqual(['q1']);
  });

  it('custom kinds fall back to a free-text answer without a renderer', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onSubmit = vi.fn();
    render(<QuestionnaireCard questionnaire={ratingQuestionnaire()} onAnswerChange={onAnswer} onSubmit={onSubmit as never} />);
    const box = screen.getByRole('textbox', { name: '给这次回答打个分' });
    await user.type(box, '还行');
    expect(onAnswer).toHaveBeenLastCalledWith({ questionId: 'q1', text: '还行' });
  });

  it('renderQuestion replaces the body; its update channel reports answers', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <QuestionnaireCard
        questionnaire={ratingQuestionnaire()}
        onAnswerChange={onAnswer}
        renderQuestion={({ question, answer, update, editable }) => (
          <fieldset>
            <legend>{question.title}</legend>
            <button type="button" disabled={!editable} onClick={() => update({ questionId: question.id, text: '5' })}>
              五星{answer?.text === '5' ? '（已选）' : ''}
            </button>
          </fieldset>
        )}
      />,
    );
    // The built-in text fallback is replaced, not stacked.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '五星' }));
    expect(onAnswer).toHaveBeenCalledWith({ questionId: 'q1', text: '5' });
  });

  it('renderQuestion can wrap the built-in body via defaultBody', () => {
    render(
      <QuestionnaireCard
        questionnaire={ratingQuestionnaire()}
        onAnswerChange={() => {}}
        renderQuestion={({ defaultBody }) => <div data-testid="wrapped">{defaultBody}</div>}
      />,
    );
    expect(screen.getByTestId('wrapped')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '给这次回答打个分' })).toBeInTheDocument();
  });
});
