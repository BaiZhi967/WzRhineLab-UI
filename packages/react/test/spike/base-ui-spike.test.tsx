/**
 * ADR-0001 validation spike: verifies that Base UI primitives satisfy the
 * keyboard / focus / lifecycle requirements in ACCESSIBILITY.md and MOTION.md
 * when composed with motion/react. Kept as a regression suite after the ADR.
 */
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Select } from '@base-ui/react/select';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

function MotionDialog({ onClosed }: { onClosed?: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button">before</button>
      <Dialog.Root open={open} onOpenChange={setOpen} onOpenChangeComplete={(o) => !o && onClosed?.()}>
        <Dialog.Trigger>打开档案</Dialog.Trigger>
        <AnimatePresence>
          {open && (
            <Dialog.Portal keepMounted>
              <Dialog.Backdrop data-testid="backdrop" />
              <Dialog.Popup
                render={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.01 }}
                  />
                }
              >
                <Dialog.Title>确认归档</Dialog.Title>
                <Dialog.Description>归档后记录变为只读。</Dialog.Description>
                <input aria-label="备注" />
                <Dialog.Close>取消</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
      <button type="button">after</button>
    </>
  );
}

describe('Base UI Dialog + motion/react', () => {
  it('exposes dialog semantics with labelled title and description', async () => {
    const user = userEvent.setup();
    render(<MotionDialog />);
    await user.click(screen.getByRole('button', { name: '打开档案' }));
    const dialog = await screen.findByRole('dialog', { name: '确认归档' });
    expect(dialog).toHaveAccessibleDescription('归档后记录变为只读。');
  });

  it('moves focus inside, traps Tab, closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    const onClosed = vi.fn();
    render(<MotionDialog onClosed={onClosed} />);
    const trigger = screen.getByRole('button', { name: '打开档案' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    // Tab-wrapping relies on focus guards that jsdom does not redirect (focus lands on <body>
    // after the last guard). The trap is asserted in a real browser: apps/docs/e2e/base-ui-spike.spec.ts.
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(onClosed).toHaveBeenCalled());
  });

  it('marks the rest of the page inert while modal', async () => {
    const user = userEvent.setup();
    render(<MotionDialog />);
    await user.click(screen.getByRole('button', { name: '打开档案' }));
    await screen.findByRole('dialog');
    // Outside content is hidden from the accessibility tree.
    expect(screen.queryByRole('button', { name: 'before' })).toBeNull();
    expect(screen.getByRole('button', { name: 'before', hidden: true })).toBeInTheDocument();
  });

  it('unmounts after the exit animation and survives rapid toggling', async () => {
    const user = userEvent.setup();
    render(<MotionDialog />);
    const trigger = screen.getByRole('button', { name: '打开档案' });
    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  });

  it('closes instantly under reduced motion', async () => {
    const user = userEvent.setup();
    render(
      <MotionConfig reducedMotion="always">
        <MotionDialog />
      </MotionConfig>,
    );
    await user.click(screen.getByRole('button', { name: '打开档案' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  });
});

describe('Base UI Field', () => {
  it('wires label, description and error to the control', async () => {
    const user = userEvent.setup();
    render(
      <form noValidate>
        <Field.Root validationMode="onBlur">
          <Field.Label>记录编号</Field.Label>
          <Field.Control required placeholder="ARC-0000" />
          <Field.Description>编号由归档系统分配。</Field.Description>
          <Field.Error match="valueMissing">请填写记录编号。</Field.Error>
        </Field.Root>
        <button type="button">next</button>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: '记录编号' });
    expect(input).toHaveAccessibleDescription('编号由归档系统分配。');
    // Base UI only reports valueMissing after the value was edited (noise reduction); submit still validates.
    await user.click(input);
    await user.tab();
    expect(input).not.toHaveAttribute('aria-invalid');
    await user.type(input, 'A');
    await user.clear(input);
    await user.tab();
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(input).toHaveAccessibleDescription(expect.stringContaining('请填写记录编号。'));
  });

  it('propagates disabled from Root', () => {
    render(
      <Field.Root disabled>
        <Field.Label>名称</Field.Label>
        <Field.Control />
      </Field.Root>,
    );
    expect(screen.getByRole('textbox', { name: '名称' })).toBeDisabled();
  });
});

describe('Base UI Select', () => {
  const items = [
    { value: 'specimen', label: '样本' },
    { value: 'experiment', label: '实验' },
    { value: 'report', label: '外勤报告' },
  ];

  function ArchiveSelect({ onChange }: { onChange?: (v: string | null) => void }) {
    return (
      <Field.Root>
        <Field.Label nativeLabel={false} render={<div />}>
          类别
        </Field.Label>
        <Select.Root items={items} onValueChange={(v) => onChange?.(v as string | null)}>
          <Select.Trigger>
            <Select.Value placeholder="选择类别" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {items.map((item) => (
                    <Select.Item key={item.value} value={item.value}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </Field.Root>
    );
  }

  it('is a labelled combobox that opens with the keyboard and selects with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ArchiveSelect onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: '类别' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape without changing the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ArchiveSelect onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: '类别' }));
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });
});
