import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
// Layouts
import PublicLayout from './components/PublicLayout'; // Landing, Login 
import AppLayout from './components/Layout'; // Sidebar and Dashboard menu
// Public Pages 
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Contact from './components/Contact';
// Private Pages
import Onboarding from './components/Onboarding';
import Overview from './components/Overview'; // Dashboard
import Intrusions from './components/Intrusions';
import Analysis from './components/Analysis'; // Intelligence
import Defense from './components/Defense'; // IP Blacklist
import Settings from './components/Settings';
import Profile from './components/Profile';
import AdminPanel from './components/Management'; // Management 
// Global State
import { useAuthStore } from './lib/store';

//Protected Route
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, hasWorkspace } = useAuthStore();
    const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && !hasWorkspace && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* ONBOARDING */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />

        {/* PRIVATE ROUTES */}
        <Route 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* IF LOGGED IN -> DASHBOARD */}
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/intrusions" element={<Intrusions />} />
          <Route path="/intelligence" element={<Analysis />} />
          <Route path="/defense" element={<Defense />} />
          
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/management" element={<AdminPanel />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;