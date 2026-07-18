import { useEffect, useState } from "react";
import { User, Mail, Calendar, FileText, Crown, MessageSquare, Network, Sparkles, LogOut, Brain } from "lucide-react";
import { api, docs } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ doc_count: 0, words: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user?.name || "");

  const saveName = async () => {
    try {
      const r = await api.patch("/auth/me", { name: draftName });
      localStorage.setItem("rm_user", JSON.stringify(r.data.user));
      window.location.reload();
    } catch { setEditing(false); }
  };

  useEffect(() => {
    (async () => {
      try {
        const [me, dl, ss] = await Promise.all([
          api.get("/auth/me"),
          docs.list(),
          api.get("/chat/sessions"),
        ]);
        const words = dl.documents.reduce((s, d) => s + (d.word_count || 0), 0);
        setStats({
          doc_count: me.data.stats.doc_count,
          words,
          sessions: ss.data.sessions?.length || 0,
        });
      } finally { setLoading(false); }
    })();
  }, []);

  const initial = (user?.name || "R").charAt(0).toUpperCase();
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently";

  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-indigo-500/[0.08] blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-10 w-[500px] h-[400px] bg-emerald-500/[0.05] blur-3xl pointer-events-none" />

      <div className="relative p-8 lg:p-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400 mb-3">/ Account</div>
          <h1 className="font-display text-4xl lg:text-5xl font-medium tracking-tighter">Profile</h1>
          <p className="text-slate-400 mt-2">Your research identity and activity.</p>
        </div>

        {/* Identity card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/[0.1] via-[#0E0E0E] to-emerald-500/[0.06] border border-white/[0.1] p-8 lg:p-10 mb-6">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Avatar */}
            <div className="shrink-0 relative">
              {user?.picture ? (
                <img src={user.picture} alt={user.name}
                  className="w-28 h-28 rounded-2xl object-cover border border-white/10" data-testid="profile-avatar" />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center font-display text-5xl font-medium text-white shadow-[0_0_40px_rgba(99,102,241,0.4)]" data-testid="profile-avatar">
                  {initial}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-[#0E0E0E] flex items-center justify-center" title="Pro researcher">
                <Crown className="w-4 h-4 text-slate-900" />
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2 mb-1">
                  <input value={draftName} onChange={(e) => setDraftName(e.target.value)}
                    className="bg-white/[0.04] border border-indigo-500/40 rounded-md px-3 py-1.5 text-2xl font-display text-slate-50 outline-none focus:border-indigo-500"
                    data-testid="profile-name-input" autoFocus />
                  <button onClick={saveName} data-testid="profile-name-save"
                    className="px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium">Save</button>
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-md text-slate-400 text-sm hover:text-white">Cancel</button>
                </div>
              ) : (
                <h2 className="font-display text-3xl lg:text-4xl font-medium tracking-tight text-slate-50 mb-1 flex items-center gap-3" data-testid="profile-name">
                  {user?.name}
                  <button onClick={() => { setDraftName(user?.name || ""); setEditing(true); }} data-testid="profile-name-edit"
                    className="text-xs text-slate-500 hover:text-indigo-300 font-mono border border-white/10 hover:border-indigo-500/40 rounded-md px-2 py-1 transition-colors">edit</button>
                </h2>
              )}
              <div className="flex items-center gap-2 text-slate-400 mb-4 font-mono text-sm">
                <Mail className="w-3.5 h-3.5" /> <span data-testid="profile-email">{user?.email}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Tag color="amber"><Crown className="w-3 h-3" /> Pro · Unlocked</Tag>
                <Tag color="indigo"><Calendar className="w-3 h-3" /> Joined {joinDate}</Tag>
                <Tag color="emerald"><Brain className="w-3 h-3" /> Sonnet 4.5</Tag>
              </div>
            </div>

            {/* Sign out */}
            <button onClick={logout} data-testid="profile-logout"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm bg-white/[0.04] hover:bg-red-500/10 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-slate-300 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        {/* Activity stats */}
        <h3 className="font-display text-xl font-medium tracking-tight mb-4 mt-10">Research Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatBig icon={FileText} label="Documents" value={loading ? "—" : stats.doc_count} hint="In your corpus" accent="indigo" />
          <StatBig icon={Sparkles} label="Words Indexed" value={loading ? "—" : (stats.words > 999 ? `${(stats.words/1000).toFixed(1)}k` : stats.words)} hint="Across all sources" accent="emerald" />
          <StatBig icon={MessageSquare} label="Chat Sessions" value={loading ? "—" : stats.sessions} hint="Research conversations" accent="amber" />
        </div>

        {/* Capabilities list */}
        <h3 className="font-display text-xl font-medium tracking-tight mb-4">Unlocked Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {[
            ["Cited research chat with Claude Sonnet 4.5", "indigo"],
            ["Semantic search across unlimited documents", "indigo"],
            ["Auto topic clustering & labeling", "emerald"],
            ["Interactive knowledge graph explorer", "emerald"],
            ["Literature review generator + markdown export", "amber"],
            ["Research gap & contradiction detector", "amber"],
            ["Hypothesis lab with novelty scoring", "rose"],
            ["Patent intelligence (analyze + search)", "rose"],
            ["Dataset discovery (HuggingFace + Kaggle + UCI)", "cyan"],
            ["Workspace collaboration with RBAC", "cyan"],
          ].map(([cap, c]) => (
            <div key={cap} className="flex items-center gap-3 p-3.5 rounded-lg bg-[#0E0E0E] border border-white/[0.06]">
              <div className={`w-2 h-2 rounded-full bg-${c}-400 shadow-[0_0_8px_currentColor]`} />
              <span className="text-sm text-slate-300">{cap}</span>
            </div>
          ))}
        </div>

        {/* Footer signature */}
        <div className="text-center pt-8 border-t border-white/[0.06]">
          <div className="font-display text-2xl font-medium text-slate-500 mb-1">Built for thinkers.</div>
          <div className="font-mono text-xs text-slate-600">ResearchMind AI · 2026</div>
        </div>
      </div>
    </div>
  );
}

const accents = {
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-300" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-300" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-300" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-300" },
};

function Tag({ color, children }) {
  const a = accents[color] || accents.indigo;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${a.bg} ${a.border} border ${a.text} text-[11px] uppercase tracking-wider font-mono`}>
      {children}
    </span>
  );
}

function StatBig({ icon: Icon, label, value, hint, accent }) {
  const a = accents[accent] || accents.indigo;
  return (
    <div className="relative overflow-hidden p-6 rounded-2xl bg-[#0E0E0E] border border-white/[0.08]">
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${a.bg} blur-2xl opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">{label}</div>
          <div className={`w-9 h-9 rounded-lg ${a.bg} ${a.border} border flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${a.text}`} />
          </div>
        </div>
        <div className="font-display text-4xl font-medium text-slate-50">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{hint}</div>
      </div>
    </div>
  );
}
