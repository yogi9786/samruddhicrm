import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, RefreshCw, MessageSquare, 
  Mail, CheckCircle2, Clock, X, ChevronLeft, ChevronRight, User, 
  Shield, AlertCircle, Edit3, Trash2, AlertTriangle, Save, Building, Phone
} from 'lucide-react';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbRegistrationsViewProps {
  token: string;
}

export const GmbRegistrationsView: React.FC<GmbRegistrationsViewProps> = ({ token }) => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [giftFilter, setGiftFilter] = useState('');

  // Selected Registration Detail Modal
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Edit Participant Modal State
  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    designation: '',
    employee_id: '',
    mobile: '',
    email: '',
    branch_id: '',
    gender: 'male' as 'male' | 'female',
    entry_status: 'NOT_ENTERED' as 'NOT_ENTERED' | 'ENTERED',
    gift_status: 'PENDING' as 'PENDING' | 'CLAIMED'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Delete Participant State
  const [deletingParticipant, setDeletingParticipant] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchRegistrations = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      search: search.trim(),
      branch_id: branchFilter,
      gender: genderFilter,
      entry_status: entryFilter,
      gift_status: giftFilter,
    });

    fetch(`${API_URL}/gmb/admin/registrations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load registrations');
        return res.json();
      })
      .then(data => {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRegistrations();
  }, [page, branchFilter, genderFilter, entryFilter, giftFilter, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRegistrations();
  };

  const openDetailModal = (regId: string) => {
    setLoadingDetail(true);
    setSelectedReg(null);
    setActionNotice(null);

    fetch(`${API_URL}/gmb/admin/registrations/${regId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSelectedReg(data);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingDetail(false);
      });
  };

  // Open Edit Modal
  const openEditModal = (item: any) => {
    setEditingParticipant(item);
    setEditForm({
      name: item.name || '',
      designation: item.designation || '',
      employee_id: item.employee_id || '',
      mobile: item.mobile || '',
      email: item.email || '',
      branch_id: item.branch_id || (item.branch_name === 'Kolar' ? 'branch_kolar' : item.branch_name === 'Udupi' ? 'branch_udupi' : 'branch_yelahanka'),
      gender: (item.gender || 'male').toLowerCase() as 'male' | 'female',
      entry_status: item.entry_status || 'NOT_ENTERED',
      gift_status: item.gift_status || 'PENDING'
    });
    setEditError(null);
    setEditSuccess(null);
  };

  // Handle Save Participant Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;

    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const res = await fetch(`${API_URL}/gmb/admin/registrations/${editingParticipant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update participant details.');
      }

      setEditSuccess(data.message || 'Participant updated successfully!');
      
      // Update local state and table
      fetchRegistrations();
      if (selectedReg && selectedReg.id === editingParticipant.id) {
        openDetailModal(editingParticipant.id);
      }

      setTimeout(() => {
        setEditingParticipant(null);
        setEditSuccess(null);
      }, 1200);
    } catch (err: any) {
      setEditError(err.message || 'Error updating participant.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Participant
  const handleDeleteConfirm = async () => {
    if (!deletingParticipant) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`${API_URL}/gmb/admin/registrations/${deletingParticipant.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to delete participant.');
      }

      // Close modal and refresh
      setDeletingParticipant(null);
      if (selectedReg && selectedReg.id === deletingParticipant.id) {
        setSelectedReg(null);
      }
      fetchRegistrations();
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting participant.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResendWhatsapp = async (regId: string) => {
    setActionNotice("Triggering WhatsApp delivery...");
    try {
      const res = await fetch(`${API_URL}/gmb/admin/resend/whatsapp/${regId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActionNotice(data.message || "WhatsApp message dispatched!");
      openDetailModal(regId);
    } catch (e) {
      setActionNotice("Failed to dispatch WhatsApp.");
    }
  };

  const handleResendEmail = async (regId: string) => {
    setActionNotice("Triggering Email delivery...");
    try {
      const res = await fetch(`${API_URL}/gmb/admin/resend/email/${regId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActionNotice(data.message || "Email message dispatched!");
      openDetailModal(regId);
    } catch (e) {
      setActionNotice("Failed to dispatch Email.");
    }
  };

  const handleOverrideStatus = async (newEntry?: string, newGift?: string) => {
    if (!selectedReg) return;
    setActionNotice("Updating delegate status...");
    try {
      const res = await fetch(`${API_URL}/gmb/admin/override-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          registration_id: selectedReg.id,
          entry_status: newEntry,
          gift_status: newGift,
          remark: 'Admin panel manual status edit'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update');
      setActionNotice(data.message || 'Status updated successfully!');
      openDetailModal(selectedReg.id);
      fetchRegistrations();
    } catch (err: any) {
      setActionNotice(err.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-serif tracking-wide">
            Delegate Registrations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {total} confirmed attendees across Siri Samruddhi Gold Palace branches
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition-all self-end md:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, EMP ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
        </form>

        {/* Branch Filter */}
        <div>
          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Branches</option>
            <option value="branch_yelahanka">Yelahanka</option>
            <option value="branch_kolar">Kolar</option>
            <option value="branch_udupi">Udupi</option>
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Genders</option>
            <option value="male">Male (Watch Set)</option>
            <option value="female">Female (Silk Saree)</option>
          </select>
        </div>

        {/* Entry Status Filter */}
        <div>
          <select
            value={entryFilter}
            onChange={(e) => { setEntryFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Entry Status</option>
            <option value="ENTERED">Entered</option>
            <option value="NOT_ENTERED">Not Entered</option>
          </select>
        </div>

        {/* Gift Status Filter */}
        <div>
          <select
            value={giftFilter}
            onChange={(e) => { setGiftFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Gift Status</option>
            <option value="CLAIMED">Claimed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Delegate</th>
                <th className="px-4 py-3.5">Emp ID</th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-4 py-3.5">Mobile</th>
                <th className="px-4 py-3.5">Aadhaar</th>
                <th className="px-4 py-3.5 text-center">Gate Entry</th>
                <th className="px-4 py-3.5 text-center">Gift Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading attendees...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No registrations found matching your criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Delegate Name & Photo */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-950 border border-amber-500/30 overflow-hidden shrink-0">
                          {item.photo_url ? (
                            <img
                              src={`${API_URL}/gmb/photos/${item.photo_url}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={16} className="m-auto text-slate-600 mt-2" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.designation} • <span className="capitalize">{item.gender}</span></p>
                        </div>
                      </div>
                    </td>

                    {/* Emp ID */}
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                      {item.employee_id}
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      {item.branch_name}
                    </td>

                    {/* Mobile */}
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      +91 {item.mobile}
                    </td>

                    {/* Aadhaar (Masked) */}
                    <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                      {item.masked_aadhaar}
                    </td>

                    {/* Entry Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        item.entry_status === 'ENTERED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}>
                        {item.entry_status === 'ENTERED' ? '✓ Entered' : 'Not Entered'}
                      </span>
                    </td>

                    {/* Gift Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        item.gift_status === 'CLAIMED'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}>
                        {item.gift_status === 'CLAIMED' ? '✓ Claimed' : 'Pending'}
                      </span>
                    </td>

                    {/* Actions: View Details, Edit Participant, Delete Participant, Download PDF */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailModal(item.id)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Participant"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => setDeletingParticipant(item)}
                          title="Delete Participant"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>

                        <a
                          href={`${API_URL}/gmb/pass/${item.qr_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download PDF Pass"
                          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ATTENDEE DETAIL MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-14 h-16 rounded-2xl bg-slate-950 border border-amber-400 overflow-hidden shadow-md shrink-0">
                  {selectedReg.photo_url ? (
                    <img
                      src={`${API_URL}/gmb/photos/${selectedReg.photo_url}`}
                      alt={selectedReg.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="m-auto text-slate-600 mt-3" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-serif">{selectedReg.name}</h3>
                  <p className="text-xs text-amber-400 font-mono font-semibold">ID: {selectedReg.employee_id}</p>
                  <p className="text-xs text-slate-400">{selectedReg.designation} • {selectedReg.branch_name} Branch</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedReg)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  onClick={() => setDeletingParticipant(selectedReg)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 size={13} /> Delete
                </button>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Action Notice */}
            {actionNotice && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-medium">
                {actionNotice}
              </div>
            )}

            {/* Detail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Mobile Number</span>
                <span className="text-slate-200 font-mono font-semibold">+91 {selectedReg.mobile}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Aadhaar Number</span>
                <span className="text-slate-200 font-mono font-semibold">{selectedReg.aadhaar_masked}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                <span className="text-slate-200 truncate block">{selectedReg.email || 'None'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Gate Status</span>
                <span className={`font-semibold ${selectedReg.entry_status === 'ENTERED' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {selectedReg.entry_status === 'ENTERED' ? '✓ Checked In' : 'Not Entered'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Gift Status</span>
                <span className={`font-semibold ${selectedReg.gift_status === 'CLAIMED' ? 'text-amber-400' : 'text-slate-400'}`}>
                  {selectedReg.gift_status === 'CLAIMED' ? '✓ Claimed' : 'Pending'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">QR Token</span>
                <span className="text-amber-400 font-mono font-bold truncate block">{selectedReg.qr_token}</span>
              </div>
            </div>

            {/* Manual Status Management Controls */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Shield size={14} /> Edit Entry & Gift Status
                </h4>
                <span className="text-[10px] text-slate-400">Authorized Admin Action</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Gate Entry Toggle */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Gate Check-in</span>
                    <span className={`text-xs font-bold ${selectedReg.entry_status === 'ENTERED' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {selectedReg.entry_status === 'ENTERED' ? '✓ Entered' : 'Not Entered'}
                    </span>
                  </div>
                  {selectedReg.entry_status === 'ENTERED' ? (
                    <button
                      onClick={() => handleOverrideStatus('NOT_ENTERED', undefined)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Set Not Entered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOverrideStatus('ENTERED', undefined)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      ✓ Mark Entered
                    </button>
                  )}
                </div>

                {/* Gift Claim Toggle */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Delegate Gift</span>
                    <span className={`text-xs font-bold ${selectedReg.gift_status === 'CLAIMED' ? 'text-amber-400' : 'text-slate-300'}`}>
                      {selectedReg.gift_status === 'CLAIMED' ? '✓ Claimed' : 'Pending'}
                    </span>
                  </div>
                  {selectedReg.gift_status === 'CLAIMED' ? (
                    <button
                      onClick={() => handleOverrideStatus(undefined, 'PENDING')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Set Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOverrideStatus(undefined, 'CLAIMED')}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-sm"
                    >
                      ✓ Mark Claimed
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Communications & Retry Actions */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Pass Dispatch & Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`${API_URL}/gmb/pass/${selectedReg.qr_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Download size={14} /> Download PDF Pass
                </a>

                <button
                  onClick={() => handleResendWhatsapp(selectedReg.id)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <MessageSquare size={14} /> Resend WhatsApp
                </button>

                {selectedReg.email && (
                  <button
                    onClick={() => handleResendEmail(selectedReg.id)}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Mail size={14} /> Resend Email
                  </button>
                )}
              </div>
            </div>

            {/* Scan History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Scan Audit History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedReg.scan_logs && selectedReg.scan_logs.length > 0 ? (
                  selectedReg.scan_logs.map((log: any) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-200">{log.action}</span>
                        <span className="text-slate-500 ml-2">by {log.staff_name || log.staff_id || 'System'}</span>
                        {log.reason && <p className="text-[10px] text-amber-400/80">{log.reason}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.result === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.result}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No scan logs recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* EDIT PARTICIPANT MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Participant Details</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {editingParticipant.employee_id} • {editingParticipant.name}</p>
                </div>
              </div>

              <button
                onClick={() => setEditingParticipant(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error / Success Notice */}
            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Designation / Role <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.designation}
                    onChange={(e) => setEditForm(f => ({ ...f, designation: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Employee ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.employee_id}
                    onChange={(e) => setEditForm(f => ({ ...f, employee_id: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mobile Number (10 Digits) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={editForm.mobile}
                      onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))}
                      className="w-full pl-12 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Showroom Branch <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editForm.branch_id}
                    onChange={(e) => setEditForm(f => ({ ...f, branch_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="branch_yelahanka">Yelahanka</option>
                    <option value="branch_kolar">Kolar</option>
                    <option value="branch_udupi">Udupi</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Gender (Gift Type) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(f => ({ ...f, gender: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="male">Male (Executive Watch Set)</option>
                    <option value="female">Female (Pure Silk Saree Box)</option>
                  </select>
                </div>

                {/* Gate Entry Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Gate Entry Status
                  </label>
                  <select
                    value={editForm.entry_status}
                    onChange={(e) => setEditForm(f => ({ ...f, entry_status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="NOT_ENTERED">Not Entered</option>
                    <option value="ENTERED">Entered (Checked In)</option>
                  </select>
                </div>

                {/* Gift Status */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Delegate Gift Status
                  </label>
                  <select
                    value={editForm.gift_status}
                    onChange={(e) => setEditForm(f => ({ ...f, gift_status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="PENDING">Pending (Not Claimed)</option>
                    <option value="CLAIMED">Claimed (Gift Distributed)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Participant Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* DELETE CONFIRMATION SAFETY MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {deletingParticipant && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Participant?</h3>
                <p className="text-xs text-rose-400">Permanent Action</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete attendee <strong className="text-white">{deletingParticipant.name}</strong> (Employee ID: <strong className="text-amber-400 font-mono">{deletingParticipant.employee_id}</strong>)?
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>• Removes registration from all branch attendee lists.</p>
              <p>• Revokes the delegate QR pass ({deletingParticipant.qr_token || 'EVT-Pass'}).</p>
              <p>• Clears related gate and gift scan logs.</p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingParticipant(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Yes, Delete Participant</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
