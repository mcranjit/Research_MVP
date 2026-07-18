import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import jsPDF from "jspdf";
import { BookOpen, Loader2, Download, FileText } from "lucide-react";
import { docs, research } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";

export default function LiteratureReview() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [topic, setTopic] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { docs.list().then((r) => setDocuments(r.documents)); }, []);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const generate = async () => {
    if (!topic.trim()) return toast.error("Enter a topic");
    if (selected.size === 0) return toast.error("Select at least one document");
    setLoading(true);
    setReview("");
    try {
      const r = await research.review(topic, Array.from(selected));
      setReview(r.review);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to generate review");
    } finally {
      setLoading(false);
    }
  };

  const downloadMd = () => {
    const blob = new Blob([review], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lit-review-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 56;
    const maxW = pdf.internal.pageSize.getWidth() - margin * 2;
    let y = margin;
    pdf.setFont("times", "bold"); pdf.setFontSize(18);
    pdf.text(`Literature Review: ${topic}`, margin, y); y += 28;
    pdf.setFont("times", "normal"); pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(review.replace(/[#*`]/g, ""), maxW);
    for (const line of lines) {
      if (y > pdf.internal.pageSize.getHeight() - margin) { pdf.addPage(); y = margin; }
      pdf.text(line, margin, y); y += 15;
    }
    pdf.save(`lit-review-${Date.now()}.pdf`);
  };

  const renderMd = (text) => {
    // Minimal markdown rendering
    const html = text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[Doc (\d+)\]/g, '<span class="citation-chip">[Doc $1]</span>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<h)(.+)$/gm, '$1');
    return `<div class="prose-research"><p>${html}</p></div>`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-3">/ Literature Review</div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Publication-Ready Synthesis</h1>
        <p className="text-slate-400 mt-2">Select documents, define your topic, generate a structured review.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-5">
            <h2 className="font-display text-base font-medium mb-3">1. Topic</h2>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Transformer architectures for NLP"
              className="bg-white/[0.04] border-white/10 text-slate-100 mb-5" data-testid="review-topic" />

            <h2 className="font-display text-base font-medium mb-3">2. Documents ({selected.size})</h2>
            <div className="max-h-72 overflow-y-auto space-y-2 mb-5">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500">Upload documents first.</p>
              ) : documents.map((d) => (
                <label key={d.id} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-white/[0.03] cursor-pointer">
                  <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggle(d.id)} data-testid={`review-doc-${d.id}`} />
                  <span className="text-sm text-slate-300 leading-snug">{d.title}</span>
                </label>
              ))}
            </div>

            <Button onClick={generate} disabled={loading} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white" data-testid="generate-review">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><BookOpen className="w-4 h-4 mr-2" /> Generate Review</>}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-6 min-h-[60vh]">
            {!review && !loading && (
              <div className="text-center py-20">
                <BookOpen className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500">Your review will appear here.</p>
              </div>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing across {selected.size} document{selected.size !== 1 ? "s" : ""}...
              </div>
            )}
            {review && (
              <>
                <div className="flex justify-end gap-2 mb-4">
                  <Button onClick={downloadMd} variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5" data-testid="download-review">
                    <Download className="w-4 h-4 mr-2" /> Markdown
                  </Button>
                  <Button onClick={downloadPdf} className="bg-violet-500 hover:bg-violet-400 text-white" data-testid="download-pdf">
                    <FileText className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </div>
                <div data-testid="review-output" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMd(review), { ALLOWED_TAGS: ['p','h1','h2','h3','strong','em','ul','ol','li','code','span','br'], ALLOWED_ATTR: ['class'] }) }} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
