'use client';
/**
 * useProfileFetch
 *
 * Lightweight data-fetching hook for profile page tabs.
 * Handles loading / error / data state and exposes a `refetch()` function
 * so that mutation callbacks (delete, remove bookmark) can trigger re-renders.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useProfileFetch('/api/me/uploads');
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useProfileFetch(url, options = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);

  const fetch_ = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        ...options,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Unknown error');
      setData(json.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load data.');
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    fetch_();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
