import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Building, ArrowRight, Sparkles, RefreshCw, Eye, EyeOff, Check, Shield, ChevronDown } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';
import { DEFAULT_BRANCHES } from './gmb/GmbRegistrationPage';

const API_URL = getApiBaseUrl();

export const CrmLogin: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('branch_bc002');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const selectedBranchObj = DEFAULT_BRANCHES.find(b => b.id === selectedBranch) || DEFAULT_BRANCHES[0];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password.trim());
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
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Background Decorative Ambient Glows matching Admin Layout */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-900/10 via-purple-600/5 to-transparent pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg my-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-purple-950/5">
          
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/70 border border-purple-300/80 text-purple-800 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles size={14} className="text-purple-600" />
              <span>SIRI SAMRUDDHI CRM PORTAL</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Manager Login
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your showroom branch and enter manager credentials
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Step 1: Select Showroom Branch */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                  1
                </span>
                <span>Select Showroom Branch</span>
              </label>

              {/* Branch Dropdown Selector */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                  <Building size={18} />
                </div>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer appearance-none shadow-sm"
                >
                  {DEFAULT_BRANCHES.map((b) => (
                    <option key={b.code} value={b.id} className="py-1">
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* Selected Branch Details */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-600 font-medium">Selected Branch:</span>
                  <strong className="text-purple-950 font-bold">{selectedBranchObj.code} - {selectedBranchObj.name}</strong>
                </div>
              </div>
            </div>

            {/* Step 2: Manager Credentials */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-4">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                  2
                </span>
                <span>Manager Credentials</span>
              </label>

              {/* Manager Name / Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manager Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. ADARSHA (ADARSHA1234)"
                    className="w-full pl-11 pr-3.5 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-semibold shadow-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter showroom manager password"
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Session & Branch Tag */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">Remember session</span>
                </label>

                <div className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-bold text-purple-800">
                  {selectedBranchObj.name} Branch
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#581C87] via-[#6D28D9] to-[#7C3AED] hover:from-[#4C1D95] hover:to-[#6D28D9] text-white font-bold rounded-2xl shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to {selectedBranchObj.name} Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
