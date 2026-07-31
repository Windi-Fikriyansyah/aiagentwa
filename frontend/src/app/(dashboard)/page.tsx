"use client";

import { useEffect, useState } from "react";
import { 
  Bot, 
  Plus, 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  CreditCard, 
  Settings, 
  CircleHelp, 
  Calendar, 
  MessageCircle, 
  Sparkles, 
  Headset, 
  RadioTower, 
  MoreVertical, 
  ShoppingCart, 
  CalendarDays, 
  Zap, 
  Database 
} from "lucide-react";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/dashboard/metrics');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard metrics", err);
      }
    };
    
    fetchMetrics();
    setIsLoaded(true);
  }, []);

  return (
    <>
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md mb-stack-lg">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Dashboard Overview</h2>
            <p className="font-body-md text-body-md text-secondary">Real-time performance of your WhatsApp AI automation.</p>
          </div>
          <div className="flex items-center gap-stack-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/20">
              <span className="w-2 h-2 bg-primary-container rounded-full animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Live System</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-outline text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-low transition-all">
              <Calendar size={20} />
              Last 7 Days
            </button>
          </div>
        </header>

        {/* Key Metrics Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
          {/* Metric Card 1 */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 flex flex-col gap-stack-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary">
                <MessageCircle size={24} />
              </div>
              <span className="text-primary font-label-sm text-label-sm bg-primary-container/20 px-2 py-0.5 rounded-full">All Time</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">Total Conversations</p>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{metrics ? metrics.totalConversations.toLocaleString() : '...'}</h3>
            </div>
          </div>
          {/* Metric Card 2 */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 flex flex-col gap-stack-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-tertiary-container/10 rounded-lg flex items-center justify-center text-tertiary">
                <Sparkles size={24} />
              </div>
              <span className="text-tertiary font-label-sm text-label-sm bg-tertiary-container/20 px-2 py-0.5 rounded-full">{metrics && metrics.aiResponseRate >= 80 ? 'Optimal' : 'Average'}</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">AI Response Rate</p>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{metrics ? `${metrics.aiResponseRate}%` : '...'}</h3>
            </div>
          </div>
          {/* Metric Card 3 */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 flex flex-col gap-stack-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-secondary-container/10 rounded-lg flex items-center justify-center text-secondary">
                <Headset size={24} />
              </div>
              <span className="text-secondary font-label-sm text-label-sm bg-secondary-container/20 px-2 py-0.5 rounded-full">{metrics ? `${metrics.activeDevices} Active` : '...'}</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">Connected Devices</p>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">{metrics ? metrics.totalDevices : '...'}</h3>
            </div>
          </div>
          {/* Metric Card 4 */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 flex flex-col gap-stack-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary">
                <RadioTower size={24} />
              </div>
              <span className="flex items-center gap-1 text-primary font-label-sm text-label-sm font-bold">
                <span className={`w-1.5 h-1.5 rounded-full ${metrics?.isWhatsappActive ? 'bg-primary-container animate-ping' : 'bg-red-500'}`}></span>
                {metrics?.isWhatsappActive ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">WhatsApp Status</p>
              <h3 className={`font-headline-md text-headline-md font-bold ${metrics?.isWhatsappActive ? 'text-primary' : 'text-red-500'}`}>{metrics?.isWhatsappActive ? 'Active' : 'Offline'}</h3>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Weekly Message Volume Chart */}
          <div className="lg:col-span-2 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/30 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-stack-lg">
              <div>
                <h4 className="font-headline-md text-headline-md text-on-surface">Weekly Message Volume</h4>
                <p className="text-body-sm font-body-sm text-secondary">Inbound vs Outbound AI activity</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-primary rounded-full"></span>
                  <span className="text-label-sm font-label-sm text-secondary">AI Outbound</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-secondary rounded-full"></span>
                  <span className="text-label-sm font-label-sm text-secondary">User Inbound</span>
                </div>
              </div>
            </div>
            
            {/* Simple Custom Chart */}
            <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-4 border-b border-outline-variant/20">
              {metrics ? (
                metrics.weeklyVolume.map((dayData: any, idx: number) => {
                  const maxVolume = Math.max(...metrics.weeklyVolume.map((d: any) => d.total));
                  const aiHeight = maxVolume > 0 ? (dayData.aiOutbound / maxVolume) * 100 : 0;
                  const userHeight = maxVolume > 0 ? (dayData.userInbound / maxVolume) * 100 : 0;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                        <div className="flex-1 bg-primary rounded-t-sm chart-bar transition-all duration-500" style={{ height: isLoaded ? `${aiHeight}%` : "0%" }}></div>
                        <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar transition-all duration-500" style={{ height: isLoaded ? `${userHeight}%` : "0%" }}></div>
                      </div>
                      <span className="text-label-sm font-label-sm text-secondary">{dayData.dayName}</span>
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        Vol: {dayData.total}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-secondary">Loading chart...</div>
              )}
            </div>
          </div>

          {/* Agent Performance Panel */}
          <div className="lg:col-span-1 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/30 flex flex-col">
            <div className="flex items-center justify-between mb-stack-md">
              <h4 className="font-headline-md text-headline-md text-on-surface">Top Agents</h4>
              <MoreVertical className="text-secondary cursor-pointer" size={20} />
            </div>
            <div className="space-y-stack-md overflow-y-auto">
              {metrics ? (
                metrics.topDevices.length > 0 ? (
                  metrics.topDevices.map((device: any) => (
                    <div key={device.id} className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/10 hover:bg-surface-container-low transition-all">
                      <div className="relative">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <Headset size={24} />
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${device.status === 'connected' || device.status === 'ready' ? 'bg-primary' : 'bg-red-500'}`}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md font-bold text-on-surface truncate">{device.name}</p>
                        <p className="text-label-sm font-label-sm text-secondary truncate">{device.jid || 'No JID'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-label-md text-label-md text-on-surface">{device.conversationCount}</p>
                        <p className="text-label-sm font-label-sm text-secondary">Chats</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary text-sm p-4 text-center">No devices found.</p>
                )
              ) : (
                <p className="text-secondary text-sm p-4 text-center">Loading devices...</p>
              )}
            </div>
            <button className="mt-auto w-full py-2 text-primary font-label-md text-label-md hover:underline">View All Agent Stats</button>
          </div>
        </div>

        {/* Recent Activity Feed (Bento Style) */}
        <div className="mt-stack-lg grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
            <div className="p-stack-md border-b border-outline-variant/20 bg-surface-container-low">
              <h5 className="font-label-md text-label-md font-bold text-on-surface">System Health</h5>
            </div>
            <div className="p-stack-md space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded text-primary">
                  <Zap size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm font-body-sm text-on-surface">API Latency</p>
                  <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-1">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: "15%" }}></div>
                  </div>
                </div>
                <span className="text-label-sm font-label-sm font-bold text-primary">124ms</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-tertiary/10 rounded text-tertiary">
                  <Database size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm font-body-sm text-on-surface">Database Load</p>
                  <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-1">
                    <div className="bg-tertiary h-1.5 rounded-full" style={{ width: "42%" }}></div>
                  </div>
                </div>
                <span className="text-label-sm font-label-sm font-bold text-tertiary">42%</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Integration Preview */}
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-stack-md flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 bg-cover bg-center rounded-xl border border-primary/30" 
                style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg')" }}
              ></div>
              <div>
                <h5 className="font-headline-md text-headline-md text-primary truncate max-w-[200px]">
                  {metrics?.topDevices?.[0]?.jid?.replace('@s.whatsapp.net', '') || 'No Device'}
                </h5>
                <p className="text-body-sm font-body-sm text-on-primary-container">WhatsApp Business Connected via Baileys</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-surface-container-lowest text-primary font-label-md text-label-md border border-primary/20 rounded-lg shadow-sm hover:bg-white transition-all">
              Manage Connection
            </button>
          </div>
        </div>
    </>
  );
}
