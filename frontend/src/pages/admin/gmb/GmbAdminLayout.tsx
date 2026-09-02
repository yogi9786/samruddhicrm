import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, QrCode, Gift, History, 
  MessageSquare, Mail, Shield, LogOut, Menu, X, Building, ArrowLeft
} from 'lucide-react';
import logo from '../../../assets/logo.png';
import { GmbAdminLogin } from './GmbAdminLogin';
import { GmbDashboardView } from './GmbDashboardView';
import { GmbRegistrationsView } from './GmbRegistrationsView';
import { GmbEntryScannerView } from './GmbEntryScannerView';
import { GmbGiftScannerView } from './GmbGiftScannerView';
import { GmbHistoryView } from './GmbHistoryView';
import { GmbLogsView } from './GmbLogsView';
import { GmbStaffView } from './GmbStaffView';

export const GmbAdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem('gbm_staff_token') || localStorage.getItem('gmb_staff_token'));
  const [staff, setStaff] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem('gbm_staff_profile') || localStorage.getItem('gmb_staff_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set default view based on staff role
  useEffect(() => {
    if (staff) {
      if (staff.role === 'GATE_STAFF') setActiveTab('entry-scanner');
      else if (staff.role === 'GIFT_STAFF') setActiveTab('gift-scanner');
    }
  }, [staff]);

  const handleLoginSuccess = (newToken: string, newStaff: any) => {
    localStorage.setItem('gbm_staff_token', newToken);
    localStorage.setItem('gbm_staff_profile', JSON.stringify(newStaff));
    setToken(newToken);
    setStaff(newStaff);
  };

  const handleLogout = () => {
    localStorage.removeItem('gbm_staff_token');
    localStorage.removeItem('gbm_staff_profile');
    localStorage.removeItem('gmb_staff_token');
    localStorage.removeItem('gmb_staff_profile');
    setToken(null);
    setStaff(null);
  };

  if (!token || !staff) {
    return <GmbAdminLogin onLoginSuccess={handleLoginSuccess} onCancel={() => navigate('/')} />;
  }

  const role = staff.role || 'GATE_STAFF';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
    { id: 'registrations', label: 'Registrations', icon: Users, roles: ['ADMIN'] },
    { id: 'entry-scanner', label: 'Entry Scanner', icon: QrCode, roles: ['ADMIN', 'GATE_STAFF'] },
    { id: 'gift-scanner', label: 'Gift Scanner', icon: Gift, roles: ['ADMIN', 'GIFT_STAFF'] },
    { id: 'entry-history', label: 'Entry History', icon: History, roles: ['ADMIN', 'GATE_STAFF'] },
    { id: 'gift-history', label: 'Gift History', icon: Gift, roles: ['ADMIN', 'GIFT_STAFF'] },
    { id: 'whatsapp-logs', label: 'WhatsApp Logs', icon: MessageSquare, roles: ['ADMIN'] },
    { id: 'email-logs', label: 'Email Logs', icon: Mail, roles: ['ADMIN'] },
    { id: 'staff', label: 'Staff Users', icon: Shield, roles: ['ADMIN'] },
  ];

  const accessibleItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* ── Sidebar (Desktop) ────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={logo} 
              alt="Logo" 
              className="h-10 w-10 rounded-full object-contain border border-amber-400/40" 
            />
            <div>
              <h1 className="text-base font-bold text-white font-serif tracking-wide">
                SIRISAMRUDDHI
              </h1>
              <p className="text-[9px] font-semibold tracking-[0.3em] uppercase text-amber-400">
                GBM FORMS ADMIN
              </p>
            </div>
          </div>

          {/* Staff Info Pill */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <p className="text-xs font-bold text-white truncate">{staff.full_name || staff.username}</p>
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <span className="text-slate-400 font-mono">@{staff.username}</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                role === 'GATE_STAFF' ? 'bg-emerald-500/20 text-emerald-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>
                {role}
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-2">
              GBM Event Operations
            </span>
            {accessibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Public Home</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header ────────────────────────────────────────────── */}
      <div className="md:hidden flex justify-between items-center px-4 py-3.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="h-8 w-8 rounded-full border border-amber-400" />
          <span className="text-sm font-bold text-white font-serif">GMB ADMIN</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            {role}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-white"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-1.5 animate-fadeIn">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex justify-between">
            <button onClick={() => navigate('/')} className="text-xs text-slate-400">Public Home</button>
            <button onClick={handleLogout} className="text-xs text-rose-400 font-bold">Sign Out</button>
          </div>
        </div>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && <GmbDashboardView token={token} />}
        {activeTab === 'registrations' && <GmbRegistrationsView token={token} />}
        {activeTab === 'entry-scanner' && <GmbEntryScannerView token={token} />}
        {activeTab === 'gift-scanner' && <GmbGiftScannerView token={token} />}
        {activeTab === 'entry-history' && <GmbHistoryView token={token} defaultTab="entry" />}
        {activeTab === 'gift-history' && <GmbHistoryView token={token} defaultTab="gift" />}
        {activeTab === 'whatsapp-logs' && <GmbLogsView token={token} defaultChannel="whatsapp" />}
        {activeTab === 'email-logs' && <GmbLogsView token={token} defaultChannel="email" />}
        {activeTab === 'staff' && <GmbStaffView token={token} />}
      </main>
    </div>
  );
};
