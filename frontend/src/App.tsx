import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Onboarding } from './pages/auth/Onboarding';

import { Intelligence } from './pages/dashboard/Intelligence';
import { Overview } from './pages/dashboard/Overview';
import { Intrusions } from './pages/dashboard/Intrusions';
import { Defense } from './pages/dashboard/Defense';

import { Management } from './pages/dashboard/Management';
import { Settings } from './pages/dashboard/Settings';
import { Notifications } from './pages/dashboard/Notifications';
import { Profile } from './pages/dashboard/Profile';

import { useAuthStore } from './stores/auth.store';
import { useUIStore } from './stores/ui.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const theme = useUIStore((state) => state.theme);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster theme={theme === 'light' ? 'light' : 'dark'} position="top-right" richColors />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Overview />} />
            <Route path="intelligence" element={<Intelligence />} />
            <Route path="intrusions" element={<Intrusions />} />
            <Route path="defense" element={<Defense />} />
            <Route path="management" element={<Management />} />
            <Route path="settings" element={<Settings />} /> 
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
