import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none animate-pulse delay-1000" />

      {/* Spinner Container */}
      <div className="relative w-32 h-32 mb-12">
        {/* Outer Ring - Cyan */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-cyan-500 border-r-cyan-500/50 animate-[spin_2s_linear_infinite] shadow-[0_0_20px_rgba(6,182,212,0.2)]" />

        {/* Middle Ring - Purple */}
        <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-transparent border-b-purple-500 border-l-purple-500/50 animate-[spin_3s_linear_infinite_reverse] shadow-[0_0_20px_rgba(168,85,247,0.2)]" />

        {/* Inner Ring - Pink */}
        <div className="absolute inset-8 rounded-full border-t-2 border-transparent border-t-pink-500/80 animate-[spin_1.5s_linear_infinite] shadow-[0_0_20px_rgba(236,72,153,0.2)]" />

        {/* Center Core */}
        <div className="absolute inset-[42%] bg-white rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
      </div>

      {/* Loading Text */}
      <div className="flex flex-col items-center gap-3 z-10">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
          Cerevo
        </h2>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1s_infinite_0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[bounce_1s_infinite_200ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-[bounce_1s_infinite_400ms]" />
        </div>
        <p className="text-xs text-slate-400/80 font-medium tracking-[0.2em] uppercase mt-2">
          Preparing Dashboard
        </p>
      </div>
    </div>
  );
}
