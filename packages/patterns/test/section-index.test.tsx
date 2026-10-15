import * as React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SectionIndex } from '../src';
import { patternsZhCN } from '../src';

const sections = [
  { id: 'sec-overview', label: '概览' },
  { id: 'sec-method', label: '方法' },
  { id: 'sec-result', label: '结果' },
];

function Host(props: Partial<React.ComponentProps<typeof SectionIndex>>) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <div>
      <SectionIndex sections={sections} label="章节" scrollRoot={rootRef} {...props} />
      <div ref={rootRef}>
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.label}</h2>
          </section>
        ))}
      </div>
    </div>
  );
}

// jsdom lacks scrollIntoView; capture calls instead.
const scrollIntoView = vi.fn();
beforeEach(() => {
  scrollIntoView.mockReset();
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});

describe('SectionIndex structure', () => {
  it('renders a named nav of anchors (usable without JS)', () => {
    render(<Host />);
    const nav = screen.getByRole('navigation', { name: '章节' });
    expect(within(nav).getByRole('link', { name: '概览' })).toHaveAttribute('href', '#sec-overview');
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
  });

  it('duplicate labels stay distinct through their ids', () => {
    render(
      <Host
        sections={[
          { id: 'a', label: '附录' },
          { id: 'b', label: '附录' },
        ]}
      />,
    );
    const links = screen.getAllByRole('link', { name: '附录' });
    expect(links[0]).toHaveAttribute('href', '#a');
    expect(links[1]).toHaveAttribute('href', '#b');
  });

  it('the default accessible name comes from the message table', () => {
    render(
      <div>
        <SectionIndex sections={sections} />
        <div id="host">
          {sections.map((s) => (
            <section key={s.id} id={s.id} />
          ))}
        </div>
      </div>,
    );
    expect(screen.getByRole('navigation', { name: patternsZhCN.sectionIndex.region })).toBeInTheDocument();
  });
});

describe('SectionIndex navigation', () => {
  it('clicking an anchor reports the intent and scrolls the section into view', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Host onNavigate={onNavigate} />);
    await user.click(screen.getByRole('link', { name: '结果' }));
    expect(onNavigate).toHaveBeenCalledWith('sec-result');
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'start' }));
  });

  it('smooth scrolling is opt-in and disabled under reduced motion', async () => {
    const user = userEvent.setup();
    const matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: () => {}, removeEventListener: () => {} });
    vi.stubGlobal('matchMedia', matchMedia);
    render(<Host smoothScroll />);
    await user.click(screen.getByRole('link', { name: '方法' }));
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    vi.unstubAllGlobals();
  });

  // A modified click on a real link means "open in new tab / window / download". Enhancing it
  // would cancel that silently, so only plain primary clicks are intercepted.
  it.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
  ])('a %s-click keeps the native anchor behaviour', (_name, modifier) => {
    const onNavigate = vi.fn();
    render(<Host onNavigate={onNavigate} />);
    const link = screen.getByRole('link', { name: '方法' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...modifier });
    fireEvent(link, event);
    expect(event.defaultPrevented).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('a middle-button click keeps the native anchor behaviour', () => {
    render(<Host />);
    const link = screen.getByRole('link', { name: '方法' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 });
    fireEvent(link, event);
    expect(event.defaultPrevented).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('a plain click is still enhanced (preventDefault + scroll)', () => {
    render(<Host />);
    const link = screen.getByRole('link', { name: '方法' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    fireEvent(link, event);
    expect(event.defaultPrevented).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('a missing target falls through to the browser (no preventDefault)', () => {
    const onNavigate = vi.fn();
    render(
      <div>
        <SectionIndex sections={[{ id: 'absent', label: '缺失' }]} label="章节" onNavigate={onNavigate} />
      </div>,
    );
    const link = screen.getByRole('link', { name: '缺失' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    fireEvent(link, event);
    expect(event.defaultPrevented).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledWith('absent');
  });

  // offsetTop compensates for a fixed header. Which thing scrolled depends on the mode: an
  // element scroll root in the container case, the viewport when the page itself scrolls.
  it('applies the header offset to an explicit scroll root', async () => {
    const user = userEvent.setup();
    const scrollBy = vi.fn();
    function OffsetHost() {
      const rootRef = React.useRef<HTMLDivElement | null>(null);
      return (
        <div>
          <SectionIndex sections={sections} label="章节" scrollRoot={rootRef} offsetTop={48} />
          <div ref={rootRef}>
            {sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.label}</h2>
              </section>
            ))}
          </div>
        </div>
      );
    }
    render(<OffsetHost />);
    const root = document.getElementById('sec-overview')!.parentElement!;
    root.scrollBy = scrollBy;
    await user.click(screen.getByRole('link', { name: '方法' }));
    expect(scrollBy).toHaveBeenCalledWith(0, -48);
  });

  it('applies the header offset to the viewport when the page itself scrolls', async () => {
    const user = userEvent.setup();
    const scrollBy = vi.fn();
    vi.stubGlobal('scrollBy', scrollBy);
    // No scrollRoot and no scrolling ancestor: the whole page scrolls.
    render(
      <div>
        <SectionIndex sections={sections} label="章节" offsetTop={48} />
        {sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.label}</h2>
          </section>
        ))}
      </div>,
    );
    await user.click(screen.getByRole('link', { name: '方法' }));
    expect(scrollBy).toHaveBeenCalledWith(0, -48);
    vi.unstubAllGlobals();
  });
});

/** Minimal IntersectionObserverEntry stand-in: the component only reads target and isIntersecting. */
function makeEntry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  return { target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 } as unknown as IntersectionObserverEntry;
}

describe('SectionIndex observation', () => {
  type IOInstance = {
    callback: ResizeObserverCallback | IntersectionObserverCallback;
    targets: Element[];
    unobserved: Element[];
    disconnected: boolean;
  };
  let instances: IOInstance[];

  // `targets` mirrors what the observer is actually watching, so a missing unobserve shows up as
  // a growing target list rather than passing silently.
  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    targets: Element[] = [];
    unobserved: Element[] = [];
    disconnected = false;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      instances.push(this);
    }
    observe(target: Element) {
      if (!this.targets.includes(target)) this.targets.push(target);
    }
    unobserve(target: Element) {
      this.targets = this.targets.filter((t) => t !== target);
      this.unobserved.push(target);
    }
    disconnect() {
      this.disconnected = true;
      this.targets = [];
    }
  }

  const intersect = (target: Element, isIntersecting: boolean) => {
    for (const inst of instances) {
      const entry = makeEntry(target, isIntersecting);
      act(() => {
        (inst.callback as (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void)([entry], inst as unknown as IntersectionObserver);
      });
    }
  };

  beforeEach(() => {
    instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passive observation updates the current section without stealing focus', () => {
    render(<Host />);
    const method = document.getElementById('sec-method')!;
    intersect(method, true);
    const active = screen.getByRole('link', { name: '方法' });
    expect(active).toHaveAttribute('aria-current', 'true');
    expect(document.activeElement).toBe(document.body);
  });

  it('onActiveChange reports passive updates', () => {
    const onActiveChange = vi.fn();
    render(<Host onActiveChange={onActiveChange} />);
    intersect(document.getElementById('sec-result')!, true);
    expect(onActiveChange).toHaveBeenCalledWith('sec-result');
  });

  // The highlight tracks the visible candidate set, not the latest enter event: leaving a section
  // has to hand it back to whatever is still on screen.
  it('leaving a section returns the highlight to one still visible', () => {
    const onActiveChange = vi.fn();
    render(<Host onActiveChange={onActiveChange} />);
    const overview = document.getElementById('sec-overview')!;
    const method = document.getElementById('sec-method')!;

    intersect(overview, true);
    intersect(method, true);
    // Both visible: the first one in declaration order wins.
    expect(screen.getByRole('link', { name: '概览' })).toHaveAttribute('aria-current', 'true');

    // Scroll on so only `method` is visible, then back so only `overview` is.
    intersect(overview, false);
    expect(screen.getByRole('link', { name: '方法' })).toHaveAttribute('aria-current', 'true');
    intersect(method, false);
    intersect(overview, true);
    expect(screen.getByRole('link', { name: '概览' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '方法' })).not.toHaveAttribute('aria-current');
  });

  it('with nothing visible the last known section stays current', () => {
    render(<Host />);
    const method = document.getElementById('sec-method')!;
    intersect(method, true);
    intersect(method, false);
    expect(screen.getByRole('link', { name: '方法' })).toHaveAttribute('aria-current', 'true');
  });

  it('multiple sections entering at once pick the first in declaration order', () => {
    render(<Host />);
    const inst = instances[0]!;
    const entries = ['sec-result', 'sec-method'].map(
      (id) => makeEntry(document.getElementById(id)!, true),
    );
    act(() => {
      (inst.callback as (e: IntersectionObserverEntry[], o: IntersectionObserver) => void)(entries, inst as unknown as IntersectionObserver);
    });
    expect(screen.getByRole('link', { name: '方法' })).toHaveAttribute('aria-current', 'true');
  });

  it('a controlled activeId renders as current regardless of observation', () => {
    render(<Host activeId="sec-overview" />);
    intersect(document.getElementById('sec-result')!, true);
    expect(screen.getByRole('link', { name: '概览' })).toHaveAttribute('aria-current', 'true');
  });

  it('unmount disconnects the observer', () => {
    const { unmount } = render(<Host />);
    const inst = instances[0]!;
    unmount();
    expect(inst.disconnected).toBe(true);
  });

  // 0.3.0-contracts §4.3: replacing the body of a detail keeps the section ids but creates new
  // nodes. The observed set has to stay bounded across repeated swaps, and the retired node must
  // stop reporting visibility — otherwise a long-lived mount accumulates stale targets.
  it('replacing a section node unobserves the old one and stays bounded', async () => {
    function SwapHost() {
      const rootRef = React.useRef<HTMLDivElement | null>(null);
      const [revision, setRevision] = React.useState(0);
      return (
        <div>
          <SectionIndex sections={sections} label="章节" scrollRoot={rootRef} />
          <button type="button" onClick={() => setRevision((r) => r + 1)}>
            换正文
          </button>
          <div ref={rootRef}>
            {sections.map((s) => (
              // A changing key forces a brand-new DOM node for the same id.
              <section key={`${s.id}-${revision}`} id={s.id}>
                <h2>{s.label}</h2>
              </section>
            ))}
          </div>
        </div>
      );
    }

    render(<SwapHost />);
    const inst = instances[0]!;
    expect(inst.targets).toHaveLength(3);
    const firstGeneration = [...inst.targets];

    // MutationObserver callbacks are microtasks, so each swap needs a flush before the retarget
    // it triggers has run.
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: '换正文' }));
      await act(async () => {
        await Promise.resolve();
      });
    }

    // Still three live targets, not 3 × 5, and every retired node was unobserved.
    expect(inst.targets).toHaveLength(3);
    expect(inst.targets.every((t) => t.isConnected)).toBe(true);
    expect(inst.unobserved.length).toBeGreaterThanOrEqual(firstGeneration.length);
    for (const old of firstGeneration) {
      expect(inst.targets).not.toContain(old);
      expect(inst.unobserved).toContain(old);
    }
  });

  it('a retired node no longer drives the current section', async () => {
    function SwapHost() {
      const rootRef = React.useRef<HTMLDivElement | null>(null);
      const [swapped, setSwapped] = React.useState(false);
      return (
        <div>
          <SectionIndex sections={sections} label="章节" scrollRoot={rootRef} />
          <button type="button" onClick={() => setSwapped(true)}>
            换正文
          </button>
          <div ref={rootRef}>
            {sections.map((s) => (
              <section key={`${s.id}-${swapped}`} id={s.id}>
                <h2>{s.label}</h2>
              </section>
            ))}
          </div>
        </div>
      );
    }

    render(<SwapHost />);
    const inst = instances[0]!;
    const staleMethod = inst.targets.find((t) => t.id === 'sec-method')!;
    intersect(document.getElementById('sec-overview')!, true);
    fireEvent.click(screen.getByRole('button', { name: '换正文' }));
    await act(async () => {
      await Promise.resolve();
    });

    // The retired node fires a late entry: it must not become the current section.
    act(() => {
      (inst.callback as (e: IntersectionObserverEntry[], o: IntersectionObserver) => void)(
        [makeEntry(staleMethod, true)],
        inst as unknown as IntersectionObserver,
      );
    });
    expect(screen.getByRole('link', { name: '概览' })).toHaveAttribute('aria-current', 'true');
  });

  it('changing sections re-observes the new targets', () => {
    const { rerender } = render(
      <div>
        <SectionIndexWrapper sections={sections} />
      </div>,
    );
    const first = instances[0]!;
    expect(first.targets.map((t) => t.id)).toEqual(['sec-overview', 'sec-method', 'sec-result']);
    rerender(
      <div>
        <SectionIndexWrapper sections={sections.slice(0, 1)} />
      </div>,
    );
    const second = instances.at(-1)!;
    expect(second).not.toBe(first);
    expect(second.targets.map((t) => t.id)).toEqual(['sec-overview']);
  });

  // 0.3.0-contracts §4.3: an async detail body mounts its headings after the index, so the
  // observer has to pick up targets that appear later.
  it('observes section nodes that mount after the index', async () => {
    function LateHost() {
      const rootRef = React.useRef<HTMLDivElement | null>(null);
      const [ready, setReady] = React.useState(false);
      return (
        <div>
          <SectionIndex sections={sections} label="章节" scrollRoot={rootRef} />
          <button type="button" onClick={() => setReady(true)}>
            载入正文
          </button>
          <div ref={rootRef}>
            {ready &&
              sections.map((section) => (
                <section key={section.id} id={section.id}>
                  <h2>{section.label}</h2>
                </section>
              ))}
          </div>
        </div>
      );
    }

    const user = userEvent.setup();
    render(<LateHost />);
    const observer = instances[0]!;
    expect(observer.targets).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '载入正文' }));
    expect(observer.targets.map((t) => t.id)).toEqual(['sec-overview', 'sec-method', 'sec-result']);

    intersect(document.getElementById('sec-method')!, true);
    expect(screen.getByRole('link', { name: '方法' })).toHaveAttribute('aria-current', 'true');
  });

  it('renders without IntersectionObserver support (no crash, no tracking)', () => {
    vi.unstubAllGlobals();
    const { container } = render(<Host />);
    expect(container.querySelector('nav')).not.toBeNull();
  });
});

function SectionIndexWrapper(props: { sections: readonly { id: string; label: string }[] }) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <>
      <SectionIndex sections={props.sections} label="章节" scrollRoot={rootRef} />
      <div ref={rootRef}>
        {props.sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.label}</h2>
          </section>
        ))}
      </div>
    </>
  );
}
