import * as React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { usePortalContainer } from '../provider/portal';
import { cx } from '../utils/cx';
import type { InputSize } from './Input';

/**
 * Single-value select on Base UI Select (ADR-0001): combobox + listbox semantics, typeahead,
 * arrow/Home/End navigation, Escape to cancel, focus return. Inside `<Field>` it takes the
 * field's label, description, error and validity; standalone, pass `aria-label`.
 * Popup motion is a CSS transition on Base UI's starting/ending styles (--rl-motion-fast).
 */

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectGroup {
  label: React.ReactNode;
  options: readonly SelectOption[];
}

export type SelectProps = {
  options: readonly (SelectOption | SelectGroup)[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: React.ReactNode;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  size?: InputSize;
  /** Mark invalid outside a Field (inside a Field, validity comes from Field). */
  invalid?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
};

const isGroup = (item: SelectOption | SelectGroup): item is SelectGroup => 'options' in item;

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" focusable="false">
      <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" focusable="false">
      <path d="m3 8.5 3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Option({ option }: { option: SelectOption }) {
  return (
    <BaseSelect.Item value={option.value} disabled={option.disabled} className="rl-select__item">
      <BaseSelect.ItemIndicator className="rl-select__indicator">
        <Check />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className="rl-select__item-text">{option.label}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder = '请选择',
    name,
    required,
    disabled,
    readOnly,
    size = 'md',
    invalid,
    open,
    onOpenChange,
    id,
    className,
    ...aria
  },
  ref,
) {
  const container = usePortalContainer();
  const items = React.useMemo(
    () => options.flatMap((o) => (isGroup(o) ? o.options : [o])).map((o) => ({ value: o.value, label: o.label })),
    [options],
  );

  return (
    <BaseSelect.Root
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (v) => onValueChange((v as string | null) ?? null) : undefined}
      name={name}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      open={open}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      id={id}
    >
      <BaseSelect.Trigger
        {...aria}
        ref={ref}
        {...(invalid ? { 'aria-invalid': true } : null)}
        className={cx('rl-select', className)}
        data-slot="select"
        data-size={size}
        data-invalid={invalid || undefined}
      >
        <BaseSelect.Value className="rl-select__value" placeholder={placeholder} />
        <BaseSelect.Icon className="rl-select__icon">
          <Chevron />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal container={container}>
        <BaseSelect.Positioner
          className="rl-select__positioner"
          sideOffset={4}
          collisionPadding={8}
          alignItemWithTrigger={false}
          positionMethod="fixed"
        >
          <BaseSelect.Popup className="rl-select__popup">
            <BaseSelect.List className="rl-select__list">
              {options.map((item, index) =>
                isGroup(item) ? (
                  <BaseSelect.Group key={`g-${index}`} className="rl-select__group">
                    <BaseSelect.GroupLabel className="rl-select__group-label">{item.label}</BaseSelect.GroupLabel>
                    {item.options.map((o) => (
                      <Option key={o.value} option={o} />
                    ))}
                  </BaseSelect.Group>
                ) : (
                  <Option key={item.value} option={item} />
                ),
              )}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
});
