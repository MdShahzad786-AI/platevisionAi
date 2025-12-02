import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ScanResult } from '../types';

interface ScanStatsProps {
  history: ScanResult[];
}

export const ScanStats: React.FC<ScanStatsProps> = ({ history }) => {
  // Flatten all detections to analyze every single plate found across all scans
  const allDetections = React.useMemo(() => {
    return history.flatMap(scan => scan.detections);
  }, [history]);

  // Aggregate data for vehicle types
  const typeData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allDetections.forEach(d => {
      // Normalize vehicle type string slightly
      const type = d.vehicleType ? d.vehicleType.charAt(0).toUpperCase() + d.vehicleType.slice(1).toLowerCase() : 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 types
  }, [allDetections]);

  // Aggregate confidence scores (avg)
  const avgConfidence = React.useMemo(() => {
    if (allDetections.length === 0) return 0;
    const total = allDetections.reduce((sum, d) => sum + d.confidence, 0);
    return Math.round(total / allDetections.length);
  }, [allDetections]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (history.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <p className="text-lg">No stats available yet.</p>
        <p className="text-sm mt-2">Upload an image or video to start tracking detections.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Total Scans</p>
          <p className="text-3xl font-bold text-white mt-1">{history.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Total Plates</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{allDetections.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
          <p className="text-slate-400 text-sm">Avg. Accuracy</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{avgConfidence}%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
           <p className="text-slate-400 text-sm">Most Common</p>
           <p className="text-xl font-mono text-purple-400 truncate mt-1">
             {typeData[0]?.name || "N/A"}
           </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl h-64">
        <p className="text-slate-400 text-sm mb-4">Vehicle Classes Detected</p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={typeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              cursor={{fill: '#334155', opacity: 0.4}}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {typeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};