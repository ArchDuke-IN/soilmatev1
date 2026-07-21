'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PollingState<T> {
  data: T | null;
  prev: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs = 5000,
): PollingState<T> & { refetch: () => void } {
  const [state, setState] = useState<PollingState<T>>({
    data: null,
    prev: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const prevRef = useRef<T | null>(null);

  const poll = useCallback(async () => {
    try {
      const result = await fetchFn();
      setState((s) => ({
        data: result,
        prev: prevRef.current,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }));
      prevRef.current = result;
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: 'Backend unreachable' }));
    }
  }, [fetchFn]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs]);

  return { ...state, refetch: poll };
}
