import { Link } from "react-router-dom";
import { Brain, ArrowRight, FileText, Sparkles, Network, ScatterChart, BookOpen, Lightbulb, Search, MessageSquare, Check } from "lucide-react";
import { Button } from "../components/ui/button";

const features = [
  { icon: FileText, title: "Document Intelligence", desc: "Upload PDFs, DOCX, papers & patents. Auto-extract metadata, authors, DOI." },
  { icon: MessageSquare, title: "Cited Research Chat", desc: "Ask anything. Every answer carries page-anchored citations & confidence scores." },
  { icon: Search, title: "Semantic Search", desc: "Hybrid vector + keyword retrieval across your entire knowledge corpus." },
  { icon: ScatterChart, title: "Topic Clustering", desc: "Auto-cluster papers into thematic groups with AI-generated labels." },
  { icon: Network, title: "Knowledge Graph", desc: "Interactive entity-relationship explorer for authors, concepts & methods." },
  { icon: BookOpen, title: "Literature Reviews", desc: "Generate publication-ready reviews with comparative analysis & gaps." },
  { icon: Lightbulb, title: "Research Gap Engine", desc: "Surface contradictions, emerging trends & under-explored questions." },
  { icon: Sparkles, title: "Hypothesis Lab", desc: "From a topic to testable hypotheses, experiments & validation paths." },
];

const tiers = [
  { name: "Researcher", price: "Free", desc: "Everything, forever", features: ["Unlimited documents", "AI chat with citations", "Semantic search & clustering", "Knowledge graph", "Literature reviews", "Patent intelligence", "Dataset discovery", "Workspace collaboration"], cta: "Start researching", popular: true },
  { name: "Enterprise", price: "Custom", desc: "Teams & labs", features: ["Everything in Researcher", "SSO + audit logs", "Custom embedding models", "API access", "Priority support", "On-premise deployment"], cta: "Talk to us", popular: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 relative grain overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" data-testid="landing-logo">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-base font-semibold">ResearchMind <span className="text-indigo-400 font-mono text-xs">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#workflow" className="hover:text-white transition">Workflow</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" data-testid="header-login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">Sign in</Button>
            </Link>
            <Link to="/auth/register" data-testid="header-register">
              <Button className="bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_24px_rgba(99,102,241,0.35)]">
                Get started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="aurora" />
        <div className="absolute inset-0 dotgrid opacity-30" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-[0.2em] text-indigo-300 mb-8 fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
            Powered by Claude Sonnet 4.5
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tighter leading-[0.95] mb-6 fade-up" style={{animationDelay: "0.05s"}}>
            The research<br/>
            <span className="text-slate-500">operating system</span><br/>
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">for thinkers.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-10 fade-up" style={{animationDelay: "0.1s"}}>
            Ingest thousands of papers, patents and reports. Chat with citations, surface hidden trends,
            generate literature reviews and discover the questions nobody is asking yet.
          </p>
          <div className="flex flex-wrap items-center gap-4 fade-up" style={{animationDelay: "0.15s"}}>
            <Link to="/auth/register" data-testid="hero-cta">
              <Button size="lg" className="bg-indigo-500 hover:bg-indigo-400 text-white px-7 h-12 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                Start researching <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 h-12 px-7 border border-white/10">
                Explore capabilities
              </Button>
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.08]">
            {[
              ["10K+", "Documents indexed"],
              ["98%", "Citation accuracy"],
              ["8", "AI research modules"],
              ["<2s", "Avg query response"],
            ].map(([v, l]) => (
              <div key={l} className="bg-[#0A0A0A] p-6">
                <div className="font-display text-3xl font-medium text-white">{v}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mt-1 font-mono">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-4">/ Capabilities</div>
            <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight">A complete research stack, not just a chatbot.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={f.title}
                className="group p-6 rounded-xl bg-[#111111] border border-white/[0.08] hover:border-white/[0.18] hover:-translate-y-1 transition-[transform,border-color,box-shadow] duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]"
                style={{animationDelay: `${i * 0.05}s`}}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-indigo-300" />
                </div>
                <h3 className="font-display text-lg font-medium mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="relative py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-mono mb-4">/ Workflow</div>
            <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight">From raw papers to research clarity.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Ingest", d: "Drop in PDFs, DOCX, datasets. Auto-OCR, metadata & citation extraction." },
              { n: "02", t: "Index", d: "Vector embeddings, semantic clustering, entity graph construction." },
              { n: "03", t: "Discover", d: "Chat, search, review, debate. Every insight is citation-anchored." },
            ].map((step) => (
              <div key={step.n} className="relative p-8 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.08]">
                <div className="font-mono text-xs text-indigo-400 mb-6">/{step.n}</div>
                <h3 className="font-display text-2xl font-medium mb-3">{step.t}</h3>
                <p className="text-slate-400 leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-4">/ Pricing</div>
            <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight">Plans for every research scale.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {tiers.map((t) => (
              <div key={t.name}
                className={`relative p-8 rounded-2xl border ${t.popular ? "bg-gradient-to-b from-indigo-500/[0.08] to-transparent border-indigo-500/30 shadow-[0_0_60px_rgba(99,102,241,0.15)]" : "bg-[#111111] border-white/[0.08]"}`}
              >
                {t.popular && (
                  <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] uppercase tracking-[0.2em] font-mono">Most popular</div>
                )}
                <div className="text-sm uppercase tracking-[0.2em] font-mono text-slate-500 mb-3">{t.name}</div>
                <div className="font-display text-4xl font-medium mb-1">{t.price}<span className="text-base text-slate-500">{t.price.startsWith("$") && t.price !== "$0" ? "/mo" : ""}</span></div>
                <div className="text-sm text-slate-400 mb-6">{t.desc}</div>
                <ul className="space-y-3 mb-8">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth/register" data-testid={`pricing-${t.name.toLowerCase()}`}>
                  <Button className={`w-full ${t.popular ? "bg-indigo-500 hover:bg-indigo-400 text-white" : "bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10"}`}>
                    {t.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>ResearchMind AI · Built for thinkers.</span>
          </div>
          <div className="font-mono text-xs">© 2026 — All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
