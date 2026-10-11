import { describe, expectTypeOf, it } from 'vitest';
import { RhineProvider } from '../src';
import type { RhineProviderProps } from '../src';
// Imported from the module until the coordinator re-exports them from src/index.ts.
import { RhineMessagesProvider, enUS, useRhineMessages, zhCN } from '../src/provider/messages';
import type { RhineMessages, RhineMessagesOverrides, RhineNumberFormat } from '../src/provider/messages';

describe('RhineMessages types', () => {
  it('both tables are complete RhineMessages', () => {
    expectTypeOf(zhCN).toEqualTypeOf<RhineMessages>();
    expectTypeOf(enUS).toEqualTypeOf<RhineMessages>();
    expectTypeOf(useRhineMessages).returns.toEqualTypeOf<RhineMessages>();
  });

  it('parameterised entries are functions; plain entries are strings', () => {
    expectTypeOf<RhineMessages['pagination']['page']>().toEqualTypeOf<(page: number, format: RhineNumberFormat) => string>();
    expectTypeOf<RhineMessages['dataTable']['selectRow']>().toEqualTypeOf<(label: string) => string>();
    expectTypeOf<RhineMessages['toast']['close']>().toEqualTypeOf<string>();
  });

  it('providers take partial overrides per namespace', () => {
    expectTypeOf<RhineProviderProps['messages']>().toEqualTypeOf<RhineMessagesOverrides | undefined>();
    expectTypeOf<RhineProviderProps['locale']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<RhineProviderProps['lang']>().toEqualTypeOf<string | undefined>();
    void (<RhineProvider messages={{ drawer: { close: 'Close' } }} locale="en-US" lang="en">x</RhineProvider>);
    void (<RhineProvider messages={enUS}>x</RhineProvider>);
    void (<RhineMessagesProvider messages={{ pagination: { page: (p) => `P${p}` } }}>x</RhineMessagesProvider>);
    // @ts-expect-error unknown namespace
    void (<RhineProvider messages={{ chart: { title: 'x' } }}>x</RhineProvider>);
    // @ts-expect-error unknown key in a namespace
    void (<RhineProvider messages={{ drawer: { dismiss: 'x' } }}>x</RhineProvider>);
    // @ts-expect-error a parameterised entry must stay a function
    void (<RhineProvider messages={{ pagination: { page: 'Page' } }}>x</RhineProvider>);
  });

  it('an incomplete table is not a RhineMessages', () => {
    // @ts-expect-error missing namespaces
    const partial: RhineMessages = { alert: { dismiss: 'x' } };
    void partial;
  });
});
