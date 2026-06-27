import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  ArrowRight,
  Plus,
  History,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/card';
import { Button } from '../../components/button';
import { DonutChart, AreaChart } from '../../components/charts';
import { api } from '../../lib/axios';

interface DashboardAnalytics {
  statusCounts: {
    BACKLOG: number;
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
    ARCHIVED: number;
  };
  priorityCounts: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  weeklyTrend: Array<{ name: string; completed: number }>;
  monthlyTrend: Array<{ name: string; completed: number }>;
  recentActivities: Array<{
    id: number;
    actionType: string;
    entityType: string;
    description: string;
    createdAt: string;
  }>;
  todayTasks: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    category: string;
    progress: number;
  }>;
}

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data.data;
    },
  });
  
  const queryClient = useQueryClient();
  const toggleTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      await api.put(`/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleToggleCheck = (taskId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    toggleTaskStatusMutation.mutate({ taskId, status: nextStatus });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-slate-300 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-28 bg-slate-300 dark:bg-slate-800 rounded-xl" />
        </div>
        {/* Metrics Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-300 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        {/* Chart Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-72 bg-slate-300 dark:bg-slate-800 rounded-2xl" />
          <div className="h-72 bg-slate-300 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-danger-accent/15 text-danger-accent flex items-center justify-center mb-4">
          <Info size={20} />
        </div>
        <h3 className="text-lg font-bold font-display">Failed to load dashboard data</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Please make sure the backend database and local NestJS services are active and reachable.
        </p>
      </div>
    );
  }

  const { statusCounts, recentActivities, todayTasks, weeklyTrend } = data;

  const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const completedCount = statusCounts.DONE;
  const inProgressCount = statusCounts.IN_PROGRESS + statusCounts.IN_REVIEW;
  const urgentCount = data.priorityCounts.URGENT;
  
  // Calculate dynamic completion velocity rate
  const velocity = totalTasks > 0 ? `${Math.round((completedCount / totalTasks) * 100)}%` : '0%';

  const stats = [
    { label: 'Total Tasks', value: totalTasks, change: `${completedCount} completed`, icon: CheckCircle2, color: 'text-brand-500' },
    { label: 'In Progress', value: inProgressCount, change: 'Active focus', icon: Clock, color: 'text-sky-accent' },
    { label: 'Urgent Priority', value: urgentCount, change: 'Immediate attention', icon: AlertTriangle, color: 'text-danger-accent' },
    { label: 'Completion Rate', value: velocity, change: 'Total task progress', icon: Zap, color: 'text-success-accent' },
  ];

  const donutData = [
    { name: 'Backlog', value: statusCounts.BACKLOG, color: '#64748b' },
    { name: 'Todo', value: statusCounts.TODO, color: '#f59e0b' },
    { name: 'In Progress', value: statusCounts.IN_PROGRESS, color: '#38bdf8' },
    { name: 'In Review', value: statusCounts.IN_REVIEW, color: '#a855f7' },
    { name: 'Done', value: statusCounts.DONE, color: '#10b981' },
  ];

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_PROGRESS':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'IN_REVIEW':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Realtime productivity analytics and progress indicators.
          </p>
        </div>
        <Link to="/tasks">
          <Button variant="primary" className="gap-2 sm:self-start">
            <Plus size={16} />
            <span>Manage Tasks</span>
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card hoverable className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </span>
                  <div className={`p-2 rounded-lg bg-slate-500/5 dark:bg-white/5 ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-auto">
                  <h3 className="text-2xl font-bold font-display tracking-tight">{stat.value}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <TrendingUp size={12} className="text-success-accent" />
                    <span>{stat.change}</span>
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Trend Line Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold font-display tracking-tight">Productivity Timeline</h3>
            <p className="text-xs text-slate-500">Tasks completed daily over the past 7 days</p>
          </div>
          <div className="h-60 flex items-center justify-center">
            <AreaChart data={weeklyTrend} />
          </div>
        </Card>

        {/* Status Distribution Donut Chart */}
        <Card className="flex flex-col justify-between p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold font-display tracking-tight">Task Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of current task lifecycle status</p>
          </div>
          <div className="h-60 flex items-center justify-center">
            <DonutChart data={donutData} />
          </div>
        </Card>

      </div>

      {/* Main split: Today's tasks + Timeline Activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: Today's Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold font-display tracking-tight">Today's Focus</h2>
            <Link to="/tasks" className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1 transition-colors">
              <span>All tasks</span>
              <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="flex flex-col gap-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm glass-panel rounded-2xl border-slate-500/10">
                You have no tasks due today!
              </div>
            ) : (
              todayTasks.map((task) => (
                <Card key={task.id} hoverable className="p-4 flex items-center justify-between border-slate-500/10 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-md border-slate-500/20 text-brand-500 focus:ring-brand-500/50 cursor-pointer"
                      checked={task.status === 'DONE'}
                      onChange={() => handleToggleCheck(task.id, task.status)}
                    />
                    <div>
                      <h4 className={`text-sm font-semibold ${task.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </h4>
                      <span className="text-xs text-slate-500 mt-0.5 inline-block">{task.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right pane: Activity logs timeline */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold font-display tracking-tight flex items-center gap-2">
              <History size={18} className="text-brand-500" />
              <span>Activity Timeline</span>
            </h2>
          </div>
          
          <Card className="flex-1 p-5 border-slate-500/10 dark:border-white/5 flex flex-col gap-4 overflow-y-auto max-h-[350px]">
            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No recent activity logs recorded
              </div>
            ) : (
              recentActivities.map((log) => (
                <div key={log.id} className="relative pl-6 pb-2 border-l border-slate-500/10 dark:border-white/5 last:border-0 last:pb-0">
                  <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 shadow-sm shadow-brand-500/20" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {log.description}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1">
                    {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>

      </div>

    </div>
  );
};
export default DashboardPage;
