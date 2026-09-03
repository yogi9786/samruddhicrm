import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, AlertCircle, Camera, Upload, RefreshCw,
  Download, ArrowRight, Shield, User, Building, Phone, Mail,
  CreditCard, Briefcase, Eye, ChevronRight, Check, X, AlertTriangle,
  ChevronDown, Search, Ticket, Gift
} from 'lucide-react';
import { getApiBaseUrl } from '../../utils/api';

const API_URL = getApiBaseUrl();

export interface Branch {
  id: string;
  company_id: string;
  code: string;
  name: string;
}

export const DEFAULT_BRANCHES: Branch[] = [
  { id: 'branch_bc002', company_id: 'comp_ssgp', code: 'BC002', name: 'BELTHANGADY' },
  { id: 'branch_bc003', company_id: 'comp_ssgp', code: 'BC003', name: 'UDUPI' },
  { id: 'branch_bc004', company_id: 'comp_ssgp', code: 'BC004', name: 'KOLAR' },
  { id: 'branch_bc005', company_id: 'comp_ssgp', code: 'BC005', name: 'HO' },
  { id: 'branch_bc006', company_id: 'comp_ssgp', code: 'BC006', name: 'MYSORE' },
  { id: 'branch_bc007', company_id: 'comp_ssgp', code: 'BC007', name: 'SIRA' },
  { id: 'branch_bc008', company_id: 'comp_ssgp', code: 'BC008', name: 'HUBLI' },
  { id: 'branch_bc014', company_id: 'comp_ssgp', code: 'BC014', name: 'KANAKAPURA' },
  { id: 'branch_bc016', company_id: 'comp_ssgp', code: 'BC016', name: 'JP NAGAR' },
  { id: 'branch_bc017', company_id: 'comp_ssgp', code: 'BC017', name: 'SIRSI' },
  { id: 'branch_bc019', company_id: 'comp_ssgp', code: 'BC019', name: 'ANEKAL' },
  { id: 'branch_ka0001', company_id: 'comp_ssgp', code: 'KA0001', name: 'YELLAPUR' },
  { id: 'branch_ka0003', company_id: 'comp_ssgp', code: 'KA0003', name: 'PUTTUR' },
  { id: 'branch_ka0004', company_id: 'comp_ssgp', code: 'KA0004', name: 'BIJAPUR' },
  { id: 'branch_ka0005', company_id: 'comp_ssgp', code: 'KA0005', name: 'SIDDAPUR' },
  { id: 'branch_ka0006', company_id: 'comp_ssgp', code: 'KA0006', name: 'KARWAR' },
  { id: 'branch_ka0007', company_id: 'comp_ssgp', code: 'KA0007', name: 'GADAG' },
  { id: 'branch_ka0009', company_id: 'comp_ssgp', code: 'KA0009', name: 'KUMTA' },
  { id: 'branch_ka0010', company_id: 'comp_ssgp', code: 'KA0010', name: 'SHIMOGA' },
  { id: 'branch_ka0011', company_id: 'comp_ssgp', code: 'KA0011', name: 'MANGALORE' },
  { id: 'branch_ka0012', company_id: 'comp_ssgp', code: 'KA0012', name: 'HALIYAL' },
  { id: 'branch_ka0013', company_id: 'comp_ssgp', code: 'KA0013', name: 'RT NAGAR' },
  { id: 'branch_ka0014', company_id: 'comp_ssgp', code: 'KA0014', name: 'KR PURAM' },
  { id: 'branch_ka0015', company_id: 'comp_ssgp', code: 'KA0015', name: 'KUNDAPURA' },
  { id: 'branch_ka0016', company_id: 'comp_ssgp', code: 'KA0016', name: 'SAGARA' },
  { id: 'branch_ka0017', company_id: 'comp_ssgp', code: 'KA0017', name: 'CHITHRADURGA' },
  { id: 'branch_ka0018', company_id: 'comp_ssgp', code: 'KA0018', name: 'SARJAPURA' },
  { id: 'branch_ka0019', company_id: 'comp_ssgp', code: 'KA0019', name: 'BASAVESHWARANAGAR' },
  { id: 'branch_ka0020', company_id: 'comp_ssgp', code: 'KA0020', name: 'BHADRAVATHI' },
  { id: 'branch_ka0021', company_id: 'comp_ssgp', code: 'KA0021', name: 'MURUDESHWARA' },
  { id: 'branch_ka0022', company_id: 'comp_ssgp', code: 'KA0022', name: 'THIRTHAHALLI' },
  { id: 'branch_ka0023', company_id: 'comp_ssgp', code: 'KA0023', name: 'RAICHUR' },
  { id: 'branch_ka0024', company_id: 'comp_ssgp', code: 'KA0024', name: 'SULLIA' },
  { id: 'branch_ka0025', company_id: 'comp_ssgp', code: 'KA0025', name: 'LAKSHMESHWAR' },
  { id: 'branch_ka0026', company_id: 'comp_ssgp', code: 'KA0026', name: 'RANEBNNUR' },
  { id: 'branch_ka0027', company_id: 'comp_ssgp', code: 'KA0027', name: 'MALAVALLI' },
];

interface ValidationErrors {
  name?: string;
  designation?: string;
  employeeId?: string;
  mobile?: string;
  aadhaar?: string;
  email?: string;
  photo?: string;
}

export const GmbRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  // Branch data - preloaded with all 36 branches exactly from table
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<string>('branch_bc002');
  const [selectedCompany] = useState<string>('comp_ssgp');
  const [fetchingBranches, setFetchingBranches] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  // Field errors & touched states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Photo & Camera State
  const [photoFilename, setPhotoFilename] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form DOM refs for smooth scrolling to errors
  const nameRef = useRef<HTMLInputElement | null>(null);
  const desigRef = useRef<HTMLInputElement | null>(null);
  const empRef = useRef<HTMLInputElement | null>(null);
  const mobileRef = useRef<HTMLInputElement | null>(null);
  const aadhaarRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const photoSectionRef = useRef<HTMLDivElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<any | null>(null);

  // Load branches
  const loadBranches = () => {
    setFetchingBranches(true);
    fetch(`${API_URL}/gmb/branches`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data);
          if (!data.some((b: Branch) => b.id === selectedBranch)) {
            setSelectedBranch(data[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to complete default list of 36 branches
        setBranches(DEFAULT_BRANCHES);
      })
      .finally(() => setFetchingBranches(false));
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Clean camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Trigger celebration confetti upon successful registration (pure native zero-dependency)
  useEffect(() => {
    if (registrationResult) {
      try {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#F59E0B', '#7C3AED', '#EC4899', '#10B981', '#3B82F6', '#EF4444'];
        const particles: any[] = [];
        for (let i = 0; i < 90; i++) {
          particles.push({
            x: canvas.width * 0.5,
            y: canvas.height * 0.55,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.75) * 18,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            vr: (Math.random() - 0.5) * 10,
            opacity: 1
          });
        }

        let frames = 0;
        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.4;
            p.rotation += p.vr;
            p.opacity -= 0.012;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
          });
          frames++;
          if (frames < 90) {
            requestAnimationFrame(animate);
          } else {
            canvas.remove();
          }
        };
        animate();
      } catch (e) {
        // Safe fallback
      }
    }
  }, [registrationResult]);

  // Camera Management
  const startCamera = async () => {
    setApiError(null);
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

    // Clear photo error if present
    setErrors(prev => ({ ...prev, photo: undefined }));

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
    setErrors(prev => ({ ...prev, photo: undefined }));
    uploadPhotoFile(file, file.name);
  };

  const uploadPhotoFile = async (fileBlob: Blob, originalName: string) => {
    setUploadingPhoto(true);
    setApiError(null);
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
      setErrors(prev => ({ ...prev, photo: undefined }));
    } catch (err: any) {
      setApiError(err.message || 'Image upload failed. Please try again.');
      setErrors(prev => ({ ...prev, photo: 'Photo upload failed. Please try again.' }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Comprehensive Validation Function
  const validateForm = (): { isValid: boolean; newErrors: ValidationErrors } => {
    const newErrors: ValidationErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full Name is required (minimum 2 characters)';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full Name must be at least 2 characters';
    }

    if (!designation.trim()) {
      newErrors.designation = 'Designation is required (e.g. Sales Executive, Manager)';
    }

    if (!employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required (e.g. EMP1025)';
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      newErrors.mobile = 'Mobile number is required (10 digits)';
    } else if (cleanMobile.length !== 10) {
      newErrors.mobile = `Mobile number must be exactly 10 digits (currently ${cleanMobile.length} digits)`;
    }

    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (!cleanAadhaar) {
      newErrors.aadhaar = 'Aadhaar Number is required (12 digits)';
    } else if (cleanAadhaar.length !== 12) {
      newErrors.aadhaar = `Aadhaar Number must be exactly 12 digits (currently ${cleanAadhaar.length} digits)`;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!photoFilename && !photoPreview) {
      newErrors.photo = 'Delegate Selfie/Photo is required. Please take a selfie or upload a photo.';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      newErrors
    };
  };

  // Registration Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setApiError(null);

    const { isValid, newErrors } = validateForm();
    setErrors(newErrors);

    if (!isValid) {
      // Scroll to error summary or first invalid input
      if (newErrors.name && nameRef.current) {
        nameRef.current.focus();
        nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.designation && desigRef.current) {
        desigRef.current.focus();
        desigRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.employeeId && empRef.current) {
        empRef.current.focus();
        empRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.mobile && mobileRef.current) {
        mobileRef.current.focus();
        mobileRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.aadhaar && aadhaarRef.current) {
        aadhaarRef.current.focus();
        aadhaarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.email && emailRef.current) {
        emailRef.current.focus();
        emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.photo && photoSectionRef.current) {
        photoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errorSummaryRef.current) {
        errorSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const cleanAadhaar = aadhaar.replace(/\D/g, '');

      const payload = {
        company_id: selectedCompany,
        branch_id: selectedBranch,
        event_id: 'evt_gbm2026',
        name: name.trim(),
        designation: designation.trim(),
        mobile: cleanMobile,
        otp_session_token: "",
        email: email.trim() || undefined,
        aadhaar_number: cleanAadhaar,
        employee_id: employeeId.trim().toUpperCase(),
        gender: gender,
        photo_url: photoFilename || 'photo_default.jpg'
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
      setApiError(err.message || 'Registration failed. Please review your entries and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async (token: string, empId: string) => {
    setDownloadingPdf(true);
    try {
      const url = `${API_URL}/gbm/pass/${token}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to download PDF from server');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GBM_Pass_${empId || 'Delegate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
    } catch (err) {
      console.error('Download error:', err);
      // Direct open fallback if blob download fails
      window.open(`${API_URL}/gbm/pass/${token}`, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (registrationResult) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-purple-600 selection:text-white">
        {/* Background Decorative Ambient Glows matching Admin Layout */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-900/10 via-purple-600/5 to-transparent pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/5 text-center animate-fadeIn my-6">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-purple-50 border-2 border-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-700 shadow-lg shadow-purple-500/10">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Registration Confirmed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Thank you, <strong className="text-purple-700">{registrationResult.name}</strong>. Your official delegate pass has been generated.
          </p>

          {/* Pass Details Card */}
          <div className="my-6 p-5 bg-gradient-to-br from-purple-50/60 via-white to-slate-50 border border-purple-200/70 rounded-2xl text-left space-y-3 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-purple-100">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Event Pass Token</p>
                <p className="text-sm font-mono font-bold text-purple-900">{registrationResult.qr_token}</p>
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

            {/* Scannable QR Code Box (Matching User Request) */}
            <div className="py-3 px-2 rounded-2xl bg-[#FAF5FF] border border-purple-200/80 text-center my-2">
              <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-purple-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/gbm/pass/' + registrationResult.qr_token)}`}
                  alt="Delegate QR Token"
                  className="w-36 h-36 mx-auto"
                />
              </div>
              <p className="text-xs font-mono font-bold text-purple-950 mt-2 tracking-wider">
                {registrationResult.qr_token}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Scan or present this QR code at Gate Entry & Gift Counter
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={() => handleDownloadPdf(registrationResult.qr_token, employeeId)}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75"
            >
              {downloadingPdf ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing & Downloading Pass...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Official Pass (PDF)</span>
                </>
              )}
            </button>

            <button
              type="button"
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
                setErrors({});
                setAttemptedSubmit(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>← Back to Registration Form</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REGISTRATION FORM (ADMIN DESIGN SYSTEM • CLEAN & EXECUTIVE)
  // ═══════════════════════════════════════════════════════════════════════════
  const errorCount = Object.keys(errors).filter(k => (errors as any)[k]).length;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Background Decorative Ambient Glows matching Admin Layout */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-900/10 via-purple-600/5 to-transparent pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl my-6">
        
        {/* Main Card Container */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-purple-950/5">
          
          {/* Top Pill Badge matching Admin Portal */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/70 border border-purple-300/80 text-purple-800 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles size={14} className="text-purple-600" />
              <span>GBM EVENT 2026 REGISTRATION PORTAL</span>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              GBM Event Registration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your delegate credentials to generate your event pass
            </p>
          </div>

          {/* Validation Errors Summary Alert Banner */}
          {attemptedSubmit && errorCount > 0 && (
            <div ref={errorSummaryRef} className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 animate-fadeIn text-xs">
              <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-rose-800">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>Please fix {errorCount} required {errorCount === 1 ? 'field' : 'fields'}:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-rose-700 font-medium pl-1">
                {errors.name && <li>{errors.name}</li>}
                {errors.designation && <li>{errors.designation}</li>}
                {errors.employeeId && <li>{errors.employeeId}</li>}
                {errors.mobile && <li>{errors.mobile}</li>}
                {errors.aadhaar && <li>{errors.aadhaar}</li>}
                {errors.email && <li>{errors.email}</li>}
                {errors.photo && <li>{errors.photo}</li>}
              </ul>
            </div>
          )}

          {/* Backend API Error Banner */}
          {apiError && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="font-medium">{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* ── Step 1: Showroom Branch Selection ── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                  1
                </span>
                <span>Select Showroom Branch</span>
              </label>

              {/* Branch Dropdown Select */}
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

              {/* Selected Branch Info */}
              {(() => {
                const sel = DEFAULT_BRANCHES.find(b => b.id === selectedBranch) || DEFAULT_BRANCHES[0];
                if (!sel) return null;
                return (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs animate-fadeIn shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-slate-600 font-medium">Selected Branch:</span>
                      <strong className="text-purple-950 font-bold">{sel.code} - {sel.name}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Step 2: Delegate Credentials & Personal Info ─────────────── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-4">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                  2
                </span>
                <span>Delegate Credentials & Information</span>
              </label>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                    <User size={18} />
                  </div>
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    placeholder="e.g. Rajesh Kumar"
                    className={`w-full pl-11 pr-3.5 py-3 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all shadow-sm font-semibold ${
                      errors.name 
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.name}
                  </p>
                )}
              </div>

              {/* Designation & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                      <Briefcase size={18} />
                    </div>
                    <input
                      ref={desigRef}
                      type="text"
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value);
                        if (errors.designation) setErrors(prev => ({ ...prev, designation: undefined }));
                      }}
                      placeholder="e.g. Showroom Manager"
                      className={`w-full pl-11 pr-3.5 py-3 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all shadow-sm ${
                        errors.designation 
                          ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                          : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                      }`}
                    />
                  </div>
                  {errors.designation && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertTriangle size={12} /> {errors.designation}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                      <CreditCard size={18} />
                    </div>
                    <input
                      ref={empRef}
                      type="text"
                      value={employeeId}
                      onChange={(e) => {
                        setEmployeeId(e.target.value.toUpperCase());
                        if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: undefined }));
                      }}
                      placeholder="e.g. EMP1025"
                      className={`w-full pl-11 pr-3.5 py-3 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-mono focus:outline-none transition-all shadow-sm ${
                        errors.employeeId 
                          ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                          : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                      }`}
                    />
                  </div>
                  {errors.employeeId && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertTriangle size={12} /> {errors.employeeId}
                    </p>
                  )}
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gender (Delegate Gift Category) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3.5 px-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                      gender === 'male'
                        ? 'bg-[#1E293B] border-[#1E293B] text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">Male</span>
                    <span className={`text-[10px] mt-0.5 font-medium ${gender === 'male' ? 'text-amber-300' : 'text-slate-500'}`}>
                      Executive Watch Set
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3.5 px-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center ${
                      gender === 'female'
                        ? 'bg-[#831843] border-[#831843] text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">Female</span>
                    <span className={`text-[10px] mt-0.5 font-medium ${gender === 'female' ? 'text-pink-200' : 'text-slate-500'}`}>
                      Pure Silk Saree Box
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Step 3: Contact & Verification ──────────────────────────── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-4">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                  3
                </span>
                <span>Contact & Security Verification</span>
              </label>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-purple-700 text-xs font-bold">
                    +91
                  </span>
                  <input
                    ref={mobileRef}
                    type="tel"
                    inputMode="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, ''));
                      if (errors.mobile) setErrors(prev => ({ ...prev, mobile: undefined }));
                    }}
                    placeholder="9876543210"
                    className={`w-full pl-12 pr-3.5 py-3 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-mono focus:outline-none transition-all shadow-sm ${
                      errors.mobile 
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                    }`}
                  />
                </div>
                {errors.mobile ? (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.mobile}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Your QR pass & updates will be sent directly to this WhatsApp number.
                  </p>
                )}
              </div>

              {/* Aadhaar Number */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Aadhaar Number (12 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {aadhaar.replace(/\D/g, '').length}/12 digits
                  </span>
                </div>
                <input
                  ref={aadhaarRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={aadhaar}
                  onChange={(e) => {
                    setAadhaar(e.target.value.replace(/\D/g, ''));
                    if (errors.aadhaar) setErrors(prev => ({ ...prev, aadhaar: undefined }));
                  }}
                  placeholder="1234 5678 9012"
                  className={`w-full px-3.5 py-3 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-mono tracking-wider focus:outline-none transition-all shadow-sm ${
                    errors.aadhaar 
                      ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                      : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                  }`}
                />
                {errors.aadhaar ? (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.aadhaar}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Shield size={11} className="text-purple-600" /> Masked & stored as XXXX XXXX 9012 for security.
                  </p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional — for PDF copy)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                    <Mail size={18} />
                  </div>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="rajesh.kumar@example.com"
                    className={`w-full pl-11 pr-3.5 py-3 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-all shadow-sm ${
                      errors.email 
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* ── Step 4: Photo / Security Selfie ─────────────────────────── */}
            <div ref={photoSectionRef} className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-4">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-300">
                  4
                </span>
                <span>Delegate Photo / Selfie</span>
                <span className="text-rose-500">*</span>
              </label>

              {cameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-purple-500 aspect-square max-w-[260px] mx-auto shadow-lg">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 px-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <Camera size={14} /> Capture Selfie
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl text-xs font-bold"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative w-28 h-32 rounded-2xl overflow-hidden border-2 border-purple-500 shadow-md bg-white">
                    <img
                      src={photoPreview}
                      alt="Delegate Selfie"
                      className="w-full h-full object-cover"
                    />
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-bold text-purple-800">
                        Uploading...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-white hover:bg-purple-50 border border-slate-300 text-purple-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all shadow-sm"
                    >
                      <RefreshCw size={12} /> Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Upload size={12} /> Upload File
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-3 p-0.5 rounded-2xl ${errors.photo ? 'border border-dashed border-rose-400 bg-rose-50/50' : ''}`}>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-5 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-purple-600 hover:bg-purple-50/40 transition-all flex flex-col items-center justify-center text-center gap-2 group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition-all border border-purple-200">
                      <Camera size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Take Live Selfie</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Use camera</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-purple-600 hover:bg-purple-50/40 transition-all flex flex-col items-center justify-center text-center gap-2 group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition-all border border-purple-200">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Upload Photo</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">From gallery</p>
                    </div>
                  </button>
                </div>
              )}

              {errors.photo && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle size={12} /> {errors.photo}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* ── Submit Action Button ─────────────────────────────────────── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#581C87] via-[#6D28D9] to-[#7C3AED] hover:from-[#4C1D95] hover:to-[#6D28D9] text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Official Event Pass...</span>
                  </span>
                ) : (
                  <>
                    <span>Generate Official Event Pass</span>
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
