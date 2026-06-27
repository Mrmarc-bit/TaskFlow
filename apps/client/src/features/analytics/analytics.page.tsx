import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../../lib/axios';
import { Card } from '../../components/card';

interface DashboardAnalytics {
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  weeklyTrend: Array<{ name: string; completed: number }>;
}

export const AnalyticsPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboardAnalytics', 'analytics-center'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data.data;
    },
  });

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  // Calculate metrics calculations
  const totalTasks = Object.values(metrics.statusCounts).reduce((a, b) => a + b, 0);
  const doneTasks = metrics.statusCounts.DONE || 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const activeFocus = metrics.statusCounts.IN_PROGRESS || 0;
  const urgentCount = metrics.priorityCounts.URGENT || 0;

  // Custom SVG Bar Chart calculation values for Priority counts
  const prioritiesList = Object.entries(metrics.priorityCounts);
  const maxPrioCount = Math.max(...prioritiesList.map(([_, v]) => v), 1);

  // Custom SVG Area Chart calculation values for Weekly trends
  const trendMax = Math.max(...metrics.weeklyTrend.map((d) => d.completed), 1);
  const chartWidth = 500;
  const chartHeight = 160;
  const padding = 20;

  // Draw points
  const points = metrics.weeklyTrend.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (metrics.weeklyTrend.length - 1 || 1);
    const y = chartHeight - padding - (d.completed * (chartHeight - padding * 2)) / trendMax;
    return { x, y, name: d.name, completed: d.completed };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight">Performance Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Track task completion ratios and workspace velocity indicators.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 flex items-center justify-between border-slate-500/10 dark:border-white/5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Tasks</span>
            <span className="text-2xl font-bold font-mono">{totalTasks}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-500/10 dark:border-white/5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completion rate</span>
            <span className="text-2xl font-bold font-mono">{completionRate}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success-accent/10 text-success-accent flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-500/10 dark:border-white/5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Focus</span>
            <span className="text-2xl font-bold font-mono">{activeFocus}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-accent/10 text-sky-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-500/10 dark:border-white/5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Urgent Priority</span>
            <span className="text-2xl font-bold font-mono text-danger-accent">{urgentCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-danger-accent/10 text-danger-accent flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </Card>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Productivity curve (Area Chart) */}
        <Card className="lg:col-span-2 p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-display text-sm">Productivity Velocity</h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded">Weekly scale</span>
          </div>
          <div className="flex-1 w-full flex items-center justify-center py-4">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              <g className="text-slate-500">
                {/* Draw y grids */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = padding + ratio * (chartHeight - padding * 2);
                  return (
                    <line
                      key={i}
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.05"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
              {/* Draw area and path */}
              <path d={areaD} fill="url(#grad-area)" />
              <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
              {/* Draw node dots */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    x={p.x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-slate-400"
                  >
                    {p.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </Card>

        {/* Priority breakdown (Bar Chart) */}
        <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
          <h3 className="font-bold font-display text-sm">Priority Breakdown</h3>
          <div className="flex flex-col gap-3.5 mt-2">
            {prioritiesList.map(([prio, val]) => {
              const widthPct = Math.round((val / maxPrioCount) * 100);
              return (
                <div key={prio} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{prio}</span>
                    <span className="font-mono font-bold">{val}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-500/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Task Distribution metrics */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm">Status Mappings</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
          {Object.entries(metrics.statusCounts).map(([status, count]) => {
            const statusPct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            return (
              <div key={status} className="p-4 border border-slate-500/10 rounded-xl bg-slate-500/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400">{status}</span>
                <span className="text-xl font-bold font-mono mt-1">{count}</span>
                <span className="text-[10px] font-mono text-slate-500">{statusPct}% of total</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
