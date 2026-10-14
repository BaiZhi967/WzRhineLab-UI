import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { InspectorPanel, PatternsMessagesProvider, patternsZhCN } from '../src';

const sampleMeta = [
  { key: 'path', label: '路径', value: 'archive/2026/samples/ARC-1024.html', mono: true, wide: true },
  { key: 'owner', label: '负责人', value: '白芷' },
  { key: 'kind', label: '类型', value: null },
];

describe('InspectorPanel structure', () => {
  it('renders a region named by its title with eyebrow, meta, actions and content slots', () => {
    render(
      <InspectorPanel
        title="样本 ARC-1024"
        eyebrow="INSPECTOR"
        meta={sampleMeta}
        actions={<button type="button">校验</button>}
      >
        <p>检查内容</p>
      </InspectorPanel>,
    );
    const region = screen.getByRole('complementary', { name: '样本 ARC-1024' });
    expect(screen.getByText('INSPECTOR')).toBeInTheDocument();
    // Meta renders through MetadataList; the null value row is hidden by default (MetadataEmpty).
    expect(screen.getByText('路径')).toBeInTheDocument();
    expect(screen.queryByText('类型')).toBeNull();
    expect(within(region).getByRole('button', { name: '校验' })).toBeInTheDocument();
    expect(screen.getByText('检查内容')).toBeInTheDocument();
  });

  it('the label prop overrides the region accessible name', () => {
    render(<InspectorPanel title="样本" label="属性检查面板" />);
    expect(screen.getByRole('complementary', { name: '属性检查面板' })).toBeInTheDocument();
  });

  it('an empty meta array renders no definition list', () => {
    const { container } = render(<InspectorPanel title="样本" meta={[]} />);
    expect(container.querySelector('dl')).toBeNull();
  });

  it('renders without close button when onClose is not provided', () => {
    render(<InspectorPanel title="样本" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('InspectorPanel close', () => {
  it('renders a close button with the default label and reports the intent only', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InspectorPanel title="样本" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: patternsZhCN.inspectorPanel.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close label follows prop > provider > built-in zhCN priority', () => {
    render(
      <PatternsMessagesProvider messages={{ inspectorPanel: { close: 'Provider 关闭' } }}>
        <InspectorPanel title="样本" onClose={() => {}} closeLabel="属性关闭" />
      </PatternsMessagesProvider>,
    );
    expect(screen.getByRole('button', { name: '属性关闭' })).toBeInTheDocument();
  });
});

describe('InspectorPanel visibility', () => {
  it('open=false hides the whole region (hidden attribute: no focusable residue)', () => {
    const { container } = render(
      <InspectorPanel
        title="样本"
        onClose={() => {}}
        actions={<button type="button">校验</button>}
        open={false}
      >
        <button type="button">内容按钮</button>
      </InspectorPanel>,
    );
    const region = container.querySelector('.rl-inspector');
    expect(region).not.toBeNull();
    expect(region).toHaveAttribute('hidden');
    // The hidden region exposes no accessible roles.
    expect(screen.queryByRole('complementary', { name: '样本' })).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('open defaults to true', () => {
    render(<InspectorPanel title="样本" onClose={() => {}} />);
    expect(screen.getByRole('complementary', { name: '样本' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: patternsZhCN.inspectorPanel.close })).toBeInTheDocument();
  });
});

describe('InspectorPanel SSR', () => {
  it('renders to string without touching the browser', () => {
    const html = renderToString(<InspectorPanel title="样本" meta={sampleMeta} />);
    expect(html).toContain('rl-inspector');
    expect(html).toContain('样本');
  });
});
