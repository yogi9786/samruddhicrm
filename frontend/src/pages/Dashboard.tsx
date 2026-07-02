import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Users, 
  UserCheck, 
  CheckSquare, 
  TrendingUp, 
  RefreshCw, 
  ChevronRight,
  MessageSquare,
  Mail,
  Sliders
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

export const Dashboard = () => {
  const [kpis, setKpis] = useState<KPIState>({ totalLeads: 0, activeClients: 0, conversionRate: 0, pendingTasks: 0 });
  const [stages, setStages] = useState<StageState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/analytics/summary');
      setKpis(data.kpis);
      setStages(data.stages);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStageColor = (index: number) => {
    const colors = ['bg-brand-goldLight', 'bg-brand-gold', 'bg-brand-orange', 'bg-yellow-600', 'bg-brand-maroon'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-maroon">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time performance and pipeline conversion summary</p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Leads" 
          value={kpis.totalLeads} 
          icon={<Users size={24} />} 
          description="Total acquired prospects"
          bgColor="bg-blue-50 text-blue-600"
        />
        <KPICard 
          title="Active Clients" 
          value={kpis.activeClients} 
          icon={<UserCheck size={24} />} 
          description="Customers won & active"
          bgColor="bg-emerald-50 text-emerald-600"
        />
        <KPICard 
          title="Conversion Rate" 
          value={`${kpis.conversionRate}%`} 
          icon={<TrendingUp size={24} />} 
          description="Percentage of won leads"
          bgColor="bg-amber-50 text-brand-gold"
        />
        <KPICard 
          title="Pending Tasks" 
          value={kpis.pendingTasks} 
          icon={<CheckSquare size={24} />} 
          description="Tasks awaiting completion"
          bgColor="bg-rose-50 text-brand-maroon"
        />
      </div>

      {/* Stage Progress Meters */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 font-serif">Lead Pipeline Stages</h3>
          <p className="text-gray-500 text-sm">Flow of prospects through the sales pipeline</p>
        </div>

        <div className="space-y-5">
          {stages.map((stage, idx) => {
            const maxVal = Math.max(...stages.map(s => s.count), 1);
            const percentage = (stage.count / maxVal) * 100;
            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-700">{stage.name}</span>
                  <span className="text-brand-maroon">{stage.count} Leads</span>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getStageColor(idx)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickLinkCard
          to="/dashboard/messaging"
          title="Omnichannel Messaging"
          description="Reply to WhatsApp messages, Instagram DMs, and Facebook chat in real time."
          icon={<MessageSquare size={24} />}
          actionText="Open Live Chat"
        />
        <QuickLinkCard
          to="/dashboard/marketing"
          title="Marketing Hub"
          description="Send bulk WhatsApp campaigns, launch email templates, and view Meta Ads leads."
          icon={<Mail size={24} />}
          actionText="Create Campaign"
        />
        <QuickLinkCard
          to="/dashboard/settings"
          title="CRM Settings"
          description="Configure API credentials, Twilio integration, Brevo profiles, and custom CRM tags."
          icon={<Sliders size={24} />}
          actionText="Configure CRM"
        />
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  bgColor: string;
}

const KPICard = ({ title, value, icon, description, bgColor }: KPICardProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h2 className="text-2xl font-bold text-gray-800 mt-0.5">{value}</h2>
        <p className="text-gray-400 text-xs mt-1">{description}</p>
      </div>
    </div>
  );
};

interface QuickLinkCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
}

const QuickLinkCard = ({ to, title, description, icon, actionText }: QuickLinkCardProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-xl bg-brand-cream text-brand-gold flex items-center justify-center">
          {icon}
        </div>
        <div className="space-y-1">
          <h4 className="font-serif font-bold text-gray-800 text-lg">{title}</h4>
          <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      <Link 
        to={to} 
        className="mt-6 flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl border border-brand-maroon text-brand-maroon hover:bg-brand-maroon hover:text-white font-medium text-sm transition-colors"
      >
        <span>{actionText}</span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
};
