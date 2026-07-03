import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { 
  MessageSquare, 
  Settings, 
  Plus, 
  RefreshCw, 
  Send, 
  ListPlus,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface WhatsAppSettings {
  account_sid: string;
  auth_token: string;
  phone_number: string;
  is_active: boolean;
}

interface WATemplate {
  id: string;
  name: string;
  body: string;
  category: string;
}

export const WhatsApp = () => {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    account_sid: '',
    auth_token: '',
    phone_number: '',
    is_active: false
  });
  
  const [templates, setTemplates] = useState<WATemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Bulk Broadcast States
  const [recipients, setRecipients] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // New Template Form States
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplBody, setNewTplBody] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('marketing');

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsData = await apiFetch('/whatsapp/settings');
      setSettings(settingsData);
      const templatesData = await apiFetch('/whatsapp/templates');
      setTemplates(templatesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load WhatsApp data');
    } finally {
      setLoading(false);
    }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
    const toParam = searchParams.get('to');
    if (toParam) {
      setRecipients(toParam.replace(/,/g, '\n'));
    }
  }, [searchParams]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await apiFetch('/whatsapp/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      setMessage('Twilio WhatsApp configuration saved.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await apiFetch('/whatsapp/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: newTplName,
          body: newTplBody,
          category: newTplCategory
        })
      });
      setMessage('WhatsApp Template created successfully.');
      setNewTplName('');
      setNewTplBody('');
      setShowAddTemplate(false);
      
      // reload templates
      const templatesData = await apiFetch('/whatsapp/templates');
      setTemplates(templatesData);
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setBroadcasting(true);

    const numbers = recipients
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (numbers.length === 0) {
      setError('Please enter at least one valid recipient phone number.');
      setBroadcasting(false);
      return;
    }

    try {
      await apiFetch('/whatsapp/send-bulk', {
        method: 'POST',
        body: JSON.stringify({
          to_numbers: numbers,
          body: broadcastBody
        })
      });
      setMessage(`Broadcast processed! Dispatched messages to ${numbers.length} recipients.`);
      setRecipients('');
      setBroadcastBody('');
    } catch (err: any) {
      setError(err.message || 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  const selectTemplate = (body: string) => {
    setBroadcastBody(body);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageSquare size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-brand-maroon">WhatsApp Broadcast</h1>
            <p className="text-gray-500 text-sm mt-1">Configure Twilio API gateway and run bulk WhatsApp campaigns</p>
          </div>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Sync Settings</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100 font-medium">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
          <p className="text-red-600 text-sm font-bold">⚠ API Connection Error</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <p className="text-red-400 text-xs mt-1">Make sure the backend server is running: <code className="bg-red-100 px-1 rounded">run_backend.bat</code></p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Settings & Template List */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Credentials Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Settings size={20} className="text-brand-gold" />
                <h3 className="font-bold text-gray-800 font-serif text-lg">Twilio Credentials</h3>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Twilio Account SID</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                  placeholder="AC..."
                  value={settings.account_sid}
                  onChange={(e) => setSettings({ ...settings, account_sid: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Twilio Auth Token</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                  placeholder="Enter Auth Token"
                  value={settings.auth_token}
                  onChange={(e) => setSettings({ ...settings, auth_token: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                  placeholder="+14155238886"
                  value={settings.phone_number}
                  onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="is_active_wa"
                  type="checkbox"
                  className="h-4.5 w-4.5 text-brand-maroon focus:ring-brand-gold border-gray-300 rounded"
                  checked={settings.is_active}
                  onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                />
                <label htmlFor="is_active_wa" className="text-sm font-medium text-gray-700">
                  Activate WhatsApp Dispatch
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-brand-maroon text-white font-bold py-2.5 rounded-xl hover:bg-opacity-95 transition-colors shadow-sm text-sm"
              >
                Save Twilio Config
              </button>
            </form>
          </div>

          {/* Templates Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-800 font-serif text-lg">Templates</h3>
              <button 
                onClick={() => setShowAddTemplate(!showAddTemplate)}
                className="p-1.5 rounded-lg bg-brand-cream text-brand-maroon border border-brand-gold border-opacity-25 hover:bg-brand-maroon hover:text-white transition"
              >
                <Plus size={16} />
              </button>
            </div>

            {showAddTemplate && (
              <form onSubmit={handleCreateTemplate} className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3 animate-fadeIn">
                <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wide">New Template</h5>
                <div>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-gray-250 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-brand-gold"
                    placeholder="Template Name"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <textarea
                    className="w-full px-3 py-1.5 border border-gray-250 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-brand-gold"
                    placeholder="Template body..."
                    rows={3}
                    value={newTplBody}
                    onChange={(e) => setNewTplBody(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Use {"{{name}}"} for customer tags.</p>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <select 
                    className="px-2 py-1 bg-white border border-gray-250 rounded text-xs outline-none"
                    value={newTplCategory}
                    onChange={(e) => setNewTplCategory(e.target.value)}
                  >
                    <option value="marketing">Marketing</option>
                    <option value="utility">Utility</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-brand-maroon text-white font-bold px-3 py-1 rounded text-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3 overflow-y-auto max-h-60 pr-1">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between items-start gap-2">
                  <div>
                    <span className="font-bold text-xs text-gray-800">{tpl.name}</span>
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-brand-gold border border-brand-gold border-opacity-30 rounded-full capitalize">{tpl.category}</span>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{tpl.body}</p>
                  </div>
                  <button 
                    onClick={() => selectTemplate(tpl.body)}
                    className="text-[10px] font-bold text-brand-maroon hover:underline flex items-center space-x-1"
                  >
                    <span>Use Template</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Bulk Broadcast Console */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[650px]">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h3 className="font-bold text-gray-800 font-serif text-lg">Campaign Workspace</h3>
            <p className="text-gray-500 text-xs mt-0.5">Send a personalized message broadcast to multiple prospects</p>
          </div>

          <form onSubmit={handleBroadcast} className="flex-grow flex flex-col gap-6">
            
            <div className="space-y-2 flex-grow flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <ListPlus size={16} className="text-brand-gold" />
                <span>Recipient Numbers (One per line)</span>
              </label>
              <textarea
                className="w-full flex-1 min-h-[150px] p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white resize-none"
                placeholder="+919876543210&#10;+918765432109&#10;+917654321098"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <MessageSquare size={16} className="text-brand-gold" />
                <span>Message Body</span>
              </label>
              <textarea
                className="w-full min-h-[150px] p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white resize-none"
                placeholder="Type your broadcast message or click 'Use Template' on the left."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-3.5 bg-brand-maroon text-white font-bold rounded-2xl hover:bg-opacity-95 transition-all shadow-md flex justify-center items-center space-x-2 disabled:opacity-75"
            >
              <Send size={18} />
              <span>{broadcasting ? 'Dispatching Campaign...' : 'Send Broadcast Campaign'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
