// useSettings hook - load and save settings via IPC

import { useCallback } from "react";
import { useSettingsStore, getActiveProvider } from "../stores/settings-store";

export function useSettings() {
  const store = useSettingsStore();

  const updateSettings = useCallback(
    async (updates: Record<string, unknown>) => {
      await window.catclaw.setSettings(updates);
      const settings = await window.catclaw.getSettings();
      store.setSettings(settings);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const activeProvider = getActiveProvider(store);

  return { ...store, activeProvider, updateSettings };
}
