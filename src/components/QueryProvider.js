'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5 minutes
            staleTime: 5 * 60 * 1000,
            // 24 hours
            gcTime: 24 * 60 * 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  const [persister, setPersister] = useState(null);

  useEffect(() => {
    // Only run in the browser
    if (typeof window !== 'undefined') {
      const storagePersister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'uninotes-react-query-cache',
      });
      setPersister(storagePersister);
    }
  }, []);

  // During SSR or before client hydration finishes setting up the persister, 
  // just return a normal QueryClientProvider to prevent hydration mismatches.
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
