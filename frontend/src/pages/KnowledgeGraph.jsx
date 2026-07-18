import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Loader2, Network } from "lucide-react";
import { research } from "../lib/api";

export default function KnowledgeGraph() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    research.knowledgeGraph().then(setData).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [loading]);

  return (
    <div className="h-screen flex flex-col">
      <div className="px-8 py-6 border-b border-white/[0.06] flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-mono mb-2">/ Knowledge Graph</div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Entity-Relationship Explorer</h1>
          <p className="text-slate-500 text-sm mt-1">Click nodes to inspect. Drag to rearrange.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            ["author", "#34D399"], ["concept", "#6366F1"], ["technology", "#FBBF24"],
            ["organization", "#F87171"], ["method", "#A78BFA"], ["dataset", "#22D3EE"],
          ].map(([k, c]) => (
            <span key={k} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/10 font-mono">
              <span className="w-2 h-2 rounded-full" style={{ background: c }} /> {k}
            </span>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative bg-[#070707]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Building graph from your corpus...
          </div>
        ) : data.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Network className="w-12 h-12 text-slate-700" />
            <p>Upload documents to build a knowledge graph.</p>
          </div>
        ) : (
          <>
            <ForceGraph2D
              graphData={data}
              width={dims.w}
              height={dims.h}
              backgroundColor="rgba(0,0,0,0)"
              enableZoomInteraction={true}
              enablePanInteraction={true}
              enableNodeDrag={true}
              minZoom={0.3}
              maxZoom={6}
              nodeColor={(n) => n.color}
              linkColor={() => "rgba(255,255,255,0.15)"}
              linkWidth={1}
              nodeLabel={(n) => `${n.name} (${n.type})`}
              onNodeClick={setSelected}
              nodeCanvasObject={(node, ctx, scale) => {
                const r = 6;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fillStyle = node.color;
                ctx.fill();
                ctx.strokeStyle = "rgba(255,255,255,0.4)";
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.font = `${12 / scale}px Inter, sans-serif`;
                ctx.fillStyle = "#E2E8F0";
                ctx.fillText(node.name, node.x + 8, node.y + 4);
              }}
            />
            {selected && (
              <div className="absolute top-4 right-4 w-72 p-5 rounded-xl glass">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-indigo-300">{selected.type}</div>
                  <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xs" data-testid="kg-close">close</button>
                </div>
                <h3 className="font-display text-lg font-medium mb-2">{selected.name}</h3>
                <div className="text-sm text-slate-400">
                  Connected to {data.links.filter(l => (l.source.id || l.source) === selected.id || (l.target.id || l.target) === selected.id).length} entities
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
