import {useEffect, useState} from 'react';

export function usePolling<T>(fn: ()=>Promise<T>, ms=5000, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const d = await fn();
        if (!stop) { setData(d); setError(null); }
      } catch (e: any) {
        if (!stop) setError(e?.message ?? 'error');
      } finally {
        if (!stop) setTimeout(tick, ms);
      }
    };
    tick();
    return () => { stop = true; };
  }, deps);
  console.log(data)
  return {data, error};
}
