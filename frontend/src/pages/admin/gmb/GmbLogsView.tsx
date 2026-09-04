import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, RefreshCw, CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbLogsViewProps {
  token: string;
  defaultChannel?: 'whatsapp' | 'email';
}

export const GmbLogsView: React.FC<GmbLogsViewProps> = ({ token, defaultChannel = 'whatsapp' }) => {
  const [channel, setChannel] = useState<'whatsapp' | 'email'>(defaultChannel);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    const endpoint = channel === 'whatsapp' ? '/gmb/admin/logs/whatsapp' : '/gmb/admin/logs/email';

    fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [channel, token]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {channel === 'whatsapp' ? 'AiSensy WhatsApp Logs' : 'Brevo Email Logs'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Audit logs of pass links & PDF notifications dispatched to attendees
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-2xl shadow-xs">
            <button
              onClick={() => setChannel('whatsapp')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                channel === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone size={13} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setChannel('email')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                channel === 'email'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail size={13} />
              <span>Email</span>
            </button>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs shadow-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-purple-600' : ''} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#F8FAFC] text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-4">Recipient</th>
                <th className="px-4 py-4">Destination</th>
                <th className="px-4 py-4">{channel === 'whatsapp' ? 'Template / Campaign' : 'Subject'}</th>
                <th className="px-4 py-4">Timestamp</th>
                <th className="px-4 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="font-medium text-xs">Loading logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">No communication records logged yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Dispatched WhatsApp and Email receipts will appear here.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* Recipient */}
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {log.attendee_name || 'Delegate'}
                    </td>

                    {/* Destination */}
                    <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                      {channel === 'whatsapp' ? `+91 ${log.mobile}` : log.email}
                    </td>

                    {/* Template / Subject */}
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      {channel === 'whatsapp' ? (log.template_name || 'gmb_event_pass') : (log.subject || 'Event Pass')}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        log.status === 'SENT' || log.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.status === 'SENT' || log.status === 'DELIVERED' ? '✓ DELIVERED' : log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
