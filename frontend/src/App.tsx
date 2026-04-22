import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// --- STORES ---
import { useAuthStore } from './stores/auth.store';

// --- LAYOUTS (Ortak İskeletler) ---
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// --- PAGES (Ana Sayfalar) ---
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Onboarding } from './pages/auth/Onboarding';
import { Intelligence } from './pages/dashboard/Intelligence';
import { Overview } from './pages/dashboard/Overview';
import { Intrusions } from './pages/dashboard/Intrusions';
import { Defense } from './pages/dashboard/Defense';
import { Management } from './pages/dashboard/Management';

// --- PROTECTED ROUTE GUARD ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, hasWorkspace } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Login yapmış ama workspace kurmamışsa zorla onboarding'e
  if (isAuthenticated && !hasWorkspace && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
      
      <Routes>
        {/* PUBLIC: Giriş yapmamış kullanıcılar için (Sidebar yok) */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ONBOARDING: Giriş yapmış ama kurulum bekleyenler */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />

        {/* PRIVATE: Dashboard Alanı (Sidebar + Navbar var) */}
        <Route 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Overview />} />
          <Route path="intelligence" element={<Intelligence />} />
          <Route path="intrusions" element={<Intrusions />} />
          <Route path="defense" element={<Defense />} />
          <Route path="management" element={<Management />} />
          
          <Route path="settings" element={<div className="p-8 text-neutral-500 font-mono">Terminal :: Accessing User Settings...</div>} />
        </Route>

        {/* 404: Kaybolanları Dashboard'a fırlat */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </QueryClientProvider>
  );
}