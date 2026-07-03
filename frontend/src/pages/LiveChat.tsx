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
  Camera,
  Share2,
  Smartphone
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

type ChannelTab = 'WhatsApp' | 'Facebook' | 'Instagram';

const CHANNEL_CONFIG: Record<ChannelTab, { label: string; color: string; bg: string; borderColor: string; icon: React.ReactNode; msgChannel: string }> = {
  WhatsApp: {
    label: 'WhatsApp',
    color: '#16a34a',
    bg: '#f0fdf4',
    borderColor: '#bbf7d0',
    icon: <Smartphone size={14} />,
    msgChannel: 'WhatsApp',
  },
  Facebook: {
    label: 'Facebook',
    color: '#1877F2',
    bg: '#eff6ff',
    borderColor: '#bfdbfe',
    icon: <Share2 size={14} />,
    msgChannel: 'Facebook DM',
  },
  Instagram: {
    label: 'Instagram',
    color: '#E1306C',
    bg: '#fdf2f8',
    borderColor: '#fbcfe8',
    icon: <Camera size={14} />,
    msgChannel: 'Instagram DM',
  },
};

export const LiveChat = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChannelTab>('WhatsApp');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [leadsList, templatesList, waMsgs, metaDms] = await Promise.all([
        apiFetch('/crm/leads'),
        apiFetch('/whatsapp/templates'),
        apiFetch('/whatsapp/messages'),
        apiFetch('/meta/dms'),
      ]);

      setLeads(leadsList);
      setTemplates(templatesList);

      const allMsgs = [...waMsgs, ...metaDms].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(allMsgs);

      if (leadsList.length > 0 && !activeLead) {
        setActiveLead(leadsList[0]);
      }
    } catch (err) {
      console.error('Failed to load chat data', err);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeLead, activeChannel]);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone.includes(searchQuery)
  );

  // Filter messages by active lead AND active channel tab
  const getActiveMessages = (): Message[] => {
    if (!activeLead) return [];
    const channelKey = CHANNEL_CONFIG[activeChannel].msgChannel;

    return messages.filter(msg => {
      if (msg.channel !== channelKey) return false;
      if (activeChannel === 'WhatsApp') {
        return msg.from === activeLead.phone || msg.to === activeLead.phone;
      }
      return (
        msg.from.toLowerCase().includes(activeLead.name.toLowerCase()) ||
        msg.platform_id === activeLead.id
      );
    });
  };

  // Count unread/total messages per channel for badge
  const countByChannel = (channelKey: string) =>
    messages.filter(m => m.channel === channelKey).length;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !replyText.trim()) return;
    setSending(true);
    try {
      if (activeChannel === 'WhatsApp') {
        await apiFetch('/whatsapp/send', {
          method: 'POST',
          body: JSON.stringify({ to_number: activeLead.phone, body: replyText }),
        });
      } else {
        await apiFetch('/meta/dms/send', {
          method: 'POST',
          body: JSON.stringify({
            recipient_id: activeLead.name,
            message_text: replyText,
            platform: activeChannel === 'Facebook' ? 'facebook' : 'instagram',
          }),
        });
      }
      setReplyText('');
      await loadData();
    } catch (err) {
      console.error('Failed to send message', err);
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
        body: JSON.stringify(updated),
      });
      setActiveLead(updated);
      const leadsList = await apiFetch('/crm/leads');
      setLeads(leadsList);
    } catch (err) {
      console.error('Failed to update lead', err);
    }
  };

  const insertTemplate = (body: string) => {
    if (!activeLead) return;
    setReplyText(body.replace('{{name}}', activeLead.name).replace('{{service}}', activeLead.interestedIn || 'our catalog'));
  };

  const currentMessages = getActiveMessages();
  const cfg = CHANNEL_CONFIG[activeChannel];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-fadeIn gap-0">
      
      {/* ── Header with channel tabs ── */}
      <div className="bg-white rounded-t-2xl border border-gray-100 shadow-sm">
        <div className="px-5 pt-4 pb-0 flex items-center justify-between border-b border-gray-100">
          <div>
            <h1 className="text-xl font-serif font-bold" style={{ color: '#800000' }}>Live Chat</h1>
            <p className="text-xs text-gray-400 pb-3">Omnichannel messaging — WhatsApp, Facebook & Instagram</p>
          </div>
        </div>

        {/* Channel Tab Pills */}
        <div className="flex px-4 space-x-1 -mb-px">
          {(Object.keys(CHANNEL_CONFIG) as ChannelTab[]).map(ch => {
            const count = countByChannel(CHANNEL_CONFIG[ch].msgChannel);
            const isActive = activeChannel === ch;
            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${isActive ? '' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                style={isActive ? {
                  color: CHANNEL_CONFIG[ch].color,
                  borderBottomColor: CHANNEL_CONFIG[ch].color,
                  backgroundColor: `${CHANNEL_CONFIG[ch].color}08`,
                } : {}}
              >
                <span style={{ color: isActive ? CHANNEL_CONFIG[ch].color : undefined }}>{CHANNEL_CONFIG[ch].icon}</span>
                <span>{ch}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-white text-xs" style={{ backgroundColor: isActive ? CHANNEL_CONFIG[ch].color : '#9ca3af', fontSize: '10px' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex flex-1 overflow-hidden bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm">

        {/* Contacts sidebar */}
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs outline-none focus:bg-white focus:ring-2 transition"
                style={{ '--tw-ring-color': 'rgba(245,158,11,0.4)' } as React.CSSProperties}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredLeads.map(lead => {
              const isSelected = activeLead?.id === lead.id;
              return (
                <button
                  key={lead.id}
                  onClick={() => setActiveLead(lead)}
                  className="w-full p-3.5 text-left flex items-start space-x-3 transition-all"
                  style={isSelected ? {
                    backgroundColor: cfg.bg,
                    borderLeft: `3px solid ${cfg.color}`,
                  } : { borderLeft: '3px solid transparent' }}
                >
                  <div className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ backgroundColor: isSelected ? cfg.color : '#800000' }}>
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h5 className="font-bold text-gray-800 text-xs truncate">{lead.name}</h5>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{lead.phone}</p>
                    <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500">
                      {lead.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeLead ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center space-x-3"
                style={{ backgroundColor: `${cfg.color}08` }}>
                <div className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0"
                  style={{ backgroundColor: cfg.color }}>
                  {activeLead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm">{activeLead.name}</h4>
                  <div className="flex items-center space-x-1.5 text-xs" style={{ color: cfg.color }}>
                    {cfg.icon}
                    <span className="font-medium">{cfg.label}</span>
                    <span className="text-gray-400">· {activeLead.phone}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ backgroundColor: '#fdf9f0' }}>
                {currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${cfg.color}15` }}>
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-600">No {cfg.label} messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Send a message below to start the conversation</p>
                  </div>
                ) : (
                  currentMessages.map(msg => {
                    const isCRM = msg.from === 'Sirisamruddhi CRM' || msg.from === 'Sirisamruddhi Gold Palace' || msg.from === 'page' || msg.from === 'instagram_business';
                    return (
                      <div key={msg.id} className={`flex ${isCRM ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm`}
                          style={isCRM ? {
                            background: `linear-gradient(135deg, #800000, ${cfg.color})`,
                            color: 'white',
                            borderTopRightRadius: '4px',
                          } : {
                            backgroundColor: 'white',
                            color: '#1f2937',
                            borderTopLeftRadius: '4px',
                            border: '1px solid #f3f4f6',
                          }}>
                          <p className="leading-relaxed">{msg.body}</p>
                          <p className="text-right mt-0.5" style={{ fontSize: '9px', opacity: 0.65 }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="p-4 border-t border-gray-100 space-y-2 bg-white">
                {templates.length > 0 && (
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    <span className="text-xs text-gray-400 font-semibold shrink-0">Templates:</span>
                    {templates.map(tpl => (
                      <button key={tpl.id} onClick={() => insertTemplate(tpl.body)}
                        className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs hover:border-yellow-300 hover:text-yellow-700 transition shrink-0">
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder={`Send via ${cfg.label}...`}
                    className="flex-grow px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 transition"
                    style={{ '--tw-ring-color': `${cfg.color}40` } as React.CSSProperties}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={sending}
                    className="p-2.5 rounded-xl text-white transition shadow disabled:opacity-70"
                    style={{ backgroundColor: cfg.color }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare size={40} className="text-gray-300 mb-2" />
              <p className="text-sm">Select a contact to start chatting</p>
            </div>
          )}
        </div>

        {/* Lead profile drawer */}
        {activeLead && (
          <div className="w-64 border-l border-gray-100 flex flex-col overflow-y-auto bg-gray-50">
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-lg mx-auto mb-2"
                style={{ background: 'linear-gradient(135deg, #800000, #F59E0B)' }}>
                {activeLead.name.charAt(0)}
              </div>
              <h4 className="font-bold text-gray-800 text-sm text-center">{activeLead.name}</h4>
              <p className="text-xs text-gray-500 text-center mt-0.5">{activeLead.source}</p>
            </div>
            <div className="p-4 space-y-3 flex-1">
              {[
                { icon: <Phone size={13} />, label: 'Phone', value: activeLead.phone },
                { icon: <Mail size={13} />, label: 'Email', value: activeLead.email || 'N/A' },
                { icon: <Tag size={13} />, label: 'Interest', value: activeLead.interestedIn || 'N/A' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 flex items-center space-x-1 mb-0.5">
                    <span style={{ color: '#800000' }}>{item.icon}</span>
                    <span className="uppercase tracking-wide font-bold" style={{ fontSize: '9px' }}>{item.label}</span>
                  </p>
                  <p className="text-xs font-semibold text-gray-700 truncate">{item.value}</p>
                </div>
              ))}

              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1.5" style={{ fontSize: '9px' }}>Pipeline Status</p>
                <select
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"
                  value={activeLead.status}
                  onChange={e => handleUpdateLead(e.target.value, activeLead.notes || '')}
                >
                  {['New Lead','Contacted','Interested','Quotation','Won','Lost'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1.5 flex items-center space-x-1" style={{ fontSize: '9px' }}>
                  <FileText size={10} /><span>Notes</span>
                </p>
                <textarea
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none resize-none"
                  rows={3}
                  placeholder="Private notes..."
                  value={activeLead.notes || ''}
                  onChange={e => setActiveLead({ ...activeLead, notes: e.target.value })}
                  onBlur={() => handleUpdateLead(activeLead.status, activeLead.notes || '')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
