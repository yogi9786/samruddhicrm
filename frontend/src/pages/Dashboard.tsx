import React, { useEffect, useState } from 'react';
import { KPICardSkeleton, CardSkeleton } from '../components/ui/LoadingSpinner';
import { apiFetch } from '../utils/api';
import { 
  Users, 
  UserCheck, 
  CheckSquare, 
  TrendingUp, 
  TrendingDown,
  RefreshCw, 
  ChevronRight,
  MessageSquare,
  Mail,
  Sliders,
  Share2,
  Camera,
  Clock,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface KPIState {
  totalLeads: number;
  activeClients: number;
  conversionRate: number;
  pendingTasks: number;
}

interface StageState {
  name: string;
  count: number;
}

interface Lead {
  id: string;
  name: string;
  source: string;
  status: string;
  createdAt: string;
  phone?: string;
}

const SOURCE_ICON: Record<string, React.ReactNode> = {
  'Facebook Ads': <Share2 size={12} className="text-white" />,
  'Instagram Ads': <Camera size={12} className="text-white" />,
  'WhatsApp': <MessageSquare size={12} className="text-white" />,
};
const SOURCE_COLOR: Record<string, string> = {
  'Facebook Ads': '#1877F2',
  'Instagram Ads': '#E1306C',
  'WhatsApp': '#16a34a',
  'Walk-in': '#800000',
  'Referral': '#F59E0B',
};

export const Dashboard = () => {
  const [kpis, setKpis] = useState<KPIState>({ totalLeads: 0, activeClients: 0, conversionRate: 0, pendingTasks: 0 });
  const [stages, setStages] = useState<StageState[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsData, leadsData] = await Promise.all([
        apiFetch('/analytics/summary'),
        apiFetch('/crm/leads'),
      ]);
      setKpis(analyticsData.kpis);
      setStages(analyticsData.stages);
      // Sort leads by createdAt descending, take top 6
      const sorted = [...leadsData].sort((a: Lead, b: Lead) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 6);
      setRecentLeads(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getStageColor = (index: number) => {
    const colors = ['#1877F2', '#F59E0B', '#F97316', '#E1306C', '#800000'];
    return colors[index % colors.length];
  };

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = { 'New Lead': '#1877F2', 'Contacted': '#F59E0B', 'Interested': '#F97316', 'Quotation': '#8b5cf6', 'Won': '#16a34a', 'Lost': '#ef4444' };
    return colors[status] || '#9ca3af';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="h-7 w-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded-xl animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><CardSkeleton lines={5} /></div>
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: '#800000' }}>Dashboard Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">Real-time performance and pipeline summary</p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition border"
          style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#800000', backgroundColor: 'rgba(245,158,11,0.05)' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
          <p className="text-red-600 text-sm font-bold">⚠ API Connection Error</p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <p className="text-red-400 text-xs mt-1">Make sure the backend server is running: <code className="bg-red-100 px-1 rounded">run_backend.bat</code></p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={kpis.totalLeads} icon={<Users size={22} />}
          description="Acquired prospects" gradient="linear-gradient(135deg, #1e3a5f, #1877F2)" trend={+8} />
        <KPICard title="Active Clients" value={kpis.activeClients} icon={<UserCheck size={22} />}
          description="Won & active customers" gradient="linear-gradient(135deg, #065f46, #16a34a)" trend={+5} />
        <KPICard title="Conversion Rate" value={`${kpis.conversionRate}%`} icon={<TrendingUp size={22} />}
          description="Lead-to-win ratio" gradient="linear-gradient(135deg, #78350f, #F59E0B)" trend={-2} />
        <KPICard title="Pending Tasks" value={kpis.pendingTasks} icon={<CheckSquare size={22} />}
          description="Awaiting completion" gradient="linear-gradient(135deg, #5b0000, #800000)" trend={0} />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pipeline Stages */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-gray-800 font-serif">Lead Pipeline</h3>
            <p className="text-gray-400 text-xs mt-0.5">Flow of prospects through the sales funnel</p>
          </div>
          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const maxVal = Math.max(...stages.map(s => s.count), 1);
              const pct = (stage.count / maxVal) * 100;
              const color = getStageColor(idx);
              return (
                <div key={stage.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">{stage.name}</span>
                    <span className="font-bold" style={{ color }}>{stage.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Leads Feed */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 font-serif">Recent Leads</h3>
              <p className="text-gray-400 text-xs mt-0.5">Last 6 acquisitions</p>
            </div>
            <Link to="/dashboard/leads" className="text-xs font-bold flex items-center space-x-1 hover:underline" style={{ color: '#800000' }}>
              <span>View all</span><ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8">
                <Zap size={28} /><p className="text-xs mt-2">No leads yet</p>
              </div>
            ) : recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: SOURCE_COLOR[lead.source] || '#800000' }}>
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{lead.name}</p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getStatusDot(lead.status) }} />
                    <p className="text-xs text-gray-400 truncate">{lead.source}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-gray-300 shrink-0">
                  <Clock size={10} />
                  <span style={{ fontSize: '10px' }}>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <QuickLinkCard to="/dashboard/messaging" title="Live Chat" description="Reply to WhatsApp, Facebook Messenger & Instagram DMs in real time." icon={<MessageSquare size={22} />} actionText="Open Chat" color="#800000" />
        <QuickLinkCard to="/dashboard/whatsapp" title="Marketing Hub" description="Send WhatsApp broadcasts, email campaigns & view Meta Ads leads." icon={<Mail size={22} />} actionText="Create Campaign" color="#F59E0B" />
        <QuickLinkCard to="/dashboard/settings" title="Integration Hub" description="Configure Meta, Twilio, Brevo credentials & webhook URLs." icon={<Sliders size={22} />} actionText="Configure" color="#1877F2" />
      </div>
    </div>
  );
};

// ─── KPI Card ──────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  trend: number;
}

const KPICard = ({ title, value, icon, description, gradient, trend }: KPICardProps) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{title}</p>
        <h2 className="text-3xl font-bold text-gray-800 mt-1">{value}</h2>
        <p className="text-gray-400 text-xs mt-1">{description}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: gradient }}>
        {icon}
      </div>
    </div>
    {trend !== 0 && (
      <div className="mt-3 flex items-center space-x-1">
        {trend > 0
          ? <TrendingUp size={12} className="text-emerald-500" />
          : <TrendingDown size={12} className="text-red-400" />}
        <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}% vs last week
        </span>
      </div>
    )}
    {/* Subtle background gradient accent */}
    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5" style={{ background: gradient }} />
  </div>
);

// ─── Quick Link Card ──────────────────────────────────────────────────────

interface QuickLinkCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  color: string;
}

const QuickLinkCard = ({ to, title, description, icon, actionText, color }: QuickLinkCardProps) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
    <div className="space-y-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-gray-800">{title}</h4>
        <p className="text-gray-400 text-xs leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
    <Link to={to}
      className="mt-5 flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all text-white"
      style={{ backgroundColor: color, opacity: 0.9 }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.9'}
    >
      <span>{actionText}</span>
      <ChevronRight size={15} />
    </Link>
  </div>
);
