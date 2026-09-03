import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, QrCode, Gift, History, 
  MessageSquare, Mail, Shield, LogOut, Menu, X, Sparkles
} from 'lucide-react';
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
  
  // Persistent session recovery from localStorage cache
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('gbm_staff_token') || localStorage.getItem('gmb_staff_token');
  });

  const [staff, setStaff] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem('gbm_staff_profile') || localStorage.getItem('gmb_staff_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('gbm_active_tab') || 'dashboard';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set and cache active tab based on staff role & user selection
  useEffect(() => {
    if (staff) {
      if (!localStorage.getItem('gbm_active_tab')) {
        if (staff.role === 'GATE_STAFF') setActiveTab('entry-scanner');
        else if (staff.role === 'GIFT_STAFF') setActiveTab('gift-scanner');
      }
    }
  }, [staff]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('gbm_active_tab', tabId);
  };

  const handleLoginSuccess = (newToken: string, newStaff: any) => {
    localStorage.setItem('gbm_staff_token', newToken);
    localStorage.setItem('gbm_staff_profile', JSON.stringify(newStaff));
    setToken(newToken);
    setStaff(newStaff);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out from the Admin Portal?')) {
      localStorage.removeItem('gbm_staff_token');
      localStorage.removeItem('gbm_staff_profile');
      localStorage.removeItem('gmb_staff_token');
      localStorage.removeItem('gmb_staff_profile');
      localStorage.removeItem('gbm_active_tab');
      setToken(null);
      setStaff(null);
    }
  };

  if (!token || !staff) {
    return <GmbAdminLogin onLoginSuccess={handleLoginSuccess} onCancel={() => {}} />;
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
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800 flex flex-col md:flex-row font-sans selection:bg-purple-600 selection:text-white">
      {/* ── Sidebar (Desktop - Clean Admin Safety Layout) ───────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111318] border-r border-[#1F2430] p-4 shrink-0 justify-between">
        <div className="space-y-4">
          
          {/* Clean Admin Header (No store name/logo, no home page link) */}
          <div className="p-3 border-b border-[#1E2330]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Sparkles size={16} />
              </div>
              <div>
                <h1 className="font-bold text-white text-xs tracking-wider uppercase font-display">
                  GBM ADMIN PORTAL
                </h1>
                <p className="text-[10px] text-purple-300/80 font-medium">
                  Event Control Center
                </p>
              </div>
            </div>
          </div>

          {/* Section Badge */}
          <div className="px-2 pt-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations Control
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold uppercase tracking-wider border border-purple-500/30">
              Active
            </span>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-1">
            {accessibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1E1538] border border-purple-500/40 text-purple-200 shadow-md shadow-purple-900/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-[#181B24]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-purple-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom User Card & Secure Sign Out */}
        <div className="pt-4 border-t border-[#1F2430]">
          <div className="p-2.5 rounded-2xl bg-[#171A23] border border-[#242A3A] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {staff.username ? staff.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="font-bold text-white text-xs truncate">{staff.full_name || staff.username}</p>
                <p className="text-[10px] text-purple-300 font-mono">{role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header (No store name/logo) ───────────────────────── */}
      <div className="md:hidden flex justify-between items-center px-4 py-3.5 bg-[#111318] border-b border-[#1F2430]">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-sm font-bold text-white font-display">GBM ADMIN PORTAL</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
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
        <div className="md:hidden bg-[#111318] border-b border-[#1F2430] p-4 space-y-1.5 animate-fadeIn">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { handleTabChange(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold ${
                  isActive
                    ? 'bg-[#1E1538] text-purple-200 border border-purple-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
              </button>
            );
          })}
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button onClick={handleLogout} className="text-xs text-rose-400 font-bold">Sign Out</button>
          </div>
        </div>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-[#F8F9FC]">
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
