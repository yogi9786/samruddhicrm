import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Building, ArrowRight, Sparkles, RefreshCw, Eye, EyeOff, Check } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

const API_URL = getApiBaseUrl();

const BRANCH_OPTIONS = [
  { id: 'branch_yelahanka', name: 'Yelahanka', city: 'Bangalore' },
  { id: 'branch_kolar', name: 'Kolar', city: 'Kolar' },
  { id: 'branch_udupi', name: 'Udupi', city: 'Udupi' }
];

export const CrmLogin: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('branch_yelahanka');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const selectedBranchObj = BRANCH_OPTIONS.find(b => b.id === selectedBranch) || BRANCH_OPTIONS[0];

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
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-purple-600 selection:text-white">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-slate-200/50">
          
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/70 border border-purple-300/80 text-purple-800 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles size={14} className="text-purple-600" />
              <span>SIRI SAMRUDDHI CRM PORTAL</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Step 1: Select Showroom Branch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                    1
                  </span>
                  <span>Select Showroom Branch</span>
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>Sync</span>
                </button>
              </div>

              {/* Branch Cards (Matching Image 1 3-Color Style) */}
              <div className="grid grid-cols-3 gap-3">
                {BRANCH_OPTIONS.map((b, idx) => {
                  const isSelected = selectedBranch === b.id;
                  const cardStyles = isSelected
                    ? 'bg-[#334155] border-[#334155] text-white shadow-md'
                    : idx === 1
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-slate-800 hover:border-emerald-400'
                    : 'bg-[#FFF7ED] border-[#FED7AA] text-slate-800 hover:border-amber-400';

                  const iconColor = isSelected
                    ? 'text-white'
                    : idx === 1
                    ? 'text-emerald-600'
                    : 'text-amber-600';

                  const subColor = isSelected
                    ? 'text-slate-300'
                    : idx === 1
                    ? 'text-emerald-700'
                    : 'text-amber-700';

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBranch(b.id)}
                      className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[90px] relative ${cardStyles}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Building size={18} className={iconColor} />
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white text-[#334155] flex items-center justify-center">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="font-bold text-xs sm:text-sm tracking-tight leading-tight">{b.name}</p>
                        <p className={`text-[10px] mt-0.5 ${subColor}`}>{b.city}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-slate-200/80 my-5" />

            {/* Step 2: Manager Credentials */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                  2
                </span>
                <span>Manager Credentials</span>
              </label>

              {/* Manager Name / Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Manager Name *
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
                    placeholder="ADARSHA (ADARSHA1234)"
                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Manager Password *
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
                    className="w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
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
                    Signing in...
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
