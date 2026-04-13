import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Overview from './components/Overview';
import Analysis from './components/Analysis';
import Intrusions from './components/Intrusions';
import Profile from './components/Profile';
import Contact from './components/Contact';
import Management from './components/Management';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import SetupGuide from './components/SetupGuide';

import { useAuthStore } from './lib/store';

// Initialize the TanStack Query Client outside the component to prevent re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents excessive API calls when switching tabs
      retry: 1,                    // Only retry failed requests once
    },
  },
});

// PROTECTED ROUTE (Only accessible to authenticated operatives)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Using Zustand store makes this component reactive to login/logout events
  const token = useAuthStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />

          {/* PROTECTED ROUTES (WRAPPED IN LAYOUT) */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="setup" element={<SetupGuide />} />
            <Route path="overview" element={<Overview />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="intrusions" element={<Intrusions />} />
            <Route path="management" element={<Management />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Catch-all redirect for unknown routes could be added here */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;