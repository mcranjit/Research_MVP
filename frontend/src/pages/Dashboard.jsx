import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, MessageSquare, Network, Sparkles, Upload, ArrowRight,
  BookOpen, Lightbulb, ScatterChart, Search as SearchIcon, ScrollText, Database, Users
} from "lucide-react";
import { docs } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    docs.list().then((r) => setDocuments(r.documents)).finally(() => setLoading(false));
  }, []);

  const totalWords = documents.reduce((s, d) => s + (d.word_count || 0), 0);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const firstName = user?.name?.split(" ")[0] || "Researcher";

  return (
    <div className="relative">
      {/* Ambient backdrop */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-indigo-500/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-20 w-[400px] h-[300px] bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

      <div className="relative p-8 lg:p-12 max-w-7xl mx-auto">
        {/* Hero greeting */}
        <div className="mb-12">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">{today}</div>
          <h1 className="font-display text-5xl lg:text-6xl font-medium tracking-tighter leading-[1.05]">
            Good research, <span className="text-slate-500">{firstName}.</span>
          </h1>
          <p className="text-slate-400 mt-4 text-lg max-w-xl leading-relaxed">
            Your corpus has <span className="text-slate-100 font-mono">{documents.length}</span> documents
            and <span className="text-slate-100 font-mono">{totalWords.toLocaleString()}</span> indexed words ready to query.
          </p>
        </div>

        {/* Primary action row — researcher's first move */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10">
          <Link to="/app/chat" data-testid="quick-chat"
            className="lg:col-span-7 group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-indigo-500/[0.12] via-indigo-500/[0.04] to-transparent border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] uppercase tracking-[0.2em] font-mono mb-5">
                <Sparkles className="w-3 h-3" /> Start here
              </div>
              <h2 className="font-display text-3xl font-medium mb-3 tracking-tight">Ask your corpus anything.</h2>
              <p className="text-slate-300 max-w-md leading-relaxed mb-6">
                Claude Sonnet 4.5 answers with page-anchored citations and confidence scores.
              </p>
              <div className="inline-flex items-center gap-2 text-indigo-300 group-hover:text-indigo-200 font-medium">
                Open Research Chat <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/app/documents" data-testid="quick-upload"
            className="lg:col-span-5 group p-8 rounded-2xl bg-[#0E0E0E] border border-white/[0.08] hover:border-white/[0.2] transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
              <Upload className="w-5 h-5 text-emerald-300" />
            </div>
            <h3 className="font-display text-xl font-medium mb-2">Add to your library</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              PDF, DOCX, research papers, patents, datasets. Drop in dozens at a time.
            </p>
            <div className="inline-flex items-center gap-2 text-slate-300 group-hover:text-white text-sm font-medium">
              Upload documents <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Stats — three minimalist tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.08] mb-12">
          <Stat label="Documents" value={documents.length} sub="In corpus" />
          <Stat label="Words" value={totalWords > 999 ? `${(totalWords/1000).toFixed(1)}k` : totalWords} sub="Indexed" />
          <Stat label="Status" value="Online" valueClass="text-emerald-400" sub="Sonnet 4.5" />
          <Stat label="Plan" value="Pro" valueClass="text-amber-300" sub="All features unlocked" />
        </div>

        {/* Module grid — researcher's toolkit */}
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400 mb-2">/ Research Modules</div>
            <h2 className="font-display text-2xl font-medium tracking-tight">Your research toolkit</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
          {[
            { to: "/app/search", label: "Semantic Search", desc: "Vector + keyword retrieval", icon: SearchIcon },
            { to: "/app/clusters", label: "Topic Clusters", desc: "Auto-discovered themes", icon: ScatterChart },
            { to: "/app/graph", label: "Knowledge Graph", desc: "Entity-relationship map", icon: Network },
            { to: "/app/review", label: "Literature Review", desc: "Publication-ready synthesis", icon: BookOpen },
            { to: "/app/gaps", label: "Research Gaps", desc: "Find what's missing", icon: Lightbulb },
            { to: "/app/hypothesis", label: "Hypothesis Lab", desc: "Testable directions", icon: Sparkles },
            { to: "/app/patents", label: "Patent Intel", desc: "Trends & claims", icon: ScrollText },
            { to: "/app/datasets", label: "Datasets", desc: "HF + Kaggle + UCI", icon: Database },
          ].map((m) => (
            <Link key={m.to} to={m.to} data-testid={`module-${m.to.split('/').pop()}`}
              className="group p-5 rounded-xl bg-[#0E0E0E] border border-white/[0.06] hover:border-white/[0.18] hover:bg-white/[0.02] hover:-translate-y-0.5 transition-all">
              <m.icon className="w-5 h-5 text-slate-500 group-hover:text-indigo-300 mb-4 transition-colors" />
              <div className="text-sm font-medium text-slate-100 mb-1">{m.label}</div>
              <div className="text-xs text-slate-500 leading-snug">{m.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent documents */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl font-medium tracking-tight">Recently added</h2>
          <Link to="/app/documents" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono">view all →</Link>
        </div>
        <div className="rounded-2xl bg-[#0E0E0E] border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="p-8 text-slate-500 text-sm">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="font-display text-lg text-slate-200 mb-2">Your library is empty.</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Drop your first paper, patent or report to begin indexing.</p>
              <Link to="/app/documents" data-testid="empty-upload-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors">
                <Upload className="w-4 h-4" /> Upload first document
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {documents.slice(0, 5).map((d) => (
                <Link key={d.id} to={`/app/documents/${d.id}`} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors" data-testid={`recent-doc-${d.id}`}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-white/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-100 truncate">{d.title}</div>
                    <div className="text-xs text-slate-500 truncate font-mono">{d.filename} · {d.word_count?.toLocaleString()} words</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, valueClass = "" }) {
  return (
    <div className="bg-[#0A0A0A] p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-2">{label}</div>
      <div className={`font-display text-2xl lg:text-3xl font-medium ${valueClass || "text-slate-50"}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}
