import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { Lock, User } from 'lucide-react';

export const LandingPage = () => {
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

      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();
      login(data.access_token);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream font-sans flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-center md:justify-start items-center p-6 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Sirisamruddhi Gold Palace Logo" className="h-12 w-auto" />
          <div>
            <h1 className="text-xl font-serif font-bold text-brand-maroon">SIRISAMRUDDHI</h1>
            <p className="text-xs text-brand-gold font-semibold tracking-widest uppercase">Gold Palace CRM</p>
          </div>
        </div>
      </nav>

      {/* Hero & Login Section */}
      <main className="flex-grow flex flex-col md:flex-row items-center justify-center max-w-7xl mx-auto px-4 py-12 gap-12 lg:gap-24">
        <div className="flex-1 text-center md:text-left max-w-2xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-maroon font-serif leading-tight">
            Manage Your Jewelry Business with Elegance and Ease
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            The all-in-one omnichannel CRM built specifically for Sirisamruddhi Gold Palace. Seamlessly handle leads, track sales, and connect with your clients.
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 pb-6 border-b border-gray-100 flex flex-col items-center bg-gray-50">
            <h2 className="text-2xl font-bold text-brand-maroon font-serif">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to the CRM dashboard</p>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-sm mb-6 text-center">
                <p className="text-red-600 font-bold">{error}</p>
                {error.includes('connect') || error.includes('Cannot') ? (
                  <p className="text-red-400 text-xs mt-1">
                    Make sure the backend is running: <code className="bg-red-100 px-1 rounded">run_backend.bat</code>
                  </p>
                ) : null}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-maroon text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition flex justify-center items-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
