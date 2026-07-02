import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
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
  Bar 
} from 'recharts';
import { RefreshCw, TrendingUp, Compass, Gem } from 'lucide-react';

interface ChartItem {
  name: string;
  value: number;
}

interface TrendItem {
  date: string;
  leads: number;
}

export const Analytics = () => {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [sources, setSources] = useState<ChartItem[]>([]);
  const [services, setServices] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const COLORS = ['#800000', '#F59E0B', '#F97316', '#FBBF24', '#B45309', '#6B21A8'];

  const loadData = async () => {
    setLoading(true);
    setError('');
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

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-maroon">Business Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Deep insights into lead generation channels and product interests</p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white font-medium px-4 py-2.5 rounded-xl transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lead Trends Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-50 text-brand-maroon rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-800 text-lg">Lead Growth Trend</h3>
              <p className="text-xs text-gray-400">Monthly breakdown of acquired leads</p>
            </div>
          </div>
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }} 
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#800000" 
                  strokeWidth={3} 
                  activeDot={{ r: 8 }} 
                  name="Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interested Services/Jewelry Categories */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 text-brand-gold rounded-lg">
              <Gem size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-800 text-lg">Product / Scheme Interest</h3>
              <p className="text-xs text-gray-400">Leads by category of jewelry or savings program</p>
            </div>
          </div>
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={services} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                />
                <Bar dataKey="value" fill="#F59E0B" name="Leads Count" radius={[6, 6, 0, 0]}>
                  {services.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acquisition Sources (Pie Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 text-brand-orange rounded-lg">
              <Compass size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-800 text-lg">Acquisition Channel Breakdown</h3>
              <p className="text-xs text-gray-400">Comparing lead volume across different communication sources</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sources.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Source Details Legend */}
            <div className="space-y-4 max-w-sm">
              <h4 className="font-semibold text-gray-700 text-sm">Lead Share percentages:</h4>
              <div className="grid grid-cols-1 gap-3">
                {sources.map((source, index) => {
                  const total = sources.reduce((sum, item) => sum + item.value, 0);
                  const percentage = total > 0 ? ((source.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={source.name} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3.5 h-3.5 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-gray-700 text-sm">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-800 text-sm">{source.value} leads</span>
                        <span className="text-xs text-gray-400 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
