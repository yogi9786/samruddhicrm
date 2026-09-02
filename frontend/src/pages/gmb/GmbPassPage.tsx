import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, CheckCircle2, Shield, QrCode, ArrowLeft, Building, 
  User, Gift, Clock, AlertTriangle, Edit3, X, Lock, Check, Sparkles 
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { getApiBaseUrl } from '../../utils/api';

const API_URL = getApiBaseUrl();

export const GmbPassPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [passData, setPassData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Status Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffUsername, setStaffUsername] = useState(() => localStorage.getItem('staff_edit_user') || 'staff');
  const [staffPassword, setStaffPassword] = useState(() => localStorage.getItem('staff_edit_pass') || '');
  const [newEntryStatus, setNewEntryStatus] = useState<'NOT_ENTERED' | 'ENTERED'>('ENTERED');
  const [newGiftStatus, setNewGiftStatus] = useState<'PENDING' | 'CLAIMED'>('CLAIMED');
  const [remark, setRemark] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const fetchPassData = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/gmb/pass-data/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Event pass not found or invalid token');
        return res.json();
      })
      .then(data => {
        setPassData(data);
        setNewEntryStatus(data.entry_status || 'NOT_ENTERED');
        setNewGiftStatus(data.gift_status || 'PENDING');
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Pass not found');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPassData();
  }, [token]);

  const handleOpenEditModal = () => {
    if (passData) {
      setNewEntryStatus(passData.entry_status || 'NOT_ENTERED');
      setNewGiftStatus(passData.gift_status || 'PENDING');
    }
    setModalError(null);
    setModalSuccess(null);
    setIsEditModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!staffUsername.trim() || !staffPassword.trim()) {
      setModalError("Staff username and password from .env are required");
      return;
    }

    setSavingStatus(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const payload = {
        username: staffUsername.trim(),
        password: staffPassword.trim(),
        entry_status: newEntryStatus,
        gift_status: newGiftStatus,
        remark: remark.trim() || 'Manual staff status update via pass view'
      };

      const res = await fetch(`${API_URL}/gmb/pass/${token}/edit-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update status. Please verify staff credentials.');
      }

      // Save credentials locally for convenience in this session
      localStorage.setItem('staff_edit_user', staffUsername.trim());
      localStorage.setItem('staff_edit_pass', staffPassword.trim());

      setModalSuccess(`Status updated successfully by ${data.updated_by || 'Staff'}!`);
      
      // Update pass state immediately
      setPassData((prev: any) => ({
        ...prev,
        entry_status: newEntryStatus,
        gift_status: newGiftStatus
      }));

      setTimeout(() => {
        setIsEditModalOpen(false);
        setModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-amber-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Loading official event pass...</p>
        </div>
      </div>
    );
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Event Pass</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">{error || 'This QR pass does not exist or has expired.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
        >
          Return to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/50 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <main className="relative z-10 w-full max-w-sm">
        {/* Pass Card */}
        <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="text-center pb-5 border-b border-amber-200/80">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <img src={logo} alt="Logo" className="h-8 w-8 rounded-full object-contain border border-amber-400 shadow-sm" />
              <h1 className="text-sm font-bold text-slate-900 tracking-wide font-serif">SIRISAMRUDDHI</h1>
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-amber-800">
              GBM ANNUAL EVENT 2026
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">Official Delegate Entry & Gift Pass</p>
          </div>

          {/* Attendee Info */}
          <div className="py-5 flex items-center gap-4">
            <div className="w-20 h-24 rounded-2xl bg-amber-50 border-2 border-amber-400 overflow-hidden shadow-md shrink-0">
              {passData.photo_url ? (
                <img
                  src={`${API_URL}/gmb/photos/${passData.photo_url}`}
                  alt={passData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                  PHOTO
                </div>
              )}
            </div>

            <div className="space-y-1 text-left min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate font-serif">
                {passData.name}
              </h2>
              <p className="text-xs text-slate-600 truncate">{passData.designation}</p>
              <p className="text-xs font-mono font-bold text-amber-800">ID: {passData.employee_id}</p>
              <p className="text-[11px] text-slate-700 font-semibold">{passData.branch_name} Branch</p>
              <p className="text-[10px] text-slate-500">Aadhaar: {passData.masked_aadhaar}</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 text-center my-2 space-y-3">
            <div className="bg-white p-3 rounded-xl inline-block shadow-md border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/gbm/pass/' + passData.qr_token)}`}
                alt="Entry QR"
                className="w-36 h-36 mx-auto"
              />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-amber-900 tracking-wider">
                {passData.qr_token}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Present at Gate Entry & Gift Counter</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="grid grid-cols-2 gap-2 my-4 text-center">
            <div className={`p-2.5 rounded-xl border text-xs font-semibold ${
              passData.entry_status === 'ENTERED'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="block text-[9px] uppercase font-normal text-slate-500">Gate Entry</span>
              <span>{passData.entry_status === 'ENTERED' ? '✓ Checked In' : 'Not Entered'}</span>
            </div>

            <div className={`p-2.5 rounded-xl border text-xs font-semibold ${
              passData.gift_status === 'CLAIMED'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="block text-[9px] uppercase font-normal text-slate-500">Delegate Gift</span>
              <span>{passData.gift_status === 'CLAIMED' ? '✓ Received' : 'Pending'}</span>
            </div>
          </div>

          {/* Action Buttons: Edit Status & Download PDF */}
          <div className="space-y-2.5 mt-5">
            {/* Edit Status Button */}
            <button
              onClick={handleOpenEditModal}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Edit3 size={15} />
              <span>Staff Login: Edit Status</span>
            </button>

            {/* Download PDF Pass */}
            <a
              href={`${API_URL}/gmb/pass/${passData.qr_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
            >
              <Download size={15} />
              <span>Download Printable PDF Pass</span>
            </a>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2 text-[11px] text-slate-500 hover:text-slate-900 transition-colors"
            >
              Back to Registration
            </button>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STAFF EDIT STATUS MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-amber-300 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-900 relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">Staff: Edit Delegate Status</h3>
                  <p className="text-[11px] text-slate-500">{passData.name} ({passData.employee_id})</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error / Success Banners */}
            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveStatus} className="mt-4 space-y-4 text-xs">
              {/* Staff Authentication (From .env) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Lock size={13} /> Staff Credentials (.env)
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">staff / siriadmin</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder="staff"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status Selectors */}
              <div className="space-y-3 pt-1">
                {/* 1. Gate Entry Status */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    1. Gate Entry Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewEntryStatus('NOT_ENTERED')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        newEntryStatus === 'NOT_ENTERED'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Not Entered
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEntryStatus('ENTERED')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        newEntryStatus === 'ENTERED'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Checked In (Entered)
                    </button>
                  </div>
                </div>

                {/* 2. Gift Status */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    2. Gift Distribution Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewGiftStatus('PENDING')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        newGiftStatus === 'PENDING'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Pending (Not Given)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGiftStatus('CLAIMED')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        newGiftStatus === 'CLAIMED'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Gift Claimed
                    </button>
                  </div>
                </div>

                {/* Remarks / Reason */}
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Staff Remark / Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="e.g. VIP override, scanner sync issue"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingStatus ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Status Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
