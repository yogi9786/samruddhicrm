import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Shield, ArrowRight, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';
import natureBg from '../assets/nature-bg.png';
import '../landing-animations.css';
import { getApiBaseUrl } from '../utils/api';

const API_URL = getApiBaseUrl();

export const CrmLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid CRM credentials');
      }
      const data = await response.json();
      login(data.access_token);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with CRM server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background with dark overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${natureBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Navbar */}
      <nav className="relative z-20 flex justify-between items-center px-6 md:px-12 py-5 border-b border-amber-500/10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <img 
            src={logo} 
            alt="Siri Samruddhi Gold Palace" 
            className="h-10 w-10 rounded-full object-contain border border-amber-500/30 shadow-lg shadow-amber-500/10" 
          />
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide font-serif">
              SIRISAMRUDDHI
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-amber-400">
              Gold Palace CRM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <Shield size={13} />
          <span>Internal CRM Portal</span>
        </div>
      </nav>

      {/* Main Login Form Container */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 border border-amber-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient Gold Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 mb-4 shadow-lg shadow-amber-500/20">
                <Lock size={26} className="text-slate-950 font-bold" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif tracking-tight">
                CRM Executive Sign In
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Enter your authorized credentials to access leads & sales
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-xl text-sm mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center font-medium">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  CRM Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter CRM username"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign In to CRM</span>
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span>Siri Samruddhi Gold Palace CRM System</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
