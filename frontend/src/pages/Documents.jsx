import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, Trash2, FileUp, Loader2 } from "lucide-react";
import { docs } from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function Documents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const reload = () => docs.list().then((r) => setItems(r.documents));

  useEffect(() => { reload().finally(() => setLoading(false)); }, []);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0;
    for (const f of files) {
      try {
        await docs.upload(f);
        success++;
      } catch (err) {
        toast.error(`${f.name}: ${err.response?.data?.detail || "Upload failed"}`);
      }
    }
    setUploading(false);
    if (success) toast.success(`Uploaded ${success} document${success > 1 ? "s" : ""}`);
    reload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await docs.delete(id);
      toast.success("Document deleted");
      reload();
    } catch {
      toast.error("Delete failed");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleUpload(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-3">/ Documents</div>
          <h1 className="font-display text-4xl font-medium tracking-tight">Knowledge Corpus</h1>
          <p className="text-slate-400 mt-2">PDF, DOCX, TXT, CSV, XLSX or Markdown. Max 25MB per file.</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="bg-indigo-500 hover:bg-indigo-400 text-white" data-testid="upload-btn">
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload Files
        </Button>
        <input ref={fileRef} type="file" hidden multiple accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
          onChange={(e) => { handleUpload(Array.from(e.target.files)); e.target.value = ""; }} data-testid="file-input" />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className="mb-8 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-indigo-500/40 transition-colors p-10 text-center cursor-pointer bg-[#0E0E0E]"
        data-testid="dropzone"
      >
        <FileUp className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <div className="text-slate-300 font-medium">Drop documents here</div>
        <div className="text-xs text-slate-500 mt-1 font-mono">or click to browse</div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E0E0E] overflow-hidden">
        {loading ? (
          <div className="p-8 text-slate-500 text-sm">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400">No documents yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-white/[0.06]">
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Authors</th>
                <th className="px-5 py-3">Words</th>
                <th className="px-5 py-3">Added</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {items.map((d) => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors" data-testid={`doc-row-${d.id}`}>
                  <td className="px-5 py-4">
                    <Link to={`/app/documents/${d.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-indigo-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100 truncate max-w-xs group-hover:text-indigo-300 transition-colors">{d.title}</div>
                        <div className="text-xs text-slate-500 truncate font-mono max-w-xs">{d.filename}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400 max-w-[200px] truncate">{d.authors?.join(", ") || "—"}</td>
                  <td className="px-5 py-4 text-sm text-slate-400 font-mono">{d.word_count?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 font-mono">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10" data-testid={`delete-${d.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
