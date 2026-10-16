import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import {
  ContentMessagesProvider,
  contentEnUS,
  contentZhCN,
  mergeContentMessages,
  useContentMessages,
} from '../src/provider/ContentMessages.js';

function Probe({ label }: { label: string }) {
  const messages = useContentMessages();
  return <output data-testid={label}>{`${messages.code.copy}|${messages.code.copied}|${messages.unsupported.detail('diagram')}`}</output>;
}

describe('ContentMessagesProvider', () => {
  it('provides the built-in zhCN messages by default', () => {
    render(
      <ContentMessagesProvider>
        <Probe label="default" />
      </ContentMessagesProvider>,
    );
    expect(screen.getByTestId('default')).toHaveTextContent(`${contentZhCN.code.copy}|${contentZhCN.code.copied}`);
    expect(contentZhCN.state.empty).toBe('暂无内容。');
  });

  it('supports the built-in English table', () => {
    render(
      <ContentMessagesProvider messages={contentEnUS}>
        <Probe label="english" />
      </ContentMessagesProvider>,
    );
    expect(screen.getByTestId('english')).toHaveTextContent(`${contentEnUS.code.copy}|${contentEnUS.code.copied}`);
    expect(contentEnUS.state.empty).toBe('No content.');
  });

  it('merges partial overrides without replacing unrelated messages', () => {
    const messages = mergeContentMessages(contentEnUS, { code: { copy: 'Copy source' } });
    expect(messages.code.copy).toBe('Copy source');
    expect(messages.code.copied).toBe(contentEnUS.code.copied);
    expect(messages.unsupported.detail('diagram')).toBe(contentEnUS.unsupported.detail('diagram'));
  });

  it('keeps nested providers and instances isolated', () => {
    render(
      <ContentMessagesProvider messages={contentEnUS}>
        <Probe label="outer" />
        <ContentMessagesProvider messages={{ code: { copy: '局部复制' } }}>
          <Probe label="inner" />
        </ContentMessagesProvider>
      </ContentMessagesProvider>,
    );
    expect(screen.getByTestId('outer')).toHaveTextContent(contentEnUS.code.copy);
    expect(screen.getByTestId('inner')).toHaveTextContent('局部复制');
    expect(screen.getByTestId('inner')).toHaveTextContent(contentEnUS.code.copied);
  });
});
