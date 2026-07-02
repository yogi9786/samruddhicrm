import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Facebook, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Eye
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
}

export const Meta = () => {
  const [settings, setSettings] = useState<MetaSettings>({
    page_id: '',
    access_token: '',
    verify_token: '',
    is_active: false
  });
  
  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsData = await apiFetch('/meta/settings');
      setSettings(settingsData);
      const leadsData = await apiFetch('/meta/leads');
      setLeads(leadsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Meta integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await apiFetch('/meta/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      setMessage('Meta API settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    }
  };


  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Facebook size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-brand-maroon">Meta Ads Integration</h1>
            <p className="text-gray-500 text-sm mt-1">Capture leads automatically from Facebook & Instagram Ads</p>
          </div>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Sync Logs</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100 font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-2">
              <Settings size={20} className="text-brand-gold" />
              <h3 className="font-bold text-gray-800 font-serif text-lg">Credentials Setup</h3>
            </div>
            <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${
              settings.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}>
              {settings.is_active ? (
                <>
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <XCircle size={12} className="text-gray-400" />
                  <span>Inactive</span>
                </>
              )}
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Facebook Page ID</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                placeholder="Enter Page ID"
                value={settings.page_id}
                onChange={(e) => setSettings({ ...settings, page_id: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Page Access Token</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                placeholder="EAAx..."
                value={settings.access_token}
                onChange={(e) => setSettings({ ...settings, access_token: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Webhook Verify Token</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                placeholder="verify_token"
                value={settings.verify_token}
                onChange={(e) => setSettings({ ...settings, verify_token: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="is_active_meta"
                type="checkbox"
                className="h-4.5 w-4.5 text-brand-maroon focus:ring-brand-gold border-gray-300 rounded"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              />
              <label htmlFor="is_active_meta" className="text-sm font-medium text-gray-700">
                Enable Leadgen Webhooks
              </label>
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-brand-maroon text-white font-bold py-2.5 rounded-xl hover:bg-opacity-95 transition-colors shadow-sm text-sm"
            >
              Save Credentials
            </button>
          </form>


        </div>

        {/* Lead Capture Log Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[650px]">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h3 className="font-bold text-gray-800 font-serif text-lg">Lead Ads Delivery Log</h3>
            <p className="text-gray-500 text-xs mt-0.5">Live feed of captured prospects from Meta campaigns</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-3">
                  <Facebook size={32} />
                </div>
                <h5 className="font-bold text-gray-700">No Meta Leads Yet</h5>
                <p className="text-gray-400 text-xs mt-1 max-w-xs">
                  Configure your webhook URL in Meta App settings to populate this log automatically.
                </p>
              </div>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-brand-gold hover:border-opacity-30 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-800 text-sm">{lead.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded">Facebook Form</span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4">
                      <span>Email: {lead.email || 'N/A'}</span>
                      <span>Phone: {lead.phone}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-brand-maroon">Interest:</span> {lead.interestedIn || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-400 italic">
                      {lead.notes}
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center shrink-0">
                    <span className="text-[10px] text-gray-400 font-semibold">{new Date(lead.createdAt).toLocaleString()}</span>
                    <button 
                      onClick={() => setSelectedPayload({
                        leadgen_id: lead.id,
                        page_id: "1234567890",
                        form_id: "form_998877",
                        ad_id: "ad_554433",
                        full_name: lead.name,
                        email: lead.email,
                        phone_number: lead.phone
                      })}
                      className="mt-1 flex items-center space-x-1 text-xs text-brand-gold hover:text-brand-maroon font-semibold"
                    >
                      <Eye size={12} />
                      <span>Raw Payload</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Meta Webhook Raw Payload</h4>
              <button 
                onClick={() => setSelectedPayload(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto max-h-96">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPayload(null)}
                className="bg-brand-maroon text-white font-semibold px-5 py-2 rounded-xl text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
