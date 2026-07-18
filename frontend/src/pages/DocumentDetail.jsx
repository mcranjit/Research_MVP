import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Hash, User, Calendar, BookText } from "lucide-react";
import { docs } from "../lib/api";

export default function DocumentDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    docs.get(id).then(setDoc).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>;
  if (!doc) return <div className="p-8 text-slate-400">Document not found.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to="/app/documents" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6" data-testid="back-to-docs">
        <ArrowLeft className="w-4 h-4" /> Back to documents
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-3">/ Document</div>
            <h1 className="font-display text-3xl font-medium tracking-tight" data-testid="doc-title">{doc.title}</h1>
            <div className="text-sm text-slate-500 mt-2 font-mono">{doc.filename}</div>
          </div>

          <div className="rounded-xl bg-[#0E0E0E] border border-white/[0.08] p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookText className="w-4 h-4 text-indigo-400" />
              <h2 className="font-display text-lg font-medium">Extracted Content</h2>
            </div>
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto text-sm" data-testid="doc-text">
              {doc.full_text || doc.excerpt || "(no extractable text)"}
            </div>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          <MetaCard icon={Hash} label="Word Count" value={doc.word_count?.toLocaleString() || "—"} />
          <MetaCard icon={User} label="Authors" value={doc.authors?.length ? doc.authors.join(", ") : "Not detected"} />
          <MetaCard icon={FileText} label="DOI" value={doc.doi || "—"} mono />
          <MetaCard icon={Calendar} label="Uploaded" value={new Date(doc.created_at).toLocaleString()} />

          <div className="p-5 rounded-xl bg-gradient-to-b from-indigo-500/[0.08] to-transparent border border-indigo-500/20">
            <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-mono mb-2">Next Steps</div>
            <div className="space-y-2 text-sm">
              <Link to="/app/chat" className="block text-slate-200 hover:text-white" data-testid="action-chat">→ Ask questions about this paper</Link>
              <Link to="/app/graph" className="block text-slate-200 hover:text-white">→ View in knowledge graph</Link>
              <Link to="/app/review" className="block text-slate-200 hover:text-white">→ Include in literature review</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ icon: Icon, label, value, mono }) {
  return (
    <div className="p-4 rounded-xl bg-[#0E0E0E] border border-white/[0.08]">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono mb-2">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`text-sm text-slate-200 ${mono ? "font-mono" : ""} break-words`}>{value}</div>
    </div>
  );
}
