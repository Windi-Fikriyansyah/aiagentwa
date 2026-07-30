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

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      {/* SideNavBar Anchor */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface-container-lowest border-r border-outline-variant/30 hidden md:flex flex-col p-stack-md gap-stack-sm z-40">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-stack-lg">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">AgentFlow AI</h1>
            <p className="text-label-sm font-label-sm text-secondary opacity-70">Workspace One</p>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full py-3 px-4 bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 mb-stack-md hover:opacity-90 transition-all active:scale-[0.98]">
          <Plus size={20} />
          New Agent
        </button>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 bg-primary-container/20 text-on-primary-container font-semibold rounded-lg" href="#">
            <LayoutDashboard size={20} />
            <span className="font-label-md text-label-md">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-all rounded-lg" href="#">
            <Bot size={20} />
            <span className="font-label-md text-label-md">AI Agents</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-all rounded-lg" href="#">
            <MessageSquare size={20} />
            <span className="font-label-md text-label-md">Inbox</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-all rounded-lg" href="#">
            <BarChart3 size={20} />
            <span className="font-label-md text-label-md">Analytics</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-all rounded-lg" href="#">
            <CreditCard size={20} />
            <span className="font-label-md text-label-md">Billing</span>
          </a>
        </nav>

        {/* Footer Navigation */}
        <div className="mt-auto space-y-1 pt-stack-md border-t border-outline-variant/20">
          <a className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-all rounded-lg" href="#">
            <Settings size={20} />
            <span className="font-label-md text-label-md">Settings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-all rounded-lg" href="#">
            <CircleHelp size={20} />
            <span className="font-label-md text-label-md">Help</span>
          </a>
          <div className="flex items-center gap-3 px-4 py-3 mt-4">
            <img 
              className="w-10 h-10 rounded-full border border-outline-variant/30 object-cover" 
              alt="A professional headshot of a corporate manager" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpj28gKmyGT3AqrkaCFfOMJK2FbGRiHmVNum7cIyDENLZsKC0P8UPVr7baK157c7Q0hymTdlT70Gxjwi5Lc9D_yZpHeLbeGyCl_W8xxLOVeSO0FC10GjSykBYSq2RIyAirQ9t6DxqRkpUcWUergmunPXMUPl5RTD1kksSf-3UXgozYvmP_air7P86fkX9nXSXbT1OKONQRVXyoFj1ZdbPeuQsMdl-aiUSPlb3M6Ktkp6_ij3XCz-fVFQ" 
            />
            <div className="overflow-hidden">
              <p className="font-label-md text-label-md text-on-surface font-bold truncate">Alex Rivera</p>
              <p className="text-label-sm font-label-sm text-secondary truncate">Enterprise Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-[280px] min-h-screen p-margin-mobile md:p-margin-desktop">
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
              <span className="text-primary font-label-sm text-label-sm bg-primary-container/20 px-2 py-0.5 rounded-full">+12.5%</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">Total Conversations</p>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">12,482</h3>
            </div>
          </div>
          {/* Metric Card 2 */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 flex flex-col gap-stack-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-tertiary-container/10 rounded-lg flex items-center justify-center text-tertiary">
                <Sparkles size={24} />
              </div>
              <span className="text-tertiary font-label-sm text-label-sm bg-tertiary-container/20 px-2 py-0.5 rounded-full">Optimal</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">AI Response Rate</p>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">98%</h3>
            </div>
          </div>
          {/* Metric Card 3 */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 flex flex-col gap-stack-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-secondary-container/10 rounded-lg flex items-center justify-center text-secondary">
                <Headset size={24} />
              </div>
              <span className="text-secondary font-label-sm text-label-sm bg-secondary-container/20 px-2 py-0.5 rounded-full">8 Active</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">Active Agents</p>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">24</h3>
            </div>
          </div>
          {/* Metric Card 4 */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/30 flex flex-col gap-stack-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary">
                <RadioTower size={24} />
              </div>
              <span className="flex items-center gap-1 text-primary font-label-sm text-label-sm font-bold">
                <span className="w-1.5 h-1.5 bg-primary-container rounded-full animate-ping"></span>
                Connected
              </span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary">WhatsApp Status</p>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface text-primary">Active</h3>
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
              {/* Monday */}
              <div className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                  <div className="flex-1 bg-primary rounded-t-sm chart-bar" style={{ height: isLoaded ? "65%" : "0%" }}></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar" style={{ height: isLoaded ? "45%" : "0%" }}></div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary">Mon</span>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                  Vol: 1,240
                </div>
              </div>
              {/* Tuesday */}
              <div className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                  <div className="flex-1 bg-primary rounded-t-sm chart-bar" style={{ height: isLoaded ? "80%" : "0%" }}></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar" style={{ height: isLoaded ? "55%" : "0%" }}></div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary">Tue</span>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                  Vol: 1,890
                </div>
              </div>
              {/* Wednesday */}
              <div className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                  <div className="flex-1 bg-primary rounded-t-sm chart-bar" style={{ height: isLoaded ? "50%" : "0%" }}></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar" style={{ height: isLoaded ? "35%" : "0%" }}></div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary">Wed</span>
              </div>
              {/* Thursday */}
              <div className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                  <div className="flex-1 bg-primary rounded-t-sm chart-bar" style={{ height: isLoaded ? "95%" : "0%" }}></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar" style={{ height: isLoaded ? "60%" : "0%" }}></div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary">Thu</span>
              </div>
              {/* Friday */}
              <div className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                  <div className="flex-1 bg-primary rounded-t-sm chart-bar" style={{ height: isLoaded ? "75%" : "0%" }}></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar" style={{ height: isLoaded ? "50%" : "0%" }}></div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary">Fri</span>
              </div>
              {/* Saturday */}
              <div className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                  <div className="flex-1 bg-primary rounded-t-sm chart-bar" style={{ height: isLoaded ? "40%" : "0%" }}></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar" style={{ height: isLoaded ? "20%" : "0%" }}></div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary">Sat</span>
              </div>
              {/* Sunday */}
              <div className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="w-full flex gap-1 items-end h-full min-h-[200px]">
                  <div className="flex-1 bg-primary rounded-t-sm chart-bar" style={{ height: isLoaded ? "30%" : "0%" }}></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-sm chart-bar" style={{ height: isLoaded ? "15%" : "0%" }}></div>
                </div>
                <span className="text-label-sm font-label-sm text-secondary">Sun</span>
              </div>
            </div>
          </div>

          {/* Agent Performance Panel */}
          <div className="lg:col-span-1 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/30 flex flex-col">
            <div className="flex items-center justify-between mb-stack-md">
              <h4 className="font-headline-md text-headline-md text-on-surface">Top Agents</h4>
              <MoreVertical className="text-secondary cursor-pointer" size={20} />
            </div>
            <div className="space-y-stack-md overflow-y-auto">
              {/* Agent Item 1 */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/10 hover:bg-surface-container-low transition-all">
                <div className="relative">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Headset size={24} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface"></span>
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-label-md font-bold text-on-surface">Customer Support AI</p>
                  <p className="text-label-sm font-label-sm text-secondary">Success: 99.2%</p>
                </div>
                <div className="text-right">
                  <p className="font-label-md text-label-md text-on-surface">4.2k</p>
                  <p className="text-label-sm font-label-sm text-secondary">Msgs</p>
                </div>
              </div>
              {/* Agent Item 2 */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/10 hover:bg-surface-container-low transition-all">
                <div className="relative">
                  <div className="w-12 h-12 bg-tertiary/10 rounded-full flex items-center justify-center text-tertiary">
                    <ShoppingCart size={24} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface"></span>
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-label-md font-bold text-on-surface">Sales Closer Pro</p>
                  <p className="text-label-sm font-label-sm text-secondary">Success: 94.5%</p>
                </div>
                <div className="text-right">
                  <p className="font-label-md text-label-md text-on-surface">2.8k</p>
                  <p className="text-label-sm font-label-sm text-secondary">Msgs</p>
                </div>
              </div>
              {/* Agent Item 3 */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/10 hover:bg-surface-container-low transition-all">
                <div className="relative">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                    <CalendarDays size={24} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface"></span>
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-label-md font-bold text-on-surface">Booking Assistant</p>
                  <p className="text-label-sm font-label-sm text-secondary">Success: 97.8%</p>
                </div>
                <div className="text-right">
                  <p className="font-label-md text-label-md text-on-surface">1.5k</p>
                  <p className="text-label-sm font-label-sm text-secondary">Msgs</p>
                </div>
              </div>
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
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD9Jx1q97XEKfKm8v1YPEW4cDPDv9UwQ8G60-6fa_MOhnBgcWrq-5fQ8NLB3vdXRoChNgyfHjJPf2m6awytaAazYla-8OS5eKY0naGNwatT3nHXnJBAzjzXm5Iba2H3GltfDkiuccXm395RGpNGEobJ3g6jKif8PC0gahZFcsWydjfHIQCYK2HOkHGliWv-QNQqvPFaPmts7Gd4T7a2o4J1Rd2GWtCgbdK4s_FpaVt2-IiB_AIYDMDrxw')" }}
              ></div>
              <div>
                <h5 className="font-headline-md text-headline-md text-primary">+1 (555) 012-3456</h5>
                <p className="text-body-sm font-body-sm text-on-primary-container">WhatsApp Business Connected via Cloud API</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-surface-container-lowest text-primary font-label-md text-label-md border border-primary/20 rounded-lg shadow-sm hover:bg-white transition-all">
              Manage Connection
            </button>
          </div>
        </div>
      </main>

      {/* Footer Anchor */}
      <footer className="md:ml-[280px] w-full py-stack-lg bg-surface-container-low border-t border-outline-variant/20 mt-stack-lg">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-container-max mx-auto gap-stack-md">
          <div className="flex items-center gap-2">
            <Bot className="text-primary" size={24} />
            <span className="font-headline-md text-headline-md font-bold text-primary">AgentFlow AI</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary">© 2024 AgentFlow AI. All rights reserved.</p>
          <div className="flex gap-gutter">
            <a className="text-secondary hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">Privacy Policy</a>
            <a className="text-secondary hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">Terms of Service</a>
            <a className="text-secondary hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">Status</a>
            <a className="text-secondary hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">Contact</a>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation (BottomNavBar) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant/20 flex justify-around items-center h-16 z-50">
        <a className="flex flex-col items-center gap-1 text-primary" href="#">
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-label-sm">Home</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-secondary" href="#">
          <Bot size={20} />
          <span className="text-[10px] font-label-sm">Agents</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-secondary" href="#">
          <MessageSquare size={20} />
          <span className="text-[10px] font-label-sm">Chat</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-secondary" href="#">
          <Settings size={20} />
          <span className="text-[10px] font-label-sm">Setup</span>
        </a>
      </nav>
    </>
  );
}
