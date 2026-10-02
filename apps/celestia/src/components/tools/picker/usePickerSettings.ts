import { useCallback, useState } from 'react';

import { DEFAULT_SETTINGS, PickerSettings, clearSettings, loadSettings, saveSettings } from 'src/utils/picker/settings';

/** Persistent settings (area size, sidebar width, copy `#`). Stored in the browser, defaults are used until it has been read */
export function usePickerSettings() {
  // Read after mount so server and client render the same markup
  const [settings, setSettings] = useState<PickerSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  if (!loaded && typeof window !== 'undefined') {
    setLoaded(true);
    setSettings(loadSettings());
  }

  const update = useCallback((change: Partial<PickerSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...change };
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    clearSettings();
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, reset };
}
