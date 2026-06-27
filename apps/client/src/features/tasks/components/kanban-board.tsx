import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { Task } from '../tasks.page';
import { api } from '../../../lib/axios';
import { Card } from '../../../components/card';

interface KanbanBoardProps {
  tasks: Task[];
  onSelectTask: (id: number) => void;
}

const COLUMNS: Array<{ id: Task['status']; label: string; color: string }> = [
  { id: 'BACKLOG', label: 'Backlog', color: '#64748b' },
  { id: 'TODO', label: 'Todo', color: '#f59e0b' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#38bdf8' },
  { id: 'IN_REVIEW', label: 'In Review', color: '#a855f7' },
  { id: 'DONE', label: 'Done', color: '#10b981' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onSelectTask }) => {
  const queryClient = useQueryClient();
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  // Status update mutation (optimistic UI)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: Task['status'] }) => {
      const response = await api.put(`/tasks/${taskId}`, { status });
      return response.data.data;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot query values
      const previousTasksState = queryClient.getQueryData(['tasks']);

      // Optimistically overwrite status of target card
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((task: any) =>
            task.id === taskId ? { ...task, status } : task
          ),
        };
      });

      return { previousTasksState };
    },
    onError: (_err, _variables, context) => {
      // Revert cache on mutation failure
      if (context?.previousTasksState) {
        queryClient.setQueryData(['tasks'], context.previousTasksState);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const handleShiftStatus = (taskId: number, currentStatus: Task['status'], direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details panel
    const currentIdx = COLUMNS.findIndex((col) => col.id === currentStatus);
    const targetIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1;
    
    if (targetIdx >= 0 && targetIdx < COLUMNS.length) {
      updateStatusMutation.mutate({
        taskId,
        status: COLUMNS[targetIdx].id,
      });
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'URGENT':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'MEDIUM':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        return (
          <div key={column.id} className="flex flex-col gap-4 min-w-[200px] h-full">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                <h3 className="font-semibold font-display text-sm text-slate-700 dark:text-slate-300">
                  {column.label}
                </h3>
              </div>
              <span className="text-xs font-bold bg-slate-500/10 dark:bg-white/5 px-2 py-0.5 rounded-md">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Task List Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDraggedOverCol(column.id)}
              onDragLeave={() => setDraggedOverCol(null)}
              onDrop={(e) => {
                setDraggedOverCol(null);
                const taskIdStr = e.dataTransfer.getData('text/plain');
                if (taskIdStr) {
                  updateStatusMutation.mutate({
                    taskId: Number(taskIdStr),
                    status: column.id,
                  });
                }
              }}
              className={`flex-1 flex flex-col gap-3 p-1.5 rounded-2xl min-h-[450px] transition-all duration-200 ${
                draggedOverCol === column.id
                  ? 'bg-brand-500/10 border-2 border-dashed border-brand-500/40 scale-[0.99]'
                  : 'bg-slate-500/5 dark:bg-white/[0.02] border border-slate-500/5 dark:border-white/5'
              }`}
            >
              <AnimatePresence mode="popLayout">
                {columnTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layoutId={`card-${task.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onSelectTask(task.id)}
                    draggable="true"
                    onDragStart={(e: any) => {
                      e.dataTransfer.setData('text/plain', task.id.toString());
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <Card
                      hoverable
                      className="p-4 border-slate-500/10 dark:border-white/5 relative group cursor-pointer"
                    >
                      {/* Priority Tag & Quick actions */}
                      <div className="flex items-center justify-between mb-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>

                        {/* Shift Card Status Quick buttons (visible on hover) */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                          {column.id !== 'BACKLOG' && (
                            <button
                              onClick={(e) => handleShiftStatus(task.id, task.status, 'left', e)}
                              className="p-1 rounded-md hover:bg-slate-500/10 text-slate-500 cursor-pointer"
                            >
                              <ArrowLeft size={12} />
                            </button>
                          )}
                          {column.id !== 'DONE' && (
                            <button
                              onClick={(e) => handleShiftStatus(task.id, task.status, 'right', e)}
                              className="p-1 rounded-md hover:bg-slate-500/10 text-slate-500 cursor-pointer"
                            >
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Description preview */}
                      <h4 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200 line-clamp-2">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Footer Category and Deadline info */}
                      {(task.category || task.deadline) && (
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-500/10 dark:border-white/5">
                          {task.category ? (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={{
                                color: task.category.color,
                                backgroundColor: `${task.category.color}15`,
                              }}
                            >
                              {task.category.name}
                            </span>
                          ) : (
                            <span />
                          )}

                          {task.deadline && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                              <Clock size={10} />
                              <span>
                                {new Date(task.deadline).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {columnTasks.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-xs text-slate-500 select-none">
                  Empty column
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default KanbanBoard;
