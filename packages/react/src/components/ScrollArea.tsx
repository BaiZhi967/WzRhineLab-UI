'use client';

import * as React from 'react';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import { cx } from '../utils/cx.js';

/**
 * Scroll container with an overlay scrollbar (Base UI scroll-area, ADR-0001). The viewport is the
 * native scroller, so wheel, touch, trackpad, keyboard (↑ ↓ PageUp PageDown Home End Space once
 * focused), find-in-page and `scrollTo` all keep working; the custom thumb only mirrors it and can
 * be dragged. The viewport is a named `role="region"`; Base UI puts it in the tab order only while
 * it actually overflows (axe `scrollable-region-focusable`), so a short list adds no tab stop.
 * Under `forced-colors: active` the overlay is hidden and the native scrollbar comes back.
 * Motion: the overlay fades in on hover / scroll / focus (CSS opacity, --rl-motion-fast; tokens are
 * 0 under reduced motion).
 *
 * `onScrollIntentUp` reports user intent to move up — wheel up, ↑ / PageUp / Home / Shift+Space on
 * the focused viewport, dragging the thumb upward, or pressing the track above the thumb — and is
 * never called for programmatic scrolling. Use it to leave "follow latest" modes. It may fire many
 * times per gesture (once per event); it fires even at the top edge, because it is intent, not
 * position.
 *
 *   <ScrollArea label="运行日志" maxHeight="20rem">{lines}</ScrollArea>
 */

export type ScrollAreaOrientation = 'vertical' | 'both';

export type ScrollAreaProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onScroll' | 'aria-label' | 'role'> & {
  /** Accessible name of the scrollable region, e.g. 「运行日志」. */
  label: string;
  children: React.ReactNode;
  /** Ref to the native scroller (for `scrollTo`, measuring, observers). */
  viewportRef?: React.Ref<HTMLDivElement>;
  /** CSS length that caps the viewport height, e.g. `"20rem"`. Without it the area fills its parent. */
  maxHeight?: string;
  /** `vertical` (default) wraps content to the width; `both` also scrolls horizontally. */
  orientation?: ScrollAreaOrientation;
  /** Native scroll events of the viewport. */
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  /** The user tried to scroll up (see component docs). */
  onScrollIntentUp?: () => void;
  /** Class on the viewport, for padding or content layout. */
  viewportClassName?: string;
};

const UP_KEYS = new Set(['ArrowUp', 'PageUp', 'Home']);

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { label, children, viewportRef, maxHeight, orientation = 'vertical', onScroll, onScrollIntentUp, viewportClassName, className, style, ...rest },
  ref,
) {
  const dragY = React.useRef<number | null>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const both = orientation === 'both';

  const intent = onScrollIntentUp;
  const viewportHandlers = intent
    ? {
        onWheel: (event: React.WheelEvent<HTMLDivElement>) => {
          if (event.deltaY < 0) intent();
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
          if (UP_KEYS.has(event.key) || (event.key === ' ' && event.shiftKey)) intent();
        },
      }
    : {};

  const scrollbarHandlers = intent
    ? {
        onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
          const thumb = thumbRef.current;
          if (!thumb || thumb.contains(event.target as Node)) return;
          // Pressing the track above the thumb pages up.
          if (event.clientY < thumb.getBoundingClientRect().top) intent();
        },
      }
    : {};

  const thumbHandlers = intent
    ? {
        onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
          dragY.current = event.clientY;
        },
        onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
          if (dragY.current === null) return;
          if (event.clientY < dragY.current) intent();
          dragY.current = event.clientY;
        },
        onPointerUp: () => {
          dragY.current = null;
        },
        onPointerCancel: () => {
          dragY.current = null;
        },
      }
    : {};

  const rootStyle = maxHeight !== undefined ? ({ ...style, '--rl-scroll-area-max-height': maxHeight } as React.CSSProperties) : style;

  return (
    <BaseScrollArea.Root
      {...rest}
      ref={ref}
      className={cx('rl-scroll-area', className)}
      data-slot="scroll-area"
      data-orientation={orientation}
      style={rootStyle}
    >
      <BaseScrollArea.Viewport
        ref={viewportRef}
        role="region"
        aria-label={label}
        className={cx('rl-scroll-area__viewport', viewportClassName)}
        // Vertical-only areas wrap to the width instead of growing a horizontal scroller.
        style={both ? undefined : { overflowX: 'hidden' }}
        onScroll={onScroll}
        {...viewportHandlers}
      >
        <BaseScrollArea.Content className="rl-scroll-area__content" style={both ? undefined : { minWidth: 0 }}>
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar className="rl-scroll-area__scrollbar" orientation="vertical" {...scrollbarHandlers}>
        <BaseScrollArea.Thumb ref={thumbRef} className="rl-scroll-area__thumb" {...thumbHandlers} />
      </BaseScrollArea.Scrollbar>
      {both && (
        <>
          <BaseScrollArea.Scrollbar className="rl-scroll-area__scrollbar" orientation="horizontal">
            <BaseScrollArea.Thumb className="rl-scroll-area__thumb" />
          </BaseScrollArea.Scrollbar>
          <BaseScrollArea.Corner className="rl-scroll-area__corner" />
        </>
      )}
    </BaseScrollArea.Root>
  );
});
