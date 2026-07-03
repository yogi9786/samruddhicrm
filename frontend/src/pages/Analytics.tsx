import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import { RefreshCw, TrendingUp, Compass, Gem, Share2, Camera } from 'lucide-react';

interface ChartItem { name: string; value: number; }
interface TrendItem { date: string; leads: number; }

const PALETTE = ['#800000', '#F59E0B', '#1877F2', '#E1306C', '#F97316', '#8b5cf6', '#16a34a'];

export const Analytics = () => {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [sources, setSources] = useState<ChartItem[]>([]);
  const [services, setServices] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/analytics/summary');
      setTrends(data.trends);
      setSources(data.sources);
      setServices(data.services);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Derived: Meta vs non-Meta
  const metaTotal = sources.filter(s => s.name === 'Facebook Ads' || s.name === 'Instagram Ads').reduce((sum, s) => sum + s.value, 0);
  const manualTotal = sources.filter(s => s.name !== 'Facebook Ads' && s.name !== 'Instagram Ads').reduce((sum, s) => sum + s.value, 0);
  const metaSplit = [
    { name: 'Facebook Ads', value: sources.find(s => s.name === 'Facebook Ads')?.value || 0 },
    { name: 'Instagram Ads', value: sources.find(s => s.name === 'Instagram Ads')?.value || 0 },
    { name: 'Manual / Other', value: manualTotal },
  ];
  const metaColors = ['#1877F2', '#E1306C', '#800000'];

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="h-7 w-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded-xl animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="h-8 w-16 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-3 w-28 bg-gray-100 rounded-xl animate-pulse mt-2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: '#800000' }}>Business Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Deep insights into lead channels, product interests & Meta ad performance</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border"
          style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#800000', backgroundColor: 'rgba(245,158,11,0.05)' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
          <p className="text-red-600 text-sm font-bold">⚠ API Connection Error</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <p className="text-red-400 text-xs mt-1">Make sure the backend server is running: <code className="bg-red-100 px-1 rounded">run_backend.bat</code></p>
        </div>
      )}

      {/* Meta Lead Source KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetaKPI icon={<Share2 size={18} />} label="Facebook Ad Leads" value={sources.find(s => s.name === 'Facebook Ads')?.value || 0} color="#1877F2" />
        <MetaKPI icon={<Camera size={18} />} label="Instagram Ad Leads" value={sources.find(s => s.name === 'Instagram Ads')?.value || 0} color="#E1306C" />
        <MetaKPI icon={<TrendingUp size={18} />} label="Total Meta Leads" value={metaTotal} color="#800000" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lead Growth Trend */}
        <ChartCard icon={<TrendingUp size={18} />} iconBg="#fff1f2" iconColor="#800000" title="Lead Growth Trend" subtitle="Monthly breakdown of acquired leads">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px' }} />
              <Line type="monotone" dataKey="leads" stroke="#800000" strokeWidth={3} dot={{ fill: '#800000', r: 4 }} activeDot={{ r: 7 }} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Product / Scheme Interest */}
        <ChartCard icon={<Gem size={18} />} iconBg="#fffbeb" iconColor="#F59E0B" title="Product / Scheme Interest" subtitle="Leads grouped by jewelry or savings program interest">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={services} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px' }} />
              <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]}>
                {services.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Acquisition Channel Breakdown (Pie) */}
        <ChartCard icon={<Compass size={18} />} iconBg="#fff7ed" iconColor="#F97316" title="Acquisition Channel Breakdown" subtitle="Lead share by source: Walk-in, WhatsApp, Meta, Referral">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sources} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {sources.map((_, index) => <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {sources.map((source, index) => {
                const total = sources.reduce((s, i) => s + i.value, 0);
                const pct = total > 0 ? ((source.value / total) * 100).toFixed(1) : '0';
                return (
                  <div key={source.name} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE[index % PALETTE.length] }} />
                      <span className="text-xs font-medium text-gray-700">{source.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-800">{source.value}</span>
                      <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>

        {/* Meta vs Manual (NEW chart) */}
        <ChartCard icon={<Share2 size={18} />} iconBg="#eff6ff" iconColor="#1877F2" title="Meta vs Manual Leads" subtitle="Facebook Ads vs Instagram Ads vs Walk-in/Other">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={metaSplit} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {metaSplit.map((_, index) => <Cell key={`mc-${index}`} fill={metaColors[index]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {metaSplit.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: `${metaColors[index]}30`, backgroundColor: `${metaColors[index]}08` }}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metaColors[index] }} />
                    <span className="text-xs font-semibold" style={{ color: metaColors[index] }}>{item.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: metaColors[index] }}>{item.value}</span>
                </div>
              ))}
              <div className="text-center mt-2">
                <p className="text-xs text-gray-400">Meta captures <strong className="text-gray-600">{metaTotal}</strong> of total {metaTotal + manualTotal} leads</p>
              </div>
            </div>
          </div>
        </ChartCard>

      </div>
    </div>
  );
};

// ─── Helper components ─────────────────────────────────────────────────────

const MetaKPI = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

const ChartCard = ({ icon, iconBg, iconColor, title, subtitle, children }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; title: string; subtitle: string; children: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
    <div className="flex items-center space-x-3">
      <div className="p-2.5 rounded-xl" style={{ backgroundColor: iconBg, color: iconColor }}>{icon}</div>
      <div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);
