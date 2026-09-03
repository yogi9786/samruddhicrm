import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, Gift, CheckCircle2, AlertTriangle, User, 
  ArrowRight, Shield, Sparkles, Lock, RefreshCw, X
} from 'lucide-react';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbGiftScannerViewProps {
  token: string;
}

export const GmbGiftScannerView: React.FC<GmbGiftScannerViewProps> = ({ token }) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<any | null>(null);
  const [counterName, setCounterName] = useState('Gift Counter 1');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reader-gift';

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
      setErrorMsg("Camera error or permission denied. You can manually enter the QR token below.");
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
        throw new Error(data.detail || 'Invalid QR code. Attendee pass not found.');
      }

      setScannedResult({ ...data, raw_token: qrToken.trim() });
    } catch (err: any) {
      setErrorMsg(err.message || 'Pass lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimGift = async () => {
    if (!scannedResult) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/gmb/admin/scan/gift/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          qr_token: scannedResult.raw_token,
          counter_name: counterName,
          gift_type_id: scannedResult.suggested_gift_id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to claim gift');
      }

      setActionSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to claim gift');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForNext = () => {
    setScannedResult(null);
    setActionSuccess(null);
    setErrorMsg(null);
    setManualToken('');
    startScanner();
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
          <Gift size={13} />
          <span>GIFT REDEMPTION SCANNER</span>
        </div>
        <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
          Delegate Gift Distribution
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Scan QR to issue executive gifts (Male: Watch Set • Female: Silk Saree)
        </p>
      </div>

      {/* Counter Selection */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Current Gift Counter:</span>
        <select
          value={counterName}
          onChange={(e) => setCounterName(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-amber-400 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="Gift Counter 1">Gift Counter 1 (Main Hall)</option>
          <option value="Gift Counter 2">Gift Counter 2 (Lobby)</option>
          <option value="Executive Counter 3">Executive Counter 3</option>
        </select>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* GIFT CLAIM SUCCESS CONFIRMATION STATE */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {actionSuccess ? (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-400 text-center space-y-4 shadow-2xl animate-scaleUp">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Gift size={36} />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white font-serif">
              {actionSuccess.already_claimed ? 'Already Claimed' : 'Gift Successfully Issued!'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">{actionSuccess.message}</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl text-xs text-amber-300 font-semibold border border-slate-800">
            Gift: {actionSuccess.gift_name || 'Delegate Gift'}
          </div>

          <button
            onClick={handleResetForNext}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Scan Next Attendee For Gift</span>
            <ArrowRight size={17} />
          </button>
        </div>
      ) : scannedResult ? (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* SCANNED ATTENDEE DETAILS STATE */
        /* ═══════════════════════════════════════════════════════════════════ */
        <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-5 shadow-2xl">
          {/* Rule 1: Gate Check status */}
          {scannedResult.entry_status !== 'ENTERED' ? (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold text-center flex items-center justify-center gap-2">
              <Lock size={16} />
              <span>GIFT LOCKED: ATTENDEE HAS NOT CHECKED IN AT GATE ENTRY YET</span>
            </div>
          ) : scannedResult.gift_status === 'CLAIMED' ? (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertTriangle size={16} />
              <span>GIFT ALREADY CLAIMED FOR THIS PASS</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              <span>GATE ENTRY CONFIRMED • GIFT READY TO DISPATCH</span>
            </div>
          )}

          {/* Attendee Profile */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-24 rounded-2xl bg-slate-950 border-2 border-amber-400 overflow-hidden shrink-0 shadow-md">
              {scannedResult.photo_url ? (
                <img
                  src={`${API_URL}/gmb/photos/${scannedResult.photo_url}`}
                  alt={scannedResult.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={30} className="m-auto text-slate-600 mt-6" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <h3 className="text-lg font-bold font-serif truncate text-amber-300">
                {scannedResult.name}
              </h3>
              <p className="text-xs text-slate-300">{scannedResult.designation}</p>
              <p className="text-xs font-mono font-bold text-amber-400">ID: {scannedResult.employee_id}</p>
              <p className="text-xs text-slate-400">{scannedResult.branch_name} Branch • <span className="capitalize">{scannedResult.gender}</span></p>
            </div>
          </div>

          {/* Allocated Gift Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Allocated Delegate Gift ({scannedResult.gender.toUpperCase()}):
            </span>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>{scannedResult.suggested_gift_name}</span>
            </p>
          </div>

          {/* Gift Actions */}
          {scannedResult.entry_status !== 'ENTERED' ? (
            <div className="space-y-2">
              <button
                disabled
                className="w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-2xl text-sm cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                <span>Gift Locked (Gate Entry Required First)</span>
              </button>
              <button
                onClick={handleResetForNext}
                className="w-full py-2.5 text-xs text-amber-400 hover:underline"
              >
                Scan Another Pass
              </button>
            </div>
          ) : scannedResult.gift_status === 'CLAIMED' ? (
            <div className="space-y-2">
              <button
                disabled
                className="w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-2xl text-sm cursor-not-allowed border border-slate-700"
              >
                Gift Already Claimed
              </button>
              <button
                onClick={handleResetForNext}
                className="w-full py-2.5 text-xs text-amber-400 hover:underline"
              >
                Scan Another Pass
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleClaimGift}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-base shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Processing Gift...' : (
                  <>
                    <Gift size={20} />
                    <span>CONFIRM & GIVE GIFT</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setScannedResult(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* SCANNER CAMERA & MANUAL INPUT STATE */
        /* ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div
              id={scannerContainerId}
              className={`rounded-2xl overflow-hidden bg-black aspect-square max-w-[320px] mx-auto border-2 ${
                scannerActive ? 'border-amber-400' : 'border-slate-800'
              }`}
            />

            {!scannerActive ? (
              <button
                type="button"
                onClick={startScanner}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                <span>OPEN CAMERA & SCAN QR</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="w-full py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs"
              >
                Stop Camera Scanner
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Or Enter Pass Token Manually:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="e.g. EVT-175E7D8BCCE4F082"
                className="flex-grow px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                disabled={!manualToken.trim() || loading}
                onClick={() => handleLookupToken(manualToken)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs transition-all disabled:opacity-40"
              >
                Lookup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
