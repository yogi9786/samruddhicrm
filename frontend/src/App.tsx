import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CrmLogin } from './pages/CrmLogin';
import { GmbRegistrationPage } from './pages/gmb/GmbRegistrationPage';
import { GmbPassPage } from './pages/gmb/GmbPassPage';
import { GmbAdminLayout } from './pages/admin/gmb/GmbAdminLayout';

// CRM Pages
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
          {/* Main Home Page directly renders GBM Registration Form */}
          <Route path="/" element={<GmbRegistrationPage />} />
          
          {/* Public GBM Event Registration & Pass Routes */}
          <Route path="/gbm/registrationform" element={<GmbRegistrationPage />} />
          <Route path="/gbm/registrationform/" element={<GmbRegistrationPage />} />
          <Route path="/gbm/events" element={<GmbRegistrationPage />} />
          <Route path="/gbm" element={<GmbRegistrationPage />} />
          <Route path="/GBM Event" element={<GmbRegistrationPage />} />
          <Route path="/gbm/pass/:token" element={<GmbPassPage />} />

          {/* Legacy GMB Aliases */}
          <Route path="/gmb/registrationform" element={<GmbRegistrationPage />} />
          <Route path="/gmb/registrationform/" element={<GmbRegistrationPage />} />
          <Route path="/gmb/pass/:token" element={<GmbPassPage />} />

          {/* Dedicated Secret CRM Login Route */}
          <Route path="/sirisamruddhicrmlogin" element={<CrmLogin />} />
          <Route path="/login" element={<Navigate to="/sirisamruddhicrmlogin" replace />} />

          {/* GBM Admin & Staff Portal */}
          <Route path="/admin" element={<GmbAdminLayout />} />
          <Route path="/admin/*" element={<GmbAdminLayout />} />

          {/* Protected Full-Featured CRM Dashboard */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
