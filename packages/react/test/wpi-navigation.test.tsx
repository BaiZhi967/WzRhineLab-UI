import * as React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Workbench, WorkbenchIndex, NavRail, NavItem, NavList, NavGroup, Tree, ResizeHandle, RhineProvider } from '../src/index.js';

describe('Wpi workbench and navigation', () => {
  it('keeps the shared header and controls index width and restores focus on collapse', async () => {
    const size = vi.fn();
    const ui = (open: boolean) => <RhineProvider><Workbench indexOpen={open} indexSize={260} indexMin={200} indexMax={400} onIndexSizeChange={size} rail={<p>Rail</p>} header={<p>Shared header</p>} index={<button>Index action</button>}><p>Reading</p></Workbench></RhineProvider>;
    const { rerender } = render(ui(true));
    const index = screen.getByRole('button', { name: 'Index action' });
    index.focus();
    rerender(ui(false));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Index action' })).toBeNull();
    expect(screen.getByText('Shared header')).toBeInTheDocument();
    rerender(ui(true));
    const separator = screen.getByRole('separator');
    act(() => separator.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(size).toHaveBeenCalledWith(276);
  });

  it('registers route-owned content in one shared index and cleans it on unmount', () => {
    const ui = (route: boolean) => <RhineProvider><Workbench header={<p>Header</p>}><p>Reading</p>{route && <WorkbenchIndex><p>Route index</p></WorkbenchIndex>}</Workbench></RhineProvider>;
    const { rerender } = render(ui(true));
    expect(within(screen.getByRole('complementary', { name: '索引' })).getByText('Route index')).toBeInTheDocument();
    rerender(ui(false));
    expect(screen.queryByText('Route index')).toBeNull();
  });

  it('moves a single tab stop through rail items including routed links', async () => {
    render(<RhineProvider><NavRail aria-label="Modules" collapsed><NavItem label="Agent" active icon={<span />} render={<a href="/agent" />} /><NavItem label="Disabled" disabled /><NavItem label="Settings" href="/settings" /></NavRail><NavList aria-label="Categories"><NavGroup label="General"><NavItem label="Models" active /><NavItem label="Skills" /></NavGroup></NavList></RhineProvider>);
    const agent = screen.getByRole('link', { name: 'Agent' });
    const settings = screen.getByRole('link', { name: 'Settings' });
    expect(agent).toHaveAttribute('aria-current', 'page');
    expect(settings.tabIndex).toBe(-1);
    act(() => agent.focus());
    await userEvent.keyboard('{ArrowDown}');
    expect(settings).toHaveFocus();
    expect(settings.tabIndex).toBe(0);
    const models = screen.getByRole('button', { name: 'Models' });
    act(() => models.focus());
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Skills' })).toHaveFocus();
  });
});

describe('Tree', () => {
  const nodes = [{ id: 'root', label: 'Root', children: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] }, { id: 'z', label: 'Zulu' }];
  it('supports expansion, parent traversal, roving focus and typeahead', async () => {
    const onSelect = vi.fn();
    render(<RhineProvider><Tree label="Workspace" nodes={nodes} onSelect={onSelect} /></RhineProvider>);
    const root = screen.getByRole('treeitem', { name: 'Root' });
    act(() => root.focus());
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: 'Alpha' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
    await userEvent.keyboard('{ArrowLeft}');
    expect(root).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(root).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('z');
    expect(screen.getByRole('treeitem', { name: 'Zulu' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(root).toHaveFocus();
  });

  it('requests lazy children, preserves loaded rows on failure and retries', async () => {
    const load = vi.fn();
    const node = { id: 'root', label: 'Root', hasChildren: true, error: 'Offline' };
    render(<RhineProvider><Tree label="Workspace" nodes={[node]} defaultExpandedIds={['root']} onLoadChildren={load} /></RhineProvider>);
    expect(screen.getByRole('alert')).toHaveTextContent('Offline');
    await userEvent.click(screen.getByRole('button', { name: /重试.*Root/ }));
    expect(load).toHaveBeenCalledWith(node);
  });
});

it('ends only the active pointer drag and reports current drag state', () => {
  const onDraggingChange = vi.fn();
  const Pointer = class extends MouseEvent { pointerId: number; constructor(type: string, init: PointerEventInit) { super(type, init); this.pointerId = init.pointerId ?? 0; } };
  vi.stubGlobal('PointerEvent', Pointer);
  render(<RhineProvider><ResizeHandle pane="start" defaultSize={260} min={200} max={400} onDraggingChange={onDraggingChange} getAriaValueText={(value) => `${value} pixels`} /></RhineProvider>);
  const handle = screen.getByRole('separator');
  fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 200 });
  fireEvent.pointerCancel(handle, { pointerId: 2 });
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 230 });
  expect(handle).toHaveAttribute('aria-valuenow', '290');
  expect(handle).toHaveAttribute('data-dragging');
  expect(handle).toHaveAttribute('aria-valuetext', '290 pixels');
  fireEvent.pointerUp(handle, { pointerId: 1 });
  expect(onDraggingChange.mock.calls).toEqual([[true], [false]]);
  vi.unstubAllGlobals();
});
