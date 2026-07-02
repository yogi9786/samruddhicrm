import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './components/pages/LandingPage';

// Real CRM Pages
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { Clients } from './pages/Clients';
import { Tasks } from './pages/Tasks';
import { LiveChat } from './pages/LiveChat';
import { WhatsApp } from './pages/WhatsApp';
import { Email } from './pages/Email';
import { Meta } from './pages/Meta';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="clients" element={<Clients />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="messaging" element={<LiveChat />} />
              <Route path="whatsapp" element={<WhatsApp />} />
              <Route path="email" element={<Email />} />
              <Route path="meta" element={<Meta />} />
              <Route path="settings" element={<Settings />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
