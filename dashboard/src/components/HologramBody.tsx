export const HologramBody = () => {
  return (
    <div className="relative w-28 h-48 mx-auto flex items-center justify-center">
      {/* Holographic Glowing Base Aura */}
      <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl animate-pulse" />
      
      {/* Human Silhouette Scanner Graphic */}
      <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
        <defs>
          <linearGradient id="holoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Head */}
        <circle cx="50" cy="25" r="14" fill="url(#holoGrad)" stroke="#00f2ff" strokeWidth="1" />
        
        {/* Chest & Body Core */}
        <path d="M 30 42 L 70 42 L 62 100 L 38 100 Z" fill="url(#holoGrad)" stroke="#00f2ff" strokeWidth="1" />
        
        {/* Arms */}
        <path d="M 28 44 L 14 90 L 20 92 L 32 52 Z" fill="url(#holoGrad)" stroke="#00f2ff" strokeWidth="0.8" />
        <path d="M 72 44 L 86 90 L 80 92 L 68 52 Z" fill="url(#holoGrad)" stroke="#00f2ff" strokeWidth="0.8" />

        {/* Legs */}
        <path d="M 38 102 L 34 175 L 44 175 L 48 102 Z" fill="url(#holoGrad)" stroke="#00f2ff" strokeWidth="0.8" />
        <path d="M 62 102 L 66 175 L 56 175 L 52 102 Z" fill="url(#holoGrad)" stroke="#00f2ff" strokeWidth="0.8" />

        {/* Heart Scanning Node */}
        <circle cx="46" cy="58" r="4" fill="#ef4444" className="animate-ping" />
        <circle cx="46" cy="58" r="3" fill="#f87171" />
      </svg>

      {/* Hologram Horizontal Scanning Line */}
      <div className="absolute left-0 w-full h-0.5 bg-cyan-400/80 shadow-[0_0_8px_#00f2ff] animate-[bounce_3s_infinite]" />
    </div>
  );
};