import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ContentMessagesProvider, contentEnUS } from '@wzrhine/content';
import { PreviewPane } from '../src/components/PreviewPane.js';

describe('PreviewPane', () => {
  it('hands the controlled Markdown source to the renderer', () => {
    render(<PreviewPane source={'# Title\n\nBody'} aria-label="Preview" />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByLabelText('Preview')).toHaveAttribute('data-state', 'ready');
  });

  it('propagates loading, empty, error, retry, links and image rendering', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onLinkActivate = vi.fn();
    const renderImage = vi.fn(({ alt, src }: { alt: string; src: string }) => <span data-testid="resolved-image">{alt}:{src}</span>);
    const { rerender } = render(
      <ContentMessagesProvider messages={{ state: { empty: 'Nothing here' } }}>
        <PreviewPane source="" status="empty" aria-label="Preview" />
      </ContentMessagesProvider>,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    rerender(<ContentMessagesProvider messages={contentEnUS}><PreviewPane source="# Loading" status="loading" aria-label="Preview" /></ContentMessagesProvider>);
    expect(screen.getByLabelText(contentEnUS.state.loading)).toHaveAttribute('aria-busy', 'true');
    rerender(<ContentMessagesProvider messages={contentEnUS}><PreviewPane source="failed" status="error" error={<strong>Failed</strong>} onRetry={onRetry} aria-label="Preview" /></ContentMessagesProvider>);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    await user.click(screen.getByRole('button', { name: contentEnUS.state.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<ContentMessagesProvider messages={contentEnUS}><PreviewPane source={'[Open](https://example.com)\n\n![Figure](https://example.com/image.png)'} onLinkActivate={onLinkActivate} renderImage={renderImage} aria-label="Preview" /></ContentMessagesProvider>);
    await user.click(screen.getByRole('link', { name: 'Open' }));
    expect(onLinkActivate).toHaveBeenCalledWith('https://example.com');
    expect(screen.getByTestId('resolved-image')).toHaveTextContent('Figure:https://example.com/image.png');
  });
});
