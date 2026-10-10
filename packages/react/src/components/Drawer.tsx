import * as React from 'react';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { usePortalContainer } from '../provider/portal.js';
import { cx } from '../utils/cx.js';
import { IconButton } from './IconButton.js';

/**
 * Edge panel on Base UI Drawer (ADR-0006 §4): focus enters, Tab loops, Escape and backdrop clicks
 * close, page scroll is locked, the background is inert and focus returns to the trigger — all
 * from Base UI. Below 40rem the panel becomes a bottom sheet (swipe down to dismiss); wider it
 * slides from the inline `side` (swipe toward that edge). CSS owns `transform` (Base UI writes
 * the swipe offset into the same property), so enter / exit are CSS transitions on
 * data-starting-style / data-ending-style: interruptible, and Base UI unmounts after they end.
 */

export type DrawerSide = 'start' | 'end';
export type DrawerSize = 'sm' | 'md' | 'lg';

/**
 * Why the user is trying to close the drawer: the `DialogCloseReason` values (ADR-0006 §3)
 * plus `swipe` for the dismiss gesture.
 */
export type DrawerCloseReason = 'escape' | 'outside' | 'close-button' | 'trigger' | 'swipe';

export type DrawerProps = {
  /** Element that opens the drawer (usually a Button). Omit when opening programmatically. */
  trigger?: React.ReactElement<Record<string, unknown>>;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small archive-style label above the title, e.g. "ARCHIVE / DETAIL". */
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer action bar. Use `<DrawerClose>` for buttons that only dismiss. */
  actions?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fires after the exit transition, when focus has returned. */
  onClosed?: () => void;
  /** Logical edge the panel attaches to on wide viewports; follows the writing direction. */
  side?: DrawerSide;
  /** Panel width on wide viewports (the bottom sheet is always full width). */
  size?: DrawerSize;
  /** Accessible name of the header close button. */
  closeLabel?: string;
  /**
   * Called before a user-initiated close. Return `false` to keep the drawer open (focus stays put),
   * e.g. while a save is in flight. Programmatic `open={false}` skips it.
   */
  onCloseRequest?: (reason: DrawerCloseReason) => boolean | void;
  /** Element to focus on open; defaults to the panel itself so its title is announced first. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  /** Element to focus after closing; defaults to the trigger or the previously focused element. */
  finalFocus?: React.RefObject<HTMLElement | null>;
  className?: string;
};

type Placement = 'left' | 'right' | 'bottom';

const closeReasons: Partial<Record<string, DrawerCloseReason>> = {
  'escape-key': 'escape',
  // Android back gesture (CloseWatcher) is the platform's Escape.
  'close-watcher': 'escape',
  'outside-press': 'outside',
  'close-press': 'close-button',
  'trigger-press': 'trigger',
  swipe: 'swipe',
};

/** Below this width the drawer is a bottom sheet (ADR-0006 §4: 40rem). */
const sheetQuery = '(max-width: 39.99rem)';

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function subscribeSheet(onChange: () => void) {
  if (!hasMatchMedia()) return () => {};
  const list = window.matchMedia(sheetQuery);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

const getSheet = () => hasMatchMedia() && window.matchMedia(sheetQuery).matches;
// Server and hydration render the wide layout; the panel only exists once open.
const getServerSheet = () => false;

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Drawer({
  trigger,
  title,
  description,
  eyebrow,
  children,
  actions,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onClosed,
  side = 'end',
  size = 'md',
  closeLabel = '关闭',
  onCloseRequest,
  initialFocus,
  finalFocus,
  className,
}: DrawerProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolled;
  const container = usePortalContainer();
  const sheet = React.useSyncExternalStore(subscribeSheet, getSheet, getServerSheet);
  const titleId = React.useId();

  // `side` is logical: read the writing direction where the panel renders, once per opening.
  const [rtl, setRtl] = React.useState(false);
  useIsoLayoutEffect(() => {
    if (!open) return;
    const host = container ?? document.body;
    setRtl(getComputedStyle(host).direction === 'rtl' || host.closest('[dir]')?.getAttribute('dir') === 'rtl');
  }, [open, container]);

  const placement: Placement = sheet ? 'bottom' : (side === 'end') !== rtl ? 'right' : 'left';

  // A body that overflows becomes a focusable, named region so keyboard users can scroll it.
  const [body, setBody] = React.useState<HTMLDivElement | null>(null);
  const [scrollable, setScrollable] = React.useState(false);
  useIsoLayoutEffect(() => {
    if (!body) return undefined;
    const update = () => setScrollable(body.scrollHeight > body.clientHeight + 1);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(body);
    for (const child of Array.from(body.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [body, children]);

  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <BaseDrawer.Root
      open={open}
      swipeDirection={placement === 'bottom' ? 'down' : placement}
      onOpenChange={(next, eventDetails) => {
        if (!next && onCloseRequest) {
          const reason = closeReasons[eventDetails.reason];
          if (reason && onCloseRequest(reason) === false) {
            eventDetails.cancel();
            return;
          }
        }
        setOpen(next);
      }}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClosed?.();
      }}
    >
      {trigger && <BaseDrawer.Trigger render={trigger} />}
      <BaseDrawer.Portal container={container}>
        <BaseDrawer.Backdrop className="rl-drawer__backdrop" />
        <BaseDrawer.Viewport className="rl-drawer__viewport" data-placement={placement}>
          <BaseDrawer.Popup
            className={cx('rl-drawer', className)}
            data-slot="drawer"
            data-placement={placement}
            data-size={size}
            initialFocus={initialFocus}
            finalFocus={finalFocus}
          >
            <span className="rl-drawer__handle" aria-hidden="true" />
            <BaseDrawer.Content className="rl-drawer__content">
              <header className="rl-drawer__header">
                <div className="rl-drawer__heading">
                  {eyebrow != null && <p className="rl-dialog__eyebrow">{eyebrow}</p>}
                  <BaseDrawer.Title id={titleId} className="rl-dialog__title rl-drawer__title">
                    {title}
                  </BaseDrawer.Title>
                  {description != null && (
                    <BaseDrawer.Description className="rl-dialog__description">{description}</BaseDrawer.Description>
                  )}
                </div>
                <BaseDrawer.Close render={<IconButton className="rl-drawer__close" icon={<CloseIcon />} label={closeLabel} />} />
              </header>
              <div
                ref={setBody}
                className="rl-drawer__body"
                role={scrollable ? 'region' : undefined}
                aria-labelledby={scrollable ? titleId : undefined}
                tabIndex={scrollable ? 0 : undefined}
              >
                {children}
              </div>
              {actions != null && <footer className="rl-drawer__actions">{actions}</footer>}
            </BaseDrawer.Content>
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  );
}

export type DrawerCloseProps = {
  /** The element that closes the drawer, typically `<Button variant="ghost">取消</Button>`. */
  children: React.ReactElement<Record<string, unknown>>;
};

/** Wraps a button so activating it closes the nearest Drawer (reason `close-button`). */
export function DrawerClose({ children }: DrawerCloseProps) {
  return <BaseDrawer.Close render={children} />;
}
