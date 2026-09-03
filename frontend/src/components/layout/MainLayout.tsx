import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Compass,
  FileText,
  ChevronRight,
  Sparkles
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
  const navigate = useNavigate();
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
    <div className="flex h-screen overflow-hidden relative bg-[#F8F9FC] font-sans selection:bg-purple-600 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Luxury Dark Sidebar (Matching Image 2) ───────────────────────── */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111318] border-r border-[#1F2430] flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Logo & Brand Header */}
          <div className="p-5 flex items-center justify-between border-b border-[#1E2330]">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20">
                <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-lg bg-[#111318] p-1" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm tracking-wide leading-tight font-display">
                  SIRI SAMRUDDHI
                </h1>
                <p className="text-[10px] text-amber-400/90 font-semibold tracking-wider">
                  Gold Palace Portal
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Section Badge */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Showroom Operations
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold uppercase tracking-wider border border-purple-500/30">
              Portal
            </span>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto custom-scrollbar">
            <SidebarNavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarNavItem to="/dashboard/leads" icon={<Users size={18} />} label="Employees" hasChevron onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarNavItem to="/dashboard/clients" icon={<Compass size={18} />} label="Outdoor Marketing" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarNavItem to="/dashboard/tasks" icon={<FileText size={18} />} label="Daily Closing & Forms" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarNavItem to="/dashboard/analytics" icon={<LineChart size={18} />} label="Customers" onClick={() => setIsMobileMenuOpen(false)} />
            
            {/* Communication & CRM Channels */}
            <div className="pt-3 pb-1 px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Direct Channels
              </span>
            </div>
            <SidebarNavItem to="/dashboard/messaging" icon={<MessageSquare size={18} />} label="Live Chat" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarNavItem to="/dashboard/whatsapp" icon={<Smartphone size={18} />} label="WhatsApp Broadcast" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarNavItem to="/dashboard/email" icon={<Mail size={18} />} label="Email Campaigns" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarNavItem 
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
        </div>

        {/* ── Bottom User Profile Card (Matching Image 2) ────────────────── */}
        <div className="p-3 border-t border-[#1E2330]">
          <div className="p-2.5 rounded-2xl bg-[#171A23] border border-[#242A3A] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                A
              </div>
              <div className="truncate">
                <p className="font-bold text-white text-xs truncate">ADARSHA</p>
                <div className="flex items-center text-[10px] text-slate-400 gap-1">
                  <span>Mgr #109</span>
                  <span>·</span>
                  <NavLink to="/dashboard/settings" className="hover:text-purple-300">Settings</NavLink>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <NavLink 
                to="/dashboard/settings"
                title="Settings"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <Settings size={15} />
              </NavLink>
              <button 
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Canvas Area ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar (Matching Image 2) */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 shadow-sm">
          
          {/* Left: Mobile Menu Trigger & Showroom Branch Badge */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Showroom Branch Pill Badge (Matching Image 2) */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111318] text-white text-xs border border-[#242A3A] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold tracking-tight">Yelahanka Showroom Branch</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-600/30 border border-purple-400/40 text-purple-300 text-[9px] font-bold uppercase tracking-wider">
                Showroom
              </span>
            </div>
          </div>

          {/* Right: User Manager Badge + Logout Action */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl bg-[#F8FAFC] border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                A
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">ADARSHA</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Showroom Manager</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Page Outlet Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8F9FC]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// ── Sidebar Navigation Item (Active Purple Pill Container Matching Image 2) ──
const SidebarNavItem = ({ 
  to, 
  icon, 
  label, 
  hasChevron, 
  onClick 
}: { 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  hasChevron?: boolean;
  onClick?: () => void;
}) => {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl transition-all text-xs font-semibold ${
          isActive
            ? 'bg-[#1E1538] border border-purple-500/40 text-purple-200 shadow-md shadow-purple-900/20 font-bold'
            : 'text-slate-400 hover:text-white hover:bg-[#181B24]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center space-x-3">
            <div className={isActive ? 'text-purple-400' : 'text-slate-400'}>
              {icon}
            </div>
            <span>{label}</span>
          </div>

          {isActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          ) : hasChevron ? (
            <ChevronRight size={14} className="text-slate-600" />
          ) : null}
        </>
      )}
    </NavLink>
  );
};
