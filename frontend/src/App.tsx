import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppRoutes } from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 minutes cache
    },
  },
});

export const App: React.FC = () => {
  return (
    <StyleProvider hashPriority="low">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#0f172a',
            colorInfo: '#0f172a',
            colorSuccess: '#059669',
            colorWarning: '#d97706',
            colorError: '#e11d48',
            borderRadius: 8,
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ErrorBoundary>
        </QueryClientProvider>
      </ConfigProvider>
    </StyleProvider>
  );
};

export default App;
