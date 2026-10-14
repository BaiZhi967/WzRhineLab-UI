import * as React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ListDetail, PatternsMessagesProvider, patternsZhCN } from '../src';

// ---------------------------------------------------------------------------
// Harnesses
// ---------------------------------------------------------------------------

/** Controlled ListDetail driven by list-item buttons, as a real caller would use it. */
function Harness(props: Partial<React.ComponentProps<typeof ListDetail>> & { records?: string[] }) {
  const { records = ['ARC-1'], ...rest } = props;
  const [detailId, setDetailId] = React.useState<string | null>(null);
  return (
    <ListDetail
      detailId={detailId}
      onDetailChange={setDetailId}
      list={
        <div>
          <h2>记录列表标题</h2>
          {records.map((id) => (
            <button key={id} type="button" onClick={() => setDetailId(id)}>
              打开 {id}
            </button>
          ))}
        </div>
      }
      detail={<p data-testid="detail-body">详情内容 {detailId}</p>}
      {...rest}
    />
  );
}

/** The open action also removes the trigger (e.g. the list re-filtered) before the detail closes. */
function VanishingTriggerHarness() {
  const [detailId, setDetailId] = React.useState<string | null>(null);
  return (
    <ListDetail
      detailId={detailId}
      onDetailChange={setDetailId}
      list={
        detailId == null ? (
          <div>
            <h2>记录列表标题</h2>
            <button type="button" onClick={() => setDetailId('ARC-1')}>
              打开 ARC-1
            </button>
          </div>
        ) : (
          <div>
            <h2>记录列表标题</h2>
            <p>触发控件已被过滤掉</p>
          </div>
        )
      }
      detail={<p data-testid="detail-body">详情内容</p>}
      mode="split"
    />
  );
}

// ---------------------------------------------------------------------------
// ResizeObserver mock (jsdom has none; auto mode needs it for resize-driven updates)
// ---------------------------------------------------------------------------

let roInstances: Array<{ cb: ResizeObserverCallback; el: Element | null; disconnected: boolean }> = [];

class MockResizeObserver {
  cb: ResizeObserverCallback;
  el: Element | null = null;
  disconnected = false;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    roInstances.push(this);
  }
  observe(el: Element) {
    this.el = el;
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
    this.el = null;
  }
}

function fireContainerWidth(width: number) {
  for (const inst of roInstances) {
    if (!inst.el) continue;
    act(() => {
      inst.cb(
        [{ target: inst.el!, contentRect: { width } } as unknown as ResizeObserverEntry],
        inst as unknown as ResizeObserver,
      );
    });
  }
}

beforeEach(() => {
  roInstances = [];
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Structure and controlled state
// ---------------------------------------------------------------------------

describe('ListDetail structure', () => {
  it('renders the list region with the default accessible name and no detail region when closed', () => {
    render(<Harness />);
    expect(screen.getByRole('region', { name: patternsZhCN.listDetail.list })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: patternsZhCN.listDetail.detail })).toBeNull();
    expect(screen.getByRole('heading', { name: '记录列表标题' })).toBeInTheDocument();
  });

  it('renders the detail region with its default accessible name and back entry when open', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '打开 ARC-1' }));
    const detail = screen.getByRole('region', { name: patternsZhCN.listDetail.detail });
    expect(within(detail).getByTestId('detail-body')).toHaveTextContent('详情内容 ARC-1');
    expect(screen.getByRole('button', { name: patternsZhCN.listDetail.back })).toBeInTheDocument();
  });

  it('back and close labels follow prop > provider > built-in zhCN priority', () => {
    render(
      <PatternsMessagesProvider messages={{ listDetail: { back: 'Provider 文案' } }}>
        <Harness backLabel="属性文案" detailId="ARC-1" />
      </PatternsMessagesProvider>,
    );
    expect(screen.getByRole('button', { name: '属性文案' })).toBeInTheDocument();
  });

  it('label props override the region accessible names', () => {
    render(<Harness listLabel="档案集合" detailLabel="档案详情" detailId="ARC-1" />);
    expect(screen.getByRole('region', { name: '档案集合' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '档案详情' })).toBeInTheDocument();
  });
});

describe('ListDetail controlled state', () => {
  it('the back entry only reports the intent; the caller state closes the detail', async () => {
    const user = userEvent.setup();
    const onDetailChange = vi.fn();
    render(<Harness detailId="ARC-1" onDetailChange={onDetailChange} />);
    await user.click(screen.getByRole('button', { name: patternsZhCN.listDetail.back }));
    expect(onDetailChange).toHaveBeenCalledWith(null);
    // Controlled: the caller has not accepted the change, so the detail stays.
    expect(screen.getByRole('region', { name: patternsZhCN.listDetail.detail })).toBeInTheDocument();
  });

  it('uncontrolled usage closes internally via defaultDetailId state', async () => {
    const user = userEvent.setup();
    const onDetailChange = vi.fn();
    render(
      <ListDetail
        defaultDetailId="ARC-1"
        onDetailChange={onDetailChange}
        list={<p>列表</p>}
        detail={<p data-testid="detail-body">详情</p>}
      />,
    );
    expect(screen.getByTestId('detail-body')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: patternsZhCN.listDetail.back }));
    expect(onDetailChange).toHaveBeenCalledWith(null);
    expect(screen.queryByTestId('detail-body')).toBeNull();
  });

  it('an initially open uncontrolled detail does not steal focus on mount', () => {
    render(
      <ListDetail defaultDetailId="ARC-1" list={<p>列表</p>} detail={<p>详情</p>} />,
    );
    expect(screen.getByRole('button', { name: patternsZhCN.listDetail.back })).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });
});

// ---------------------------------------------------------------------------
// Focus contract (0.3.0-contracts §4.1–4.2)
// ---------------------------------------------------------------------------

describe('ListDetail focus', () => {
  it('opening moves focus to the detail back entry; closing returns it to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '打开 ARC-1' });
    await user.click(trigger);
    expect(screen.getByRole('button', { name: patternsZhCN.listDetail.back })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: patternsZhCN.listDetail.back }));
    expect(trigger).toHaveFocus();
  });

  it('closing falls back to the list region when the trigger no longer exists', async () => {
    const user = userEvent.setup();
    render(<VanishingTriggerHarness />);
    await user.click(screen.getByRole('button', { name: '打开 ARC-1' }));
    expect(screen.getByRole('button', { name: patternsZhCN.listDetail.back })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: patternsZhCN.listDetail.back }));
    expect(screen.getByRole('region', { name: patternsZhCN.listDetail.list })).toHaveFocus();
  });

  it('rapid record switches settle on the latest detail without stale focus', async () => {
    const user = userEvent.setup();
    render(<Harness mode="split" records={['ARC-1', 'ARC-2']} />);
    await user.click(screen.getByRole('button', { name: '打开 ARC-1' }));
    expect(screen.getByTestId('detail-body')).toHaveTextContent('详情内容 ARC-1');
    await user.click(screen.getByRole('button', { name: '打开 ARC-2' }));
    expect(screen.getByTestId('detail-body')).toHaveTextContent('详情内容 ARC-2');
    // An id-only change fires no focus job at all: focus stays with the control the user
    // clicked, never jumping to a node from the previous record (0.3.0-contracts §4.1).
    expect(screen.getByRole('button', { name: '打开 ARC-2' })).toHaveFocus();
  });

  it('the list region is a stable focus fallback (tabIndex -1, not in tab order)', () => {
    render(<Harness />);
    const list = screen.getByRole('region', { name: patternsZhCN.listDetail.list });
    expect(list).toHaveAttribute('tabindex', '-1');
  });
});

// ---------------------------------------------------------------------------
// Mode contract (auto / split / overlay)
// ---------------------------------------------------------------------------

describe('ListDetail mode', () => {
  it('SSR renders the deterministic split structure without touching the browser', () => {
    const html = renderToString(
      <ListDetail mode="auto" list={<p>列表</p>} detail={<p>详情</p>} detailId="ARC-1" />,
    );
    expect(html).toContain('data-mode="split"');
    expect(html).toContain('data-open="true"');
    expect(html).not.toContain('data-mode="overlay"');
  });

  it('auto mode measures the container after mount and follows resizes', () => {
    const onModeResolve = vi.fn();
    const { container } = render(
      <Harness mode="auto" onModeResolve={onModeResolve} />,
    );
    const root = container.firstElementChild as HTMLElement;
    // jsdom reports width 0: the immediate post-mount measurement resolves overlay.
    expect(root).toHaveAttribute('data-mode', 'overlay');
    fireContainerWidth(900);
    expect(root).toHaveAttribute('data-mode', 'split');
    fireContainerWidth(300);
    expect(root).toHaveAttribute('data-mode', 'overlay');
    expect(onModeResolve).toHaveBeenLastCalledWith('overlay');
  });

  it('auto mode respects a custom threshold', () => {
    const { container } = render(<Harness mode="auto" modeThreshold={200} />);
    const root = container.firstElementChild as HTMLElement;
    fireContainerWidth(150);
    expect(root).toHaveAttribute('data-mode', 'overlay');
    fireContainerWidth(250);
    expect(root).toHaveAttribute('data-mode', 'split');
  });

  it('explicit mode never creates a ResizeObserver', () => {
    const { container } = render(<Harness mode="overlay" />);
    expect(container.firstElementChild).toHaveAttribute('data-mode', 'overlay');
    expect(roInstances).toHaveLength(0);
  });

  it('overlay mode hides the list with inert while the detail is open', async () => {
    const user = userEvent.setup();
    render(<Harness mode="overlay" />);
    const list = screen.getByRole('region', { name: patternsZhCN.listDetail.list });
    expect(list).not.toHaveAttribute('inert');
    await user.click(screen.getByRole('button', { name: '打开 ARC-1' }));
    expect(list).toHaveAttribute('inert');
    expect(screen.getByRole('region', { name: patternsZhCN.listDetail.detail })).not.toHaveAttribute('inert');
    await user.click(screen.getByRole('button', { name: patternsZhCN.listDetail.back }));
    expect(list).not.toHaveAttribute('inert');
  });

  it('split mode keeps both regions active while the detail is open', async () => {
    const user = userEvent.setup();
    render(<Harness mode="split" />);
    await user.click(screen.getByRole('button', { name: '打开 ARC-1' }));
    expect(screen.getByRole('region', { name: patternsZhCN.listDetail.list })).not.toHaveAttribute('inert');
  });

  it('two instances on one page do not share mode, open state or detail content', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Harness mode="overlay" detail={<p data-testid="detail-body">实例一详情</p>} />
        <Harness mode="split" detail={<p data-testid="detail-body-2">实例二详情</p>} />
      </div>,
    );
    await user.click(screen.getAllByRole('button', { name: '打开 ARC-1' })[0]!);
    const details = screen.getAllByRole('region', { name: patternsZhCN.listDetail.detail });
    expect(details).toHaveLength(1);
    expect(screen.getByTestId('detail-body')).toHaveTextContent('实例一详情');
    // The second instance stays closed and its list stays active.
    const lists = screen.getAllByRole('region', { name: patternsZhCN.listDetail.list });
    expect(lists[0]!).toHaveAttribute('inert');
    expect(lists[1]!).not.toHaveAttribute('inert');
  });

  it('the list scroll position survives an overlay open/close round trip', async () => {
    const user = userEvent.setup();
    render(<Harness mode="overlay" />);
    const list = screen.getByRole('region', { name: patternsZhCN.listDetail.list });
    act(() => {
      list.scrollTop = 120;
    });
    await user.click(screen.getByRole('button', { name: '打开 ARC-1' }));
    await user.click(screen.getByRole('button', { name: patternsZhCN.listDetail.back }));
    expect(list.scrollTop).toBe(120);
  });
});
