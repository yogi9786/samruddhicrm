import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbStaffViewProps {
  token: string;
}

export const GmbStaffView: React.FC<GmbStaffViewProps> = ({ token }) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New staff form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('GATE_STAFF');
  const [branchId, setBranchId] = useState('branch_yelahanka');
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchStaff = () => {
    setLoading(true);
    fetch(`${API_URL}/gmb/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStaffList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      const res = await fetch(`${API_URL}/gmb/admin/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          full_name: fullName.trim(),
          role: role,
          branch_id: branchId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create staff account');
      }

      setShowCreateModal(false);
      setUsername('');
      setPassword('');
      setFullName('');
      fetchStaff();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm("Are you sure you want to remove this staff account?")) return;
    try {
      await fetch(`${API_URL}/gmb/admin/staff/${staffId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStaff();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white font-serif tracking-wide">
            Staff & Scanner User Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized Gate Staff and Gift Counter operator credentials
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
        >
          <UserPlus size={15} />
          <span>Add New Staff</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Full Name</th>
                <th className="px-4 py-3.5">Username</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Assigned Branch</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading staff accounts...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No custom staff members added yet.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-white">
                      {s.full_name}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-amber-400">
                      {s.username}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                        s.role === 'GATE_STAFF' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {s.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400">
                      {s.branch_name || 'All Branches'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-emerald-400 text-xs font-semibold">Active</span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {s.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteStaff(s.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* CREATE STAFF MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">Add Staff / Scanner Account</h3>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. gate_staff2"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="GATE_STAFF">GATE_STAFF (Check-in scanner)</option>
                  <option value="GIFT_STAFF">GIFT_STAFF (Gift distribution scanner)</option>
                  <option value="ADMIN">ADMIN (Full management permissions)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Assigned Store Branch
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="branch_yelahanka">Yelahanka</option>
                  <option value="branch_kolar">Kolar</option>
                  <option value="branch_udupi">Udupi</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  {creating ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
