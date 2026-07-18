import { useEffect, useState } from "react";
import { Loader2, ScatterChart } from "lucide-react";
import { research } from "../lib/api";

export default function Clusters() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    research.clusters().then((r) => {
      setClusters(r.clusters || []);
      setMsg(r.message || "");
    }).finally(() => setLoading(false));
  }, []);

  const colors = [
    "from-indigo-500/[0.15]", "from-emerald-500/[0.15]", "from-amber-500/[0.15]",
    "from-violet-500/[0.15]", "from-rose-500/[0.15]", "from-cyan-500/[0.15]",
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-3">/ Topic Clusters</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">AI-discovered themes.</h1>
        <p className="text-slate-400 mt-2">K-Means + TF-IDF clustering, labeled by Claude Sonnet 4.5.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your corpus...
        </div>
      ) : msg ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#0E0E0E] p-10 text-center">
          <ScatterChart className="w-10 h-10 mx-auto text-slate-700 mb-3" />
          <p className="text-slate-400">{msg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((c, i) => (
            <div key={c.cluster_id}
              className={`relative p-6 rounded-xl border border-white/[0.08] bg-gradient-to-br ${colors[i % colors.length]} to-[#0E0E0E] overflow-hidden`}
              data-testid={`cluster-${c.cluster_id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="font-mono text-xs text-slate-500">CLUSTER #{c.cluster_id + 1}</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
                  {c.size} docs
                </span>
              </div>
              <h3 className="font-display text-xl font-medium mb-3 text-slate-50">{c.label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{c.summary}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(c.keywords || []).slice(0, 6).map((k) => (
                  <span key={k} className="px-2 py-0.5 text-[11px] rounded-md bg-white/[0.05] border border-white/10 text-slate-300 font-mono">
                    {k}
                  </span>
                ))}
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono mb-1">Documents</div>
                <ul className="text-xs text-slate-400 space-y-1">
                  {c.titles.slice(0, 4).map((t, idx) => (
                    <li key={idx} className="truncate">· {t}</li>
                  ))}
                  {c.titles.length > 4 && <li className="text-slate-600">+ {c.titles.length - 4} more</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
