import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Plus, Search, RefreshCw, Edit, Phone, Mail, Download, Upload, MessageSquare, FileText } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  interestedIn?: string;
  interestedIn?: string;
  notes?: string;
  scheduledCall?: string;
  createdAt: string;
}

export const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  
  // Selected Leads state (for Bulk Actions)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Add Lead Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [status, setStatus] = useState('New Lead');
  const [interest, setInterest] = useState('Gold Jewelry');
  const [notes, setNotes] = useState('');

  // Edit Lead Modal State
  const [showEdit, setShowEdit] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSource, setEditSource] = useState('Walk-in');
  const [editStatus, setEditStatus] = useState('New Lead');
  const [editInterest, setEditInterest] = useState('Gold Jewelry');
  const [editNotes, setEditNotes] = useState('');

  // Quick Notes Modal State
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesLead, setNotesLead] = useState<Lead | null>(null);
  const [notesContent, setNotesContent] = useState('');

  // Schedule Call Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null);
  const [scheduleTime, setScheduleTime] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/crm/leads');
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          email,
          source,
          status,
          interestedIn: interest,
          notes
        })
      });
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setShowAdd(false);
      loadLeads();
    } catch (err: any) {
      setError(err.message || 'Failed to add lead');
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditName(lead.name);
    setEditPhone(lead.phone);
    setEditEmail(lead.email || '');
    setEditSource(lead.source || 'Walk-in');
    setEditStatus(lead.status || 'New Lead');
    setEditInterest(lead.interestedIn || 'Gold Jewelry');
    setEditNotes(lead.notes || '');
    setShowEdit(true);
  };

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      await apiFetch(`/crm/leads/${editingLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
          source: editSource,
          status: editStatus,
          interestedIn: editInterest,
          notes: editNotes
        })
      });
      setShowEdit(false);
      setEditingLead(null);
      loadLeads();
    } catch (err: any) {
      setError(err.message || 'Failed to update lead');
    }
  };

  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesLead) return;
    try {
      await apiFetch(`/crm/leads/${notesLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: notesLead.name,
          phone: notesLead.phone,
          email: notesLead.email || '',
          source: notesLead.source || 'Walk-in',
          status: notesLead.status || 'New Lead',
          interestedIn: notesLead.interestedIn || 'Gold Jewelry',
          notes: notesContent
        })
      });
      setShowNotesModal(false);
      setNotesLead(null);
      loadLeads();
    } catch (err: any) {
      alert(`Failed to save notes: ${err.message}`);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleLead || !scheduleTime) return;
    try {
      // Create ISO string in UTC
      const isoTime = new Date(scheduleTime).toISOString();
      await apiFetch(`/crm/leads/${scheduleLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...scheduleLead,
          scheduledCall: isoTime
        })
      });
      setShowScheduleModal(false);
      setScheduleLead(null);
      setScheduleTime('');
      loadLeads();
      alert(`Call scheduled for ${new Date(scheduleTime).toLocaleString()}`);
    } catch (err: any) {
      alert(`Failed to schedule call: ${err.message}`);
    }
  };

  const handleExportLeads = () => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Phone', 'Email', 'Source', 'Status', 'Interest', 'Notes', 'Created At'];
    const rows = leads.map(l => [
      l.name,
      l.phone,
      l.email || '',
      l.source,
      l.status,
      l.interestedIn || '',
      l.notes || '',
      l.createdAt || ''
    ]);
    
    const csvContent = "\uFEFF" + [
      headers.join(','), 
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sirisamruddhi_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        
        try {
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const parsedLeads = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || line.split(',');
            if (values.length < 2) continue;
            
            const cleanedValues = values.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            
            const lead: any = {};
            headers.forEach((header, index) => {
              const val = cleanedValues[index] || '';
              const lower = header.toLowerCase().replace(/[^a-z]/g, '');
              if (lower === 'name') lead.name = val;
              else if (lower === 'phone') lead.phone = val;
              else if (lower === 'email') lead.email = val;
              else if (lower === 'source') lead.source = val;
              else if (lower === 'status') lead.status = val;
              else if (lower === 'interest' || lower === 'interestedin') lead.interestedIn = val;
              else if (lower === 'notes') lead.notes = val;
            });
            
            if (lead.name && lead.phone) {
              parsedLeads.push({
                name: lead.name,
                phone: lead.phone,
                email: lead.email || '',
                source: lead.source || 'Walk-in',
                status: lead.status || 'New Lead',
                interestedIn: lead.interestedIn || 'Gold Jewelry',
                notes: lead.notes || ''
              });
            }
          }
          
          if (parsedLeads.length === 0) {
            alert('No valid leads found. Ensure headers include "Name" and "Phone".');
            return;
          }
          
          await apiFetch('/crm/leads/bulk', {
            method: 'POST',
            body: JSON.stringify(parsedLeads)
          });
          
          alert(`Successfully imported ${parsedLeads.length} leads!`);
          loadLeads();
        } catch (err: any) {
          alert(`Failed to parse CSV: ${err.message}`);
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.phone.includes(search) || 
    (l.email && l.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(filtered.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Hidden File Input for CSV Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportCSV} 
        accept=".csv" 
        className="hidden" 
      />

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-maroon">Leads Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your customer prospects</p>
        </div>
        <div className="flex space-x-2 flex-wrap gap-y-2">
          <button 
            onClick={loadLeads}
            disabled={loading}
            className="p-3 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white rounded-xl transition"
            title="Refresh Leads"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleExportLeads}
            disabled={leads.length === 0}
            className="flex items-center space-x-2 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white font-semibold px-4 py-2.5 rounded-xl transition"
            title="Export Leads to CSV"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white font-semibold px-4 py-2.5 rounded-xl transition"
            title="Import Leads from CSV"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center space-x-2 bg-brand-maroon text-white font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition shadow-sm"
          >
            <Plus size={18} />
            <span>Add Lead</span>
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
            placeholder="Search leads by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition text-sm bg-gray-50 focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Leads Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={filtered.length > 0 && selectedLeadIds.length === filtered.length}
                    onChange={handleSelectAll}
                    className="h-4.5 w-4.5 text-brand-maroon focus:ring-brand-gold border-gray-300 rounded cursor-pointer"
                  />
                </th>
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Source</th>
                <th className="p-4">Interest</th>
                <th className="p-4">Status</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-450">
                    No leads found. Click 'Add Lead' or 'Import' to create some.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-gray-50 transition-colors ${selectedLeadIds.includes(lead.id) ? 'bg-amber-50 bg-opacity-30' : ''}`}>
                    <td className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => handleSelectOne(lead.id)}
                        className="h-4.5 w-4.5 text-brand-maroon focus:ring-brand-gold border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-bold text-gray-800">{lead.name}</td>
                    <td className="p-4">
                      <div className="text-gray-700">{lead.phone}</div>
                      <div className="text-xs text-gray-400">{lead.email || 'No email'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
                        {lead.source}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-brand-gold">{lead.interestedIn || 'N/A'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-maroon border border-brand-gold border-opacity-35">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-xs text-gray-500 font-normal">
                      {lead.notes ? (
                        <span 
                          onClick={() => { setNotesLead(lead); setNotesContent(lead.notes || ''); setShowNotesModal(true); }}
                          className="cursor-pointer hover:text-brand-maroon underline"
                          title="Click to view/edit notes"
                        >
                          {lead.notes}
                        </span>
                      ) : (
                        <button 
                          onClick={() => { setNotesLead(lead); setNotesContent(''); setShowNotesModal(true); }}
                          className="text-[11px] font-bold text-brand-gold hover:text-brand-maroon hover:underline"
                        >
                          + Add Note
                        </button>
                      )}
                      
                      {lead.scheduledCall && (
                        <div className="mt-1 text-[10px] font-bold text-brand-maroon bg-brand-cream inline-block px-2 py-0.5 rounded-full border border-brand-gold border-opacity-30">
                          📞 {new Date(lead.scheduledCall).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1 shrink-0 whitespace-nowrap">
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-2 inline-flex text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                        title="Call Prospect"
                      >
                        <Phone size={16} />
                      </a>
                      
                      <button
                        onClick={() => {
                          setScheduleLead(lead);
                          setScheduleTime('');
                          setShowScheduleModal(true);
                        }}
                        className="p-2 inline-flex text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                        title="Schedule Call"
                      >
                        <span className="text-base font-bold leading-none -mt-1 block">📅</span>
                      </button>
                      
                      <Link
                        to={`/dashboard/email?to=${lead.email || ''}`}
                        className="p-2 inline-flex text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="Send Email"
                      >
                        <Mail size={16} />
                      </Link>

                      <Link
                        to={`/dashboard/whatsapp?to=${lead.phone}`}
                        className="p-2 inline-flex text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                        title="Send WhatsApp Message"
                      >
                        <MessageSquare size={16} />
                      </Link>

                      <button
                        onClick={() => { setNotesLead(lead); setNotesContent(lead.notes || ''); setShowNotesModal(true); }}
                        className="p-2 inline-flex text-gray-400 hover:text-brand-gold hover:bg-amber-50 rounded-xl transition"
                        title="Edit Notes"
                      >
                        <FileText size={16} />
                      </button>

                      <button
                        onClick={() => openEditModal(lead)}
                        className="p-2 inline-flex text-gray-400 hover:text-brand-gold hover:bg-amber-50 rounded-xl transition"
                        title="Edit Lead Details"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards Layout */}
      <div className="block md:hidden space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-450 rounded-2xl border border-gray-100 shadow-sm">
            No leads found. Click 'Add Lead' or 'Import' to create some.
          </div>
        ) : (
          filtered.map(lead => (
            <div 
              key={lead.id} 
              className={`bg-white p-5 rounded-2xl border transition-all shadow-sm space-y-3 relative ${
                selectedLeadIds.includes(lead.id) ? 'border-brand-gold border-opacity-65 bg-amber-50 bg-opacity-10' : 'border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={selectedLeadIds.includes(lead.id)} 
                    onChange={() => handleSelectOne(lead.id)}
                    className="h-4.5 w-4.5 text-brand-maroon focus:ring-brand-gold border-gray-300 rounded cursor-pointer mr-1"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">{lead.name}</h4>
                    <span className="text-[10px] text-gray-400">Created: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-cream text-brand-maroon border border-brand-gold border-opacity-35 shrink-0">
                  {lead.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100 border-opacity-50">
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-wider">Phone</span>
                  <span className="text-gray-700 font-medium">{lead.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-wider">Email</span>
                  <span className="text-gray-700 font-medium truncate block">{lead.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-wider">Source</span>
                  <span className="text-gray-600 font-medium capitalize">{lead.source}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-wider">Interest</span>
                  <span className="text-brand-gold font-medium">{lead.interestedIn || 'N/A'}</span>
                </div>
              </div>

              {lead.notes ? (
                <div 
                  onClick={() => { setNotesLead(lead); setNotesContent(lead.notes || ''); setShowNotesModal(true); }}
                  className="bg-amber-50 bg-opacity-20 p-2.5 rounded-xl border border-brand-gold border-opacity-10 text-xs text-gray-600 cursor-pointer"
                >
                  <strong>Notes:</strong> {lead.notes}
                </div>
              ) : (
                <button 
                  onClick={() => { setNotesLead(lead); setNotesContent(''); setShowNotesModal(true); }}
                  className="text-xs font-bold text-brand-gold hover:text-brand-maroon flex items-center space-x-1"
                >
                  <span>+ Add Note</span>
                </button>
              )}

              {lead.scheduledCall && (
                <div className="text-[10px] font-bold text-brand-maroon bg-brand-cream inline-block px-2 py-0.5 rounded-full border border-brand-gold border-opacity-30">
                  📞 Scheduled: {new Date(lead.scheduledCall).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              <div className="flex justify-between items-center border-t border-gray-100 pt-3 flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <a
                    href={`tel:${lead.phone}`}
                    className="p-2 inline-flex text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                    title="Call Prospect"
                  >
                    <Phone size={16} />
                  </a>
                  
                  <button
                    onClick={() => {
                      setScheduleLead(lead);
                      setScheduleTime('');
                      setShowScheduleModal(true);
                    }}
                    className="p-2 inline-flex text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                    title="Schedule Call"
                  >
                    <span className="text-base font-bold leading-none -mt-1 block">📅</span>
                  </button>
                  
                  <Link
                    to={`/dashboard/email?to=${lead.email || ''}`}
                    className="p-2 inline-flex text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    title="Send Email"
                  >
                    <Mail size={16} />
                  </Link>

                  <Link
                    to={`/dashboard/whatsapp?to=${lead.phone}`}
                    className="p-2 inline-flex text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                    title="WhatsApp Message"
                  >
                    <MessageSquare size={16} />
                  </Link>

                  <button
                    onClick={() => { setNotesLead(lead); setNotesContent(lead.notes || ''); setShowNotesModal(true); }}
                    className="p-2 inline-flex text-gray-400 hover:text-brand-gold hover:bg-amber-50 rounded-xl transition"
                    title="Edit Notes"
                  >
                    <FileText size={16} />
                  </button>
                </div>

                <button
                  onClick={() => openEditModal(lead)}
                  className="flex items-center space-x-1 text-xs font-bold text-brand-maroon hover:underline px-2.5 py-1 rounded bg-brand-cream border border-brand-gold border-opacity-25"
                >
                  <Edit size={12} />
                  <span>Edit Lead</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Bottom Bulk Action Menu */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-2xl py-3.5 px-6 rounded-2xl flex items-center justify-between space-x-6 z-50 animate-slideUp max-w-[90%] md:max-w-2xl overflow-x-auto">
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            <strong className="text-brand-maroon">{selectedLeadIds.length}</strong> selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const selectedEmails = leads
                  .filter(l => selectedLeadIds.includes(l.id) && l.email)
                  .map(l => l.email)
                  .join(',');
                if (!selectedEmails) {
                  alert('None of the selected leads have an email address.');
                  return;
                }
                navigate(`/dashboard/email?to=${selectedEmails}`);
              }}
              className="flex items-center space-x-1.5 bg-brand-cream border border-brand-gold border-opacity-35 text-brand-maroon px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-brand-maroon hover:text-white transition whitespace-nowrap"
            >
              <Mail size={14} />
              <span>Bulk Email</span>
            </button>

            <button
              onClick={() => {
                const selectedPhones = leads
                  .filter(l => selectedLeadIds.includes(l.id))
                  .map(l => l.phone)
                  .join(',');
                navigate(`/dashboard/whatsapp?to=${selectedPhones}`);
              }}
              className="flex items-center space-x-1.5 bg-brand-cream border border-brand-gold border-opacity-35 text-brand-maroon px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-brand-maroon hover:text-white transition whitespace-nowrap"
            >
              <MessageSquare size={14} />
              <span>Bulk WhatsApp</span>
            </button>

            <button
              onClick={() => setSelectedLeadIds([])}
              className="text-xs text-gray-450 hover:text-gray-600 font-semibold px-2 py-2 whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Add New CRM Lead</h4>
              <button onClick={() => setShowAdd(false)} className="text-gray-450 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleAddLead} className="space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Source</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Quotation">Quotation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Interested Product/Service</label>
                <select
                  className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                >
                  <option value="Gold Jewelry">Gold Jewelry</option>
                  <option value="Diamond Ring">Diamond Ring</option>
                  <option value="Gold Scheme">Gold Scheme</option>
                  <option value="Custom Design">Custom Design</option>
                  <option value="Repairs">Repairs & Polishing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Internal Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-255 rounded-xl text-xs resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEdit && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Edit CRM Lead</h4>
              <button onClick={() => { setShowEdit(false); setEditingLead(null); }} className="text-gray-455 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleEditLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Source</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Quotation">Quotation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Interested Product/Service</label>
                <select
                  className="w-full px-3 py-2 border border-gray-255 rounded-xl text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none"
                  value={editInterest}
                  onChange={(e) => setEditInterest(e.target.value)}
                >
                  <option value="Gold Jewelry">Gold Jewelry</option>
                  <option value="Diamond Ring">Diamond Ring</option>
                  <option value="Gold Scheme">Gold Scheme</option>
                  <option value="Custom Design">Custom Design</option>
                  <option value="Repairs">Repairs & Polishing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Internal Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-255 rounded-xl text-xs resize-none"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEdit(false); setEditingLead(null); }}
                  className="px-4 py-2 border border-gray-255 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Notes Edit Modal */}
      {showNotesModal && notesLead && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText size={18} className="text-brand-gold" />
                <h4 className="font-serif font-bold text-brand-maroon text-lg">Lead Notes</h4>
              </div>
              <button onClick={() => { setShowNotesModal(false); setNotesLead(null); }} className="text-gray-450 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveQuickNote} className="space-y-4">
              <p className="text-xs text-gray-500">
                Update notes and remarks for lead: <strong className="text-gray-800">{notesLead.name}</strong>
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Notes & Details</label>
                <textarea
                  className="w-full p-4 border border-gray-250 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition bg-gray-50 focus:bg-white resize-none"
                  rows={6}
                  placeholder="Enter specific inquiries, custom design requests, budget estimates, or callback notes..."
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowNotesModal(false); setNotesLead(null); }}
                  className="px-4 py-2 border border-gray-255 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Schedule Call Modal */}
      {showScheduleModal && scheduleLead && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📅</span>
                <h4 className="font-serif font-bold text-brand-maroon text-lg">Schedule Call</h4>
              </div>
              <button onClick={() => { setShowScheduleModal(false); setScheduleLead(null); }} className="text-gray-450 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <p className="text-xs text-gray-500">
                Schedule a follow-up call with <strong className="text-gray-800">{scheduleLead.name}</strong>
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-455 uppercase mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full p-3 border border-gray-250 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition bg-gray-50 focus:bg-white"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowScheduleModal(false); setScheduleLead(null); }}
                  className="px-4 py-2 border border-gray-255 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
