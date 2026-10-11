import * as React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { MessagePartView, ThinkingView } from '@wzrhine/agent-core';
import { AgentMessagesProvider, agentEnUS } from '../src/provider/AgentMessages';
import { MessagePart } from '../src/components/message/MessagePart';
import { CodeBlock } from '../src/components/message/CodeBlock';
import { CitationChip } from '../src/components/message/CitationChip';
import { ThinkingBlock } from '../src/components/message/ThinkingBlock';
import { splitFences } from '../src/components/message/plain-text';
import { sampleMessages, sampleTools, sampleArtifacts } from '../src/fixtures/session';

const part = (p: MessagePartView) => render(<MessagePart part={p} />);

describe('splitFences (plain-text fallback)', () => {
  it('splits paragraphs and fenced code, keeps an unclosed fence open', () => {
    const segments = splitFences('a\nb\n\nc\n```ts\nconst x = 1;\n```\ntail\n~~~\nopen');
    expect(segments).toEqual([
      { kind: 'text', paragraphs: ['a\nb', 'c'] },
      { kind: 'code', code: 'const x = 1;', language: 'ts', open: false },
      { kind: 'text', paragraphs: ['tail'] },
      { kind: 'code', code: 'open', language: undefined, open: true },
    ]);
  });
});

describe('MessagePart', () => {
  it('text keeps line breaks in paragraphs', () => {
    const { container } = part({ type: 'text', id: 't', text: 'one\ntwo\n\nthree' });
    const ps = container.querySelectorAll('p');
    expect(ps).toHaveLength(2);
    expect(ps[0]!.textContent).toBe('one\ntwo');
  });

  it('markdown fallback never parses HTML and renders fences as code blocks', () => {
    const { container } = part({ type: 'markdown', id: 'm', source: '<b>bold</b> <img src=x onerror=alert(1)>\n\n```py\nprint(1)\n```' });
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<b>bold</b>');
    expect(container.querySelector('pre code')!.textContent).toBe('print(1)');
    expect(screen.getByRole('figure')).toHaveTextContent('py');
  });

  it('markdown uses the injected renderer with streaming context', () => {
    const markdown = vi.fn((source: string) => <em>{source}</em>);
    render(<MessagePart part={{ type: 'markdown', id: 'm', source: 'hi', streaming: true }} renderers={{ markdown }} />);
    expect(markdown).toHaveBeenCalledWith('hi', { id: 'm', streaming: true });
    expect(screen.getByText('hi').tagName).toBe('EM');
  });

  it('code uses CodeBlock or the code renderer override', () => {
    const p: MessagePartView = { type: 'code', id: 'c', code: 'x = 1', language: 'python', filename: 'a.py' };
    const { unmount } = part(p);
    expect(screen.getByRole('figure')).toHaveTextContent('a.py');
    expect(screen.getByRole('figure')).toHaveTextContent('python');
    unmount();
    render(<MessagePart part={p} renderers={{ code: (c) => <span>custom {c.code}</span> }} />);
    expect(screen.getByText('custom x = 1')).toBeInTheDocument();
  });

  it('image has alt, lazy loading, dimensions and caption', () => {
    part({ type: 'image', id: 'i', src: 'data:image/png;base64,AA==', alt: '示例图', caption: 'Fig 1', width: 40, height: 30 });
    const img = screen.getByRole('img', { name: '示例图' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('width', '40');
    expect(screen.getByText('Fig 1').tagName).toBe('FIGCAPTION');
  });

  it('tool-call and artifact use renderers or a one-line fallback', () => {
    const tool = sampleTools[0]!;
    const { unmount } = part({ type: 'tool-call', id: 'tc', tool });
    expect(screen.getByText('读取文件')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    unmount();
    render(<MessagePart part={{ type: 'tool-call', id: 'tc', tool }} renderTool={(t) => <span>tool:{t.id}</span>} />);
    expect(screen.getByText('tool:op-1')).toBeInTheDocument();
    const art = sampleArtifacts[1]!;
    const r = part({ type: 'artifact', id: 'a', artifact: art });
    expect(r.container).toHaveTextContent('reef_report.md');
    expect(r.container).toHaveTextContent('生成中');
  });

  it('attachment shows name, formatted size and non-ready status', () => {
    const { container } = part({ type: 'attachment', id: 'at', attachment: { id: 'x', name: 'data.zip', kind: 'file', size: 2048, status: 'uploading', progress: 0.42 } });
    expect(container).toHaveTextContent('data.zip');
    expect(container).toHaveTextContent('2 KB');
    expect(container).toHaveTextContent('上传中 42%');
  });

  it('reference shows label, kind for screen readers and external marker', () => {
    const { container } = part({ type: 'reference', id: 'r', reference: { id: 'r', kind: 'folder', label: 'src', detail: '/ws/src', external: true } });
    expect(container).toHaveTextContent('文件夹');
    expect(container).toHaveTextContent('工作区外');
  });

  it('status part renders the run line', () => {
    const { container } = part({ type: 'status', id: 's', status: 'running', phase: 'thinking' });
    expect(container).toHaveTextContent('思考中');
    expect(container.querySelector('.rl-agent-spark')).not.toBeNull();
  });

  it('error part renders actions only with a handler and passes ids back', async () => {
    const error = { id: 'e1', kind: 'retryable' as const, title: '请求失败', message: '示例', actions: [{ id: 'retry', label: '重试请求', tone: 'primary' as const }], preserved: ['草稿'] };
    const { unmount } = part({ type: 'error', id: 'e', error });
    expect(screen.getByRole('group', { name: /请求失败/ })).toHaveTextContent('已保留：草稿');
    expect(screen.queryByRole('button')).toBeNull();
    unmount();
    const onRecoveryAction = vi.fn();
    render(<MessagePart part={{ type: 'error', id: 'e', error }} onRecoveryAction={onRecoveryAction} />);
    await userEvent.click(screen.getByRole('button', { name: '重试请求' }));
    expect(onRecoveryAction).toHaveBeenCalledWith('e1', 'retry');
  });

  it('custom part uses its registered renderer, otherwise a readable fallback', () => {
    const p: MessagePartView = { type: 'custom', id: 'cu', renderer: 'chart', payload: {}, summary: '图表：3 组示例数据' };
    const { unmount } = part(p);
    expect(screen.getByText('无法显示此内容')).toBeInTheDocument();
    expect(screen.getByText('内容类型：chart')).toBeInTheDocument();
    expect(screen.getByText('图表：3 组示例数据')).toBeInTheDocument();
    unmount();
    render(<MessagePart part={p} renderers={{ custom: { chart: () => <span>chart!</span> } }} />);
    expect(screen.getByText('chart!')).toBeInTheDocument();
  });

  it('unknown future part types are never blank', () => {
    const { container } = part({ type: 'hologram', id: 'h', summary: '未来类型' } as unknown as MessagePartView);
    expect(container).toHaveTextContent('无法显示此内容');
    expect(container).toHaveTextContent('内容类型：hologram');
    expect(container).toHaveTextContent('未来类型');
  });

  it('uses the English table under an English provider', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <MessagePart part={{ type: 'custom', id: 'cu', renderer: 'x', payload: null }} />
      </AgentMessagesProvider>,
    );
    expect(screen.getByText('This content cannot be shown')).toBeInTheDocument();
  });
});

describe('CodeBlock', () => {
  it('copies via onCopy and shows copied / failed states', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onCopy = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(false);
    render(<CodeBlock code="echo 1" language="bash" onCopy={onCopy} />);
    const button = screen.getByRole('button', { name: '复制代码' });
    await act(async () => fireEvent.click(button));
    expect(onCopy).toHaveBeenCalledWith('echo 1');
    expect(screen.getByRole('button', { name: '已复制' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('已复制');
    await act(async () => vi.advanceTimersByTime(1300));
    expect(screen.getByRole('button', { name: '复制代码' })).toBeInTheDocument();
    await act(async () => fireEvent.click(button));
    expect(screen.getByRole('button', { name: '复制失败' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('hides copy without a copy path, scroller is focusable and named, line numbers are decorative', () => {
    const { container } = render(<CodeBlock code={'a\nb\nc'} filename="x.txt" showLineNumbers maxHeight="10rem" />);
    expect(screen.queryByRole('button')).toBeNull();
    const region = screen.getByRole('region', { name: 'x.txt' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.style.getPropertyValue('--rl-agent-code-max-height')).toBe('10rem');
    const gutter = container.querySelector('.rl-agent-code__gutter')!;
    expect(gutter).toHaveAttribute('aria-hidden', 'true');
    expect(gutter.children).toHaveLength(3);
    expect(container.querySelector('code')!.textContent).toBe('a\nb\nc');
  });

  it('uses navigator.clipboard when present', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<CodeBlock code="y" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '复制代码' })));
    expect(writeText).toHaveBeenCalledWith('y');
    Reflect.deleteProperty(navigator, 'clipboard');
  });
});

describe('CitationChip', () => {
  const citations = sampleMessages[1]!.parts.flatMap((p) => (p.type === 'citation' ? [p.citation] : []));
  const available = citations[0]!;
  const unavailable = citations[1]!;

  it('opens an available citation and describes its source', async () => {
    const onOpen = vi.fn();
    render(<CitationChip citation={available} onOpen={onOpen} />);
    const chip = screen.getByRole('button', { name: '引用 1：manifest.csv' });
    expect(chip).toHaveTextContent('[1]');
    expect(chip).toHaveAccessibleDescription(/文件 · data\/reef\/manifest\.csv/);
    await userEvent.click(chip);
    expect(onOpen).toHaveBeenCalledWith(available);
  });

  it('an unavailable citation stays focusable, explains why and never opens', async () => {
    const onOpen = vi.fn();
    render(<CitationChip citation={unavailable} onOpen={onOpen} />);
    const chip = screen.getByRole('button', { name: /引用 2：已删除的旧报告.*来源不可用/ });
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).not.toBeDisabled();
    expect(chip).toHaveAccessibleDescription(/文件已不存在/);
    chip.focus();
    expect(chip).toHaveFocus();
    await userEvent.click(chip);
    await userEvent.keyboard('{Enter}');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('multiple instances get distinct description ids', () => {
    render(
      <p>
        <CitationChip citation={available} /> text <CitationChip citation={available} />
      </p>,
    );
    const [a, b] = screen.getAllByRole('button');
    expect(a!.getAttribute('aria-describedby')).not.toBe(b!.getAttribute('aria-describedby'));
  });
});

describe('ThinkingBlock', () => {
  const streaming: ThinkingView = { id: 'th', label: '思考 2', status: 'streaming', latestLine: '正在核对输入目录…', elapsedMs: 12_400 };

  it('collapsed by default; trigger shows label, state, elapsed and the latest-line preview', () => {
    const { container } = render(<ThinkingBlock thinking={streaming} />);
    const trigger = screen.getByRole('button', { name: /思考 2/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('进行中');
    expect(trigger).toHaveTextContent('12.4s');
    const preview = container.querySelector('.rl-agent-thinking__preview')!;
    expect(preview).toHaveAttribute('aria-hidden', 'true');
    expect(preview).toHaveTextContent('正在核对输入目录…');
    expect(container.querySelector('.rl-agent-spark')).not.toBeNull();
  });

  it('toggles with Enter and Space and shows the summary when expanded', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<ThinkingBlock thinking={{ ...streaming, status: 'completed', summary: '先读取样本清单。' }} onExpandedChange={onExpandedChange} />);
    const trigger = screen.getByRole('button', { name: /思考 2/ });
    expect(trigger).toHaveTextContent('已结束');
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('先读取样本清单。')).toBeInTheDocument();
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange.mock.calls).toEqual([[true], [false]]);
  });

  it('streaming updates keep it expanded and the same DOM node (selection survives)', () => {
    const { rerender } = render(<ThinkingBlock thinking={{ ...streaming, summary: 'line 1' }} defaultExpanded />);
    const node = screen.getByText('line 1');
    rerender(<ThinkingBlock thinking={{ ...streaming, summary: 'line 1 more' }} defaultExpanded />);
    expect(screen.getByRole('button', { name: /思考 2/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('line 1 more')).toBe(node);
  });

  it('interrupted, truncated with open-full, and empty summary', async () => {
    const onOpenFull = vi.fn();
    render(<ThinkingBlock thinking={{ id: 'x', status: 'interrupted', truncated: true }} expanded onOpenFull={onOpenFull} />);
    expect(screen.getByRole('button', { name: /思考/ })).toHaveTextContent('已中断');
    expect(screen.getByText('没有可公开的思考摘要。')).toBeInTheDocument();
    expect(screen.getByText('此段思考展示已截取。')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '查看完整记录' }));
    expect(onOpenFull).toHaveBeenCalledWith('x');
  });

  it('controlled: stays as the parent says', async () => {
    render(<ThinkingBlock thinking={streaming} expanded={false} />);
    const trigger = screen.getByRole('button', { name: /思考 2/ });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('reduced motion: spark is static', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <ThinkingBlock thinking={streaming} />
      </MotionConfig>,
    );
    expect(container.querySelector('.rl-agent-spark')).not.toHaveAttribute('data-loop', 'running');
  });

  it('two instances use separate panel ids', () => {
    render(
      <>
        <ThinkingBlock thinking={streaming} defaultExpanded />
        <ThinkingBlock thinking={{ ...streaming, id: 'b' }} defaultExpanded />
      </>,
    );
    const ids = screen.getAllByRole('button', { name: /思考 2/ }).map((b) => b.getAttribute('aria-controls'));
    expect(ids[0]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
    expect(within(document.body).getAllByText('正在核对输入目录…').length).toBeGreaterThan(0);
  });
});
