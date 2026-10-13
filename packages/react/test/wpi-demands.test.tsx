import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Alert,
  AlertDialog,
  Button,
  CountBadge,
  Dialog,
  Fieldset,
  Form,
  Icon,
  NavGroup,
  NavItem,
  NavList,
  NavRail,
  Popover,
  Radio,
  RadioGroup,
  ResizeHandle,
  RhineProvider,
  Tag,
  Tree,
  Workbench,
} from '../src/index.js';

const wrap = (ui: React.ReactNode) => render(<RhineProvider>{ui}</RhineProvider>);

describe('Wpi adoption React primitives', () => {
  it('exposes the shared icon entry and badge/tag semantics', async () => {
    const user = userEvent.setup();
    const remove = vi.fn();
    wrap(<><Icon name="Settings" aria-label="Settings" /><CountBadge value={12} max={9} live /><Tag tone="invalid" onRemove={remove}>Broken</Tag></>);
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    expect(screen.getByText('9+')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Broken' }));
    expect(remove).toHaveBeenCalledOnce();
  });

  it('supports an external popover anchor without stealing focus', async () => {
    const user = userEvent.setup();
    function Example() {
      const [open, setOpen] = React.useState(false);
      const anchor = React.useRef<HTMLButtonElement>(null);
      return <RhineProvider><button ref={anchor} onClick={() => setOpen(true)}>Open</button><Popover open={open} onOpenChange={setOpen} anchor={anchor} initialFocus={false} title="Menu"><button>Choice</button></Popover></RhineProvider>;
    }
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('provides keyboard navigation for nav lists, tree and resize drag state', async () => {
    const user = userEvent.setup();
    const dragging = vi.fn();
    wrap(<Workbench rail={<NavRail aria-label="Modules"><NavItem label="Agent" active /><NavItem label="Settings" /></NavRail>} index={<NavList aria-label="Settings"><NavGroup label="General"><NavItem label="Models" active /><NavItem label="Skills" /></NavGroup></NavList>}><Tree label="Workspace" nodes={[{ id: 'root', label: 'Root', children: [{ id: 'child', label: 'Child' }] }]} /><ResizeHandle min={200} max={400} defaultSize={240} onDraggingChange={dragging} /></Workbench>);
    const tree = screen.getByRole('tree');
    tree.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: 'Root' })).toBeInTheDocument();
    const handle = screen.getByRole('separator', { name: 'Resize panel' });
    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '224');
  });

  it('supports expanded form and destructive dialog options', async () => {
    wrap(<><Form disabled><Fieldset legend="Options" legendOptional><RadioGroup label="Mode" appearance="chip" hideLabel><Radio value="a" label="A" /></RadioGroup><Button tone="danger">Delete</Button></Fieldset></Form><AlertDialog title="Delete" description="Confirm" confirmLabel="Delete" confirmDisabled alternateAction={{ label: 'Keep draft', onClick: vi.fn() }} onConfirm={vi.fn()} defaultOpen /><Dialog title="Details" closeButton={false} finalFocus={null} defaultOpen /></>);
    expect(screen.getAllByRole('button', { name: 'Delete', hidden: true })[0]).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Keep draft', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
  });

  it('accepts compact alerts and optional legends', () => {
    wrap(<><Alert size="sm" title="Notice">Message</Alert><Fieldset legend="Optional" legendOptional /></>);
    expect(screen.getByText('Notice')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });
});
