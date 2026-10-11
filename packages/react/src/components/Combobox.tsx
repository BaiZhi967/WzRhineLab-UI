'use client';

import * as React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { useRhineLocale } from '../provider/messages.js';
import { usePortalContainer } from '../provider/portal.js';
import { cx } from '../utils/cx.js';
import { Field } from './Field.js';
import type { InputSize } from './Input.js';
import { Spinner } from './Spinner.js';

/**
 * Searchable single-value select on Base UI Combobox (ADR-0001, ADR-0010 §2): a text input that
 * filters a listbox. Base UI provides the combobox / listbox semantics, `aria-activedescendant`
 * navigation (↓ opens, ↑ / ↓ move, Enter selects, Esc closes, then clears), Home / End in the input,
 * and IME handling (filtering waits for `compositionend`; Enter during composition does not select).
 * The label, description and error come from the built-in Field.
 *
 *   <Combobox label="档案类别" items={categories} name="category" />
 *
 * Server-side search: pass `filter={null}`, drive `items` from `onInputValueChange` and show
 * `loading` while a request is in flight. Popup motion is a CSS transition (--rl-motion-fast).
 */

export interface ComboboxOption {
  /** Submitted value and the key of the option. */
  value: string;
  /** Visible text; also what the input shows once selected and what the default filter matches. */
  label: string;
  /** Secondary line under the label. */
  description?: React.ReactNode;
  disabled?: boolean;
  /** Group heading; options sharing it are listed together in first-seen order. */
  group?: string;
}

/** Return `true` when `option` matches the typed `query` (already trimmed). */
export type ComboboxFilter = (option: ComboboxOption, query: string) => boolean;

export type ComboboxProps = {
  /** Visible label and accessible name of the input. */
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Error text; shown on native validity failure, or always together with `invalid`. */
  error?: React.ReactNode;
  items: readonly ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Text in the input (controlled). Use with `onInputValueChange` for async search. */
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (inputValue: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shows a status row with a spinner and marks the list busy. */
  loading?: boolean;
  /** Status text while `loading` (default from messages). */
  loadingText?: React.ReactNode;
  /** Shown when nothing matches (default from messages). */
  emptyText?: React.ReactNode;
  /**
   * Matching logic. Default: locale-aware "contains" on `label`. `null` turns filtering off,
   * for results that are already filtered on the server.
   */
  filter?: ComboboxFilter | null;
  placeholder?: string;
  /** Form field name; the selected `value` is submitted. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  size?: InputSize;
  /** Show the clear button while a value is selected (default `true`). */
  clearable?: boolean;
  /** Accessible name of the clear button (default from messages). */
  clearLabel?: string;
  /** Accessible name of the open-list button (default from messages). */
  openLabel?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
};

type OptionGroup = { label: string; items: ComboboxOption[] };

/** Groups in first-seen order; ungrouped options form a heading-less group of their own. */
function groupOptions(items: readonly ComboboxOption[]): OptionGroup[] | null {
  if (!items.some((item) => item.group != null && item.group !== '')) return null;
  const groups = new Map<string, OptionGroup>();
  for (const item of items) {
    const key = item.group ?? '';
    let group = groups.get(key);
    if (!group) {
      group = { label: key, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()];
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" focusable="false">
      <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" focusable="false">
      <path d="m4.5 4.5 7 7m0-7-7 7" strokeLinecap="round" />
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

function Option({ option }: { option: ComboboxOption }) {
  return (
    <BaseCombobox.Item value={option.value} disabled={option.disabled} className="rl-combobox__item">
      <BaseCombobox.ItemIndicator className="rl-combobox__indicator">
        <Check />
      </BaseCombobox.ItemIndicator>
      <span className="rl-combobox__item-text">
        <span className="rl-combobox__item-label">{option.label}</span>
        {option.description != null && <span className="rl-combobox__item-description">{option.description}</span>}
      </span>
    </BaseCombobox.Item>
  );
}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    label,
    description,
    error,
    items,
    value,
    defaultValue,
    onValueChange,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    open,
    onOpenChange,
    loading = false,
    loadingText,
    emptyText,
    filter,
    placeholder,
    name,
    required,
    disabled,
    readOnly,
    invalid,
    size = 'md',
    clearable = true,
    clearLabel,
    openLabel,
    id,
    className,
    style,
  },
  ref,
) {
  const container = usePortalContainer();
  const { messages, locale } = useRhineLocale();
  const copy = messages.combobox;
  const triggerTextId = `${React.useId()}-open`;

  // Labels of every option seen so far, so a selected value keeps its label after async results change.
  const labels = React.useRef(new Map<string, string>());
  for (const item of items) labels.current.set(item.value, item.label);

  const groups = React.useMemo(() => groupOptions(items), [items]);
  const collection = React.useMemo(
    () =>
      BaseCombobox.createItems<ComboboxOption, string>(groups ?? (items as ComboboxOption[]), {
        getValue: (item) => item.value,
        getLabel: (item) => item.label,
      }),
    [groups, items],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement> & { preventBaseUIHandler?: () => void }) => {
    // Belt and braces for IME: Base UI already ignores keyCode 229; some engines only set isComposing.
    if (event.nativeEvent.isComposing) event.preventBaseUIHandler?.();
  };

  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      invalid={invalid}
      disabled={disabled}
      name={name}
      className={cx('rl-combobox-field', className)}
      style={style}
    >
      <BaseCombobox.Root<string, false, ComboboxOption>
        items={collection}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange ? (next) => onValueChange(next ?? null) : undefined}
        inputValue={inputValue}
        defaultInputValue={defaultInputValue}
        onInputValueChange={onInputValueChange ? (next) => onInputValueChange(next) : undefined}
        open={open}
        onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
        filter={filter === null ? null : filter ? (item, query) => filter(item, query) : undefined}
        itemToStringLabel={(v) => labels.current.get(v) ?? v}
        locale={locale}
        name={name}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        id={id}
      >
        <BaseCombobox.InputGroup
          className="rl-combobox"
          data-slot="combobox"
          data-size={size}
          data-invalid={invalid || undefined}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
        >
          <BaseCombobox.Input
            ref={ref}
            className="rl-combobox__input"
            placeholder={placeholder}
            {...(invalid ? { 'aria-invalid': true } : null)}
            onKeyDown={handleKeyDown}
          />
          {clearable && !readOnly && (
            <BaseCombobox.Clear className="rl-combobox__clear" aria-label={clearLabel ?? copy.clear}>
              <ClearIcon />
            </BaseCombobox.Clear>
          )}
          {/* Base UI labels the trigger with the field label; name it after its action instead. */}
          <BaseCombobox.Trigger className="rl-combobox__trigger" aria-labelledby={triggerTextId}>
            <Chevron />
            <span id={triggerTextId} className="rl-visually-hidden">
              {openLabel ?? copy.openList}
            </span>
          </BaseCombobox.Trigger>
        </BaseCombobox.InputGroup>
        <BaseCombobox.Portal container={container}>
          <BaseCombobox.Positioner className="rl-combobox__positioner" sideOffset={4} collisionPadding={8} positionMethod="fixed">
            <BaseCombobox.Popup className="rl-combobox__popup" aria-busy={loading || undefined}>
              {/* Live regions stay mounted; only their content changes (Base UI requirement). */}
              <BaseCombobox.Status className="rl-combobox__status">
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>{loadingText ?? copy.loading}</span>
                  </>
                ) : null}
              </BaseCombobox.Status>
              <BaseCombobox.Empty className="rl-combobox__empty">{loading ? null : (emptyText ?? copy.empty)}</BaseCombobox.Empty>
              <BaseCombobox.List className="rl-combobox__list">
                {groups
                  ? (group: OptionGroup) => (
                      <BaseCombobox.Group key={`g-${group.label}`} items={group.items} className="rl-combobox__group">
                        {group.label !== '' && <BaseCombobox.GroupLabel className="rl-combobox__group-label">{group.label}</BaseCombobox.GroupLabel>}
                        <BaseCombobox.Collection>{(option: ComboboxOption) => <Option key={option.value} option={option} />}</BaseCombobox.Collection>
                      </BaseCombobox.Group>
                    )
                  : (option: ComboboxOption) => <Option key={option.value} option={option} />}
              </BaseCombobox.List>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </Field>
  );
});
