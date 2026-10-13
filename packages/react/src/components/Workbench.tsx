'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx.js';
import { useRhineMessages } from '../provider/messages.js';
import { ResizeHandle } from './ResizeHandle.js';

export type WorkbenchProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  rail?: React.ReactNode;
  indexLabel?: string;
  mainLabel?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
  indexOpen?: boolean;
  defaultIndexOpen?: boolean;
  onIndexOpenChange?: (open: boolean) => void;
  indexSize?: number;
  defaultIndexSize?: number;
  indexMin?: number;
  indexMax?: number;
  onIndexSizeChange?: (size: number) => void;
  index?: React.ReactNode;
};

interface WorkbenchContextValue {
  target: HTMLDivElement | null;
  register: (id: string, present: boolean) => void;
  indexOpen: boolean;
  setIndexOpen: (open: boolean) => void;
}
const WorkbenchContext = React.createContext<WorkbenchContextValue | null>(null);

/** Route-owned index content. A portal preserves the route's data/provider context. */
export function WorkbenchIndex({ children }: { children?: React.ReactNode }) {
  const context = React.useContext(WorkbenchContext);
  const id = React.useId();
  const register = context?.register;
  React.useEffect(() => {
    if (!register) return;
    register(id, true);
    return () => register(id, false);
  }, [register, id]);
  return context?.target ? createPortal(children, context.target) : null;
}

export function useWorkbench() { return React.useContext(WorkbenchContext); }

export function Workbench({ rail, index, header, children, indexLabel, mainLabel, indexOpen, defaultIndexOpen = true, onIndexOpenChange, indexSize, defaultIndexSize = 260, indexMin = 200, indexMax = 400, onIndexSizeChange, className, style, ...rest }: WorkbenchProps) {
  const messages = useRhineMessages();
  const [inner, setInner] = React.useState(defaultIndexOpen);
  const [innerSize, setInnerSize] = React.useState(defaultIndexSize);
  const [target, setTarget] = React.useState<HTMLDivElement | null>(null);
  const [registered, setRegistered] = React.useState<Set<string>>(new Set());
  const mainRef = React.useRef<HTMLElement>(null);
  const indexRef = React.useRef<HTMLElement>(null);
  const focusedIndex = React.useRef(false);
  const previousOpen = React.useRef(indexOpen ?? defaultIndexOpen);
  const open = indexOpen ?? inner;
  const hasIndex = index != null || registered.size > 0;
  const size = Math.max(indexMin, Math.min(indexMax, indexSize ?? innerSize));
  const [dragging, setDragging] = React.useState(false);
  const setOpen = React.useCallback((next: boolean) => { if (indexOpen === undefined) setInner(next); onIndexOpenChange?.(next); }, [indexOpen, onIndexOpenChange]);
  const register = React.useCallback((id: string, present: boolean) => setRegistered((old) => {
    if (old.has(id) === present) return old;
    const next = new Set(old);
    if (present) next.add(id); else next.delete(id);
    return next;
  }), []);
  React.useLayoutEffect(() => {
    if (previousOpen.current && !open && (focusedIndex.current || indexRef.current?.contains(document.activeElement))) {
      const target = mainRef.current;
      if (target) {
        target.focus();
        if (document.activeElement !== target) requestAnimationFrame(() => target.focus());
      }
      focusedIndex.current = false;
    }
    previousOpen.current = open;
  }, [open]);
  const value = React.useMemo(() => ({ target, register, indexOpen: open, setIndexOpen: setOpen }), [target, register, open, setOpen]);
  return <WorkbenchContext.Provider value={value}>
    <div {...rest} className={cx('rl-workbench', className)} style={{ ...style, '--rl-workbench-index-size': `${open && hasIndex ? size : 0}px` } as React.CSSProperties} data-has-rail={rail != null || undefined} data-index-open={(open && hasIndex) || undefined} data-dragging={dragging || undefined}>
      {rail && <div className="rl-workbench__rail">{rail}</div>}
      {header && <header className="rl-workbench__header">{header}</header>}
      <aside ref={indexRef} role="complementary" className="rl-workbench__index" aria-label={indexLabel ?? messages.workbench.index} hidden={!open || !hasIndex} onFocusCapture={() => { focusedIndex.current = true; }} onBlurCapture={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) focusedIndex.current = false;
      }}>
        {index}<div ref={setTarget} />
      </aside>
      {open && hasIndex && <ResizeHandle className="rl-workbench__resize" pane="start" size={size} min={indexMin} max={indexMax} onSizeChange={(next) => {
        if (indexSize === undefined) setInnerSize(next);
        onIndexSizeChange?.(next);
      }} onDraggingChange={setDragging} label={messages.workbench.resize} getAriaValueText={(width) => messages.workbench.width(String(width))} />}
      <main ref={mainRef} tabIndex={-1} aria-label={mainLabel ?? messages.workbench.content} className="rl-workbench__main">{children}</main>
    </div>
  </WorkbenchContext.Provider>;
}
