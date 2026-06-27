import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';
import { api } from '../../lib/axios';
import { Card } from '../../components/card';
import { TaskDetailsPanel } from '../tasks/components/task-details-panel';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Fetch all tasks for mapping (limit = 100 to get a wide grid selection)
  const { data: tasksData } = useQuery<any>({
    queryKey: ['tasks', 'calendar'],
    queryFn: async () => {
      const response = await api.get('/tasks?limit=100');
      return response.data.data.tasks || [];
    },
  });

  const tasks = Array.isArray(tasksData) ? tasksData : [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper arrays
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays: Array<{ dateString: string; dayNumber: number; isCurrentMonth: boolean; tasks: any[] }> = [];

  // 1. Fill previous month tail days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dateString: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      tasks: [],
    });
  }

  // 2. Fill current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayTasks = tasks.filter((task: any) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
    calendarDays.push({
      dateString: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      tasks: dayTasks,
    });
  }

  // 3. Fill next month head days (to round up grid to multiple of 7)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      dateString: dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      tasks: [],
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getPriorityBorder = (prio: string) => {
    switch (prio) {
      case 'URGENT': return 'border-l-red-500';
      case 'HIGH': return 'border-l-amber-500';
      case 'MEDIUM': return 'border-l-blue-500';
      default: return 'border-l-slate-400';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight">Calendar Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">Schedule task allocations and monitor pending deadlines.</p>
        </div>

        {/* Month Selector controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-500/10 dark:border-white/5 bg-white dark:bg-slate-900 hover:bg-slate-500/10 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold font-display w-36 text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-500/10 dark:border-white/5 bg-white dark:bg-slate-900 hover:bg-slate-500/10 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <Card className="p-3 border-slate-500/10 dark:border-white/5 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-500/10 dark:border-white/5 pb-2.5">
          {daysOfWeek.map((day) => (
            <span key={day} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
              {day}
            </span>
          ))}
        </div>

        {/* Month Days cells */}
        <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-500/10 dark:divide-white/5 border-b border-r border-slate-500/10 dark:border-white/5">
          {calendarDays.map((cell, idx) => {
            const isToday = cell.dateString === new Date().toISOString().split('T')[0];
            return (
              <div
                key={idx}
                className={`min-h-[100px] p-2 flex flex-col gap-1.5 transition-colors ${
                  cell.isCurrentMonth
                    ? 'bg-transparent'
                    : 'bg-slate-500/[0.02] text-slate-400 dark:text-slate-600'
                } ${isToday ? 'bg-brand-500/5' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                      isToday
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.tasks.length > 0 && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-500/10 px-1 rounded">
                      {cell.tasks.length}
                    </span>
                  )}
                </div>

                {/* Subtask list entries */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                  {cell.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full text-left text-[10px] font-semibold px-1.5 py-1 rounded-md border-l-2 bg-slate-500/5 hover:bg-slate-500/10 transition-colors flex items-center gap-1 cursor-pointer truncate ${getPriorityBorder(
                        task.priority
                      )}`}
                    >
                      {task.status === 'DONE' ? (
                        <CheckSquare size={10} className="text-success-accent shrink-0" />
                      ) : (
                        <CalendarIcon size={10} className="text-slate-400 shrink-0" />
                      )}
                      <span className={`truncate ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Task Details side-drawer */}
      <TaskDetailsPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </div>
  );
};
