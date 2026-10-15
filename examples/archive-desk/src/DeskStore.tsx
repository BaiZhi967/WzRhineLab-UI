import * as React from 'react';
import { type DeskRecord, type NewRecord, createRecordsStore } from './store';
import { type DeskResource, createResourcesStore } from './resources';
import { type DeskSettings, createSettingsStore, type SettingsSaveResult } from './settings';

/**
 * Single owner for the example's data (audit F04). `useRecords` used to be a plain hook, so every
 * caller got its own `useState` over the same storage key: the desk page edited one copy while the
 * settings page's "restore demo data" reset another, and both wrote to the same key. The store now
 * lives in one provider and every page reads the same instance.
 */

export interface RecordsApi {
  records: DeskRecord[];
  create: (input: NewRecord) => string;
  advance: (id: string) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export interface ResourcesApi {
  items: DeskResource[];
  reset: () => void;
}

export interface SettingsApi {
  settings: DeskSettings;
  /** Writes through to storage and reports what actually happened. */
  save: (next: DeskSettings) => SettingsSaveResult;
  reset: () => void;
}

interface DeskStore {
  records: RecordsApi;
  resources: ResourcesApi;
  settings: SettingsApi;
}

const DeskStoreContext = React.createContext<DeskStore | null>(null);

export function DeskStoreProvider({ children }: { children: React.ReactNode }) {
  const records = createRecordsStore();
  const resources = createResourcesStore();
  const settings = createSettingsStore();
  const value = React.useMemo<DeskStore>(() => ({ records, resources, settings }), [records, resources, settings]);
  return <DeskStoreContext.Provider value={value}>{children}</DeskStoreContext.Provider>;
}

function useDeskStore(): DeskStore {
  const store = React.useContext(DeskStoreContext);
  if (!store) throw new Error('DeskStoreProvider is missing above this component.');
  return store;
}

export const useRecords = (): RecordsApi => useDeskStore().records;
export const useResources = (): ResourcesApi => useDeskStore().resources;
export const useSettings = (): SettingsApi => useDeskStore().settings;

/** Restores every demo dataset at once (the settings page's single entry point). */
export function useResetAll(): () => void {
  const store = useDeskStore();
  return React.useCallback(() => {
    store.records.reset();
    store.resources.reset();
    store.settings.reset();
  }, [store]);
}
