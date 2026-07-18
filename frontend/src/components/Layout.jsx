import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import {
  LayoutDashboard, FileText, MessageSquare, Search, Network,
  ScatterChart, BookOpen, Lightbulb, Sparkles, LogOut, Brain,
  Users, ScrollText, Database, Crown, UserCircle, BookText, Menu, X
} from "lucide-react";

const navItems = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, testid: "nav-overview", end: true },
  { to: "/app/documents", label: "Documents", icon: FileText, testid: "nav-documents" },
  { to: "/app/chat", label: "Research Chat", icon: MessageSquare, testid: "nav-chat" },
  { to: "/app/search", label: "Semantic Search", icon: Search, testid: "nav-search" },
  { to: "/app/clusters", label: "Topic Clusters", icon: ScatterChart, testid: "nav-clusters" },
  { to: "/app/graph", label: "Knowledge Graph", icon: Network, testid: "nav-graph" },
  { to: "/app/review", label: "Literature Review", icon: BookOpen, testid: "nav-review" },
  { to: "/app/gaps", label: "Research Gaps", icon: Lightbulb, testid: "nav-gaps" },
  { to: "/app/hypothesis", label: "Hypothesis Lab", icon: Sparkles, testid: "nav-hypothesis" },
  { to: "/app/citations", label: "Citations", icon: BookText, testid: "nav-citations" },
  { to: "/app/patents", label: "Patent Intel", icon: ScrollText, testid: "nav-patents" },
  { to: "/app/datasets", label: "Datasets", icon: Database, testid: "nav-datasets" },
  { to: "/app/workspaces", label: "Workspaces", icon: Users, testid: "nav-workspaces" },
  { to: "/app/profile", label: "Profile", icon: UserCircle, testid: "nav-profile" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-slate-100 grain">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/[0.06]">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-sm font-semibold">ResearchMind</span>
        </Link>
        <button onClick={() => setOpen(true)} data-testid="mobile-menu-open" className="w-9 h-9 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center">
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Backdrop */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />}

      <aside className={`w-64 shrink-0 border-r border-white/[0.06] bg-[#0A0A0A] h-screen flex flex-col z-50
        ${open ? "fixed inset-y-0 left-0 translate-x-0" : "fixed -translate-x-full"} lg:sticky lg:top-0 lg:translate-x-0 transition-transform duration-300`}>
        <div className="px-6 py-6 border-b border-white/[0.06] flex items-center justify-between">
          <Link to="/app" onClick={() => setOpen(false)} className="flex items-center gap-2.5" data-testid="sidebar-logo">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-display text-base font-semibold">ResearchMind</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-mono">AI</div>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400" data-testid="mobile-menu-close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 px-3 mb-2 font-mono">Workspace</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={item.testid}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5 ${
                  isActive
                    ? "bg-white/[0.06] text-white border-l-2 border-indigo-400 pl-[10px]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <div className="px-3 py-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] mb-2">
            <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Signed in</div>
            <div className="text-sm font-medium text-slate-200 truncate" data-testid="user-name">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-200 text-[10px] uppercase tracking-wider font-mono">
              <Crown className="w-2.5 h-2.5" /> Pro · unlocked
            </div>
          </div>
          <button
            onClick={logout}
            data-testid="logout-btn"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 relative pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
