import { useEffect, useState } from "react";
import { BookText, Loader2, Copy, Download } from "lucide-react";
import { api, docs as docsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";

const STYLES = [
  { id: "apa", label: "APA" },
  { id: "mla", label: "MLA" },
  { id: "chicago", label: "Chicago" },
  { id: "ieee", label: "IEEE" },
];

export default function Citations() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [style, setStyle] = useState("apa");
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { docsApi.list().then((r) => setDocuments(r.documents)); }, []);

  const toggle = (id) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const generate = async () => {
    if (selected.size === 0) return toast.error("Select documents");
    setLoading(true);
    try {
      const r = await api.post("/citations/format", { doc_ids: Array.from(selected), style });
      setCitations(r.data.citations);
    } catch { toast.error("Failed"); } finally { setLoading(false); }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(citations.join("\n\n"));
    toast.success("Copied to clipboard");
  };

  const downloadTxt = () => {
    const blob = new Blob([citations.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bibliography-${style}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-violet-400 font-mono mb-3">/ Citation Studio</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Bibliography Generator</h1>
        <p className="text-slate-400 mt-2">Export citations in APA, MLA, Chicago, or IEEE format.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-5">
          <h2 className="font-display text-base font-medium mb-3">Style</h2>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {STYLES.map((s) => (
              <button key={s.id} onClick={() => setStyle(s.id)} data-testid={`style-${s.id}`}
                className={`py-2 rounded-md text-sm font-mono transition-colors ${style === s.id ? "bg-violet-500/20 text-violet-200 border border-violet-500/40" : "bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <h2 className="font-display text-base font-medium mb-3">Documents ({selected.size})</h2>
          <div className="max-h-72 overflow-y-auto space-y-2 mb-5">
            {documents.length === 0 ? <p className="text-sm text-slate-500">Upload first.</p> :
              documents.map((d) => (
                <label key={d.id} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-white/[0.03] cursor-pointer">
                  <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggle(d.id)} data-testid={`cite-doc-${d.id}`} />
                  <span className="text-sm text-slate-300 leading-snug">{d.title}</span>
                </label>
              ))}
          </div>
          <Button onClick={generate} disabled={loading} className="w-full bg-violet-500 hover:bg-violet-400 text-white" data-testid="cite-generate">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Formatting...</> : <><BookText className="w-4 h-4 mr-2" /> Generate</>}
          </Button>
        </div>

        <div className="lg:col-span-2 rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-6 min-h-[50vh]">
          {citations.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Your formatted bibliography will appear here.</div>
          ) : (
            <>
              <div className="flex justify-between mb-4">
                <div className="text-xs font-mono uppercase tracking-wider text-violet-300">{style.toUpperCase()} · {citations.length} refs</div>
                <div className="flex gap-2">
                  <Button onClick={copyAll} variant="ghost" size="sm" className="text-slate-400 hover:text-white" data-testid="cite-copy">
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                  </Button>
                  <Button onClick={downloadTxt} variant="ghost" size="sm" className="text-slate-400 hover:text-white" data-testid="cite-download">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                  </Button>
                </div>
              </div>
              <ol className="space-y-4">
                {citations.map((c, i) => (
                  <li key={`${style}-${i}`} className="text-sm text-slate-200 leading-relaxed pl-6 -indent-6 font-serif">
                    {i + 1}. {c}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
