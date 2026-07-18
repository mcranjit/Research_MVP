import { useState } from "react";
import { Database, Search, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function Datasets() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState({ huggingface: true, kaggle: true, uci: true });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const run = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const active = Object.keys(sources).filter((k) => sources[k]);
      const r = await api.post("/datasets/search", { query, sources: active });
      setResults(r.data.results || []);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Pro tier required");
        setTimeout(() => navigate("/app/billing"), 1000);
      } else toast.error("Search failed");
    } finally { setLoading(false); }
  };

  const sourceColors = {
    huggingface: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
    kaggle: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
    uci: "bg-rose-500/10 border-rose-500/20 text-rose-300",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-mono mb-3">/ Dataset Discovery</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Find the right dataset.</h1>
        <p className="text-slate-400 mt-2">Search HuggingFace Hub + Kaggle + UCI in one place, ranked for your research topic.</p>
      </div>

      <form onSubmit={run} className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. image segmentation, network intrusion, protein structure"
            className="bg-white/[0.04] border-white/10 text-slate-100 h-12 pl-11" data-testid="datasets-input" />
        </div>
        <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 h-12 px-6" data-testid="datasets-search">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      <div className="flex gap-4 mb-8 text-sm">
        {Object.keys(sources).map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sources[s]} onChange={(e) => setSources({ ...sources, [s]: e.target.checked })}
              className="w-4 h-4 accent-cyan-500" data-testid={`src-${s}`} />
            <span className="text-slate-300 capitalize">{s}</span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        {results.length === 0 && !loading && (
          <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-12 text-center">
            <Database className="w-10 h-10 mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500">Search to discover datasets across all sources.</p>
          </div>
        )}
        {results.map((d, i) => (
          <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
            className="block p-5 rounded-xl bg-[#0E0E0E] border border-white/[0.08] hover:border-white/[0.18] transition-colors"
            data-testid={`dataset-${i}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-cyan-300" />
                <h3 className="font-medium text-slate-100">{d.name}</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${sourceColors[d.source] || "bg-white/5 text-slate-300 border-white/10"}`}>
                  {d.source}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-2">{d.description}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              {d.downloads != null && <span>↓ {d.downloads.toLocaleString()}</span>}
              {d.likes != null && <span>♥ {d.likes}</span>}
              {d.tags?.slice(0, 5).map((t) => <span key={t} className="px-1.5 py-0.5 rounded bg-white/[0.04]">{t}</span>)}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
