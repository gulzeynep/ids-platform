import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Overview from './components/Overview';
import Analysis from './components/Analysis';
import Intrusions from './components/Intrusions';
import UserPanel from './components/UserPanel';

// KORUMALI ROTA (Sadece giriş yapanlar girebilir)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// --- AŞAMA 5 İÇİN GEÇİCİ SAYFALAR (PLACEHOLDERS) ---
// Bir sonraki aşamada bunların her biri için ayrı birer dosya oluşturup içini dolduracağız!
const Settings = () => <div className="text-2xl font-black">Settings Yapım Aşamasında...</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HERKESE AÇIK SAYFALAR */}
        <Route path="/" element={<LandingPage 
            onGetStarted={() => window.location.href='/register'} 
            onLoginClick={() => window.location.href='/login'} 
            onContactClick={() => {}} 
        />} />
        <Route path="/login" element={<Login 
            onLoginSuccess={() => window.location.href='/overview'} 
            onRegisterClick={() => window.location.href='/register'} 
            onBack={() => window.location.href='/'} 
        />} />
        <Route path="/register" element={<Register 
            onRegisterSuccess={() => window.location.href='/overview'} 
            onBack={() => window.location.href='/'} 
        />} />

        {/* SADECE GİRİŞ YAPANLARA AÇIK SAYFALAR (LAYOUT İÇİNDE) */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Layout'un içindeki <Outlet /> kısmına buralar gelecek */}
          <Route path="overview" element={<Overview />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="intrusions" element={<Intrusions />} />
          <Route path="users" element={<UserPanel />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Yanlış adrese gidilirse Overview'a at */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;