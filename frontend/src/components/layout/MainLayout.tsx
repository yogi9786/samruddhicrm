import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  CheckSquare, 
  MessageSquare, 
  Settings, 
  LogOut, 
  LineChart,
  Smartphone,
  Mail,
  Share2,
  Menu,
  X,
  Camera,
  Gem
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import { apiFetch } from '../../utils/api';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const MainLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard Overview',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/leads': 'Leads Management',
    '/dashboard/clients': 'Clients & Deals',
    '/dashboard/tasks': 'Tasks',
    '/dashboard/messaging': 'Live Chat',
    '/dashboard/whatsapp': 'WhatsApp Broadcast',
    '/dashboard/email': 'Email Campaigns',
    '/dashboard/meta': 'Meta Integration',
    '/dashboard/settings': 'Settings',
  };

  const currentTitle = pageTitles[location.pathname] || 'CRM Dashboard';

  useEffect(() => {
    document.title = `${currentTitle} | Sirisamruddhi CRM`;
  }, [currentTitle]);

  useEffect(() => {
    const setupPushNotifications = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const vapidPublicKey = 'BFSez6aHUbotPSLnHyOSx9HLefHMu7m6WJejuD_9fP7udiyV9zYYBFCKGqwuzVTXapvHu93EqfOWF-FLNUu1M24';
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
              });
            }
            await apiFetch('/notifications/subscribe', {
              method: 'POST',
              body: JSON.stringify(subscription)
            });
          }
        } catch (err) {
          console.error('Push subscription failed:', err);
        }
      }
    };
    setupPushNotifications();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: '#fdf8f0' }}>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Premium Dark Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(160deg, #3d0000 0%, #5a0000 50%, #800000 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.25)' }}
      >
        {/* Logo Area */}
        <div className="p-5 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
              <img src={logo} alt="Sirisamruddhi Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Sirisamruddhi</p>
              <p className="text-xs" style={{ color: 'rgba(245,158,11,0.7)' }}>Gold Palace CRM</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {/* Main Section */}
          <p className="text-xs font-bold px-3 pt-3 pb-2 uppercase tracking-widest" style={{ color: 'rgba(245,158,11,0.5)' }}>Main</p>
          <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/analytics" icon={<LineChart size={18} />} label="Analytics" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* CRM Section */}
          <p className="text-xs font-bold px-3 pt-4 pb-2 uppercase tracking-widest" style={{ color: 'rgba(245,158,11,0.5)' }}>CRM</p>
          <NavItem to="/dashboard/leads" icon={<Users size={18} />} label="Leads" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/clients" icon={<UserCircle size={18} />} label="Clients & Deals" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/tasks" icon={<CheckSquare size={18} />} label="Tasks" onClick={() => setIsMobileMenuOpen(false)} />

          {/* Messaging Section */}
          <p className="text-xs font-bold px-3 pt-4 pb-2 uppercase tracking-widest" style={{ color: 'rgba(245,158,11,0.5)' }}>Messaging</p>
          <NavItem to="/dashboard/messaging" icon={<MessageSquare size={18} />} label="Live Chat" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/whatsapp" icon={<Smartphone size={18} />} label="WhatsApp Broadcast" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/email" icon={<Mail size={18} />} label="Email Campaigns" onClick={() => setIsMobileMenuOpen(false)} />

          {/* Integrations Section */}
          <p className="text-xs font-bold px-3 pt-4 pb-2 uppercase tracking-widest" style={{ color: 'rgba(245,158,11,0.5)' }}>Integrations</p>
          <NavItem 
            to="/dashboard/meta" 
            icon={
              <div className="flex items-center">
                <Share2 size={14} />
                <Camera size={14} className="-ml-0.5" />
              </div>
            } 
            label="Meta (FB & IG)" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        </nav>

        {/* Settings & Logout */}
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <NavItem to="/dashboard/settings" icon={<Settings size={18} />} label="Settings" onClick={() => setIsMobileMenuOpen(false)} />
          <button 
            onClick={logout}
            className="flex items-center space-x-3 w-full p-3 rounded-xl transition-all group"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>

        {/* Version tag */}
        <div className="px-5 pb-4">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>v1.0.0 · Sirisamruddhi CRM</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Premium Header */}
        <header className="h-16 bg-white flex items-center justify-between px-4 md:px-8 shrink-0" style={{ borderBottom: '1px solid #f0e8d8', boxShadow: '0 1px 12px rgba(128,0,0,0.04)' }}>
          <div className="flex items-center space-x-3 truncate">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg transition-colors"
              style={{ color: '#800000' }}
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-base font-bold truncate" style={{ color: '#1a1a1a' }}>{currentTitle}</h2>
              <p className="text-xs hidden sm:block" style={{ color: '#9ca3af' }}>Sirisamruddhi Gold Palace</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            {/* Admin Avatar */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #800000, #F59E0B)' }}>
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold" style={{ color: '#374151' }}>Admin</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Super User</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Premium dark sidebar nav item
const NavItem = ({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) => {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
          isActive
            ? 'text-white'
            : 'hover:bg-white hover:bg-opacity-10'
        }`
      }
      style={({ isActive }) => isActive ? {
        background: 'linear-gradient(90deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.08) 100%)',
        borderLeft: '3px solid #F59E0B',
        color: '#FFFFFF',
        paddingLeft: '9px'
      } : {
        color: 'rgba(255,255,255,0.65)',
        borderLeft: '3px solid transparent'
      }}
    >
      <div style={{ color: 'inherit' }}>{icon}</div>
      <span>{label}</span>
    </NavLink>
  );
};
