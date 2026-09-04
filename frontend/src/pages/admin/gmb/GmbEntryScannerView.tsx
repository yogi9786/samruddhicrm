import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, QrCode, CheckCircle2, AlertTriangle, User, 
  ArrowRight, RefreshCw, X, Shield, Building, Zap
} from 'lucide-react';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbEntryScannerViewProps {
  token: string;
}

export const GmbEntryScannerView: React.FC<GmbEntryScannerViewProps> = ({ token }) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<any | null>(null);
  const [gateName, setGateName] = useState('Main Gate 1');
  const [lastScannedGunToken, setLastScannedGunToken] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reader-entry';
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  // Play audio beep for staff feedback
  const playBeep = (isSuccess: boolean = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime); // A5 or E4
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // ── Handheld Barcode / QR Scanner Gun Global Listener ───────────────────────
  // Scanners like the Helett HT20 emulate a USB HID Keyboard typing rapidly followed by Enter
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input other than the manual token input
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && target !== manualInputRef.current) {
        return;
      }

      const currentTime = Date.now();
      const char = e.key;

      // If keys arrive in rapid succession (typical scanner fires < 50ms per key)
      if (currentTime - lastKeyTime > 250) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (char === 'Enter') {
        if (buffer.trim().length > 3) {
          e.preventDefault();
          let cleanToken = buffer.trim();
          if (cleanToken.includes('/pass/')) {
            cleanToken = cleanToken.split('/pass/').pop()?.split('?')[0] || cleanToken;
          }
          setLastScannedGunToken(cleanToken);
          setManualToken(cleanToken);
          handleLookupToken(cleanToken);
          buffer = '';
        }
      } else if (char.length === 1) {
        buffer += char;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [token]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setErrorMsg(null);
    setScannedResult(null);
    setActionSuccess(null);

    try {
      setScannerActive(true);
      const qrScanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qrScanner;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      await qrScanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          let cleanToken = decodedText;
          if (decodedText.includes('/pass/')) {
            cleanToken = decodedText.split('/pass/').pop()?.split('?')[0] || decodedText;
          }
          stopScanner();
          handleLookupToken(cleanToken);
        },
        (errorMessage: string) => {}
      );
    } catch (err: any) {
      console.warn("Scanner start error:", err);
      setErrorMsg("Camera error or permission denied. You can also use the handheld USB scanner gun or enter pass token below.");
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch((err: any) => console.error("Error stopping scanner", err));
    }
    setScannerActive(false);
  };

  const handleLookupToken = async (qrToken: string) => {
    if (!qrToken.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setScannedResult(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`${API_URL}/gmb/admin/scan/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qr_token: qrToken.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        playBeep(false);
        throw new Error(data.detail || 'Invalid QR code. Attendee pass not found.');
      }

      playBeep(true);
      setScannedResult({ ...data, raw_token: qrToken.trim() });
    } catch (err: any) {
      setErrorMsg(err.message || 'Pass lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEntry = async () => {
    if (!scannedResult) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/gmb/admin/scan/entry/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          qr_token: scannedResult.raw_token,
          gate_name: gateName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to confirm entry');
      }

      playBeep(true);
      setActionSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check in attendee');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForNext = () => {
    setScannedResult(null);
    setActionSuccess(null);
    setErrorMsg(null);
    setManualToken('');
    setLastScannedGunToken(null);
    if (manualInputRef.current) {
      manualInputRef.current.focus();
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 font-sans">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold uppercase tracking-wider mb-2">
          <Shield size={14} className="text-purple-600" />
          <span>GATE ENTRY SCANNER</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
          Attendee Gate Check-In
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Scan QR via <strong>Handheld Scanner Gun</strong> or Camera on delegate mobile or printed pass
        </p>
      </div>

      {/* Hardware Gun Scanner Ready Status Indicator */}
      <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 text-xs text-purple-900 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>🔫 Handheld Scanner Gun Active (Point & Click Trigger)</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-white text-purple-700 font-mono text-[10px] font-bold border border-purple-200">
          Auto-Detect
        </span>
      </div>

      {/* Gate Selection */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">Current Scanner Gate:</span>
        <select
          value={gateName}
          onChange={(e) => setGateName(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer"
        >
          <option value="Main Gate 1">Main Gate 1 (VIP Entrance)</option>
          <option value="Gate 2 (General)">Gate 2 (General Entrance)</option>
          <option value="Executive Gate 3">Executive Gate 3</option>
        </select>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-600" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SCAN SUCCESS CONFIRMATION STATE */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {actionSuccess ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-emerald-500 text-center space-y-4 shadow-xl animate-scaleUp">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 font-display">
              {actionSuccess.already_entered ? 'Already Entered' : 'Gate Entry Approved!'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">{actionSuccess.message}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-200/80">
            <span>Gate: <strong className="text-slate-900">{actionSuccess.gate_name}</strong></span>
            <span className="mx-2">•</span>
            <span>Staff: <strong className="text-slate-900">{actionSuccess.staff_name}</strong></span>
          </div>

          <button
            onClick={handleResetForNext}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Scan Next Attendee Pass</span>
            <ArrowRight size={17} />
          </button>
        </div>
      ) : scannedResult ? (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* SCANNED ATTENDEE DETAILS STATE */
        /* ═══════════════════════════════════════════════════════════════════ */
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 space-y-5 shadow-xl">
          {/* Status Ribbon */}
          {scannedResult.entry_status === 'ENTERED' ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertTriangle size={16} />
              <span>WARNING: ATTENDEE ALREADY CHECKED IN</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              <span>VALID PASS • READY FOR CHECK-IN</span>
            </div>
          )}

          {/* Attendee Profile Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
            <div className="w-20 h-24 rounded-2xl bg-white border border-purple-200 overflow-hidden shrink-0 shadow-sm">
              {scannedResult.photo_url ? (
                <img
                  src={`${API_URL}/gmb/photos/${scannedResult.photo_url}`}
                  alt={scannedResult.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={30} className="m-auto text-slate-400 mt-6" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <h3 className="text-lg font-bold truncate text-slate-900 font-display">
                {scannedResult.name}
              </h3>
              <p className="text-xs text-slate-600 font-medium">{scannedResult.designation}</p>
              <p className="text-xs font-mono font-bold text-purple-800">
                <span className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                  ID: {scannedResult.employee_id}
                </span>
              </p>
              <p className="text-xs text-slate-700 font-semibold">{scannedResult.branch_name} Branch • <span className="capitalize text-purple-700">{scannedResult.gender}</span></p>
              <p className="text-[11px] text-slate-500 font-mono">Aadhaar: {scannedResult.masked_aadhaar}</p>
            </div>
          </div>

          {/* Entry Confirmation Button */}
          {scannedResult.entry_status === 'ENTERED' ? (
            <div className="space-y-2">
              <button
                disabled
                className="w-full py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl text-sm cursor-not-allowed border border-slate-200"
              >
                Already Checked In (Duplicate Entry Blocked)
              </button>
              <button
                onClick={handleResetForNext}
                className="w-full py-2.5 text-xs text-purple-700 hover:text-purple-900 font-bold"
              >
                Scan Another Pass
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleConfirmEntry}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-2xl text-base shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {loading ? 'Confirming Entry...' : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>CONFIRM GATE ENTRY</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setScannedResult(null)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Cancel & Rescan
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* SCANNER CAMERA & MANUAL INPUT STATE */
        /* ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Live Camera View Box */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 text-center space-y-4 shadow-sm">
            <div
              id={scannerContainerId}
              className={`rounded-2xl overflow-hidden bg-slate-900 aspect-square max-w-[320px] mx-auto border-2 ${
                scannerActive ? 'border-purple-600' : 'border-slate-200'
              }`}
            />

            {!scannerActive ? (
              <button
                type="button"
                onClick={startScanner}
                className="w-full py-4 bg-gradient-to-r from-[#581C87] via-[#6D28D9] to-[#7C3AED] hover:from-[#4C1D95] hover:to-[#6D28D9] text-white font-bold rounded-2xl text-sm shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 active:scale-98"
              >
                <Camera size={18} />
                <span>OPEN CAMERA SCANNER</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors"
              >
                Stop Camera Scanner
              </button>
            )}
          </div>

          {/* Manual / Gun Token Entry */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 space-y-2.5 shadow-sm">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Or Scan with Handheld Gun / Enter Token:
            </span>
            <form onSubmit={(e) => { e.preventDefault(); handleLookupToken(manualToken); }} className="flex gap-2">
              <input
                ref={manualInputRef}
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Click here or scan with USB Gun (e.g. EVT-175E7D8BCCE4F082)"
                className="flex-grow px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!manualToken.trim() || loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition-all disabled:opacity-40 shadow-sm"
              >
                Lookup
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
