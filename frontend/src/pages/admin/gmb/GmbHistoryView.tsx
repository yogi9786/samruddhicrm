import React, { useState, useEffect } from 'react';
import { CheckCircle2, Gift, RefreshCw, Calendar, Clock, User, Shield } from 'lucide-react';
import { getApiBaseUrl } from '../../../utils/api';

const API_URL = getApiBaseUrl();

interface GmbHistoryViewProps {
  token: string;
  defaultTab?: 'entry' | 'gift';
}

export const GmbHistoryView: React.FC<GmbHistoryViewProps> = ({ token, defaultTab = 'entry' }) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'gift'>(defaultTab);
  const [entryLogs, setEntryLogs] = useState<any[]>([]);
  const [giftLogs, setGiftLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    const endpoint = activeTab === 'entry' ? '/gmb/admin/history/entry' : '/gmb/admin/history/gift';

    fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (activeTab === 'entry') setEntryLogs(Array.isArray(data) ? data : []);
        else setGiftLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab, token]);

  const items = activeTab === 'entry' ? entryLogs : giftLogs;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-serif tracking-wide">
            {activeTab === 'entry' ? 'Gate Check-In History' : 'Gift Distribution History'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logs of all scanned attendees, checkpoints & staff verifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'entry'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gate Scans
            </button>
            <button
              onClick={() => setActiveTab('gift')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'gift'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gift Redemptions
            </button>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Attendee</th>
                <th className="px-4 py-3.5">Emp ID</th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-4 py-3.5">{activeTab === 'entry' ? 'Gate Point' : 'Gift Type & Counter'}</th>
                <th className="px-4 py-3.5">Verified By Staff</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No scan records found in history.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Attendee */}
                    <td className="px-4 py-3.5 font-semibold text-white">
                      {item.attendee_name || 'Delegate'}
                    </td>

                    {/* Emp ID */}
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                      {item.employee_id}
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5 text-slate-300">
                      {item.branch_name}
                    </td>

                    {/* Gate or Gift Detail */}
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      {activeTab === 'entry' ? (
                        <span>{item.gate_name || 'Main Gate'}</span>
                      ) : (
                        <div>
                          <p className="text-amber-300">{item.gift_name}</p>
                          <p className="text-[10px] text-slate-500">{item.counter_name}</p>
                        </div>
                      )}
                    </td>

                    {/* Staff */}
                    <td className="px-4 py-3.5 text-slate-300">
                      {item.staff_name || item.staff_id || 'Staff'}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {item.scanned_at || item.redeemed_at ? (
                        new Date(item.scanned_at || item.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      ) : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                        ✓ SUCCESS
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
