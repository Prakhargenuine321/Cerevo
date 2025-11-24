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

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(180deg,#020617 0%, #071028 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 relative mindmap-container">

        {/* RESPONSIVE FIXES */}
        <style>{`
          @keyframes neonPulse {
            0% { opacity: .35; box-shadow: 0 0 0 rgba(124,58,237,0.0);}
            50% { opacity: .95; box-shadow: 0 8px 28px rgba(124,58,237,0.12);}
            100% { opacity: .35; box-shadow: 0 0 0 rgba(124,58,237,0.0);}
          }
          .connector-neon { animation: neonPulse 2.6s ease-in-out infinite; }
          .card-neon { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
          .card-neon:hover { transform: translateY(-4px) scale(1.015); box-shadow: 0 8px 32px rgba(124,58,237,0.12), 0 0 20px rgba(6,182,212,0.06); border-color: rgba(124,58,237,0.28); }

          /* TABLET */
          @media (max-width: 820px) {
            .mindmap-container { padding-left: 1rem !important; padding-right: 1rem !important; }
            .card-neon { padding: 1rem 1.25rem !important; }
          }

          /* LARGE PHONES / SMALL TABLET */
          @media (max-width: 650px) {
            .mindmap-container { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
            .card-neon {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 0.75rem !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 1rem !important;
              box-sizing: border-box !important;
            }
            .card-neon .flex-1 {
              width: 100% !important;
              min-width: 0 !important; /* Allow truncation */
            }
            .card-neon .flex.items-center.gap-3 {
              width: 100% !important;
              justify-content: space-between !important;
              padding-top: 0.6rem;
              border-top: 1px solid rgba(255,255,255,0.06);
            }
          }

          /* MOBILE PORTRAIT */
          @media (max-width: 480px) {
            .mindmap-container { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
            .card-neon { padding: 0.875rem !important; border-radius: 0.75rem !important; }

            .header-text h3 { font-size: 1.25rem !important; }
            .header-text p {
              font-size: 0.85rem !important;
              white-space: normal !important;
            }

            .w-10.h-10.rounded-lg { width: 2.1rem !important; height: 2.1rem !important; }
            .w-12.h-12.rounded-full { width: 2.6rem !important; height: 2.6rem !important; }
          }

          /* ULTRA SMALL DEVICES */
          @media (max-width: 350px) {
            .mindmap-container { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
            .card-neon { padding: 0.75rem !important; }
            .text-sm { font-size: 0.85rem !important; }
            .text-xs { font-size: 0.7rem !important; }
          }
        `}</style>

        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4 header-container">
          <div className="flex-1 min-w-0 header-text">
            <h3
              style={{
                background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
              className="text-2xl font-extrabold truncate"
            >
              Tasks Flow
            </h3>
            <p className="text-sm text-slate-400 mt-1 truncate">{phrase}</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 header-stats">
            <div className="w-12 h-12 rounded-full bg-slate-800/40 flex items-center justify-center ring-1 ring-slate-700">
              <div className="text-sm font-semibold text-cyan-400">{pct}%</div>
            </div>
          </div>
        </div>

        {/* SCROLL AREA */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="overflow-y-auto max-h-[60vh] w-full pr-3 sm:pr-4"
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
                      }}
                    />
                  )}

                  <button
                    onClick={() => toggleTask(n.id, n.status !== "done")}
                    className="card-neon w-full px-5 py-4 sm:px-6 sm:py-4 rounded-2xl relative flex items-start justify-between gap-4 cursor-pointer"
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
        </div>

      </div>
    </div>
  );
}
