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
    <div className="space-y-6 font-sans">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {activeTab === 'entry' ? 'Gate Check-In History' : 'Gift Distribution History'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Audit logs of all scanned attendees, checkpoints & staff verifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-2xl shadow-xs">
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'entry'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gate Scans
            </button>
            <button
              onClick={() => setActiveTab('gift')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gift'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gift Redemptions
            </button>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs shadow-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-purple-600' : ''} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#F8FAFC] text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-4">Attendee</th>
                <th className="px-4 py-4">Emp ID</th>
                <th className="px-4 py-4">Branch</th>
                <th className="px-4 py-4">{activeTab === 'entry' ? 'Gate Point' : 'Gift Type & Counter'}</th>
                <th className="px-4 py-4">Verified By Staff</th>
                <th className="px-4 py-4">Timestamp</th>
                <th className="px-4 py-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="font-medium text-xs">Loading audit trail...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">No scan records found in history</p>
                    <p className="text-xs text-slate-400 mt-0.5">Scanned checkpoints will appear here in real-time.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* Attendee */}
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {item.attendee_name || 'Delegate'}
                    </td>

                    {/* Emp ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg text-xs">
                        {item.employee_id}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5 text-slate-800 font-semibold">
                      {item.branch_name}
                    </td>

                    {/* Gate or Gift Detail */}
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {activeTab === 'entry' ? (
                        <span>{item.gate_name || 'Main Gate'}</span>
                      ) : (
                        <div>
                          <p className="text-purple-800 font-bold">{item.gift_name}</p>
                          <p className="text-[10px] text-slate-500">{item.counter_name}</p>
                        </div>
                      )}
                    </td>

                    {/* Staff */}
                    <td className="px-4 py-3.5 text-slate-700">
                      {item.staff_name || item.staff_id || 'Staff'}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                      {item.scanned_at || item.redeemed_at ? (
                        new Date(item.scanned_at || item.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      ) : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-xs">
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
