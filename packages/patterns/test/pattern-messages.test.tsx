import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import {
  PatternsMessagesProvider,
  mergePatternsMessages,
  patternsEnUS,
  patternsZhCN,
  usePatternsMessages,
} from '../src';

function Probe() {
  const messages = usePatternsMessages();
  return <span data-testid="probe">{messages.listDetail.back}</span>;
}

/** Flattened key paths ("listDetail.back"), so the parity test fails with the exact missing key. */
function keyPaths(table: unknown, prefix = ''): string[] {
  if (typeof table !== 'object' || table === null) return [prefix];
  return Object.entries(table).flatMap(([key, value]) => keyPaths(value, prefix ? `${prefix}.${key}` : key));
}

describe('patterns message tables (ADR-0014 §3, ADR-0009 mechanism)', () => {
  it('zhCN and enUS tables have identical keys', () => {
    expect([...keyPaths(patternsEnUS)].sort()).toEqual([...keyPaths(patternsZhCN)].sort());
  });

  it('defaults to the zhCN table without a provider', () => {
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent(patternsZhCN.listDetail.back);
  });

  it('provider overrides win over the defaults and unknown namespaces are ignored', () => {
    const merged = mergePatternsMessages(patternsZhCN, {
      listDetail: { back: '返回档案' },
      notANamespace: { anything: 'x' },
    } as never);
    expect(merged.listDetail.back).toBe('返回档案');
    expect(merged.listDetail.close).toBe(patternsZhCN.listDetail.close);
  });

  it('undefined override entries keep the base value', () => {
    const merged = mergePatternsMessages(patternsEnUS, { listDetail: { back: undefined } });
    expect(merged.listDetail.back).toBe(patternsEnUS.listDetail.back);
  });

  it('nested providers merge per namespace, outer entries survive', () => {
    render(
      <PatternsMessagesProvider messages={{ listDetail: { back: 'A' } }}>
        <PatternsMessagesProvider messages={{ listDetail: { close: 'B' } }}>
          <ProbeAndClose />
        </PatternsMessagesProvider>
      </PatternsMessagesProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('A');
    expect(screen.getByTestId('probe-close')).toHaveTextContent('B');
  });

  it('sibling providers stay isolated (no cross-instance leakage)', () => {
    render(
      <div>
        <PatternsMessagesProvider messages={{ listDetail: { back: '左' } }}>
          <Probe />
        </PatternsMessagesProvider>
        <PatternsMessagesProvider messages={{ listDetail: { back: '右' } }}>
          <Probe />
        </PatternsMessagesProvider>
      </div>,
    );
    const probes = screen.getAllByTestId('probe');
    expect(probes[0]).toHaveTextContent('左');
    expect(probes[1]).toHaveTextContent('右');
  });

  it('works under RhineProvider in both themes and densities (P030-01 fixture)', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const density of ['comfortable', 'compact'] as const) {
        const { unmount } = render(
          <RhineProvider theme={theme} density={density}>
            <PatternsMessagesProvider messages={patternsEnUS}>
              <Probe />
            </PatternsMessagesProvider>
          </RhineProvider>,
        );
        expect(screen.getByTestId('probe')).toHaveTextContent(patternsEnUS.listDetail.back);
        unmount();
      }
    }
  });
});

function ProbeAndClose() {
  const messages = usePatternsMessages();
  return (
    <>
      <span data-testid="probe">{messages.listDetail.back}</span>
      <span data-testid="probe-close">{messages.listDetail.close}</span>
    </>
  );
}
