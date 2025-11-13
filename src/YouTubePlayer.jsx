import React, { useEffect, useRef } from "react";

/**
 * Stable YouTubePlayer: imperative iframe mount so React parent updates
 * (typing notes etc.) won't remount/recreate the iframe.
 *
 * Usage: <YouTubePlayer videoId="uY6DJYbuNcc" title="..." subject="..." />
 */
const YouTubePlayer = React.memo(function YouTubePlayer({ videoId, title, subject }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // remove existing iframe if any
    if (iframeRef.current && container.contains(iframeRef.current)) {
      try { container.removeChild(iframeRef.current); } catch { void 0; }
      iframeRef.current = null;
    }

    if (!videoId) return undefined;

    // create iframe imperatively
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    // className for basic sizing; keep it simple to avoid extra compositing
    iframe.className = 'w-full h-full rounded-xl';

    // debug: uncomment to see mount/unmount
    // console.log('YouTube iframe mount', videoId);

    container.appendChild(iframe);
    iframeRef.current = iframe;

    return () => {
      // debug: uncomment to see unmount
      // console.log('YouTube iframe unmount', videoId);
      if (iframeRef.current && container && container.contains(iframeRef.current)) {
        try { container.removeChild(iframeRef.current); } catch { void 0; }
      }
      iframeRef.current = null;
    };
  }, [videoId]);

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg bg-black">
      {/* iframe will be appended to this container DOM node */}
      <div ref={containerRef} className="w-full h-[360px] sm:h-[440px] md:h-[480px] bg-black" />
      <div className="flex items-center justify-between px-4 py-3 bg-[#0b1220] border-t border-white/6 text-[#E2E8F0]">
        <div className="min-w-0">
          <h3 className="text-base font-semibold truncate">{title || 'Study Video'}</h3>
          {subject && <p className="text-sm text-[#94A3B8]">{subject}</p>}
        </div>
        <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer" className="text-[#06b6d4] text-sm">
          Open on YouTube ↗
        </a>
      </div>
    </div>
  );
}, (a, b) => a.videoId === b.videoId);

export default YouTubePlayer;