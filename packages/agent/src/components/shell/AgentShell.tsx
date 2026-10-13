'use client';

import * as React from 'react';
import { Drawer } from '@wzrhine/react';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { ResizeHandle } from './ResizeHandle.js';
import { useIsoLayoutEffect } from './use-controllable.js';

/**
 * AgentShell (atlas 01): the workbench frame. It owns regions, slots, focus and responsive
 * behaviour only; routing, window chrome and data stay with the host (ADR-0011 §9).
 *
 * Layout, from the inline start: `rail` (app navigation) · `index` (conversation index) · reading
 * column (`header` / `conversation` / `composer`) · ResizeHandle · `context` (side pane). Every
 * column scrolls on its own (`min-height: 0` + `overflow: auto`); reading content is capped at
 * `--rl-agent-reading-width` and centred, so wide screens never stretch long lines.
 *
 * Responsive: the shell measures its own width (ResizeObserver; without it the shell stays
 * `wide`), so two shells on one page, or a shell inside a card, decide independently.
 * - `wide`: every column inline.
 * - `compact` (< `breakpoints.context` rem): the context pane leaves the row first instead of
 *   squeezing the reading column; opening it shows a Drawer sheet.
 * - `narrow` (< `breakpoints.index` rem): the index becomes a sheet too and the rail is hidden;
 *   one reading column remains.
 * Shrinking past a breakpoint closes what no longer fits (`onContextOpenChange(false, 'layout')`,
 * so `aria-pressed` on toggles always matches what is visible) and growing back reopens it,
 * unless the user toggled it in between. Controlled hosts receive the same calls.
 *
 * Landmarks: the shell does not force `main`. The reading column is a `<section aria-label>`
 * (`mainLabel`); wrap the shell in `<main>` when it is the page's main content. The index is a
 * labelled section; AgentSidePane brings its own `complementary` landmark. Closing the inline
 * pane while focus is inside it returns focus to the element that was focused when it opened
 * (typically the header toggle); sheets restore focus through Drawer.
 *
 * Motion (ADR-0012): the inline pane opens / closes with a single-axis CSS translate + opacity
 * transition on `--rl-motion-panel`, interruptible and instant under reduced motion. Its width
 * is never animated: it appears at once on open and is released only after the exit fade.
 * Dragging the ResizeHandle follows the pointer directly.
 */

export type AgentShellLayout = 'wide' | 'compact' | 'narrow';
/** Why an open state changed: user toggle, sheet dismissal, layout breakpoint, a new selection. */
export type AgentShellOpenReason = 'toggle' | 'dismiss' | 'layout' | 'selection';

export interface AgentShellContextValue {
  layout: AgentShellLayout;
  hasContext: boolean;
  hasIndex: boolean;
  contextOpen: boolean;
  setContextOpen: (open: boolean, reason?: AgentShellOpenReason) => void;
  toggleContext: () => void;
  indexOpen: boolean;
  setIndexOpen: (open: boolean, reason?: AgentShellOpenReason) => void;
  /** The index is not visible as an inline column (narrow layout or collapsed). */
  indexCollapsed: boolean;
}

const ShellContext = React.createContext<AgentShellContextValue | null>(null);

/** Where the context slot is rendered right now. */
export type AgentContextPresentation = 'inline' | 'sheet' | 'standalone';
const PresentationContext = React.createContext<AgentContextPresentation>('standalone');

/** The nearest AgentShell's state and toggles, or `null` outside a shell. */
export function useAgentShell(): AgentShellContextValue | null {
  return React.useContext(ShellContext);
}

/** How the surrounding shell presents the context slot (AgentSidePane hides its close button in a sheet). */
export function useAgentContextPresentation(): AgentContextPresentation {
  return React.useContext(PresentationContext);
}

export type AgentShellProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** App navigation rail (hidden on narrow layouts; the host offers its own menu there). */
  rail?: React.ReactNode;
  /** Conversation index column, usually a ConversationList. */
  index?: React.ReactNode;
  header?: React.ReactNode;
  /** Main reading area (MessageList). */
  conversation?: React.ReactNode;
  /** Docked at the bottom of the reading column. */
  composer?: React.ReactNode;
  /** Side pane, usually an AgentSidePane. */
  context?: React.ReactNode;

  /** Accessible name of the reading column. */
  mainLabel?: string;
  /** Accessible name of the index column and title of the index sheet. */
  indexLabel?: string;
  /** Title of the context sheet on compact / narrow layouts. */
  contextLabel?: string;

  contextOpen?: boolean;
  defaultContextOpen?: boolean;
  onContextOpenChange?: (open: boolean, reason: AgentShellOpenReason) => void;
  indexOpen?: boolean;
  defaultIndexOpen?: boolean;
  onIndexOpenChange?: (open: boolean, reason: AgentShellOpenReason) => void;

  /** Width of the inline context pane in CSS pixels. */
  contextSize?: number;
  defaultContextSize?: number;
  onContextSizeChange?: (size: number) => void;
  readingMin?: number;
  resizeStep?: number;
  resizeLargeStep?: number;
  onContextClosed?: () => void;
  contextMin?: number;
  contextMax?: number;
  /** Show the ResizeHandle between reading column and pane (default true). */
  resizable?: boolean;

  /** Breakpoints in rem of the shell's own width (defaults: context 64, index 40). */
  breakpoints?: { context?: number; index?: number };
  /** Force a layout (tests, hosts that already know their size). Overrides measurement. */
  layout?: AgentShellLayout;
  /** Id of the conversation being read; a change closes the index sheet on narrow layouts. */
  activeId?: string;
};

const DEFAULT_BREAKPOINTS = { context: 64, index: 40 };
/** Reading column kept free when clamping the pane width (CSS pixels, 20rem at 16px). */
const READING_MIN = 320;
const rank: Record<AgentShellLayout, number> = { narrow: 0, compact: 1, wide: 2 };

function rootFontSize(): number {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return 16;
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

interface Measured {
  layout: AgentShellLayout;
  width: number;
  /** Width taken by the rail and index columns. */
  side: number;
}

function useShellMeasure(ref: React.RefObject<HTMLDivElement | null>, contextAt: number, indexAt: number): Measured {
  const [state, setState] = React.useState<Measured>({ layout: 'wide', width: 0, side: 0 });
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const width = Math.round(el.getBoundingClientRect().width);
      if (!width) return;
      const rem = rootFontSize();
      const layout: AgentShellLayout = width < indexAt * rem ? 'narrow' : width < contextAt * rem ? 'compact' : 'wide';
      let side = 0;
      for (const child of Array.from(el.children)) {
        if (child.matches('.rl-agent-shell__rail, .rl-agent-shell__index')) side += (child as HTMLElement).offsetWidth;
      }
      setState((prev) => (prev.layout === layout && prev.width === width && prev.side === side ? prev : { layout, width, side }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, contextAt, indexAt]);
  return state;
}

interface OpenState {
  open: boolean;
  set: (next: boolean, reason?: AgentShellOpenReason) => void;
  /** A layout change closed it; reopen when the layout allows again. */
  restore: React.MutableRefObject<boolean>;
}

function useOpenState(value: boolean | undefined, defaultValue: boolean, onChange?: (open: boolean, reason: AgentShellOpenReason) => void): OpenState {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const open = controlled ? value : inner;
  const latest = React.useRef(open);
  latest.current = open;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const restore = React.useRef(false);
  const set = React.useCallback(
    (next: boolean, reason: AgentShellOpenReason = 'toggle') => {
      if (reason !== 'layout') restore.current = false;
      if (next === latest.current) return;
      latest.current = next;
      if (!controlled) setInner(next);
      onChangeRef.current?.(next, reason);
    },
    [controlled],
  );
  return { open, set, restore };
}

/** Scroll container that is keyboard-focusable only while it actually overflows. */
function useScrollable<T extends HTMLElement>() {
  const [node, setNode] = React.useState<T | null>(null);
  const [scrollable, setScrollable] = React.useState(false);
  useIsoLayoutEffect(() => {
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => setScrollable(node.scrollHeight > node.clientHeight + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    const content = node.firstElementChild;
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [node]);
  return { ref: setNode, scrollable };
}

const present = (node: React.ReactNode) => node != null && node !== false;

export const AgentShell = React.forwardRef<HTMLDivElement, AgentShellProps>(function AgentShell(
  {
    rail,
    index,
    header,
    conversation,
    composer,
    context,
    mainLabel,
    indexLabel,
    contextLabel,
    contextOpen: contextOpenProp,
    defaultContextOpen = false,
    onContextOpenChange,
    indexOpen: indexOpenProp,
    defaultIndexOpen = true,
    onIndexOpenChange,
    contextSize,
    defaultContextSize = 352,
    onContextSizeChange,
    contextMin = 288,
    contextMax = 640,
    readingMin = READING_MIN,
    resizeStep = 16,
    resizeLargeStep = 64,
    onContextClosed,
    resizable = true,
    breakpoints,
    layout: layoutProp,
    activeId,
    className,
    style,
    ...rest
  },
  forwardedRef,
) {
  const messages = useAgentMessages().shell;
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const contextRef = React.useRef<HTMLDivElement | null>(null);
  const setRoot = React.useCallback(
    (el: HTMLDivElement | null) => {
      rootRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    },
    [forwardedRef],
  );
  const measured = useShellMeasure(rootRef, breakpoints?.context ?? DEFAULT_BREAKPOINTS.context, breakpoints?.index ?? DEFAULT_BREAKPOINTS.index);
  const layout = layoutProp ?? measured.layout;
  const hasContext = present(context);
  const hasIndex = present(index);

  const ctx = useOpenState(contextOpenProp, defaultContextOpen, onContextOpenChange);
  const idx = useOpenState(indexOpenProp, defaultIndexOpen, onIndexOpenChange);

  // Leaving a layout closes what no longer fits *before* a sheet could open for it: sheets only
  // follow `open` once the layout change has been reconciled (`synced`).
  // Starts from `wide` (the server / first-paint layout) so a narrow first measurement closes
  // what the defaults opened instead of popping a sheet on load.
  const [synced, setSynced] = React.useState<AgentShellLayout>('wide');
  useIsoLayoutEffect(() => {
    if (synced === layout) return;
    const reconcile = (state: OpenState, threshold: number) => {
      const was = rank[synced] >= threshold;
      const is = rank[layout] >= threshold;
      if (was && !is && state.open) {
        state.set(false, 'layout');
        state.restore.current = true;
      } else if (!was && is && state.restore.current) {
        state.restore.current = false;
        state.set(true, 'layout');
      }
    };
    reconcile(ctx, rank.wide);
    reconcile(idx, rank.compact);
    setSynced(layout);
  }, [layout, synced]);

  // Picking a conversation in the narrow index sheet closes the sheet.
  const prevActive = React.useRef(activeId);
  React.useEffect(() => {
    if (prevActive.current === activeId) return;
    prevActive.current = activeId;
    if (layout === 'narrow' && idx.open) idx.set(false, 'selection');
  });

  // Focus return for the inline pane: remember the opener, restore it when the pane closes with focus inside.
  const opener = React.useRef<HTMLElement | null>(null);
  const focusWithin = React.useRef(false);
  const wasOpen = React.useRef(ctx.open);
  useIsoLayoutEffect(() => {
    if (ctx.open === wasOpen.current) return;
    wasOpen.current = ctx.open;
    if (typeof document === 'undefined') return;
    const active = document.activeElement as HTMLElement | null;
    if (ctx.open) {
      opener.current = active && active !== document.body ? active : null;
      return;
    }
    const pane = contextRef.current;
    // `inert` may already have blurred the focused control, so also trust the focus-within flag.
    if (focusWithin.current || (pane && active && pane.contains(active))) {
      focusWithin.current = false;
      const target = opener.current;
      if (target?.isConnected) target.focus();
      else rootRef.current?.querySelector<HTMLElement>('.rl-agent-shell__main')?.focus();
    }
    opener.current = null;
  }, [ctx.open]);

  const [innerSize, setInnerSize] = React.useState(defaultContextSize);
  const rawSize = contextSize ?? innerSize;
  const fitMax = measured.width ? Math.max(contextMin, Math.min(contextMax, measured.width - measured.side - readingMin)) : contextMax;
  const paneSize = Math.round(Math.min(Math.max(rawSize, contextMin), fitMax));
  const setSize = (next: number) => {
    if (contextSize === undefined) setInnerSize(next);
    onContextSizeChange?.(next);
  };

  const inlineContext = hasContext && layout === 'wide';
  const inlineIndex = hasIndex && layout !== 'narrow';
  const contextOpen = hasContext && ctx.open;
  const indexOpen = hasIndex && idx.open;

  const value = React.useMemo<AgentShellContextValue>(
    () => ({
      layout,
      hasContext,
      hasIndex,
      contextOpen,
      setContextOpen: ctx.set,
      toggleContext: () => ctx.set(!contextOpen, 'toggle'),
      indexOpen,
      setIndexOpen: idx.set,
      indexCollapsed: hasIndex && (!inlineIndex || !indexOpen),
    }),
    [layout, hasContext, hasIndex, contextOpen, ctx.set, indexOpen, idx.set, inlineIndex],
  );

  const scroller = useScrollable<HTMLDivElement>();
  const sheetsReady = synced === layout;

  return (
    <ShellContext.Provider value={value}>
      <div
        {...rest}
        ref={setRoot}
        className={cx('rl-agent-shell', className)}
        style={{ ...style, ['--rl-agent-pane-size' as string]: `${paneSize}px` }}
        data-layout={layout}
        data-context-open={(inlineContext && contextOpen) || undefined}
      >
        {present(rail) && layout !== 'narrow' && <div className="rl-agent-shell__rail">{rail}</div>}
        {inlineIndex && indexOpen && (
          <section className="rl-agent-shell__index" aria-label={indexLabel ?? messages.indexLabel}>
            {index}
          </section>
        )}
        <section className="rl-agent-shell__main" aria-label={mainLabel ?? messages.mainLabel} tabIndex={-1}>
          {present(header) && <div className="rl-agent-shell__header">{header}</div>}
          <div ref={scroller.ref} className="rl-agent-shell__conversation" tabIndex={scroller.scrollable ? 0 : undefined}>
            <div className="rl-agent-shell__reading">{conversation}</div>
          </div>
          {present(composer) && (
            <div className="rl-agent-shell__composer">
              <div className="rl-agent-shell__reading">{composer}</div>
            </div>
          )}
        </section>
        {inlineContext && resizable && contextOpen && (
          <ResizeHandle
            className="rl-agent-shell__handle"
            size={paneSize}
            onSizeChange={setSize}
            min={contextMin}
            max={fitMax}
            resetSize={defaultContextSize}
            pane="end"
            step={resizeStep}
            largeStep={resizeLargeStep}
          />
        )}
        {inlineContext && (
          <div
            ref={contextRef}
            className="rl-agent-shell__context"
            data-open={contextOpen || undefined}
            inert={!contextOpen}
            aria-hidden={!contextOpen || undefined}
          onFocus={() => {
              focusWithin.current = true;
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusWithin.current = false;
            }}
          >
            <div className="rl-agent-shell__context-inner">
              <PresentationContext.Provider value="inline">{context}</PresentationContext.Provider>
            </div>
          </div>
        )}
      </div>
      {hasIndex && !inlineIndex && (
        <Drawer
          open={sheetsReady && indexOpen}
          onOpenChange={(open) => idx.set(open, 'dismiss')}
          side="start"
          size="sm"
          title={indexLabel ?? messages.indexLabel}
          className="rl-agent-shell__sheet"
        >
          {index}
        </Drawer>
      )}
      {hasContext && !inlineContext && (
        <Drawer
          open={sheetsReady && contextOpen}
          onOpenChange={(open) => { ctx.set(open, 'dismiss'); if (!open) onContextClosed?.(); }}
          side="end"
          size="md"
          title={contextLabel ?? messages.contextLabel}
          className="rl-agent-shell__sheet"
        >
          <PresentationContext.Provider value="sheet">{context}</PresentationContext.Provider>
        </Drawer>
      )}
    </ShellContext.Provider>
  );
});
