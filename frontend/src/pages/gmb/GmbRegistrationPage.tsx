import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Sparkles, CheckCircle2, AlertCircle, Camera, Upload, RefreshCw, 
  Download, ArrowRight, Shield, User, Building, Phone, Mail, 
  CreditCard, Briefcase, Eye, ChevronRight, Check, X
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { getApiBaseUrl } from '../../utils/api';

const API_URL = getApiBaseUrl();

interface Branch {
  id: string;
  company_id: string;
  name: string;
  code: string;
  city: string;
}

export const GmbRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  // Branch data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('branch_yelahanka');
  const [selectedCompany] = useState<string>('comp_ssgp');

  // Form Fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  // Photo & Camera State
  const [photoFilename, setPhotoFilename] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<any | null>(null);

  // Load branches
  useEffect(() => {
    fetch(`${API_URL}/gmb/branches`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data);
          setSelectedBranch(data[0].id);
        }
      })
      .catch(() => {
        setBranches([
          { id: 'branch_yelahanka', company_id: 'comp_ssgp', name: 'Yelahanka', code: 'YEL', city: 'Bengaluru' },
          { id: 'branch_kolar', company_id: 'comp_ssgp', name: 'Kolar', code: 'KOL', city: 'Kolar' },
          { id: 'branch_udupi', company_id: 'comp_ssgp', name: 'Udupi', code: 'UDU', city: 'Udupi' },
        ]);
      });
  }, []);

  // Clean camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Trigger confetti upon successful registration
  useEffect(() => {
    if (registrationResult) {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#D97706', '#F59E0B', '#FBBF24', '#10B981', '#6366F1']
      });
    }
  }, [registrationResult]);

  // Camera Management
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access failed or unavailable, fallback to file upload:", err);
      setCameraActive(false);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoPreview(dataUrl);

    // Convert to Blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadPhotoFile(blob, 'selfie_capture.jpg');
    }, 'image/jpeg', 0.88);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    uploadPhotoFile(file, file.name);
  };

  const uploadPhotoFile = async (fileBlob: Blob, originalName: string) => {
    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', fileBlob, originalName);
      const res = await fetch(`${API_URL}/gmb/upload-photo`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to upload photo');
      }
      const data = await res.json();
      setPhotoFilename(data.filename);
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Registration Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side Validations
    if (!name.trim()) {
      setErrorMsg("Full Name is mandatory");
      return;
    }
    if (!designation.trim()) {
      setErrorMsg("Designation is mandatory");
      return;
    }
    if (!employeeId.trim()) {
      setErrorMsg("Employee ID is mandatory");
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      setErrorMsg("Aadhaar Number must be exactly 12 numeric digits");
      return;
    }
    if (!photoFilename) {
      setErrorMsg("Please capture or upload your selfie/photo");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company_id: selectedCompany,
        branch_id: selectedBranch,
        event_id: 'evt_gbm2026',
        name: name.trim(),
        designation: designation.trim(),
        mobile: cleanMobile,
        otp_session_token: "", // OTP bypassed as requested
        email: email.trim() || undefined,
        aadhaar_number: cleanAadhaar,
        employee_id: employeeId.trim().toUpperCase(),
        gender: gender,
        photo_url: photoFilename
      };

      const res = await fetch(`${API_URL}/gmb/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Please check your details.');
      }
      setRegistrationResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS VIEW (LIGHT THEME)
  // ═══════════════════════════════════════════════════════════════════════════
  if (registrationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/50 text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-white border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif tracking-tight">
            Registration Confirmed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Thank you, <strong className="text-amber-800">{registrationResult.name}</strong>. Your official GBM Event delegate pass has been generated.
          </p>

          {/* Pass Details Card */}
          <div className="my-6 p-5 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border border-amber-200 rounded-2xl text-left space-y-3 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-amber-200/60">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Event Pass Token</p>
                <p className="text-sm font-mono font-bold text-amber-800">{registrationResult.qr_token}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                CONFIRMED ✓
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Branch:</span>
                <p className="text-slate-800 font-semibold">{registrationResult.branch_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Employee ID:</span>
                <p className="text-slate-800 font-semibold font-mono">{employeeId.toUpperCase()}</p>
              </div>
            </div>

            {/* Notification Delivery status */}
            <div className="pt-2 border-t border-amber-200/60 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-600" /> WhatsApp Pass Link:
                </span>
                <span className="text-emerald-700 font-medium">Dispatched ✓</span>
              </div>
              {email ? (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-blue-600" /> Email PDF Pass:
                  </span>
                  <span className="text-blue-700 font-medium">Sent to {email} ✓</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Email: Not provided</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={registrationResult.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Download size={18} />
              <span>Download Official Pass (PDF)</span>
            </a>

            <button
              onClick={() => navigate(`/gbm/pass/${registrationResult.qr_token}`)}
              className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Eye size={16} className="text-amber-700" />
              <span>View Mobile Pass on Screen</span>
            </button>

            <button
              onClick={() => {
                setRegistrationResult(null);
                setName('');
                setDesignation('');
                setEmployeeId('');
                setMobile('');
                setEmail('');
                setAadhaar('');
                setPhotoPreview(null);
                setPhotoFilename('');
              }}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Register Another Delegate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REGISTRATION FORM (PREMIUM LIGHT THEME)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-slate-50 to-orange-50/40 text-slate-800 flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Navbar */}
      <nav className="relative z-20 flex justify-between items-center px-4 sm:px-8 py-4 border-b border-amber-200/70 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src={logo} 
            alt="Siri Samruddhi Gold Palace" 
            className="h-10 w-10 rounded-full object-contain border border-amber-300 shadow-sm" 
          />
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-wide font-serif">
              SIRISAMRUDDHI
            </h1>
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-amber-700">
              Gold Palace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold">
            <Sparkles size={12} className="text-amber-600" />
            <span>GBM Event 2026</span>
          </div>

          <button
            onClick={() => navigate('/admin')}
            className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1 rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            Staff Login
          </button>
        </div>
      </nav>

      {/* Form Container */}
      <main className="relative z-10 flex-grow max-w-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white border border-amber-200/80 rounded-3xl p-5 sm:p-8 shadow-xl">
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider mb-2">
              Official Delegate Registration
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              GBM Annual Event 2026
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Enter your details to generate your official pass, QR code & delegate gift badge.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── 1. Company & Branch Selection ──────────────────────────────── */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Building size={14} />
                <span>1. Select Store Branch *</span>
              </label>

              {/* Company Info */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Siri Samruddhi Gold Palace</p>
                  <p className="text-[10px] text-slate-500">Official Retailer & Host</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-bold">
                  SSGP
                </span>
              </div>

              {/* Branch Selection Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b.id)}
                    className={`py-3 px-2 rounded-xl text-center border-2 transition-all text-xs font-bold flex flex-col items-center justify-center gap-0.5 ${
                      selectedBranch === b.id
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className="text-[9px] font-normal text-slate-500">{b.city}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 2. Delegate Personal Details ───────────────────────────────── */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <User size={14} />
                <span>2. Delegate Personal Information *</span>
              </label>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              {/* Designation & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Store Manager"
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    placeholder="e.g. EMP1025"
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-mono font-semibold focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Gender * (Determines Delegate Gift Package)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3 px-3 rounded-xl border-2 text-center transition-all text-xs font-bold flex flex-col items-center justify-center ${
                      gender === 'male'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>Male</span>
                    <span className="text-[10px] font-normal text-slate-500">Executive Watch Set</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3 px-3 rounded-xl border-2 text-center transition-all text-xs font-bold flex flex-col items-center justify-center ${
                      gender === 'female'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>Female</span>
                    <span className="text-[10px] font-normal text-slate-500">Pure Silk Saree Box</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── 3. Contact & Identification ───────────────────────────────── */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Phone size={14} />
                <span>3. Contact & Identification Details *</span>
              </label>

              {/* Mobile Number */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mobile Number (10 Digits) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-mono font-semibold focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Your event pass and check-in QR code will be delivered to this WhatsApp number.
                </p>
              </div>

              {/* Aadhaar Number */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Aadhaar Number (12 Digits) *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {aadhaar.replace(/\D/g, '').length}/12 digits
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={12}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234 5678 9012"
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-mono tracking-wider focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Shield size={11} className="text-amber-700" /> Securely stored & masked as XXXX XXXX 9012 for delegate privacy.
                </p>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address (Optional — to receive official PDF copy)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
            </div>

            {/* ── 4. Selfie / Photo ─────────────────────────────────────────── */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Camera size={14} />
                <span>4. Delegate Photo / Selfie *</span>
              </label>

              {/* Camera Active View */}
              {cameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-400 aspect-square max-w-[280px] mx-auto shadow-xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3 px-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
                    >
                      <Camera size={15} /> Capture Selfie
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2.5 bg-white text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                /* Photo Preview */
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative w-32 h-36 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-md bg-slate-100">
                    <img
                      src={photoPreview}
                      alt="Delegate Selfie"
                      className="w-full h-full object-cover"
                    />
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-bold text-amber-800">
                        Uploading...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1"
                    >
                      <Upload size={12} /> Upload Another
                    </button>
                  </div>
                </div>
              ) : (
                /* Capture / Upload Options */
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-5 rounded-2xl bg-amber-50/50 border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 transition-all flex flex-col items-center justify-center text-center gap-2 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Take Live Selfie</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Use camera</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-2xl bg-slate-50/60 border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all flex flex-col items-center justify-center text-center gap-2 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Upload Photo</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">From gallery</p>
                    </div>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* ── Submit Button ──────────────────────────────────────────────── */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !photoFilename || mobile.replace(/\D/g, '').length !== 10 || aadhaar.replace(/\D/g, '').length !== 12}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed text-base"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Generating Official Event Pass...
                  </span>
                ) : (
                  <>
                    <span>Complete Registration & Generate Pass</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500 border-t border-amber-200/60 bg-white/40">
        © {new Date().getFullYear()} Siri Samruddhi Gold Palace. All rights reserved.
      </footer>
    </div>
  );
};
