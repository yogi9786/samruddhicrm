import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Sliders, Key, Save, Trash2, CheckCircle, XCircle } from 'lucide-react';

export const Settings = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await apiFetch('/auth/settings');
      setUsername(data.username || '');
      setPassword(data.password || '');
      setIsCustom(data.is_custom || false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiFetch('/auth/settings', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setMessage('Admin credentials updated successfully.');
      setIsCustom(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to delete these custom credentials? This will reset the admin username and password to the default values in your server configuration.')) {
      return;
    }
    setResetting(true);
    setMessage('');
    setError('');
    try {
      await apiFetch('/auth/settings', {
        method: 'DELETE',
      });
      setMessage('Custom credentials deleted. Reset to default config.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reset credentials');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-maroon"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Sliders size={26} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-maroon">System Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage admin login details and security credentials</p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100 font-medium flex items-center space-x-2">
          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium flex items-center space-x-2">
          <XCircle size={16} className="text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 bg-opacity-30">
          <div className="flex items-center space-x-2">
            <Key size={20} className="text-brand-gold" />
            <h3 className="font-bold text-gray-800 font-serif text-lg">Admin Login Credentials</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isCustom ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
          }`}>
            {isCustom ? 'Custom Credentials' : 'Default System'}
          </span>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Username</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50 font-mono"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Password</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50 font-mono"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-4 flex-wrap">
            {isCustom ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="flex items-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold px-4 py-2.5 rounded-xl transition text-sm"
              >
                <Trash2 size={16} />
                <span>{resetting ? 'Resetting...' : 'Delete & Reset to default'}</span>
              </button>
            ) : (
              <div className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Currently running on system defaults. Setting custom values will override defaults.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-brand-maroon text-white font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-95 transition shadow-sm text-sm"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
