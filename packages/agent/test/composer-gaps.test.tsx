import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AgentMessagesProvider, agentEnUS, Composer, ComposerNotice } from '../src/index';

describe('ComposerNotice', () => {
  it('is a static note; the tone is spoken, not only coloured', () => {
    render(<ComposerNotice message="这是子代理的对话（示例）。" tone="warning" />);
    const note = screen.getByRole('note');
    expect(note).toHaveAttribute('data-tone', 'warning');
    expect(note).toHaveTextContent('注意：这是子代理的对话（示例）。');
    expect(note.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('actions render only with onAction and emit their id', async () => {
    const user = userEvent.setup();
    const actions = [
      { id: 'open-parent', label: '回到主对话', tone: 'primary' as const },
      { id: 'restore', label: '恢复归档' },
    ];
    const { rerender } = render(<ComposerNotice message="示例" actions={actions} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    const onAction = vi.fn();
    rerender(<ComposerNotice message="示例" actions={actions} onAction={onAction} busyActionIds={['restore']} />);
    await user.click(screen.getByRole('button', { name: '回到主对话' }));
    expect(onAction).toHaveBeenCalledWith('open-parent');
    expect(screen.getByRole('button', { name: '恢复归档' })).toHaveAttribute('aria-busy', 'true');
  });

  it('live="polite" makes the message a status region; icon={null} hides the icon; enUS copy', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <ComposerNotice message="Archived (sample)." tone="neutral" live="polite" icon={null} />
      </AgentMessagesProvider>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Note:Archived (sample).');
    expect(screen.queryByRole('note')).toBeNull();
    expect(status.querySelector('svg')).toBeNull();
  });
});

describe('Composer replacement', () => {
  const notice = <ComposerNotice message="这是子代理的对话，回到主对话发送消息（示例）。" />;

  it('renders the replacement instead of the input frame; the intervention dock stays', () => {
    render(<Composer onSubmit={() => {}} intervention={<p>示例：审批卡</p>} replacement={notice} />);
    const root = document.querySelector('.rl-agent-composer')!;
    expect(root).toHaveAttribute('data-replaced');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.querySelector('.rl-agent-composer__frame')).toBeNull();
    expect(document.querySelector('.rl-agent-send')).toBeNull();
    expect(document.querySelector('.rl-agent-composer__feedback')).toBeNull();
    expect(screen.getByRole('note')).toHaveTextContent('这是子代理的对话');
    const slot = root.querySelector('.rl-agent-composer__intervention')!;
    expect(slot).toHaveAttribute('data-open');
    expect(within(slot as HTMLElement).getByText('示例：审批卡')).toBeInTheDocument();
    // Dock comes first, then the replacement.
    expect(slot.compareDocumentPosition(screen.getByRole('note')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the draft survives a replacement round-trip and sending works again afterwards', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(<Composer onSubmit={onSubmit} defaultValue="" />);
    await user.type(screen.getByRole('textbox', { name: '消息内容' }), '示例草稿');
    rerender(<Composer onSubmit={onSubmit} replacement={notice} />);
    expect(screen.queryByRole('textbox')).toBeNull();
    rerender(<Composer onSubmit={onSubmit} />);
    const box = screen.getByRole('textbox', { name: '消息内容' });
    expect(box).toHaveValue('示例草稿');
    await user.type(box, '{Enter}');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ text: '示例草稿' }));
  });

  it('null / false replacement keeps the normal frame', () => {
    render(<Composer onSubmit={() => {}} replacement={false} />);
    expect(screen.getByRole('textbox', { name: '消息内容' })).toBeInTheDocument();
    expect(document.querySelector('.rl-agent-composer')).not.toHaveAttribute('data-replaced');
  });
});
