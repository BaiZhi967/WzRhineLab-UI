import { useCallback, useEffect, useState } from 'react';

export type ThemeSetting = 'light' | 'dark' | 'system';
export type DensitySetting = 'comfortable' | 'compact';
export type MotionSetting = 'user' | 'reduce';

export interface Settings {
  theme: ThemeSetting;
  density: DensitySetting;
  motion: MotionSetting;
}

const STORAGE_KEY = 'wzrhine-showcase:settings';
const defaults: Settings = { theme: 'light', density: 'comfortable', motion: 'user' };

function load(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: parsed.theme === 'dark' || parsed.theme === 'system' ? parsed.theme : 'light',
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      motion: parsed.motion === 'reduce' ? 'reduce' : 'user',
    };
  } catch {
    return defaults;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage may be unavailable (private mode); settings stay in memory.
    }
  }, [settings]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  return [settings, update] as const;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Theme actually rendered, resolving `system` against the OS preference. */
export function useResolvedTheme(theme: ThemeSetting): 'light' | 'dark' {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}
