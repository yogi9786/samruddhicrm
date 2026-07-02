import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { 
  Mail, 
  Settings, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText
} from 'lucide-react';

interface EmailSettings {
  api_key: string;
  sender_email: string;
  sender_name: string;
  is_active: boolean;
}

interface SMTPLog {
  id: string;
  to_email: string;
  subject: string;
  timestamp: string;
  status: string;
  opens: number;
  clicks: number;
  error?: string;
}

export const Email = () => {
  const [settings, setSettings] = useState<EmailSettings>({
    api_key: '',
    sender_email: '',
    sender_name: '',
    is_active: false
  });
  
  const [logs, setLogs] = useState<SMTPLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Email Composer Form
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      setAttachment(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64Str = reader.result.split(',')[1];
          setAttachmentBase64(base64Str);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsData = await apiFetch('/email/settings');
      setSettings(settingsData);
      const logsData = await apiFetch('/email/logs');
      setLogs(logsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Email integration data');
    } finally {
      setLoading(false);
    }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
    const toParam = searchParams.get('to');
    if (toParam) {
      setToEmail(toParam);
    }
  }, [searchParams]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await apiFetch('/email/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      setMessage('Brevo API credentials saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSending(true);

    const isBulk = toEmail.includes(',');

    try {
      if (isBulk) {
        const emails = toEmail.split(',').map(em => em.trim()).filter(em => em.length > 0);
        if (emails.length === 0) {
          setError('No valid recipient emails found.');
          setSending(false);
          return;
        }
        await apiFetch('/email/send-bulk', {
          method: 'POST',
          body: JSON.stringify({
            to_emails: emails,
            subject,
            body,
            attachment_name: attachment?.name || null,
            attachment_content: attachmentBase64 || null
          })
        });
        setMessage(`Bulk email campaign successfully sent to ${emails.length} recipients! Check logs.`);
      } else {
        await apiFetch('/email/send', {
          method: 'POST',
          body: JSON.stringify({ 
            to_email: toEmail, 
            subject, 
            body,
            attachment_name: attachment?.name || null,
            attachment_content: attachmentBase64 || null
          })
        });
        setMessage(`Email successfully sent to ${toEmail}! Check logs.`);
      }

      setToEmail('');
      setSubject('');
      setBody('');
      setAttachment(null);
      setAttachmentBase64(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh logs
      const logsData = await apiFetch('/email/logs');
      setLogs(logsData);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Delivered</span>;
      case 'Opened':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">Opened</span>;
      case 'Bounced':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">Bounced</span>;
      case 'Failed':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 rounded">Failed</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-250 rounded">Sent</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center">
            <Mail size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-brand-maroon">Email Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">Connect SMTP via Brevo API and monitor live delivery statuses</p>
          </div>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Sync Status</span>
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
        
        {/* Left column: credentials & composition */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Credentials panel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Settings size={20} className="text-brand-gold" />
                <h3 className="font-bold text-gray-800 font-serif text-lg">Brevo Settings</h3>
              </div>
              <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${
                settings.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}>
                {settings.is_active ? (
                  <>
                    <CheckCircle size={12} className="text-emerald-600" />
                    <span>Active</span>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Brevo API Key</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                  placeholder="xkeysib-..."
                  value={settings.api_key}
                  onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sender Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                  placeholder="info@sirisamruddhi.com"
                  value={settings.sender_email}
                  onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sender Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                  placeholder="Sirisamruddhi Gold Palace"
                  value={settings.sender_name}
                  onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="is_active_email"
                  type="checkbox"
                  className="h-4.5 w-4.5 text-brand-maroon focus:ring-brand-gold border-gray-300 rounded"
                  checked={settings.is_active}
                  onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                />
                <label htmlFor="is_active_email" className="text-sm font-medium text-gray-700">
                  Enable SMTP Delivery
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-brand-maroon text-white font-bold py-2.5 rounded-xl hover:bg-opacity-95 transition-colors shadow-sm text-sm"
              >
                Save Brevo Config
              </button>
            </form>
          </div>

        </div>

        {/* Right side: Composer & Live Logs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Email Composer */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-800 font-serif text-lg border-b border-gray-100 pb-3">Send Transactional Mail</h3>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                    placeholder="client@example.com"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50"
                    placeholder="Quotation / Festive Offer"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message Body (HTML Supported)</label>
                <textarea
                  className="w-full min-h-[120px] p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition text-sm bg-gray-50 focus:bg-white resize-none"
                  placeholder="Dear Valued Customer, <br/> Thank you for visiting..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>

              {/* Attachments UI */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
              />
              <div className="border-2 border-dashed border-gray-200 p-4 rounded-xl flex items-center justify-between text-xs text-gray-400 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-brand-gold" />
                  {attachment ? (
                    <span className="text-gray-700 font-medium">Selected: <strong className="text-brand-maroon">{attachment.name}</strong> ({(attachment.size / 1024 / 1024).toFixed(2)} MB)</span>
                  ) : (
                    <span>Optional attachments (PDF, Images, Word docs, max 5MB)</span>
                  )}
                </div>
                {attachment ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      setAttachment(null);
                      setAttachmentBase64(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }} 
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                ) : (
                  <span 
                    onClick={() => fileInputRef.current?.click()} 
                    className="font-semibold text-brand-maroon cursor-pointer hover:underline"
                  >
                    Select File
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 bg-brand-maroon text-white font-bold rounded-2xl hover:bg-opacity-95 transition-all shadow-md flex justify-center items-center space-x-2 disabled:opacity-75"
              >
                <Send size={18} />
                <span>{sending ? 'Sending transactional mail...' : 'Send Transactional Mail'}</span>
              </button>
            </form>
          </div>

          {/* Delivery Logs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col max-h-[350px]">
            <div className="border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-800 font-serif text-lg">SMTP Live Delivery Logs</h3>
              <p className="text-gray-500 text-xs mt-0.5">Real-time webhook updates from Brevo email dispatchers</p>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1">
              {logs.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-800">{log.to_email}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <p className="text-gray-500 font-medium truncate max-w-[250px]">{log.subject}</p>
                    {log.error && <p className="text-red-500 text-[10px] italic">Error: {log.error}</p>}
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 text-[11px] text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>
                      <span>Opens: <strong className="text-gray-700">{log.opens}</strong></span>
                      <span className="ml-2">Clicks: <strong className="text-gray-700">{log.clicks}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
