import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  Paperclip,
  Send,
  MessageSquare,
  CornerDownRight,
  Plus,
} from 'lucide-react';
import { api } from '../../../lib/axios';

interface TaskDetailsPanelProps {
  taskId: number | null;
  onClose: () => void;
}

export const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({
  taskId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [subTaskText, setSubTaskText] = useState('');

  // 1. Fetch detailed task metadata
  const { data: task, isLoading } = useQuery<any>({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data.data;
    },
    enabled: !!taskId,
  });

  // 2. Update task details mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedFields: any) => {
      const response = await api.put(`/tasks/${taskId}`, updatedFields);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  // 3. Post comment mutation
  const postCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      const response = await api.post(`/tasks/${taskId}/comments`, { content, parentId });
      return response.data.data;
    },
    onSuccess: () => {
      setCommentText('');
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });

  // 4. Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/tasks/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });

  // 5. Upload file mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });

  // 6. Delete file mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      await api.delete(`/tasks/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });

  // 7. Subtasks CRUD mutations
  const addSubTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
      return response.data.data;
    },
    onSuccess: () => {
      setSubTaskText('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
    },
  });

  const toggleSubTaskMutation = useMutation({
    mutationFn: async ({ subTaskId, isDone }: { subTaskId: number; isDone: boolean }) => {
      const response = await api.put(`/tasks/subtasks/${subTaskId}`, { isDone });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const deleteSubTaskMutation = useMutation({
    mutationFn: async (subTaskId: number) => {
      await api.delete(`/tasks/subtasks/${subTaskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (subTaskText.trim()) {
      addSubTaskMutation.mutate(subTaskText.trim());
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    postCommentMutation.mutate({
      content: commentText,
      parentId: replyToId || undefined,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAttachmentMutation.mutateAsync(file);
    } catch (err) {}
    setUploading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Reconstruct comments tree locally
  const renderComments = () => {
    if (!task?.comments) return null;
    const parentComments = task.comments.filter((c: any) => !c.parentId);
    const replies = task.comments.filter((c: any) => c.parentId);

    return (
      <div className="flex flex-col gap-4 mt-2">
        {parentComments.map((comment: any) => (
          <div key={comment.id} className="flex flex-col gap-2">
            {/* Parent Comment */}
            <div className="flex gap-3 items-start p-3 bg-slate-500/5 dark:bg-white/[0.02] border border-slate-500/10 dark:border-white/5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {comment.user.firstName[0]}
                {comment.user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {comment.content}
                </p>
                <div className="flex gap-2.5 mt-2">
                  <button
                    onClick={() => setReplyToId(comment.id)}
                    className="text-[10px] text-brand-500 font-semibold hover:underline cursor-pointer"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    className="text-[10px] text-danger-accent font-semibold hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Nested Replies */}
            {replies
              .filter((r: any) => r.parentId === comment.id)
              .map((reply: any) => (
                <div key={reply.id} className="flex gap-2 pl-6">
                  <CornerDownRight size={14} className="text-slate-400 mt-2 shrink-0" />
                  <div className="flex-1 flex gap-3 items-start p-3 bg-slate-500/[0.03] dark:bg-white/[0.01] border border-slate-500/5 dark:border-white/5 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-display font-semibold text-[10px] shrink-0">
                      {reply.user.firstName[0]}
                      {reply.user.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold">
                          {reply.user.firstName} {reply.user.lastName}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {reply.content}
                      </p>
                      <button
                        onClick={() => deleteCommentMutation.mutate(reply.id)}
                        className="text-[10px] text-danger-accent font-semibold hover:underline mt-1.5 block cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {taskId && (
        <>
          {/* Overlay mask closer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Drawer Wrapper */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col h-full shadow-2xl"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <span className="font-display font-bold text-base">Task Details</span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-500/10 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inner Content Area */}
            {isLoading ? (
              <div className="flex-1 p-6 flex flex-col gap-4 animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
                <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                
                {/* 1. Title editable */}
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="text-lg font-bold font-display tracking-tight bg-transparent border-0 outline-none w-full focus:border-b focus:border-brand-500"
                />

                {/* 2. Select Grid dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                    <select
                      value={task.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="text-xs font-semibold px-2 py-1.5 border border-slate-500/10 rounded-lg bg-slate-500/5 outline-none focus:border-brand-500"
                    >
                      <option value="BACKLOG">Backlog</option>
                      <option value="TODO">Todo</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority</span>
                    <select
                      value={task.priority}
                      onChange={(e) => handleFieldChange('priority', e.target.value)}
                      className="text-xs font-semibold px-2 py-1.5 border border-slate-500/10 rounded-lg bg-slate-500/5 outline-none focus:border-brand-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Progress editable */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Progress</span>
                    <span className="text-xs font-mono font-bold">{task.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={task.progress}
                    onChange={(e) => handleFieldChange('progress', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500 dark:bg-slate-800"
                  />
                </div>

                {/* Description Box */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</span>
                  <textarea
                    value={task.description || ''}
                    placeholder="Enter task details..."
                    rows={4}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="w-full text-xs p-3 border border-slate-500/10 rounded-xl bg-slate-500/5 dark:bg-white/[0.01] outline-none focus:border-brand-500"
                  />
                </div>

                {/* 5. Subtasks Checklist */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Subtasks ({task.subTasks?.filter((s: any) => !s.isDeleted).length || 0})
                  </span>
                  
                  {/* List of subtasks */}
                  <div className="flex flex-col gap-2">
                    {(!task.subTasks || task.subTasks.filter((s: any) => !s.isDeleted).length === 0) ? (
                      <p className="text-[11px] text-slate-500 italic px-1">No subtasks yet.</p>
                    ) : (
                      task.subTasks
                        .filter((sub: any) => !sub.isDeleted)
                        .map((sub: any) => (
                          <div key={sub.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-500/10 dark:border-white/5 bg-slate-500/5 dark:bg-white/[0.01]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded-md border-slate-500/20 text-brand-500 focus:ring-brand-500/50 cursor-pointer"
                                checked={sub.status === 'DONE'}
                                onChange={() => toggleSubTaskMutation.mutate({ subTaskId: sub.id, isDone: sub.status !== 'DONE' })}
                              />
                              <span className={`text-xs ${sub.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>
                                {sub.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteSubTaskMutation.mutate(sub.id)}
                              className="p-1 rounded-md hover:bg-slate-500/10 text-danger-accent cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Add Subtask Form */}
                  <form onSubmit={handleAddSubTask} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Add a subtask..."
                      value={subTaskText}
                      onChange={(e) => setSubTaskText(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-500/10 rounded-xl bg-slate-500/5 dark:bg-white/[0.01] outline-none text-xs focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={addSubTaskMutation.isPending}
                      className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </form>
                </div>

                {/* File Attachments */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attachments</span>
                    <label className="flex items-center gap-1.5 text-xs text-brand-500 font-semibold hover:underline cursor-pointer">
                      <Paperclip size={12} />
                      <span>{uploading ? 'Uploading...' : 'Attach File'}</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    {task.attachments?.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-2.5 border border-slate-500/10 rounded-xl bg-slate-500/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Paperclip size={14} className="text-slate-400 shrink-0" />
                          <div className="truncate">
                            <a
                              href={`http://localhost:3000${file.filePath}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold hover:underline block truncate"
                            >
                              {file.fileName}
                            </a>
                            <span className="text-[9px] text-slate-500 block">{formatFileSize(file.fileSize)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAttachmentMutation.mutate(file.id)}
                          className="p-1 rounded-md hover:bg-slate-500/10 text-danger-accent cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task comments Thread section */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-500/10 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    <span>Comments ({task.comments?.length || 0})</span>
                  </span>

                  {renderComments()}

                  {/* Reply indicators */}
                  {replyToId && (
                    <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-lg text-xs mt-2">
                      <span className="text-brand-500 font-semibold">Replying to comment...</span>
                      <button onClick={() => setReplyToId(null)} className="text-slate-400 hover:text-slate-200">
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {/* Comment Input Box */}
                  <form onSubmit={handlePostComment} className="flex gap-2 items-center mt-2">
                    <input
                      type="text"
                      placeholder={replyToId ? "Type reply..." : "Add a comment..."}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-500/10 rounded-xl bg-slate-500/5 dark:bg-white/[0.01] outline-none text-xs focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={postCommentMutation.isPending}
                      className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white cursor-pointer disabled:opacity-50"
                    >
                      <Send size={12} />
                    </button>
                  </form>
                </div>

              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
