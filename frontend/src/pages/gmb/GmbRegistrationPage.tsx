import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, AlertCircle, Camera, Upload, RefreshCw,
  Download, ArrowRight, Shield, User, Building, Phone, Mail,
  CreditCard, Briefcase, Eye, ChevronRight, Check, X, AlertTriangle,
  ChevronDown, Search, Ticket, Gift, Lock, KeyRound, MessageSquare,
  Send, Smartphone, Clock, CheckCircle
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
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  // SMS OTP Verification State
  const [otpSessionToken, setOtpSessionToken] = useState<string>('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

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

  // OTP Resend Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpCountdown]);

  // Send / Resend SMS OTP Handler
  const handleSendOtp = async (isResend = false) => {
    // 1. Enforce Employee ID first before mobile verification
    if (!employeeId.trim()) {
      setErrors(prev => ({ ...prev, employeeId: 'Employee ID is compulsory. Please enter your Employee ID before verifying mobile number.' }));
      if (empRef.current) {
        empRef.current.focus();
        empRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrors(prev => ({ ...prev, mobile: 'Please enter a valid 10-digit mobile number before requesting OTP.' }));
      if (mobileRef.current) mobileRef.current.focus();
      return;
    }

    setOtpError(null);
    setOtpSuccessMsg(null);
    setOtpStatus('sending');

    try {
      const res = await fetch(`${API_URL}/gmb/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobile: cleanMobile,
          employee_id: employeeId.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to dispatch SMS OTP. Please try again.');
      }

      setOtpSessionToken(data.session_token);
      setOtpStatus('sent');
      setOtpCountdown(45);
      setOtpSuccessMsg(data.message || `OTP sent successfully via SMS to +91 ${cleanMobile}`);
      setTimeout(() => {
        if (otpInputRef.current) otpInputRef.current.focus();
      }, 200);
    } catch (err: any) {
      setOtpStatus(otpSessionToken ? 'sent' : 'idle');
      setOtpError(err.message || 'Could not send SMS OTP. Please try again.');
    }
  };

  // Verify SMS OTP Handler
  const handleVerifyOtp = async () => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanCode = otpCode.replace(/\D/g, '');

    if (!cleanCode || cleanCode.length < 4) {
      setOtpError('Please enter the verification code received on your mobile');
      return;
    }

    if (!otpSessionToken) {
      setOtpError('Please request an OTP first');
      setOtpStatus('idle');
      return;
    }

    setOtpError(null);
    setOtpStatus('verifying');

    try {
      const res = await fetch(`${API_URL}/gmb/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          otp: cleanCode,
          session_token: otpSessionToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid verification code');
      }

      setOtpStatus('verified');
      setOtpSuccessMsg('Mobile number verified successfully! ✓');
      setErrors(prev => ({ ...prev, mobile: undefined }));
    } catch (err: any) {
      setOtpStatus('sent');
      setOtpError(err.message || 'Incorrect OTP code. Please enter the valid code.');
    }
  };

  // Reset OTP state if user wants to change mobile number
  const handleResetOtp = () => {
    setOtpStatus('idle');
    setOtpSessionToken('');
    setOtpCode('');
    setOtpError(null);
    setOtpSuccessMsg(null);
    setTimeout(() => {
      if (mobileRef.current) mobileRef.current.focus();
    }, 100);
  };

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

    // 1. Employee ID is compulsory (Step 2 First Field)
    if (!employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is compulsory (e.g. EMP1025)';
    }

    // 2. Full Name (Step 2 Second Field)
    if (!name.trim()) {
      newErrors.name = 'Full Name is required (minimum 2 characters)';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full Name must be at least 2 characters';
    }

    // 3. Designation (Step 2 Third Field)
    if (!designation.trim()) {
      newErrors.designation = 'Designation is required (e.g. Sales Executive, Manager)';
    }

    // 4. Mobile & OTP (Step 3 First Field)
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      newErrors.mobile = 'Mobile number is required (10 digits)';
    } else if (cleanMobile.length !== 10) {
      newErrors.mobile = `Mobile number must be exactly 10 digits (currently ${cleanMobile.length} digits)`;
    } else if (otpStatus !== 'verified' || !otpSessionToken) {
      newErrors.mobile = 'Please verify your mobile number with SMS OTP before submitting';
    }

    // 5. Aadhaar (Step 3 Second Field)
    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (!cleanAadhaar) {
      newErrors.aadhaar = 'Aadhaar Number is required (12 digits)';
    } else if (cleanAadhaar.length !== 12) {
      newErrors.aadhaar = `Aadhaar Number must be exactly 12 digits (currently ${cleanAadhaar.length} digits)`;
    }

    // 6. Email (Step 3 Third Field - Optional)
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // 7. Photo (Step 4)
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
      // Scroll to error summary or first invalid input in top-to-bottom order
      if (newErrors.employeeId && empRef.current) {
        empRef.current.focus();
        empRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.name && nameRef.current) {
        nameRef.current.focus();
        nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.designation && desigRef.current) {
        desigRef.current.focus();
        desigRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        otp_session_token: otpSessionToken,
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
      <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#E2E8F0] to-[#EEF2F6] text-slate-800 flex flex-col justify-center items-center p-3 sm:p-6 md:p-8 font-sans relative overflow-hidden selection:bg-slate-900 selection:text-white">
        {/* Multi-Tone Ambient Architectural Background Glows */}
        <div className="absolute top-[-10%] left-[-8%] w-[560px] h-[560px] rounded-full bg-gradient-to-br from-[#7E22CE]/15 via-slate-400/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-[-5%] right-[-8%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#526F91]/15 via-slate-400/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[540px] h-[540px] rounded-full bg-gradient-to-tl from-[#21845F]/15 via-slate-400/10 to-transparent blur-3xl pointer-events-none" />

        {/* Modern Dot Matrix Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.35] pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(#64748B 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10 w-full max-w-lg bg-[#F8FAFC]/95 backdrop-blur-2xl border-2 border-slate-300 rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] text-center animate-fadeIn my-4 sm:my-6 overflow-hidden">
          {/* Card Top Decorative Multi-Color Gradient Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 sm:h-2 bg-gradient-to-r from-[#7E22CE] via-[#526F91] to-[#21845F]" />

          {/* Success Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#E8F4EE] border-2 border-[#21845F] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-[#21845F] shadow-lg shadow-[#21845F]/15 mt-1 sm:mt-2">
            <CheckCircle2 size={32} className="sm:w-9 sm:h-9" />
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-black tracking-tight font-display">
            Registration Confirmed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2 font-medium px-1">
            Thank you, <strong className="text-slate-900">{registrationResult.name}</strong>. Your official delegate pass has been generated.
          </p>

          {/* Pass Details Card */}
          <div className="my-4 sm:my-6 p-4 sm:p-5 bg-white border border-slate-300 rounded-xl sm:rounded-2xl text-left space-y-3 shadow-xs">
            <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-slate-200">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Event Pass Token</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate max-w-[180px] sm:max-w-none">{registrationResult.qr_token}</p>
              </div>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] text-[10px] sm:text-xs font-bold shrink-0">
                CONFIRMED ✓
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Branch:</span>
                <p className="text-slate-800 font-semibold text-xs truncate">{registrationResult.branch_name}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Employee ID:</span>
                <p className="text-slate-800 font-semibold font-mono text-xs truncate">{employeeId.toUpperCase()}</p>
              </div>
            </div>

            {/* Scannable QR Code Box */}
            <div className="py-3 px-2 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-300 text-center my-2">
              <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl inline-block shadow-sm border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/gbm/pass/' + registrationResult.qr_token)}`}
                  alt="Delegate QR Token"
                  className="w-32 h-32 sm:w-36 sm:h-36 mx-auto"
                />
              </div>
              <p className="text-xs font-mono font-bold text-slate-900 mt-2 tracking-wider">
                {registrationResult.qr_token}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium px-1">
                Scan or present this QR code at Gate Entry & Gift Counter
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 sm:space-y-3">
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={() => handleDownloadPdf(registrationResult.qr_token, employeeId)}
              className="w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75"
            >
              {downloadingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing & Downloading Pass...</span>
                </>
              ) : (
                <>
                  <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                setGender('male');
                setMobile('');
                setEmail('');
                setAadhaar('');
                setPhotoPreview(null);
                setPhotoFilename('');
                setErrors({});
                setAttemptedSubmit(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl sm:rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>← Back to Registration Form</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REGISTRATION FORM (STEP-BY-STEP PROGRESSIVE FLOW)
  // ═══════════════════════════════════════════════════════════════════════════
  const errorCount = Object.keys(errors).filter(k => (errors as any)[k]).length;
  const isEmployeeIdFilled = Boolean(employeeId.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#E2E8F0] to-[#EEF2F6] text-slate-800 flex flex-col justify-center items-center p-3 sm:p-6 md:p-8 font-sans relative overflow-hidden selection:bg-slate-900 selection:text-white">
      {/* ── Multi-Tone Ambient Architectural Background Glows ────────────── */}
      <div className="absolute top-[-10%] left-[-8%] w-[560px] h-[560px] rounded-full bg-gradient-to-br from-[#7E22CE]/15 via-slate-400/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[-5%] right-[-8%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#526F91]/15 via-slate-400/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-8%] w-[540px] h-[540px] rounded-full bg-gradient-to-tl from-[#21845F]/15 via-slate-400/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-8%] w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[#B97855]/10 via-slate-300/20 to-transparent blur-3xl pointer-events-none" />

      {/* Modern Dot Matrix Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.35] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#64748B 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 w-full max-w-xl my-2 sm:my-6 animate-scaleUp">
        
        {/* Main Card Container with Grey Styling & Sleek Glassmorphism */}
        <div className="bg-[#F8FAFC]/95 backdrop-blur-2xl border-2 border-slate-300 rounded-2xl sm:rounded-[32px] p-4 sm:p-7 md:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] relative overflow-hidden">
          
          {/* Card Top Decorative Executive Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1 sm:h-1.5 bg-gradient-to-r from-slate-800 via-indigo-600 to-slate-800" />
          
          {/* Highlighted Hero Header Section */}
          <div className="text-center mb-6 sm:mb-8 pt-1 sm:pt-2 relative">
            <div className="relative py-3.5 px-3 sm:py-5 sm:px-6 rounded-2xl sm:rounded-3xl bg-slate-100/90 border-2 border-slate-300 shadow-xs space-y-1.5 sm:space-y-2">
              
              {/* Highlighted Colorful Gradient Badge */}
              <div className="flex justify-center mb-1">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#7E22CE] via-[#6366F1] to-[#2563EB] text-white text-[10px] sm:text-xs font-bold uppercase tracking-normal sm:tracking-wider shadow-md shadow-indigo-500/20">
                  <Sparkles size={13} className="text-amber-300 shrink-0" />
                  <span className="truncate">GBM EVENT 2026 REGISTRATION PORTAL</span>
                </div>
              </div>

              {/* Title with Clean Weight in Solid Black */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                GBM Event Registration
              </h1>

              {/* Subtitle */}
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                Please complete the step-by-step verification below to receive your official delegate pass
              </p>
            </div>
          </div>

          {/* Validation Errors Summary Alert Banner */}
          {attemptedSubmit && errorCount > 0 && (
            <div ref={errorSummaryRef} className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 animate-fadeIn text-xs">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm mb-1.5 text-rose-800">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>Please complete {errorCount} required {errorCount === 1 ? 'field' : 'fields'}:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-rose-700 font-medium pl-1 text-[11px] sm:text-xs">
                {errors.employeeId && <li>{errors.employeeId}</li>}
                {errors.name && <li>{errors.name}</li>}
                {errors.designation && <li>{errors.designation}</li>}
                {errors.mobile && <li>{errors.mobile}</li>}
                {errors.aadhaar && <li>{errors.aadhaar}</li>}
                {errors.email && <li>{errors.email}</li>}
                {errors.photo && <li>{errors.photo}</li>}
              </ul>
            </div>
          )}

          {/* Backend API Error Banner */}
          {apiError && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="font-medium text-xs">{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6">
            
            {/* ── Step 1: Showroom Branch Selection ── */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-2.5 sm:space-y-3">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] sm:text-xs flex items-center justify-center border border-slate-300 shrink-0">
                  1
                </span>
                <span>Select Showroom Branch</span>
              </label>

              {/* Branch Dropdown Select */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full pl-9 sm:pl-11 pr-8 sm:pr-10 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-xl sm:rounded-2xl text-slate-900 font-medium text-xs sm:text-sm focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer appearance-none shadow-sm"
                >
                  {DEFAULT_BRANCHES.map((b) => (
                    <option key={b.code} value={b.id} className="py-1 text-slate-900">
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>

              {/* Selected Branch Info */}
              {(() => {
                const sel = DEFAULT_BRANCHES.find(b => b.id === selectedBranch) || DEFAULT_BRANCHES[0];
                if (!sel) return null;
                return (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-between text-[11px] sm:text-xs animate-fadeIn shadow-xs flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#21845F] animate-pulse shrink-0" />
                      <span className="text-slate-600 font-medium">Selected Branch:</span>
                      <strong className="text-slate-900 font-bold">{sel.code} - {sel.name}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Step 2: Employee Credentials & Personal Details ───────────── */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3 sm:space-y-4">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] sm:text-xs flex items-center justify-center border border-slate-300 shrink-0">
                  2
                </span>
                <span>Delegate Credentials & Employee Info</span>
              </label>

              {/* Field 1 (Compulsory First): Employee ID */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-300 shadow-xs">
                <div className="flex justify-between items-center flex-wrap gap-1 mb-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-slate-700 sm:w-[15px] sm:h-[15px]" />
                    <span>Employee ID</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-200/80 border border-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Compulsory First
                  </span>
                </div>
                <div className="relative">
                  <input
                    ref={empRef}
                    type="text"
                    value={employeeId}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEmployeeId(val);
                      if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: undefined }));
                    }}
                    placeholder="e.g. EMP1025"
                    className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-mono font-bold tracking-wider focus:outline-none transition-all shadow-sm ${
                      errors.employeeId 
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-200'
                    }`}
                  />
                </div>
                {errors.employeeId ? (
                  <p className="text-[11px] sm:text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.employeeId}
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 font-medium leading-normal">
                    Required to authorize your pass and unlock phone number verification below.
                  </p>
                )}
              </div>

              {/* Field 2: Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 sm:mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                    className={`w-full pl-9 sm:pl-11 pr-3.5 py-2.5 sm:py-3 bg-white border rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none transition-all shadow-sm font-medium ${
                      errors.name 
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-200'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] sm:text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.name}
                  </p>
                )}
              </div>

              {/* Field 3: Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 sm:mb-1.5">
                  Designation / Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Briefcase size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <input
                    ref={desigRef}
                    type="text"
                    value={designation}
                    onChange={(e) => {
                      setDesignation(e.target.value);
                      if (errors.designation) setErrors(prev => ({ ...prev, designation: undefined }));
                    }}
                    placeholder="e.g. Showroom Manager, Sales Executive"
                    className={`w-full pl-9 sm:pl-11 pr-3.5 py-2.5 sm:py-3 bg-white border rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none transition-all shadow-sm font-medium ${
                      errors.designation 
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-200'
                    }`}
                  />
                </div>
                {errors.designation && (
                  <p className="text-[11px] sm:text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.designation}
                  </p>
                )}
              </div>

              {/* Field 4: Gender Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 sm:mb-1.5">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl sm:rounded-2xl border-2 text-center transition-all flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-sm ${
                      gender === 'male'
                        ? 'bg-[#526F91] border-[#526F91] text-white shadow-md shadow-[#526F91]/25 ring-2 ring-[#C6D4E3]'
                        : 'bg-[#EDF2F8] border-[#C6D4E3] text-[#526F91] hover:border-[#526F91] hover:bg-[#E2EAF2]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${gender === 'male' ? 'bg-white' : 'bg-[#526F91]'}`} />
                    <span className="truncate">Male</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl sm:rounded-2xl border-2 text-center transition-all flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-sm ${
                      gender === 'female'
                        ? 'bg-[#7E22CE] border-[#7E22CE] text-white shadow-md shadow-[#7E22CE]/25 ring-2 ring-[#D8B4FE]'
                        : 'bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE] hover:border-[#7E22CE] hover:bg-[#EDE0FB]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${gender === 'female' ? 'bg-white' : 'bg-[#7E22CE]'}`} />
                    <span className="truncate">Female</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('other')}
                    className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl sm:rounded-2xl border-2 text-center transition-all flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-sm ${
                      gender === 'other'
                        ? 'bg-[#21845F] border-[#21845F] text-white shadow-md shadow-[#21845F]/25 ring-2 ring-[#C5E3D5]'
                        : 'bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F] hover:border-[#21845F] hover:bg-[#DDF0E7]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${gender === 'other' ? 'bg-white' : 'bg-[#21845F]'}`} />
                    <span className="truncate">Other</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Step 3: Identity & Contact Verification (SMS OTP) ───────── */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3 sm:space-y-4">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] sm:text-xs flex items-center justify-center border border-slate-300 shrink-0">
                  3
                </span>
                <span>Contact & SMS OTP Security Verification</span>
              </label>

              {/* Mobile Number & SMS OTP Verification */}
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <label className="block text-xs font-bold text-slate-900">
                    Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                  </label>
                  {otpStatus === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} className="text-emerald-600" />
                      <span>Verified ✓</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-semibold">
                      SMS OTP Required
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center text-slate-700 text-xs font-bold">
                      +91
                    </span>
                    <input
                      ref={mobileRef}
                      type="tel"
                      inputMode="tel"
                      maxLength={10}
                      disabled={otpStatus === 'verified'}
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setMobile(val);
                        if (otpStatus !== 'idle') {
                          setOtpStatus('idle');
                          setOtpSessionToken('');
                          setOtpCode('');
                          setOtpError(null);
                          setOtpSuccessMsg(null);
                        }
                        if (errors.mobile) setErrors(prev => ({ ...prev, mobile: undefined }));
                      }}
                      placeholder="9876543210"
                      className={`w-full pl-10 sm:pl-12 pr-3.5 py-2.5 sm:py-3 bg-white border rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-mono focus:outline-none transition-all shadow-sm font-medium ${
                        otpStatus === 'verified'
                          ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-bold'
                          : errors.mobile 
                            ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                            : 'border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-200'
                      }`}
                    />
                  </div>

                  {/* Send / Verify Button or Change Button */}
                  {otpStatus === 'verified' ? (
                    <button
                      type="button"
                      onClick={handleResetOtp}
                      className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shrink-0 shadow-sm"
                    >
                      Change Number
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={mobile.replace(/\D/g, '').length !== 10 || otpStatus === 'sending'}
                      onClick={() => handleSendOtp(false)}
                      className={`w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all shrink-0 shadow-sm flex items-center justify-center gap-1.5 ${
                        mobile.replace(/\D/g, '').length === 10 && otpStatus !== 'sending'
                          ? 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20 active:scale-[0.98]'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      {otpStatus === 'sending' ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          <span>Sending SMS...</span>
                        </>
                      ) : otpStatus === 'sent' ? (
                        <>
                          <RefreshCw size={13} />
                          <span>Resend OTP</span>
                        </>
                      ) : (
                        <>
                          <Smartphone size={14} />
                          <span>Verify Mobile</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Error / Verified / Helper message for Mobile Input */}
                {errors.mobile ? (
                  <p className="text-[11px] sm:text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.mobile}
                  </p>
                ) : otpStatus === 'verified' ? (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <span className="text-[11px] sm:text-xs">Mobile verified: <strong>+91 {mobile}</strong></span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      SMS Verified ✓
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium">
                    Your QR pass & event updates will be sent to this verified mobile number.
                  </p>
                )}

                {/* Inline OTP Verification Panel */}
                {(otpStatus === 'sent' || otpStatus === 'verifying') && (
                  <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-2.5 sm:space-y-3 animate-fadeIn shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs sm:text-sm">
                        <KeyRound size={15} className="text-slate-700" />
                        <span>Enter 6-Digit SMS OTP</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-slate-500">
                        Sent to <strong>+91 {mobile}</strong>
                      </span>
                    </div>

                    {/* OTP Input and Verify Action */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          if (otpError) setOtpError(null);
                        }}
                        placeholder="••••••"
                        className="w-full sm:flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-white border border-slate-300 rounded-xl text-center text-base sm:text-lg font-mono font-bold tracking-[0.25em] sm:tracking-[0.35em] text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        disabled={otpCode.length < 4 || otpStatus === 'verifying'}
                        onClick={handleVerifyOtp}
                        className={`w-full sm:w-auto py-2.5 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                          otpCode.length >= 4 && otpStatus !== 'verifying'
                            ? 'bg-slate-900 hover:bg-black text-white active:scale-[0.98]'
                            : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {otpStatus === 'verifying' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm & Verify</span>
                            <Check size={15} />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Resend Timer & Actions */}
                    <div className="flex items-center justify-between text-[11px] sm:text-xs flex-wrap gap-1.5 pt-1">
                      {otpCountdown > 0 ? (
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Clock size={12} className="text-slate-600" />
                          <span>Resend OTP in <strong>{otpCountdown}s</strong></span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp(true)}
                          className="text-slate-900 hover:text-black font-bold underline flex items-center gap-1 cursor-pointer transition-colors text-[11px] sm:text-xs"
                        >
                          <RefreshCw size={11} />
                          <span>Resend SMS OTP</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleResetOtp}
                        className="text-slate-500 hover:text-slate-800 text-[10px] sm:text-[11px] underline"
                      >
                        Change number
                      </button>
                    </div>

                    {/* Inline OTP Error Display */}
                    {otpError && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium animate-fadeIn">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>{otpError}</span>
                      </div>
                    )}

                    {/* Inline OTP Success Display */}
                    {otpSuccessMsg && !otpError && (
                      <p className="text-[10px] sm:text-[11px] text-slate-700 flex items-center gap-1 font-medium">
                        <Sparkles size={11} className="text-slate-600 shrink-0" />
                        <span>{otpSuccessMsg}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Aadhaar Number */}
              <div>
                <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                  <label className="text-xs font-bold text-slate-900">
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
                  className={`w-full px-3.5 py-2.5 sm:py-3 bg-white border rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-mono tracking-wider focus:outline-none transition-all shadow-sm font-medium ${
                    errors.aadhaar 
                      ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                      : 'border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-200'
                  }`}
                />
                {errors.aadhaar ? (
                  <p className="text-[11px] sm:text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.aadhaar}
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <Shield size={11} className="text-slate-600 shrink-0" /> Masked & stored as XXXX XXXX 9012 for security.
                  </p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 sm:mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                    className={`w-full pl-9 sm:pl-11 pr-3.5 py-2.5 sm:py-3 bg-white border rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none transition-all shadow-sm font-medium ${
                      errors.email 
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-200'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] sm:text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle size={12} /> {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* ── Step 4: Photo / Security Selfie ─────────────────────────── */}
            <div ref={photoSectionRef} className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3 sm:space-y-4">
              <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] sm:text-xs flex items-center justify-center border border-slate-300 shrink-0">
                  4
                </span>
                <span>Delegate Photo / Security Selfie</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>

              {cameraActive ? (
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-black border-2 border-slate-700 aspect-square max-w-[220px] sm:max-w-[260px] mx-auto shadow-lg">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-2 sm:bottom-3 flex justify-center gap-2 px-2 sm:px-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg sm:rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <Camera size={13} /> <span>Capture</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg sm:rounded-xl text-xs font-bold"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="flex flex-col items-center space-y-2.5 sm:space-y-3">
                  <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-700 shadow-md bg-white">
                    <img
                      src={photoPreview}
                      alt="Delegate Selfie"
                      className="w-full h-full object-cover"
                    />
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[11px] sm:text-xs font-bold text-slate-800">
                        Uploading...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all shadow-sm"
                    >
                      <RefreshCw size={12} /> Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Upload size={12} /> Upload File
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-2 sm:gap-3 p-0.5 rounded-xl sm:rounded-2xl ${errors.photo ? 'border border-dashed border-rose-400 bg-rose-50/50' : ''}`}>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-600 hover:bg-slate-100 transition-all flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 group shadow-sm"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-slate-800 flex items-center justify-center group-hover:bg-slate-200 transition-all border border-slate-300 shadow-xs">
                      <Camera size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Take Selfie</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium">Use camera</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-600 hover:bg-slate-100 transition-all flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 group shadow-sm"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-slate-800 flex items-center justify-center group-hover:bg-slate-200 transition-all border border-slate-300 shadow-xs">
                      <Upload size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Upload Photo</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium">From gallery</p>
                    </div>
                  </button>
                </div>
              )}

              {errors.photo && (
                <p className="text-[11px] sm:text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
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
                className="w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-base rounded-xl sm:rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Official Event Pass...</span>
                  </span>
                ) : (
                  <>
                    <span>Generate Official Event Pass</span>
                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
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
