import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { CodeBlock } from '../src/components/CodeBlock.js';
import { MarkdownRenderer } from '../src/components/MarkdownRenderer.js';
import { ContentMessagesProvider, contentEnUS } from '../src/provider/ContentMessages.js';

function renderMarkdown(props: React.ComponentProps<typeof MarkdownRenderer>) {
  return render(
    <RhineProvider theme="light">
      <ContentMessagesProvider messages={contentEnUS}>
        <MarkdownRenderer {...props} />
      </ContentMessagesProvider>
    </RhineProvider>,
  );
}

describe('MarkdownRenderer', () => {
  it('renders GFM headings, tables, task lists and stable heading ids', () => {
    renderMarkdown({ source: '# Intro\n\n## Intro\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] Done' });
    expect(screen.getByRole('heading', { name: 'Intro', level: 1 })).toHaveAttribute('id', 'intro');
    expect(screen.getByRole('heading', { name: 'Intro', level: 2 })).toHaveAttribute('id', 'intro-2');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('does not execute or create elements from raw HTML', () => {
    renderMarkdown({ source: '<script>alert(1)</script><b>raw</b>' });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('script')).not.toBeInTheDocument();
    expect(document.querySelector('b')).not.toBeInTheDocument();
  });

  it('rejects unsafe links and images while keeping safe links actionable', async () => {
    const onLinkActivate = vi.fn();
    const user = userEvent.setup();
    renderMarkdown({
      source: '[safe](https://example.com) [bad](javascript:alert(1)) ![unsafe](javascript:alert(2))',
      onLinkActivate,
    });
    const safe = screen.getByRole('link', { name: 'safe' });
    expect(safe).toHaveAttribute('href', 'https://example.com');
    expect(screen.queryByRole('link', { name: 'bad' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await user.click(safe);
    expect(onLinkActivate).toHaveBeenCalledWith('https://example.com');
  });

  it('uses the image resolver for safe image URLs', () => {
    const renderImage = vi.fn(({ src, alt }: { src: string; alt: string }) => <span data-testid="image-resolver">{`${src}|${alt}`}</span>);
    renderMarkdown({ source: '![figure](https://example.com/figure.png)', renderImage });
    expect(renderImage).toHaveBeenCalledWith(expect.objectContaining({ src: 'https://example.com/figure.png', alt: 'figure' }));
    expect(screen.getByTestId('image-resolver')).toHaveTextContent('https://example.com/figure.png|figure');
  });

  it('does not pass an unsafe image URL to a custom image component', () => {
    renderMarkdown({
      source: '![unsafe](mailto:test@example.com)',
      components: { img: ({ src }) => <span data-testid="custom-image">{src}</span> },
    });
    expect(screen.queryByTestId('custom-image')).not.toBeInTheDocument();
    expect(screen.getByText(contentEnUS.image.unavailable)).toBeInTheDocument();
  });

  it('announces a native image load failure and preserves the alternative text', () => {
    renderMarkdown({ source: '![figure](https://example.com/figure.png)' });
    const image = screen.getByRole('img', { name: 'figure' });
    fireEvent.error(image);
    expect(screen.getByRole('status')).toHaveAccessibleName('figure');
    expect(screen.getByRole('status')).toHaveTextContent(contentEnUS.image.unavailable);
  });

  it('renders fenced code through CodeBlock', () => {
    renderMarkdown({ source: '```ts\nconst answer = 42;\n```' });
    expect(screen.getByRole('figure')).toBeInTheDocument();
    expect(screen.getByText('const answer = 42;')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders loading, empty and error states with retry', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <RhineProvider theme="light">
        <ContentMessagesProvider messages={contentEnUS}>
          <MarkdownRenderer source="" status="loading" />
        </ContentMessagesProvider>
      </RhineProvider>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    rerender(
      <RhineProvider theme="light">
        <ContentMessagesProvider messages={contentEnUS}>
          <MarkdownRenderer source="" status="empty" />
        </ContentMessagesProvider>
      </RhineProvider>,
    );
    expect(screen.getByTestId('rl-content-empty')).toHaveTextContent(contentEnUS.state.empty);
    rerender(
      <RhineProvider theme="light">
        <ContentMessagesProvider messages={contentEnUS}>
          <MarkdownRenderer source="" status="error" error={<strong>Failed</strong>} onRetry={onRetry} retryLabel="Retry" />
        </ContentMessagesProvider>
      </RhineProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
