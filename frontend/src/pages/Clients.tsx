import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Plus, Search, Trash2, Award, RefreshCw } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalPurchases: number;
  status: string;
  createdAt: string;
}

export const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Add Client form states
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [purchases, setPurchases] = useState('0');

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/crm/clients');
      setClients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/crm/clients', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          email,
          totalPurchases: parseFloat(purchases) || 0.0,
          status: 'Won'
        })
      });
      setName('');
      setPhone('');
      setEmail('');
      setPurchases('0');
      setShowAdd(false);
      loadClients();
    } catch (err: any) {
      setError(err.message || 'Failed to add client');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('Delete this client profile?')) return;
    try {
      await apiFetch(`/crm/clients/${id}`, { method: 'DELETE' });
      loadClients();
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    }
  };

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-maroon">Clients & Deals</h1>
          <p className="text-gray-500 text-sm mt-1">Manage won customers and track historical purchase metrics</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadClients}
            disabled={loading}
            className="p-3 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white rounded-xl transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center space-x-2 bg-brand-maroon text-white font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition shadow-sm"
          >
            <Plus size={18} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search active clients by name or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition text-sm bg-gray-50 focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-white rounded-2xl border border-gray-100 text-gray-450">
            No clients matched search parameters.
          </div>
        ) : (
          filtered.map(client => (
            <div key={client.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{client.name}</h4>
                      <p className="text-xs text-gray-400">{client.phone}</p>
                    </div>
                  </div>
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Award size={10} />
                    <span>Won Client</span>
                  </span>
                </div>

                <div className="border-t border-gray-55 pt-3 text-xs text-gray-500 space-y-1">
                  <div>Email: <strong>{client.email || 'N/A'}</strong></div>
                  <div>Joined: <strong>{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}</strong></div>
                </div>
              </div>

              <div className="border-t border-gray-55 mt-4 pt-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Total Purchases</p>
                  <p className="font-serif font-bold text-brand-maroon text-base">₹{(client.totalPurchases || 0).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteClient(client.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Create Active Client Profile</h4>
              <button onClick={() => setShowAdd(false)} className="text-gray-450 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-450 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-450 uppercase mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-450 uppercase mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-450 uppercase mb-1">Total Purchases (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none font-bold text-brand-maroon"
                  value={purchases}
                  onChange={(e) => setPurchases(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border border-gray-255 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
