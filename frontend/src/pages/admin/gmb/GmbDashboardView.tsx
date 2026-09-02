import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Ticket, MessageSquare, Mail, 
  Gift, QrCode, Building, TrendingUp, RefreshCw, AlertCircle
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
      <div className="p-8 flex items-center justify-center text-amber-400">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-sm">Loading event metrics...</span>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="p-8 text-center text-rose-400">
        <AlertCircle size={32} className="mx-auto mb-2" />
        <p className="text-sm">{error}</p>
        <button onClick={fetchMetrics} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs">
          Retry
        </button>
      </div>
    );
  }

  const m = metrics || {};
  const branchEntries = Object.entries(m.branch_breakdown || {});

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-white font-serif tracking-wide">
            GBM Annual Event 2026 — Live Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time delegate registration, entry check-in, and gift distribution metrics
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all self-end sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Live</span>
        </button>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-white mt-3">{m.total_registrations || 0}</p>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">OTP Verified: {m.otp_verified_count || 0}</p>
        </div>

        {/* Gate Entries */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gate Entered</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-emerald-400 mt-3">{m.total_entered || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Not Entered: {m.not_entered || 0}</p>
        </div>

        {/* Gifts Claimed */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gifts Claimed</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Gift size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-amber-400 mt-3">{m.gifts_claimed || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Gifts Pending: {m.gifts_pending || 0}</p>
        </div>

        {/* Passes Issued */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passes Generated</span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Ticket size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-white mt-3">{m.passes_generated || 0}</p>
          <p className="text-[11px] text-sky-400 mt-1">Ready with QR Tokens</p>
        </div>
      </div>

      {/* Secondary Metric Grids: Notifications & Gender / Branch Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Branch Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Building size={16} className="text-amber-400" />
            <span>Store Branch Breakdown</span>
          </h3>
          <div className="space-y-3">
            {branchEntries.length > 0 ? (
              branchEntries.map(([branch, count]: any) => (
                <div key={branch} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-medium text-slate-200">{branch}</span>
                  <span className="text-sm font-bold font-mono text-amber-400">{count} delegates</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No branch registrations yet</p>
            )}
          </div>
        </div>

        {/* Gender Breakdown & Gift Allocation */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Gift size={16} className="text-amber-400" />
            <span>Gender & Gift Allocation</span>
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-slate-200">Male Delegates</p>
                <p className="text-[10px] text-slate-400">Executive Prestige Watch Set</p>
              </div>
              <span className="text-base font-bold font-mono text-blue-400">{m.male_count || 0}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-slate-200">Female Delegates</p>
                <p className="text-[10px] text-slate-400">Pure Silk Saree & Jewelry Box</p>
              </div>
              <span className="text-base font-bold font-mono text-pink-400">{m.female_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Dispatch & Communications Status */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-emerald-400" />
            <span>Pass Delivery Status</span>
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> WhatsApp Sent:
              </span>
              <span className="font-bold text-emerald-400">{m.whatsapp_sent || 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> WhatsApp Failed:
              </span>
              <span className="font-bold text-rose-400">{m.whatsapp_failed || 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Emails Sent:
              </span>
              <span className="font-bold text-sky-400">{m.emails_sent || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
