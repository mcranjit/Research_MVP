import { useEffect, useState } from "react";
import { Lightbulb, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { docs, research } from "../lib/api";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";

export default function ResearchGap() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { docs.list().then((r) => setDocuments(r.documents)); }, []);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(documents.map((d) => d.id)));

  const run = async () => {
    if (selected.size === 0) return toast.error("Select at least one document");
    setLoading(true);
    setResult(null);
    try {
      const r = await research.gaps(Array.from(selected));
      setResult(r);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-mono mb-3">/ Research Gaps</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Discover what&apos;s missing.</h1>
        <p className="text-slate-400 mt-2">Surface gaps, contradictions and emerging trends from your corpus.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-medium">Documents ({selected.size})</h2>
              <button onClick={selectAll} className="text-xs text-indigo-400 hover:text-indigo-300" data-testid="gap-select-all">Select all</button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 mb-5">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500">Upload documents first.</p>
              ) : documents.map((d) => (
                <label key={d.id} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-white/[0.03] cursor-pointer">
                  <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggle(d.id)} data-testid={`gap-doc-${d.id}`} />
                  <span className="text-sm text-slate-300 leading-snug">{d.title}</span>
                </label>
              ))}
            </div>
            <Button onClick={run} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900" data-testid="gap-analyze">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Lightbulb className="w-4 h-4 mr-2" /> Analyze Gaps</>}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!result && !loading && (
            <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-12 text-center">
              <Lightbulb className="w-10 h-10 mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500">Select documents and run analysis.</p>
            </div>
          )}

          {result && (
            <>
              <Section title="Research Gaps" icon={Lightbulb} accent="indigo">
                {result.gaps?.map((g, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`gap-item-${i}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium text-slate-100">{g.title}</h3>
                      {g.novelty_score != null && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                          novelty {g.novelty_score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{g.description}</p>
                  </div>
                )) || <Empty />}
              </Section>

              <Section title="Contradictions" icon={AlertTriangle} accent="rose">
                {result.contradictions?.map((c, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-slate-300 mb-1.5">{c.description}</p>
                    <div className="text-xs text-slate-500 font-mono">{c.docs?.join(" ↔ ")}</div>
                  </div>
                )) || <Empty />}
              </Section>

              <Section title="Emerging Trends" icon={TrendingUp} accent="emerald">
                <ul className="space-y-2">
                  {result.emerging_trends?.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0" /> {t}
                    </li>
                  )) || <Empty />}
                </ul>
              </Section>

              <Section title="Opportunities" icon={Lightbulb} accent="amber">
                <ul className="space-y-2">
                  {result.opportunities?.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" /> {o}
                    </li>
                  )) || <Empty />}
                </ul>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const Empty = () => <p className="text-sm text-slate-500">None detected.</p>;

function Section({ title, icon: Icon, accent, children }) {
  return (
    <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-md bg-${accent}-500/10 border border-${accent}-500/20 flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 text-${accent}-300`} />
        </div>
        <h2 className="font-display text-base font-medium">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
