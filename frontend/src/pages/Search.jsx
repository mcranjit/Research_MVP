import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, FileText, Loader2 } from "lucide-react";
import { research } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await research.search(query, 10);
      setResults(r.results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-3">/ Semantic Search</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Find anything in your corpus.</h1>
        <p className="text-slate-400 mt-2">Hybrid vector + keyword search with passage-level retrieval.</p>
      </div>

      <form onSubmit={run} className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. ransomware mitigation strategies"
            className="bg-white/[0.04] border-white/10 text-slate-100 h-12 pl-11"
            data-testid="search-input"
          />
        </div>
        <Button type="submit" disabled={loading} className="bg-indigo-500 hover:bg-indigo-400 text-white h-12 px-6" data-testid="search-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {searched && !loading && results.length === 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0E0E0E] p-10 text-center text-slate-400">
          No results found. Try a different query or upload more documents.
        </div>
      )}

      <div className="space-y-3">
        {results.map((r, idx) => (
          <Link key={`${r.doc_id}-${r.chunk_id}`} to={`/app/documents/${r.doc_id}`}
            className="block p-5 rounded-xl bg-[#0E0E0E] border border-white/[0.08] hover:border-white/[0.18] transition-colors"
            data-testid={`search-result-${idx}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-indigo-300" />
                <div className="font-medium text-slate-100">{r.title}</div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-500">p.{r.page}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {(r.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{r.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
