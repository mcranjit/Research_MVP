import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, FileText, Loader2 } from "lucide-react";
import { chat as chatApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, loadingSession]);

  useEffect(() => {
    const loadedSessionId = localStorage.getItem("rm_chat_session_id");
    const loadRecentSession = async () => {
      setLoadingSession(true);
      try {
        const r = await chatApi.sessions();
        const savedSessions = r.sessions || [];
        setSessions(savedSessions);

        const initialSessionId = loadedSessionId || savedSessions[0]?.id;
        if (initialSessionId) {
          await loadSession(initialSessionId, false);
        }
      } catch (err) {
        console.error("Failed to load chat sessions", err);
      } finally {
        setLoadingSession(false);
      }
    };

    loadRecentSession();
  }, []);

  const loadSession = async (sessionIdToLoad, saveSelected = true) => {
    if (!sessionIdToLoad) return;
    setLoadingSession(true);
    try {
      const r = await chatApi.session(sessionIdToLoad);
      setMessages(r.messages || []);
      setSessionId(sessionIdToLoad);
      if (saveSelected) {
        setSelectedSessionId(sessionIdToLoad);
      }
      localStorage.setItem("rm_chat_session_id", sessionIdToLoad);
    } catch (err) {
      console.error("Failed to load chat session", err);
    } finally {
      setLoadingSession(false);
    }
  };

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = { role: "user", content: text, ts: now_iso() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const r = await chatApi.send({ session_id: sessionId, message: text });
      setSessionId(r.session_id);
      setSelectedSessionId(r.session_id);
      localStorage.setItem("rm_chat_session_id", r.session_id);
      await loadSessions();

      const full = r.answer;
      const placeholder = { role: "assistant", content: "", citations: r.citations, confidence: r.confidence, streaming: true, ts: now_iso() };
      setMessages((prev) => [...prev, placeholder]);
      const chunkSize = Math.max(3, Math.floor(full.length / 80));
      let i = 0;
      const tick = () => {
        i = Math.min(full.length, i + chunkSize);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: full.slice(0, i), streaming: i < full.length };
          return copy;
        });
        if (i < full.length) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Chat failed");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const now_iso = () => new Date().toISOString();

  const loadSessions = async () => {
    try {
      const r = await chatApi.sessions();
      setSessions(r.sessions || []);
    } catch (err) {
      console.error("Failed to load chat sessions", err);
    }
  };

  const renderWithCitations = (content) => {
    const parts = content.split(/(\[\d+\])/g);
    return parts.map((p, i) => {
      const m = p.match(/^\[(\d+)\]$/);
      if (m) return <span key={`c-${i}-${m[1]}`} className="citation-chip" data-testid={`citation-${m[1]}`}>{p}</span>;
      return <span key={`t-${i}-${p.length}`}>{p}</span>;
    });
  };

  const startNewSession = async () => {
    setSelectedSessionId(null);
    setSessionId(null);
    setMessages([]);
    localStorage.removeItem("rm_chat_session_id");
  };

  const renderSessionList = () => {
    if (loadingSession) {
      return <div className="text-sm text-slate-500">Loading sessions...</div>;
    }
    return (
      <div className="space-y-3">
        <button
          onClick={startNewSession}
          className="w-full text-left rounded-xl px-3 py-3 border border-white/10 bg-blue-500/10 hover:bg-blue-500/15 transition-colors text-sm text-slate-100 font-medium"
        >
          + New conversation
        </button>
        {sessions.length === 0 ? (
          <div className="text-sm text-slate-500">No saved conversations yet. Start one now.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess) => (
              <button
                key={sess.id}
                onClick={() => loadSession(sess.id)}
                className={`w-full text-left rounded-xl px-3 py-2 border ${sess.id === selectedSessionId ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 bg-white/5"} hover:border-indigo-300 transition-colors text-sm text-slate-100`}
              >
                <div className="font-medium truncate">{sess.title || sess.id.slice(0, 8)}</div>
                <div className="text-xs text-slate-500">Updated {new Date(sess.updated_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950">
      <aside className="w-80 min-w-[280px] border-r border-white/[0.06] bg-slate-900/95 p-6 overflow-y-auto hidden lg:block">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-2">Saved Conversations</div>
            <p className="text-xs text-slate-500">Your prior research chats are loaded here.</p>
          </div>
          <button
            type="button"
            onClick={startNewSession}
            className="text-xs text-indigo-300 hover:text-white"
          >New</button>
        </div>
        {renderSessionList()}
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="px-8 py-6 border-b border-white/[0.06] bg-slate-950/90">
          <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-2">/ Research Chat</div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-white">Cited AI Research Conversation</h1>
          <p className="text-sm text-slate-500 mt-1">Powered by Claude Sonnet 4.5. Answers grounded in your documents.</p>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
                  <Sparkles className="w-6 h-6 text-indigo-300" />
                </div>
                <h2 className="font-display text-xl font-medium mb-2 text-white">Start a research conversation</h2>
                <p className="text-slate-500 max-w-md mx-auto text-sm">
                  Ask anything about your uploaded documents. Every answer is anchored to source pages.
                </p>
                <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  {[
                    "Summarize the main findings",
                    "Compare methodologies used",
                    "What are the open research questions?",
                    "Generate a 5-bullet overview",
                  ].map((s) => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-left p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.18] text-sm text-slate-300 hover:text-white transition-colors"
                      data-testid="chat-suggestion">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={`msg-${idx}-${m.ts || ''}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={m.role === "user"
                  ? "max-w-[80%] bg-white/[0.05] border border-white/10 rounded-2xl rounded-tr-sm p-4 text-slate-100"
                  : "max-w-full bg-slate-900/80 border border-white/5 rounded-2xl p-4 text-slate-100"} data-testid={`msg-${m.role}`}>
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-500">ResearchMind</span>
                      {m.confidence != null && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          confidence: {(m.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-slate-100 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {renderWithCitations(m.content)}
                  </div>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono mb-2">Sources</div>
                      <div className="space-y-1.5">
                        {m.citations.map((c) => (
                          <div key={c.index} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="citation-chip">[{c.index}]</span>
                            <FileText className="w-3 h-3 mt-1 text-slate-600 shrink-0" />
                            <span className="truncate">{c.title} · p.{c.page}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>ResearchMind is thinking...</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-8 py-5 bg-slate-950/90">
          <form onSubmit={send} className="max-w-4xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your research question..."
              className="bg-white/[0.04] border-white/10 text-slate-100 h-12"
              disabled={loading}
              data-testid="chat-input"
            />
            <Button type="submit" disabled={loading || !input.trim()} data-testid="chat-send"
              className="bg-indigo-500 hover:bg-indigo-400 text-white h-12 px-5">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
