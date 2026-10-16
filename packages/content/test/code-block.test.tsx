import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton, RhineProvider } from '@wzrhine/react';
import { CodeBlock } from '../src/components/CodeBlock.js';
import { ContentMessagesProvider, contentEnUS } from '../src/provider/ContentMessages.js';

function renderCode(props: React.ComponentProps<typeof CodeBlock>) {
  return render(
    <RhineProvider theme="light">
      <ContentMessagesProvider messages={contentEnUS}>
        <CodeBlock {...props} />
      </ContentMessagesProvider>
    </RhineProvider>,
  );
}

describe('CodeBlock', () => {
  it('renders a semantic figure with caption, code and a focusable scroll region', () => {
    renderCode({ code: 'const answer = 42;', language: 'ts', filename: 'answer.ts', showLineNumbers: true });
    expect(screen.getByRole('figure')).toBeInTheDocument();
    expect(screen.getByText('answer.ts')).toBeInTheDocument();
    expect(screen.getByText('const answer = 42;')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'answer.ts' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('1').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onCopy and announces success without moving focus', async () => {
    const onCopy = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCode({ code: 'copy me', onCopy });
    const button = screen.getByRole('button', { name: contentEnUS.code.copy });
    await user.click(button);
    await waitFor(() => expect(onCopy).toHaveBeenCalledWith('copy me'));
    expect(screen.getByRole('button', { name: contentEnUS.code.copied })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(contentEnUS.code.copied);
  });

  it('announces copy failure and preserves the source text', async () => {
    const onCopy = vi.fn().mockRejectedValue(new Error('clipboard'));
    const user = userEvent.setup();
    renderCode({ code: 'keep me', onCopy });
    await user.click(screen.getByRole('button', { name: contentEnUS.code.copy }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(contentEnUS.code.copyFailed));
    expect(screen.getByText('keep me')).toBeInTheDocument();
  });

  it('uses the clipboard fallback when no callback is provided', async () => {
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const user = userEvent.setup();
    renderCode({ code: 'clipboard fallback' });
    await user.click(screen.getByRole('button', { name: contentEnUS.code.copy }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(contentEnUS.code.copied));
  });

  it('does not render a copy control when copyable is false', () => {
    renderCode({ code: 'no copy', copyable: false });
    expect(screen.queryByRole('button', { name: contentEnUS.code.copy })).not.toBeInTheDocument();
  });

  it('does not share copy state between instances', async () => {
    const onCopy = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <RhineProvider theme="light">
        <ContentMessagesProvider messages={contentEnUS}>
          <CodeBlock code="one" onCopy={onCopy} />
          <CodeBlock code="two" onCopy={onCopy} />
        </ContentMessagesProvider>
      </RhineProvider>,
    );
    const buttons = screen.getAllByRole('button', { name: contentEnUS.code.copy });
    await user.click(buttons[0]!);
    await waitFor(() => expect(buttons[0]).toHaveAccessibleName(contentEnUS.code.copied));
    expect(buttons[1]).toHaveAccessibleName(contentEnUS.code.copy);
  });
});
