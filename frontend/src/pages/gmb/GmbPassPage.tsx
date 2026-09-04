import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, CheckCircle2, Shield, QrCode, ArrowLeft, Building, 
  User, Gift, Clock, AlertTriangle, Edit3, X, Lock, Check, Sparkles,
  Eye, LogOut, Key, ChevronDown, ChevronUp, UserCheck
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

  // Staff Authentication & Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffAuthenticated, setStaffAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('gbm_staff_token') || !!localStorage.getItem('gmb_staff_token');
  });
  const [staffProfile, setStaffProfile] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem('gbm_staff_profile') || localStorage.getItem('gmb_staff_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Edit fields state
  const [editEntryStatus, setEditEntryStatus] = useState<'NOT_ENTERED' | 'ENTERED'>('NOT_ENTERED');
  const [editGiftStatus, setEditGiftStatus] = useState<'PENDING' | 'CLAIMED'>('PENDING');
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
  const [editRemark, setEditRemark] = useState('');
  const [showDetailFields, setShowDetailFields] = useState(false);

  const [savingStatus, setSavingStatus] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        setEditEntryStatus(data.entry_status || 'NOT_ENTERED');
        setEditGiftStatus(data.gift_status || 'PENDING');
        setEditName(data.name || '');
        setEditDesignation(data.designation || '');
        setEditEmployeeId(data.employee_id || '');
        setEditGender(data.gender || 'male');
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

  // Handle staff login verification
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!staffUsername.trim() || !staffPassword.trim()) {
      setLoginError('Staff username and password are required');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch(`${API_URL}/gmb/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: staffUsername.trim(),
          password: staffPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid staff credentials. Access denied.');
      }

      // Save token and profile
      localStorage.setItem('gbm_staff_token', data.access_token);
      localStorage.setItem('gbm_staff_profile', JSON.stringify(data));
      setStaffAuthenticated(true);
      setStaffProfile(data);
      setLoginError(null);
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStaffLogout = () => {
    localStorage.removeItem('gbm_staff_token');
    localStorage.removeItem('gbm_staff_profile');
    localStorage.removeItem('gmb_staff_token');
    localStorage.removeItem('gmb_staff_profile');
    setStaffAuthenticated(false);
    setStaffProfile(null);
    setStaffUsername('');
    setStaffPassword('');
  };

  // Handle saving status and delegate edits
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingStatus(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const storedToken = localStorage.getItem('gbm_staff_token') || localStorage.getItem('gmb_staff_token');

      const payload: any = {
        entry_status: editEntryStatus,
        gift_status: editGiftStatus,
        name: editName.trim() || passData.name,
        designation: editDesignation.trim() || passData.designation,
        employee_id: editEmployeeId.trim().toUpperCase() || passData.employee_id,
        gender: editGender,
        remark: editRemark.trim() || 'Status updated via scanned pass modal'
      };

      // Add auth credentials and headers
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      if (staffUsername && staffPassword) {
        payload.username = staffUsername.trim();
        payload.password = staffPassword.trim();
      }

      const res = await fetch(`${API_URL}/gmb/pass/${token}/edit-status`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update pass status. Please verify staff permissions.');
      }

      setSaveSuccess(`Status successfully updated by ${data.updated_by || 'Staff'}!`);
      
      // Update pass state immediately
      setPassData((prev: any) => ({
        ...prev,
        entry_status: editEntryStatus,
        gift_status: editGiftStatus,
        name: editName.trim() || prev.name,
        designation: editDesignation.trim() || prev.designation,
        employee_id: editEmployeeId.trim().toUpperCase() || prev.employee_id,
        gender: editGender
      }));

      setTimeout(() => {
        setIsStaffModalOpen(false);
        setSaveSuccess(null);
      }, 1500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setSavingStatus(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!passData) return;
    setDownloadingPdf(true);
    try {
      const url = `${API_URL}/gbm/pass/${passData.qr_token}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to download PDF from server');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GBM_Pass_${passData.employee_id || 'Delegate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
      console.error('Download error:', err);
      window.open(`${API_URL}/gbm/pass/${passData.qr_token}`, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center text-purple-700 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading official event pass...</p>
        </div>
      </div>
    );
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">Invalid Event Pass</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">{error || 'This QR pass does not exist or has expired.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all"
        >
          Return to Delegate Portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      <main className="relative z-10 w-full max-w-sm">
        
        {/* Pass Container Card */}
        <div className="bg-white border-2 border-purple-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
          
          {/* Header (Clean GBM Event Header without store logo) */}
          <div className="text-center pb-4 border-b border-purple-100">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-100/80 border border-purple-300/80 text-[11px] font-bold uppercase tracking-wider text-purple-900 shadow-sm">
              <Sparkles size={13} className="text-purple-600" />
              <span>GBM ANNUAL EVENT 2026</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Official Delegate Entry & Gift Pass</p>
          </div>

          {/* Attendee Info */}
          <div className="py-5 flex items-center gap-4">
            <div className="w-20 h-24 rounded-2xl bg-purple-50 border-2 border-purple-300 overflow-hidden shadow-sm shrink-0">
              {passData.photo_url ? (
                <img
                  src={`${API_URL}/gmb/photos/${passData.photo_url}`}
                  alt={passData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-300 font-bold text-xs">
                  PHOTO
                </div>
              )}
            </div>

            <div className="space-y-1 text-left min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate font-display">
                {passData.name}
              </h2>
              <p className="text-xs text-slate-600 truncate font-medium">{passData.designation}</p>
              <p className="text-xs font-mono font-bold text-purple-800">ID: {passData.employee_id}</p>
              <p className="text-[11px] text-slate-700 font-semibold">{passData.branch_name} Branch</p>
              <p className="text-[10px] text-slate-500">Aadhaar: {passData.masked_aadhaar}</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-[#FAF5FF] border border-purple-200/80 rounded-2xl p-5 text-center my-2 space-y-3">
            <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-purple-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/gbm/pass/' + passData.qr_token)}`}
                alt="Entry QR"
                className="w-36 h-36 mx-auto"
              />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-purple-950 tracking-wider">
                {passData.qr_token}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Present at Gate Entry & Gift Counter</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="grid grid-cols-2 gap-2.5 my-4 text-center">
            <div className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
              passData.entry_status === 'ENTERED'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Gate Entry</span>
              <span>{passData.entry_status === 'ENTERED' ? '✓ Checked In' : 'Not Entered'}</span>
            </div>

            <div className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
              passData.gift_status === 'CLAIMED'
                ? 'bg-purple-50 border-purple-300 text-purple-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">Delegate Gift</span>
              <span>{passData.gift_status === 'CLAIMED' ? '✓ Received' : 'Pending'}</span>
            </div>
          </div>

          {/* Action Buttons: Clean Public Pass View */}
          <div className="space-y-2.5 mt-5">
            {/* Download PDF Pass (Direct Blob Download) */}
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75"
            >
              {downloadingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing PDF Download...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download Printable PDF Pass</span>
                </>
              )}
            </button>

            {/* Staff Verification / Quick Edit Button */}
            {staffAuthenticated ? (
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSaveError(null);
                    setSaveSuccess(null);
                    setLoginError(null);
                    setIsStaffModalOpen(true);
                  }}
                  className="w-full py-3 px-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 text-purple-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Shield size={14} className="text-purple-700" />
                  <span>✓ Verified Staff: Edit Entry & Gift Status</span>
                </button>
                <div className="flex items-center justify-between px-2 text-[10px] text-slate-500">
                  <span className="truncate">Staff: {staffProfile?.full_name || staffProfile?.username || 'Staff'} ({staffProfile?.role || 'Admin'})</span>
                  <button 
                    type="button"
                    onClick={handleStaffLogout} 
                    className="text-rose-600 hover:underline shrink-0"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSaveError(null);
                  setSaveSuccess(null);
                  setLoginError(null);
                  setIsStaffModalOpen(true);
                }}
                className="w-full py-3 px-4 bg-[#F8FAFC] hover:bg-purple-50 border border-slate-300 hover:border-purple-300 text-slate-700 hover:text-purple-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Lock size={14} className="text-purple-700" />
                <span>Staff Access: Edit Status & Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
            >
              Back to Registration
            </button>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECURE STAFF AUTHENTICATION & EDIT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-purple-200 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl text-slate-900 relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">Staff & Counter Operations</h3>
                  <p className="text-xs text-slate-500">{passData.name} ({passData.employee_id})</p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Success / Error Banners */}
            {saveSuccess && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            {/* ── Condition 1: Staff Not Logged In -> Show Staff Login Prompt ── */}
            {!staffAuthenticated ? (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-left">
                  <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Key size={14} className="text-purple-700" /> Authorized Staff Authentication
                  </p>
                  <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
                    Staff authentication is required to modify attendee gate check-in, gift distribution, and delegate details.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleStaffLogin} className="space-y-3.5 text-xs text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Staff / Manager Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        value={staffUsername}
                        onChange={(e) => setStaffUsername(e.target.value)}
                        placeholder="Enter staff username"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Staff Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={15} />
                      </div>
                      <input
                        type="password"
                        required
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsStaffModalOpen(false)}
                      className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loginLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Key size={14} />
                          <span>Verify & Unlock</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ── Condition 2: Staff Authenticated -> Show Authorized Edit Panel ── */
              <form onSubmit={handleSaveStatus} className="mt-4 space-y-4 text-xs text-left animate-fadeIn">
                
                {/* Authenticated Staff Badge */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950 text-xs">
                        {staffProfile?.full_name || staffProfile?.username || 'Authorized Staff'}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-mono">
                        Role: {staffProfile?.role || 'EVENT_STAFF'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStaffLogout}
                    title="Lock / Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                  >
                    <LogOut size={15} />
                  </button>
                </div>

                {/* 1. Gate Entry Status Switch */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    1. Gate Entry Check-in Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditEntryStatus('NOT_ENTERED')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        editEntryStatus === 'NOT_ENTERED'
                          ? 'bg-[#334155] text-white border-[#334155] shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Not Entered
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditEntryStatus('ENTERED')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        editEntryStatus === 'ENTERED'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Gate Checked In
                    </button>
                  </div>
                </div>

                {/* 2. Gift Distribution Status Switch */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    2. Delegate Gift Distribution
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditGiftStatus('PENDING')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        editGiftStatus === 'PENDING'
                          ? 'bg-[#334155] text-white border-[#334155] shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Pending (Not Given)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGiftStatus('CLAIMED')}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold transition-all ${
                        editGiftStatus === 'CLAIMED'
                          ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Gift Claimed
                    </button>
                  </div>
                </div>

                {/* 3. Expandable Delegate Details Edit */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDetailFields(!showDetailFields)}
                    className="w-full flex items-center justify-between text-xs font-bold text-purple-900 py-1"
                  >
                    <span>Edit Delegate Info (Name, ID, Gender)</span>
                    {showDetailFields ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {showDetailFields && (
                    <div className="space-y-3 pt-2 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Designation</label>
                          <input
                            type="text"
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Employee ID</label>
                          <input
                            type="text"
                            value={editEmployeeId}
                            onChange={(e) => setEditEmployeeId(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditGender('male')}
                            className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                              editGender === 'male'
                                ? 'bg-[#526F91] border-[#526F91] text-white shadow-sm'
                                : 'bg-[#EDF2F8] border-[#C6D4E3] text-[#526F91] hover:border-[#526F91]'
                            }`}
                          >
                            Male
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditGender('female')}
                            className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                              editGender === 'female'
                                ? 'bg-[#7E22CE] border-[#7E22CE] text-white shadow-sm'
                                : 'bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE] hover:border-[#7E22CE]'
                            }`}
                          >
                            Female
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditGender('other')}
                            className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                              editGender === 'other'
                                ? 'bg-[#21845F] border-[#21845F] text-white shadow-sm'
                                : 'bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F] hover:border-[#21845F]'
                            }`}
                          >
                            Other
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Staff Remark */}
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Staff Remark / Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={editRemark}
                    onChange={(e) => setEditRemark(e.target.value)}
                    placeholder="e.g. VIP manual check-in, counter override"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingStatus}
                    className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingStatus ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Save Status & Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
