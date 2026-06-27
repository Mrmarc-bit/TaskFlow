import React from 'react';
import { Clock } from 'lucide-react';
import type { Task } from '../tasks.page';
import { Card } from '../../../components/card';

interface TaskListProps {
  tasks: Task[];
  onSelectTask: (id: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onSelectTask }) => {
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

  if (tasks.length === 0) {
    return (
      <Card className="text-center py-16 text-slate-500 border-slate-500/10 dark:border-white/5">
        <p className="text-sm">No tasks match your selected query filters</p>
      </Card>
    );
  }

  return (
    <Card className="p-0 border-slate-500/10 dark:border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-500/10 dark:border-white/5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-500/5 dark:bg-white/[0.01]">
              <th className="px-6 py-4">Task Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-500/10 dark:divide-white/5 text-sm">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className="hover:bg-slate-500/5 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                {/* Title */}
                <td className="px-6 py-4.5 font-semibold text-slate-800 dark:text-slate-200">
                  {task.title}
                </td>
                
                {/* Status */}
                <td className="px-6 py-4.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-6 py-4.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>

                {/* Category */}
                <td className="px-6 py-4.5">
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
                    <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                  )}
                </td>

                {/* Deadline */}
                <td className="px-6 py-4.5">
                  {task.deadline ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Clock size={12} />
                      <span>
                        {new Date(task.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                  )}
                </td>

                {/* Progress */}
                <td className="px-6 py-4.5">
                  <div className="flex items-center gap-3 w-32">
                    <div className="flex-1 bg-slate-500/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-500 h-full rounded-full"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 font-mono">{task.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
export default TaskList;
