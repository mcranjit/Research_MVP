import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, FileText, MessageSquare, Network, ScatterChart, BookOpen,
  Lightbulb, Sparkles, ScrollText, Database, Users, UserCircle, Upload
} from "lucide-react";

const items = [
  { label: "Open Research Chat", to: "/app/chat", icon: MessageSquare, keys: "chat ask question ai" },
  { label: "Upload Documents", to: "/app/documents", icon: Upload, keys: "upload pdf docx file add" },
  { label: "Browse Documents", to: "/app/documents", icon: FileText, keys: "docs library corpus" },
  { label: "Semantic Search", to: "/app/search", icon: Search, keys: "search find query" },
  { label: "Topic Clusters", to: "/app/clusters", icon: ScatterChart, keys: "cluster topics themes" },
  { label: "Knowledge Graph", to: "/app/graph", icon: Network, keys: "graph entities relationships" },
  { label: "Literature Review", to: "/app/review", icon: BookOpen, keys: "review synthesize publication" },
  { label: "Research Gaps", to: "/app/gaps", icon: Lightbulb, keys: "gaps contradictions trends" },
  { label: "Hypothesis Lab", to: "/app/hypothesis", icon: Sparkles, keys: "hypothesis novel ideas" },
  { label: "Patent Intel", to: "/app/patents", icon: ScrollText, keys: "patents claims" },
  { label: "Datasets", to: "/app/datasets", icon: Database, keys: "datasets kaggle huggingface" },
  { label: "Workspaces", to: "/app/workspaces", icon: Users, keys: "workspace team invite collaborate" },
  { label: "Profile", to: "/app/profile", icon: UserCircle, keys: "profile account settings me" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setIdx(0);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = q.trim()
    ? items.filter((i) => (i.label + " " + i.keys).toLowerCase().includes(q.toLowerCase()))
    : items;

  const go = (to) => { setOpen(false); navigate(to); };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filtered[idx]) go(filtered[idx].to);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" data-testid="cmdk">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl rounded-2xl glass shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search modules, actions, pages..."
            className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-[15px]"
            data-testid="cmdk-input"
          />
          <kbd className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-slate-400">esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No matches.</div>
          ) : filtered.map((it, i) => (
            <button key={it.label + i} onClick={() => go(it.to)} onMouseEnter={() => setIdx(i)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors ${i === idx ? "bg-indigo-500/10 text-white" : "text-slate-300 hover:bg-white/[0.03]"}`}
              data-testid={`cmdk-item-${i}`}>
              <it.icon className={`w-4 h-4 ${i === idx ? "text-indigo-300" : "text-slate-500"}`} />
              <span>{it.label}</span>
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <span>⌘K anywhere</span>
        </div>
      </div>
    </div>
  );
}
