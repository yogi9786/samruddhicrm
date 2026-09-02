import React, { useState } from 'react';
import { Shield, Lock, User, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import logo from '../../../assets/logo.png';
import natureBg from '../../../assets/nature-bg.png';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbAdminLoginProps {
  onLoginSuccess: (token: string, staff: any) => void;
  onCancel?: () => void;
}

export const GmbAdminLogin: React.FC<GmbAdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/gmb/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid username or password');
      }

      localStorage.setItem('gmb_staff_token', data.access_token);
      localStorage.setItem('gmb_staff_profile', JSON.stringify({
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        branch_id: data.branch_id
      }));

      onLoginSuccess(data.access_token, data);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Nature background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${natureBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-slate-950/85 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/95 border border-amber-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-950 shadow-lg shadow-amber-500/20">
              <Shield size={28} className="font-bold" />
            </div>
            <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
              GMB Staff & Admin Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Authorized gate entry, gift distribution & event administration
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Staff / Admin Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={17} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. siriadmin or gate_staff1"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={17} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Quick Staff Accounts:</p>
            <div className="flex justify-between text-[10px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
              <span>Admin: <code className="text-amber-400">siriadmin</code></span>
              <span>Gate Staff: <code className="text-amber-400">gate_staff1</code></span>
              <span>Gift Staff: <code className="text-amber-400">gift_staff1</code></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
