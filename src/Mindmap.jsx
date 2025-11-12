import React, { useMemo, useRef } from "react";

export default function Mindmap({ tasks = [], toggleTask }) {
  const layout = useMemo(() => tasks.map((t, i) => ({ ...t, index: i + 1 })), [tasks]);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const phrases = [
    { thresh: 100, text: "Beast mode! You're unstoppable 💪" },
    { thresh: 75, text: "Amazing progress — keep the momentum! 🚀" },
    { thresh: 50, text: "Nice work, keep chipping away 🔥" },
    { thresh: 25, text: "Small wins add up — keep going 🌱" },
    { thresh: 0, text: "Start with one task — you've got this ✨" },
  ];

  const phrase = (phrases.find((p) => pct >= p.thresh) || phrases[phrases.length - 1]).text;
  const scrollRef = useRef(null);
  const scrollBy = (delta) => scrollRef.current?.scrollBy({ top: delta, behavior: "smooth" });

  return (
    <div
      className="w-full rounded-xl"
      style={{ background: "linear-gradient(180deg,#020617 0%, #071028 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 relative mindmap-container">
        <style>{`
          @keyframes neonPulse {
            0% { opacity: .35; box-shadow: 0 0 0 rgba(124,58,237,0.0);}
            50% { opacity: .95; box-shadow: 0 8px 28px rgba(124,58,237,0.12);}
            100% { opacity: .35; box-shadow: 0 0 0 rgba(124,58,237,0.0);}
          }
          .connector-neon { animation: neonPulse 2.6s ease-in-out infinite; }
          .card-neon { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
          .card-neon:hover { transform: translateY(-4px) scale(1.015); box-shadow: 0 8px 32px rgba(124,58,237,0.12), 0 0 20px rgba(6,182,212,0.06); border-color: rgba(124,58,237,0.28); }

          /* Responsive tweaks */
          @media (max-width: 500px) {
            .mindmap-container { padding: 10px !important; }
            .mindmap-container h3 { font-size: 1.15rem; }
            .mindmap-container p { font-size: 0.9rem; }
            .mindmap-scroll { max-height: 50vh !important; padding-right: 0 !important; }
            .connector-neon { height: 18px !important; margin-bottom: 4px !important; }
            .card-neon { padding: 0.5rem !important; border-radius: 1rem !important; gap: 0.5rem !important; }
            .card-neon .text-sm { font-size: 0.9rem !important; }
            .card-neon .text-xs { font-size: 0.75rem !important; }
            .scroll-controls { right: 4px !important; top: 20% !important; gap: 4px !important; }
            .scroll-controls button { width: 1.8rem !important; height: 1.8rem !important; font-size: 0.7rem !important; }
            .w-10.h-10.rounded-lg { width: 1.9rem !important; height: 1.9rem !important; font-size: 0.85rem !important; }
            .w-12.h-12.rounded-full { width: 2.2rem !important; height: 2.2rem !important; }
            .text-lg { font-size: 0.9rem !important; }
            .gap-8 { gap: 1rem !important; }
          }

          @media (max-width: 380px) {
            .mindmap-container { padding: 8px !important; }
            .mindmap-container h3 { font-size: 1rem !important; }
            .mindmap-container p { font-size: 0.8rem !important; }
            .card-neon { flex-direction: column !important; align-items: flex-start !important; }
            .card-neon .flex-1 { width: 100% !important; }
            .card-neon .flex.items-center { width: 100%; justify-content: space-between; margin-top: 6px; }
            .w-10.h-10.rounded-lg { width: 1.6rem !important; height: 1.6rem !important; }
            .scroll-controls { display: none !important; }
          }

          @media (max-width: 340px) {
            .card-neon { padding: 0.4rem !important; }
            .mindmap-container h3 { font-size: 0.95rem !important; }
            .text-sm { font-size: 0.8rem !important; }
            .text-xs { font-size: 0.7rem !important; }
            .w-12.h-12.rounded-full { width: 1.9rem !important; height: 1.9rem !important; }
            .connector-neon { height: 14px !important; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="min-w-[200px]">
            <h3
              style={{
                background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
              className="text-2xl font-extrabold"
            >
              Tasks Flow
            </h3>
            <p className="text-sm text-slate-400 mt-1">{phrase}</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/40 flex items-center justify-center ring-1 ring-slate-700">
              <div className="text-sm font-semibold text-cyan-400">{pct}%</div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="overflow-y-auto max-h-[60vh] w-full pr-3 sm:pr-4 mindmap-scroll"
          >
            <div className="flex flex-col items-center gap-8">
              {layout.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-400">
                  No tasks yet — create some on the dashboard to see them here.
                </div>
              )}

              {layout.map((n, i) => (
                <div key={n.id} className="w-full max-w-2xl flex flex-col items-center">
                  {i > 0 && (
                    <div
                      className="connector-neon"
                      style={{
                        width: 2,
                        height: 28,
                        background: "linear-gradient(180deg,#06b6d4,#7c3aed)",
                        opacity: 0.6,
                        borderRadius: 2,
                        marginBottom: 8,
                        boxShadow: "0 6px 18px rgba(124,58,237,0.06)",
                      }}
                    />
                  )}

                  <button
                    onClick={() => toggleTask(n.id, n.status !== "done")}
                    title={n.title}
                    className="card-neon w-full px-5 py-4 sm:px-6 sm:py-4 rounded-2xl relative flex items-start gap-4 justify-between cursor-pointer outline-none"
                    style={{
                      background:
                        n.status === "done"
                          ? "linear-gradient(90deg,#05966922,#10B98122)"
                          : "linear-gradient(90deg,#7c3aed22,#ec489922)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-50 truncate">
                        {n.index}. {n.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 truncate">
                        {n.subject || "General"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-slate-900/40 text-slate-100">
                        {n.status === "done" ? "100%" : "0%"}
                      </div>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800/30 ring-1 ring-slate-700 text-lg">
                        {n.status === "done" ? "✅" : "⏳"}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll controls removed per request */}
        </div>
      </div>
    </div>
  );
}
