import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  List,
  Kanban,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Button } from '../../components/button';
import { Card } from '../../components/card';
import { KanbanBoard } from './components/kanban-board';
import { TaskList } from './components/task-list';
import { TaskModal } from './components/task-modal';
import { TaskDetailsPanel } from './components/task-details-panel';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress: number;
  deadline?: string;
  creatorId: number;
  assigneeId?: number;
  colorLabel?: string;
  category?: { id: number; name: string; color: string } | null;
  tags?: Array<{ id: number; name: string; color: string }>;
  attachments?: any[];
}

export const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals & Panels Active state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // 1. Fetch categories for filters
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });

  // 2. Fetch tags for task mapping
  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get('/tags');
      return response.data.data;
    },
  });

  // 3. Fetch tasks matching query
  const { data: taskData, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ['tasks', search, statusFilter, priorityFilter, categoryFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.categoryId = Number(categoryFilter);

      const response = await api.get('/tasks', { params });
      return response.data.data;
    },
  });

  const tasks = taskData?.tasks || [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative min-h-[calc(100vh-8rem)]">
      
      {/* 1. Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage, organize, and execute your team's software tasks.
          </p>
        </div>
        <Button variant="primary" className="gap-2 sm:self-start" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          <span>New Task</span>
        </Button>
      </div>

      {/* 2. Controls Toolbar (Search, Filter, View Toggles) */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center border-slate-500/10 dark:border-white/5">
        {/* Left Side: Search & Filter selections */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-500/10 dark:border-white/5 bg-slate-500/5 dark:bg-white/5 rounded-xl outline-none text-sm focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-500/10 dark:border-white/5 bg-slate-500/5 dark:bg-white/5 text-sm cursor-pointer select-none">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs font-semibold uppercase text-slate-600 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          {/* Priority filter dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-500/10 dark:border-white/5 bg-slate-500/5 dark:bg-white/5 text-sm cursor-pointer select-none">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs font-semibold uppercase text-slate-600 dark:text-slate-300"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Category filter dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-500/10 dark:border-white/5 bg-slate-500/5 dark:bg-white/5 text-sm cursor-pointer select-none">
            <ChevronDown size={14} className="text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs font-semibold uppercase text-slate-600 dark:text-slate-300"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Board / List layouts switches */}
        <div className="flex gap-1.5 border border-slate-500/10 dark:border-white/5 p-1 rounded-xl bg-slate-500/5 dark:bg-white/5 select-none w-full sm:w-auto justify-center">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'board'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <Kanban size={14} />
            <span>Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <List size={14} />
            <span>List</span>
          </button>
        </div>
      </Card>

      {/* 3. Task Views Rendering */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-96 bg-slate-200 dark:bg-slate-900 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : viewMode === 'board' ? (
        <KanbanBoard tasks={tasks} onSelectTask={setSelectedTaskId} />
      ) : (
        <TaskList tasks={tasks} onSelectTask={setSelectedTaskId} />
      )}

      {/* 4. Task Creation Modal Overlay */}
      {createModalOpen && (
        <TaskModal
          categories={categories}
          tags={tags}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      {/* 5. Slide-Out Detailed Sidebar Panel */}
      <TaskDetailsPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

    </div>
  );
};
export default TasksPage;
