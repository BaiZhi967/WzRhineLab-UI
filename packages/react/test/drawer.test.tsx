import * as React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, Drawer, RhineProvider } from '../src';
import type { DrawerProps } from '../src';
import { DrawerClose } from '../src/components/Drawer';
import type { DrawerCloseReason } from '../src/components/Drawer';

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof RhineProvider>> = {}) =>
  render(<RhineProvider {...props}>{ui}</RhineProvider>);

function RecordDrawer(props: Partial<DrawerProps>) {
  return (
    <Drawer
      trigger={<Button variant="secondary">查看详情</Button>}
      eyebrow="ARCHIVE / DETAIL"
      title="ARC-1024"
      description="记录详情"
      actions={
        <>
          <DrawerClose>
            <Button variant="ghost">取消</Button>
          </DrawerClose>
          <Button>保存</Button>
        </>
      }
      {...props}
    >
      <p>样例内容</p>
    </Drawer>
  );
}

/** jsdom has no matchMedia; install one that answers the bottom-sheet query. */
function mockViewport(narrow: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: narrow && query.includes('max-width'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Drawer', () => {
  it('opens from the trigger as a labelled modal dialog inside the provider portal', async () => {
    const user = userEvent.setup();
    const { container } = wrap(<RecordDrawer />);
    await user.click(screen.getByRole('button', { name: '查看详情' }));
    const drawer = await screen.findByRole('dialog', { name: 'ARC-1024' });
    expect(drawer).toHaveAccessibleDescription('记录详情');
    expect(container.querySelector('.rl-portal')!.contains(drawer)).toBe(true);
    expect(drawer).toHaveClass('rl-drawer');
    expect(drawer).toHaveAttribute('data-size', 'md');
    expect(drawer.querySelector('.rl-dialog__eyebrow')).toHaveTextContent('ARCHIVE / DETAIL');
    expect(drawer.querySelector('footer.rl-drawer__actions')).not.toBeNull();
    // Focus moves into the drawer.
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
  });

  it('has a header close button named by closeLabel', async () => {
    const user = userEvent.setup();
    wrap(<RecordDrawer closeLabel="收起详情" />);
    await user.click(screen.getByRole('button', { name: '查看详情' }));
    const drawer = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: '收起详情' });
    expect(drawer.querySelector('header')!.contains(close)).toBe(true);
    await user.click(close);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('default close label is 关闭', async () => {
    wrap(<RecordDrawer defaultOpen />);
    expect(await screen.findByRole('button', { name: '关闭' })).toBeInTheDocument();
  });

  it('Escape closes, focus returns to the trigger and onClosed fires once', async () => {
    const user = userEvent.setup();
    const onClosed = vi.fn();
    const onOpenChange = vi.fn();
    wrap(<RecordDrawer onClosed={onClosed} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: '查看详情' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
  });

  it('DrawerClose in the actions closes the drawer', async () => {
    const user = userEvent.setup();
    wrap(<RecordDrawer />);
    await user.click(screen.getByRole('button', { name: '查看详情' }));
    await user.click(await screen.findByRole('button', { name: '取消' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('onCloseRequest receives the reason and false keeps the drawer open', async () => {
    const user = userEvent.setup();
    const reasons: DrawerCloseReason[] = [];
    let allow = false;
    wrap(
      <RecordDrawer
        onCloseRequest={(reason) => {
          reasons.push(reason);
          return allow;
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: '查看详情' }));
    const drawer = await screen.findByRole('dialog');
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    // A refused close must not even start closing (no exit transition, no closed state).
    const seen = new Set<string>();
    const observer = new MutationObserver(() => {
      for (const attr of ['data-ending-style', 'data-closed']) if (drawer.hasAttribute(attr)) seen.add(attr);
    });
    observer.observe(drawer, { attributes: true });
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: '关闭' }));
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(reasons).toEqual(['escape', 'close-button', 'close-button']);
    expect(screen.getByRole('dialog')).toBe(drawer);
    await new Promise((r) => setTimeout(r, 50));
    observer.disconnect();
    expect([...seen]).toEqual([]);
    expect(drawer).toHaveAttribute('data-open');
    allow = true;
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('a backdrop click reports reason outside', async () => {
    const user = userEvent.setup();
    const onCloseRequest = vi.fn(() => false);
    const { container } = wrap(<RecordDrawer onCloseRequest={onCloseRequest} />);
    await user.click(screen.getByRole('button', { name: '查看详情' }));
    await screen.findByRole('dialog');
    await user.click(container.querySelector('.rl-drawer__backdrop')!);
    expect(onCloseRequest).toHaveBeenCalledWith('outside');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('programmatic close skips onCloseRequest', async () => {
    const onCloseRequest = vi.fn(() => false);
    function Controlled() {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(false)}>
            外部关闭
          </button>
          <Drawer open={open} onOpenChange={setOpen} title="外部控制" onCloseRequest={onCloseRequest} />
        </>
      );
    }
    wrap(<Controlled />);
    await screen.findByRole('dialog', { name: '外部控制' });
    // The page behind is inert (aria-hidden) while modal, so reach the button through the DOM.
    const outside = [...document.querySelectorAll('button')].find((b) => b.textContent === '外部关闭')!;
    act(() => outside.click());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onCloseRequest).not.toHaveBeenCalled();
  });

  it('side panel on wide viewports: end → right, start → left, swipe matches', async () => {
    mockViewport(false);
    const { unmount } = wrap(<RecordDrawer defaultOpen />);
    const end = await screen.findByRole('dialog');
    expect(end).toHaveAttribute('data-placement', 'right');
    expect(end).toHaveAttribute('data-swipe-direction', 'right');
    unmount();
    wrap(<RecordDrawer defaultOpen side="start" size="lg" />);
    const start = await screen.findByRole('dialog');
    expect(start).toHaveAttribute('data-placement', 'left');
    expect(start).toHaveAttribute('data-swipe-direction', 'left');
    expect(start).toHaveAttribute('data-size', 'lg');
  });

  it('side follows the writing direction (rtl mirrors start / end)', async () => {
    mockViewport(false);
    wrap(
      <RecordDrawer defaultOpen />,
      { dir: 'rtl' },
    );
    const drawer = await screen.findByRole('dialog');
    await waitFor(() => expect(drawer).toHaveAttribute('data-placement', 'left'));
    expect(drawer).toHaveAttribute('data-swipe-direction', 'left');
  });

  it('bottom sheet below 40rem with swipe down', async () => {
    mockViewport(true);
    wrap(<RecordDrawer defaultOpen side="start" />);
    const drawer = await screen.findByRole('dialog');
    expect(drawer).toHaveAttribute('data-placement', 'bottom');
    expect(drawer).toHaveAttribute('data-swipe-direction', 'down');
  });

  it('renders nothing in the portal until opened', () => {
    const { container } = wrap(<RecordDrawer />);
    expect(container.querySelector('.rl-drawer')).toBeNull();
    expect(container.querySelector('.rl-drawer__backdrop')).toBeNull();
  });

  it('closes under forced reduced motion', async () => {
    const user = userEvent.setup();
    wrap(<RecordDrawer />, { motion: 'reduce' });
    await user.click(screen.getByRole('button', { name: '查看详情' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('Drawer styles', () => {
  const css = readFileSync(resolve(__dirname, '../src/drawer.css'), 'utf8');
  const section = css.slice(css.indexOf('/* ---------- Drawer ---------- */'), css.indexOf('/* ---------- end Drawer ---------- */'));

  it('reduced motion drops the slide under both the media query and the provider attribute', () => {
    const media = section.slice(section.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(media).toMatch(/\.rl-drawer\[data-starting-style\][\s\S]*?transform:\s*none/);
    expect(section).toMatch(/\.rl-theme\[data-rl-motion='reduce'\] \.rl-drawer\[data-starting-style\][\s\S]*?transform:\s*none/);
  });

  it('swiping disables transitions and enter / exit use the panel motion token', () => {
    expect(section).toMatch(/\.rl-drawer\[data-swiping\][\s\S]*?transition-duration:\s*var\(--rl-motion-instant\)/);
    expect(section).toMatch(/transform var\(--rl-motion-panel\) var\(--rl-ease-out\)/);
    expect(section).toMatch(/max-height:\s*85dvh/);
  });
});
