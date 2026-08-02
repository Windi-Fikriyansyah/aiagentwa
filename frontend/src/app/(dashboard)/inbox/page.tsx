"use client";

import { 
  Search, 
  Phone, 
  MoreVertical, 
  Truck, 
  PlusCircle, 
  Send, 
  UserSearch, 
  Mail, 
  Calendar,
  Bell,
  MessageSquare
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !selectedConvId) {
          setSelectedConvId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const intervalId = setInterval(fetchConversations, 5000);
    return () => clearInterval(intervalId);
  }, []); // Remove selectedConvId from dependency so it doesn't reset interval

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [selectedConvId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedConvId || isSending) return;
    
    setIsSending(true);
    const msg = inputMessage.trim();
    setInputMessage(""); // Optimistic clear

    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      
      if (res.ok) {
        // Fetch immediately after sending
        await fetchMessages();
        await fetchConversations();
      } else {
        alert("Failed to send message. Is the backend running?");
      }
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setIsSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest md:rounded-xl overflow-hidden border-0 md:border border-outline-variant/30 md:shadow-sm">
      {/* Dashboard TopBar */}
      <header className="h-16 border-b border-outline-variant/20 flex items-center justify-between px-gutter bg-surface-container-lowest/50 backdrop-blur-md sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Inbox</h2>
          <div className="h-6 w-[1px] bg-outline-variant/40"></div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-primary">{conversations.length} Active Chats</span>
          </div>
        </div>
      </header>

      {/* Three-Column Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Column 1: Conversations List */}
        <section className="w-80 flex flex-col border-r border-outline-variant/20 bg-surface-container-lowest shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-outline-variant/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
              <input className="w-full pl-9 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-sm font-body-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search conversations..." type="text" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto chat-scrollbar">
            {conversations.map(conv => {
              const isActive = conv.id === selectedConvId;
              const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
              
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-4 cursor-pointer transition-colors border-b border-outline-variant/10 ${isActive ? 'bg-primary-container/10 border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-on-surface text-body-sm truncate pr-2">{conv.name || conv.jid}</h4>
                    <span className="text-[11px] text-secondary shrink-0">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-body-sm text-secondary truncate">{lastMsg ? lastMsg.content : "No messages"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {lastMsg?.sender === 'ai' && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">AI Handled</span>}
                    {conv.status === 'human_needed' && <span className="px-2 py-0.5 bg-tertiary-container/30 text-tertiary text-[10px] font-bold rounded-full uppercase">Human Needed</span>}
                    {/* Lead status badges hidden - functionality preserved in backend
                    {conv.leadStatus === 'hot' && <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">🔥 Hot</span>}
                    {conv.leadStatus === 'warm' && <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">🌟 Warm</span>}
                    {conv.leadStatus === 'cold' && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">❄️ Cold</span>}
                    */}
                  </div>
                </div>
              );
            })}
            
            {conversations.length === 0 && (
              <div className="p-8 text-center text-secondary text-sm">
                No active conversations yet.
              </div>
            )}
          </div>
        </section>

        {/* Column 2: Main Chat Area */}
        <section className="flex-1 flex flex-col bg-surface-container-low/30">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-gutter border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold shrink-0">
                    {(activeConv.name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-body-md truncate">{activeConv.name || activeConv.jid}</h3>
                    <p className="text-xs text-secondary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                      {activeConv.jid}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-secondary hover:bg-surface-container-low rounded-lg transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 text-secondary hover:bg-surface-container-low rounded-lg transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-gutter space-y-6 chat-scrollbar">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isAi = msg.sender === 'ai';
                  const isHuman = msg.sender === 'human';
                  
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[85%] md:max-w-[70%] group">
                        <div className={`p-4 rounded-xl shadow-sm border ${
                          isUser ? 'bg-white chat-bubble-user border-outline-variant/10' : 
                          isAi ? 'bg-primary-container chat-bubble-ai border-primary/20' :
                          'bg-tertiary-container chat-bubble-ai border-tertiary/20'
                        }`}>
                          <p className={`text-body-sm ${isUser ? 'text-on-surface' : 'text-on-primary-container'} whitespace-pre-wrap`}>{msg.content}</p>
                        </div>
                        <span className={`text-[10px] text-secondary mt-1 block ${isUser ? 'ml-1' : 'text-right mr-1'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {isAi ? 'Sent by AI' : isHuman ? 'Sent by Admin' : 'Read'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-gutter bg-surface-container-lowest border-t border-outline-variant/20 shrink-0">
                <div className="flex items-end gap-3">
                  <button className="p-2 text-secondary hover:text-primary transition-colors hidden sm:block">
                    <PlusCircle size={24} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea 
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="w-full p-3 bg-surface-container-low border-none rounded-xl text-body-sm resize-none focus:ring-1 focus:ring-primary transition-all outline-none" 
                      placeholder="Type a message to reply..." 
                      rows={1} 
                      style={{ minHeight: "48px", maxHeight: "120px" }} 
                      disabled={isSending}
                    />
                  </div>
                  <button 
                    onClick={handleSend}
                    disabled={isSending || !inputMessage.trim()}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ${
                      isSending || !inputMessage.trim() ? 'bg-surface-container-high text-secondary cursor-not-allowed' : 'bg-primary text-white shadow-primary/20 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </section>

        {/* Column 3: Contact Sidebar */}
        <aside className="w-72 border-l border-outline-variant/20 bg-surface-container-lowest flex-col shrink-0 hidden xl:flex">
          {activeConv ? (
            <>
              <div className="p-stack-md flex flex-col items-center text-center border-b border-outline-variant/10">
                <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-2xl font-bold mb-3">
                  {(activeConv.name || "U")[0].toUpperCase()}
                </div>
                <h4 className="font-bold text-on-surface text-body-md">{activeConv.name || "Unknown"}</h4>
                <p className="text-body-sm text-secondary">{activeConv.jid}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-stack-md space-y-stack-lg chat-scrollbar">
                {/* Human Takeover Button */}
                <div className="p-4 rounded-xl bg-tertiary-container/20 border border-tertiary-container/40">
                  <div className="flex items-center gap-2 mb-3">
                    <UserSearch className="text-tertiary" size={20} />
                    <span className="font-bold text-tertiary text-body-sm">AI Monitoring</span>
                  </div>
                  <p className="text-[12px] text-on-tertiary-container mb-4">The AI is currently handling complex requests. You can take over the chat at any time.</p>
                  <button className="w-full py-2 bg-tertiary text-white rounded-lg font-label-md text-label-md shadow-md shadow-tertiary/20 hover:opacity-90 active:scale-[0.98] transition-all">
                    Human Takeover
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
