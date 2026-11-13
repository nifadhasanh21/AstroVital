import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartProps {
  data: Array<{ recorded_at: string; value_numeric: number }>;
}

export const HealthChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    time: new Date(item.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    val: item.value_numeric,
  })).reverse();

  return (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 h-80 w-full">
      <h3 className="text-slate-200 font-semibold mb-4">Heart Rate Telemetry Trend (BPM)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" />
          <YAxis domain={[40, 140]} stroke="#64748b" />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
          <Line type="monotone" dataKey="val" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#38bdf8' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};