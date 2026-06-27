import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '../../../lib/axios';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { Card } from '../../../components/card';

interface TaskModalProps {
  categories: any[];
  tags: any[];
  onClose: () => void;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']),
  categoryId: z.string().optional(),
  deadline: z.string().optional(),
  estimatedMinutes: z.string().optional(),
});

type TaskSchema = z.infer<typeof taskSchema>;

export const TaskModal: React.FC<TaskModalProps> = ({ categories, onClose }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'TODO',
      categoryId: '',
      estimatedMinutes: '',
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/tasks', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      onClose();
    },
  });

  const onSubmit = (data: TaskSchema) => {
    const payload = {
      ...data,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      estimatedMinutes: data.estimatedMinutes ? Number(data.estimatedMinutes) : undefined,
    };
    createTaskMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      {/* Backdrop closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <Card className="w-full max-w-lg z-10 border border-slate-500/10 dark:border-white/5 relative p-6">
        {/* Header closer */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-display tracking-tight">Create Task</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-500/10 text-slate-400 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Task Title"
            placeholder="e.g. Design app shortcuts layout"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Description
            </label>
            <textarea
              placeholder="Provide a detailed overview of the task requirements..."
              rows={3}
              {...register('description')}
              className="w-full px-4 py-2.5 rounded-xl border glass-panel transition-all outline-none text-sm placeholder-slate-400 border-slate-500/10 dark:border-white/10 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status Option */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border glass-panel transition-all outline-none text-sm border-slate-500/10 dark:border-white/10 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority Option */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2.5 rounded-xl border glass-panel transition-all outline-none text-sm border-slate-500/10 dark:border-white/10 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category Option */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category
              </label>
              <select
                {...register('categoryId')}
                className="w-full px-4 py-2.5 rounded-xl border glass-panel transition-all outline-none text-sm border-slate-500/10 dark:border-white/10 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                <option value="">Unassigned</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline Date */}
            <Input
              label="Deadline"
              type="date"
              error={errors.deadline?.message}
              {...register('deadline')}
            />
          </div>

          <Input
            label="Estimated Time (Minutes)"
            type="number"
            placeholder="e.g. 120"
            error={errors.estimatedMinutes?.message}
            {...register('estimatedMinutes')}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'Saving...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default TaskModal;
