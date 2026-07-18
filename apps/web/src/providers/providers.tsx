'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
