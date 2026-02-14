'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";
import styles from '../styles/Home.module.css';
import { PRODUCTS, Lead, Message, Product } from '../data/mockData';
import { analyzeContext, AIGuidance, SuggestedAction, getGlobalStats } from '../lib/intelligence';
import { generateSmartReply } from '../lib/ai-reply';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteBuilder } from '../components/QuoteBuilder';
import { Shell } from '../components/layout/Shell';
import { LeadCard } from '../components/leads/LeadCard';
import { Phone, MessageCircle } from 'lucide-react';

// WhatsApp Server URL - use environment variable or fallback to localhost
// WhatsApp Server URL - Smart switch for Dev vs. Prod
// WhatsApp Server URL - Smart switch for Dev vs. Prod with LocalStorage Override
const DEFAULT_SERVER_URL = process.env.NODE_ENV === 'production'
  ? (process.env.NEXT_PUBLIC_WHATSAPP_SERVER_URL || 'https://your-railway-app.up.railway.app')
  : 'http://localhost:3002';

// SVG Icons for a premium feel
const Icons = {
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  More: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Box: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Calc: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14"></line><line x1="8" y1="14" x2="8" y2="14"></line><line x1="12" y1="14" x2="12" y2="14"></line><line x1="16" y1="18" x2="16" y2="18"></line><line x1="8" y1="18" x2="8" y2="18"></line><line x1="12" y1="18" x2="12" y2="18"></line></svg>,
  WhatsApp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>,
  Sparkles: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLeadId, setActiveLeadId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [guidance, setGuidance] = useState<AIGuidance | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastLeadsHash, setLastLeadsHash] = useState('');
  const [lastSynced, setLastSynced] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WhatsApp State
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [whatsappStatus, setWhatsappStatus] = useState<{ connected: boolean, qr: string, initializing: boolean }>({ connected: false, qr: '', initializing: false });
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('whatsapp_server_url');
    if (stored) setServerUrl(stored);
  }, []);

  // Sample Request State
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [sampleForm, setSampleForm] = useState({ item: '', address: '', urgency: 'Normal' });
  const [newLeadForm, setNewLeadForm] = useState({ name: '', phone: '+91', product: '', message: '' });
  // Products State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'brick' | 'tile' | 'paver' | 'jali' | 'cladding' | 'roofing' | 'project' | 'calculator' | 'add_product' | 'calc_old'>('All');
  const [calculatorForm, setCalculatorForm] = useState({ area: '', product: '', unitType: 'sqft' });
  const [newProductForm, setNewProductForm] = useState({ name: '', category: 'brick', sellingRate: '', purchaseRate: '', dimensions: '', description: '', image: '' });
  const [calculatedQuote, setCalculatedQuote] = useState<{ totalUnits: number, totalCost: number } | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'pipeline'>('chat');
  const [currentView, setCurrentView] = useState<'dashboard' | 'crm' | 'catalog' | 'settings'>('crm');
  const [autoRepliedLeads, setAutoRepliedLeads] = useState<Set<string>>(new Set());
  const [syncedContacts, setSyncedContacts] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add Loading State

  // Responsive State
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>('list');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    // Initial check
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Poll WhatsApp Status
    // Poll WhatsApp Status
    const pollStatus = async () => {
      try {
        const res = await fetch(`${serverUrl}/status`, {
          headers: { 'x-api-secret': 'urbancrm_secret_key_123' } // Add Auth Header
        });
        if (!res.ok) {
          // If 404 or 500, we treat it as disconnected but don't crash
          if (res.status === 404) console.warn("WhatsApp Server Not Found (404)");
          throw new Error(`Server returned ${res.status}`);
        }
        const data = await res.json();
        setWhatsappStatus(data);
        setIsWhatsappConnected(true);
      } catch (e) {
        // console.error('WhatsApp Status Error:', e); // Reduce noise
        setIsWhatsappConnected(false);
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  // Memoized leads with AI scores to prevent redundant analysis
  const scoredLeads = useMemo(() => {
    return leads.map(l => {
      const guidance = analyzeContext(l, l.lastMessage);
      // Smart Priority Score
      let score = 0;
      if (guidance.leadScore === 'HOT 🔥') score += 1000;
      if (guidance.isHighValue) score += 500;
      if (l.unread) score += 100;
      score += new Date(l.lastActive).getTime() / 1000000000;

      return { ...l, aiScore: score, guidance };
    }).sort((a, b) => {
      // 1. WhatsApp Logic: Most recent message always wins
      const timeA = new Date(a.lastActive).getTime();
      const timeB = new Date(b.lastActive).getTime();
      return timeB - timeA;
    });
  }, [leads]);

  // Filter leads based on search
  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return scoredLeads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(q) || l.lastMessage.content.toLowerCase().includes(q);
      const isActive = l.status !== 'closed' && l.status !== 'lost' && l.status !== 'archived' && l.status !== 'dead';

      // If searching, show all matches. If not, only show active.
      return q ? matchesSearch : (isActive && matchesSearch);
    });
  }, [scoredLeads, searchQuery]);

  const stats = useMemo(() => getGlobalStats(leads), [leads]);

  const activeLead = useMemo(() => {
    return leads.find(l => l.id === activeLeadId) || filteredLeads[0] || leads[0];
  }, [leads, activeLeadId, filteredLeads]);

  // 1. Database Integration & Live Polling
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch('/api/leads', { cache: 'no-store' });
        const data = await res.json();

        if (Array.isArray(data)) {



          const dbLeads: Lead[] = data.map((db: any) => {
            // Re-run the mapping logic per lead (duplicate logic due to map context)
            let msgs: Message[] = [];
            if (db.messages && db.messages.length > 0) {
              msgs = db.messages.map((m: any) => ({
                id: m.id,
                sender: m.sender,
                content: m.content,
                timestamp: m.timestamp,
                type: 'text'
              }));
            } else {
              msgs = [{
                id: `db-${db.id}`,
                sender: 'client',
                content: db.message || `Interest in ${db.product || 'Clay Products'}`,
                timestamp: db.receivedAt,
                type: 'text'
              }];
            }

            return {
              id: db.id,
              name: db.name,
              phone: db.phone,
              status: db.status.toLowerCase() as any,
              unread: db.status === 'NEW',
              dealValue: 0,
              lastActive: msgs[msgs.length - 1].timestamp,
              lastMessage: msgs[msgs.length - 1],
              messages: msgs,
              tags: [db.source]
            };
          });

          setLeads(prev => {
            const leadMap = new Map<string, Lead>();
            // 1. Add existing leads first
            prev.forEach(l => leadMap.set(l.id, l));
            // 2. Add/Overwrite with freshly fetched leads (dbLeads)
            // This ensures new messages/status from DB take precedence
            dbLeads.forEach(l => leadMap.set(l.id, l));
            return Array.from(leadMap.values());
          });
          setIsLive(true);
          setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (err) {
        console.error('Lead fetch error:', err);
      }
    };

    fetchLeads();
    const interval = setInterval(fetchLeads, 3000); // Poll every 3 seconds for near real-time chat
    return () => clearInterval(interval);
  }, []);

  // 2. NIGHT HUNTER: Auto-Responder Logic (DISABLED FOR HUMAN-LIKE BEHAVIOR)
  useEffect(() => {
    // Check for "New" leads that haven't been replied to yet
    /*
    const newLeads = leads.filter(l =>
      l.status === 'new' &&
      !autoRepliedLeads.has(l.id) &&
      l.messages.length <= 1 &&
      l.messages.every(m => m.sender === 'client')
    );

    newLeads.forEach(lead => {
      // Mark as replied immediately to prevent loops
      setAutoRepliedLeads(prev => new Set(prev).add(lead.id));

      setTimeout(() => {
        const welcomeMsg = `Welcome to Urban Clay. You've reached the premium standard in face bricks.\n\nOur materials are fired for 48 hours to achieve 35MPa strength—meaning zero maintenance for 50 years. We don't compete with cheap local bricks; we build structures that last generations.\n\nTo move forward, what is the exact location of your site? I'm sending our design catalog below.`;

        handleSendMessage(welcomeMsg, 'text');

        setTimeout(() => {
          handleSendMessage('[IMG: Urban Clay Master Catalog 2024]', 'image');
        }, 2000);
      }, 3000);
    });
    */
  }, [leads, autoRepliedLeads]);

  // 3. GOOGLE CONTACTS SYNC: Official API Logic
  const handleGoogleSync = async (lead: Lead, guidance: AIGuidance) => {
    if (!session) {
      signIn('google');
      return;
    }

    try {
      const response = await fetch('/api/contacts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          notes: `Requirement: ${guidance.productRequirement || 'General Brick Inquiry'}\nProject: ${guidance.location || 'Pending'}\nLead Score: ${guidance.leadScore}\nSource: BrickFlow CRM`
        })
      });

      if (response.ok) {
        setSyncedContacts(prev => new Set(prev).add(lead.id));
        handleSendMessage(`[SYSTEM] 🟢 Contact synced to official Google: "${lead.name}" saved.`, 'text');
      } else {
        const err = await response.json();
        alert(`Sync failed: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Sync Error:', err);
    }
  };

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products && Array.isArray(data.products)) {
          setAvailableProducts(data.products);
        }
      })
      .catch(err => console.error('Product fetch error:', err));
  }, []);

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    return activeTab === 'All'
      ? availableProducts
      : availableProducts.filter(p => p.category === activeTab);
  }, [availableProducts, activeTab]);

  useEffect(() => {
    if (guidance?.sampleDetection?.detected && !activeLead.sampleRequest) {
      // Auto-open modal if detected
      setShowSampleModal(true);
      setSampleForm(prev => ({ ...prev, item: guidance.sampleDetection?.item || '' }));
    }
  }, [guidance, activeLeadId]); // removed leads assumption, using activeLead which is derived

  const handleLogSample = () => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === activeLeadId) {
        return {
          ...lead,
          status: 'follow_up',
          sampleRequest: {
            status: 'pending',
            items: sampleForm.item,
            requestDate: new Date().toISOString()
          }
        };
      }
      return lead;
    }));
    setShowSampleModal(false);
    handleSendMessage(`[System] Sample request logged: ${sampleForm.item}. Dispatch pending.`, 'alert');
  };

  const handleDispatchSample = () => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === activeLeadId && lead.sampleRequest) {
        return {
          ...lead,
          sampleRequest: { ...lead.sampleRequest, status: 'dispatched' as const }
        };
      }
      return lead;
    }));
    handleSendMessage(`[System] Sample dispatched. Tracking ID: TRK${Math.floor(Math.random() * 10000)}`, 'alert');
  };

  // Auto-scroll to bottom of chat (Localized to container)
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeLead?.messages]);

  // Run AI Analysis whenever the active lead's last message changes
  useEffect(() => {
    if (activeLead && activeLead.messages.length > 0) {
      const lastMsg = activeLead.messages[activeLead.messages.length - 1];
      const aiResult = analyzeContext(activeLead, lastMsg);
      setGuidance(aiResult);
    }
  }, [activeLead, activeLeadId]); // Simplified dependency



  const handleSmartDraft = () => {
    if (!activeLead) return;
    const lastMsg = activeLead.messages[activeLead.messages.length - 1];

    // Safety check: Don't reply to yourself unless you really want to
    if (lastMsg.sender !== 'client') {
      // Optional: We could just draft a follow-up
      // For now, let's just use the last client message or context
      // Simple version: just proceed
    }

    // AI Magic
    const result = generateSmartReply(lastMsg.content, guidance?.customerType);
    setInputText(result.reply);

    // Optional: Toast or Log
    console.log(`[AI] Drafted reply for topic: ${result.topic} (${result.confidence})`);
  };


  // Import Agent Logic
  import { agentBrain, AgentDecision } from '../lib/sales-agent';

  // ... existing imports

  // Agent State
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('');
  const [agentThinking, setAgentThinking] = useState(false);

  // ... existing code ...

  // AGENT BRAIN INTEGRATION
  useEffect(() => {
    if (!isAgentActive || !activeLead) return;

    const lastMsg = activeLead.messages[activeLead.messages.length - 1];

    // Only respond if the LAST message is from the client and we haven't already responded
    // (In a real app, we'd check if the last message ID has been processed)
    if (lastMsg && lastMsg.sender === 'client' && !agentThinking) {

      const runAgent = async () => {
        setAgentThinking(true);
        setAgentStatus('🧠 Analyzing Intent & Emotion...');

        // 1. Think
        const decision = await agentBrain(activeLead, lastMsg.content);

        // 2. Act
        if (decision.action === 'REPLY' && decision.response) {
          setAgentStatus(`💬 Drafting (${decision.detectedLanguage}): ${decision.thoughtProcess}`);

          // Wait for "Human" typing delay
          setTimeout(() => {
            setAgentStatus('✍️ Typing...');
            setTimeout(() => {
              handleSendMessage(decision.response!, 'text');
              setAgentStatus('✅ Reply Sent');
              setAgentThinking(false);
            }, 2000); // Typing duration
          }, decision.typingDelayMs); // Thinking/Hesitation delay

        } else if (decision.action === 'ALERT_BOSS') {
          setAgentStatus('🚨 ALERTING BOSS: High Risk/Value Detected');
          // Mock Alert
          alert(decision.thoughtProcess); // In real app, this sends WhatsApp to Boss
          setIsAgentActive(false); // Auto-pause
          setAgentThinking(false);
        } else {
          setAgentStatus('💤 Standing by...');
          setAgentThinking(false);
        }
      };

      runAgent();
    }
  }, [activeLead?.messages, isAgentActive]);

  const handleSendMessage = async (content: string, type: string = 'text', mediaUrl?: string) => {
    if (!content.trim() && type === 'text') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'salesrep',
      content: content, // Content is always the text/caption
      mediaUrl: mediaUrl,
      timestamp: new Date().toISOString(),
      type: type as any
    };

    setLeads(prevLeads =>
      prevLeads.map(l =>
        l.id === activeLeadId
          ? { ...l, messages: [...l.messages, newMessage], lastActive: newMessage.timestamp, lastMessage: newMessage, status: 'follow_up', unread: false }
          : l
      )
    );

    if (type === 'text') setInputText('');

    // Official WhatsApp API Integration
    if (activeLead?.phone) {
      try {
        const payload: any = {
          to: activeLead.phone.replace(/[^0-9]/g, ''),
          message: content
        };

        if (type === 'image' && mediaUrl) {
          payload.mediaUrl = mediaUrl;
          payload.caption = content; // Send original text as caption
        }

        await fetch(`${serverUrl}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-secret': 'urbancrm_secret_key_123'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('WhatsApp Send Error:', err);
      }
    }
  };

  const handleSendWhatsAppMedia = async (to: string, message: string, caption?: string, mediaData?: string, mimetype?: string, filename?: string) => {
    await fetch(`${serverUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': 'urbancrm_secret_key_123'
      },
      body: JSON.stringify({
        to: to.replace(/[^0-9]/g, ''),
        message,
        caption,
        mediaData,
        mimetype,
        filename
      })
    });
  };

  const handleExportChat = () => {
    if (!activeLead) return;

    const exportText = activeLead.messages.map(m => {
      const date = new Date(m.timestamp).toLocaleString();
      const sender = m.sender === 'salesrep' ? 'Sales Rep' : (m.sender === 'client' ? activeLead.name : 'System');
      return `[${date}] ${sender}: ${m.content}`;
    }).join('\n\n');

    const blob = new Blob([`Chat Export: ${activeLead.name}\nGenerated: ${new Date().toLocaleString()}\n\n${exportText}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Chat_Export_${activeLead.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleSendMessage(`[SYSTEM] 📁 Chat history for ${activeLead.name} has been exported and saved.`, 'alert');
  };

  const handleAddLead = async () => {
    console.log("Add Lead Clicked", newLeadForm);
    if (!newLeadForm.name || !newLeadForm.phone) {
      alert("Enter Name and Phone");
      return;
    }

    const newLead: any = {
      name: newLeadForm.name,
      phone: newLeadForm.phone,
      product: newLeadForm.product,
      message: newLeadForm.message,
      source: 'Manual Entry',
      received_at: new Date().toISOString(),
    };

    setIsSaving(true); // Start Loading
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      if (res.ok) {
        const savedLead = await res.json();

        // Ensure we have valid data before proceeding
        if (!savedLead || !savedLead.id) {
          console.error("Invalid response from add lead API", savedLead);
          alert("Error: Server returned invalid data.");
          alert("Error: Server returned invalid data.");
          return;
        }

        setShowNewLeadModal(false);
        setNewLeadForm({ name: '', phone: '+91', product: '', message: '' });

        // Leads will refresh via polling, but we can prepend for instant feedback
        const formattedLead: Lead = {
          id: savedLead.id,
          name: savedLead.name,
          phone: savedLead.phone,
          status: 'new',
          unread: true,
          dealValue: 0,
          lastActive: new Date().toISOString(),
          lastMessage: {
            id: `m-${Date.now()}`,
            sender: 'client',
            content: savedLead.message || `Interest in ${savedLead.product || 'Clay Products'}`,
            timestamp: new Date().toISOString(),
            type: 'text'
          },
          messages: [{
            id: `m-${Date.now()}`,
            sender: 'client',
            content: savedLead.message || `Interest in ${savedLead.product || 'Clay Products'}`,
            timestamp: new Date().toISOString(),
            type: 'text'
          }],
          tags: ['Manual']
        };


        // Prevent duplicates when adding locally
        setLeads(prev => {
          if (prev.some(l => l.id === formattedLead.id)) return prev.map(l => l.id === formattedLead.id ? formattedLead : l);
          return [formattedLead, ...prev];
        });
        setActiveLeadId(formattedLead.id);

        /* 
        // AUTO-SEND INITIAL MESSAGE via WhatsApp (DISABLED PER USER REQUEST)
        if (savedLead.message && savedLead.phone) {
          try {
            await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: savedLead.phone.replace(/[^0-9]/g, ''),
                message: savedLead.message
              })
            });
            console.log('✅ Initial message sent to new lead');
          } catch (err) {
            console.error('Failed to send initial WhatsApp:', err);
          }
        }
        */
      } else {
        const txt = await res.text();
        alert(`Error Saving: ${res.status}\n${txt}`);
      }
    } catch (err: any) {
      console.error('Add lead error:', err);
      alert(`Network Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = (action: SuggestedAction) => {
    switch (action.actionType) {
      case 'send_photos':
        PRODUCTS.slice(0, 4).forEach((prod, i) => {
          setTimeout(() => {
            handleSendMessage(`[IMG: ${prod.name}]`, 'image');
          }, i * 200);
        });
        break;
      case 'send_site_image':
        handleSendMessage('[IMG: Site Installation Example - Villa 45]', 'image');
        break;
      case 'send_estimate':
        handleSendMessage('QUICK ESTIMATE: \nBased on standard size: ₹55/sqft + GST.\nTransport extra.', 'estimate');
        break;
      case 'ask_question':
      case 'custom_reply':
        // 2. AI Auto-Drafting Implementation
        if (action.payload) setInputText(action.payload);
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      <Shell
        whatsappConnected={isWhatsappConnected}
        currentView={currentView as any}
        onViewChange={(view) => setCurrentView(view)}
      >
        {/* Render content based on currentView */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>


          {/* --- DASHBOARD VIEW --- */}
          {
            currentView === 'dashboard' && (
              <div style={{
                flex: 1,
                padding: isMobile ? '1rem' : '2rem',
                overflowY: 'auto',
                display: isMobile ? 'flex' : 'grid',
                flexDirection: 'column',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                gap: '2rem'
              }}>

                {/* LEFT COLUMN: ACTION PANEL */}
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Daily Action Panel</h2>

                  {/* TOP 5 TO CALL */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📞 Top 5 To Call Today <span style={{ fontSize: '0.7rem', background: '#3b82f6', padding: '2px 8px', borderRadius: '10px' }}>Priority</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {scoredLeads
                        .filter(l => l.guidance.leadScore === 'HOT 🔥' || l.guidance.seriousBuyerScore > 70)
                        .slice(0, 5)
                        .map(lead => (
                          <div key={lead.id} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', cursor: 'pointer' }} onClick={() => { setActiveLeadId(lead.id); setCurrentView('crm'); }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 600 }}>{lead.name}</span>
                              <span style={{ fontSize: '0.8rem' }}>🔥 {lead.guidance.leadScore}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              {lead.guidance.summary || 'Follow up urgently.'}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Score: {lead.guidance.seriousBuyerScore}</span>
                              {lead.guidance.isHighValue && <span style={{ fontSize: '0.7rem', color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>💎 High Value</span>}
                            </div>
                          </div>
                        ))}
                      {scoredLeads.filter(l => l.guidance.leadScore === 'HOT 🔥').length === 0 && (
                        <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No critical calls pending. Good job!</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* GHOSTING RISK */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#f59e0b' }}>⚠️ Leads at Risk (Ghosting)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {scoredLeads
                          .filter(l => l.guidance.ghostingStatus === 'Risk' || l.guidance.ghostingStatus === 'Ghosted')
                          .slice(0, 5)
                          .map(lead => (
                            <div key={lead.id} style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', cursor: 'pointer' }} onClick={() => { setActiveLeadId(lead.id); setCurrentView('crm'); }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600 }}>{lead.name}</span>
                                <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>{lead.guidance.ghostingStatus}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Inactive for {Math.floor((new Date().getTime() - new Date(lead.lastActive).getTime()) / (1000 * 60 * 60))} hours
                              </div>
                            </div>
                          ))}
                        {scoredLeads.filter(l => l.guidance.ghostingStatus !== 'Safe').length === 0 && (
                          <div style={{ color: 'var(--text-tertiary)' }}>No leads at risk.</div>
                        )}
                      </div>
                    </div>

                    {/* CLOSING WINDOW */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#10b981' }}>💰 Closing Window Open</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {scoredLeads
                          .filter(l => l.guidance.closingWindow)
                          .slice(0, 5)
                          .map(lead => (
                            <div key={lead.id} style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer' }} onClick={() => { setActiveLeadId(lead.id); setCurrentView('crm'); }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600 }}>{lead.name}</span>
                                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Ready to Close</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Est. Value: {lead.guidance.estimatedValue}
                              </div>
                            </div>
                          ))}
                        {scoredLeads.filter(l => l.guidance.closingWindow).length === 0 && (
                          <div style={{ color: 'var(--text-tertiary)' }}>No leads in closing window right now.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: TODAY'S TARGET LEADS */}
                <div className="glass-panel" style={{ borderRadius: '16px', padding: '1.5rem', height: 'fit-content', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎯 Today's Target Leads
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* 1. Closest to Closing */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginTop: '8px' }}>Closest to Closing</div>
                    {scoredLeads.filter(l => l.guidance.closingWindow).slice(0, 3).map(lead => (
                      <div key={lead.id} onClick={() => { setActiveLeadId(lead.id); setCurrentView('crm'); }} style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lead.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>READY</span>
                      </div>
                    ))}
                    {scoredLeads.filter(l => l.guidance.closingWindow).length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No closing signals yet.</div>}

                    {/* 2. High Value */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginTop: '12px' }}>High Value Opportunities</div>
                    {scoredLeads.filter(l => l.guidance.isHighValue && !l.guidance.closingWindow).slice(0, 2).map(lead => (
                      <div key={lead.id} onClick={() => { setActiveLeadId(lead.id); setCurrentView('crm'); }} style={{ padding: '8px', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lead.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: 700 }}>{lead.guidance.estimatedValue}</span>
                      </div>
                    ))}
                    {scoredLeads.filter(l => l.guidance.isHighValue && !l.guidance.closingWindow).length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No high value leads yet.</div>}

                    {/* 3. Ghost Risk */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginTop: '12px' }}>Needs Rescue (Ghost Risk)</div>
                    {scoredLeads.filter(l => (l.guidance.ghostingStatus === 'Risk' || l.guidance.ghostingStatus === 'Ghosted')).slice(0, 2).map(lead => (
                      <div key={lead.id} onClick={() => { setActiveLeadId(lead.id); setCurrentView('crm'); }} style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lead.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>INACTIVE</span>
                      </div>
                    ))}
                  </div>
                </div>          </div>
            )
          }

          {/* --- CATALOG VIEW --- */}
          {
            currentView === 'catalog' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.5rem' }}>Product Catalog</h2>
                  <button
                    onClick={() => { setActiveTab('add_product'); setCurrentView('crm'); }} // Redirect to CRM side-panel for add? Or implement here? 
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    + Add New Product
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
                    {availableProducts.map(p => (
                      <div key={p.id} className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}>
                        <div style={{ height: '200px', background: '#333' }}>
                          {p.image.includes('placeholder') || p.image.includes('placehold.co') ? (
                            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #334155 0%, #1e293b 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '3rem', opacity: 0.2 }}>📦</span>
                            </div>
                          ) : (
                            <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.category}</div>
                          <div style={{ marginTop: '8px', fontWeight: 700, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>₹{p.sellingRate}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendMessage(`Check out our ${p.name}. It's perfect for your project.`, 'image', p.image);
                                setCurrentView('crm');
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600
                              }}
                            >
                              Send ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          {/* --- CRM VIEW (Original Content) --- */}
          <div style={{ display: currentView === 'crm' ? 'flex' : 'none', flex: 1, overflow: 'hidden' }}>

            <div className={styles.sidebar} style={{
              width: isMobile ? '100%' : '300px',
              display: (isMobile && mobileView !== 'list') ? 'none' : 'flex',
              flexShrink: 0,
              borderRight: '1px solid var(--glass-border)',
              background: 'var(--deep-earth)',
              flexDirection: 'column',
              overflowY: 'auto'
            }}>
              <div className={styles.sidebarHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>B</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem' }}>BrickFlow</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--success)' }}>
                      <span style={{ width: 6, height: 6, background: 'var(--success)', borderRadius: '50%' }} /> Active Ingestion
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewLeadModal(true)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Add New Lead Manually"
                >
                  <Icons.Plus />
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ padding: '0 1rem 1rem' }}>
                <div className={styles.inputWrapper} style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', padding: '4px', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div className={styles.leadList}>
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isActive={activeLeadId === lead.id}
                    onClick={() => {
                      setActiveLeadId(lead.id);
                      if (isMobile) setMobileView('chat');
                    }}
                    onCall={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${lead.phone}`;
                    }}
                    onWhatsApp={(e) => {
                      e.stopPropagation();
                      if (lead.phone) {
                        window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank');
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.chatArea} style={{
              display: (isMobile && mobileView !== 'chat') ? 'none' : 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              background: 'var(--surface)'
            }}>
              {/* Top Navbar */}
              <div style={{ height: '48px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', paddingLeft: '1.5rem', background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
                {isMobile && mobileView === 'chat' && (
                  <button
                    onClick={() => setMobileView('list')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginRight: '1rem', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ←
                  </button>
                )}
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <button
                    onClick={() => setViewMode('chat')}
                    style={{ background: 'transparent', border: 'none', color: viewMode === 'chat' ? 'var(--primary)' : 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', borderBottom: viewMode === 'chat' ? '2px solid var(--primary)' : 'none', padding: '14px 0' }}
                  >
                    CHATS
                  </button>
                  <button
                    onClick={() => setViewMode('pipeline')}
                    style={{ background: 'transparent', border: 'none', color: viewMode === 'pipeline' ? 'var(--primary)' : 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', borderBottom: viewMode === 'pipeline' ? '2px solid var(--primary)' : 'none', padding: '14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    SALES PIPELINE <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px' }}>PRO</span>
                  </button>
                </div>

                <div style={{ marginLeft: 'auto', marginRight: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {isMobile && mobileView === 'chat' && (
                    <button
                      onClick={() => setMobileView('info')}
                      title="View Lead Info"
                      style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    >
                      ℹ️
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/indiamart/sync');
                      const data = await res.json();
                      if (data.success) {
                        alert(`[SYSTEM] 🏢 IndiaMART API Sync: Found ${data.count} updates.`);
                      } else {
                        alert(data.message || "Sync failed. Error: No API Key found in env.");
                      }
                    }}
                    style={{ background: 'rgba(255,153,0,0.1)', border: '1px solid #ff9900', color: '#ff9900', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Sync IndiaMART API
                  </button>

                  {session ? (
                    <>
                      <button
                        onClick={async () => {
                          const res = await fetch('/api/gmail/sync');
                          const data = await res.json();
                          if (data.success) {
                            handleSendMessage(`[SYSTEM] 📧 Gmail checked: Found ${data.leads.length} new IndiaMART leads.`, 'text');
                          }
                        }}
                        style={{ background: 'rgba(255,102,102,0.1)', border: '1px solid #ff6666', color: '#ff6666', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Fetch Gmail Leads
                      </button>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{session.user?.email}</div>
                      <button onClick={() => signOut()} style={{ fontSize: '0.7rem', background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>Logout</button>
                    </>
                  ) : (
                    <button onClick={() => signIn('google')} style={{ background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.7rem', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Connect Google Account</button>
                  )}
                </div>
              </div>



              {viewMode === 'chat' && activeLead ? (
                !isWhatsappConnected ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1.5rem', background: 'var(--sand-beige)', padding: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '2rem' }}>🔌</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-outfit)' }}>Server Unreachable</h2>
                      <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--clay-red)' }}>
                        The WhatsApp server at <strong>{serverUrl}</strong> cannot be reached.
                      </p>

                      {/* URL Override Input */}
                      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Update Server URL:</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={serverUrl}
                            onChange={(e) => {
                              setServerUrl(e.target.value);
                              localStorage.setItem('whatsapp_server_url', e.target.value);
                            }}
                            style={{
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                              width: '280px',
                              fontSize: '0.85rem'
                            }}
                            placeholder="https://your-app.railway.app"
                          />
                          <button
                            onClick={() => {
                              // Force re-poll immediately
                              setWhatsappStatus(prev => ({ ...prev, initializing: true }));
                              // Poll happens automatically due to useEffect dependency on serverUrl
                            }}
                            style={{
                              padding: '8px 16px',
                              background: 'var(--text-primary)',
                              color: 'var(--background)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600
                            }}
                          >
                            Save & Retry
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setServerUrl(DEFAULT_SERVER_URL);
                            localStorage.removeItem('whatsapp_server_url');
                          }}
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-tertiary)',
                            background: 'none',
                            border: 'none',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          Reset to Default
                        </button>
                      </div>

                      <p style={{ maxWidth: '400px', margin: '1rem auto 0', fontSize: '0.8rem', opacity: 0.7, color: 'var(--text-tertiary)' }}>
                        Please verify your deployment status.
                      </p>
                    </div>
                  </div>
                ) : !whatsappStatus.connected ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1.5rem', background: 'var(--sand-beige)', padding: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-outfit)' }}>WhatsApp Not Connected</h2>
                      <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Scan the QR code below with your WhatsApp mobile app to connect the CRM.</p>
                    </div>

                    <div style={{ padding: '2rem', background: 'white', borderRadius: '16px', minWidth: '340px', minHeight: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 40px rgba(74, 64, 58, 0.08)', border: '1px solid var(--card-border)' }}>
                      {whatsappStatus.qr ? (
                        <>
                          <img src={whatsappStatus.qr} alt="WhatsApp QR Code" style={{ width: '280px', height: '280px', border: '2px solid #e5e7eb', borderRadius: '8px', padding: '8px' }} />
                          <div style={{ fontSize: '0.85rem', color: '#333', marginTop: '1rem', fontWeight: 600 }}>📱 Scan with WhatsApp Mobile App</div>
                          <button
                            onClick={async () => {
                              try {
                                setWhatsappStatus({ connected: false, qr: '', initializing: true });
                                const response = await fetch(`${serverUrl}/restart`, {
                                  method: 'POST',
                                  headers: { 'x-api-secret': 'urbancrm_secret_key_123' }
                                });
                                if (!response.ok) throw new Error(`Server responded with ${response.status}`);
                                console.log('WhatsApp client restart initiated');
                              } catch (error) {
                                console.error('Failed to regenerate QR:', error);
                                alert('Failed to regenerate QR code. Please try again.');
                                setWhatsappStatus(prev => ({ ...prev, initializing: false }));
                              }
                            }}
                            style={{
                              marginTop: '12px',
                              background: 'transparent',
                              color: '#6366f1',
                              border: '1px solid #6366f1',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#6366f1';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#6366f1';
                            }}
                          >
                            🔄 Regenerate QR Code
                          </button>
                        </>
                      ) : whatsappStatus.initializing ? (
                        <div style={{ textAlign: 'center', color: '#333' }}>
                          <div style={{ width: '50px', height: '50px', border: '4px solid #e5e7eb', borderTopColor: '#25D366', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 1s linear infinite' }}></div>
                          <div style={{ fontWeight: 600, fontSize: '1rem' }}>Generating QR Code...</div>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>This may take up to 30 seconds</div>
                          <style dangerouslySetInnerHTML={{
                            __html: `
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                      `}} />
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#333' }}>
                          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📱</div>
                          <button
                            onClick={async () => {
                              try {
                                setWhatsappStatus(prev => ({ ...prev, initializing: true }));
                                const response = await fetch(`${serverUrl}/init`, {
                                  method: 'POST',
                                  headers: { 'x-api-secret': 'urbancrm_secret_key_123' }
                                });
                                if (!response.ok) {
                                  throw new Error(`Server responded with ${response.status}`);
                                }
                                console.log('WhatsApp initialization started');
                              } catch (error) {
                                console.error('Failed to connect to WhatsApp server:', error);
                                alert(`Failed to connect to WhatsApp server at ${serverUrl}. Please ensure the server is running and the URL is correct.`);
                                setWhatsappStatus(prev => ({ ...prev, initializing: false }));
                              }
                            }}
                            style={{ background: '#25D366', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)', transition: 'transform 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🚀 Generate QR Code
                          </button>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem', maxWidth: '250px' }}>Click to generate a QR code for WhatsApp connection</div>
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', opacity: 0.7, textAlign: 'center', maxWidth: '400px', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'white' }}>How to connect:</div>
                      Open WhatsApp on Phone {'>'} Linked Devices {'>'} Link a Device {'>'} Scan QR Code
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div className={styles.chatHeader}>
                      <div>
                        <h3 style={{ marginBottom: '4px' }}>{activeLead.name}</h3>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '10px' }}>
                            {activeLead.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#25D366', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(37, 211, 102, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                            <span style={{ width: 6, height: 6, background: '#25D366', borderRadius: '50%' }} /> WhatsApp Connected
                          </span>

                          {/* --- LEAD HEAT METER --- */}
                          {guidance?.seriousBuyerScore !== undefined && (
                            <div title={`Serious Buyer Score: ${guidance.seriousBuyerScore}/100`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${guidance.heatColor === 'red' ? '#ef4444' : guidance.heatColor === 'yellow' ? '#f59e0b' : '#3b82f6'}` }}>
                              <span style={{ fontSize: '0.9rem' }}>{guidance.heatColor === 'red' ? '🔥' : guidance.heatColor === 'yellow' ? '🟡' : '❄️'}</span>
                              <div style={{ height: '6px', width: '60px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${guidance.seriousBuyerScore}%`, background: guidance.heatColor === 'red' ? '#ef4444' : guidance.heatColor === 'yellow' ? '#f59e0b' : '#3b82f6', transition: 'width 0.5s ease' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>{guidance.seriousBuyerScore}</span>
                            </div>
                          )}

                          {/* --- QUALIFY BUTTON --- */}
                          <button
                            onClick={() => setShowQualificationModal(true)}
                            style={{
                              background: activeLead.qualificationStatus === 'qualified' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.2)',
                              border: `1px solid ${activeLead.qualificationStatus === 'qualified' ? '#10b981' : '#ef4444'}`,
                              color: activeLead.qualificationStatus === 'qualified' ? '#10b981' : '#ef4444',
                              padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {activeLead.qualificationStatus === 'qualified' ? '✅ Qualified' : '⚠️ Qualify Lead'}
                          </button>
                          {activeLead.sampleRequest?.status === 'pending' && (
                            <button
                              onClick={handleDispatchSample}
                              style={{ background: 'var(--warning)', color: 'black', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Icons.Box /> DISPATCH PENDING
                            </button>
                          )}
                          {activeLead.sampleRequest?.status === 'dispatched' && (
                            <span style={{ color: 'var(--success)', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icons.Box /> SAMPLE DISPATCHED
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

                        {/* AGENT TOGGLE */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: isAgentActive ? '#10b981' : 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.5px' }}>
                              {isAgentActive ? '🤖 SALES HERO' : '🤖 AGENT OFF'}
                            </span>
                            <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '18px' }}>
                              <input
                                type="checkbox"
                                checked={isAgentActive}
                                onChange={() => setIsAgentActive(!isAgentActive)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: isAgentActive ? '#3b82f6' : '#4b5563', borderRadius: '34px', transition: '.3s'
                              }}></span>
                              <span style={{
                                position: 'absolute', content: '""', height: '14px', width: '14px', left: isAgentActive ? '20px' : '2px', bottom: '2px',
                                backgroundColor: 'white', borderRadius: '50%', transition: '.3s'
                              }}></span>
                            </label>
                          </div>
                          {isAgentActive && (
                            <div style={{ fontSize: '0.65rem', color: '#f59e0b', maxWidth: '150px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              {agentStatus || 'Standing by...'}
                            </div>
                          )}
                        </div>

                        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 4px' }}></div>

                        {activeLead.phone && (
                          <a
                            href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost"
                            style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', textDecoration: 'none' }}
                            title="Open in WhatsApp"
                          >
                            <Icons.WhatsApp /> WhatsApp
                          </a>
                        )}
                        <div className={styles.dropdownContainer} ref={dropdownRef}>
                          <button className="btn-ghost" onClick={() => setShowActionsDropdown(!showActionsDropdown)}>
                            <Icons.More />
                          </button>
                          {showActionsDropdown && (
                            <div className={styles.dropdownMenu} style={{ position: 'absolute', right: 0, top: '100%', width: '200px', background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '8px', zIndex: 50, padding: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                              <div className={styles.dropdownItem}
                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' }}
                                onClick={async () => {
                                  // Optimistic update
                                  setLeads(prev => prev.map(l => l.id === activeLeadId ? { ...l, status: 'archived' } : l));
                                  setShowActionsDropdown(false);
                                  // API Call
                                  await fetch('/api/leads', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: activeLeadId, status: 'archived' })
                                  });
                                }}>
                                📦 Archive Lead
                              </div>
                              <div className={styles.dropdownItem}
                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' }}
                                onClick={async () => {
                                  // Optimistic update
                                  setLeads(prev => prev.map(l => l.id === activeLeadId ? { ...l, status: 'dead' } : l));
                                  setShowActionsDropdown(false);
                                  // API Call
                                  await fetch('/api/leads', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: activeLeadId, status: 'dead' })
                                  });
                                }}>
                                💀 Mark as Dead
                              </div>
                              <div className={styles.dropdownItem} onClick={() => {
                                handleExportChat();
                                setShowActionsDropdown(false);
                              }}
                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' }}
                              >
                                📥 Export Chat
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.messages}>
                      {activeLead?.messages.map((msg: any, idx: number) => (
                        <div key={idx} className={`${styles.messageRow} ${styles[msg.sender as keyof typeof styles]} animate-fade-in`}>
                          <div className={styles.messageBubble}>
                            {msg.type === 'image' ? (
                              (msg.mediaUrl || msg.content.startsWith('http')) ? (
                                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', maxWidth: '250px' }}>
                                  <img src={msg.mediaUrl || msg.content} alt="Shared Image" style={{ width: '100%', display: 'block' }} />
                                  {msg.mediaUrl && msg.content && !msg.content.startsWith('http') && <div style={{ padding: '8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', color: 'white' }}>{msg.content}</div>}
                                </div>
                              ) : (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', color: '#cbd5e1', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--glass-border)' }}>
                                  📷 {msg.content}
                                </div>
                              )
                            ) : (
                              msg.content
                            )}
                            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.4rem', textAlign: 'right' }}>
                              {mounted ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.inputArea}>
                      {/* --- WEAPON SYSTEM TOOLBAR --- */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                        <button
                          onClick={() => handleSendMessage("Welcome to Urban Clay. You've reached the premium standard in face bricks. Our materials are fired for 48 hours to achieve 35MPa strength—meaning zero maintenance for 50 years.", 'text')}
                          style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid #818cf8', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          ⚡ Premium Intro
                        </button>
                        <button
                          onClick={() => handleSendMessage('Here are 5 premium elevation examples for your reference.', 'image', 'https://placehold.co/600x400/2F4F4F/FFFFFF?text=Villa+Elevation+1')}
                          style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #34d399', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          📷 5 Elevations
                        </button>
                        <button
                          onClick={() => handleSendMessage("We have a sample dispatch going out to your area tomorrow. Should I include a box for your site? It's the best way to check the 35MPa strength.", 'image', availableProducts[0]?.image)}
                          style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid #fbbf24', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          📦 Push Sample
                        </button>
                        <button
                          onClick={() => handleSendMessage("⚠️ Stock Alert: This batch is moving fast. If you are serious about this texture, I suggest we freeze the lot today.", 'text')}
                          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #f87171', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          💀 Scarcity
                        </button>
                        <button
                          onClick={() => handleSendMessage("Could you share the exact site location? I want to check if our heavy trucks can access the road.", 'text')}
                          style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          📍 Ask Location
                        </button>
                      </div>

                      <div className={styles.inputWrapper}>
                        <button
                          className="btn-ghost"
                          onClick={handleSmartDraft}
                          title="Auto-Draft Reply (AI)"
                          style={{ borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginRight: '8px' }}
                        >
                          <Icons.Sparkles />
                        </button>
                        <input
                          className={styles.inputField}
                          placeholder="Type a message..."
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={handleKeyPress}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => handleSendMessage(inputText)}
                          style={{ padding: '0.5rem 0.8rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icons.Send />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ flex: 1, padding: '2rem', overflowX: 'auto', background: 'var(--surface-1)' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', minWidth: 'max-content', height: '100%' }}>
                    {[
                      { title: 'Inbound', stage: 'Lead' },
                      { title: 'Sampling', stage: 'Sampling' },
                      { title: 'Quotation', stage: 'Quotation' },
                      { title: 'Negotiation', stage: 'Negotiation' },
                      { title: 'Success', stage: 'Closed' }
                    ].map(col => {
                      const colLeads = leads.filter(l => {
                        const gu = analyzeContext(l, l.lastMessage);
                        return gu.pipelineStage === col.stage;
                      });
                      const totalValue = colLeads.reduce((acc, l) => {
                        const gu = (l as any).guidance as AIGuidance;
                        return acc + (gu?.numericValue || 0);
                      }, 0);

                      return (
                        <div key={col.title} style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{col.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{colLeads.length}</span>
                          </div>
                          {totalValue > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>₹{totalValue.toLocaleString()} Potential</div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                            {colLeads.map(l => {
                              const gu = (l as any).guidance as AIGuidance;
                              return (
                                <div
                                  key={l.id}
                                  onClick={() => { setViewMode('chat'); setActiveLeadId(l.id); }}
                                  className="glass-panel"
                                  style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '4px' }}>{l.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.lastMessage.content}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                      {mounted ? new Date(l.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                    </span>
                                    {gu?.leadScore === 'HOT 🔥' && <span style={{ fontSize: '0.7rem' }}>🔥</span>}
                                  </div>
                                  {gu?.estimatedValue && (
                                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>{gu.estimatedValue}</div>
                                      {new Date().getTime() - new Date(l.lastActive).getTime() > 24 * 60 * 60 * 1000 && l.status !== 'closed' && (
                                        <div style={{ fontSize: '0.6rem', color: 'var(--error)', fontWeight: 800, animation: 'pulse 2s infinite' }}>⚠️ STALE</div>
                                      )}
                                    </div>
                                  )}

                                  {/* AI Next Step Visualization */}
                                  {gu?.nextStep && (
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span>🤖 {gu.nextStep}</span>
                                      {gu.suggestions?.[0] && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const action = gu.suggestions[0];
                                            if (action.actionType === 'custom_reply' || action.actionType === 'ask_question') {
                                              handleSendMessage(action.payload, 'text');
                                            } else {
                                              // For complex actions, just open chat
                                              setViewMode('chat');
                                              setActiveLeadId(l.id);
                                            }
                                          }}
                                          style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem' }}
                                        >
                                          ⚡ {gu.suggestions[0].label}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.intelligencePanel} style={{
              width: isMobile ? '100%' : '380px',
              flexShrink: 0,
              borderLeft: '1px solid var(--card-border)',
              background: 'var(--warm-white)',
              display: (isMobile && mobileView !== 'info') ? 'none' : 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}>
              <div className={styles.panelHeader} style={{ padding: '1rem 1.5rem' }}>
                {isMobile && (
                  <button
                    onClick={() => setMobileView('chat')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginRight: '1rem', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                )}
                {/* Pipeline Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Revenue Pipeline</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--deep-earth)', marginTop: '2px', fontFamily: 'var(--font-outfit)' }}>
                      ₹{(stats.totalRevenue / 100000).toFixed(1)}L
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Hot Leads</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clay-red)', marginTop: '2px', fontFamily: 'var(--font-outfit)' }}>
                      {stats.hotLeads}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.panelContent} style={{ paddingTop: '0.5rem' }}>
                {activeLead && activeLead.id ? (
                  <>
                    <div className="animate-fade-in">
                      {(() => {
                        const guidance = (activeLead as any).guidance || analyzeContext(activeLead, activeLead.lastMessage);
                        return (
                          <>
                            {/* PRIMARY LEAD CARD */}
                            <div className={styles.infoCard}>
                              {guidance.leadScore === 'HOT 🔥' && <div style={{ position: 'absolute', top: 0, right: 0, left: 0, height: 2, background: 'var(--primary)' }} />}

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <div>
                                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                    {guidance.customerType || 'New Contact'}
                                  </h3>
                                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📍</span> {guidance.location || 'Location Pending'}
                                  </div>
                                </div>
                                <div style={{
                                  padding: '4px 12px', borderRadius: '999px',
                                  background: guidance.qualificationStatus === 'qualified' ? 'rgba(76, 117, 88, 0.1)' : 'rgba(217, 119, 66, 0.1)',
                                  color: guidance.qualificationStatus === 'qualified' ? 'var(--success)' : 'var(--warning)',
                                  fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                                }}>
                                  {guidance.qualificationStatus?.replace('_', ' ') || 'Pending'}
                                </div>
                              </div>

                              {/* URGENCY & ALERTS */}
                              {guidance.followUpStatus === 'Urgent' && (
                                <div className={styles.infoCard} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.2rem' }}>⏰</span>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--error)' }}>ACTION REQUIRED</div>
                                    <div style={{ fontSize: '0.7rem', color: '#fca5a5' }}>Lead is hot but inactive. Follow up now!</div>
                                  </div>
                                </div>
                              )}

                              {/* ARCHITECT DETECTOR BADGE */}
                              {guidance.isArchitect && (
                                <div style={{
                                  background: 'linear-gradient(90deg, #F59E0B, #D97706)',
                                  color: 'black',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  textAlign: 'center',
                                  marginBottom: '1rem',
                                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}>
                                  <span>📐</span> ARCHITECT DETECTED
                                </div>
                              )}

                              {/* SERIOUS BUYER SCORE (0-100) */}
                              <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Buyer Intent Score</span>
                                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clay-red)' }}>{guidance.seriousBuyerScore || 0}/100</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${guidance.seriousBuyerScore || 10}%`,
                                    background: (guidance.seriousBuyerScore || 0) > 75 ? 'var(--clay-red)' : ((guidance.seriousBuyerScore || 0) > 40 ? 'var(--warning)' : '#cbd5e1'),
                                    borderRadius: '4px',
                                    transition: 'width 0.5s ease'
                                  }} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '12px' }}>
                                  <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Value</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{guidance.estimatedValue || '-'}</div>
                                  </div>
                                  <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Timeline</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{guidance.decisionPressure || 'Thinking'}</div>
                                  </div>
                                </div>
                              </div>



                              {/* SALES SIGNALS: Objections & Risks Only */}
                              {/* SALES SIGNALS & INTENT (UNIFIED CARD) */}
                              <div className={styles.infoCard} style={{ marginTop: '1rem', padding: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Smart Analysis</h4>

                                {/* OBJECTION DETECTOR */}
                                {guidance.objectionDetected && guidance.objectionDetected !== 'None' ? (
                                  <div style={{ marginBottom: '1rem', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--error)' }}>{guidance.objectionDetected.toUpperCase()} DETECTED</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {guidance.objectionDetected === 'Price' ? 'Negotiation detected. Promote value/ROI.' : 'Competitor mention. Highlight exclusivity.'}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                    <span>✅</span> <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No objections detected.</span>
                                  </div>
                                )}
                                {/* OBJECTION INTENSITY */}
                                {guidance.objectionIntensity && (
                                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Objection Intensity</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: guidance.objectionIntensity === 'High' ? 'rgba(239, 68, 68, 0.2)' : (guidance.objectionIntensity === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'), color: guidance.objectionIntensity === 'High' ? 'var(--error)' : (guidance.objectionIntensity === 'Medium' ? 'var(--warning)' : 'var(--success)') }}>
                                      {guidance.objectionIntensity.toUpperCase()}
                                    </div>
                                  </div>
                                )}

                                {/* CLIENT BEHAVIOR SUMMARY */}
                                {guidance.clientBehavior && (
                                  <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                                    <div>
                                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Responsiveness</div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: guidance.clientBehavior.responsiveness === 'Fast' ? 'var(--success)' : 'var(--text-primary)' }}>{guidance.clientBehavior.responsiveness}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Seriousness</div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: guidance.clientBehavior.seriousnessScore === 'High' ? 'var(--clay-red)' : 'var(--text-primary)' }}>{guidance.clientBehavior.seriousnessScore}</div>
                                    </div>
                                  </div>
                                )}


                                {/* GHOSTING STATUS */}
                                {guidance.ghostingStatus !== 'Safe' && (
                                  <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #fbbf24', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>👻</span>
                                    <div>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>RISK: {guidance.ghostingStatus.toUpperCase()}</div>
                                      <div style={{ fontSize: '0.7rem', color: '#fcd34d' }}>Use 'Ghosting Rescue' script.</div>
                                    </div>
                                  </div>
                                )}

                              </div>

                              {/* Google Contact Sync Button */}
                              <button
                                onClick={() => handleGoogleSync(activeLead, guidance)}
                                disabled={syncedContacts.has(activeLead.id)}
                                className="glass-panel"
                                style={{
                                  width: '100%',
                                  padding: '0.6rem',
                                  marginBottom: '1rem',
                                  background: syncedContacts.has(activeLead.id) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(66, 133, 244, 0.1)',
                                  border: `1px solid ${syncedContacts.has(activeLead.id) ? 'var(--success)' : '#4285F4'}`,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  cursor: syncedContacts.has(activeLead.id) ? 'default' : 'pointer',
                                  opacity: syncedContacts.has(activeLead.id) ? 0.8 : 1
                                }}
                              >
                                <span style={{ fontSize: '1rem' }}>{syncedContacts.has(activeLead.id) ? '✅' : '👤'}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: syncedContacts.has(activeLead.id) ? 'var(--success)' : '#4285F4' }}>
                                  {syncedContacts.has(activeLead.id) ? 'Saved to Google Contacts' : 'Sync to Google Contacts'}
                                </span>
                              </button>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Estimation</div>
                                  <div style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: 600 }}>
                                    {guidance.estimatedValue || '—'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Closure Prob.</div>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>{guidance.closureProbability}%</div>
                                </div>
                              </div>


                              {/* CLIMATE INTELLIGENCE */}
                              {guidance.climateStrategy && (
                                <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', marginBottom: '1.2rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span>{guidance.climateStrategy.label.split(' ')[0]}</span>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>{guidance.climateStrategy.label}</div>
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#bae6fd', marginBottom: '6px' }}>
                                    "{guidance.climateStrategy.advice}"
                                  </div>
                                  <div style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                    Suggested: <strong style={{ color: 'white' }}>{guidance.climateStrategy.productFocus}</strong>
                                  </div>
                                </div>
                              )}

                              {/* GHOSTING RISK & RESCUE MODE */}
                              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Ghosting Risk</span>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: (guidance.ghostingProbability || 0) > 60 ? 'var(--error)' : 'var(--success)' }}>
                                    {(guidance.ghostingProbability || 0) > 60 ? 'CRITICAL - RESCUE MODE' : ((guidance.ghostingProbability || 0) > 30 ? 'MEDIUM' : 'LOW')}
                                  </span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${guidance.ghostingProbability || 0}%`,
                                    background: (guidance.ghostingProbability || 0) > 60 ? 'var(--error)' : ((guidance.ghostingProbability || 0) > 30 ? 'var(--warning)' : 'var(--success)'),
                                    boxShadow: (guidance.ghostingProbability || 0) > 60 ? '0 0 10px var(--error)' : 'none',
                                    transition: 'width 0.5s ease-in-out'
                                  }} />
                                </div>
                              </div>
                            </div>

                            {/* AI COPILOT ACTIONS */}
                            <div style={{ marginBottom: '2rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                                AI COPILOT ACTIONS
                              </div>
                              {guidance.suggestions.slice(0, 4).map((action: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={styles.suggestionBtn}
                                  onClick={() => handleAction(action)}
                                  style={{ position: 'relative', marginBottom: '8px' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{action.label}</span>
                                    {action.actionType === 'custom_reply' && <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '1px 6px', borderRadius: '4px' }}>DRAFT</span>}
                                  </div>
                                  {action.description && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{action.description}</div>
                                  )}
                                </div>
                              ))}
                            </div>


                            {/* Tools Section - Redesigned 2-Column Layout */}
                            <div style={{ marginTop: '2rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', paddingLeft: '4px' }}>
                                SALES TOOLS
                              </div>

                              <div style={{ display: 'flex', gap: '1rem', height: '500px' }}>
                                {/* Left Sidebar: Categories - PREMIUM LOOK */}
                                <div style={{ width: '140px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', padding: '12px', borderRadius: '16px' }}>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '4px' }}>Apps</div>
                                  <button
                                    onClick={() => setActiveTab('calculator')}
                                    style={{
                                      background: activeTab === 'calculator' ? 'linear-gradient(135deg, var(--primary), #4f46e5)' : 'transparent',
                                      color: activeTab === 'calculator' ? 'white' : 'var(--text-secondary)',
                                      border: 'none',
                                      borderRadius: '12px',
                                      padding: '10px 12px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '8px',
                                      marginBottom: '12px',
                                      textAlign: 'left',
                                      transition: 'all 0.3s ease',
                                      boxShadow: activeTab === 'calculator' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                                    }}
                                  >
                                    <Icons.Calc /> Quote
                                  </button>
                                  <button
                                    onClick={() => setActiveTab('add_product')}
                                    style={{
                                      background: activeTab === 'add_product' ? 'linear-gradient(135deg, var(--primary), #4f46e5)' : 'transparent',
                                      color: activeTab === 'add_product' ? 'white' : 'var(--text-secondary)',
                                      border: 'none',
                                      borderRadius: '12px',
                                      padding: '10px 12px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '8px',
                                      marginBottom: '12px',
                                      textAlign: 'left',
                                      transition: 'all 0.3s ease',
                                      boxShadow: activeTab === 'add_product' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                                    }}
                                  >
                                    <span style={{ fontSize: '1.2rem', lineHeight: 0 }}>+</span> Add Product
                                  </button>

                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', paddingLeft: '4px' }}>Materials</div>

                                  {['All', 'brick', 'cladding', 'roofing', 'paver', 'jali', 'project'].map(tab => (
                                    <button
                                      key={tab}
                                      onClick={() => { setActiveTab(tab as any); setCalculatedQuote(null); }}
                                      style={{
                                        background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                                        borderLeft: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                                        borderRadius: '0 8px 8px 0',
                                        padding: '8px 12px',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                        fontWeight: activeTab === tab ? 600 : 400
                                      }}
                                    >
                                      {tab === 'brick' ? '🧱 Bricks' :
                                        tab === 'roofing' ? '🏠 Roofing' :
                                          tab === 'paver' ? '🦶 Flooring' :
                                            tab === 'jali' ? '🕸️ Jalis' :
                                              tab === 'cladding' ? '🖼️ Cladding' :
                                                tab === 'project' ? '📷 Projects' : 'All Products'}
                                    </button>
                                  ))}
                                </div>

                                {/* Right Content Area - PREMIUM LOOK */}
                                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', paddingBottom: '50px', WebkitOverflowScrolling: 'touch' }}>
                                  {activeTab === 'add_product' ? (
                                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>Add New Product</h3>
                                        <button
                                          onClick={() => setActiveTab('All')}
                                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                                        >✕</button>
                                      </div>

                                      {/* Image Upload Area */}
                                      <div
                                        style={{
                                          border: '2px dashed var(--glass-border)',
                                          borderRadius: '12px',
                                          padding: '2rem',
                                          textAlign: 'center',
                                          marginBottom: '1.5rem',
                                          background: newProductForm.image ? `url(${newProductForm.image}) center/cover` : 'rgba(0,0,0,0.2)',
                                          height: '180px',
                                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                          cursor: 'pointer',
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                        onClick={() => document.getElementById('product-image-upload')?.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          const file = e.dataTransfer.files[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setNewProductForm({ ...newProductForm, image: reader.result as string });
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      >
                                        <input
                                          type="file"
                                          id="product-image-upload"
                                          hidden
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => setNewProductForm({ ...newProductForm, image: reader.result as string });
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                        {!newProductForm.image && (
                                          <>
                                            <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>📸</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Drag & Drop or Click to Upload</div>
                                          </>
                                        )}
                                        {newProductForm.image && (
                                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem' }}>Click to change</div>
                                        )}
                                      </div>

                                      {/* Form Fields */}
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Product Name</label>
                                          <input
                                            type="text"
                                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                            value={newProductForm.name}
                                            onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                            placeholder="e.g. Vintage Brick"
                                          />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label>
                                          <select
                                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                            value={newProductForm.category}
                                            onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                          >
                                            {['brick', 'cladding', 'roofing', 'paver', 'jali'].map(c => (
                                              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Purchase Rate (₹)</label>
                                          <input
                                            type="number"
                                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                            value={newProductForm.purchaseRate}
                                            onChange={e => setNewProductForm({ ...newProductForm, purchaseRate: e.target.value })}
                                            placeholder="0.00"
                                          />
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Selling Rate (₹)</label>
                                          <input
                                            type="number"
                                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                            value={newProductForm.sellingRate}
                                            onChange={e => setNewProductForm({ ...newProductForm, sellingRate: e.target.value })}
                                            placeholder="0.00"
                                          />
                                        </div>
                                      </div>

                                      <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description / Specs (Size, etc.)</label>
                                        <textarea
                                          style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none', height: '80px', resize: 'none' }}
                                          value={newProductForm.description}
                                          onChange={e => setNewProductForm({ ...newProductForm, description: e.target.value })}
                                          placeholder="Size: 9x4x3 inches..."
                                        />
                                      </div>

                                      <button
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                        onClick={async () => {
                                          if (!newProductForm.name || !newProductForm.sellingRate) return;

                                          try {
                                            const res = await fetch('/api/products', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                name: newProductForm.name,
                                                category: newProductForm.category,
                                                image: newProductForm.image,
                                                purchaseRate: newProductForm.purchaseRate,
                                                sellingRate: newProductForm.sellingRate,
                                                description: newProductForm.description
                                              })
                                            });

                                            if (res.ok) {
                                              const savedProduct = await res.json();
                                              setAvailableProducts(prev => [savedProduct, ...prev]);
                                              setActiveTab(newProductForm.category as any);
                                              setNewProductForm({ name: '', category: 'brick', sellingRate: '', purchaseRate: '', dimensions: '', description: '', image: '' });
                                              alert('Product Saved to Database!');
                                            } else {
                                              alert('Failed to save product');
                                            }
                                          } catch (e) {
                                            console.error('Save error:', e);
                                            alert('Error saving product');
                                          }
                                        }}
                                      >
                                        Save Product
                                      </button>

                                    </div>
                                  ) : activeTab === 'calculator' ? (
                                    <QuoteBuilder
                                      products={availableProducts}
                                      activeLead={activeLead}
                                      onSendWhatsApp={async (to, msg, caption, mediaData, mime, filename) => {
                                        if (!activeLead) return;
                                        await handleSendWhatsAppMedia(to, msg, caption, mediaData, mime, filename);
                                      }}
                                    />
                                  ) : activeTab === 'calc_old' ? (
                                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)', border: '1px solid var(--glass-border)' }}>
                                      <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Product</label>
                                        <select
                                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
                                          value={calculatorForm.product}
                                          onChange={(e) => {
                                            setCalculatorForm({ ...calculatorForm, product: e.target.value });
                                            setCalculatedQuote(null);
                                          }}
                                        >
                                          <option value="">Choose Product...</option>
                                          {availableProducts.filter(p => p.category !== 'project').map((p: any) => (
                                            <option key={p.id} value={p.name}>{p.name} (₹{p.sellingRate || 55})</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Area (Sq. Ft)</label>
                                        <input
                                          type="number"
                                          placeholder="e.g. 1500"
                                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                                          value={calculatorForm.area}
                                          onChange={(e) => {
                                            setCalculatorForm({ ...calculatorForm, area: e.target.value });
                                            setCalculatedQuote(null);
                                          }}
                                        />
                                      </div>

                                      <button
                                        className="btn-primary"
                                        style={{ width: '100%', marginBottom: '1.5rem', padding: '12px', fontSize: '1rem', background: 'linear-gradient(90deg, var(--primary), #4f46e5)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
                                        onClick={() => {
                                          if (!calculatorForm.product || !calculatorForm.area) return;
                                          const area = parseFloat(calculatorForm.area);
                                          if (isNaN(area)) return;
                                          const product = availableProducts.find(p => p.name === calculatorForm.product) as any;
                                          const price = product?.sellingRate || 55;
                                          const unitsPerSqFt = 5;
                                          const totalUnits = Math.ceil(area * unitsPerSqFt);
                                          const totalCost = totalUnits * price;
                                          setCalculatedQuote({ totalUnits, totalCost });
                                        }}
                                      >
                                        Calculate Quote
                                      </button>

                                      {calculatedQuote && (
                                        <div className="animate-fade-in" style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Units Required</span>
                                            <span style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>{calculatedQuote!.totalUnits.toLocaleString()}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estimated Cost</span>
                                            <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.4rem' }}>₹{calculatedQuote!.totalCost.toLocaleString()}</span>
                                          </div>

                                          {/* Actions */}
                                          <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                              className="btn-ghost"
                                              style={{ flex: 1, border: '1px solid var(--success)', color: 'var(--success)', padding: '10px' }}
                                              onClick={() => {
                                                if (!calculatedQuote) return;
                                                const msg = `🧾 *Quick Estimate*\n\n**Product:** ${calculatorForm.product}\n**Area:** ${calculatorForm.area} sq.ft\n**Qty:** ${calculatedQuote!.totalUnits.toLocaleString()} units\n**Total:** ₹${calculatedQuote!.totalCost.toLocaleString()}`;
                                                handleSendMessage(msg, 'text');
                                              }}
                                            >
                                              Send via WhatsApp
                                            </button>
                                            <button
                                              className="btn-primary"
                                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#334155' }}
                                              onClick={() => setShowQuotePreview(true)}
                                            >
                                              📄 Preview PDF
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      {/* Smart Quote Actions */}
                                      <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                        <button
                                          className="btn-ghost"
                                          style={{ flex: 1, fontSize: '0.7rem', padding: '8px', border: '1px solid var(--glass-border)' }}
                                          onClick={() => handleSendMessage('Could you please share the site location (Google Maps pin)? It helps us calculate transport.', 'text')}
                                        >
                                          📍 Ask Location
                                        </button>
                                        <button
                                          className="btn-ghost"
                                          style={{ flex: 1, fontSize: '0.7rem', padding: '8px', border: '1px solid var(--glass-border)' }}
                                          onClick={() => handleSendMessage('To give an exact quote, what is the approximate area in sq. ft.?', 'text')}
                                        >
                                          📏 Ask Area
                                        </button>
                                        <button
                                          className="btn-ghost"
                                          style={{ flex: 1, fontSize: '0.7rem', padding: '8px', border: '1px solid var(--glass-border)' }}
                                          onClick={() => handleSendMessage('Is this for a house elevation, boundary wall, or commercial project?', 'text')}
                                        >
                                          🏠 Ask Type
                                        </button>
                                      </div>

                                    </div>
                                  ) : (
                                    <div className={styles.productGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                                      {filteredProducts.map((p: any) => (
                                        <div
                                          key={p.id}
                                          className={styles.productThumb}
                                          title={p.name}
                                          onClick={() => handleSendMessage(`[IMG: ${p.name}]`, 'image')}
                                          style={{
                                            height: '160px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                                          }}
                                        >
                                          {p.image.includes('placeholder') || p.image.includes('placehold.co') ? (
                                            (() => {
                                              // Extract color from placeholder URL if possible
                                              const colorMatch = p.image.match(/placehold\.co\/\d+x\d+\/([a-fA-F0-9]+)/);
                                              const baseColor = colorMatch ? `#${colorMatch[1]}` : '#334155';
                                              return (
                                                <div style={{
                                                  width: '100%',
                                                  height: '100%',
                                                  background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}80 100%)`,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center'
                                                }}>
                                                  <span style={{ fontSize: '2rem', opacity: 0.2 }}>📦</span>
                                                </div>
                                              );
                                            })()
                                          ) : (
                                            <img
                                              src={p.image}
                                              alt={p.name}
                                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement!.style.background = 'linear-gradient(45deg, #334155, #1e293b)';
                                              }}
                                            />
                                          )}
                                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                            {p.category !== 'project' && <div style={{ fontSize: '0.65rem', color: 'var(--success)' }}>₹{p.sellingRate || 55}/unit</div>}
                                          </div>

                                          {/* Hover Overlay Hint */}
                                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '4px' }}>
                                            <Icons.Send />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>Select a lead to view intelligence</div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>AI analysis and sales tools will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modern Sample Request Modal */}
          {
            showSampleModal && (
              <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
              }}>
                <div className="glass-panel animate-fade-in" style={{
                  width: '420px', padding: '2rem', borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', background: '#1e293b'
                }}>
                  <h3 style={{ color: 'var(--warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                    <Icons.Box /> Sample Request Detected
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    The client requested a sample. Please confirm the details below to initialize the dispatch workflow.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Items</label>
                      <input
                        value={sampleForm.item}
                        onChange={e => setSampleForm(p => ({ ...p, item: e.target.value }))}
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Delivery Address</label>
                      <textarea
                        rows={3}
                        value={sampleForm.address}
                        onChange={e => setSampleForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="Enter full address..."
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', resize: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => setShowSampleModal(false)}
                        className="btn-ghost"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogSample}
                        className="btn-primary"
                        style={{ flex: 1, background: 'var(--warning)', color: 'black' }}
                      >
                        Confirm & Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          {/* Formal Quotation Preview Modal */}
          {
            showQuotePreview && calculatedQuote && (
              <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(3, 7, 18, 0.9)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                padding: '2rem'
              }}>
                <div className="animate-fade-in" style={{
                  width: '100%', maxWidth: '800px', height: '90vh',
                  background: 'white', color: '#1e293b', borderRadius: '4px',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                  {/* Header / Actions */}
                  <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Quotation Preview</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => setShowQuotePreview(false)} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', color: '#64748b', cursor: 'pointer' }}>Close</button>
                      <button
                        onClick={() => {
                          if (!calculatedQuote) return;
                          const msg = `📄 *Formal Quote Generated*\n\n**Quotation #**: UC-${Math.floor(Math.random() * 10000)}\n**Client**: ${activeLead.name}\n**Total Amount**: ₹${calculatedQuote.totalCost.toLocaleString()}\n\n_Check your email for the detailed PDF attachment._`;
                          handleSendMessage(msg, 'text');
                          setShowQuotePreview(false);
                        }}
                        style={{ padding: '6px 20px', background: '#4f46e5', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Send to WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* DOCUMENT CONTENT (Scrollable) */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 5rem', background: 'white' }}>
                    {/* Branding */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                      <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.02em', margin: 0 }}>URBAN CLAY</h1>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Exposed Brick & Teracotta Specialist</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#94a3b8', margin: 0 }}>QUOTATION</h2>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginTop: '8px' }}>#UC-{Math.floor(Date.now() / 1000000)}</p>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '3rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>From</h4>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px 0' }}>Urban Clay Solutions</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                          302, Diamond Arcade, MG Road<br />
                          Bangalore, KA - 560001<br />
                          GSTIN: 29ABCDE1234F1Z5
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>Bill To</h4>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px 0' }}>{activeLead.name}</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                          {activeLead.phone || 'Contact pending'}<br />
                          {guidance?.location || 'Location provided in chat'}
                        </p>
                      </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Item Description</th>
                          <th style={{ textAlign: 'right', padding: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Qty</th>
                          <th style={{ textAlign: 'right', padding: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Rate</th>
                          <th style={{ textAlign: 'right', padding: '12px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '16px 12px', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9' }}>
                            <strong>{calculatorForm.product}</strong><br />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Premium exposed grade for exterior facade</span>
                          </td>
                          <td style={{ textAlign: 'right', padding: '16px 12px', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9' }}>{calculatedQuote!.totalUnits.toLocaleString()} Nos</td>
                          <td style={{ textAlign: 'right', padding: '16px 12px', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9' }}>₹{(calculatedQuote!.totalCost / calculatedQuote!.totalUnits).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', padding: '16px 12px', fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>₹{calculatedQuote!.totalCost.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Footer / Total */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4rem' }}>
                      <div style={{ width: '250px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem', color: '#64748b' }}>
                          <span>Subtotal</span>
                          <span>₹{calculatedQuote!.totalCost.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem', color: '#64748b' }}>
                          <span>GST (Included)</span>
                          <span>₹0.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #4f46e5', marginTop: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>Grand Total</span>
                          <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.2rem' }}>₹{calculatedQuote!.totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* T&C */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>Terms & Conditions</h4>
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
                        <li>• 50% Advance with Purchase Order, balance before dispatch.</li>
                        <li>• Delivery within 7-10 working days from payment confirmation.</li>
                        <li>• Material once sold cannot be returned or exchanged.</li>
                        <li>• Transportation charges extra as per actuals.</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                    This document is generated by Urban Clay Solutions.
                  </div>
                </div>
              </div>
            )
          }
          {/* Modal for Manual Lead Entry */}
          {
            showNewLeadModal && (
              <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }}>
                <div className="glass-panel animate-fade-in" style={{
                  width: '400px', padding: '2rem', borderRadius: 'var(--radius-lg)',
                  background: '#1e293b', border: '1px solid var(--glass-border)'
                }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'white' }}>Quick Add Lead</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Client Name</label>
                      <input
                        autoFocus
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                        placeholder="e.g. John Doe"
                        value={newLeadForm.name}
                        onChange={e => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>WhatsApp Number</label>
                      <input
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                        placeholder="e.g. 919876543210"
                        value={newLeadForm.phone}
                        onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Product Interest</label>
                      <input
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                        placeholder="e.g. Red Jali"
                        value={newLeadForm.product}
                        onChange={e => setNewLeadForm({ ...newLeadForm, product: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Initial Message</label>
                      <textarea
                        rows={3}
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontFamily: 'inherit' }}
                        placeholder="Paste details here..."
                        value={newLeadForm.message}
                        onChange={e => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                      <button
                        className="btn-ghost"
                        style={{ flex: 1 }}
                        onClick={() => setShowNewLeadModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                        onClick={handleAddLead}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            Saving...
                          </>
                        ) : 'Save Lead'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {/* --- QUALIFICATION MODAL --- */}
          {
            showQualificationModal && activeLead && (
              <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }}>
                <div className="glass-panel animate-fade-in" style={{
                  width: '450px', padding: '2rem', borderRadius: 'var(--radius-lg)',
                  background: '#1e293b', border: '1px solid var(--glass-border)'
                }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🏗️ Lead Qualification
                    <span style={{ fontSize: '0.7rem', background: '#3b82f6', padding: '2px 8px', borderRadius: '10px' }}>MANDATORY</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Project Location (City/Area)</label>
                      <input
                        autoFocus
                        placeholder="e.g. Whitefield, Bangalore"
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                        defaultValue={activeLead.siteLocation}
                        // In a real app, use controlled state. Here we use quick refs or just assume we save via API
                        onChange={(e) => {
                          // Quick local update for demo
                          activeLead.siteLocation = e.target.value;
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Project Type</label>
                        <select
                          style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                          defaultValue={activeLead.projectType || 'villa'}
                          onChange={(e) => activeLead.projectType = e.target.value as any}
                        >
                          <option value="villa">🏡 Luxury Villa</option>
                          <option value="renovation">hammer Renovation</option>
                          <option value="boundary">🧱 Boundary Wall</option>
                          <option value="commercial">🏢 Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Est. Area (Sq.Ft)</label>
                        <input
                          type="number"
                          placeholder="e.g. 2500"
                          style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                          defaultValue={activeLead.estimatedArea}
                          onChange={(e) => activeLead.estimatedArea = parseInt(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Start Date</label>
                      <input
                        type="date"
                        style={{ width: '100%', padding: '10px', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                        defaultValue={activeLead.workStartDate}
                        onChange={(e) => activeLead.workStartDate = e.target.value}
                      />
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', fontWeight: 600, border: 'none', borderRadius: '8px' }}
                        onClick={async () => {
                          // Save logic
                          const newStatus = (activeLead.siteLocation && activeLead.estimatedArea) ? 'qualified' : 'partially_qualified';

                          // Update Local State (Optimistic)
                          setLeads(prev => prev.map(l => l.id === activeLeadId ? {
                            ...l,
                            qualificationStatus: newStatus as any,
                            siteLocation: activeLead.siteLocation,
                            projectType: activeLead.projectType,
                            estimatedArea: activeLead.estimatedArea,
                            workStartDate: activeLead.workStartDate
                          } : l));

                          // Close Modal
                          setShowQualificationModal(false);
                          alert("Lead Qualified! Score updated.");

                          // In real app, API call here: await fetch('/api/leads/update', ...)
                        }}
                      >
                        Safe & Qualify
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ flex: 1, border: '1px solid var(--glass-border)' }}
                        onClick={() => setShowQualificationModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

        </div>
      </Shell>
    </div>
  );
}
