import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// KORUMALI ROTA (Sadece giriş yapanlar girebilir)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HERKESE AÇIK SAYFALAR */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />

        {/* SADECE GİRİŞ YAPANLARA AÇIK SAYFALAR (LAYOUT İÇİNDE) */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="overview" element={<Overview />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="intrusions" element={<Intrusions />} />
          <Route path="management" element={<Management />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          </Route>
        
        {/* Yanlış adrese gidilirse Overview'a at */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;