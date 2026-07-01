import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, Moon, Sun, Monitor, Bell, BellOff, FolderKanban, Tag as TagIcon, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { api } from '../../lib/axios';
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
  getNotificationPermission,
} from '../../lib/push';
import { Card } from '../../components/card';
import { Input } from '../../components/input';
import { Button } from '../../components/button';
import { useThemeStore } from '../../store/theme.store';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useThemeStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Push notification states
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  // Check push subscription status on mount
  useEffect(() => {
    isPushSubscribed().then(setPushSubscribed);
    setPushPermission(getNotificationPermission());
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    try {
      if (pushSubscribed) {
        const ok = await unsubscribeFromPush();
        if (ok) {
          setPushSubscribed(false);
          setSuccessMsg('Push notifications disabled.');
          setTimeout(() => setSuccessMsg(null), 3000);
        }
      } else {
        const ok = await subscribeToPush();
        if (ok) {
          setPushSubscribed(true);
          setSuccessMsg('Push notifications enabled! You will receive browser alerts.');
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          setErrorMsg(
            pushPermission === 'denied'
              ? 'Notification permission is blocked. Please allow it from your browser settings.'
              : 'Failed to enable push notifications.',
          );
          setTimeout(() => setErrorMsg(null), 4000);
        }
      }
      setPushPermission(getNotificationPermission());
    } finally {
      setPushLoading(false);
    }
  };

  // --- Categories CRUD State & Mutations ---
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('#6366f1');
  const [editCatDesc, setEditCatDesc] = useState('');

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; description?: string }) => {
      const response = await api.post('/categories', data);
      return response.data.data;
    },
    onSuccess: () => {
      setNewCatName('');
      setNewCatDesc('');
      setSuccessMsg('Category created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create category');
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; color: string; description?: string } }) => {
      const response = await api.put(`/categories/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      setEditingCatId(null);
      setSuccessMsg('Category updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update category');
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      setSuccessMsg('Category deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to delete category');
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  // --- Tags CRUD State & Mutations ---
  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get('/tags');
      return response.data.data;
    },
  });

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ec4899');

  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await api.post('/tags', data);
      return response.data.data;
    },
    onSuccess: () => {
      setNewTagName('');
      setSuccessMsg('Tag created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create tag');
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tags/${id}`);
    },
    onSuccess: () => {
      setSuccessMsg('Tag deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to delete tag');
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const handleStartEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
    setEditCatDesc(cat.description || '');
  };

  const handleSaveEditCategory = (id: number) => {
    if (editCatName.trim()) {
      updateCategoryMutation.mutate({
        id,
        data: {
          name: editCatName.trim(),
          color: editCatColor,
          description: editCatDesc.trim() || undefined,
        },
      });
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      createCategoryMutation.mutate({
        name: newCatName.trim(),
        color: newCatColor,
        description: newCatDesc.trim() || undefined,
      });
    }
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      createTagMutation.mutate({
        name: newTagName.trim(),
        color: newTagColor,
      });
    }
  };

  // 1. Fetch current profile
  const { data: profile } = useQuery<any>({
    queryKey: ['myProfile', 'settings'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile]);

  // 2. Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await api.put('/users/settings', data);
      return response.data.data;
    },
    onSuccess: () => {
      setSuccessMsg('Profile settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update settings');
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) {
      updateSettingsMutation.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure profile identifiers and display configurations.</p>
      </div>

      {successMsg && (
        <div className="bg-success-accent/10 border border-success-accent/20 text-success-accent text-xs px-4 py-2.5 rounded-xl font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-danger-accent/10 border border-danger-accent/20 text-danger-accent text-xs px-4 py-2.5 rounded-xl font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Profile settings card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-5">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <User size={16} className="text-brand-500" />
          <span>Profile Settings</span>
        </h3>
        
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Input
            label="Email Address (read-only)"
            type="email"
            value={profile?.email || ''}
            disabled
            className="opacity-60 cursor-not-allowed"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-32 self-start mt-2 py-2"
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </Card>

      {/* Theme Preference Settings card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <Moon size={16} className="text-purple-500" />
          <span>Interface theme preference</span>
        </h3>
        <p className="text-xs text-slate-500">Configure how the workspace rendering behaves on your system.</p>
        
        <div className="grid grid-cols-3 gap-3.5 mt-2">
          {/* Light */}
          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 border rounded-xl flex items-center gap-2.5 font-semibold text-xs justify-center transition-colors cursor-pointer ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                : 'border-slate-500/10 bg-slate-500/5 dark:bg-white/[0.01]'
            }`}
          >
            <Sun size={14} />
            <span>Light</span>
          </button>
          
          {/* Dark */}
          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 border rounded-xl flex items-center gap-2.5 font-semibold text-xs justify-center transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                : 'border-slate-500/10 bg-slate-500/5 dark:bg-white/[0.01]'
            }`}
          >
            <Moon size={14} />
            <span>Dark</span>
          </button>
          
          {/* System */}
          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 border rounded-xl flex items-center gap-2.5 font-semibold text-xs justify-center transition-colors cursor-pointer ${
              theme === 'system'
                ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                : 'border-slate-500/10 bg-slate-500/5 dark:bg-white/[0.01]'
            }`}
          >
            <Monitor size={14} />
            <span>System</span>
          </button>
        </div>
      </Card>

      {/* Push Notification settings card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <Bell size={16} className="text-indigo-500" />
          <span>Push Notifications</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Enable native browser push notifications to receive real-time alerts about task updates,
          deadlines, and assignments — even when TaskFlow is not open.
        </p>

        {/* Permission blocked warning */}
        {pushPermission === 'denied' && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
            <BellOff size={14} className="mt-0.5 shrink-0" />
            <span>
              Notification permission is <strong>blocked</strong> in your browser. To enable push
              alerts, please allow notifications for this site in your browser settings.
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold">
              {pushSubscribed ? 'Browser push enabled' : 'Browser push disabled'}
            </span>
            <span className="text-[11px] text-slate-500">
              {pushSubscribed
                ? 'You will receive system notifications for tasks and reminders.'
                : 'Enable to get alerts outside the app.'}
            </span>
          </div>

          {/* Toggle switch */}
          <button
            id="push-notification-toggle"
            onClick={handleTogglePush}
            disabled={pushLoading || pushPermission === 'denied'}
            aria-pressed={pushSubscribed}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
              pushSubscribed ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'
            } ${pushPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                pushSubscribed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {pushLoading && (
          <p className="text-[11px] text-slate-400 animate-pulse">
            {pushSubscribed ? 'Disabling push notifications...' : 'Requesting permission and subscribing...'}
          </p>
        )}
      </Card>

      {/* Category Management Card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <FolderKanban size={16} className="text-brand-500" />
          <span>Task Categories</span>
        </h3>
        <p className="text-xs text-slate-500">Create, edit, and delete workspace categories to organize tasks.</p>

        {/* Categories List */}
        <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No categories found. Create one below.</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 dark:bg-white/[0.01] border border-slate-500/10 dark:border-white/5 gap-3"
              >
                {editingCatId === cat.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="px-2.5 py-1 border border-slate-500/10 rounded-lg bg-slate-500/5 outline-none text-xs flex-1 text-slate-900 dark:text-white"
                      placeholder="Category name"
                    />
                    <input
                      type="color"
                      value={editCatColor}
                      onChange={(e) => setEditCatColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 shrink-0"
                      title="Choose category color"
                    />
                    <input
                      type="text"
                      value={editCatDesc}
                      onChange={(e) => setEditCatDesc(e.target.value)}
                      className="px-2.5 py-1 border border-slate-500/10 rounded-lg bg-slate-500/5 outline-none text-xs flex-1 text-slate-900 dark:text-white"
                      placeholder="Description (optional)"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {cat.name}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-[10px] text-slate-500 truncate pl-5">
                        {cat.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  {editingCatId === cat.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEditCategory(cat.id)}
                        disabled={updateCategoryMutation.isPending}
                        className="p-1 rounded-lg hover:bg-success-accent/15 text-success-accent cursor-pointer"
                        title="Save Changes"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1 rounded-lg hover:bg-slate-500/15 text-slate-400 cursor-pointer"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEditCategory(cat)}
                        className="p-1 rounded-lg hover:bg-slate-500/15 text-slate-400 cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete category "${cat.name}"? Tasks in this category will be uncategorized.`)) {
                            deleteCategoryMutation.mutate(cat.id);
                          }
                        }}
                        disabled={deleteCategoryMutation.isPending}
                        className="p-1 rounded-lg hover:bg-danger-accent/15 text-danger-accent cursor-pointer disabled:opacity-50"
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleCreateCategory} className="flex flex-col gap-3.5 pt-3 border-t border-slate-500/10 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add New Category</span>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Category name (e.g. Frontend)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="py-1.5 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Color:</span>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0 shrink-0"
              />
            </div>
          </div>
          <Input
            placeholder="Category description (optional)"
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            className="py-1.5 text-xs"
          />
          <Button
            type="submit"
            variant="primary"
            className="self-start gap-1.5 py-1.5 px-3.5 text-xs h-auto"
            disabled={createCategoryMutation.isPending || !newCatName.trim()}
          >
            <Plus size={13} />
            <span>{createCategoryMutation.isPending ? 'Adding...' : 'Add Category'}</span>
          </Button>
        </form>
      </Card>

      {/* Tag Management Card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <TagIcon size={16} className="text-brand-500" />
          <span>Task Tags</span>
        </h3>
        <p className="text-xs text-slate-500">Create and delete tags to label and highlight tasks.</p>

        {/* Tags List */}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
          {tags.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No tags found. Create one below.</p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
                style={{
                  color: tag.color,
                  borderColor: `${tag.color}40`,
                  backgroundColor: `${tag.color}10`,
                }}
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => {
                    if (confirm(`Delete tag "${tag.name}"?`)) {
                      deleteTagMutation.mutate(tag.id);
                    }
                  }}
                  disabled={deleteTagMutation.isPending}
                  className="hover:text-danger-accent cursor-pointer opacity-75 hover:opacity-100 disabled:opacity-50 shrink-0"
                  title="Delete Tag"
                >
                  <X size={10} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Tag Form */}
        <form onSubmit={handleCreateTag} className="flex flex-col gap-3.5 pt-3 border-t border-slate-500/10 dark:border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add New Tag</span>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Tag name (e.g. Bug, Research)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="py-1.5 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Color:</span>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0 shrink-0"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="self-start gap-1.5 py-1.5 px-3.5 text-xs h-auto"
            disabled={createTagMutation.isPending || !newTagName.trim()}
          >
            <Plus size={13} />
            <span>{createTagMutation.isPending ? 'Adding...' : 'Add Tag'}</span>
          </Button>
        </form>
      </Card>

      {/* Security & Token scopes info card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <Shield size={16} className="text-emerald-500" />
          <span>Workspace Security</span>
        </h3>
        <div className="flex flex-col gap-2 text-xs leading-relaxed text-slate-500">
          <p>
            Your session is secured using standard **Refresh Token Rotation (RTR)** parameters. Tokens rotate automatically on every background request to prevent session hijacking.
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-accent animate-ping" />
            <span className="text-[10px] font-bold text-success-accent">RTR compromise detection engine is active.</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
