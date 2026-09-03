import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Ticket, MessageSquare, Mail, 
  Gift, QrCode, Building, TrendingUp, RefreshCw, AlertCircle,
  Clock, Sparkles
} from 'lucide-react';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbDashboardViewProps {
  token: string;
}

export const GmbDashboardView: React.FC<GmbDashboardViewProps> = ({ token }) => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = () => {
    setLoading(true);
    fetch(`${API_URL}/gmb/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dashboard metrics');
        return res.json();
      })
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [token]);

  if (loading && !metrics) {
    return (
      <div className="p-12 flex items-center justify-center text-purple-700 font-sans">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-sm font-semibold text-slate-700">Loading live event metrics...</span>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="p-8 text-center text-rose-600 bg-white rounded-3xl border border-rose-200">
        <AlertCircle size={32} className="mx-auto mb-2 text-rose-500" />
        <p className="text-sm font-semibold">{error}</p>
        <button onClick={fetchMetrics} className="mt-4 px-5 py-2 bg-purple-600 text-white rounded-2xl text-xs font-bold shadow-md">
          Retry
        </button>
      </div>
    );
  }

  const m = metrics || {};
  const branchEntries = Object.entries(m.branch_breakdown || {});

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── Top Hero Command Banner (Matching Image 2) ───────────────────── */}
      <div className="relative bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
        
        {/* Decorative Corner Brackets [ ] */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-purple-400/80 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-purple-400/80 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-purple-400/80 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-purple-400/80 rounded-br-sm pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
              <span>GBM Annual Event 2026</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <Clock size={12} className="text-slate-400" />
              <span>{todayFormatted}</span>
            </div>
          </div>

          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
            <span>Refresh Live</span>
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            GBM Event Operations <span className="text-[#6D28D9]">Command Center</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time delegate registration, gate check-in, and gift redemption metrics for Siri Samruddhi Gold Palace
          </p>
        </div>
      </div>

      {/* ── 4 Primary Metric Cards (Matching Image 2 Style) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Registered */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</span>
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                <Users size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2 font-display">{m.total_registrations || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Delegate Registrations</p>
          </div>
          <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">OTP Verified:</span>
            <span className="font-bold text-emerald-700">{m.otp_verified_count || 0}</span>
          </div>
        </div>

        {/* Gate Entries */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gate Checked-In</span>
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-700 mt-2 font-display">{m.total_entered || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Attendees in Hall</p>
          </div>
          <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Not Entered:</span>
            <span className="font-bold text-slate-600">{m.not_entered || 0}</span>
          </div>
        </div>

        {/* Gifts Claimed */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gifts Distributed</span>
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                <Gift size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-900 mt-2 font-display">{m.gifts_claimed || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Claimed at Counter</p>
          </div>
          <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Pending Gifts:</span>
            <span className="font-bold text-amber-700">{m.gifts_pending || 0}</span>
          </div>
        </div>

        {/* Passes Issued */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Passes Generated</span>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <Ticket size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2 font-display">{m.passes_generated || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Live QR Tokens</p>
          </div>
          <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Dispatched:</span>
            <span className="font-bold text-blue-700">100% Ready</span>
          </div>
        </div>
      </div>

      {/* ── Secondary Metric Grids: Branch & Gender Breakdowns ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Branch Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Building size={16} className="text-purple-600" />
            <span>Store Branch Breakdown</span>
          </h3>
          <div className="space-y-2.5">
            {branchEntries.length > 0 ? (
              branchEntries.map(([branch, count]: any) => (
                <div key={branch} className="flex justify-between items-center p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-800">{branch}</span>
                  <span className="text-xs font-bold font-mono text-purple-800 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                    {count} delegates
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No branch registrations yet</p>
            )}
          </div>
        </div>

        {/* Gender Breakdown & Gift Allocation */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Gift size={16} className="text-purple-600" />
            <span>Gender & Gift Allocation</span>
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-800">Male Delegates</p>
                <p className="text-[10px] text-slate-500">Executive Watch Set</p>
              </div>
              <span className="text-base font-bold font-mono text-purple-700">{m.male_count || 0}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-800">Female Delegates</p>
                <p className="text-[10px] text-slate-500">Pure Silk Saree Box</p>
              </div>
              <span className="text-base font-bold font-mono text-pink-600">{m.female_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Pass Delivery Status */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-emerald-600" />
            <span>Pass Delivery Status</span>
          </h3>
          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp Sent:
              </span>
              <span className="font-bold font-mono text-emerald-700">{m.whatsapp_sent || 0}</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> WhatsApp Failed:
              </span>
              <span className="font-bold font-mono text-rose-700">{m.whatsapp_failed || 0}</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Emails Sent:
              </span>
              <span className="font-bold font-mono text-blue-700">{m.emails_sent || 0}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
