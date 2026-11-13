import React from 'react';

export const VitalsDiagram: React.FC<{ hr: number; spo2: number }> = ({ hr, spo2 }) => {
  return (
    <div className="glass-card rounded-2xl p-6 relative">
      <h3 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        Space Suit Telemetry Diagram
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Visual Astronaut Suit Representation */}
        <div className="relative flex justify-center items-center py-4 border border-slate-800/60 rounded-xl bg-slate-950/40">
          <div className="relative w-36 h-48 border-2 border-cyan-500/30 rounded-3xl flex flex-col items-center justify-between p-3 bg-gradient-to-b from-cyan-950/20 to-transparent">
            {/* Helmet */}
            <div className="w-16 h-12 border-2 border-cyan-400/60 rounded-full bg-cyan-500/10 flex items-center justify-center backdrop-blur-sm">
              <span className="text-[10px] text-cyan-300 font-mono">O₂ {spo2}%</span>
            </div>
            {/* Chest Core / Heart Scan */}
            <div className="w-12 h-12 rounded-full border border-red-500/50 bg-red-500/10 flex items-center justify-center animate-pulse">
              <span className="text-xs font-bold text-red-400 font-mono">{hr}</span>
            </div>
            {/* Suit Status */}
            <span className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">EVA SUIT V4</span>
          </div>
        </div>

        {/* Status Breakdown Diagram */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Cardio-Vascular Strain</span>
              <span className="text-cyan-400 font-mono font-bold">{hr > 100 ? 'High' : 'Optimal'}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-red-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (hr / 140) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Oxygen Saturation (SpO2)</span>
              <span className="text-emerald-400 font-mono font-bold">{spo2}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500" 
                style={{ width: `${spo2}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex justify-between items-center text-xs">
            <span className="text-slate-400">Cabin Pressure Sync</span>
            <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">101.3 kPa (STP)</span>
          </div>
        </div>
      </div>
    </div>
  );
};