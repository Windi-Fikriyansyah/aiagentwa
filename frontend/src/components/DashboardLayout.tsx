"use client";

import { 
  Bot, 
  Plus, 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  CreditCard, 
  Settings, 
  CircleHelp, 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getSidebarLinkClass = (path: string) => {
    const isActive = pathname === path;
    const baseClass = "flex items-center gap-3 px-4 py-3 rounded-lg transition-all";
    const activeClass = "bg-primary-container/20 text-on-primary-container font-semibold";
    const inactiveClass = "text-secondary hover:bg-surface-container-low";
    return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
  };

  const getMobileLinkClass = (path: string) => {
    const isActive = pathname === path;
    const baseClass = "flex flex-col items-center gap-1";
    const activeClass = "text-primary";
    const inactiveClass = "text-secondary";
    return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
  };

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
          <Link className={getSidebarLinkClass("/")} href="/">
            <LayoutDashboard size={20} />
            <span className="font-label-md text-label-md">Dashboard</span>
          </Link>
          <Link className={getSidebarLinkClass("/agents")} href="/agents">
            <Bot size={20} />
            <span className="font-label-md text-label-md">AI Agents</span>
          </Link>
          <a className={getSidebarLinkClass("/inbox")} href="#">
            <MessageSquare size={20} />
            <span className="font-label-md text-label-md">Inbox</span>
          </a>
          <a className={getSidebarLinkClass("/analytics")} href="#">
            <BarChart3 size={20} />
            <span className="font-label-md text-label-md">Analytics</span>
          </a>
          <a className={getSidebarLinkClass("/billing")} href="#">
            <CreditCard size={20} />
            <span className="font-label-md text-label-md">Billing</span>
          </a>
        </nav>

        {/* Footer Navigation */}
        <div className="mt-auto space-y-1 pt-stack-md border-t border-outline-variant/20">
          <Link className={getSidebarLinkClass("/settings")} href="/settings">
            <Settings size={20} />
            <span className="font-label-md text-label-md">Settings</span>
          </Link>
          <a className={getSidebarLinkClass("/help")} href="#">
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
      <main className="md:ml-[280px] min-h-screen p-margin-mobile md:p-margin-desktop pb-24 md:pb-margin-desktop">
        {children}
      </main>

      {/* Footer Anchor */}
      <footer className="md:ml-[280px] w-full py-stack-lg bg-surface-container-low border-t border-outline-variant/20 mt-stack-lg pb-24 md:pb-stack-lg">
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
        <Link className={getMobileLinkClass("/")} href="/">
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-label-sm">Home</span>
        </Link>
        <Link className={getMobileLinkClass("/agents")} href="/agents">
          <Bot size={20} />
          <span className="text-[10px] font-label-sm">Agents</span>
        </Link>
        <a className={getMobileLinkClass("/inbox")} href="#">
          <MessageSquare size={20} />
          <span className="text-[10px] font-label-sm">Chat</span>
        </a>
        <Link className={getMobileLinkClass("/settings")} href="/settings">
          <Settings size={20} />
          <span className="text-[10px] font-label-sm">Setup</span>
        </Link>
      </nav>
    </>
  );
}
