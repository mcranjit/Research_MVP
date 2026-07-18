import { useState } from "react";
import { Sparkles, Loader2, FlaskConical } from "lucide-react";
import { research } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function Hypothesis() {
  const [topic, setTopic] = useState("");
  const [useDocuments, setUseDocuments] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return toast.error("Enter a topic");
    setLoading(true);
    setResult(null);
    try {
      const r = await research.hypothesis(topic, useDocuments);
      setResult(r);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-mono mb-3">/ Hypothesis Lab</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">From topic to testable hypotheses.</h1>
        <p className="text-slate-400 mt-2">AI ideation engine grounded in your corpus.</p>
      </div>

      <form onSubmit={run} className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-6 mb-8">
        <label className="text-sm text-slate-300 mb-2 block">Research topic</label>
        <Input value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. perovskite solar cells, ransomware detection, protein folding"
          className="bg-white/[0.04] border-white/10 text-slate-100 h-12 mb-4" data-testid="hyp-topic" />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={useDocuments} onChange={(e) => setUseDocuments(e.target.checked)}
              className="w-4 h-4 accent-indigo-500" data-testid="hyp-use-docs" />
            Use my uploaded documents as context
          </label>
          <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900" data-testid="hyp-generate">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Hypotheses</>}
          </Button>
        </div>
      </form>

      {result && (
        <div className="space-y-6">
          {result.novelty_score != null && (
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/[0.08] to-emerald-500/[0.05] border border-indigo-500/20 p-6 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-mono">Novelty Score</div>
                <div className="font-display text-4xl font-medium mt-1">{result.novelty_score}/100</div>
              </div>
              <div className="font-mono text-xs text-slate-400 max-w-xs text-right">
                Estimated novelty of this research direction relative to your indexed literature.
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="font-display text-lg font-medium flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" /> Hypotheses
            </h2>
            {result.hypotheses?.map((h, i) => (
              <div key={i} className="p-5 rounded-xl bg-[#0E0E0E] border border-white/[0.08]" data-testid={`hyp-${i}`}>
                <div className="text-xs font-mono text-emerald-400 mb-2">H{i + 1}</div>
                <h3 className="font-display text-lg font-medium mb-3 text-slate-50">{h.statement}</h3>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono mb-1">Rationale</div>
                <p className="text-sm text-slate-400 mb-3 leading-relaxed">{h.rationale}</p>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono mb-1">Validation Approach</div>
                <p className="text-sm text-slate-400 leading-relaxed">{h.validation}</p>
              </div>
            ))}
          </div>

          {result.experimental_directions?.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0E0E0E] border border-white/[0.08]">
              <h2 className="font-display text-base font-medium mb-3">Experimental Directions</h2>
              <ul className="space-y-2">
                {result.experimental_directions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
