import * as React from 'react';
import { act, render, screen, within } from '@testing-library/react';
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
});

describe('SectionIndex observation', () => {
  type IOInstance = { callback: ResizeObserverCallback | IntersectionObserverCallback; targets: Element[]; disconnected: boolean };
  let instances: IOInstance[];

  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    targets: Element[] = [];
    disconnected = false;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      instances.push(this);
    }
    observe(target: Element) {
      this.targets.push(target);
    }
    unobserve() {}
    disconnect() {
      this.disconnected = true;
      this.targets = [];
    }
  }

  const intersect = (target: Element, isIntersecting: boolean) => {
    for (const inst of instances) {
      const entry = { target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 } as IntersectionObserverEntry;
      act(() => {
        (inst.callback as (e: IntersectionObserverEntry[]) => void)([entry], inst as unknown as IntersectionObserver);
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
