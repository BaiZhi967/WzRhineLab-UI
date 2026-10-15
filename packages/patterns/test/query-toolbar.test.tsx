import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QueryToolbar } from '../src';
import { patternsZhCN } from '../src';

describe('QueryToolbar structure', () => {
  it('renders a search region with labelled input, submit and reset', () => {
    render(
      <QueryToolbar
        query="样本"
        onQueryChange={() => {}}
        onReset={() => {}}
        resultSummary={<span>共 128 条结果</span>}
      >
        <button type="button">类别</button>
      </QueryToolbar>,
    );
    const region = screen.getByRole('search', { name: patternsZhCN.queryToolbar.region });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: patternsZhCN.queryToolbar.search })).toHaveValue('样本');
    expect(screen.getByRole('button', { name: patternsZhCN.queryToolbar.submit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: patternsZhCN.queryToolbar.reset })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: '类别' })).toBeInTheDocument();
    expect(screen.getByText('共 128 条结果')).toBeInTheDocument();
  });

  it('renders no reset entry when onReset is absent', () => {
    render(<QueryToolbar query="" onQueryChange={() => {}} />);
    expect(screen.queryByRole('button', { name: patternsZhCN.queryToolbar.reset })).toBeNull();
  });

  it('label props override the built-in copy', () => {
    render(
      <QueryToolbar
        query=""
        onQueryChange={() => {}}
        searchLabel="搜索档案"
        submitLabel="查找"
        resetLabel="清除条件"
        onReset={() => {}}
      />,
    );
    expect(screen.getByRole('searchbox', { name: '搜索档案' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查找' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '清除条件' })).toBeInTheDocument();
  });
});

describe('QueryToolbar submission', () => {
  it('Enter submits the pending value as an intent; the caller state decides the accepted query', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<HarnessQuery onQueryChange={onQueryChange} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, '沉积');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onQueryChange).toHaveBeenCalledWith('沉积');
  });

  it('the submit button commits the same intent', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<HarnessQuery onQueryChange={onQueryChange} />);
    await user.type(screen.getByRole('searchbox'), '潮间带');
    await user.click(screen.getByRole('button', { name: patternsZhCN.queryToolbar.submit }));
    expect(onQueryChange).toHaveBeenCalledWith('潮间带');
  });

  it('typing alone never submits (explicit commit only)', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<HarnessQuery onQueryChange={onQueryChange} />);
    await user.type(screen.getByRole('searchbox'), '观测');
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('clearing the input and committing sends an empty query', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<HarnessQuery onQueryChange={onQueryChange} />);
    await user.clear(screen.getByRole('searchbox'));
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
    expect(onQueryChange).toHaveBeenCalledWith('');
  });
});

describe('QueryToolbar IME (0.3.0-contracts §4.4)', () => {
  it('Enter during composition does not submit', () => {
    const onQueryChange = vi.fn();
    render(<HarnessQuery onQueryChange={onQueryChange} />);
    const input = screen.getByRole('searchbox');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'shen' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
  });

  it('the Enter that committed the composition does not submit; the next one does', () => {
    const onQueryChange = vi.fn();
    render(<HarnessQuery onQueryChange={onQueryChange} />);
    const input = screen.getByRole('searchbox');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '深' } });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    fireEvent.compositionEnd(input);
    // Safari fires compositionend before the committing keydown; that Enter must not submit.
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onQueryChange).not.toHaveBeenCalled();
    // A separate, later Enter press submits normally.
    fireEvent.keyUp(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onQueryChange).toHaveBeenCalledWith('深');
  });
});

describe('QueryToolbar busy and reset', () => {
  // 0.3.0-contracts §4.2: busy announces with aria-disabled and keeps the control focusable, so
  // focus does not drop to <body> while the query is in flight.
  it('busy keeps submit and reset focusable (aria-disabled) and preserves the typed value', () => {
    render(
      <QueryToolbar query="样本" onQueryChange={() => {}} onReset={() => {}} busy>
        <span />
      </QueryToolbar>,
    );
    const submit = screen.getByRole('button', { name: patternsZhCN.queryToolbar.submit });
    const reset = screen.getByRole('button', { name: patternsZhCN.queryToolbar.reset });
    for (const button of [submit, reset]) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
      // Not natively disabled: that is what would drop focus to <body>.
      expect(button).not.toHaveAttribute('disabled');
      button.focus();
      expect(button).toHaveFocus();
    }
    expect(screen.getByRole('searchbox')).toHaveValue('样本');
  });

  it('busy drops submit and reset actions instead of re-running them', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onReset = vi.fn();
    render(<QueryToolbar query="样本" onQueryChange={onQueryChange} onReset={onReset} busy />);
    await user.click(screen.getByRole('button', { name: patternsZhCN.queryToolbar.submit }));
    await user.click(screen.getByRole('button', { name: patternsZhCN.queryToolbar.reset }));
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
    expect(onQueryChange).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('reset reports the intent; the caller clears query, filters and page', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<QueryToolbar query="样本" onQueryChange={() => {}} onReset={onReset} />);
    await user.click(screen.getByRole('button', { name: patternsZhCN.queryToolbar.reset }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  // Audit §5.5: with an uncontrolled draft and an already-empty committed query, the caller's
  // reset changes nothing observable, so the typed text used to survive it.
  it('reset clears the uncontrolled draft even when the committed query is already empty', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<QueryToolbar query="" onQueryChange={() => {}} onReset={onReset} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, '未提交的草稿');
    expect(input).toHaveValue('未提交的草稿');

    await user.click(screen.getByRole('button', { name: patternsZhCN.queryToolbar.reset }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  it('a controlled pending value stays owned by the caller on reset', async () => {
    const user = userEvent.setup();
    render(
      <QueryToolbar
        query=""
        pendingQuery="调用者持有"
        onPendingQueryChange={() => {}}
        onQueryChange={() => {}}
        onReset={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: patternsZhCN.queryToolbar.reset }));
    // The component must not fight a controlled value; clearing it is the caller's job.
    expect(screen.getByRole('searchbox')).toHaveValue('调用者持有');
  });

  // Audit §5.5: the toolbar is often nested in a larger form; Enter means "run this query",
  // never "submit the surrounding form".
  it('Enter runs the query without submitting a surrounding form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onQueryChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <QueryToolbar query="" onQueryChange={onQueryChange} />
        <button type="submit">外层提交</button>
      </form>,
    );
    await user.type(screen.getByRole('searchbox'), '关键词{Enter}');
    expect(onQueryChange).toHaveBeenCalledWith('关键词');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('pending value can be controlled externally', () => {
    const onPendingQueryChange = vi.fn();
    render(
      <QueryToolbar
        query=""
        pendingQuery="外部"
        onQueryChange={() => {}}
        onPendingQueryChange={onPendingQueryChange}
      />,
    );
    expect(screen.getByRole('searchbox')).toHaveValue('外部');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '外部2' } });
    expect(onPendingQueryChange).toHaveBeenCalledWith('外部2');
  });
});

function HarnessQuery({ onQueryChange }: { onQueryChange: (q: string) => void }) {
  const [query, setQuery] = React.useState('');
  return (
    <QueryToolbar
      query={query}
      onQueryChange={(next) => {
        setQuery(next);
        onQueryChange(next);
      }}
    />
  );
}
