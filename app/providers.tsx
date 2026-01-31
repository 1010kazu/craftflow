// app/providers.tsx

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import Header from '@/components/common/Header';
import { usePathname } from 'next/navigation';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// ヘッダーを表示しないパス
const noHeaderPaths = ['/login', '/register'];

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !noHeaderPaths.includes(pathname);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {showHeader && <Header />}
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
