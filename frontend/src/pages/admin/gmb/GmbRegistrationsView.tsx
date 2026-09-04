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
    <div className="space-y-6 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            Delegate Registrations
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Total {total} confirmed attendees across Siri Samruddhi Gold Palace branches
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-sm self-end md:self-auto active:scale-95"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, EMP ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        {/* Branch Filter */}
        <div>
          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2.5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer"
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
            className="w-full px-3 py-2.5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer"
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
            className="w-full px-3 py-2.5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer"
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
            className="w-full px-3 py-2.5 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer"
          >
            <option value="">All Gift Status</option>
            <option value="CLAIMED">Claimed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Registrations Table Container */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#F8FAFC] text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-4">Delegate</th>
                <th className="px-4 py-4">Emp ID</th>
                <th className="px-4 py-4">Branch</th>
                <th className="px-4 py-4">Mobile</th>
                <th className="px-4 py-4">Aadhaar</th>
                <th className="px-4 py-4 text-center">Gate Entry</th>
                <th className="px-4 py-4 text-center">Gift Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="font-medium text-xs">Loading attendee records...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">No registrations found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* Delegate Name & Photo */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-purple-200 overflow-hidden shrink-0 shadow-sm">
                          {item.photo_url ? (
                            <img
                              src={`${API_URL}/gmb/photos/${item.photo_url}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={18} className="m-auto text-slate-400 mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{item.designation} • <span className="capitalize text-purple-700 font-semibold">{item.gender}</span></p>
                        </div>
                      </div>
                    </td>

                    {/* Emp ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-purple-800 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-lg text-xs">
                        {item.employee_id}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {item.branch_name}
                    </td>

                    {/* Mobile */}
                    <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                      +91 {item.mobile}
                    </td>

                    {/* Aadhaar (Masked) */}
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-xs">
                      {item.masked_aadhaar}
                    </td>

                    {/* Entry Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.entry_status === 'ENTERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.entry_status === 'ENTERED' ? '✓ Entered' : 'Not Entered'}
                      </span>
                    </td>

                    {/* Gift Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.gift_status === 'CLAIMED'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-xs'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                          className="p-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 border border-slate-200 transition-all shadow-xs"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Participant"
                          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all shadow-xs"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => setDeletingParticipant(item)}
                          title="Delete Participant"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shadow-xs"
                        >
                          <Trash2 size={14} />
                        </button>

                        <a
                          href={`${API_URL}/gmb/pass/${item.qr_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download PDF Pass"
                          className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all shadow-xs"
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
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>
            Showing Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({total} total delegates)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ATTENDEE DETAIL MODAL (LIGHT THEME) */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-6 text-slate-900">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 overflow-hidden shadow-sm shrink-0">
                  {selectedReg.photo_url ? (
                    <img
                      src={`${API_URL}/gmb/photos/${selectedReg.photo_url}`}
                      alt={selectedReg.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="m-auto text-purple-300 mt-3" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-display">{selectedReg.name}</h3>
                  <p className="text-xs text-purple-700 font-mono font-bold">ID: {selectedReg.employee_id}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedReg.designation} • {selectedReg.branch_name} Branch</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedReg)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  onClick={() => setDeletingParticipant(selectedReg)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Trash2 size={13} /> Delete
                </button>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Action Notice */}
            {actionNotice && (
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs text-center font-bold animate-fadeIn">
                {actionNotice}
              </div>
            )}

            {/* Detail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Mobile Number</span>
                <span className="text-slate-900 font-mono font-bold mt-0.5 block">+91 {selectedReg.mobile}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Aadhaar Number</span>
                <span className="text-slate-900 font-mono font-bold mt-0.5 block">{selectedReg.aadhaar_masked}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Email</span>
                <span className="text-slate-900 font-medium truncate block mt-0.5">{selectedReg.email || 'None'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Gate Status</span>
                <span className={`font-bold mt-0.5 block ${selectedReg.entry_status === 'ENTERED' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {selectedReg.entry_status === 'ENTERED' ? '✓ Checked In' : 'Not Entered'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Gift Status</span>
                <span className={`font-bold mt-0.5 block ${selectedReg.gift_status === 'CLAIMED' ? 'text-purple-800' : 'text-slate-500'}`}>
                  {selectedReg.gift_status === 'CLAIMED' ? '✓ Claimed' : 'Pending'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">QR Token</span>
                <span className="text-purple-900 font-mono font-bold truncate block mt-0.5">{selectedReg.qr_token}</span>
              </div>
            </div>

            {/* Manual Status Management Controls */}
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                  <Shield size={14} className="text-purple-700" /> Quick Status Controls
                </h4>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Authorized Admin</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Gate Entry Toggle */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200 flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Gate Check-in</span>
                    <span className={`text-xs font-bold ${selectedReg.entry_status === 'ENTERED' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {selectedReg.entry_status === 'ENTERED' ? '✓ Entered' : 'Not Entered'}
                    </span>
                  </div>
                  {selectedReg.entry_status === 'ENTERED' ? (
                    <button
                      onClick={() => handleOverrideStatus('NOT_ENTERED', undefined)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Set Not Entered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOverrideStatus('ENTERED', undefined)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      ✓ Mark Entered
                    </button>
                  )}
                </div>

                {/* Gift Claim Toggle */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200 flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Delegate Gift</span>
                    <span className={`text-xs font-bold ${selectedReg.gift_status === 'CLAIMED' ? 'text-purple-800' : 'text-slate-600'}`}>
                      {selectedReg.gift_status === 'CLAIMED' ? '✓ Claimed' : 'Pending'}
                    </span>
                  </div>
                  {selectedReg.gift_status === 'CLAIMED' ? (
                    <button
                      onClick={() => handleOverrideStatus(undefined, 'PENDING')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Set Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOverrideStatus(undefined, 'CLAIMED')}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      ✓ Mark Claimed
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Communications & Retry Actions */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pass Dispatch & Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`${API_URL}/gmb/pass/${selectedReg.qr_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-purple-600/20"
                >
                  <Download size={14} /> Download PDF Pass
                </a>

                <button
                  onClick={() => handleResendWhatsapp(selectedReg.id)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare size={14} /> Resend WhatsApp
                </button>

                {selectedReg.email && (
                  <button
                    onClick={() => handleResendEmail(selectedReg.id)}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Mail size={14} /> Resend Email
                  </button>
                )}
              </div>
            </div>

            {/* Scan History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Scan Audit History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedReg.scan_logs && selectedReg.scan_logs.length > 0 ? (
                  selectedReg.scan_logs.map((log: any) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-[11px] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-slate-500 ml-2">by {log.staff_name || log.staff_id || 'System'}</span>
                        {log.reason && <p className="text-[10px] text-purple-700 font-medium">{log.reason}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.result}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No scan logs recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* EDIT PARTICIPANT MODAL (LIGHT THEME) */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-5 text-slate-900">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Edit Participant Details</h3>
                  <p className="text-xs text-purple-700 font-mono font-bold">ID: {editingParticipant.employee_id} • {editingParticipant.name}</p>
                </div>
              </div>

              <button
                onClick={() => setEditingParticipant(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error / Success Notice */}
            {editError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                <span>{editSuccess}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Designation / Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.designation}
                    onChange={(e) => setEditForm(f => ({ ...f, designation: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.employee_id}
                    onChange={(e) => setEditForm(f => ({ ...f, employee_id: e.target.value.toUpperCase() }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-purple-800 font-mono font-bold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-purple-700 font-bold">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={editForm.mobile}
                      onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))}
                      className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-mono font-bold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Showroom Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.branch_id}
                    onChange={(e) => setEditForm(f => ({ ...f, branch_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                  >
                    <option value="branch_yelahanka">Yelahanka</option>
                    <option value="branch_kolar">Kolar</option>
                    <option value="branch_udupi">Udupi</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gender (Gift Type) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(f => ({ ...f, gender: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                  >
                    <option value="male">Male (Executive Watch Set)</option>
                    <option value="female">Female (Pure Silk Saree Box)</option>
                  </select>
                </div>

                {/* Gate Entry Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gate Entry Status
                  </label>
                  <select
                    value={editForm.entry_status}
                    onChange={(e) => setEditForm(f => ({ ...f, entry_status: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                  >
                    <option value="NOT_ENTERED">Not Entered</option>
                    <option value="ENTERED">Entered (Checked In)</option>
                  </select>
                </div>

                {/* Gift Status */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Delegate Gift Status
                  </label>
                  <select
                    value={editForm.gift_status}
                    onChange={(e) => setEditForm(f => ({ ...f, gift_status: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 cursor-pointer"
                  >
                    <option value="PENDING">Pending (Not Claimed)</option>
                    <option value="CLAIMED">Claimed (Gift Distributed)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {editLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
      {/* DELETE CONFIRMATION SAFETY MODAL (LIGHT THEME) */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {deletingParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Participant?</h3>
                <p className="text-xs text-rose-600 font-medium">Permanent Action</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete attendee <strong className="text-slate-900">{deletingParticipant.name}</strong> (Employee ID: <strong className="text-purple-800 font-mono font-bold">{deletingParticipant.employee_id}</strong>)?
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p>• Removes registration from all branch attendee lists.</p>
              <p>• Revokes the delegate QR pass ({deletingParticipant.qr_token || 'EVT-Pass'}).</p>
              <p>• Clears related gate and gift scan logs.</p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingParticipant(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50 transition-all"
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
