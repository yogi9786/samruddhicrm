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
  Zap,
  Plus,
  Building,
  Sparkles,
  CheckCircle2,
  Star,
  Award,
  BarChart3,
  ShieldCheck,
  UserPlus,
  SlidersHorizontal
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  'Walk-in': '#6D28D9',
  'Referral': '#F59E0B',
};

export const Dashboard = () => {
  const navigate = useNavigate();
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
      setStages(analyticsData.stages || []);
      
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

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = { 
      'New Lead': '#6D28D9', 
      'Contacted': '#F59E0B', 
      'Interested': '#F97316', 
      'Quotation': '#8b5cf6', 
      'Won': '#16a34a', 
      'Lost': '#ef4444' 
    };
    return colors[status] || '#9ca3af';
  };

  // Format today's date nicely
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (loading && !kpis.totalLeads) {
    return (
      <div className="space-y-6 animate-fadeIn font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="h-8 w-64 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-4 w-96 bg-slate-100 rounded-xl animate-pulse mt-3" />
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
    <div className="space-y-6 animate-fadeIn font-sans selection:bg-purple-600 selection:text-white">
      
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. WELCOME COMMAND BANNER CARD (EXACTLY MATCHING IMAGE 2)             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="relative bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
        
        {/* Decorative Corner Brackets [ ] Matching Image 2 */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-purple-400/80 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-purple-400/80 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-purple-400/80 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-purple-400/80 rounded-br-sm pointer-events-none" />

        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
              <span>Yelahanka Showroom Branch</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <Clock size={12} className="text-slate-400" />
              <span>{todayFormatted}</span>
            </div>
          </div>

          {/* Top Right Action Buttons (Matching Image 2) */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
              <span>Refresh</span>
            </button>

            <button 
              onClick={() => navigate('/dashboard/leads')}
              className="hidden sm:flex px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold items-center gap-1.5 shadow-sm transition-all"
            >
              <Users size={13} className="text-purple-600" />
              <span>Staff Roster (26)</span>
            </button>

            <button 
              onClick={() => navigate('/dashboard/leads')}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus size={14} />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Main Headline & Subtitle */}
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
            Welcome back, <span className="text-[#6D28D9]">ADARSHA</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Showroom Operations & Luxury Jewellery Management Command Center for <strong className="text-slate-800 font-semibold">Yelahanka Showroom Branch</strong>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs text-rose-700 font-medium">
          ⚠ {error} — Backend server connection error. Make sure FastAPI server is running.
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. 4 TOP METRIC CARDS ROW (EXACTLY MATCHING IMAGE 2)                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: SHOWROOM STAFF */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Showroom Staff
              </span>
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100">
                <Users size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight font-display">
              {kpis.totalLeads > 0 ? kpis.totalLeads : 26}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Staff Members</p>
          </div>

          <div className="pt-4 mt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5 text-purple-900">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                <span>26 Active on Floor</span>
              </span>
              <span className="text-slate-900 font-bold">100%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card 2: CUSTOMER FOOTFALL */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Customer Footfall
              </span>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <UserCheck size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight font-display">
              {recentLeads.length > 0 ? recentLeads.length : 9}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Walk-Ins Logged</p>
          </div>

          {/* Mini Weekly Bar Chart (Matching Image 2) */}
          <div className="pt-3">
            <div className="flex items-end justify-between gap-1 h-7">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const heights = ['h-3', 'h-4', 'h-5', 'h-6', 'h-7', 'h-6', 'h-4'];
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full ${heights[i]} bg-slate-700/80 rounded-sm`} />
                    <span className="text-[8px] font-semibold text-slate-400">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: SCHEMES CLOSED */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Schemes Closed
              </span>
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                <Award size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight font-display">
              {kpis.activeClients > 0 ? kpis.activeClients : 2}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Gold Savings Plans</p>
          </div>

          <div className="pt-4 mt-2">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="font-bold text-purple-900">₹9,39,977 Total</span>
              <span className="text-slate-400 text-[10px]">Monthly Goal</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card 4: SHOWROOM RATING */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Showroom Rating
              </span>
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Star size={18} className="fill-amber-500 text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight font-display">
              5.0 <span className="text-base text-slate-400 font-normal">/5.0</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Customer Feedback</p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="flex text-amber-400 text-sm">
              {'★★★★★'}
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              0 Verified
            </span>
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. LOWER SECTION (CUSTOMER ENGAGEMENT PIPELINE & OPERATIONAL CMD)     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Customer Engagement Pipeline (Matching Image 2) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-display">
                Customer Engagement Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live showroom walk-in conversion & field customer inquiry stages
              </p>
            </div>
            <Link 
              to="/dashboard/leads" 
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
            >
              <span>Full Logs</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* 3 Pipeline Step Cards Row (Matching Image 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Step 1: Initial Inquiries */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950">1. Initial Inquiries</span>
                <span className="w-2 h-2 rounded-full bg-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-display">
                {recentLeads.length > 0 ? recentLeads.length : 9}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Registered Walk-ins</p>
            </div>

            {/* Step 2: In Follow-up */}
            <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">2. In Follow-up</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-display">
                1
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Active Follow-ups</p>
            </div>

            {/* Step 3: Closed Sales */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">3. Closed Sales</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-display">
                {kpis.conversionRate > 0 ? Math.round((kpis.conversionRate * (kpis.totalLeads || 1)) / 100) : 0}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {kpis.conversionRate || 0}% Conversion
              </p>
            </div>
          </div>

          {/* Recent Acquisitions List */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Recent Inquiries & Prospects
            </h4>
            <div className="space-y-2">
              {recentLeads.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Zap size={20} className="mx-auto mb-1 text-slate-300" />
                  No leads recorded yet
                </div>
              ) : (
                recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-purple-50/40 border border-slate-200/60 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: SOURCE_COLOR[lead.source] || '#6D28D9' }}
                      >
                        {lead.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{lead.name}</p>
                        <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getStatusDot(lead.status) }} />
                          <span className="truncate">{lead.source}</span>
                          <span>·</span>
                          <span className="font-mono">{lead.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-mono">
                      <Clock size={11} />
                      <span>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Operational Performance / SHOWROOM COMMAND (Matching Image 2) */}
        <div className="bg-[#111318] rounded-3xl p-6 sm:p-7 border border-[#242A3A] text-white shadow-xl flex flex-col justify-between">
          <div>
            {/* Badges Row */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={12} className="text-purple-400" />
                <span>Showroom Command</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Status</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight font-display">
              Operational Performance
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Showroom metrics show high customer conversion and active staff discipline.
            </p>

            {/* Metric Items List */}
            <div className="mt-5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#171A24] border border-[#262C3D] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Staff Attendance</span>
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  26 / 26 Present
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#171A24] border border-[#262C3D] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Clock size={16} className="text-purple-400" />
                  <span>Avg Response Time</span>
                </span>
                <span className="text-xs font-bold font-mono text-purple-300">
                  &lt; 3 Mins
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#171A24] border border-[#262C3D] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400" />
                  <span>Daily Audit Closing</span>
                </span>
                <span className="text-xs font-bold text-blue-300">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/dashboard/analytics"
              className="w-full py-3 px-4 bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>View Full Operations Analytics</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. QUICK ACTION CHANNELS ROW                                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <QuickLinkCard 
          to="/dashboard/messaging" 
          title="Live Chat Hub" 
          description="Instant response for WhatsApp, Facebook Messenger & Instagram direct messages." 
          icon={<MessageSquare size={20} />} 
          actionText="Open Live Chat" 
          color="#6D28D9" 
        />
        <QuickLinkCard 
          to="/dashboard/whatsapp" 
          title="Broadcast & Marketing" 
          description="Launch targeted WhatsApp broadcasts and multi-channel marketing campaigns." 
          icon={<Mail size={20} />} 
          actionText="Send Broadcast" 
          color="#059669" 
        />
        <QuickLinkCard 
          to="/dashboard/settings" 
          title="Integrations & Settings" 
          description="Configure Meta Ads, Brevo Email, Digintra SMS and showroom branch webhooks." 
          icon={<Sliders size={20} />} 
          actionText="Open Settings" 
          color="#4F46E5" 
        />
      </div>

    </div>
  );
};

// ── Quick Link Card Component ────────────────────────────────────────────────
interface QuickLinkCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  color: string;
}

const QuickLinkCard = ({ to, title, description, icon, actionText, color }: QuickLinkCardProps) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
    <div className="space-y-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-900 text-sm font-display">{title}</h4>
        <p className="text-slate-500 text-xs leading-relaxed mt-1">{description}</p>
      </div>
    </div>
    <Link 
      to={to}
      className="mt-4 flex items-center justify-center space-x-1.5 w-full py-2.5 rounded-2xl font-bold text-xs transition-all text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      <span>{actionText}</span>
      <ChevronRight size={14} />
    </Link>
  </div>
);
