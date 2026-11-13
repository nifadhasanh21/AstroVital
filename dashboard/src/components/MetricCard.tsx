import React from 'react';

interface MetricProps {
  title: string;
  value: string | number;
  unit: string;
  status?: 'Normal' | 'Warning' | 'Critical';
  icon: string;
  trend?: string;
}

export const MetricCard: React.FC<MetricProps> = ({ title, value, unit, status = 'Normal', icon, trend }) => {
  const isCritical = status === 'Critical';
  const isWarning = status === 'Warning';

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden group">
      {/* Glow Effect */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl transition-opacity opacity-20 group-hover:opacity-40 ${
        isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
      }`} />

      <div className="flex justify-between items-start mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-full border backdrop-blur-md ${
          isCritical 
            ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' 
            : isWarning 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          ● {status}
        </span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>

      <div className="flex items-baseline space-x-2 mt-2">
        <span className="text-4xl font-extrabold tracking-tight text-white font-mono">{value}</span>
        <span className="text-xs font-medium text-slate-400">{unit}</span>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center text-xs text-slate-400">
          <span className="text-cyan-400 font-mono mr-1.5">{trend}</span> vs previous orbit
        </div>
      )}
    </div>
  );
};