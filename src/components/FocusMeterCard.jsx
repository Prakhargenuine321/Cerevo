import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FocusMeterCard = () => {
  const [level, setLevel] = useState(70);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "You got this 🚀",
    "Small steps matter 📘",
    "Stay consistent 🔥",
    "Focus beats talent 💡",
    "Every 1% counts 💪",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLevel(Math.floor(50 + Math.random() * 50)); // animate level
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="
        relative overflow-hidden
        w-[275px] h-[150px]
        rounded-2xl p-4
        bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b]
        border border-white/10
        shadow-lg shadow-cyan-500/10
        flex flex-col justify-between
      "
    >
      {/* Animated Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4]/10 via-[#8b5cf6]/10 to-[#06b6d4]/10 animate-pulse" />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-[#E2E8F0] tracking-wide">
          Focus Meter
        </h3>
        <span className="text-xs text-[#94A3B8]">{level}%</span>
      </div>

      {/* Animated Bar */}
      <div className="relative z-10 mt-3 w-full h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]"
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>

      {/* Rotating Message */}
      <div className="relative z-10 text-center mt-4 h-[30px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-medium text-[#E2E8F0]"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Glow Border */}
      <motion.div
        className="absolute inset-0 rounded-2xl border border-cyan-400/20"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
};

export default FocusMeterCard;
