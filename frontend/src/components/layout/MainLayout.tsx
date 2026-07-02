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
  Facebook,
  Menu,
  X
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
    '/dashboard/messaging': 'WhatsApp Chat',
    '/dashboard/whatsapp': 'WhatsApp Broadcast',
    '/dashboard/email': 'Email Campaigns',
    '/dashboard/meta': 'Meta Ads Sync',
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
    <div className="flex h-screen bg-brand-cream overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <img src={logo} alt="Sirisamruddhi Logo" className="h-20 w-auto object-contain" />
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/analytics" icon={<LineChart size={20} />} label="Analytics" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/leads" icon={<Users size={20} />} label="Leads" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/clients" icon={<UserCircle size={20} />} label="Clients & Deals" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/tasks" icon={<CheckSquare size={20} />} label="Tasks" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/messaging" icon={<MessageSquare size={20} />} label="WhatsApp Chat" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/whatsapp" icon={<Smartphone size={20} />} label="WhatsApp Broadcast" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/email" icon={<Mail size={20} />} label="Email Campaigns" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/meta" icon={<Facebook size={20} />} label="Meta Ads Sync" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem to="/dashboard/settings" icon={<Settings size={20} />} label="Settings" onClick={() => setIsMobileMenuOpen(false)} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-brand-maroon transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-brand-cream hover:text-brand-maroon rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 truncate">{currentTitle}</h2>
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <div className="w-8 h-8 rounded-full bg-brand-goldLight text-white flex items-center justify-center font-bold">
              A
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

// Helper component for navigation items
const NavItem = ({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) => {
  return (
    <NavLink 
      to={to} 
      end={to === "/dashboard"}
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center space-x-3 w-full p-3 rounded-lg transition-colors group ${
          isActive 
            ? 'bg-brand-maroon text-white font-bold' 
            : 'text-gray-600 hover:bg-brand-maroon hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive ? 'text-white' : 'text-brand-gold group-hover:text-white'}`}>
            {icon}
          </div>
          <span className="font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
};
