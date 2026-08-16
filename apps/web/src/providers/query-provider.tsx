'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { sessionPersister } from '@/lib/queryPersister';
import { STALE_TIMES } from '@/lib/staleTimes';
import { isCancellationError } from '@/lib/api';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIMES.DEFAULT,
            gcTime: 30 * 60 * 1000, // Keep in memory for 30 min
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: (failureCount, error: any) => {
              // Never retry intentionally cancelled requests (AbortSignal / tab switches)
              if (isCancellationError(error)) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: sessionPersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist successful queries, skip auth/permission queries from session storage
            const queryKeyStr = JSON.stringify(query.queryKey);
            const isAuthQuery = queryKeyStr.includes('"auth"');
            return query.state.status === 'success' && !isAuthQuery;
          },
        },
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
