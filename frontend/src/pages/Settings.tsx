import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Sliders, Key, Save, Trash2, CheckCircle, XCircle,
  Facebook, Instagram, Smartphone, Mail, Zap, Copy, Check, Eye, EyeOff, ExternalLink
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface AdminSettings {
  username: string;
  password: string;
  is_custom: boolean;
}

interface SectionState<T> {
  data: T;
  saving: boolean;
  message: string;
  error: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const useMsg = () => {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const show = (m: string, isErr = false) => { isErr ? setErr(m) : setMsg(m); setTimeout(() => isErr ? setErr('') : setMsg(''), 4000); };
  return { msg, err, show };
};

// ─── Sub-component: Section Card ──────────────────────────────────────────

const SectionCard = ({
  icon, title, subtitle, badge, children
}: {
  icon: React.ReactNode; title: string; subtitle: string; badge?: string; children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b border-gray-100" style={{ backgroundColor: 'rgba(245,158,11,0.03)' }}>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #800000, #F59E0B)', color: 'white' }}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      {badge && (
        <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>{badge}</span>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Sub-component: Field ──────────────────────────────────────────────────

const Field = ({
  label, value, onChange, placeholder, secret = false, mono = false, readOnly = false
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; secret?: boolean; mono?: boolean; readOnly?: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={secret && !show ? 'password' : 'text'}
          readOnly={readOnly}
          className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition ${mono ? 'font-mono' : ''} ${readOnly ? 'bg-gray-50 text-gray-500 cursor-default' : 'bg-white focus:ring-2'}`}
          style={readOnly ? {} : { '--tw-ring-color': 'rgba(245,158,11,0.35)' } as React.CSSProperties}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
        />
        {secret && !readOnly && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Sub-component: Copy Row ───────────────────────────────────────────────

const CopyRow = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const doCopy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">{label}</label>
      <div className="flex items-center space-x-2">
        <code className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-mono bg-gray-50 text-gray-600 truncate">{value}</code>
        <button onClick={doCopy} className="p-2.5 rounded-xl border transition text-xs font-bold"
          style={copied ? { backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#16a34a' } : { backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#92400e' }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
};

// ─── Main Settings Page ────────────────────────────────────────────────────

export const Settings = () => {
  const adminMsg = useMsg();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Meta settings (loaded from /meta/settings)
  const [metaSettings, setMetaSettings] = useState({ page_id: '', access_token: '', verify_token: '', is_active: false });
  const metaMsg = useMsg();
  const [savingMeta, setSavingMeta] = useState(false);

  // Twilio (stored in .env, display only, allow edit via PUT /auth/integrations)
  const [twilio, setTwilio] = useState({ account_sid: '', auth_token: '', phone_number: '' });
  const twilioMsg = useMsg();
  const [savingTwilio, setSavingTwilio] = useState(false);

  // Brevo
  const [brevo, setBrevo] = useState({ api_key: '', sender_email: '' });
  const brevoMsg = useMsg();
  const [savingBrevo, setSavingBrevo] = useState(false);

  const backendBase = `${window.location.protocol}//${window.location.hostname}:8000`;
  const webhookUrls = [
    { label: 'Meta Webhook (FB Leads, FB Messages, IG Messages)', value: `${backendBase}/api/webhooks/meta/` },
    { label: 'WhatsApp Webhook (Twilio)', value: `${backendBase}/api/webhooks/whatsapp/` },
  ];

  // Load all settings on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [adminData, metaData] = await Promise.all([
          apiFetch('/auth/settings'),
          apiFetch('/meta/settings').catch(() => null),
        ]);
        setUsername(adminData.username || '');
        setPassword(adminData.password || '');
        setIsCustom(adminData.is_custom || false);
        if (metaData) setMetaSettings(metaData);
      } catch (err: any) {
        adminMsg.show(err.message || 'Failed to load settings', true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch('/auth/settings', { method: 'POST', body: JSON.stringify({ username, password }) });
      setIsCustom(true);
      adminMsg.show('Admin credentials updated.');
    } catch (err: any) {
      adminMsg.show(err.message || 'Failed to save', true);
    } finally { setSaving(false); }
  };

  const handleResetAdmin = async () => {
    if (!confirm('Reset credentials to default?')) return;
    setResetting(true);
    try {
      await apiFetch('/auth/settings', { method: 'DELETE' });
      adminMsg.show('Reset to default credentials.');
      const d = await apiFetch('/auth/settings');
      setUsername(d.username); setPassword(d.password); setIsCustom(d.is_custom);
    } catch (err: any) {
      adminMsg.show(err.message || 'Failed to reset', true);
    } finally { setResetting(false); }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingMeta(true);
    try {
      await apiFetch('/meta/settings', { method: 'POST', body: JSON.stringify(metaSettings) });
      metaMsg.show('Meta credentials saved.');
    } catch (err: any) {
      metaMsg.show(err.message || 'Failed to save Meta settings', true);
    } finally { setSavingMeta(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#800000' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #800000, #F59E0B)' }}>
          <Sliders size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: '#800000' }}>Integration Hub</h1>
          <p className="text-gray-400 text-sm">Manage all credentials, API keys, and webhook connections</p>
        </div>
      </div>

      {/* ── 1. Webhook URLs (reference panel) ── */}
      <SectionCard icon={<Zap size={18} />} title="Webhook URLs" subtitle="Copy these into Meta Developers / Twilio console" badge="Reference Only">
        <div className="space-y-4">
          {webhookUrls.map(w => <CopyRow key={w.label} label={w.label} value={w.value} />)}
          <div className="flex items-center space-x-2 mt-2">
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer"
              className="flex items-center space-x-1 text-xs font-semibold hover:underline" style={{ color: '#1877F2' }}>
              <ExternalLink size={12} /><span>Open Meta Developers</span>
            </a>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Meta Integration ── */}
      <SectionCard icon={<Facebook size={18} />} title="Meta Integration" subtitle="Facebook Page & Instagram connected via Webhook">
        {metaMsg.msg && <Alert type="success" text={metaMsg.msg} />}
        {metaMsg.err && <Alert type="error" text={metaMsg.err} />}
        <form onSubmit={handleSaveMeta} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Facebook Page ID" value={metaSettings.page_id} onChange={v => setMetaSettings({ ...metaSettings, page_id: v })} placeholder="102938471234" />
            <Field label="Webhook Verify Token" value={metaSettings.verify_token} onChange={v => setMetaSettings({ ...metaSettings, verify_token: v })} placeholder="your_secure_token" mono />
          </div>
          <Field label="Page Access Token" value={metaSettings.access_token} onChange={v => setMetaSettings({ ...metaSettings, access_token: v })} placeholder="EAAx..." secret mono />
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={metaSettings.is_active} onChange={e => setMetaSettings({ ...metaSettings, is_active: e.target.checked })} />
              <span className="text-sm font-medium text-gray-700">Enable Lead Webhook</span>
            </label>
            <SaveButton loading={savingMeta} label="Save Meta" />
          </div>
        </form>
      </SectionCard>

      {/* ── 3. WhatsApp / Twilio ── */}
      <SectionCard icon={<Smartphone size={18} />} title="WhatsApp / Twilio" subtitle="Broadcast messaging via Twilio API">
        {twilioMsg.msg && <Alert type="success" text={twilioMsg.msg} />}
        {twilioMsg.err && <Alert type="error" text={twilioMsg.err} />}
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-xs text-gray-500 border border-dashed border-gray-200 bg-gray-50">
            ℹ️ Twilio credentials are set in your server <code className="font-mono font-bold">.env</code> file. Update them there and restart the server.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Account SID" value={twilio.account_sid} onChange={v => setTwilio({ ...twilio, account_sid: v })} placeholder="ACXXXXXXXX" mono />
            <Field label="WhatsApp Number" value={twilio.phone_number} onChange={v => setTwilio({ ...twilio, phone_number: v })} placeholder="+14155238886" mono />
          </div>
          <Field label="Auth Token" value={twilio.auth_token} onChange={v => setTwilio({ ...twilio, auth_token: v })} placeholder="your_auth_token" secret mono />
        </div>
      </SectionCard>

      {/* ── 4. Email / Brevo ── */}
      <SectionCard icon={<Mail size={18} />} title="Email / Brevo" subtitle="Transactional & campaign email via Brevo (formerly Sendinblue)">
        {brevoMsg.msg && <Alert type="success" text={brevoMsg.msg} />}
        {brevoMsg.err && <Alert type="error" text={brevoMsg.err} />}
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-xs text-gray-500 border border-dashed border-gray-200 bg-gray-50">
            ℹ️ Brevo credentials are set in your server <code className="font-mono font-bold">.env</code> file. Update them there and restart the server.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sender Email" value={brevo.sender_email} onChange={v => setBrevo({ ...brevo, sender_email: v })} placeholder="info@example.com" />
            <Field label="Brevo API Key" value={brevo.api_key} onChange={v => setBrevo({ ...brevo, api_key: v })} placeholder="xkeysib-..." secret mono />
          </div>
        </div>
      </SectionCard>

      {/* ── 5. Admin Credentials ── */}
      <SectionCard icon={<Key size={18} />} title="Admin Credentials" subtitle="Login username and password for the CRM"
        badge={isCustom ? 'Custom' : 'System Default'}>
        {adminMsg.msg && <Alert type="success" text={adminMsg.msg} />}
        {adminMsg.err && <Alert type="error" text={adminMsg.err} />}
        <form onSubmit={handleSaveAdmin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Admin Username" value={username} onChange={setUsername} placeholder="username" mono />
            <Field label="Admin Password" value={password} onChange={setPassword} placeholder="••••••••" secret mono />
          </div>
          <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
            {isCustom ? (
              <button type="button" onClick={handleResetAdmin} disabled={resetting}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                <Trash2 size={14} /><span>{resetting ? 'Resetting...' : 'Reset to Default'}</span>
              </button>
            ) : <div />}
            <SaveButton loading={saving} label="Save Credentials" />
          </div>
        </form>
      </SectionCard>
    </div>
  );
};

// ── Shared small components ────────────────────────────────────────────────

const Alert = ({ type, text }: { type: 'success' | 'error'; text: string }) => (
  <div className={`flex items-center space-x-2 p-3 rounded-xl text-sm font-medium mb-4 ${type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
    {type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
    <span>{text}</span>
  </div>
);

const SaveButton = ({ loading, label }: { loading: boolean; label: string }) => (
  <button type="submit" disabled={loading}
    className="flex items-center space-x-2 px-5 py-2 rounded-xl text-white font-bold text-sm transition shadow-sm disabled:opacity-70"
    style={{ background: 'linear-gradient(135deg, #800000, #a00000)' }}>
    <Save size={14} /><span>{loading ? 'Saving...' : label}</span>
  </button>
);
