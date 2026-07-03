import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Facebook, 
  Instagram,
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Eye,
  Copy,
  Check,
  Zap,
  MessageSquare,
  Users,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface MetaSettings {
  page_id: string;
  access_token: string;
  verify_token: string;
  is_active: boolean;
}

interface MetaLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interestedIn: string;
  notes: string;
  createdAt: string;
  source?: string;
  meta_lead_id?: string;
}

interface MetaDM {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  channel: string;
  platform_id?: string;
}

type TabId = 'leads' | 'messages' | 'settings';

export const Meta = () => {
  const [activeTab, setActiveTab] = useState<TabId>('leads');
  const [settings, setSettings] = useState<MetaSettings>({
    page_id: '',
    access_token: '',
    verify_token: '',
    is_active: false
  });
  
  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [dms, setDms] = useState<MetaDM[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const webhookUrl = `${window.location.origin.replace('5173', '8000')}/api/webhooks/meta/`;

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, leadsData, dmsData] = await Promise.all([
        apiFetch('/meta/settings'),
        apiFetch('/meta/leads'),
        apiFetch('/meta/dms'),
      ]);
      setSettings(settingsData);
      setLeads(leadsData);
      setDms(dmsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Meta integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await apiFetch('/meta/settings', { method: 'POST', body: JSON.stringify(settings) });
      setMessage('Meta credentials saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const fbDms = dms.filter(d => d.channel === 'Facebook DM');
  const igDms = dms.filter(d => d.channel === 'Instagram DM');
  const fbLeads = leads.filter(l => (l.source || '').toLowerCase().includes('facebook'));
  const igLeads = leads.filter(l => (l.source || '').toLowerCase().includes('instagram'));

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'leads', label: 'Lead Capture', icon: <Users size={16} />, count: leads.length },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={16} />, count: dms.length },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1877F2 0%, #E1306C 100%)' }}>
            <div className="flex items-center">
              <Facebook size={14} className="text-white" />
              <Instagram size={14} className="text-white ml-0.5" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold" style={{ color: '#800000' }}>Meta Integration</h1>
            <p className="text-gray-500 text-sm mt-0.5">Facebook & Instagram Lead Capture · Messaging · Webhook</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${settings.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
            {settings.is_active ? <CheckCircle size={13} /> : <XCircle size={13} />}
            <span>{settings.is_active ? 'Active' : 'Inactive'}</span>
          </span>
          <button onClick={loadData} disabled={loading} className="flex items-center space-x-2 px-4 py-2 rounded-xl border text-sm font-medium transition" style={{ borderColor: '#F59E0B', color: '#800000', backgroundColor: 'rgba(245,158,11,0.05)' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100 font-medium flex items-center space-x-2"><CheckCircle size={16} /><span>{message}</span></div>}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium flex items-center space-x-2"><XCircle size={16} /><span>{error}</span></div>}

      {/* Tab Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-red-800 text-red-800 bg-red-50 bg-opacity-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={activeTab === tab.id ? { borderBottomColor: '#800000', color: '#800000' } : {}}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-red-800 text-white' : 'bg-gray-100 text-gray-500'}`}
                  style={activeTab === tab.id ? { backgroundColor: '#800000' } : {}}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ================================================================
            TAB 1: LEAD CAPTURE LOG
        ================================================================ */}
        {activeTab === 'leads' && (
          <div className="p-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <StatBadge color="#1877F2" icon={<Facebook size={16} />} label="Facebook Leads" value={fbLeads.length} />
              <StatBadge color="#E1306C" icon={<Instagram size={16} />} label="Instagram Leads" value={igLeads.length} />
              <StatBadge color="#800000" icon={<Zap size={16} />} label="Total Captured" value={leads.length} className="col-span-2 sm:col-span-1" />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {leads.length === 0 ? (
                <EmptyState 
                  icon={<Users size={32} />} 
                  title="No Meta Leads Yet" 
                  description="Once your webhook is live and a user submits a Facebook/Instagram Lead Ad form, it will appear here automatically." 
                />
              ) : (
                leads.map(lead => (
                  <div key={lead.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-bold text-gray-800 text-sm">{lead.name}</span>
                        <SourceBadge source={lead.source || 'Facebook Ads'} />
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        {lead.email && <span>📧 {lead.email}</span>}
                        {lead.phone && <span>📞 {lead.phone}</span>}
                        {lead.interestedIn && <span>💎 {lead.interestedIn}</span>}
                      </div>
                      {lead.notes && <p className="text-xs text-gray-400 italic truncate max-w-sm">{lead.notes}</p>}
                    </div>
                    <div className="flex md:flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-gray-400 font-medium">{new Date(lead.createdAt).toLocaleString()}</span>
                      <button 
                        onClick={() => setSelectedPayload(lead)}
                        className="flex items-center space-x-1 text-xs font-semibold hover:underline"
                        style={{ color: '#F59E0B' }}
                      >
                        <Eye size={12} /><span>Raw Data</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 2: MESSAGES (FB + IG side by side)
        ================================================================ */}
        {activeTab === 'messages' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facebook DMs */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1877F2' }}>
                    <Facebook size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Facebook Messages</h4>
                    <p className="text-xs text-gray-400">{fbDms.length} conversations</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {fbDms.length === 0 ? (
                    <EmptyState icon={<Facebook size={24} />} title="No Facebook Messages" description="Incoming Messenger DMs will appear here in real time." small />
                  ) : (
                    fbDms.map(dm => <MessageBubble key={dm.id} dm={dm} />)
                  )}
                </div>
              </div>

              {/* Instagram DMs */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                    <Instagram size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Instagram Messages</h4>
                    <p className="text-xs text-gray-400">{igDms.length} conversations</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {igDms.length === 0 ? (
                    <EmptyState icon={<Instagram size={24} />} title="No Instagram Messages" description="Incoming Instagram DMs will appear here once your webhook is connected." small />
                  ) : (
                    igDms.map(dm => <MessageBubble key={dm.id} dm={dm} />)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 3: SETTINGS
        ================================================================ */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Credentials Form */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <Settings size={16} className="text-amber-500" />
                  <span>API Credentials</span>
                </h3>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <FormField label="Facebook Page ID" value={settings.page_id} onChange={v => setSettings({ ...settings, page_id: v })} placeholder="e.g. 102938471234" />
                  <FormField label="Page Access Token" value={settings.access_token} onChange={v => setSettings({ ...settings, access_token: v })} placeholder="EAAx..." isPassword />
                  <FormField label="Webhook Verify Token" value={settings.verify_token} onChange={v => setSettings({ ...settings, verify_token: v })} placeholder="your_secure_verify_token" />
                  
                  <div className="flex items-center space-x-2 pt-1">
                    <input id="is_active_meta" type="checkbox" className="rounded" checked={settings.is_active} onChange={e => setSettings({ ...settings, is_active: e.target.checked })} />
                    <label htmlFor="is_active_meta" className="text-sm font-medium text-gray-700">Enable Leadgen Webhooks</label>
                  </div>

                  <button type="submit" className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition" style={{ backgroundColor: '#800000' }}>
                    Save Credentials
                  </button>
                </form>
              </div>

              {/* Webhook URL + Setup Guide */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Zap size={16} className="text-amber-500" />
                    <span>Webhook URL</span>
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">Paste this URL in your Meta Developers App → Webhooks section:</p>
                  <div className="flex items-center space-x-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
                    <code className="text-xs text-gray-700 flex-1 truncate font-mono">{webhookUrl}</code>
                    <button onClick={copyWebhookUrl} className="p-1.5 rounded-lg transition shrink-0" style={{ backgroundColor: copiedUrl ? '#dcfce7' : '#fef3c7', color: copiedUrl ? '#16a34a' : '#92400e' }}>
                      {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Setup Checklist */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                    <ExternalLink size={16} className="text-amber-500" />
                    <span>Meta Developer Setup Guide</span>
                  </h3>
                  <div className="space-y-2">
                    {[
                      { step: '1', text: 'Go to developers.facebook.com → Your App → Webhooks' },
                      { step: '2', text: 'Paste the Webhook URL above and your Verify Token' },
                      { step: '3', text: 'Subscribe to: leadgen, messages, messaging_postbacks' },
                      { step: '4', text: 'For Instagram: Subscribe under Instagram → Webhooks → messages' },
                      { step: '5', text: 'Add your Page Access Token in credentials above' },
                    ].map(item => (
                      <div key={item.step} className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <div className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: '#800000' }}>{item.step}</div>
                        <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raw Payload Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-lg" style={{ color: '#800000' }}>Lead Data</h4>
              <button onClick={() => setSelectedPayload(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto max-h-96">{JSON.stringify(selectedPayload, null, 2)}</pre>
            <div className="flex justify-end">
              <button onClick={() => setSelectedPayload(null)} className="text-white font-semibold px-5 py-2 rounded-xl text-sm" style={{ backgroundColor: '#800000' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Helper Components ────────────────────────────────────────────────────────

const StatBadge = ({ color, icon, label, value, className = '' }: { color: string; icon: React.ReactNode; label: string; value: number; className?: string }) => (
  <div className={`p-4 rounded-xl border flex items-center space-x-3 ${className}`} style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: color }}>{icon}</div>
    <div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

const SourceBadge = ({ source }: { source: string }) => {
  const isFb = source.toLowerCase().includes('facebook');
  return (
    <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-bold text-white"
      style={{ backgroundColor: isFb ? '#1877F2' : '#E1306C' }}>
      {isFb ? <Facebook size={10} /> : <Instagram size={10} />}
      <span>{source}</span>
    </span>
  );
};

const MessageBubble = ({ dm }: { dm: MetaDM }) => (
  <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition-all">
    <div className="flex justify-between items-start">
      <p className="text-xs font-bold text-gray-700 font-mono">{dm.from}</p>
      <span className="text-xs text-gray-400">{new Date(dm.timestamp).toLocaleTimeString()}</span>
    </div>
    <p className="text-sm text-gray-700 mt-1">{dm.body}</p>
  </div>
);

const EmptyState = ({ icon, title, description, small = false }: { icon: React.ReactNode; title: string; description: string; small?: boolean }) => (
  <div className={`flex flex-col items-center justify-center text-center ${small ? 'p-8' : 'p-12'}`}>
    <div className="text-gray-200 mb-3">{icon}</div>
    <h5 className="font-bold text-gray-600 text-sm">{title}</h5>
    <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed">{description}</p>
  </div>
);

const FormField = ({ label, value, onChange, placeholder, isPassword = false }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; isPassword?: boolean }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? 'password' : 'text'}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none transition text-sm bg-gray-50 focus:bg-white focus:ring-2"
          style={{ '--tw-ring-color': 'rgba(245,158,11,0.4)' } as React.CSSProperties}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </div>
  );
};
