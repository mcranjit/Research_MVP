import { useEffect, useState } from "react";
import { ScrollText, Search, Loader2, Sparkles } from "lucide-react";
import { api, docs } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Patents() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("analyze");
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [analysis, setAnalysis] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { docs.list().then((r) => setDocuments(r.documents)).catch(() => {}); }, []);

  const toggle = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const run = async (kind) => {
    setLoading(true);
    try {
      if (kind === "analyze") {
        if (selected.size === 0) return toast.error("Select patent documents");
        const r = await api.post("/patents/analyze", { doc_ids: Array.from(selected) });
        setAnalysis(r.data);
      } else {
        if (!query.trim()) return toast.error("Enter a query");
        const r = await api.post("/patents/search", { query, limit: 8 });
        setResults(r.data.results || []);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Pro tier required. Redirecting to billing...");
        setTimeout(() => navigate("/app/billing"), 1200);
      } else {
        toast.error(err.response?.data?.detail || "Failed");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-mono mb-3">/ Patent Intelligence</div>
          <h1 className="font-display text-4xl font-medium tracking-tight">Patent Trends & Discovery</h1>
          <p className="text-slate-400 mt-2">Analyze uploaded patents or search live patent databases.</p>
        </div>
        <div className="flex gap-2 p-1 rounded-lg bg-white/[0.04] border border-white/10">
          <button onClick={() => setTab("analyze")} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "analyze" ? "bg-amber-500/20 text-amber-300" : "text-slate-400"}`} data-testid="patents-tab-analyze">Analyze Uploaded</button>
          <button onClick={() => setTab("search")} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "search" ? "bg-amber-500/20 text-amber-300" : "text-slate-400"}`} data-testid="patents-tab-search">Live Search</button>
        </div>
      </div>

      {tab === "analyze" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-5">
            <h2 className="font-display text-base font-medium mb-3">Patent Documents ({selected.size})</h2>
            <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
              {documents.length === 0 ? <p className="text-sm text-slate-500">Upload patent PDFs first.</p> :
                documents.map((d) => (
                  <label key={d.id} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-white/[0.03] cursor-pointer">
                    <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggle(d.id)} data-testid={`pat-doc-${d.id}`} />
                    <span className="text-sm text-slate-300 leading-snug">{d.title}</span>
                  </label>
                ))}
            </div>
            <Button onClick={() => run("analyze")} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900" data-testid="patents-analyze">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze Patents</>}
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!analysis && <Empty text="Select uploaded patent docs and run analysis." />}
            {analysis && (
              <>
                <Card title="Summary">{analysis.summary}</Card>
                <Card title="Trends"><Ul items={analysis.trends} /></Card>
                <Card title="Key Claims"><Ul items={analysis.key_claims} /></Card>
                <Card title="Classifications"><div className="flex flex-wrap gap-2">{analysis.classifications?.map((c, i) => <span key={i} className="px-2 py-1 text-xs font-mono rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">{c}</span>)}</div></Card>
                <Card title="Opportunities"><Ul items={analysis.opportunities} /></Card>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={(e) => { e.preventDefault(); run("search"); }} className="flex gap-3 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. perovskite solar cells"
                className="bg-white/[0.04] border-white/10 text-slate-100 h-12 pl-11" data-testid="patents-search-input" />
            </div>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-slate-900 h-12 px-6" data-testid="patents-search-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search Patents"}
            </Button>
          </form>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="p-5 rounded-xl bg-[#0E0E0E] border border-white/[0.08]" data-testid={`patent-result-${i}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-medium text-slate-100">{r.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                    {r.relevance}/100
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono mb-2">{r.number} · {r.assignee} · {r.year}</div>
                <p className="text-sm text-slate-400 leading-relaxed">{r.abstract}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const Card = ({ title, children }) => (
  <div className="p-5 rounded-xl bg-[#0E0E0E] border border-white/[0.08]">
    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-mono mb-3">{title}</div>
    <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
  </div>
);
const Ul = ({ items }) => items?.length ? <ul className="space-y-1.5">{items.map((t, i) => <li key={i} className="flex gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />{t}</li>)}</ul> : <span className="text-slate-500">None</span>;
const Empty = ({ text }) => <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-12 text-center text-slate-500">{text}</div>;
