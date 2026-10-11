'use client';

import * as React from 'react';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { cx } from '../utils/cx.js';

/**
 * Stacked disclosure sections on Base UI Accordion (ADR-0010 §2). Each header is a real heading
 * (`headingLevel`, default 3) wrapping a `<button>` with `aria-expanded` / `aria-controls`; the
 * panel is a labelled region. Height animates through Base UI's `--accordion-panel-height`
 * (CSS transition, interruptible); reduced motion zeroes the duration token, so it snaps.
 *
 * Keyboard: Tab moves between triggers, Enter / Space toggles. Base UI 1.9 follows the updated
 * APG guidance and no longer adds arrow-key roving focus between headers.
 *
 *   <Accordion items={[{ value: 'scope', title: '适用范围', content: '…' }]} />
 *   <Accordion multiple defaultValue={['a']}>
 *     <AccordionItem value="a" title="采样">…</AccordionItem>
 *   </Accordion>
 */

export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface AccordionItemData {
  /** Stable identifier used by `value` / `defaultValue`. */
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
  /** Secondary text at the end of the trigger (count, status). Part of the button's name. */
  meta?: React.ReactNode;
  disabled?: boolean;
}

export type AccordionProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> & {
  /** Convenience data form. Ignored when `children` is given. */
  items?: readonly AccordionItemData[];
  /** Composition form: `AccordionItem` elements. */
  children?: React.ReactNode;
  /** Allow more than one item open at a time (default: opening one closes the others). */
  multiple?: boolean;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Heading element wrapping each trigger; pick the level that fits the page outline. */
  headingLevel?: AccordionHeadingLevel;
  disabled?: boolean;
  /** Keep closed panels in the DOM (hidden). */
  keepMounted?: boolean;
  /** Closed panels use `hidden="until-found"` so browser find-in-page can open them. */
  hiddenUntilFound?: boolean;
};

export type AccordionItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'onChange'> & {
  value: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  disabled?: boolean;
  /** Overrides the parent Accordion's `headingLevel`. */
  headingLevel?: AccordionHeadingLevel;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
};

const HeadingLevelContext = React.createContext<AccordionHeadingLevel>(3);

function Chevron() {
  return (
    <svg className="rl-accordion__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { value, title, meta, disabled, headingLevel, children, onOpenChange, className, ...rest },
  ref,
) {
  const inheritedLevel = React.useContext(HeadingLevelContext);
  const Heading = `h${headingLevel ?? inheritedLevel}` as const;
  return (
    <BaseAccordion.Item
      {...rest}
      ref={ref}
      value={value}
      disabled={disabled}
      onOpenChange={onOpenChange ? (open) => onOpenChange(open) : undefined}
      className={cx('rl-accordion__item', className)}
    >
      <BaseAccordion.Header className="rl-accordion__header" render={<Heading />}>
        <BaseAccordion.Trigger className="rl-accordion__trigger">
          <span className="rl-accordion__title">{title}</span>
          {/* The space keeps title and meta apart in the accessible name; flex layout drops it visually. */}
          {meta != null && ' '}
          {meta != null && <span className="rl-accordion__meta">{meta}</span>}
          <Chevron />
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel className="rl-accordion__panel">
        <div className="rl-accordion__content">{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
});

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    items,
    children,
    multiple = false,
    value,
    defaultValue,
    onValueChange,
    headingLevel = 3,
    disabled,
    keepMounted,
    hiddenUntilFound,
    className,
    ...rest
  },
  ref,
) {
  return (
    <HeadingLevelContext.Provider value={headingLevel}>
      <BaseAccordion.Root<string>
        {...rest}
        ref={ref}
        multiple={multiple}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange ? (next) => onValueChange([...next]) : undefined}
        disabled={disabled}
        keepMounted={keepMounted}
        hiddenUntilFound={hiddenUntilFound}
        className={cx('rl-accordion', className)}
        data-slot="accordion"
      >
        {children ??
          items?.map((item) => (
            <AccordionItem key={item.value} value={item.value} title={item.title} meta={item.meta} disabled={item.disabled}>
              {item.content}
            </AccordionItem>
          ))}
      </BaseAccordion.Root>
    </HeadingLevelContext.Provider>
  );
});
