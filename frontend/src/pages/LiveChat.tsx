import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { 
  MessageSquare, 
  Send, 
  User, 
  Phone, 
  Mail, 
  Tag, 
  FileText,
  Search,
  Instagram
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  source: string;
  interestedIn?: string;
  notes?: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  channel: string;
  platform_id?: string;
}

interface Template {
  id: string;
  name: string;
  body: string;
}

export const LiveChat = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      // 1. Fetch leads
      const leadsList = await apiFetch('/crm/leads');
      setLeads(leadsList);
      
      // 2. Fetch templates
      const templatesList = await apiFetch('/whatsapp/templates');
      setTemplates(templatesList);

      // 3. Fetch all messages
      const waMsgs = await apiFetch('/whatsapp/messages');
      const metaDms = await apiFetch('/meta/dms');
      
      const allMsgs = [...waMsgs, ...metaDms].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(allMsgs);
      
      // Set first lead as active by default if none is set
      if (leadsList.length > 0 && !activeLead) {
        setActiveLead(leadsList[0]);
      }
    } catch (err) {
      console.error("Failed to load chat data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Scroll to bottom when message list changes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeLead]);

  // Filters leads by search query
  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lead.phone.includes(searchQuery)
  );

  // Get messages for the currently selected lead (based on matching phone or platform_id)
  const getActiveMessages = () => {
    if (!activeLead) return [];
    
    return messages.filter(msg => {
      // WhatsApp channel: Match phone number
      if (msg.channel === 'WhatsApp') {
        return msg.from === activeLead.phone || msg.to === activeLead.phone;
      }
      // Meta channels: Match name or platform identifier
      if (msg.channel === 'Facebook DM' || msg.channel === 'Instagram DM') {
        const queryName = activeLead.name.toLowerCase();
        return msg.from.toLowerCase().includes(queryName) || msg.to.toLowerCase().includes(queryName) || msg.platform_id === activeLead.id;
      }
      return false;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !replyText.trim()) return;

    setSending(true);
    try {
      const channel = activeLead.source === 'WhatsApp' ? 'WhatsApp' : 
                      activeLead.source === 'Meta Ads' ? 'Instagram DM' : 'WhatsApp';
      
      if (channel === 'WhatsApp') {
        await apiFetch('/whatsapp/send', {
          method: 'POST',
          body: JSON.stringify({
            to_number: activeLead.phone,
            body: replyText
          })
        });
      } else {
        await apiFetch('/meta/dms/send', {
          method: 'POST',
          body: JSON.stringify({
            recipient_id: activeLead.name,
            message_text: replyText,
            platform: 'instagram'
          })
        });
      }
      
      setReplyText('');
      // Reload messages list
      const waMsgs = await apiFetch('/whatsapp/messages');
      const metaDms = await apiFetch('/meta/dms');
      const allMsgs = [...waMsgs, ...metaDms].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(allMsgs);
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateLead = async (status: string, notes: string) => {
    if (!activeLead) return;
    try {
      const updated = { ...activeLead, status, notes };
      await apiFetch(`/crm/leads/${activeLead.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      setActiveLead(updated);
      
      // refresh leads list
      const leadsList = await apiFetch('/crm/leads');
      setLeads(leadsList);
    } catch (err) {
      console.error("Failed to update lead details", err);
    }
  };

  const insertTemplate = (body: string) => {
    if (!activeLead) return;
    const personalized = body.replace('{{name}}', activeLead.name).replace('{{service}}', activeLead.interestedIn || 'our catalog');
    setReplyText(personalized);
  };

  const getChannelIcon = (source: string) => {
    switch (source) {
      case 'WhatsApp':
        return <span className="text-emerald-500 font-bold">WA</span>;
      case 'Meta Ads':
        return <Instagram size={14} className="text-pink-500" />;
      default:
        return <User size={14} className="text-gray-400" />;
    }
  };

  const currentMessages = getActiveMessages();

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
      
      {/* 1. Conversations List Side Panel */}
      <div className="w-80 border-r border-gray-100 flex flex-col h-full bg-gray-50 bg-opacity-30">
        <div className="p-4 border-b border-gray-150">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search chat or phone..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredLeads.map(lead => {
            const isSelected = activeLead?.id === lead.id;
            return (
              <button
                key={lead.id}
                onClick={() => setActiveLead(lead)}
                className={`w-full p-4 text-left flex items-start space-x-3 transition-colors ${
                  isSelected ? 'bg-brand-cream border-l-4 border-brand-maroon' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-brand-goldLight text-white flex items-center justify-center font-bold font-serif shrink-0">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h5 className="font-bold text-gray-800 text-sm truncate">{lead.name}</h5>
                    <span className="text-[10px] text-gray-400 shrink-0 capitalize">{lead.source}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{lead.phone}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-white text-brand-maroon border border-brand-gold border-opacity-35 capitalize">
                      {lead.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Message History Thread Panel */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {activeLead ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 bg-opacity-30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold text-white flex items-center justify-center font-bold">
                  {activeLead.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-gray-850 text-sm">{activeLead.name}</h4>
                  <p className="text-xs text-gray-550 flex items-center space-x-1">
                    {getChannelIcon(activeLead.source)}
                    <span className="ml-1">{activeLead.phone}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-cream bg-opacity-20">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
                  <MessageSquare size={36} className="text-gray-300 mb-2" />
                  <p className="text-sm">No messages yet. Send a WhatsApp template or reply below to start the conversation!</p>
                </div>
              ) : (
                currentMessages.map((msg) => {
                  const isCRM = msg.from === 'Sirisamruddhi CRM' || msg.from === 'Sirisamruddhi Gold Palace';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isCRM ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-sm text-sm ${
                        isCRM 
                          ? 'bg-brand-maroon text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}>
                        <p className="leading-relaxed">{msg.body}</p>
                        <div className={`text-[9px] mt-1 text-right ${isCRM ? 'text-brand-cream opacity-70' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="ml-1 text-[8px] font-bold uppercase">({msg.channel})</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Reply Box */}
            <div className="p-4 border-t border-gray-100 space-y-3">
              {/* Template Presets selector */}
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                <span className="text-xs text-gray-500 font-semibold shrink-0">Presets:</span>
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => insertTemplate(tpl.body)}
                    className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs hover:bg-brand-cream hover:text-brand-maroon transition shrink-0"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type your response..."
                  className="flex-grow px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="p-3 bg-brand-maroon text-white rounded-xl hover:bg-opacity-95 transition shadow disabled:opacity-70"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare size={48} className="text-gray-300 mb-2" />
            <p className="text-sm">Select a lead from the side drawer to initiate a live chat.</p>
          </div>
        )}
      </div>

      {/* 3. Right Details Drawer */}
      {activeLead && (
        <div className="w-80 border-l border-gray-100 p-6 space-y-6 h-full overflow-y-auto bg-gray-50 bg-opacity-30">
          <h3 className="font-bold text-gray-800 font-serif border-b border-gray-150 pb-2">Prospect Profile</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-cream text-brand-gold rounded-lg">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Full Name</p>
                <h5 className="font-semibold text-gray-800 text-sm">{activeLead.name}</h5>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-cream text-brand-gold rounded-lg">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Phone Number</p>
                <h5 className="font-semibold text-gray-800 text-sm">{activeLead.phone}</h5>
              </div>
            </div>

            {activeLead.email && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-cream text-brand-gold rounded-lg">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Email</p>
                  <h5 className="font-semibold text-gray-800 text-sm truncate max-w-[170px]">{activeLead.email}</h5>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-cream text-brand-gold rounded-lg">
                <Tag size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Acquisition Channel</p>
                <h5 className="font-semibold text-gray-800 text-sm capitalize">{activeLead.source}</h5>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-150 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Lead Pipeline Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-1 focus:ring-brand-gold font-medium"
                value={activeLead.status}
                onChange={(e) => handleUpdateLead(e.target.value, activeLead.notes || '')}
              >
                <option value="New Lead">New Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Quotation">Quotation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center space-x-1">
                <FileText size={12} />
                <span>Custom Notes</span>
              </label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-1 focus:ring-brand-gold resize-none"
                rows={4}
                placeholder="Add private log notes..."
                value={activeLead.notes || ''}
                onChange={(e) => setActiveLead({ ...activeLead, notes: e.target.value })}
                onBlur={() => handleUpdateLead(activeLead.status, activeLead.notes || '')}
              />
              <p className="text-[9px] text-gray-400 italic">Auto-saves on input focus out.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
