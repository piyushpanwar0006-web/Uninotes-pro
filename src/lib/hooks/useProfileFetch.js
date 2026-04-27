'use client';
/**
 * useProfileFetch
 *
 * Lightweight data-fetching hook for profile page tabs, now powered by React Query.
 * Handles loading / error / data state and exposes a `refetch()` function
 * so that mutation callbacks (delete, remove bookmark) can trigger re-renders.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useProfileFetch('/api/me/uploads');
 */

import { useQuery } from '@tanstack/react-query';

export function useProfileFetch(url, options = {}) {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile', url],
    queryFn: async () => {
      const res = await fetch(url, {
        credentials: 'include',
        ...options,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Unknown error');
      
      return json.data;
    },
    // We can rely on global staleTime, but can override here if needed
  });

  return { 
    data, 
    loading, 
    error: error?.message || null, 
    refetch 
  };
}
