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
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-serif tracking-wide">
            {channel === 'whatsapp' ? 'AiSensy WhatsApp Logs' : 'Brevo Email Logs'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logs of pass links & PDF notifications dispatched to attendees
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setChannel('whatsapp')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                channel === 'whatsapp'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone size={13} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setChannel('email')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                channel === 'email'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail size={13} />
              <span>Email</span>
            </button>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Destination</th>
                <th className="px-4 py-3.5">{channel === 'whatsapp' ? 'Template / Campaign' : 'Subject'}</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No communication records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Recipient */}
                    <td className="px-4 py-3.5 font-semibold text-white">
                      {log.attendee_name || 'Delegate'}
                    </td>

                    {/* Destination */}
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {channel === 'whatsapp' ? `+91 ${log.mobile}` : log.email}
                    </td>

                    {/* Template / Subject */}
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {channel === 'whatsapp' ? (log.template_name || 'gmb_event_pass') : (log.subject || 'Event Pass')}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        log.status === 'SENT' || log.status === 'DELIVERED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.status}
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
