import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { 
  Plus, Search, RefreshCw, Edit, Phone, Mail, Download, Upload, 
  MessageSquare, FileText, Bot, Volume2, Shield, Radio, CheckCircle, 
  PhoneCall, Sparkles, AlertCircle, Mic, MicOff, Settings
} from 'lucide-react';

interface CallLog {
  callId?: string;
  callType?: string;
  durationSeconds?: number;
  transcript?: { sender: 'agent' | 'customer'; text: string }[];
  qualification?: any;
  recordingUrl?: string;
  timestamp?: string;
  status?: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string;
  interestedIn?: string;
  notes?: string;
  scheduledCall?: string;
  createdAt: string;
  callLogs?: CallLog[];
}

export const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // AI Voice Agent Quick Selector State
  const [selectedLeadForCallId, setSelectedLeadForCallId] = useState<string>('');
  const [manualCallName, setManualCallName] = useState('');
  const [manualCallPhone, setManualCallPhone] = useState('');
  const [callType, setCallType] = useState<'web' | 'phone' | 'simulated'>('web');

  // Add Lead Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [addModalError, setAddModalError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [status, setStatus] = useState('New Lead');
  const [interest, setInterest] = useState('Gold Jewelry');
  const [notes, setNotes] = useState('');

  // Edit Lead Modal State
  const [showEdit, setShowEdit] = useState(false);
  const [editModalError, setEditModalError] = useState('');
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

  // Indian AI Voice Call State & Audio Pipeline
  const [showAiModal, setShowAiModal] = useState(false);
  const [simLead, setSimLead] = useState<Lead | null>(null);
  const [simStep, setSimStep] = useState<'config' | 'calling' | 'active' | 'summary'>('config');
  const [simTime, setSimTime] = useState(0);
  const [simTranscript, setSimTranscript] = useState<{ sender: 'agent' | 'customer'; text: string }[]>([]);
  const [simMode, setSimMode] = useState<'interactive' | 'auto'>('auto');
  const [simIsAgentTyping, setSimIsAgentTyping] = useState(false);
  const [simCustomInput, setSimCustomInput] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState('indian_ai');
  const [simLeadQualification, setSimLeadQualification] = useState({
    interest: 'Gold Jewelry',
    budget: '₹3 Lakh - ₹4 Lakh',
    occasion: 'Daughter\'s Wedding',
    showroom: 'Yelahanka',
    timeline: 'This weekend',
    outcome: 'Wants Showroom Visit'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const simTimerRef = useRef<any>(null);
  const simTimeoutRef = useRef<any>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // Realistic Telephone Sound Synthesizer (Pure Web Audio, zero external assets)
  const playPhoneRing = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (delay: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.value = 400;
        osc2.frequency.value = 450;
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 0.05);
        gain.gain.setValueAtTime(0.06, startTime + 0.8);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.85);
        
        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.9);
        osc2.stop(startTime + 0.9);
      };

      playTone(0.1);
      playTone(1.2);
    } catch (e) {
      console.warn("AudioContext tone warning:", e);
    }
  };

  // Indian Accent Text-to-Speech Output
  const speakIndianVoice = (text: string) => {
    if (isSpeechMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/₹/g, 'Rupees ').replace(/\*/g, '').replace(/👑/g, '').replace(/💎/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => 
        v.lang === 'en-IN' || 
        v.lang === 'hi-IN' || 
        v.name.toLowerCase().includes('india') || 
        v.name.toLowerCase().includes('heera') || 
        v.name.toLowerCase().includes('ravi') || 
        v.name.toLowerCase().includes('veena') || 
        v.name.toLowerCase().includes('rishi')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  // Live Speech Recognition (Microphone input)
  const toggleListening = () => {
    if (isMicActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsMicActive(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone voice input is not supported in this browser. You can type in the box below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsMicActive(true);
      recognition.onend = () => setIsMicActive(false);
      recognition.onerror = () => setIsMicActive(false);
      recognition.onresult = (event: any) => {
        const transcriptText = event.results?.[0]?.[0]?.transcript;
        if (transcriptText) {
          handleCustomerResponse(transcriptText);
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition start failed:", e);
      setIsMicActive(false);
    }
  };

  // Auto-hide success toast after 4 seconds
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successToast]);

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/crm/leads');
      if (Array.isArray(data)) {
        setLeads(data);
        if (data.length > 0 && !selectedLeadForCallId) {
          setSelectedLeadForCallId(data[0].id);
        }
      } else {
        setLeads([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // Open AI Call for a specific lead or manual input
  const openAiCallSimulator = (lead?: Lead) => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    if (lead) {
      setSimLead(lead);
      setSelectedLeadForCallId(lead.id);
    } else if (selectedLeadForCallId) {
      const found = leads.find(l => l.id === selectedLeadForCallId);
      if (found) {
        setSimLead(found);
      } else {
        setSimLead({
          id: `lead_${Date.now().toString().slice(-6)}`,
          name: manualCallName || 'Walk-in Customer',
          phone: manualCallPhone || '+91 98765 43210',
          source: 'AI Outbound Agent',
          status: 'New Lead',
          interestedIn: 'Gold Jewelry',
          notes: '',
          createdAt: new Date().toISOString()
        });
      }
    } else {
      setSimLead({
        id: `lead_${Date.now().toString().slice(-6)}`,
        name: manualCallName || 'Showroom Prospect',
        phone: manualCallPhone || '+91 98765 43210',
        source: 'AI Outbound Agent',
        status: 'New Lead',
        interestedIn: 'Gold Jewelry',
        notes: '',
        createdAt: new Date().toISOString()
      });
    }

    setSimStep('config');
    setSimTranscript([]);
    setSimTime(0);
    setShowAiModal(true);
  };

  const startSimulatedCall = () => {
    if (!simLead) return;
    setSimStep('calling');
    playPhoneRing();

    setTimeout(() => {
      setSimStep('active');
      setSimTime(0);
      
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      simTimerRef.current = setInterval(() => {
        setSimTime(prev => prev + 1);
      }, 1000);

      // Indian AI Agent Greeting
      setSimIsAgentTyping(true);
      const greeting = `Namaste! May I speak with ${simLead.name}? I am calling from Siri Samruddhi Gold Palace. Is this a good time for a quick conversation?`;
      setTimeout(() => {
        setSimTranscript([
          {
            sender: 'agent',
            text: greeting
          }
        ]);
        setSimIsAgentTyping(false);
        speakIndianVoice(greeting);
      }, 1200);
    }, 2200);
  };

  const endSimulatedCall = async () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSimIsAgentTyping(false);
    setIsAiSpeaking(false);
    if (isMicActive && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsMicActive(false);
    }

    try {
      // Call backend AI analysis endpoint if transcript exists
      if (simTranscript.length > 0 && simLead) {
        const analysis = await apiFetch('/voice-agent/analyze', {
          method: 'POST',
          body: JSON.stringify({
            transcript: simTranscript,
            leadName: simLead.name,
            leadId: simLead.id,
            autoSave: false
          })
        });

        if (analysis) {
          setSimLeadQualification({
            interest: analysis.interest || simLead.interestedIn || 'Gold Jewelry',
            budget: analysis.budget || '₹3 Lakh - ₹4 Lakh',
            occasion: analysis.occasion || 'Wedding',
            showroom: analysis.showroom || 'Yelahanka',
            timeline: analysis.timeline || 'This weekend',
            outcome: analysis.outcome || 'Wants Showroom Visit'
          });
        }
      }
    } catch (e) {
      console.warn("Analysis fallback: ", e);
    }

    setSimStep('summary');
  };

  const handleSaveSimQualification = async () => {
    if (!simLead) return;
    try {
      const summaryText = `[AI Voice Call Qualification]
- Product Interest: ${simLeadQualification.interest}
- Budget Range: ${simLeadQualification.budget}
- Occasion: ${simLeadQualification.occasion}
- Preferred Showroom: ${simLeadQualification.showroom}
- Timeline: ${simLeadQualification.timeline}
- Call Outcome: ${simLeadQualification.outcome}

Previous Notes:
${simLead.notes || 'None'}`;

      const newStatus = simLeadQualification.outcome === 'Wants Showroom Visit' 
        ? 'Interested' 
        : (simLeadQualification.outcome === 'Wants Callback' ? 'Contacted' : simLead.status);

      // Save update to lead via PUT /crm/leads/{id}
      await apiFetch(`/crm/leads/${simLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: simLead.name,
          phone: simLead.phone,
          email: simLead.email || '',
          source: simLead.source || 'Walk-in',
          status: newStatus,
          interestedIn: simLeadQualification.interest,
          notes: summaryText
        })
      });

      // Also record in call logs endpoint
      try {
        await apiFetch(`/crm/leads/${simLead.id}/calls`, {
          method: 'POST',
          body: JSON.stringify({
            callType: callType,
            durationSeconds: simTime,
            transcript: simTranscript,
            qualification: simLeadQualification,
            notes: summaryText,
            status: newStatus
          })
        });
      } catch (logErr) {
        console.warn("Call log recording non-fatal:", logErr);
      }

      setShowAiModal(false);
      setSimLead(null);
      setSuccessToast(`AI Qualification for ${simLead.name} saved successfully to CRM!`);
      loadLeads();
    } catch (err: any) {
      alert(`Failed to save AI qualification: ${err.message}`);
    }
  };

  const executeAutoPlay = () => {
    if (!simLead) return;
    
    const script: { sender: 'agent' | 'customer'; text: string }[] = [
      { sender: 'agent', text: `Namaste! May I speak with ${simLead.name}?` },
      { sender: 'customer', text: `Yes, this is ${simLead.name}. Speaking.` },
      { sender: 'agent', text: `Hi ${simLead.name}, I am calling from Siri Samruddhi Gold Palace. Is this a good time for a quick conversation?` },
      { sender: 'customer', text: "Yes, sure. I had submitted an inquiry on your website." },
      { sender: 'agent', text: `Great! I noticed you are interested in ${simLead.interestedIn || 'Gold Jewelry'}. Are you mainly looking for gold jewellery, diamond jewellery, silver jewellery, or wedding sarees?` },
      { sender: 'customer', text: "I am looking for an antique gold necklace and bangles for my daughter's wedding in October." },
      { sender: 'agent', text: "Congratulations to your daughter! What type of design are you looking for, and do you have an approximate budget range in mind?" },
      { sender: 'customer', text: "Around 3 to 4 lakhs, and we want a traditional heritage temple style." },
      { sender: 'agent', text: "That sounds magnificent! We have an exclusive collection of handcrafted temple gold jewellery. Also, you can enjoy our active offers: up to 100% FREE making charges, and a FREE Gold Coin on purchases above ₹2.5 Lakh! Would you like to schedule a visit to one of our showrooms in Yelahanka, Kolar, or Udupi?" },
      { sender: 'customer', text: "Yes, Yelahanka is very convenient for us. We will visit this weekend." },
      { sender: 'agent', text: "Wonderful! I have reserved your VIP showroom visit for our Yelahanka showroom and notified our senior jewellery specialists. Thank you for your time, and we look forward to welcoming you at Siri Samruddhi Gold Palace!" },
      { sender: 'customer', text: "Thank you so much! Goodbye." }
    ];

    setSimStep('active');
    setSimTime(0);
    setSimTranscript([]);
    
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(() => {
      setSimTime(prev => prev + 1);
    }, 1000);

    let idx = 0;
    
    const playNext = () => {
      if (idx >= script.length) {
        setTimeout(() => {
          setSimLeadQualification({
            interest: 'Gold Jewelry',
            budget: '₹3 Lakh - ₹4 Lakh',
            occasion: 'Daughter\'s Wedding (October)',
            showroom: 'Yelahanka',
            timeline: 'This weekend',
            outcome: 'Wants Showroom Visit'
          });
          endSimulatedCall();
        }, 1500);
        return;
      }

      const msg = script[idx];
      if (msg.sender === 'agent') {
        setSimIsAgentTyping(true);
        simTimeoutRef.current = setTimeout(() => {
          setSimTranscript(prev => [...prev, msg]);
          setSimIsAgentTyping(false);
          speakIndianVoice(msg.text);
          idx++;
          simTimeoutRef.current = setTimeout(playNext, 2600);
        }, 1200);
      } else {
        setSimTranscript(prev => [...prev, msg]);
        idx++;
        simTimeoutRef.current = setTimeout(playNext, 2000);
      }
    };

    playNext();
  };

  const handleCustomerResponse = async (text: string) => {
    if (!text.trim()) return;
    
    const newTranscript = [...simTranscript, { sender: 'customer' as const, text }];
    setSimTranscript(newTranscript);
    setSimCustomInput('');
    setSimIsAgentTyping(true);

    let agentReply = "";
    try {
      const res = await apiFetch('/voice-agent/reply', {
        method: 'POST',
        body: JSON.stringify({
          text: text,
          customerName: simLead?.name || 'Customer',
          interest: simLead?.interestedIn || 'Gold Jewelry'
        })
      });
      if (res?.reply) {
        agentReply = res.reply;
      }
    } catch (e) {
      console.warn("Backend dialogue reply fallback:", e);
    }

    if (!agentReply) {
      const lower = text.toLowerCase();
      if (lower.includes('rate') || lower.includes('price')) {
        agentReply = "Market gold prices fluctuate daily. To provide you today's exact hallmark rate with store discounts, our showroom team in Yelahanka, Kolar, or Udupi will confirm with you directly. Plus, our Samruddhi Flexi scheme lets you lock today's gold rate for 90 days!";
      } else if (lower.includes('offer') || lower.includes('discount')) {
        agentReply = "Currently, we have up to 100% FREE making charges on select jewellery, a FREE 24K Gold Coin on purchases above ₹2.5 Lakh, and the Samruddhi Golden Flexi rate-lock scheme!";
      } else if (lower.includes('yelahanka')) {
        agentReply = "Yelahanka showroom has an exclusive bridal collection and silk sarees floor. What time or day would you prefer to visit?";
      } else if (lower.includes('kolar')) {
        agentReply = "Our Kolar showroom team will be happy to assist you! Would you like a morning or evening visit?";
      } else if (lower.includes('udupi')) {
        agentReply = "Our Udupi showroom showcases traditional coastal gold jewellery and diamonds. Would you like me to reserve an appointment for you?";
      } else {
        agentReply = `Thank you for sharing that! Our showroom jewellery specialists at Siri Samruddhi Gold Palace will be delighted to assist you with the best designs and offers.`;
      }
    }

    setTimeout(() => {
      setSimTranscript(prev => [...prev, { sender: 'agent', text: agentReply }]);
      setSimIsAgentTyping(false);
      speakIndianVoice(agentReply);
    }, 900);
  };

  // Add Lead
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError('');
    try {
      await apiFetch('/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          source,
          status,
          interestedIn: interest,
          notes: notes.trim()
        })
      });
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setShowAdd(false);
      setSuccessToast('New lead added successfully to CRM!');
      loadLeads();
    } catch (err: any) {
      setAddModalError(err.message || 'Failed to add lead. Please verify inputs.');
    }
  };

  // Edit Lead
  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditName(lead.name);
    setEditPhone(lead.phone);
    setEditEmail(lead.email || '');
    setEditSource(lead.source || 'Walk-in');
    setEditStatus(lead.status || 'New Lead');
    setEditInterest(lead.interestedIn || 'Gold Jewelry');
    setEditNotes(lead.notes || '');
    setEditModalError('');
    setShowEdit(true);
  };

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setEditModalError('');
    try {
      await apiFetch(`/crm/leads/${editingLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          source: editSource,
          status: editStatus,
          interestedIn: editInterest,
          notes: editNotes.trim()
        })
      });
      setShowEdit(false);
      setEditingLead(null);
      setSuccessToast('Lead updated successfully!');
      loadLeads();
    } catch (err: any) {
      setEditModalError(err.message || 'Failed to update lead');
    }
  };

  // Quick Notes Save
  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesLead) return;
    try {
      await apiFetch(`/crm/leads/${notesLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: notesLead.name,
          phone: notesLead.phone,
          notes: notesContent
        })
      });
      setShowNotesModal(false);
      setNotesLead(null);
      setSuccessToast('Lead notes updated!');
      loadLeads();
    } catch (err: any) {
      alert(`Failed to save notes: ${err.message}`);
    }
  };

  // Schedule Call
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleLead || !scheduleTime) return;
    try {
      const isoTime = new Date(scheduleTime).toISOString();
      await apiFetch(`/crm/leads/${scheduleLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: scheduleLead.name,
          phone: scheduleLead.phone,
          scheduledCall: isoTime
        })
      });
      setShowScheduleModal(false);
      setScheduleLead(null);
      setScheduleTime('');
      setSuccessToast('Follow-up call scheduled!');
      loadLeads();
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
          
          setSuccessToast(`Successfully imported ${parsedLeads.length} leads!`);
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
    (l.name && l.name.toLowerCase().includes(search.toLowerCase())) || 
    (l.phone && l.phone.includes(search)) || 
    (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
    (l.interestedIn && l.interestedIn.toLowerCase().includes(search.toLowerCase()))
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

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900/90 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-maroon">Leads Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage, qualify, and track your jewellery prospects with AI Voice Agent</p>
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
            onClick={() => {
              setAddModalError('');
              setShowAdd(true);
            }}
            className="flex items-center space-x-2 bg-brand-maroon text-white font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition shadow-sm"
          >
            <Plus size={18} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-600 text-sm font-bold">API Connection Notice</p>
            <p className="text-red-500 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Indian AI Voice Agent Hub & Manual Lead Selector Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-amber-950/80 p-5 rounded-2xl border border-amber-500/40 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/30 shadow-inner">
              <Bot className="h-7 w-7 text-amber-400 animate-pulse-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-amber-400 font-serif">🇮🇳 Siri Samruddhi Indian AI Voice Agent</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero API Keys Needed • 100% Free
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Authentic Indian voice conversation, real audio speech (TTS), live mic recognition, 100% free making charges offers & automated CRM qualification
              </p>
            </div>
          </div>

          {/* Lead Selector Dropdown & Call Trigger */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="flex-1 min-w-[220px]">
              <select
                value={selectedLeadForCallId}
                onChange={(e) => setSelectedLeadForCallId(e.target.value)}
                className="w-full bg-slate-800/90 text-slate-100 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- Select Lead from Dropdown --</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.phone}) - {lead.interestedIn || 'Gold'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const found = leads.find(l => l.id === selectedLeadForCallId);
                openAiCallSimulator(found);
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-900/30 text-xs shrink-0"
            >
              <PhoneCall size={16} />
              <span>Launch Indian Voice Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search leads by name, phone, product interest..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition text-sm bg-gray-50 focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Leads: <strong className="text-brand-maroon">{filtered.length}</strong>
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
                <th className="p-4">Notes & Qualification</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    <LoadingSpinner />
                    <p className="mt-2 text-xs">Loading showroom leads...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className={`hover:bg-amber-50/20 transition ${
                      selectedLeadIds.includes(lead.id) ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedLeadIds.includes(lead.id)} 
                        onChange={() => handleSelectOne(lead.id)}
                        className="h-4.5 w-4.5 text-brand-maroon focus:ring-brand-gold border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      <div>{lead.name}</div>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="font-medium text-xs text-gray-800">{lead.phone}</div>
                      <div className="text-[11px] text-gray-400">{lead.email || 'No email'}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {lead.source}
                      </span>
                    </td>
                    <td className="p-4 text-gray-800 font-medium">
                      <span className="text-brand-gold font-semibold text-xs">
                        {lead.interestedIn || 'Gold Jewelry'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-maroon border border-brand-gold border-opacity-30">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 max-w-xs truncate text-xs">
                      {lead.notes ? (
                        <div 
                          onClick={() => { setNotesLead(lead); setNotesContent(lead.notes || ''); setShowNotesModal(true); }}
                          className="bg-amber-50/40 p-1.5 rounded-lg border border-brand-gold/20 text-gray-700 cursor-pointer truncate"
                          title={lead.notes}
                        >
                          {lead.notes}
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setNotesLead(lead); setNotesContent(''); setShowNotesModal(true); }}
                          className="text-xs font-bold text-brand-gold hover:text-brand-maroon"
                        >
                          + Add Note
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => openAiCallSimulator(lead)}
                          className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200"
                          title="Call with AI Voice Agent"
                        >
                          <Bot size={16} />
                        </button>

                        <button
                          onClick={() => openEditModal(lead)}
                          className="p-2 text-gray-400 hover:text-brand-maroon hover:bg-brand-cream rounded-xl transition"
                          title="Edit Lead"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                          title="Direct Call"
                        >
                          <Phone size={16} />
                        </a>

                        <button
                          onClick={() => {
                            setScheduleLead(lead);
                            setScheduleTime('');
                            setShowScheduleModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                          title="Schedule Call"
                        >
                          📅
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Leads Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl">
            <LoadingSpinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl">
            No leads found.
          </div>
        ) : (
          filtered.map((lead) => (
            <div key={lead.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-800 text-base">{lead.name}</h4>
                  <span className="text-[10px] text-gray-400">{lead.phone}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-cream text-brand-maroon border border-brand-gold border-opacity-30">
                  {lead.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Interest</span>
                  <span className="text-brand-gold font-semibold">{lead.interestedIn || 'Gold'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Source</span>
                  <span className="text-gray-700">{lead.source}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <button
                  onClick={() => openAiCallSimulator(lead)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
                >
                  <Bot size={14} /> AI Voice Agent
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(lead)} className="p-2 text-gray-400 hover:text-brand-maroon">
                    <Edit size={16} />
                  </button>
                  <a href={`tel:${lead.phone}`} className="p-2 text-emerald-600">
                    <Phone size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Add New CRM Lead</h4>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {addModalError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                {addModalError}
              </div>
            )}
            
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="customer@gmail.com"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lead Source</label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-gold outline-none"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="Walk-in">Walk-in Showroom</option>
                    <option value="Meta Ads">Meta Ads (FB/IG)</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website Inquiry</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-gold outline-none"
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Interested Product</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-gold outline-none"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                >
                  <option value="Gold Jewelry">Gold Jewelry</option>
                  <option value="Diamond Jewelry">Diamond Jewelry</option>
                  <option value="Silver Jewelry">Silver Jewelry</option>
                  <option value="Sarees">Sarees</option>
                  <option value="Gold Scheme">Samruddhi Gold Scheme</option>
                  <option value="Custom Design">Custom Bridal Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes & Requirements</label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs resize-none outline-none focus:ring-2 focus:ring-brand-gold"
                  rows={3}
                  placeholder="Budget range, occasion, specific showroom preference..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon hover:bg-opacity-90 text-white font-bold rounded-xl text-xs shadow-md"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Edit CRM Lead</h4>
              <button onClick={() => { setShowEdit(false); setEditingLead(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {editModalError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                {editModalError}
              </div>
            )}
            
            <form onSubmit={handleEditLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Source</label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-gold outline-none"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                  >
                    <option value="Walk-in">Walk-in Showroom</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-gold outline-none"
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Interested Product</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-gold outline-none"
                  value={editInterest}
                  onChange={(e) => setEditInterest(e.target.value)}
                >
                  <option value="Gold Jewelry">Gold Jewelry</option>
                  <option value="Diamond Jewelry">Diamond Jewelry</option>
                  <option value="Silver Jewelry">Silver Jewelry</option>
                  <option value="Sarees">Sarees</option>
                  <option value="Gold Scheme">Samruddhi Gold Scheme</option>
                  <option value="Custom Design">Custom Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs resize-none"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Notes Modal */}
      {showNotesModal && notesLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Lead Notes: {notesLead.name}</h4>
              <button onClick={() => setShowNotesModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSaveQuickNote} className="space-y-4">
              <textarea
                className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-gold outline-none resize-none"
                rows={5}
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Enter showroom notes, preferences, or call feedback..."
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      {showScheduleModal && scheduleLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Schedule Follow-up Call</h4>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Indian AI Voice Agent & Call Modal */}
      {showAiModal && simLead && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-fadeIn text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 p-5 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-500/40 shadow-inner">
                  <Bot className="h-6 w-6 text-amber-400 animate-pulse-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-amber-400">
                      🇮🇳 Siri Samruddhi Indian AI Voice Agent
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Local • 100% Free
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Natural Voice Speech (TTS) & Real-Time Showroom Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Audio Mute/Unmute Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSpeechMuted(!isSpeechMuted);
                    if (!isSpeechMuted && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      setIsAiSpeaking(false);
                    }
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                    isSpeechMuted 
                      ? 'bg-red-500/20 border-red-500/40 text-red-300' 
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                  title={isSpeechMuted ? "Unmute Indian Voice" : "Mute Indian Voice"}
                >
                  <Volume2 size={15} className={isSpeechMuted ? "opacity-40" : "animate-pulse"} />
                  <span>{isSpeechMuted ? "Muted" : "Audio On"}</span>
                </button>

                <button 
                  onClick={endSimulatedCall} 
                  className="text-slate-400 hover:text-white transition bg-slate-800/60 hover:bg-slate-800 p-2 rounded-xl border border-slate-700/50 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {simStep === 'config' && (
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Active Prospect Details */}
                <div className="bg-slate-950/90 p-4 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Prospect Details</span>
                    <span className="text-[10px] text-slate-400">ID: {simLead.id}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Name</span>
                      <strong className="text-white">{simLead.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone</span>
                      <strong className="text-emerald-400 font-mono">{simLead.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Interest</span>
                      <strong className="text-amber-400">{simLead.interestedIn || 'Gold Jewelry'}</strong>
                    </div>
                  </div>
                </div>

                {/* Indian Showroom Directives Badge */}
                <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-semibold text-amber-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Siri Samruddhi Showroom Knowledge Base
                  </h4>
                  <ul className="text-slate-300 list-disc list-inside space-y-1 text-[11px]">
                    <li><strong>Showroom Locations:</strong> Yelahanka (Bengaluru), Kolar, Udupi (Open 10 AM - 8:30 PM).</li>
                    <li><strong>Current Offers:</strong> Up to 100% FREE making charges, FREE 24K Gold Coin on ₹2.5L+, 90-day Golden Flexi rate lock.</li>
                    <li><strong>Collections:</strong> Antique Temple Gold, Certified Natural Diamonds, Pure Kanchipuram Silk Sarees.</li>
                  </ul>
                </div>

                {/* Choose Call Mode */}
                <div className="border border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-950/40">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Agent Experience Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSimMode('auto')}
                      className={`p-4 rounded-xl border transition text-left flex flex-col gap-1.5 ${
                        simMode === 'auto'
                          ? 'border-amber-500 bg-amber-500/15 text-white shadow-lg shadow-amber-950/40'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-sm text-amber-400">👑 Pre-scripted Voice Demo</span>
                      <span className="text-xs text-slate-400">Speaks out complete wedding inquiry, gold offers & showroom appointment.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimMode('interactive')}
                      className={`p-4 rounded-xl border transition text-left flex flex-col gap-1.5 ${
                        simMode === 'interactive'
                          ? 'border-amber-500 bg-amber-500/15 text-white shadow-lg shadow-amber-950/40'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-sm text-amber-400">🎙️ Live Voice / Mic Mode</span>
                      <span className="text-xs text-slate-400">Speak into your microphone or type inquiries. The AI answers with natural Indian voice speech.</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (simMode === 'auto') {
                        executeAutoPlay();
                      } else {
                        startSimulatedCall();
                      }
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-amber-900/30 text-sm flex items-center justify-center gap-2"
                  >
                    <PhoneCall size={18} />
                    <span>Start Indian AI Voice Call</span>
                  </button>
                </div>
              </div>
            )}

            {simStep === 'calling' && (
              <div className="p-12 flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-30 animate-ping"></div>
                  <div className="relative h-20 w-20 bg-slate-950 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/20">
                    <Phone className="h-8 w-8 text-amber-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-lg font-bold text-white">Calling {simLead.name}...</h4>
                  <p className="text-xs text-slate-400">{simLead.phone} • Playing telephone dial tone & connecting voice</p>
                </div>
              </div>
            )}

            {simStep === 'active' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/60">
                {/* Visualizer header */}
                <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    CALL CONNECTED: {Math.floor(simTime / 60)}:{(simTime % 60).toString().padStart(2, '0')}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isAiSpeaking && (
                      <div className="flex items-center gap-1 text-amber-400 text-[11px] font-semibold animate-pulse">
                        <Volume2 size={14} />
                        <span>AI Speaking (Indian TTS)...</span>
                      </div>
                    )}
                    <div className="text-slate-400 text-xs">
                      Mode: <span className="text-amber-400 font-semibold">{simMode === 'auto' ? 'Auto Demo' : 'Live Interactive'}</span>
                    </div>
                  </div>
                </div>

                {/* Transcript container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col justify-end min-h-[260px] max-h-[360px]">
                  {simTranscript.length === 0 && (
                    <div className="text-slate-500 text-center py-8 text-xs italic">
                      Connecting audio stream...
                    </div>
                  )}
                  {simTranscript.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === 'agent' ? 'self-start' : 'self-end items-end'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                        {msg.sender === 'agent' ? '👑 Siri Samruddhi AI' : simLead.name}
                      </span>
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'agent'
                            ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60 shadow-md'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-none shadow-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {simIsAgentTyping && (
                    <div className="self-start flex flex-col max-w-[80%]">
                      <span className="text-[10px] text-slate-400 mb-1 px-1">Siri Samruddhi AI thinking & speaking...</span>
                      <div className="flex items-center gap-1.5 bg-slate-850 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-800">
                        <div className="h-3 w-1 bg-amber-400 animate-bounce rounded-full"></div>
                        <div className="h-4 w-1 bg-amber-400 animate-bounce rounded-full" style={{ animationDelay: '150ms' }}></div>
                        <div className="h-5 w-1 bg-amber-400 animate-bounce rounded-full" style={{ animationDelay: '300ms' }}></div>
                        <div className="h-3 w-1 bg-amber-400 animate-bounce rounded-full" style={{ animationDelay: '450ms' }}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer controls (Interactive Mode) */}
                {simMode === 'interactive' && (
                  <div className="p-4 border-t border-slate-800 bg-slate-950/95 space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleCustomerResponse("What is today's gold rate?")}
                        className="text-[11px] bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 py-1 px-2.5 rounded-lg transition"
                      >
                        💡 Gold Rate?
                      </button>
                      <button
                        onClick={() => handleCustomerResponse("What are the current making charge offers?")}
                        className="text-[11px] bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 py-1 px-2.5 rounded-lg transition"
                      >
                        🎁 100% Free Making Charges?
                      </button>
                      <button
                        onClick={() => handleCustomerResponse("I want to visit your Yelahanka showroom this weekend for bridal jewellery.")}
                        className="text-[11px] bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 py-1 px-2.5 rounded-lg transition"
                      >
                        🏛️ Visit Yelahanka
                      </button>
                      <button
                        onClick={() => handleCustomerResponse("Do you have antique temple gold jewellery and wedding sarees?")}
                        className="text-[11px] bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 py-1 px-2.5 rounded-lg transition"
                      >
                        🥻 Temple Jewellery & Sarees
                      </button>
                      <button
                        onClick={() => handleCustomerResponse("Please arrange a callback from your showroom manager.")}
                        className="text-[11px] bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 py-1 px-2.5 rounded-lg transition"
                      >
                        📞 Manager Callback
                      </button>
                    </div>

                    <div className="flex gap-2 items-center">
                      {/* Microphone Voice Input Button */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2.5 rounded-xl border transition flex items-center justify-center shrink-0 ${
                          isMicActive 
                            ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-lg shadow-red-500/40' 
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
                        }`}
                        title={isMicActive ? "Listening to your microphone... Click to stop" : "Click to speak via Microphone"}
                      >
                        {isMicActive ? <Mic className="h-5 w-5 animate-bounce" /> : <Mic className="h-5 w-5" />}
                      </button>

                      <input
                        type="text"
                        value={simCustomInput}
                        onChange={(e) => setSimCustomInput(e.target.value)}
                        placeholder={isMicActive ? "Listening to your voice..." : "Speak into mic or type your reply..."}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCustomerResponse(simCustomInput);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleCustomerResponse(simCustomInput)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {/* Call Footer actions */}
                <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Indian Audio Pipeline Active
                  </div>
                  <button
                    onClick={endSimulatedCall}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2 px-5 rounded-xl transition shadow-md"
                  >
                    End Call & Save to CRM
                  </button>
                </div>
              </div>
            )}

            {simStep === 'summary' && (
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                <div className="text-center space-y-1">
                  <h4 className="text-lg font-bold text-white">Call Completed & Auto-Analyzed</h4>
                  <p className="text-xs text-slate-400">Review the AI-extracted prospect qualification before saving to CRM</p>
                </div>

                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interest</label>
                      <select
                        value={simLeadQualification.interest}
                        onChange={(e) => setSimLeadQualification(prev => ({ ...prev, interest: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      >
                        <option value="Gold Jewelry">Gold Jewelry</option>
                        <option value="Antique Gold Jewelry">Antique Gold Jewelry</option>
                        <option value="Diamond Jewelry">Diamond Jewelry</option>
                        <option value="Silver Jewelry">Silver Jewelry</option>
                        <option value="Sarees">Sarees</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Budget</label>
                      <input
                        type="text"
                        value={simLeadQualification.budget}
                        onChange={(e) => setSimLeadQualification(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Occasion</label>
                      <input
                        type="text"
                        value={simLeadQualification.occasion}
                        onChange={(e) => setSimLeadQualification(prev => ({ ...prev, occasion: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preferred Showroom</label>
                      <select
                        value={simLeadQualification.showroom}
                        onChange={(e) => setSimLeadQualification(prev => ({ ...prev, showroom: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      >
                        <option value="Yelahanka">Yelahanka</option>
                        <option value="Kolar">Kolar</option>
                        <option value="Udupi">Udupi</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Call Outcome</label>
                    <select
                      value={simLeadQualification.outcome}
                      onChange={(e) => setSimLeadQualification(prev => ({ ...prev, outcome: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="Wants Showroom Visit">Wants Showroom Visit</option>
                      <option value="Wants Callback">Wants Callback</option>
                      <option value="Interested">Interested</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="px-5 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700 transition"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveSimQualification}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-900/30"
                  >
                    Save Qualification to Lead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
