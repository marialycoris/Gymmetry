import { useCallback, useEffect, useState } from 'react';

/** Runs an async loader on mount and whenever `deps` change. Call `reload()` after a mutation. */
const sameDeps = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((value, index) => Object.is(value, b[index]));

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState<{ deps: unknown[]; tick: number } | null>(null);

  useEffect(() => {
    let live = true;
    fn()
      .then((d) => {
        if (live) {
          setData(d);
          setError('');
          setSettled({ deps: [...deps], tick });
        }
      })
      .catch((e: Error) => {
        if (live) {
          setError(e.message);
          setSettled({ deps: [...deps], tick });
        }
      });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const isCurrent = settled?.tick === tick && sameDeps(settled.deps, deps);
  return { data, error, reload, loading: data === null && !isCurrent };
}
