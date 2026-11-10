import { useEffect, useState } from 'react';

export function usePersistentTab(storageKey: string, defaultTab: string, validTabs: readonly string[]) {
  const [tab, setTab] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved && validTabs.includes(saved) ? saved : defaultTab;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, tab);
  }, [storageKey, tab]);

  return [tab, setTab] as const;
}
