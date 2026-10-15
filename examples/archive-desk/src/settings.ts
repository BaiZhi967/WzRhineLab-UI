import * as React from 'react';

/**
 * Local settings adapter for the archive desk example (audit F03). The page used to show
 * "已写入本机浏览器" from a bare `setTimeout` without ever touching storage. Saving now goes
 * through here, and the UI may only report success when `save` reports success.
 */

export interface DeskSettings {
  nickname: string;
  digest: boolean;
}

export const defaultSettings: DeskSettings = { nickname: '示例研究员', digest: true };

const STORAGE_KEY = 'wzrhine-example:archive-desk:settings:v1';
const STORAGE_VERSION = 1;

/** Fault hook for the demo: the error mode makes the write fail like a quota error would. */
let failWrites = false;
export function setSettingsWriteFailure(fail: boolean): void {
  failWrites = fail;
}

export type SettingsSaveResult = { ok: true } | { ok: false; message: string };

function parse(raw: string | null): DeskSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: number; items?: unknown };
    if (parsed?.version !== STORAGE_VERSION) return null;
    const items = parsed.items as Partial<DeskSettings> | undefined;
    if (!items || typeof items.nickname !== 'string' || typeof items.digest !== 'boolean') return null;
    return { nickname: items.nickname, digest: items.digest };
  } catch {
    return null; // Corrupt or foreign payload: fall back to defaults rather than throwing.
  }
}

export function loadSettings(): DeskSettings {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY)) ?? defaultSettings;
  } catch {
    return defaultSettings; // Storage unavailable (private mode).
  }
}

export function writeSettings(next: DeskSettings): SettingsSaveResult {
  if (failWrites) return { ok: false, message: '注入的保存失败（演示错误恢复）。' };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items: next }));
    return { ok: true };
  } catch {
    return { ok: false, message: '本机存储不可用，设置未保存。' };
  }
}

export function clearSettings(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

export function createSettingsStore() {
  const [settings, setSettings] = React.useState<DeskSettings>(loadSettings);

  const save = React.useCallback((next: DeskSettings): SettingsSaveResult => {
    const result = writeSettings(next);
    // Only the committed value becomes the new baseline; a failed write leaves it untouched so
    // the form still reads as dirty.
    if (result.ok) setSettings(next);
    return result;
  }, []);

  const reset = React.useCallback(() => {
    clearSettings();
    setSettings(defaultSettings);
  }, []);

  return React.useMemo(() => ({ settings, save, reset }), [settings, save, reset]);
}
